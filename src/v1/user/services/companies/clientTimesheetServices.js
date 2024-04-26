const timesheetConfigurationService = require('../configurations/timesheet/timesheetConfigurationsService')
const approvalConfigurationService = require('../configurations/approvalConfigurationService')
const indexRepository = require("../../repositories/index")
const { event } = require('../../../../../events/companyActivityEvent');
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');

/**
 * Store function to create company configuration for timesheet and approval settings.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Define the condition for updating the existing entry.
 * - Update the approval settings based on the provided body object:
 *   + Create an 'approvalObject' that includes 'approval_count', sets 'is_global' to false, specifies 'approval_module' as 1 (the default for timesheet), includes the 'approvals' array, and records the 'created_by' user.
 *   + Call the 'approvalConfigurationService.store' function with the 'approvalObject' to store approval settings in the database using the active transaction ('trx').
 *   + Retrieve the 'approval_id' representing the stored approval settings.
 * - Create a new timesheet setting object using properties from the request 'body':
 *   + The 'newTimesheetSettingObject' includes 'cycle_id', 'default_hours', 'day_start_id' (if provided, otherwise null), sets 'is_global' to false, specifies 'ts_mandatory', and records the 'created_by' user.
 *   + Call the 'timesheetConfigurationService.store' function with the 'newTimesheetSettingObject' to store the timesheet configuration in the database using the active transaction ('trx').
 *   + Retrieve the 'timesheet_setting_id' representing the stored timesheet configuration.
 * - Create an 'updateData' object that contains information for updating the company configuration entry:
 *   + 'timesheet_configuration_id' is set to the ID of the stored timesheet configuration.
 *   + 'timesheet_approval_id' is set to the 'approval_id'.
 *   + 'updated_by' records the user making the update.
 *   + 'updated_at' records the timestamp of the update.
 * - Call the 'transactionRepository.update' function to update the 'companies' record with the new timesheet and approval settings based on the defined condition.
 * - Commit the transaction if all operations are successful.
 * - Perform activity tracking by emitting an event for storing the company timesheet configuration.
 * - Return the repository response with information about the stored company configuration.
 * - Handle errors and rollback the transaction in case of an exception, and return an error response if any issues occur during the process.
 *
 * @param {Object} body - The request body containing timesheet and approval settings.
 * @returns {Object} Repository response.
 */
const store = async (body) => {
    let trx;
    try{
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        /* Writing condition to the update entry */
        var condition = { id: body.id }
        /* Writing condition to the update entry */
        
        var approvalObject = {
            approval_count: body.approval_count,
            is_global: false,
            approval_module: 1,  // Default 1 for timesheet
            approvals: body.approvals,
            created_by: body.created_by
        }
        var approval_id = await approvalConfigurationService.store(approvalObject, trx);

        /* Creating new object */
        var newTimesheetSettingObject = {
            cycle_id: body.cycle_id,
            default_hours: body.default_hours,
            day_start_id: body.day_start_id ? body.day_start_id : null,
            is_global: false,
            ts_mandatory: body.ts_mandatory,
            created_by: body.created_by
        };
        /* Creating new object */

        var timesheet_setting_id = await timesheetConfigurationService.store(newTimesheetSettingObject, trx);

        /* Creating update entry object */
        var updateData = {
            timesheet_configuration_id: timesheet_setting_id.data[0].id,
            timesheet_approval_id: approval_id.id,
            updated_by: body.updated_by,
            updated_at: new Date(Date.now())
        };
        /* Creating update entry object */

        var repositoryResponse = await transactionRepository.update(trx, 'companies', condition, updateData);

        // Commit the transaction
        await trx.commit();

          /**Company Timesheet Configuration Activity track*/
        activity = {
            company_id: repositoryResponse.data[0].id,
            referrable_type: 4, //4 for company timesheet details
            action_type: 1, //1 for create 
            created_by: body.created_by,
          };
          event.emit('companyActivity', { activity });
          /**Company Timesheet Configuration Activity track*/

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
 * Update function to modify company configuration for timesheet and approval settings.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Define the condition for updating the existing entry based on the provided 'condition'.
 * - Fetch the client timesheet configuration data before the update.
 * - Create an 'updateTsSettingObject' for updating timesheet settings with properties extracted from the request 'body':
 *   + Includes 'cycle_id', 'default_hours', 'day_start_id' (if not empty), sets 'is_global' to false, specifies 'ts_mandatory', and records the 'updated_by' user.
 * - Call 'timesheetConfigurationService.update' to update the timesheet settings with the 'updateTsSettingObject'.
 * - Create an 'updateapprovalSetting' object for updating approval settings:
 *   + Sets 'approval_module' to 1, 'approval_count', 'approvals', 'updated_by', and lists of 'delete_user_ids' and 'delete_approval_level_ids'.
 * - Call 'approvalConfigurationService.update' to update approval settings with the 'updateapprovalSetting'.
 * - Create an 'updateData' object for updating the company configuration entry:
 *   + 'timesheet_configuration_id' is set to the timesheet configuration ID from the request.
 *   + 'timesheet_approval_id' is set to the approval ID from the request.
 *   + 'updated_by' records the user making the update.
 *   + 'updated_at' records the timestamp of the update.
 * - Call 'transactionRepository.update' to update the 'companies' record with the new timesheet and approval settings based on the defined condition.
 * - Commit the transaction if all operations are successful.
 * - Fetch the client timesheet configuration data after the update.
 * - Perform activity tracking by emitting an event for updating the company configuration.
 * - Return the repository response with information about the updated company configuration.
 * - Handle errors and rollback the transaction in case of an exception, and return an error response if any issues occur during the process.
 *
 * @param {Object} body - The request body containing timesheet and approval settings for update.
 * @param {Object} condition - The condition for updating the company configuration.
 * @returns {Object} Repository response.
 */
const update = async (body, condition) => {
    let trx;
    try{
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection


        /**Fetching client timesheet configuration data before data */
        const beforeUpdateData = await getClientTimesheetConfiguration({'companies.id': condition.id})
        /**Fetching client timesheet configuration data before data */
        

        /* Creating updating object */
        var updateTsSettingObject = {
            cycle_id: body.cycle_id,
            default_hours: body.default_hours,
            day_start_id: body.day_start_id != '' ? body.day_start_id : null,
            is_global: false,
            ts_mandatory: body.ts_mandatory,
            updated_by: body.updated_by
        };
        /* Creating updating object */

        await timesheetConfigurationService.update(updateTsSettingObject, trx, {id: body.timesheet_configuration_id});

        /* Creating updating object */
        var updateapprovalSetting = {
            
            approval_module: 1,
            approval_count: body.approval_count,
            approvals: body.approvals,
            updated_by: body.updated_by,
            delete_user_ids: body.delete_user_ids,
            delete_approval_level_ids: body.delete_approval_level_ids,
            created_by: body.created_by,
        };
        /* Creating updating object */

        await approvalConfigurationService.update(updateapprovalSetting, trx, {id: body.timesheet_approval_id});

        /* Creating update entry object */
        var updateData = {
            timesheet_configuration_id: body.timesheet_configuration_id,
            timesheet_approval_id: body.timesheet_approval_id,
            updated_by: body.updated_by,
            updated_at: new Date(Date.now())
        };
        /* Creating update entry object */
        
        var repositoryResponse = await transactionRepository.update(trx, 'companies', condition, updateData);

        // Commit the transaction
        await trx.commit();
                
        /**Fetching client timesheet configuration data after data */
        const afterUpdateData = await getClientTimesheetConfiguration({'companies.id': condition.id})
        /**Fetching client timesheet configuration data after data */

          /**Company Timesheet Configuration Activity track*/
          activity = {
            company_id: condition.id,
            referrable_type: 4, //4 for company timesheet details
            action_type: 2, //2 for update 
            created_by: body.created_by,
            beforeUpdate: beforeUpdateData,
            afterUpdate: afterUpdateData
          };
          event.emit('companyActivity', { activity });
          /**Company Timesheet Configuration Activity track*/

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
 * Get Client Timesheet Configuration function to fetch and structure timesheet configuration details for a client.
 *
 * Logic:
 * - Define the fields to fetch from the database, including alias names for clarity.
 * - Define the tables to join to retrieve additional information.
 * - Use 'indexRepository.find' to fetch timesheet configuration data for a client based on the provided condition.
 * - Create a empty object ''listingObject'
 * - If data exists:
 *   + Extract relevant details from the retrieved data, including 'cycle_name', 'default_hours', 'ts_mandatory', and 'day_name'.
 *   + Structure the response with clear labels for each detail and assign to a 'listingObject' object .
 * - Return the 'listingObject' with structured timesheet configuration details.
 *
 * @param {Object} condition - The condition to filter timesheet configuration data for a client.
 * @returns {Object} Timesheet configuration details for a client.
 */
const getClientTimesheetConfiguration = async (condition) => {

    // Fields to fetch
    let Fields = ['cy.name as cycle_name','ts_config.default_hours', 'ts_config.ts_mandatory', 'dy.name as day_name'];

    // Tables to join
    let joins = [
        { table: 'timesheet_configurations as ts_config', alias: 'ts_config', condition: ['companies.timesheet_configuration_id', 'ts_config.id'] },
        { table: 'cycles as cy', alias: 'cy', condition: ['cy.id', 'ts_config.cycle_id'] },
        { table: 'days as dy', alias: 'dy', condition: ['dy.id', 'ts_config.day_start_id'], type : 'left' }
    ];

    var timesheetConfiguration = await indexRepository.find('companies', Fields, condition, 0, joins);  // Fetching client communication address

    var listingObject = {}
    if (timesheetConfiguration.status) {
        /* Variables */
        var total_details = timesheetConfiguration.data[0];
        /* Variables */
        
        listingObject = {
            'Timesheet Cycle' : total_details.cycle_name,
            'Default Hours': total_details.default_hours ? total_details.default_hours.slice(0, -3) : '00:00',
            'Timesheet submission': total_details.ts_mandatory ? 'Mandatory' : 'Non-Mandatory',
            'Day Starts From': total_details.day_name ? total_details.day_name : '-'
        };      
    }
    return listingObject
}

/**
 * Index function to fetch company timesheet and approval configuration details.
 *
 * Logic:
 * - Define the fields to fetch from the database, including alias names for clarity.
 * - Define the tables to join to retrieve additional information.
 * - Use 'indexRepository.find' to fetch company timesheet and approval configuration data based on the provided condition.
 * - If Data Exists:
 *   + Initialize variables for 'responseData' and 'total_details' to store the fetched data.
 *   + Iterate through the retrieved data using a 'for...in' loop.
 *   + For each company's timesheet configuration, fetch associated approval settings using 'approvalConfigurationService.index'.
 *   + Create a 'listingObject' to structure the response with relevant details:
 *   + Push each 'listingObject' into the 'responseData' array.
 *   + Return a response with status 'true' and the structured 'responseData' array.
 * - Else:
 *   + return the repository response 'timesheetConfiguration'.
 *
 * @param {Object} condition - The condition to filter company timesheet and approval configuration data.
 * @returns {Object} Repository response with timesheet and approval configuration details.
 */
const index = async (condition) => {

    // Fields to fetch
    let Fields = ['companies.id as company_id', 'ts_config.id', 'ts_config.is_global', 'ts_config.cycle_id', 'cy.name as cycle_name', 'ts_config.ts_mandatory', 'ts_config.day_start_id', 'dy.name as day_name', 'ts_config.default_hours', 'companies.timesheet_configuration_id', 'companies.timesheet_approval_id'];

    // Tables to join
    let joins = [
        { table: 'timesheet_configurations as ts_config', alias: 'ts_config', condition: ['companies.timesheet_configuration_id', 'ts_config.id'] },
        { table: 'cycles as cy', alias: 'cy', condition: ['cy.id', 'ts_config.cycle_id'] },
        { table: 'days as dy', alias: 'dy', condition: ['dy.id', 'ts_config.day_start_id'], type : 'left' }
    ];

    var timesheetConfiguration = await indexRepository.find('companies', Fields, condition, 0, joins);  // Fetching client communication address

    if (timesheetConfiguration.status) {

        /* Variables */
        var responseData = [];
        var total_details = timesheetConfiguration.data;
        /* Variables */

        /* Using Map to iterate the loop and prepare the response */
        for(const key in total_details) {
            var approvalData = await approvalConfigurationService.index({ 'approval_settings.id': total_details[key].timesheet_approval_id });

            const approvals = approvalData.status
                ? approvalData.data[0].approvals.map(approval => ({
                    id: approval.id,
                    rank: approval.rank,
                    approver_ids: approval.approver_ids.map(approver => ({
                        id: approver.id,
                        employee_id: approver.employee_id,
                        full_name: approver.full_name // Renaming full_name to value
                    }))
                }))
                : [{ "approver_ids": [], "rank": "" }];

            const listingObject = {
                id: total_details[key].company_id,
                timesheet_configuration_id: total_details[key].timesheet_configuration_id,
                timesheet_approval_id: total_details[key].timesheet_approval_id,
                ts_mandatory: total_details[key].ts_mandatory,
                cycle_id: total_details[key].cycle_id ? total_details[key].cycle_id : '',
                cycle_name:  total_details[key].cycle_name ? total_details[key].cycle_name : '',
                day_start_id: total_details[key].day_start_id ? total_details[key].day_start_id : '',
                day_name: total_details[key].day_name ? total_details[key].day_name : '',
                default_hours: total_details[key].default_hours ? total_details[key].default_hours.slice(0, -3) : '00:00',
                approvals
            };
            responseData.push(listingObject);
        }
        return {status: true, data: responseData}
        
    } else {
        return timesheetConfiguration;
    }
}

module.exports = {store, index, update }