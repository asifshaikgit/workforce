const indexRepository = require('../../../repositories/index');
const { event } = require('../../../../../../events/configurationActivityEvent');
const moment = require('moment');
const format = require('../../../../../../helpers/format');

/**
 * Store function to create a new Invoice Tax entry.
 * 
 * Logic:
 * - Create a new object 'newInvoiceTax' with properties from the request body.
 * - Call the store repository function with 'newInvoiceTax' to add it to the 'invoice_taxes' table.
 * - fetch the taxes details before and after the the update for activity track
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the taxes activity
 * - Emit an event to log the activity.
 * - Return the response from the repository.
 *        
 * @param {Object} body - The request body containing Invoice Tax details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {

  /* Creating store entry object */
  const newInvoicetaxes = {
    name: body.name,
    type: body.type,
    value: body.value,
    created_at: new Date(),
    created_by: body.created_by,
  };
  /* Creating store entry object */

  const invoicetax = await indexRepository.store('invoice_taxes', newInvoicetaxes);

  /**activity track */
  const activity = {
    referrable_id: invoicetax.data[0].id,
    referrable_type: 10,
    action_type: 1,
    created_by: body.created_by,
  };
  event.emit('configurationStoreActivity', activity );
  /**activity track */

  return invoicetax;
};

/**
 * Update function to modify an existing invoice Tax.
 * 
 * Logic:
 * - Create an 'updateData' object with properties from the request body.
 * - Call the update repository function with 'condition' and 'updateData' to modify the Invoice Tax data in 'invoice_taxes' table.
 * - Create an 'activity' object to track the creation of the Invoice Tax entry.
 * - Emit an event to log the activity.
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
    type: body.type,
    value: body.value,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /**Fetching the taxes data before update */
  const beforeUpdateData = await getTaxes({ id : condition.id })
  /**Fetching the taxes data before update */

  /**
   *  + Call the update repository function
   *  -Based on the status in update function response, segregate the response and prepare the response
   *
   */
  const repositoryResponse = await indexRepository.update('invoice_taxes', condition, updateData);

  /**Fetching the taxes data after update */
  const afterUpdateData = await getTaxes({ id: condition.id })
  /**Fetching the taxes data after update */

  /**activity track */
  const activity = {
    referrable_id: repositoryResponse.data[0].id,
    referrable_type: 10,
    action_type: 2,
    created_by: body.created_by
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**activity track */

  return repositoryResponse;
};

/**
 * Update function to modify an existing configuration to enable or disable taxes for invoices.
 * 
 * Logic:
 * - Create condition object with 'id' is 1 (in 'organization' table cantain 1 record only)
 * - Create an 'updateData' object with properties from the request body.
 * - Call the update repository function with 'condition' and 'updateData' to modify the configuration data in the 'organization' table.
 * - Return the response from the repository.
 *        
 * @param {Object} body - The request body containing the configuration details for the update.
 * @returns {Object} Repository response.
 */
const updateEnableTaxInvoice = async (body) => {
  /* Writing condition to the update entry */
  const condition = { id: 1 };
  /* Writing condition to the update entry */

  /* Creating update entry object */
  const updateData = {
    enable_taxes_for_invoices: body.enable_taxes_for_invoices,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /**
   *  + Call the update repository function
   *  -Based on the status in update function response, segregate the response and prepare the response
   *
   */
  const repositoryResponse = await indexRepository.update('organization', condition, updateData);
  return repositoryResponse;
};

/**
 * Listing function to retrieve a paginated list of Invoice Taxes with activity track.
 * 
 * Logic:
 * - Set default variables for the table name, fields, joins.
 * - Use the repository function to fetch Invoice Taxes data from 'invoice_taxes' table based on the provided condition, page, and limit.
 * - If data exists:
 *   + Create a 'responseData' empty array
 *   + Map the repository response data to 'totalDetails'
 *   + Map the pagination details to 'paginationDetails'
 *   + Iterate through 'totalDetails' and create a 'listingObject' for each item with response data
 *   + Push the 'listingObject' to the 'responseData' array
 *   + Call the repository find function to fetch activity track data from 'configuration_activity_track' table based on the condition where 'configuration_type' is '4' and 'configuration_sub_module' is 'invoice-taxes'
 *   + Map the activity track response data to 'filteredActivities'
 *   + Create an empty array 'transformedActivity'
 *   + Iterate through 'filteredActivities' and for each iteration, call the repository find function to get the 'employee_name' from the 'employees' table based on 'id' (filteredActivities[key].created_by)
 *   + Prepare an 'activityObject' using 'filteredActivities' data
 *   + Push the 'activityObject' to the 'transformedActivity' array
 *   + Return a response object with status true, responseData, transformedActivity, and paginationDetails  
 * - If no data exists, return a response object with status false and empty data arrays and paginationDetails.
 *    
 * @param {Object} condition - The conditions to filter Invoice Taxes.
 * @param {number} page - The page number for paginating results.
 * @param {number} limit - The number of items per page.
 * @returns {Object} Response with paginated Invoice Tax details and activity logs.
 */
const listing = async (condition, page, limit) => {
  /* Default variables */
  const tableName = 'invoice_taxes';
  const fields = ['invoice_taxes.*', 'create.display_name as create_emp', 'update.display_name as updated_emp'];
  const joins = [
    { table: 'employee as create', alias: 'create', condition: ['invoice_taxes.created_by', 'create.id'], type: 'left' },
    { table: 'employee as update', alias: 'update', condition: ['invoice_taxes.updated_by', 'update.id'], type: 'left' },
  ];
  /* Default variables */
  const invoiceTaxes = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit);
  if (invoiceTaxes.status) {
    /* variables */
    const responseData = [];
    const totalDetails = invoiceTaxes.data;
    const paginationDetails = invoiceTaxes.pagination;
    /* variables */

    let serialNo = (page - 1) * limit + 1;
    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        serial_no: serialNo,
        id: item.id,
        name: item.name,
        type: item.type,
        value: item.value,
        created_by: (item.create_emp !== null ? item.create_emp : 'System'),
        updated_by: (item.updated_emp !== null ? item.updated_emp : ''),
      };
      serialNo++;
      responseData.push(listingObject);
    }

    /* prepare the response */

    return { status: true, data: responseData, pagination_data: paginationDetails };
  } else {
    return { status: false, data: [], activity: [], pagination_data: invoiceTaxes.pagination };
  }
};

/**
 * Index function to retrieve details of a specific Invoice Tax.
 * 
 * Logic:
 * - Call the index repository function to fetch Invoice Tax details based on the provided condition.
 * - If data exists:
 *   + Create a 'responseData' array
 *   + Map the repository response data to 'totalDetails'
 *   + Iterate through 'totalDetails' and create a 'listingObject' for each item with selected properties
 *   + Push the 'listingObject' to the 'responseData' array
 *   + Return a response object with status true and the first item in the 'responseData' array.
 * - If no data exists, return the repository response 'invoiceTaxes'.
 *    
 * @param {Object} condition - The conditions to filter Invoice Taxes.
 * @returns {Object} Response with details of a specific Invoice Tax.
 */
const index = async (condition) => {
  /**
   * Calling a  index function.
   * Based on the status in the function response, prepare the response and return to controller
   *
  */
  const invoiceTaxes = await indexRepository.find('invoice_taxes', ['id', 'name', 'type', 'value'], condition);
  if (invoiceTaxes.status) {
    /* variables */
    const responseData = [];
    const totalDetails = invoiceTaxes.data;
    /* variables */

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        id: item.id,
        name: item.name,
        type: item.type,
        value: item.value,
      };
      responseData.push(listingObject);
    }

    return { status: true, data: responseData[0] };
  } else {
    return invoiceTaxes;
  }
};

/**
 * Destroy function to mark an existing invoice tax as deleted.
 * 
 * Logic:
 * - Create a 'updateData' object with properties to mark the invoice tax as deleted.
 * - Call the update method from the repository to update the 'invoice_taxes' table entry based on the provided condition.
 * - Create an 'activity' object to track the deletion of the invoice tax.
 * - Emit an event to log the deletion activity.
 * - Return the response from the repository.
 *        
 * @param {Object} body - The request body containing user details for the update.
 * @param {Object} condition - The condition to identify the invoice tax to be marked as deleted.
 * @returns {Object} Repository response.
 */
const destroy = async (body, condition) => {

  /* Creating delete entry object */
  const updateData = {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by,
  };
  /* Creating delete entry object */

  /* calling update method from Repository to update a new entry */
  const repositoryResponse = await indexRepository.update('invoice_taxes', condition, updateData);

  const activity = {
    referrable_id: repositoryResponse.data[0].id,
    referrable_type: 10,
    action_type: 3,
    created_by: body.created_by,
  };
  event.emit('configurationDeleteActivity', activity);
  return repositoryResponse;
};

/**
 * get Taxes Function to get taxes data.
 
 * Logic:
 * - Fetch the data from the 'invoice_taxes' table using condition(param) by calling common find function.
 *  - If data exists,
 *    + Prepare the response 
 *    + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {*} condition
 * @return {*} 
 */
const getTaxes = async (condition) => {

  const fields = ['invoice_taxes.*'];
  // getting taxes details
  const taxesData = await indexRepository.find('invoice_taxes', fields, condition);

  /* Creating the object */
  const responseData = {
    'Name': taxesData.data[0].name,
    'Type': taxesData.data[0].type,
    'Value': taxesData.data[0].value,
  };
  /* Creating the object */

  return responseData
}

module.exports = { destroy, index, listing, store, update, updateEnableTaxInvoice };
