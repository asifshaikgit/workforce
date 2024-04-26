const EventEmitter = require('events');
const event = new EventEmitter();
const moment = require('moment');
const indexRepository = require("../src/v1/user/repositories/index");
const timesheetHelper = require('../helpers/timesheetHelpers');
const config = require('../config/app');
const fs = require('fs');

event.on('TimesheetConfigurationChange', async (body) => {

  // Fetching the placement information
  let placementData = await indexRepository.find('placements', ['id', 'timesheet_start_date', 'end_date', 'employee_id'], { id: body.body.placement_id }, 0);

  let updateData = {
    updated_at: new Date(),
    updated_by: body.body.updated_by,
    deleted_at: new Date(),
  }

  let placementInfo = placementData.data[0]; // Assigning the placement information

  let placementcondition = { placement_id: placementInfo.id, global_search: `("to" >= '${moment(placementInfo.timesheet_start_date).format('YYYY-MM-DD')}')` };  // Conditon of the placement related soft delete operation

  // finding timesheet data and updating i.e soft delete all timesheets information.
  let timesheetData = await indexRepository.find('timesheets', ['id', 'from', 'to', 'reference_id'], placementcondition, 0, [], null, 'created_at', 'asc');

  if (timesheetData.status) {
    let existingTimesheet_ids = [];

    for (const key in timesheetData.data) {

      if (moment(placementInfo.timesheet_start_date).isAfter(timesheetData.data[key].from) && moment(placementInfo.timesheet_start_date).isSameOrBefore(timesheetData.data[key].to)) {

        await indexRepository.update('timesheets', { id: timesheetData.data[key].id }, { to: moment(placementInfo.timesheet_start_date).add(-1, 'days').format('YYYY-MM-DD'), updated_at: new Date(), updated_by: body.body.updated_by, });
        existingTimesheet_ids.push(timesheetData.data[key].id);

      } else {
        // Soft delete the timesheet 
        await indexRepository.update('timesheets', { id: timesheetData.data[key].id }, updateData);

        // Delete the exisitng timesheet documents and soft delete the timesheet documents entries
        let timesheetDocuments = await indexRepository.find('timesheet_documents', ['id', 'document_path'], { timesheet_id: timesheetData.data[key].id, aws_s3_status: false });
        if (timesheetDocuments.status) {
          for (let index in timesheetDocuments.data) {
            let _pathDest = config.documentUploadPath + '/' + timesheetDocuments.data[index].document_path;
            fs.unlink(_pathDest, (error) => {
              console.log(error);
              return;
            });
            await indexRepository.update('timesheet_documents', { id: timesheetDocuments.data[key].id }, { deleted_at: new Date() });
          }
        }
        existingTimesheet_ids.push(timesheetData.data[key].id);

        // TS Documents code
        /*let timesheetDocuments = await indexRepository.find('timesheet_documents', ['*'], timesheetcondition)
        if (timesheetDocuments.status) {
          const sourceFilePath = timesheetDocuments.data[0].document_path;
          // Split the path into parts using the delimiter "/"
          const pathParts = sourceFilePath.split('/');

          // Find the index of "Timesheets" in the path
          const timesheetsIndex = pathParts.findIndex(part => part === 'Timesheets');
          let destinationPath = '';
          if (timesheetsIndex !== -1) {
            // Replace the desired substring at the Timesheets index
            pathParts[timesheetsIndex + 1] = newSubstring;

            // Construct the new path by joining the parts with "/"
            destinationPath = pathParts.join('/');
          }

          // Extract the filename from the source path
          const filename = path.basename(sourceFilePath);

          // Construct the destination path including the filename
          const destinationFilePath = path.join(destinationPath, filename);

          // Move the file
          fs.rename(sourceFilePath, destinationFilePath);
          await indexRepository.update('timesheet_documents', timesheetcondition, updateData); // softdelete the timesheet documents
        }*/
      }
    }

    if ((body.oldTimesheetSetting.cycle_id !== body.newTimesheetSetting.cycle_id) || (body.oldTimesheetSetting.day_start_id !== body.newTimesheetSetting.day_start_id) || (body.newTimesheetSetting.timesheet_start_date != body.oldTimesheetSetting.timesheet_start_date)) {

      let start_date = placementInfo.timesheet_start_date;
      for (let loop = 0; loop <= 20; loop++) {
        let today = new Date();
        let eff_start_date = new Date(start_date);
        if (eff_start_date <= today) {
          // Function to generate the timesheets
          start_date = await generateNewTimesheet(body, eff_start_date, placementInfo, existingTimesheet_ids);
        } else {
          loop = 21;
          break;
        }
      }
      /**
       * Once regenartion done updating the regeneration status
       */
      await indexRepository.update('placements', { id: placementInfo.id }, { regenerate_timesheet: false });
    }
  }
});

const generateNewTimesheet = async (body, start_date, placementInfo, existingTimesheet_ids) => {

  /* Get Timesheet Days, weeks based on cycle_id and day_start_id */
  var cycledays = timesheetHelper.getTimesheetDays(body.newTimesheetSetting.cycle_id, body.newTimesheetSetting.day_start_id, start_date, placementInfo.end_date)
  /* Get Timesheet Days, weeks based on cycle_id and day_start_id */

  /**
   * Cycle days consists of start and end dates
   * Checking the timesheets availabe between these dates in timesheets table
   */
  const checkTimesheetExists = await indexRepository.find('timesheets', ['id'], { from: moment(cycledays.start_date).format('YYYY-MM-DD'), to: moment(cycledays.end_date).format('YYYY-MM-DD'), placement_id: placementInfo.id });

  if (!checkTimesheetExists.status) {

    const date1 = new Date();
    const date2 = new Date(cycledays.start_date);

    if (date2 <= date1 && body.newTimesheetSetting.cycle_id != 5) {

      /* Getting the prefix value */
      const count = await indexRepository.count('timesheets');
      const prefix = await indexRepository.find('prefixes', ['*'], { slug: 'timesheet' });
      let reference_id = prefix.data[0].prefix_name + prefix.data[0].separator + (Number(count.data) + prefix.data[0].number);
      /* Getting the prefix value */

      const newTimesheet = {
        placement_id: placementInfo.id,
        reference_id: reference_id,
        from: moment(cycledays.start_date).format('YYYY-MM-DD'),
        to: moment(cycledays.end_date).format('YYYY-MM-DD'),
        status: 'Drafted',
        approval_level: 1,
        created_at: new Date()
      };
      var timesheetDataInfo = await indexRepository.store('timesheets', newTimesheet)

      for (let key = 1; key <= cycledays.weeks; key++) {

        /* Storing dates for each week */
        for (let i = 0; i <= 6; i++) {
          var currentDate = moment(cycledays.start_date).add(i, 'days').format('YYYY-MM-DD')
          var currentDay = moment(currentDate).day();

          let timesheetHourExists = await indexRepository.find('timesheet_hours', ['id'], { date: currentDate, 'timesheet_id': existingTimesheet_ids });
          if (timesheetHourExists.status) {
            await indexRepository.update('timesheet_hours', { id: timesheetHourExists.data[0].id }, { timesheet_id: timesheetDataInfo.data[0].id })
          } else {
            /* Check if employee is on vacation */
            var empOnVacation = false;
            var employeeVacationData = await indexRepository.find('employee_vacation', ['id'], { employee_id: placementInfo.employee_id, date_less_than_equal: [{ column: 'from_date', date1: currentDate }], date_greater_than_equal: [{ column: 'to_date', date1: currentDate }] });
            if (employeeVacationData.status) {
              empOnVacation = true
            }

            /* For sunday and saturday default hours will be 00:00 */
            if (currentDay == 0 || currentDay == 6 || empOnVacation) {
              var hours = '00:00'
            } else {
              var hours = body.newTimesheetSetting.default_hours
            }
            /* For sunday and saturday default hours will be 00:00 */

            if (i == 6) {
              cycledays.cycle_days = i
              cycledays.start_date = moment(currentDate).add(1, 'days')
            }
            if (currentDate > cycledays.end_date) {
              break
            }
            var newTimesheetHours = {
              timesheet_id: timesheetDataInfo.data[0].id,
              date: currentDate,
              total_hours: hours,
              ot_hours: '00:00',
              billable_hours: hours,
              created_at: new Date(),
            }
            await indexRepository.store('timesheet_hours', newTimesheetHours);
          }
        }
        /* Storing dates for each week */
      }

      let updatePlacementNxtCycleDate = {
        ts_next_cycle_start: moment(cycledays.end_date).add(1, 'days').format('YYYY-MM-DD')
      }
      /**
       * Updating the placement next timesheet start date based on the information.
       */
      await indexRepository.update('placements', { id: placementInfo.id }, updatePlacementNxtCycleDate);
    }
  }
  return moment(cycledays.end_date).add(1, 'days').format('YYYY-MM-DD');
}

module.exports = { event };
