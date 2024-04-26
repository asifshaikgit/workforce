
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');
const { event } = require('../../../../../events/employeeActivityEvent');
const indexRepository = require('../../repositories/index');
const { fetchAndMoveDocument, destroyDocument } = require('../../../../../helpers/globalHelper')
const config = require('../../../../../config/app');
const { getBankDetails } = require('./commonService');

/**
 * Store function to create a Employee Bank Details.
 * 
 * Logic:
 * - For document declare a destination folder move the documents from temp folder to destination folder
 * - Call the 'indexRepository.store' function to add the 'bank details' to the 'employee_bank_account_details' table.
 * - Return the response from the repository.
 * 
 * @param {Object} employee - The request body containing Employee Basic Details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction();
        //databse connection

        // define destination folder for employee bank documents
        const destFolder = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/BankDocuments`;

        /** fetching bank details before store */
        const beforeUpdateData = await getBankDetails({ employee_id: body.employee_id }, []);
        /** fetching bank details before Store */

        for (let key in body.bank_information) {
            let bankData = body.bank_information[key];

            let bankObj = {
                employee_id: body.employee_id,
                bank_name: bankData.bank_name,
                account_number: bankData.account_number,
                routing_number: bankData.routing_number,
                account_type: bankData.account_type,
                deposit_type: bankData.deposit_type,
                deposit_value: bankData.deposit_value != '' ? bankData.deposit_value : null,
                description: bankData.description ? bankData.description : null,
            };

            if (bankData.bank_account_details_id) {
                bankObj = {
                    ...bankObj, ...{
                        update_by: body.update_by
                    }
                };
            } else {
                bankObj = {
                    ...bankObj, ...{
                        created_by: body.created_by,
                        created_at: new Date(),
                    }
                };
            }

            const docuemntTypes = ['void_cheque_documents', 'deposit_form_documents'];

            // move documents from temp folder to bankdocuments folder
            for (const type in docuemntTypes) {

                if (bankData[docuemntTypes[type]]?.[0]?.new_document_id && bankData[docuemntTypes[type]]?.[0]?.slug == 'invite_via_link') {
                    const new_document_id = bankData[docuemntTypes[type]]?.[0]?.new_document_id;

                    var documentData = await indexRepository.find('invited_employee_documents', ['*'], { id: new_document_id }, null, [], 0, null, null, false);

                    // move file to destionation folder
                    const fileName = documentData.data[0]?.document_name;
                    await fetchAndMoveDocument(documentData.data, destFolder, fileName);

                    if (docuemntTypes[type] == 'void_cheque_documents') {

                        bankObj.void_cheque_document_url = (`${config.documentUrl}${destFolder}/${fileName}`).replace(/ /g, '%20');
                        bankObj.void_cheque_document_path = destFolder + '/' + fileName;
                        bankObj.void_cheque_document_name = documentData?.document_name;
                        isVoidChequeDocument = true;
                    } else if (docuemntTypes[type] == 'deposit_form_documents') {

                        bankObj.deposit_form_document_url = (`${config.documentUrl}${destFolder}/${fileName}`).replace(/ /g, '%20');
                        bankObj.deposit_form_document_path = destFolder + '/' + fileName;
                        bankObj.deposit_form_document_name = documentData?.document_name;
                        isDepositFormDocument = true;
                    }
                }

                if (bankData[docuemntTypes[type]]?.[0]?.new_document_id && bankData[docuemntTypes[type]]?.[0]?.slug == '') {
                    const new_document_id = bankData[docuemntTypes[type]]?.[0]?.new_document_id;

                    const bankAccountDetails = await indexRepository.find('employee_bank_account_details', ['void_cheque_document_url'], { id: body.bank_account_details_id });

                    // If bank consists of void_cheque_document_url destroy the document
                    if (bankAccountDetails.data[0]?.void_cheque_document_url) {
                        await destroyDocument(bankAccountDetails, destFolder);
                    }

                    var documentData = await indexRepository.find('temp_upload_documents', ['*'], { id: new_document_id }, null, [], 0, null, null, false);

                    // move file to destionation folder
                    const fileName = documentData.data[0]?.document_name;
                    await fetchAndMoveDocument(documentData.data, destFolder, fileName);
                    if (docuemntTypes[type] == 'void_cheque_documents') {

                        bankObj.void_cheque_document_url = (`${config.documentUrl}${destFolder}/${fileName}`).replace(/ /g, '%20');
                        bankObj.void_cheque_document_path = destFolder + '/' + fileName;
                        bankObj.void_cheque_document_name = documentData?.document_name;
                        isVoidChequeDocument = true;
                    } else if (docuemntTypes[type] == 'deposit_form_documents') {

                        bankObj.deposit_form_document_url = (`${config.documentUrl}${destFolder}/${fileName}`).replace(/ /g, '%20');
                        bankObj.deposit_form_document_path = destFolder + '/' + fileName;
                        bankObj.deposit_form_document_name = documentData?.document_name;
                        isDepositFormDocument = true;
                    }
                }
            }

            if (bankData.id) {
                bankList = await transactionRepository.update(trx, 'employee_bank_account_details', { id: bankData.id }, bankObj);
            } else {
                bankList = await transactionRepository.store(trx, 'employee_bank_account_details', bankObj);
            }
        }

        // Delete bank accounts
        if (body?.delete_bank_accounts?.length > 0) {
            for (const key in body.delete_bank_accounts) {
                let updateobj = {
                    updated_by: body.updated_by,
                    updated_at: new Date(),
                    deleted_at: new Date()
                }
                await transactionRepository.update(trx, 'employee_bank_account_details', { id: body.delete_bank_accounts[key] }, updateobj)
            }
        }

        // Commit the transaction
        await trx.commit();

        /** Activity Track */
        event.emit('employeebankActivity', { body, beforeUpdateData });
        /** Activity Track */

        return bankList;
    } catch (error) {
        // Handle errors and rollback the transaction in case of an exception
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

/**
 * Deletes a bank account and associated documents from the database.
 * @param {Object} body - The request body containing the bank account details.
 * @returns {Promise<Object>} - A promise that resolves to the repository response.
 */
const destroy = async (body) => {

    let trx;
    try {

        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection


        /* storing delete entry object */
        var updateData = {
            deleted_at: new Date(),
            updated_at: new Date(),
            updated_by: body.updated_by
        }
        /* storing delete entry object */

        var condition = { id: body.bank_account_details_id };
        var repositoryResponse = await transactionRepository.update(trx, 'employee_bank_account_details', condition, updateData)

        //commit transaction
        await trx.commit();

        /** Activity track */
        activity = {
            employee_id: body.employee_id,
            referrable_type: 11,
            referrable_type_id: repositoryResponse.data[0].id,
            action_type: 3,
            created_by: body.created_by,
        };
        event.emit("employeeDeleteActivity", activity)
        /** Activity track */

        return { status: true, repositoryResponse }
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

/**
 * Index function to retrieve details of employees based on the provided condition.
 * 
 * Logic:
 *   - Set up the fields to fetch from the 'employee_bank_account_details' table.
 *   - Fetch employee details from the 'employee_bank_account_details' table based on the provided condition with selected fields.
 *   - If employee_bank_account_details data exists:
 *     + Create an empty 'responseData' array to structure the response.
 *     + Map the repository response data (employee_list.data) to 'total_details'.
 *     + Iterate through the total_details, format date values, and create listing objects for each employee detail.
 *     + Push listing objects into the 'responseData' array.
 *     + Return the response object with status true and the employee details in the 'responseData' array.
 *   - Else(data is not found):
 *     + Return the response from the employee_bank_account_details function.
 *    
 * @param {Object} condition - The conditions to filter employee details.
 * @returns {Object} Response with employee details.
 */
const index = async (condition) => {

    // Retrieve the list of employees based on the specified 'condition'.
    var bankDetails = await indexRepository.find('employee_bank_account_details', [], condition, null, [], null, 'id', 'ASC');

    if (bankDetails.status) {
        var total_details = bankDetails.data;
        var responseData = [];

        for (const obj in total_details) {
            let bankData = {
                id: total_details[obj].id,
                employee_id: total_details[obj].employee_id,
                bank_name: total_details[obj].bank_name,
                account_number: total_details[obj].account_number,
                confirm_account_number: total_details[obj].account_number,
                routing_number: total_details[obj].routing_number,
                confirm_routing_number: total_details[obj].routing_number,
                account_type: total_details[obj].account_type === null ? '' : Number(total_details[obj].account_type),
                deposit_type: total_details[obj].deposit_type,
                deposit_value: (total_details[obj].deposit_type == 4 || total_details[obj].deposit_value == null) ? '' : total_details[obj].deposit_value,
                bank_name: total_details[obj].bank_name,
                description: total_details[obj].description,
                void_cheque_documents: [
                    {
                        document_name: total_details[obj].void_cheque_document_name ? total_details[obj].void_cheque_document_name : 'Void Cheque',
                        document_url: total_details[obj].void_cheque_document_url ? total_details[obj].void_cheque_document_url : '',
                        new_document_id: ""
                    }
                ],
                deposit_form_documents: [
                    {
                        document_name: total_details[obj].deposit_form_document_name ? total_details[obj].deposit_form_document_name : 'Deposit Form',
                        document_url: total_details[obj].deposit_form_document_url ? total_details[obj].deposit_form_document_url : '',
                        new_document_id: ""
                    }
                ]
            }
            responseData.push(bankData)
        }
        /* Using Map to iterate the loop and prepare the response */

        return { status: true, data: responseData };
    } else {
        return { status: false, data: [] };
    }
};

module.exports = { store, destroy, index };