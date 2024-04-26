const indexRepository = require('../../repositories/index');
const transactionRepository = require('../../repositories/transactionRepository');
const { event } = require('../../../../../events/timesheetActivityEvent');
const { eventss } = require('../../../../../events/notificationEvent');
const { getConnection } = require('../../../../middlewares/connectionManager');
const moment = require('moment');
const commonDocumentStore = require('../../../../../helpers/commonDocumentStore');
const timesheetsRepository = require('../../repositories/timesheet/timesheetsRepository');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const format = require('../../../../../helpers/format');
const color = require('../../../../../config/color');
const { generateEmployeeAvatar, destroyDocument, generateUniqueReferenceId } = require('../../../../../helpers/globalHelper');
const { getEmailTemplate } = require('../../../../../helpers/emailTemplate');
const config = require('../../../../../config/app')
const { sendMail } = require('../../../../../utils/emailSend');
const { mailEvents } = require('../../../../../events/mailTemplateEvent/timesheetsMailEvent');


/**
 * Store function to create a new timesheet record in the data base.
 * 
 * Logic :
 * - Count the total timesheets.
 * - Generate 'reference_id' from 'prefixes' table using slug.
 * - Create an object 'newTimesheet' for adding the timesheet.
 * - If timesheet end date is greater than the current ts next cycle date then update.
 * - Loop the timesheet hours and save in the 'timesheet_hours' table.
 * - Check for 'new_document_id', update the 'timesheet_documents'.
 * - Return the response from the repository.
 * 
 * @param {Object} employee - The request body containing timesheet details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {
    let trx;
    try {
        // Initialize a database transaction
        const db = await getConnection();
        trx = await db.transaction();
        // Initialize a database transaction

        let reference_id = await generateUniqueReferenceId('timesheets', 'timesheet');

        // create a new entry for each timesheet
        const newTimesheet = {
            placement_id: body.placement_id,
            reference_id: reference_id,
            from: body.start_date,
            to: body.end_date,
            total_hours: body.total_hours,
            total_billable_hours: body.total_billable_hours,
            total_non_billable_hours: body.total_non_billable_hours,
            total_ot_hours: body.total_ot_hours,
            comments: body.comments,
            status: body.isDrafted ? 'Drafted' : 'Submitted',
            approval_level: 1,
            submitted_on: body.isDrafted ? null : new Date(),
            submitted_by:  body.isDrafted ? null : body.loginUserId,
            drafted_on:  body.isDrafted ?  new Date() : null,
            created_by: body.created_by,
        };

        let timesheetData = await transactionRepository.store(trx, 'timesheets', newTimesheet);

        /**
         * If timesheet end date is greater than the current ts next cycle date then update
         */
        if (moment(body.existing_ts_next_cycle_start).format('YYYY-MM-DD') < moment(body.start_date).format('YYYY-MM-DD')) {
            await transactionRepository.update(trx, 'placements', { id: body.placement_id }, { ts_next_cycle_start: moment(body.end_date).add(1, 'days').format('YYYY-MM-DD') });
        }

        /**
         * Store the timesheet hours
         */
        for (let i in body.timesheet) {
            let newTimesheetHours = {
                timesheet_id: timesheetData.data[0].id,
                date: moment(body.timesheet[i].date).format('YYYY-MM-DD'),
                total_hours: body.timesheet[i].total_hours,
                ot_hours: body.timesheet[i].ot_hours,
                billable_hours: body.timesheet[i].billable_hours,
                created_at: new Date(),
                created_by: body.created_by,
            };
            await transactionRepository.store(trx, 'timesheet_hours', newTimesheetHours);
        }

        // To store the uploadided documents
        const destFolder = `${body.loginSubDomainName}/Client/${body.client_reference_id}/Placements/${body.placement_reference_id}/Timesheets/${timesheetData?.data[0].reference_id}`;

        // documents store
        var documents = body.documents;
        for (const key in documents) {
            if (documents[key].new_document_id !== '' && documents[key].new_document_id !== null) {
                var fileData = {
                    timesheet_id: timesheetData?.data[0].id,
                    created_by: body.created_by,
                    created_at: new Date()
                }
                const ledgerDocuments = await transactionRepository.store(trx, 'timesheet_documents', fileData)
                await commonDocumentStore(trx, 'timesheet_documents', destFolder, documents[key].new_document_id, ledgerDocuments.data[0].id)
            }
        }

        // Commit the transaction
        await trx.commit();
        // Commit the transaction

        var timesheet_id = timesheetData.data[0].id

        // Emit an event to trigger sending a email
        mailEvents.emit('timesheetsApprovalMail', body, timesheet_id);


        if (timesheetData?.status) {

            /** activity track */
            //activity object
            activity = { timesheet_id: timesheetData.data[0]?.id, action_type: 1, body: body };
            //activity object

            // calling the event for timesheet activity
            event.emit('timeSheetActivity', { activity });
            /** activity track */
        }

        return timesheetData;

    } catch (error) {
        // Handle errors and rollback the transaction in case of an exception
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

/**
 * Updates a timesheet with the provided data.
 * @param {Object} body - The data to update the timesheet with.
 * @returns {Promise<Object>} - The updated timesheet data.
 */
const update = async (body) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        // create a new entry for each document
        var condition = { id: body.id };
        const timesheet = {
            comments: body.comments,
            status: 'Submitted',
            total_billable_hours: body.total_billable_hours,
            total_hours: body.total_hours,
            total_ot_hours: body.total_ot_hours,
            updated_by: body.updated_by,
            updated_at: new Date()
        };

        // If not submitted till now update submitted information
        if (body.submitted_on == null) {
            timesheet.submitted_on = new Date();
            timesheet.submitted_by = body.loginUserId;
        }

        const destFolder = `${body.loginSubDomainName}/Client/${body.client_reference_id}/Placements/${body.placement_reference_id}/Timesheets/${body.timesheet_reference_id}`;

        // documents update
        var documents = body.documents;
        for (const key in documents) {
            if (documents[key].new_document_id !== '' && documents[key].new_document_id !== null) {
                var fileData = { timesheet_id: body.id };
                var timesheetDocuments;
                if (documents[key].id != '' && documents[key].id !== null) {
                    // document update
                    fileData = {
                        ...fileData, ...{
                            updated_by: body.updated_by,
                            updated_at: new Date()
                        }
                    }
                    timesheetDocuments = await transactionRepository.update(trx, 'timesheet_documents', { id: documents[key].id }, fileData);
                } else {
                    // docuemnt store
                    fileData = {
                        ...fileData, ...{
                            created_by: body.created_by,
                            created_at: new Date()
                        }
                    }
                    timesheetDocuments = await transactionRepository.store(trx, 'timesheet_documents', fileData)
                }
                await commonDocumentStore(trx, 'timesheet_documents', destFolder, documents[key].new_document_id, timesheetDocuments.data[0].id)
            }
        }

        // Get the timesheet before data for the activity
        const timesheetBeforeData = await getTimesheetBeforeData(body.id);

        // Get the timesheet_hours before data for the activity
        const timesheetHoursBeforeData = await getTimesheetHoursBeforeData(body.id);

        let timesheetData = await transactionRepository.update(trx, 'timesheets', condition, timesheet);

        /**
         * Update the timesheet hours
         */
        for (let i in body.timesheet) {
            var condition = {
                id: body.timesheet[i].id, timesheet_id: body.id
            };
            let TimesheetHours = {
                total_hours: body.timesheet[i].total_hours,
                ot_hours: body.timesheet[i].ot_hours,
                billable_hours: body.timesheet[i].billable_hours,
                updated_by: body.updated_by,
                updated_at: new Date(),
            };
            await transactionRepository.update(trx, 'timesheet_hours', condition, TimesheetHours);
        }

        // Commit the transaction
        await trx.commit();
        // Commit the transaction

        if (timesheetBeforeData.data[0].status == 'Drafted') { // for storing reminders
            body.reminder_name_id = '1'
            event.emit('timeSheetReminderActivity', body);
        }

        if (timesheetBeforeData.data[0].status == 'Drafted') { // for storing notifications
            body.slug = 'timesheet-approval-notification'
            eventss.emit('notification', body);
        }

        var timesheet_id = timesheetData.data[0].id;

        // Emit an event to trigger sending a email
        mailEvents.emit('timesheetsStatusApprovalMail', body, timesheet_id);

        if (timesheetData?.status) {

            /** activity track */
            //activity object
            activity = {
                timesheet_id: timesheetData.data[0]?.id,
                action_type: 2,
                body: body,
                timesheetBeforeData: timesheetBeforeData?.data[0],
                timesheetHoursBeforeData: timesheetHoursBeforeData?.data
            };
            //activity object

            // calling the event for timesheet activity
            event.emit('timeSheetActivity', { activity });
            /** activity track */
        }

        return timesheetData;
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
};

/**
 * Retrieves a list of timesheets based on specified conditions.
 *
 * @param {object} condition - An object containing various conditions for filtering timesheets.
 * @param {string} dateFormat - Date format.
 * @param {number} page - Current page number for pagination.
 * @param {number} limit - Number of items per page for pagination.
 * @returns {object} - An object with 'status' indicating the success or failure of the operation, 'data' containing the retrieved timesheets, and 'pagination_data' providing pagination details.
 *
 * Logic:
 * - Constructs an SQL query using 'getTimesheetsListing' stored procedure.
 * - Includes various conditions such as date range, status, search criteria, placement ID, employee ID, client ID, end-client ID, employee name, client name, end-client name, and timesheet status in the query.
 * - Executes the query using 'indexRepository.rawQuery'.
 * - Handles pagination by calculating total count and determining total pages.
 * - Returns an object with 'status' indicating success or failure, 'data' containing the retrieved timesheets, and 'pagination_data' providing pagination details.
 */
const listing = async (condition, dateFormat, page, limit) => {

    let query = `SELECT * FROM getTimesheetsListing(`;
    query += (condition.from_date && condition.to_date) ? `'${condition.from_date}', '${condition.to_date}',` : `${condition.from_date}, ${condition.to_date},`;
    query += (condition.status !== null) ? `'${condition.status}',` : `${condition.status},`;
    query += (condition.search !== null) ? `'${condition.search}',` : `${condition.search},`;
    query += (condition.placement_id !== null) ? `'${condition.placement_id}',` : `${condition.placement_id},`;
    query += (condition.employee_id !== null) ? `'${condition.employee_id}',` : `${condition.employee_id},`;
    query += (condition.client_id !== null) ? `'${condition.client_id}',` : `${condition.client_id},`;
    query += (condition.end_client_id !== null) ? `'${condition.end_client_id}',` : `${condition.end_client_id},`;
    query += (condition.employee_name !== null) ? `'${condition.employee_name}',` : `${condition.employee_name},`;
    query += (condition.client_name !== null) ? `'${condition.client_name}',` : `${condition.client_name},`;
    query += (condition.end_client_name !== null) ? `'${condition.end_client_name}',` : `${condition.end_client_name},`;
    query += (condition.ts_status !== null) ? `'${condition.ts_status}',` : `${condition.ts_status},`;
    query += `'${dateFormat}', ${limit}, ${page})`;

    const timesheetListing = await indexRepository.rawQuery(query);

    let pagination_details = {
        total: 0,
        currentPage: page,
        perPage: limit,
        totalPages: 0
    };

    if (timesheetListing.length > 0) {
        const ts_count = timesheetListing[0]?.count;
        await Promise.all(timesheetListing.map(async (timesheet) => {
            timesheet.isInvoiceConfigured = timesheet.invoice_configuration_id == null ? false  : true;
            timesheet.profile_picture_url = timesheet.profile_picture_url ? timesheet.profile_picture_url : await generateEmployeeAvatar(timesheet)
            timesheet.invoice_ids = await getInvoices(timesheet.timesheet_id)
            delete timesheet.ts_count;
        }));

        if (ts_count !== undefined && ts_count !== null) {
            pagination_details = {
                total: parseInt(ts_count),
                currentPage: parseInt(page),
                perPage: parseInt(limit),
                totalPages: Math.ceil(ts_count / limit)
            };
        }

        return {
            status: true,
            data: timesheetListing,
            pagination_data: pagination_details
        }
    } else {
        return {
            status: false,
            data: timesheetListing,
            pagination_data: pagination_details
        };
    }
}

/**
 * Retrieves various statistics for dashboard cards:
 * - Counts total invoiced timesheets, pending timesheets, timesheets pending for approval, and invoice-ready timesheets based on provided conditions.
 *
 * @param {object} condition - An object containing 'from_date', 'to_date', and 'status_type' properties.
 * @returns {object} - An object with 'status' indicating the success or failure of the operation and 'data' containing the retrieved statistics.
 *
 * Logic:
 * - Constructs specific queries to fetch statistics for different types of timesheets based on the 'status_type' provided.
 * - Executes SQL queries using 'indexRepository.rawQuery' and retrieves counts for each type of timesheet.
 * - Handles optional 'from_date' and 'to_date' conditions within the queries.
 * - Prepares and returns an object with 'status' indicating success or failure and 'data' containing the retrieved statistics.
 */
const dashboardCardsData = async (condition) => {
    let timesheets;
    let pendingTimesheets;
    let pendingForApprovalTS;
    let invoiceReadyTS;
    const query = "SELECT ";

    let totalTimesheets = `${query} COUNT(*) AS total_timesheets FROM timesheets WHERE deleted_at IS NULL`;

    let totalpendingTimesheetsQuery = `${query} COUNT(*) AS total_pending_timesheets FROM timesheets WHERE status = 'Drafted' AND deleted_at IS NULL`;

    let totalpendingForApprovalTSQuery = `${query} COUNT(*) AS total_pending_approval_timesheets FROM timesheets WHERE (status = 'Submitted' OR status = 'Approval In Progress') AND timesheets.deleted_at IS NULL`;

    let totalInvReadyTSQuery = `${query} COUNT(CASE WHEN ts.status = 'Approved' AND NOT EXISTS (
        SELECT 1 FROM timesheet_hours AS tsh WHERE tsh.timesheet_id = ts.id AND tsh.invoice_raised = true
    ) THEN 1 ELSE NULL END) AS total_invoice_ready_timesheets
    FROM timesheets AS ts WHERE ts.deleted_at IS NULL`;

    let whereClause = "";

    if (condition.from_date && condition.to_date && condition.status_type !== 'total_invoiced_timesheets') {
        whereClause = ` AND "from" >= '${condition.from_date}' AND "to" <= '${condition.to_date}'`;
    }

    if (condition.status_type) {
        const specificType = condition.status_type;

        if (whereClause) {
            totalTimesheets = `${totalTimesheets} ${whereClause}`;
            totalpendingTimesheetsQuery = `${totalpendingTimesheetsQuery} ${whereClause}`;
            totalpendingForApprovalTSQuery = `${totalpendingForApprovalTSQuery} ${whereClause}`;
            totalInvReadyTSQuery = `${totalInvReadyTSQuery} ${whereClause}`;
            switch (specificType) {
                case 'total_timesheets':
                    timesheets = await indexRepository.rawQuery(totalTimesheets);
                    break;
                case 'total_pending_timesheets':
                    pendingTimesheets = await indexRepository.rawQuery(totalpendingTimesheetsQuery);
                    break;
                case 'total_pending_approval_timesheets':
                    pendingForApprovalTS = await indexRepository.rawQuery(totalpendingForApprovalTSQuery);
                    break;
                case 'total_invoice_ready_timesheets':
                    invoiceReadyTS = await indexRepository.rawQuery(totalInvReadyTSQuery);
                    break;
                default:
                    break;
            }
        } else {
            totalTimesheets = `${totalTimesheets}`;
            totalpendingTimesheetsQuery = `${totalpendingTimesheetsQuery}`;
            totalpendingForApprovalTSQuery = `${totalpendingForApprovalTSQuery}`;
            totalInvReadyTSQuery = `${totalInvReadyTSQuery}`;
            switch (specificType) {
                case 'total_timesheets':
                    timesheets = await indexRepository.rawQuery(totalTimesheets);
                    break;
                case 'total_pending_timesheets':
                    pendingTimesheets = await indexRepository.rawQuery(totalpendingTimesheetsQuery);
                    break;
                case 'total_pending_approval_timesheets':
                    pendingForApprovalTS = await indexRepository.rawQuery(totalpendingForApprovalTSQuery);
                    break;
                case 'total_invoice_ready_timesheets':
                    invoiceReadyTS = await indexRepository.rawQuery(totalInvReadyTSQuery);
                    break;
                default:
                    break;
            }
        }
    } else {
        timesheets = await indexRepository.rawQuery(`${totalTimesheets} ${whereClause}`);
        pendingTimesheets = await indexRepository.rawQuery(`${totalpendingTimesheetsQuery} ${whereClause}`);
        pendingForApprovalTS = await indexRepository.rawQuery(`${totalpendingForApprovalTSQuery} ${whereClause}`);
        invoiceReadyTS = await indexRepository.rawQuery(`${totalInvReadyTSQuery} ${whereClause}`);
    }

    if (timesheets?.status || pendingTimesheets?.status || pendingForApprovalTS?.status || invoiceReadyTS?.status) {
        return {
            status: false,
            message: responseMessages.common.somethindWentWrong
        };
    } else {
        return {
            status: true,
            data: {
                total_timesheets: timesheets?.[0]?.total_timesheets,
                total_pending_timesheets: pendingTimesheets?.[0]?.total_pending_timesheets,
                total_pending_approval_timesheets: pendingForApprovalTS?.[0]?.total_pending_approval_timesheets,
                total_invoice_ready_timesheets: invoiceReadyTS?.[0]?.total_invoice_ready_timesheets
            }
        };
    }
};


/**
 * DeleteTimesheets function to delete a timesheet
 * 
 * Logic
 * + get total 'timesheet_hours' attached to 'timesheet' table.
 * + 'timesheet_hours' length is equal to 'timesheet_hour_ids' got from request.
 *   ~ If successful Delete timesheet and its documents.
 * Updates a timesheet with the provided data.
 * 
 * @param {Object} body - The request body containing the data for deletion.
 * @param {Object} condition - The condition to locate the entry to delete.
 * @returns {Object} Repository response.
 */
const deleteTimesheets = async (body) => {
    let trx;
    try {

        /* Initialize a database transaction */
        const db = await getConnection();
        trx = await db.transaction();
        /* Initialize a database transaction */

        /* update delete entry object */
        var updateData = {
            deleted_at: new Date(),
            updated_at: new Date(),
            updated_by: body.updated_by
        }
        returnData = await transactionRepository.update(trx, 'timesheets', { id: body.id }, updateData);
        timesheetsHoursData = await transactionRepository.update(trx, 'timesheet_hours', { timesheet_id: body.id }, updateData);
        /* update delete entry object */

        const timesheetDocuments = await indexRepository.find('timesheet_documents', ['*'], { timesheet_id: body.id });
        if (timesheetDocuments.status) {
            /* Deleting the documents information & remove the documents */
            var docData = await indexRepository.find('timesheet_documents', ['id'], { id: timesheetDocuments.data[0].id });
            if (docData.status) {
                for (const key in docData.data) {
                    await indexRepository.destroy('timesheet_documents', { id: docData.data[key].id });
                }
            }
            let _pathDest = `${body.loginSubDomainName}/Client/${body.client_reference_id}/Placements/${body.placement_reference_id}/Timesheets/${body.timesheet_reference_id}`;
            await destroyDocument(docData, _pathDest);
            /* Deleting the documents information & remove the documents */
        }

        /* Commit the transaction */
        await trx.commit();
        /* Commit the transaction */

        if (returnData?.status) {

            /** activity track */
            //activity object
            activity = {
                timesheet_id: body.id,
                action_type: 3,
                body: body
            };
            //activity object

            // calling the event for timesheet activity
            event.emit('timeSheetActivity', { activity });
            /** activity track */
        }

        return returnData;
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
};

/**
 * Status function to Update the status of a timesheet and performs additional actions based on the new status.
 * 
 * Logic;
 * - Create an object 'statusUpdate' for updating the 'timesheets' table.
 * - Create an object 'activityTrack' for updating the 'timesheet_approval_track' table.
 * 
 * @param {Object} body - The request body containing the necessary data for updating the timesheet status.
 * @returns {Promise} - A promise that resolves to the updated timesheets data.
 */
const status = async (body) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        // timesheet update
        let condition = { id: body.timesheet_id, placement_id: body.placement_id };
        const statusUpdate = {
            approval_level: body.approval_level,
            status: body.status,
            comments: body.comments,
            updated_by: body.updated_by,
            approved_on: body.status == 'Approved' ? new Date() : null,
            updated_at: new Date(),
        };
        // Get the timesheet before data for the activity
        const timesheetBeforeData = await getTimesheetBeforeData(body.timesheet_id);

        // Get the timesheet_hours before data for the activity
        const timesheetHoursBeforeData = await getTimesheetHoursBeforeData(body.timesheet_id);

        let timesheetData = await transactionRepository.update(trx, 'timesheets', condition, statusUpdate);
        // timesheet update

        /* Timesheet Approval Activity Log */
        /* Approval Activity Object */
        const activityTrack = {
            timesheet_id: body.timesheet_id,
            action_type: 4, // for approval
            approval_user_id: body.loginUserId,
            approval_level: body.level,
            created_at: new Date(),
            created_by: body.created_by
        };
        /* Approval Activity Object */
        await transactionRepository.store(trx, 'timesheet_activity_track', activityTrack);
        /* Timesheet Approval Activity Log */

        // Commit the transaction
        await trx.commit();
        // Commit the transaction

        if (body.status == 'Approval In Progress') { // for storing reminders
            body.reminder_name_id = '1'
            event.emit('timeSheetReminderActivity', body);
        }

        if (body.status == 'Approval In Progress') { // for storing notifications
            body.slug = 'timesheet-approval-notification'
            eventss.emit('notification', body);
        }

        var timesheet_id = timesheetData.data[0].id;

        // Emit an event to trigger sending a email
        mailEvents.emit('timesheetsStatusApprovalMail', body, timesheet_id, statusUpdate);

        /** activity track */
        if (timesheetData?.status) {
            //activity object
            activity = {
                timesheet_id: body.timesheet_id,
                action_type: 2,
                body: body,
                timesheetBeforeData: timesheetBeforeData?.data[0],
                timesheetHoursBeforeData: timesheetHoursBeforeData?.data
            };
            //activity object

            // calling the event for timesheet activity
            event.emit('timeSheetActivity', { activity });
        }
        /** activity track */

        return timesheetData;
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
};

const index = async (condition, dateFormat, body = null) => {

    let query = `SELECT * FROM getTimesheetsIndex(`;
    query += `'${condition.id}',`
    query += `'${dateFormat}')`

    let timesheet = await indexRepository.rawQuery(query);
    if (timesheet) {

        /**
         * Fetch the role id information for the login employee
         */
        let roleId = body.loginRoleId;
        const filters = { 'role_permissions.role_id': roleId, 'permissions.slug': 'timesheet_edit', 'role_permissions.is_allowed': true, 'roles.is_active': true };
        const joins2 = [
            { table: 'permissions', condition: ['permissions.id', 'role_permissions.permission_id'], type: 'inner' },
            { table: 'roles', condition: ['roles.id', 'role_permissions.role_id'], type: 'inner' },
        ];
        const rolePermission = await indexRepository.find('role_permissions', ['role_permissions.id'], filters, 1, joins2);

        /* Variables */
        const responseData = [];
        /* Variables */

        // Iterates over an array of timesheet and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
        for (const item of timesheet) {
            const joins = [
                { table: 'approval_users', condition: ['approval_users.approval_level_id', 'approval_levels.id'], type: 'left' },
                { table: 'employee', condition: ['employee.id', 'approval_users.approver_id'], type: 'left' }
            ];

            let checkApprover = await indexRepository.find('approval_levels', ['approval_users.id as id'], { 'approval_levels.approval_setting_id': item.timesheet_approval_id, 'approval_users.approver_id': body.loginUserId, 'approval_levels.level': item.approval_level }, null, joins);

            let super_admin_check = body.loginUserAdmin;
            let edit_status;
            let is_submit = false;
            if (super_admin_check) {
                edit_status = true;
                is_submit = (item.status == 'Drafted' ? true : false);
            } else {
                if (rolePermission.status) {
                    is_submit = (item.status == 'Drafted' ? true : false);
                }
                edit_status = checkApprover.status;
            }

            const listingObject = {
                ...item,
                is_submit: item.approval_level == 1 ? is_submit : is_submit,
                is_approver: ['Submitted', 'Approval In Progress'].includes(item.status) ? (edit_status ? true : false) : false,
                is_editable: edit_status ? true : false,
                label: `Level ${item.status}`
            };

            responseData.push(listingObject);
        }

        return { status: true, data: responseData };
    } else {
        return timesheet;
    }
};

/**
 * Get Timesheet Before Data
 */
async function getTimesheetBeforeData(timesheetId) {

    // Get the timesheet before data for the activity
    return await indexRepository.find('timesheets', ['id', 'total_hours', 'total_billable_hours', 'total_ot_hours', 'status'], { 'id': timesheetId }, null, []);
}

async function getTimesheetHoursBeforeData(timesheetId) {
    return await indexRepository.find('timesheet_hours', ['id', 'total_hours', 'billable_hours', 'ot_hours'], { 'timesheet_id': timesheetId }, null, []);
}

const submittedTimesheetsDashboard = async (condition, dateFormat, page, limit) => {

    let query = `SELECT COUNT(CASE WHEN status = 'Submitted' AND deleted_at IS NULL THEN 1 END) AS submitted_count FROM timesheets`;
    query += (condition.from_date && condition.to_date) ? `'${condition.from_date}', '${condition.to_date}',` : `${condition.from_date}, ${condition.to_date},`;
    query += (condition.search !== null) ? `'${condition.search}',` : `${condition.search},`;
    query += `'${dateFormat}', ${limit}, ${page})`;

    // console.log(query, 'query');

    const submittedCount = await indexRepository.rawQuery(query);
    if (submittedCount.length > 0) {

        pagination_details = {
            total: submittedCount,
            currentPage: page,
            perPage: limit,
            totalPages: Math.ceil(submittedCount / limit)
        }

        return {
            status: true,
            data: submittedCount,
            pagination_data: pagination_details
        }
    } else {
        return listing;
    }
}



const invoiceReadyTimesheet = async (timesheetId) => {

    let timesheetData = await indexRepository.rawQuery(`Select * from GetInvoiceReadyTimesheetData('${timesheetId}')`);

    if (timesheetData) {
        timesheetData = timesheetData[0];
        timesheetData.ledger_item_details = [];
        timesheetData.avatar = timesheetData.profile_picture_url ? timesheetData.profile_picture_url : await generateEmployeeAvatar(timesheetData);
        return {
            status: true,
            data: timesheetData
        }
    } else {
        return timesheetData;
    }
}

// to get ledgers mapped to the 
const getInvoices = async (timesheet_id) => {

    const response = await indexRepository.rawQuery(`SELECT l.reference_id
    FROM "ledger_item_details"
    INNER JOIN "ledgers" AS "l" ON "l"."id" = "ledger_item_details"."ledger_id"
    INNER JOIN "timesheet_hours" AS "tsh" ON "tsh"."id" = ANY(ledger_item_details.timesheet_hour_ids)
    INNER JOIN "timesheets" AS "t" ON "t"."id" = "tsh"."timesheet_id"
    WHERE
       "t"."id" = '${timesheet_id}'
       group by "l"."reference_id"`);

    let invoice_ids = []
    if (response.length > 0) {
        invoice_ids = response.map(obj => obj.reference_id);
        return invoice_ids
    } else {
        return invoice_ids
    }
}


function allReplace(str, obj) {
    for (const x in obj) {
        const regex = new RegExp(`${x}`, 'g');
        str = str.replace(regex, obj[x]);
    }
    return str;
}

module.exports = { store, update, deleteTimesheets, status, index, listing, submittedTimesheetsDashboard, dashboardCardsData, invoiceReadyTimesheet };