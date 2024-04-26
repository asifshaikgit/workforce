const { responseMessages } = require('../../../../../constants/responseMessage');
const { getConnection } = require('../../../../middlewares/connectionManager');

const applyFilters = (query, filters) => {
  for (const key in filters) {
    if (filters[key] !== undefined && filters[key] !== '') {
      if (key == 'id' || key == 'placement_id') {
        query.where('ts.' + key, '=', filters[key]);
      } else if (key == 'status' && filters[key] != null) {
        if (Array.isArray(filters[key]) && filters[key].length > 0) {
          query.whereIn('ts.' + key, filters[key]);
        } else if (!Array.isArray(filters[key])) {
          query.where('ts.' + key, filters[key]);
        }
      } else if (key == 'invoice_raised') {
        query.where('tsh.' + key, '=', filters[key]);
      } else if (key == 'datesbetween') {
        query.whereBetween('tsh.date', filters[key]);
      } else if (key == 'emp.employee_name') {
        query.where('emp.display_name', 'ilike', `%${filters[key]}%`);
      } else if (key == 'c.client_name') {
        query.where('c.name', 'ilike', `%${filters[key]}%`);
      } else if (key == 'ec.end_client_name') {
        query.where('ec.name', 'ilike', `%${filters[key]}%`);
      } else if (key == 'invoice_id') {
        query.whereNull('ts.' + key);
      } else if (key == 'search') {
        query.whereRaw(`(ts.reference_id ilike '%${filters[key]}%' or c.name ilike '%${filters[key]}%' or emp.display_name ilike '%${filters[key]}%')`);
      } else if (key == 'invoiceRaised') {
        query.where('tsh.invoice_raised', false);
      } else if (key == 'global_search') {
        query.whereRaw(`(${filters[key]})`);
      } else {
        query.where(key, '=', filters[key]);
      }
    }
  }
  return query;
};

/**
 * Retrieves timesheet data from the database based on the provided filters, limit, startIndex, sort_column, and sort_order.
 * @param {Object} filters - The filters to apply to the query. Default is null.
 * @param {number} limit - The maximum number of records to retrieve. Default is 25.
 * @param {number} startIndex - The index of the first record to retrieve. Default is 0.
 * @param {string} sort_column - The column to sort the results by. Default is null.
 * @param {string} sort_order - The order to sort the results in. Default is null.
 * @returns {Object} - An object containing the retrieved timesheet data, total count,
 */
const find = async (filters = null, limit = 25, startIndex = 0, sort_column = null, sort_order = null) => {
  const db = await getConnection();
  let model1 = db('timesheets as ts')
    .join('timesheet_hours as tsh', 'tsh.timesheet_id', 'ts.id')
    .join('placements as p', 'p.id', 'ts.placement_id')
    .join('timesheet_configurations as ts_config', 'p.timesheet_configuration_id', 'ts_config.id')
    .join('employee as emp', 'emp.id', 'p.employee_id')
    .join('companies as c', 'c.id', 'p.client_id')
    .leftJoin('invoice_configurations as inc_c', 'inc_c.id', 'p.invoice_configuration_id')
    .leftJoin('net_pay_terms as net_terms', 'net_terms.id', 'inc_c.net_pay_terms_id')
    .leftJoin('companies as ec', 'ec.id', 'p.end_client_id')
    .leftJoin('employee as create', 'ts.created_by', 'create.id')
    .leftJoin('employee as update', 'ts.updated_by', 'update.id');

  /* Adding condition if user want to see only his approvals */
  if (filters['my_approval']) {
    model1 = model1.join('approval_settings as aps', 'p.timesheet_approval_id', 'aps.id')
      .join('approval_levels as apl', function () {
        this.on('apl.approval_setting_id', 'aps.id').andOn('ts.approval_level', 'apl.level');
      })
      .join('approval_users as apu', 'apu.approval_level_id', 'apl.id')
      .whereNull('ts.deleted_at')
      .whereNull('apu.deleted_at')
      .whereIn('ts.status', ['Submitted', 'Approval In Progress'])
      .where('apu.approver_id', '=', filters['loginUserId']);
  }
  /* Adding condition if user want to see only his approvals */

  delete filters['my_approval'];  // delete the unwanted filters after use
  delete filters['loginUserId']; // delete the unwanted filters after use

  model1 = model1.whereNull('ts.deleted_at').whereNull('p.deleted_at').whereNull('c.deleted_at').whereNull('emp.deleted_at')
    .modify((query) => {
      if (filters != null) {
        applyFilters(query, filters);
      }
    });

  const model = model1;
  const totalCount = await model.clone().countDistinct('ts.id as count');

  let timesheetData = model.clone()
    .select('ts.id', 'ts.placement_id', 'p.timesheet_approval_id', 'ts.reference_id', 'emp.display_name as employee_name', 'emp.id as employee_id', 'emp.email_id as email_id', 'c.id as client_id', 'c.name as client_name', 'ec.id as end_client_id', 'ec.name as end_client_name', 'ts.from', 'ts.to', 'ts.total_billable_hours', 'ts.approval_level', 'ts.total_ot_hours', 'ts.total_hours', 'ts.comments', 'ts.status', 'create.display_name as create_emp', 'update.display_name as updated_emp', 'ts_config.ts_mandatory as ts_mandatory', 'ts_config.cycle_id as cycle_id', 'ts_config.day_start_id as day_start_id', db.raw('SUM(EXTRACT(epoch FROM tsh.billable_hours)) AS tsh_total_billabel_hours'), db.raw('SUM(EXTRACT(epoch FROM tsh.total_hours)) AS tsh_total_hours'), db.raw('SUM(EXTRACT(epoch FROM tsh.ot_hours)) AS tsh_total_ot_hours'), 'net_terms.days as net_pay_terms')
    .groupBy('ts.id', 'emp.id', 'c.id', 'ec.id', 'create.id', 'update.id', 'p.id', 'ts_config.id', 'net_terms.id');

  // Apply sorting if sort_column is specified
  if (sort_column && sort_order) {
    const order = sort_order.toLowerCase() === 'desc' ? 'desc' : 'asc';

    if (sort_column === 'reference_id') {
      timesheetData = timesheetData.orderBy('ts.reference_id', order);
    } else if (sort_column === 'client_name') {
      timesheetData = timesheetData.orderBy('c.name', order); // Replace 'first_name' with the actual column name for the employee's first name
    } else if (sort_column === 'end_client_name') {
      timesheetData = timesheetData.orderBy('ec.name', order); // Replace 'first_name' with the actual column name for the employee's first name
    }
  } else {
    // Default sorting by created_at in descending order
    timesheetData = timesheetData.orderBy('ts.created_at', 'desc');
  }

  timesheetData = await timesheetData.limit(limit).offset(startIndex);

  if (timesheetData.length > 0) {
    return { status: true, data: timesheetData, totalCount: totalCount[0].count };
  } else {
    return {
      status: false,
      data: [],
      message: responseMessages.common.noRecordFound,
      error: '',
    };
  }
};

/**
 * Finds data based on the given condition and returns a paginated result.
 * @param {Object} condition - The condition to filter the data.
 * @param {number} page - The current page number.
 * @param {number} limit - The number of items per page.
 * @param {string} sort_column - The column to sort the data by.
 * @param {string} sort_order - The order to sort the data in (asc or desc).
 * @returns {Object} - An object containing the paginated result.
 *   - status: A boolean indicating if the operation was successful.
 *   - data: An array of the paginated data.
 *   - pagination: An object containing pagination information.
 */
const findByPagination = async (condition, page, limit, sort_column, sort_order) => {

  /* Calculations for start and end index */
  const startIndex = (page - 1) * limit;
  /* Calculations for start and end index */

  /* Find the data from the collection */
  const findData = await find(condition, limit, startIndex, sort_column, sort_order);

  let total = findData.totalCount ? findData.totalCount : 0;
  /* Find the data from the collection */

  /* Adding pagination to the find data */
  const resultUsers = findData.data;
  const totalPages = Math.ceil(total / limit);
  /* Adding pagination to the find data */

  if (resultUsers.length > 0) {
    return {
      status: true, data: resultUsers,
      pagination: {
        total: Number(total),
        currentPage: parseInt(page),
        perPage: parseInt(limit),
        totalPages: totalPages,
      },
    };
  } else {
    return {
      status: false,
      message: responseMessages.common.noRecordFound,
      error: '',
      pagination: {
        total: Number(total),
        currentPage: parseInt(page),
        perPage: parseInt(limit),
        totalPages: totalPages,
      }
    };
  }
};


const myPendingApprovals = async (body) => {
  let dbConnection = await getConnection();
  let employeeData = dbConnection('timesheets as ts')
    .join('placements as p', 'ts.placement_id', 'p.id')
    .join('approval_settings as aps', 'p.timesheet_approval_id', 'aps.id')
    .join('approval_levels as apl', function () {
      this.on('apl.approval_setting_id', 'aps.id').andOn('ts.approval_level', 'apl.level');
    })
    .join('approval_users as apu', 'apu.approval_level_id', 'apl.id')
    .whereNull('ts.deleted_at')
    .whereIn('ts.status', ['Submitted', 'Approval In Progress'])
    .whereNull('aps.deleted_at')
    .whereNull('apu.deleted_at')
    .whereNull('p.deleted_at')
    .whereIn('ts.status', ['Submitted', 'Approval In Progress'])
    .where('apu.approver_id', body.loginUserId)
    .count('ts.id as count')
    .groupBy('ts.status');
  let abc = await employeeData;
  if (abc.length > 0) {
    return employeeData;
  } else {
    return [{ count: 0 }]
  }
};

/**
 * Retrieves the count of invoice-ready timesheets from the database, optionally filtered by specified criteria.
 * @param {object} [filters=null] - Optional filters to apply to the query.
 * @returns {Promise<object>} - An object containing the total count of invoice-ready timesheets.
 * @throws {Error} - If there is an error connecting to the database or executing the query.
 */
const invoiceReadyTimesheetCount = async (filters = null) => {
  const db = await getConnection();
  var model = db('timesheets as ts')
    .join('timesheet_hours as tsh', 'tsh.timesheet_id', 'ts.id')
    .whereNull('ts.deleted_at')
    .modify((query) => {
      if (filters != null) {
        applyFilters(query, filters);
      }
    });

  const totalCount = await model.clone().countDistinct('ts.id as count');
  return { totalCount: totalCount[0].count };
};

/**
 * Fetch the employee date wise information of timesheet include the hour status on that date
 * @param {*} filters 
 * @returns 
 */
const timesheetCalender = async (filters) => {
  let dbConnection = await getConnection();
  let employeeData = dbConnection('employee as e')
    .join('placements as p', 'e.id', 'p.employee_id')
    .join('companies as c', 'c.id', 'p.client_id')
    .join('timesheets as ts', 'p.id', 'ts.placement_id')
    .join('timesheet_hours as tsh', 'ts.id', 'tsh.timesheet_id')
    .whereNull('p.deleted_at')
    .whereNull('c.deleted_at')
    .whereNull('ts.deleted_at')
    .modify((query) => {
      if (filters != null) {
        applyFilters(query, filters);
      }
    })
    .select('e.id as employee_id', 'e.display_name', 'c.name as client_name', 'c.id as client_id', 'tsh.date as date', 'tsh.total_hours as total_hours', 'tsh.id as tsh_id', 'tsh.ot_hours as ot_hours', 'tsh.billable_hours as billable_hours', 'tsh.invoice_raised as invoice_raised', 'tsh.payroll_raised as payroll_raised', 'ts.status', 'ts.approval_level')
    .groupBy('e.id', 'e.display_name', 'tsh.date', 'c.name', 'tsh.id', 'c.id', 'tsh.invoice_raised', 'tsh.payroll_raised', 'ts.status', 'ts.approval_level')
    .orderBy('tsh.date', 'asc');
  let timesheetData = await employeeData;
  if (timesheetData.length > 0) {
    return { status: true, data: timesheetData };
  } else {
    return { status: false, data: [] }
  }
};

/**
 * Fetch the employee week wise timesheet information
 * @param {*} filters 
 * @returns 
 */
const timesheetWeekCalender = async (filters) => {
  let dbConnection = await getConnection();
  let employeeData = dbConnection('placements as p')
    .join('companies as c', 'c.id', 'p.client_id')
    .join('timesheets as ts', 'p.id', 'ts.placement_id')
    .join('timesheet_hours as tsh', 'ts.id', 'tsh.timesheet_id')
    .whereNull('p.deleted_at')
    .whereNull('c.deleted_at')
    .whereNull('ts.deleted_at')
    .modify((query) => {
      if (filters != null) {
        applyFilters(query, filters);
      }
    })
    .select('p.id as placement_id', 'p.employee_id as employee_id', 'c.name as client_name','c.reference_id as client_reference_id', dbConnection.raw('SUM(tsh.billable_hours) as total_billable_hours'), dbConnection.raw('SUM(tsh.ot_hours) as total_ot_hours'), dbConnection.raw('SUM(tsh.total_hours) as total_hours'))
    .groupBy('p.employee_id', 'c.name', 'p.id', 'c.reference_id');
  timesheetData = await employeeData;

  if (timesheetData.length > 0) {
    return { status: true, data: timesheetData };
  } else {
    return { status: false, data: [], totalCount: 0 }
  }
};


/**
 * Fetch the employee week wise timesheet information
 * @param {*} filters 
 * @returns 
 */
const timesheetAttachments = async (filters) => {
  let dbConnection = await getConnection();
  let employeeData = dbConnection('placements as p')
    .join('timesheets as ts', 'p.id', 'ts.placement_id')
    .join('timesheet_hours as tsh', 'ts.id', 'tsh.timesheet_id')
    .join('timesheet_documents as tsdoc', 'ts.id', 'tsdoc.timesheet_id')
    .whereNull('p.deleted_at')
    .whereNull('ts.deleted_at')
    .modify((query) => {
      if (filters != null) {
        applyFilters(query, filters);
      }
    })
    .select('tsdoc.document_url','tsdoc.id')
    .groupBy('tsdoc.document_url','tsdoc.id');
  timesheetData = await employeeData;

  if (timesheetData.length > 0) {
    return { status: true, data: timesheetData };
  } else {
    return { status: false, data: [], totalCount: 0 }
  }
};


module.exports = { find, findByPagination, myPendingApprovals, invoiceReadyTimesheetCount, timesheetCalender, timesheetWeekCalender, timesheetAttachments };

