const { event } = require('../../../../../../events/configurationActivityEvent');
const indexRepository = require('../../../repositories/index');
const { getSkillsData } = require('../commonService');

/**
 * Index Function to get skill data.
 * 
 * Logic:
 * - Fetch the data from the 'skills' table using condition(param) by calling common find function.
 *  - If data exists,
 *   + Iterate the loop and push to an object 
 *   + Prepare the response 
 *   + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {object} condition
 * @return Json
 *
 */
const index = async (condition) => {
  /**
   * Calling a index function.
   * Based on the status in the function response, prepare the response and return to controller
   *
  */
  const skill = await indexRepository.find('skills', ['*'], condition);
  if (skill.status === true) {
    /* variables */
    const responseData = [];
    const totalDetails = skill.data;
    /* variables */

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        id: item.id,
        name: item.name,
        description: (item.description !== null ? item.description : ''),
        is_active: item.is_active,
        is_editable: item.is_editable,
      };
      responseData.push(listingObject);
    }

    return { status: true, data: responseData[0] };
  } else {
    return skill;
  }
};

/**
 * Listing Function to get skill data.
 * Logic:
 * - Fetch the data from the 'skills' table using condition(param) by calling common findByPagination function.
 *  - If data exists,
 *    + loop the data and push the object in to an array and add serial number to the object 
 *    + Prepare the response 
 *    - Fetch the data from the 'configuration_activity_track table using common find function.
 *    - looping the activity data and push it in to an array and returning in response
 *    + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 *
 * @param {object} condition - The condition to filter the skills by.
 * @param {number} page - The page number of the results to retrieve.
 * @param {number} limit - The maximum number of results per page.
 * @param {string} sortColumn - The page number of the results to retrieve.
 * @param {string} sortOrder - The maximum number of results per page.
 * @returns {object} - An object containing the status, data, and pagination details of the retrieved skills.
 * @return Json
 *
 */
const listing = async (condition, page, limit, sortColumn, sortOrder) => {
  /* Default variables */
  const tableName = 'skills';
  const fields = ['skills.*', 'create.display_name as create_emp', 'update.display_name as updated_emp'];
  const joins = [
    { table: 'employee as create', alias: 'create', condition: ['skills.created_by', 'create.id'], type: 'left' },
    { table: 'employee as update', alias: 'update', condition: ['skills.updated_by', 'update.id'], type: 'left' },
  ];
  /* Default variables */
  const skills = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit, sortColumn, sortOrder);

  if (skills.status === true) {
    /* variables */
    const responseData = [];
    const totalDetails = skills.data;
    const paginationDetails = skills.pagination;
    /* variables */

    let serialNo = (page - 1) * limit + 1;
    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        serial_no: serialNo,
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        description: (item.description !== null ? item.description : ''),
        is_active: item.is_active,
        is_editable: item.is_editable,
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
    return skills;
  }
};

/**
 * Store Function to save skill data.
 * 
 * Logic:
 * - Prepare skill data object.
 * - Store the skill data into 'skills' table. 
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the skill activity
 * - Return the result of the skill data storage.
 * 
 * @param {object} body
 * @return Json
 */
const store = async (body) => {

  /* Creating store entry object */
  const newSkill = {
    name: body.name,
    description: body.description,
    is_active: body.is_active,
    created_by: body.created_by,
    created_at: new Date()
  };
  /* Creating store entry object */

  const skillList = await indexRepository.store('skills', newSkill);

  /**Activity track */
  // Create ChangeLog Object
  const changeLog = [
    {
      'label_name': 'name',
      'value': body.name,
      'action_by': body.created_by
    }
  ];
  const activity = {
    referrable_id: skillList.data[0].id,
    referrable_type: 6,
    action_type: 1,
    created_by: body.created_by,
    change_log: JSON.stringify(changeLog)
  };
  event.emit('configurationStoreActivity', { activity });
  /**Activity track */
  return skillList;
};

/**
 * update Function to update skill data.
 * 
 * Logic:
 * - Prepare skill data object.
 * - update the skill data into 'skills' table from the condition in params. 
 * - fetch the skill details before and after the the update for activity track
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the skill activity
 * - Return the result of the skill data update.
 *
 *
 * @param {object} body
 * @return Json
 *
 */
const update = async (body, condition) => {

  /* Creating update entry object */
  const updateData = {
    name: body.name,
    is_active: body.is_active,
    description: body.description,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /**Fetching skill details before update */
  const beforeUpdateData = await getSkillsData(condition)
  /**Fetching skill details before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
  */
  const repositoryResponse = await indexRepository.update('skills', condition, updateData);

  /**Acitivity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 6,
    action_type: 2,
    created_by: body.created_by,
    slug: 'skills'
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData });
  /**Acitivity track */

  return repositoryResponse;
};

/**
 * update-status Function to update skill data.
 * 
 * Logic:
 * - Prepare skill data object.
 * - update the skill data into 'skills' table from the condition in params. 
 * - fetch the skill details before and after the the update for activity track
 * - Prepare the activity object to send to the activity
 * - trigger the activity event to store the skill activity
 * - Return the result of the skill data update.
 * 
 *
 * @param {object} body
 * @return Json
 *
 */
const updateStatus = async (body, condition) => {

  /* Creating update entry object */
  const updateData = {
    is_active: body.is_active,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /**Fetching skill details before update */
  const beforeUpdateData = await getSkillsData(condition)
  /**Fetching skill details before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
  */
  const repositoryResponse = await indexRepository.update('skills', condition, updateData);

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 6,
    action_type: 2,
    created_by: body.created_by,
    slug: 'skills'
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData });
  /**Activity track */

  return repositoryResponse;
};

/**
 * Destroy Function to delete skill data.
 * 
 * Logic:
 * - Prepare the condition for data deletion.
 * - Delete the skill data from 'skills' table. 
 * - Prepare the activity object to send to the activity
 * - Trigger the activity event to store the skill activity
 * - Return the result of the skill data deletion.
 * 
 * @param {Object} body - The request body containing the skill details.
 * @param {Object} condition - The condition for the data.
 * @returns {Promise<Object>} - A promise that
 */
const destroy = async (body, condition) => {

  var updateData = {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by
  };

  await indexRepository.update('skills', condition, updateData);

  /**Activity track */
  // Create Change Log
  const change_log = [
    {
      'label_name': 'name',
      'value': body.name,
      'action_by': body.created_by
    }
  ];
  const activity = {
    referrable_id: condition.id,
    referrable_type: 6,
    action_type: 3,
    created_by: body.created_by, 
    change_log: JSON.stringify(change_log)
  };
  event.emit('configurationDeleteActivity', activity);
  /**Activity track */
}

module.exports = { index, listing, store, update, updateStatus, destroy };
