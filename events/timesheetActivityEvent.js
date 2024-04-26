const EventEmitter = require('events');
const event = new EventEmitter();
const indexRepository = require('../src/v1/user/repositories/index');
const reminderServices = require('../src/v1/user/services/configurations/reminderServices');
const { toTitleCase } = require('../helpers/globalHelper');

/** 
 * Handles the timesheet activity
 * 
 *   + For any 'action_type' creating record in 'timesheet_activity_track' table in same.
 *   + Create 'timesheetactivity' object
 */
event.on('timeSheetActivity', async (data) => {

  data = data?.activity;
  // create a record on 'timesheet_activity_track' table.
  let timesheetactivity = {
    timesheet_id: data?.timesheet_id,
    action_type: data?.action_type,
    is_document_modified: (data?.action_type == 2 && data?.new_document_id) ? true : false,
    delete_hour_ids: (data?.action_type == 3) ? data.body?.timesheet_hour_ids : null,
    created_by: data.body?.created_by
  }

  const timesheetactivityData = await indexRepository.store('timesheet_activity_track', timesheetactivity);

  // create records in 'timesheet_fields_changes' table if any changes in field values
  if (data?.action_type == 2 && data?.timesheetBeforeData && data?.timesheetHoursBeforeData) {

    const timesheetBeforeData = data?.timesheetBeforeData;
    const timesheetHoursBeforeData = data?.timesheetHoursBeforeData;

    // Get the latest timesheet before data for the activity
    let timesheetLatestData = await indexRepository.find('timesheets', ['id', 'total_hours', 'total_billable_hours', 'total_ot_hours', 'status'], { 'id': data.timesheet_id }, null, []);
    timesheetLatestData = timesheetLatestData.data[0];

    // Get the latest timesheet_hours before data for the activity
    const timesheetHoursLatestData = await indexRepository.find('timesheet_hours', ['id', 'total_hours', 'billable_hours', 'ot_hours'], { 'timesheet_id': data.timesheet_id }, null, []);

    // update the changes in timesheetdata if any
    for (const key in timesheetBeforeData) {
      if (timesheetBeforeData.hasOwnProperty(key) && timesheetLatestData.hasOwnProperty(key)) {
        if (timesheetBeforeData[key]?.hours === timesheetLatestData[key]?.hours) {
          // if values in both keys are same nothing happens here
        } else {
          // insert in the 'timesheet_fields_changes' changes made for the fields
          const fieldsChanges = {
            timesheet_activity_track_id: timesheetactivityData?.data[0]?.id,
            field_name: await toTitleCase(key),
            old_value: timesheetBeforeData[key],
            new_value: timesheetLatestData[key]
          };
          await indexRepository.store('timesheet_fields_changes', fieldsChanges);
        }
      }
    }

    // update the changes in timesheethoursdata if any
    // Iterate through the first array
    for (let i = 0; i < timesheetHoursBeforeData?.length; i++) {
      const object1 = timesheetHoursBeforeData[i];
      let object2 = timesheetHoursLatestData?.data?.find(item => item.id == object1?.id);
      for (const key in object1) {
        if (object1.hasOwnProperty(key) && object2.hasOwnProperty(key)) {
          if (object1[key] === object2[key]) {
            // if values in both keys are same nothing happens here
          } else {
            // insert in the 'timesheet_fields_changes' changes made for the fields
            const fieldsChanges = {
              timesheet_activity_track_id: timesheetactivityData?.data[0]?.id,
              timesheet_hours_id: object1?.id,
              field_name: key,
              old_value: object1[key],
              new_value: object2[key]
            };
            await indexRepository.store('timesheet_fields_changes', fieldsChanges);
          }
        }
      }
    }
  }
});

event.on('timeSheetReminderActivity', async (data) => {

  // var reminderData = await reminderServices.index({ 'rc.referrable_type': 'timesheet' })
  let employees = []

  var getReminderData = await indexRepository.find('reminder_referrables', ['group_ids', 'content'], { reminder_name_id: data.reminder_name_id }, null, [], null, 'id', 'desc', false, 'id')//for reminder and timesheet approval employees
  if (getReminderData.status) { // getting groupids and content template for the 
    // var getReminder = getReminderData.data
    // if (getReminder[0].group_ids != null && getReminder[0].group_ids.length > 0) {
    //   for (const key in getReminder[0].group_ids) {
    //     var groupEmployes = await indexRepository.find('notification_group_users', ['employee_id'], { referrable_type: 1, referrable_id: getReminder[0].group_ids[key].group_ids }, null, [], null, 'id', 'asc', false)
    //     employees = groupEmployes?.data.filter(obj => obj.employee_id)
    //   }
    // }

    // Fetch the approval users
    const joins = [
      { table: 'approval_users', condition: ['approval_users.approval_level_id', 'approval_levels.id'], type: 'left' },

      { table: 'employee', condition: ['employee.id', 'approval_users.approver_id'], type: 'left' }
    ];
    let getApprovers = await indexRepository.find('approval_levels', ['approval_users.approver_id as employee_id'], { 'approval_levels.approval_setting_id': data.timesheet_approval_id, 'approval_levels.level': data.approval_level }, null, joins);

    if (getApprovers.status) {// if approvers exists pushing them to 
      // employees = [...employees, ...getApprovers?.data.filter(obj => obj.employee_id)]
      employees = getApprovers?.data.filter(obj => obj.employee_id)
    }

    const joinss = [{ table: 'employee as emp', alias: 'emp', condition: ['emp.id', 'placements.employee_id'], type: 'left' },
    { table: 'companies as com', alias: 'com', condition: ['com.id', 'placements.client_id'], type: 'left' }]

    var names = await indexRepository.find('placements', ['emp.display_name', 'com.name as client_name', 'emp.reference_id'], { 'placements.id': data.placement_id }, null, joinss) // getting names of employee and client for the template

    var ts_id = data.timesheet_reference_id ? data.timesheet_reference_id : data.reference_id
    let replaceObj = {
      '{{timesheet_number}}': ts_id, // reference_id
      '{{display_name}}': names.status ? names.data[0].display_name : '',
      '{{employee_id}}': names.status ? names.data[0].reference_id : '',
      '{{client_name}}': names.status ? names.data[0].client_name : ''
    }; // object data to replace template data

    let parsedTemplate = allReplace(getReminderData.data[0].content, replaceObj); // replacing the object data with template data

    var redirectionInfo =
    {
      module: 'timesheet',
      referable_id: ts_id
    } // redirection infor for the reminder


    if (employees.length > 0) {
      for (const item in employees) { // looping the employees for approval 
        var reminderObject = {
          reminder_slug_id: data.reminder_name_id,
          employee_id: employees[item].employee_id,
          template: parsedTemplate,
          redirection_info: redirectionInfo,
          created_by: data.created_by
        }
        var reminder = await indexRepository.store('reminders', reminderObject) // storing in the reminders table
      }
    }
  }
})

function allReplace(str, obj) {
  for (const x in obj) {
    const regex = new RegExp(`${x}`, 'g');
    str = str.replace(regex, obj[x]);
  }
  return str;
}

module.exports = { event };