const indexRepository = require('../../../repositories/index');
const { event } = require('../../../../../../events/configurationActivityEvent');
const format = require('../../../../../../helpers/format');
const moment = require('moment');

/**
 * Listing Function to get state data.
 * Logic:
 * - Fetch the data from the 'states' table using condition(param) by calling common findByPagination function.
 *  - If data exists,
 *    + loop the data and push the object in to an array and add serial number to the object 
 *    + Prepare the response 
 *    - Fetch the data from the 'configuration_activity_track' table using common find function.
 *    - looping the activity data and push it in to an array and returning in response
 *    + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {object} condition - The condition to filter the states by.
 * @param {number} page - The page number of the results to retrieve.
 * @param {number} limit - The maximum number of results per page.
 * @returns {object} - An object containing the status, data, and pagination details of the retrieved states.
 */
const listing = async (condition, page, limit) => {

  /* Default variables */
  const tableName = 'states';
  const fields = ['states.id', 'states.name', 'states.country_id', 'states.description', 'states.is_active', 'states.is_editable', 'countries.name as country_name', 'create.display_name as create_emp', 'update.display_name as updated_emp'];
  const joins = [
    { table: 'countries', condition: ['states.country_id', 'countries.id'], type: 'inner' },
    { table: 'employee as create', alias: 'create', condition: ['states.created_by', 'create.id'], type: 'left' },
    { table: 'employee as update', alias: 'update', condition: ['states.updated_by', 'update.id'], type: 'left' },
  ];
  /* Default variables */

  /**
   * Retrieves data from the index repository based on pagination parameters.
   */
  const state = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit, null, null, true);

  // Transforms the state data into a new format if the status is true.
  if (state.status === true) {
    /* variables */
    const responseData = [];
    const totalDetails = state.data;
    const paginationDetails = state.pagination;
    /* variables */

    let serialNo = (page - 1) * limit + 1;
    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        serial_no: serialNo,
        id: item.id,
        name: item.name,
        country_id: item.country_id,
        country_name: item.country_name,
        description: (item.description !== null ? item.description : ''),
        is_active: item.is_active,
        is_editable: item.is_editable,
        created_by: (item.create_emp !== null ? item.create_emp : 'System'),
        updated_by: (item.updated_emp !== null ? item.updated_emp : ''),
      };
      serialNo++;
      responseData.push(listingObject);
    }

    return { status: true, data: responseData, pagination_data: paginationDetails };
  } else {
    return state;
  }
};

/**
 * Store Function to save state data.
 * 
 * Logic:
 * - Prepare state data object.
 * - Store the state data into 'states' table. 
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the state activity
 * - Return the result of the state data storage.
 * 
 * @param {Object} body - The request body containing the state information.
 * @returns {Promise<Object>} - A promise that resolves to the list of countries
 */
const store = async (body) => {
  /* Creates a new state object */
  const newState = {
    name: body.name,
    country_id: body.country_id,
    description: body?.description,
    is_active: body.is_active,
    created_at: new Date(),
    created_by: body.created_by,
  };
  /* Creates a new state object */

  /**
   * Stores a new state in the 'states' table.
   */
  const stateList = await indexRepository.store('states', newState);

  /**activity track */
  const activity = {
    referrable_id: stateList.data[0].id,
    referrable_type: 14,
    action_type: 1,
    created_by: body.created_by,
  };
  event.emit('configurationStoreActivity', { activity });
  /**activity track */

  return stateList;
};


/**
 * update Function to update state data.
 * 
 * Logic:
 * - Prepare state data object.
 * - update the state data into 'states' table from the condition in params. 
 * - fetch the state details before and after the the update for activity track
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the state activity
 * - Return the result of the state data update.
 * 
 * @param {Object} body - The data to update the record with.
 * @param {Object} condition - The condition of the state to update.
 * @returns {Promise<Object>} - A promise that resolves to the response
 */
const update = async (body, condition) => {

  /* Creates an object with updated data */
  const updateData = {
    name: body.name,
    country_id: body.country_id,
    is_active: body.is_active,
    description: body.description,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creates an object with updated data */

  /**Fetching the state data before update */
  const beforeUpdateData = await getState({ 'states.id': condition.id })
  /**Fetching the state data before update */

  /**
   * Updates the 'states' table with the given condition and update data.
   */
  const repositoryResponse = await indexRepository.update('states', condition, updateData);

  /**Fetching state status after update */
  const afterUpdateData = await getState({ 'states.id': condition.id })
  /**Fetching state status after update */

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 14,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */
  return repositoryResponse;
};

/**
* get state Function to get state data.
 
* Logic:
* - Fetch the data from the 'states' table using condition(param) by calling common find function.
*  - If data exists,
*    + Prepare the response 
*    + return the response with status as true
*  - Else 
*    + return the response with status as false 
* 
* @param {*} condition
* @return {*} 
*/
const getState = async (condition) => {

  const fields = ['states.*', 'countries.name as country_name'];
  let joins = [{ table: 'countries', condition: ['states.country_id', 'countries.id'], type: 'inner' }]

  // getting state details
  const stateData = await indexRepository.find('states', fields, condition, null, joins);

  /* Creating the object */
  const responseData = {
    'Name': stateData.data[0].name,
    'country Name': stateData.data[0].country_name,
    'Description': stateData.data[0].description,
    'Status': stateData.data[0].is_active == true ? 'Active' : 'In-active'
  };
  /* Creating the object */

  return responseData
}

/**
 * update-status Function to update state data.
 * 
 * Logic:
 * - Prepare state data object.
 * - update the state data into 'states' table from the condition in params. 
 * - fetch the state details before and after the the update for activity track
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the state activity
 * - Return the result of the state data update.
 * 
 * @param {Object} body - The request body containing the necessary data.
 * @param {Object} condition - The condtiton for the data.
 * @returns {Promise<Object>} - A promise that resolves to the repository response.
 * @throws {Error} - If there is an error during the update process.
 */
const updateStatus = async (body, condition) => {

  /* Creating update entry object */
  const updateData = {
    is_active: body.is_active,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /**Fetching state status before update */
  const beforeUpdateData = await getState({ 'states.id': condition.id })
  /**Fetching state status before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
   */
  const repositoryResponse = await indexRepository.update('states', condition, updateData);

  /**Fetching state status after update */
  const afterUpdateData = await getState({ 'states.id': condition.id })
  /**Fetching state status after update */

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 14,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

  return repositoryResponse;
};

/**
 * Destroy Function to delete state data.
 * 
 * Logic:
 * - Prepare the condition for data deletion.
 * - Delete the state data from 'states' table. 
 * - Prepare the activity object to send to the activity
 * - Trigger the activity event to store the state activity
 * - Return the result of the state data deletion.
 * 
 * @param {Object} body - The request body containing the state details.
 * @param {Object} condition - The condtiton for the data.
 * @returns {Promise<Object>} - A promise that
 */
const destroy = async (body, condition) => {

  var updateData = {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by
  };

  // calling the update function
  await indexRepository.update('states', condition , updateData);

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 14,
    action_type: 3,
    created_by: body.created_by,
  };
  event.emit('configurationDeleteActivity', activity);
  /**Activity track */
}

module.exports = { listing, store, update, updateStatus, destroy };
