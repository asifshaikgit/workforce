const EventEmitter = require('events');
const event = new EventEmitter();
const { getConnection } = require('../src/middlewares/connectionManager');
const commonService = require('../src/v1/user/services/employee/commonService');

/**
 * Employee Update Activity
 * Update the Field Changes for User Profile > General Details, User Profile > Emergency Contacts, User profile > Skills.
 */
event.on('employeeUpdateActivity', async (data) => {

  let afterUpdateData = {};
  let beforeUpdateData = data.beforeUpdateData;
  if (data.activity?.slug) {
    if (data.activity?.slug == 'general_details') {
      afterUpdateData = await commonService.employeeGeneralDetails(data.activity?.employee_id);
    } else if (data.activity?.slug == 'emergency_contact') {
      afterUpdateData = await commonService.getEmergencyContactDetails(data.activity?.referrable_type_id);
    } else if (data.activity?.slug == 'skills_update') {
      afterUpdateData = await commonService.getSkillDetails({ 'employee_skill_details.id': data.activity?.referrable_type_id }, data.activity?.isDocumentUpdate);
    } else if (data.activity?.slug == 'passport') {
      afterUpdateData = await commonService.getPassportDetails({ 'id': data.activity?.referrable_type_id }, data.activity?.isDocumentUpdate);
    } else if (data.activity?.slug == 'i94') {
      afterUpdateData = await commonService.getI94Details({ 'id': data.activity?.referrable_type_id }, data.activity?.isDocumentUpdate);
    } else if (data.activity?.slug == 'work_autorization_visa') {
      afterUpdateData = await commonService.getVisaDetails({ 'employee_visa_details.id': data.activity?.referrable_type_id }, data.activity?.isDocumentUpdate);
    } else if (data.activity?.slug == 'other_documents') {
      afterUpdateData = await commonService.getDocumentDetails({ 'employee_personal_documents.id': data.activity?.referrable_type_id }, data.activity?.isDocumentUpdate);
    }
  }

  let changeLog = [];
  if (JSON.stringify(beforeUpdateData) !== JSON.stringify(afterUpdateData)) {

    // Create Change Log Object
    for (const key in afterUpdateData) {
      if (key != 'reference_name') {
        if (beforeUpdateData[key] !== afterUpdateData[key]) {
          const logObject = {
            'label_name': key,
            'old_value': beforeUpdateData[key],
            'new_value': afterUpdateData[key],
            'action_by': data.activity.created_by,
            'reference_name': beforeUpdateData.reference_name ?? '',
            'action_type': 2
          }
          changeLog.push(logObject);
        }
      }
    }

    var fieldData = {
      employee_id: data.activity.employee_id,
      referrable_type_id: data.activity.referrable_type_id,
      action_type: 2,
      change_log: JSON.stringify(changeLog),
      created_at: new Date(),
      created_by: data.activity.created_by,
      activity: data.activity.activity_name
    };

    const db = await getConnection();
    await db('employee_profile_activity_track').insert(fieldData, 'id');
  }
});

//delete activity
event.on('employeeDeleteActivity', async (data) => {

  var fieldData = {
    employee_id: data.activity?.employee_id,
    referrable_type_id: data.activity?.referrable_type_id,
    action_type: 3,
    created_at: new Date(),
    created_by: data.activity?.created_by,
    change_log: data.activity?.change_log,
    activity: data.activity?.activity_name
  };

  const db = await getConnection()
  await db('employee_profile_activity_track').insert(fieldData);
});

//store activity
event.on('employeeStoreActivity', async (data) => {

  var fieldData = {
    employee_id: data.activity?.employee_id,
    referrable_type_id: data.activity?.referrable_type_id,
    action_type: 1,
    created_at: new Date(),
    created_by: data.activity.created_by,
    change_log: data.activity?.change_log,
    activity: data.activity?.activity_name
  };

  const db = await getConnection()
  await db('employee_profile_activity_track').insert(fieldData);
});

/**
 * Employee Bank Details Activity.
 * Handles Store, Update, Delete of an bank details for a specific employee.
 */
event.on('employeebankActivity', async (data) => {

  const changeLog = [];
  let beforeUpdateData = data?.beforeUpdateData ?? [];
  let afterUpdateData = await commonService.getBankDetails({ employee_id: data.body?.employee_id }, data.body?.bank_information);

  // Handle Delete of a Bank Detail
  if (afterUpdateData.length < beforeUpdateData.length) {
    // Extract IDs from the objects in afterUpdate
    const afterIds = new Set(afterUpdateData.map(obj => obj.id));

    // Find objects in beforeUpdate that are not present in afterUpdate
    const missingBank = beforeUpdateData.filter(obj => !afterIds.has(obj.id));

    if (missingBank && missingBank?.length > 0) {
      missingBank.map(deletedBank => {
        const logObject = {
          'label_name': 'Bank Name',
          'value': deletedBank.reference_name ?? '',
          'action_type': 3,
        };
        changeLog.push(logObject);
      })
    }
  }

  await Promise.all(afterUpdateData.map(async afterUpdateBank => {

    // Find Respective bank Detail in beforeUpdate Data
    const beforeUpdateBank = await beforeUpdateData.find(x => x.id == afterUpdateBank.id);
    if (beforeUpdateBank != undefined && beforeUpdateBank != '' && beforeUpdateBank != null) {

      // Handles Update of a Bank Detail
      if (JSON.stringify(beforeUpdateBank) !== JSON.stringify(afterUpdateBank)) {
        for (key in afterUpdateBank) {
          if (key != 'id' && key != 'reference_name' && key != 'void_check_document_modified' && key != 'w4_form_document_modified' && key != 'document_name') {
            if (afterUpdateBank[key] != beforeUpdateBank[key]) {
              const logObject = {
                'label_name': key,
                'old_value': beforeUpdateBank[key],
                'new_value': afterUpdateBank[key],
                'reference_name': beforeUpdateBank.reference_name ?? '',
                'referrable_type_id': afterUpdateBank.id ?? '',
                'action_type': 2
              };
              changeLog.push(logObject);
            }
          }

          if ((key == 'void_check_document_modified' || key == 'w4_form_document_modified') && afterUpdateBank[key] == true) {
            const logObject = {
              'label_name': afterUpdateBank?.document_name,
              'reference_name': beforeUpdateBank.reference_name ?? '',
              'referrable_type_id': afterUpdateBank.id ?? '',
              'action_type': 2
            };
            changeLog.push(logObject);
          }
        }
      }
    } else {

      // Handles New Added Bank Details
      const logObject = {
        'label_name': 'Bank Name',
        'value': afterUpdateBank.reference_name,
        'referrable_type_id': afterUpdateBank.id ?? '',
        'action_type': 1
      };
      changeLog.push(logObject);
    }
  }));

  if (changeLog && changeLog.length > 0) {
    var fieldData = {
      employee_id: data.body?.employee_id,
      created_at: new Date(),
      created_by: data.body?.created_by,
      change_log: JSON.stringify(changeLog),
      activity: 'User Profile > Pay Configuration > Bank Details'
    };

    const db = await getConnection()
    await db('employee_profile_activity_track').insert(fieldData);
  }
});


module.exports = { event };
