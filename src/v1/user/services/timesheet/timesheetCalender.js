const timesheetsRepository = require('../../repositories/timesheet/timesheetsRepository')
require('dotenv').config()
const moment = require('moment')
const indexRepository = require('../../repositories/index')
const format = require('../../../../../helpers/format')
const { calculateWeeks } = require('../../../../../helpers/timesheetHelpers')

/**
 * Retrieves timesheet data using the 'getTimesheetsListView' SQL query.
 *
 * @param {object} condition - An object containing 'from_date', 'to_date', and 'employee_id' properties.
 * @param {string} dateFormat - The format for date representation.
 * @param {number} page - The current page number for pagination.
 * @param {number} limit - The limit of records per page for pagination.
 * @returns {object} - An object with 'status' indicating the success or failure of the operation, 'data' containing the retrieved timesheet data, and 'pagination_data' with pagination details.
 *
 * Logic:
 * - Constructs an SQL query using the provided conditions, 'from_date', 'to_date', 'employee_id', 'dateFormat', 'limit', and 'page'.
 * - Executes the query using 'indexRepository.rawQuery' to retrieve timesheet data.
 * - Prepares pagination details including 'total', 'currentPage', 'perPage', and 'totalPages'.
 * - Returns an object with 'status' indicating success or failure, 'data' containing the retrieved timesheet data, and 'pagination_data' with pagination details.
 */
const rangeTotalView = async (condition, dateFormat, page, limit) => {
  let query = `SELECT * FROM getTimesheetsListView(`
  query +=
    condition.from_date && condition.to_date
      ? `'${condition.from_date}', '${condition.to_date}',`
      : `${condition.from_date}, ${condition.to_date},`
  query +=
    condition.employee_id !== null
      ? `'${condition.employee_id}',`
      : `${condition.employee_id},`
  query += (condition.search !== null) ? `'${condition.search}',` : `${condition.search},`;
  query += `'${dateFormat}', ${limit}, ${page})`

  const timesheetListViewDetails = await indexRepository.rawQuery(query)

  let pagination_details = {
    total: 0,
    currentPage: page,
    perPage: limit,
    totalPages: 0
  }

  if (timesheetListViewDetails) {
    const ts_count = timesheetListViewDetails[0]?.ts_count
    timesheetListViewDetails.forEach((timesheet) => {
      delete timesheet.ts_count
      timesheet.from_date = condition.from_date
      timesheet.to_date = condition.to_date
    })

    if (ts_count !== undefined && ts_count !== null) {
      pagination_details = {
        total: parseInt(ts_count),
        currentPage: page,
        perPage: limit,
        totalPages: Math.ceil(ts_count / limit)
      }
    }

    return {
      status: true,
      data: timesheetListViewDetails,
      pagination_data: pagination_details
    }
  } else {
    return timesheetListViewDetails
  }
}


/**
 * Retrieves timesheet data for each week within a specified date range, aggregates the data, and formats the result for response.
 *
 * @param {object} condition - An object containing 'from_date' and 'to_date' properties representing the date range.
 * @param {string} dateFormat - The date format to be used.
 * @param {number} page - The current page for pagination.
 * @param {number} limit - The limit of records per page for pagination.
 * @returns {object} - An object containing the formatted result, including aggregated timesheet data.
 *
 * Logic:
 * - Calls the 'calculateWeeks' function to obtain an array of week periods based on the specified date range.
 * - Constructs SQL queries for each week and executes them to retrieve timesheet data using 'getTimesheetsWeekView'.
 * - Groups the retrieved timesheets based on a combination of 'employee_id' and 'placement_id'.
 * - Formats the final result with aggregated timesheet information, including billable hours, OT hours, total hours, and date range for each employee and placement.
 * - Handles pagination details in the response.
 * - Assigns 'from_date' and 'to_date' to each object within 'ts_info'.
 * - Returns the formatted result as an object.
 */
const weekView = async (condition, dateFormat, page, limit) => {
  const weeks = calculateWeeks(condition)
  const queries = []

  weeks.period.forEach((week) => {
    let query = `SELECT * FROM getTimesheetsWeekView(`
    query += `'${week.start}', '${week.end}',` // Start and end dates for each week
    query += condition.employee_id !== null ? `'${condition.employee_id}',` : `${condition.employee_id},`
    query += (condition.search !== null) ? `'${condition.search}',` : `${condition.search},`;
    query += `'${dateFormat}', ${limit}, ${page})`

    queries.push(query)
  })

  const timesheetWeekViewDetails = []
  for (let i = 0; i < queries.length; i++) {
    const result = await indexRepository.rawQuery(queries[i])
    timesheetWeekViewDetails.push(result)
  }

  const flattenedTimesheets = timesheetWeekViewDetails.flat()
  const groupedTimesheets = {}

  flattenedTimesheets.forEach((timesheet) => {
    const key = `${timesheet.employee_id}-${timesheet.placement_id}`
    if (!groupedTimesheets[key]) {
      groupedTimesheets[key] = []
    }
    groupedTimesheets[key].push(timesheet)
  })

  const finalResult = {
    statusCode: 1003,
    message: 'Success',
    data: []
  }

  let pagination_details =  {
    total: 0,
    currentPage: page,
    perPage: limit,
    totalPages: 0
  }

  let firstEntry

  Object.values(groupedTimesheets).forEach(async (timesheets) => {
    const tsInfo = timesheets.map((ts) => ({
      total_billable_hours: ts.total_billable_hours,
      total_ot_hours: ts.total_ot_hours,
      total_hours: ts.total_hours,
      from_date: ts.from_date,
      to_date: ts.to_date
    }))

    const totalHours = tsInfo.reduce(
      (total, ts) => total + parseFloat(ts.total_hours || 0),
      0
    ) // Calculate total hours
    const totalBillableHours = tsInfo.reduce(
      (total, ts) => total + parseFloat(ts.total_billable_hours || 0),
      0
    ) // Calculate total billable hours
    const totalOtHours = tsInfo.reduce(
      (total, ts) => total + parseFloat(ts.total_ot_hours || 0),
      0
    ) // Calculate total ot hours

    firstEntry = timesheets[0]

    // get timesheethour ids of invoice_raised

    let aggregatedEntry = {
      serial_number: firstEntry.serial_number,
      timesheet_id : firstEntry.timesheet_id,
      timesheet_reference_id : firstEntry.timesheet_reference_id,
      employee_id: firstEntry.employee_id,
      profile_picture_url : firstEntry.profile_picture_url,
      employee_reference_id: firstEntry.employee_reference_id,
      employee_name: firstEntry.employee_name,
      visa_type_id: firstEntry.visa_type_id,
      visa_type_name: firstEntry.visa_type_name,
      placement_id: firstEntry.placement_id,
      client_name: firstEntry.client_name,
      client_reference_id: firstEntry.client_reference_id,
      inv_cycle_name: firstEntry.inv_cycle_name,
      total_hours: totalHours,
      total_billable_hours: totalBillableHours,
      total_ot_hours: totalOtHours,
      ts_info: tsInfo
    }

    finalResult.data.push(aggregatedEntry)
  })

  // Assign from_date and to_date to each object within ts_info
  await Promise.all(
    await finalResult.data.map(async (item) => {
      let timesheetHourIds =
        await indexRepository.rawQuery(`Select ARRAY_AGG(tsh.id) as id_array 
          from timesheets as t
          left join timesheet_hours as tsh on t.id = tsh.timesheet_id
          where t.placement_id = '${item.placement_id}' 
          AND tsh.INVOICE_RAISED = true`)

      if (timesheetHourIds && timesheetHourIds.length > 0 && timesheetHourIds[0]?.id_array) {
        timesheetHourIds = timesheetHourIds[0]?.id_array

        const invoice_ids =
          await indexRepository.rawQuery(`Select ARRAY_AGG(ledgers.reference_id) as invoice_ids from ledger_item_details
                join ledgers on ledger_item_details.ledger_id = ledgers.id
                where ARRAY[${timesheetHourIds}] && timesheet_hour_ids`)

        // item.invoice_ids = invoice_ids[0]?.invoice_ids ;
        item.invoice_ids =
          invoice_ids?.status === false ? '' : invoice_ids[0]?.invoice_ids
      } else {
        item.invoice_ids = ''
      }

      item.ts_info.forEach((ts) => {
        ts.from_date = item.ts_info[0].from_date
        ts.to_date = item.ts_info[item.ts_info.length - 1].to_date
      })
    })
  )

  if (firstEntry) {
    const ts_count = firstEntry?.ts_count

    if (ts_count !== undefined && ts_count !== null) {
      pagination_details = {
        total: parseInt(ts_count),
        currentPage: page,
        perPage: limit,
        totalPages: Math.ceil(ts_count / limit)
      }
    }

    return {
      status: true,
      data: finalResult,
      pagination_data: pagination_details
    }
  } else {
    return finalResult
  }

  // return {data:finalResult, status: true};
}

/**
 * Retrieves timesheet data for a specified date range and employee ID using the 'getTimesheetsCalendarView' stored procedure.
 *
 * @param {object} condition - An object containing 'from_date', 'to_date', and 'employee_id' properties.
 * @returns {object} - An object with 'status' indicating the success or failure of the operation and 'data' containing the retrieved timesheet data.
 *
 * Logic:
 * - Calls 'getDateFormat' to obtain the date format.
 * - Constructs an SQL query using the provided conditions, including 'from_date', 'to_date', 'employee_id', and 'dateFormat'.
 * - Executes the query using 'indexRepository.rawQuery' to retrieve timesheet data.
 * - Returns an object with 'status' indicating success or failure and 'data' containing the retrieved timesheet data.
 */
const calendar = async (condition) => {

  let dateFormat = await format.getDateFormat(); // date format

  let query = `SELECT * FROM getTimesheetsCalendarView(`;
  query += (condition.from_date != null) ? `'${condition.from_date}',` : `${condition.from_date},`;
  query += (condition.to_date != null) ? `'${condition.to_date}',` : `${condition.to_date},`;
  query += (condition.employee_id != null) ? `'${condition.employee_id}',` : `${condition.employee_id},`;
  query += (condition.placement_id != null) ? `'${condition.placement_id}',` : `${condition.placement_id},`;
  query += `'${dateFormat}')`;


  // Get employees Lisitng using stored
  const timesheetCalendar = await indexRepository.rawQuery(query);

  if (timesheetCalendar) {

      return {
          status: true,
          data: timesheetCalendar[0].data.data,
      }
  } else {
      return timesheetCalendar[0].data;
  }

};


module.exports = { rangeTotalView, weekView, calendar }
