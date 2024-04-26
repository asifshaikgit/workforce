const indexRepository = require('../../../repositories/index');
const { event } = require('../../../../../../events/configurationActivityEvent');
const moment = require('moment');
const format = require('../../../../../../helpers/format');


/**
 * Create a Job Title in the system.
 * 
 * Logic:
 * - Create a new job title object
 * - Call the common store function to store the new job title deatils in the 'job_titles' table.
 * - Emit an event to track activity related to the creation of the job title.
 * - Return the response from the repository operation, indicating the success or failure of the creation.
 * 
 * @param {Object} body - Request body containing job title details.
 * @returns {Object} - A response object indicating the status of the creation process.
 */
const store = async (body) => {
  /* Creating new object */
  const newjobTitle = {
    name: body.name,
    is_active: body.is_active,
    description: body?.description || null,
    created_by: body.created_by,
    created_at: new Date(),
  };
  /* Creating new object */

  /**
   *  + Call the create repository function
   *    -Based on the status in create function response, segregate the response and prepare the response
   *
  */
  const jobTitle = await indexRepository.store('job_titles', newjobTitle);

  /**Activity track */
  const activity = {
    referrable_id: jobTitle.data[0].id,
    referrable_type: 15,
    action_type: 1,
    created_by: body.created_by,
  };
  event.emit('configurationStoreActivity', {activity});
  /**Activity track */

  return jobTitle;
};

/**
 * Update Job Title in the Database.
 * 
 * Logic:
 * - define the condition using the job_title_id(body).
 * - creates an updateData object.
 * - calls the common update repository function to update the 'job_titles' table based on condition(defined above)
 * - fetches job title details before and after the update for activity track.
 * - An activity tracking event is triggered to log the update event with relevant information.
 * - return response of the repository update function.
 * 
 *  @param {Object} body - An object containing data for the job title update.
 *  @returns {Promise} - A promise that resolves to the response from the database update operation.
 * 
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

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
  */

  /**Fethcing job title details before update */
  const beforeUpdateData = await getJobTitleData(condition)
  /**Fethcing job title details before update */

  const repositoryResponse = await indexRepository.update('job_titles', condition, updateData);

  /**Fethcing job title details after update */
  const afterUpdateData = await getJobTitleData(condition)
  /**Fethcing job title details after update */

  /**activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 15,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**activity track */

  return repositoryResponse;
};

/**
 * Job Title Index to fetch job title data based on the given condition.
 * 
 * Logic:
 * - Calls the common `find()` function to retrieve job title data from 'job_titles' table based on the condition.
 * - If reponse status is true:
 *    + Creates an empty array `responseData` and initializes `totalDetails` with job title data.
 *    + Iterates `totalDetails` array, selecting specific properties for each item and pushing them into the `responseData` array.
 *    + Returns an object with a status of true and `responseData`.
 * - Else :
 *    + returns reponse.
 * 
 * @param {Object} condition - The condition to filter job title data.
 * @returns {Object} An object containing the status and the relevant job title data or an error response.
 */
const index = async (condition) => {
  /**
   * Calling a  index function.
   * Based on the status in the function response, prepare the response and return to controller
  */
  const jobTitle = await indexRepository.find('job_titles', ['id', 'name', 'description', 'is_active', 'is_editable'], condition);
  if (jobTitle.status) {
    /* Variables */
    const responseData = [];
    const totalDetails = jobTitle.data;
    /* Variables */

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        id: item.id,
        name: item.name,
        description: item.description,
        is_active: item.is_active,
        is_editable: item.is_editable,
      };
      responseData.push(listingObject);
    }

    return { status: true, data: responseData};
  } else {
    return jobTitle;
  }
};

/**
 * Job Title Listing to return job title data with pagination and activity logs.
 * Overview of API:
 * - Call the service function to fetch job title data based on provided conditions, pagination.
 * - Prepare a response with job title data, pagination details, and activity logs.
 * - Return the response.
 * 
 * Logic:
 * - Define default variables, including the table name, fields to retrieve, and join conditions.
 * - Call the common function `findByPagination` to fetch job title data with pagination and join employee data for creators and updaters.
 *   + If successful:
 *     ~ Prepare the response with paginated job title data.
 *     ~ Fetch activity log details for job titles.
 *     ~ Retrun the reponse with status true, responseData , paginationDetails and activity.
 *   + Else:
 *     ~ Return the error response.
 * - Return the response with status and data.
 *        
 * Notes:
 * - The function includes pagination details and activity logs in the response.
 * 
 * @param {Object} condition - The conditions to filter job title data.
 * @param {number} page - The page number for pagination.
 * @param {number} limit - The number of items per page.
 * @returns {Object} - An object with job title data, pagination details, and activity logs.
 */
const listing = async (condition, page, limit) => {
  /* Default variables */
  const tableName = 'job_titles';
  const fields = ['job_titles.*', 'create.display_name as create_emp', 'update.display_name as updated_emp'];
  const joins = [
    { table: 'employee as create', alias: 'create', condition: ['job_titles.created_by', 'create.id'], type: 'left' },
    { table: 'employee as update', alias: 'update', condition: ['job_titles.updated_by', 'update.id'], type: 'left' },
  ];
  /* Default variables */
  const jobTitle = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit);
  if (jobTitle.status) {
    /* Variables */
    const responseData = [];
    const totalDetails = jobTitle.data;
    const paginationDetails = jobTitle.pagination;
    /* Variables */

    let serialNo = (page - 1) * limit + 1;
    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        serial_no: serialNo,
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        is_active: item.is_active,
        is_editable: item.is_editable,
        description: (item.description !== null ? item.description : ''),
        created_by: (item.create_emp !== null ? item.create_emp : 'System'),
        updated_by: (item.updated_emp !== null ? item.updated_emp : ''),

      };
      serialNo++;
      responseData.push(listingObject);
    }

    // /* prepare the response */

    return { status: true, data: responseData, pagination_data: paginationDetails };
  } else {
    return jobTitle;
  }
};


/**
 * Update Job Title Status to Modify the Status of a Job Title and Track the Activity.
 * 
 * Logic:
 * - Define the condition object based on id(body)
 * - create updateData object based on request body data
 * - fetches job title details before the update data.
 * - call the common update function to update data into 'job_titles' table based on condition(defined above)
 * - fetches job title details after the update data.
 * - An activity tracking event is triggered to log the update event with relevant information.
 * - return response
 * 
 * @param {Object} body - The request body containing information to update the job title status.
 * @returns {Object} - The response data indicating the status of the update.
 */
const updateStatus = async (body, condition) => {
  const updateData = {
    is_active: body.is_active,
    updated_at: new Date(),
    updated_by: body.updated_by,
  };

  /**Fethcing job title details before update */
  const beforeUpdateData = await getJobTitleData(condition)
  /**Fethcing job title details before update */

  const jobTitleData = await indexRepository.update('job_titles', condition, updateData);

  /**Fethcing job title details after update */
  const afterUpdateData = await getJobTitleData(condition)
  /**Fethcing job title details after update */

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 15,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

  return jobTitleData
};

/**
 * Retrieve Job Title Data to Get Details Before and After an Update.
 * 
 * Logic:
 *  - call common find() function to fecth the details from 'job_titles' table
 *  - Prepare 'responseData' object with fecthed data
 *  - retrun responseData
 * 
 * @param {Object} condition - The condition to filter job title data.
 * @returns {Object} - The response data containing key job title details.
 */
const getJobTitleData = async (condition) => {
  const jobTitleData = await indexRepository.find('job_titles', ['*'], condition);
  const responseData = {
    'Name' :  jobTitleData.data[0].name,
    'Description': jobTitleData.data[0].description,
    'Status': jobTitleData.data[0].is_active ? 'Active' : 'In-active',
  };

  return responseData
}

/**
 * Delete Job Title to remove a job title and track the activity.
 * 
 * Logic:
 * - Define the conditions based on 'job_title_id'(body).
 * - call the common destroy() function to delete job title details from 'job_titles' table based on condition(defined above)
 * - An activity tracking event is triggered to log the delete event with relevant information.
 * 
 * @param {Object} body - request body
 */
const destroy = async (body, condition) => {

  var updateData = {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by
  };

  await indexRepository.update('job_titles', condition , updateData);

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 15,
    action_type: 3,
    created_by: body.created_by,
  };
  event.emit('configurationDeleteActivity', activity );
  /**Activity track */
}

module.exports = { index, listing, store, update, updateStatus, destroy };
