const { event } = require('../../../../../../events/configurationActivityEvent');
const moment = require('moment');
const indexRepository = require('../../../repositories/index');
const format = require('../../../../../../helpers/format');

/**
 * Index Function to get educational level data.
 * 
 * Logic:
 * - Fetch the data from the 'educational_levels' table using condition(param) by calling common find function.
 *  - If data exists,
 *   + Iterate the loop and push to an object 
 *   + Prepare the response 
 *   + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 *
 * @param {object} condition - The condition to filter the data.
 * @returns {object} - An object containing the status and data of the retrieved education level.
 *                    If the status is true, the data will contain an array of education level objects.
 *                    Each education level object will have the following properties:
 *                    - id: The ID of the education level.
 *                    - name: The name of the education level.
 *                    - description: The description of the education level. If null, it will be an empty string.
 *                    - is_active: A boolean indicating if the education level is active.
 *                    - is_editable: A boolean indicating if the education level is editable.
 */
const index = async (condition) => {
  /* Default variables */
  const tableName = 'education_levels';
  const fields = ['education_levels.*'];
  /* Default variables */
  const educationLevel = await indexRepository.find(tableName, fields, condition);
  if (educationLevel.status) {
    /* variables */
    const responseData = [];
    const totalDetails = educationLevel.data;
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
    return educationLevel;
  }
};

/**
 * Listing Function to get educational level data.
 * Logic:
 * - Fetch the data from the 'educational_levels' table using condition(param) by calling common findByPagination function.
 *  - If data exists,
 *    + loop the data and push the object in to an array and add serial number to the object 
 *    + Prepare the response 
 *    - Fetch the data from the 'configuration_activity_track table using common find function.
 *    - looping the activity data and push it in to an array and returning in response
 *    + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {object} condition - The condition to filter the education levels.
 * @param {number} page - The page number of the pagination.
 * @param {number} limit - The number of items per page.
 * @param {string} sortColumn - The column to sort the results by.
 * @param {string} sortOrder - The order to sort the results in.
 * @returns {object} An object containing the paginated education levels, activity tracking information, and pagination details.
 */
const listing = async (condition, page, limit, sortColumn, sortOrder) => {
  /* Default variables */
  const tableName = 'education_levels';
  const fields = ['education_levels.*', 'create.display_name as create_emp', 'update.display_name as updated_emp'];
  const joins = [
    { table: 'employee as create', alias: 'create', condition: ['education_levels.created_by', 'create.id'], type: 'left', ignoreDeletedAt: true },
    { table: 'employee as update', alias: 'update', condition: ['education_levels.updated_by', 'update.id'], type: 'left', ignoreDeletedAt: true },
  ];
  /* Default variables */
  const educationLevel = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit, sortColumn, sortOrder);

  if (educationLevel.status === true) {
    /* variables */
    const responseData = [];
    const totalDetails = educationLevel.data;
    const paginationDetails = educationLevel.pagination;
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

    return { status: true, data: responseData,  pagination_data: paginationDetails };
  } else {
    return educationLevel;
  }
};

/**
 * Store Function to save educational level data.
 * 
 * Logic:
 * - Prepare educational level data object.
 * - Store the educational level data into 'educational_levels' table. 
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the educational level activity
 * - Return the result of the educational level data storage.
 * 
 * @param {Object} body - The request body containing the educational level details.
 * @returns {Promise<Object>} - A promise that resolves to the stored educational level object.
 */
const store = async (body) => {

  /* Creating store entry object */
  const newEducationalLevel = {
    name: body.name,
    description: body?.description || null,
    is_active: body.is_active,
    created_at: new Date(),
    created_by: body.created_by,
  };
  /* Creating store entry object */

  const educationLevel = await indexRepository.store('education_levels', newEducationalLevel);

  /**Activity track */
  const activity = {
    referrable_id: educationLevel.data[0].id,
    referrable_type: 3,
    action_type: 1,
    created_by: body.created_by,
  };
  event.emit('configurationStoreActivity',  { activity } );
  /**Activity track */

  return educationLevel;
};

/**
 * update Function to update educational level data.
 * 
 * Logic:
 * - Prepare educational level data object.
 * - update the educational level data into 'educational_levels' table from the condition in params. 
 * - fetch the educational level details before and after the the update for activity track
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the educational level activity
 * - Return the result of the educational level data update.
 * 
 * @param {Object} body - The data to update the education level with.
 * @param {object} condition - The conditions to filter the education level data.
 * @returns {Promise<Object>} - A promise that resolves to the response from the database update operation.
 * @throws {Error} - If there is an error during the update operation.
 */
const update = async (body, condition) => {

  /* Creating update entry object */
  const updateData = {
    name: body.name,
    is_active: body.is_active,
    description: body.description,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /**Fetching education level data before update */
  const beforeUpdateData = await getEducationLevelData(condition)
  /**Fetching education level data before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
  */
  const repositoryResponse = await indexRepository.update('education_levels', condition, updateData);

  /**Fetching education level data after update */
  const afterUpdateData = await getEducationLevelData(condition)
  /**Fetching education level data after update */


  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 3,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

  return repositoryResponse;
};

/**
 * update-status Function to update educational level data.
 * 
 * Logic:
 * - Prepare educational level data object.
 * - update the educational level data into 'educational_levels' table from the condition in params. 
 * - fetch the educational level details before and after the the update for activity track
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the educational level activity
 * - Return the result of the educational level data update.
 * 
 * @param {Object} body - The request body containing the necessary data.
 * @param {object} condition - The conditions to filter the education level data.
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

  /**Fetching education level data before update */
  const beforeUpdateData = await getEducationLevelData(condition)
  /**Fetching education level data before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
  */
  const repositoryResponse = await indexRepository.update('education_levels', condition, updateData);

  /**Fetching education level data after update */
  const afterUpdateData = await getEducationLevelData(condition)
  /**Fetching education level data after update */

  /**Activity track */
  const activity = {
    referrable_id: repositoryResponse.data[0].id,
    referrable_type: 3,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

  return repositoryResponse;
};

/**
 * get educational level Function to get educational level data.
 
 * Logic:
 * - Fetch the data from the 'educational_levels' table using condition(param) by calling common find function.
 *  - If data exists,
 *    + Prepare the response 
 *    + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * */
const getEducationLevelData = async (condition) => {

  // getting the education data
  const educationLevelData = await indexRepository.find('education_levels', ['*'], condition);

  /* Creating the object */
  const responseData = {
    'Name': educationLevelData.data[0].name,
    'Description': educationLevelData.data[0].description,
    'Status': educationLevelData.data[0].is_active === true ? 'Active' : 'In-active',
  };
  /* Creating the object */

  return responseData
}

/**
 * Destroy Function to delete education level data.
 * 
 * Logic:
 * - Prepare the condition for data deletion.
 * - Delete the education level data from 'education_levels' table. 
 * - Prepare the activity object to send to the activity
 * - Trigger the activity event to store the education level activity
 * - Return the result of the education level data deletion.
 *
 * @param {Object} body - The request body containing the educational level details.
 * @param {Object} condition - The condition for the data.
 * @returns {Promise<Object>} - A promise that
 */
const destroy = async (body, condition) => {

  var updateData = {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by
  };

  await indexRepository.update('education_levels', condition , updateData );

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 3,
    action_type: 3,
    created_by: body.created_by,
  };
  event.emit('configurationDeleteActivity', activity);
  /**Activity track */
}

module.exports = { index, listing, store, update, updateStatus, destroy };
