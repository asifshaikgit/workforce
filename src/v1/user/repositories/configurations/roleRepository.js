const { getConnection } = require('../../../../middlewares/connectionManager');

/**
 * Destroy function to delete a role and its associated role permissions.
 * 
 * Overview of Function:
 * - Delete a role and its associated role permissions based on the provided conditions.
 * 
 * Logic:
 * - Retrieve a database connection using 'getConnection()'.
 * - Get the current date and time and format it as a timestamptz.
 * - Use the database connection to update the 'roles' table based on the provided conditions:
 *   + Set 'deleted_at' to the current timestamp.
 *   + Set 'is_active' to false.
 * - Check the number of role records updated. If it's greater than 0:
 *   + Prepare a condition to update associated role permissions with 'deleted_at' and 'is_allowed' set to false.
 *   + Update the 'role_permissions' table based on the condition.
 *   + Return a response with status true, the number of role records updated, and a success message.
 * - If no role records were updated, return a response with status false and an error message.
 * 
 * @param {Object} condition - The conditions to identify the role to be deleted.
 * @returns {Object} Response indicating the success or failure of the deletion operation.
 */
const destroy = async (condition) => {
  const db = await getConnection();
  const date = new Date();
  const dateString = date.toISOString().slice(0, -1);
  const timeWithTimezone = db.raw(`'${dateString}'::timestamptz`);
  const roleInfo = await db('roles').update({ deleted_at: timeWithTimezone, is_active: false }).where(condition);
  if (roleInfo > 0) {
    const cond = { role_id: condition.id };
    const permissions = await db('role_permissions').update({ deleted_at: timeWithTimezone, is_allowed: false }).where(cond).then((data) => {
      return { status: true, data: roleInfo, message: 'Role Deleted' };
    }).catch((err) => {
      return { status: false, error: err };
    });
    return permissions;
  } else {
    return { status: false, message: 'Error deleting role', error: roleInfo.error };
  }
};

/**
 * Update function to modify a role and its associated role permissions.
 * 
 * Overview of Function:
 * - Update a role and its associated role permissions based on the provided conditions and update data.
 * 
 * Logic:
 * - Retrieve a database connection using 'getConnection()'.
 * - Use the database connection to update the 'roles' table with the provided 'updateData.role' based on the provided 'condition'.
 * - Check if the role update was successful. If successful:
 *   + Prepare a condition to update associated role permissions.
 *   + Iterate over 'updateData.permissions' and update the 'role_permissions' table:
 *     - Set 'is_allowed' for the specific permission based on 'updateData.permissions'.
 *     - If no rows were updated for the permission, insert a new record.
 *   + Return a response with status true and a success message.
 * - If the role update or role permissions update fails, return a response with status false and an error message.
 * 
 * @param {Object} condition - The conditions to identify the role to be updated.
 * @param {Object} updateData - The data to update the role and its associated role permissions.
 * @returns {Object} Response indicating the success or failure of the update operation.
 */
const update = async (condition, updateData) => {
  const db = await getConnection();
  const roleUpdate = await db('roles').update(updateData.role).where(condition).then(async (data) => {
    const cond = { role_id: condition.id };
    for (const val in updateData.permissions) {
      updateData.permissions[val].role_id = condition.id;
      await db('role_permissions')
        .update({ is_allowed: updateData.permissions[val].is_allowed })
        .where({ permission_id: updateData.permissions[val].permission_id })
        .andWhere(cond)
        .returning('*')
        .then(async (rows) => {
          if (rows.length === 0) {
            await db('role_permissions').insert(updateData.permissions[val]);
          }
        }).catch((err) => {
          return { status: false, error: err };
        });
    }
    return { status: true, message: 'Role permissions updated' };
  }).catch((err) => {
    return { status: false, error: err };
  });
  return roleUpdate;
};

/**
 * Store function to create a new role and its associated role permissions.
 * 
 * Overview of Function:
 * - Create a new role and its associated role permissions based on the provided object.
 * 
 * Logic:
 * - Retrieve a database connection using 'getConnection()'.
 * - Use the database connection to insert the new role data into the 'roles' table from 'obj.role'.
 * - Retrieve the ID of the newly created role.
 * - Create an empty array 'newPermissions'.
 * - Iterate over 'obj.permissions' and set 'role_id' for each permission to the ID of the newly created role.
 * - Insert the role permissions into the 'role_permissions' table.
 * - Check if role permission creation was successful.
 * - If successful:
 *    ~ return a response with status true and the ID of the created role.
 * - Else:
 *    ~ return a response with status false and an error message.
 * 
 * @param {Object} obj - The object containing data for creating a new role and its associated role permissions.
 * @returns {Object} Response indicating the success or failure of the creation operation and the ID of the created role.
 */
const store = async (obj) => {
  const db = await getConnection();
  const roleCreation = await db('roles').insert(obj.role, 'id');
  const newPermissions = [];
  for (const val in obj.permissions) {
    obj.permissions[val].role_id = roleCreation[0].id;
    newPermissions.push(obj.permissions[val]);
  }
  const rolePermissionCreation = await db('role_permissions').insert(newPermissions);

  if (rolePermissionCreation) {
    return { status: true, data: roleCreation.id };
  } else {
    return { status: false, data: [], error: roleCreation.error };
  }
};

module.exports = { store, update, destroy };
