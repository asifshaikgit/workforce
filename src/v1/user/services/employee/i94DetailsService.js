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
const { getI94Details } = require('./commonService');
const inviteEmployeeCommonPath = '/Employee/Invite-Employee-Document/';

/**
 * Store function to create a new Employee I-94 Details entry.
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Define the destination folder for storing documents.
 * - Create an object 'newI94Details' with properties extracted from the request 'body' for the new Employee I-94 Details entry.
 * - Call the 'transactionRepository.store' function to add 'newI94Details' to the 'employee_i94_details' table within the transaction.
 * - Loop through the 'documents' in the request 'body' and process each document:
 *    + If the 'new_document_id' is not empty, create an object 'documentObject' for the document mapping and store it.
 *    + Call the 'commonDocumentStore()' function to store the document in the specified destination folder and update the document mapping.
 * - Commit the transaction after successfully storing all data.
 * - Return the response from the database operation.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 * 
 * @param {Object} body - The request body containing Employee I-94 Details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {
  let trx;
  try {
    //databse connection
    const db = await getConnection();
    trx = await db.transaction()

    const destFolder = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/I94`

    var newI94Details = {
      employee_id: body.employee_id,
      valid_from: body.valid_from ? body.valid_from : null,
      expiry_type: body.expiry_type ? body.expiry_type : null,
      valid_till: body.valid_till ? body.valid_till : null,
      document_number: body.document_number ? body.document_number : null,
      status: body.status ? body.status : 0,
      country_id: body.country_id ? body.country_id : null,
      created_at: new Date(),
      created_by: body.created_by
    }

    var documents = body.documents
    var i94Details = await transactionRepository.store(trx, 'employee_i94_details', newI94Details)

    for (const key in documents) {

      if (documents[key].new_document_id != '' && documents[key].slug == 'invite_via_link') {
        if (documents[key].document_url.includes(inviteEmployeeCommonPath)) {

          var documentObject = {
            referrable_type: 4, // i-94 documents
            referrable_type_id: i94Details.data[0].id,
            created_by: body.created_by,
            created_at: new Date()
          }
          const documentData = await transactionRepository.store(trx, 'employee_mapped_documents', documentObject);

          // Move the file from invite via link employee folder structure to employee documents folder structure.
          await moveInviteViaLinkDocument(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documentData.data[0].id, body.loginSubDomainName);
        }
      }

      if (documents[key].slug == undefined || documents[key].slug == '') {
        if (documents[key].new_document_id != '') {

          var documentObject = {
            referrable_type: 4, // i-94 documents
            referrable_type_id: i94Details.data[0].id,
            created_by: body.created_by,
            created_at: new Date()
          }
          var documentData = await transactionRepository.store(trx, 'employee_mapped_documents', documentObject);
          await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documentData.data[0].id)
        }
      }
    }

    await trx.commit();

    /**Activity track */
    // Create ChangeLog Object
    const changeLog = [
      {
        'label_name': 'I94 Number',
        'value': body.document_number,
        'action_by': body.created_by,
        'action_type': 1
      }
    ];
    activity = {
      employee_id: body.employee_id,
      referrable_type_id: i94Details.data[0].id,
      activity_name: 'User Profile > Documents > Work Autorization > I94',
      change_log: JSON.stringify(changeLog),
      created_by: body.created_by
    };
    event.emit('employeeStoreActivity', { activity });
    /**Activity track */

    return i94Details
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

/**
 * Update function to modify an existing Employee I-94 Details entry.
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Create an object 'updateData' with properties extracted from the request 'body' to update the Employee I-94 Details entry.
 * - Call the 'transactionRepository.update' function to update the entry in the 'employee_i94_details' table within the transaction.
 * - Define the destination folder for storing documents.
 * - Loop through the 'documents' in the request 'body' and process each document:
 *    + If 'new_document_id' is not empty and an 'id' is present, call 'commonDocumentStore()' to update the document.
 *    + If 'new_document_id' is not empty and 'id' is not present, create a new document mapping and call 'commonDocumentStore()'.
 * - Commit the transaction after successfully updating all data.
 * - Return the response from the database operation.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 * 
 * @param {Object} body - The request body containing the Employee I-94 Details to update.
 * @param {Object} condition - The condition to locate the entry to update.
 * @returns {Object} Repository response.
 */
const update = async (body, condition) => {
  let trx;
  try {
    //databse connection
    const db = await getConnection();
    trx = await db.transaction()

    /* Default variables */
    var isI9dDocument = false
    /* Default variables */

    const beforeUpdateData = await getI94Details(condition, isI9dDocument); // Fetching the before update data

    /* storeing update entry object */
    var updateData = {
      valid_from: body.valid_from ? body.valid_from : null,
      expiry_type: body.expiry_type ? body.expiry_type : null,
      valid_till: body.valid_till ? body.valid_till : null,
      document_number: body.document_number ? body.document_number : null,
      status: body.status ? body.status : 0,
      country_id: body.country_id ? body.country_id : null,
      updated_by: body.updated_by,
      updated_at: new Date()
    }
    /* storeing update entry object */

    /**
     *  + Call the update repository function
     *    -Based on the status in update function response, segregate the response and prepare the response
     *
     */
    var repositoryResponse = await transactionRepository.update(trx, 'employee_i94_details', condition, updateData)

    const destFolder = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/I94`

    var documents = body.documents
    for (const key in documents) {
      if (documents[key].new_document_id != null && documents[key].new_document_id != '') {
        if (documents[key].id != null && documents[key].id != '' && documents[key].id) {
          await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documents[key].id)
          isI9dDocument = true
        } else {
          var documentObject = {
            referrable_type: 4, // i-94 documents
            referrable_type_id: condition.id,
            created_by: body.created_by,
            created_at: new Date()
          }

          var documentData = await transactionRepository.store(trx, 'employee_mapped_documents', documentObject) // Store the document information
          await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documentData.data[0].id)
        }
      }
    }

    // transaction commit
    await trx.commit();

    /**Activity track */
    activity = {
      employee_id: body.employee_id,
      activity_name: 'User Profile > Documents > Work Autorization > I94',
      referrable_type_id: condition.id,
      isDocumentUpdate: isI9dDocument,
      created_by: body.created_by,
      slug: 'i94'
    };
    event.emit('employeeUpdateActivity', { activity, beforeUpdateData });

    //Delete documents
    if (body?.documents_deleted_ids?.length > 0) {
      for (const key in body.documents_deleted_ids) {
        await deleteDocument(body, { id: body.documents_deleted_ids[key] })
      }
    }

    return repositoryResponse
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

/**
 * Index function to retrieve Employee I-94 Details based on the provided condition.
 * 
 * Logic:
 *   - Set up the fields to fetch from the 'employee_i94_details' table, including country name.
 *   - Fetch employee I-94 details from the 'employee_i94_details' table based on the provided condition with selected fields.
 *   - If employee I-94 data exists:
 *     + Create an empty 'responseData' array to structure the response.
 *     + Map the repository response data (employeei94.data) to 'total_details'.
 *     + Iterate through the total_details, format date values, and create listing objects for each I-94 detail.
 *     + Retrieve associated documents for each I-94 detail from the 'employee_mapped_documents' table.
 *     + Push listing objects into the 'responseData' array.
 *     + Return the response object with status true and the I-94 details in the 'responseData' array.
 *   - Else (data is not found):
 *     + Return a response object with status false and an empty data array.
 *    
 * @param {Object} condition - The conditions to filter I-94 details.
 * @returns {Object} Response with Employee I-94 Details.
 */
const index = async (condition) => {
  /**
   * Calling a  index function.
   * Based on the status in the function response, prepare the response and return to controller
   *
  */
  const joins = [
    { table: 'countries as countries', alias: 'countries', condition: ['employee_i94_details.country_id', 'countries.id'], type: 'left' },
  ];
  var employeei94 = await indexRepository.find('employee_i94_details', ['employee_i94_details.*', 'countries.name as country_name'], condition, null, joins);

  if (employeei94.status) {

    let dateFormat = await format.getDateFormat(); // date format

    var total_details = employeei94.data;

    /* Variables */
    var responseData = []
    /* Variables */

    for (const obj in total_details) {
      const docDataFields = ['id', 'document_name as name', 'document_url', 'document_status']
      var docData = await indexRepository.find('employee_mapped_documents', docDataFields, { referrable_type_id: total_details[obj].id, referrable_type: 4 })

      const newItem = { new_document_id: '' }; // Adding this key to all documents related Index API's
      let updatedDocData;
      if (docData.status) {
        // Using the map method to add the new_document_id to each object
        updatedDocData = docData.data.map(obj => ({
          ...obj, // Copy the existing object's properties
          ...newItem // Add the new item
        }));
      }

      var i94Details = {
        id: total_details[obj].id,
        valid_from: total_details[obj].valid_from ? moment(total_details[obj].valid_from).format(dateFormat) : '',
        expiry_type: total_details[obj].expiry_type ? total_details[obj].expiry_type : '',
        valid_till: total_details[obj].valid_till ? moment(total_details[obj].valid_till).format(dateFormat) : '',
        document_number: total_details[obj]?.document_number || '',
        status: total_details[obj].status,
        country_id: total_details[obj]?.country_id || '',
        country_name: total_details[obj]?.country_name || '',
        label: total_details[obj].status == 1 ? 'Active' : 'Expired',
        documents: docData.status ? updatedDocData : []
      }
      responseData.push(i94Details)
    }
    return { status: true, data: responseData };
  } else {
    return { status: false, data: [] };
  }
};

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
 * - Call 'transactionRepository.update' to update the 'employee_i94_details' entry with the 'updateData'.
 * - Call 'transactionRepository.destroy' to delete the document mappings associated with the entry.
 * - Commit the transaction after successful deletion.
 * - Return the response from the database operation.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 * 
 * @param {Object} body - The request body containing the data for deletion.
 * @param {Object} condition - The condition to locate the entry to delete.
 * @returns {Object} Repository response.
 */
const destroy = async (body, condition) => {
  let trx;
  try {
    //databse connection
    const db = await getConnection();
    trx = await db.transaction()

    /* storeing delete entry object */
    var updateData = {
      deleted_at: new Date(),
      updated_at: new Date(),
      updated_by: body.updated_by
    }
    /* storeing delete entry object */
    var documentCondition = { referrable_type_id: condition.id, referrable_type: 4 }
    const fields = ['id', 'document_name as name', 'document_url', 'document_status', 'description']
    var docData = await indexRepository.find('employee_mapped_documents', fields, documentCondition)

    var _pathDest = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/I94`

    await destroyDocument(docData.data, _pathDest)
    var repositoryResponse = await transactionRepository.update(trx, 'employee_i94_details', condition, updateData)
    await transactionRepository.destroy(trx, 'employee_mapped_documents', documentCondition)

    await trx.commit();

    /**Activity track */
    const changeLog = [
      {
        'label_name': 'I94',
        'value': body.document_number,
        'action_by': body.created_by,
        'action_type': 3
      }
    ];
    activity = {
      employee_id: body?.employee_id,
      activity_name: 'User Profile > Documents > Work Autorization > I94',
      change_log: JSON.stringify(changeLog),
      created_by: body?.created_by
    };
    event.emit('employeeDeleteActivity', { activity });

    return repositoryResponse
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

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
  // const beforeUpdateData = {
  //   'I-94 Document': false,
  // };

  let docData = await indexRepository.find('employee_mapped_documents', ['id'], condition);
  let _pathDest = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Personal-Documents`;
  await destroyDocument(docData, _pathDest);
  const response = await indexRepository.update('employee_mapped_documents', condition, updateData);

  /* Fetching personal document data after update for activity track */
  // const afterUpdateData = {
  //   'I-94 Document': true,
  // };

  // /** Activity track */
  // activity = {
  //   employee_id: body.employee_id,
  //   referrable_type: 4,
  //   referrable_type_id: condition.id,
  //   action_type: 3,
  //   created_by: body.created_by,
  // };
  // event.emit('employeeUpdateActivity', { activity, beforeUpdateData, afterUpdateData });

  return response;
};

module.exports = { destroy, index, store, update, deleteDocument };
