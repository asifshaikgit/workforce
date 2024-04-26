const { sendMail } = require('../../../../../utils/emailSend')
const { getEmailTemplate } = require("../../../../../helpers/emailTemplate");
const moment = require('moment')
const { event } = require('../../../../../events/employeeSelfServiceActivityEvent');
const indexRepository = require("../../repositories/index")
const format = require('../../../../../helpers/format');
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');
const commonDocumentStore = require('../../../../../helpers/commonDocumentStore');
const { add } = require('winston');
const { generateEmployeeAvatar } = require('../../../../../helpers/globalHelper');
const { mailEvents } = require('../../../../../events/mailTemplateEvent/employeeSelfServiceMailEvent');


/**
 * Index function to retrieve details of Employee Self-Service records based on specified conditions.
 * 
 * Logic:
 * - Constructs the query conditions and fetches employee self-service records from the 'employee_self_services' table.
 * - If data is found:
 *   + Create an empty 'responseData' array.
 *   + Iterate over the 'total_details' and create a 'listingObject' for each record with selected properties.
 *   + Fetch and include information about assigned employees and related documents.
 *   + Return a response object with status 'true' and the 'responseData' array containing records.
 * - If no data is found:
 *   + Return the 'selfServicesData' response.
 *    
 * @param {Object} condition - The conditions to filter Employee Self-Service records.
 * @returns {Object} Response with Employee Self-Service details.
 */
const index = async (condition) => {

    /* Query Formation Conditions */
    // Table Name
    let tableName = 'employee_self_services';

    // Fields to fetch
    let fields = ['employee_self_services.*', 'create.display_name as create_emp', 'update.display_name as updated_emp', 'est.name as self_service_type_name', 'raised.display_name', 'ae.employee_id'];

    // Tables to join
    let joins = [
        { table: 'employee as create', alias: 'create', condition: ['employee_self_services.created_by', 'create.id'] },
        { table: 'employee as update', alias: 'update', condition: ['employee_self_services.updated_by', 'update.id'], type: "left" },
        { table: 'employee as raised', alias: 'raised', condition: ['employee_self_services.employee_id', 'raised.id'], type: "left" },
        { table: 'expense_and_service_types as est', alias: 'est', condition: ['employee_self_services.self_service_types_id', 'est.id'] },
        { table: 'assignee_employees as ae', alias: 'ae', condition: ['ae.referrable_id', 'employee_self_services.self_service_types_id'], type: "left", ignoreDeletedAt: true }
    ];
    /* Query Formation Conditions */

    var selfServicesData = await indexRepository.find(tableName, fields, condition, 0, joins);  // Fetching client communication address

    if (selfServicesData.status == true) {
        let dateFormat = await format.getDateFormat(); // date format

        /* Variables */
        var listingObject = '';
        var responseData = '';
        var total_details = selfServicesData.data;
        /* Variables */

        /* Using Map to iterate the loop and prepare the response */
        listingData = await total_details.map(async (item) => {

            // Fetch the assigne employees
            let fields = ['assignee_employees.id', 'assignee_employees.employee_id', 'create.display_name as employee_name'];
            let condition1 = { 'assignee_employees.referrable_id': item.self_service_types_id,  'assignee_employees.referrable_type' : 1, 'est.referrable_type' : 1 };
            let joins1 = [
                { table: 'employee as create', alias: 'create', condition: ['assignee_employees.employee_id', 'create.id'] },
                { table: 'expense_and_service_types as est', alias: 'est', condition: ['est.id', 'assignee_employees.referrable_id'] }
            ];
            var assigneeData = await indexRepository.find('assignee_employees', fields, condition1, 0, joins1, null, 'assignee_employees.id', 'ASC', false);
            if (assigneeData.status) {
                var assignees = assigneeData.data
            } else {
                var assignees = []
            }

            // Fetch Documents Information
            var docData = await indexRepository.find('employee_self_service_documents', ['id', 'document_url'], { employee_self_service_id: item.id }, 0, [], null, 'id', 'desc', false);
            var documentDetails = [];
            if (docData.status) {
                var documentDetails = docData.data
            }

            listingObject = {
                id: item.id,
                self_service_types_id: item.self_service_types_id,
                self_service_type_name: item.self_service_type_name,
                subject: item.subject,
                description: item.description,
                reference_id: item.reference_id,
                raised_employee_id: item.employee_id,
                raised_employee_name: item.display_name,
                raised_on: moment(item.raised_on).format(dateFormat),
                raised_on_time: moment(item.created_at).format('HH:mm'),
                new_self_service_status: item.new_self_service_status,
                assignee_employee_ids: assignees,
                email_id: item.email_id,
                raised_by: item.raised_by,
                created_by: (item.create_emp != null ? item.create_emp : 'System'),
                updated_by: (item.updated_emp != null ? item.updated_emp : ''),
                document: documentDetails
            };
            return listingObject;
        });
        /* Using Map to iterate the loop and prepare the response */

        /* Using promise to wait till the address map completes. */
        responseData = await Promise.all(listingData);
        /* Using promise to wait till the address map completes. */

        return { status: true, data: responseData[0] };
    } else {
        return selfServicesData;
    }
}

/**
 * Self Service Listing Function to get self service data.
 * Logic:
 * - Fetch the data from the 'employee_self_services' table using conditions (params) by calling the database function 'getSelfServiceListingInformation'.
 * - If data exists,
 *    + Map the data and add serial number to the objects.
 *    + Prepare the response with pagination details.
 *    + Return the response with status as true.
 * - Else
 *    + Return the response with status as false.
 *
 * @param {object} condition - The conditions to filter the self service data.
 * @param {string} dateFormat - The date format for formatting date values.
 * @param {number} page - The page number of the results to retrieve.
 * @param {number} limit - The maximum number of results per page.
 * @returns {object} - An object containing the retrieved self service data, pagination details, and status.
 */
const listing = async (condition, dateFormat, page, limit) => {

    let self_service_type_ids = await indexRepository.rawQuery(`Select ARRAY_AGG(referrable_id) as self_service_type_ids from assignee_employees where employee_id = '${condition.loginId}' AND referrable_type = 1`);
    self_service_type_ids = (self_service_type_ids && self_service_type_ids.length > 0 && self_service_type_ids[0]?.self_service_type_ids) ? self_service_type_ids[0]?.self_service_type_ids : [0];

    if (condition.received == 'true') {

        if (condition.self_service.length > 0 && self_service_type_ids.length > 0) {

            condition.self_service = condition.self_service.filter(element => self_service_type_ids.includes(element));
            condition.self_service = (condition.self_service.length > 0) ? condition.self_service : [0]
        } else {

            // If received is true get tickets assigned to logged in user
            condition.self_service = self_service_type_ids;
        }
    }

    condition.self_service = (condition.self_service && condition.self_service.length > 0) ? condition.self_service.toString() : null;
    let query = `SELECT * FROM getSelfServiceListingInformation(`;
    query += (condition.from_date && condition.to_date) ? `'${condition.from_date}', '${condition.to_date}',` : `${condition.from_date}, ${condition.to_date},`;
    query += (condition.raised !== null) ? `'${condition.raised}',` : `null,`;
    query += (condition.received !== null) ? `'${condition.received}',` : `null,`;
    query += (condition.employee !== null) ? `'${condition.employee}',` : `null,`;
    query += (condition.status !== null) ? `'${condition.status}',` : `${condition.status},`;
    query += (condition.self_service !== null) ? `'${condition.self_service}',` : `${condition.self_service},`;
    query += (condition.search !== null) ? `'${condition.search}',` : `${condition.search},`;
    query += `'${condition.loginId}',`;
    query += `'${dateFormat}', ${limit}, ${page})`;

    var listing = await indexRepository.rawQuery(query);
    if (listing) {
        const total_ess_count = listing[0]?.total_ess_count;
        listing.map(async (obj, index) => {
            obj.serial_no = index + 1;
            obj.profile_picture_url = (obj?.profile_picture_url) ? obj?.profile_picture_url : await generateEmployeeAvatar(obj);
            delete obj.gender;
            obj.gender = obj.raised_gender;
            obj.raised_profile_picture_url = (obj?.raised_profile_picture_url) ? obj?.raised_profile_picture_url : await generateEmployeeAvatar(obj);
            delete obj.raised_gender;
            delete obj.gender;
            delete obj.total_ess_count;
        });

        pagination_details = {
            total: total_ess_count,
            currentPage: page,
            perPage: limit,
            totalPages: (total_ess_count) ? Math.ceil(total_ess_count / limit) : 0
        }

        // Get the count of the received tickets with no initiated chat.
        const receivedCountQuery = `SELECT count(*) FROM employee_self_services WHERE self_service_types_id IN(${self_service_type_ids.toString()}) OR employee_id = '${condition.loginId}' AND id NOT IN(SELECT employee_self_service_id FROM employee_self_service_chat_messages)`;
        const raisedCountQuery = `SELECT count(*) FROM employee_self_services WHERE created_by = '${condition.loginId}' AND id NOT IN(SELECT employee_self_service_id FROM employee_self_service_chat_messages)`;
        var receivedCount = await indexRepository.rawQuery(receivedCountQuery)
        var raisedCount = await indexRepository.rawQuery(raisedCountQuery)

        return {
            status: true,
            data: listing,
            pagination_data: pagination_details,
            receivedCount: receivedCount?.[0]?.count,
            raisedCount: raisedCount?.[0]?.count
        }
    } else {
        return { status: false, data: listing }
    }
}

/**
 * Function to retrieve a paginated list of Employee Self Service data with activity tracking.
 *
 * Logic:
 * - Define the necessary joins to fetch data from related tables such as 'employee', 'expense_and_service_types', and more.
 * - Formulate query conditions for retrieving data from the 'employee_self_services' table.
 * - Use the 'indexRepository.findByPagination' function to perform the database query and fetch the required data.
 * - If data exists:
 *   + Create a 'responseData' array to store the structured response.
 *   + Iterate over the 'total_details' data and create a 'listingObject' for each record, including details such as self-service type, subject, description, and more.
 *   + Fetch assignee employees and document details associated with each self-service record.
 *   + Create a structured 'listingObject' for each record and add it to the 'responseData' array.
 *   + Retrieve and format activity logs from the 'configuration_activity_track' table.
 *   + Prepare a structured 'activity' response.
 *   + Return the response object with status true, 'responseData', 'activity' details, and pagination information.
 * - If no data is found, return the response object with status false and empty data.
 *
 * @param {Object} condition - The conditions to filter Employee Self Service data.
 * @param {number} page - The page number for paginating results.
 * @param {number} limit - The number of records per page.
 * @returns {Object} Response with paginated Employee Self Service data and activity logs.
 */

// const listing = async (condition, page, limit) => {

//     let joins;
//     // Tables to join
//     joins = [
//         { table: 'employee as create', alias: 'create', condition: ['employee_self_services.created_by', 'create.id'] },
//         { table: 'employee as update', alias: 'update', condition: ['employee_self_services.updated_by', 'update.id'], type: 'left' },
//         { table: 'employee as raised', alias: 'raised', condition: ['employee_self_services.employee_id', 'raised.id'], type: 'left' },
//         { table: 'expense_and_service_types as est', alias: 'est', condition: ['employee_self_services.self_service_types_id', 'est.id'], type: 'left' },
//         { table: 'assignee_employees as ssae', alias: 'ssae', condition: ['ssae.self_service_type_id', 'est.id'], type: 'left', ignoreDeletedAt: true }
//     ];
//     /* Query Formation Conditions */

//     // Table Name
//     let tableName = 'employee_self_services';

//     /* Query Formation Conditions */
//     // Fields to fetch
//     let fields = ['employee_self_services.*', 'create.display_name as create_emp', 'update.display_name as updated_emp', 'est.name as self_service_type_name', 'raised.display_name', 'est.assignee_employee_ids'];

//     var selfServicesData = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit);  // Fetching  self service information

//     if (selfServicesData.status) {

//         let dateFormat = await format.getDateFormat(); // date format

//         /* Variables */
//         var listingObject = [];
//         var responseData = [];
//         var total_details = selfServicesData.data;
//         var pagination_details = selfServicesData.pagination;
//         /* Variables */

//         /* Using Map to iterate the loop and prepare the response */
//         serial_no = (page - 1) * limit + 1;
//         for (let key in total_details) {
//             var item = total_details[key]

//             // Fetch the assigne employees
//             let fields = ['assignee_employees.id', 'assignee_employees.employee_id', 'create.display_name as employee_name'];
//             let condition1 = { 'assignee_employees.self_service_type_id': item.self_service_types_id };
//             let joins1 = [
//                 { table: 'employee as create', alias: 'create', condition: ['assignee_employees.employee_id', 'create.id'] },
//                 { table: 'expense_and_service_types as est', alias: 'est', condition: ['est.id', 'assignee_employees.self_service_type_id'] }
//             ];
//             var assigneeData = await indexRepository.find('assignee_employees', fields, condition1, 0, joins1, null, 'assignee_employees.id', 'ASC', false);
//             if (assigneeData.status) {
//                 var assignees = assigneeData.data
//             } else {
//                 var assignees = []
//             }

//             // Fetch Documents Information
//             var docData = await indexRepository.find('employee_self_service_documents', ['id', 'document_url'], { employee_self_service_id: item.id }, 0, [], null, 'id', 'asc', false);
//             var documentDetails = [];
//             if (docData.status) {
//                 var documentDetails = docData.data
//             }

//             listingObject = {
//                 serial_no: serial_no,
//                 id: item.id,
//                 self_service_types_id: item.self_service_types_id,
//                 self_service_type_name: item.self_service_type_name,
//                 subject: item.subject,
//                 description: item.description,
//                 reference_id: item.reference_id,
//                 raised_employee_id: item.employee_id,
//                 raised_employee_name: item.display_name,
//                 raised_on: moment(item.raised_on).format(dateFormat),
//                 raised_on_time: moment(item.created_at).format('HH:mm'),
//                 status: item.status,
//                 assignee_employee_ids: assignees,
//                 created_by: (item.create_emp != null ? item.create_emp : 'System'),
//                 updated_by: (item.updated_emp != null ? item.updated_emp : ''),
//                 document: documentDetails
//             };
//             serial_no++;
//             responseData.push(listingObject);
//         };
//         /* Using Map to iterate the loop and prepare the response */

//         return { status: true, data: responseData, pagination_data: pagination_details };
//     } else {
//         return { status: false, data: [], pagination_data: selfServicesData.pagination };
//     }
// };

/**
 * Store function to create a new Employee Self Service entry.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Fetch the count of existing records in 'employee_self_services'.
 * - Generate a reference ID for the new self-service record based on prefixes and the count.
 * - Define the destination folder for storing documents.
 * - Create an object 'employeeSelfData' with properties extracted from the request 'body'.
 * - Store the new self-service information in the 'employee_self_services' table within the transaction using 'transactionRepository.store'.
 * - Fetch additional details about the employee, such as first name, last name, display name, reference ID, and email.
 * - Send an email to the employee with relevant information and attachments.
 * - Create an object for storing the documents with details of the employee self-service record.
 * - Iterate through the 'documents' in the request 'body' and store each document in the specified destination folder using 'commonDocumentStore'.
 * - Fetch assignee employees for the self-service type and perform the following actions for each assignee:
 *    + Store room user data in the 'employee_self_service_chat_room' table.
 *    + Create a data object with relevant information and convert it to a JSON string.
 *    + Create a notification object with the JSON data and store it in the 'notifications' table (optional).
 * - Assign the raised employee to the room for chat communication.
 * - Emit an activity event to track the creation of the employee self-service record.
 * - Commit the transaction after successfully storing all data.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 *
 * @param {Object} body - The request body containing Employee Self Service details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        const count = await indexRepository.count('employee_self_services', [], [], false);

        // Generating the client refernce id based on prefixes
        const prefix = await indexRepository.find('prefixes', ['prefix_name', 'separator', 'number'], { slug: 'employee-self-service' });
        const prefixData = prefix.data[0];
        var reference_id = prefixData.prefix_name + prefixData.separator + (Number(count.data) + prefixData.number)

        const destFolder = `${body.loginSubDomainName}/Employee_Self_Services/${reference_id}`; // Path to store the documents

        /*  creating object to store*/
        let employeeSelfData = {
            self_service_types_id: body.self_service_types_id,
            subject: body.subject,
            description: body?.description || null,
            status: 'In Progress',
            reference_id: reference_id,
            employee_id: body.employee_id,
            raised_on: moment(new Date()).format('YYYY-MM-DD'),
            created_by: body.created_by,
            created_at: new Date()
        };
        /*  creating object to store*/

        var documents = body.documents;
        //store self-ticket details record in database

        var employeeSelfService = await transactionRepository.store(trx, 'employee_self_services', employeeSelfData);

        var employee = await indexRepository.find('employee', ['first_name', 'last_name', 'display_name', 'reference_id', 'email_id'], { id: body.employee_id }); // Consultant or Contractor details

        // for storing the documents
        for (const key in documents) {
            // fetch document details from temp document records
            if (documents[key].new_document_id != '' && documents[key].new_document_id != null) {
                var fileData = {
                    employee_self_service_id: employeeSelfService.data[0].id,
                    created_by: body.created_by,
                    created_at: new Date()
                };
                const documentDetails = await transactionRepository.store(trx, 'employee_self_service_documents', fileData); // store the 
                await commonDocumentStore(trx, 'employee_self_service_documents', destFolder, documents[key].new_document_id, documentDetails.data[0].id)
            }
        }

        // Fetch the assigne employees
        let fields = ['assignee_employees.id', 'assignee_employees.employee_id', 'create.display_name as employee_name', 'create.email_id'];
        let condition = { 'assignee_employees.referrable_id': body.self_service_types_id , 'assignee_employees.referrable_type' : 1, 'est.referrable_type' : 1 };
        let joins1 = [
            { table: 'employee as create', alias: 'create', condition: ['assignee_employees.employee_id', 'create.id'] },
            { table: 'expense_and_service_types as est', alias: 'est', condition: ['est.id', 'assignee_employees.referrable_id'] }
        ];
        var assigneeData = await indexRepository.find('assignee_employees', fields, condition, 0, joins1, null, 'assignee_employees.id', 'ASC', false);
        if (assigneeData.status) {
            var assignees = assigneeData.data
        } else {
            var assignees = []
        }

        /**
         * Iterates over the `assignees` object and performs the following actions for each key:
         * 1. Stores room user data in the 'employee_self_service_chat' index.
         * 2. Creates a data object with relevant information.
         * 3. Converts the data object to a JSON string.
         * 4. Creates a notification object with the JSON data.
         * 5. Stores the notification in the 'notifications' index.
         */
        // // assigning raised employee to the room
        // let roomEmployeeData = {
        //     employee_id: body.employee_id,
        //     room_id: employeeSelfService.data[0].id
        // }
        // await transactionRepository.store(trx, 'employee_self_service_chat_room', roomEmployeeData);

        // for (const key in assignees) {
        //     let roomUserData = {
        //         employee_id: assignees[key].employee_id,
        //         room_id: employeeSelfService.data[0].id
        //     }
        //     await transactionRepository.store(trx, 'employee_self_service_chat_room', roomUserData);

        //     const dataObject = {
        //         id: employeeSelfService.data[0].id,
        //         reference_id: employeeSelfService.data[0].reference_id,
        //         subject: employeeSelfService.data[0].subject,
        //         employee_name: employee.data[0].display_name,
        //         self_service_type: selfService.data[0].name
        //     }
        //     const dataJson = JSON.stringify(dataObject)

        //     let notification = {
        //         employee_id: assignees[key].employee_id,
        //         module_id: 7,
        //         data: dataJson,
        //         notification_type: 1,
        //         created_at: new Date()
        //     }
        //     // storing data in notifications for all assigned employees
        //     await transactionRepository.store(trx, 'notifications', notification);
        // }

        // employee self service track
        let activity = {
            employee_self_service_id: employeeSelfService.data[0].id,
            action_type: 1,
            created_by: body.created_by,
        }

        // calling the activity for employee self service store
        event.emit('employeeSelfServiceStoreActivity', activity);

        // Commit the transaction
        await trx.commit();
        // Commit the transaction

        employee = employee.data[0]
        var employeeSelReferenceID = employeeSelfData.reference_id

        // Emit an event to trigger sending a email
        mailEvents.emit('employeeSelfServicetMail',employee, employeeSelReferenceID, assignees);
    
        return employeeSelfService
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
};

/**
 * Update function to modify an existing Employee Self Service entry.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Fetch the existing self-service data before the update for activity tracking.
 * - Fetch the self-service data to be updated based on the provided 'condition'.
 * - Create an object 'updateData' with properties extracted from the request 'body' to perform the update.
 * - Perform the update operation in the 'employee_self_services' table within the transaction using 'transactionRepository.update'.
 * - Check if the 'self_service_types_id' in the updated data differs from the previous value:
 *   + Destroy the existing 'employee_self_service_chat_room'.
 *   + Fetch assignees based on the new 'self_service_types_id' and create chat rooms.
 *   + Optionally, create notifications for assignees (currently commented).
 * - Define the destination folder for storing documents.
 * - Iterate through the 'documents' in the request 'body':
 *   + If 'new_document_id' is provided and not null, update or create the document entry and store it using 'commonDocumentStore'.
 * - Handle deleted documents by removing them from the 'employee_self_service_documents' table.
 * - Commit the transaction after successfully updating the data.
 * - Fetch the self-service data after the update for activity tracking.
 * - Emit an activity event to track the update of the employee self-service record.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 *
 * @param {Object} body - The request body containing the updated Employee Self Service details.
 * @param {Object} condition - The condition to identify the record to be updated.
 * @returns {Object} Repository response.
 */
const update = async (body, condition) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        /* Fetching self service data after update for activity track */
        const beforeData = await getSelfServiceData(condition);

        var selfServiceData = await indexRepository.find('employee_self_services', ['*'], condition); // Fetching the entry before update to make sure all data are re assigned

        /* Creating update entry object */
        var updateData = {
            self_service_types_id: body.self_service_types_id,
            subject: body.subject,
            description: body.description,
            status: body.status,
            updated_by: body.updated_by,
            updated_at: new Date()
        };
        /* Creating update entry object */

        var repositoryResponse = await transactionRepository.update(trx, 'employee_self_services', condition, updateData);

        // var employee = await indexRepository.find('employee', ['first_name', 'last_name', 'display_name', 'reference_id'], { id: body.employee_id }); // Consultant or Contractor details

        // var selfService = await indexRepository.find('expense_and_service_types', ['name', 'id'], { id: body.self_service_types_id })  // Fetch the self service type information

        /**
         * Checks if the self service type ID of the first element in the selfServiceData array
         * is not equal to the self_service_types_id in the body object. If they are not equal,
         * it performs the following actions:
         * 1. Destroys the 'employee_self_service_chat' room with the given room_id.
         * 2. Retrieves the assignees data based on the self_service_types_id.
         * 3. Iterates through each assignee and performs the following actions:
         *    a. Creates a chat room for the assignee with the given self_service_type_id,
         *       employee_id, and room_id.
         *    b. Creates a dataObject with the necessary information.
         *    c. Converts the data
         */
        // if (selfServiceData.data[0].self_service_types_id != body.self_service_types_id) {

        //     // await transactionRepository.destroy(trx, 'employee_self_service_chat_room', { room_id: condition.id }); // delete the self service existing chat

        //     // Fetch the assigne employee
        //     let fields = ['assignee_employees.id', 'assignee_employees.employee_id', 'create.display_name as employee_name'];
        //     let condition1 = { 'assignee_employees.self_service_type_id': body.self_service_types_id };
        //     let joins1 = [
        //         { table: 'employee as create', alias: 'create', condition: ['assignee_employees.employee_id', 'create.id'] },
        //         { table: 'expense_and_service_types as est', alias: 'est', condition: ['est.id', 'assignee_employees.self_service_type_id'] }
        //     ];
        //     var assigneeData = await indexRepository.find('assignee_employees', fields, condition1, 0, joins1, null, 'assignee_employees.id', 'ASC', false);
        //     if (assigneeData.status) {
        //         var assignees = assigneeData.data
        //     } else {
        //         var assignees = []
        //     }
        // }
        /**
    * Iterates over the `assignees` object and performs the following actions for each key:
    * 1. Stores room user data in the 'employee_self_service_chat' index.
    * 2. Creates a data object with relevant information.
    * 3. Converts the data object to a JSON string.
    * 4. Creates a notification object with the JSON data.
    * 5. Stores the notification in the 'notifications' index.
    */
        // assigning raised employee to the room
        // let roomEmployeeData = {
        //     employee_id: body.employee_id,
        //     room_id: condition.id
        // }
        // await transactionRepository.store(trx, 'employee_self_service_chat_room', roomEmployeeData);

        // for (const key in assignees) {
        //     let roomUserData = {
        //         employee_id: assignees[key].employee_id,
        //         room_id: condition.id
        //     }
        //     await transactionRepository.store(trx, 'employee_self_service_chat_room', roomUserData);

        // const dataObject = {
        //     id: repositoryResponse.data[0].id,
        //     reference_id: repositoryResponse.data[0].reference_id,
        //     subject: repositoryResponse.data[0].subject,
        //     employee_name: employee.data[0].display_name,
        //     self_service_type: selfService.data[0].name
        // }
        // const dataJson = JSON.stringify(dataObject)

        // const notification = {
        //     employee_id: assigneeData[key].employee_id,
        //     module_id: 7,
        //     data: dataJson,
        //     notification_type: 2,
        //     created_at: new Date()
        // }
        // await transactionRepository.store(trx, 'notifications', notification)
        //     }
        // }

        const destFolder = `${body.loginSubDomainName}/Employee_Self_Services/${selfServiceData.data[0].reference_id}`; // Path to store the documents
        var documents = body.documents

        // updating the documents
        // looping the documents
        for (const key in documents) {
            if (documents[key].new_document_id != '' && documents[key].new_document_id != null) {

                if (documents[key].id != '' && documents[key].id != null) {
                    await commonDocumentStore(trx, 'employee_self_service_documents', destFolder, documents[key].new_document_id, documents[key].id)
                } else {
                    // Create a document object for mapping and store it in the 'employee_self_service_documents' table.
                    var fileData = {
                        employee_self_service_id: condition.id,
                        created_by: body.created_by,
                        created_at: new Date()
                    };
                    const documentDetails = await transactionRepository.store(trx, 'employee_self_service_documents', fileData); // store the 
                    await commonDocumentStore(trx, 'employee_self_service_documents', destFolder, documents[key].new_document_id, documentDetails.data[0].id)
                }

            }
        }

        //Deleting the documents information
        if (Array.isArray(body.deleted_documents_id)) {
            if (body.deleted_documents_id.length > 0) {
                for (const key in body.deleted_documents_id) {
                    await transactionRepository.destroy(trx, 'employee_self_service_documents', { id: body.deleted_documents_id[key] })
                }
            }
        }

        // // Create a new notification for consultant or contractors
        // const dataObject = {
        //     id: repositoryResponse.data[0].id,
        //     reference_id: repositoryResponse.data[0].reference_id,
        //     subject: repositoryResponse.data[0].subject,
        //     employee_name: employee.data[0].display_name,
        //     self_service_type: selfService.data[0].name
        // }
        // const dataJson = JSON.stringify(dataObject)
        // const notification = {
        //     employee_id: body.raised_employee_id,
        //     module_id: 7,
        //     data: dataJson,
        //     notification_type: 2,
        //     created_at: new Date()
        // }
        // await transactionRepository.store(trx, 'notifications', notification); // Store the notification

        // Commit the transaction
        await trx.commit();
        // Commit the transaction

        var afterData = await getSelfServiceData(condition); // Fetching the entry after update data

        // employee self service track
        let activity = {
            employee_self_service_id: condition.id,
            self_service_reference_id: selfServiceData.data[0].reference_id,
            action_type: 2,
            created_by: body.created_by,
        }

        // calling the activity for employee self service store
        event.emit('employeeSelfServiceUpdateActivity', { activity, beforeData, afterData });

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
 * Update function to modify an existing Employee Self Service Ticket entry.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Fetch the existing self-service data before the update for activity tracking.
 * - Create an object 'updateData' with properties extracted from the request 'body' to perform the update.
 * - Perform the update operation in the 'employee_self_services' table within the transaction using 'transactionRepository.update'.
 * - Commit the transaction after successfully updating the data.
 * - Fetch the self-service data after the update for activity tracking.
 * - Emit an activity event to track the update of the employee self-service ticket record.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 *
 * @param {Object} body - The request body containing the updated Employee Self Service Ticket details.
 * @param {Object} condition - The condition to identify the record to be updated.
 * @returns {Object} Repository response.
 */
const updateTicket = async (body, condition) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        /* Fetching self service data after update for activity track */
        const beforeData = await getSelfServiceData(condition);

        /* Creating update entry object */
        var updateData = {
            status: body.status,
            updated_by: body.updated_by,
            updated_at: new Date()
        };
        /* Creating update entry object */

        var repositoryResponse = await transactionRepository.update(trx, 'employee_self_services', condition, updateData);

        // Commit the transaction
        await trx.commit();
        // Commit the transaction

        var afterData = await getSelfServiceData(condition); // Fetching the entry after update data

        // employee self service track
        let activity = {
            employee_self_service_id: condition.id,
            self_service_reference_id: repositoryResponse.data[0].reference_id,
            action_type: 2,
            created_by: body.created_by,
        }

        // calling the activity for employee self service update
        event.emit('employeeSelfServiceUpdateActivity', { activity, beforeData, afterData });

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
 * Function to fetch Employee Self Service Ticket data based on a provided condition.
 *
 * Logic:
 * - Define the necessary joins to fetch data from related tables, specifically the 'expense_and_service_types' table.
 * - Use the 'indexRepository.find' function to retrieve data from the 'employee_self_services' table based on the provided 'condition'.
 * - Determine the status of the self-service ticket based on the 'status' field in the retrieved data.
 * - Fetch associated documents related to the self-service ticket from the 'employee_self_service_documents' table.
 * - Organize the retrieved data into a structured object for easier use.
 * - Return the structured object containing self-service ticket details.
 *
 * @param {Object} condition - The condition used to identify and fetch the relevant Employee Self Service Ticket record.
 * @returns {Object} An object containing the fetched self-service ticket details.
 */
const getSelfServiceData = async (condition) => {

    let joins = [{ table: 'expense_and_service_types as est', alias: 'est', condition: ['employee_self_services.self_service_types_id', 'est.id'] }]

    // Use the 'indexRepository.find' function to fetch placement details from the 'placements' table based on the provided 'condition'
    var selfServiceData = await indexRepository.find('employee_self_services', ['employee_self_services.*', 'est.name'], { 'employee_self_services.id': condition.id , 'est.referrable_type' : 1 }, null, joins);

    let document = []
    var documentData = await indexRepository.find('employee_self_service_documents', ['employee_self_service_documents.id', 'employee_self_service_documents.document_url', 'employee_self_service_documents.document_name'], { employee_self_service_id: condition.id })
    if (documentData.status) {

        for (let key in documentData.data) {
            let documentObject = {
                id: documentData.data[key].id,
                document_name: documentData.data[key].document_name,
                document_url: documentData.data[key].document_url,
            }
            document.push(documentObject)
        }
    }
    var selfObject = {
        'Self Service Type': selfServiceData.data[0].name,
        'Subject': selfServiceData.data[0].subject,
        'Description': selfServiceData.data[0].description,
        'Status': selfServiceData.data[0].status,
        'Document': document
    }
    return selfObject;
}

/**
 * Index function to retrieve details of Employee Self-Service records based on specified conditions.
 * 
 * Logic:
 * - Constructs the query conditions and fetches employee self-service records from the 'employee_self_services' table.
 * - If data is found:
 *   + Create an empty 'responseData' array.
 *   + Iterate over the 'total_details' and create a 'listingObject' for each record with selected properties.
 *   + Fetch and include information about assigned employees and related documents.
 *   + Return a response object with status 'true' and the 'responseData' array containing records.
 * - If no data is found:
 *   + Return the 'selfServicesData' response.
 *    
 * @param {Object} condition - The conditions to filter Employee Self-Service records.
 * @returns {Object} Response with Employee Self-Service details.
 */
const selfServiceEmployee = async (condition) => {

    /* Query Formation Conditions */
    // Table Name
    let tableName = 'expense_and_service_types';

    // Fields to fetch
    let fields = ['ae.id', 'ae.employee_id as employee_id', 'e.display_name'];

    // Tables to join
    let joins = [
        { table: 'assignee_employees as ae', alias: 'ae', condition: ['ae.referrable_id', 'expense_and_service_types.id'], type: "left", ignoreDeletedAt: true },
        { table: 'employee as e', alias: 'e', condition: ['e.id', 'ae.employee_id'], type: "left" }
    ];
    /* Query Formation Conditions */

    var selfServicesData = await indexRepository.find(tableName, fields, condition, 0, joins);  // Fetching client communication address

    if (selfServicesData.status == true) {

        /* Variables */
        var total_details = selfServicesData.data;
        /* Variables */

        return { status: true, data: total_details };
    } else {
        return selfServicesData;
    }
}

module.exports = { index, listing, store, update, updateTicket, selfServiceEmployee }
