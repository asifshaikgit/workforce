const moment = require('moment');
const indexRepository = require("../../repositories/index")
const format = require('../../../../../helpers/format');
const { events } = require('../../../../../events/placementActivityEvent.js');
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');

/**
 * Index function to retrieve and format placement billing details.
 *
 * Logic:
 * - Retrieve billing data from the 'placement_billing_details' table based on the given 'condition'.
 * - If data is successfully retrieved:
 *   - Prepare a response by formatting the data using a map operation.
 *   - Format date fields using the specified date format.
 *   - Create a response object for each billing detail.
 *   - Return the response with the formatted data.
 * - If no data is found, return a status indicating failure.
 *
 * @param {Object} condition - The conditions to filter placement billing details.
 * @returns {Object} Repository response with formatted data or failure status.
 */
const index = async (condition) => {
    var billing_data = await indexRepository.find('placement_billing_details', ['*'], condition);

    if (billing_data.status == true) {

        let dateFormat = await format.getDateFormat(); // date format

        /* Variables */
        var listingObject = [];
        var responseData = [];
        var total_details = billing_data.data;
        /* Variables */

        /* Using Map to iterate the loop and prepare the response */
        listingData = await total_details.map(async (item) => {
            listingObject = {
                id: item.id,
                placement_id: item.placement_id,
                bill_type: item.bill_type,
                bill_rate: item.bill_rate,
                ot_pay_rate_config_type: item.ot_pay_rate_config_type ? item.ot_pay_rate_config_type : "",
                ot_bill_rate: item.ot_bill_rate ? item.ot_bill_rate : "",
                ot_pay_rate_multiplier: item.ot_pay_rate_multiplier ? item.ot_pay_rate_multiplier : "",
                ot_pay_rate: item.ot_pay_rate ? item.ot_pay_rate : "",
                effective_from: moment(item.effective_from).format(dateFormat),
                effective_to: item.effective_to ? moment(item.effective_to).format(dateFormat) : '',
                bill_rate_discount: item.bill_rate_discount ? item.bill_rate_discount : '',
                bill_rate_discount_type: item.bill_rate_discount_type ? item.bill_rate_discount_type : '',
                created_at: item.created_at ? moment(item.created_at).format(dateFormat) : '',
            };
            return listingObject;
        });
        /* Using Map to iterate the loop and prepare the response */

        /* Using promise to wait till the address map completes. */
        responseData = await Promise.all(listingData);
        /* Using promise to wait till the address map completes. */


        const max_invoice_date = await getPlacementBillingAllowFromDate(condition.placement_id)
        if (max_invoice_date.status) {
            var date = moment(max_invoice_date.data[0].max_date).format(dateFormat)
        } else {
            var date = ''
        }

        return { status: true, data: responseData, max_invoice_date: date };
    } else {
        return { status: false }
    }
}

/**
 * Store function to create a new Placement Billing Details entry.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Check for an existing billing entry for the same placement with no end date ('effective_to' is null).
 *   - If an entry exists, update its 'effective_to' date to the day before the new effective date.
 * - Create a new billing details object 'newBilling' with properties extracted from the request 'body'.
 * - Store the new billing details in the 'placement_billing_details' table within the transaction.
 * - Fetch employee and client data related to the placement.
 * - Create an activity object for the event.
 * - Commit the transaction after successfully storing all data.
 * - Emit an event for creating a new placement billing record for activity tracking.
 * - Return the response with information about the stored placement billing record.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 *
 * @param {Object} body - The request body containing Placement Billing Details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        let condition = { placement_id: body.placement_id, effective_to: null }

        let placementBillingData
        var repositoryResponse = await indexRepository.find('placement_billing_details', ['id', 'effective_from'], condition, 0, [], null, 'id', 'desc');

        if (repositoryResponse.status) {
            let last_entry_detail = repositoryResponse.data[0];
            let update_condition = { id: last_entry_detail.id }
            let effective_till = moment(body.effective_from).subtract(1, 'days').format('YYYY-MM-DD')
            /**
             * If previous date is greater than the request date then delete the existing entry and insert it.
             */
            if (body.effective_from < repositoryResponse.data[0].effective_from) {
                await indexRepository.destroy('placement_billing_details', update_condition)
            } else {
                let update_previous_efeective_to = { effective_to: effective_till }
                await transactionRepository.update(trx, 'placement_billing_details', update_condition, update_previous_efeective_to);
            }

            /* Creating new object */
            let newBilling = {
                placement_id: body.placement_id,
                bill_type: body.bill_type,
                bill_rate: body.bill_rate,
                effective_from: body.effective_from,
                ot_pay_rate_config_type: body.ot_pay_rate_config_type ? body.ot_pay_rate_config_type : null,
                ot_bill_rate: body.ot_bill_rate ? body.ot_bill_rate : null,
                ot_pay_rate_multiplier: body.ot_pay_rate_multiplier ? body.ot_pay_rate_multiplier : null,
                ot_pay_rate: body.ot_pay_rate ? body.ot_pay_rate : null,
                bill_rate_discount: body.bill_rate_discount != '' ? body.bill_rate_discount : null,
                bill_rate_discount_type: body.bill_rate_discount_type != '' ? body.bill_rate_discount_type : null,
                current_rate: true,
                created_at: new Date(),
                created_by: body.created_by
            };
            /* Creating new object */

            placementBillingData = await transactionRepository.store(trx, 'placement_billing_details', newBilling);

        } else {
            /* Creating new object */
            let newBilling = {
                placement_id: body.placement_id,
                bill_type: body.bill_type,
                bill_rate: body.bill_rate,
                effective_from: body.effective_from,
                ot_pay_rate_config_type: body.ot_pay_rate_config_type ? body.ot_pay_rate_config_type : null,
                ot_bill_rate: body.ot_bill_rate ? body.ot_bill_rate : null,
                ot_pay_rate_multiplier: body.ot_pay_rate_multiplier ? body.ot_pay_rate_multiplier : null,
                ot_pay_rate: body.ot_pay_rate ? body.ot_pay_rate : null,
                bill_rate_discount: body.bill_rate_discount != '' ? body.bill_rate_discount : null,
                bill_rate_discount_type: body.bill_rate_discount_type != '' ? body.bill_rate_discount_type : null,
                current_rate: true,
                created_at: new Date(),
                created_by: body.created_by
            };
            /* Creating new object */

            placementBillingData = await transactionRepository.store(trx, 'placement_billing_details', newBilling);
        }

        // Commit the transaction
        await trx.commit();
        // Commit the transaction

        /**Activity track */
        activity = {
            placement_id: body.placement_id,
            referrable_type: 2,
            referrable_type_id: placementBillingData.data[0].id,
            action_type: 1,
            created_by: body.created_by,
        };
        events.emit('placementClientStoreActivity', { activity });

        //calling the event placement billing store for activity
        // events.emit('placementBillingStoreActivity', { activity });

        return placementBillingData;
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
};

/**
 * Update function to modify placement billing details.
 *
 * Logic:
 * - Define a condition to find the current billing record for the given placement.
 * - Query the repository to find the billing record with the condition.
 * - Check if the repository response is successful and the found billing ID matches the provided 'billing_id'.
 * - If conditions are met, update the billing record with the provided data.
 * - Return the repository response.
 *
 * @param {Object} body - The request body containing data for updating placement billing details.
 * @returns {Object} Repository response indicating the success of the update operation.
 */
const update = async (body) => {
    var condition = { placement_id: body.placement_id, effective_from: null }
    var repositoryResponse = await indexRepository.find('placement_billing_details', ['id'], condition, 0, [], null, id, 'desc');
    if (repositoryResponse.status && repositoryResponse.data[0].id === body.billing_id) {
        var upadteCondition = { id: body.billing_id }

        /* Creating new object */
        var updateBilling = {
            placement_id: body.placement_id,
            bill_rate: body.bill_rate,
            ot_pay_rate_config_type: body.ot_pay_rate_config_type ? body.ot_pay_rate_config_type : null,
            ot_bill_rate: body.ot_bill_rate ? body.ot_bill_rate : null,
            ot_pay_rate_multiplier: body.ot_pay_rate_multiplier ? body.ot_pay_rate_multiplier : null,
            ot_pay_rate: body.ot_pay_rate ? body.ot_pay_rate : null,
            bill_rate_discount: body.bill_rate_discount != '' ? body.bill_rate_discount : null,
            bill_rate_discount_type: body.bill_rate_discount_type != '' ? body.bill_rate_discount_type : null,
            current_rate: true,
            updated_at: new Date(),
            updated_by: body.created_by
        }
        /* Creating new object */

        await indexRepository.update('placement_billing_details', upadteCondition, updateBilling);
    }

    return repositoryResponse;
}

/**
 * Get the maximum invoice date for a placement based on certain conditions.
 *
 * Logic:
 * - Define joins to connect 'placements', 'timesheets', and 'timesheet_hours' tables.
 * - Specify conditions to filter placements based on the provided 'placementId' and invoice or payroll raised in timesheet hours.
 * - Perform a query to find the maximum date from the 'placements' table.
 * - Return the result, which includes the maximum invoice date.
 * - Handle any errors that occur during the process.
 *
 * @param {string} placementId - The ID of the placement for which to retrieve the maximum invoice date.
 * @returns {Object} Object containing the maximum invoice date or an error message.
 */
const getPlacementBillingAllowFromDate = async (placementId) => {
    try {

        let joins = [
            { table: 'timesheets as timesheets', alias: 'timesheets', condition: ['timesheets.placement_id', 'placements.id'], type: 'inner' },
            { table: 'timesheet_hours as timesheet_hours', alias: 'timesheet_hours', condition: ['timesheet_hours.timesheet_id', 'timesheets.id'], type: 'inner' }
        ];
        let condition = { global_search: `"placements"."id" = '${placementId}' and ("timesheet_hours"."invoice_raised" is TRUE or "timesheet_hours"."payroll_raised" is TRUE)` };

        var invoiceData = await indexRepository.findRaw('placements', [`max(date) as max_date`], condition, 1, joins, null, null, null, false, "placements.created_at");
        return invoiceData
    } catch (error) {
        console.error('Error fetching max invoice date:', error);
        return error
        //   res.status(500).send('Internal Server Error');
    }
}


module.exports = { index, store, update, getPlacementBillingAllowFromDate }
