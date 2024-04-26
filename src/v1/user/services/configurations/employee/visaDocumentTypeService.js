const { event } = require('../../../../../../events/configurationActivityEvent');
const moment = require('moment');
const indexRepository = require('../../../repositories/index');
const format = require('../../../../../../helpers/format');

/**
 * Index Function to get visa document data.
 * 
 * Logic:
 * - Fetch the data from the 'visa_documents' table using condition(param) by calling common find function.
 *  - If data exists,
 *   + Iterate the loop and push to an object 
 *   + Prepare the response 
 *   + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {any} condition - The condition to filter the visa document types.
 * @returns {Promise<any>} - A promise that resolves to an object with status and data properties.
 *                          - If status is true, data will contain the retrieved visa document types.
 *                          - If status is false, data will contain the error message.
 */
const index = async (condition) => {
  /**
   * Calling a  index function.
   * Based on the status in the function response, prepare the response and return to controller
   *
  */
  const visaType = await indexRepository.find('visa_document_types', ['*'], condition);
  if (visaType.status === true) {
    /* variables */
    const responseData = [];
    const totalDetails = visaType.data;
    /* variables */

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        id: item.id,
        name: item.name,
        visa_type_id: item.visa_type_id,
        visa_type_name: item.visa_type_name,
        description: (item.description !== null ? item.description : ''),
        is_active: item.is_active,
        is_editable: item.is_editable,
      };
      responseData.push(listingObject);
    }

    return { status: true, data: responseData[0] };
  } else {
    return visaType;
  }
};

/**
 * Store Function to save visa document data.
 * 
 * Logic:
 * - Prepare visa document data object.
 * - Store the visa document data into 'visa_documents' table. 
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the visa document activity
 * - Return the result of the visa document data storage.
 * 
 * @param {object} body
 * @return Json
 */
const store = async (body) => {

  /* Creating store entry object */
  const newVisaDocument = {
    name: body.name,
    visa_type_id: body.visa_type_id,
    description: body?.description || null,
    is_active: body.is_active,
    created_at: new Date(),
    created_by: body.created_by,
  };
  /* Creating store entry object */

  const visaDocumentList = await indexRepository.store('visa_document_types', newVisaDocument);

  /**Activity track */
  const activity = {
    referrable_id: visaDocumentList.data[0].id,
    referrable_type: 8,
    action_type: 1,
    created_by: body.created_by,
  };
  event.emit('configurationStoreActivity',{ activity } );
  /**Activity track */

  return visaDocumentList;
};

/**
 * update Function to update visa document data.
 * 
 * Logic:
 * - Prepare visa document data object.
 * - update the visa document data into 'visa_documents' table from the condition in params. 
 * - fetch the visa document details before and after the the update for activity track
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the visa document activity
 * - Return the result of the visa document data update.
 * 
 *
 * @param {object} body
 * @return Json
 *
 */
const update = async (body, condition) => {

  /* storeing update entry object */
  const updateData = {
    name: body.name,
    visa_type_id: body.visa_type_id,
    is_active: body.is_active,
    description: body.description,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* storeing update entry object */

  /**Fetching visa document type details before data */
  const beforeUpdateData = await getVisaDocumentTypeData({ 'visa_document_types.id': condition.id })
  /**Fetching visa document type details before data */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
   */
  const repositoryResponse = await indexRepository.update('visa_document_types', condition, updateData);

  /**Fetching visa document type details after data */
  const afterUpdateData = await getVisaDocumentTypeData({ 'visa_document_types.id': condition.id })
  /**Fetching visa document type details after data */

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 8,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

  return repositoryResponse;
};

/**
 * update-status Function to update visa document data.
 * 
 * Logic:
 * - Prepare visa document data object.
 * - update the visa document data into 'visa_documents' table from the condition in params. 
 * - fetch the visa document details before and after the the update for activity track
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the visa document activity
 * - Return the result of the visa document data update.
 * 
 *
 * @param {object} body
 * @return Json
 *
 */
const updateStatus = async (body, condition) => {

  /* storeing update entry object */
  const updateData = {
    is_active: body.is_active,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* storeing update entry object */

  /**Fetching visa document type details before data */
  const beforeUpdateData = await getVisaDocumentTypeData({ 'visa_document_types.id': condition.id })
  /**Fetching visa document type details before data */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
   */
  const repositoryResponse = await indexRepository.update('visa_document_types', condition, updateData);

  /**Fetching visa document type details after data */
  const afterUpdateData = await getVisaDocumentTypeData({ 'visa_document_types.id': condition.id })
  /**Fetching visa document type details after data */

  const activity = {
    referrable_id: repositoryResponse.data[0].id,
    referrable_type: 8,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  return repositoryResponse;
};

/**
 * get visa document Function to get category data.
 
 * Logic:
 * - Fetch the data from the 'visa_documents' table using condition(param) by calling common find function.
 *  - If data exists,
 *    + Prepare the response 
 *    + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * */
const getVisaDocumentTypeData = async (condition) => {

  /**default variables */
  const fields = ['visa_document_types.*', 'visa_types.name as visa_type_name'];
  const joins = [
    { table: 'visa_types', condition: ['visa_document_types.visa_type_id', 'visa_types.id'], type: 'left' },
  ];
  /**default variables */

  const visaDocumnetTypeData = await indexRepository.find('visa_document_types', fields, condition, null, joins);

  const responseData = {
    'Name': visaDocumnetTypeData.data[0].name,
    'Visa Type': visaDocumnetTypeData.data[0].visa_type_name,
    'Description': visaDocumnetTypeData.data[0].description,
    'Status': visaDocumnetTypeData.data[0].is_active === true ? 'Active' : 'In-active',
  };

  return responseData
}

/**
 * Listing Function to get visa document data.
 * Logic:
 * - Fetch the data from the 'visa_documents' table using condition(param) by calling common findByPagination function.
 *  - If data exists,
 *    + loop the data and push the object in to an array and add serial number to the object 
 *    + Prepare the response 
 *    - Fetch the data from the 'configuration_activity_track table using common find function.
 *    - looping the activity data and push it in to an array and returning in response
 *    + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * .
 * @param {object} condition - The condition to filter the visa_documents by.
 * @param {number} page - The page number of the results to retrieve.
 * @param {number} limit - The maximum number of results per page.
 * @param {string} sortColumn - The page number of the results to retrieve.
 * @param {string} sortOrder - The maximum number of results per page.
 * @returns {object} - An object containing the status, data, and pagination details of the retrieved visa_documents.
 * @return Json
 *
 */
const listing = async (condition, page, limit, sortColumn, sortOrder) => {
  /* Default variables */
  const tableName = 'visa_document_types';
  const fields = ['visa_document_types.*', 'visa_types.name as visa_type_name', 'create.display_name as create_emp', 'update.display_name as updated_emp'];
  const joins = [
    { table: 'visa_types', condition: ['visa_document_types.visa_type_id', 'visa_types.id'], type: 'inner' },
    { table: 'employee as create', alias: 'create', condition: ['visa_document_types.created_by', 'create.id'], type: 'left' },
    { table: 'employee as update', alias: 'update', condition: ['visa_document_types.updated_by', 'update.id'], type: 'left' },
  ];
  /* Default variables */
  const visaTitle = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit, sortColumn, sortOrder);

  if (visaTitle.status === true) {
    /* variables */
    const responseData = [];
    const totalDetails = visaTitle.data;
    const paginationDetails = visaTitle.pagination;
    /* variables */

    let serialNo = (page - 1) * limit + 1;
    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        serial_no: serialNo,
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        visa_type_id: item.visa_type_id,
        visa_type_name: item.visa_type_name,
        description: (item.description !== null ? item.description : ''),
        is_active: item.is_active,
        is_editable: item.is_editable,
        created_by: (item.create_emp !== null ? item.create_emp : 'System'),
        updated_by: (item.updated_emp !== null ? item.updated_emp : ''),
      };
      serialNo++;
      responseData.push(listingObject);
    }

    /* prepare the response */

    return {
      status: true,
      data: responseData,
      // activity: transformedActivity,
      pagination_data: paginationDetails,
    };
  } else {
    return visaTitle;
  }
};

/**
 * Destroy Function to delete visa document data.
 * 
 * Logic:
 * - Prepare the condition for data deletion.
 * - Delete the visa document data from 'visa_documents' table. 
 * - Prepare the activity object to send to the activity
 * - Trigger the activity event to store the visa document activity
 * - Return the result of the visa document data deletion.
 * 
 * @param {Object} body - The request body containing the visa document details.
 * @param {Object} condition - The condtiton for the data.
 * @returns {Promise<Object>} - A promise that
 */
const destroy = async (body, condition) => {

  var updateData = {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by
  };

  await indexRepository.update('visa_document_types', condition, updateData);

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 8,
    action_type: 3,
    created_by: body.created_by,
  };
  event.emit('configurationDeleteActivity', activity);
  /**Activity track */
}

module.exports = { index, store, update, listing, updateStatus, destroy };
