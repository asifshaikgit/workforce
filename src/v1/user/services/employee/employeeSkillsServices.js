const { fetchAndMoveDocument, destroyDocument } = require('../../../../../helpers/globalHelper');
require('dotenv').config()
const moment = require('moment')
const config = require('../../../../../config/app')
const { event } = require('../../../../../events/employeeActivityEvent');
const indexRepository = require("../../repositories/index")
const format = require('../../../../../helpers/format');
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');
const commonDocumentStore = require('../../../../../helpers/commonDocumentStore');
const { getSkillDetails } = require('./commonService');

/**
 * Destroy function to delete an Employee Skills record based on provided conditions.
 * 
 * Logic:
 * - Establish a database transaction using 'getConnection()' and 'transaction'.
 * - Prepare the 'updateData' object to set the 'deleted_at', 'updated_at', and 'updated_by' timestamps.
 * - Call the 'transactionRepository.update' function within the transaction to update the employee skills record.
 * - Delete the associated documents in the 'employee_mapped_documents' table using the 'transactionRepository.update' function within the transaction.
 * - Retrieve the document data associated with the record to be deleted.
 * - Define the destination folder for storing employee skills documents.
 * - Call the 'destroyDocument' function to delete the associated documents, providing the document data and destination path.
 * - Commit the transaction after successfully updating the record and deleting documents.
 * - Trigger an activity event to track the deletion of the employee skills record.
 * - Return the response object with the status of the delete operation.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 * 
 * @param {Object} body - The request body containing information related to the employee skills record.
 * @param {Object} condition - The conditions to identify the employee skills record to be deleted.
 * @returns {Object} Response indicating the result of the delete operation.
 */
const destroy = async (body, condition) => {

  let trx;
  try {

    //databse connection
    const db = await getConnection();
    trx = await db.transaction()
    //databse connection

    var updateData = {
      deleted_at: new Date(),
      updated_at: new Date(),
      updated_by: body.updated_by
    }
    var repositoryResponse = await transactionRepository.update(trx, 'employee_skill_details', condition, updateData)

    //deleting in documents
    await transactionRepository.update(trx, 'employee_mapped_documents', { referrable_type_id: condition.id, referrable_type: 1 }, updateData);

    // deleting the file
    var docData = await indexRepository.find('employee_mapped_documents', ['*'], { referrable_type_id: condition.id, referrable_type: 1 });
    var _pathDest = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Skills`

    await destroyDocument(docData, _pathDest); // Destroy the existing document

    // commit the transaction
    await trx.commit();
    // commit the transaction

    /** Activity track */
    // Delete ChangeLog Object
    const changeLog = [
      {
        'label_name': 'Skill Name',
        'value': body.skill_name,
        'action_by': body.created_by
      }
    ];
    activity = {
      employee_id: body.employee_id,
      referrable_type_id: condition.id,
      activity_name: 'User Profile > Skills',
      change_log: JSON.stringify(changeLog),
      created_by: body.created_by,
    };

    event.emit("employeeDeleteActivity", { activity })
    /** Activity track */

    return { status: true, repositoryResponse }
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

/**
 * Index function to retrieve a list of Employee Skills Details based on the provided condition.
 * 
 * Logic:
 *   - Fetch Employee Skills Details from the 'employee_skill_details' table based on the provided condition and defined fields with specified joins.
 *   - If Skills Details data exists:
 *     + Create an empty 'responseData' array to structure the response.
 *     + Map the repository response data (employeeSkill.data) to 'total_details'.
 *     + Iterate through the 'total_details' and fetch associated documents using 'employee_mapped_documents' table.
 *     + Format the Skills Details and document information into listing objects.
 *     + Push listing objects into the 'responseData' array.
 *     + Return the response object with status true and the Skills Details in the 'responseData' array.
 *   - Else (data is not found):
 *     + Return the response object with status false and an empty data array.
 *    
 * @param {Object} condition - The conditions to filter Skills Details.
 * @returns {Object} Response with Employee Skills Details.
 */

const index = async (condition) => {

  /* Setting up the joins and conditions and sort and fields */
  const fields = ['employee_skill_details.id', 'employee_skill_details.employee_id', 'employee_skill_details.experience_years', 'employee_skill_details.certification', 'employee_skill_details.certification_date', 'employee_skill_details.certification_status', 'skills.name', 'skills.id as skill_id', 'employee_skill_details.expertise']; // fields to fetch
  const joins = [
    { table: 'skills as skills', alias: 'skills', condition: ['employee_skill_details.skill_id', 'skills.id'], type: 'left' }
  ];
  /* Setting up the joins and conditions and sort and fields */
  var employeeSkill = await indexRepository.find('employee_skill_details', fields, condition, 0, joins);

  if (employeeSkill.status) {

    let dateFormat = await format.getDateFormat(); // date format

    /* Variables */
    var total_details = employeeSkill.data;
    var responseData = []
    /* Variables */

    for (const key in total_details) {
      // Fetch associated documents for each education detail
      var docData = await indexRepository.find('employee_mapped_documents', ['id', 'document_name as name', 'document_url'], { referrable_type_id: total_details[key].id, referrable_type: 1 })

      const newItem = { new_document_id: '' }; // Adding this key to all documents related Index API's
      let updatedDocData;
      if (docData.status) {
        // Using the map method to add the new_document_id to each object
        updatedDocData = docData.data.map(obj => ({
          ...obj, // Copy the existing object's properties
          ...newItem // Add the new item
        }));
      }

      var tempObj = {
        skill_id: total_details[key].skill_id,
        id: total_details[key].id,
        skill_name: total_details[key].name,
        certification: total_details[key].certification,
        expertise: total_details[key].expertise,
        certification_date: (total_details[key].certification_date ? moment(total_details[key].certification_date).format(dateFormat) : ''),
        certification_status: total_details[key].certification_status ? 1 : 0,
        experience_years: total_details[key].experience_years ? Number(total_details[key].experience_years) : '',
        documents: docData.status ? updatedDocData : []
      };
      responseData.push(tempObj)
    }

    return {
      status: true,
      data: responseData
    }

  } else {
    return { status: false, data: [] };
  }
};


/**
 * Store function to create and store employee skill information.
 *
 * Logic:
 * - Database connection: Establish a database connection and start a transaction.
 * - Define the destination folder path for storing documents.
 * - Create a new skill object with data from the request body.
 * - Store the new skill information in the 'employee_skill_details' table within the transaction.
 * - Iterate through documents and check if a new document ID exists.
 *    + If found, create a document object for mapping and store it in the 'employee_mapped_documents' table.
 *    + Store the document in the specified destination folder and update the document mapping.
 * - Commit the transaction.
 * - Emit an activity event to track the employee skill creation.
 * - Return the response with the status and stored skill information.
 *
 * Notes:
 * - Exception handling using try-catch.
 *
 * @param {Object} body - The request body containing skill information and related documents.
 * @returns {Object} - An object with the status and stored skill information.
 *   - status: Indicates if the operation was successful (true) or encountered an error (false).
 *   - skillsList: Contains the stored skill information.
 *   - error: Contains an error message in case of an exception.
 */

const store = async (body) => {

  let trx;
  try {

    //databse connection
    const db = await getConnection();
    trx = await db.transaction()
    //databse connection

    const destFolder = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Skills`

    var newSkills = {
      employee_id: body.employee_id,
      skill_id: body.skill_id,
      experience_years: (body.experience_years != '' ? body.experience_years : null),
      certification: body.certification,
      certification_date: (body.certification_date != '' ? body.certification_date : null),
      expertise: (body.expertise ? body.expertise : ''),
      certification_status: body.certification_status ? body.certification_status : null,
      created_by: body.created_by,
      created_at: new Date()
    }

    var skillsList = await transactionRepository.store(trx, 'employee_skill_details', newSkills); // store the employee education information

    var documents = body.documents
    for (const key in documents) {
      if (documents[key].new_document_id != '') { // Check if a new document ID exists.

        // Create a document object for mapping and store it in the 'employee_mapped_documents' table.
        var documentObject = {
          referrable_type: 1, //Set referrable type to indicate skill documents.
          referrable_type_id: skillsList.data[0].id,
          created_by: body.created_by,
          created_at: new Date()
        }
        var documentData = await transactionRepository.store(trx, 'employee_mapped_documents', documentObject)

        // Store the document in the specified destination folder and update the document mapping.
        await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documentData.data[0].id)
      }
    }

    await trx.commit();

    /**Activity track */
    // Create ChangeLog Object
    const changeLog = [
      {
        'label_name': 'Skill Name',
        'value': body.skill_name,
        'action_by': body.created_by,
        'action_type': 1
      }
    ];
    activity = {
      employee_id: body.employee_id,
      referrable_type_id: skillsList.data[0].id,
      activity_name: 'User Profile > Skills',
      change_log: JSON.stringify(changeLog),
      created_by: body.created_by
    };
    event.emit('employeeStoreActivity', { activity });
    /**Activity track */

    return { status: true, skillsList }
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};


/**
 * Update function to modify an existing Employee Skill record.
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Define default variables, including 'isDocumentUpdate' to track whether documents have been updated.
 * - Create an 'updateData' object containing properties extracted from the request 'body' for the modified Employee Skill entry.
 * - Fetch the existing Employee Skill data before the update for later comparison.
 * - Call the 'transactionRepository.update' function to apply the 'updateData' changes to the 'employee_skill_details' table within the transaction.
 * - Define the destination folder for storing updated documents.
 * - Iterate through the 'documents' in the request 'body' and process each document:
 *   - If the 'new_document_id' is not empty:
 *     - If 'document_id' is not empty:
 *       - Call the 'commonDocumentStore()' function to store the document in the specified destination folder and update the document mapping.
 *     - Else:
 *       - Store the document mapping in the 'employee_mapped_documents' table.
 *       - Call the 'commonDocumentStore()' function to store the document in the specified folder and update the document mapping.
 * - Commit the transaction after successfully updating all data.
 * - Fetch the updated Employee Skill data after the update.
 * - Trigger an activity event to log the update, capturing both the state of the data before and after the update.
 * - Return a response with information about the updated Employee Skill record or an error message in case of an exception.
 * 
 * @param {Object} body - The request body containing the modified Employee Skill record.
 * @param {Object} condition - The condition specifying which Employee Skill entry to update.
 * @returns {Object} A response object indicating the status of the operation and any error messages.
 */

const update = async (body, condition) => {

  let trx;
  try {

    //databse connection
    const db = await getConnection();
    trx = await db.transaction()
    //databse connection

    /* Default variable */
    var isDocumentUpdate = false
    /* Default variable */

    /* storeing update entry object */
    var updateData = {
      skill_id: body.skill_id,
      experience_years: (body.experience_years != '' ? body.experience_years : null),
      certification: body.certification,
      certification_date: (body.certification_date != '' ? body.certification_date : null),
      certification_status: body.certification_status ? body.certification_status : null,
      expertise: (body.expertise ? body.expertise : ''),
      updated_by: body.updated_by,
      updated_at: new Date()
    }

    /** Employee skill data before update */
    const beforeUpdateData = await getSkillDetails({ 'employee_skill_details.id': condition.id }, isDocumentUpdate)
    /** Employee skill data before update */

    const destFolder = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Skills` // destination folder

    var repositoryResponse = await transactionRepository.update(trx, 'employee_skill_details', condition, updateData); // update the employee education information

    var documents = body.documents // Get the document data from the request body.
    for (const key in documents) {
      if (documents[key].new_document_id != null && documents[key].new_document_id != '') { // Check if a new document ID exists and is not null.

        if (documents[key].id != null && documents[key].id != '' && documents[key].id) { // Check if an existing document ID exists.
          // Store the document in the specified folder and update the document mapping.
          await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documents[key].id)
          isDocumentUpdate = true // Set the document update flag to true.
        } else {
          var documentObject = {
            referrable_type: 1, // skill documents
            referrable_type_id: condition.id,
            created_by: body.created_by,
            created_at: new Date()
          }

          // Store the new document in the mapping table.
          var documentData = await transactionRepository.store(trx, 'employee_mapped_documents', documentObject)
          // Store the document in the specified folder and update the document mapping.
          await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documentData.data[0].id)
          isDocumentUpdate = true // Set the document update flag to true.
        }
      }
    }

    // transaction commit
    await trx.commit();
    // transaction commit

    /**Activity track */
    activity = {
      employee_id: body.employee_id,
      activity_name: 'User Profile > Skills',
      referrable_type_id: condition.id,
      isDocumentUpdate: isDocumentUpdate,
      created_by: body.created_by,
      slug: 'skills_update'
    };
    event.emit('employeeUpdateActivity', { activity, beforeUpdateData });

    return { status: true, repositoryResponse }
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

/**
 * Delete Document function to remove an associated document from a Skill record.
 *
 * Logic:
 * - Prepare 'updateData' to set 'deleted_at', 'updated_at', and 'updated_by'.
 * - Retrieve the document data based on the provided 'condition' using 'employee_mapped_documents' table.
 * - Define the destination path for storing the document.
 * - Call the 'destroyDocument' function to delete the associated document file, providing document data and the destination path.
 * - Update the document metadata in the 'employee_mapped_documents' table to mark it as deleted.
 * 
 * @param {Object} body - The request body containing information related to the skill record.
 * @param {Object} condition - The conditions to identify the document to be deleted.
 * @returns {void}
 */
const deleteDocument = async (body, condition) => {

  /* Default variables */
  var isSkillDocument = false
  /* Default variables */

  /* Fetching personal document data before update for activity track */
  const beforeUpdateData = await getSkillDocumentDetails(condition, isSkillDocument)

  var updateData = {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by
  }

  var docData = await indexRepository.find('employee_mapped_documents', ['*'], condition);
  var _pathDest = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Skills`
  await destroyDocument(docData, _pathDest)
  await indexRepository.update('employee_mapped_documents', condition, updateData)// Update the documents informations
  isSkillDocument = true
  /* Fetching personal document data after update for activity track */
  const afterUpdateData = await getSkillDocumentDetails(condition, isSkillDocument)

  /** Activity track */
  activity = {
    employee_id: body.employee_id,
    referrable_type: 14,
    referrable_type_id: body.employee_skill_id,
    action_type: 2,
    created_by: body.created_by,
  };

  event.emit('employeeUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /** Activity track */

  return
}

const getSkillDocumentDetails = async (condition, isPersonalDocument) => {

  var responseData = await indexRepository.find('employee_mapped_documents', ['*'], condition);
  responseData = responseData.data[0];
  const personalDocsDetails = {
    'Skills Document': isPersonalDocument,
  };

  return personalDocsDetails
}


module.exports = { destroy, index, store, update, deleteDocument };
