const invoiceConfigurationService = require('../configurations/invoice/invoiceConfigurationsService')
const approvalConfigurationService = require('../configurations/approvalConfigurationService')
const indexRepository = require("../../repositories/index")
const { event } = require('../../../../../events/companyActivityEvent');
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');

/**
 * Index function to fetch company invoice configuration details.
 *
 * Logic:
 * - Define the fields to fetch from the database, including alias names for clarity.
 * - Define the tables to join to retrieve additional information.
 * - Use 'indexRepository.find' to fetch company invoice configuration data based on the provided condition.
 * - If Data Exists:
 *   + Initialize variables for 'responseData' and 'total_details' to store the fetched data.
 *   + Iterate through the retrieved data using a 'for...in' loop.
 *   + For each company's invoice configuration, fetch associated approval settings using 'approvalConfigurationService.index'.
 *   + Fetch email template data from 'invoice_email_templates' if the 'invoice_email_template_type' is 2 (custom email template).
 *   + Create a 'listingObject' to structure the response with relevant details
 *   + Push each 'listingObject' into the 'responseData' array.
 *   + Return a response with status 'true' and the structured 'responseData' array.
 * - Else:
 *   + return the repository response 'invoiceConfiguration'.
 *
 * @param {Object} condition - The condition to filter company invoice configuration data.
 * @returns {Object} Repository response with invoice configuration details.
 */
const index = async (condition) => {

  // Fields to fetch
  let Fields = ['companies.id as company_id', 'invoice_approval_id', 'invoice_configuration_id', 'invoice_email_template_id', 'invoice_email_template_type', 'ic.net_pay_terms_id as net_pay_terms_id', 'ic.is_global', 'cy.name as cycle_name', 'ic.cycle_id', 'ic.day_start_id', 'dy.name as day_name', 'net_pay.days as net_pay_days'];

  // Tables to join
  let joins = [
    { table: 'invoice_configurations as ic', alias: 'ic', condition: ['ic.id', 'companies.invoice_configuration_id'] },
    { table: 'cycles as cy', alias: 'cy', condition: ['cy.id', 'ic.cycle_id'] },
    { table: 'days as dy', alias: 'dy', condition: ['dy.id', 'ic.day_start_id'], type: 'left' },
    { table: 'net_pay_terms as net_pay', alias: 'net_pay', condition: ['net_pay.id', 'ic.net_pay_terms_id'], type: 'inner' }
  ];

  var invoiceConfiguration = await indexRepository.find('companies', Fields, condition, null, joins);  // Fetching client communication address

  if (invoiceConfiguration.status) {

    /* Variables */
    var responseData = [];
    var total_details = invoiceConfiguration.data;
    /* Variables */

    for (const key in total_details) {
      var approvalData = await approvalConfigurationService.index({ 'approval_settings.id': total_details[key].invoice_approval_id }); //Fetching the approval information for Invoices

      var emailTemplateData = await indexRepository.find('invoice_email_templates', ['id', 'cc', 'bcc', 'subject', 'template', 'is_global'], { id: total_details[key].invoice_email_template_id }, 0);  // Fetching Invoice Email Templates Format

      const listingObject = {
        id: total_details[key].company_id,
        invoice_configuration_id: total_details[key].invoice_configuration_id,
        invoice_approval_id: total_details[key].invoice_approval_id,
        cycle_id: total_details[key].cycle_id,
        net_pay_terms_id: total_details[key].net_pay_terms_id,
        day_start_id: total_details[key].day_start_id ? total_details[key].day_start_id : '',
        approvals: approvalData.status ? approvalData.data[0].approvals : [{ "approver_ids": [], "rank": "" }],
        invoice_email_template_id: total_details[key].invoice_email_template_id,
        invoice_email_template_type: total_details[key].invoice_email_template_type,
        cc: emailTemplateData.status ? emailTemplateData.data[0].cc : [],
        bcc: emailTemplateData.status ? emailTemplateData.data[0].bcc : [],
        subject: emailTemplateData.status ? emailTemplateData.data[0].subject : '',
        template: emailTemplateData.status ? emailTemplateData.data[0].template : '',
        is_global: emailTemplateData.status ? emailTemplateData.data[0].is_global : ''
      };
      responseData.push(listingObject)
    }

    return { status: true, data: responseData };
  } else {
    return invoiceConfiguration;
  }
}


/**
 * Update function to modify company configuration for invoice, approval, and email settings based on the provided data and condition.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Fetch existing company data related to invoice, approval, and email settings using the provided 'condition'.
 * - Determine the 'invoice_email_template_id' based on the email template type in the provided 'body'.
 * - Handle different cases based on the existing and new email template types:
 *   + If the existing type is 1 (default) and the new type is 2 (custom), create a new custom email template and store at 'invoice_email_templates' table.
 *   + If the existing type is 1 (default) and the new type is not 2, use the existing template ID.
 *   + If the existing type is 2 (custom), update the custom email template if the new type is 1, or update the email template properties if the new type is 2.
 * - Update approval settings using 'approvalConfigurationService.update'.
 * - Update invoice settings using 'invoiceConfigurationService.update'.
 * - Create an 'updateData' object for updating the company configuration.
 * - Call the 'transactionRepository.update' function to update the 'companies' record with the new or modified settings.
 * - Commit the transaction if all operations are successful.
 * - Fetch client invoice configuration data before and after the update.
 * - Perform activity tracking by emitting an event for storing the company update.
 * - Return the repository response with information about the updated company configuration.
 * - Handle errors and rollback the transaction in case of an exception, and return an error response if any issues occur during the process.
 *
 * @param {Object} body - The request body containing updated invoice, approval, and email settings.
 * @param {Object} condition - The condition to identify the company to update.
 * @returns {Object} Repository response.
 */
const update = async (body, condition) => {
  let trx;
  try {
    //databse connection
    const db = await getConnection();
    trx = await db.transaction()
    //databse connection

    var companyResponse = await indexRepository.find('companies', ['invoice_email_template_id', 'invoice_email_template_type', 'invoice_configuration_id', 'invoice_approval_id'], condition);  // Fetch the client existing information

    var companyData = companyResponse.data[0];
    let invoice_email_template_id;

    /**Fetching client invoice configuration data before data */
    const beforeUpdateData = await getcompanyInvioceConfiguration({ 'companies.id': condition.id })
    /**Fetching client invoice configuration data before data */
    
    /**
     * Updates the invoice email template based on the provided client data and body.
     */
    if (companyData.invoice_email_template_type == 1) {


      /**
       * Checks the value of `body.invoice_email_template_type` and performs different actions based on the condition.
       * If `body.invoice_email_template_type` is equal to 2, a new invoice email template is created and stored in the database.
       * If `body.invoice_email_template_type` is not equal to 2, the value of `invoice_email_template_id` is set to `companyData.invoice_email_template_id`.
       */
      if (body.invoice_email_template_type == 2) {
        var newInvoiceEmailTemplate = {
          cc: JSON.stringify(body.cc),
          bcc: JSON.stringify(body.bcc),
          subject: body.subject,
          template: body.template,
          is_global: false,
          created_by: body.created_by,
          created_at: new Date()
        }

        // var invoiceEmailTemplatestoreResponse = await transactionRepository.store(trx, 'invoice_email_templates', newInvoiceEmailTemplate); // Creating the new email template for this client

        // invoice_email_template_id = invoiceEmailTemplatestoreResponse.data[0].id
      } else {
        invoice_email_template_id = companyData.invoice_email_template_id;
      }
    } else if (companyData.invoice_email_template_type == 2) {
      // Update the default invoice template and delete the previous if exists
      if (body.invoice_email_template_type == 1) {
        var inv_email_condition = {
          id: companyData.invoice_email_template_id
        }
        let deleteObj = {
          updated_by: body.updated_by,
          updated_at: body.updated_at,
          deleted_at: new Date()
        }
        await transactionRepository.update(trx, 'invoice_email_templates', inv_email_condition, deleteObj);
        invoice_email_template_id = companyData.invoice_email_template_id;  // Assign  invoice_email_template_id global

      } else {

        // Update invoice_email_template information
        var updateInvEmailTemplate = {
          cc: body.cc,
          bcc: body.bcc,
          subject: body.subject,
          template: body.template,
          is_global: false,
          updated_by: body.updated_by,
          updated_at: new Date()
        }
        var inv_email_condition = {
          id: companyData.invoice_email_template_id
        }
        await transactionRepository.update(trx, 'invoice_email_templates', inv_email_condition, updateInvEmailTemplate);

        invoice_email_template_id = companyData.invoice_email_template_id;
      }
    }

    /**
     * Updates the invoice and approval settings based on the provided data.
     * If both invoice_configuration_id and invoice_approval_id are null, it creates new settings.
     * Otherwise, it updates the existing settings.
     */


    /**
     * Updates the approval setting with the provided data.
     */
    var updateapprovalSetting = {
      approval_module: body.approval_module,
      approval_count: body.approval_count,
      approvals: body.approvals,
      updated_by: body.updated_by,
      delete_user_ids: body.delete_user_ids,
      delete_approval_level_ids: body.delete_approval_level_ids
    };
    await approvalConfigurationService.update(updateapprovalSetting, null, { id: body.invoice_approval_id });

    /**
     * Updates the invoice setting object with the provided values and calls the
     * invoiceConfigurationService to update the invoice setting.
     */
    var updateInvoiceSettingObject = {
      cycle_id: body.cycle_id,
      net_pay_terms_id: body.net_pay_terms_id,
      day_start_id: body.day_start_id != '' ? body.day_start_id : null,
      is_global: false,
      updated_by: body.updated_by
    };
    await invoiceConfigurationService.update(updateInvoiceSettingObject, null, { id: body.invoice_configuration_id });

    /* Creating update entry object */
    var updateData = {
      invoice_email_template_id: body.default_invoice_email_template_id != undefined ? body.default_invoice_email_template_id : invoice_email_template_id,
      invoice_email_template_type: body.invoice_email_template_type,
      updated_by: body.updated_by,
      updated_at: new Date(Date.now())
    };
    /* Creating update entry object */


    var repositoryResponse = await transactionRepository.update(trx, 'companies', condition, updateData);


    // Commit the transaction
    await trx.commit();
    // Commit the transaction

    /* Company Invoice Details Activity track */
    /**Fetching company details after update */
    const afterUpdateData = await getcompanyInvioceConfiguration({ 'companies.id': condition.id });
    /**Fetching company details after update */

    activity = {
      company_id: condition.id,
      referrable_type: 3, //1 for company invoice details
      action_type: 2, //2 for update 
      created_by: body.created_by,
      beforeUpdate: beforeUpdateData,
      afterUpdate: afterUpdateData
    };
    event.emit('companyActivity', { activity });
    /**Company Activity track*/

    return repositoryResponse;
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

/**
 * Retrieve company invoice configuration information based on the provided condition.
 *
 * Logic:
 * - Initialize an empty 'listingObject' to store the retrieved company invoice configuration details.
 * - Define the fields to fetch from the database and specify table joins to retrieve related information.
 * - Use the 'indexRepository.find' function to fetch company invoice configuration data by joining related tables.
 * - If data retrieval is successful:
 *   + Extract relevant details from the retrieved data and format them into a 'listingObject'.
 *   + 'Payment Terms' is obtained from 'net_pay_days'.
 *   + 'Invoice Cycle' is obtained from 'cycle_name'.
 *   + 'Day Start From' is obtained from 'day_name' or set to '-' if not available.
 *   + 'Client Invoice Template' is determined based on the 'invoice_email_template_type' value, showing 'Default' for 1, 'Configuration' for 2, or '-' for other values.
 * - Return the 'listingObject' containing company invoice configuration details.
 *
 * @param {Object} condition - The condition to identify the company for which to retrieve invoice configuration information.
 * @returns {Object} An object containing company invoice configuration details.
 */
const getcompanyInvioceConfiguration = async (condition) => {

  /**Variables */
  var listingObject = {}
  /**Variables */

  // Fields to fetch
  let Fields = ['companies.id', 'companies.invoice_approval_id', 'companies.invoice_configuration_id', 'companies.invoice_email_template_id', 'companies.invoice_email_template_type', 'ic.net_pay_terms_id as net_pay_terms_id', 'ic.is_global', 'cy.name as cycle_name', 'ic.cycle_id', 'ic.day_start_id', 'dy.name as day_name', 'net_pay.days as net_pay_days'];

  // Tables to join
  let joins = [
    {
      table: 'invoice_configurations as ic',
      alias: 'ic',
      condition: ['ic.id', 'companies.invoice_configuration_id']
    },
    {
      table: 'net_pay_terms as net_pay',
      alias: 'net_pay',
      condition: ['net_pay.id', 'ic.net_pay_terms_id'],
      type: 'inner'
    },
    {
      table: 'cycles as cy',
      alias: 'cy',
      condition: ['cy.id', 'ic.cycle_id']
    },
    {
      table: 'days as dy',
      alias: 'dy',
      condition: ['dy.id', 'ic.day_start_id'], 
      type: 'left'
    }
  ];

  var companyInvInformation = await indexRepository.find('companies', Fields, condition, 0, joins);  // Fetching client communication address
  
  if (companyInvInformation.status) {

    /* Variables */
    var total_details = companyInvInformation.data[0];
    /* Variables */

    /* Using Map to iterate the loop and prepare the response */
    listingObject = {
      'Payment Terms': total_details.net_pay_days,
      'Invoice Cycle': total_details.cycle_name,
      'Day Start From': total_details.day_name ? total_details.day_name : '-',
      'Client Invoice Template': total_details.invoice_email_template_type == 1 ? 'Default' : total_details.invoice_email_template_type == 2 ? 'Configuration' : '-',
    };
  }

  return listingObject;
}

/**
 * Store function to create company configuration for timesheet and approval settings or update the existing settings.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Define the condition for updating the existing entry based on the provided 'body.id'.
 * - Update the approval settings based on the provided 'body' object:
 *   + Create an 'approvalObject' that includes 'approval_count', sets 'is_global' to false, specifies 'approval_module' as 1 (the default for timesheet), includes the 'approvals' array, and records the 'created_by' user.
 *   + Call the 'approvalConfigurationService.store' function with the 'approvalObject' to store or update approval settings in the database using the active transaction ('trx').
 *   + Retrieve the 'approval_id' representing the stored or updated approval settings.
 * - Create a new invoice setting object using properties from the request 'body':
 *   + The 'newInvoiceSettingObject' includes 'cycle_id', 'default_hours', 'day_start_id' (if provided, otherwise null), 'net_pay_terms_id', sets 'is_global' to false, and records the 'created_by' user.
 *   + Call the 'invoiceConfigurationService.store' function with the 'newInvoiceSettingObject' to store or update invoice settings in the database using the active transaction ('trx').
 *   + Retrieve the 'invoice_configuration_id' representing the stored or updated invoice settings.
 * - If 'body.invoice_email_template_type' is 2, indicating custom email template, create a new email template object with properties like 'cc', 'bcc', 'subject', 'template', 'is_global', 'created_by', and 'created_at'.
 *   + Store this email template in the 'invoice_email_templates' table using the transaction ('trx').
 *   + Retrieve the 'invoice_email_template_id' of the stored custom email template.
 * - If 'body.invoice_email_template_type' is not 2, use the 'default_invoice_email_template_id' from the request.
 * - Create an 'updateData' object that contains information for updating the company configuration entry:
 *   + 'invoice_configuration_id' is set to the ID of the stored or updated invoice settings.
 *   + 'invoice_approval_id' is set to the 'approval_id'.
 *   + 'invoice_email_template_id' is set based on the email template type.
 *   + 'invoice_email_template_type' records the email template type.
 *   + 'updated_by' records the user making the update.
 *   + 'updated_at' records the timestamp of the update.
 * - Call the 'transactionRepository.update' function to update the 'companies' record with the new or updated timesheet and approval settings based on the defined condition.
 * - Commit the transaction if all operations are successful.
 * - Perform activity tracking by emitting an event for storing the company configuration.
 * - Return the repository response with information about the stored or updated company configuration.
 * - Handle errors and rollback the transaction in case of an exception, and return an error response if any issues occur during the process.
 *
 * @param {Object} body - The request body containing timesheet, approval, and invoice settings.
 * @returns {Object} Repository response.
 */
const store = async (body) => {
  let trx;
  try {
    //databse connection
    const db = await getConnection();
    trx = await db.transaction()
    //databse connection

    /* Writing condition to the update entry */
    var condition = { id: body.id }
    /* Writing condition to the update entry */

    /**
     * Updates the timesheet configuration and approval settings based on the provided body object.
     * If the timesheet configuration and approval settings are null, new settings will be created.
     * Otherwise, the existing settings will be updated.
     */

    var approvalObject = {
      approval_count: body.approval_count,
      is_global: false,
      approval_module: 1,  // Default 1 for timesheet
      approvals: body.approvals,
      created_by: body.created_by
    }
    var approval_id = await approvalConfigurationService.store(approvalObject, trx);

    /* Creating new object */
    var newInvoiceSettingObject = {
      cycle_id: body.cycle_id,
      default_hours: body.default_hours,
      day_start_id: body.day_start_id ? body.day_start_id : null,
      net_pay_terms_id: body.net_pay_terms_id,
      is_global: false,
      created_by: body.created_by
    };
    /* Creating new object */

    // storing in invoice configuration table
    var invoice_configuration_id = await invoiceConfigurationService.store(newInvoiceSettingObject, trx);


    if (body.invoice_email_template_type == 2) {
      var newInvoiceEmailTemplate = {
        cc: body.cc,
        bcc: body.bcc,
        subject: body.subject,
        template: body.template,
        is_global: false,
        created_by: body.created_by,
        created_at: new Date()
      }
      // storing in invoice_emial_templates id needed
      var invoiceEmailTemplatestoreResponse = await transactionRepository.store(trx, 'invoice_email_templates', newInvoiceEmailTemplate); // Creating the new email template for this client

      var invoice_email_template_id = invoiceEmailTemplatestoreResponse.data[0].id
    } else {
      var invoice_email_template_id = body.default_invoice_email_template_id;
    }

    /* Creating update entry object */
    var updateData = {
      invoice_configuration_id: invoice_configuration_id.data[0].id,
      invoice_approval_id: approval_id.id,
      invoice_email_template_id: invoice_email_template_id,
      invoice_email_template_type: body.invoice_email_template_type,
      updated_by: body.updated_by,
      updated_at: new Date(Date.now())
    };
    /* Creating update entry object */

    // updating in companies
    var repositoryResponse = await transactionRepository.update(trx, 'companies', condition, updateData);

    // Commit the transaction
    await trx.commit();

    /* Company Invoice Details Activity track */
    activity = {
      company_id: body.id,
      referrable_type: 3, //1 for company invoice details
      action_type: 1, //1 for create
      created_by: body.created_by
    };
    event.emit('companyActivity', { activity });
    /**Company Invoice Details Activity track*/

    return repositoryResponse;
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};


module.exports = { index, update, store }