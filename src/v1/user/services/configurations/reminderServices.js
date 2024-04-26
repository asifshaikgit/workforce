const indexRepository = require('../../repositories/index');
const transactionRepository = require('../../repositories/transactionRepository');
const moment = require('moment')
const { getConnection } = require('../../../../middlewares/connectionManager');
const format = require('../../../../../helpers/format');
const { event } = require('../../../../../events/configurationActivityEvent');


/**
 * Store function to create a new reminder entry.
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'db.transaction'.
 * - Create a new object 'newReminderData' with properties from the request body.
 * - Call the store repository function to add 'newReminderData' to the 'reminder_referrables' table within the transaction.
 * - If 'reminders' array is provided in the request body
 *    ~ Loop through each reminder in the 'reminders' array.
 *      - Create a new object 'newReminderOccurrenceData' with properties from each reminder.
 *      - Call the store repository function to add 'newReminderOccurrenceData' to the 'reminder_occurances' table within the transaction.
 * - Commit the database transaction if all database operations are successful.
 * - Track the creation activity for the reminder.
 * - Emit an event to log the activity.
 * - Return the response from the repository.
 * 
 * Note:
 *  - Exception handling using try-catch.
 *  - If any exception is raised, rollback all database operations using 'trx.rollback()'.
 * 
 * @param {Object} body - The request body containing reminder details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {

  let trx;
  try {
    // Initialize a database transaction
    const db = await getConnection();
    trx = await db.transaction();
    var groupArray = []// default array

    if (body.group_ids.length > 0) {
      var groupArray = body.group_ids.map(obj => obj.id);
    }

    /* creating a new object to store */
    const newreminderData = {
      reminder_name_id: body.reminder_name_id,
      // referrable_id: body.referrable_id ? body.referrable_id : null,
      status: body.status,
      content: body.content,
      group_ids: groupArray.length > 0 ? groupArray : null,
      // employee_ids: body.employee_ids.length > 0 ? body.employee_ids : null,
      // reminder_time: body.reminder_time,
      // reminder_date: body.reminder_date,
      updated_by: body.created_by,
      updated_at: new Date(),
    };

    /* storing the data */
    const reminderResponse = await transactionRepository.store(trx, 'reminder_referrables', newreminderData);

    // assigning the array data
    let reminder = body.reminders

    // looping the data from the variable
    for (let key in reminder) {
      /* creating a new object to store */

      var newreminderoccuranceData = {
        reminder_referrable_id: reminderResponse.data[0].id,
        occurance_order: reminder[key].occurance_order,
        number: reminder[key].number,
        cycle: reminder[key].cycle,
        is_recurring: reminder[key].is_recurring,
        recurring_days: reminder[key].is_recurring == 'true' ? reminder[key].recurring_days : null,
        created_by: body.created_by,
        created_at: new Date(),
      };
      /* storing the data for every loop */
      await transactionRepository.store(trx, 'reminder_occurances', newreminderoccuranceData);
    }

    // Commit the transaction
    await trx.commit();

    // Store on reminder Activity track
    activity = {
      referrable_type: 27,
      referrable_id: reminderResponse.data[0].id,
      action_type: 1, // 1 for store
      created_by: body.created_by,
    };

    event.emit('configurationStoreActivity', { activity });
    return reminderResponse;

  } catch (error) {
    // Handle errors and rollback the transaction in case of an exception
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }

};

/**
 * Update function to modify a reminder configuration entry and its associated occurrences.
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'db.transaction()'.
 * - Get the existing data of the reminder configuration before the update.
 * - Create an object 'updatereminderData' with properties from the request body for updating the reminder configuration entry.
 * - Call the update repository function to update the reminder configuration entry.
 * - Loop through the reminder occurrences in the request body and either update or store them based on the presence of 'id'.
 * - Commit the database transaction if all database operations are successful.
 * - Get the updated data of the reminder configuration after the update.
 * - Track the update activity for the reminder configuration.
 * - Emit an event to log the update activity along with before and after update data.
 * - Return the response from the repository.
 * 
 * @param {Object} body - The request body containing details for updating the reminder configuration.
 * @param {Object} condition - The condition to identify the reminder configuration entry to update.
 * @returns {Object} Repository response for the update operation.
 */
const update = async (body, condition) => {

  let dateFormat = await format.getDateFormat(); // date format

  /* Creating update entry object */
  let trx;
  try {
    // Initialize a database transaction
    const db = await getConnection();
    trx = await db.transaction();

    // get reminder before data
    var query = await getreminderDataQuery(condition.id, dateFormat);
    var beforeUpdateData = await indexRepository.rawQuery(query);
    beforeUpdateData = beforeUpdateData[0];

    var groupArray = []// default array

    if (body.group_ids.length > 0) {
      var groupArray = body.group_ids.map(obj => obj.id);
    }

    /* creating a new object to store */
    const updatereminderData = {
      reminder_name_id: body.reminder_name_id,
      // referrable_id: body.referrable_id ? body.referrable_id : null,
      status: body.status,
      content: body.content,
      group_ids: groupArray.length > 0 ? groupArray : null,
      // employee_ids: body.employee_ids.length > 0 ? body.employee_ids : null,
      // reminder_time: body.reminder_time,
      // reminder_date: body.reminder_date,
      updated_by: body.created_by,
      updated_at: new Date(),
    };
    /* creating a new object to store */

    // storing the data 
    const reminderResponse = await transactionRepository.update(trx, 'reminder_referrables', condition, updatereminderData);

    // assigning the array data
    let reminder = body.reminders

    // looping the data from the variable
    for (let key in reminder) {

      /* creating a new object to store */
      var updateReminderoccuranceData = {
        reminder_referrable_id: reminderResponse.data[0].id,
        occurance_order: reminder[key].occurance_order,
        number: reminder[key].number,
        cycle: reminder[key].cycle,
        is_recurring: reminder[key].is_recurring,
        recurring_days: reminder[key].recurring_days ? reminder[key].recurring_days : null,
        created_by: body.created_by,
        created_at: new Date(),
      };

      /* creating a new object to store */
      if (reminder[key].id) { // updating the data if id exists
        await transactionRepository.update(trx, 'reminder_occurances', { id: reminder[key].id }, updateReminderoccuranceData);
      } else { /* storing the data for every loop */
        await transactionRepository.store(trx, 'reminder_occurances', updateReminderoccuranceData);
      }
    }

    //Deleting the reminder occurances information
    if (Array.isArray(body.deleted_reminder_occurance_id)) {
      if (body.deleted_reminder_occurance_id.length > 0) {
        for (const key in body.deleted_reminder_occurance_id) {
          if (body.deleted_reminder_occurance_id[key] != '' && body.deleted_reminder_occurance_id[key] != null && body.deleted_reminder_occurance_id[key] != undefined) {
            await transactionRepository.destroy(trx, 'reminder_occurances', { id: body.deleted_reminder_occurance_id[key] })
          }
        }
      }
    }

    // Commit the transaction
    await trx.commit();

    // get reminder before data
    var query = await getreminderDataQuery(condition.id, dateFormat);
    var afterUpdateData = await indexRepository.rawQuery(query);
    afterUpdateData = afterUpdateData[0];

    /**Activity track */
    activity = {
      referrable_type: 27,
      referrable_id: reminderResponse.data[0].id,
      action_type: 2, // 2 for update
      created_by: body.created_by,
    }
    event.emit('configurationReminderActivity', { activity, beforeUpdateData, afterUpdateData });

    return reminderResponse;

  } catch (error) {
    // Handle errors and rollback the transaction in case of an exception
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

/**
 * UpdateStatus function to modify the status of a reminder configuration entry.
 * 
 * Logic:
 * - Get the existing data of the reminder configuration before the update.
 * - Create an object 'updateData' with properties for updating the status of the reminder configuration entry.
 * - Call the update repository function to update the status of the reminder configuration entry.
 * - Get the updated data of the reminder configuration after the update.
 * - Track the update activity for the reminder configuration.
 * - Emit an event to log the update activity along with before and after update data.
 * - Return the response from the repository.
 * 
 * @param {Object} body - The request body containing details for updating the status of the reminder configuration.
 * @param {Object} condition - The condition to identify the reminder configuration entry to update.
 * @returns {Object} Repository response for the update operation.
 */
const updateStatus = async (body, condition) => {

  let dateFormat = await format.getDateFormat(); // date format

  // get reminder before data
  var query = await getreminderDataQuery(condition.id, dateFormat);
  var beforeUpdateData = await indexRepository.rawQuery(query);
  beforeUpdateData = beforeUpdateData[0];

  /* Creating update entry object */
  const updateData = {
    status: body.status,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /**
     *  + Call the update repository function
     *    -Based on the status in update function response, segregate the response and prepare the response
     *
    */
  const repositoryResponse = await indexRepository.update('reminder_referrables', condition, updateData);

  // get reminder before data
  var query = await getreminderDataQuery(condition.id, dateFormat);
  var afterUpdateData = await indexRepository.rawQuery(query);
  afterUpdateData = afterUpdateData[0];

  /**Activity track */
  activity = {
    referrable_type: 27,
    referrable_id: repositoryResponse.data[0].id,
    action_type: 2, // 2 for update
    created_by: body.created_by,
  }
  event.emit('configurationReminderActivity', { activity, beforeUpdateData, afterUpdateData });

  return repositoryResponse;
};

const payrollConfigDates = async (condition) => {
  /* Default variables */
  var responseData = [];
  var objectData;
  let dateFormat = await format.getDateFormat(); // date format
  /* Default variables */
  const fields = ['pc.id', 'pc.from_date', 'pc.to_date'];
  const joins = [
    { table: 'payroll_configuration as pc', alias: 'pc', condition: ['pc.pay_config_setting_id', 'payroll_config_settings.id'], type: 'inner' },
  ];
  
  const payConfigDates = await indexRepository.find("payroll_config_settings", fields, condition, null, joins);

  if(payConfigDates.status) {
    await Promise.all(payConfigDates.data.map(async ({ id, from_date, to_date }) => {
      objectData = {
          id: id,
          date : moment(from_date, dateFormat).format('MM-DD-YYYY') + ' - ' + moment(to_date, dateFormat).format('MM-DD-YYYY')
      };
      responseData.push(objectData)
  }));
    return {data : responseData, status : true} 
  } else {
    return payConfigDates
  }
}

/**
 * Index function to retrieve details of a specific reminder configuration.
 * 
 * Logic:
 * - Get the date format using 'format.getDateFormat()'.
 * - Set default variables for fields and joins required for the database query.
 * - Call the find repository function to retrieve reminder details based on the provided condition.
 * - If reminder details are found
 *    ~ Initialize variables for responseData and totalDetails.
 *    ~ Iterate over totalDetails and create a new object for each item with selected properties.
 *    ~ For each reminder, retrieve related reminder occurrences using the find repository function.
 *    ~ Create an array of reminder occurrences and push each occurrence object into occuranceObject.
 *    ~ Create a new object 'listingObject' with properties from the reminder and its occurrences.
 *    ~ Push listingObject into the responseData array.
 * - Return the responseData if reminders are found, otherwise return the reminderData.
 * 
 * @param {Object} condition - The condition to filter reminder details.
 * @returns {Object} Repository response.
 */
const index = async (condition) => {

  /* Default variables */
  const fields = ['reminder_referrables.*', 'rc.name as name'];
  const joins = [
    { table: 'reminder_configurations as rc', alias: 'rc', condition: ['rc.id', 'reminder_referrables.reminder_name_id'], type: 'left' },

  ];
  /* Default variables */
  const reminderData = await indexRepository.find("reminder_referrables", fields, condition, null, joins);
  if (reminderData.status) {
    /* variables */
    const responseData = [];
    const totalDetails = reminderData.data;

    /* variables */

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.

    for (let item in totalDetails) {
      var occuranceObject = [];
      let reminderOccurance;
      const reminderOccurenceData = await indexRepository.find("reminder_occurances", ['reminder_occurances.*'], { reminder_referrable_id: totalDetails[item].id }, null, [], null, 'id', 'asc');

      if (reminderOccurenceData.status) {
        var occurences = reminderOccurenceData.data
        for (let key in occurences) {
          reminderOccurance = {
            id: occurences[key].id,
            reminder_referrable_id: occurences[key].reminder_referrable_id,
            occurance_order: occurences[key].occurance_order,
            number: occurences[key].number,
            cycle: occurences[key].cycle,
            is_recurring: occurences[key].is_recurring,
            recurring_days: occurences[key].recurring_days ? occurences[key].recurring_days : '',
          }
          occuranceObject.push(reminderOccurance)
        }
      }

      let grpIds = []
      if (totalDetails[item].group_ids != null) {
        for (const key in totalDetails[item].group_ids) {
          var groupName = await indexRepository.find('groups', ['name'], { id: totalDetails[item].group_ids[key] });
          if (groupName.status) {
            obj = {
              id: totalDetails[item].group_ids[key],
              value: groupName.data[0].name
            }
            grpIds.push(obj)
          }
        }
      }
      /* creating a new object */
      const listingObject = {
        id: totalDetails[item].id,
        reminder_name_id: totalDetails[item].reminder_name_id,
        reminder_name: totalDetails[item].name,
        // referrable_id: totalDetails[item].referrable_id ? totalDetails[item].referrable_id : '',
        status: totalDetails[item].status,
        content: totalDetails[item].content,
        group_ids: grpIds,
        // employee_ids: totalDetails[item].employee_ids ? totalDetails[item].employee_ids : [],
        // reminder_time: totalDetails[item].reminder_time,
        // reminder_date: moment(totalDetails[item].reminder_date).format(dateFormat),
        reminders: occuranceObject ? occuranceObject : []
      };
      // pushing the object to the array
      responseData.push(listingObject);
    }
    return { status: true, data: responseData };
  } else {
    return reminderData;
  }
};

// /**
//  * Listing function to retrieve a paginated list of reminder configurations based on the provided condition.
//  * 
//  * Logic:
//  * - Get the date format using 'format.getDateFormat()'.
//  * - Set default variables for fields and joins required for the database query.
//  * - Call the findByPagination repository function to retrieve paginated reminder details based on the provided condition.
//  * - If reminder details are found
//  *    ~ Initialize variables for responseData, totalDetails, and paginationDetails.
//  *    ~ Iterate over totalDetails and create a new object for each item with selected properties.
//  *    ~ For each reminder, retrieve related reminder occurrences using the find repository function.
//  *    ~ Create an array of reminder occurrences and push each occurrence object into occuranceObject.
//  *    ~ Create a new object 'listingObject' with properties from the reminder and its occurrences.
//  *    ~ Push listingObject into the responseData array.
//  *    ~ Increment the serial number for each item.
//  * - Return the responseData and paginationDetails if reminders are found, otherwise return the reminderData.
//  * 
//  * @param {Object} condition - The condition to filter reminder details.
//  * @param {number} page - The page number for pagination.
//  * @param {number} limit - The number of items per page.
//  * @returns {Object} Repository response with paginated reminder configurations.
//  */
// const listing = async (condition, page, limit) => {

//   let dateFormat = await format.getDateFormat(); // date format

//   /* Default variables */
//   const fields = ['reminder_referrables.*', 'rc.name as name'];
//   const joins = [
//     { table: 'reminder_configurations as rc', alias: 'rc', condition: ['rc.id', 'reminder_referrables.reminder_name_id'], type: 'left' }

//   ];
//   /* Default variables */
//   const reminderData = await indexRepository.findByPagination("reminder_referrables", fields, condition, joins, page, limit);
//   if (reminderData.status) {
//     /* variables */
//     const responseData = [];
//     const totalDetails = reminderData.data;
//     const paginationDetails = reminderData.pagination;

//     /* variables */

//     // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
//     let serialNo = (page - 1) * limit + 1;
//     for (let item in totalDetails) {

//       const reminderOccurenceData = await indexRepository.find("reminder_occurances", ['reminder_occurances.*'], { reminder_referrable_id: totalDetails[item].id }, null, [], null, 'id', 'asc');

//       if (reminderOccurenceData.status) {
//         var occurences = reminderOccurenceData.data
//         occuranceObject = []
//         for (let key in occurences) {
//           var reminderOccurance = {
//             serial_no: serialNo,
//             id: occurences[key].id,
//             reminder_referrable_id: occurences[key].reminder_referrable_id,
//             occurance_order: occurences[key].occurance_order,
//             number: occurences[key].number,
//             cycle: occurences[key].cycle,
//             is_recurring: occurences[key].is_recurring,
//             recurring_days: occurences[key].recurring_days ? occurences[key].recurring_days : '',
//           }
//           occuranceObject.push(reminderOccurance)
//         }
//       }
//       /* creating a new object*/
//       const listingObject = {
//         id: totalDetails[item].id,
//         reminder_name_id: totalDetails[item].reminder_name_id,
//         reminder_name: totalDetails[item].name,
//         referrable_id: totalDetails[item].referrable_id ? totalDetails[item].referrable_id : '',
//         status: totalDetails[item].status,
//         content: totalDetails[item].content,
//         group_ids: totalDetails[item].group_ids ? totalDetails[item].group_ids : [],
//         // employee_ids: totalDetails[item].employee_ids ? totalDetails[item].employee_ids : [],
//         // reminder_time: totalDetails[item].reminder_time,
//         // reminder_date: moment(totalDetails[item].reminder_date).format(dateFormat),
//         reminder_occurances: occuranceObject
//       };
//       // pushing the object to an array
//       responseData.push(listingObject);
//       serialNo++;
//     }
//     return { status: true, data: responseData, pagination_data: paginationDetails };
//   } else {
//     return reminderData;
//   }
// }

// /**
//  * Destroy function to delete a reminder configuration entry and its associated occurrences.
//  * 
//  * Logic:
//  * - Initialize a database transaction using 'getConnection()' and 'db.transaction()'.
//  * - Create an object 'updateData' with properties for updating the entry's metadata.
//  * - Call the update repository function to mark the reminder entry and its occurrences as deleted.
//  * - Commit the database transaction if all database operations are successful.
//  * - Track the deletion activity for the reminder configuration.
//  * - Emit an event to log the deletion activity.
//  * - Return the response from the repository.
//  * 
//  * @param {Object} body - The request body containing details for updating the entry.
//  * @param {Object} condition - The condition to identify the reminder configuration entry to delete.
//  * @returns {Object} Repository response for the delete operation.
//  */
// const destroy = async (body, condition) => {

//   let trx;
//   try {
//     // Initialize a database transaction
//     const db = await getConnection();
//     trx = await db.transaction();

//     /* Creating update entry object */
//     const updateData = {
//       updated_by: body.updated_by,
//       updated_at: new Date(),
//       deleted_at: new Date()
//     };
//     /* Creating update entry object */

//     /**
//        *  + Call the update repository function
//        *    -Based on the status in update function response, segregate the response and prepare the response
//        *
//       */
//     const repositoryResponse = await transactionRepository.update(trx, 'reminder_referrables', condition, updateData);
//     await transactionRepository.update(trx, 'reminder_occurances', { id: condition.id }, updateData);

//     // Commit the transaction
//     await trx.commit();

//     /**Activity track */
//     const activity = {
//       referrable_id: condition.id,
//       referrable_type: 27,
//       action_type: 3,
//       created_by: body.created_by,
//     };
//     event.emit('configurationDeleteActivity', activity);
//     /**Activity track */
//     return repositoryResponse;

//   } catch (error) {
//     // Handle errors and rollback the transaction in case of an exception
//     if (trx) {
//       await trx.rollback();
//     }
//     return { status: false, error: error.message };
//   }

// };

/**
 * Get Ledger Data Querry Including all the ledger_item_details, ledger_address based on the ledger_id
 */
async function getreminderDataQuery(reminderId) {

  return `select reminder_referrables.content as "Template", reminder_referrables.group_ids, reminder_referrables.employee_ids, jsonb_agg(DISTINCT jsonb_build_object('id', reminder_occurances.id, 'occurance_order', reminder_occurances.occurance_order, 'number', reminder_occurances.number, 'cycle', reminder_occurances.cycle,'recurring_days', reminder_occurances.recurring_days)) AS "Reminder Cycle" from reminder_referrables left join reminder_occurances on reminder_referrables.id = reminder_occurances.reminder_referrable_id where reminder_referrables.id = '` + reminderId + `' group by reminder_referrables.id`;
}

const remindersListing = async (condition, dateFormat, page, limit) => {
  let remindersListing;
  let query = `Select * FROM getRemindersListing(`;
  query += `'${condition.employee_id}',`;
  query += (condition.reminder_slugs !== null) ? `'${condition.reminder_slugs}',` : `${condition.reminder_slugs},`;
  query += (condition.referrable_type !== null) ? `'${condition.referrable_type}',` : `${condition.referrable_type},`;
  query += (condition.pay_cycle !== null) ? `'${condition.pay_cycle}',` : `${condition.pay_cycle},`;
  query += (condition.from_date && condition.to_date) ? `'${condition.from_date}', '${condition.to_date}',` : `${condition.from_date}, ${condition.to_date},`;
  query += `'${dateFormat}', ${limit}, ${page})`;

  console.log(query, 'query')

  remindersListing = await indexRepository.rawQuery(query);

  if (remindersListing) {
    total_reminders_count = remindersListing[0]?.total_count;
    pagination_details = {
      total: total_reminders_count,
      currentPage: page,
      perPage: limit,
      totalPages: (total_reminders_count) ? Math.ceil(total_reminders_count / limit) : 0
    }

    remindersListing = remindersListing?.map(obj => {
      const { ['total_count']: omittedKey, ...rest } = obj;
      return rest;
    });

    return {
      status: true,
      data: remindersListing,
      pagination_data: pagination_details
    }
  } else {
    return remindersListing;
  }
}

/**
 * Is Read Update function to update the read status of the reminder.
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * 
 * @param {*} reminderId - Reminder Id to update is read of the reminder.
 * @returns {Object} - An object containing the status and data of the stored invoice.
 * @throws {Error} - If an error occurs while processing the invoice.
 */
const isReadUpdate = async (reminderId) => {
  let trx;
  try {

    // Databse connection
    const db = await getConnection();
    trx = await db.transaction();

    const reminderUpdate = await transactionRepository.update(trx, 'reminders', { id: reminderId }, { 'is_read': true });

    // Commit the transaction
    await trx.commit();

    return { status: true, data: reminderUpdate.data };

  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
}

module.exports = { store, update, index, updateStatus, remindersListing, isReadUpdate, payrollConfigDates };
