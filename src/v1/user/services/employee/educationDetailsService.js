const { destroyDocument } = require('../../../../../helpers/globalHelper')
const commonDocumentStore = require('../../../../../helpers/commonDocumentStore')
require('dotenv').config();
const moment = require('moment')
const config = require('../../../../../config/app')
const { event } = require('../../../../../events/employeeActivityEvent');
const indexRepository = require("../../repositories/index")
const format = require('../../../../../helpers/format');
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');
const moveInviteViaLinkDocument = require('../../../../../helpers/moveInviteViaLinkDocument');
const inviteEmployeeCommonPath = '/Employee/Invite-Employee-Document/';

/**
 * Store function to create a new Employee Education Details entry.
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Define the destination folder for storing documents.
 * - Create an object 'newEducation' object with properties extracted from the request 'body'.
 * - Call the 'transactionRepository.store' function to add 'newEducation' to the 'employee_education_details' table within the transaction.
 * - Loop through the 'documents' in the request 'body' and process each document:
 *    + If the 'new_document_id' is not empty, create an object 'documentObject' for the document mapping and store in 'employee_mapped_documents' table.
 *    + Call the 'commonDocumentStore()' function to store the document in the specified destination folder and update the document mapping.
 * - Commit the transaction after successfully storing all data.
 * - Trigger an activity event for creating a new education record.
 * - Return the response from the database operation.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 * 
 * @param {Object} body - The request body containing Employee Education Details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {
  let trx;
  try {

    // Database connection: Establish a database connection and start a transaction
    const db = await getConnection();
    trx = await db.transaction();
    let documentsCount = 0;

    // Define the destination folder path for storing documents.
    const destFolder = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Educations`

    // Create a new education object with data from the request body.
    var newEducation = {
      employee_id: body.employee_id,
      created_by: body.created_by,
      created_at: new Date()
    }

    // Store the new education information in the 'employee_education_details' table within the transaction.
    var educationData = await transactionRepository.store(trx, 'employee_education_details', newEducation); // store the employee education information

    var documents = body.documents
    for (const key in documents) {

      if (documents[key].new_document_id != '' && documents[key].slug == 'invite_via_link') {

        if (documents[key].document_url.includes(inviteEmployeeCommonPath)) {

          var documentObject = {
            referrable_type: 2, //Set referrable type to indicate education documents.
            referrable_type_id: educationData.data[0].id,
            created_by: body.created_by,
            created_at: new Date()
          }
          const documentData = await transactionRepository.store(trx, 'employee_mapped_documents', documentObject);

          // Move the file from invite via link employee folder structure to employee documents folder structure.
          await moveInviteViaLinkDocument(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documentData.data[0].id, body.loginSubDomainName);
        }
      }

      if (documents[key].new_document_id != '' && (!documents[key]?.hasOwnProperty('slug') || documents[key].slug == '')) { // Check if a new document ID exists.

        // Create a document object for mapping and store it in the 'employee_mapped_documents' table.
        var documentObject = {
          referrable_type: 2, //Set referrable type to indicate education documents.
          referrable_type_id: educationData.data[0].id,
          created_by: body.created_by,
          created_at: new Date()
        }
        var documentData = await transactionRepository.store(trx, 'employee_mapped_documents', documentObject)

        // Store the document in the specified destination folder and update the document mapping.
        await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documentData.data[0].id);
        documentsCount++;
      }
    }

    // transaction commit
    await trx.commit();

    if (documentsCount > 0) {

      /**Activity track */
      const changeLog = [
        {
          'label_name': 'Education Documents',
          'value': documentsCount,
          'action_by': body.created_by,
          'action_type': 1,
          'slug': 'document'
        }
      ];
      activity = {
        employee_id: body.employee_id,
        referrable_type_id: documentData.data[0].id,
        activity_name: 'User Profile > Documents > Education Documents',
        change_log: JSON.stringify(changeLog),
        created_by: body.created_by
      };
      event.emit('employeeStoreActivity', { activity });
      /**Activity track */
    }

    // Return the response with information about the stored education record.
    return educationData
  } catch (error) {
    // Handle errors and rollback the transaction if necessary.
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message }; // Return an error response in case of an exception.
  }
};

/**
 * Update function to modify an existing Employee Education Details entry.
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Define default variables, including 'isEducationDocument' to track whether documents have been updated.
 * - Create an 'updateData' object containing properties extracted from the request 'body' for the modified Education Details entry.
 * - Fetch the existing Education Details data before the update for later comparison.
 * - Call the 'transactionRepository.update' function to apply the 'updateData' changes to the 'employee_education_details' table within the transaction.
 * - Define the destination folder for storing updated documents.
 * - Iterate through the 'documents' in the request 'body' and process each document:
 *    + If the 'new_document_id' is not empty:
 *      ~ If 'document_id' is not empty:
 *        - Call the 'commonDocumentStore()' function to store the document in the specified destination folder and update the document mapping
 *      ~ Else:
 *        - Store the document mapping in the 'employee_mapped_documents' table.
 *        - Call the 'commonDocumentStore()' function to store the document in the specified destination folder and update the document mapping.
 * - Commit the transaction after successfully updating all data.
 * - Fetch the updated Education Details data after the update.
 * - Trigger an activity event to log the update, capturing both the state of the data before and after the update.
 * - Return the response from the database operation.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 * 
 * @param {Object} body - The request body containing the modified Employee Education Details.
 * @param {Object} condition - The condition specifying which Education Details entry to update.
 * @returns {Object} Repository response.
 */
const update = async (body, condition) => {
  let trx;
  try {
    // Database connection: Establish a database connection and start a transaction.
    const db = await getConnection();
    trx = await db.transaction();
    let newDocumentsCount = 0;
    let deletedDocumentsCount = 0;

    /**Default variable */
    var isEducationDocument = false
    /**Default variable */

    /* storing update entry object */
    var updateData = {
      employee_id: body.employee_id,
      updated_by: body.updated_by,
      updated_at: new Date()
    }
    /* storing update entry object */

    // Update the employee education information in the 'employee_education_details' table within the transaction.
    var repositoryResponse = await transactionRepository.update(trx, 'employee_education_details', condition, updateData); // update the employee education information

    // Define the destination folder path for storing updated documents.
    const destFolder = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Educations`

    var documents = body.documents // Get the document data from the request body.  

    for (const key in documents) {
      if (documents[key].new_document_id != null && documents[key].new_document_id != '') { // Check if a new document ID exists and is not null.

        if (documents[key].id != null && documents[key].id != '' && documents[key].id) { // Check if an existing document ID exists.
          // Store the document in the specified folder and update the document mapping.
          await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documents[key].id)
          isEducationDocument = true // Set the document update flag to true.
        } else {
          var documentObject = {
            referrable_type: 2, // education documents
            referrable_type_id: condition.id,
            created_by: body.created_by,
            created_at: new Date()
          }

          // Store the new document in the mapping table.
          var documentData = await transactionRepository.store(trx, 'employee_mapped_documents', documentObject)
          // Store the document in the specified folder and update the document mapping.
          await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documentData.data[0].id)
          isEducationDocument = true
        }
        newDocumentsCount++;
      }
    }

    // transaction commit
    await trx.commit();

    //Delete documents
    if (body?.documents_deleted_ids?.length > 0) {
      for (const key in body.documents_deleted_ids) {
        deletedDocumentsCount++;
        await deleteDocument(body, { id: body.documents_deleted_ids[key] })
      }
    }

    /**Activity Track */
    let changeLog = [];
    const addActionLog = (count, action) => {
      if (count > 0) {
        changeLog.push({
          label_name: (count > 1) ? 'Education Documents' : 'Education Document',
          value: count,
          action_by: body.created_by,
          action_type: action,
          slug: 'document'
        });
      }
    };

    addActionLog(newDocumentsCount, 1); // Adding log for new documents
    addActionLog(deletedDocumentsCount, 3); // Adding log for deleted documents

    if (changeLog && changeLog.length > 0) {
      const activity = {
        employee_id: body.employee_id,
        activity_name: 'User Profile > Documents > Education Documents',
        change_log: JSON.stringify(changeLog),
        created_by: body.created_by
      };

      event.emit('employeeStoreActivity', { activity });
    }
    /**Activity Track */

    // Return the response with information about the updated education record.
    return repositoryResponse;
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    // Return an error response in case of an exception.
    return { status: false, error: error.message };
  };
}

/**
 * Education Activity Tracking function to retrieve information about an Employee's Education Details.
 * 
 * Logic:
 * - Obtain the date format using the 'getDateFormat()' function.
 * - Define the list of fields to fetch from the database
 * - Specify the joins between the 'employee_education_details' table and related tables such as 'education_levels', 'states', and 'countries'.
 * - Fetch the Employee's Education Details from 'employee_education_details' table based on the provided condition, fields, and joins using the 'indexRepository.find' function.
 * - Map the fetched data to 'educationDetails'
 * - Create an 'educationData' object with key-value pairs representing attributes like 'Education Level', 'Field of Study', 'University Name', 'Start Date', 'End Date', 'State', 'Country', and 'Document'.
 * - Return the 'educationData' object.
 * 
 * @param {Object} condition - The condition specifying which Education Details to retrieve.
 * @param {boolean} isEducationDocument - A flag indicating whether documents related to the Education Details have been updated.
 * @returns {Object} An object containing formatted Employee Education Details for activity tracking.
 */
const educationActivityTrack = async (condition, isEducationDocument) => {
  // Retrieve the date format to format date values
  let dateFormat = await format.getDateFormat();

  // Define the fields to be fetched from the database
  const fields = ['employee_education_details.field_of_study', 'employee_education_details.university_name', 'employee_education_details.start_date', 'employee_education_details.end_date', 'education_levels.name as education_level', 'countries.name as country_name', 'states.name as state_name']; // fields to fetch
  // Specify table joins to retrieve additional information (education level, state, country)
  const joins = [
    { table: 'education_levels as education_levels', alias: 'education_levels', condition: ['employee_education_details.education_level_id', 'education_levels.id'], type: 'left' },
    { table: 'states as states', alias: 'states', condition: ['employee_education_details.state_id', 'states.id'], type: 'left' },
    { table: 'countries as countries', alias: 'countries', condition: ['countries.id', 'employee_education_details.country_id'], type: 'left' },
  ];

  // Fetch education details from the 'employee_education_details' table based on the provided condition, fields, joins
  var educationDetails = await indexRepository.find('employee_education_details', fields, { 'employee_education_details.id': condition.id }, 1, joins)
  // Extract education details
  educationDetails = educationDetails.data[0]

  // Structure the education data for reporting
  const educationData = {
    'Education Level': educationDetails.education_level,
    'Field of study': educationDetails.field_of_study,
    'University Name': educationDetails.university_name,
    'Start Date': moment(educationDetails.start_date).format(dateFormat),
    'End Date': educationDetails.end_date ? moment(educationDetails.end_date).format(dateFormat) : '-',
    'State': educationDetails.state_name,
    'Country ': educationDetails.country_name,
    'Educational Document': isEducationDocument
  }

  // Return the formatted education data
  return educationData
}

/**
 * Index function to retrieve Employee Education Details based on the provided condition.
 * 
 * Logic:
 *   - Fetch Employee Education Details from the 'employee_education_details' table based on the provided condition and defined fields with specified joins.
 *   - If Education Details data exists:
 *     + Create an empty 'responseData' array to structure the response.
 *     + Map the repository response data (educationDetails.data) to 'total_details'.
 *     + Iterate through the 'total_details' and fetch associated documents using 'employee_mapped_documents' table.
 *     + Format the Education Details and document information into listing objects.
 *     + Push listing objects into the 'responseData' array.
 *     + Return the response object with status true and the Education Details in the 'responseData' array.
 *   - Else (data is not found):
 *     + Return the response object from the repository with the status indicating the absence of data.
 *    
 * @param {Object} condition - The conditions to filter Education Details.
 * @returns {Object} Response with Employee Education Details.
 */
const index = async (condition) => {
  let responseData = {
    id: "",
    employee_id: condition['employee_education_details.employee_id'],
    documents: []
  }

  /* Setting up the joins and conditions and sort and fields */
  const fields = ['employee_education_details.id as education_details_id', 'employee_education_details.employee_id', 'employee_education_details.education_level_id', 'employee_education_details.field_of_study', 'employee_education_details.university_name', 'employee_education_details.start_date', 'employee_education_details.end_date', 'employee_education_details.state_id', 'employee_education_details.country_id', 'education_levels.name as education_level', 'countries.name as country_name', 'states.name as state_name']; // fields to fetch
  const joins = [
    { table: 'education_levels as education_levels', alias: 'education_levels', condition: ['education_level_id', 'education_levels.id'], type: 'left' },
    { table: 'states as states', alias: 'states', condition: ['employee_education_details.state_id', 'states.id'], type: 'left' },
    { table: 'countries as countries', alias: 'countries', condition: ['countries.id', 'employee_education_details.country_id'], type: 'left' },
  ];

  // Fetch education details from the 'employee_education_details' table based on the provided condition, fields, joins
  var educationDetails = await indexRepository.find('employee_education_details', fields, condition, 0, joins)
  if (educationDetails.status) {
    /* Variables */
    var total_details = educationDetails.data;
    /* Variables */

    // Iterate through retrieved education details
    for (const key in total_details) {
      // Fetch associated documents for each education detail
      var docData = await indexRepository.find('employee_mapped_documents', ['id', 'document_name as name', 'document_url'], { referrable_type_id: total_details[key].education_details_id, referrable_type: 2 })

      const newItem = { new_document_id: '' }; // Adding this key to all documents related Index API's
      let updatedDocData = [];
      if (docData.status) {
        // Using the map method to add the new_document_id to each object
        let num = 1
        for (let obj in docData.data) {
          let doc = {
            ...docData.data[obj],
            ...newItem
          }
          updatedDocData.push(doc)
          num++;
        }
      }

      // Prepare a structured object for each education detail
      responseData = {
        id: total_details[key].education_details_id,
        employee_id: total_details[key].employee_id,
        documents: updatedDocData
      }
      // Add the structured education detail object to the response data array
      //responseData.push(tempObj)
    }
  }
  // Return the response object with status true and the formatted education details
  return { status: true, data: responseData }
}

/**
 * Destroy function to delete an Employee Education Detail record based on provided conditions.
 * 
 * Logic:
 *   - Retrieve documents associated with the education detail using 'employee_mapped_documents' and specified 'documentCondition'.
 *   - Define the destination folder for storing education documents.
 *   - Call the 'destroyDocument' function to delete the associated documents, providing the document data and destination path.
 *   - Prepare the 'updateData' object to set the 'deleted_at' and 'updated_at' timestamps and 'updated_by'.
 *   - Update the employee education detail record in the 'employee_education_details' table using the provided 'condition' and 'updateData'.
 *   - Delete the associated documents from the 'employee_mapped_documents' table based on the 'documentCondition'.
 *   - Trigger an activity event to track the deletion of the education record.
 *   - Return the response object from the database operation.
 * 
 * @param {Object} body - The request body containing information related to the education record.
 * @param {Object} condition - The conditions to identify the education record to be deleted.
 * @returns {Object} Response indicating the result of the delete operation.
 */
const destroy = async (body, condition) => {

  /* Define the conditions to find associated documents based on the provided education detail ID */
  var documentCondition = { referrable_type_id: condition.id, referrable_type: 2 }

  /* Retrieve the documents associated with the education detail to be deleted */
  var docData = await indexRepository.find('employee_mapped_documents', ['*'], documentCondition)

  /* Define the path for destroying the document information */
  var _pathDest = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Educations`

  /* Call the 'destroyDocument' function to delete the associated documents */
  await destroyDocument(docData, _pathDest); // Destroy the document information

  /* Define data for updating the education detail to mark it as deleted */
  var updateData = {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by
  }

  /* Call the 'update' method from educationDetailsRepository to update the education detail with deletion information */
  var repositoryResponse = await indexRepository.update('employee_education_details', condition, updateData)

  /* Delete the associated documents from the 'employee_mapped_documents' table */
  await indexRepository.destroy('employee_mapped_documents', documentCondition)

  /** Activity track */
  const changeLog = [
    {
      'label_name': 'Education Documents',
      'value': 'All',
      'action_by': body.created_by,
      'action_type': 3,
      'slug': 'document'
    }
  ];
  activity = {
    employee_id: body?.employee_id,
    activity_name: 'User Profile > Documents > Education Documents',
    change_log: JSON.stringify(changeLog),
    created_by: body?.created_by
  };
  event.emit("employeeDeleteActivity", { activity });
  /**Activity track */

  /* Return the repository response indicating the status of the deletion operation */
  return repositoryResponse
};

const deleteDocument = async (body, condition) => {

  /* Define the conditions to find associated documents based on the provided education detail ID */
  var documentCondition = { id: condition.id, referrable_type: 2 }

  /* Retrieve the documents associated with the education detail to be deleted */
  var docData = await indexRepository.find('employee_mapped_documents', ['*'], documentCondition)

  /* Define the path for destroying the document information */
  var _pathDest = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Educations`

  /* Call the 'destroyDocument' function to delete the associated documents */
  await destroyDocument(docData, _pathDest); // Destroy the document information

  /* Delete the associated documents from the 'employee_mapped_documents' table */
  const response = await indexRepository.destroy('employee_mapped_documents', documentCondition)

  /* Return the repository response indicating the status of the deletion operation */
  return response
};

module.exports = { destroy, index, store, update, deleteDocument };
