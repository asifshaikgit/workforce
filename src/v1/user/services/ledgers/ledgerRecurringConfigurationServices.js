const indexRepository = require('../../repositories/index');
const transactionRepository = require('../../repositories/transactionRepository')
const { getConnection } = require('../../../../middlewares/connectionManager');
const moment = require('moment')
/**
 * Store Function to create a new record of an payment for a ledger
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Generating the ledgers Payment refernce id based on prefixes.
 * 
 * @param {Object} body - The request body containing the ledgerPayments data.
 * @returns {Object} - An object containing the status and data of the stored ledgers.
 * @throws {Error} - If an error occurs while processing the ledgerPayments.
 */
const store = async (body) => {

    let trx;
    try {

        // Databse connection
        const db = await getConnection();
        trx = await db.transaction();

        // Create Object for ledger recurring Creation
        const newledgerRecurring = {
            ledger_id: body.ledger_id,
            recurring_cycle_type: body.recurring_cycle_type,
            recurring_cycle_number: body.recurring_cycle_number,
            recurring_start_date: body.recurring_start_date,
            recurring_end_date: (body.recurring_never_expires == 'false') ? body.recurring_end_date : null,
            recurring_never_expires: (body.recurring_never_expires) ? body.recurring_never_expires : null,
            is_custom: (body.is_custom) ? (body.is_custom) : false,
            created_by: body.created_by,
        }

        var ledgersrecurringData = await transactionRepository.store(trx, 'ledger_recurring_configurations', newledgerRecurring); //storing in recurring table

        // getting the recuriing date depending upon the configuration
        if (body.recurring_cycle_type == '1') { //days
            cycle = 'days'
        } else if (body.recurring_cycle_type == '2') {// weeks
            cycle = 'weeks'
        } else if (body.recurring_cycle_type == '3') {// months
            cycle = 'months'
        } else {// years
            cycle = 'years'
        }
        recurring_date = moment(body.ledger_date).add(body.recurring_cycle_number, cycle).format('YYYY-MM-DD') // getting the recurring date

        if (body.recurring_never_expires == 'false') { // if end date exists
            if (recurring_date >= moment(body.recurring_start_date).format('YYYY-MM-DD') && recurring_date <= moment(body.recurring_end_date).format('YYYY-MM-DD')) {
                await transactionRepository.update(trx, 'ledgers', { id: body.ledger_id }, { enable_recurring: true, next_recurring_date: recurring_date }); // updating the ledgers for next recurring date
            }
        } else { // if there is no end date
            if (recurring_date >= moment(body.recurring_start_date).format('YYYY-MM-DD')) {
                await transactionRepository.update(trx, 'ledgers', { id: body.ledger_id }, { enable_recurring: true, next_recurring_date: recurring_date }); // updating the ledgers for next recurring date
            }
        }

        // Commit the transaction
        await trx.commit();

        return { status: true, data: ledgersrecurringData.data }

    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}


/**
 * Update function to edit a ledger payment for a company
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Create an object `newledgerPayemnts` for inserting ledgerPayments data.
 * - Interate the `ledger_payment_section_details`, create item_Details object and update in 'ledger_payment_section_details' table.
 * 
 * @param {Object} body - The request body containing the invoice data.
 * @returns {Object} - An object containing the status and data of the stored invoice.
 * @throws {Error} - If an error occurs while processing the invoice.
 */
const update = async (body) => {

    let trx;
    try {

        // Databse connection
        const db = await getConnection();
        trx = await db.transaction();

        // Create Object for ledger recurring Update
        const newledgerRecurring = {
            ledger_id: body.ledger_id,
            recurring_cycle_type: body.recurring_cycle_type,
            recurring_cycle_number: body.recurring_cycle_number,
            recurring_start_date: body.recurring_start_date,
            recurring_end_date: (body.recurring_never_expires == 'false') ? body.recurring_end_date : null,
            recurring_never_expires: (body.recurring_never_expires) ? body.recurring_never_expires : null,
            is_custom: (body.is_custom) ? (body.is_custom) : false,
            created_by: body.created_by,
        }

        var updateledgersrecurringData = await transactionRepository.update(trx, 'ledger_recurring_configurations', { ledger_id: body.ledger_id }, newledgerRecurring);// updating the value

        // getting the recuriing date depending upon the configuration
        if (body.recurring_cycle_type == '1') { //days
            cycle = 'days'
        } else if (body.recurring_cycle_type == '2') {// weeks
            cycle = 'weeks'
        } else if (body.recurring_cycle_type == '3') {// months
            cycle = 'months'
        } else {// years
            cycle = 'years'
        }
        var recurring_date = moment(body.ledger_date).add(body.recurring_cycle_number, cycle).format('YYYY-MM-DD') // getting the recurring date

        if (body.recurring_never_expires == 'false') { // if end date exists
            if (recurring_date >= moment(body.recurring_start_date).format('YYYY-MM-DD') && recurring_date <= moment(body.recurring_end_date).format('YYYY-MM-DD')) {
                await transactionRepository.update(trx, 'ledgers', { id: body.ledger_id }, { enable_recurring: true, next_recurring_date: recurring_date }); // updating the ledgers for next recurring date
            }
        } else { // if there is no end date
            if (recurring_date >= moment(body.recurring_start_date).format('YYYY-MM-DD')) {
                await transactionRepository.update(trx, 'ledgers', { id: body.ledger_id }, { enable_recurring: true, next_recurring_date: recurring_date }); // updating the ledgers for next recurring date
            }
        }

        // Commit the transaction
        await trx.commit();

        return { status: true, data: updateledgersrecurringData.data }

    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
};

/**
 * Retrieves ledgers data based on the given condition and returns a formatted response.
 * @param {any} condition - The condition to filter the invoices.
 * @param {string} loginUserId - The ID of the logged-in user.
 * @param {any} body - The request body.
 * @returns {Promise<{status: boolean, data: any}>} - The status and data of the retrieved invoices.
 */
const index = async (condition, dateFormat) => {

    // Initialize an empty array to store the response data.
    let responseData = [];
    let recurring_cycle;

    let joins = [{ table: 'employee as created', alias: 'created', condition: ['created.id', 'ledger_recurring_configurations.created_by'], type: 'left' }]
    var ledgerRecurringData = await indexRepository.find('ledger_recurring_configurations', ['ledger_recurring_configurations.*', 'created.display_name as created_by'], condition, null, joins);

    if (ledgerRecurringData.status) { // switch case for the cycle of the recurring
        switch (ledgerRecurringData.data[0].recurring_cycle_type) {
            case 1:
                recurring_cycle = 'days';
                break;
            case 2:
                recurring_cycle = 'weeks';
                break;
            case 3:
                recurring_cycle = 'months';
                break;
            case 4:
                recurring_cycle = 'years';
                break;
            default:
                recurring_cycle = 'Unknown';
                break;
        }

        const newledgerRecurring = { // onject for the recurring information
            ledger_id: ledgerRecurringData.data[0].ledger_id,
            recurring_cycle_type: (!ledgerRecurringData.data[0].is_custom) ? ledgerRecurringData.data[0].recurring_cycle_type : '',
            recurring_cycle: recurring_cycle,
            recurring_cycle_number: (!ledgerRecurringData.data[0].is_custom) ? ledgerRecurringData.data[0].recurring_cycle_number : '',
            recurring_start_date: moment(ledgerRecurringData.data[0].recurring_start_date).format(dateFormat),
            recurring_end_date: (ledgerRecurringData.data[0].recurring_never_expires == 'false') ? moment(ledgerRecurringData.data[0].recurring_end_date).format(dateFormat) : '',
            recurring_never_expires: ledgerRecurringData.data[0].recurring_never_expires,
            custom_recurring_cycle_type: (ledgerRecurringData.data[0].is_custom) ? ledgerRecurringData.data[0].recurring_cycle_type : '',
            custom_recurring_cycle_number: (ledgerRecurringData.data[0].is_custom) ? ledgerRecurringData.data[0].recurring_cycle_number : '',
            is_custom: (ledgerRecurringData.data[0].is_custom),
            created_by: ledgerRecurringData.data[0].created_by,
        }
        responseData.push(newledgerRecurring)

        // Return a response object with a status of 'true' and the retrieved data.
        return {
            status: true,
            data: responseData
        }
    } else {
        return {
            status: false,
            data: responseData
        }
    }
}


module.exports = { store, update, index }