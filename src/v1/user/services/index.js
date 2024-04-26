const indexRepository = require('../repositories/index');

/**
 * Counts the number of records in a given table based on a specified condition.
 * @param {string} tableName - The name of the table to count records from.
 * @param {object} condition - The condition to filter the records.
 * @returns {Promise<number>} - A promise that resolves to the number of records that match the condition.
 */
const count = async (tableName, condition, joins = [], deletedAt = true) => {
  // Retrieves the count of records from the specified table in the index repository
  const repositoryResponse = await indexRepository.count(tableName, condition, joins = [], deletedAt);
  return repositoryResponse;
};

/**
 * Marks a record in the specified table as deleted by updating the 'deleted_at' field.
 * @param {string} tableName - The name of the table to update.
 * @param {object} condition - The condition to match the record(s) to be updated.
 * @param {object} body - The request body containing the 'updated_by' field.
 * @returns {Promise<object>} - A promise that resolves to the repository response.
 */
const destroy = async (tableName, condition, body) => {
  /* creates an object to mark the record as deleted */
  const updateData = {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by,
  };
  /* creates an object to mark the record as deleted */

  /* calling update method from index respository to update the record */
  const repositoryResponse = await indexRepository.update(tableName, condition, updateData);
  return repositoryResponse;
};

/**
 * Finds records in a database table based on the specified parameters.
 * @param {string} table_name - The name of the table to search in.
 * @param {string[]} fields - An array of field names to retrieve from the table.
 * @param {object | null} [filters=null] - Optional filters to apply to the search.
 * @param {number} [limit=25] - The maximum number of records to retrieve.
 * @param {number} [startIndex=0] - The index of the first record to retrieve.
 * @param {string | null} [sortColumn=null] - The column to sort the results by.
 * @param {string | null} [sortOrder=null] - The
 */
const find = async (tableName, fields, filters = null, limit = 25, joins = [], startIndex = 0, sortColumn = null, sortOrder = null, deletedAt = true) => {
  // Retrieves data from the index repository based on the provided parameters.
  const repositoryResponse = await indexRepository.find(tableName, fields, filters, limit, joins, startIndex, sortColumn, sortOrder, deletedAt);
  return repositoryResponse;
};

module.exports = { count, destroy, find };
