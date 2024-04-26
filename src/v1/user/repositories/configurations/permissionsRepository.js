const { getConnection } = require('../../../../middlewares/connectionManager');

/**
 * Apply Filters to a Database Query.
 * 
 * Overview of Function:
 * - Apply filters to a database query based on the provided filter object.
 * 
 * Logic:
 * - Iterate through the provided filter object.
 * - For each key in the filter object:
 *   + If the value is truthy (not null or undefined), add a WHERE clause to the query with the key and value.
 *   + If the value is null, add a WHERE clause to the query that checks for null values in the specified key.
 * - Return the modified query with applied filters.
 * 
 * @param {Object} query - The database query to which filters will be applied.
 * @param {Object} filters - The filter object containing key-value pairs for filtering the query.
 * @returns {Object} The modified database query with applied filters.
 */
const applyFilters = (query, filters) => {
  for (const key in filters) {
    if (filters[key]) {
      query.where(key, filters[key]);
    } else if (filters[key] === null) {
      query.whereNull(key);
    }
  }
  return query;
};

/**
 * Retrieve role permissions for a specific role.
 * 
 * Overview of Function:
 * - Fetch role permissions for a specific role based on the provided 'roleId' and optional 'condition'.
 * 
 * Logic:
 * - Create a database connection using 'getConnection()'.
 * - Perform a database query to retrieve role permissions.
 *   + The query joins 'permissions', 'modules', and 'role_permissions' tables.
 *   + It selects specific fields from these tables to provide role permission data.
 *   + The query also checks for the 'is_allowed' status in 'role_permissions' for the specified 'roleId'.
 *   + If a 'condition' is provided, apply additional filters to the query.
 * - If role permissions exist,
 *    ~ return them with status true.
 * - If no role permissions are found or an error occurs, 
 *    ~ return status false with an optional error message.
 * 
 * @param {number} roleId - The ID of the role for which permissions are requested.
 * @param {Object} condition - (Optional) Additional conditions to filter role permissions.
 * @returns {Object} Response object with status, role permissions data, and optional error message.
 */
const rolePermissions = async (roleId, condition = null) => {
  const db = await getConnection();
  const permissions = await db('permissions')
    .join('modules', 'permissions.module_id', 'modules.id')
    .leftJoin('role_permissions', function () {
      this.on('permissions.id', '=', 'role_permissions.permission_id').andOn(db.raw('?? = ?', ['role_permissions.role_id', roleId]));
    })
    .select('modules.name as module_name', 'permissions.id', 'permissions.name', 'permissions.parent_slug', 'permissions.module_id', 'permissions.slug', 'role_permissions.is_allowed', 'role_permissions.is_editable')
    .modify((query) => {
      if (condition !== null) {
        applyFilters(query, condition);
      }
    });

  if (permissions.length > 0) {
    return { status: true, data: permissions };
  } else {
    return { status: false, data: [], error: permissions.error };
  }
};

module.exports = { rolePermissions };
