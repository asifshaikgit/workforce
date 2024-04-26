const indexRepository = require('../../../repositories/index');
const { event } = require('../../../../../../events/configurationActivityEvent');
const moment = require('moment');
const format = require('../../../../../../helpers/format');

/**
 * Index Function to get visa type data.
 * 
 * Logic:
 * - Fetch the data from the 'visa_types' table using condition(param) by calling common find function.
 *  - If data exists,
 *   + Iterate the loop and push to an object 
 *   + Prepare the response 
 *   + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 *
 * @param {object} condition
 * @return Json
 *
 */
const index = async (condition) => {

  /**
   * Calling a  index function.
   * Based on the status in the function response, prepare the response and return to controller
   *
  */
  const visaType = await indexRepository.find('visa_types', ['*'], condition);
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
 * Visa Type Store request to store visa type data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Store the details in 'visa_types' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + employment_type_id(body) is mandatory, it should be a integer and checked for its existence in 'employment_types' table.
 *    + name(body) is mandatory, it should not contain certain special characters and its existence is checked in 'visa_types' table to avoid duplicates.
 *    + is_active(body) is mandatory and should be a boolean.
 *  - Run the validation rules
 *    + If validation success
 *      ~ Call the service function(store) to store the data and send request body to the store function.
 *        # Add the service function(store) return data to response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Logging the response
 *  - Return response using responseHandler()  
 *        
 * Notes :
 *    - Handling expection using try catch
 * 
 *
 * @param {object} body
 * @return Json
 */
const store = async (body) => {

  /* Creating store entry object */
  const newVisaType = {
    name: body.name,
    description: body?.description || null,
    is_active: body.is_active,
    created_at: new Date(),
    created_by: body.created_by,
  };
  /* Creating store entry object */

  const visaList = await indexRepository.store('visa_types', newVisaType);

  /**Activity track */
  const activity = {
    referrable_id: visaList.data[0].id,
    referrable_type: 7,
    action_type: 1,
    created_by: body.created_by,
  };
  event.emit('configurationStoreActivity', { activity });
  /**Activity track */

  return visaList;
};

/**
 * update Function to update visa type data.
 * 
 * Logic:
 * - Prepare visa type data object.
 * - update the visa type data into 'visa_types' table from the condition in params. 
 * - fetch the visa type details before and after the the update for activity track
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the visa type activity
 * - Return the result of the visa type data update.
 * .
 *
 * @param {object} body
 * @return Json
 *
 */
const update = async (body, condition) => {

  /* storeing update entry object */
  const updateData = {
    name: body.name,
    is_active: body.is_active,
    description: body?.description || null,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* storeing update entry object */

  /**Fetching visa type details before update */
  const beforeUpdateData = await getVisaTypeData(condition)
  /**Fetching visa type details before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
   */
  const repositoryResponse = await indexRepository.update('visa_types', condition, updateData);

  /**Fetching visa type details before update */
  const afterUpdateData = await getVisaTypeData(condition)
  /**Fetching visa type details before update */

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 7,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

  return repositoryResponse;
};

/**
 * update-status Function to update visa type data.
 * 
 * Logic:
 * - Prepare visa type data object.
 * - update the visa type data into 'visa_types' table from the condition in params. 
 * - fetch the visa type details before and after the the update for activity track
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the visa type activity
 * - Return the result of the visa type data update.
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

  /**Fetching visa type details before update */
  const beforeUpdateData = await getVisaTypeData(condition)
  /**Fetching visa type details before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
   */
  const repositoryResponse = await indexRepository.update('visa_types',
    condition,
    updateData,
  );

  /**Fetching visa type details before update */
  const afterUpdateData = await getVisaTypeData(condition)
  /**Fetching visa type details before update */

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 7,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

  return repositoryResponse;
};

/**
 * Get visa type details
 * @param {*} condition 
 * @returns 
 */
const getVisaTypeData = async (condition) => {
  const visaTypeData = await indexRepository.find('visa_types', ['*'], condition);

  const responseData = {
    'Name': visaTypeData.data[0].name,
    'Description': visaTypeData.data[0].description,
    'Status': visaTypeData.data[0].is_active === true ? 'Active' : 'In-active',
  };

  return responseData
}

/**
 * Listing Function to get visa type data.
 * Logic:
 * - Fetch the data from the 'visa_types' table using condition(param) by calling common findByPagination function.
 *  - If data exists,
 *    + loop the data and push the object in to an array and add serial number to the object 
 *    + Prepare the response 
 *    - Fetch the data from the 'configuration_activity_track table using common find function.
 *    - looping the activity data and push it in to an array and returning in response
 *    + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {object} condition - The condition to filter the visa_types by.
 * @param {number} page - The page number of the results to retrieve.
 * @param {number} limit - The maximum number of results per page.
 * @param {string} sortColumn - The page number of the results to retrieve.
 * @param {string} sortOrder - The maximum number of results per page.
 * @returns {object} - An object containing the status, data, and pagination details of the retrieved visa_types.
 * @return Json
 *
 */
const listing = async (condition, page, limit, sortColumn, sortOrder) => {
  /* Default variables */
  const tableName = 'visa_types';
  const fields = ['visa_types.*', 'create.display_name as create_emp', 'update.display_name as updated_emp'];
  const joins = [
    { table: 'employee as create', alias: 'create', condition: ['visa_types.created_by', 'create.id'], type: 'left' },
    { table: 'employee as update', alias: 'update', condition: ['visa_types.updated_by', 'update.id'], type: 'left' },
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
 * Destroy Function to delete visa type data.
 * 
 * Logic:
 * - Prepare the condition for data deletion.
 * - Delete the visa type data from 'visa_types' table. 
 * - Prepare the activity object to send to the activity
 * - Trigger the activity event to store the visa type activity
 * - Return the result of the visa type data deletion.
 * 
 * @param {Object} body - The request body containing the visa type details.
 * @param {Object} condition - The condition for the data.
 * @returns {Promise<Object>} - A promise that
 */
const destroy = async (body, condition) => {

  /* Creating update entry object */
  const updateData = {
    updated_by: body.updated_by,
    updated_at: new Date(),
    deleted_at: new Date(),
  };
  /* Creating update entry object */

  // calling the update function
  await indexRepository.update('visa_types', condition, updateData);

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 7,
    action_type: 3,
    created_by: body.created_by,
  };
  event.emit('configurationDeleteActivity', activity);
  /**Activity track */
}

module.exports = { index, store, update, listing, updateStatus, destroy };
