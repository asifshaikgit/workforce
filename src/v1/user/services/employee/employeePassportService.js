
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');
const { event } = require('../../../../../events/employeeActivityEvent');
const indexRepository = require('../../repositories/index');
const commonDocumentStore = require('../../../../../helpers/commonDocumentStore');
const moveInviteViaLinkDocument = require('../../../../../helpers/moveInviteViaLinkDocument');
const { destroyDocument } = require('../../../../../helpers/globalHelper');
const format = require('../../../../../helpers/format');
const moment = require('moment');
const inviteEmployeeCommonPath = '/Employee/Invite-Employee-Document/';
const { getPassportDetails } = require('./commonService');

/**
 * Store function to create a new Employee Passport Details entry.
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Create an object 'employeePassportDetails' with properties extracted from the reqiest 'body'
 * - Call the 'transactionRepository.store' function to store the new employee passport in the 'employee_passport_details' table within the transaction.
 * - Define the destination folder for the storing documents.
 * 
 * - Check if 'new_document_id' is provided in the request.
 * - + Fetch document details from temporary document records (in 'temp_upload_documents') using the provided 'new_document_id'.
  * - Commit the transaction after successfully storing all data.
 * - Trigger an activity event for creating a new employee passport record.
 * - Return the response with information about the stored passport record.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 * @param {Object} employee - The request body containing Employee Basic Details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction();

        const destFolder = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Passport`

        /* Default variables */
        var isDocument = false
        let beforeUpdateData;

        /* Fetching employee data before update for activity track */
        if (body.id) {
            beforeUpdateData = await getPassportDetails({ id: body.id }, isDocument)
        }

        const employeePassportDetails = {
            employee_id: body.employee_id,
            document_number: (body.document_number) ? body.document_number : null,
            issued_country_id: body.issued_country_id ? body.issued_country_id : null,
            status: (body.status) ? body.status : 0,
            valid_from: (body.valid_from) ? body.valid_from : null,
            valid_till: (body.valid_till) ? body.valid_from : null
        };

        if (body.id) {
            employeePassportDetails.updated_by = body.updated_by;
            employeePassportDetails.updated_at = new Date();
        } else {
            employeePassportDetails.created_by = body.created_by;
            employeePassportDetails.created_at = new Date();
        }


        let passportData;
        let activityName;
        if (body?.id) {
            /**
             *  update the employee's passport information in the 'employee_passport_details' table.
            **/
            passportData = await transactionRepository.update(trx, 'employee_passport_details', { 'id': body.id }, employeePassportDetails);
            actionType = 2; // for update
            activityName = 'employeeUpdateActivity';
        } else {
            /**
             *  Stores the employee's passport information in the 'employee_passport_details' table.
            **/
            passportData = await transactionRepository.store(trx, 'employee_passport_details', employeePassportDetails);
            actionType = 1; // for create
            activityName = 'employeeStoreActivity';
        }

        /** Update the documents related to passport */
        var documents = body.documents;
        for (const key in documents) {

            if (documents[key].new_document_id != '' && documents[key].slug == 'invite_via_link') {

                if (documents[key].document_url.includes(inviteEmployeeCommonPath)) {

                    var documentObject = {
                        referrable_type: 3, // passport documents
                        referrable_type_id: passportData.data[0].id,
                        created_by: body.created_by,
                        created_at: new Date()
                    }
                    const documentData = await transactionRepository.store(trx, 'employee_mapped_documents', documentObject);

                    // Move the file from invite via link employee folder structure to employee documents folder structure.
                    await moveInviteViaLinkDocument(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documentData.data[0].id, body.loginSubDomainName);
                }
            }

            if (documents[key].slug == undefined || documents[key].slug == '') {
                if (documents[key].id && documents[key].new_document_id) {
                    await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documents[key].id)
                    isDocument = true;
                } else {
                    if (documents[key].new_document_id) {
                        var documentObject = {
                            referrable_type: 3, // passport documents
                            referrable_type_id: passportData.data[0].id,
                            created_by: body.created_by,
                            created_at: new Date()
                        }
                        const documentData = await transactionRepository.store(trx, 'employee_mapped_documents', documentObject)
                        await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documentData.data[0].id)
                    }
                }
            }
        }
        // Commit the transaction
        await trx.commit();

        if (activityName == 'employeeStoreActivity') {
            /** Store Activity track */
            const changeLog = [
                {
                    'label_name': 'Passport Number',
                    'value': body.document_number,
                    'action_by': body.created_by,
                    'action_type': 1
                }
            ];
            activity = {
                employee_id: body.employee_id,
                referrable_type_id: passportData.data[0].id,
                activity_name: 'User Profile > Documents > Work Authorization > Passport',
                change_log: JSON.stringify(changeLog),
                created_by: body.created_by
            };
            event.emit("employeeStoreActivity", { activity });
            /** Store Activity track */
        } else {
            /**Update Activity track */
            activity = {
                employee_id: body.employee_id,
                referrable_type_id: passportData.data[0].id,
                activity_name: 'User Profile > Documents > Work Authorization > Passport',
                created_by: body.created_by,
                slug: 'passport',
                isDocumentUpdate: isDocument
            };
            event.emit("employeeUpdateActivity", { activity, beforeUpdateData });
            /**Update Activity track */
        }

        //Delete documents
        if (body?.documents_deleted_ids?.length > 0) {
            for (const key in body.documents_deleted_ids) {
                await deleteDocument(body, { id: body.documents_deleted_ids[key] })
            }
        }

        // Return the response from the database operation.
        return passportData;

    } catch (error) {
        // Handle errors and rollback the transaction in case of an exception
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

/**
 * Destroy function to delete an existing Employee I-94 Details entry.
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Create an object 'updateData' to set the 'deleted_at', 'updated_at', and 'updated_by' properties for soft deletion.
 * - Define the 'documentCondition' to locate document mappings associated with the entry to be deleted.
 * - Fetch document data associated with the entry using 'indexRepository.find'.
 * - Define the destination folder for storing documents.
 * - Call 'destroyDocument()' to delete associated documents from the storage.
 * - Call 'transactionRepository.update' to update the 'employee_passport_details' entry with the 'updateData'.
 * - Call 'transactionRepository.destroy' to delete the document mappings associated with the entry.
 * - Commit the transaction after successful deletion.
 * - Return the response from the database operation.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 * 
 * @param {Object} body - The request body containing the data for deletion.
 * @param {Object} condition - The condition to locate the entry to delete.
 * @returns {Object} Repository response.
 **/
const destroy = async (body, condition) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction();

        /* storing delete entry object */
        var updateData = {
            deleted_at: new Date(),
            updated_at: new Date(),
            updated_by: body.updated_by
        }
        /* storing delete entry object */
        var documentCondition = { referrable_type_id: condition.id, referrable_type: 3 };
        const fields = ['id', 'document_name as name', 'document_url', 'document_status', 'description']
        var docData = await indexRepository.find('employee_mapped_documents', fields, documentCondition);

        var _pathDest = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Passport`;

        await destroyDocument(docData.data, _pathDest);

        var repositoryResponse = await transactionRepository.update(trx, 'employee_passport_details', condition, updateData);
        await transactionRepository.destroy(trx, 'employee_mapped_documents', documentCondition);

        await trx.commit();

        /** Activity track */
        const changeLog = [
            {
                'label_name': 'Passport',
                'value': body.document_number,
                'action_by': body.created_by,
                'action_type': 3
            }
        ];
        activity = {
            employee_id: body?.employee_id,
            activity_name: 'User Profile > Documents > Work Authorization > Passport',
            change_log: JSON.stringify(changeLog),
            created_by: body?.created_by
        };
        event.emit("employeeDeleteActivity", { activity });
        /**Activity track */

        return repositoryResponse

    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

/**
 * Index function to retrieve Employee Passport Details based on the provided condition.
 * 
 * Logic: 
 *  - Set up the fields to fetch from the 'employee_passport_details' table.
 *  - Fetch employee passport details from the 'employee_passport_details'
 *  - If employee Passport data exist:
 *    + Create an empty 'responseData' array to structure the response.
 *     + Map the repository response data (employeePassport.data) to 'total_details'.
 *     + Iterate through the total_details, format date values, and create listing objects for each passport detail.
 *     + Retrieve associated documents for each passport detail from the 'employee_mapped_documents' table.
 *     + Push listing objects into the 'responseData' array.
 *     + Return the response object with status true and the passport details in the 'responseData' array.
 *   - Else (data is not found):
 *     + Return a response object with status false and an empty data array.
 *    
 * @param {Object} condition - The conditions to filter I-94 details.
 * @returns {Object} Response with Employee I-94 Details.
 */
const index = async (condition) => {
    const joins = [
        { table: 'countries as countries', alias: 'countries', condition: ['employee_passport_details.issued_country_id', 'countries.id'], type: 'left' },
    ];
    // Define joining information for the table

    var employeePassport = await indexRepository.find('employee_passport_details', ['employee_passport_details.*', 'countries.name as country_name'], condition, null, joins);
    if (employeePassport?.status) {

        let dateFormat = await format.getDateFormat(); // date format
        var total_details = employeePassport.data;
        /* Variables */
        var responseData = []
        /* Variables */

        for (const obj in total_details) {
            const docDataFields = ['id', 'document_name as name', 'document_url', 'document_status']
            var docData = await indexRepository.find('employee_mapped_documents', docDataFields, { referrable_type_id: total_details[obj].id, referrable_type: 3 })

            const newItem = { new_document_id: '' }; // Adding this key to all documents related Index API's
            let updatedDocData;
            if (docData.status) {
                // Using the map method to add the new_document_id to each object
                updatedDocData = docData.data.map(obj => ({
                    ...obj, // Copy the existing object's properties
                    ...newItem // Add the new item
                }));
            }

            var passportDetails = {
                id: total_details[obj].id,
                employee_id: total_details[obj].employee_id,
                document_number: total_details[obj]?.document_number || '',
                status: total_details[obj].status,
                place_of_issue: total_details[obj]?.place_of_issue || '',
                issued_country_id: total_details[obj]?.issued_country_id || '',
                country_name: total_details[obj]?.country_name || '',
                valid_from: total_details[obj].valid_from ? moment(total_details[obj].valid_from).format(dateFormat) : '',
                valid_till: total_details[obj].valid_till ? moment(total_details[obj].valid_till).format(dateFormat) : '',
                documents: docData.status ? updatedDocData : []
            }
            responseData.push(passportDetails)
        }
        return { status: true, data: responseData };
    } else {
        return { status: false, data: [] };
    }
}

/**
 * Delete Document function to delete a mapped document based on the provided condition.
 * 
 * Logic:
 * - Fetch the document data to be deleted from the 'employee_mapped_documents' table based on the provided condition using the 'indexRepository.find' function.
 * - Define the path destination ('_pathDest') where the document is stored.
 * - Call the 'destroyDocument' function to delete the document from the specified path.
 * - Delete the document data from the 'employee_mapped_documents' table using the 'indexRepository.update' function.
 * 
 * @param {Object} body - The request body containing context information.
 * @param {Object} condition - The conditions to filter the document to be deleted.
 * @returns {void}
 */
const deleteDocument = async (body, condition) => {

    var updateData = {
        deleted_at: new Date(),
        updated_at: new Date(),
        updated_by: body.updated_by
    }

    /* Fetching personal document data before update for activity track */
    const beforeUpdateData = {
        'Passport Document': false,
    };

    let docData = await indexRepository.find('employee_mapped_documents', ['id'], condition);
    let _pathDest = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Personal-Documents`;
    await destroyDocument(docData, _pathDest);
    const response = await indexRepository.update('employee_mapped_documents', condition, updateData);

    /* Fetching personal document data after update for activity track */
    const afterUpdateData = {
        'Passport Document': true,
    };

    /** Activity track */
    activity = {
        employee_id: body.employee_id,
        referrable_type: 6,
        referrable_type_id: condition.id,
        action_type: 3,
        created_by: body.created_by,
    };
    event.emit('employeeUpdateActivity', { activity, beforeUpdateData, afterUpdateData });

    return response;
};

module.exports = { store, destroy, index, deleteDocument };