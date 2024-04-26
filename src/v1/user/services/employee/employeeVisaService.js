const indexRepository = require('../../repositories/index');
const { fetchAndMoveDocument, destroyDocument } = require('../../../../../helpers/globalHelper')
const commonDocumentStore = require('../../../../../helpers/commonDocumentStore')
require('dotenv').config();
const moment = require('moment')
const config = require('../../../../../config/app')
const { event } = require('../../../../../events/employeeActivityEvent');
const format = require('../../../../../helpers/format');
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');
const moveInviteViaLinkDocument = require('../../../../../helpers/moveInviteViaLinkDocument');
const inviteEmployeeCommonPath = '/Employee/Invite-Employee-Document/';
const { getVisaDetails } = require('./commonService');

/**
 * Store function to create a new Employee Visa Details entry.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Create an object 'newVisa' with properties extracted from the request 'body'.
 * - Call the 'transactionRepository.store' function to store the new visa information in the 'employee_visa_details' table within the transaction.
 * - Define the destination folder for storing documents.
 * 
 * - Check if 'visa_document_upload_id' is provided in the request.
 *   + Fetch document details from temporary document records (in 'temp_upload_documents') using the provided 'visa_document_upload_id'.
 *   + Count the number of records in 'employee_visa_details' with a similar 'visa_document_name'.
 *   + Generate a unique file name for the document by appending the count.
 *   + Move the document file to the specified destination folder ('destFolder') and retrieve the new file name.
 *   + Create an object ('fileData') that contains information about the stored document, including its name, URL, path, and status.
 *   + Call the 'transactionRepository.update' function and update the 'employee_visa_details' record with the document information.
 *   + Call the ''transactionRepository.detory'funtion to remove the temporary document record (from 'temp_upload_documents' table) as it is no longer needed after the document has been successfully processed.
 * 
 * - Check if 'i9document_upload_id' is provided in the request.
 *   + Fetch document details from temporary document records (in 'temp_upload_documents') using the provided 'i9document_upload_id'.
 *   + Count the number of records in 'employee_visa_details' with a similar 'i9_document_name'.
 *   + Generate a unique file name for the I-9 document by appending the count.
 *   + Move the I-9 document file to the specified destination folder ('destFolder') using the generated unique file name.
 *   + Create an object ('fileData') that contains information about the stored I-9 document, including its name, URL, path, and status.
 *   + Update the 'employee_visa_details' record with the I-9 document information by calling 'transactionRepository.update'.
 *   + Remove the temporary document record (from 'temp_upload_documents') as it is no longer needed after the I-9 document has been successfully processed. 
 * 
 * - Loop through 'support_documents' in the request 'body' and process each document:
 *    + If 'visa_document_upload_id' is not empty, create a document object for mapping and store it in the 'employee_visa_detail_documents' table.
 *    + Call the 'commonDocumentStore()' function to store the document in the specified destination folder and update the document mapping.
 * - Commit the transaction after successfully storing all data.
 * - Trigger an activity event for creating a new visa record.
 * - Return the response with information about the stored visa record.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 *
 * @param {Object} body - The request body containing Employee Visa Details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {
  let trx;
  try {
    //databse connection
    const db = await getConnection();
    trx = await db.transaction()

    var newVisa = {
      employee_id: body.employee_id,
      visa_type_id: body.visa_type_id ? body.visa_type_id : null,
      valid_from: body.valid_from ? moment(body.valid_from).format('YYYY-MM-DD') : null,
      valid_till: body.valid_till ? moment(body.valid_till).format('YYYY-MM-DD') : null,
      created_by: body.created_by,
      created_at: new Date()
    }

    // Visa Documents Information storing in employee_visa_detail_documents
    let visaDetails = await transactionRepository.store(trx, 'employee_visa_details', newVisa)

    const destFolder = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Visa Documents/${visaDetails.data[0].id}`

    // Visa Supporting Documents Information storing in employee_visa_detail_documents
    var supportDocuments = body.support_documents
    for (const key in supportDocuments) {

      if (supportDocuments[key].visa_document_upload_id != '' && supportDocuments[key].slug == 'invite_via_link') {

        if (supportDocuments[key].document_url.includes(inviteEmployeeCommonPath)) {

          var documentObject = {
            employee_visa_details_id: visaDetails.data[0].id,
            created_by: body.created_by,
            created_at: new Date()
          }
          const documentData = await transactionRepository.store(trx, 'employee_visa_detail_documents', documentObject);

          // Move the file from invite via link employee folder structure to employee documents folder structure.
          await moveInviteViaLinkDocument(trx, 'employee_visa_detail_documents', destFolder, supportDocuments[key].visa_document_upload_id, documentData.data[0].id, body.loginSubDomainName);
        }
      }

      if ((!supportDocuments[key]?.hasOwnProperty('slug') || supportDocuments[key].slug == '') && supportDocuments[key].visa_document_upload_id != '' && supportDocuments[key].visa_document_upload_id != null) {

        // Create a document object for mapping and store it in the 'employee_visa_detail_documents' table.
        var documentObject = {
          employee_visa_details_id: visaDetails.data[0].id,
          created_by: body.created_by,
          created_at: new Date()
        }
        var documentData = await transactionRepository.store(trx, 'employee_visa_detail_documents', documentObject)

        // Store the document in the specified destination folder and update the document mapping.
        await commonDocumentStore(trx, 'employee_visa_detail_documents', destFolder, supportDocuments[key].visa_document_upload_id, documentData.data[0].id)
      }
    }

    await trx.commit();

    /**Activity track */
    const changeLog = [
      {
        'label_name': 'Visa Type',
        'value': body.visa_type_name,
        'action_by': body.created_by,
        'action_type': 1
      }
    ];
    activity = {
      employee_id: body.employee_id,
      referrable_type_id: visaDetails.data[0].id,
      activity_name: 'User Profile > Documents > Work Autorization > Visa',
      change_log: JSON.stringify(changeLog),
      created_by: body.created_by
    };
    event.emit('employeeStoreActivity', { activity });
    /**Activity track */

    return visaDetails
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};


/**
 * Update function to modify an existing Employee Visa Details entry.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Fetch the existing Employee Visa Details data before the update.
 * - Prepare the 'updateData' object with properties extracted from the request 'body'.
 * - Call the 'transactionRepository.update' function to update the Employee Visa Details in the 'employee_visa_details' table within the transaction.
 * - Define the destination folder for storing documents.
 * 
 * - Check if 'visa_document_upload_id' is provided in the request.
 *   + Fetch document details from temporary document records (in 'temp_upload_documents') using the provided 'visa_document_upload_id'.
 *   + Count the number of records in 'employee_visa_details' with a similar 'visa_document_name'.
 *   + Generate a unique file name for the document by appending the count.
 *   + Move the document file to the specified destination folder ('destFolder') and retrieve the new file name.
 *   + Create an object ('fileData') that contains information about the stored document, including its name, URL, path, and status.
 *   + Call the 'transactionRepository.update' function and update the 'employee_visa_details' record with the document information.
 *   + Call the 'destroyDocument' function to remove the existing document path.
 *   + Remove the temporary document record (from 'temp_upload_documents') as it is no longer needed after the document has been successfully processed.
 * 
 * - Check if 'i9document_upload_id' is provided in the request.
 *   + Fetch document details from temporary document records (in 'temp_upload_documents') using the provided 'i9document_upload_id'.
 *   + Count the number of records in 'employee_visa_details' with a similar 'i9_document_name'.
 *   + Generate a unique file name for the I-9 document by appending the count.
 *   + Move the I-9 document file to the specified destination folder ('destFolder') using the generated unique file name.
 *   + Create an object ('fileData') that contains information about the stored I-9 document, including its name, URL, path, and status.
 *   + Update the 'employee_visa_details' record with the I-9 document information by calling 'transactionRepository.update'.
 *   + Call the 'destroyDocument' function to remove the existing I-9 document path.
 *   + Remove the temporary document record (from 'temp_upload_documents') as it is no longer needed after the I-9 document has been successfully processed. 
 * 
 * - Loop through 'support_documents' in the request 'body' and process each document:
 *    + If 'visa_document_upload_id' is not empty:
 *      - If 
 *       ~ create a document object for mapping and store it in the 'employee_visa_detail_documents' table.
 *       ~ If document 'id'is not empty:
 *          + update the document object in the 'employee_visa_detail_documents' table
 *          + Call the 'commonDocumentStore' function to store the document in the specified destination folder and update the document mapping.
 *       ~ Else :
 *          + store the document object in the 'employee_visa_detail_documents' table
 *          + Call the 'commonDocumentStore' function to store the document in the specified destination folder and update the document mapping.
 * - Commit the transaction after successfully updating all data.
 * - Fetch the updated Employee Visa Details data after the update.
 * - Trigger an activity event for updating the visa record.
 * - Return the response with the updated repository response.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 *
 * @param {Object} body - The request body containing Employee Visa Details for updating.
 * @param {Object} condition - The condition to identify the Employee Visa Details to be updated.
 * @returns {Object} Repository response.
 */
const update = async (body, condition) => {

  let trx;
  try {

    //databse connection
    const db = await getConnection();
    trx = await db.transaction()
    //databse connection

    /* Default variables */
    var isSupportingDocument = false
    /* Default variables */

    /**Fetching employee visa details before update */
    const beforeUpdateData = await getVisaDetails({ 'employee_visa_details.id': condition.id }, isSupportingDocument)
    /**Fetching employee visa details before update */

    /* storeing update entry object */
    var updateData = {
      visa_type_id: body.visa_type_id ? body.visa_type_id : null,
      valid_from: body.valid_from ? body.valid_from : null,
      valid_till: body.valid_till ? body.valid_till : null,
      updated_by: body.updated_by,
      updated_at: new Date()
    }

    var repositoryResponse = await transactionRepository.update(trx, 'employee_visa_details', condition, updateData)

    /* storeing update entry object */

    /**
     *  + Call the update repository function
     *    -Based on the status in update function response, segregate the response and prepare the response
     *
     */
    const destFolder = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Visa Documents/${condition.id}`

    // Visa Supporting Documents Information storing
    var supportDocuments = body.support_documents
    for (const key in supportDocuments) {
      if (supportDocuments[key].visa_document_upload_id != '' && supportDocuments[key].visa_document_upload_id != null) {

        if (supportDocuments[key].id != '' && supportDocuments[key].id != null) {
          let documentObject = {
            updated_by: body.updated_by,
            updated_at: new Date()
          }
          await transactionRepository.update(trx, 'employee_visa_detail_documents', { id: supportDocuments[key].id }, documentObject)
          await commonDocumentStore(trx, 'employee_visa_detail_documents', destFolder, supportDocuments[key].visa_document_upload_id, supportDocuments[key].id)
          isSupportingDocument = true

        } else {
          // Create a document object for mapping and store it in the 'employee_visa_detail_documents' table.
          let documentObject = {
            employee_visa_details_id: condition.id,
            created_by: body.created_by,
            created_at: new Date()
          }
          var documentData = await transactionRepository.store(trx, 'employee_visa_detail_documents', documentObject)

          // Store the document in the specified destination folder and update the document mapping.
          await commonDocumentStore(trx, 'employee_visa_detail_documents', destFolder, supportDocuments[key].visa_document_upload_id, documentData.data[0].id);
          isSupportingDocument = true
        }
      }
    }

    // transaction commit
    await trx.commit();
    // transaction commit

    //Delete visa support documents
    if (body?.support_documents_deleted_ids?.length > 0) {
      body.employee_visa_details_id = condition.id;
      for (const key in body.support_documents_deleted_ids) {
        await deleteDocument(body, { id: body.support_documents_deleted_ids[key] })
      }
    }

    /**Activity track */
    activity = {
      employee_id: body.employee_id,
      referrable_type_id: repositoryResponse.data[0].id,
      activity_name: 'User Profile > Documents > Work Authorization > Visa',
      created_by: body.created_by,
      slug: 'work_autorization_visa',
      isDocumentUpdate: isSupportingDocument
    };
    event.emit('employeeUpdateActivity', { activity, beforeUpdateData });
    /**Activity track */

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
 * Index function to retrieve Employee Visa Details based on the provided condition.
 * 
 * Logic:
 * - Define default variables such as 'fields' and 'joins' to specify which data to fetch and related tables to join.
 * - Fetch Employee Visa Details from the 'employee_visa_details' table based on the provided condition, fields, and joins using the 'indexRepository.find' function.
 * - If Visa Details data exists:
 *   + Create an empty 'responseData' array to structure the response.
 *   + Map the repository response data (employeeVisa.data) to 'total_details'.
 *   + Iterate through the 'total_details' and fetch associated Supporting Documents using 'employee_visa_detail_documents' table.
 *   + Format the Visa Details and document information into listing objects.
 *   + Push listing objects into the 'responseData' array.
 *   + Return the response object with status true and the Visa Details in the 'responseData' array.
 * - Else (data is not found):
 *   + Return a response object with status false and an empty data array.
 *    
 * @param {Object} condition - The conditions to filter Visa Details.
 * @returns {Object} Response with Employee Visa Details.
 */
const index = async (condition) => {

  /* Default variables */
  const fields = ['employee_visa_details.id as visa_details_id', 'employee_visa_details.*', 'visa_types.name as visa_type_name'];
  const joins = [
    { table: 'visa_types', condition: ['employee_visa_details.visa_type_id', 'visa_types.id'], type: 'left' },
  ];
  /* Default variables */

  var employeeVisa = await indexRepository.find('employee_visa_details', fields, condition, null, joins);
  if (employeeVisa.status) {
    var total_details = employeeVisa.data;
    /* Variables */
    var responseData = [];

    let dateFormat = await format.getDateFormat(); // date format

    for (const obj in total_details) {
      var SupportingDocData = await indexRepository.find('employee_visa_detail_documents', ['employee_visa_detail_documents.id', 'employee_visa_detail_documents.document_name', 'employee_visa_detail_documents.document_url'], { employee_visa_details_id: total_details[obj].visa_details_id }, null)

      let docInfor = [];
      if (SupportingDocData.status) {
        for (let key in SupportingDocData.data) {
          let abc = {
            id: SupportingDocData.data[key].id,
            new_document_id: '', // Adding a dummy key for FE team rendering purposes
            document_name: SupportingDocData.data[key].document_name,
            document_url: SupportingDocData.data[key].document_url,
          }
          docInfor.push(abc)
        }
      }

      var visa = {
        id: total_details[obj].visa_details_id,
        employee_id: total_details[obj].employee_id,
        visa_type_id: total_details[obj]?.visa_type_id || '',
        visa_type_name: total_details[obj]?.visa_type_name || '',
        valid_from: total_details[obj].valid_from !== null ? moment(total_details[obj].valid_from).format(dateFormat) : '',
        valid_till: total_details[obj].valid_till !== null ? moment(total_details[obj].valid_till).format(dateFormat) : '',
        support_documents: docInfor
      }
      responseData.push(visa)
    }
    /* Using Map to iterate the loop and prepare the response */

    return { status: true, data: responseData };
  } else {
    return { status: false, data: [] };
  }
};

const getVisaDocumentDetails = async (condition, isPersonalDocument) => {

  var responseData = await indexRepository.find('employee_visa_detail_documents', ['*'], condition);
  responseData = responseData.data[0];
  const visaDocsDetails = {
    'Visa Document': isPersonalDocument,
  };

  return visaDocsDetails
}

/**
 * Deletes an employee's visa details and associated documents.
 * @param {Object} body - The request body containing the employee's visa details.
 * @returns {Promise<Object>} - A promise that resolves to the repository response.
 */


/**
 * Delete function to remove documents associated with an Employee Visa Detail.
 * 
 * Logic:
 * - Retrieve documents associated with the Employee Visa Detail using 'employee_visa_detail_documents' based on provided conditions.
 * - Define the destination folder ('_pathDest') for destroying the documents.
 * - Call the 'destroyDocument' function to delete the associated documents, providing the document data and destination path.
 * - Delete the associated documents from the 'employee_visa_detail_documents' table using 'indexRepository.destroy'.
 * 
 * @param {Object} body - The request body containing information related to the Employee Visa Detail and document details.
 * @param {Object} condition - The conditions to identify and delete the associated documents.
 */
const deleteDocument = async (body, condition) => {

  /* Default variables */
  var isVisaDocument = false
  /* Default variables */

  var updateData = {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by
  }

  /* Fetching personal document data before update for activity track */
  // const beforeUpdateData = await getVisaDocumentDetails(condition, isVisaDocument)

  var docData = await indexRepository.find('employee_visa_detail_documents', ['*'], condition)

  var _pathDest = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Visa Documents/${body.employee_visa_details_id}`
  await destroyDocument(docData, _pathDest)

  await indexRepository.update('employee_visa_detail_documents', condition, updateData)

  isVisaDocument = true

  /* Fetching personal document data after update for activity track */
  // const afterUpdateData = await getVisaDocumentDetails(condition, isVisaDocument)

  /** Activity track */
  // activity = {
  //   employee_id: body.employee_id,
  //   referrable_type: 8,
  //   referrable_type_id: body.visa_details_id,
  //   action_type: 2,
  //   created_by: body.created_by,
  // };
  // event.emit('employeeUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /** Activity track */
}

/**
 * Destroy function to delete Employee Visa Details and associated documents based on the provided condition.
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Define the 'updateData' object to set attributes like 'deleted_at', 'updated_at', and 'updated_by' for marking the entry as deleted.
 * - Define the 'documentCondition' to specify which documents to delete based on the given condition.
 * - Fetch document data associated with the Visa Detail entry using 'indexRepository.find'.
 * - Calculate the destination path for document removal.
 * - Delete the associated documents using the 'destroyDocument' function.
 * - Update the Visa Detail entry by marking it as deleted and setting updated details.
 * - Delete the associated documents using the 'transactionRepository.destroy'.
 * - Track the activity of the deletion operation.
 * - Commit the transaction to persist the changes.
 * - Return the repository response after successful deletion.
 * - Handle errors and rollback the transaction in case of any errors.
 *    
 * @param {Object} body - Information about the Visa Detail to be deleted and related user details.
 * @param {Object} condition - The condition to specify which Visa Detail entry to delete.
 * @returns {Object} Response indicating the status of the delete operation.
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
    var documentCondition = { employee_visa_details_id: condition.id }
    /* storeing delete entry object */
    var docData = await indexRepository.find('employee_visa_detail_documents', ['*'], documentCondition)

    var _pathDest = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Visa Documents/${condition.id}`
    await destroyDocument(docData, _pathDest)

    /* calling update method from skillsRepository to update a new entry*/
    var repositoryResponse = await transactionRepository.update(trx, 'employee_visa_details', condition, updateData);
    await transactionRepository.destroy(trx, 'employee_visa_detail_documents', documentCondition)

    await trx.commit();

    /** Activity track */
    const changeLog = [
      {
        'label_name': 'Visa Type',
        'value': body?.visa_type_name,
        'action_by': body.created_by,
        'action_type': 3
      }
    ];
    activity = {
      employee_id: body?.employee_id,
      referrable_type_id: condition.id,
      activity_name: 'User Profile > Documents > Work Autorization > Visa',
      change_log: JSON.stringify(changeLog),
      created_by: body?.created_by
    };
    event.emit("employeeDeleteActivity", { activity })
    /** Activity track */

    return repositoryResponse
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

module.exports = { destroy, index, store, update, deleteDocument };
