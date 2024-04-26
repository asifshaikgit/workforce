const indexRepository = require('../../../repositories/index');
const { event } = require('../../../../../../events/configurationActivityEvent');
const format = require('../../../../../../helpers/format');
const moment = require('moment');

/**
 * Listing Function to get country data.
 * Logic:
 * - Fetch the data from the 'countries' table using condition(param) by calling common findByPagination function.
 *  - If data exists,
 *    + loop the data and push the object in to an array and add serial number to the object 
 *    + Prepare the response 
 *    - Fetch the data from the 'configuration_activity_track table using common find function.
 *    - looping the activity data and push it in to an array and returning in response
 *    + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {object} condition - The condition to filter the countries by.
 * @param {number} page - The page number of the results to retrieve.
 * @param {number} limit - The maximum number of results per page.
 * @returns {object} - An object containing the status, data, and pagination details of the retrieved countries.
 */
const listing = async (condition, page, limit) => {
  /* Default variables */
  const tableName = 'countries';
  const fields = ['countries.id', 'countries.name', 'countries.description', 'countries.is_active', 'countries.is_editable', 'countries.country_flag_link',  'create.display_name as create_emp', 'update.display_name as updated_emp'];
  const joins = [
    { table: 'employee as create', alias: 'create', condition: ['countries.created_by', 'create.id'], type: 'left' },
    { table: 'employee as update', alias: 'update', condition: ['countries.updated_by', 'update.id'], type: 'left' },
  ];
  /* Default variables */

  /**
   * Retrieves data from the index repository based on pagination parameters.
   */
  const country = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit);

  // Transforms the country data into a new format if the status is true.
  if (country.status === true) {
    /* variables */
    const responseData = [];
    const totalDetails = country.data;
    const paginationDetails = country.pagination;
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
        country_flag_link: item.country_flag_link ? item.country_flag_link : '',
        created_by: (item.create_emp !== null ? item.create_emp : 'System'),
        updated_by: (item.updated_emp !== null ? item.updated_emp : ''),
      };
      serialNo++;
      responseData.push(listingObject);
    }

    return { status: true, data: responseData, pagination_data: paginationDetails };
  } else {
    return country;
  }
};

/**
 * Store Function to save country data.
 * 
 * Logic:
 * - Prepare country data object.
 * - Store the country data into 'countries' table. 
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the country activity
 * - Return the result of the country data storage.
 * 
 * @param {Object} body - The request body containing the country information.
 * @returns {Promise<Object>} - A promise that resolves to the list of countries
 */
const store = async (body) => {
  /* Creates a new country object */
  const newCountry = {
    name: body.name,
    description: body.description,
    is_active: body.is_active,
    country_flag_link: body.country_flag_link ? body.country_flag_link: null,
    created_at: new Date(),
    created_by: body.created_by,
  };
  /* Creates a new country object */

  /**
   * Stores a new country in the 'countries' table.
   */
  const countryList = await indexRepository.store('countries', newCountry);

  /**activity track */
  const activity = {
    referrable_id: countryList.data[0].id,
    referrable_type: 13,
    action_type: 1,
    created_by: body.created_by,
  };
  event.emit('configurationStoreActivity', { activity });
  /**activity track */

  return countryList;
};

/**
 * update Function to update country data.
 * 
 * Logic:
 * - Prepare country data object.
 * - update the country data into 'countries' table from the condition in params. 
 * - fetch the country details before and after the the update for activity track
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the country activity
 * - Return the result of the country data update.
 * 
 * @param {Object} body - The data to update the record with.
 * @returns {Promise<Object>} - A promise that resolves to the response
 */
const update = async (body, condition) => {

  /* Creates an object with updated data */
  const updateData = {
    name: body.name,
    is_active: body.is_active,
    description: body.description,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creates an object with updated data */

  /**Fetching the country data before update */
  const beforeUpdateData = await getCountry({ 'countries.id': condition.id })
  /**Fetching the country data before update */

  /**
   * Updates the 'countries' table with the given condition and update data.
   */
  const repositoryResponse = await indexRepository.update('countries', condition, updateData);

  /**Fetching country status after update */
  const afterUpdateData = await getCountry({ 'countries.id': condition.id })
  /**Fetching country status after update */

  /**Activity track */
  const activity = {
    referrable_id: repositoryResponse.data[0].id,
    referrable_type: 13,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */
  return repositoryResponse;
};

/**
 * update-status Function to update country data.
 * 
 * Logic:
 * - Prepare country data object.
 * - update the country data into 'countries' table from the condition in params. 
 * - fetch the country details before and after the the update for activity track
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the country activity
 * - Return the result of the country data update.
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

  /**Fetching country status before update */
  const beforeUpdateData = await getCountry({ 'countries.id': condition.id })
  /**Fetching country status before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
   */
  const repositoryResponse = await indexRepository.update('countries', condition, updateData);

  /**Fetching country status after update */
  const afterUpdateData = await getCountry({ 'countries.id': condition.id })
  /**Fetching country status after update */

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 13,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

  return repositoryResponse;
};

/**
 * get country Function to get country data.
 
 * Logic:
 * - Fetch the data from the 'countries' table using condition(param) by calling common find function.
 *  - If data exists,
 *    + Prepare the response 
 *    + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {*} condition
 * @return {*} 
 */
const getCountry = async (condition) => {

  const fields = ['countries.*'];

  // getting country details
  const countryData = await indexRepository.find('countries', fields, condition);

  /* Creating the object */
  const responseData = {
    'Name': countryData.data[0].name,
    'Description': countryData.data[0].description,
    'Status': countryData.data[0].is_active == true ? 'Active' : 'In-active'
  };
  /* Creating the object */

  return responseData
}

/**
 * Destroy Function to delete country data.
 * 
 * Logic:
 * - Prepare the condition for data deletion.
 * - Delete the country data from 'countries' table. 
 * - Prepare the activity object to send to the activity
 * - Trigger the activity event to store the country activity
 * - Return the result of the country data deletion.
 * 
 * @param {Object} body - The request body containing the country details.
 * @param {Object} condition - The condtiton for the data.
 * @returns {Promise<Object>} - A promise that
 */
const destroy = async (body, condition) => {

  var updateData = {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by
  };

  // calling the destroy function
  await indexRepository.update('countries', condition, updateData);

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 13,
    action_type: 3,
    created_by: body.created_by,
  };
  event.emit('configurationDeleteActivity', activity);
  /**Activity track */
}

module.exports = { listing, store, update, updateStatus, destroy };
