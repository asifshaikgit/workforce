const indexRepository = require('../../repositories/index');
const { event } = require('../../../../../events/configurationActivityEvent');
const format = require('../../../../../helpers/format')
const moment = require('moment');
/**
 * update Function to update notification data.
 * 
 * Logic:
 * - capture the data from notification array from body in params
 * - loop every object from array and define the condition to update
 * - Prepare notification data object.
 * - update the notification data into 'notification_settings' table from the condition defined above for every loop. 
 * - Return the result of the notification data update.
 * 
 * @param {Object} body - The body of the request containing the notification data.
 * @returns {Object} - An object with a status property indicating the success of the update.
 * @throws None
 */
const update = async (body, condition) => {
  // capturing data from body
  const data = body.notification;

  // get notification before data
  var beforeDataQuery = await getNotificationDataQuery(condition.id);
  var beforeUpdateData = await indexRepository.rawQuery(beforeDataQuery);
  beforeUpdateData = beforeUpdateData[0];

  /* Creating update entry object */
  const updateData = {
    template: body.template, //Content
    updated_by: body.updated_by,
  };
  /* Creating update entry object */

  indexRepository.update('notification_settings', condition, updateData);

  var notificationcondition = { referrable_id: condition.id };
  await indexRepository.destroy('notification_group_users', notificationcondition);
  const notificationMembers = body.assignee_employee_ids;
  for (const key in notificationMembers) {
    const notificationUser = {
      referrable_id: condition.id,
      referrable_type: 2,
      employee_id: notificationMembers[key].employee_id,
      created_by: body.created_by,
      updated_by: body.updated_by,
    };
    await indexRepository.store('notification_group_users', notificationUser); //await need for activity track
  }
  // get notification after data
  var afterDataQuery = await getNotificationDataQuery(condition.id);
  var afterUpdateData = await indexRepository.rawQuery(afterDataQuery);
  afterUpdateData = afterUpdateData[0];

  /**Activity track */
  activity = {
    referrable_type: 28, // for the notification_settings referrable type is 28
    referrable_id: condition.id,
    action_type: 2, // 2 for update
    created_by: body.created_by,
  }
  event.emit('configurationNotificationActivity', { activity, beforeUpdateData, afterUpdateData });
  return { status: true };
};

/**
 * Get Notification Data Query
 */
async function getNotificationDataQuery(referrable_id) {

  return `SELECT notification_settings.name,notification_settings.template,notification_settings.id as notification_settings_id,(SELECT jsonb_agg(employee_id) FROM notification_group_users WHERE referrable_id = notification_settings.id AND notification_group_users.referrable_type = 2) as "Assign To" FROM notification_settings WHERE notification_settings.id ='` + referrable_id + `'`;
}

/**
 * update Function to update notification data.
 * 
 * Logic:
 * - Prepare notification data object.
 * - update the notification data into 'notifications' table from the condition in params. 
 * - Return the status.
 * 
 * @param {Object} condition - The condition to match the notification(s) to be updated.
 * @returns {Object} - An object with a 'status' property indicating the success of the update.
 * @throws {Error} - If there is an error updating the notification(s).
 */
const updateRead = async (condition) => {
  const updateData = { is_read: true };
  await indexRepository.update('notifications', condition, updateData);
  return { status: true };
};

/**
 * Index Function to get templates data.
 * 
 * Logic:
 * - Fetch the data from the 'notification_settings' table using condition(param) by calling common find function.
 *  - If data exists,
 *   + Iterate the loop , define an object and push into the loop 
 *   + define the condition from the data in the loop
 *   + Fetch the data from 'template_parameters' table from the above defined condition
 *   + If data exists
 *   + Iterate the loop and define an object and push the object in to an array
 *   + Prepare the response 
 *   + return the response with status as true
 * 
 * @param {object} condition - The condition to filter the data from the 'notification_settings' table.
 * @returns {object} - An object containing the status and data of the retrieved data.
 */
const index = async (condition) => {
  /* Default variables */
  var responseData = [];
  /* Default variables */

  const templateData = await indexRepository.find('notification_settings', ['*'], condition, null, [], null, 'id', 'id', 'desc');
  if (templateData.status) {
    // looping the data
    for (let key in templateData.data) {
      let item = templateData.data[key];
      let templateParams = await indexRepository.find('template_parameters', ['id', 'parameter'], { module_slug: item.slug }, null, [], null, null, null, false);
      let paramsArray = [];
      if (templateParams.status) {
        for (let params in templateParams.data) {
          let param = templateParams.data[params];
          let paramsObject = {
            id: param.id,
            parameter: param.parameter
          }
          paramsArray.push(paramsObject);
        }
      }
      const joins = [
        { table: 'employee as emp', alias: 'emp', condition: ['notification_group_users.employee_id', 'emp.id'], type: 'left' },
      ]
      let employeeIds = await indexRepository.find('notification_group_users', ['notification_group_users.id', 'notification_group_users.employee_id', 'emp.display_name'], { referrable_id: templateData.data[0].id }, null, joins, null, 'notification_group_users.id', 'desc', false);
      let employeeArray = [];
      if (employeeIds.status) {
        for (let employees in employeeIds.data) {
          let employee = employeeIds.data[employees];
          let employeesObject = {
            id: employee.id,
            employee_name: employee.display_name,
            employee_id: employee.employee_id
          }
          employeeArray.push(employeesObject);
        }
      }
      /* Creating object */
      let listingObject = {
        id: item.id,
        slug: item.slug,
        name: item.name,
        assignee_employee_ids: employeeArray,
        template: item.template,
        params: paramsArray
      }
      /* Creating object */
      responseData.push(listingObject);
    }
  }

  return { status: true, data: responseData }
}

/**
 * Listing function to fetch notification data based on provided conditions and pagination parameters.
 * 
 * Overview of function:
 *  - Define default variables.
 *  - Fetch notification data from the 'notifications' table.
 *  - Format the response data with serial numbers.
 *  - Return the response.
 * 
 * Logic:
 *  - Initialize default variables.
 *  - Call the service function to fetch notification data with pagination.
 *  - Format the fetched data by adding serial numbers.
 *  - Prepare the response with the formatted data.
 *  - Return the response.
 *        
 * Notes:
 *    - This function does not perform any validation.
 *    - It directly fetches data from the repository and formats it for response.
 * 
 * @param {Object} condition - The condition to filter notification data.
 * @param {Number} page - The page number for pagination.
 * @param {Number} limit - The limit for pagination.
 * @returns {Object} - The response object containing the status and data.
 */

const listing = async (condition, page, limit) => {
  /* Default variables */
  var responseData = [];
  let dateFormat = await format.getDateFormat(); // date format
  /* Default variables */

  const notificationData = await indexRepository.findByPagination('notifications', ['name', 'slug', 'content', 'notifications.created_at'], condition, [{ table: 'notification_settings', condition: ['notification_settings.id', 'notifications.notification_slug_id'] }], page, limit, 'notifications.created_at', 'desc', false);
  let serial_no = 1;
  if (notificationData.status) {
    // looping the data
    for (let item in notificationData.data) {
      notificationData.data[item].Sno = serial_no;
      notificationData.data[item].date = moment(notificationData.data[item].created_at).format(dateFormat)
      notificationData.data[item].time = moment(notificationData.data[item].created_at).format("HH:mm A")
      serial_no++;
    }
  }
  return notificationData;

}

module.exports = { update, updateRead, index, listing };
