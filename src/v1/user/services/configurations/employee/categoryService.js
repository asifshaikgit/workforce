const { event } = require('../../../../../../events/configurationActivityEvent');
const indexRepository = require('../../../repositories/index');
const { getCategory } = require('../commonService');

/**
 * Store Function to save category data.
 * 
 * Logic:
 * - Prepare category data object.
 * - Store the category data into 'employee_categories' table. 
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the category activity
 * - Return the result of the category data storage.
 * 
 * @param {Object} body - The request body containing the category details.
 * @returns {Promise<Object>} - A promise that
 */
const store = async (body) => {

  /* Creating store entry object */
  const newCategory = {
    name: body.name,
    employment_type_id: body.employment_type_id,
    description: body?.description || null,
    is_active: body.is_active,
    created_at: new Date(),
    created_by: body.created_by,
  };
  /* Creating store entry object */

  const category = await indexRepository.store('employee_categories', newCategory);

  /**activity track */
  // Create Change Log
  const change_log = [
    {
      'label_name': 'name',
      'value': body.name,
      'action_by': body.created_by
    }
  ];
  const activity = {
    referrable_id: category.data[0].id,
    referrable_type: 1,
    action_type: 1,
    created_by: body.created_by,
    change_log: JSON.stringify(change_log)
  };
  event.emit('configurationStoreActivity', { activity });
  /**activity track */

  return category;
};

/**
 * Index Function to get category data.
 * 
 * Logic:
 * - Fetch the data from the 'employee_categories' table using condition(param) by calling common find function.
 *  - If data exists,
 *   + Iterate the loop and push to an object 
 *   + Prepare the response 
 *   + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {object} condition - The condition to filter the employee_categories by.
 * @returns {object} - An object containing the status and data of the retrieved employee_categories.
 * If the status is true, the data will contain an array of state objects.
 * If the status is false, the data will contain an empty array and the message will contain error message.
 */
const index = async (condition) => {
  /* Default variables */
  const tableName = 'employee_categories';
  const fields = ['employee_categories.*', 'employment_types.name as employment_type_name'];
  const joins = [
    { table: 'employment_types', condition: ['employee_categories.employment_type_id', 'employment_types.id'], type: 'inner' },
  ];
  /* Default variables */
  const category = await indexRepository.find(tableName, fields, condition, 0, joins);
  // return category;{
  if (category.status === true) {
    /* variables */
    const responseData = [];
    const totalDetails = category.data;
    /* variables */

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        id: item.id,
        name: item.name,
        employment_type_id: item.employment_type_id,
        employment_type_name: item.employment_type_name,
        description: (item.description !== null ? item.description : ''),
        is_active: item.is_active,
        is_editable: item.is_editable,
      };
      responseData.push(listingObject);
    }

    return { status: true, data: responseData[0] };
  } else {
    return category;
  }
};

/**
 * Listing Function to get category data.
 * Logic:
 * - Fetch the data from the 'employee_categories' table using condition(param) by calling common findByPagination function.
 *  - If data exists,
 *    + loop the data and push the object in to an array and add serial number to the object 
 *    + Prepare the response 
 *    - Fetch the data from the 'configuration_activity_track table using common find function.
 *    - looping the activity data and push it in to an array and returning in response
 *    + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {object} condition - The condition to filter the employee_categories by.
 * @param {number} page - The page number of the results to retrieve.
 * @param {number} limit - The maximum number of results per page.
 * @param {string} sortColumn - The page number of the results to retrieve.
 * @param {string} sortOrder - The maximum number of results per page.
 * @returns {object} - An object containing the status, data, and pagination details of the retrieved employee_categories.
 */
const listing = async (condition, page, limit, sortColumn, sortOrder) => {
  /* Default variables */
  const tableName = 'employee_categories';
  const fields = ['employee_categories.*', 'create.display_name as create_emp', 'update.display_name as updated_emp', 'employment_types.name as employment_type_name'];
  const joins = [
    { table: 'employment_types', condition: ['employee_categories.employment_type_id', 'employment_types.id'], type: 'inner' },
    { table: 'employee as create', alias: 'create', condition: ['employee_categories.created_by', 'create.id'], type: 'left', ignoreDeletedAt: true },
    { table: 'employee as update', alias: 'update', condition: ['employee_categories.updated_by', 'update.id'], type: 'left', ignoreDeletedAt: true },
  ];
  /* Default variables */
  const category = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit, sortColumn, sortOrder);

  // Transforms the category data into a new format if the status is true.
  if (category.status === true) {
    /* variables */
    const responseData = [];
    const totalDetails = category.data;
    const paginationDetails = category.pagination;
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
        employment_type_id: item.employment_type_id,
        employment_type_name: item.employment_type_name,
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
    return category;
  }
};

/**
 * update Function to update category data.
 * 
 * Logic:
 * - Prepare category data object.
 * - update the category data into 'employee_categories' table from the condition in params. 
 * - fetch the category details before and after the the update for activity track
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the category activity
 * - Return the result of the category data update.
 * 
 * @param {Object} body - The data to update the record with.
 * @param {Object} condition - The condtiton for the data.
 * @returns {Promise<Object>} - A promise that resolves to the response
 */
const update = async (body, condition) => {

  /* Creating update entry object */
  const updateData = {
    name: body.name,
    is_active: body.is_active,
    description: body?.description ? body?.description : null,
    employment_type_id: body.employment_type_id,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /**Fetching the category data before update */
  const beforeUpdateData = await getCategory({ 'employee_categories.id': condition.id })
  /**Fetching the category data before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
   */
  const repositoryResponse = await indexRepository.update('employee_categories', condition, updateData);

  /**activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 1,
    action_type: 2,
    created_by: body.created_by,
    slug: 'employee_category'
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData });
  /**activity track */

  return repositoryResponse;
};

/**
 * update-status Function to update category data.
 * 
 * Logic:
 * - Prepare category data object.
 * - update the category data into 'employee_categories' table from the condition in params. 
 * - fetch the category details before and after the the update for activity track
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the category activity
 * - Return the result of the category data update.
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

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
   */

  /**Fetching employee-categories status before update */
  const beforeUpdateData = await getCategory({ 'employee_categories.id': condition.id })
  /**Fetching employee-categories status before update */

  const repositoryResponse = await indexRepository.update('employee_categories', condition, updateData);

  /**Activity track */
  const activity = {
    referrable_id: repositoryResponse.data[0].id,
    referrable_type: 1,
    action_type: 2,
    created_by: body.created_by,
    slug: 'employee_category'
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData });
  /**Activity track */

  return repositoryResponse;
};

/**
 * Destroy Function to delete category data.
 * 
 * Logic:
 * - Prepare the condition for data deletion.
 * - Delete the category data from 'employee_categories' table. 
 * - Prepare the activity object to send to the activity
 * - Trigger the activity event to store the category activity
 * - Return the result of the category data deletion.
 * 
 * @param {Object} body - The request body containing the category details.
 * @param {Object} condition - The condtiton for the data.
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
  await indexRepository.update('employee_categories', condition, updateData);

  /**Activity track */
  // Create Change Log
  const change_log = [
    {
      'label_name': 'name',
      'value': body.name,
      'action_by': body.created_by
    }
  ];
  const activity = {
    referrable_id: condition.id,
    referrable_type: 1,
    action_type: 3,
    created_by: body.created_by, 
    change_log: JSON.stringify(change_log)
  };
  event.emit('configurationDeleteActivity', activity);
  /**Activity track */
}

module.exports = { index, listing, store, update, updateStatus, destroy };
