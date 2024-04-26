const { getConnection } = require('../../../../middlewares/connectionManager')
const { responseMessages } = require('../../../../../constants/responseMessage')

const applyFilters = (query, filters) => {
    for (const key in filters) {
        if (filters[key]) {
            if (key == 'employee_id') {
                query.where('p.' + key, '=', filters[key])
            } else if (key == 'id' || key == 'placement_id') {
                query.where('ts.' + key, '=', filters[key])
            } else if (key == 'status' && filters[key] != null) {
                if (Array.isArray(filters[key]) && filters[key].length > 0) {
                    query.whereIn('ts.' + key, filters[key])
                } else if (!Array.isArray(filters[key])) {
                    query.where('ts.' + key, filters[key])
                }
            } else if (key == 'timesheet_id') {
                query.where('tsh.' + key, '=', filters[key])
            } else if (key == 'datesbetween') {
                // query.whereRaw(`(tsh.date >= '${filters[key]}' and tsh.date <= '${filters[key]}')`)
                query.whereBetween('tsh.date', filters[key])
            } else if (key == 'pay_type_configuration_id') {
                query.where('prc.' + key, '=', filters[key])
            } else if (key == 'emp_id') {
                query.where('ptc.employee_id', '=', filters[key])
            } else if (key == 'plcmnt_id') {
                query.where('pbd.placement_id', '=', filters[key])
            } else if (key == 'period') {
                query.where('pc.frequency_date', filters[key])
            } else if (key == 'payroll_period') {
                query.whereBetween('pc.frequency_date', filters[key])
            } else if (key == 'active_projects') {
                query.whereRaw(`(p.end_date > '${filters[key]}' or p.end_date is null)`)
            } else if (key == 'preference') {
                if (filters[key] === 'all') {
                } else if (filters[key] === 'active') {
                    query.where('emp.is_active', true)
                } else if (filters[key] === 'left') {
                    query.where('emp.is_active', false)
                } else {
                    query.where('emp.employee_category_id', filters[key])
                }
            } else if (key == 'relieving_period') {
                query.whereBetween('emp.relieving_date', filters[key])
            } else if (key == 'status' || key == 'payroll_configuration_id') {
                query.where('payroll.' + key, filters[key])
            } else if (key == 'pay_roll_configuration_id') {
                query.where('pc.id', filters[key])
            }
            else {
                query.where(key, '=', filters[key])
            }
        }
    }
    return query
}

// const find = async (filters = null) => {
//     var db = await getConnection()
//     var model = db('payroll')
//         .join('placements as p', 'p.id', 'payroll.placement_id')
//         .join('clients as c', 'c.id', 'p.client_id')
//         .join('employee as emp', 'emp.id', 'payroll.employee_id')
//         .join('payroll_configuration as pc', 'pc.id', 'payroll.payroll_configuration_id')
//         .leftJoin('payroll_payment_details as ppd', function () {
//             this.on('ppd.employee_id', 'payroll.employee_id')
//                 .andOn('ppd.payroll_configuration_id', 'payroll.payroll_configuration_id')
//         })
//         .modify((query) => {
//             if (filters != null) {
//                 applyFilters(query, filters)
//             }
//         })
//     var payrollData = await model.clone()
//         .orderBy('payroll.created_at', 'ASC')
//         .select('payroll.*', 'c.name as client_name', 'emp.display_name as employee_name', 'emp.standard_pay_amount', 'ppd.amount_paid','ppd.balance_amount','p.end_date as placement_end_date','ppd.ot_payroll_period_hours','ppd.ot_payroll_period_rate','ppd.payroll_period_hours','ppd.payroll_period_rate','ppd.total_amount','ppd.debited_expense','ppd.credited_expense');

//     if (payrollData.length > 0) {
//         return { status: true, data: payrollData }
//     } else {
//         return {
//             status: false,
//             data: [],
//             message: responseMessages.common.noRecordFound,
//             error: ''
//         }
//     }
// }

/**
 * 
 * @param {*} filters 
 * @returns 
 */
const listingFind = async (filters = null) => {
    var db = await getConnection()
    var model = db('payroll')
        .join('placements as p', 'p.id', 'payroll.placement_id')
        .join('companies as c', 'c.id', 'p.client_id')
        .join('employee as emp', 'emp.id', 'payroll.employee_id')
        .join('payroll_configuration as pc', 'pc.id', 'payroll.payroll_configuration_id')
        .leftJoin('payroll_payment_details as ppd', function () {
            this.on('ppd.employee_id', 'payroll.employee_id')
                .andOn('ppd.payroll_configuration_id', 'payroll.payroll_configuration_id')
        })
        .modify((query) => {
            if (filters != null) {
                applyFilters(query, filters)
            }
        })
    var payrollData = await model.clone()
        .orderBy('payroll.created_at', 'ASC')
        .select('p.end_date as placement_end_date');

    if (payrollData.length > 0) {
        return { status: true, data: payrollData }
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
 * 
 * @param {*} filters 
 * @returns 
 */
const countPlacements = async (filters) => {
    var db = await getConnection();
    var placements = await db('payroll as pr')
        .count('pr.id')
        .leftJoin('payroll_payment_details as ppd', function () {
            this.on('pr.employee_id', '=', 'ppd.employee_id')
                .andOn('pr.payroll_configuration_id', '=', 'ppd.payroll_configuration_id');
        })
        .modify((query) => {
            if (filters != null) {
                applyFilters(query, filters)
            }
        })
        .whereNull('ppd.deleted_at')

    if (placements.length > 0) {
        return { status: true, count: placements[0]['count'] }
    } else {
        return {
            status: false,
            data: [placements],
            message: responseMessages.common.noRecordFound,
            error: ''
        }
    }
}

module.exports = { countPlacements, listingFind }
