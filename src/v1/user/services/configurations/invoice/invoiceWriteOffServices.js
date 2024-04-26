const indexRepository = require('../../../repositories/index');
const { event } = require('../../../../../../events/configurationActivityEvent');
const moment = require('moment');
const format = require('../../../../../../helpers/format');

/**
 * Store function to create a new entity.
 * 
 * Logic:
 * - Create a 'newWriteOff' object with properties from the request body.
 * - Call the common store repository function with the 'newWriteOff' object to add it to the 'write_off' table.
 * - Create an 'activity' object to track the creation of the entity.
 * - Emit an event to log the activity.
 * - Return the response from the repository.
 *        
 * @param {Object} body - The request body containing entity details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {

  /* Creating store entry object */
  const newWriteOff = {
    write_off_reason: body.write_off_reason,
    description: body?.description || null,
    created_by: body.created_by,
    created_at: new Date(),
  };
  /* Creating store entry object */

  const writeOff = await indexRepository.store('write_off', newWriteOff);

  /**Activity track */
  const activity = {
    referrable_id: writeOff.data[0].id,
    referrable_type: 10,
    action_type: 1,
    created_by: body.created_by,
  };
  event.emit('configurationStoreActivity', {activity} );
  /**Activity track */

  return writeOff;
};

/**
 * Update function to modify an existing entity.
 * 
 * Logic:
 * - Create an 'updateData' object with properties from the request body.
 * - Fetch write off details before the update using the provided 'condition'.
 * - Call the update repository function with 'condition' and 'updateData' to modify the entity data in the 'write_off' table.
 * - Fetch entity details after the update using the same 'condition'.
 * - Create an 'activity' object to track the update of the entity.
 * - Emit an event to log the activity, including details before and after the update.
 * - Return the response from the repository.
 *        
 * @param {Object} body - The request body containing entity details for the update.
 * @param {Object} condition - The condition to identify the entity to be updated.
 * @returns {Object} Repository response.
 */
const update = async (body, condition) => {
  
  /* Creating update entry object */
  const updateData = {
    write_off_reason: body.write_off_reason,
    is_active : body.is_active,
    description: body?.description || null,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /**Fetching invoice write off data before update */
  const beforeUpdateData = await getInvoiceWriteOffData(condition)
  /**Fetching invoice write off data before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
   */
  const repositoryResponse = await indexRepository.update('write_off', condition, updateData);

  /**Fetching invoice write off data after update */
  const afterUpdateData = await getInvoiceWriteOffData(condition)
  /**Fetching invoice write off data after update */

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 10,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

  return repositoryResponse;
};

/**
 * Update Status function to modify the active status of an entity.
 * 
 * Logic:
 * - Create an 'updateData' object with the new 'is_active' status from the request body.
 * - Fetch write off details before the status update using the provided 'condition'.
 * - Call the update repository function with 'condition' and 'updateData' to modify the 'is_active' status in the 'write_off' table.
 * - Fetch write off details after the status update using the same 'condition'.
 * - Create an 'activity' object to track the update of the entity status.
 * - Emit an event to log the activity, including details before and after the status update.
 * - Return the response from the repository.
 *        
 * @param {Object} body - The request body containing the new 'is_active' status for the update.
 * @param {Object} condition - The condition to identify the entity to be updated.
 * @returns {Object} Repository response.
 */
const updateStatus = async (body, condition) => {

  const updateData = {
    is_active: body.is_active,
    updated_at: new Date(),
    updated_by: body.updated_by,
  };

  /**Fetching invoice write off data before update */
  const beforeUpdateData = await getInvoiceWriteOffData(condition)
  /**Fetching invoice write off data before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
   */
  const writeOffData = await indexRepository.update('write_off', condition, updateData);

  /**Fetching invoice write off data after update */
  const afterUpdateData = await getInvoiceWriteOffData(condition)
  /**Fetching invoice write off data after update */

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 10,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

  return writeOffData
};

/**
 * Retrieve Write off data based on specified conditions.
 * 
 * Logic:
 * - Use the repository function to fetch Write Off data from the 'write_off' table based on the provided condition.
 * - Create a 'responseData' object with key-value pairs to represent the Write Off details.
 * - Return 'responseData'.
 *    
 * @param {Object} condition - The conditions to filter Payment Modes.
 * @returns {Object} Response with Write off details.
 */
const getInvoiceWriteOffData = async (condition) => {
  const invoiceWriteOffData = await indexRepository.find('write_off', ['*'], condition);
  const responseData = {
    'Name': invoiceWriteOffData.data[0].write_off_reason,
    'Description': invoiceWriteOffData.data[0].description,
    'Status': invoiceWriteOffData.data[0].is_active ? 'Active' : 'In-active'
  };

  return responseData
}

/**
 * Listing function to retrieve a paginated list of Write Off reasons with activity track.
 * 
 * Logic:
 * - Set default variables for the table name, fields, and joins.
 * - Use the repository function to fetch Write Off reasons data from the 'write_off' table based on the provided condition, page, and limit.
 * - If data exists:
 *   + Create a 'responseData' empty array.
 *   + Map the repository response data to 'totalDetails'.
 *   + Map the pagination details to 'paginationDetails'.
 *   + Iterate over 'totalDetails' and create a 'listingObject' object with response data.
 *   + Push the 'listingObject' object to the 'responseData' array.
 *   + Call the repository find function to fetch activity track data from 'configuration_activity_track' table based on condition 'configuration_type' is '4' and 'configuration_sub_module' is 'write-off'.
 *   + Map the activity track response data to 'filteredActivities'.
 *   + Create an empty array 'transformedActivity'.
 *   + Iterate over 'filteredActivities' and for each iteration, call the repository find function to get employee_name from the 'employee' table based on 'id' (filteredActivities[key].created_by).
 *   + Prepare 'activityObject' object using 'filteredActivities' data.
 *   + Push 'activityObject' object to the 'transformedActivity' array.
 *   + Return the response object with status true, responseData, transformedActivity, and paginationDetails.
 * - Else:
 *   + Return the response object with status false, empty data, transformedActivity, and paginationDetails.
 *    
 * @param {Object} condition - The conditions to filter Write Off reasons.
 * @param {number} page - The page number for paginating results.
 * @param {number} limit - The number of items per page.
 * @returns {Object} Response with paginated Write Off reason details and activity logs.
 */
const listing = async (condition, page, limit) => {
  /* Default variables */
  const tableName = 'write_off';
  const fields = ['write_off.id', 'write_off.write_off_reason', 'write_off.description', 'write_off.is_editable', 'write_off.is_active', 'create.display_name as create_emp', 'update.display_name as updated_emp'];
  const joins = [
    { table: 'employee as create', alias: 'create', condition: ['write_off.created_by', 'create.id'], type: 'left' },
    { table: 'employee as update', alias: 'update', condition: ['write_off.updated_by', 'update.id'], type: 'left' },
  ];
  /* Default variables */
  const writeOff = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit);
  if (writeOff.status === true) {
    /* variables */
    const responseData = [];
    const totalDetails = writeOff.data;
    const paginationDetails = writeOff.pagination;
    /* variables */

    let serialNo = (page - 1) * limit + 1;
    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        serial_no: serialNo,
        id: item.id,
        write_off_reason: item.write_off_reason,
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
    return writeOff;
  }
};

/**
 * Index function to retrieve Write Off reason details based on specified conditions.
 * 
 * Logic:
 * - Use the repository function to fetch Write Off reason data from the 'write_off' table based on the provided condition.
 * - If data exists:
 *   + Create a 'responseData' empty array.
 *   + Map the repository response data to 'totalDetails'.
 *   + Iterate over the 'totalDetails' and create a 'listingObject' object with response data.
 *   + Push the 'listingObject' object to the 'responseData' array.
 *   + Return a response object with status true and the first item in the 'responseData' array.
 * - Else:
 *   + Return the repository response 'writeOff'.
 *    
 * @param {Object} condition - The conditions to filter Write Off reasons.
 * @returns {Object} Response with Write Off reason details.
 */
const index = async (condition) => {
  const writeOff = await indexRepository.find('write_off', ['id', 'write_off_reason', 'description', 'is_active', 'is_editable'], condition);
  // return writeOff;{
  if (writeOff.status === true) {
    /* variables */
    const responseData = [];
    const totalDetails = writeOff.data;
    /* variables */

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        id: item.id,
        write_off_reason: item.write_off_reason,
        description: (item.description !== null ? item.description : ''),
        is_active: item.is_active,
        is_editable: item.is_editable,
      };
      responseData.push(listingObject);
    }

    return { status: true, data: responseData[0] };
  } else {
    return writeOff;
  }
};

/**
 * Soft-delete a Write Off reason based on specified conditions.
 * 
 * Logic:
 * - Create an 'updateData' object with deleted_at timestamp and updated metadata.
 * - Call the update method from the common Repository to perform the soft delete operation based on the specified conditions.
 * - Create an 'activity' object to log the deletion action in the configuration activity track.
 * - Emit an event to capture and track the deletion activity.
 * - Return the response from the soft delete operation.
 *    
 * @param {Object} body - The request body containing parameters to identify the Write Off reason to be deleted.
 * @param {Object} condition - The conditions to specify which Write Off reason to delete.
 * @returns {Object} Response from the soft delete operation.
 */
const destroy = async (body, condition) => {

  /* Creating delete entry object */
  const updateData = {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by,
  };
  /* Creating delete entry object */

  /* calling update method from indexRepository to update a new entry */
  const repositoryResponse = await indexRepository.update('write_off', condition, updateData);

  const activity = {
    referrable_id: condition.id,
    referrable_type: 10,
    action_type: 3,
    created_by: body.created_by,
  };
  event.emit('configurationDeleteActivity', activity);
  return repositoryResponse;
};

module.exports = { destroy, index, listing, store, update, updateStatus };
