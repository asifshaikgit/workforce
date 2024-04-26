const EventEmitter = require('events');
const event = new EventEmitter();
const moment = require('moment');
const indexRepository = require("../src/v1/user/repositories/index");
const transactionRepository = require('../src/v1/user/repositories/transactionRepository');
const prefixservices = require("../src/v1/user/services/configurations/prefixesServices");
const timesheetHelper = require('../helpers/timesheetHelpers');
const { getConnection } = require('../src/middlewares/connectionManager');
const { mailEvents } = require('../events/mailTemplateEvent/timesheetsMailEvent');
const { generateUniqueReferenceId } = require('../helpers/globalHelper');


/**
 * Event listener for 'TimesheetGeneration' event.
 *
 * Logic:
 * - Retrieve the timesheet generation start date from the placement object.
 * - Check if the timesheet generation start date is not null and is earlier than or equal to the current date.
 * - Retrieve the timesheet configuration for the placement.
 * - If a valid timesheet configuration is found:
 *   + Determine the prefix for timesheet reference ID.
 *   + Check if the placement has a valid timesheet start date.
 *   + Calculate the timesheet days and weeks based on the timesheet configuration, start date, and end date.
 *   + If the timesheet configuration cycle is not '5' and all conditions are met:
 *     * Initiate a database transaction.
 *     * Create a new timesheet entry for the placement.
 *     * Loop through each week and store timesheet hours for each day, considering default hours and weekends.
 *     * Update the placement table with the next timesheet cycle start date based on the cycle end date.
 *     * Commit the transaction.
 * - Continue checking for the next timesheet generation cycle until it is in the future.
 *
 * @param {Object} placement - The placement object for which timesheets are being generated.
 * @returns None.
 */
event.on('TimesheetGeneration', async (body,placement) => {

  var date = placement.ts_next_cycle_start != null ? moment(placement.ts_next_cycle_start).format('YYYY-MM-DD') : null
  var newDate = placement.end_date ? (moment(placement.end_date).format('YYYY-MM-DD') > moment(new Date()).format('YYYY-MM-DD')) ? moment(new Date()).format('YYYY-MM-DD') : moment(placement.end_date).format('YYYY-MM-DD') : moment(new Date()).format('YYYY-MM-DD')
  while (date == null || date <= newDate) {

    /* Checking if placement has Timesheet Configuration */
    if (placement.timesheet_configuration_id) {
      var condition = { id: placement.timesheet_configuration_id, deleted_at: null }

      /* Getting the prefix value */
      let reference_id = await generateUniqueReferenceId('timesheets', 'timesheet');
      /* Getting the prefix value */

      /* Get Timesheet Configuration */
      let ts_start_date = placement.ts_next_cycle_start === null ? placement.timesheet_start_date : placement.ts_next_cycle_start
      var timesheetsConfigurations = await indexRepository.find('timesheet_configurations', ['id', 'is_global', 'cycle_id', 'ts_mandatory', 'day_start_id', 'default_hours'], condition, null, [], null, 'id', 'desc')
      // let allowToGenerate = false;

      /**
       * Checks the status of timesheets configurations and performs necessary calculations
       * to determine if generation of timesheets is allowed.
       * @param {object} timesheetsConfigurations - The timesheets configurations object.
      //  * @param {boolean} allowToGenerate - Flag indicating if generation of timesheets is allowed.
       * @returns None
       */
      if (timesheetsConfigurations.status) {
        var day_start_id = timesheetsConfigurations.data[0].day_start_id
        var cycle_id = timesheetsConfigurations.data[0].cycle_id
        var default_hours = timesheetsConfigurations.data[0].default_hours

        /* Get Timesheet Days, weeks based on cycle_id and day_start_id */
        var cycledays = timesheetHelper.getTimesheetDays(cycle_id, day_start_id, ts_start_date, placement.end_date)
        /* Get Timesheet Days, weeks based on cycle_id and day_start_id */

      }

      if (timesheetsConfigurations.status && timesheetsConfigurations.data[0].cycle_id != 5) {

        /* Initiate DB Transaction */
        const db = await getConnection();
        let trx = await db.transaction();
        /* Initiate DB Transaction */

        /* New timesheet store object */
        const newTimesheet = {
          placement_id: placement.id,
          reference_id: reference_id,
          from: moment(cycledays.start_date).format('YYYY-MM-DD'),
          to: moment(cycledays.end_date).format('YYYY-MM-DD'),
          status: 'Drafted',
          approval_level: 1,
          drafted_on: new Date(),
          created_at: new Date()
        };
        var timesheetData = await transactionRepository.store(trx, 'timesheets', newTimesheet)
        /* New timesheet store object */

        for (let key = 1; key <= cycledays.weeks; key++) {

          /* Storing dates for each week */
          for (let i = 0; i <= 6; i++) {
            var currentDate = moment(cycledays.start_date).add(i, 'days').format('YYYY-MM-DD')
            var currentDay = moment(currentDate).day();

            /* For sunday and saturday default hours will be 00:00 */
            if (currentDay == 0 || currentDay == 6) {
              var hours = '00:00'
            } else {
              var hours = default_hours
            }
            /* For sunday and saturday default hours will be 00:00 */

            // If day is saturday add the cycle days & date
            if (i == 6) {
              cycledays.cycle_days = i
              cycledays.start_date = moment(currentDate).add(1, 'days')
            }
            if (currentDate > cycledays.end_date) {
              break
            }
            var newTimesheetHours = {
              timesheet_id: timesheetData.data[0].id,
              date: currentDate,
              total_hours: hours,
              ot_hours: '00:00',
              billable_hours: hours,
              created_at: new Date(),
            }
            await transactionRepository.store(trx, 'timesheet_hours', newTimesheetHours);
          }
        }
        /* Storing dates for each week */

        /* Update Placement Table with ts_next_cycle_start date based on the cycle end date */
        var condition = { id: placement.id }
        var updateData = { ts_next_cycle_start: moment(cycledays.end_date).add(1, 'days').format('YYYY-MM-DD') }
        await transactionRepository.update(trx, 'placements', condition, updateData)
        /* Update Placement Table with ts_next_cycle_start date based on the cycle end date */
        date = updateData.ts_next_cycle_start
        placement.ts_next_cycle_start = date

        /* Commit the transaction */
        await trx.commit();
        /* Commit the transaction */

        var timesheet_id = timesheetData.data[0]?.id

        // Emit an event to trigger sending a email for timesheets approval mails
        mailEvents.emit('timesheetsApprovalMail', body, timesheet_id);

      }
      /* Get Timesheet Configuration */
    }
  }
}

)

module.exports = { event };