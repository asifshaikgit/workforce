const { responseMessages } = require('../../../../constants/responseMessage');
const { getConnection } = require('../../../middlewares/connectionManager');
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
const find = async (tableName, fields, filters = null, limit = 25, joins = [], startIndex = 0, sortColumn = null, sortOrder = "desc", deletedAt = true, groupBy = null) => {
  /**
   * Establishes a connection to the database and returns the connection object.
   * @returns {Promise<Connection>} A promise that resolves to the database connection object.
   */
  const db = await getConnection();

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
const findDistinct = async (tableName, fields, filters = null, limit = 25, joins = [], startIndex = 0, sortColumn = null, sortOrder = null, deletedAt = true) => {
  /**
   * Establishes a connection to the database and returns the connection object.
   * @returns {Promise<Connection>} A promise that resolves to the database connection object.
   */
  const db = await getConnection();

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
const findRaw = async (tableName, fields, filters = null, limit = 25, joins = [], startIndex = 0, sortColumn = null, sortOrder = null, deletedAt = true, groupBy = null) => {
  /**
   * Establishes a connection to the database and returns the connection object.
   * @returns {Promise<Connection>} A promise that resolves to the database connection object.
   */
  const db = await getConnection();

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
 * Retrieves paginated data from a database table based on provided filters and query options.
 * 
 * Overview:
 *   - This function retrieves paginated data from a specified database table, applying filters, joins, sorting, and pagination as needed.
 *   - It supports various query options like filtering, joining, and pagination.
 * 
 * Logic:
 *   - Calculates the start and end index for the requested page and limit.
 *   - Calls the 'find' function to retrieve data based on the provided parameters.
 *   - Retrieves the total count of records to calculate pagination information.
 *   - Adds pagination details to the retrieved data, including total records, current page, per page, and total pages.
 *   - Returns a response object with the status, paginated data, and pagination information.
 *   - If data is exists:
 *     + returns a success response with paginated data and pagination details.
 *   - Else:
 *     + returns a failure response with appropriate pagination details and an empty data array.
 * 
 * @param {string} tableName - The name of the database table to query.
 * @param {array} fields - The fields to select in the query result.
 * @param {object} filters - An object containing filter conditions for the query.
 * @param {array} joins - An array of join objects specifying join conditions and types.
 * @param {number} page - The current page to retrieve.
 * @param {number} limit - The maximum number of records to retrieve per page.
 * @param {string} sortColumn - The column by which to sort the results.
 * @param {string} sortOrder - The sorting order (asc or desc).
 * @param {boolean} deletedAt - Whether to consider soft-deleted records (default: true).
 * @param {string} groupBy - The column by which to group the results (optional).
 * @returns {object} - A response object with status, paginated data, and pagination information.
 */
const findByPagination = async (tableName, fields, filters = null, joins, page, limit = 25, sortColumn = null, sortOrder = null, deletedAt = true, groupBy = null) => {
  /* Calculations for start and end index */
  const startIndex = (page - 1) * limit;
  /* Calculations for start and end index */

  /* Find the data from the table */
  const findData = await find(tableName, fields, filters, limit, joins, startIndex, sortColumn, sortOrder, deletedAt, groupBy);

  const total = findData.totalCount ? findData.totalCount : 0;
  /* Find the data from the table */

  /* Adding pagination to the find data */
  const resultData = findData.data;
  const totalPages = Math.ceil(total / limit);
  /* Adding pagination to the find data */

  if (resultData.length > 0) {
    return {
      status: true,
      data: resultData,
      pagination: {
        total: Number(total),
        currentPage: parseInt(page),
        perPage: parseInt(limit),
        totalPages,
      },
    };
  } else {
    return {
      status: false,
      data: resultData,
      pagination: {
        total: 0,
        currentPage: parseInt(page),
        perPage: parseInt(limit),
        totalPages,
      }
    };
  }
};

/**
 * Stores a new record in a database table with the provided data.
 * 
 * Overview:
 *   - This function inserts a new record into the specified database table using the provided data.
 *   - It allows excluding specific keys (e.g., sensitive information) from the data before insertion.
 * 
 * Logic:
 *   - Establishes a database connection using 'getConnection' and assigns it to the 'db' variable.
 *   - Cleans up the provided data by removing excluded keys using the 'cleanUpObject' function.
 *   - Inserts the cleaned-up data into the specified database table.
 *   - If Success:
 *     + Returns a success response with the inserted record's ID if the insertion is successful.
 *   - Else :
 *     + Returns a failure response with an appropriate message if the insertion fails.
 * 
 * @param {string} tableName - The name of the database table to insert the record into.
 * @param {object} createData - The data to be inserted as a new record.
 * @param {array} excludedKeys - An array of keys to exclude from the data before insertion (optional).
 * @returns {object} - A response object with status, inserted data, or an error message.
 */
const store = async (tableName, createData, excludedKeys = []) => {
  // Retrieves a connection to the database and assigns it to the variable 'db'.
  const db = await getConnection();

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
 * Updates a record in the specified database table with the given update data.
 * 
 * Overview:
 *   - This function updates a record in the specified database table using the provided condition and update data.
 *   - It allows excluding specific keys (e.g., sensitive information) from the update data.
 * 
 * Logic:
 *   - Establishes a database connection using 'getConnection' and assigns it to the 'db' variable.
 *   - Cleans up the provided update data by removing excluded keys using the 'cleanUpObject' function.
 *   - Updates the record in the specified database table based on the provided condition.
 *   - If successful:
 *     + returns a success response with the updated record's data.
 *   - If the update fails:
 *     + returns a failure response with an appropriate error message.
 * 
 * @param {string} tableName - The name of the database table to update a record in.
 * @param {object} condition - The condition to identify the record to update.
 * @param {object} updateData - The data to update in the record.
 * @param {string} tenantId - The tenant ID (optional).
 * @param {array} excludedKeys - An array of keys to exclude from the update data (optional).
 * @returns {object} - A response object with status, updated data, or an error message.
 */
const update = async (tableName, condition, updateData, tenantId = null, excludedKeys = []) => {
  // Retrieves a connection to the database and assigns it to the variable 'db'.
  const db = await getConnection(tenantId);

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
 * Counts records in a database table based on provided filters and query options.
 * 
 * Overview:
 *   - This function counts records in a specified database table, applying filters, joins, and grouping as needed.
 * 
 * Logic:
 *   - Establishes a database connection using 'getConnection' and creates a model instance for the specified table.
 *   - Applies joins to the model if specified, based on the provided join conditions and join types.
 *   - Checks if 'deleted_at' property should be considered  and adds a 'where null' condition to exclude deleted records.
 *   - If filters are provided, applies them to the query by calling the 'applyFilters' function.
 *   - Groups results by a specified column if groupBy is provided.
 *   - Orders the results by count in descending order.
 *   - Retrieves the count of records from the specified table in the database.
 *   - If successful:
 *     + returns a success response with the count of records.
 *   - Else:
 *     + returns a success response with a count of 0.
 * 
 * @param {string} table_name - The name of the database table to count records in.
 * @param {object} filters - An object containing filter conditions for the query.
 * @param {array} joins - An array of join objects specifying join conditions and types.
 * @param {boolean} deleted_at - Whether to consider soft-deleted records (default: false).
 * @param {string} groupBy - The column by which to group the results (optional).
 * @returns {object} - A response object with status and count of records.
 */
const count = async (table_name, filters = null, joins = [], deleted_at = false, groupBy = null) => {
  let db = await getConnection();
  let model = db(table_name)
    .countDistinct(`${table_name}.id as count`)
    .modify((query) => applyFilters(query, table_name, filters));
  // Checks if the `deleted_at` property exists and evaluates to a truthy value.
  if (deleted_at) {
    // Adds a "where null" condition to the model query, checking if the "deleted_at" is null.
    model.whereNull(`${table_name}.deleted_at`);
  }

  //Checks if the length of the "joins" array is greater than 0.
  if (joins.length > 0) {
    // Iterates over the joins object and performs the specified join operation on the model.
    for (let key in joins) {
      // Retrieves the table associated with the given key from the 'joins' object.
      let joinTable = joins[key].table;
      // Retrieves the condition for a specific join key from the joins object.
      let joinCondition = joins[key].condition;
      //Retrieves the type of join for a given key from the joins object
      let joinType = joins[key].type || 'inner'; // Default to inner join if not specified

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
  if (groupBy) {
    model.groupBy(groupBy)
  }

  model.orderBy(`count`, 'desc');

  // Retrieves the count of records from the specified table in the database, applying any filters if provided.
  let countResponse = await model.first();

  if (countResponse) {
    if (countResponse.count) {
      return { status: true, data: countResponse.count };
    } else {
      return { status: true, data: 0 };
    }
  } else {
    return { status: true, data: 0 };
  }
};

/**
 * Calculates the sum of values in a specific column of a database table based on provided filters and query options.
 * 
 * Overview:
 *   - This function calculates the sum of values in a specified column of a database table, applying filters, joins, and soft delete conditions as needed.
 * 
 * Logic:
 *   - Establishes a database connection using 'getConnection' and creates a model instance for the specified table.
 *   - Applies joins to the model if specified, based on the provided join conditions and join types.
 *   - Checks if 'deleted_at' property should be considered  and adds a 'where null' condition to exclude deleted records.
 *   - If filters are provided, applies them to the query by calling the 'applyFilters' function.
 *   - Calculates the sum of values in the specified column.
 *   - If successful:
 *     + returns a success response with the calculated sum.
 *   - Else:
 *     + returns a success response with a sum of 0.
 * 
 * @param {string} table_name - The name of the database table to calculate the sum in.
 * @param {object} filters - An object containing filter conditions for the query.
 * @param {string} column_name - The name of the column to calculate the sum of.
 * @param {array} joins - An array of join objects specifying join conditions and types.
 * @param {boolean} deleted_at - Whether to consider soft-deleted records (default: true).
 * @returns {object} - A response object with status and the calculated sum.
 */
const sum = async (table_name, filters = null, column_name = null, joins = [], deleted_at = true) => {
  let db = await getConnection();
  let model = db(table_name)
    .sum(`${column_name}`)
    .modify((query) => applyFilters(query, table_name, filters));
  // Checks if the `deleted_at` property exists and evaluates to a truthy value.
  if (deleted_at) {
    // Adds a "where null" condition to the model query, checking if the "deleted_at" is null.
    model.whereNull(`${table_name}.deleted_at`);
  }
  //Checks if the length of the "joins" array is greater than 0.
  if (joins.length > 0) {
    // Iterates over the joins object and performs the specified join operation on the model.
    for (let key in joins) {
      // Retrieves the table associated with the given key from the 'joins' object.
      let joinTable = joins[key].table;
      // Retrieves the condition for a specific join key from the joins object.
      let joinCondition = joins[key].condition;
      //Retrieves the type of join for a given key from the joins object
      let joinType = joins[key].type || 'inner'; // Default to inner join if not specified

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
  // Retrieves the sum of records from the specified table in the database, applying any filters if provided.
  let sumResponse = await model.first();

  if (sumResponse.sum) {
    return { status: true, data: sumResponse.sum };
  } else {
    return { status: true, data: 0 };
  }
};

/**
 * Deletes records from a database table based on provided filters.
 * 
 * Overview:
 *   - This function deletes records from a specified database table based on the provided filters.
 * 
 * Logic:
 *   - Establishes a database connection using 'getConnection'.
 *   - Modifies the query by applying filters to select the records to be deleted.
 *   - Deletes the selected records from the table.
 * 
 * @param {string} table_name - The name of the database table from which records should be deleted.
 * @param {object} filters - An object containing filter conditions to select the records to be deleted.
 */
const destroy = async (table_name, filters = null) => {
  var dbConnection = await getConnection()

  let entryDeleted = dbConnection(`${table_name}`)
    .modify((query) => applyFilters(query, table_name, filters))
    .del();
  await entryDeleted;
}

/**
 * Stores an employee's login activity in the database.
 * 
 * Overview:
 *   - This function inserts a new record into the 'employee_login_activities' table, recording details of an employee's login activity.
 * 
 * Logic:
 *   - Establishes a database connection using 'getConnection'.
 *   - Inserts a new record into the 'employee_login_activities' table with details provided in the 'activityObject'.
 * 
 * @param {object} activityObject - An object containing details of the employee's login activity, including employee ID, IP, login time, region, city, country, latitude, and longitude.
 * @returns {object} - A response object with data indicating the success of the insertion.
 */
const logActivityStore = async (activityObject) => {
  var dbConnection = await getConnection();
  const data = dbConnection('employee_login_activities').insert({
    // Define the insert columns and their corresponding values from activityObject
    employee_id: activityObject.employee_id,
    ip: activityObject.ip,
    login_time: activityObject.login_time,
    region: activityObject.region,
    city: activityObject.city,
    country: activityObject.country,
    geom: dbConnection.raw(`ST_SetSRID(ST_MakePoint(${activityObject.latitude},${activityObject.longitude}), 4326)`)
  })
  return data
};

/**
 * Execute a raw SQL query in the database.
 * 
 * Overview:
 *   - This function allows executing raw SQL queries in the database.
 *   - It establishes a database connection using 'getConnection' and executes the provided SQL query.
 *   - It logs whether the query execution was successful or if an error occurred.
 * 
 * @param {string} sqlQuery - The raw SQL query to be executed in the database.
 */
const rawQuery = async (sqlQuery) => {

  var dbConnection = await getConnection();

  // Execute the raw SQL query
  const data = await dbConnection.raw(sqlQuery)
    .then((result) => {
      console.log('Update successful');
      return result.rows;
    })
    .catch((error) => {
      console.error('Error updating:', error);
      return { status: false };
    });

  return data;
};

module.exports = { find, findDistinct, findRaw, findByPagination, store, update, count, sum, destroy, logActivityStore, rawQuery };
