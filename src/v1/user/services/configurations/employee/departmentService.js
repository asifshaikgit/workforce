const { event } = require('../../../../../../events/configurationActivityEvent');
const moment = require('moment');
const indexRepository = require('../../../repositories/index');
const format = require('../../../../../../helpers/format');

/**
 * Index Function to get department data.
 * 
 * Logic:
 * - Fetch the data from the 'departments' table using condition(param) by calling common find function.
 *  - If data exists,
 *   + Iterate the loop and push to an object 
 *   + Prepare the response 
 *   + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {any} condition - The condition to filter the department data.
 * @returns {Promise<{status: boolean, data: any}>} - A promise that resolves to an object containing the status and data of the department.
 * - status: true if the department data is successfully retrieved, false otherwise.
 * - data: An array of department objects with the following properties:
 *   - id: The ID of the department.
 *   - name: The name of the department.
 *   - description: The description of the department, or an empty string if it is null.
 *   - is_active: A boolean indicating if the department is active
 */
const index = async (condition) => {
  /**
   * Retrieves a department from the indexServices based on the given condition.
   */
  const department = await indexRepository.find('departments', ['*'], condition);
  // return department;{
  if (department.status === true) {
    /* variables */
    const responseData = [];
    const totalDetails = department.data;
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
    return department;
  }
};

/**
 * Listing Function to get deparment data.
 * Logic:
 * - Fetch the data from the 'deparments' table using condition(param) by calling common findByPagination function.
 *  - If data exists,
 *    + loop the data and push the object in to an array and add serial number to the object 
 *    + Prepare the response 
 *    - Fetch the data from the 'configuration_activity_track table using common find function.
 *    - looping the activity data and push it in to an array and returning in response
 *    + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {Object} condition - The conditions to filter the departments by.
 * @param {number} page - The page number of the listing.
 * @param {number} limit - The maximum number of departments to retrieve per page.
 * @param {string} sortColumn - The column to sort the departments by.
 * @param {string} sortOrder - The order in which to sort the departments (asc or desc).
 * @returns {Object} An object containing the paginated listing of departments, activity logs, and pagination details.
 * If the retrieval of departments fails, the returned object will contain the error message.
 */
const listing = async (condition, page, limit, sortColumn, sortOrder) => {
  /* Default variables */
  const tableName = 'departments';
  const fields = ['departments.*', 'create.display_name as create_emp', 'create.employment_type_id', 'emt.name as employment_type_name' ,  'update.display_name as updated_emp'];
  const joins = [
    { table: 'employee as create', alias: 'create', condition: ['departments.created_by', 'create.id'], type: 'left', ignoreDeletedAt: true },
    { table: 'employment_types as emt', alias: 'emt', condition: ['create.employment_type_id', 'emt.id'], type: 'left', ignoreDeletedAt: true },
    { table: 'employee as update', alias: 'update', condition: ['departments.updated_by', 'update.id'], type: 'left', ignoreDeletedAt: true },
  ];
  /* Default variables */
  const department = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit, sortColumn, sortOrder);
  if (department.status === true) {
    /* variables */
    const responseData = [];
    const totalDetails = department.data;
    const paginationDetails = department.pagination;
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
        employment_type_id : item.employment_type_id,
        employment_type_name : item.employment_type_name,
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
    return department;
  }
};

/**
 * Store Function to save department data.
 * 
 * Logic:
 * - Prepare department data object.
 * - Store the department data into 'departments' table. 
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the department activity
 * - Return the result of the department data storage.
 * 
 * @param {object} body
 * @return Json
 */
const store = async (body) => {

  /* Creating store entry object */
  const newDepartment = {
    name: body.name,
    description: body.description,
    is_active: body.is_active,
    created_by: body.created_by,
    created_at: new Date(),
  };
  /* Creating store entry object */

  const departmentList = await indexRepository.store('departments', newDepartment);

  /**Activity track */
  const activity = {
    referrable_id: departmentList.data[0].id,
    referrable_type: 2,
    action_type: 1,
    created_by: body.created_by,
  };
  event.emit('configurationStoreActivity', { activity });
  /**Activity track */

  return departmentList;
};

/**
 * update Function to update department data.
 * 
 * Logic:
 * - Prepare department data object.
 * - update the department data into 'departments' table from the condition in params.  
 * - fetch the department details before and after the the update for activity track
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the department activity
 * - Return the result of the department data update.
 * 
 *
 * @param {object} body - body of the department data
 * @param {object} condition - The conditions to filter the department data.
 * @return Json
 *
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


  /**Fetching department data before update */
  const beforeUpdateData = await getDepartmentData(condition)
  /**Fetching department data before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
  */
  const repositoryResponse = await indexRepository.update('departments', condition, updateData);

  /**Fetching department data agter update */
  const afterUpdateData = await getDepartmentData(condition)
  /**Fetching department data after update */

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 2,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

  return repositoryResponse;
};

/**
 * update-status Function to update department data.
 * 
 * Logic:
 * - Prepare department data object.
 * - update the department data into 'departments' table from the condition in params.  
 * - fetch the department details before and after the the update for activity track
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the department activity
 * - Return the result of the department data update.
 * 
 *
 * @param {object} body - body of the department data
 * @param {object} condition - The conditions to filter the department data.
 * @return Json
 *
 */
const updateStatus = async (body, condition) => {

  /* Creating update entry object */
  const updateData = {
    is_active: body.is_active,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /**Fetching department data before update */
  const beforeUpdateData = await getDepartmentData(condition)
  /**Fetching department data before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
  */
  const repositoryResponse = await indexRepository.update('departments', condition, updateData);

  /**Fetching department data after update */
  const afterUpdateData = await getDepartmentData(condition)
  /**Fetching department data after update */

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 2,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

  return repositoryResponse;
};

/**
 * get department Function to get department data.
 
 * Logic:
 * - Fetch the data from the 'departments' table using condition(param) by calling common find function.
 *  - If data exists,
 *    + Prepare the response 
 *    + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {*} condition 
 */
const getDepartmentData = async (condition) => {

  // getting department data
  const departmentData = await indexRepository.find('departments', ['*'], condition);

  /* Creating the object */
  const responseData = {
    'Name': departmentData.data[0].name,
    'Description': departmentData.data[0].description,
    'Status': departmentData.data[0].is_active === true ? 'Active' : 'In-active',
  };
  /* Creating the object */

  return responseData
}

/**
 * Destroy Function to delete department data.
 * 
 * Logic:
 * - Prepare the condition for data deletion.
 * - Delete the department data from 'departments' table with the condition in params. 
 * - Prepare the activity object to send to the activity
 * - Trigger the activity event to store the department activity
 * - Return the result of the department data deletion.
 * 
 * @param {Object} body - The request body containing the department details.
 * @param {Object} condition - The condition for the data.
 * @returns {Promise<Object>} - A promise that
 */
const destroy = async (body, condition) => {

  var updateData = {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by
  };

  await indexRepository.update('departments', condition, updateData);

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 2,
    action_type: 3,
    created_by: body.created_by,
  };
  event.emit('configurationDeleteActivity', activity);
  /**Activity track */
}

module.exports = { index, listing, store, update, updateStatus, destroy };
