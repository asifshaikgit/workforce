const tenantRepository = require('../repositories/tenantRepository');
const { randomDatabasePasswordGenerator } = require('../../../../helpers/globalHelper');
const Queue = require('bull');
const { migrate } = require('../../../migrations');
const { registerClient } = require('../../../middlewares/subdomainCreation');
const { seed } = require('../../../seeders');
const { dbApi } = require('../../../db_functions');
const { dbConnection } = require('../../../../config/database');
const { connectAllDb, getTenantConnection, getAdminConnectionToTenantDb } = require('../../../middlewares/connectionManager');
const slugify = require('slugify');
const { generateOTP } = require('../../../../helpers/globalHelper');
const { sendMail } = require('../../../../utils/emailSend');
const { responseMessages } = require('../../../../constants/responseMessage');
const DatabaseCreationError = require('../../../../error/DatabaseCreationError');
const { responseCodes } = require('../../../../constants/responseCodes');
const moment = require('moment');

/**
 * Funtion used to find the all data with the condition.
 *
 * @param {object} condition
 * @return Json
 */
const find = async (condition) => {
  const tenantsList = await tenantRepository.find(condition);
  return tenantsList;
};

/**
 * Funtion to create a store object for tenant account creation, once creation done send an email notification with account activation OTP details.
 *
 * @param {object} body
 * @return Json
 */
const store = async (body) => {

  const tenantName = await slugify(body.organization_name.toLowerCase(), '_');
  const password = await randomDatabasePasswordGenerator();

  let newOTP = await generateOTP();
  const newTenant = {
    first_name: body.first_name,
    middle_name: body.middle_name,
    last_name: body.last_name,
    display_name: body.first_name + ' ' + body.middle_name + ' ' + body.last_name,
    email_id: body.email_id.toLowerCase(),
    contact_number: body.contact_number,
    organization_name: body.organization_name,
    subdomain_name: tenantName,
    database_user: tenantName,
    database_password: password,
    database_name: tenantName,
    otp: newOTP,
    is_verified: false,
    is_active: false,
    date_format: body.date_format,
    currency_symbol: body.currency_symbol,
    ext: body.ext ? body.ext : null,
    mobile_number: body.mobile_number,
    personal_email_id: body.personal_email_id,
    organization_fax_number: body.organization_fax_number,
    organization_phone_number: body.organization_phone_number,
    website_url: body.website_url,
    payable_to: body.payable_to,
    additional_information: body.additional_information,
  };
  const tenantsList = await tenantRepository.create(newTenant);
  if (tenantsList) {
    let emailData = {
      toEmail: body.email_id,
      subject: 'Account Activation OTP',
      html: `<h3> Hi ${tenantsList[0].display_name}, </h3> <br>Please find the below OTP for account activation. <br> <h3> OTP : ${newOTP} </h3>.`,
    };
    /* Fire an event to sent email */
    sendMail(emailData);
    /* Fire an event to sent email */
  }
};

/**
 * Funtion to create a new tenant database and create its previlizes.
 *  Create migration to create tables and mandatory data in the tables.
 *
 * @param {object} adminDbConnection .
 * @param {object} body 
 * @return Json
 * @return DatabaseCreationError
 */
const createNewTenantDatabase = async (params, tenantData) => {
  const job = new Queue(
    `setting-up-database-${new Date().getTime()}`,
    {
      limiter: {
        max: 100, // Maximum number of jobs processed per duration
        duration: 5000, // Duration of the time window for the maximum limit
      },
      maxRetriesPerRequest: 50, // Adjust this value based on your needs
      // Other queue options...
    },
    `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  );
  job.add({
    ...params,
  });
  job.process(async (job, done) => {
    try {

      await dbConnection.raw(
        `CREATE USER ${params.user} WITH PASSWORD '${params.password}';`,
      );
      await dbConnection.raw(`CREATE DATABASE ${params.database};`);
      await dbConnection.raw(
        `GRANT ALL PRIVILEGES ON DATABASE ${params.database} TO ${params.user};`,
      );
      await dbConnection.raw(
        `ALTER DATABASE ${params.database} OWNER TO ${params.user}; `,
      );
      await connectAllDb();

      /**
       * To create the extension need to establisth the connection by using admin credentials and destroy it.
       */
      let adminConnectionToTenantDB = await getAdminConnectionToTenantDb(`${params.database}`)
      await adminConnectionToTenantDB.raw(
        'CREATE EXTENSION IF NOT EXISTS postgis;',
      );
      await adminConnectionToTenantDB.destroy();

      const tenantDBConnection = await getTenantConnection(params.tenant_id);
      await migrate(tenantDBConnection);
      await seed(tenantDBConnection, tenantData);
      await dbApi(tenantDBConnection);
      let condition = { id: params.tenant_id };
      let updatedData = { database_created_on: moment(new Date()).format('YYYY-MM-DD') };
      tenantRepository.update(condition, updatedData);
      done();
    } catch (e) {
      console.log(e);
      await dbConnection.raw(
        `DROP DATABASE ${params.database};`,
      );
      await dbConnection.raw(
        `DROP USER ${params.user};`,
      );
      throw new DatabaseCreationError('Database creation error occured. Please contact admin.' + e, responseCodes.codeInternalError);
    }
  });
};

/**
 * Funtion to verify the OTP and create a new sub domain and create a new databse for the tenant.
 * Activate the tenant details.
 *
 * @param {object} adminDbConnection .
 * @param {object} body 
 * @return Json
 */
const verifyTenantOTP = async (body) => {
  let condition = { email_id: body.email_id };
  let tenantData = await tenantRepository.find(condition);
  let awsActionData = {
    actionType: 'CREATE',
    subDomain: tenantData.data[0].subdomain_name,
  };
  //await registerClient(awsActionData); 
  let updateData = {
    is_verified: true,
    is_active: true,
  };
  tenantData.data[0].is_tenant_owner = true;
  /* Activate the tenant Account */
  await tenantRepository.update(condition, updateData);
  /* Activate the tenant Account */

  let dbCreateObject = {
    database: tenantData.data[0].database_name,
    password: tenantData.data[0].database_password,
    user: tenantData.data[0].database_user,
    tenant_id: tenantData.data[0].id,
  };

  /* Create new database and table for the tenant */
  await createNewTenantDatabase(dbCreateObject, tenantData.data[0]);
  /* Create new database and table for the tenant */

  return { status: true, data: 1 };
};

const resendOTP = async (body) => {
  let condition = { email_id: body.email_id };
  let tenantData = await tenantRepository.find(condition);
  if (tenantData.status) {
    let emailData = {
      toEmail: body.email_id,
      subject: 'Account Activation OTP',
      html: `<h3> Hi ${tenantData.data[0].display_name}, </h3> <br>Please find the below OTP for account activation. <br> <h3> OTP : ${tenantData.data[0].otp} </h3>.`,
    };
    /* Fire an event to sent email */
    await sendMail(emailData);
    /* Fire an event to sent email */
  }

};

/**
 * Funtion used to find the all data with the condition.
 *
 * @param {object} condition
 * @return Json
 */
const findAll = async () => {
  const tenantsList = await tenantRepository.findAll();
  return tenantsList;
};

module.exports = { find, store, verifyTenantOTP, resendOTP, findAll };
