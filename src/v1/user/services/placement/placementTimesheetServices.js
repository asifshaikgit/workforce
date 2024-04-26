const timesheetConfigurationService = require('../../services/configurations/timesheet/timesheetConfigurationsService')
const approvalConfigurationService = require('../../services/configurations/approvalConfigurationService')
const indexRepository = require('../../repositories/index');
const moment = require('moment')
const format = require('../../../../../helpers/format');
const { event } = require('../../../../../events/timesheetGenerationEvent');
const { events } = require('../../../../../events/placementActivityEvent');
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');

/**
 * Index function to retrieve timesheet configurations for a client based on a provided condition.
 *
 * Logic:
 * - Define the fields to fetch from the database, including placement and timesheet configuration details.
 * - Define the tables to join to retrieve additional information.
 * - Call the 'indexRepository.find' function to fetch timesheet configurations based on the provided condition, fields, and joins.
 * - If timesheet data exists:
 *   + For each placement, call the 'approvalConfigurationService.index' function to retrieve approval data.
 *   + Format the data as needed.
 *   + Prepare the response with success data, including placement ID, timesheet configuration, approval data, and other related information.
 *   
 * - Else:
 *   + Return the response with an error message.
 *
 * @param {Object} condition - The condition to filter timesheet configurations.
 * @returns {Object} Repository response containing either success data or an error message.
 */
const index = async (condition) => {
    /** 
     * Calling a  index function.
     * Based on the status in the function response, prepare the response and return to controller
    */
    // Fields to fetch
    let Fields = ['placements.id as placement_id', 'placements.timesheet_settings_config_type', 'placements.timesheet_approval_config_type', 'ts_config.id', 'placements.timesheet_start_date', 'ts_config.is_global', 'ts_config.cycle_id', 'cy.name as cycle_name', 'ts_config.ts_mandatory', 'ts_config.day_start_id', 'dy.name as day_name', 'ts_config.default_hours', 'placements.timesheet_configuration_id', 'placements.timesheet_approval_id'];

    // Tables to join
    let joins = [
        { table: 'timesheet_configurations as ts_config', alias: 'ts_config', condition: ['placements.timesheet_configuration_id', 'ts_config.id'] },
        { table: 'cycles as cy', alias: 'cy', condition: ['cy.id', 'ts_config.cycle_id'] },
        { table: 'days as dy', alias: 'dy', condition: ['dy.id', 'ts_config.day_start_id'], type: 'left' }
    ];

    var timesheetConfiguration = await indexRepository.find('placements', Fields, condition, null, joins);
    if (timesheetConfiguration.status) {
        let dateFormat = await format.getDateFormat(); // date format

        /* Variables */
        var responseData = [];
        var total_details = timesheetConfiguration.data;
        /* Variables */

        for (const key in total_details) {
            var approvalData = await approvalConfigurationService.index({ 'approval_settings.id': total_details[key].timesheet_approval_id });

            const listingData = {
                placement_id: total_details[key].placement_id,
                timesheet_configuration_id: total_details[key].timesheet_configuration_id,
                timesheet_approval_id: total_details[key].timesheet_approval_id,
                timesheet_approval_config_type: total_details[key].timesheet_approval_config_type,
                timesheet_settings_config_type: total_details[key].timesheet_settings_config_type,
                timesheet_start_date: moment(total_details[key].timesheet_start_date).format(dateFormat),
                timesheet_effictive_start_date: '',
                ts_mandatory: total_details[key].ts_mandatory,
                cycle_id: total_details[key].cycle_id,
                cycle_name: total_details[key].cycle_name,
                day_start_id: total_details[key].day_start_id ? total_details[key].day_start_id : '',
                day_name: total_details[key].day_name ? total_details[key].day_name : '',
                default_hours: total_details[key].default_hours ? total_details[key].default_hours.slice(0, -3) : '',
                approvals: approvalData.status ? approvalData.data[0].approvals : [{ "approver_ids": [], "rank": "" }]
            };
            responseData.push(listingData)
        }
        return { status: true, data: responseData };

    } else {
        return timesheetConfiguration;
    }
}

/**
 * Update function to modify placement configuration for timesheet and approval settings.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Define the condition for updating the existing placement configuration based on the placement ID.
 * - Retrieve the current placement configuration and related timesheet settings from the database.
 * - Determine the new timesheet configuration ID based on 'timesheet_settings_config_type':
 *   + If 'timesheet_settings_config_type' is 3 and the incoming type is also 3, update the existing timesheet settings with the provided data.
 *   + If 'timesheet_settings_config_type' is 3 and the incoming type is 1 or 2, mark the existing timesheet settings as deleted and update with client or global settings.
 *   + If the existing type is 1 or 2 and the incoming type is 3, create a new timesheet configuration entry.
 *   + If the existing type is null and the incoming type is 1 or 2, update with client or global settings.
 *   + In other cases, use the 'default_timesheet_configuration_id' provided in the request.
 * - Determine the new timesheet approval configuration ID based on 'timesheet_approval_config_type':
 *   + If 'timesheet_approval_config_type' is 3 and the incoming type is also 3, update the existing approval settings with the provided data.
 *   + If 'timesheet_approval_config_type' is 3 and the incoming type is not 3, delete the existing approval settings and update with client or global settings.
 *   + If the existing type is 1 or 2 and the incoming type is 3, create a new approval configuration entry.
 *   + If the existing type is null and the incoming type is 1 or 2, update with client or global settings.
 *   + In other cases, use the 'default_timesheet_approval_id' provided in the request.
 * - Create an 'updateData' object that contains information for updating the placement configuration entry.
 * - Call the 'transactionRepository.update' function to update the 'placements' record with the new placement timesheet and approval settings based on the defined condition.
 * - If specified, trigger a regeneration of timesheets based on changes to the timesheet settings.
 * - Commit the transaction if all operations are successful.
 * - Retrieve the updated placement configuration for activity tracking.
 * - Emit an event to record the placement timesheet update activity.
 * - Return the repository response with information about the updated placement configuration.
 * - Handle errors and rollback the transaction in case of an exception, and return an error response if any issues occur during the process.
 *
 * @param {Object} body - The request body containing modified placement timesheet and approval settings.
 * @returns {Object} Repository response.
 */
const update = async (body) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()

        /* Writing condition to the update entry */
        var condition = { id: body.placement_id }
        /* Writing condition to the update entry */

        var placementResponse = await indexRepository.find('placements', ['timesheet_settings_config_type', 'timesheet_configuration_id', 'timesheet_approval_config_type', 'timesheet_approval_id'], condition);
        var placementData = placementResponse.data[0];

        const oldTimesheetSettingData = await indexRepository.find('timesheet_configurations', ['*'], { id: placementData.timesheet_configuration_id });
        const oldTimesheetSettingInfo = oldTimesheetSettingData.data[0];

        // calling to get the before data for the activity track
        fields = ['tc.id as id', 'd.name as Timesheet start day', 'c.name as Timesheet cycle', 'tc.default_hours as Default hours', 'tc.ts_mandatory as Timesheet document mandatory', 'placements.timesheet_settings_config_type as Timesheet setting configuration', 'placements.timesheet_approval_config_type', 'placements.timesheet_approval_id', 'placements.timesheet_start_date as Timesheet start date'];

        joins = [
            {
                table: 'timesheet_configurations as tc',
                alias: 'tc',
                condition: ['placements.timesheet_configuration_id', 'tc.id'],
                type: 'left'
            },
            {
                table: 'cycles as c',
                alias: 'c',
                condition: ['tc.cycle_id', 'c.id'],
                type: 'inner'
            },
            {
                table: 'days as d',
                alias: 'd',
                condition: ['tc.day_start_id', 'd.id'],
                type: 'left'
            }
        ];
        let beforeData = await indexRepository.find('placements', fields, { 'placements.id': body.placement_id }, null, joins);

        beforeData = beforeData.data[0];
        let beforeApprovalLevels;
        let approvalLevelsQuery;

        if (beforeData?.timesheet_approval_id != null && beforeData?.timesheet_approval_id != undefined) {
            if (body.timesheet_approval_config_type == 3 && body.timesheet_approval_config_type == beforeData.timesheet_approval_config_type) {
                // get before approvals levels
                approvalLevelsQuery = "select approval_settings.id, jsonb_agg(DISTINCT jsonb_build_object('approval_level_id',approval_users.approval_level_id, 'user_id', approval_users.approver_id)) AS approval_levels from approval_settings left join approval_levels on approval_settings.id = approval_levels.approval_setting_id left join approval_users on approval_levels.id = approval_users.approval_level_id where approval_settings.id = '" + beforeData.timesheet_approval_id + "' AND approval_levels.deleted_at IS NULL group by approval_settings.id"
                let approvalLevels = await indexRepository.rawQuery(approvalLevelsQuery);
                beforeApprovalLevels = approvalLevels[0]?.approval_levels;
            }
        }

        let new_timesheet_configuration_id;
        let new_timesheet_approval_id;

        // existing time sheet configuration type is 3 and coming also 3 then update the information
        if (placementData.timesheet_settings_config_type == 3 && Number(body.timesheet_settings_config_type) == 3) {
            /* Creating new object */
            var updateTsSettingObject = {
                cycle_id: body.cycle_id,
                default_hours: body.default_hours,
                day_start_id: body.day_start_id ? body.day_start_id : null,
                is_global: false,
                ts_mandatory: body.ts_mandatory,
                updated_by: body.updated_by
            };
            /* Creating new object */
            const timesheetConfiguration = await transactionRepository.update(trx, 'timesheet_configurations', { id: placementData.timesheet_configuration_id }, updateTsSettingObject)
            new_timesheet_configuration_id = timesheetConfiguration.data[0].id;
        }

        // Existing 3 and coming as 1 or 2 in timesheet_settings_config_type, delete setting config id and update with client or global id based on request
        else if (placementData.timesheet_settings_config_type == 3 && Number(body.timesheet_settings_config_type) != 3) {
            var ts_config_conditions = { id: placementData.timesheet_configuration_id };
            var deleteObj = {
                updated_by: body.updated_by,
                deleted_at: new Date()
            }

            //deleting the existing configurable setting data
            await transactionRepository.update(trx, 'timesheet_configurations', ts_config_conditions, deleteObj);
            new_timesheet_configuration_id = body.default_timesheet_configuration_id;
        }

        // Existing 1 or 2 and coming as 3 in timesheet_settings_config_type, create a new entry
        else if (placementData.timesheet_settings_config_type != 3 && Number(body.timesheet_settings_config_type) == 3) {
            /* Creating new object */
            var newTimesheetSettingObject = {
                cycle_id: body.cycle_id,
                default_hours: body.default_hours,
                day_start_id: body.day_start_id ? body.day_start_id : null,
                is_global: false,
                ts_mandatory: body.ts_mandatory,
                created_by: body.created_by,
                created_at: new Date(),
            };
            /* Creating new object */
            var timesheetConfigurationResponse = await transactionRepository.store(trx, 'timesheet_configurations', newTimesheetSettingObject);
            new_timesheet_configuration_id = timesheetConfigurationResponse.data[0].id
        }

        // Existing is null and coming as 1 or 2 in timesheet_settings_config_type, update with client or global id based on request
        else if (placementData.timesheet_settings_config_type == null && Number(body.timesheet_settings_config_type) != 3) {
            new_timesheet_configuration_id = body.default_timesheet_configuration_id;
        }

        else {
            new_timesheet_configuration_id = body.default_timesheet_configuration_id;
        }

        // existing time sheet approval configuration type is 3 and coming also 3 then update the information
        if (placementData.timesheet_approval_config_type == 3 && Number(body.timesheet_approval_config_type) == 3) {

            /* Creating new object */
            var updateapprovalSetting = {
                approval_module: 1,   // 1 for timesheet
                approval_count: body.approval_count,  // number of levels count
                approvals: body.approvals,   //approvals that data
                updated_by: body.updated_by,
                delete_user_ids: body.delete_user_ids,
                delete_approval_level_ids: body.delete_approval_level_ids
            };
            /* Creating new object */
            await approvalConfigurationService.update(updateapprovalSetting, null, { id: placementData.timesheet_approval_id });
            new_timesheet_approval_id = placementData.timesheet_approval_id
        }

        // existing time sheet approval configuration type is 3 and coming  1, 2 then update with client or global id based on request
        else if (placementData.timesheet_approval_config_type == 3 && Number(body.timesheet_approval_config_type) != 3) {

            var ts_config_conditions = {
                id: placementData.timesheet_approval_id,
                updated_by: body.updated_by
            };

            //deleting the existing configurable approval setting data
            await approvalConfigurationService.deleteSettingsAndMappedLevelUsers(ts_config_conditions, trx);
            new_timesheet_approval_id = body.default_timesheet_approval_id;
        }

        // existing time sheet approval configuration type is 1 and 2 and coming 3 then create an entry
        else if ((placementData.timesheet_approval_config_type != 3) && Number(body.timesheet_approval_config_type) == 3) {

            /* Creating new object */
            var approvalObject = {
                approval_count: body.approval_count,
                is_global: false,
                approval_module: 1,
                approvals: body.approvals,
                created_by: body.created_by,
            }
            var timesheet_approval_id = await approvalConfigurationService.store(approvalObject, trx);
            new_timesheet_approval_id = timesheet_approval_id.id
        }

        // existing time sheet approval configuration type is null and coming  1, 2 then update with client or global id based on request
        else if (placementData.timesheet_approval_config_type == null && Number(body.timesheet_approval_config_type) != 3) {
            new_timesheet_approval_id = body.default_timesheet_approval_id;
        }

        // Existing and coming 1, 2 then update with client or global id based on request
        else {
            new_timesheet_approval_id = body.default_timesheet_approval_id;
        }

        /* Creating update entry object */
        var updateData = {
            timesheet_configuration_id: new_timesheet_configuration_id,
            timesheet_approval_id: new_timesheet_approval_id,
            timesheet_settings_config_type: body.timesheet_settings_config_type,
            timesheet_approval_config_type: body.timesheet_approval_config_type,
            updated_by: body.updated_by,
            timesheet_start_date: body.timesheet_start_date,
            updated_at: new Date(Date.now())
        };
        /* Creating update entry object */

        var repositoryResponse = await transactionRepository.update(trx, 'placements', condition, updateData);

        /**
         * If the send effective start date rewrite the all timesheets based on the given conditions
         */
        if (oldTimesheetSettingInfo !== undefined) {
            const newTimesheetSettingData = await indexRepository.find('timesheet_configurations', ['*'], { id: new_timesheet_configuration_id });

            if (newTimesheetSettingData.status) {
                const newTimesheetSettingInfo = newTimesheetSettingData.data[0];
                if (newTimesheetSettingInfo.cycle_id != oldTimesheetSettingInfo.cycle_id || newTimesheetSettingInfo.day_start_id != oldTimesheetSettingInfo.day_start_id || body.start_date_modified != undefined) {

                    /**
                     * Marking the regenerate timesheets as true so that cron should not generate the timesheets till this event complete.
                     */
                    await transactionRepository.update(trx, 'placements', condition, { regenerate_timesheet: true });
                    let evenObject = { body: body, oldTimesheetSetting: oldTimesheetSettingInfo, newTimesheetSetting: newTimesheetSettingInfo }
                    event.emit("TimesheetConfigurationChange", evenObject)
                }
            }
        }

        // Commit the transaction
        await trx.commit();

        // Placement Time sheet Configuration Update Activity Track
        activity = {
            placement_id: body.placement_id,
            referrable_type: 4,
            action_type: 2, // 2 for update 
            created_by: body.created_by,
            beforeApprovalLevels: beforeApprovalLevels,
            beforeUpdate: beforeData,
            fields: fields,
            joins: joins,
            approvalLevelsQuery: approvalLevelsQuery
        };

        events.emit('placementActivity', { activity: activity });
        /** Placement Time sheet Update Activity Track */

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
 * Store function to create placement configuration for timesheet and approval settings.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Define the condition for creating the new placement configuration based on the placement ID.
 * - Determine the new timesheet configuration ID based on 'timesheet_settings_config_type':
 *   + If 'timesheet_settings_config_type' is 3, create a new timesheet configuration entry with the provided data.
 *   + In other cases, use the 'default_timesheet_configuration_id' provided in the request.
 * - Determine the new timesheet approval configuration ID based on 'timesheet_approval_config_type':
 *   + If 'timesheet_approval_config_type' is 3, create a new approval configuration entry with the provided data.
 *   + In other cases, use the 'default_timesheet_approval_id' provided in the request.
 * - Create an 'updateData' object that contains information for creating the placement configuration entry.
 * - Call the 'transactionRepository.update' function to create the 'placements' record with the new placement timesheet and approval settings based on the defined condition.
 * - If specified, trigger a timesheet generation event based on the created placement configuration.
 * - Commit the transaction if all operations are successful.
 * - Emit an event to record the placement timesheet creation activity.
 * - Return the repository response with information about the created placement configuration.
 * - Handle errors and rollback the transaction in case of an exception, and return an error response if any issues occur during the process.
 *
 * @param {Object} body - The request body containing placement timesheet and approval settings.
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

        let new_timesheet_configuration_id;
        let new_timesheet_approval_id;

        //time sheet configuration
        if (body.timesheet_settings_config_type == 3) {
            /* Creating new object */
            var newTimesheetSettingObject = {
                cycle_id: body.cycle_id,
                default_hours: body.default_hours,
                day_start_id: body.day_start_id ? body.day_start_id : null,
                is_global: false,
                ts_mandatory: body.ts_mandatory,
                created_by: body.created_by,
                created_at: new Date(),
            };
            /* Creating new object */
            var timesheetConfigurationResponse = await transactionRepository.store(trx, 'timesheet_configurations', newTimesheetSettingObject);
            new_timesheet_configuration_id = timesheetConfigurationResponse.data[0].id
        } else {
            new_timesheet_configuration_id = body.default_timesheet_configuration_id;
            body.default_cycle_id = body.cycle_id
        }

        //time sheet approval configuration
        if (body.timesheet_approval_config_type == 3) {

            /* Creating new object */
            var approvalObject = {
                approval_count: body.approval_count,
                is_global: false,
                approval_module: 1,
                approvals: body.approvals,
                created_by: body.created_by,
            }
            var timesheet_approval_id = await approvalConfigurationService.store(approvalObject, trx);
            new_timesheet_approval_id = timesheet_approval_id.id
        } else {
            new_timesheet_approval_id = body.default_timesheet_approval_id;
        }

        /* Creating update entry object */
        var updateData = {
            timesheet_configuration_id: new_timesheet_configuration_id,
            timesheet_settings_config_type: body.timesheet_settings_config_type,
            timesheet_approval_config_type: body.timesheet_approval_config_type,
            timesheet_approval_id: new_timesheet_approval_id,
            timesheet_start_date: body.timesheet_start_date,
            created_by: body.created_by,
            created_at: new Date(Date.now())
        };
        /* Creating update entry object */

        var repositoryResponse = await transactionRepository.update(trx, 'placements', condition, updateData);

        // Commit the transaction
        await trx.commit();

        if (body.default_cycle_id != '5') {
            var placement = repositoryResponse.data[0]
            event.emit("TimesheetGeneration",body, placement)
        }

        /** Placement Timesheet Store Activity Track */
        activity = {
            placement_id: body.placement_id,
            referrable_type: 4,
            action_type: 1, //1 for create 
            created_by: body.created_by,
        };
        events.emit('placementActivity', { activity });
        /** Placement Timesheet Store Activity Track */

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
 * Approved Users function to retrieve the data of the users approved for a specific timesheet or an invoice.
 * 
 * @param {*} tableName - Tablename to fetch data related to timesheets and invoices approval data.
 * @param {*} id 
 */
const approvedUsers = async (tableName, id) => {
    const joins = [
        { table: 'employee', condition: ['timesheet_approval_track.approval_user_id', 'employee.id'], type: 'left' },
    ];
    const approvedUsers = await indexRepository.find('timesheet_approval_track', ['employee.display_name'], { 'timesheet_id': id }, null, joins, null, null, null, false);

    return approvedUsers;
}

module.exports = { index, update, store, approvedUsers }
