const invoiceConfigurationService = require('../configurations/invoice/invoiceConfigurationsService')
const approvalConfigurationService = require('../configurations/approvalConfigurationService')
const moment = require('moment')
const indexRepository = require('../../repositories/index');
const format = require('../../../../../helpers/format');
const { events } = require('../../../../../events/placementActivityEvent');
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');

/**
 * Index function to retrieve invoice configurations for a placement based on the provided condition.
 *
 * Logic:
 * - Use the 'indexRepository.find' function to fetch invoice configurations based on the provided condition.
 * - If invoice data exists:
 *   + For each placement, retrieve additional information, including invoice configuration, approval data, and related details.
 *   + Format the data as needed and prepare the response with success data, including placement ID, invoice configuration, approval data, and other relevant information.
 * - If no invoice data is found, return a response with a status of false.
 * - If there's an error in fetching the invoice data, return a response with a status of false.
 *
 * @param {Object} condition - The condition to filter invoice configurations.
 * @returns {Object} Repository response containing either success data or a status of false.
 */
const index = async (condition) => {

  var invoice_id = await indexRepository.find('placements', ['id', 'invoice_approval_id', 'invoice_configuration_id', 'invoice_settings_config_type', 'invoice_approval_config_type', 'invoice_start_date'], condition); // Fetch placement invoice configuration

  if (invoice_id.status) {

    let dateFormat = await format.getDateFormat(); // date format

    /* Variables */
    var listingObject = [];
    var responseData = [];
    var listingData = [];
    var total_details = invoice_id.data;
    /* Variables */

    /* Using Map to iterate the loop and prepare the response */
    if (total_details[0].invoice_configuration_id != null && total_details[0].invoice_approval_id != null) {
      listingData = await total_details.map(async (item) => {

        /**
         * Retrieves invoice data from the index repository based on the given invoice configuration ID.
         * @param {number} invoice_configuration_id - The ID of the invoice configuration.
         * @returns {Promise<any>} - A promise that resolves to the invoice data.
         */
        let invConfigJoins = [
          { table: 'net_pay_terms as net_pay', alias: 'net_pay', condition: ['net_pay.id', 'invoice_configurations.net_pay_terms_id'], type: 'inner' },
          { table: 'cycles as cy', alias: 'cy', condition: ['cy.id', 'invoice_configurations.cycle_id'], type: 'inner' },
          { table: 'days as dy', alias: 'dy', condition: ['dy.id', 'invoice_configurations.day_start_id'], type: 'left' }
        ]
        var invoiceData = await indexRepository.find('invoice_configurations', ['invoice_configurations.id', 'invoice_configurations.net_pay_terms_id', 'invoice_configurations.is_global', 'cy.name as cycle_name', 'invoice_configurations.cycle_id', 'invoice_configurations.day_start_id', 'dy.name as day_name', 'net_pay.days as net_pay_days'], { 'invoice_configurations.id': item.invoice_configuration_id }, 0, invConfigJoins);

        var approvalData = await approvalConfigurationService.index({ 'approval_settings.id': item.invoice_approval_id });

        listingObject = {
          placement_id: item.id,
          invoice_configuration_id: item.invoice_configuration_id,
          invoice_approval_id: item.invoice_approval_id,
          invoice_settings_config_type: item.invoice_settings_config_type,
          invoice_approval_config_type: item.invoice_approval_config_type,
          invoice_start_date: moment(item.invoice_start_date).format(dateFormat),
          cycle_id: invoiceData.data[0].cycle_id,
          cycle_name: invoiceData.data[0].cycle_name,
          net_pay_terms_id: invoiceData.data[0].net_pay_terms_id,
          net_pay_days: invoiceData.data[0].net_pay_days + ' Days',
          day_start_id: invoiceData.data[0].day_start_id ? invoiceData.data[0].day_start_id : '',
          day_name: invoiceData.data[0].day_name,
          approvals: approvalData.status ? approvalData.data[0].approvals : [{ "approver_ids": [], "rank": "" }]
        };
        return listingObject;
      });
    }
    /* Using Map to iterate the loop and prepare the response */

    /* Using promise to wait till the address map completes. */
    responseData = await Promise.all(listingData);
    /* Using promise to wait till the address map completes. */

    if (responseData.length > 0) {
      return { status: true, data: responseData };
    } else {
      return { status: false };
    }
  } else {
    return { status: false };
  }
}

/**
 * Update function to modify placement invoice configuration and approval settings.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Define the condition for updating the existing placement configuration based on the placement ID.
 * - Retrieve the current placement invoice configuration and related approval settings from the database.
 * - Fetch the before data for activity tracking.
 * - Determine the new invoice configuration ID based on 'invoice_settings_config_type'.
 *   + If 'invoice_settings_config_type' is 3 and the incoming type is also 3, update the existing invoice settings with the provided data.
 *   + If 'invoice_settings_config_type' is 3 and the incoming type is 1 or 2, delete the existing invoice settings and update with client or global settings.
 *   + If the existing type is not 3 and the incoming type is 3, create a new invoice configuration entry.
 *   + In other cases, use the 'default_invoice_configuration_id' provided in the request.
 * - Determine the new invoice approval configuration ID based on 'invoice_approval_config_type'.
 *   + If 'invoice_approval_config_type' is 3 and the incoming type is also 3, update the existing approval settings with the provided data.
 *   + If 'invoice_approval_config_type' is 3 and the incoming type is not 3, delete the existing approval settings and update with client or global settings.
 *   + If the existing type is not 3 and the incoming type is 3, create a new approval configuration entry.
 *   + In other cases, use the 'default_invoice_approval_id' provided in the request.
 * - Create an 'updateData' object that contains information for updating the placement invoice configuration entry.
 * - Commit the transaction if all operations are successful.
 * - Fetch the after data for activity tracking.
 * - Emit an event to record the placement invoice update activity.
 * - Return the repository response with information about the updated placement invoice configuration.
 * - Handle errors and rollback the transaction in case of an exception, and return an error response if any issues occur during the process.
 *
 * @param {Object} body - The request body containing modified placement invoice configuration and approval settings.
 * @returns {Object} Repository response.
 */
const update = async (body) => {
  let trx;
  try {
    //databse connection
    const db = await getConnection();
    trx = await db.transaction()
    //databse connection

    /* Writing condition to the update entry */
    var condition = { id: body.placement_id }
    /* Writing condition to the update entry */

    var placementResponse = await indexRepository.find('placements', ['id', 'invoice_approval_id', 'invoice_configuration_id', 'invoice_settings_config_type', 'invoice_approval_config_type', 'invoice_start_date'], condition); // Fetch placement invoice configuration

    var placementData = placementResponse.data[0];

    // calling to get the before data for the activity track
    fields = ['ic.id as id', 'd.name as Invoice start day', 'c.name as Invoice cycle', 'placements.invoice_settings_config_type as Invoice setting configuration', 'placements.invoice_approval_config_type', 'placements.invoice_approval_id', 'placements.invoice_start_date as Invoice start date', 'npt.days as Payment terms']

    let join = [
      {
        table: 'invoice_configurations as ic',
        alias: 'ic',
        condition: ['placements.invoice_configuration_id', 'ic.id'],
        type: 'left'
      },
      {
        table: 'net_pay_terms as npt', alias: 'npt', condition: ['ic.net_pay_terms_id', 'npt.id'],
        type: 'inner'
      },
      {
        table: 'cycles as c',
        alias: 'c',
        condition: ['ic.cycle_id', 'c.id'],
        type: 'inner'
      },
      {
        table: 'days as d',
        alias: 'd',
        condition: ['ic.day_start_id', 'd.id'],
        type: 'left'
      }
    ];
    let beforeData = await indexRepository.find('placements', fields, { 'placements.id': body.placement_id }, null, join);
    beforeData = beforeData.data[0];
    // calling to get the before data for the activity track

    let beforeApprovalLevels;
    let approvalLevelsQuery;

    if (beforeData?.invoice_approval_id != null && beforeData?.invoice_approval_id != undefined) {
      if (body.invoice_approval_config_type == 3 && body.invoice_approval_config_type == beforeData.invoice_approval_config_type) {
        // get before approvals levels
        approvalLevelsQuery = "select approval_settings.id, jsonb_agg(DISTINCT jsonb_build_object('approval_level_id',approval_users.approval_level_id, 'user_id', approval_users.approver_id)) AS approval_levels from approval_settings left join approval_levels on approval_settings.id = approval_levels.approval_setting_id left join approval_users on approval_levels.id = approval_users.approval_level_id where approval_settings.id = '" + beforeData.invoice_approval_id + "' AND approval_levels.deleted_at IS NULL group by approval_settings.id"
        let approvalLevels = await indexRepository.rawQuery(approvalLevelsQuery);
        beforeApprovalLevels = approvalLevels[0]?.approval_levels;
      }
    }

    let new_invoice_configuration_id;
    let new_invoice_approval_id;

    // existing invoice configuration type is 3 and coming also 3 then update the information
    if (placementData.invoice_settings_config_type == 3 && Number(body.invoice_settings_config_type) == 3) {

      var newInvoiceSettingObject = {
        cycle_id: body.cycle_id,
        net_pay_terms_id: body.net_pay_terms_id,
        day_start_id: body.day_start_id != '' ? body.day_start_id : null,
        is_global: false,
        created_by: body.created_by,
        updated_by: body.updated_by
      };

      await transactionRepository.update(trx, 'invoice_configurations', { id: placementData.invoice_configuration_id }, newInvoiceSettingObject)
      new_invoice_configuration_id = placementData.invoice_configuration_id;
    }

    // existing invoice configuration type is 3 and coming is 1 or 2 then update the invoice configuration of global or client based on the request or delete the 3 config setting
    else if (placementData.invoice_settings_config_type == 3 && Number(body.invoice_settings_config_type) != 3) {
      var inv_config_conditions = {
        id: placementData.invoice_configuration_id
      };
      var deleteObj = {
        updated_by: body.updated_by,
        deleted_at: new Date()
      }
      //deleting the existing configurable setting data

      await transactionRepository.update(trx, 'invoice_configurations', inv_config_conditions, deleteObj);
      new_invoice_configuration_id = body.default_invoice_configuration_id;
    }

    // existing invoice configuration type is 1 or 2 and coming 3 then create an entry and update it
    else if ((placementData.invoice_settings_config_type != 3) && Number(body.invoice_settings_config_type) == 3) {
      /* Creating new object */
      var newInvoiceSettingObject = {
        cycle_id: body.cycle_id,
        net_pay_terms_id: body.net_pay_terms_id,
        day_start_id: body.day_start_id != '' ? body.day_start_id : null,
        is_global: false,
        created_by: body.created_by
      };
      /* Creating new object */
      var invoice_setting_id = await transactionRepository.store(trx, 'invoice_configurations', newInvoiceSettingObject)
      new_invoice_configuration_id = invoice_setting_id.data[0].id
    }

    // existing invoice configuration type is 1 or 2 and coming also 1 0r 2
    else {
      new_invoice_configuration_id = body.default_invoice_configuration_id;
    }

    // existing Invoice approval configuration type is 3 and coming also 3 then update the information
    if (placementData.invoice_approval_config_type == 3 && Number(body.invoice_approval_config_type) == 3) {
      var updateapprovalSetting = {
        approval_module: 2,  // 2 for invoice
        approval_count: body.approval_count, // number of levels count
        approvals: body.approvals,   //approvals that data
        updated_by: body.updated_by,
        delete_user_ids: body.delete_user_ids,
        delete_approval_level_ids: body.delete_approval_level_ids
      };
      await approvalConfigurationService.update(updateapprovalSetting, null, { id: placementData.invoice_approval_id });
      new_invoice_approval_id = placementData.invoice_approval_id;
    }

    // existing invoice configuration type is 3 and coming  1, 2 then update with client or global id based on request
    else if (placementData.invoice_approval_config_type == 3 && Number(body.invoice_approval_config_type) != 3) {
      var inv_config_conditions = {
        id: placementData.invoice_approval_id,
        updated_by: body.updated_by
      };

      approvalConfigurationService.deleteSettingsAndMappedLevelUsers(inv_config_conditions, trx);
      new_invoice_approval_id = body.default_invoice_approval_id;
    }

    // existing invoice approval configuration type is 1 and 2 and coming 3 then create an entry
    else if ((placementData.invoice_approval_config_type != 3 || placementData.invoice_approval_config_type == null) && Number(body.invoice_approval_config_type) == 3) {

      var approvalObject = {
        approval_count: body.approval_count,
        is_global: false,
        approval_module: 2,  // For invoice
        approvals: body.approvals,
        created_by: body.created_by,
        updated_by: body.updated_by
      }
      var approval_id = await approvalConfigurationService.store(approvalObject, trx);
      new_invoice_approval_id = approval_id.id;
    }

    // Existing and coming 1, 2 then update with client or global id based on request
    else {
      new_invoice_approval_id = body.default_invoice_approval_id;
    }

    /* Creating update entry object */
    var updateData = {
      invoice_configuration_id: new_invoice_configuration_id,
      invoice_approval_id: new_invoice_approval_id,
      invoice_settings_config_type: body.invoice_settings_config_type,
      invoice_approval_config_type: body.invoice_approval_config_type,
      updated_by: body.updated_by,
      invoice_start_date: body.invoice_start_date,
      updated_at: new Date(Date.now())
    };
    /* Creating update entry object */

    var repositoryResponse = await transactionRepository.update(trx, 'placements', condition, updateData);

    // Commit the transaction
    await trx.commit();
    
    /** Placement Invoice Update Activity Track */
    activity = {
      placement_id: body.placement_id,
      referrable_type: 3,
      action_type: 2, // 2 for update 
      created_by: body.created_by,
      beforeApprovalLevels: beforeApprovalLevels,
      beforeUpdate: beforeData,
      fields: fields,
      joins: join,
      approvalLevelsQuery: approvalLevelsQuery
    };

    events.emit('placementActivity', { activity });
    /** Placement Invoice Update Activity Track */

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
 * Store function to create placement configuration for invoice and approval settings.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Define the condition for updating the existing entry based on the placement ID.
 * - Determine the new invoice configuration ID based on 'invoice_settings_config_type':
 *   + If 'invoice_settings_config_type' is 1, use global settings. Retrieve the global invoice configuration data.
 *   + If 'invoice_settings_config_type' is 2, use client-specific settings. Retrieve the client's invoice configuration ID.
 *   + If 'invoice_settings_config_type' is not 1 or 2, create a new invoice setting object including 'cycle_id', 'net_pay_terms_id', 'day_start_id' (if provided), 'is_global', and 'created_by' fields. Call the 'invoiceConfigurationService.store' function to store the invoice configuration in the database using the active transaction ('trx'). Retrieve the 'new_invoice_configuration_id' representing the stored invoice configuration.
 * - Determine the new invoice approval configuration ID based on 'invoice_approval_config_type':
 *   + If 'invoice_approval_config_type' is 1, use global settings. Retrieve the global invoice approval configuration data.
 *   + If 'invoice_approval_config_type' is 2, use client-specific settings. Retrieve the client's invoice approval configuration ID.
 *   + If 'invoice_approval_config_type' is not 1 or 2, create a new approval object including 'approval_count', 'is_global', 'approval_module', 'approvals', and 'created_by' fields. Call the 'approvalConfigurationService.store' function with the 'approvalObject' to store approval settings in the database using the active transaction ('trx'). Retrieve the 'new_invoice_approval_id' representing the stored invoice approval configuration.
 * - Create an 'updateData' object that contains information for updating the placement configuration entry.
 * - Call the 'transactionRepository.update' function to update the 'placements' record with the new placement invoice and approval settings based on the defined condition.
 * - Create an activity object for tracking the placement invoice store operation and emit an event for this activity.
 * - Commit the transaction if all operations are successful.
 * - Return the repository response with information about the updated placement configuration.
 * - Handle errors and rollback the transaction in case of an exception, and return an error response if any issues occur during the process.
 *
 * @param {Object} body - The request body containing placement invoice and approval settings.
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
    var condition = { id: body.placement_id }
    /* Writing condition to the update entry */

    let new_invoice_configuration_id;
    let new_invoice_approval_id;

    // for configuration types 
    if (body.invoice_settings_config_type == 1) { // for global setting
      var invoiceConfigData = await indexRepository.find('invoice_configurations', ['*'], { is_global: true, deleted_at: null })
      new_invoice_configuration_id = invoiceConfigData.data[0].id;
    } else if (body.invoice_settings_config_type == 2) { // for client setting
      var invoiceConfigData = await indexRepository.find('companies', ['invoice_configuration_id'], { id: body.client_id })
      new_invoice_configuration_id = invoiceConfigData.data[0].invoice_configuration_id;
    } else { // for custom setting
      /* Creating new object */
      var newInvoiceSettingObject = {
        cycle_id: body.cycle_id,
        net_pay_terms_id: body.net_pay_terms_id,
        day_start_id: body.day_start_id != '' ? body.day_start_id : null,
        is_global: false,
        created_by: body.created_by
      };
      var invoiceConfigData = await invoiceConfigurationService.store(newInvoiceSettingObject, trx);
      new_invoice_configuration_id = invoiceConfigData.data[0].id
    }

    // for approval types 
    if (body.invoice_approval_config_type == 1) { // for global setting
      var invoiceApprovalData = await indexRepository.find('approval_settings', ['*'], { is_global: true, deleted_at: null, approval_module: 2 })
      new_invoice_approval_id = invoiceApprovalData.data[0].id;
    } else if (body.invoice_approval_config_type == 2) { // for client setting
      var invoiceApprovalData = await indexRepository.find('companies', ['invoice_approval_id'], { id: body.client_id })
      new_invoice_approval_id = invoiceApprovalData.data[0].invoice_approval_id;
    } else { // for custom setting
      /* Creating new object */
      var approvalObject = {
        approval_count: body.approval_count,
        is_global: false,
        approval_module: 2,  // Default 2 for invoice
        approvals: body.approvals,
        created_by: body.created_by
      }
      var approval_id = await approvalConfigurationService.store(approvalObject, trx);
      new_invoice_approval_id = approval_id.id;
    }

    /* Creating update entry object */
    var updateData = {
      invoice_configuration_id: new_invoice_configuration_id,
      invoice_approval_id: new_invoice_approval_id,
      invoice_settings_config_type: body.invoice_settings_config_type,
      invoice_approval_config_type: body.invoice_approval_config_type,
      updated_by: body.updated_by,
      invoice_start_date: body.invoice_start_date,
      updated_at: new Date(Date.now())
    };
    /* Creating update entry object */

    var repositoryResponse = await transactionRepository.update(trx, 'placements', condition, updateData);


    // Commit the transaction
    await trx.commit();
    // Commit the transaction

    /** Placement Invoice Store Activity Track */
    activity = {
      placement_id: body.placement_id,
      referrable_type: 3,
      action_type: 1, //1 for create 
      created_by: body.created_by,
    };
    events.emit('placementActivity', { activity });
    /** Placement Invoice Store Activity Track */

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