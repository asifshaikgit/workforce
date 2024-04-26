const { event } = require('../../../../../events/configurationActivityEvent');
const moment = require('moment');
const indexRepository = require('../../repositories/index');
const format = require('../../../../../helpers/format');

/**
 * Store function to create a new Net Pay Term entry.
 * 
 * Logic:
 * - Create a new object 'newNetPayTerm' with properties from the request body.
 * - Call the repository's store function to add the 'newNetPayTerm' to the 'net_pay_terms' table.
 * - Track the creation activity for the Net Pay Term.
 * - Emit an event to log the activity.
 * - Return the response from the repository.
 *    
 * @param {Object} body - The request body containing Net Pay Term details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {

  /* Creating store entry object */
  const newNetPayTerm = {
    days: body.days,
    description: body?.description || null,
    is_active: body.is_active,
    created_at: new Date(),
    created_by: body.created_by,
  };
  /* Creating store entry object */

  const netTerms = await indexRepository.store('net_pay_terms', newNetPayTerm);

  /**Activity track */
  const activity = {
    referrable_id: netTerms.data[0].id,
    referrable_type: 18,
    action_type: 1,
    created_by: body.created_by,
  };
  event.emit('configurationStoreActivity', {activity});
  /**Activity track */

  return netTerms;
};

/**
 * Update function to modify an existing Net Pay Terms entry.
 * 
 * Logic:
 * - Create an 'updateData' object with properties from the request body.
 * - Fetch Net Pay Terms details before the update using the provided 'condition'.
 * - Call the update repository function with 'condition' and 'updateData' to modify the Net Pay Terms data in the 'net_pay_terms' table.
 * - Fetch Net Pay Terms details after the update using the same 'condition'.
 * - Create an 'activity' object to track the update of the Net Pay Terms.
 * - Emit an event to log the activity, including details before and after the update.
 * - Return the response from the repository.
 *        
 * @param {Object} body - The request body containing updated Net Pay Terms details.
 * @param {Object} condition - The condition to identify the Net Pay Terms entry to update.
 * @returns {Object} Repository response.
 */
const update = async (body, condition) => {

  /* Creating update entry object */
  const updateData = {
    days: body.days,
    is_active: body.is_active,
    description: body?.description || null,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /**Fetching net pay terms details before update */
  const beforeUpdateData = await getNetPayTermsData(condition)
  /**Fetching net pay terms details before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
  */
  const repositoryResponse = await indexRepository.update('net_pay_terms', condition, updateData);

  /**Fetching net pay terms details after update */
  const afterUpdateData = await getNetPayTermsData(condition)
  /**Fetching net pay terms details after update */

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 18,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

  return repositoryResponse;
};

/**
 * Update Status function to modify the active status of a Net Pay Terms entry.
 * 
 * Logic:
 * - Create an 'updateData' object with the new 'is_active' status from the request body.
 * - Fetch Net Pay Terms details before the status update using the provided 'condition'.
 * - Call the update repository function with 'condition' and 'updateData' to modify the 'is_active' status in the 'net_pay_terms' table.
 * - Fetch Net Pay Terms details after the status update using the same 'condition'.
 * - Create an 'activity' object to track the update of the Net Pay Terms status.
 * - Emit an event to log the activity, including details before and after the status update.
 * - Return the response from the repository.
 *        
 * @param {Object} body - The request body containing the new 'is_active' status for the update.
 * @param {Object} condition - The condition to identify the Net Pay Terms entry to be updated.
 * @returns {Object} Repository response.
 */
const updateStatus = async (body, condition) => {

  /* Creating update entry object */
  const updateData = {
    is_active: body.is_active,
    updated_at: new Date(),
    updated_by: body.updated_by,
  };
  /* Creating update entry object */

  /**Fetching net pay terms details before update */
  const beforeUpdateData = await getNetPayTermsData(condition)
  /**Fetching net pay terms details before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
  */
  const netPaytermsData = await indexRepository.update('net_pay_terms', condition, updateData);

  /**Fetching net pay terms details after update */
  const afterUpdateData = await getNetPayTermsData(condition)
  /**Fetching net pay terms details after update */

  /**Activity track */
  const activity = {
    referrable_id: netPaytermsData.data[0].id,
    referrable_type: 18,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

  return netPaytermsData
};

/**
 * Retrieve  Net Pay Terms data based on specified conditions.
 * 
 * Logic:
 * - Use the repository function to fetch  Net Pay Terms data from the 'net_pay_terms' table based on the provided condition.
 * - Create a 'responseData' object with key-value pairs to represent the Net Pay Terms details.
 * - Return 'responseData'.
 *    
 * @param {Object} condition - The conditions to filter Payment Modes.
 * @returns {Object} Response with Net Pay Terms details.
 */
const getNetPayTermsData = async (condition) => {
  const netPayTermsData = await indexRepository.find('net_pay_terms', ['*'], condition);
  const responseData = {
    'Name': 'Net-' + netPayTermsData.data[0].days,
    'Description': netPayTermsData.data[0].description,
    'Status': netPayTermsData.data[0].is_active ? 'Active' : 'In-active',
  };

  return responseData
};

/**
 * Listing function to retrieve a paginated list of Net Pay Terms with activity track.
 * 
 * Logic:
 * - Set default variables for the table name, fields, and joins.
 * - Use the repository function to fetch Net Pay Terms data from the 'net_pay_terms' table based on the provided condition, page, and limit.
 * - If data exists:
 *   + Create a 'responseData' empty array.
 *   + Map the repository response data to 'totalDetails'.
 *   + Map the pagination details to 'paginationDetails'.
 *   + Iterate over 'totalDetails' and create a 'listingObject' object with response data.
 *   + Push the 'listingObject' object to the 'responseData' array.
 *   + Call the repository find function to fetch activity track data from 'configuration_activity_track' table based on condition 'configuration_type' is '6' and 'configuration_sub_module' is 'net-pay-terms'.
 *   + Map the activity track response data to 'filteredActivities'.
 *   + Create an empty array 'transformedActivity'.
 *   + Iterate over 'filteredActivities' and for each iteration, call the repository find function to get the employee_name from the 'employee' table based on 'id' (filteredActivities[key].created_by).
 *   + Prepare 'activityObject' object using 'filteredActivities' data.
 *   + Push 'activityObject' object to the 'transformedActivity' array.
 *   + Return the response object with status true, responseData, transformedActivity, and paginationDetails.
 * - Else:
 *   + Return the response object with status false, empty data, transformedActivity, and paginationDetails.
 *    
 * @param {Object} condition - The conditions to filter Net Pay Terms.
 * @param {number} page - The page number for paginating results.
 * @param {number} limit - The number of items per page.
 * @returns {Object} Response with paginated Net Pay Terms details and activity logs.
 */
const listing = async (condition, page, limit) => {
  /* Default variables */
  const tableName = 'net_pay_terms';
  const fields = ['net_pay_terms.*', 'create.display_name as create_emp', 'update.display_name as updated_emp'];
  const joins = [
    { table: 'employee as create', alias: 'create', condition: ['net_pay_terms.created_by', 'create.id'], type: 'left', ignoreDeletedAt: true },
    { table: 'employee as update', alias: 'update', condition: ['net_pay_terms.updated_by', 'update.id'], type: 'left', ignoreDeletedAt: true },
  ];
  /* Default variables */
  const netPay = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit);
  if (netPay.status) {
    /* variables */
    const responseData = [];
    const totalDetails = netPay.data;
    const paginationDetails = netPay.pagination;
    /* variables */

    let serialNo = (page - 1) * limit + 1;
    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        serial_no: serialNo,
        id: item.id,
        days: item.days,
        is_active: item.is_active,
        is_editable: item.is_editable,
        description: (item.description !== null ? item.description : ''),
        created_by: (item.create_emp !== null ? item.create_emp : 'System'),
        updated_by: (item.updated_emp !== null ? item.updated_emp : ''),
      };
      serialNo++;
      responseData.push(listingObject);
    }

    // /* prepare the response */

    return { status: true, data: responseData, pagination_data: paginationDetails };
  } else {
    return netPay;
  }
};

/**
 * Index function to retrieve Net Pay Terms details based on specified conditions.
 * 
 * Logic:
 * - Use the repository function to fetch Net Pay Terms data from the 'net_pay_terms' table based on the provided condition.
 * - If data exists:
 *   + Create a 'responseData' empty array.
 *   + Map the repository response data to 'totalDetails'.
 *   + Iterate over the 'totalDetails' and create a 'listingObject' object with selected response data properties.
 *   + Push each 'listingObject' to the 'responseData' array.
 *   + Return a response object with status true and the 'responseData' array.
 * - Else:
 *   + Return the repository response 'netPay'.
 *    
 * @param {Object} condition - The conditions to filter Net Pay Terms.
 * @returns {Object} Response with Net Pay Terms details.
 */
const index = async (condition) => {
  /**
   * Retrieves the net pay terms from the index repository based on the given condition.
   */
  const netPay = await indexRepository.find('net_pay_terms', ['*'], condition);
  // return net_pay;{
  if (netPay.status) {
    /* variables */
    const responseData = [];
    const totalDetails = netPay.data;
    /* variables */

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        id: item.id,
        days: item.days,
        description: (item.description !== null ? item.description : ''),
        is_active: item.is_active,
        is_editable: item.is_editable,
      };
      responseData.push(listingObject);
    }

    return { status: true, data: responseData };
  } else {
    return netPay;
  }
};

/**
 * Dropdown function to retrieve Net Pay Terms details for dropdown selection based on specified conditions.
 * 
 * Logic:
 * - Use the repository function to fetch Net Pay Terms data from the 'net_pay_terms' table based on the provided condition.
 * - If data exists:
 *   + Create a 'responseData' array.
 *   + Map the repository response data to 'totalDetails'.
 *   + Iterate over the 'totalDetails' and create a 'listingObject' object with selected response data properties.
 *   + Push each 'listingObject' to the 'responseData' array.
 *   + Return a response object with status true and the 'responseData' array.
 * - Else:
 *   + Return the repository response 'net_pay'.
 *    
 * @param {Object} condition - The conditions to filter Net Pay Terms for the dropdown.
 * @returns {Object} Response with Net Pay Terms details for dropdown selection.
 */
const dropdown = async (condition) => {
  var net_pay = await indexRepository.find('net_pay_terms', ['id', 'days'], condition, 0, [], 0, 'days', 'asc');
  if (net_pay.status) {

    /* Variables */
    const responseData = [];
    const totalDetails = net_pay.data;
    /* Variables */

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        id: item.id,
        days: String(item.days),
      };
      responseData.push(listingObject);
    }

    return { status: true, data: responseData };
  } else {
    return net_pay;
  }
};

/**
 * Destroy function to delete Net Pay Terms based on specified conditions.
 * 
 * Logic:
 * - Use the repository function(destroy) to delete Net Pay Terms from the 'net_pay_terms' table based on the provided condition.
 * - Create an 'activity' object to log the deletion action in the configuration activity track.
 * - Emit an event to capture and track the deletion activity.
 *    
 * @param {Object} body - The data associated with the Net Pay Term being deleted, including 'days' and 'created_by'.
 * @param {Object} condition - The conditions to specify which Net Pay Term(s) to delete.
 */
const destroy = async (body, condition) => {

  var updateData = {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by
  };

  await indexRepository.update('net_pay_terms', condition , updateData);

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 18,
    action_type: 3,
    created_by: body.created_by,
  };
  event.emit('configurationDeleteActivity', activity);
  /**Activity track */
}

module.exports = { dropdown, index, destroy, listing, store, update, updateStatus };
