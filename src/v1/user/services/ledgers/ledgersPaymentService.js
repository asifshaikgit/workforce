const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');
const indexRepository = require('../../repositories/index');
const commonDocumentStore = require('../../../../../helpers/commonDocumentStore');
const { events } = require('../../../../../events/ledgerPaymentsActivityEvent');
const format = require('../../../../../helpers/format');
const { mailEvents } = require('../../../../../events/mailTemplateEvent/ledgerPaymentsMailEvent');


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

        const count = await indexRepository.count('ledger_payments');
        const prefixSlug = body.entity_type;

        // Generating the ledgerpayments refernce id based on prefixes
        const prefix = await indexRepository.find('prefixes', ['prefix_name', 'separator', 'number'], { slug: prefixSlug });
        const prefixData = prefix.data[0];
        var reference_id = prefixData.prefix_name + prefixData.separator + (Number(count.data) + prefixData.number);

        // Create Object for ledgerPayment Creation
        const newLedgerPayment = {
            company_id: body.company_id,
            reference_id: reference_id,
            entity_type: body.entity_type,
            total_received_amount: body.total_received_amount,
            bank_charges: (body.bank_charges) ? body.bank_charges : null,
            total_excess_amount: (body.total_excess_amount) ? body.total_excess_amount : null,
            received_on: body.received_on,
            payment_mode_id: body.payment_mode_id,
            debited_credits: (body.debited_credits) ? body.debited_credits : null,
            payment_reference_number: body.payment_reference_number,
            notes: (body.notes) ? body.notes : null,
            created_by: body.created_by,
        }

        var ledgersPaymentData = await transactionRepository.store(trx, 'ledger_payments', newLedgerPayment);

        // Update Company `available_balance` if get any `excess_amount`
        let client_credits = parseFloat(body.company_available_balance) - parseFloat(body.debited_credits);
        client_credits = (body.excess_amount) ? (parseFloat(client_credits) + parseFloat(body.excess_amount)) : parseFloat(client_credits);

        // Updates the 'companies' table in the index repository with the specified client ID and the provided update object.
        await transactionRepository.update(trx, 'companies', { id: body.company_id }, { available_balance: client_credits })

        // Store Ledger Payment Sections.
        const ledgerPaymentItems = body.ledger_section_details;
        for (let item in ledgerPaymentItems) {
            item = ledgerPaymentItems[item];

            if (parseFloat(item.received_amount) > 0) {

                if (body.record_payment == true && body.total_excess_amount > 0) {
                    item.received_amount = parseFloat(item.received_amount) - parseFloat(body.total_excess_amount);
                }

                // Create object for ledger Payment section Creation.
                var ledger_payment_section = {
                    ledger_id: item.ledger_id,
                    ledger_payment_id: ledgersPaymentData.data[0]?.id,
                    received_amount: item.received_amount,
                    created_by: body.created_by
                }
                await transactionRepository.store(trx, 'ledger_payment_section_details', ledger_payment_section);

                if (item.balance_amount == 0) {
                    var paymentStatus = 'Paid'
                } else if (parseFloat(item.balance_amount) < parseFloat(item.amount)) {
                    var paymentStatus = 'Partially Paid'
                }

                // Updates the 'ledgers' collection in the index repository with the specified invoice data.
                await transactionRepository.update(trx, 'ledgers', { id: item.ledger_id }, { balance_amount: item.balance_amount, status: paymentStatus })
            }
        }

        // Store the document Information
        const destFolder = `${body.loginSubDomainName}/${body.company_entity_type}/${body.company_reference_id}/${body.entity_type}/${reference_id}`;
        var documents = body.documents;
        for (const key in documents) {
            if (documents[key].new_document_id !== '' && documents[key].new_document_id !== null) {
                var fileData = {
                    ledger_payment_id: ledgersPaymentData.data[0].id,
                    created_by: body.created_by,
                    created_at: new Date()
                }
                const ledgerDocuments = await transactionRepository.store(trx, 'ledger_payment_documents', fileData)
                await commonDocumentStore(trx, 'ledger_documents', destFolder, documents[key].new_document_id, ledgerDocuments.data[0].id)
            }
        }

        // Commit the transaction
        await trx.commit();

        // Emit an event to trigger sending a email
        mailEvents.emit('ledgerPaymentsMail', body, ledgersPaymentData);

        // Store Ledger Payments Activity track
        activity = {
            ledger_payment_id: ledgersPaymentData.data[0]?.id,
            action_type: 1, // 1 for store
            created_by: body.created_by,
        };
        events.emit('ledgerPaymentsActivity', { activity: activity });

        return { status: true, data: ledgersPaymentData.data }

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

        // get ledgerPayments before data
        const query = await getLedgerPaymentsDataQuery(body.id);
        let beforeUpdate = await indexRepository.rawQuery(query);
        beforeUpdate = beforeUpdate[0];

        // object for ledger payment update
        const updateLedgerPayment = {
            total_received_amount: body.total_received_amount,
            bank_charges: (body.bank_charges) ? body.bank_charges : null,
            total_excess_amount: (body.total_excess_amount) ? body.total_excess_amount : null,
            received_on: body.received_on,
            payment_mode_id: body.payment_mode_id,
            debited_credits: (body.debited_credits) ? body.debited_credits : null,
            payment_reference_number: body.payment_reference_number,
            notes: (body.notes) ? body.notes : null
        };

        var ledgersPaymentData = await transactionRepository.update(trx, 'ledger_payments', { id: body.id }, updateLedgerPayment);

        // update ledger payment section details
        const ledgerPaymentItems = body.ledger_section_details;
        for (let item in ledgerPaymentItems) {
            item = ledgerPaymentItems[item];

            if (item.ledger_payment_section_details_id) {

                // Update object for ledger Payment section Update.
                var ledger_payment_section = {
                    received_amount: item.received_amount,
                    updated_by: body.updated_by
                }
                await transactionRepository.update(trx, 'ledger_payment_section_details', { id: item.ledger_payment_section_details_id }, ledger_payment_section);
            } else {
                if (parseFloat(item.received_amount) > 0) {
                    // Create object for ledger Payment section Creation.
                    var ledger_payment_section = {
                        ledger_id: item.ledger_id,
                        ledger_payment_id: ledgersPaymentData.data[0]?.id,
                        received_amount: item.received_amount,
                        created_by: body.created_by
                    }
                    await transactionRepository.store(trx, 'ledger_payment_section_details', ledger_payment_section);
                }
            }
            var paymentStatus;
            if (parseFloat(item.received_amount) > 0) {
                if (item.balance_amount == 0) {
                    paymentStatus = 'Paid'
                } else if (parseFloat(item.balance_amount) < parseFloat(item.amount)) {
                    paymentStatus = 'Partially Paid'
                }
                if (item.balance_amount > 0 && paymentStatus) {
                    // Updates the 'ledgers' collection in the index repository with the specified invoice data.
                    await transactionRepository.update(trx, 'ledgers', { id: item.ledger_id }, { balance_amount: item.balance_amount, status: paymentStatus })
                }
            }
        }
        // Store the document Information
        const destFolder = `${body.loginSubDomainName}/${body.company_entity_type}/${body.company_reference_id}/${body.entity_type}/${body.reference_id}`;
        var documents = body.documents;
        for (const key in documents) {
            if (documents[key].new_document_id !== '' && documents[key].new_document_id !== null) {
                var fileData = { ledger_payment_id: ledgersPaymentData.data[0].id };
                var ledgerDocuments;
                if (documents[key].id != '' && documents[key].id !== null) {
                    // document update
                    fileData = {
                        ...fileData, ...{
                            updated_by: body.updated_by,
                            updated_at: new Date()
                        }
                    }
                    ledgerDocuments = await transactionRepository.update(trx, 'ledger_payment_documents', { id: documents[key].id }, fileData);
                } else {
                    // docuemnt store
                    fileData = {
                        ...fileData, ...{
                            created_by: body.created_by,
                            created_at: new Date()
                        }
                    }
                    ledgerDocuments = await transactionRepository.store(trx, 'ledger_payment_documents', fileData)
                }
                await commonDocumentStore(trx, 'ledger_payment_documents', destFolder, documents[key].new_document_id, ledgerDocuments.data[0].id)
            }
        }

        // Commit the transaction
        await trx.commit();

        // Update Ledger Payments Activity track
        activity = {
            ledger_payment_id: ledgersPaymentData.data[0]?.id,
            action_type: 2, // 2 for update
            created_by: body.created_by,
            beforeUpdate: beforeUpdate,
            query: query
        };
        events.emit('ledgerPaymentsActivity', { activity: activity });

        return { status: true, data: ledgersPaymentData.data };

    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
};

/**
 * Listing function to get the ledger payments data.
 * Logic:
 * - Fetch the data from the `ledger_payments` table using condition(param) by calling common findByPagination function.
 * - If data exists,
 *   + loop the data and push the object in to an array and add serial number to the object.
 *   + Prepare the response.
 *   + return the response with status as true.
 * - Else 
 *   + return the reponse with statsus as false.
 * 
 * @param {object} condition - The conditions to filter the employee data.
 * @param {number} page - The page number of the results to retrieve.
 * @param {number} limit - The maximum number of results per page.
 * @returns {object} - An object containing the retrieved employee data, pagination details, and status.
 */
const listing = async (condition, page, limit) => {

    let ledgerPaymentsListing;
    let total_ledgers_count = 0;
    if (condition.company_id != null) {
        ledgerPaymentsListing = await indexRepository.rawQuery(`SELECT * FROM GetLedgerPaymentsListing('${condition.entity_type}', '${condition.company_id}', '${condition.search}', ${limit}, ${page})`);
    } else {
        ledgerPaymentsListing = await indexRepository.rawQuery(`SELECT * FROM GetLedgerPaymentsListing('${condition.entity_type}', ${condition.company_id}, '${condition.search}', ${limit}, ${page})`);
    }

    if (ledgerPaymentsListing) {
        total_ledgers_count = ledgerPaymentsListing[0]?.total_count;
        pagination_details = {
            total: total_ledgers_count,
            currentPage: page,
            perPage: limit,
            totalPages: (total_ledgers_count) ? Math.ceil(total_ledgers_count / limit) : 0
        }

        ledgerPaymentsListing = ledgerPaymentsListing.map(obj => {
            const { ['total_count']: omittedKey, ...rest } = obj;
            return rest;
        });

        return {
            status: true,
            data: ledgerPaymentsListing,
            pagination_data: pagination_details
        }
    } else {
        return ledgerPaymentsListing;
    }
}

/**
 * Retrieves ledgerPayments data based on the given condition and returns a formatted response.
 * @param {any} condition - The condition to filter the invoices.
 * @param {string} loginUserId - The ID of the logged-in user.
 * @param {any} body - The request body.
 * @returns {Promise<{status: boolean, data: any}>} - The status and data of the retrieved invoices.
 */
const index = async (condition) => {

    // Initialize an empty array to store the response data.
    var responseData;
    responseData = await indexRepository.rawQuery(`Select * From GetLedgerPaymentDetails('${condition.ledger_payment_id}','${condition.entity_type}','${condition.ledger_entity_type}','${condition.date_format}')`);

    if (responseData && responseData.length > 0) {

        responseData = responseData[0];
        let total_ledger_amount = 0;
        let total_balance_amount = 0;
        responseData?.ledger_section_details.map(payment_details => {
            payment_details.received_amount_previous = payment_details?.received_amount_previous - payment_details?.received_amount
            total_ledger_amount += payment_details.amount;
            total_balance_amount += payment_details.balance_amount;
        });
        responseData.total_ledger_amount = total_ledger_amount;
        responseData.total_balance_amount = total_balance_amount;

        // Return a response object with a status of 'true' and the retrieved data.
        return {
            status: true,
            data: responseData
        }
    } else {
        return responseData;
    }
}

/**
 * Get Ledger Data Querry Including all the ledger_item_details, ledger_address based on the ledger_id
 */
async function getLedgerPaymentsDataQuery(ledgerPaymentId, dateFormat) {

    return "select lp.total_received_amount, lp.bank_charges, lp.total_excess_amount, TO_CHAR(lp.received_on, '" + dateFormat + "') as received_on, lp.payment_mode_id, lp.debited_credits, lp.payment_reference_number, lp.notes, jsonb_agg(jsonb_build_object('id', lpsd.id, 'received_amount', lpsd.received_amount)) as ledger_payment_Section_details from ledger_payments as lp left join ledger_payment_section_details as lpsd on lp.id = lpsd.ledger_payment_id where lp.id = '" + ledgerPaymentId + "' group by lp.id";
}

module.exports = { store, update, listing, index }