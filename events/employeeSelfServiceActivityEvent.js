const EventEmitter = require('events');
const event = new EventEmitter();
const { getConnection } = require('../src/middlewares/connectionManager');

// update activity
event.on('employeeSelfServiceUpdateActivity', async (data) => {

  activityData = []
  if (JSON.stringify(data.beforeData) !== JSON.stringify(data.afterData)) {

    var fieldData = {
      employee_self_service_id: data.activity.employee_self_service_id,
      action_type: data.activity.action_type,
      created_by: data.activity.created_by,
      created_at: new Date()
    };

    const db = await getConnection();
    const activityResponse = await db('employee_self_service_track').insert(fieldData, 'id');

    for (const key in data.afterData) {

      if (data.beforeData[key] !== data.afterData[key]) {
        if (key == 'Document') {
          var fieldData = {
            employee_self_service_track_id: activityResponse[0].id,
            is_document_modified: true,
            field_name: key
          }
          await db('employee_self_service_fields_changes').insert(fieldData);
        } else {
          var fieldData = {
            employee_self_service_track_id: activityResponse[0].id,
            is_document_modified: false,
            field_name: key,
            old_value: data.beforeData[key],
            new_value: data.afterData[key]
          }
          await db('employee_self_service_fields_changes').insert(fieldData);
        }
      }
    }
  }
});

//store activity
event.on('employeeSelfServiceStoreActivity', async (data) => {

  var fieldData = {
    employee_self_service_id: data.employee_self_service_id,
    action_type: data.action_type,
    created_by: data.created_by,
    created_at: new Date()
  };

    const db = await getConnection();
    await db('employee_self_service_track').insert(fieldData);

});

module.exports = { event };
