const indexRepository = require('../../../repositories/index');
const { event } = require('../../../../../../events/configurationActivityEvent');
const moment = require('moment');
const format = require('../../../../../../helpers/format');

/**
 * Store function to create a new Payment Mode.
 * 
 * Logic:
 * - Create a new object 'newPaymentMode' with properties from the request body.
 * - Call the store repository function with 'newPaymentMode' to add it to the 'payment_modes' table.
 * - Create an 'activity' object to track the creation of the Payment Mode.
 * - Emit an event to log the activity.
 * - Return the response from the repository.
 *        
 * @param {Object} body - The request body containing Payment Mode details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {
  /* Creating new object */
  const newPaymentMode = {
    name: body.name,
    is_active: body.is_active,
    description: body?.description || null,
    created_by: body.created_by,
    created_at: new Date(),
  };
  /* Creating new object */

  /**
   *  + Call the store repository function
   *    -Based on the status in store function response, segregate the response and prepare the response
  */
  const paymentMode = await indexRepository.store('payment_modes', newPaymentMode);

  /**Activity track */
  const activity = {
    referrable_id: paymentMode.data[0].id,
    referrable_type: 9,
    action_type: 1,
    created_by: body.created_by,
  };
  event.emit('configurationStoreActivity', {activity} );
  /**Activity track */
  return paymentMode;
};

/**
 * Update function to modify an existing Payment Mode.
 * 
 * Logic:
 * - Create an 'updateData' object with properties from the request body.
 * - Fetch Payment Mode details before the update using the provided 'condition'.
 * - Call the update repository function with 'condition' and 'updateData' to modify the Payment Mode data in 'payment_modes' table.
 * - Fetch Payment Mode details after the update using the same 'condition'.
 * - Create an 'activity' object to track the update of the Payment Mode.
 * - Emit an event to log the activity, including details before and after the update.
 * - Return the response from the repository.
 *        
 * @param {Object} body - The request body containing Payment Mode details for the update.
 * @param {Object} condition - The condition to identify the Payment Mode to be updated.
 * @returns {Object} Repository response.
 */
const update = async (body, condition) => {

  /* Creating update entry object */
  const updateData = {
    name: body.name,
    is_active: body.is_active,
    description: body?.description || null,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /**Fetching payment mode details before update */
  const beforeUpdateData = await getPaymentModeData(condition)
  /**Fetching payment mode details before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
  */
  const repositoryResponse = await indexRepository.update('payment_modes', condition, updateData);

  /**Fetching payment mode details after update */
  const afterUpdateData = await getPaymentModeData(condition)
  /**Fetching payment mode details after update */

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 9,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

  return repositoryResponse;
};

/**
 * Update Status function to modify the active status of a Payment Mode.
 * 
 * Logic:
 * - Create an 'updateData' object with the new 'is_active' status from the request body.
 * - Fetch Payment Mode details before the status update using the provided 'condition'.
 * - Call the update repository function with 'condition' and 'updateData' to modify the 'is_active' status in 'payment_modes' table.
 * - Fetch Payment Mode details after the status update using the same 'condition'.
 * - Create an 'activity' object to track the update of the Payment Mode status.
 * - Emit an event to log the activity, including details before and after the status update.
 * - Return the response from the repository.
 *        
 * @param {Object} body - The request body containing the new 'is_active' status for the update.
 * @param {Object} condition - The condition to identify the Payment Mode to be updated.
 * @returns {Object} Repository response.
 */
const updateStatus = async (body, condition) => {
  const updateData = {
    is_active: body.is_active,
    updated_at: new Date(),
    updated_by: body.updated_by,
  };

  /**Fetching payment mode details before update */
  const beforeUpdateData = await getPaymentModeData(condition)
  /**Fetching payment mode details before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
  */
  const paymentModeData = await indexRepository.update('payment_modes', condition, updateData);

  /**Fetching payment mode details after update */
  const afterUpdateData = await getPaymentModeData(condition)
  /**Fetching payment mode details after update */

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 9,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

  return paymentModeData
};

/**
 * Listing function to retrieve a paginated list of Payment Modes with activity track.
 * 
 * Logic:
 * - Set default variables for the table name, fields, joins.
 * - Use the repository function to fetch Payment Modes data from 'payment_modes' table based on the provided condition, page, and limit.
 * - If data exists:
 *   + Create a 'responseData' empty array
 *   + Map the repository response data to 'totalDetails'
 *   + Map the pagination deatils to 'paginationDetails'
 *   + Iterate the 'totalDetails' and create a 'listingObject' object with response data
 *   + Push the 'listingObject' object to 'responseData' array
 *   + Call repository find function to fecth activity track data from 'configuration_activity_track' table based on condition 'configuration_type' is '4' and 'configuration_sub_module' is 'payment-mode'
 *   + Map the activity track response data to 'filteredActivities'
 *   + Create empty array 'transformedActivity'
 *   + Iterate the 'filteredActivities' and for each iteration call repository find function to get employee_name from 'employees' table based id(filteredActivities[key].created_by)
 *   + Prepare 'activityObject' object using 'filteredActivities' data
 *   + Push 'activityObject' object to 'transformedActivity' arary
 *   + Return response object with status true, responseData, transformedActivity and paginationDetails  
 * - Else:
 *   + return repository response 'paymentMode'.
 *    
 * @param {Object} condition - The conditions to filter Payment Modes.
 * @param {number} page - The page number for paginating results.
 * @param {number} limit - The number of items per page.
 * @returns {Object} Response with paginated Payment Mode details and activity logs.
 */
const listing = async (condition, page, limit) => {
  /* Default variables */
  const tableName = 'payment_modes';
  const fields = ['payment_modes.*', 'create.display_name as create_emp', 'update.display_name as updated_emp'];
  const joins = [
    { table: 'employee as create', alias: 'create', condition: ['payment_modes.created_by', 'create.id'], type: 'left' },
    { table: 'employee as update', alias: 'update', condition: ['payment_modes.updated_by', 'update.id'], type: 'left' },
  ];
  /* Default variables */
  const paymentMode = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit);
  if (paymentMode.status) {
    /* variables */
    const responseData = [];
    const totalDetails = paymentMode.data;
    const paginationDetails = paymentMode.pagination;
    /* variables */

    let serialNo = (page - 1) * limit + 1;
    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        serial_no: serialNo,
        id: item.id,
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

    return { status: true, data: responseData, pagination_data: paginationDetails };
  } else {
    return paymentMode;
  }
};

/**
 * Index function to retrieve Payment Mode details based on specified conditions.
 * 
 * Logic:
 * - Use the repository function to fetch Payment Mode data from the 'payment_modes' table based on the provided condition.
 * - If data exists:
 *   + Create an 'responseData' empty array.
 *   + Map the repository response data to 'totalDetails'.
 *   + Iterate over the 'totalDetails' and create a 'listingObject' object with response data.
 *   + Push the 'listingObject' object to the 'responseData' array.
 *   + Return a response object with status true and 'responseData' array.
 * - Else:
 *   + Return the repository response 'paymentMode'.
 *    
 * @param {Object} condition - The conditions to filter Payment Modes.
 * @returns {Object} Response with Payment Mode details.
 */
const index = async (condition) => {
  const paymentMode = await indexRepository.find('payment_modes', ['id', 'name', 'description', 'is_active', 'is_editable'], condition);
  if (paymentMode.status) {
    /* variables */
    const responseData = [];
    const totalDetails = paymentMode.data;
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

    return { status: true, data: responseData};
  } else {
    return paymentMode;
  }
};

/**
 * Retrieve Payment Mode data based on specified conditions.
 * 
 * Logic:
 * - Use the repository function to fetch Payment Mode data from the 'payment_modes' table based on the provided condition.
 * - Create a 'responseData' object with key-value pairs to represent the Payment Mode details.
 * - Return 'responseData'.
 *    
 * @param {Object} condition - The conditions to filter Payment Modes.
 * @returns {Object} Response with Payment Mode details.
 */
 const getPaymentModeData = async (condition) => {
  const paymentModeData = await indexRepository.find('payment_modes', ['*'], condition);
  const responseData = { 
    'Name' :  paymentModeData.data[0].name,
    'Description': paymentModeData.data[0].description, 
    'Status': paymentModeData.data[0].is_active ? 'Active' : 'In-active'
  };
  return responseData
}

/**
 * Soft-delete a Payment Mode based on specified conditions.
 * 
 * Logic:
 * - Create a 'updateData' object.
 * - Call the update method from the common Repository to perform the soft delete operation based on the specified conditions.
 * - Create an 'activity' object to log the deletion action in the configuration activity track.
 * - Emit an event to capture and track the deletion activity.
 * - Return the response
 *    
 * @param {Object} body - The request body containing parameters to identify the Payment Mode to be deleted.
 * @param {Object} condition - The conditions to specify which Payment Mode to delete.
 * @returns {Object} Response from the soft delete operation.
 */
const destroy = async (body, condition) => {

  /* Creating delete entry object */
  const updateData = {
    is_active: 0,
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by,
  };
  /* Creating delete entry object */

  /* calling update method from paymentMode Repository to update a new entry */
  const repositoryResponse = await indexRepository.update('payment_modes', condition, updateData);

  const activity = {
    referrable_id: condition.id,
    referrable_type: 9,
    action_type: 3,
    created_by: body.created_by,
  };
  event.emit('configurationDeleteActivity', activity);
  return repositoryResponse;
  /* calling update method from PaymentMode Repository to update a new entry */
};

module.exports = { destroy, index, listing, store, update, updateStatus };
