const { responseMessages } = require('../../../../constants/responseMessage');
const { cleanUpObject } = require('../../../../helpers/globalHelper');

/**
 * Function for applying filters to a SQL query.
 * 
 * Overview:
 *   - This function is designed to dynamically apply various filters to a SQL query based on the provided filters object.
 *   - It constructs WHERE clauses in the query for different filter conditions.
 *   - Supported filter conditions include search, greater than or equal (gte), less than or equal (lte), date between, date equal, date less than or equal, date greater than or equal, date less than, date greater than, global search, and array-based filters.
 * 
 * Logic:
 *   - Iterate through each key in the filters object.
 *   - Check if the filter value is defined and not empty.
 *   - Depending on the filter type (e.g., 'search', 'gte', 'lte', 'date_between', 'date_equal', etc.), construct the corresponding WHERE clause in the query.
 *   - For example, for a 'search' filter, a case-insensitive pattern match is applied on a specific column.
 *   - For date-related filters (e.g., 'date_between', 'date_equal', etc.), raw SQL WHERE clauses are constructed to match date conditions.
 *   - For global search, a raw SQL WHERE clause is applied.
 *   - For array-based filters, such as 'invoice_employee_ids', the query applies the 'whereIn' condition.
 *   - If none of the conditions match, a basic equality WHERE clause is applied based on the filter key.
 * 
 * @param {object} query - The SQL query object to which filters are applied.
 * @param {string} tableName - The name of the table being queried.
 * @param {object} filters - An object containing various filter conditions to apply to the query.
 * @returns {object} - The modified SQL query with the applied filters.
 */
const applyFilters = (query, tableName, filters) => {
  for (const key in filters) {
    // Checks if a filter value is defined and not empty.
    if (filters[key] !== undefined && filters[key] !== '') {
      if (key === 'search') {
        // Constructs a WHERE clause for a SQL query that performs a case-insensitive pattern match on a column value.
        query.where(`${tableName}.name`, 'ilike', `%${filters[key]}%`);
      } else if (key === 'gte') {
        for (const item in filters[key]) {
          query.where(item, '>=', filters[key][item]);
        }
      } else if (key === 'lte') {
        for (const item in filters[key]) {
          query.where(item, '<=', filters[key][item]);
        }
      }
      // where condition on between dates
      else if (key == 'date_between') {
        query.whereRaw(`(${filters[key][0].column} >= '${filters[key][0].date1}' and ${filters[key][0].column} <= '${filters[key][0].date2}')`);
      } else if (key == 'date_equal') {
        query.whereRaw(`(${filters[key][0].column} = '${filters[key][0].date1}')`);
      } else if (key == 'date_less_than_equal') {
        query.whereRaw(`(${filters[key][0].column} <= '${filters[key][0].date1}')`);
      } else if (key == 'date_greater_than_equal') {
        query.whereRaw(`(${filters[key][0].column} >= '${filters[key][0].date1}')`);
      } else if (key == 'date_less_than') {
        query.whereRaw(`(${filters[key][0].column} < '${filters[key][0].date1}')`);
      } else if (key == 'date_greater_than') {
        query.whereRaw(`(${filters[key][0].column} > '${filters[key][0].date1}')`);
      } else if (key == 'global_search') {
        query.whereRaw(`(${filters[key]})`);
      } else if (key == 'invoice_employee_ids') {
        query.where('invoices.employee_ids', '@>', [filters[key]]);
      } else if (Array.isArray(filters[key]) && filters[key].length > 0) {
        // checks if filters value is an array and applies whereIn condition
        query.whereIn(key, filters[key]);
      } else {
        query.where(key, filters[key]);
      }
    }
  }
  return query;
};

/**
 * Retrieves data from a database table based on provided filters and query options.
 * 
 * Overview:
 *   - This function retrieves data from a specified database table, applying filters, joins, sorting, and pagination as needed.
 *   - It supports various query options like filtering, joining, and pagination.
 * 
 * Logic:
 *   - Establishes a database connection using 'getConnection' and creates a model instance for the specified table.
 *   - Applies joins to the model if specified, based on the provided join conditions and join types.
 *   - Checks if 'deleted_at' property should be considered  and adds a 'where null' condition to exclude deleted records.
 *   - If filters are provided, applies them to the query by calling the 'applyFilters' function.
 *   - Retrieves the total count of distinct IDs from the table to support pagination.
 *   - Selects the specified fields to include in the query result.
 *   - Applies pagination by limiting the number of records (limit) and setting the starting index (startIndex).
 *   - Sorts the results based on the specified column and sorting order (ascending or descending).
 *   - Optionally groups results by a specified column (groupBy).
 *   - Executes the query and returns the results.
 *   - If data is exist: 
 *     + returns a success response with the data and total count.
 *   - Else:
 *     + returns a failure response with an appropriate message.
 * 
 * @param {string} tableName - The name of the database table to query.
 * @param {array} fields - The fields to select in the query result.
 * @param {object} filters - An object containing filter conditions for the query.
 * @param {number} limit - The maximum number of records to retrieve (pagination).
 * @param {array} joins - An array of join objects specifying join conditions and types.
 * @param {number} startIndex - The starting index for pagination.
 * @param {string} sortColumn - The column by which to sort the results.
 * @param {string} sortOrder - The sorting order (asc or desc).
 * @param {boolean} deletedAt - Whether to consider soft-deleted records (default: true).
 * @param {string} groupBy - The column by which to group the results (optional).
 * @returns {object} - A response object with status, data, and total count (if applicable).
 */
const find = async (db, tableName, fields, filters = null, limit = 25, joins = [], startIndex = 0, sortColumn = null, sortOrder = "desc", deletedAt = true, groupBy = null) => {
  /**
   * Creates a new instance of a model for the specified table name.
   */
  const model = db(tableName);

  // Checks if the length of the 'joins' array is greater than 0.
  if (joins.length > 0) {
    // Iterates over the joins object and performs the specified join operation on the model.
    for (const key in joins) {
      // Retrieves the table associated with the given key from the 'joins' object.
      const joinTable = joins[key].table;
      // Retrieves the condition for a specific join key from the joins object.
      const joinCondition = joins[key].condition;
      // Retrieves the type of join for a given key from the joins object
      const joinType = joins[key].type || 'inner'; // Default to inner join if not specified

      /**
       * Performs a join operation on the model using the specified join type, join table, and join condition.
       * @param {string} joinType - The type of join to perform (e.g. 'inner', 'left', 'right', 'full')
       * @param {string} joinTable - The name of the table to join with
       * @param {...any} joinCondition - The condition(s) to use for the join operation
       * @returns The result of the join operation
       */
      model[joinType + 'Join'](joinTable, ...joinCondition);
    }
  }
  // Checks if the `deleted_at` property exists and evaluates to a truthy value.
  if (deletedAt) {
    // Adds a 'where null' condition to the model query, checking if the 'deletedAt' is null.
    model.whereNull(`${tableName}.deleted_at`);
    // Checks if the length of the 'joins' array is greater than 0.
    if (joins.length > 0) {
      // Iterates over the joins object and performs the specified join operation on the model.
      for (const key in joins) {
        // Retrieves the table associated with the given key from the 'joins' object.
        const ignoreDelete = joins[key].ignoreDeletedAt;
        if (!ignoreDelete) {
          // Retrieves the alias name of table associated with the given key from the 'joins' object.
          const joinAlias = joins[key].alias || joins[key].table;

          // Adds a 'where null' condition to the model query, checking if the 'deletedAt' is null.
          model.whereNull(`${joinAlias}.deleted_at`);
        }
      }
    }
  }
  model.modify((query) => {
    // Checks if the filters variable is not null.
    if (filters !== null) {
      // Apply filters to a database query.
      applyFilters(query, tableName, filters);
    }
  });

  // Retrieves the total count of distinct IDs from the specified table using the provided model.
  const totalCount = await model.clone().countDistinct(`${tableName}.id as count`);

  // Selects the specified fields from the model.
  model.select(fields);
  // Checks if the `limit` property exists and evaluates to a truthy value.
  if (limit) {
    model.limit(limit);
  }
  // Checks if the `startIndex` property exists and evaluates to a truthy value.
  if (startIndex) {
    model.offset(startIndex);
  }
  // Checks if both sortColumn and sortOrder variables are truthy.
  if (sortColumn && sortOrder) {
    if (sortOrder.toLowerCase() === 'raw') {
      model.orderByRaw(`${sortColumn}`);
    } else {
      const order = sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';
      model.orderBy(`${sortColumn}`, order);
    }
  } else {
    // Default sorting by created_at in descending order
    model.orderBy(`${tableName}.created_at`, 'desc');
  }

  if (groupBy) {
    model.groupBy(groupBy);
  }

  const response = await model;

  if (response.length > 0) {
    return { status: true, data: response, totalCount: totalCount[0].count };
  } else {
    return { status: false, data: [], message: responseMessages.common.noRecordFound, error: '' };
  }
};

/**
 * Retrieves distinct data from a database table based on provided filters and query options.
 * 
 * Overview:
 *   - This function retrieves distinct data from a specified database table, applying filters, joins, sorting, and pagination as needed.
 *   - It supports various query options like filtering, joining, and pagination.
 * 
 * Logic:
 *   - Establishes a database connection using 'getConnection' and creates a model instance for the specified table.
 *   - Applies joins to the model if specified, based on the provided join conditions and join types.
 *   - Checks if 'deleted_at' property should be considered  and adds a 'where null' condition to exclude deleted records.
 *   - If filters are provided, applies them to the query by calling the 'applyFilters' function.
 *   - Retrieves the total count of distinct IDs from the table to support pagination.
 *   - Selects distinct specified fields to include in the query result.
 *   - Applies pagination by limiting the number of records (limit) and setting the starting index (startIndex).
 *   - Sorts the results based on the specified column and sorting order (ascending or descending).
 *   - Executes the query and returns the results.
 *   - If data is found:
 *     + returns a success response with the distinct data and total count.
 *   - Else:
 *     + returns a failure response with an appropriate message.
 * 
 * @param {string} tableName - The name of the database table to query.
 * @param {array} fields - The fields to select in the query result (distinct).
 * @param {object} filters - An object containing filter conditions for the query.
 * @param {number} limit - The maximum number of records to retrieve (pagination).
 * @param {array} joins - An array of join objects specifying join conditions and types.
 * @param {number} startIndex - The starting index for pagination.
 * @param {string} sortColumn - The column by which to sort the results.
 * @param {string} sortOrder - The sorting order (asc or desc).
 * @param {boolean} deletedAt - Whether to consider soft-deleted records (default: true).
 * @returns {object} - A response object with status, distinct data, and total count (if applicable).
 */
const findDistinct = async (db, tableName, fields, filters = null, limit = 25, joins = [], startIndex = 0, sortColumn = null, sortOrder = null, deletedAt = true) => {
  /**
   * Creates a new instance of a model for the specified table name.
   */
  const model = db(tableName);

  // Checks if the length of the 'joins' array is greater than 0.
  if (joins.length > 0) {
    // Iterates over the joins object and performs the specified join operation on the model.
    for (const key in joins) {
      // Retrieves the table associated with the given key from the 'joins' object.
      const joinTable = joins[key].table;
      // Retrieves the condition for a specific join key from the joins object.
      const joinCondition = joins[key].condition;
      // Retrieves the type of join for a given key from the joins object
      const joinType = joins[key].type || 'inner'; // Default to inner join if not specified

      /**
       * Performs a join operation on the model using the specified join type, join table, and join condition.
       * @param {string} joinType - The type of join to perform (e.g. 'inner', 'left', 'right', 'full')
       * @param {string} joinTable - The name of the table to join with
       * @param {...any} joinCondition - The condition(s) to use for the join operation
       * @returns The result of the join operation
       */
      model[joinType + 'Join'](joinTable, ...joinCondition);
    }
  }
  // Checks if the `deleted_at` property exists and evaluates to a truthy value.
  if (deletedAt) {
    // Adds a 'where null' condition to the model query, checking if the 'deletedAt' is null.
    model.whereNull(`${tableName}.deleted_at`);
    // Checks if the length of the 'joins' array is greater than 0.
    if (joins.length > 0) {
      // Iterates over the joins object and performs the specified join operation on the model.
      for (const key in joins) {
        // Retrieves the table associated with the given key from the 'joins' object.
        const ignoreDelete = joins[key].ignoreDeletedAt;
        if (!ignoreDelete) {
          // Retrieves the alias name of table associated with the given key from the 'joins' object.
          const joinAlias = joins[key].alias || joins[key].table;

          // Adds a 'where null' condition to the model query, checking if the 'deletedAt' is null.
          model.whereNull(`${joinAlias}.deleted_at`);
        }
      }
    }
  }
  model.modify((query) => {
    // Checks if the filters variable is not null.
    if (filters !== null) {
      // Apply filters to a database query.
      applyFilters(query, tableName, filters);
    }
  });

  // Retrieves the total count of distinct IDs from the specified table using the provided model.
  const totalCount = await model.clone().countDistinct(`${tableName}.id as count`);

  // Selects the specified fields from the model.
  model.distinct(fields);
  // Checks if the `limit` property exists and evaluates to a truthy value.
  if (limit) {
    model.limit(limit);
  }
  // Checks if the `startIndex` property exists and evaluates to a truthy value.
  if (startIndex) {
    model.offset(startIndex);
  }
  // Checks if both sortColumn and sortOrder variables are truthy.
  if (sortColumn && sortOrder) {
    const order = sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';
    model.orderBy(`${sortColumn}`, order);
  } else {
    // Default sorting by created_at in descending order
    model.orderBy(`${tableName}.created_at`, 'desc');
  }

  const response = await model;

  if (response.length > 0) {
    return { status: true, data: response, totalCount: totalCount[0].count };
  } else {
    return { status: false, data: [], message: responseMessages.common.noRecordFound, error: '' };
  }
};

/**
 * Retrieves raw data from a database table based on provided filters and query options.
 * 
 * Overview:
 *   - This function retrieves raw data from a specified database table, applying filters, joins, sorting, and pagination as needed.
 *   - It supports various query options like filtering, joining, and pagination.
 * 
 * Logic:
 *   - Establishes a database connection using 'getConnection' and creates a model instance for the specified table.
 *   - Applies joins to the model if specified, based on the provided join conditions and join types.
 *   - Checks if 'deleted_at' property should be considered  and adds a 'where null' condition to exclude deleted records.
 *   - If filters are provided, applies them to the query by calling the 'applyFilters' function.
 *   - Retrieves the total count of distinct IDs from the table to support pagination.
 *   - Selects the specified raw fields from the model.
 *   - Applies pagination by limiting the number of records (limit) and setting the starting index (startIndex).
 *   - Sorts the results based on the specified column and sorting order (ascending or descending).
 *   - Optionally groups results by a specified column (groupBy).
 *   - Executes the query and returns the results.
 *   - If raw data is found:
 *     + returns a success response with the raw data and total count.
 *   - Else:
 *     + returns a failure response with an appropriate message.
 * 
 * @param {string} tableName - The name of the database table to query.
 * @param {array} fields - The raw fields to select in the query result.
 * @param {object} filters - An object containing filter conditions for the query.
 * @param {number} limit - The maximum number of records to retrieve (pagination).
 * @param {array} joins - An array of join objects specifying join conditions and types.
 * @param {number} startIndex - The starting index for pagination.
 * @param {string} sortColumn - The column by which to sort the results.
 * @param {string} sortOrder - The sorting order (asc or desc).
 * @param {boolean} deletedAt - Whether to consider soft-deleted records (default: true).
 * @param {string} groupBy - The column by which to group the results (optional).
 * @returns {object} - A response object with status, raw data, and total count (if applicable).
 */
const findRaw = async (db, tableName, fields, filters = null, limit = 25, joins = [], startIndex = 0, sortColumn = null, sortOrder = null, deletedAt = true, groupBy = null) => {
  /**
   * Creates a new instance of a model for the specified table name.
   */
  const model = db(tableName);

  // Checks if the length of the 'joins' array is greater than 0.
  if (joins.length > 0) {
    // Iterates over the joins object and performs the specified join operation on the model.
    for (const key in joins) {
      // Retrieves the table associated with the given key from the 'joins' object.
      const joinTable = joins[key].table;
      // Retrieves the condition for a specific join key from the joins object.
      const joinCondition = joins[key].condition;
      // Retrieves the type of join for a given key from the joins object
      const joinType = joins[key].type || 'inner'; // Default to inner join if not specified

      /**
       * Performs a join operation on the model using the specified join type, join table, and join condition.
       * @param {string} joinType - The type of join to perform (e.g. 'inner', 'left', 'right', 'full')
       * @param {string} joinTable - The name of the table to join with
       * @param {...any} joinCondition - The condition(s) to use for the join operation
       * @returns The result of the join operation
       */
      model[joinType + 'Join'](joinTable, ...joinCondition);
    }
  }
  // Checks if the `deleted_at` property exists and evaluates to a truthy value.
  if (deletedAt) {
    // Adds a 'where null' condition to the model query, checking if the 'deletedAt' is null.
    model.whereNull(`${tableName}.deleted_at`);
    // Checks if the length of the 'joins' array is greater than 0.
    if (joins.length > 0) {
      // Iterates over the joins object and performs the specified join operation on the model.
      for (const key in joins) {
        // Retrieves the table associated with the given key from the 'joins' object.
        const ignoreDelete = joins[key].ignoreDeletedAt;
        if (!ignoreDelete) {
          // Retrieves the alias name of table associated with the given key from the 'joins' object.
          const joinAlias = joins[key].alias || joins[key].table;

          // Adds a 'where null' condition to the model query, checking if the 'deletedAt' is null.
          model.whereNull(`${joinAlias}.deleted_at`);
        }
      }
    }
  }
  model.modify((query) => {
    // Checks if the filters variable is not null.
    if (filters !== null) {
      // Apply filters to a database query.
      applyFilters(query, tableName, filters);
    }
  });

  // Retrieves the total count of distinct IDs from the specified table using the provided model.
  const totalCount = await model.clone().countDistinct(`${tableName}.id as count`);

  // Selects the specified fields from the model.
  model.select(db.raw(fields));
  // Checks if the `limit` property exists and evaluates to a truthy value.
  if (limit) {
    model.limit(limit);
  }
  // Checks if the `startIndex` property exists and evaluates to a truthy value.
  if (startIndex) {
    model.offset(startIndex);
  }
  // Checks if both sortColumn and sortOrder variables are truthy.
  if (sortColumn && sortOrder) {
    const order = sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';
    model.orderBy(`${sortColumn}`, order);
  } else {
    // Default sorting by created_at in descending order
    model.orderBy(`${tableName}.created_at`, 'desc');
  }

  if (groupBy) {
    model.groupBy(groupBy);
  }

  const response = await model;

  if (response.length > 0) {
    return { status: true, data: response, totalCount: totalCount[0].count };
  } else {
    return { status: false, data: [], message: responseMessages.common.noRecordFound, error: '' };
  }
};

/**
 * Stores a new record in a database table with the provided data using a provided database connection.
 * 
 * Overview:
 *   - This function inserts a new record into the specified database table using the provided data and a given database connection.
 *   - It allows excluding specific keys (e.g., sensitive information) from the data before insertion.
 * 
 * Logic:
 *   - Accepts a database connection object 'db', the name of the database table 'tableName', the data 'createData', and an optional array of excluded keys 'excludedKeys'.
 *   - Cleans up the provided data by removing excluded keys using the 'cleanUpObject' function.
 *   - Inserts the cleaned-up data into the specified database table using the provided database connection.
 *   - If the insertion is successful:
 *     + Returns a success response with the inserted record's ID.
 *   - Else:
 *     + Returns a failure response with an appropriate error message.
 * 
 * @param {object} db - The database connection object to use for the insertion.
 * @param {string} tableName - The name of the database table to insert the record into.
 * @param {object} createData - The data to be inserted as a new record.
 * @param {array} excludedKeys - An array of keys to exclude from the data before insertion (optional).
 * @returns {object} - A response object with status, inserted data, or an error message.
 */
const store = async (db, tableName, createData, excludedKeys = []) => {
  
  let createObject = await cleanUpObject(createData, excludedKeys);

  // Inserts a new record into the specified database table with the provided data.
  const createResponse = await db(tableName).insert(createObject, 'id');

  if (createResponse) {
    return { status: true, data: createResponse };
  } else {
    return { status: false, message: responseMessages.common.failedToUpdate, error: '' };
  }
};

/**
 * Updates a record in a database table with the provided update data using a provided database connection.
 * 
 * Overview:
 *   - This function updates a record in the specified database table using the provided update data, a given database connection, and a condition.
 *   - It allows excluding specific keys (e.g., sensitive information) from the update data.
 * 
 * Logic:
 *   - Accepts a database connection object 'db', the name of the database table 'tableName', a condition to identify the record to update 'condition', the update data 'updateData', and optional parameters such as 'tenantId' and 'excludedKeys'.
 *   - Cleans up the provided update data by removing excluded keys using the 'cleanUpObject' function.
 *   - Updates the record in the specified database table using the provided database connection and condition.
 *   - If the update is successful:
 *     + it returns a success response with the updated record.
 *   - Else:
 *     + it returns a failure response with an appropriate error message.
 * 
 * @param {object} db - The database connection object to use for the update.
 * @param {string} tableName - The name of the database table to update the record in.
 * @param {object} condition - The condition to identify the record to update.
 * @param {object} updateData - The data to be updated in the record.
 * @param {string} tenantId - An optional parameter for tenant-specific updates (default: null).
 * @param {array} excludedKeys - An array of keys to exclude from the update data (optional).
 * @returns {object} - A response object with status, updated data, or an error message.
 */
const update = async (db, tableName, condition, updateData, tenantId = null, excludedKeys = []) => {

  let updateObject = await cleanUpObject(updateData, excludedKeys);

  // Updates a record in the specified database table with the given update data and returns the updated record.
  const updateResponse = await db(tableName)
    .where(condition)
    .update(updateObject)
    .returning('*');

  if (updateResponse) {
    return { status: true, data: updateResponse };
  } else {
    return { status: false, message: responseMessages.common.failedToUpdate, error: '' };
  }
};

/**
 * Deletes records from a database table based on provided filters using a provided database connection.
 * 
 * Overview:
 *   - This function deletes records from a specified database table based on provided filters using a provided database connection.
 *   - It accepts a database connection object 'db', the name of the database table 'table_name', and optional filter conditions 'filters'.
 * 
 * Logic:
 *   - Accepts a database connection object 'db', the name of the database table 'table_name', and optional filter conditions 'filters'.
 *   - Modifies the query by applying the provided filters using the 'applyFilters' function.
 *   - Deletes the records from the specified database table using the provided database connection and filter conditions.
 *   - The function does not return data but ensures that records matching the filter conditions are deleted from the table.
 * 
 * @param {object} db - The database connection object to use for the delete operation.
 * @param {string} table_name - The name of the database table to delete records from.
 * @param {object} filters - An object containing filter conditions for the delete operation (optional).
 */
const destroy = async (db, table_name, filters = null) => {
  
  let entryDeleted = db(`${table_name}`)
  .modify((query) => applyFilters(query, table_name, filters))
  .del();
  await entryDeleted;
}

module.exports = { find, findDistinct, findRaw, store, update, destroy};
