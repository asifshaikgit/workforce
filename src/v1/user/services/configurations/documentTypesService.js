const indexRepository = require('../../repositories/index');
const { event } = require('../../../../../events/configurationActivityEvent');
const moment = require('moment');
const format = require('../../../../../helpers/format');

/**
 * Store function to create a new document type within a specific document category and track the activity.
 * Logic:
 * - Define 'documentCategory' conditon object using slug(body.category_slug_name)
 * - Retrieve the document category data based on the 'documentCategory'(defined above).
 * - Prepare object data for the new document type data(body).
 * - call common store function to store new document data into 'document_types' table.
 * - Determine the sub-module based on the document category.
 * - Track an activity related to this document type creation.
 * - Return the 'documentTypeResponse' response
 * 
 * @param {Object} body - The request body containing information to create a new document type.
 * @returns {Object} - A response object indicating the status of the database operation.
 */
const store = async (body) => {
  const documentCategory = {
    slug: body.category_slug_name,
    is_active: true,
  };
  /**Retrieve Document Category */
  const documentCategoryData = await indexRepository.find('document_categories', ['*'], documentCategory);
  const newDocumentData = {
    /**Prepare Data for New Document Type */
    document_category_id: documentCategoryData.data[0].id,
    name: body.name,
    description: body.description,
    number_mandatory: body.number_mandatory,
    number_display: body.number_display,
    valid_from_mandatory: body.valid_from_mandatory,
    valid_from_display: body.valid_from_display,
    valid_to_mandatory: body.valid_to_mandatory,
    valid_to_display: body.valid_to_display,
    status_mandatory: body.status_mandatory,
    status_display: body.status_display,
    upload_mandatory: body.upload_mandatory,
    upload_display: body.upload_display,
    created_by: body.created_by,
    created_at: new Date(),
    is_active: body.is_active,
  };
  /**Prepare Data for New Document Type */

  /**Store New Document Type */
  const documentTypeResponse = await indexRepository.store('document_types', newDocumentData);

  /**Determine referrable_type */
  let referrable_type
  if (body.category_slug_name === 'placement-documents') {
    referrable_type = 19;
  } else if (body.category_slug_name === 'client-documents') { //client-documents
    referrable_type = 32;
  } else if (body.category_slug_name === 'end-documents') { //end-client-documents
    referrable_type = 33;
  } else if (body.category_slug_name === 'employee-personal-documents') { //Employee Personal Document
    referrable_type = 30;
  } else if (body.category_slug_name === 'raise-invoices-documents') { //raise-invoices-documents
    referrable_type = 34;
  }
  /**Actiivty track */
  const activity = {
    referrable_id: documentTypeResponse.data[0].id,
    referrable_type: referrable_type,
    action_type: 1,
    created_by: body.created_by,
  };
  event.emit('configurationStoreActivity', { activity } );
  /**Actiivty track */
  
  /**Return Document Type Response */
  return documentTypeResponse;
};


/**
 * Update function to modify an existing document type and track the activity.
 * 
 * Logic:
 * - Define the condition for updating the document type based on its id(body.document_type_id).
 * - Create an object containing the updated data.
 * - Retrieve the document type data from 'document_types' table before the update.
 * - Update the data in 'document_types' table
 * - Fetch the document type data from 'document_types' table after the update.
 * - An activity tracking event is triggered to log the update event with relevant information.
 * - Return the 'repositoryResponse' response.
 * 
 * @param {Object} body - The request body containing the updated document type details.
 * @returns {Object} - The response from the repository, indicating the success or failure of the update.
 */
const update = async (body, condition) => {

  /* Creating update entry object */
  const updateData = {
    name: body.name,
    is_active: body.is_active,
    description: body.description,
    number_mandatory: body.number_mandatory,
    number_display: body.number_display,
    valid_from_mandatory: body.valid_from_mandatory,
    valid_from_display: body.valid_from_display,
    valid_to_mandatory: body.valid_to_mandatory,
    valid_to_display: body.valid_to_display,
    status_mandatory: body.status_mandatory,
    status_display: body.status_display,
    upload_mandatory: body.upload_mandatory,
    upload_display: body.upload_display,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /**Fetching document Type data before update */
  const responseBeforeUpdate = await documentTypeData(condition)
  const beforeUpdateData = responseBeforeUpdate.documentTypeData
  /**Fetching document Type data before update */

  const repositoryResponse = await indexRepository.update('document_types', condition, updateData);

  /**Fetching document Type data after update */
  const responseAfterUpdate = await documentTypeData(condition)
  const afterUpdateData = responseAfterUpdate.documentTypeData
  // let subModule = responseAfterUpdate.subModule
  /**Fetching document Type data after update */

  /**Determine referrable_type */
  let referrable_type
  if (body.category_slug_name === 'placement-documents') {
    referrable_type = 19;
  } else if (body.category_slug_name === 'client-documents') { //client-documents
    referrable_type = 32;
  } else if (body.category_slug_name === 'end-documents') { //end-client-documents
    referrable_type = 33;
  } else if (body.category_slug_name === 'employee-personal-documents') { //Employee Personal Document
    referrable_type = 30;
  } else if (body.category_slug_name === 'raise-invoices-documents') { //raise-invoices-documents
    referrable_type = 34;
  }

  /**Actiivty track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: referrable_type,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Actiivty track */

  return repositoryResponse;
};

/**
 * Update function to modify the status of a document type and track the activity.
 * 
 * Logic:
 * - Define the condition for updating the document type's status based on its ID (body.id).
 * - Create an object containing the updated status data.
 * - Retrieve the document type data from 'document_types' table before the update.
 * - Update the status of document type in 'document_types' table based on condition(defined above)
 * - Fetch the document type data from 'document_types' table after the update.
 * - An activity tracking event is triggered to log the status update event with relevant information.
 * - Return the 'repositoryResponse' response.
 * 
 * @param {Object} body - The request body containing the updated document type status details.
 * @returns {Object} - The response from the repository, indicating the success or failure of the status update.
 */
const updateStatus = async (body, condition) => {

  /* Creating update entry object */
  const updateData = {
    is_active: body.is_active,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /**Fetching document Type data before update */
  const responseBeforeUpdate = await documentTypeData(condition)
  const beforeUpdateData = responseBeforeUpdate.documentTypeData
  /**Fetching document Type data before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
  */
  const repositoryResponse = await indexRepository.update('document_types', condition, updateData);

  /**Fetching document Type data after update */
  const responseAfterUpdate = await documentTypeData(condition)
  const afterUpdateData = responseAfterUpdate.documentTypeData
  // let subModule = responseAfterUpdate.subModule
  /**Fetching document Type data after update */

  let referrable_type
  if (body.category_slug_name === 'placement-documents') {
    referrable_type = 19;
  } else if (body.category_slug_name === 'client-documents') { //client-documents
    referrable_type = 32;
  } else if (body.category_slug_name === 'end-documents') { //end-client-documents
    referrable_type = 33;
  } else if (body.category_slug_name === 'employee-personal-documents') { //Employee Personal Document
    referrable_type = 30;
  } else if (body.category_slug_name === 'raise-invoices-documents') { //raise-invoices-documents
    referrable_type = 34;
  }

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: referrable_type,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

  return repositoryResponse;
};

/**
 * Listing function to retrieve document type data with pagination and associated activity.
 * 
 * Logic:
 * - Define default variables such as the database table name(document_types), selected fields, and table joins.
 * - Use the `indexRepository.findByPagination` function to fetch document type data from 'document_types' table based on the provided condition, page, and limit.
 *   + This includes joining the 'employee' table to retrieve information about the employees who created and updated the document types.
 * - If data exists:
 *   + Initialize variables for responseData, totalDetails, and paginationDetails.
 *   + Iterate over the totalDetails array to create a new object for each item with selected properties,
 *   + and push these objects into the responseData array.
 *   + Fetch and transform activity log details related to the document category and populate the transformedActivity array.
 *   + retrun response object with status true and responseData, activity details, and pagination data.
 * - Else:
 *   + retrun response object with status false and empty data, activity details, and pagination data.
 * 
 * @param {Object} condition - The condition to filter document types.
 * @param {number} page - The page number for pagination.
 * @param {number} limit - The maximum number of items per page.
 * @param {string} documentCategory - The category name of the document type.
 * @returns {Object} - An object containing document type data, activity details, and pagination information.
 */
const listing = async (condition, page, limit, documentCategory) => {
  /* Default variables */
  const tableName = 'document_types';
  const fields = ['document_types.*', 'create.display_name as create_emp', 'update.display_name as updated_emp'];
  const joins = [
    { table: 'employee as create', alias: 'create', condition: ['document_types.created_by', 'create.id'], type: 'left', ignoreDeletedAt: true },
    { table: 'employee as update', alias: 'update', condition: ['document_types.updated_by', 'update.id'], type: 'left', ignoreDeletedAt: true },
  ];
  /* Default variables */
  var documentData = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit);

  if (documentData.status) {
    /* variables */
    const responseData = [];
    const totalDetails = documentData.data;
    const paginationDetails = documentData.pagination;
    /* variables */

    let serialNo = (page - 1) * limit + 1;
    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        serial_no: serialNo,
        id: item.id,
        name: item.name,
        is_active: item.is_active,
        is_editable: item.is_editable,
        number_mandatory: item.number_mandatory,
        number_display: item.number_display,
        valid_from_mandatory: item.valid_from_mandatory,
        valid_from_display: item.valid_from_display,
        valid_to_mandatory: item.valid_to_mandatory,
        valid_to_display: item.valid_to_display,
        status_mandatory: item.status_mandatory,
        status_display: item.status_display,
        upload_mandatory: item.upload_mandatory,
        upload_display: item.upload_display,
        description: (item.description !== null ? item.description : ''),
        created_by: (item.create_emp !== null ? item.create_emp : 'System'),
        updated_by: (item.updated_emp !== null ? item.updated_emp : ''),
      };
      serialNo++;
      responseData.push(listingObject);
    }

    // /* prepare the response */

    return { status: true, data: responseData, pagination_data: paginationDetails };
  } else {
    return { status: false, data: [], activity: [], pagination_data: documentData.pagination };
  }
};

/**
 * Function to fetch document type data based on the provided condition.
 * 
 * Logic:
 * - Fetch data from the 'document_types' table using the provided condition by calling the common find function.
 * - If data exists:
 *   + Prepare the response by iterating over the 'totalDetails' array.
 *   + Create a new 'listingObject' for each 'item' in 'totalDetails' with selected properties.
 *   + Push the 'listingObject' into the 'responseData' array.
 *   + Return an object with '=status true and 'data' containing the 'responseData' array.
 * - Else:
 *   + return the 'documentData' object as it is.
 * 
 * @param {any} condition - The condition to filter the document type data.
 * @returns {Promise<{status: boolean, data: any[]}>} - A promise that resolves to an object
 * containing the status and data of the retrieved document type data. If the status is true,
 * the data will contain an array of document type objects. If the status is false, the data
 * will contain an error message.
 */
const index = async (condition) => {
  var documentData = await indexRepository.find('document_types', ['*'], condition);
  if (documentData.status) {
    /* variables */
    const responseData = [];
    const totalDetails = documentData.data;
    /* variables */

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        id: item.id,
        name: item.name,
        description: (item.description !== null ? item.description : ''),
        number_mandatory: item.number_mandatory,
        number_display: item.number_display,
        valid_from_mandatory: item.valid_from_mandatory,
        valid_from_display: item.valid_from_display,
        valid_to_mandatory: item.valid_to_mandatory,
        valid_to_display: item.valid_to_display,
        status_mandatory: item.status_mandatory,
        status_display: item.status_display,
        upload_mandatory: item.upload_mandatory,
        upload_display: item.upload_display,
        is_active: item.is_active,
        is_editable: item.is_editable,
      };
      responseData.push(listingObject);
    }

    return { status: true, data: responseData };
  } else {
    return documentData;
  }
};


/**
 * Updates the status of a document type in the database.
 * @param {Object} body - The request body containing the necessary data.
 * @returns {Promise<Object>} - A promise that resolves to the repository response.
 */
const documentTypeData = async (condition) => {

  const documentType = await indexRepository.find('document_types', ['*'], condition);
  const documentTypeData = {
    'Name' : documentType.data[0].name,
    'Document Name': documentType.data[0].name,
    'Number Display': documentType.data[0].number_display ? 'Yes' : 'No',
    'Number Mandatory': documentType.data[0].number_mandatory ? 'Yes' : 'No',
    'Valid From Display': documentType.data[0].valid_from_display ? 'Yes' : 'No',
    'Valid From Mandatory': documentType.data[0].valid_from_mandatory ? 'Yes' : 'No',
    'Valid To Display': documentType.data[0].valid_to_display ? 'Yes' : 'No',
    'Valid To Mandatory': documentType.data[0].valid_to_mandatory ? 'Yes' : 'No',
    'Status Display': documentType.data[0].status_display ? 'Yes' : 'No',
    'Status Mandatory': documentType.data[0].status_mandatory ? 'Yes' : 'No',
    'Upload Display': documentType.data[0].upload_display ? 'Yes' : 'No',
    'Upload Mandatory': documentType.data[0].upload_mandatory ? 'Yes' : 'No',
    'Description': documentType.data[0].description,
    'Status': documentType.data[0].is_active ? 'Active' : 'In-active',
  };

  let subModule;
  if (documentType.data[0].document_category_id === 1) {
    subModule = 'placement-documents';
  } else if (documentType.data[0].document_category_id === 2) {
    subModule = 'client-documents';
  } else if (documentType.data[0].document_category_id === 3) {
    subModule = 'end-client-documents';
  } else if (documentType.data[0].document_category_id === 4) {
    subModule = 'employee-personal-documents';
  } else if (documentType.data[0].document_category_id === 5) {
    subModule = 'raise-invoices-documents';
  }
  return  {documentTypeData, subModule};
  
};

/**
 * Delete Document Types to remove a document type from the collection.
 * 
 * Logic:
 * - Create a condition based id('body.document_type_id').
 * - Execute the deletion operation on the 'document_types' table.
 * - Determine the 'subModule' based on the 'document_category_id' as follows:
 *   + If 'document_category_id' is 1, 'subModule' is 'placement-documents'.
 *   + If 'document_category_id' is 2, 'subModule' is 'client-documents'.
 *   + If 'document_category_id' is 3, 'subModule' is 'end-client-documents'.
 *   + If 'document_category_id' is 4, 'subModule' is 'employee-personal-documents'.
 *   + If 'document_category_id' is 5, 'subModule' is 'raise-invoices-documents'.
 * - Record an activity track with the name as a combination of 'name' and the corresponding 'subModule'.
 * - Set the 'configuration_type' to 1 and 'action_type' to 3 for deletion.
 * - Emit an event 'configurationDeleteActivity' to track the activity.
 */
const destroy = async (body, condition) => {

  var updateData = {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by
  };

  await indexRepository.update('document_types', condition, updateData);

  var referrable_type
  if (body.category_slug_name === 'placement-documents') {
    referrable_type = 19;
  } else if (body.category_slug_name === 'client-documents') { //client-documents
    referrable_type = 32;
  } else if (body.category_slug_name === 'end-documents') { //end-client-documents
    referrable_type = 33;
  } else if (body.category_slug_name === 'employee-personal-documents') { //Employee Personal Document
    referrable_type = 30;
  } else if (body.category_slug_name === 'raise-invoices-documents') { //raise-invoices-documents
    referrable_type = 34;
  }

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: referrable_type,
    action_type: 3,
    created_by: body.created_by,
  };
  event.emit('configurationDeleteActivity', activity );
  /**Activity track */
}

module.exports = { index, listing, store, update, destroy, updateStatus };
