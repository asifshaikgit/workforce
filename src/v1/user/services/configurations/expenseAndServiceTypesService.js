const { event } = require('../../../../../events/configurationActivityEvent');
const moment = require('moment');
const indexRepository = require('../../repositories/index');
const format = require('../../../../../helpers/format');
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');

/**
 * Store function to create a new Self-Service Type entry.
 * 
 * Logic:
 * - Initiate a database connection using 'getConnection()'.
 * - Initiate a database transaction ('db.transaction') to ensure data integrity
 * - Create an array 'assigneeBody' for assignee employee IDs from the request body.
 * - Create a new object 'newSelfServiceType' with properties from the request body.
 * - Call the store repository function to add the 'newSelfServiceTypes' to the 'self_service_types' table within the transaction.
 * - If assignee employee IDs are provided in the request body
 *    ~ create new assignee entries in the 'self_service_assignee_employees' table for each assignee.
 * - Commit the database transaction if all database operations are successful.
 * - Track the creation activity for the Self-Service Type.
 * - Emit an event to log the activity.
 * - Return the response from the repository.
*  Note :
 *    - Exception Handiling using try-catch
 *    - If Any exception raised 
 *        ~ Rollback the all database operation using 'trx.rollback()'   
 *    
 * @param {Object} body - The request body containing Self-Service Type details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {
  let trx;
  try {
    //databse connection
    const db = await getConnection();
    trx = await db.transaction()
    //databse connection

    /* Creating new object */
    const newSelfServiceTypes = {
      name: body.name,
      referrable_type : body.entity_type == 'employee-self-service-types' ? 1 : 2,
      is_active: body.is_active,
      description: body?.description  || null,
      created_by: body.created_by,
      created_at: new Date(),
    };
    /* Creating new object */

    /**
       *  + Call the store repository function
       *    -Based on the status in store function response, segregate the response and prepare the response
      */
    const repositoryResponse = await transactionRepository.store(trx, 'expense_and_service_types', newSelfServiceTypes);
    if (body.assignee_employee_ids.length > 0) {
      for (const key in body.assignee_employee_ids) {
        const newAssignee = {
          referrable_type : body.entity_type == 'employee-self-service-types' ? 1 : 2,
          referrable_id: repositoryResponse.data[0].id,
          employee_id: body.assignee_employee_ids[key].employee_id,
          created_by: body.created_by,
        };
        await transactionRepository.store(trx, 'assignee_employees', newAssignee);
      }
    }

    // Commit the transaction
    await trx.commit();
    // Commit the transaction

    /**Actiivty track */
    const activity = {
      referrable_id: repositoryResponse.data[0].id,
      referrable_type: body.entity_type == 'employee-self-service-types' ? 17 : 25,
      action_type: 1,
      created_by: body.created_by,
    };
    event.emit('configurationStoreActivity', {activity});
    /**Activty track */

    return repositoryResponse;
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

/**
 * Update function to modify an existing Self-Service Type entry.
 * 
 * Logic:
 * - Initiate a database connection using 'getConnection()'.
 * - Initiate a database transaction ('db.transaction') to ensure data integrity.
 * - Create an array 'assigneeBody' for assignee employee IDs from the request body.
 * - Create a new object 'updateData' containing properties based on the request body for updating the Self-Service Type.
 * - Retrieve the Self-Service Type details before the update ('beforeUpdateData').
 * - Call the update repository function within the transaction to modify the 'self_service_types' table.
 * - Remove existing assignee entries related to the Self-Service Type within the transaction.
 * - If the update is successful, 
 *    ~ create new assignee entries in the 'self_service_assignee_employees' table for each assignee within the transaction.
 * - Commit the database transaction if all database operations are successful.
 * - Retrieve the Self-Service Type details after the update ('afterUpdateData').
 * - Track the update activity for the Self-Service Type and emit an event to log the activity.
 * - Return the response from the repository.
 * 
 *  Note :
 *    - Exception Handling using try-catch
 *    - If Any exception is raised 
 *        ~ Rollback all database operations using 'trx.rollback()'
 *     
 * @param {Object} body - The request body containing Self-Service Type details to be updated.
 * @param {Object} condition - The condition to identify the Self-Service Type entry to be updated.
 * @returns {Object} Repository response.
 */
const update = async (body, condition) => {
  let trx;
  try {
    //databse connection
    const db = await getConnection();
    trx = await db.transaction()
    //databse connection

    const referrableType = body.entity_type === 'employee-self-service-types' ? 1 : 2;

    /* Creating update entry object */
    const updateData = {
      name: body.name,
      referrable_type : referrableType,
      is_active: body.is_active,
      description: body?.description  || null,
      updated_by: body.updated_by,
      updated_at: new Date(),
    };
    /* Creating update entry object */

    /**Fetching self service type details before update */
    const beforeUpdateData = await getSelfServiceTypes(condition)
    /**Fetching self service type details before update */

    /**
     *  + Call the update repository function
     *    -Based on the status in update function response, segregate the response and prepare the response
     *
    */
    const repositoryResponse = await transactionRepository.update(trx, 'expense_and_service_types', condition, updateData);

    await transactionRepository.destroy(trx, 'assignee_employees', {referrable_id: body.id,referrable_type: referrableType});

    if (repositoryResponse.status) {
      for (const key in body.assignee_employee_ids) {
        const newAssignee = {
          referrable_type : referrableType,
          referrable_id: repositoryResponse.data[0].id,
          employee_id: body.assignee_employee_ids[key].employee_id,
          created_by: body.created_by,
        };
        await transactionRepository.store(trx, 'assignee_employees', newAssignee);
      }
    }

    // Commit the transaction
    await trx.commit();
    // Commit the transaction

    /**Fetching self service type details after update */
    const afterUpdateData = await getSelfServiceTypes(condition)
    /**Fetching self service type details after update */

    /**Activity track */
    const activity = {
      referrable_id: condition.id,
      referrable_type: body.entity_type == 'employee-self-service-types' ? 17 : 25,
      action_type: 2,
      created_by: body.created_by,
    };

    event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
    /**Activity track */

    return repositoryResponse;
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

/**
 * Update function to modify the 'is_active' status of a Self-Service Type entry.
 * 
 * Logic:
 * - Create an 'updateData' object with the properties to update the 'is_active' status in the Self-Service Type entry.
 * - Retrieve the Self-Service Type details before the update ('beforeUpdateData').
 * - Call the update repository function to update the 'self_service_types' table with the provided condition and 'updateData'.
 * - Retrieve the Self-Service Type details after the update ('afterUpdateData').
 * - Track the update activity for the Self-Service Type 
 * - emit an event to log the activity.
 * - Return the response from the repository.
 * 
 * @param {Object} body - The request body containing the 'is_active' status to be updated.
 * @param {Object} condition - The condition to identify the Self-Service Type entry to be updated.
 * @returns {Object} Repository response.
 */
const updateStatus = async (body, condition) => {

  /* Creating new object */
  const updateData = {
    is_active: body.is_active,
    updated_at: new Date(),
    updated_by: body.updated_by,
  };
  /* Creating new object */

  /**Fetching self service type details before update */
  const beforeUpdateData = await getSelfServiceTypes(condition)
  /**Fetching self service type details before update */

  const selfServiceTypeData = await indexRepository.update('expense_and_service_types', condition, updateData);

  /**Fetching self service type details after update */
  const afterUpdateData = await getSelfServiceTypes(condition)
  /**Fetching self service type details after update */

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: body.entity_type == 'employee-self-service-types' ? 17 : 25,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

  return selfServiceTypeData
};

/**
 * Retrieve Self-Service Type details based on the provided condition.
 * 
 * Logic:
 * - Call the repository function to retrieve Self-Service Type data from the 'self_service_types' table based on the provided condition.
 * - Retrieve the names of assignee employees for the Self-Service Type.
 * - Prepare a response object with relevant details:
 *    - Name of the Self-Service Type
 *    - Description of the Self-Service Type
 *    - Assigned To: Names of assignee employees
 *    - Status: 'Active' if the Self-Service Type is active, 'In-active' otherwise
 * - Return the response object with Self-Service Type details.
 * 
 * @param {Object} condition - The condition to identify the Self-Service Type entry.
 * @returns {Object} Response object containing Self-Service Type details.
 */
const getSelfServiceTypes = async (condition) => {

  const selfServiceTypeData = await indexRepository.find('expense_and_service_types', ['*'], condition);

  let joins = [{ table: 'assignee_employees as ae', alias: 'ae', condition: ['ae.employee_id', 'employee.id'], type: 'left', ignoreDeletedAt: true }]

  var beforeDataEmployeeNames = await indexRepository.find('employee', ['display_name'], { 'ae.referrable_id': selfServiceTypeData.data[0].id }, null, joins);
  var employeeNames = beforeDataEmployeeNames.data.map(obj => obj.display_name);

  const responseData = {
    'Name': selfServiceTypeData.data[0].name,
    'Description': selfServiceTypeData.data[0].description,
    'Assignees': employeeNames,
    'Status': selfServiceTypeData.data[0].is_active ? 'Active' : 'In-active',
  };

  return responseData
}

/**
 * Listing function to retrieve a paginated list of Self-Service Types with activity track.
 * 
 * Logic:
 * - Set default variables for the table name, fields, and joins.
 * - Use the repository function to fetch Self-Service Types data from the 'self_service_types' table based on the provided condition, page, and limit.
 * - If data exists:
 *   + Create an empty array 'responseData'.
 *   + Map the repository response data to 'totalDetails'.
 *   + Map the pagination details to 'paginationDetails'.
 *   + Iterate over 'totalDetails' and create a 'listingObject' object with response data.
 *   + Push the 'listingObject' object to the 'responseData' array.
 *   + For each Self-Service Type, retrieve assignee details and assignee employee names.
 *   + Prepare 'assignees' array with assignee details.
 *   + Call the repository find function to fetch activity track data from 'configuration_activity_track' table based on condition('configuration_type' is 5, 'configuration_sub_module' is 'self-service-types').
 *   + Map the activity track response data to 'filteredActivities'.
 *   + Create an empty array 'transformedActivity'.
 *   + Iterate over 'filteredActivities' and for each iteration, call the repository find function to get employee_name from the 'employee' table based on 'id' (filteredActivities[key].created_by).
 *   + Prepare 'activityObject' object using 'filteredActivities' data.
 *   + Push 'activityObject' object to the 'transformedActivity' array.
 *   + Return the response object with status true, responseData, transformedActivity, and paginationDetails.
 * - If data doesn't exist, 
 *   + Return the response object with status false, empty data, transformedActivity, and paginationDetails.
 *    
 * @param {Object} condition - The conditions to filter Self-Service Types.
 * @param {number} page - The page number for paginating results.
 * @param {number} limit - The number of items per page.
 * @returns {Object} Response with paginated Self-Service Type details and activity logs.
 */
const listing = async (condition, page, limit) => {
  
  /* variables */
  const tableName = 'expense_and_service_types';
  const fields = ['expense_and_service_types.*', 'create.display_name as create_emp', 'update.display_name as updated_emp'];
  const joins = [
    { table: 'employee as create', alias: 'create', condition: ['expense_and_service_types.created_by', 'create.id'], type: 'left', ignoreDeletedAt: true },
    { table: 'employee as update', alias: 'update', condition: ['expense_and_service_types.updated_by', 'update.id'], type: 'left', ignoreDeletedAt: true },
  ];
  /* variables */
  const userList = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit);
  if (userList.status) {
    /* variables */
    const responseData = [];
    const totalDetails = userList.data;
    const paginationDetails = userList.pagination;
    /* variables */

    let serialNo = (page - 1) * limit + 1;
    for (const key in totalDetails) {
      const item = totalDetails[key]; 
      /* variables */
      const tableName = 'assignee_employees';
      const fields = [ 'assignee_employees.id' , 'assignee_employees.employee_id', 'employee.display_name as employee_name'];
      const joins = [
        { table: 'employee', condition: ['assignee_employees.employee_id', 'employee.id'], type: 'left' },
      ];
      /* variables */
      const assigneeData = await indexRepository.find(tableName, fields, { referrable_id: item.id, referrable_type : condition.referrable_type  }, null, joins, null, 'assignee_employees.id', 'asc', false);
      let assignees = [];
      if (assigneeData.status) {
        assignees = assigneeData.data;
      }
      const listingObject = {
        serial_no: serialNo,
        id: item.id,
        name: item.name,
        is_active: item.is_active,
        is_editable: item.is_editable,
        assignee_employee_ids: assignees,
        description: (item.description !== null ? item.description : ''),
        created_by: (item.create_emp !== null ? item.create_emp : 'System'),
        updated_by: (item.updated_emp !== null ? item.updated_emp : ''),
      };
      serialNo++;
      responseData.push(listingObject);
    }
    /* using promise to wait till the map function completes. */

    // /* prepare the response */

    return { status: true, data: responseData, pagination_data: paginationDetails };
  } else {
    return { status: false, data: [], activity: [], pagination_data: userList.pagination };
  }
};

/**
 * Index function to retrieve a list of Self-Service Types based on the provided condition.
 * 
 * Logic:
 * - Fetch Self-Service Types data from the 'self_service_types' table based on the provided condition.
 * - If data exists:
 *   + Create an empty array 'responseData'.
 *   + Iterate over 'totalDetails' and create a 'listingObject' object for each Self-Service Type.
 *   + For each Self-Service Type, retrieve assignee details and assignee employee names from 'employees' table.
 *   + Prepare 'assignees' array with assignee details.
 *   + Push the 'listingObject' object to the 'responseData' array.
 *   + Return the response object with status true and responseData.
 * - If data doesn't exist
 *   + return the repository response 'selfServiceTypes'.
 *    
 * @param {Object} condition - The conditions to filter Self-Service Types.
 * @returns {Object} Response with a list of Self-Service Types and their details.
 */
const index = async (condition) => {
  const selfServiceTypes = await indexRepository.find('expense_and_service_types', ['id', 'name', 'description', 'is_active', 'is_editable'], condition);
  if (selfServiceTypes.status) {
    /* variables */
    const responseData = [];
    const totalDetails = selfServiceTypes.data;
    /* variables */

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      /* variables */
      const tableName = 'assignee_employees';
      const fields = ['assignee_employees.id', 'assignee_employees.employee_id', 'employee.display_name as employee_name'];
      const joins = [
        { table: 'employee', condition: ['assignee_employees.employee_id', 'employee.id'], type: 'left' },
      ];
      /* variables */
      condition = { referrable_id: item.id, referrable_type : condition.referrable_type };
      const assigneeData = await indexRepository.find(tableName, fields, condition, 0, joins, null, 'assignee_employees.id', 'asc', false);
      let assinees = [];
      if (assigneeData.status) {
        assinees = assigneeData.data;
      }
      const listingObject = {
        id: item.id,
        name: item.name,
        description: (item.description !== null ? item.description : ''),
        is_active: item.is_active,
        is_editable: item.is_editable,
        assignee_employee_ids: assinees,
      };
      responseData.push(listingObject);
    }

    return { status: true, data: responseData };
  } else {
    return selfServiceTypes;
  }
};

/**
 * Soft-delete operation to delete a Self-Service Type based on specified conditions.
 * 
 * Logic:
 * - Perform a soft-delete operation on the 'self_service_types' table based on the specified conditions.
 * - Create an 'activity' object to log the deletion action in the configuration activity track.
 * - Emit an event to capture and track the deletion activity.
 * 
 * @param {Object} body - The request body containing parameters to identify the Self-Service Type to be deleted.
 * @param {Object} condition - The conditions to specify which Self-Service Type to delete.
 */
const destroy = async (body, condition) => {

  var updateData = {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by
  };

  await indexRepository.update('expense_and_service_types', condition, updateData);  

  // Create a new object with the modified key name id as referrable_id 
  const newCondition = {referrable_id: condition.id,referrable_type: condition.referrable_type};
  await indexRepository.update('assignee_employees', newCondition, updateData);  

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: body.entity_type == 'employee-self-service-types' ? 17 : 25,
    action_type: 3,
    created_by: body.created_by,
  };
  event.emit('configurationDeleteActivity', activity);
  /**Activity track */
}

module.exports = { index, listing, store, update, destroy, updateStatus };
