const indexRepository = require('../../repositories/index');
const transactionRepository = require('../../repositories/transactionRepository');
const moment = require('moment')
const { getConnection } = require('../../../../middlewares/connectionManager');
const format = require('../../../../../helpers/format');
const { event } = require('../../../../../events/configurationActivityEvent');
const commonDocumentStore = require('../../../../../helpers/commonDocumentStore');


/**
 * Store function to create a new self reminder configuration.
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'db.transaction'.
 * - Generate a unique 'slug' based on the reference type and incrementing number.
 * - Create a new object 'newReminderConfigData' with properties from the request body for 'reminder_configurations' table.
 * - Call the store repository function to add 'newReminderConfigData' to the 'reminder_configurations' table within the transaction.
 * - Create a new object 'newReminderData' with properties from the request body for 'reminder_referrables' table.
 * - Call the store repository function to add 'newReminderData' to the 'reminder_referrables' table within the transaction.
 * - If 'reminders' array is provided in the request body:
 *    ~ Loop through each reminder in the 'reminders' array.
 *      - Create a new object 'newReminderOccurrenceData' with properties from each reminder.
 *      - Call the store repository function to add 'newReminderOccurrenceData' to the 'reminder_occurances' table within the transaction.
 * - Process and store reminder documents in 'reminder_documents' table.
 * - Commit the database transaction if all database operations are successful.
 * - Track the creation activity for the reminder.
 * - Emit an event to log the activity.
 * - Return the response from the repository.
 * 
 * Note:
 *  - Exception handling using try-catch.
 *  - If any exception is raised, rollback all database operations using 'trx.rollback()'.
 * 
 * @param {Object} body - The request body containing reminder configuration details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {

    let trx;
    try {
        // Initialize a database transaction
        const db = await getConnection();
        trx = await db.transaction();

        var referenceId = await indexRepository.count('reminder_configurations', { referrable_type: 'self' })
        var reference_id = 'self' + '-' + Number(Number(referenceId.data) + 1);

        /* creating a new object to store */
        const newreminderConfigData = {
            name: body.name,
            description: body.description,
            slug: reference_id,
            referrable_type: 'self',
            created_by: body.created_by,
            created_at: new Date(),
        };
        /* creating a new object to store */

        /* storing the data */
        const reminderConfigResponse = await transactionRepository.store(trx, 'reminder_configurations', newreminderConfigData);

        if (body.employee_ids.length > 0) {
            var empArray = body.employee_ids.map(obj => obj.id);
        }

        /* creating a new object to store */
        const newreminderData = {
            reminder_name_id: reminderConfigResponse.data[0].id,
            status: true,
            employee_ids: body.employee_ids.length > 0 ? empArray : null,
            is_payroll_reminder: body.is_payroll_reminder ? body.is_payroll_reminder : false,
            check_date: body.check_date ? body.check_date : null,
            pay_config_setting_id: body.is_payroll_reminder == 'true' ? body.pay_config_setting_id : null,
            reminder_time: body.is_payroll_reminder == 'false' ? body.reminder_time : null,
            reminder_date: body.is_payroll_reminder == 'false' ? body.reminder_date : null,
            created_by: body.created_by,
            created_at: new Date(),
        };
        /* creating a new object to store */

        /* storing the data */
        const reminderResponse = await transactionRepository.store(trx, 'reminder_referrables', newreminderData);

        // assigning the array data
        let reminder = body.reminders

        // looping the data from the variable
        for (let key in reminder) {
            /* creating a new object to store */

            var newreminderoccuranceData = {
                reminder_referrable_id: reminderResponse.data[0].id,
                occurance_order: reminder[key].occurance_order,
                number: reminder[key].number,
                cycle: reminder[key].cycle,
                is_recurring: reminder[key].is_recurring,
                recurring_days: reminder[key].is_recurring == 'true' ? reminder[key].recurring_days : null,
                created_by: body.created_by,
                created_at: new Date(),
            };
            /* storing the data for every loop */
            await transactionRepository.store(trx, 'reminder_occurances', newreminderoccuranceData);
        }

        const destFolder = `${body.loginSubDomainName}/self-reminder/${reference_id}`;
        var documents = body.documents;
        for (const key in documents) {
            if (documents[key].new_document_id !== '' && documents[key].new_document_id !== null) {
                var fileData = {
                    reminder_name_id: reminderConfigResponse.data[0].id,
                    created_by: body.created_by,
                    created_at: new Date()
                }
                const reminderDocuments = await transactionRepository.store(trx, 'reminder_documents', fileData)
                await commonDocumentStore(trx, 'reminder_documents', destFolder, documents[key].new_document_id, reminderDocuments.data[0].id)
            }
        }
        // Commit the transaction
        await trx.commit();

        // Store on reminder Activity track
        activity = {
            referrable_type: 27,
            referrable_id: reminderResponse.data[0].id,
            action_type: 1, // 1 for store
            created_by: body.created_by,
        };

        event.emit('configurationStoreActivity', { activity });
        return reminderResponse;

    } catch (error) {
        // Handle errors and rollback the transaction in case of an exception
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }

};

/**
 * Update function to modify an existing self reminder configuration.
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'db.transaction'.
 * - Retrieve the existing reminder data before the update for tracking changes.
 * - Create a new object 'newReminderConfigData' with properties from the request body for 'reminder_configurations' table.
 * - Call the update repository function to modify 'newReminderConfigData' in the 'reminder_configurations' table within the transaction.
 * - Create a new object 'newReminderData' with properties from the request body for 'reminder_referrables' table.
 * - Call the update repository function to modify 'newReminderData' in the 'reminder_referrables' table within the transaction.
 * - If 'reminders' array is provided in the request body:
 *    ~ Loop through each reminder in the 'reminders' array.
 *      - Create a new object 'updateReminderOccurrenceData' with properties from each reminder.
 *      - Call the update repository function to modify 'updateReminderOccurrenceData' in the 'reminder_occurances' table within the transaction.
 *      - If 'id' exists in the reminder data, update the existing entry; otherwise, store a new entry.
 * - Delete the reminder occurrences specified in 'deleted_reminder_occurance_id'.
 * - Update or store reminder documents in 'reminder_documents' table.
 * - Commit the database transaction if all database operations are successful.
 * - Retrieve the updated reminder data after the update for tracking changes.
 * - Track the update activity for the reminder.
 * - Emit an event to log the activity.
 * - Return the response from the repository.
 * 
 * Note:
 *  - Exception handling using try-catch.
 *  - If any exception is raised, rollback all database operations using 'trx.rollback()'.
 * 
 * @param {Object} body - The request body containing updated reminder configuration details.
 * @param {Object} condition - The condition to identify the reminder for update.
 * @returns {Object} Repository response.
 */
const update = async (body, condition) => {

    let dateFormat = await format.getDateFormat(); // date format

    /* Creating update entry object */
    let trx;
    try {
        // Initialize a database transaction
        const db = await getConnection();
        trx = await db.transaction();

        // get reminder before data
        var query = await getreminderDataQuery(condition.id, dateFormat);
        var beforeUpdateData = await indexRepository.rawQuery(query);
        beforeUpdateData = beforeUpdateData[0];


        /* creating a new object to store */
        const newreminderConfigData = {
            name: body.name,
            description: body.description,
            // slug: reference_id,
            // referrable_type: 'self',
            updated_by: body.created_by,
            updated_at: new Date(),
        };
        /* creating a new object to store */

        /* storing the data */
        const reminderConfigResponse = await transactionRepository.update(trx, 'reminder_configurations', condition, newreminderConfigData);

        if (body.employee_ids.length > 0) {
            var empArray = body.employee_ids.map(obj => obj.id);
        }

        /* creating a new object to store */
        const newreminderData = {
            reminder_name_id: condition.id,
            status: true,
            employee_ids: body.employee_ids.length > 0 ? empArray : null,
            is_payroll_reminder: body.is_payroll_reminder ? body.is_payroll_reminder : false,
            check_date: body.check_date ? body.check_date : null,
            pay_config_setting_id: body.is_payroll_reminder == 'true' ? body.pay_config_setting_id : null,
            reminder_time: body.is_payroll_reminder == 'false' ? body.reminder_time : null,
            reminder_date: body.is_payroll_reminder == 'false' ? body.reminder_date : null,
            updated_by: body.created_by,
            updated_at: new Date(),
        };
        /* creating a new object to store */

        /* storing the data */
        const reminderResponse = await transactionRepository.update(trx, 'reminder_referrables', { id: body.reminder_referrable_id }, newreminderData,);

        // assigning the array data
        let reminder = body.reminders

        // looping the data from the variable
        for (let key in reminder) {

            /* creating a new object to store */
            var updateReminderoccuranceData = {
                reminder_referrable_id: reminderResponse.data[0].id,
                occurance_order: reminder[key].occurance_order,
                number: reminder[key].number,
                cycle: reminder[key].cycle,
                is_recurring: reminder[key].is_recurring,
                recurring_days: reminder[key].recurring_days ? reminder[key].recurring_days : null,
                created_by: body.created_by,
                created_at: new Date(),
            };

            /* creating a new object to store */
            if (reminder[key].id) { // updating the data if id exists
                await transactionRepository.update(trx, 'reminder_occurances', { id: reminder[key].id }, updateReminderoccuranceData);
            } else { /* storing the data for every loop */
                await transactionRepository.store(trx, 'reminder_occurances', updateReminderoccuranceData);
            }
        }

        //Deleting the reminder occurances information
        if (Array.isArray(body.deleted_reminder_occurance_id)) {
            if (body.deleted_reminder_occurance_id.length > 0) {
                for (const key in body.deleted_reminder_occurance_id) {
                    if (body.deleted_reminder_occurance_id[key] != '' && body.deleted_reminder_occurance_id[key] != null && body.deleted_reminder_occurance_id[key] != undefined) {
                        await transactionRepository.destroy(trx, 'reminder_occurances', { id: body.deleted_reminder_occurance_id[key] })
                    }
                }
            }
        }

        // Update the document Information
        const destFolder = `${body.loginSubDomainName}/self-reminder/${body.slug}`;
        var documents = body.documents
        for (const key in documents) {

            if (documents[key].new_document_id !== '' && documents[key].new_document_id !== null) {
                if (documents[key].id !== '' && documents[key].id !== null) {
                    // document update
                    var fileData = {
                        reminder_name_id: reminderConfigResponse.data[0].id,
                        created_by: body.created_by,
                        created_at: new Date()
                    }
                    const reminderDocuments = await transactionRepository.update(trx, 'reminder_documents', { id: documents[key].id }, fileData)
                    await commonDocumentStore(trx, 'reminder_documents', destFolder, documents[key].new_document_id, reminderDocuments.data[0].id)
                } else {
                    // new document store
                    var fileData = {
                        reminder_name_id: reminderConfigResponse.data[0].id,
                        created_by: body.created_by,
                        created_at: new Date()
                    }
                    const reminderDocuments = await transactionRepository.store(trx, 'reminder_documents', fileData)
                    await commonDocumentStore(trx, 'reminder_documents', destFolder, documents[key].new_document_id, reminderDocuments.data[0].id)
                }

            }
        }


        // Commit the transaction
        await trx.commit();

        // get reminder before data
        var query = await getreminderDataQuery(condition.id, dateFormat);
        var afterUpdateData = await indexRepository.rawQuery(query);
        afterUpdateData = afterUpdateData[0];

        /**Activity track */
        activity = {
            referrable_type: 27,
            referrable_id: reminderResponse.data[0].id,
            action_type: 2, // 2 for update
            created_by: body.created_by,
        }
        event.emit('configurationReminderActivity', { activity, beforeUpdateData, afterUpdateData });

        return reminderResponse;

    } catch (error) {
        // Handle errors and rollback the transaction in case of an exception
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
};

// /**
//  * UpdateStatus function to modify the status of a reminder configuration entry.
//  * 
//  * Logic:
//  * - Get the existing data of the reminder configuration before the update.
//  * - Create an object 'updateData' with properties for updating the status of the reminder configuration entry.
//  * - Call the update repository function to update the status of the reminder configuration entry.
//  * - Get the updated data of the reminder configuration after the update.
//  * - Track the update activity for the reminder configuration.
//  * - Emit an event to log the update activity along with before and after update data.
//  * - Return the response from the repository.
//  * 
//  * @param {Object} body - The request body containing details for updating the status of the reminder configuration.
//  * @param {Object} condition - The condition to identify the reminder configuration entry to update.
//  * @returns {Object} Repository response for the update operation.
//  */
// const updateStatus = async (body, condition) => {

//     let dateFormat = await format.getDateFormat(); // date format

//     // get reminder before data
//     var query = await getreminderDataQuery(condition.id, dateFormat);
//     var beforeUpdateData = await indexRepository.rawQuery(query);
//     beforeUpdateData = beforeUpdateData[0];

//     /* Creating update entry object */
//     const updateData = {
//         status: body.status,
//         updated_by: body.updated_by,
//         updated_at: new Date(),
//     };
//     /* Creating update entry object */

//     /**
//        *  + Call the update repository function
//        *    -Based on the status in update function response, segregate the response and prepare the response
//        *
//       */
//     const repositoryResponse = await indexRepository.update('reminder_referrables', condition, updateData);

//     // get reminder before data
//     var query = await getreminderDataQuery(condition.id, dateFormat);
//     var afterUpdateData = await indexRepository.rawQuery(query);
//     afterUpdateData = afterUpdateData[0];

//     /**Activity track */
//     activity = {
//         referrable_type: 27,
//         referrable_id: repositoryResponse.data[0].id,
//         action_type: 2, // 2 for update
//         created_by: body.created_by,
//     }
//     event.emit('configurationReminderActivity', { activity, beforeUpdateData, afterUpdateData });

//     return repositoryResponse;
// };

/**
 * Index function to retrieve self reminder configurations based on specified conditions.
 * 
 * Logic:
 * - Retrieve date format for consistent date handling.
 * - Define default variables including fields, joins, and condition.
 * - Call the find repository function to fetch reminder data from the 'reminder_referrables' table.
 * - If reminder data is retrieved successfully:
 *    ~ Initialize variables for responseData and totalDetails.
 *    ~ Iterate over totalDetails, and for each item:
 *      - Fetch reminder occurrence data using the find repository function from the 'reminder_occurances' table.
 *      - If reminder occurrence data is retrieved successfully, create an array of occurrence objects.
 *      - Fetch associated documents for each reminder detail using the find repository function from the 'reminder_documents' table.
 *      - Create a new listingObject with selected properties for each reminder detail.
 *      - Push the listingObject into the responseData array.
 *    ~ Return an object with status true and responseData.
 * - If there is an issue retrieving reminder data, return the result from the find repository function.
 * 
 * Note:
 *  - Consistent date formatting using the 'dateFormat'.
 *  - Utilizes the 'find' repository function for data retrieval.
 *  - Response includes an array of objects with specific properties for each self reminder configuration.
 * 
 * @param {Object} condition - The condition to filter reminder configurations.
 * @returns {Object} Repository response containing self reminder configurations.
 */
const index = async (condition) => {

    let dateFormat = await format.getDateFormat(); // date format

    /* Default variables */
    const fields = ['reminder_referrables.id as reminder_referrable_id', 'reminder_referrables.status', 'reminder_referrables.employee_ids', 'reminder_referrables.reminder_date', 'reminder_referrables.reminder_time', 'reminder_referrables.is_payroll_reminder', 'reminder_referrables.check_date', 'reminder_referrables.pay_config_setting_id', 'rc.name as name', 'rc.id', 'rc.slug', 'rc.referrable_type'];
    const joins = [
        { table: 'reminder_configurations as rc', alias: 'rc', condition: ['rc.id', 'reminder_referrables.reminder_name_id'], type: 'left' }

    ];
    /* Default variables */
    const reminderData = await indexRepository.find("reminder_referrables", fields, condition, null, joins);
    if (reminderData.status) {
        /* variables */
        const responseData = [];
        const totalDetails = reminderData.data;
        /* variables */

        // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.

        for (let item in totalDetails) {

            const reminderOccurenceData = await indexRepository.find("reminder_occurances", ['reminder_occurances.*'], { reminder_referrable_id: totalDetails[item].reminder_referrable_id }, null, [], null, 'id', 'asc');

            if (reminderOccurenceData.status) {
                var occurences = reminderOccurenceData.data
                occuranceObject = []
                for (let key in occurences) {
                    var reminderOccurance = {
                        id: occurences[key].id,
                        reminder_referrable_id: occurences[key].reminder_referrable_id,
                        occurance_order: occurences[key].occurance_order,
                        number: occurences[key].number,
                        cycle: occurences[key].cycle,
                        is_recurring: occurences[key].is_recurring,
                        recurring_days: occurences[key].recurring_days ? occurences[key].recurring_days : '',
                    }
                    occuranceObject.push(reminderOccurance)
                }
            }

            let empIds = []
            if (totalDetails[item].employee_ids != null) {
                for (const key in totalDetails[item].employee_ids) {
                    var empName = await indexRepository.find('employee', ['display_name'], { id: totalDetails[item].employee_ids[key] });
                    if (empName.status) {
                        obj = {
                            id: totalDetails[item].employee_ids[key],
                            value: empName.data[0].display_name
                        }
                        empIds.push(obj)
                    }
                }
            }
            // Fetch associated documents for each education detail
            var docData = await indexRepository.find('reminder_documents', ['id', 'document_name', 'document_url', 'document_status', 'document_path'], { reminder_name_id: totalDetails[item].id })
            /* creating a new object */
            const listingObject = {
                id: totalDetails[item].id,
                name: totalDetails[item].name,
                slug: totalDetails[item].slug,
                referrable_type: totalDetails[item].referrable_type,
                description: totalDetails[item].description ? totalDetails[item].description : '',
                reminder_referrable_id: totalDetails[item].reminder_referrable_id,
                check_date: totalDetails[item].check_date ? moment(totalDetails[item].check_date).format(dateFormat) : '',
                status: totalDetails[item].status,
                is_payroll_reminder: totalDetails[item].is_payroll_reminder,
                pay_config_setting_id: totalDetails[item].pay_config_setting_id ? totalDetails[item].pay_config_setting_id : '',
                employee_ids: empIds,
                reminder_time: totalDetails[item].reminder_time ? totalDetails[item].reminder_time : '',
                reminder_date: totalDetails[item].reminder_date ? moment(totalDetails[item].reminder_date).format(dateFormat) : '',
                reminders: occuranceObject,
                documents: docData.status ? docData.data : []
            };
            // pushing the object to the array
            responseData.push(listingObject);
        }
        return { status: true, data: responseData };
    } else {
        return reminderData;
    }
};

/**
 * Listing function to paginate and retrieve self reminder configurations based on specified conditions.
 * 
 * Logic:
 * - Retrieve date format for consistent date handling.
 * - Define default variables including fields, joins, and pagination parameters.
 * - Call the findByPagination repository function to paginate and fetch reminder data from the 'reminder_referrables' table.
 * - If reminder data is retrieved successfully:
 *    ~ Initialize variables for responseData and totalDetails.
 *    ~ Iterate over totalDetails, calculate the serial number, and for each item:
 *      - Fetch reminder occurrence data using the find repository function from the 'reminder_occurances' table.
 *      - If reminder occurrence data is retrieved successfully, create an array of occurrence objects.
 *      - Fetch associated documents for each reminder detail using the find repository function from the 'reminder_documents' table.
 *      - Create a new listingObject with selected properties for each reminder detail.
 *      - Push the listingObject into the responseData array.
 *    ~ Return an object with status true and responseData.
 * - If there is an issue retrieving reminder data, return the result from the findByPagination repository function.
 * 
 * Note:
 *  - Consistent date formatting using the 'dateFormat'.
 *  - Utilizes the 'findByPagination' repository function for paginated data retrieval.
 *  - Response includes an array of objects with specific properties for each paginated self reminder configuration.
 * 
 * @param {Object} condition - The condition to filter reminder configurations.
 * @param {number} page - The page number for pagination.
 * @param {number} limit - The number of items per page for pagination.
 * @returns {Object} Repository response containing paginated self reminder configurations.
 */
const listing = async (condition, page, limit) => {

    let dateFormat = await format.getDateFormat(); // date format

    /* Default variables */
    const fields = ['reminder_referrables.id as reminder_referrable_id', 'reminder_referrables.status', 'reminder_referrables.employee_ids', 'reminder_referrables.reminder_date', 'reminder_referrables.reminder_time', 'reminder_referrables.is_payroll_reminder', 'reminder_referrables.check_date', 'reminder_referrables.pay_config_setting_id', 'rc.name as name', 'rc.id', 'rc.slug', 'rc.referrable_type'];
    const joins = [
        { table: 'reminder_configurations as rc', alias: 'rc', condition: ['rc.id', 'reminder_referrables.reminder_name_id'], type: 'left' }

    ];
    /* Default variables */
    const reminderData = await indexRepository.findByPagination("reminder_referrables", fields, condition, joins, page, limit, 'rc.created_at', 'desc');
    if (reminderData.status) {
        /* variables */
        const responseData = [];
        let occuranceObject = []
        const totalDetails = reminderData.data;
        /* variables */

        // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
        let serialNo = (page - 1) * limit + 1;
        for (let item in totalDetails) {

            const reminderOccurenceData = await indexRepository.find("reminder_occurances", ['reminder_occurances.*'], { reminder_referrable_id: totalDetails[item].reminder_referrable_id }, null, [], null, 'id', 'asc');

            if (reminderOccurenceData.status) {
                var occurences = reminderOccurenceData.data
                
                for (let key in occurences) {
                    var reminderOccurance = {
                        id: occurences[key].id,
                        reminder_referrable_id: occurences[key].reminder_referrable_id,
                        occurance_order: occurences[key].occurance_order,
                        number: occurences[key].number,
                        cycle: occurences[key].cycle,
                        is_recurring: occurences[key].is_recurring,
                        recurring_days: occurences[key].recurring_days ? occurences[key].recurring_days : '',
                    }
                    occuranceObject.push(reminderOccurance)
                }
            }

            let empIds = []
            if (totalDetails[item].employee_ids != null) {
                for (const key in totalDetails[item].employee_ids) {
                    var empName = await indexRepository.find('employee', ['display_name'], { id: totalDetails[item].employee_ids[key] });
                    if (empName.status) {
                        obj = {
                            id: totalDetails[item].employee_ids[key],
                            value: empName.data[0].display_name
                        }
                        empIds.push(obj)
                    }
                }
            }

            // Fetch associated documents for each education detail
            var docData = await indexRepository.find('reminder_documents', ['id', 'document_name', 'document_url', 'document_status', 'document_path'], { reminder_name_id: totalDetails[item].id })
            /* creating a new object */
            const listingObject = {
                serial_no: serialNo,
                id: totalDetails[item].id,
                name: totalDetails[item].name,
                slug: totalDetails[item].slug,
                referrable_type: totalDetails[item].referrable_type,
                description: totalDetails[item].description ? totalDetails[item].description : '',
                reminder_referrable_id: totalDetails[item].reminder_referrable_id,
                check_date: totalDetails[item].check_date ? moment(totalDetails[item].check_date).format(dateFormat) : '',
                status: totalDetails[item].status,
                is_payroll_reminder: totalDetails[item].is_payroll_reminder,
                pay_config_setting_id: totalDetails[item].pay_config_setting_id ? totalDetails[item].pay_config_setting_id : '',
                employee_ids: empIds,
                reminder_time: totalDetails[item].reminder_time ? totalDetails[item].reminder_time : '',
                reminder_date: totalDetails[item].reminder_date ? moment(totalDetails[item].reminder_date).format(dateFormat) : '',
                reminders: occuranceObject,
                documents: docData.status ? docData.data : []
            };
            // pushing the object to the array
            responseData.push(listingObject);
            serialNo++;
        }
        return { status: true, data: responseData };
    } else {
        return reminderData;
    }
}

/**
 * Destroy function to soft delete self reminder configurations based on specified conditions.
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'db.transaction'.
 * - Create an object 'updateData' to set the 'updated_by', 'updated_at', and 'deleted_at' fields for the 'reminder_configurations' table.
 * - Create an object 'updatedData' to set the 'updated_by', 'updated_at', 'deleted_at', and 'status' fields for the 'reminder_referrables' table.
 * - Call the update repository function to soft delete the 'reminder_configurations' data based on the specified condition.
 * - Retrieve the 'referrable_id' from the response of the update function on 'reminder_referrables'.
 * - Call the update repository function to soft delete the 'reminder_referrables' data based on the retrieved 'referrable_id'.
 * - Call the update repository function to soft delete the 'reminder_occurances' data based on the retrieved 'referrable_id'.
 * - Call the update repository function to soft delete the 'reminder_documents' data based on the specified condition.
 * - Commit the database transaction if all database operations are successful.
 * - Track the deletion activity for the reminder.
 * - Emit an event to log the deletion activity.
 * - Return the response from the repository.
 * 
 * Note:
 *  - Utilizes the 'update' repository function for soft deletion.
 *  - Response includes the result of the update operation on 'reminder_configurations'.
 * 
 * @param {Object} body - The request body containing user details for activity tracking.
 * @param {Object} condition - The condition to filter self reminder configurations for deletion.
 * @returns {Object} Repository response containing the result of the update operation on 'reminder_configurations'.
 */
const destroy = async (body, condition) => {

    let trx;
    try {
        // Initialize a database transaction
        const db = await getConnection();
        trx = await db.transaction();

        /* Creating update entry object */
        const updateData = {
            updated_by: body.updated_by,
            updated_at: new Date(),
            deleted_at: new Date()
        };
        /* Creating update entry object */
        const updatedData = {
            updated_by: body.updated_by,
            updated_at: new Date(),
            deleted_at: new Date(),
            status: false
        };

        /**
           *  + Call the update repository function
           *    -Based on the status in update function response, segregate the response and prepare the response
           *
          */
        const repositoryResponse = await transactionRepository.update(trx, 'reminder_configurations', condition, updateData);
        var referrable_id = await transactionRepository.update(trx, 'reminder_referrables', { reminder_name_id: condition.id }, updatedData);
        await transactionRepository.update(trx, 'reminder_occurances', { reminder_referrable_id: referrable_id.data[0].id }, updateData);
        await transactionRepository.update(trx, 'reminder_documents', { reminder_name_id: condition.id }, updateData);

        // Commit the transaction
        await trx.commit();

        /**Activity track */
        const activity = {
            referrable_id: condition.id,
            referrable_type: 27,
            action_type: 3,
            created_by: body.created_by,
        };
        event.emit('configurationDeleteActivity', activity);
        /**Activity track */
        return repositoryResponse;

    } catch (error) {
        // Handle errors and rollback the transaction in case of an exception
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }

};

const updateStatus = async (body) => {
    let trx;
    try {

        // Databse connection
        const db = await getConnection();
        trx = await db.transaction();

        var remindersData = await indexRepository.update('reminders', { id: body.reminder_id }, { status: body.status });

        // Commit the transaction
        await trx.commit();

        return { status: true, data: remindersData.data };

    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

/**
 * Get Ledger Data Querry Including all the ledger_item_details, ledger_address based on the ledger_id
 */
async function getreminderDataQuery(reminderId, dateFormat) {

    return "select reminder_referrables.reminder_name_id, reminder_configurations.name, reminder_referrables.status, reminder_referrables.content, reminder_referrables.group_ids, reminder_referrables.employee_ids, reminder_referrables.reminder_time, TO_CHAR(reminder_referrables.reminder_date,' " + dateFormat + " ') as reminder_date, jsonb_agg(DISTINCT jsonb_build_object('id', reminder_occurances.id, 'reminder_referrable_id',reminder_occurances.reminder_referrable_id,'occurance_order', reminder_occurances.occurance_order, 'number', reminder_occurances.number, 'cycle', reminder_occurances.cycle, 'is_recurring', reminder_occurances.is_recurring, 'recurring_days', reminder_occurances.recurring_days)) AS reminders from reminder_referrables left join reminder_configurations on reminder_configurations.id = reminder_referrables.reminder_name_id left join reminder_occurances on reminder_referrables.id = reminder_occurances.reminder_referrable_id where reminder_referrables.id = '" + reminderId + "' group by reminder_referrables.id, reminder_configurations.name";
}

module.exports = { store, update, index, listing, destroy, updateStatus };
