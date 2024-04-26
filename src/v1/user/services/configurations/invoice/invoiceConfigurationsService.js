const { event } = require('../../../../../../events/configurationActivityEvent');
const indexRepository = require('../../../repositories/index');
const transactionRepository = require('../../../repositories/transactionRepository');

/**
 * Store function to create a new entity.
 * 
 * Logic:
 * - Create a 'newInvoiceSetting' object with properties from the request body.
 * - Check if the 'db' parameter is null:
 *   ~ call common store function and store the 'newInvoiceSetting' object into 'invoice_configurations' table
 *  - Otherwise (if 'db' is not null):
 *   ~ call 'transactionRepository.store'  function to store the 'newInvoiceSetting' object into 'invoice_configurations' table
 * - Return the response from the repository.
 *        
 * @param {Object} body - The request body containing entity details.
 * @param {Object|null} db - (Optional) A database connection object for transactional operations. Pass 'null' for non-transactional operations.
 * @returns {Object} Repository response.
 */
const store = async (body, db = null) => {
  /* Creating new object */
  const newInvoiceSetting = {
    cycle_id: body.cycle_id,
    net_pay_terms_id: body.net_pay_terms_id,
    day_start_id: body.day_start_id !== '' ? body.day_start_id : null,
    is_global: body.is_global,
    created_by: body.created_by,
    created_at: new Date(),
  };
  /* Creating new object */
  let repositoryResponse
  if (db == null) {
    repositoryResponse = await indexRepository.store('invoice_configurations', newInvoiceSetting);
  } else {
    repositoryResponse = await transactionRepository.store(db, 'invoice_configurations', newInvoiceSetting);
  }

  /**activity track */
  const activity = {
    referrable_id: repositoryResponse.data[0].id,
    referrable_type: 12,
    action_type: 1,
    created_by: body.created_by,
  };
  event.emit('configurationStoreActivity', {activity});
  /**activity track */

  return repositoryResponse;
};

/**
 * Update function to modify an existing entity.
 * 
 * Logic:
 * - Create an 'updateEntity' object with properties from the request body.
 * - Check if the 'db' parameter is null:
 *   ~ Call the common update repository function to update the entity with the 'updateEntity' object in the 'invoice_configurations' table.
 * - Otherwise (if 'db' is not null):
 *   ~ Call the 'transactionRepository.update' function to update the entity with the 'updateEntity' object in the 'invoice_configurations' table.
 * - Return the response from the repository.
 *        
 * @param {Object} body - The request body containing updated entity details.
 * @param {Object|null} db - (Optional) A database connection object for transactional operations. Pass 'null' for non-transactional operations.
 * @param {Object} condition - The conditions to specify which entity to update.
 * @returns {Object} Repository response.
 */
const update = async (body, db = null, condition) => {

  /* Creating update entry object */
  const updateinvoiceSetting = {
    cycle_id: body.cycle_id,
    net_pay_terms_id: body.net_pay_terms_id,
    day_start_id: body.day_start_id !== '' ? body.day_start_id : null,
    is_global: body.is_global,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /* Default Variables */
  let repositoryResponse = [];
  /* Default Variables */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
  */
  const beforeUpdateData = await getInvoiceConfiguration({ 'invoice_configurations.id': condition.id });

  if (db == null) {
    repositoryResponse = await indexRepository.update('invoice_configurations', condition, updateinvoiceSetting);

    const afterUpdateData = await getInvoiceConfiguration({ 'invoice_configurations.id': condition.id });

    const activity = {
      referrable_id: condition.id,
      referrable_type: 12,
      action_type: 2,
      created_by: body.created_by,
    };
    event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });

  } else {
    repositoryResponse = await transactionRepository.update(db, 'invoice_configurations', condition, updateinvoiceSetting);
  }

  return repositoryResponse;
};


/**
 * get Invoice Configuration Function to get invoice configuration data.
 
 * Logic:
 * - Fetch the data from the 'invoice_configurations' table using condition(param) by calling common find function.
 *  - If data exists,
 *    + Prepare the response 
 *    + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {*} condition
 * @return {*} 
 */
const getInvoiceConfiguration = async (condition) => {

  const fields = ['invoice_configurations.*', 'net_pay_terms.days as net_pay_days', 'days.name as day', 'cycles.name as cycle'];

  const joins = [
    { table: 'net_pay_terms', condition: ['invoice_configurations.net_pay_terms_id', 'net_pay_terms.id'], type: 'inner' },
    { table: 'days', condition: ['invoice_configurations.day_start_id', 'days.id'], type: 'left' },
    { table: 'cycles', condition: ['invoice_configurations.cycle_id', 'cycles.id'], type: 'inner' }
  ];
  // getting invoice configuration details
  const invConfigData = await indexRepository.find('invoice_configurations', fields, condition, null, joins);

  /* Creating the object */
  const responseData = {
    'Net Pay Terms': invConfigData.data[0].net_pay_days,
    'Start Day': invConfigData.data[0].day,
    'Cycle': invConfigData.data[0].cycle,
    "Is Global" : invConfigData.data[0].is_global
  };
  /* Creating the object */

  return responseData
}

/**
 * Index function to retrieve entity details based on specified conditions.
 * 
 * Logic:
 * - Call the common repository function to fetch entity data from the specified table based on the provided condition.
 * - If data exists:
 *   + Create an empty 'responseData' array.
 *   + Map the repository response data to 'totalDetails'.
 *   + Iterate over the 'totalDetails' and create a 'listingObject' object with response data.
 *   + Push the 'listingObject' objects into the 'responseData' array.
 *   + Return a response object with status true and 'responseData'.
 * - Else:
 *   + Return the repository response 'invoiceConfigurations'.
 *    
 * @param {Object} condition - The conditions to filter entity details.
 * @returns {Object} Response with entity details.
 */
const index = async (condition) => {
  /**
   * Calling a  index function.
   * Based on the status in the function response, prepare the response and return to controller
   *
  */
  const invoiceConfigurations = await indexRepository.find('invoice_configurations', ['id', 'net_pay_terms_id', 'cycle_id', 'day_start_id', 'is_global'], condition);
  if (invoiceConfigurations.status) {
    /* variables */
    const responseData = [];
    const totalDetails = invoiceConfigurations.data;
    /* variables */

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        id: item.id,
        net_pay_terms_id: item.net_pay_terms_id,
        cycle_id: item.cycle_id,
        day_start_id: item.day_start_id ? item.day_start_id : '',
        is_global: item.is_global,
      };
      responseData.push(listingObject);
    }

    return { status: true, data: responseData };
  } else {
    return invoiceConfigurations;
  }
};

module.exports = { index, store, update };
