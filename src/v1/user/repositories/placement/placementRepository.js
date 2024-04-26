const { getConnection } = require('../../../../middlewares/connectionManager')
const { responseMessages } = require('../../../../../constants/responseMessage')
const moment = require('moment')

/**
 * Applies filters to a query based on the provided filter object.
 * @param {Object} query - The query object to apply filters to.
 * @param {Object} filters - The filter object containing the filter values.
 * @returns {Object} The modified query object with applied filters.
 */
const applyFilters = (query, filters) => {
    for (const key in filters) {
        if (filters[key] !== undefined && filters[key] !== '') {
            if (key == 'name') {
                query.where(key, 'ilike', `${filters[key]}%`)
            } else if (key == 'id' || key == 'p.id' || key == 'placement_id') {
                query.where('p.id', '=', filters[key])
            } else if (key == 'employee_id' || key == 'placement_reference_id' || key == 'client_id' || key == 'end_client_id') {
                query.where('p.' + key, '=', filters[key])
            } else if (key == 'employee_name') {
                query.where('e.display_name', 'ilike', `%${filters[key]}%`)
            } else if (key == 'client_name') {
                query.where('c.name', 'ilike', `%${filters[key]}%`)
            } else if (key == 'end_client_name') {
                query.where('ec.name', 'ilike', `%${filters[key]}%`)
            } else if (key == 'placement_type') {
                var placementType = filters[key]
                value = filters['value']
                if (placementType == 1) {
                    if (value === 1) {
                        // Today's date
                        const currentDate = moment().format('YYYY-MM-DD');
                        // One month back date
                        const oneMonthAgo = moment().subtract(1, 'month').format('YYYY-MM-DD');
                        query.whereBetween('p.start_date ', [oneMonthAgo, currentDate])
                    }
                    if (value === 2) {
                        // Today's date
                        const currentDate = moment().format('YYYY-MM-DD');
                        // One month back date
                        const threeMonthsAgo = moment().subtract(3, 'month').format('YYYY-MM-DD');
                        query.whereBetween('p.start_date ', [threeMonthsAgo, currentDate])
                    }
                    if (value === 3) {
                        // Today's date
                        const currentDate = moment().format('YYYY-MM-DD');
                        // One month back date
                        const sixMonthsAgo = moment().subtract(6, 'month').format('YYYY-MM-DD');
                        query.whereBetween('p.start_date ', [sixMonthsAgo, currentDate])
                    }
                    if (value === 4) {
                        // count of all placements if is ts any start date
                        query.whereNotNull('p.start_date')
                    }

                } else if (placementType == 2) {
                    if (value === 1) {
                        // Today's date
                        const currentDate = moment().format('YYYY-MM-DD');
                        // One month back date
                        const oneMonthAgo = moment().subtract(1, 'month').format('YYYY-MM-DD');
                        query.whereBetween('p.end_date', [oneMonthAgo, currentDate])
                    }
                    if (value === 2) {
                        // Today's date
                        const currentDate = moment().format('YYYY-MM-DD');
                        // One month back date
                        const threeMonthsAgo = moment().subtract(3, 'month').format('YYYY-MM-DD');
                        query.whereBetween('p.end_date', [threeMonthsAgo, currentDate])
                    }
                    if (value === 3) {
                        // Today's date
                        const currentDate = moment().format('YYYY-MM-DD');
                        // One month back date
                        const sixMonthsAgo = moment().subtract(6, 'month').format('YYYY-MM-DD');
                        query.whereBetween('p.end_date', [sixMonthsAgo, currentDate])
                    }
                    if (value === 4) {
                        // count all ended placements upto today
                        const currentDate = moment().format('YYYY-MM-DD');
                        query.where('p.end_date', '<=', currentDate)
                    }
                } else if (placementType == 3) {
                    if (value === 1) {
                        // Today's date
                        const currentDate = moment().format('YYYY-MM-DD');
                        // One month back date
                        const oneMonthAfter = moment().add(1, 'month').format('YYYY-MM-DD');
                        query.whereBetween('p.end_date', [currentDate, oneMonthAfter])
                    }
                    if (value === 2) {
                        // Today's date
                        const currentDate = moment().format('YYYY-MM-DD');
                        // One month back date
                        const twoMonthAfter = moment().add(3, 'month').format('YYYY-MM-DD');
                        query.whereBetween('p.end_date', [currentDate, twoMonthAfter])
                    }
                    if (value === 3) {
                        // Today's date
                        const currentDate = moment().format('YYYY-MM-DD');
                        // One month back date
                        const threeMonthAfter = moment().add(6, 'month').format('YYYY-MM-DD');
                        query.whereBetween('p.end_date ', [currentDate, threeMonthAfter])
                    }
                    if (value === 4) {
                        // Today's date
                        const currentDate = moment().format('YYYY-MM-DD');
                        // One month back date
                        query.where('p.end_date ', '>', currentDate)
                    }
                }
            } else if (key == 'search') {
                query.whereRaw(`(e.display_name ilike '%${filters[key]}%' or c.name ilike '${filters[key]}%' or p.reference_id ilike '${filters[key]}%')`);
            } else if (key == 'export_date') {
                if (filters[key][1] != '') {
                    query.whereRaw(`"p"."start_date" >= '${filters[key][0]}' and "p"."end_date" <= '${filters[key][1]}'`)
                } else {
                    query.whereRaw(`"p"."start_date" >= '${filters[key][0]}'`)
                }
            } else {
                query.where('p.' + key, filters[key])
              }
        }
    }
    return query
}

/**
 * Retrieves placement data from the database based on the given condition, limit, and startIndex.
 * @param {any} condition - The condition to filter the placement data.
 * @param {number} [limit=25] - The maximum number of records to retrieve.
 * @param {number} [startIndex=0] - The index to start retrieving records from.
 * @returns {Promise<{ status: boolean, data: any[], totalCount: number }>} - An object containing the status of the operation, the retrieved placement data, and the total count of records.
 */
const index = async (condition, limit = 25, startIndex = 0) => {
    const db = await getConnection()
    var model = db('placements as p')
        .join('employee as e', 'p.employee_id', 'e.id')
        .leftJoin('companies as c', 'p.client_id', 'c.id')
        .leftJoin('companies as ec', 'p.end_client_id', 'ec.id')
        .leftJoin('job_titles as jt', 'p.job_title_id', 'jt.id')
        .leftJoin('placement_billing_details as pbd', function () {
            this.on('pbd.placement_id', '=', 'p.id')
                .andOn(db.raw('pbd.effective_from <= ' + `'${moment().format('YYYY-MM-DD')}'` + ' and (pbd.effective_to >= ' + `'${moment().format('YYYY-MM-DD')}' or pbd.effective_to is null)`));
        })
        .leftJoin('placement_companies_contacts as pcc1', function () {
            this.on('p.id', '=', 'pcc1.placement_id')
                .andOn(db.raw('pcc1.priority = ?', 1))
                .andOn(db.raw('pcc1.referrable_type = ?', 'client')); // Add your additional condition here
        })
        .leftJoin('placement_companies_contacts as pcc2', function () {
            this.on('p.id', '=', 'pcc2.placement_id')
                .andOn(db.raw('pcc2.priority = ?', 2))
                .andOn(db.raw('pcc2.referrable_type = ?', 'client')); // Add your additional condition here
        })
        .leftJoin('placement_companies_contacts as pecc1', function () {
            this.on('p.id', '=', 'pecc1.placement_id')
                .andOn(db.raw('pecc1.priority = ?', 1))
                .andOn(db.raw('pecc1.referrable_type = ?', 'end-client')); // Add your additional condition here
        })
        .leftJoin('placement_companies_contacts as pecc2', function () {
            this.on('p.id', '=', 'pecc2.placement_id')
                .andOn(db.raw('pecc2.priority = ?', 2))
                .andOn(db.raw('pecc2.referrable_type = ?', 'end-client')); // Add your additional condition here
        })
        .leftJoin('company_contacts as cc1', 'cc1.id', 'pcc1.companies_contact_id')
        .leftJoin('company_contacts as cc2', 'cc2.id', 'pcc2.companies_contact_id')
        .leftJoin('company_contacts as ecc1', 'ecc1.id', 'pecc1.companies_contact_id')
        .leftJoin('company_contacts as ecc2', 'ecc2.id', 'pecc2.companies_contact_id')
        .leftJoin('timesheet_configurations as tc', 'tc.id', 'p.timesheet_configuration_id')
        .leftJoin('cycles as cyc', 'cyc.id', 'tc.cycle_id')
        .leftJoin('days', 'days.id', 'tc.day_start_id')
        .leftJoin('invoice_configurations as ic', 'ic.id', 'p.invoice_configuration_id')
        .leftJoin('cycles as inv_cyc', 'inv_cyc.id', 'ic.cycle_id')
        .leftJoin('net_pay_terms as npt', 'npt.id', 'ic.net_pay_terms_id')
        .leftJoin('pay_type_configuration as emp_pay_type', 'emp_pay_type.id', 'p.pay_type_configuration_id')
        .leftJoin('states as states', 'states.id', 'p.work_location_state_id')
        .leftJoin('countries as countries', 'countries.id', 'p.work_location_country_id')
        .modify((query) => {
            if (condition != null) {
                applyFilters(query, condition)
            }
        })
        .whereNull('p.deleted_at')
        .whereNull('c.deleted_at');
    var totalCount = await model.clone().count(db.raw('distinct p.id'));
    if (totalCount[0].count == 0) {

        return { status: false, data: [], totalCount: totalCount[0].count }
    } else {
        var placementData = [];
        if (limit != 0) {
            placementData = await model.clone().select(
                'p.id as id',
                'p.reference_id as placement_reference_id',
                'p.employee_id as employee_id',
                'e.display_name as employee_name',
                'e.reference_id as employee_reference_id',
                'p.placed_employee_id as placed_employee_id',
                'p.project_name as project_name',
                'p.work_email_id as work_email_id',
                'p.notice_period as notice_period',
                'p.start_date as project_start_date',
                'p.end_date as project_end_date',
                'p.pay_type_configuration_id',
                'p.work_location_type',
                'p.work_location_address_line_one',
                'p.work_location_address_line_two',
                'p.work_location_city',
                'p.work_location_state_id',
                'p.work_location_country_id',
                'p.work_location_zipcode',
                'emp_pay_type.payroll_pay',
                'emp_pay_type.pay_value',
                'p.payroll_configuration_type',
                'jt.name as job_title',
                'jt.id as job_title_id',
                'pbd.id as billing_id',
                'pbd.bill_rate as bill_rate',
                'pbd.effective_from as effective_from',
                'pbd.bill_type as bill_type',
                'c.id as client_id',
                'c.name as client_name',
                'c.reference_id as client_reference_id',
                'ec.reference_id as endclient_reference_id',
                'cc1.display_name as client_contact_one_name',
                'cc2.display_name as client_contact_two_name',
                'ec.id as endclient_id',
                'ec.name as endclient_name',
                'ecc1.display_name as endclient_contact_one_name',
                'ecc2.display_name as endclient_contact_two_name',
                'pcc1.companies_contact_id as client_contact_one_id',
                'pcc2.companies_contact_id as client_contact_two_id',
                'pecc1.companies_contact_id as end_client_contact_one_id',
                'pecc2.companies_contact_id as end_client_contact_two_id',
                'cyc.name as timesheet_cycle',
                'tc.default_hours as default_hours',
                'tc.ts_mandatory as ts_mandatory',
                'days.id as day_start_id',
                'days.name as day_start',
                'ic.net_pay_terms_id as net_pay_terms_id',
                'npt.days as net_pay_terms_days',
                'inv_cyc.name as invoice_cycle',
                'p.reference_id as reference_id',
                'emp_pay_type.pay_type as placement_pay_type',
                'p.work_location_type',
                'p.work_location_address_line_one',
                'p.work_location_address_line_two',
                'p.work_location_city',
                'p.work_location_zipcode',
                'p.work_location_state_id',
                'p.work_location_country_id',
                'states.name as state_name',
                'countries.name as country_name'

            ).limit(limit).offset(startIndex);
        } else {
            placementData = await model.clone().select(
                'p.id as id',
                'p.reference_id as placement_reference_id',
                'p.employee_id as employee_id',
                'e.display_name as employee_name',
                'e.reference_id as employee_reference_id',
                'p.placed_employee_id as placed_employee_id',
                'p.project_name as project_name',
                'p.work_email_id as work_email_id',
                'p.notice_period as notice_period',
                'p.start_date as project_start_date',
                'p.end_date as project_end_date',
                'p.pay_type_configuration_id',
                'emp_pay_type.payroll_pay',
                'emp_pay_type.pay_value',
                'p.payroll_configuration_type',
                'jt.name as job_title',
                'jt.id as job_title_id',
                'pbd.id as billing_id',
                'pbd.bill_rate as bill_rate',
                'pbd.effective_from as effective_from',
                'pbd.bill_type as bill_type',
                'c.id as client_id',
                'c.name as client_name',
                'c.reference_id as client_reference_id',
                'ec.reference_id as endclient_reference_id',
                'cc1.display_name as client_contact_one_name',
                'cc2.display_name as client_contact_two_name',
                'ec.id as endclient_id',
                'ec.name as endclient_name',
                'ecc1.display_name as endclient_contact_one_name',
                'ecc2.display_name as endclient_contact_two_name',
                'pcc1.client_contact_id as client_contact_one_id',
                'pcc2.client_contact_id as client_contact_two_id',
                'pecc1.end_client_contact_id as end_client_contact_one_id',
                'pecc2.end_client_contact_id as end_client_contact_two_id',
                'cyc.name as timesheet_cycle',
                'tc.default_hours as default_hours',
                'tc.ts_mandatory as ts_mandatory',
                'days.id as day_start_id',
                'days.name as day_start',
                'ic.net_pay_terms_id as net_pay_terms_id',
                'npt.days as net_pay_terms_days',
                'inv_cyc.name as invoice_cycle',
                'p.reference_id as reference_id',
                'emp_pay_type.pay_type as placement_pay_type',
                'p.work_location_type',
                'p.work_location_address_line_one',
                'p.work_location_address_line_two',
                'p.work_location_city',
                'p.work_location_zip_code',
                'p.work_location_state_id',
                'p.work_location_country_id',
                'states.name as state_name',
                'countries.name as country_name'

            )
        }
        return { status: true, data: placementData, totalCount: totalCount[0].count }
    }
}

/**
 * function to pagination the all the data in the collection.
 *
 * @param {object} condition
 * @param {object} page
 * @param {object} limit
 * @return Json
 */
const findByPagination = async (condition, page, limit) => {

    /* Calculations for start and end index */
    const startIndex = (page - 1) * limit
    /* Calculations for start and end index */

    /* Find the data from the collection */
    const findData = await index(condition, limit, startIndex);
    condition.deleted_at = true;
    let total = findData.totalCount;

    /* Adding pagination to the find data */
    const resultUsers = findData.data
    const totalPages = Math.ceil(total / limit);
    /* Adding pagination to the find data */

    if (resultUsers.length > 0) {
        return {
            status: true, data: resultUsers,
            pagination: {
                total: Number(total),
                currentPage: parseInt(page),
                perPage: parseInt(limit),
                totalPages: totalPages
            }
        };
    } else {
        return {
            status: false,
            message: responseMessages.common.noRecordFound,
            error: "",
            pagination: {
                total: Number(total),
                currentPage: parseInt(page),
                perPage: parseInt(limit),
                totalPages: totalPages
            }
        };
    }
};


/**
 * Retrieves the count of placements from the database based on the given filters.
 * @param {Object} [filters=null] - Optional filters to apply to the query.
 * @returns {Promise<number>} - A promise that resolves to the count of placements.
 */
const dashboard = async (filters = null) => {
    var dbConnection = await getConnection();
    var placementData =
        await dbConnection('placements as p')
            .count('p.id as count')
            .whereNull('p.deleted_at')
            .modify((query) => applyPlacementDashboard(query, filters))
            .first()
    return placementData.count;
}

/**
 * Applies filters to a query based on the given filter object.
 * @param {Object} query - The query object to apply filters to.
 * @param {Object} filters - The filter object containing filter options.
 * @returns {Object} The modified query object with applied filters.
 */
const applyPlacementDashboard = (query, filters) => {
    for (const key in filters) {
        if (filters[key]) {
            /* Check if the key is date then apply filter operator */
            if (key == 'totalPlacements') {
                var date = filters["totalPlacements"]
                if (date === 1) {
                    // Today's date
                    const currentDate = moment().format('YYYY-MM-DD');
                    // One month back date
                    const oneMonthAgo = moment().subtract(1, 'month').format('YYYY-MM-DD');
                    query.whereBetween('p.start_date ', [oneMonthAgo, currentDate])
                }
                if (date === 2) {
                    // Today's date
                    const currentDate = moment().format('YYYY-MM-DD');
                    // One month back date
                    const threeMonthsAgo = moment().subtract(3, 'month').format('YYYY-MM-DD');
                    query.whereBetween('p.start_date ', [threeMonthsAgo, currentDate])
                }
                if (date === 3) {
                    // Today's date
                    const currentDate = moment().format('YYYY-MM-DD');
                    // One month back date
                    const sixMonthsAgo = moment().subtract(6, 'month').format('YYYY-MM-DD');
                    query.whereBetween('p.start_date ', [sixMonthsAgo, currentDate])
                }
                if (date === 4) {
                    // count of all placements if is ts any start date
                    query.whereNotNull('p.start_date')
                }
            }
            else if (key == 'endedPlacements') {
                var date = filters["endedPlacements"]
                if (date === 1) {
                    // Today's date
                    const currentDate = moment().format('YYYY-MM-DD');
                    // One month back date
                    const oneMonthAgo = moment().subtract(1, 'month').format('YYYY-MM-DD');
                    query.whereBetween('p.end_date', [oneMonthAgo, currentDate])
                }
                if (date === 2) {
                    // Today's date
                    const currentDate = moment().format('YYYY-MM-DD');
                    // One month back date
                    const threeMonthsAgo = moment().subtract(3, 'month').format('YYYY-MM-DD');
                    query.whereBetween('p.end_date', [threeMonthsAgo, currentDate])
                }
                if (date === 3) {
                    // Today's date
                    const currentDate = moment().format('YYYY-MM-DD');
                    // One month back date
                    const sixMonthsAgo = moment().subtract(6, 'month').format('YYYY-MM-DD');
                    query.whereBetween('p.end_date', [sixMonthsAgo, currentDate])
                }
                if (date === 4) {
                    // count all ended placements upto today
                    const currentDate = moment().format('YYYY-MM-DD');
                    query.where('p.end_date', '<=', currentDate)
                }
            }
            else if (key == 'placementEnding') {
                var date = filters["placementEnding"]
                if (date === 1) {
                    // Today's date
                    const currentDate = moment().format('YYYY-MM-DD');
                    // One month back date
                    const oneMonthAfter = moment().add(1, 'month').format('YYYY-MM-DD');
                    query.whereBetween('p.end_date', [currentDate, oneMonthAfter])
                }
                if (date === 2) {
                    // Today's date
                    const currentDate = moment().format('YYYY-MM-DD');
                    // One month back date
                    const twoMonthAfter = moment().add(3, 'month').format('YYYY-MM-DD');
                    query.whereBetween('p.end_date', [currentDate, twoMonthAfter])
                }
                if (date === 3) {
                    // Today's date
                    const currentDate = moment().format('YYYY-MM-DD');
                    // One month back date
                    const threeMonthAfter = moment().add(6, 'month').format('YYYY-MM-DD');
                    query.whereBetween('p.end_date ', [currentDate, threeMonthAfter])
                }
                if (date === 4) {
                    // Today's date
                    const currentDate = moment().format('YYYY-MM-DD');
                    // One month back date
                    query.where('p.end_date ', '>', currentDate)
                }
            }
        }
    }
    return query
};


/**
 * Calculates the average duration of placements based on the given filters.
 * @param {Object} [filters={}] - Optional filters to apply to the query.
 * @returns {Promise<number>} - A promise that resolves to the average duration in months.
 */
const getAveragePlacementDuration = async (filters = {}) => {
    const dbConnection = await getConnection();
    const placementData = await dbConnection('placements as p')
        .select(dbConnection.raw('AVG(CAST(p.end_date - p.start_date AS DECIMAL(10, 2))/30.44) as average_project_duration'))
        .whereNull('p.deleted_at')
        .where(filters)
        .first();

    return placementData.average_project_duration;
};


/**
 * Retrieves employer margin data based on the given condition.
 * @param {any} condition - The condition to filter the data.
 * @returns {Promise<{status: boolean, data: any[]}>} - A promise that resolves to an object containing the status and data.
 * - status: A boolean indicating if the data retrieval was successful.
 * - data: An array of employer margin data.
 * @throws None
 */
const employerMargin = async (condition) => {
    const db = await getConnection()
    var placementData = await db('placements as p')
        .select('e.hours_worked', 'pbd.bill_type', 'pbd.bill_rate', 'paytype.id', 'paytype.pay_type', 'paytype.pay_value')
        .join('employee as e', 'p.employee_id', 'e.id')
        .join('placement_billing_details as pbd', function () {
            this.on('pbd.placement_id', '=', 'p.id')
                .andOn(db.raw('pbd.effective_from <= ' + `'${moment().format('YYYY-MM-DD')}'` + ' and (pbd.effective_to >= ' + `'${moment().format('YYYY-MM-DD')}' or pbd.effective_to is null)`));
        })
        .join('pay_type_configuration as paytype', 'paytype.id', 'p.pay_type_configuration_id')
        .whereRaw(`('p.end_date' > '${condition.active_projects}' or 'p.end_date' is null)`)
        .whereNull('p.deleted_at')
        .whereNull('e.deleted_at');
    if (placementData.length > 0) {
        return { status: true, data: placementData }
    } else {
        return {
            status: false,
            data: [],
            message: responseMessages.common.noRecordFound,
            error: ''
        }
    }
}

/**
 * Retrieves the count of employees grouped by job title, applying optional filters.
 */
const skillplacement = async (filters = null) => {
    var dbConnection = await getConnection();
    var employeeData =
        await dbConnection('placements as w')
            .select(dbConnection.raw('count(job_titles.id), job_titles.name'))
            .leftJoin('job_titles', 'w.job_title_id', 'job_titles.id')
            .count('w.id as count')
            .whereNull('w.deleted_at')
            .groupBy('job_titles.id')
            .modify((query) => applyFilters(query, filters))
    return employeeData;
};

/**
 * Retrieves employer margin data based on the given condition.
 * @param {any} condition - The condition to filter the data.
 * @returns {Promise<{status: boolean, data: any[]}>} - A promise that resolves to an object containing the status and data.
 * - status: A boolean indicating if the data retrieval was successful.
 * - data: An array of employer margin data.
 * @throws None
 */
const placementExport = async (filters = null) => {
    const db = await getConnection()
    var placementData = await db('placements as p')
        .select('p.id', 'p.client_id', 'c.name as client_name', 'p.employee_id', 'e.display_name as employee_name', 'p.project_name as project_name', 'p.start_date as project_start_date', 'p.end_date as project_end_date', 'emp_pay_type.pay_type as placement_pay_type', 'jt.name as job_title', 'jt.id as job_title_id', 'p.work_email_id', 'p.notice_period', 'p.reference_id as placement_reference_id', 'e.reference_id as employee_reference_id', 'c.reference_id as client_reference_id')
        .join('companies as c', 'p.client_id', 'c.id')
        .join('employee as e', 'p.employee_id', 'e.id')
        .leftJoin('job_titles as jt', 'p.job_title_id', 'jt.id')
        .leftJoin('pay_type_configuration as emp_pay_type', 'emp_pay_type.id', 'p.pay_type_configuration_id')
        .modify((query) => applyFilters(query, filters))
        .whereNull('p.deleted_at')
        .whereNull('e.deleted_at');
    if (placementData.length > 0) {
        return { status: true, data: placementData }
    } else {
        return {
            status: false,
            data: [],
            message: responseMessages.common.noRecordFound,
            error: ''
        }
    }
}

/**
 * Retrieves placement data from the database based on the given condition, limit, and startIndex.
 * @param {any} condition - The condition to filter the placement data.
 * @param {number} [limit=25] - The maximum number of records to retrieve.
 * @param {number} [startIndex=0] - The index to start retrieving records from.
 * @returns {Promise<{ status: boolean, data: any[], totalCount: number }>} - An object containing the status of the operation, the retrieved placement data, and the total count of records.
 */
const placementActivityTrack = async (condition) => {
    const db = await getConnection()
    var model = db('placements as p')
        .join('employee as e', 'p.employee_id', 'e.id')
        .leftJoin('clients as c', 'p.client_id', 'c.id')
        .leftJoin('end_clients as ec', 'p.end_client_id', 'ec.id')
        .leftJoin('job_titles as jt', 'p.job_title_id', 'jt.id')
        .leftJoin('employee as plaemp', 'p.placed_employee_id', 'plaemp.id')
        .leftJoin('placement_billing_details as pbd', function () {
            this.on('pbd.placement_id', '=', 'p.id')
                .andOn(db.raw('pbd.effective_from <= ' + `'${moment().format('YYYY-MM-DD')}'` + ' and (pbd.effective_to >= ' + `'${moment().format('YYYY-MM-DD')}' or pbd.effective_to is null)`));
        })
        .leftJoin('placement_client_contacts as pcc1', function () {
            this.on('p.id', '=', 'pcc1.placement_id')
                .andOn(db.raw('pcc1.priority = ?', 1))
        })
        .leftJoin('placement_client_contacts as pcc2', function () {
            this.on('p.id', '=', 'pcc2.placement_id')
                .andOn(db.raw('pcc2.priority = ?', 2))
        })
        .leftJoin('placement_end_client_contacts as pecc1', function () {
            this.on('p.id', '=', 'pecc1.placement_id')
                .andOn(db.raw('pecc1.priority = ?', 1))
        })
        .leftJoin('placement_end_client_contacts as pecc2', function () {
            this.on('p.id', '=', 'pecc2.placement_id')
                .andOn(db.raw('pecc2.priority = ?', 2))
        })
        .leftJoin('client_contacts as cc1', 'cc1.id', 'pcc1.client_contact_id')
        .leftJoin('client_contacts as cc2', 'cc2.id', 'pcc2.client_contact_id')
        .leftJoin('end_client_contacts as ecc1', 'ecc1.id', 'pecc1.end_client_contact_id')
        .leftJoin('end_client_contacts as ecc2', 'ecc2.id', 'pecc2.end_client_contact_id')
        .leftJoin('pay_type_configuration as emp_pay_type', 'emp_pay_type.id', 'p.pay_type_configuration_id')
        .leftJoin('states as states', 'states.id', 'p.work_location_state_id')
        .leftJoin('countries as countries', 'countries.id', 'p.work_location_country_id')
        .modify((query) => {
            if (condition != null) {
                applyFilters(query, condition)
            }
        })
        .whereNull('p.deleted_at')
        .whereNull('c.deleted_at');
    var placementData = [];

    placementData = await model.clone().select(
        'p.id as id',
        'p.reference_id as Placement reference id',
        'e.display_name as Employee name',
        'p.placed_employee_id as placed_employee_id',
        'plaemp.display_name as Placed employee',
        'p.project_name as Project name',
        'p.work_email_id as Work email',
        'p.notice_period as Notice period',
        'p.start_date as Project start date',
        'p.end_date as Project end date',
        'p.payroll_configuration_type as Placement pay configuration type',
        'c.name as Client name',
        'cc1.display_name as Client contact one name',
        'cc2.display_name as Client contact two name', // 'ec.id as endclient_id',
        'ec.name as Endclient name',
        'ecc1.display_name as Endclient contact one name',
        'ecc2.display_name as Endclient contact two name',
        'emp_pay_type.pay_type as Placement pay type',
        'p.work_location_type as Work location type',
        'p.work_location_address_line_one as Work location address line one',
        'p.work_location_address_line_two as Work location address line two',
        'p.work_location_city as Work location city',
        'p.work_location_zip_code as Work location zip code',
        'states.name as Work location state',
        'countries.name as Work location country'

    )
    return { status: true, data: placementData }
}
module.exports = { index, findByPagination, dashboard, getAveragePlacementDuration, employerMargin, skillplacement, placementExport, placementActivityTrack }