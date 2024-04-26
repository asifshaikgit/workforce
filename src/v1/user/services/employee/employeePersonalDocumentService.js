require('dotenv').config();
const moment = require('moment');
const { fetchAndMoveDocument, destroyDocument } = require('../../../../../helpers/globalHelper');
const config = require('../../../../../config/app');
const indexRepository = require("../../repositories/index")
const format = require('../../../../../helpers/format');
const { event } = require('../../../../../events/employeeActivityEvent');
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');
const commonDocumentStore = require('../../../../../helpers/commonDocumentStore');
const moveInviteViaLinkDocument = require('../../../../../helpers/moveInviteViaLinkDocument');
const inviteEmployeeCommonPath = '/Employee/Invite-Employee-Document/';
const { getDocumentDetails } = require('./commonService');
const labelNames = {
  1: 'Driving License',
  2: 'Social Security Number (SSN)',
  3: 'State ID',
  4: 'Other Documents'
};
const getLabelName = (document_type_id) => labelNames[document_type_id] || '';

/**
 * Store function to create a new Employee Personal Document entry.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Define the destination folder for storing documents.
 * - Create an object 'newPersonalDocument' with properties extracted from the request 'body'.
 * - Call the 'transactionRepository.store' function to store the new personal document information in the 'employee_personal_documents' table within the transaction.
 * - Loop through 'documents' in the request 'body' and process each document:
 *   + If 'new_document_id' is not empty, create a document object for mapping and store it in the 'employee_mapped_documents' table.
 *   + Call the 'commonDocumentStore()' function to store the document in the specified destination folder and update the document mapping.
 * - Commit the transaction after successfully storing all data.
 * - Trigger an activity event for creating a new personal document record.
 * - Return the response with information about the stored personal document record.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 *
 * @param {Object} body - The request body containing Employee Personal Document details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {
  let trx;
  try {
    //databse connection
    const db = await getConnection();
    trx = await db.transaction();
    let newDocumentsCount = 0;
    const destFolder = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Personal-Documents`;

    let newPersonalDocument = {
      employee_id: body.employee_id,
      document_type_id: body?.document_type_id || null,
      valid_from: body.valid_from ? moment(body.valid_from).format('YYYY-MM-DD') : null,
      valid_till: body.valid_till ? moment(body.valid_till).format('YYYY-MM-DD') : null,
      document_number: body.document_number ? body.document_number : null,
      status: body.status ? body.status : null,  // 1 - Active, 0 - Expired
      created_by: body.created_by,
      created_at: new Date(),
    };

    if (body.document_type_id == 2 && body.document_number) {
      await transactionRepository.update(trx, 'employee', { id: body.employee_id }, { ssn: body.document_number });
    }

    let personalDetails = await transactionRepository.store(trx, 'employee_personal_documents', newPersonalDocument);

    let documents = body.documents;
    for (const key in documents) {

      if (documents[key].new_document_id != '' && documents[key].slug == 'invite_via_link') {

        if (documents[key].document_url.includes(inviteEmployeeCommonPath)) {

          var documentObject = {
            referrable_type: 5, // 5 for personal documents
            referrable_type_id: personalDetails.data[0].id,
            created_by: body.created_by,
            created_at: new Date()
          }
          const documentData = await transactionRepository.store(trx, 'employee_mapped_documents', documentObject);

          // Move the file from invite via link employee folder structure to employee documents folder structure.
          await moveInviteViaLinkDocument(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documentData.data[0].id, body.loginSubDomainName);
          newDocumentsCount++;
        }
      }

      // fetch document details from temp document records
      if (documents[key].new_document_id != '' && (!documents[key]?.hasOwnProperty('slug') || documents[key].slug == '')) {
        // create a new entry for each document 
        let fileData = {
          referrable_type: 5, // 5 for personal documents
          referrable_type_id: personalDetails.data[0].id,
          created_by: body.created_by,
          created_at: new Date(),
        };
        var documentData = await transactionRepository.store(trx, 'employee_mapped_documents', fileData);
        await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documentData.data[0].id);
        newDocumentsCount++;
        console.log(newDocumentsCount, 'newDocumentsCount')
      }
    }

    // commit transaction
    await trx.commit();

    /**Activity track */
    // Create ChangeLog Object
    let label_name = getLabelName(body.document_type_id);
    const changeLog = [
      {
        'label_name': label_name,
        'value': (body.document_type_id != 4) ? ((body.document_number) ? body.document_number : label_name) : newDocumentsCount,
        'action_by': body.created_by,
        'action_type': 1,
        'slug': (body.document_type_id == 4) ? 'document' : ''
      }
    ];
    activity = {
      employee_id: body.employee_id,
      referrable_type_id: personalDetails.data[0].id,
      activity_name: 'User Profile > Documents > Personal Documents > ' + label_name,
      change_log: JSON.stringify(changeLog),
      created_by: body.created_by
    };
    event.emit('employeeStoreActivity', { activity });
    /**Activity track */

    return personalDetails
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

/**
 * Update function to modify an existing Employee Personal Document entry.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Create an object 'updateData' with properties extracted from the request 'body'.
 * - Fetch the personal document data before the update.
 * - Call the 'transactionRepository.update' function to modify the existing personal document information in the 'employee_personal_documents' table within the transaction.
 * - Define the destination folder for storing documents.
 * - Loop through 'documents' in the request 'body' and process each document:
 *   + If 'new_document_id' is provided, check if the document has an 'id'.
 *     - If 'id' provided:
 *        ~ update the document information by calling the 'commonDocumentStore()' function.
 *     - Else:
 *        ~ create a document object for mapping and store it in the 'employee_mapped_documents' table.
 *        ~ Call the 'commonDocumentStore()' function to store the document in the specified destination folder and update the document mapping.
 * - Commit the transaction after successfully updating all data.
 * - Fetch the personal document data after the update.
 * - Trigger an activity event for updating the personal document record.
 * - Return the response with information about the updated personal document record.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 *
 * @param {Object} body - The request body containing modified Employee Personal Document details.
 * @param {Object} condition - The condition to identify the specific personal document to update.
 * @returns {Object} Repository response.
 */
const update = async (body, condition) => {
  let trx;
  try {
    //databse connection
    const db = await getConnection();
    trx = await db.transaction()
    let newDocumentsCount = 0;
    let deletedDocumentsCount = 0;
    var isDocumentUpdate = false;

    /* Creating update entry object */
    let updateData = {
      document_type_id: body?.document_type_id || null,
      valid_from: body.valid_from ? moment(body.valid_from).format('YYYY-MM-DD') : null,
      valid_till: body.valid_till ? moment(body.valid_till).format('YYYY-MM-DD') : null,
      document_number: body.document_number ? body.document_number : null,
      status: body.status ? body.status : null,
      updated_by: body.updated_by,
      updated_at: new Date(),
    };

    if (body.document_type_id == 2 && body.document_number) {
      await transactionRepository.update(trx, 'employee', { id: body.employee_id }, { ssn: body.document_number });
    }

    /** fetching personal document data before update */
    const beforeUpdateData = await getDocumentDetails({ 'employee_personal_documents.id': condition.id }, isDocumentUpdate)
    /** fetching personal document data before update */

    /* Creating update entry object */

    /**
     *  + Call the update repository function
     *    -Based on the status in update function response, segregate the response and prepare the response
     *
     */
    const destFolder = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Personal-Documents`;

    const repositoryResponse = await transactionRepository.update(trx, 'employee_personal_documents', condition, updateData);

    let documents = body.documents;
    for (const key in documents) {
      if (documents[key].new_document_id != null && documents[key].new_document_id != '' && documents[key].new_document_id) {

        if (documents[key].id != null && documents[key].id != '' && documents[key].id) {
          await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documents[key].id)
          isDocumentUpdate = true
        } else {

          let fileData = {
            referrable_type: 5, // 5 for personal documents
            referrable_type_id: condition.id,
            created_by: body.created_by,
            created_at: new Date(),
          };
          var documentData = await transactionRepository.store(trx, 'employee_mapped_documents', fileData);
          await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documentData.data[0].id)
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

    if (body.document_type_id == 1 || body.document_type_id == 2) {
      /**Activity track */
      // Create ChangeLog Object
      let label_name = getLabelName(body.document_type_id);
      activity = {
        employee_id: body.employee_id,
        referrable_type_id: condition.id,
        activity_name: 'User Profile > Documents > Personal Documents > ' + label_name,
        created_by: body.created_by,
        slug: 'other_documents',
        isDocumentUpdate: isDocumentUpdate
      };
      event.emit('employeeUpdateActivity', { activity, beforeUpdateData });
      /**Activity track */
    }

    if (body.document_type_id == 4) {
      let changeLog = [];
      const addActionLog = (count, action) => {
        if (count > 0) {
          changeLog.push({
            label_name: (count > 1) ? 'Other Documents' : 'Other Document',
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
          activity_name: 'User Profile > Documents > Personal Documents > Other Documents',
          change_log: JSON.stringify(changeLog),
          created_by: body.created_by
        };

        event.emit('employeeStoreActivity', { activity });
      }
      /**Activity Track */
    }

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
 * Index function to retrieve Employee Personal Documents based on the provided condition.
 * 
 * Logic:
 * - Define default variables such as 'fields' and 'joins' to specify which data to fetch and related tables to join.
 * - Fetch Employee Personal Documents from the 'employee_personal_documents' table based on the provided condition, fields, and joins using the 'indexRepository.find' function.
 * - If Personal Document data exists:
 *   + Create an empty 'responseData' array to structure the response.
 *   + Map the repository response data (personalDocument.data) to 'total_details'.
 *   + Iterate through the 'total_details' and fetch associated Document details using 'employee_mapped_documents' table.
 *   + Fetch mandatory fields for the document type.
 *   + Format the Personal Document and document information into listing objects.
 *   + Push listing objects into the 'responseData' array.
 *   + Return the response object with status true and the Personal Documents in the 'responseData' array.
 * - Else (data is not found):
 *   + Return a response object with status false and an empty data array.
 *    
 * @param {Object} condition - The conditions to filter Personal Documents.
 * @returns {Object} Response with Employee Personal Documents.
 */
const index = async (condition) => {

  /**
   * Calling a  index function.
   * Based on the status in the function response, prepare the response and return to controller
   *
  */
  const fields = ['employee_personal_documents.id as employee_personal_id', 'employee_personal_documents.employee_id', 'employee_personal_documents.valid_from', 'employee_personal_documents.valid_till', 'employee_personal_documents.document_number', 'employee_personal_documents.status', 'employee_personal_documents.description', 'document_types.id as document_type_id', 'document_types.name as document_type_name']; // fields to fetch

  const joins = [
    { table: 'document_types', condition: ['employee_personal_documents.document_type_id', 'document_types.id'], type: 'left' }
  ];
  /* Setting up the joins and conditions and sort and fields */
  let personalDocument = await indexRepository.find('employee_personal_documents', fields, condition, null, joins);
  if (personalDocument.status) {
    let dateFormat = await format.getDateFormat(); // date format

    /* Variables */
    let total_details = personalDocument.data;
    /* Variables */
    let responseData = [];

    for (const obj in total_details) {
      let docData = await indexRepository.find('employee_mapped_documents', ['id', 'document_name', 'document_url'], { referrable_type_id: total_details[obj].employee_personal_id, referrable_type: 5 });
      // to get the mandatory fields of the document type

      const newItem = { new_document_id: '' }; // Adding this key to all documents related Index API's
      let updatedDocData;
      if (docData.status) {
        // Using the map method to add the new_document_id to each object
        updatedDocData = docData.data.map(obj => ({
          ...obj, // Copy the existing object's properties
          ...newItem // Add the new item
        }));
      }

      let tempObj = {
        id: total_details[obj].employee_personal_id,
        document_type_id: total_details[obj].document_type_id,
        document_type_name: total_details[obj].document_type_name,
        valid_from: total_details[obj].valid_from ? moment(total_details[obj].valid_from).format(dateFormat) : '',
        valid_till: total_details[obj].valid_till ? moment(total_details[obj].valid_till).format(dateFormat) : '',
        document_number: total_details[obj].document_number ? total_details[obj].document_number : '',
        documents: docData.status ? updatedDocData : [],
      };
      responseData.push(tempObj);
    }

    return { status: true, data: responseData };
  } else {
    return { status: false, data: [] };
  }

};

const getPersonalDocumentDetails = async (condition, isPersonalDocument) => {

  var responseData = await indexRepository.find('employee_mapped_documents', ['*'], condition);
  responseData = responseData.data[0];
  const personalDocsDetails = {
    'Personal Document': isPersonalDocument,
  };

  return personalDocsDetails
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

  /* Default variables */
  var isPersonalDocument = false
  /* Default variables */

  var updateData = {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by
  }

  /* Fetching personal document data before update for activity track */
  const beforeUpdateData = await getPersonalDocumentDetails(condition, isPersonalDocument)

  let docData = await indexRepository.find('employee_mapped_documents', ['id'], condition);
  let _pathDest = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Personal-Documents`;
  await destroyDocument(docData, _pathDest);
  const response = await indexRepository.update('employee_mapped_documents', condition, updateData);
  isPersonalDocument = true

  /* Fetching personal document data after update for activity track */
  const afterUpdateData = await getPersonalDocumentDetails(condition, isPersonalDocument)

  /** Activity track */
  activity = {
    employee_id: body.employee_id,
    referrable_type: 10,
    referrable_type_id: body.personal_document_id,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('employeeUpdateActivity', { activity, beforeUpdateData, afterUpdateData });

  return response;
};

/**
 * Destroy function to delete an existing Employee Personal Document entry.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Create an object 'updateData' to mark the document as deleted, including setting 'deleted_at' and updating timestamps.
 * - Fetch the document records to be deleted using the specified condition.
 * - Define the destination path ('_pathDest') for the personal document files.
 * - Call 'destroyDocument' to delete the personal document files.
 * - Update the 'employee_personal_documents' repository using 'transactionRepository.update' with the condition and update data.
 * - Delete related documents from the 'employee_personal_documents' repository.
 * - Commit the transaction after successfully deleting the data.
 * - Trigger an activity event for deleting the personal document record.
 * - Return the response with information about the deleted personal document record.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 *
 * @param {Object} body - The request body containing details for deleting the Employee Personal Document.
 * @param {Object} condition - The condition to identify the specific personal document to delete.
 * @returns {Object} Repository response.
 */
const destroy = async (body, condition) => {
  let trx;
  try {
    //databse connection
    const db = await getConnection();
    trx = await db.transaction()

    /* Creating delete entry object */
    let updateData = {
      deleted_at: new Date(),
      updated_at: new Date(),
      updated_by: body.updated_by,
    };

    /**
     * Deletes a personal document from the specified path.
     */
    let documentCondition = { referrable_type_id: condition.id, referrable_type: 5 };
    var docData = await indexRepository.find('employee_mapped_documents', ['id', 'document_name', 'document_url', 'document_status'], documentCondition)
    let _pathDest = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Personal-Documents`;
    await destroyDocument(docData, _pathDest);

    /**
     * Updates the 'employee_personal_documents' repository with the given condition and update data.
     */
    let repositoryResponse = await transactionRepository.update(trx, 'employee_personal_documents', condition, updateData);
    await transactionRepository.destroy(trx, 'employee_mapped_documents', documentCondition)

    //commit transaction
    await trx.commit();

    /** Activity track */
    let label_name = getLabelName(body.document_type_id);
    const changeLog = [
      {
        'label_name': label_name,
        'value': (body.document_type_id == 4) ? 'All' : body.document_number,
        'action_by': body.created_by,
        'action_type': 3,
        'slug': (body.document_type_id == 4) ? 'document' : ''
      }
    ];
    activity = {
      employee_id: body?.employee_id,
      activity_name: 'User Profile > Documents > Personal Documents > ' + label_name,
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

const handleDocumentTypes = async (document_type_id) => {
  let label_name = '';
  if (document_type_id == 1) {
    label_name = 'Driving License';
  } else if (document_type_id == 2) {
    label_name = 'Social Security Number (SSN)';
  } else if (document_type_id == 3) {
    label_name = 'State ID';
  } else if (document_type_id == 4) {
    label_name = 'Other Documents';
  }
  return label_name;
}

module.exports = { destroy, index, store, update, deleteDocument };
