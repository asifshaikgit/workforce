const { event } = require('../../../../../../events/configurationActivityEvent');
const moment = require('moment');
const indexRepository = require('../../../repositories/index');
const format = require('../../../../../../helpers/format');

/**
 * Index Function to get team data.
 * 
 * Logic:
 * - Fetch the data from the 'teams' table using condition(param) by calling common find function.
 *  - If data exists,
 *   + Iterate the loop and push to an object 
 *   + Prepare the response 
 *   + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {object} condition - The condition to filter the team data.
 * @returns {object} - An object containing the status and data of the retrieved team.
 *                    If successful, the data will contain an array of team objects.
 *                    If unsuccessful, the data will contain an error message.
 */
const index = async (condition) => {
  /* Default variables */
  const tableName = 'teams';
  const fields = ['teams.*'];
  /* Default variables */
  const employeeTeam = await indexRepository.find(tableName, fields, condition);
  if (employeeTeam.status === true) {
    /* variables */
    const responseData = [];
    const totalDetails = employeeTeam.data;
    /* variables */

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        id: item.id,
        name: item.name,
        description: (item.description !== null ? item.description : ''),
        is_active: item.is_active,
        is_editable: item.is_editable,
        department_id: item.department_id,
        department_name: item.department_name,
      };
      responseData.push(listingObject);
    }

    return { status: true, data: responseData[0] };
  } else {
    return employeeTeam;
  }
};

/**
 * Listing Function to get team data.
 * Logic:
 * - Fetch the data from the 'teams' table using condition(param) by calling common findByPagination function.
 *  - If data exists,
 *    + loop the data and push the object in to an array and add serial number to the object 
 *    + Prepare the response 
 *    - Fetch the data from the 'configuration_activity_track table using common find function.
 *    - looping the activity data and push it in to an array and returning in response
 *    + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {object} condition - The conditions to filter the team data.
 * @param {number} page - The page number of the listing.
 * @param {number} limit - The maximum number of items per page.
 * @param {string} sortColumn - The column to sort the data by.
 * @param {string} sortOrder - The order to sort the data in (asc or desc).
 * @returns {object} An object containing the paginated team data, activity log, and pagination details.
 */
const listing = async (condition, page, limit, sortColumn, sortOrder) => {
  /* Default variables */
  const tableName = 'teams';
  const fields = ['teams.*', 'departments.name as department_name', 'create.display_name as create_emp', 'update.display_name as updated_emp'];
  const joins = [
    { table: 'employee as create', alias: 'create', condition: ['teams.created_by', 'create.id'], type: 'left', ignoreDeletedAt: true },
    { table: 'employee as update', alias: 'update', condition: ['teams.updated_by', 'update.id'], type: 'left', ignoreDeletedAt: true },
    { table: 'departments', condition: ['teams.department_id', 'departments.id'], type: 'left' },
  ];
  /* Default variables */
  const employeeTeam = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit, sortColumn, sortOrder);
  if (employeeTeam.status === true) {
    /* variables */
    const responseData = [];
    const totalDetails = employeeTeam.data;
    const paginationDetails = employeeTeam.pagination;
    /* variables */

    let serialNo = (page - 1) * limit + 1;
    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        serial_no: serialNo,
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        department_id: item.department_id,
        department_name: item.department_name,
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

    return { status: true, data: responseData, pagination_data: paginationDetails };
  } else {
    return employeeTeam;
  }
};

/**
 * Store Function to save team data.
 * 
 * Logic:
 * - Prepare team data object.
 * - Store the team data into 'teams' table. 
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the team activity
 * - Return the result of the team data storage.
 *
 * @param {Object} body - The request body containing the team information.
 * @returns {Promise<Object>} - A promise that resolves to the stored team object.
 */
const store = async (body) => {
  /**
   * Stores a new team in the database.
   */
  const newTeam = {
    name: body.name,
    department_id: body.department_id,
    description: body?.description || null,
    is_active: body.is_active,
    created_at: new Date(),
    created_by: body.created_by,
  };
  /* Stores a new team in the database.*/

  const teamList = await indexRepository.store('teams', newTeam);

  /**Activity track*/
  const activity = {
    referrable_id: teamList.data[0].id,
    referrable_type: 4,
    action_type: 1,
    created_by: body.created_by,
  };
  event.emit('configurationStoreActivity', {activity} );
  /**Activity track*/

  return teamList;
};

/**
 * update Function to update team data.
 * 
 * Logic:
 * - Prepare team data object.
 * - update the team data into 'teams' table from the condition in params. 
 * - fetch the team details before and after the the update for activity track
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the team activity
 * - Return the result of the team data update.
 *
 * @param {Object} body - The request body containing the updated team data.
 * @param {object} condition - The conditions to filter the team data.
 * @returns {Promise} A promise that resolves with the repository response.
 */
const update = async (body, condition) => {
 
  /* Creating update entry object */
  const updateData = {
    name: body.name,
    department_id: body.department_id,
    is_active: body.is_active,
    description: body?.description || null,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /**Fetching teams data before update */
  const beforeUpdateData = await getTeamData(condition)
  /**Fetching teams data before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
  */
  const repositoryResponse = await indexRepository.update('teams', condition, updateData);

  /**Fetching teams data after update */
  const afterUpdateData = await getTeamData(condition)
  /**Fetching teams data before update */

  /**Activity track*/
  const activity = {
    referrable_id: condition.id,
    referrable_type: 4,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track*/
  return repositoryResponse;
};

/**
 * update-status Function to update team data.
 * 
 * Logic:
 * - Prepare team data object.
 * - update the team data into 'teams' table from the condition in params. 
 * - fetch the team details before and after the the update for activity track
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the team activity
 * - Return the result of the team data update.
 * 
 * @param {Object} body - The request body containing the necessary data for updating the status.
 * @param {object} condition - The conditions to filter the team data.
 * @returns {Promise<Object>} - A promise that resolves to the repository response.
 */
const updateStatus = async (body, condition) => {

  /* Creating update entry object */
  const updateData = {
    is_active: body.is_active,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /**Fetching teams data before update */
  const beforeUpdateData = await getTeamData(condition)
  /**Fetching teams data before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
  */
  const repositoryResponse = await indexRepository.update('teams', condition, updateData);

  /**Fetching teams data after update */
  const afterUpdateData = await getTeamData(condition)
  /**Fetching teams data after update */

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 4,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

  return repositoryResponse;
};

/**
 * getTeamData Function to get team data.
 
 * Logic:
 * - Fetch the data from the 'teams' table using condition(param) by calling common find function.
 *  - If data exists,
 *    + Prepare the response 
 *    + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {*} condition 
 * @returns 
 */
const getTeamData = async (condition) => {

  // getting team details
  var fields = ['teams.*', 'departments.name as department_name']
  const joins = [
    { table: 'departments', condition: ['departments.id', 'teams.department_id'], type: 'left' },
  ];
  const teamData = await indexRepository.find('teams', fields, {'teams.id' : condition.id} ,   null, joins);

  /* Creating the object */
  const responseData = {
    'Name': teamData.data[0].name,
    'Department': teamData.data[0].department_name,
    'Description': teamData.data[0].description,
    'Status': teamData.data[0].is_active === true ? 'Active' : 'In-active',
  };
  /* Creating the object */

  return responseData
}

/**
 * Destroy Function to delete team data.
 * 
 * Logic:
 * - Prepare the condition for data deletion.
 * - Delete the team data from 'teams' table. 
 * - Prepare the activity object to send to the activity
 * - Trigger the activity event to store the team activity
 * - Return the result of the team data deletion.
 * 
 * @param {Object} body - The request body containing the team details.
 * @param {Object} condition - The condition for the data.
 * @returns {Promise<Object>} - A promise that
 */
const destroy = async (body, condition) => {

  var updateData = {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by
  };

  await indexRepository.update('teams', condition , updateData);

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 4,
    action_type: 3,
    created_by: body.created_by,
  };
  event.emit('configurationDeleteActivity', activity);
  /**Activity track */
}

module.exports = { index, listing, store, update, updateStatus, destroy };
