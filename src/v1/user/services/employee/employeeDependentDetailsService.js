const moment = require('moment');
const indexRepository = require("../../repositories/index")
const format = require('../../../../../helpers/format');
const { fetchAndMoveDocument, destroyDocument } = require('../../../../../helpers/globalHelper');
const { event } = require('../../../../../events/employeeActivityEvent');
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository')
const config = require('../../../../../config/app')
const commonDocumentStore = require('../../../../../helpers/commonDocumentStore')


/**
 * Destroy function to delete an Employee Dependent Details record based on provided conditions within a transaction.
 * 
 * Logic:
 *   - Create a transaction to perform the delete operation.
 *   - Define the 'updateData' object to set the 'deleted_at', 'updated_at', and 'updated_by' values for deletion.
 *   - Call the 'transactionRepository.update' method within the transaction to update the employee dependent details record with the provided 'condition' and 'updateData'.
 *   - Update associated passport and I94 documents for the deleted dependent record by calling 'transactionRepository.update'.
 *   - Trigger an activity event to track the deletion of the dependent record.
 *   - Commit the transaction if the updates are successful.
 *   - Handle any errors that may occur during the transaction and rollback the transaction if needed.
 *   - Return a response object indicating the status of the delete operation and any error messages.
 * 
 * @param {Object} body - The request body containing information related to the dependent record and the user performing the deletion.
 * @param {Object} condition - The conditions to identify the dependent record to be deleted.
 * @returns {Object} Response indicating the result of the delete operation within a transaction.
 */

const destroy = async (body, condition) => {

  let trx;
  try {

    //databse connection
    const db = await getConnection();
    trx = await db.transaction()
    //databse connection

    /* Creating delete entry object */
    let updateData = {
      deleted_at: new Date(),
      updated_at: new Date(),
      updated_by: body.updated_by,
    };
    /* Creating delete entry object */

    /* calling update method from repository to update a new entry*/
    let repositoryResponse = await transactionRepository.update(trx, 'employee_dependent_details', condition, updateData);
    var passport = await transactionRepository.update(trx, 'employee_mapped_documents', { referrable_type_id: condition.id, referrable_type: 3 }, updateData);
    var i94 = await transactionRepository.update(trx, 'employee_mapped_documents', { referrable_type_id: condition.id, referrable_type: 4 }, updateData);

    await trx.commit();

    /** Activity track */
    activity = {
      employee_id: body.employee_id,
      referrable_type: 12,
      referrable_type_id: condition.id,
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
};


/**
 * Index function to retrieve Employee Dependent Details based on the provided condition.
 * 
 * Logic:
 *   - Fetch Employee Dependent Details from the 'employee_dependent_details' table based on the provided condition, fields, and specified joins.
 *   - If Employee Dependent Details data exists:
 *     + Create variables for response data, listing object, and date format.
 *     + Retrieve passport and i94 documents for the first record.
 *     + Iterate through the retrieved Employee Dependent Details and prepare a structured response.
 *     + Return the response object with status true and the formatted Employee Dependent Details.
 *   - Else (data is not found):
 *     + Return the original response object from the repository with the status indicating the absence of data.
 *    
 * @param {Object} condition - The conditions to filter Employee Dependent Details.
 * @returns {Object} Response with Employee Dependent Details.
 */
const index = async (condition) => {
  /**
   * Calling a index function.
   * Based on the status in the function response, prepare the response and return to controller
   *
  */
  const fields = ['employee_dependent_details.*', 'create.display_name as create_emp', 'update.display_name as updated_emp', 'visa.name as visa_name', 'rtypes.name as relationship_name']; // fields to fetch
  const joins = [
    { table: 'employee as create', alias: 'create', condition: ['employee_dependent_details.created_by', 'create.id'], type: 'left' },

    { table: 'employee as update', alias: 'update', condition: ['employee_dependent_details.updated_by', 'update.id'], type: 'left' },

    { table: 'visa_types as visa', alias: 'visa', condition: ['employee_dependent_details.visa_type_id', 'visa.id'], type: 'left' },

    { table: 'relationship_types as rtypes', alias: 'rtypes', condition: ['employee_dependent_details.relationship_id', 'rtypes.id'], type: 'left' },
  ];
  /* Setting up the joins and conditions and sort and fields */
  let employeeDependent = await indexRepository.find('employee_dependent_details', fields, condition, null, joins);
  if (employeeDependent.status) {

    /* Variables */
    let listingObject = '';
    let responseData = '';
    let total_details = employeeDependent.data;
    /* Variables */

    let dateFormat = await format.getDateFormat();

    // getting passport document
    var passport_document = await indexRepository.find('employee_mapped_documents', ['document_url as passport_doc_url', 'id as passport_document_id', 'document_name as passport_document_name'], { referrable_type_id: total_details[0].id, referrable_type: 3 })
    // getting i945 document
    var i94_document = await indexRepository.find('employee_mapped_documents', ['document_url as i94_doc_url', 'id as i94_document_id', 'document_name as i94_document_name'], { referrable_type_id: total_details[0].id, referrable_type: 4 })

    /* Using Map to iterate the loop and prepare the response */
    listingData = await total_details.map(async (item) => {
      listingObject = {
        id: item.id,
        employee_id: item.employee_id,
        first_name: item.first_name,
        middle_name: item.middle_name,
        last_name: item.last_name,
        email_id: item.email_id,
        contact_number: item.contact_number,
        dob: moment(item.dob).format(dateFormat),
        visa_type_id: item.visa_type_id,
        visa_name: item.visa_name,
        relationship_id: item.relationship_id,
        relationship_name: item.relationship_name,
        ssn: item.ssn,
        passport_document_id: passport_document.status ? passport_document.data[0].passport_document_id : '',
        passport_document_name: passport_document.status ? passport_document.data[0].passport_document_name : '',
        passport_document_url: passport_document.status ? passport_document.data[0].passport_doc_url : '',
        i94_document_id: i94_document.status ? i94_document.data[0].i94_document_id : '',
        i94_document_name: i94_document.status ? i94_document.data[0].i94_document_name : '',
        i94_document_url: i94_document.status ? i94_document.data[0].i94_doc_url : '',

      };
      return listingObject;
    });
    /* Using Map to iterate the loop and prepare the response */

    /* Using promise to wait till the address map completes. */
    responseData = await Promise.all(listingData);
    /* Using promise to wait till the address map completes. */

    return { status: true, data: responseData[0] };
  } else {
    return { status: false, data: employeeDependent };
  }
};


/**
 * Employee Dependent Details Listing Function to fetch a list of employee-dependent details based on specified conditions.
 * 
 * Overview of Function:
 * - Call the 'findByPagination' function to retrieve employee-dependent details from the 'employee_dependent_details' table.
 * - Prepare and return the response object with the retrieved data, pagination details, and status.
 * 
 * Logic:
 * - Call the 'findByPagination' function with the specified fields, condition, joins, page, and limit.
 * - If data is found (status is true):
 *   + Initialize variables for the response and iterate through the retrieved data to prepare the response.
 *   + Obtain additional documents (passport and i94) related to the dependent details.
 *   + Create an object for each employee-dependent detail and populate it with relevant information.
 *   + Add these objects to the 'responseData' array.
 *   + Return the response with status as true, containing 'responseData' and 'pagination_details'.
 * - If no data is found or an error occurs:
 *   + Return the response as-is, including any error information.
 * 
 * @param {object} condition - The conditions to filter employee-dependent details.
 * @param {number} page - The page number of the results to retrieve.
 * @param {number} limit - The maximum number of results per page.
 * @returns {object} - An object containing the retrieved employee-dependent details, pagination details, and status.
 */
const listing = async (condition, page, limit) => {

  /**
   * Calling a  findByPagination function.
   * Based on the status in the function response, prepare the response and return to controller
   *
   */
  const fields = ['employee_dependent_details.*', 'visa.name as visa_name', 'rtypes.name as relationship_name']; // fields to fetch
  const joins = [
    { table: 'employee as create', alias: 'create', condition: ['employee_dependent_details.created_by', 'create.id'], type: 'left' },

    { table: 'employee as update', alias: 'update', condition: ['employee_dependent_details.updated_by', 'update.id'], type: 'left' },

    { table: 'visa_types as visa', alias: 'visa', condition: ['employee_dependent_details.visa_type_id', 'visa.id'], type: 'left' },

    { table: 'relationship_types as rtypes', alias: 'rtypes', condition: ['employee_dependent_details.relationship_id', 'rtypes.id'], type: 'left' }
  ];

  let employeeDependentList = await indexRepository.findByPagination('employee_dependent_details', fields, condition, joins, page, limit);

  if (employeeDependentList.status) {
    /* Variables */
    let listingObject = [];
    let responseData = [];
    let total_details = employeeDependentList.data;
    let pagination_details = employeeDependentList.pagination;
    /* Variables */

    let dateFormat = await format.getDateFormat();

    /* Using for loop to iterate the loop and prepare the response */
    serial_no = (page - 1) * limit + 1;

    // looping the details
    for (let key in total_details) {
      // getting passport document
      var passport_document = await indexRepository.find('employee_mapped_documents', ['document_url as passport_doc_url', 'id as passport_document_id', 'document_name as passport_document_name'], { referrable_type_id: total_details[key].id, referrable_type: 3 })
      // getting i94 document
      var i94_document = await indexRepository.find('employee_mapped_documents', ['document_url as i94_doc_url', 'id as i94_document_id', 'document_name as i94_document_name'], { referrable_type_id: total_details[key].id, referrable_type: 4 })

      // listing object
      listingObject = {
        serial_no: serial_no,
        id: total_details[key].id,
        employee_id: total_details[key].employee_id,
        first_name: total_details[key].first_name,
        middle_name: total_details[key].middle_name ? total_details[key].middle_name : '',
        last_name: total_details[key].last_name,
        email_id: total_details[key].email_id,
        contact_number: total_details[key].contact_number,
        dob: moment(total_details[key].dob).format(dateFormat),
        visa_type_id: total_details[key].visa_type_id,
        visa_name: total_details[key].visa_name,
        relationship_id: total_details[key].relationship_id,
        relationship_name: total_details[key].relationship_name,
        ssn: total_details[key].ssn,
        passport_document_id: passport_document.status ? passport_document.data[0].passport_document_id : '',
        passport_document_name: passport_document.status ? passport_document.data[0].passport_document_name : '',
        passport_document_url: passport_document.status ? passport_document.data[0].passport_doc_url : '',
        i94_document_id: i94_document.status ? i94_document.data[0].i94_document_id : '',
        i94_document_name: i94_document.status ? i94_document.data[0].i94_document_name : '',
        i94_document_url: i94_document.status ? i94_document.data[0].i94_doc_url : '',
        created_by: (total_details[key].create_emp != null ? total_details[key].create_emp : 'System'),
        updated_by: (total_details[key].updated_emp != null ? total_details[key].updated_emp : ''),
      };
      // listing object

      serial_no++;
      responseData.push(listingObject)
    }
    return {
      status: true,
      data: responseData,
      pagination_data: pagination_details
    };
  } else {
    return employeeDependentList;
  }
};


/**
 * Store function to create a new Employee Dependent Details entry.
 *
 * Logic:
 * - Initialize a database transaction.
 * - Create an object 'employeeDependent' with properties extracted from the request 'body'.
 * - Call the 'transactionRepository.store' function to add 'employeeDependent' to the 'employee_dependent_details' table within the transaction.
 * - Define the destination folder for storing dependent documents.
 * - From looping the 'passport_documents' exists in the request 'body', process the passport document:
 *    + Create a document object for mapping and store it in the 'employee_mapped_documents' table.
 *    + Call the 'commonDocumentStore()' function to store the document in the specified destination folder and update the document mapping.
 * - From looping the 'i94_documents' exists in the request 'body', process the I-94 document similarly.
 * - Trigger an activity event for creating a new dependent details record.
 * - Commit the transaction after successfully storing all data.
 * - Return the response indicating the status of the operation.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 *
 * @param {Object} body - The request body containing Employee Dependent Details.
 * @returns {Object} Repository response.
 */

const store = async (body) => {

  let trx;
  try {

    //databse connection
    const db = await getConnection();
    trx = await db.transaction()
    //databse connection

    const employeeDependent = {
      employee_id: body.employee_id,
      relationship_id: body.relationship_id,
      first_name: body.first_name,
      last_name: body.last_name,
      middle_name: body?.middle_name  || null,
      email_id: body.email_id,
      contact_number: body.contact_number,
      dob: body.dob ? moment(body.dob).format('YYYY-MM-DD') : null,
      visa_type_id: body.visa_type_id,
      ssn: body.ssn,
      created_by: body.created_by,
      created_at: new Date(),
    };
    const employeeDependentData = await transactionRepository.store(trx, 'employee_dependent_details', employeeDependent);

    const destFolder = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Dependent-Documents/${employeeDependentData.data[0].id}/`

    /** Update the documents related to passport */
    var passport_documents = body.passport_documents;
    for (const key in passport_documents) {
      if (passport_documents[key].new_document_id) {
        var documentObject = {
          referrable_type: 3, // passport documents
          referrable_type_id: employeeDependentData.data[0].id,
          created_by: body.created_by,
          created_at: new Date()
        }
        var documentData = await transactionRepository.store(trx, 'employee_mapped_documents', documentObject)
        await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, passport_documents[key].new_document_id, documentData.data[0].id)
      }
    }

    /** Update the documents related to i94 */
    var i94_documents = body.i94_documents;
    for (const key in i94_documents) {
      if (i94_documents[key].new_document_id) {
        var documentObject = {
          referrable_type: 4, // i94 documents
          referrable_type_id: employeeDependentData.data[0].id,
          created_by: body.created_by,
          created_at: new Date()
        }
        var documentData = await transactionRepository.store(trx, 'employee_mapped_documents', documentObject)
        await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, i94_documents[key].new_document_id, documentData.data[0].id)
      }
    }

    await trx.commit();

    /* Activity track */
    activity = {
      employee_id: body.employee_id,
      referrable_type: 12,
      referrable_type_id: employeeDependentData.data[0].id,
      action_type: 1,
      created_by: body.created_by,
    };

    event.emit('employeeStoreActivity', { activity } );
    /** Activity track */

    return { status: true, employeeDependentData };
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

/**
 * Update function to modify an existing Employee Dependent Details entry.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Define default variables, including 'isPassportDocument' and 'isi94Document' to track whether passport and I-94 documents have been updated.
 * - Create an 'updateData' object containing properties extracted from the request 'body' for the modified Dependent Details entry.
 * - Fetch the existing Dependent Details data before the update for later comparison.
 * - Call the 'transactionRepository.update' function to apply the 'updateData' changes to the 'employee_dependent_details' table within the transaction.
 * - Define the destination folder for storing updated documents based on the employee reference and Dependent ID.
 * - Loop the passport documents exists in the body and process it:
 *    + If 'id' is not empty:
 *      ~ Update the passport document in the specified destination folder and update the document mapping.
 *  -  else
 *    + Create a document object for mapping and store it in the 'employee_mapped_documents' table.
 *    + Call the 'commonDocumentStore()' function to store the document in the specified destination folder and update the document mapping.
* - Loop the i94 documents exists in the body and process it:
 *    + If 'id' is not empty:
 *      ~ Update the i94 document in the specified destination folder and update the document mapping.
 *  -  else
 *    + Create a document object for mapping and store it in the 'employee_mapped_documents' table.
 *    + Call the 'commonDocumentStore()' function to store the document in the specified destination folder and update the document mapping.
 * - Commit the transaction after successfully updating all data.
 * - Fetch the updated Dependent Details data after the update.
 * - Trigger an activity event to log the update, capturing both the state of the data before and after the update.
 * - Return the response indicating the status of the update operation.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 *
 * @param {Object} body - The request body containing the modified Employee Dependent Details.
 * @param {Object} condition - The condition specifying which Dependent Details entry to update.
 * @returns {Object} Repository response.
 */

const update = async (body, condition) => {

  let trx;
  try {

    //databse connection
    const db = await getConnection();
    trx = await db.transaction()
    //databse connection

    // defailt variables
    var isPassportDocument = false
    var isi94Document = false
    // defailt variables

    /* Creating update entry object */
    let updateData = {
      employee_id: body.employee_id,
      relationship_id: body.relationship_id,
      first_name: body.first_name,
      last_name: body.last_name,
      middle_name: body?.middle_name || null,
      email_id: body.email_id,
      contact_number: body.contact_number,
      dob: body.dob ? moment(body.dob).format('YYYY-MM-DD') : null,
      visa_type_id: body.visa_type_id,
      ssn: body.ssn,
      updated_by: body.updated_by,
      updated_at: new Date(),
    };

    /** Fetching Employee dependent data before update */
    const beforeUpdateData = await getDependentData({ 'employee_dependent_details.id': condition.id }, isPassportDocument, isi94Document)
    /** Fetching Employee dependent data before update */

    /**
     *  + Call the update repository function
     *    -Based on the status in update function response, segregate the response and prepare the response
     *
    */
    let employeeDependentData = await transactionRepository.update(trx, 'employee_dependent_details', condition, updateData);

    const destFolder = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Dependent-Documents/${employeeDependentData.data[0].id}/` // destination folder for documents

    /** Update the documents related to passport */
    var passport_documents = body.passport_documents;
    for (const key in passport_documents) {
      if (passport_documents[key].id) {
        await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, passport_documents[key].new_document_id, passport_documents[key].id)
        isPassportDocument = true
      } else {
        if (passport_documents[key].new_document_id) {
          var documentObject = {
            referrable_type: 3, // passport documents
            referrable_type_id: employeeDependentData.data[0].id,
            created_by: body.created_by,
            created_at: new Date()
          }
          var documentData = await transactionRepository.store(trx, 'employee_mapped_documents', documentObject)
          await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, passport_documents[key].new_document_id, documentData.data[0].id)
          isPassportDocument = true
        }
      }
    }
    /** Update the documents related to passport */
    var i94_documents = body.i94_documents;
    for (const key in i94_documents) {
      if (i94_documents[key].id) {
        await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, i94_documents[key].new_document_id, i94_documents[key].id)
        isi94Document = true
      } else {

        if (i94_documents[key].new_document_id) {
          var documentObject = {
            referrable_type: 4, // i94 documents
            referrable_type_id: employeeDependentData.data[0].id,
            created_by: body.created_by,
            created_at: new Date()
          }
          var documentData = await transactionRepository.store(trx, 'employee_mapped_documents', documentObject)
          await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, i94_documents[key].new_document_id, documentData.data[0].id)
          isi94Document = true 
        }
      }
    }

    // transaction commit
    await trx.commit();
    // transaction commit

    /* fetching Employee Dependent data after update */
    const afterUpdateData = await getDependentData({ 'employee_dependent_details.id': condition.id }, isPassportDocument, isi94Document)
    /* fetching Employee Dependent data after update */

    /**Activity track */
   activity = {
    employee_id: body.employee_id,
    referrable_type: 12,
    referrable_type_id: condition.id,
    action_type: 2,
    created_by: body.created_by,
  };

  event.emit('employeeUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

    return { status: true, employeeDependentData };
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

/*
 * Function to get details about an employee's dependent.
 *
 * @param {object} condition - The conditions to filter the dependent details.
 * @param {boolean} passport - A flag indicating whether to include passport document details.
 * @param {boolean} i94 - A flag indicating whether to include I-94 document details.
 *
 * @returns {object} - An object containing specific details about the employee's dependent.
 *
 * Logic: 
 * - Use 'indexRepository.find' to retrieve dependent details based on the specified conditions and joins.
 * - Extract the first data entry from the result (assuming it's an array).
 * - Create a 'dependentDetailsData' object with specific properties derived from the retrieved data.
 * - Return the 'dependentDetailsData'.
 */ 
const getDependentData = async (condition, passport, i94) => { 
  let dateFormat = await format.getDateFormat(); // date form 
 
  const fields = ['employee_dependent_details.*', 'create.display_name as create_emp', 'update.display_name as updated_emp', 'visa.name as visa_name', 'rtypes.name as relationship_name']; // fields to fetch 
  const joins = [ 
    { table: 'employee as create', alias: 'create', condition: ['employee_dependent_details.created_by', 'create.id'], type: 'left' }, 
    { table: 'employee as update', alias: 'update', condition: ['employee_dependent_details.updated_by', 'update.id'], type: 'left' }, 
    { table: 'visa_types as visa', alias: 'visa', condition: ['employee_dependent_details.visa_type_id', 'visa.id'], type: 'left' }, 
    { table: 'relationship_types as rtypes', alias: 'rtypes', condition: ['employee_dependent_details.relationship_id', 'rtypes.id'], type: 'left' }, 
  ]; 
 
  let dependentData = await indexRepository.find('employee_dependent_details', fields, condition, null, joins); 
  dependentData = dependentData.data[0] 
 
  const dependentDetailsData = { 
    'First Name': dependentData.first_name, 
    'Middle Name': dependentData.middle_name ? dependentData.middle_name : '-', 
    'Last Name': dependentData.last_name, 
    'Email Id': dependentData.email_id, 
    'Contact Number': dependentData.contact_number, 
    'DOB': moment(dependentData.dob).format(dateFormat), 
    'Visa Type': dependentData.visa_name,  
    'Relationship Type': dependentData.relationship_name, 
    'SSN': dependentData.ssn, 
    'Passport Document': passport, 
    'I-94 Document': i94 
  } 
 
  return dependentDetailsData 
} 

/**
 * Dropdown Function to get employee-dependent data.
 *
 * Logic:
 * - Fetch the data from the 'employee_dependent_details' table using the provided condition by calling the common find function.
 * - If data exists,
 *   + Loop through the data and add objects to an array.
 *   + Prepare the response.
 *   + Return the response with status set to true.
 * - If no data is found, return the response with status set to false.
 *.
 * @param {any} condition - The condition to filter the employee dependents.
 * @returns {Promise<{status: boolean, data: any[]}>} - A promise that resolves to an object
 * containing the status and data of the dropdown list. If the status is true, the data will
 * contain an array of objects with the id and name of each employee dependent. If the status
 * is false, the data will contain the error message.
 */
const dropdown = async (condition) => {
  /**
   * Calling a  dropdown function.
   * Based on the status in the function response, prepare the response and return to controller
   *
   */
  let employeeDependent = await indexRepository.find('employee_dependent_details', ['id', 'first_name', 'last_name'], condition, 0);
  if (employeeDependent.status == true) {
    /* Variables */
    let responseData = [];
    let total_details = employeeDependent.data;
    /* Variables */

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of total_details) {
      const listingObject = {
        id: item.id,
        value: item.first_name + ' ' + item.last_name,
      };
      responseData.push(listingObject);
    }

    return { status: true, data: responseData };
  } else {
    return { status: false, data: employeeDependent };
  }
};

const getDependentDocumentDetails = async (condition, isDependentDocument) => {

  var responseData = await indexRepository.find('employee_mapped_documents', ['*'], condition );
  responseData = responseData.data[0];
  const personalDocsDetails = {
      'Dependent Document': isDependentDocument,
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
 * - Delete the document data from the 'employee_mapped_documents' table using the 'indexRepository.destroy' function.
 * 
 * @param {Object} body - The request body containing context information.
 * @param {Object} condition - The conditions to filter the document to be deleted.
 * @returns {void}
 */
const deleteDocument = async (body, condition) => {

  /* Default variables */
  var isDependentDocument = false
  /* Default variables */

    /* Fetching personal document data before update for activity track */
  const beforeUpdateData = await getDependentDocumentDetails(condition, isDependentDocument )

  let docData = await indexRepository.find('employee_mapped_documents', ['id'], condition);
  let _pathDest = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Dependent-Documents`;
  await destroyDocument(docData, _pathDest);
  const response =await indexRepository.destroy('employee_mapped_documents', condition);

  isDependentDocument = true

  /* Fetching personal document data after update for activity track */
  const afterUpdateData = await getDependentDocumentDetails(condition , isDependentDocument)

  /** Activity track */
  activity = {
    employee_id: body.employee_id,
    referrable_type: 12,
    referrable_type_id: body.dependent_details_id,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('employeeUpdateActivity', { activity , beforeUpdateData , afterUpdateData});

  return response;
};


module.exports = { destroy, index, listing, store, update, dropdown, deleteDocument };



