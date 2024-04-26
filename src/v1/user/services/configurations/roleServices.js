const permissionRepository = require('../../repositories/configurations/permissionsRepository');
const { event } = require('../../../../../events/configurationActivityEvent');
const indexRepository = require('../../repositories/index');
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');
const { getRolesData, getRolesStatus } = require('./commonService');

/**
 * Store function to create a new Role entry.
 * 
 * Logic:
 * - Initiate a database connection using 'getConnection()'.
 * - Initiate a database transaction ('db.transaction') to ensure data integrity.
 * - Create a new object 'newRole' with properties from the request body for the new Role entry.
 * - Call the 'transactionRepository.store' function to add the 'newRole' to the 'roles' table within the transaction.
 * - If permissions are provided in the request body:
 *    ~ create new entries in the 'role_permissions' table for each permission within the transaction.
 * - Commit the database transaction if all database operations are successful.
 * - Track the creation activity for the Role.
 * - Emit an event to log the activity.
 * - Return the response from the repository.
 * 
 * Note:
 * - Exception handling using try-catch.
 * - If any exception is raised, rollback all database operations using 'trx.rollback()'.
 * 
 * @param {Object} body - The request body containing Role details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {

  let trx;
  try {
    //databse connection
    const db = await getConnection();
    trx = await db.transaction()
    //databse connection

    /* Creating store entry object */
    const newRole = {
      name: body.role_name,
      description: body?.description || null,
      is_active: body.is_active,
      created_at: new Date(),
      created_by: body.created_by,
    };
    /* Creating store entry object */

    const newRolePermissions = body.permissions;
    const newPermissions = []
    // storing the role details
    const roleInfo = await transactionRepository.store(trx, 'roles', newRole);

    // looping the permissions from body and storing in role permissions
    for (const val in newRolePermissions) {
      newRolePermissions[val].role_id = roleInfo.data[0].id;
      newRolePermissions[val].created_at = new Date();
      newRolePermissions[val].created_by = body.created_by;
      newPermissions.push(newRolePermissions[val])
    }
    await transactionRepository.store(trx, 'role_permissions', newPermissions);
    // looping the permissions from body and storing in role permissions

    // Commit the transaction
    await trx.commit();
    // Commit the transaction

    /**Activity track */
    // Create ChangeLog Object
    const changeLog = [
      {
        'label_name': 'name',
        'value': body.role_name,
        'action_by': body.created_by
      }
    ];

    const activity = {
      referrable_id: roleInfo.data[0].id,
      referrable_type: 26,
      action_type: 1,
      created_by: body.created_by,
      change_log: JSON.stringify(changeLog)
    };
    event.emit('configurationStoreActivity', { activity });
    /**Activity track */
    return roleInfo;
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

/**
 * Update function to modify an existing Role entry.
 * 
 * Logic:
 * - Initiate a database connection using 'getConnection()'.
 * - Initiate a database transaction ('db.transaction') to ensure data integrity.
 * - Create an object 'roleData' containing properties based on the request body for updating the Role.
 * - Retrieve the Role details before the update ('beforeUpdateData').
 * - Call the update repository function within the transaction to modify the 'roles' table.
 * - Update the permissions for the Role by iterating through the permission list in the request body.
 *   ~ Check if a role-permission entry already exists;
 *     + if it does, update the 'is_allowed' field;
 *     + if not, create a new entry.
 * - Update the 'access_token' field for all employees with the same role as the Role being updated.
 * - If the update is successful, commit the database transaction.
 * - Retrieve the Role details after the update ('afterUpdateData').
 * - Track the update activity for the Role and emit an event to log the activity.
 * - Return the response from the repository.
 * 
 *  Note :
 *    - Exception Handling using try-catch
 *    - If any exception is raised, rollback all database operations using 'trx.rollback()'.
 *     
 * @param {Object} body - The request body containing Role details to be updated.
 * @param {Object} condition - The condition to identify the Role entry to be updated.
 * @returns {Object} Repository response.
 */
const update = async (body, condition) => {

  let trx;
  try {
    //databse connection
    const db = await getConnection();
    trx = await db.transaction()
    //databse connection

    /**Fetching role details before update */
    const beforeUpdateData = await getRolesData(body, condition)
    /**Fetching role details before update */

    /* Creating new object */
    const roleData = {
      name: body.role_name,
      description: body?.description || null,
      updated_by: body.updated_by,
      updated_at: new Date(),
      is_active: body.is_active,
    };
    /* Creating new object */
    const rolePermissions = body.permissions;

    const roleUpdate = await transactionRepository.update(trx, 'roles', condition, roleData)
    await transactionRepository.update(trx, 'employee', { role_id: condition.id }, { access_token: null, refresh_token: null });

    // looping the permissions from body and updating in role permissions
    for (const val in rolePermissions) {
      rolePermissions[val].role_id = condition['id'];
      let checkRolesPermissionExists = await transactionRepository.find(trx, 'role_permissions', ['id'], { role_id: condition.id, permission_id: rolePermissions[val].permission_id });
      // looping the permissions from body and updating in role permissions

      if (checkRolesPermissionExists.status) {
        await transactionRepository.update(trx, 'role_permissions', { role_id: condition.id, permission_id: rolePermissions[val].permission_id, is_editable: true }, { is_allowed: rolePermissions[val].is_allowed })
      } else {
        await transactionRepository.store(trx, 'role_permissions', { role_id: condition.id, permission_id: rolePermissions[val].permission_id, is_allowed: rolePermissions[val].is_allowed, created_by: body.created_by });
      }
    }
    await transactionRepository.update(trx, 'employee', { role_id: condition.id }, { access_token: null })

    // Commit the transaction
    await trx.commit();
    // Commit the transaction

    /**Activity track */
    const activity = {
      referrable_id: condition.id,
      referrable_type: 26,
      action_type: 2,
      created_by: body.created_by
    };
    event.emit('configurationRolesUpdateActivity', { activity, beforeUpdateData });
    /**Activity track */
    return roleUpdate;
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

/**
 * Update function to modify the 'is_active' status of a Role entry.
 * 
 * Logic:
 * - Create an 'updateData' object with the properties to update the 'is_active' status in the Role entry.
 * - Retrieve the Role details before the update ('beforeUpdateData').
 * - Call the 'indexRepository.update' function to update the 'roles' table with the provided condition and 'updateData'.
 * - Retrieve the Role details after the update ('afterUpdateData').
 * - Track the update activity for the Role.
 * - Emit an event to log the activity.
 * 
 * @param {Object} body - The request body containing the 'is_active' status to be updated.
 * @param {Object} condition - The condition to identify the Role entry to be updated.
 */
const updateStatus = async (body, condition) => {

  /* Creating new object */
  const updateData = {
    is_active: body.is_active,
    updated_at: new Date(),
    updated_by: body.updated_by,
  };
  /* Creating new object */

  /**Fetching role details before update */
  const beforeUpdateData = await getRolesStatus(condition.id)

  /**Fetching role details before update */
  await indexRepository.update('roles', condition, updateData);

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 26,
    action_type: 2,
    created_by: body.created_by,
    slug: 'roles_status'
  };
  /**Activity track */
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData });
};

/**
 * Index function to retrieve a list of Role details based on the provided condition.
 * 
 * Logic:
 * - Fetch Role information from the 'roles' table based on the provided condition.
 * - Create an empty 'responseData' object to structure the response.
 * - Fetch role permissions for the specified role from 'permissions' table using 'permissionRepository.rolePermissions' function.
 * - Create an empty 'permissions' object to structure the permissions data.
 * - If role permissions exist:
 *   + Iterate through the permissions data and group them by module name.
 *   + For each module, create a 'permissions' array containing permission details.
 *   + If the permission name is not 'Additional Permissions', add it to the permissions array.
 *   + If the permission name is 'Additional Permissions', fetch additional permissions from 'permissions' table using 'permissionRepository.rolePermissions' function and structure them accordingly.
 *   + Push the permissions data to the 'responseData' object.
 *   + Return the response object with status true and responseData.
 * - If role permissions don't exist:
 *   + Return a response object with status false and an error message.
 *    
 * @param {Object} condition - The conditions to filter Role details.
 * @returns {Object} Response with Role details and associated permissions.
 */
const index = async (condition) => {

  // getting the role details
  const roleInfo = await indexRepository.find('roles', ['name', 'is_active', 'description', 'is_editable'], condition);
  const responseData = {};

  // getting the role permissions for the role
  const permissions = await permissionRepository.rolePermissions(condition.id, { parent_slug: null });
  if (permissions.status) {

    // lopping the permissions data and defining an array to push
    for (const obj in permissions.data) {
      responseData[`${permissions.data[obj].module_name}`] = [];
    }
    // lopping the permissions data and grouping them
    for (const obj in permissions.data) {
      const additionalData = [];
      const additionalObject = {};
      const module = permissions.data[obj].module_name;

      // for the case of additional permissions
      if (permissions.data[obj].name !== 'Additional Permissions') {
        responseData[module].push({
          permission_name: permissions.data[obj].name,
          slug: permissions.data[obj].slug,
          permission_id: permissions.data[obj].id,
          is_allowed: permissions.data[obj].is_allowed !== null ? permissions.data[obj].is_allowed : false,
          is_editable: permissions.data[obj].is_editable !== null ? permissions.data[obj].is_editable : false,
        });
      } else {
        const roleCondition = { module_id: permissions.data[obj].module_id, parent_slug: permissions.data[obj].slug };
        const additionalPermissions = await permissionRepository.rolePermissions(condition.id, roleCondition);
        if (additionalPermissions.status) {
          // looping the additional permissions data and pushing in to an array
          for (const key in additionalPermissions.data) {
            const item = additionalPermissions.data[key];
            additionalData.push({
              permission_name: item.name,
              slug: item.slug,
              permission_id: item.id,
              is_allowed: item.is_allowed !== null ? item.is_allowed : false,
              is_editable: item.is_editable !== null ? item.is_editable : false,
            });
          }
          additionalObject.additional_permissions = additionalData;
          const module = permissions.data[obj].module_name;
          responseData[module].push(additionalObject);
        } else {
          additionalObject.additional_permissions = [];
          const module = permissions.data[obj].module_name;
          responseData[module].push(additionalObject);
        }
      }
    }

    const responseRoleData = {};
    responseRoleData.role_name = roleInfo.data[0].name;
    responseRoleData.is_active = roleInfo.data[0].is_active;
    responseRoleData.description = roleInfo.data[0].description;
    responseRoleData.permissions = responseData;

    return { status: true, data: responseRoleData };
  } else {
    return { status: false, data: [], error: 'Failed to fetch data' };
  }
};

/**
 * Function to fetch and structure Role permissions based on the provided condition.
 * 
 * Logic:
 * - Fetch Role information from the 'roles' table based on the provided condition.
 * - Create an empty 'responseData' object to structure the response.
 * - Fetch role permissions for the specified role from 'permissions' table using 'permissionRepository.rolePermissions' function.
 * - Create an empty 'permissions' object to structure the permissions data.
 * - If role permissions exist:
 *   + Iterate through the permissions data and structure them in the 'responseData' object.
 *   + Group permissions by module and create a 'permissions' array.
 *   + Include permission details such as name, slug, permission ID, and whether it is allowed.
 *   + If permissions are under the 'Additional Permissions' module, fetch additional permissions from 'permissions' table using 'permissionRepository.rolePermissions' function and structure them.
 *   + Return the response object with status true and responseData.
 * - If role permissions don't exist:
 *   + Return a response object with status false and an error message.
 *    
 * @param {Object} condition - The conditions to filter Role permissions.
 * @returns {Object} Response with Role permissions and associated details.
 */
const fethRolePermissions = async (roleId) => {

  // getting the role details
  const roleInfo = await indexRepository.find('roles', ['name', 'is_active', 'description', 'is_editable'], roleId);
  const responseData = {};

  // getting the role permissions details
  const permissions = await permissionRepository.rolePermissions(roleId.id, { parent_slug: null });
  if (permissions.status) {
    responseData.permissions = [];
    // lopping the permissions data and defining an array to push
    for (const obj in permissions.data) {
      if (permissions.data[obj].name !== 'Additional Permissions') {
        responseData.permissions.push({
          permission_name: permissions.data[obj].name,
          slug: permissions.data[obj].slug,
          permission_id: permissions.data[obj].id,
          is_allowed: permissions.data[obj].is_allowed !== null ? permissions.data[obj].is_allowed : false,
        });
      } else {
        // In case of additional permissions
        const condition = { module_id: permissions.data[obj].module_id, parent_slug: permissions.data[obj].slug };
        const additionalPermissions = await permissionRepository.rolePermissions(roleId.id, condition);
        if (additionalPermissions.status) {

          // looping the additional permissions data and pushing in to an array
          for (const key in additionalPermissions.data) {
            const item = additionalPermissions.data[key];
            responseData.permissions.push({
              permission_name: item.name,
              slug: item.slug,
              permission_id: item.id,
              is_allowed: item.is_allowed !== null ? item.is_allowed : false,
            });
          }
        }
      }
    }

    const responseRoleData = {};
    responseRoleData.role_name = roleInfo.data[0].name;
    responseRoleData.is_active = roleInfo.data[0].is_active;
    responseRoleData.description = roleInfo.data[0].description;
    responseRoleData.permissions = responseData;

    return { status: true, data: responseRoleData };
  } else {
    return { status: false, data: [], error: 'Failed to fetch data' };
  }
};

/**
 * Listing function to retrieve a paginated list of roles with activity track.
 * 
 * Logic:
 * - Set default variables for the table name, fields, and joins.
 * - Use the repository function to fetch Role data from the 'roles' table based on the provided condition, page, and limit.
 * - If data exists:
 *   + Create an empty array 'responseData'.
 *   + Map the repository response data to 'totalDetails'.
 *   + Map the pagination details to 'paginationDetails'.
 *   + Iterate over 'totalDetails' and create a 'listingObject' object with response data for each Role.
 *   + Push the 'listingObject' object to the 'responseData' array.
 *   + Call the repository function to fetch activity track data from the 'configuration_activity_track' table based on condition ('configuration_type' is 9, 'configuration_sub_module' is 'employee-role').
 *   + Map the activity track response data to 'filteredActivities'.
 *   + Create an empty array 'transformedActivity'.
 *   + Iterate over 'filteredActivities' and for each iteration, call the repository function to get 'employee_name' from the 'employee' table based on 'id' (filteredActivities[key].created_by).
 *   + Prepare 'activityObject' object using 'filteredActivities' data.
 *   + Push 'activityObject' object to the 'transformedActivity' array.
 *   + Return the response object with status true, responseData, transformedActivity, and paginationDetails.
 * - If data doesn't exist, 
 *   + Return the response object with status false, or an error message based on the repository response.
 *    
 * @param {Object} condition - The conditions to filter Roles.
 * @param {number} page - The page number for paginating results.
 * @param {number} limit - The number of items per page.
 * @returns {Object} Response with paginated Role details and activity logs.
 */
const listing = async (condition, page, limit) => {
  /* Default variables */
  const tableName = 'roles';
  const fields = ['roles.*', 'create.display_name as create_emp', 'update.display_name as updated_emp'];
  const joins = [
    { table: 'employee as create', alias: 'create', condition: ['roles.created_by', 'create.id'], type: 'left', ignoreDeletedAt: true },
    { table: 'employee as update', alias: 'update', condition: ['roles.updated_by', 'update.id'], type: 'left', ignoreDeletedAt: true },
  ];
  /* Default variables */
  const roles = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit);
  if (roles.status) {
    /* variables */
    const responseData = [];
    const totalDetails = roles.data;
    const paginationDetails = roles.pagination;
    /* variables */

    let serialNo = (page - 1) * limit + 1;
    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        serial_no: serialNo,
        id: item.id,
        name: item.name,
        template: item.template,
        is_active: item.is_active,
        is_editable: item.is_editable,
        description: (item.description !== null ? item.description : ''),
        created_by: (item.create_emp !== null ? item.create_emp : 'System'),
        updated_by: (item.updated_emp !== null ? item.updated_emp : ''),

      };
      serialNo++;
      responseData.push(listingObject);
    }

    /* prepare the response */

    return {
      status: true,
      data: responseData,
      // activity: transformedActivity,
      pagination_data: paginationDetails,
    };
  } else {
    return roles;
  }
};


/**
 * Delete a Role based on specified conditions.
 * 
 * Logic:
 * - Call the 'destroy' function of 'roleRepository' to delete the role data from 'roles' table
 * - Create an 'activity' object to log the deletion action in the configuration activity track.
 * - Emit an event to capture and track the deletion activity.
 * - Return the 'roleRepository' response
 * 
 * @param {Object} body - The request body containing parameters to identify the Role to be deleted.
 * @param {Object} condition - The conditions to specify which Role to delete.
 */
const destroy = async (body, condition) => {

  var updateData = {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by
  };

  const roleData = await indexRepository.update('roles', condition, updateData);

  /**Activity track */
  // Create Change Log
  const change_log = [
    {
      'label_name': 'name',
      'value': body.name,
      'action_by': body.created_by
    }
  ]
  const activity = {
    referrable_id: condition.id,
    referrable_type: 26,
    action_type: 3,
    created_by: body.created_by,
    change_log: JSON.stringify(change_log)
  };
  event.emit('configurationDeleteActivity', activity);
  /**Activity track */
  return roleData;
};

module.exports = { index, store, fethRolePermissions, update, destroy, listing, updateStatus };
