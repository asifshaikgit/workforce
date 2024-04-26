const EventEmitter = require('events');
const event = new EventEmitter();
const { getConnection } = require('../src/middlewares/connectionManager');
const indexRepository = require("../src/v1/user/repositories/index");

/**
 * Handles the company activity
 * 
 */
event.on('companyActivity', async (data) => {
  data = data?.activity;

  // create an object 'companyActivityTrack' and insert in 'companies_activity_track' table.
  let companyActivityTrack = {
    company_id: data?.company_id,
    referrable_type: data?.referrable_type,
    referrable_type_id: (data?.referrable_type_id) ? data?.referrable_type_id : null,
    action_type: data?.action_type,
    created_by: data?.created_by
  }

  const companyactivityData = await indexRepository.store('companies_activity_track', companyActivityTrack);

  // create records in 'company_fields_changes' table if any changes in field values
  if (data?.action_type == 2 && data?.beforeUpdate && data?.afterUpdate) {

    const beforeUpdate = data?.beforeUpdate;
    const afterUpdate = data?.afterUpdate;

    // update the changes in timesheetdata if any
    for (const key in beforeUpdate) {
      if (beforeUpdate.hasOwnProperty(key) && afterUpdate.hasOwnProperty(key)) {
        if (beforeUpdate[key] === afterUpdate[key]) {
          // if values in both keys are same nothing happens here
        } else {
          // insert in the 'timesheet_fields_changes' changes made for the fields
          const fieldsChanges = {
            company_activity_track_id: companyactivityData?.data[0]?.id,
            field_name: key,
            old_value: beforeUpdate[key],
            new_value: afterUpdate[key]
          };
          await indexRepository.store('company_fields_changes', fieldsChanges);
        }
      }
    }
  }
});

/**
 * Handles the 'ClientData' event and performs a series of updates and deletions
 * on various repositories based on the provided data.
 * @param {Object} data - The data object containing the condition and updateData.
 * @returns {Promise} A promise that resolves with the repository response.
 */
/**
 * Event handler for the 'ClientData' event. Updates various repositories with the provided data.
 * @param {object} data - The data object containing the condition and updateData.
 * @returns {Promise<object>} - A promise that resolves to the repository response.
 */
event.on('ClientData', async (data) => {

  await indexRepository.update('client_address', data.condition, data.updateData); // update in client address table

  await indexRepository.update('client_contacts', data.condition, data.updateData);// update in client contacts table

  /**
   * Deletes placement-related data and associated timesheet data based on the given condition.
   * @param {object} data - The data object containing the condition and updateData.
   * @returns None
   */
  let placementData = await indexRepository.find('placements', ['id'], data.condition, 0);
  for (const key in placementData.data) {

    let placementInfo = placementData.data[key]; // Assigning the placement information

    let placementcondition = { placement_id: placementInfo.id };  // Conditon of the placement related soft delete operation

    await indexRepository.update('placements', { id: placementInfo.id }, data.updateData); // Deleteing data for this placements 

    await indexRepository.update('placement_billing_details', placementcondition, data.updateData); //Deleteing data for this placements billing details 

    await indexRepository.update('placement_client_contacts', placementcondition, data.updateData); //Deleteing data for this placements client contacts

    await indexRepository.update('placement_end_client_contacts', placementcondition, data.updateData);  //Deleteing data for this placements end client contacts

    await indexRepository.update('placement_documents', placementcondition, data.updateData);  //Deleteing data for this placements documents

    // finding timesheet data and updating i.e soft delete all timesheets information.
    let timesheetData = await indexRepository.find('timesheets', ['id'], placementcondition, 0);

    for (const key in timesheetData.data) {
      let timesheetcondition = { timesheet_id: timesheetData.data[key].id };

      await indexRepository.update('timesheets', placementcondition, data.updateData); // softdelete the timesheet data

      await indexRepository.update('timesheet_documents', timesheetcondition, data.updateData); // softdelete the timesheet documents

      await indexRepository.update('timesheet_reminders', timesheetcondition, data.updateData); // softdelete the timesheet remainders
    }
  }


  /**
   * Updates multiple records in the invoices repository based on the given condition and update data.
   * @param {object} data - The data object containing the condition and update data.
   * @param {object} data.condition - The condition to filter the records to be updated.
   * @param {object} data.updateData - The data to be updated in the records.
   * @returns None
   */
  let invoiceData = await indexRepository.find('invoices', ['id'], data.condition, 0);
  for (const key in invoiceData.data) {

    let invoicecondition = { invoice_id: invoiceData.data[key].id };

    await indexRepository.update('invoices', data.condition, data.updateData); // Update i.e softdelete the invoices

    await indexRepository.update('invoice_documents', invoicecondition, data.updateData); // Update i.e softdelete the invoice documents

    await indexRepository.update('invoices_billing_details', invoicecondition, data.updateData); // Update i.e softdelete the invoice billing details

    await indexRepository.update('invoices_send_details', invoicecondition, data.updateData); // Update i.e softdelete the invoice send details

    await indexRepository.update('invoice_reminders', invoicecondition, data.updateData); // Update i.e softdelete the invoice reminders
  }

  let condition = { id: data.condition.client_id }; // condition

  /**
   * Softdelete i.e update the client data object
   */
  let updateData = {
    status: 'In Active',
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: data.updateData.updated_by,
  };

  await indexRepository.update('clients', condition, updateData); // update client data

});


module.exports = { event };
