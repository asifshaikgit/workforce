const { randomPasswordGenerator, generateEmployeeAvatar } = require('../../helpers/globalHelper');
const { sendMail } = require('../../utils/emailSend');
const bcrypt = require('bcrypt');
const documentCategoryDataSeed = require('./documentCategory');
const modules = require('./module');
const permissions = require('./permissions');
const cycleDataSeed = require('./cycle');
const daysDataSeed = require('./days');
const prefixesDataSeed = require('./prefix');
const employmentTypesSeed = require('./employmentType');
const countryDataSeed = require('./countries');
const stateDataSeed = require('./states');
const mailTemplateSeed = require('./mailTemplate');
const templateParametersSeed = require('./templateParameters');
const departmentDataSeed = require('./department');
const teamsDataSeed = require('./team');
const employeeCategoriesSeed = require('./employeeCategories');
const rolesDataSeed = require('./roles');
const rolePermissionsDataSeed = require('./rolePermissions');
const updateSuperadminInformation = require('./updateSuperadminInformation');
const groupsDataSeed = require('../seeders/groups');
const notiifcationSettingsDataSeed = require('../seeders/notificationSettings');
const invoiceEmailsDataSeed = require('../seeders/invoiceEmailTemplate');
const netPayTermDataSeed = require('../seeders/netPayTerm');
const educationLevelsDataSeed = require('../seeders/educationLevels');
const expenseManagementDataSeed = require('../seeders/expenseManagement');
const paymentModesDataSeed = require('../seeders/paymentModes');
const skillDataSeed = require('../seeders/skills');
const writeOffDataSeed = require('../seeders/writeOff');
const jobTitlesDataSeed = require('../seeders/jobTitles');
const workAuthorizationData = require('../seeders/workAuthorization');
const personalDocumentsData = require('../seeders/personalDocuments');
const selfOnboardingDocuments = require('../seeders/selfOnboardingDocuments');
const reminderTemplatesData = require('../seeders/reminderTemplates');
const clientsDocumentDataSeed = require('../seeders/clientsDocument');
const invoiceTheme = require('../seeders/invoiceTheme');
const relationshipTypesDataDataSeed = require('../seeders/relationshipTypes');
const reminderConfigurationDataSeed = require('../seeders/reminders');
const reminderTemplatesSeed = require('../seeders/reminderTemplates');
const actionNotificationConfig = require('../seeders/actionNotificationConfig');
const { domainName } = require('../../config/app');
const onBoardingDocumentTypes = require('./onBoardingDocumentTypes');
//const workAuthorizationDocuments = require('./workAuthorizationDocuments');
// const handleLedgerHours = require('./handleLedgerHours'); // kept in comment for future  referrance

const seed = async (tenantDBConnection, admin) => {
  const randomPassword = await randomPasswordGenerator();
  let defaultGender = {
    gender: 'Male'
  };
  const profile_link = await generateEmployeeAvatar(defaultGender);
  let salt = await bcrypt.genSalt(10);
  let hashedPassword = await bcrypt.hash(randomPassword, salt);
  const superAdmin = {
    first_name: admin.first_name,
    last_name: admin.last_name,
    display_name: admin.first_name + ' ' + admin.middle_name + ' ' + admin.last_name,
    email_id: admin.email_id.toLowerCase(),
    contact_number: admin.contact_number,
    password: hashedPassword,
    is_active: true,
    employment_type_id: 1,
    temp_password: true,
    is_super_admin: true,
    is_tenant_owner: true,
    enable_login: true,
    gender: 'Male',
    profile_picture_url: profile_link,
    created_at: new Date(),
    reference_id: 'EMP-1',
  };
  let superAdminInfo = await tenantDBConnection('employee').insert(superAdmin).returning('*');

  let emailData = {
    toEmail: superAdmin.email_id,
    subject: 'Account Password ',
    html: `<html> <head> <style> body { font-family: Arial, sans-serif; font-size: 16px; } .container { margin: 20px; } .header { color: #007bff; font-size: 24px; font-weight: bold; margin-bottom: 10px; } .message { margin-top: 10px; } b { font-weight: bold; } </style> </head> <body> <div class="container"> <h1 class="header">Account Password</h1> <div class="message"> <p>Hi ${superAdmin.display_name},</p> <p>Welcome to the workforce application. Please find the below login details to access the application:</p> </div> <div class="message"> <p><b>URL:</b> <a href="https://${admin.subdomain_name}.${domainName}">Click here to access the application<br><br>https://${admin.subdomain_name}.${domainName}</a></p> <p><b>User Email:</b> ${superAdmin.email_id}</p> <p><b>Password:</b> ${randomPassword}</p> </div> </div> </body> </html>`,
  };

  await documentCategoryDataSeed(tenantDBConnection);
  await modules(tenantDBConnection);
  await permissions(tenantDBConnection);
  await cycleDataSeed(tenantDBConnection);
  await daysDataSeed(tenantDBConnection);
  await prefixesDataSeed(tenantDBConnection);
  await departmentDataSeed(tenantDBConnection);
  await employmentTypesSeed(tenantDBConnection);
  await countryDataSeed(tenantDBConnection);
  await stateDataSeed(tenantDBConnection);
  await mailTemplateSeed(tenantDBConnection);
  await templateParametersSeed(tenantDBConnection);
  await teamsDataSeed(tenantDBConnection);
  await employeeCategoriesSeed(tenantDBConnection);
  await rolesDataSeed(tenantDBConnection);
  await rolePermissionsDataSeed(tenantDBConnection);
  await groupsDataSeed(tenantDBConnection);
  await notiifcationSettingsDataSeed(tenantDBConnection);
  await invoiceEmailsDataSeed(tenantDBConnection);
  await netPayTermDataSeed(tenantDBConnection);
  await educationLevelsDataSeed(tenantDBConnection);
  await expenseManagementDataSeed(tenantDBConnection);
  await paymentModesDataSeed(tenantDBConnection);
  await skillDataSeed(tenantDBConnection);
  await writeOffDataSeed(tenantDBConnection);
  await jobTitlesDataSeed(tenantDBConnection);
  await workAuthorizationData(tenantDBConnection);
  await personalDocumentsData(tenantDBConnection);
  await relationshipTypesDataDataSeed(tenantDBConnection);
  await selfOnboardingDocuments(tenantDBConnection);
  await reminderConfigurationDataSeed(tenantDBConnection);
  await reminderTemplatesSeed(tenantDBConnection)
  await clientsDocumentDataSeed(tenantDBConnection);
  await invoiceTheme(tenantDBConnection);
  await updateSuperadminInformation(tenantDBConnection, superAdminInfo, admin);
  await sendMail(emailData);
  await actionNotificationConfig(tenantDBConnection);
  await onBoardingDocumentTypes(tenantDBConnection);
  await reminderTemplatesData(tenantDBConnection);
  //await workAuthorizationDocuments(tenantDBConnection); // In the new Flow All the Work Authorization Documents Are Bulk Upload and doesn't have document types
};

module.exports = { seed };
