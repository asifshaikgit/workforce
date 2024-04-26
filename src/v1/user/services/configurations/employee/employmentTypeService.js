const moment = require('moment');
const indexRepository = require('../../../repositories/index');
const format = require('../../../../../../helpers/format');

/**
 * Listing Function to get employment type data.
 * Logic:
 * - Fetch the data from the 'employment_types' table using condition(param) by calling common findByPagination function.
 *  - If data exists,
 *    + loop the data and push the object in to an array and add serial number to the object 
 *    + Prepare the response 
 *    - Fetch the data from the 'configuration_activity_track table using common find function.
 *    - looping the activity data and push it in to an array and returning in response
 *    + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {Object} condition - The conditions to filter the employment titles.
 * @param {number} page - The page number of the listing.
 * @param {number} limit - The maximum number of employment titles per page.
 * @param {string} sortColumn - The column to sort the employment titles by.
 * @param {string} sortOrder - The order to sort the employment titles in (ascending or descending).
 * @returns {Object} An object containing the status, data, activity, and pagination_data.
 * - status: A boolean indicating if the operation was successful.
 * - data: An array of employment title objects containing the
 */
const listing = async (condition, page, limit, sortColumn, sortOrder) => {
  /* Default variables */
  const tableName = 'employment_types';
  const fields = ['employment_types.*', 'create.display_name as create_emp', 'update.display_name as updated_emp'];
  const joins = [
    { table: 'employee as create', alias: 'create', condition: ['employment_types.created_by', 'create.id'], type: 'left', ignoreDeletedAt: true },
    { table: 'employee as update', alias: 'update', condition: ['employment_types.updated_by', 'update.id'], type: 'left', ignoreDeletedAt: true },
  ];
  /* Default variables */
  const employmentTitle = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit, sortColumn, sortOrder);
  if (employmentTitle.status === true) {
    /* variables */
    const responseData = [];
    const totalDetails = employmentTitle.data;
    const paginationDetails = employmentTitle.pagination;
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
        is_active: item.is_active,
        created_by: (item.create_emp !== null ? item.create_emp : 'System'),
        updated_by: (item.updated_emp !== null ? item.updated_emp : ''),
      };
      serialNo++;
      responseData.push(listingObject);
    }
    /* prepare the response */

    return {
      status: true, data: responseData, pagination_data: paginationDetails,
    };
  } else {
    return employmentTitle;
  }
};

module.exports = { listing };
