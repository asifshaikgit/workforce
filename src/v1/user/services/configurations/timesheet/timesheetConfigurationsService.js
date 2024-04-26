const indexRepository = require('../../../repositories/index');
const transactionRepository = require('../../../repositories/transactionRepository');
const { event } = require('../../../../../../events/configurationActivityEvent');

/**
 * Index Function to get timesheet configuration data.
 * 
 * Logic:
 * - Fetch the data from the 'timesheet_configurations' table using condition(param) by calling common find function.
 *  - If data exists,
 *   + Iterate the loop and push to an object 
 *   + Prepare the response 
 *   + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {any} condition - The condition to filter the timesheet configurations.
 * @returns {Promise<{status: boolean, data: any[]}>} - A promise that resolves to an object containing the status and data of the timesheet configurations.
 */
const index = async (condition) => {
  const timesheetConfigurations = await indexRepository.find('timesheet_configurations', ['id', 'cycle_id', 'day_start_id', 'default_hours', 'is_global', 'ts_mandatory'], condition);
  if (timesheetConfigurations.status && timesheetConfigurations.data.length > 0) {
    /* Variables */
    const responseData = [];
    const totalDetails = timesheetConfigurations.data;
    /* Variables */

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        id: item.id,
        cycle_id: item.cycle_id,
        day_start_id: item.day_start_id ? item.day_start_id : '',
        default_hours: item.default_hours.slice(0, -3),
        is_global: item.is_global,
        ts_mandatory: item.ts_mandatory,
      };
      responseData.push(listingObject);
    }

    return { status: true, data: responseData };
  } else {
    return { status: false, data: [] };;
  }
};

/**
 * Store Function to save timesheet configuration data.
 * 
 * Logic:
 * - Prepare timesheet configuration data object.
 * - db(params) exists we use transactionRepository to store in designated database or we use index repository tp store in database from the token
 * - Store the timesheet configuration data into 'timesheet_configurations' table. 
 * - Return the result of the timesheet configuration data storage.
 * 
 * @param {Object} body - The request body containing the timesheet setting data.
 * @param {string} db - The database for the insertion.
 * @returns {Promise<Object>} - A promise that resolves to the response from the database.
 */
const store = async (body, db = null) => {
  /* Creating new object */
  const newTimesheetSetting = {
    cycle_id: body.cycle_id,
    day_start_id: body.day_start_id ? body.day_start_id : null,
    default_hours: body.default_hours,
    is_global: body.is_global,
    ts_mandatory: body.ts_mandatory,
    created_by: body.created_by,
    created_at: new Date(),
  };
  /* Creating new object */

  /**
   *  + Call the store repository function
   *    -Based on the status in store function response, segregate the response and prepare the response
  */
  let repositoryResponse
  if (db == null) {
    repositoryResponse = await indexRepository.store('timesheet_configurations', newTimesheetSetting);
  } else {
    repositoryResponse = await transactionRepository.store(db, 'timesheet_configurations', newTimesheetSetting);
  }

  /**activity track */
  const activity = {
    referrable_id: repositoryResponse.data[0].id,
    referrable_type: 16,
    action_type: 1,
    created_by: body.created_by,
  };
  event.emit('configurationStoreActivity', { activity });
  /**activity track */

  return repositoryResponse;
};

/**
 * update Function to update timesheet configuration data.
 * 
 * Logic:
 * - Prepare timesheet configuration data object.
 * - db(params) exists we use transactionRepository to store in designated database or we use index repository tp store in database from the token
 * - update the timesheet configuration data into 'timesheet_configurations' table from the condition in params. 
 * - Return the result of the timesheet configuration data update.
 * 
 * @param {Object} body - The data to update the timesheet configuration with.
 * @param {string} db - The database for the insertion.
 * @param {any} condition - The condition to update data.
 * @returns {Promise} A promise that resolves with the response from the database update operation.
 */
const update = async (body, db = null, condition) => {

  /* Creating update entry object */
  const updatetimesheetSetting = {
    cycle_id: body.cycle_id,
    day_start_id: body.day_start_id !== '' ? body.day_start_id : null,
    default_hours: body.default_hours,
    is_global: body.is_global,
    ts_mandatory: body.ts_mandatory,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };

  let repositoryResponse = [];
  /* Creating update entry object */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
  */
  const beforeUpdateData = await getTimesheetConfiguration({ 'timesheet_configurations.id': condition.id });
  if (db == null) {
    repositoryResponse = await indexRepository.update('timesheet_configurations', condition, updatetimesheetSetting);

    const afterUpdateData = await getTimesheetConfiguration({ 'timesheet_configurations.id': condition.id });

    const activity = {
      referrable_id: condition.id,
      referrable_type: 16,
      action_type: 2,
      created_by: body.created_by,
    };
    event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });

  } else {
    repositoryResponse = await transactionRepository.update(db, 'timesheet_configurations', condition, updatetimesheetSetting);
  }

  return repositoryResponse;
};

/**
 * get timesheet Configuration Function to get timesheet configuration data.
 
 * Logic:
 * - Fetch the data from the 'timesheet_configurations' table using condition(param) by calling common find function.
 *  - If data exists,
 *    + Prepare the response 
 *    + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {*} condition
 * @return {*} 
 */
const getTimesheetConfiguration = async (condition) => {

  const fields = ['timesheet_configurations.*', 'days.name as day', 'cycles.name as cycle'];

  const joins = [
    { table: 'days', condition: ['timesheet_configurations.day_start_id', 'days.id'], type: 'left' },
    { table: 'cycles', condition: ['timesheet_configurations.cycle_id', 'cycles.id'], type: 'inner' }
  ];
  // getting timesheet configuration details
  const tsConfigData = await indexRepository.find('timesheet_configurations', fields, condition, null, joins);

  /* Creating the object */
  const responseData = {
    'Start Day': tsConfigData.data[0].day,
    'Cycle': tsConfigData.data[0].cycle,
    'Timesheet Mandatory': tsConfigData.data[0].ts_mandatory,
    'Default Hours': tsConfigData.data[0].default_hours,
    "Is Global": tsConfigData.data[0].is_global
  };
  /* Creating the object */

  return responseData
}

module.exports = { index, store, update };
