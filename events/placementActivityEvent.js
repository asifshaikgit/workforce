const eventsEmitter = require('events');
const events = new eventsEmitter();
const { getConnection } = require('../src/middlewares/connectionManager');
const indexRepository = require('../src/v1/user/repositories/index');
const { toTitleCase } = require('../helpers/globalHelper');

events.on('placementClientUpdateActivity', async (data) => {
  /** In activityData[] store the changed fields data*/
  activityData = [];
  if (JSON.stringify(data.beforeData) !== JSON.stringify(data.afterData)) {

    var fieldData = {
      placement_id: data.activity.placement_id,
      referrable_type: data.activity.referrable_type,
      referrable_type_id: data.activity.referrable_type_id,
      action_type: 2,
      created_at: new Date(),
      created_by: data.activity.created_by,
    };

    const db = await getConnection();
    const activityResponse = await db('placement_activity_track').insert(fieldData, 'id');

    for (const key in data.afterData) {

      if (data.beforeData[key] !== data.afterData[key]) {
        if (key == 'Placement Document') {
          var fieldData = {
            placement_activity_track_id: activityResponse[0].id,
            is_document_modified: true,
            field_name: key
          }
          await db('placement_fields_changes').insert(fieldData);
        } else {
          var fieldData = {
            placement_activity_track_id: activityResponse[0].id,
            is_document_modified: false,
            field_name: key,
            old_value: data.beforeData[key],
            new_value: data.afterData[key]
          }
          await db('placement_fields_changes').insert(fieldData);
        }
      }
    }
  }
});

//delete activity
events.on('employeeDeleteActivity', async (data) => {

  var fieldData = {
    employee_id: data.employee_id,
    referrable_type: data.referrable_type,
    referrable_type_id: data.referrable_type_id,
    action_type: 3,
    created_at: new Date(),
    created_by: data.created_by,
  };

  const db = await getConnection();
  await db('placement_activity_track').insert(fieldData, 'id');
});

//store activity
events.on('placementClientStoreActivity', async (data) => {
  var fieldData = {
    placement_id: data.activity.placement_id,
    referrable_type: data.activity.referrable_type,
    referrable_type_id: data.activity.referrable_type_id,
    action_type: 1,
    created_at: new Date(),
    created_by: data.activity.created_by,
  };

  const db = await getConnection();
  await db('placement_activity_track').insert(fieldData);
});

/**
 * Placement Invoice Activity common for store, update of an invoice activity in placements module
 */
events.on('placementActivity', async (data) => {
  data = data?.activity;

  // create an object 'placementActivity' and insert in 'invoice_activity_track' table.
  let placementActivity = {
    placement_id: data.placement_id,
    referrable_type: data.referrable_type,
    action_type: data.action_type, //1 for create 
    created_by: data.created_by
  };

  // Store placement activity track
  const placementActivityData = await indexRepository.store('placement_activity_track', placementActivity);

  // create records in 'company_fields_changes' table if any changes in field values
  if (data?.action_type == 2 && data?.beforeUpdate) {

    /** BEFORE DATA */
    const beforeUpdate = data?.beforeUpdate;
    let beforeUpdateApprovalLevels;
    if (data?.beforeApprovalLevels) {
      const beforeApprovalLevels = data?.beforeApprovalLevels;
      // Group the data by approval_level_id
      beforeUpdateApprovalLevels = beforeApprovalLevels?.reduce((acc, obj) => {
        const { approval_level_id, user_id } = obj;
        if (!acc[approval_level_id]) {
          acc[approval_level_id] = [];
        }
        acc[approval_level_id].push(user_id);
        return acc;
      }, {});


      // Transform the grouped data into the desired format
      beforeUpdateApprovalLevels = Object.entries(beforeUpdateApprovalLevels).map(([approval_level_id, user_ids]) => ({
        "approval_level_id": parseInt(approval_level_id),
        "user_id": user_ids
      }));
    }
    /** BEFORE DATA */

    /** AFTER DATA */
    // fetch the afterUpdate data
    let afterUpdate = await indexRepository.find('placements', data.fields, { 'placements.id': data.placement_id }, null, data.joins);
    afterUpdate = afterUpdate.data[0];
    let afterUpdateApprovalLevels;
    if (data?.approvalLevelsQuery) {

      // get afterupdate approvals levels
      let approvalLevels = await indexRepository.rawQuery(data.approvalLevelsQuery);
      approvalLevels = approvalLevels[0]?.approval_levels;

      afterUpdateApprovalLevels = approvalLevels?.reduce((acc, obj) => {
        const { approval_level_id, user_id } = obj;
        if (!acc[approval_level_id]) {
          acc[approval_level_id] = [];
        }
        acc[approval_level_id].push(user_id);
        return acc;
      }, {});

      // Transform the grouped data into the desired format
      afterUpdateApprovalLevels = Object.entries(afterUpdateApprovalLevels).map(([approval_level_id, user_ids]) => ({
        "approval_level_id": parseInt(approval_level_id),
        "user_id": user_ids
      }))
    }

    // update the changes in timesheetdata if any
    for (const key in beforeUpdate) {
      if (beforeUpdate && afterUpdate && key != 'Invoice start date' && key != 'Timesheet start date' && beforeUpdate.hasOwnProperty(key) && afterUpdate.hasOwnProperty(key)) {
        if (beforeUpdate[key] === afterUpdate[key]) {
          // if values in both keys are same nothing happens here

          // if no change in `timesheet_approval_config_type` check any new approval levels been added
          if (key == 'timesheet_approval_config_type' || key == 'invoice_approval_config_type') {
            if (afterUpdateApprovalLevels && beforeUpdateApprovalLevels && beforeUpdateApprovalLevels?.length > 0 && afterUpdateApprovalLevels.length > 0) {
              beforeUpdateApprovalLevels.map(async level => {

                // fetch the respective `approval_level_id` from afterUpdateApprovalLevels
                afterUpdateLevel = afterUpdateApprovalLevels.find(x => x.approval_level_id == level.approval_level_id);

                const sortedArr1 = afterUpdateLevel?.user_id.slice().sort().join();
                const sortedArr2 = level?.user_id.slice().sort().join();

                if (sortedArr1 === sortedArr2) {

                } else {
                  // insert in the 'timesheet_fields_changes' changes made for the fields
                  const fieldsChanges = {
                    placement_activity_track_id: placementActivityData?.data[0]?.id,
                    field_name: 'Approval Level Id - ' + level?.approval_level_id,
                    old_value: level?.user_id,
                    new_value: afterUpdateLevel?.user_id
                  };
                  await indexRepository.store('placement_fields_changes', fieldsChanges);
                }
              });
            }
          }
        } else {
          // insert in the 'timesheet_fields_changes' changes made for the fields
          const fieldsChanges = {
            placement_activity_track_id: placementActivityData?.data[0]?.id,
            field_name: await toTitleCase(key),
            old_value: beforeUpdate[key],
            new_value: afterUpdate[key]
          };
          await indexRepository.store('placement_fields_changes', fieldsChanges);
        }
      }
    }
  }
});


module.exports = { events };