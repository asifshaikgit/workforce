const EventEmitter = require('events');
const event = new EventEmitter();
const indexRepository = require("../src/v1/user/repositories/index");
const { toTitleCase } = require('../helpers/globalHelper');

/**
 * Expense Activity Track - common for store, update, delete.
 */
event.on('expenseActivity', async (data) => {

  data = data?.activity;

  // create an object 'expenseActivityTrack' and insert in 'expense_activity_track' table.
  let expenseActivityTrack = {
    expense_id: data?.expense_id,
    action_type: data?.action_type,
    created_by: data?.created_by
  }

  const expenseactivityData = await indexRepository.store('expense_activity_track', expenseActivityTrack);

  // create records in 'company_fields_changes' table if any changes in field values
  if (data?.action_type == 2 && data?.beforeUpdate) {

    const beforeUpdate = data?.beforeUpdate;

    // Fetching expense afterUpdate data
    // let fields = ['expense_management.*', 'emt.name as expense_type']
    let afterUpdate = await indexRepository.find('expense_management', data?.fields, { id: data.expense_id });
    afterUpdate = afterUpdate.data[0];

    // update the changes in expenseData if any
    for (const key in beforeUpdate) {
      if (beforeUpdate.hasOwnProperty(key) && afterUpdate.hasOwnProperty(key)) {
        if (beforeUpdate[key] === afterUpdate[key]) {
          // if values in both keys are same nothing happens here
        } else {
          // insert in the 'timesheet_fields_changes' changes made for the fields
          const fieldsChanges = {
            expense_activity_track_id: expenseactivityData?.data[0]?.id,
            field_name: await toTitleCase(key),
            old_value: beforeUpdate[key],
            new_value: afterUpdate[key]
          };
          await indexRepository.store('expense_fields_changes', fieldsChanges);
        }
      }
    }
  }
});
module.exports = { event };
