const indexRepository = require("../../repositories/index")
const { event } = require('../../../../../events/employeeActivityEvent');
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');
const { getEmergencyContactDetails } = require('./commonService');

/**
 * Update function to modify Employee Emergency Contact Information entries.
 * 
 * Logic:
 * - Create a transaction for database operations.
 * - Extract data from the request body.
 * - Iterate through the data and for each entry:
 *    + Define a condition to identify the entry to update based on its ID.
 *    + Create an 'updateData' object with updated values for the entry.
 *    + Call the 'transactionRepository.update' function to update the 'emergency_contact_information' table.
 * - Commit the transaction if all updates are successful.
 * - Handle errors and rollback the transaction if any operation fails.
 * 
 * @param {Object} body - The request body containing data for updating emergency contact information.
 * @returns {Object} An object with status (true for success, false for failure) and an optional error message.
 */
const update = async (body) => {
  let trx;
  try {
    //databse connection
    const db = await getConnection();

    const data = body.emergency_contact
    let beforeUpdateData;
    let condition;
    for (const key in data) {
      trx = await db.transaction()
      condition = { id: data[key].id };

      /* Fetching emergency contact details before update for activity track */
      beforeUpdateData = await getEmergencyContactDetails(data[key].id);

      var updateData = {
        employee_id: body.employee_id,
        relationship_id: data[key].relationship_id === '' ? null : data[key].relationship_id,
        name: data[key].name,
        email_id: data[key].email_id ? data[key].email_id : null,
        contact_number: data[key].contact_number,
        address_1: data[key].address_1,
        address_2: data[key].address_2 ? data[key].address_2 : null,
        city: data[key].city,
        state_id: data[key].state_id === '' ? null : data[key].state_id,
        country_id: data[key].country_id === '' ? null : data[key].country_id,
        zip_code: data[key].zip_code,
        updated_at: new Date(),
        updated_by: body.updated_by
      }
      /**
      * Updates the 'emergency_contact_information' repository with the given condition and update data.
      */
      await transactionRepository.update(trx, 'emergency_contact_information', condition, updateData);

      // transaction commit
      await trx.commit();

      /**Activity track */
      activity = {
        employee_id: body.employee_id,
        referrable_type_id: condition.id,
        activity_name: 'User Profile > Emergency Contact',
        slug: 'emergency_contact',
        created_by: body.created_by
      };
      event.emit('employeeUpdateActivity', { activity, beforeUpdateData });
    }

    return { status: true }
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

/**
 * Destroy function to mark Employee Emergency Contact Information entries as deleted.
 * 
 * Logic:
 * - Create an 'updateData' object that includes the deletion timestamp, update timestamp, and the user who initiated the deletion.
 * - Call the 'indexRepository.update' function to mark the emergency contact information as deleted based on the provided condition and update data.
 * - Return the response from the repository.
 *
 * @param {Object} body - The request body containing the user initiating the deletion.
 * @param {Object} condition - The condition to identify which entries to mark as deleted in the 'emergency_contact_information' table.
 * @returns {Object} A repository response object indicating the status of the update operation.
 */
const destroy = async (body, condition) => {

  const deleteObject = await getEmergencyContactDetails(condition.id);

  var updateData = {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by
  };

  /**
   * Updates the emergency contact information in the repository based on the given condition and update data.
   */
  var repositoryResponse = await indexRepository.update('emergency_contact_information', condition, updateData);

  /**Activity track */
  const changeLog = [
    {
      'label_name': 'Emergency Contact Name',
      'value': deleteObject?.Name,
      'action_by': body.created_by,
      'action_type': 3
    }
  ];
  activity = {
    employee_id: deleteObject?.employee_id,
    referrable_type_id: repositoryResponse?.data[0]?.id,
    activity_name: 'User Profile > Emergency Contact',
    change_log: JSON.stringify(changeLog),
    created_by: body?.created_by
  };
  event.emit('employeeDeleteActivity', { activity });
  /**Activity track */

  return repositoryResponse
};

/**
 * Store function to add Employee Emergency Contact Information entries.
 * 
 * Logic:
 * - Create a transaction for database operations.
 * - Extract data from the request body.
 * - Iterate through the data and for each entry:
 *    + Define a condition to identify the entry to update based on its ID.
 *    + Create an 'updateData' object with updated values for the entry.
 *    + Call the 'transactionRepository.update' function to update the 'emergency_contact_information' table.
 * - Commit the transaction if all updates are successful.
 * - Handle errors and rollback the transaction if any operation fails.
 * 
 * @param {Object} body - The request body containing data for updating emergency contact information.
 * @returns {Object} An object with status (true for success, false for failure) and an optional error message.
 */
const store = async (body) => {
  let trx;
  try {
    //databse connection
    const db = await getConnection();
    trx = await db.transaction()

    const data = body.emergency_contact;
    let contactName;
    for (const key in data) {

      contactName = data[key].name;
      var createData = {
        employee_id: body.employee_id,
        relationship_id: data[key].relationship_id === '' ? null : data[key].relationship_id,
        name: data[key].name,
        email_id: data[key].email_id ? data[key].email_id : null,
        contact_number: data[key].contact_number,
        address_1: data[key].address_1,
        address_2: data[key].address_2 ? data[key].address_2 : null,
        city: data[key].city,
        state_id: data[key].state_id === '' ? null : data[key].state_id,
        country_id: data[key].country_id === '' ? null : data[key].country_id,
        zip_code: data[key].zip_code,
        created_at: new Date(),
        created_by: body.created_by
      }
      /**
      * stores the 'emergency_contact_information' repository with the given store data.
      */
      var emergencyData = await indexRepository.store('emergency_contact_information', createData);
    }

    /**Activity track */
    const changeLog = [
      {
        'label_name': 'Emergency Contact Name',
        'value': contactName,
        'action_by': body.created_by,
        'action_type': 1
      }
    ];
    activity = {
      employee_id: body.employee_id,
      referrable_type_id: emergencyData.data[0].id,
      activity_name: 'User Profile > Emergency Contact',
      change_log: JSON.stringify(changeLog),
      created_by: body.created_by
    };
    event.emit('employeeStoreActivity', { activity });
    /**Activity track */

    return { status: true, emergencyData }
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};


module.exports = { destroy, update, store };
