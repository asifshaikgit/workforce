const indexRepository = require('../../repositories/index');
const transactionRepository = require('../../repositories/transactionRepository');
const { getConnection } = require('../../../../middlewares/connectionManager');
const { event } = require('../../../../../events/configurationActivityEvent');


/**
 * Index Function to get approval data.
 * 
 * Logic:
 * - Fetch the data from the 'approval_settings' table using condition(param) by calling common find function.
 *  - If data exists,
 *   + Iterate the loop , define an object and push into the loop 
 *   + define the condition from the data in the loop
 *   + Fetch the data from 'approval_levels' table from the above defined condition
 *   + If data exists
 *   + Iterate the loop and define an object and push the object in to an array
 *   + Prepare the response 
 *   + return the response with status as true
 * 
 *
 * @param {object} condition
 * @return Json
 *
 */
const index = async (condition) => {
  /* Default variables */
  const tableName = 'approval_settings';
  const fields = ['approval_settings.*', 'create.display_name as create_emp', 'update.display_name as updated_emp'];
  const joins = [
    { table: 'employee as create', alias: 'create', condition: ['approval_settings.created_by', 'create.id'], type: 'left', ignoreDeletedAt: true },
    { table: 'employee as update', alias: 'update', condition: ['approval_settings.updated_by', 'update.id'], type: 'left', ignoreDeletedAt: true },
  ];
  /* Default variables */
  const approvalConfigurations = await indexRepository.find(tableName, fields, condition, 0, joins);
  if (approvalConfigurations.status === true) {
    /* letiables */

    const responseData = [];
    const totalDetails = approvalConfigurations.data;
    /* letiables */

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      /* Default variables */
      const tableName = 'approval_levels';
      const fields = ['approval_users.id as id', 'approval_users.approver_id as employee_id', 'employee.display_name as full_name', 'approval_levels.level as rank', 'approval_levels.id as rank_id', 'employee.email_id as email_id'];
      const joins = [
        { table: 'approval_users', condition: ['approval_users.approval_level_id', 'approval_levels.id'], type: 'left' },
        { table: 'employee', condition: ['approval_users.approver_id', 'employee.id'], type: 'left' }
      ];
      /* Default variables */
      const approversData = await indexRepository.find(tableName, fields, { approval_setting_id: item.id }, 0, joins);
      const appr = [];
      const listingObject = {
        id: item.id,
        is_global: item.is_global,
        approval_module: item.approval_module,
      };
      if (approversData.status) {
        const groupToValues = approversData.data.reduce(function (obj, item) {
          obj[item.rank] = obj[item.rank] || [];
          obj[item.rank].push({ rank_id: item.rank_id, id: item.id, employee_id: item.employee_id, full_name: item.full_name });
          return obj;
        }, {});

        const app = Object.keys(groupToValues).map(function (key) {
          return { rank: key, approvers_id: groupToValues[key] };
        });

        for (const obj in app) {
          const temp = {
            id: app[obj].approvers_id[0].rank_id,
            rank: app[obj].rank,
          };
          const arr = [];
          for (const key in app[obj].approvers_id) {
            arr.push({
              id: app[obj].approvers_id[key].id,
              employee_id: app[obj].approvers_id[key].employee_id,
              full_name: app[obj].approvers_id[key].full_name,
            });
          }
          temp.approver_ids = arr;
          appr.push(temp);
        }
      }

      listingObject.approvals = appr;
      responseData.push(listingObject);
    }

    if (responseData.length > 0) {
      return { status: true, data: responseData };
    } else {
      return { status: false, data: responseData };
    }
  } else {
    return approvalConfigurations;
  }
};

/**
 * Store Function to save approval data.
 * 
 * Logic:
 * - We check if db exists in the params and assign the db to trx establishing database connection
 * - Prepare approval setting data object from the body.
 * - Store the approval data into 'approval_settings' table. 
 * - Prepare approval level data object from theloop of approvals array from body. 
 * - store the object in to 'approval_levels' and loop the object
 * - Prepare approval users data object from the loop of approval_users array in approval array from body. 
 * - store the object in to 'approval_users' and commit the transaction
 * - Track the creation activity for the Approval configuration.
 * - Emit an event to log the activity.
 * - Return the result of the approval setting data storage.
 * 
 * @param {Object} body - The request body containing the approval details.
 * @param {Object} db - The database connection.
 * @returns {Promise<Object>} - A promise that
 */
const store = async (body, db = null) => {
  let trx;
  try {
    //databse connection
    if (db == null) {
      const db = await getConnection();
      trx = await db.transaction()
    } else {
      trx = db
    }
    //databse connection

    /* Creating new object */
    const newapprovalSetting = {
      approval_module: body.approval_module,
      is_global: body.is_global,
      approval_count: body.approval_count,
      created_by: body.created_by,
      created_at: new Date(),
    };
    /* Creating new object */
    const approvalSettingsId = await transactionRepository.store(trx, 'approval_settings', newapprovalSetting);

    //looping the objects in approval array
    for (const key in body.approvals) {

      /* Creating new object */
      const approvalLevelObject = {
        approval_setting_id: approvalSettingsId.data[0].id,
        level: body.approvals[key].rank,
        created_by: body.created_by,
        created_at: new Date(),
      };
      /* Creating new object */

      const approvalLevelId = await transactionRepository.store(trx, 'approval_levels', approvalLevelObject);

      // looping the approval_users objects in approvals array
      for (const subKey in body.approvals[key].approver_ids) {

        /* Creating new object */
        const approvalUserObject = {
          approval_level_id: approvalLevelId.data[0].id,
          approver_id: body.approvals[key].approver_ids[subKey].employee_id,
          created_by: body.created_by,
          created_at: new Date(),
        };
        /* Creating new object */

       await transactionRepository.store(trx, 'approval_users', approvalUserObject);
      }
    }
    if (db == null) {
      // Commit the transaction
      await trx.commit();
      // Commit the transaction
    }

      /**Actiivty track */
      const activity = {
        referrable_id: approvalSettingsId.data[0].id,
        referrable_type: body.approval_module == 1 ? 20 : 29,
        action_type: 1,
        created_by: body.created_by,
      };
      event.emit('configurationStoreActivity', {activity});
      /**Actiivty track */
    return approvalSettingsId.data[0];
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

/**
 * Store Function to update approval data.
 * 
 * Logic:
 * - We check if db exists in the params and assign the db to trx establishing database connection
 * - Prepare approval setting data object from the body.
 * - Update the approval data into 'approval_settings' table fro the condition in params.
 * - loop the approvals from the body in params
 * - if the id from the object in approvals exist update the object defined above using the condition defined ablve from the data in the loop in to 'approval_levels' table and loop the objects in approval users array and store the object if the id does not exist in approval users array objects in to 'approval_users' table    
 * - else store new entry in to 'approval_levels' table from the object defined above and loop the objects in approval users array and store the object into 'approval_users' table     
 * - if delete_user_ids array length greater than 0, loop the array update the object using the condition defined from the loop data in 'approval_users' table.
 * - if delete_approval_level_ids array length greater than 0, loop the array update the object using the condition defined from the loop data in 'approval_levels' table and update the object using the condition defined from the loop data in 'approval_users' table
 * commit the transaction
 * - Track the creation activity for the Approval configuration.
 * - Emit an event to log the activity.
 * - Return the result of the approval setting data update.

 * @param {object} body - the body send in the params
 * @param {object} db - the database to be updated
 * @param {object} condition1 - condition send in params
 * @return Json
 *
 */
const update = async (body, db = null, condition1) => {
  let trx;
  try {
    //databse connection
    if (db == null) {
      const db = await getConnection();
      trx = await db.transaction()
    } else {
      trx = db
    }
    //databse connection
    // get Approval Config before data
    var beforeDataQuery = await getApprovalDataQuery(condition1.id);
    var beforeUpdateData = await indexRepository.rawQuery(beforeDataQuery);
    beforeUpdateData = beforeUpdateData[0];

    /* Creating update entry object */
    const updateapprovalSetting = {
      approval_module: body.approval_module,
      approval_count: body.approval_count,
      updated_by: body.updated_by,
      updated_at: new Date(),
    };
    await transactionRepository.update(trx, 'approval_settings', condition1, updateapprovalSetting);


    // Update or creating the approval levels information
    const approvals = body.approvals;
    for (const key in approvals) {
      // If key exists update the approval level information else insert the approval level information
      if (approvals[key].id !== undefined && approvals[key].id !== '') {
        const approvalLevelObject = {
          level: approvals[key].rank,
          updated_by: body.updated_by,
          updated_at: new Date(),
        };
        let condition = { id: approvals[key].id };
        await transactionRepository.update(trx, 'approval_levels', condition, approvalLevelObject);
        // After update the approval levels, insert the approval users information in approval users table
        for (const subKey in approvals[key].approver_ids) {
          if (approvals[key].approver_ids[subKey].id === null || approvals[key].approver_ids[subKey].id === '') {
            const approvalUsers = {
              approval_level_id: approvals[key].id,
              approver_id: approvals[key].approver_ids[subKey].employee_id,
              created_by: body.created_by,
              created_at: new Date(),
            };
            await transactionRepository.store(trx, 'approval_users', approvalUsers);
          }
        }
      } else {
        // Approval level users storing
        const newapprovalLevelObject = {
          level: approvals[key].rank,
          approval_setting_id: condition1.id,
          created_by: body.created_by,
          created_at: new Date(),
        };
        const approvalLevel = await transactionRepository.store(trx, 'approval_levels', newapprovalLevelObject);
        // After update the approval levels, insert the approval users information in approval users table
        for (const subKey in approvals[key].approver_ids) {
          const newapprovalLevelUserObject = {
            approval_level_id: approvalLevel.data[0].id,
            approver_id: approvals[key].approver_ids[subKey].employee_id,
            created_by: body.created_by,
            created_at: new Date(),
          };
          await transactionRepository.store(trx, 'approval_users', newapprovalLevelUserObject);
        }
      }
    }

    // Delete the approval users ids
    if (body.delete_user_ids && body.delete_user_ids.length > 0) {
      for (const key in body.delete_user_ids) {
        if (body.delete_user_ids[key] !== '') {
          const deleteUserObject = {
            deleted_at: new Date(),
          };
          await transactionRepository.update(trx, 'approval_users', { id: body.delete_user_ids[key] }, deleteUserObject);
        }
      }
    }

    // Delete the approval levels and its co responding the approval users in that level
    if (body.delete_approval_level_ids && body.delete_approval_level_ids.length > 0) {
      for (const key in body.delete_approval_level_ids) {
        if (body.delete_approval_level_ids[key] !== '') {
          /* Delete the approval level */
          let condition = {
            approval_setting_id: condition1.id,
            id: body.delete_approval_level_ids[key],
          };
          const deleteLevelData = {
            updated_by: body.updated_by,
            deleted_at: new Date(),
            updated_at: new Date(),
          };
          await transactionRepository.update(trx, 'approval_levels', condition, deleteLevelData, true);
          /* Delete the approval level */

          /* Delete the approval level users */
          condition = { approval_level_id: body.delete_approval_level_ids[key] };
          const deleteUserObject = {
            deleted_at: new Date(),
          };
          await transactionRepository.update(trx, 'approval_users', condition, deleteUserObject);
          /* Delete the approval level users */
        }
      }
    }
    if (db == null) {
      // Commit the transaction
      await trx.commit();
      // Commit the transaction
    }
      // get Approval config after data
      var afterDataQuery = await getApprovalDataQuery(condition1.id);
      var afterUpdateData = await indexRepository.rawQuery(afterDataQuery);
      afterUpdateData = afterUpdateData[0];

      /**Actiivty track */
      const activity = {
        referrable_id: condition1.id,
        referrable_type: body.approval_module == 1 ? 20 : 29,
        action_type: 2,
        created_by: body.created_by,
      };
      event.emit('configurationApprovalUpdateActivity', {activity, beforeUpdateData, afterUpdateData });
      /**Actiivty track */
    return true;
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

/**
 * Get Notification Data Query
 */
async function getApprovalDataQuery(approval_setting_id) {
  return "SELECT JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT('id', approval_levels.id,'Level ' || approval_levels.level || ' Approval', (SELECT JSONB_AGG(DISTINCT approval_users.approver_id) FROM approval_users WHERE approval_users.approval_level_id = approval_levels.id AND approval_users.deleted_at IS NULL))) as data FROM approval_levels WHERE approval_levels.approval_setting_id = '"+ approval_setting_id +"' AND approval_levels.deleted_at IS NULL";
}
// Delete the levels, users and setting of approval
const deleteSettingsAndMappedLevelUsers = async (body, db = null) => {
  let trx;
  try {
    //databse connection
    if (db == null) {
      const db = await getConnection();
      trx = await db.transaction()
    } else {
      trx = db
    }
    //databse connection
    // Delete Approval Settings
    var condition = { id: body.id }
    var deleteObj = {
      updated_by: body.updated_by,
      deleted_at: new Date()
    }
    await transactionRepository.update(trx, 'approval_settings', condition, deleteObj);

    // Delete Approval Levels
    var condition = {
      approval_setting_id: body.id,
    };
    var deleteLevelData = {
      updated_by: body.updated_by,
      deleted_at: new Date(),
      updated_at: new Date()
    }
    let deletedLevelIds = await transactionRepository.update(trx, 'approval_levels', condition, deleteLevelData);

    // Delete Approval Users
    for (let key in deletedLevelIds.data) {
      var condition = { approval_level_id: deletedLevelIds.data[key].id }
      var deleteUserObject = {
        deleted_at: new Date()
      };
      await transactionRepository.update(trx, 'approval_users', condition, deleteUserObject)
    }
    if (db == null) {
      // Commit the transaction
      await trx.commit();
      // Commit the transaction
    }
    return true;
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
}

module.exports = { index, store, update, deleteSettingsAndMappedLevelUsers };
