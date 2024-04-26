const indexRepository = require('../../repositories/index');
const { event } = require('../../../../../events/configurationActivityEvent');
const { getConnection } = require('../../../../middlewares/connectionManager');

/**
 * update Function to update prefix data.
 * 
 * Logic:
 * - Loop the prefixes from body sent in params.
 * - Prepare prefix data object and condition for every loop.
 * - update the prefix data into 'prefixes' table from the condition in defined above. 
 * - Return the result of the prefix data update.
 *
 * @param {object} body - The data to update the prefixes with.
 * @returns {Promise<Array>} - A promise that resolves to an array of repository responses.
 */
const update = async (body) => {
  /* Writing condition to the update entry */
  let repositoryResponse = [];
  /* Writing condition to the update entry */

  let beforeUpdateData = [];
  let afterUpdateData = [];

  /* Creating update entry object */
  for (const key in body.prefixes) {
    const item = body.prefixes[key];
    const condition = { id: item.id };

    /**Fetching prefix details before update */
    const prefixData = await getPrefixData(condition)
    beforeUpdateData.push(prefixData);
    /**Fetching prefix details before update */

    const updateData = {
      prefix_name: item.prefix_name,
      separator: item.separator,
      number: item.number,
      updated_by: body.updated_by,
      updated_at: new Date(),
    };
    repositoryResponse = await indexRepository.update('prefixes', condition, updateData);

    // Fetch prefix details after update for the current item
    const prefixAfterUpdate = await getPrefixData(condition);
    afterUpdateData.push(prefixAfterUpdate);

    /**Activity track */
    const activity = {
      referrable_id: condition.id,
      referrable_type: 24,
      action_type: 2,
      created_by: body.created_by,
    };
    event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
    /**Activity track */
  }
  /* Creating update entry object */

  return repositoryResponse;
};

/**
 * Retrieve  Prefix data based on specified conditions.
 * 
 * Logic:
 * - Use the repository function to fetch  Prefix data from the 'prefixes' table based on the provided condition.
 * - Create a 'responseData' object with key-value pairs to represent the Prefix details.
 * - Return 'responseData'.
 *    
 * @param {Object} condition - The conditions to filter Payment Modes.
 * @returns {Object} Response with Prefix details.
 */
const getPrefixData = async (condition) => {
  const prefixData = await indexRepository.find('prefixes', ['*'], condition);
  const responseData = {
    'Name': prefixData.data[0].name ? prefixData.data[0].name : '',
    'Slug': prefixData.data[0].slug ? prefixData.data[0].slug : '',
    'Prefix Name': prefixData.data[0].prefix_name ? prefixData.data[0].prefix_name : '',
    'Separator': prefixData.data[0].separator ? prefixData.data[0].separator : '',
    'Number': prefixData.data[0].number ? prefixData.data[0].number : '',
    'Description': prefixData.data[0].description ? prefixData.data[0].description : ''
  };
  return responseData
};

/**
 * getPrefix Function to get prefix data.
 * 
 * Logic:
 * - Fetch the data from the 'prefixes' table using condition(param) by calling common find function.
 *  - Use switch function to get the data depending on the slug from the condition(params)
 *   + return the response with status as true
 * 
 * @param {any} condition - The condition to determine the prefix.
 * @returns {Promise<{ status: boolean, data: string }>} - A promise that resolves to an object containing the status and reference ID.
 */
const getPrefix = async (condition) => {
  let referenceId;
  let table;
  let filter;
  switch (condition.slug) {
    case 'employee':
      table = 'employee';
      filter = { employment_type_id: [1] };
      break;

    case 'consultant-contractor':
      table = 'employee';
      filter = { employment_type_id: [2, 3] };
      break;

    case 'client':
      table = 'companies';
      filter = { entity_type: 'client' };
      break;

    case 'end-client':
      table = 'companies';
      filter = { entity_type: 'end-client' };
      break;

    case 'vendor':
      table = 'companies';
      filter = { entity_type: 'vendor' };
      break;

    case 'expense':
      table = 'expense_management';
      filter = {};
      break;

    case 'employee-self-service':
      table = 'employee_self_services';
      filter = {};
      break;

    case 'payment':
      table = 'payment_modes';
      filter = {};
      break;

    case 'timesheet':
      table = 'timesheets';
      filter = {};
      break;

    case 'invoice':
      table = 'ledgers';
      filter = { entity_type: condition.slug };
      break;

    case 'placement':
      table = 'placements';
      filter = {};
      break;

    case 'bill':
      table = 'ledgers';
      filter = { entity_type: condition.slug };
      break;

    default:
      referenceId = false;
      break;
  }

  if (!referenceId) {
    referenceId = await generateUniqueReferenceId(table, condition.slug, filter);
    return { status: true, data: referenceId };
  } else {
    return { status: false, data: referenceId };
  }

};

/**
 * Function to generate unique referece_id for a specific table.
 * 
 * Logic:
 * -  Establish DB connection.
 * -  Get count of records in table.
 * -  Get prefixes related to the table.
 * -  Generate refernce_id with combination as prefix_name + separator + (count + prefix_number)
 * -  Check whether if any refernce_id already exist is the respective table.
 *    ~ If exist increment by 1 to the count of records in table, continue to generate reference id till we get new reference id that not exist in respective table.
 *    ~ If generated refernce_id not exist in respective table return reference id.
 * 
 * @param {*} String
 * @returns {String}
 */
const generateUniqueReferenceId = async (tableName, prefixSlug, condition = {}) => {

  /* Establishing db connection with collection */
  let dbConnection = await getConnection();

  // Get count of records in the table
  let count = await indexRepository.count(tableName, condition);
  count = (count.length > 0) ? count[0]?.count : 0;

  let generateRefernceNumber = true;
  let reference_id;

  while (generateRefernceNumber) {
    // Get Prefix data from `prefixes` using prefixSlug.
    let prefix = await dbConnection('prefixes').select('name', 'prefix_name', 'separator', 'number').where({ 'slug': prefixSlug });
    reference_id = prefix[0]?.prefix_name + prefix[0]?.separator + (Number(count) + prefix[0]?.number);

    /* Checking the reference id already exists, if exists iterate the loop else stop the iteration */
    let referenceIdExistance = await dbConnection(tableName).select('id').where({ 'reference_id': reference_id });
    if (referenceIdExistance.length == 0) {
      generateRefernceNumber = false;
    } else {
      count++;
    }
  }

  return reference_id;
}

module.exports = { update, getPrefix };
