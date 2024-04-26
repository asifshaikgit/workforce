const indexRepository = require('../../repositories/index');
const { getOneMonthEndDate } = require('../../../../../helpers/globalHelper');
const moment = require('moment');
const { events } = require('../../../../../events/payrollCycleGenerationEvent');
const { event } = require('../../../../../events/configurationActivityEvent');
const format = require('../../../../../helpers/format');
const transactionRepository = require('../../repositories/transactionRepository');
const { getConnection } = require('../../../../middlewares/connectionManager');

/**
 * Store function to create a new Payroll Configuration Setting entry.
 * 
 * Logic:
 * - Initiate a database connection using 'getConnection()'.
 * - Initiate a database transaction ('db.transaction') to ensure data integrity.
 * - Create a new object 'newPayrollConfigSetting' with properties from the request body for the new Payroll Configuration Setting entry.
 * - Calculate 'raiseDays' based on date calculations.
 * - Call the 'transactionRepository.store' function to add the 'newPayrollConfigSetting' to the 'payroll_config_settings' table within the transaction.
 * - Create a new object 'newPayrollConfig' for the 'payroll_configuration' table.
 * - Call the 'transactionRepository.store' function to add the 'newPayrollConfig' to the 'payroll_configuration' table within the transaction.
 * - Commit the database transaction if all database operations are successful.
 * - Create an 'activity' object to track the store of the payroll config settings.
 *  - Emit an event to log the activity.
 * - Emit an event to generate payroll cycles based on the newly created entry.
 * - Return the response from the repository.
 * 
 * Note:
 * - Exception handling using try-catch.
 * - If any exception is raised, rollback all database operations using 'trx.rollback()'.
 * 
 * @param {Object} body - The request body containing Payroll Configuration Setting details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {
  let trx;
  try {
    // Initialize a database transaction
    const db = await getConnection();
    trx = await db.transaction();

    // Create a new object 'newPayrollConfigSetting' with properties from the request body
    const newPayrollConfigSetting = {
      name: body.name,
      payroll_cycle_id: body.payroll_cycle_id,
      from_date: body.from_date,
      to_date: body.to_date,
      check_date: body.check_date,
      actual_check_date: body.actual_check_date,
      second_from_date: body.second_from_date ? body.second_from_date : null,
      second_to_date: body.second_to_date ? body.second_to_date : null,
      second_check_date: body.second_check_date ? body.second_check_date : null,
      second_actual_check_date: body.second_actual_check_date ? body.second_actual_check_date : null,
      created_by: body.created_by,
      created_at: new Date(),
    };

    // Call the 'store' repository function to add 'newPayrollConfigSetting' to the 'payroll_config_settings' table
    const repositoryResponse = await transactionRepository.store(trx, 'payroll_config_settings', newPayrollConfigSetting);

    // Create a new object 'newPayrollConfig' for the 'payroll_configuration' table
    const newPayrollConfig = {
      pay_config_setting_id: repositoryResponse.data[0].id,
      from_date: body.from_date,
      to_date: body.to_date,
      check_date: body.check_date,
      status: 'Yet to generate',
      created_by: body.created_by,
      created_at: new Date(),
    };

    // Insert the 'newPayrollConfig' into the 'payroll_configuration' table
    await transactionRepository.store(trx, 'payroll_configuration', newPayrollConfig);

    // Commit the transaction
    await trx.commit();

    /**Activty track */
    const activity = {
      referrable_id: repositoryResponse.data[0].id,
      referrable_type: 23,
      action_type: 1,
      created_by: body.created_by,
    };
    event.emit('configurationStoreActivity', { activity });
    /**Activty track */

    // Emit an event to generate payroll cycles based on the new entry
    events.emit("payrollCycleGeneration", { id: repositoryResponse.data[0].id })

    // Return the response from the repository
    return repositoryResponse;
  } catch (error) {
    // Handle errors and rollback the transaction in case of an exception
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

/**
 * Update function to modify a Payroll Configuration Setting entry.
 * 
 * Logic:
 * - Initiate a database connection using 'getConnection()'.
 * - Initiate a database transaction ('db.transaction') to ensure data integrity.
 * - Calculate 'raiseDays' based on date calculations.
 * - Define the conditions for deleting specific entries in the 'payroll_configuration' table.
 * - Call the 'transactionRepository.destroy' function to delete specified entries.
 * - Create a new object 'newPayrollConfigSetting' with properties from the request body for updating the Payroll Configuration Setting entry.
 * - Create a new object 'newPayrollConfig' for the 'payroll_configuration' table with properties based on the request body.
 * - Call the 'transactionRepository.store' function to add the 'newPayrollConfig' to the 'payroll_configuration' table within the transaction.
 * - Call the 'transactionRepository.update' function to modify the 'payroll_config_settings' entry.
 * - Commit the database transaction if all database operations are successful.
 * - Emit an event to generate payroll cycles based on the updated entry.
 * - Return the response from the repository.
 * 
 * Note:
 * - Exception handling using try-catch.
 * - If any exception is raised, rollback all database operations using 'trx.rollback()'.
 * 
 * @param {Object} body - The request body containing updated Payroll Configuration Setting details.
 * @param {Object} condition - The condition for updating the entry.
 * @returns {Object} Repository response.
 */
const update = async (body, condition) => {
  let trx;
  try {
    // Initialize a database transaction
    const db = await getConnection();
    trx = await db.transaction()

    // Define the condition to delete specific entries in the 'payroll_configuration' table
    let payrollCondition;

    if (body.edit_from_date == undefined || body.edit_from_date == '') {
      payrollCondition = { global_search: `"pay_config_setting_id" = '${condition.id}' and "status" = 'Yet to generate'` };
    } else {
      payrollCondition = { global_search: `"pay_config_setting_id" = '${condition.id}' and "status" = 'Yet to generate' and "from_date" >= '${body.edit_from_date}'` };
    }

    // Delete specified entries in the 'payroll_configuration' table
    await transactionRepository.destroy(trx, 'payroll_configuration', payrollCondition);

    // Create a new object 'newPayrollConfigSetting' with updated properties
    const newPayrollConfigSetting = {
      name: body.name,
      payroll_cycle_id: body.payroll_cycle_id,
      from_date: body.from_date,
      to_date: body.to_date,
      check_date: body.check_date,
      actual_check_date: body.actual_check_date,
      second_from_date: body.second_from_date ? body.second_from_date : null,
      second_to_date: body.second_to_date ? body.second_to_date : null,
      second_check_date: body.second_check_date ? body.second_check_date : null,
      second_actual_check_date: body.second_actual_check_date ? body.second_actual_check_date : null,
      created_by: body.created_by,
      created_at: new Date(),
    };

    // Create a new object 'newPayrollConfig' for the 'payroll_configuration' table
    const newPayrollConfig = {
      pay_config_setting_id: condition.id,
      from_date: body.from_date,
      to_date: body.to_date,
      check_date: body.check_date,
      status: 'Yet to generate',
      updated_by: body.updated_by,
      updated_at: new Date(),
    };

    /**Fetching payroll config  details before update */
    const beforeUpdateData = await getPayrollConfigSettingData(condition)
    /**Fetching payroll config details before update */

    // Insert the 'newPayrollConfig' into the 'payroll_configuration' table
    await transactionRepository.store(trx, 'payroll_configuration', newPayrollConfig); // inserting in payrollConfiguration table

    // Update the 'payroll_config_settings' entry
    const repositoryResponse2 = await transactionRepository.update(trx, 'payroll_config_settings', { id: condition.id }, newPayrollConfigSetting);

    // Commit the transaction
    await trx.commit();

    /**Fetching payroll config details after update */
    const afterUpdateData = await getPayrollConfigSettingData(condition)
    /**Fetching payroll config details after update */

    /**Actiivty track */
    const activity = {
      referrable_id: repositoryResponse2.data[0].id,
      referrable_type: 23,
      action_type: 2,
      created_by: body.created_by,
    };
    event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });

    // Emit an event to generate payroll cycles based on the updated entry
    events.emit("payrollCycleGeneration", { id: condition.id })

    // Return the response from the repository
    return repositoryResponse2;
  } catch (error) {
    // Handle errors and rollback the transaction in case of an exception
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

/**
 * Retrieve  payroll config setting data based on specified conditions.
 * 
 * Logic:
 * - Use the repository function to fetch  payroll config setting data from the 'payroll_config_settings' table based on the provided condition.
 * - Create a 'responseData' object with key-value pairs to represent the payroll config setting details.
 * - Return 'responseData'.
 *    
 * @param {Object} condition - The conditions to filter Payment Modes.
 * @returns {Object} Response with payroll config setting details.
 */
const getPayrollConfigSettingData = async (condition) => {
  const payrollConfigData = await indexRepository.find('payroll_config_settings', ['*'], condition);
  const responseData = {
    'Name': payrollConfigData.data[0].name ? payrollConfigData.data[0].name : '',
    'Payroll Cycle': payrollConfigData.data[0].payroll_cycle_id ? payrollConfigData.data[0].payroll_cycle_id : '',
    'From Date': payrollConfigData.data[0].from_date ? moment(payrollConfigData.data[0].from_date).format('YYYY-MM-DD') : '',
    'To Date': payrollConfigData.data[0].to_date ? moment(payrollConfigData.data[0].to_date).format('YYYY-MM-DD') : '',
    'Check Date': payrollConfigData.data[0].check_date ? moment(payrollConfigData.data[0].check_date).format('YYYY-MM-DD') : '',
    'Actual Check Date': payrollConfigData.data[0].actual_check_date ? moment(payrollConfigData.data[0].actual_check_date).format('YYYY-MM-DD') : '',
    'Second From Date': payrollConfigData.data[0].second_from_date ? moment(payrollConfigData.data[0].second_from_date).format('YYYY-MM-DD') : '',
    'Second To Date': payrollConfigData.data[0].second_to_date ? moment(payrollConfigData.data[0].second_to_date).format('YYYY-MM-DD') : '',
    'Second Check Date': payrollConfigData.data[0].second_check_date ? moment(payrollConfigData.data[0].second_check_date).format('YYYY-MM-DD') : '',
    'Second Actual Check Date': payrollConfigData.data[0].second_actual_check_date ? moment(payrollConfigData.data[0].second_actual_check_date).format('YYYY-MM-DD') : ''
  };

  return responseData
};

/**
 * Date function to calculate and return valid dates based on the payroll cycle.
 * 
 * Logic:
 * - Extract the payroll cycle ID and the 'from_date' from the request body.
 * - Calculate the 'newDate' based on the payroll cycle ID.
 * - Depending on the payroll cycle, calculate the 'newDate' and 'secondToDate' if necessary.
 * - Format and store 'newDate' and 'secondToDate' in the 'validDates' object.
 * - Return the 'validDates' object containing the calculated dates.
 * 
 * @param {Object} body - The request body containing payroll cycle and 'from_date'.
 * @returns {Object} Object with valid dates based on the payroll cycle.
 */
const date = async (body) => {

  // Extract the payroll cycle ID and the 'from_date' from the request body
  const cycleId = Number(body.payroll_cycle_id);
  let newDate = '';
  const FromDate = moment(body.from_date).toDate();
  const validDates = {};

  // Calculate the 'newDate' based on the payroll cycle ID
  if (cycleId === 1) { // Weekly
    // Calculate the new date by adding 6 days to the 'from_date'
    const numberOfDaysToAdd = 6;
    const result = FromDate.setDate(FromDate.getDate() + numberOfDaysToAdd);
    newDate = new Date(result);
  } else if (cycleId === 2) { // Bi-Weekly
    // Calculate the new date by adding 13 days to the 'from_date'
    const numberOfDaysToAdd = 13;
    const result = FromDate.setDate(FromDate.getDate() + numberOfDaysToAdd);
    newDate = new Date(result);
  } else if (cycleId === 3) { // Semi-monthly
    // Calculate 'newDate' and get 'secondToDate' for a specific condition
    newDate = moment(body.second_from_date).subtract(1, 'days').format('YYYY-MM-DD');
    const fromdate = body.from_date;

    // Call a function to get 'secondToDate' based on the 'from_date'
    const secondDate = await getOneMonthEndDate(fromdate);
    validDates.secondToDate = secondDate;
  } else if (cycleId === 4) { // Monthly
    // Calculate 'newDate' for the fourth payroll cycle
    const result = moment(FromDate).format('YYYY-MM-DD');

    // Call a function to get 'newDate' based on the result
    const temp = await getOneMonthEndDate(result);
    newDate = new Date(temp);
  }

  // Format and store 'newDate' and 'secondToDate' in the 'validDates' object
  validDates.toDate = moment(newDate).format('YYYY-MM-DD');

  // Return the 'validDates' object containing the calculated dates
  return validDates;
};

/**
 * Retrieves a paginated listing of payroll configurations with associated payroll cycle details.
 * 
 * Logic:
 *   - Fetch payroll configuration data from the 'payroll_config_settings' table.
 *   - If data exists:
 *     + Initialize variables and retrieve the date format.
 *     + Define table name, fields, and joins for fetching data.
 *     + Retrieve additional details from the index repository using pagination.
 *     + Map pagination details to 'paginationDetails'.
 *     + Iterate over 'totalDetails.data' and create a 'listingObject' with selected properties.
 *     + Push the 'listingObject' to the 'responseData' array.
 *     + Return the response object with status true, responseData, and paginationDetails.
 *   - If data doesn't exist:
 *     + return the response from the index repository with its status.
 *
 * @param {number} page - The page number of the listing.
 * @param {number} limit - The maximum number of items per page.
 * @returns {Object} An object containing the status, data, and pagination_data of the payroll configuration listing.
 */
const listing = async (page, limit) => {
  //  Retrieves the payroll configuration from the index repository.
  const payRoll = await indexRepository.find('payroll_config_settings', ['id'], {}, null, [], null, null, null, false);
  if (payRoll.status) {
    // Get the date format
    let dateFormat = await format.getDateFormat(); // date format

    /* variables */
    const responseData = []; // To store the formatted response data
    const tableName = 'payroll_config_settings';
    const fields = ['payroll_config_settings.*', 'cycles.name as payroll_cycle_name'];
    const joins = [
      { table: 'cycles', condition: ['cycles.id', 'payroll_config_settings.payroll_cycle_id'], type: 'inner' },
    ];
    const condition = null;
    const totalDetails = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit, null, null, false);
    const paginationDetails = totalDetails.pagination;
    /* variables */

    let serialNo = (page - 1) * limit + 1;
    // Iterates over an array of totalDetails and creates a new object for each item with selected properties.
    // The new objects are then pushed into the responseData array.
    for (const item of totalDetails.data) {
      const listingObject = {
        serial_no: serialNo,
        id: item.id,
        name: item.name,
        payroll_cycle_id: item.payroll_cycle_id,
        payroll_cycle_name: item.payroll_cycle_name,
        from_date: moment(item.from_date).format(dateFormat),
        to_date: moment(item.to_date).format(dateFormat),
        check_date: moment(item.check_date).format(dateFormat),
        actual_check_date: moment(item.actual_check_date).format(dateFormat),
        second_from_date: item.second_from_date !== null ? moment(item.second_from_date).format(dateFormat) : '',
        second_to_date: item.second_to_date !== null ? moment(item.second_to_date).format(dateFormat) : '',
        second_check_date: item.second_check_date !== null ? moment(item.second_check_date).format(dateFormat) : '',
        second_actual_check_date: item.second_actual_check_date !== null ? moment(item.second_actual_check_date).format(dateFormat) : '',
      };
      serialNo++;
      responseData.push(listingObject); // Add the listingObject to the response data array
    }

    return { status: true, data: responseData, pagination_data: paginationDetails };
  } else {
    return payRoll; // Return the repository response if retrieval fails
  }
};

/**
 * Retrieves payroll configuration data from the database based on the given condition.
 * 
 * Logic:
 *   - Fetch payroll configuration settings data from the 'payroll_config_settings' table using the index repository and provided condition.
 *   - If data is found:
 *     + Fetch the date format by calling 'await format.getDateFormat()' and store it in the 'dateFormat' variable.
 *     + Create variables for 'responseData', 'condition1', and 'payrollConfigData'.
 *     + Fetch payroll configuration data from the 'payroll_configuration' table based on specific fields and 'condition1'.
 *     + Fetch the maximum 'to_date' from the 'payroll_configuration' table and store it in the 'maxDate' variable.
 *     + Prepare data for payroll configuration settings into the 'settingObject' object, formatting date values using the 'dateFormat'.
 *     + Determine 'editFromDate' based on the maximum date.
 *     + Iterate over payroll configuration data and create 'listingObject' for each item, formatting date values using 'dateFormat'.
 *     + Push 'listingObject' objects into the 'responseData' array.
 *     + Return a response object with status true, 'config_data' containing payroll configuration data, 'setting_data' containing settings data, and 'edit_from_date'.
 *   - Else:
 *     + return the response object from the payroll configuration settings fetch.
 * 
 * @param {object} condition - The condition to filter the payroll configuration data.
 * @returns {Promise<object>} - A promise that resolves to an object containing payroll configuration and settings data.
 */
const index = async (condition) => {
  // Fetch payroll configuration settings based on the provided condition
  const payRollConfigSetting = await indexRepository.find('payroll_config_settings', ['*'], condition, null, [], null, null, null, false);

  if (payRollConfigSetting.status) {
    // Get the date format
    let dateFormat = await format.getDateFormat(); // date format

    /* variables */
    let responseData = [];  // To store the formatted response data
    let condition1 = { pay_config_setting_id: payRollConfigSetting.data[0].id };

    // Fetch payroll configurations based on the pay_config_setting_id
    let payrollConfigData = await indexRepository.find('payroll_configuration', ['id', 'pay_config_setting_id', 'from_date', 'to_date', 'check_date', 'status'], condition1, 0, [], null, null, null, false);

    // Fetch the maximum 'to_date' with 'status' flag > 1 for the given pay_config_setting_id
    let maxDate = await indexRepository.findRaw('payroll_configuration', [`max(to_date) as max_date`], { pay_config_setting_id: payRollConfigSetting.data[0].id, status: 'Yet to generate' }, null, [], null, null, null, false, "payroll_configuration.created_at");


    let totalDetails = payrollConfigData.data;

    /* Prepare settingObject to hold configuration settings */
    let settingObject = {
      id: payRollConfigSetting.data[0].id,
      name: payRollConfigSetting.data[0].name,
      payroll_cycle_id: payRollConfigSetting.data[0].payroll_cycle_id,
      from_date: moment(payRollConfigSetting.data[0].from_date).format(dateFormat),
      to_date: moment(payRollConfigSetting.data[0].to_date).format(dateFormat),
      check_date: moment(payRollConfigSetting.data[0].check_date).format(dateFormat),
      actual_check_date: moment(payRollConfigSetting.data[0].actual_check_date).format(dateFormat),
      second_from_date: payRollConfigSetting.data[0].second_from_date !== null ? moment(payRollConfigSetting.data[0].second_from_date).format(dateFormat) : '',
      second_to_date: payRollConfigSetting.data[0].second_to_date !== null ? moment(payRollConfigSetting.data[0].second_to_date).format(dateFormat) : '',
      second_check_date: payRollConfigSetting.data[0].second_check_date !== null ? moment(payRollConfigSetting.data[0].second_check_date).format(dateFormat) : '',
      second_actual_check_date: payRollConfigSetting.data[0].second_actual_check_date !== null ? moment(payRollConfigSetting.data[0].second_actual_check_date).format(dateFormat) : '',
    };


    let editFromDate;
    if (maxDate.status) {
      // Calculate 'editFromDate' by adding 1 day to the maximum 'to_date'
      editFromDate = maxDate.data[0].max_date ? moment(maxDate.data[0].max_date).add(1, 'days').format(dateFormat) : '';
    } else {
      editFromDate = '';
    }

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {

      let status_label;
      switch (item.status) {
        case 1:
          status_label = "Yet to generate";
          break;

        case 2:
          status_label = "Drafted";
          break;

        case 3:
          status_label = "Submitted";
          break;

        case 4:
          status_label = "Skipped";
          break;

        default:
          status_label = "NA";
          break;
      }

      const listingObject = {
        id: item.id,
        pay_config_setting_id: item.pay_config_setting_id,
        from_date: moment(item.from_date).format(dateFormat),
        to_date: moment(item.to_date).format(dateFormat),
        check_date: moment(item.check_date).format(dateFormat),
        status: item.status,
        status_label
      };
      responseData.push(listingObject);
    }

    // Return the final response object
    return { status: true, config_data: responseData, setting_data: settingObject, edit_from_date: editFromDate };
  } else {
    return payRollConfigSetting; // Return the repository response if retrieval fails
  }
};

/**
 * Retrieves previous payroll configuration data from the 'payroll_configuration' table based on the given condition with optional pagination.
 * 
 * Logic:
 *   - Call the 'findByPagination' method to retrieve data from the 'payroll_configuration' table based on the provided condition, page, and limit.
 *   - If data is found:
 *     + Fetch the date format by calling 'await format.getDateFormat()' and store it in the 'dateFormat' variable.
 *     + Initialize variables for 'listingObjectdates', 'responseData', 'totalDetails', and 'paginationDetails'.
 *     + Calculate the 'serialNo' for numbering the entries in the response.
 *     + Iterate over 'totalDetails' and create a 'listingObjectdates' for each entry, formatting date values using 'dateFormat'.
 *     + Push 'listingObjectdates' objects into the 'responseData' array.
 *     + Return a response object with status true, 'data' containing the payroll configuration data, and 'pagination_data'.
 *   - Else:
 *     + return the response object from the payroll configuration fetch.
 * 
 * @param {object} condition - The condition to filter the payroll configuration data.
 * @param {number} page - The page number for pagination.
 * @param {number} limit - The maximum number of items per page.
 * @returns {Promise<object>} - A promise that resolves to an object containing payroll configuration data and pagination details.
 */
const previous = async (condition, page, limit) => {
  // Fetch payroll configurations based on condition, page, and limit
  const payRoll = await indexRepository.findByPagination('payroll_configuration', ['*'], condition, [], page, limit, null, null, false);
  if (payRoll.status) {
    // Get the date format
    let dateFormat = await format.getDateFormat(); // date format

    /* variables */
    let listingObjectdates = []; // Initialize an array to store formatted data
    const responseData = []; // // Initialize an array to store the final response
    const totalDetails = payRoll.data; // // Extract data from the repository response
    const paginationDetails = payRoll.pagination; // Extract pagination details

    /* Using Map to iterate the loop and prepare the response */
    let serialNo = (page - 1) * limit + 1; // Calculate the starting serial number
    for (const item of totalDetails) {
      listingObjectdates = {
        serial_no: serialNo,
        id: item.id,
        name: item.name,
        from_date: moment(item.from_date).format(dateFormat),
        to_date: moment(item.to_date).format(dateFormat),
        check_date: moment(item.check_date).format(dateFormat),
      };
      serialNo++; // Increment the serial number
      responseData.push(listingObjectdates); // Add the formatted data to the response array
    }
    // Return the final response object
    return { status: true, data: responseData, pagination_data: paginationDetails };
  } else {
    return payRoll;  // Return the repository response if retrieval fails
  }
};

/**
 * Retrieves payroll listing data based on the provided condition with optional pagination.
 *
 * Logic:
 *   - Build the SQL query using the 'getPayrollList' function, combining the provided condition, date format, limit, and page.
 *   - Call the 'indexRepository.rawQuery' method to execute the constructed SQL query and retrieve payroll listing data.
 *   - If data is found:
 *     + Extract the total payroll count from the first entry of the result.
 *     + Create 'pagination_details' with total, currentPage, perPage, and totalPages.
 *     + Return a response object with status true, 'data' containing payroll listing data, and 'pagination_data'.
 *   - Else:
 *     + Return the response object from the payroll listing fetch.
 *
 * @param {object} condition - The condition to filter the payroll listing data.
 * @param {number} page - The page number for pagination.
 * @param {number} limit - The maximum number of items per page.
 * @param {string} dateFormat - The date format to be used in formatting date values.
 * @returns {Promise<object>} - A promise that resolves to an object containing payroll listing data and pagination details.
 */
const payrollList = async (condition, page, limit, dateFormat, sort_order) => {
  let query = `SELECT * FROM getPayrollList(`;
  query += (condition.status !== null) ? `'${condition.status}',` : `${condition.status},`;
  query += `'${dateFormat}', ${limit}, ${page}, '${sort_order}')`;

  // Get payroll Lisitng using stored
  const payrollListing = await indexRepository.rawQuery(query);

  if (payrollListing && payrollListing.length > 0) {
    let payrollCount = payrollListing[0]?.total_payroll_count;

    pagination_details = {
      total: payrollCount,
      currentPage: page,
      perPage: limit,
      totalPages: Math.ceil(payrollCount / limit)
    }

    return {
      status: true,
      data: payrollListing,
      pagination_data: pagination_details
    }
  } else {
    return payrollListing;
  }
}

/**
 * Retrieves payroll listing data based on the provided condition with optional pagination.
 *
 * Logic:
 *   - Build the SQL query using the 'getPayrollList' function, combining the provided condition, date format, limit, and page.
 *   - Call the 'indexRepository.rawQuery' method to execute the constructed SQL query and retrieve payroll listing data.
 *   - If data is found:
 *     + Extract the total payroll count from the first entry of the result.
 *     + Create 'pagination_details' with total, currentPage, perPage, and totalPages.
 *     + Return a response object with status true, 'data' containing payroll listing data, and 'pagination_data'.
 *   - Else:
 *     + Return the response object from the payroll listing fetch.
 *
 * @param {object} condition - The condition to filter the payroll listing data.
 * @param {number} page - The page number for pagination.
 * @param {number} limit - The maximum number of items per page.
 * @param {string} dateFormat - The date format to be used in formatting date values.
 * @returns {Promise<object>} - A promise that resolves to an object containing payroll listing data and pagination details.
 */
const upcomingPayrollList = async (page, limit) => {

  let dateFormat = await format.getDateFormat(); // date format

  // Fetch payroll configuration settings based on the provided condition
  /* variables */
  const responseData = []; // To store the formatted response data
  const tableName = 'payroll_configuration';
  const fields = ['payroll_configuration.*', 'payroll_config_settings.name','payroll_config_settings.payroll_cycle_id','cycles.name as payroll_cycle_name'];
  const joins = [
    { table: 'payroll_config_settings', condition: ['payroll_config_settings.id', 'payroll_configuration.pay_config_setting_id'], type: 'left' },
    { table: 'cycles', condition: ['cycles.id', 'payroll_config_settings.payroll_cycle_id'], type: 'inner' },
  ];
  var currentDate = moment().format('YYYY-MM-DD')
  const condition = {'payroll_configuration.status': 'Yet to generate', date_greater_than: [{ column: 'payroll_configuration.check_date', date1: currentDate }] };
  const totalDetails = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit, null, null, false);
  /* variables */
  if (totalDetails.status) {
    const paginationDetails = totalDetails.pagination;


    let serialNo = (page - 1) * limit + 1;
    // Iterates over an array of totalDetails and creates a new object for each item with selected properties.
    // The new objects are then pushed into the responseData array.
    for (const item of totalDetails.data) {
      const listingObject = {
        serial_no: serialNo,
        id: item.id,
        name: item.name,
        payroll_cycle_id: item.payroll_cycle_id,
        payroll_cycle_name: item.payroll_cycle_name,
        from_date: moment(item.from_date).format(dateFormat),
        to_date: moment(item.to_date).format(dateFormat),
        check_date: moment(item.check_date).format(dateFormat),
      };
      serialNo++;
      responseData.push(listingObject); // Add the listingObject to the response data array
    }

    return { status: true, data: responseData, pagination_data: paginationDetails };
  } else {
    return payRoll; // Return the repository response if retrieval fails
  }
};

/**
 * Retrieves payroll dashboard data based on the provided date format.
 *
 * Logic:
 *   - Build the SQL query using the 'getPayrollDashboard' function, combining the provided date format.
 *   - Call the 'indexRepository.rawQuery' method to execute the constructed SQL query and retrieve payroll dashboard data.
 *   - If data is found:
 *     + Return a response object with status true and 'data' containing payroll dashboard data.
 *   - Else:
 *     + Return the response object from the payroll dashboard fetch.
 *
 * @param {string} dateFormat - The date format to be used in formatting date values.
 * @returns {Promise<object>} - A promise that resolves to an object containing payroll dashboard data.
 */
const payrollDashboard = async (dateFormat) => {
  let query = `SELECT * FROM getPayrollDashboard(`;
  query += `'${dateFormat}')`;

  // Get employees Lisitng using stored
  const payrollDashboard = await indexRepository.rawQuery(query);

  if (payrollDashboard && payrollDashboard.length > 0) {

    // Function to sort array of objects by check_date
    function sortByCheckDate(array) {
      return array.sort((a, b) => {
        const dateA = new Date(a.check_date);
        const dateB = new Date(b.check_date);
        return dateA - dateB;
      });
    }
    if (payrollDashboard[0].pending != null) {
      // Sorting the "pending" array
      const sortedPendingArray = sortByCheckDate(payrollDashboard[0].pending);
      payrollDashboard[0].pending = sortedPendingArray;

    }
    if (payrollDashboard[0].drafted != null) {
      // Sorting the "drafted" array
      const sortedDraftedArray = sortByCheckDate(payrollDashboard[0].drafted);
      payrollDashboard[0].drafted = sortedDraftedArray;
    }
    return {
      status: true,
      data: payrollDashboard
    }
  } else {
    return payrollDashboard;
  }
}

module.exports = { store, update, listing, date, index, previous, payrollList, payrollDashboard, upcomingPayrollList };
