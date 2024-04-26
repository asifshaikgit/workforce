const { getConnection } = require('../../../../middlewares/connectionManager')
/**
 * Funtion to Apply filters to the query.
 * @param {object} query
 * @param {object} filters
 * @return Json
 */
const applyFilters = (query, filters) => {
  for (const key in filters) {
    if (filters[key] !== undefined && filters[key] !== '') {
      if (key == 'status') {
        query.where('employee.status', '=', filters[key])
      } else if (key == 'employment_type_id') {
        query
          .join('employment_types as type', 'employee.employment_type_id', '=', 'type.id')
          .where('type.id', '=', filters[key]);
      }
    }
  }
  return query
};

/**
 * @param {object} filters 
 * @param {array} columns 
 * @param {array} condition 
 * @param {String} tableName
 * @return {object} 
 */
const employeeFind = async (columns, condition, tableName, filters = null) => {
  const db = await getConnection();
  let query = db(tableName)
    .select(columns)
    .orderBy(tableName + '.created_at', 'desc')
    .whereNull(tableName + '.deleted_at');
  if (condition) {
    for (i = 0; i < condition.length; i++) {
      query = query.leftJoin(
        condition[i].related_table,
        condition[i].primary_table,
        '=',
        condition[i].related_column
      )
        .whereNull(condition[i].is_deleted);
    }
  }
  if (filters !== null) {
    query = applyFilters(query, filters)
  }
  const data = await query;
  return { status: true, data: data };
};



module.exports = { employeeFind }