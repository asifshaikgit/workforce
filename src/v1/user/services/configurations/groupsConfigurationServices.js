const indexRepository = require('../../repositories/index');
const transactionRepository = require('../../repositories/transactionRepository');
const { event } = require('../../../../../events/configurationActivityEvent');
const { getConnection } = require('../../../../middlewares/connectionManager');

/**
 * Retrieves group data from the database based on the given condition.
 * 
 * Logic:
 * - Set default variables for the table name, fields, and joins.
 * - Fetch group data from the 'groups' table based on the provided condition.
 * - If data exists:
 *   + Create default variables such as 'totalDetails' and 'responseData'.
 *   + Map the repository response data (group.data) to 'totalDetails'.
 *   + Create an object 'responseData' containing specific properties.
 *   + Create an empty array 'membersList'.
 *   + Iterate over 'totalDetails' and create a 'listingObject' for each group member.
 *   + Push the 'listingObject' objects to the 'membersList' array.
 *   + Set 'members' property in 'responseData' to 'membersList'.
 *   + Return the response object with status true and 'responseData'.
 * - Else(data doesn't exist):
 *   + return the repository response 'group'.
 * 
 * @param {object} condition - The condition to filter the group data.
 * @returns {Promise<object>} - A promise that resolves to an object containing the group data.
 */
const index = async (condition) => {
  /* Default variables */
  const tableName = 'groups';
  const fields = ['groups.*', 'employee.id as employee_id', 'employee.display_name as full_name', 'employee.profile_picture_url', 'employee.gender', 'employee.reference_id', 'create.display_name as create_emp', 'update.display_name as updated_emp'];
  const joins = [
    { table: 'employee as create', alias: 'create', condition: ['groups.created_by', 'create.id'], type: 'left', ignoreDeletedAt: true },
    { table: 'employee as update', alias: 'update', condition: ['groups.updated_by', 'update.id'], type: 'left', ignoreDeletedAt: true },
    { table: 'notification_group_users', condition: ['groups.id', 'notification_group_users.referrable_id'], type: 'right', ignoreDeletedAt: true },
    { table: 'employee', condition: ['notification_group_users.employee_id', 'employee.id'], type: 'left' },
  ];
  /* Default variables */
  const group = await indexRepository.find(tableName, fields, condition, 0, joins);
  // return group;{
  if (group.status) {
    /* variables */
    const totalDetails = group.data;
    const responseData = { id: group.data[0].id, created_by: group.data[0].created_by || 'System', is_active: group.data[0].is_active };
    const membersList = [];
    /* variables */

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        id: item.employee_id,
        full_name: item.full_name,
        profile_picture_url: item.profile_picture_url,
        gender: item.gender,
        reference_id: item.reference_id,
      };
      membersList.push(listingObject);
    }
    responseData.members = membersList;
    return { status: true, data: responseData };
  } else {
    return group;
  }
};

/**
 * Stores a new group in the database.
 * 
 * Logic:
 *   - Create a 'newGroup' object containing group data (body).
 *   - Call the common 'indexRepository.store' function to store the 'newGroup' object into the 'groups' table.
 *   - Create a 'groupMembers' array to store group members from the 'body' parameter.
 *   - Iterate over 'groupMembers' and create 'groupUser' objects for each member.
 *   - Call 'indexRepository.store' to add each 'groupUser' to the 'group_users' table.
 *   - Return the response from the repository 'group'.
 * 
 * @param {object} body - The request body containing the group details, including 'name', 'is_active', 'created_by', and 'members'.
 * @returns {Promise<object>} - A promise that resolves to the stored group information.
 */
const store = async (body) => {

  let trx;
  try {

    // Initialize a database transaction
    const db = await getConnection();
    trx = await db.transaction();


    /* Creating store entry object */
    const newGroup = {
      name: body.name,
      is_active: body.is_active,
      created_at: new Date(),
      created_by: body.created_by,
    };
    /* Creating store entry object */

    const group = await transactionRepository.store(trx, 'groups', newGroup);
    const groupMembers = body.members;
    for (const key in groupMembers) { // looping the group members and storing the employees
      const groupUser = {
        referrable_type: 1,
        referrable_id: group.data[0].id,
        employee_id: groupMembers[key].id,
        created_by: body.created_by
      };
      await transactionRepository.store(trx, 'notification_group_users', groupUser);
    }

    // Commit the transaction
    await trx.commit();

    /**Activity track */
    const activity = {
      referrable_id: group.data[0].id,
      referrable_type: 37,
      action_type: 1,
      created_by: body.created_by,
    };
    event.emit('configurationStoreActivity', { activity });
    return group;
  } catch (error) {
    // Handle errors and rollback the transaction in case of an exception
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
}

/**
 * Updates an existing group in the database.
 * 
 * Logic:
 *   - Create an 'updateGroup' object containing the updated group data (body).
 *   - Call the common 'indexRepository.update' function to update the 'groups' table with 'updateGroup' based on the provided 'condition'.
 *   - Update the 'groupcondition' to find 'group_users' related to the 'group_id'.
 *   - Call 'indexRepository.destroy' to remove existing 'group_users' records for this group.
 *   - Create a 'groupMembers' array to store group members from the 'body' parameter.
 *   - Iterate over 'groupMembers' and create 'groupUser' objects for each member.
 *   - Call 'indexRepository.store' to add each 'groupUser' to the 'group_users' table.
 *   - Return the response from the repository 'group'.
 * 
 * @param {object} body - The request body containing the updated group details, including 'name', 'is_active', 'created_by', and 'members'.
 * @param {object} condition - The condition to identify the group to update, typically including 'id'.
 * @returns {Promise<object>} - A promise that resolves to the updated group information.
 */
const update = async (body, condition) => {

  let trx;
  try {

    // Initialize a database transaction
    const db = await getConnection();
    trx = await db.transaction();

    // get groups before data
    var beforeDataQuery = await getGroupDataQuery(condition.id);
    var beforeUpdateData = await indexRepository.rawQuery(beforeDataQuery);
    beforeUpdateData = beforeUpdateData[0];

    /* Creating update entry object */
    const updateGroup = {
      name: body.name,
      is_active: body.is_active,
      updated_at: new Date(),
      updated_by: body.updated_by,
    };
    const group = await transactionRepository.update(trx, 'groups', condition, updateGroup);
    var groupcondition = { referrable_type: 1, referrable_id: condition.id };
    await transactionRepository.destroy(trx, 'notification_group_users', groupcondition);
    const groupMembers = body.members;
    for (const key in groupMembers) {
      const groupUser = {
        referrable_type: 1,
        referrable_id: group.data[0].id,
        employee_id: groupMembers[key].id,
        created_by: body.created_by,
        updated_by: body.updated_by
      };
      await transactionRepository.store(trx, 'notification_group_users', groupUser);
    }
    // Commit the transaction
    await trx.commit();

    // get group after data
    var afterDataQuery = await getGroupDataQuery(condition.id);
    var afterUpdateData = await indexRepository.rawQuery(afterDataQuery);
    afterUpdateData = afterUpdateData[0];

    /**Activity track */
    activity = {
      referrable_type: 37, // for the notification_settings referrable type is 28
      referrable_id: condition.id,
      action_type: 2, // 2 for update
      created_by: body.created_by,
    }
    event.emit('configurationNotificationActivity', { activity, beforeUpdateData, afterUpdateData });
    return group;

  } catch (error) {
    // Handle errors and rollback the transaction in case of an exception
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
}

/**
 * Updates the status of a group record in the database with the provided data.
 * 
 * Logic:
 *   - Create an 'updateData' object containing the new status ('is_active').
 *   - Call the 'indexRepository.update' function to update the status of the group record in the 'groups' table based on the provided 'condition'.
 * 
 * @param {Object} body - The data to update the status of the group.
 * @param {Object} condition - The condition that specifies which group record to update, typically including 'id'.
 * @returns {Promise} - A promise indicating the status of the update operation.
 */
const updateStatus = async (body, condition) => {

  // get groups before data
  var beforeDataQuery = await getGroupDataQuery(condition.id);
  var beforeUpdateData = await indexRepository.rawQuery(beforeDataQuery);
  beforeUpdateData = beforeUpdateData[0];

  const updateData = {
    is_active: body.is_active,
    updated_at: new Date(),
    updated_by: body.updated_by,
  };
  await indexRepository.update('groups', condition, updateData);

  // get group after data
  var afterDataQuery = await getGroupDataQuery(condition.id);
  var afterUpdateData = await indexRepository.rawQuery(afterDataQuery);
  afterUpdateData = afterUpdateData[0];

  /**Activity track */
  activity = {
    referrable_type: 37, // for the notification_settings referrable type is 28
    referrable_id: condition.id,
    action_type: 2, // 2 for update
    created_by: body.created_by,
  }
  event.emit('configurationNotificationActivity', { activity, beforeUpdateData, afterUpdateData });
};

/**
 * Marks a group record as deleted in the database based on the provided condition.
 * 
 * Logic:
 *   - Create an 'updateData' object containing the deletion timestamp ('deleted_at'), update timestamp ('updated_at'), and the user who updated ('updated_by').
 *   - Call the 'indexRepository.update' function to mark the group record as deleted in the 'groups' table based on the provided 'condition'.
 *   - Create a 'condition' object to remove related 'group_users' records.
 *   - Call the 'indexRepository.destroy' function to remove related 'group_users' records based on the 'condition'.
 * 
 * @param {Object} body - The data for marking the group record as deleted.
 * @param {Object} condition - The condition that specifies which group record to mark as deleted, typically including 'id'.
 * @returns {Promise} - A promise indicating the status of the deletion operation.
 */
const destroy = async (body, condition) => {

  let trx;
  try {

    // Initialize a database transaction
    const db = await getConnection();
    trx = await db.transaction();

    /* Creating update entry object */
    const updateData = {
      deleted_at: new Date(),
      updated_at: new Date(),
      updated_by: body.updated_by,
    };
    const group = await transactionRepository.update(trx, 'groups', condition, updateData);
    var groupcondition = { referrable_type: 1, referrable_id: condition.id };
    await transactionRepository.destroy(trx, 'notification_group_users', groupcondition);

    // Commit the transaction
    await trx.commit();

    /**Activity track */
    const activity = {
      referrable_id: condition.id,
      referrable_type: 37,
      action_type: 3,
      created_by: body.created_by,
    };
    event.emit('configurationDeleteActivity', activity);
    /**Activity track */
    return group;
  } catch (error) {
    // Handle errors and rollback the transaction in case of an exception
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
}

/**
 * Get Group Data Query
 */
async function getGroupDataQuery(referrable_id) {

  return `SELECT groups.name, CASE WHEN groups.is_active THEN 'Active'ELSE 'In-Active'END AS Status, groups.id as id ,(SELECT jsonb_agg(employee_id) FROM notification_group_users WHERE referrable_id = groups.id AND notification_group_users.referrable_type = 1) as "Assign To" FROM groups WHERE groups.id = '` + referrable_id + `'`;
}

module.exports = { destroy, index, store, update, updateStatus };
