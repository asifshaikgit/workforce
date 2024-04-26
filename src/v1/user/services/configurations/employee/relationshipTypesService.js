const moment = require('moment');
const { event } = require('../../../../../../events/configurationActivityEvent');
const indexRepository = require('../../../repositories/index');
const format = require('../../../../../../helpers/format');

/**
 * Index Function to get relationship type data.
 * 
 * Logic:
 * - Fetch the data from the 'relationship_types' table using condition(param) by calling common find function.
 *  - If data exists,
 *   + Iterate the loop and push to an object 
 *   + Prepare the response 
 *   + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {any} condition - The condition to filter the relationship types.
 * @returns {Promise<{status: boolean, data: any}>} - A promise that resolves to an object containing the status and data of the retrieved relationship types.
 */
const index = async (condition) => {
  const relationshipType = await indexRepository.find('relationship_types', ['id', 'name', 'is_active'], condition);
  if (relationshipType.status === true) {
    /* variables */
    const responseData = [];
    const totalDetails = relationshipType.data;
    /* variables */

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        id: item.id,
        name: item.name,
        is_active: item.is_active,
      };
      responseData.push(listingObject);
    }

    return { status: true, data: responseData[0] };
  } else {
    return relationshipType;
  }
};

/**
 * Listing Function to get relationship type data.
 * Logic:
 * - Fetch the data from the 'relationship_types' table using condition(param) by calling common findByPagination function.
 *  - If data exists,
 *    + loop the data and push the object in to an array and add serial number to the object 
 *    + Prepare the response 
 *    - Fetch the data from the 'configuration_activity_track table using common find function.
 *    - looping the activity data and push it in to an array and returning in response
 *    + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {object} condition - The conditions to filter the listing.
 * @param {number} page - The page number of the listing.
 * @param {number} limit - The maximum number of items per page.
 * @param {string} sortColumn - The column to sort the listing by.
 * @param {string} sortOrder - The order to sort the listing in (asc or desc).
 * @returns {object} An object containing the paginated listing data, activity data, and pagination details.
 */
const listing = async (condition, page, limit, sortColumn, sortOrder) => {
  /* Default variables */
  const tableName = 'relationship_types';
  const fields = ['relationship_types.*', 'create.display_name as create_emp', 'update.display_name as updated_emp'];
  const joins = [
    { table: 'employee as create', alias: 'create', condition: ['relationship_types.created_by', 'create.id'], type: 'left', ignoreDeletedAt: true },
    { table: 'employee as update', alias: 'update', condition: ['relationship_types.updated_by', 'update.id'], type: 'left', ignoreDeletedAt: true },
  ];
  /* Default variables */

  const relationships = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit, sortColumn, sortOrder);
  if (relationships.status === true) {
    /* variables */
    const responseData = [];
    const totalDetails = relationships.data;
    const paginationDetails = relationships.pagination;
    /* variables */

    let serialNo = (page - 1) * limit + 1;
    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        serial_no: serialNo,
        id: item.id,
        name: item.name,
        is_active: item.is_active,
        created_by: (item.create_emp !== null ? item.create_emp : 'System'),
        updated_by: (item.updated_emp !== null ? item.updated_emp : ''),
      };
      serialNo++;
      responseData.push(listingObject);
    }

    /* prepare the response */

    return { status: true, data: responseData, pagination_data: paginationDetails };
  } else {
    return relationships;
  }
};

/**
 * Store Function to save relationship type data.
 * 
 * Logic:
 * - Prepare relationship type data object.
 * - Store the relationship type data into 'relationship_types' table. 
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the relationship type activity
 * - Return the result of the relationship type data storage.
 * 
 * @param {Object} body - The body of the request containing the details of the new relationship type.
 * @param {string} body.name - The name of the relationship type.
 * @param {boolean} body.is_active - Indicates whether the relationship type is active or not.
 * @param {string} body.created_by - The user who created the relationship type.
 * @returns {Promise<Object>} - A promise that resolves to the list of relationship types after the new one is stored.
 */
const store = async (body) => {

  /* Creating store entry object */
  const newRelationshipsType = {
    name: body.name,
    is_active: body.is_active,
    description: body?.description || null,
    created_by: body.created_by,
    created_at: new Date(),
  };
  /* Creating store entry object */

  // Storing the relationship type into 'relationship_types' table
  const relationshipsTypeList = await indexRepository.store('relationship_types', newRelationshipsType);

  /**Activity track */
  const activity = {
    referrable_id: relationshipsTypeList.data[0].id,
    referrable_type: 5,
    action_type: 1,
    created_by: body.created_by,
  };
  event.emit('configurationStoreActivity', { activity });
  /**Activity track */
  return relationshipsTypeList;
};

/**
 * update Function to update relationship type data.
 * 
 * Logic:
 * - Prepare relationship type data object.
 * - update the relationship type data into 'relationship_types' table from the condition in params. 
 * - fetch the relationship type details before and after the the update for activity track
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the relationship type activity
 * 
 * @param {Object} body - The data to update the record with.
 * @param {Object} condition - The condition for the data.
 * @returns {Promise<Object>} - A promise that resolves to the response from the update operation.
 * @throws {Error} - If there is an error during the update operation.
 */
const update = async (body, condition) => {

  /* Creating update entry object */
  const updateData = {
    name: body.name,
    is_active: body.is_active,
    description: body?.description || null,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /**Fetching relationship type data before update */
  const beforeData = await indexRepository.find('relationship_types', ['*'], condition);
  const beforeUpdateData = {
    'Name': beforeData.data[0].name,
    'Description': beforeData.data[0].description,
    'Status': beforeData.data[0].is_active === true ? 'Active' : 'In-active',
  };
  /**Fetching relationship type data before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *    Update the record into 'relationship_types' table with given condition
  */
  const repositoryResponse = await indexRepository.update('relationship_types', condition, updateData);

  /**Fetching relationship type data after update */
  const afterData = await indexRepository.find('relationship_types', ['*'], condition);
  const afterUpdateData = {
    'Name': afterData.data[0].name,
    'Description': afterData.data[0].description,
    'Status': afterData.data[0].is_active === true ? 'Active' : 'In-active',
  };
  /**Fetching relationship type data after update */

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 5,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */
  return repositoryResponse;
};

/**
 * Destroy Function to delete relationship type data.
 * 
 * Logic:
 * - Prepare the condition for data deletion.
 * - Delete the relationship type data from 'relationship_types' table. 
 * - Prepare the activity object to send to the activity
 * - Trigger the activity event to store the relationship type activity
 * - Return the result of the relationship type data deletion.
 * 
 * @param {Object} body - The request body containing the relationship type details.
 * @param {Object} condition - The condition for the data.
 * @returns {Promise<Object>} - A promise that
 */
const destroy = async (body, condition) => {

  var updateData = {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by
  };

  await indexRepository.update('relationship_types', condition, updateData);

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 5,
    action_type: 3,
    created_by: body.created_by,
  };
  event.emit('configurationDeleteActivity', activity);
  /**Activity track */
}

/**
 * Updates the status of a relationship type based on the provided body data and condition.
 * - Constructs an update entry object with the provided body data.
 * - Retrieves the relationship types details before the update operation.
 * - Calls the update function in the repository with the provided condition and update data.
 * - Retrieves the relationship types details after the update operation.
 * - Generates an activity track for the update operation.
 * - Returns the response from the repository update function.
 *
 * @param {Object} body - Object containing the updated relationship type data.
 * @param {Object} condition - Condition to identify the relationship type to update.
 * @returns {Object} - Response from the repository update function.
 */
const updateStatus = async (body, condition) => {

  /* Creating update entry object */
  const updateData = {
    is_active: body.is_active,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /**Fetching relationship type data before update */
  const beforeData = await indexRepository.find('relationship_types', ['*'], condition);
  const beforeUpdateData = {
    'Name': beforeData.data[0].name,
    'Description': beforeData.data[0].description,
    'Status': beforeData.data[0].is_active === true ? 'Active' : 'In-active',
  };
  /**Fetching relationship type data before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
  */
  const repositoryResponse = await indexRepository.update('relationship_types', condition, updateData);

  /**Fetching relationship type data after update */
  const afterData = await indexRepository.find('relationship_types', ['*'], condition);
  const afterUpdateData = {
    'Name': afterData.data[0].name,
    'Description': afterData.data[0].description,
    'Status': afterData.data[0].is_active === true ? 'Active' : 'In-active',
  };
  /**Fetching relationship type data after update */

  /**Fetching relationship types details after update */

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 5,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

  return repositoryResponse;
};

module.exports = { index, listing, store, update, destroy, updateStatus };
