const { responseMessages } = require('../../../../../constants/responseMessage');
const { generateEmployeeAvatar } = require('../../../../../helpers/globalHelper');
const indexRepository = require('../../repositories/index');
const payRollRepository = require('../../repositories/payroll/payRollRepository');
const moment = require('moment');

/**
 * Get Employees Count function is used to get the count of all the employees of different roles.
 */
const employeesCount = async () => {
    const query = `SELECT 
COUNT(*) AS total_employees,
SUM(CASE WHEN employment_type_id = 1 THEN 1 ELSE 0 END) AS internal_employee,
SUM(CASE WHEN employment_type_id = 2 THEN 1 ELSE 0 END) AS consultant,
SUM(CASE WHEN employment_type_id = 3 THEN 1 ELSE 0 END) AS contractor
FROM 
employee;`

    const employeesCount = await indexRepository.rawQuery(query);

    if (employeesCount && employeesCount?.status == false) {
        return employeesCount
    } else {
        return {
            status: true,
            data: employeesCount
        }
    }
}

/**
 * Get Top Companies.
 * 
 * Logic:
 * - Get Top 5 Companies with more placements.
 * - Get Top 5 placed employee details for each company.
 * - Total placed employeed count for each company.
 * - Percentage Calculation for each company based on the employees placed.
 */
const topCompanies = async () => {
    const query = `SELECT 
    companies.id, 
    companies.name,
    COUNT(placements.client_id) AS placement_count,
	ROUND((CAST(COUNT(placements.client_id) AS DECIMAL) / first_placement_count.placement_count) * 100, 2) as percentage,
	json_agg(jsonb_build_object('id', employee.id, 'gender', employee.gender, 'profile_picture_url', employee.profile_picture_url)) as employees
	FROM 
        companies 
    LEFT JOIN 
        placements ON companies.id = placements.client_id
	LEFT JOIN
	    employee on employee.id = placements.employee_id
	JOIN (
		SELECT COUNT(placements.client_id) AS placement_count
		FROM companies
		LEFT JOIN placements ON companies.id = placements.client_id
		WHERE companies.entity_type = 'client'
		GROUP BY companies.id
		ORDER BY placement_count DESC
		LIMIT 1
	) AS first_placement_count ON 1=1
    WHERE 
        companies.entity_type = 'client'
    GROUP BY 
        companies.id, companies.name, first_placement_count.placement_count
	order by placement_count DESC
LIMIT 10;
    `;

    let companiesData = await indexRepository.rawQuery(query);

    if (companiesData && companiesData?.status == false) {
        return companiesData
    } else {

        companiesData?.map(async company => {
            if (company?.employees.length > 0) {
                company.employees = company.employees.slice(0, 5);
                await Promise.all(company.employees.map(async emp => {
                    emp.profile_picture_url = emp?.profile_picture_url ? emp.profile_picture_url : await generateEmployeeAvatar(emp);
                    delete emp.gender;
                    delete emp.id;
                }));
                company.employees = company.employees.filter(emp => emp.profile_picture_url).map(emp => emp.profile_picture_url);
            }
        });
        return {
            status: true,
            data: companiesData
        }
    }
}

/**
 * Get The total receivables and payables.
 */
const receivablesPayables = async () => {

    /**
     * Creates a temporary object `receivable` with various properties and their corresponding values.
     * Then, retrieves the `balance_amount` statistics for the `invoices` collection using the
     * `indexRepository.statistics` method.
     */
    let currentReceivable = {
        global_search: `due_date >= '${moment().format("YYYY-MM-DD")}' and write_off_id is null and entity_type = 'invoice'`,
        is_void: false,
        //is_sent: true,
        status: ['Approved', 'Paid', 'Partially Paid'],
        deleted_at: null
    }

    var current_invoice_amount = await indexRepository.sum('ledgers', currentReceivable, 'balance_amount');
    current_invoice_amount = current_invoice_amount.data;

    /**
     * Calculates the total overdue invoice amount based on the given search criteria.
     */
    let overdueReceivable = {
        global_search: `due_date < '${moment().format('YYYY-MM-DD')}' and write_off_id is null and entity_type = 'invoice'`,
        is_void: false,
        //is_sent: true,
        status: ['Approved', 'Paid', 'Partially Paid']
    }
    var overdue_invoice_amount = await indexRepository.sum('ledgers', overdueReceivable, 'balance_amount', [], true);
    overdue_invoice_amount = overdue_invoice_amount.data;

    var current = current_invoice_amount ? current_invoice_amount : 0;
    var overdue = overdue_invoice_amount ? overdue_invoice_amount : 0;
    var total_receivable = current + overdue;

    var totalReceivables = {
        total: total_receivable,
        current: current,
        overdue: overdue
    }

    /**
     * Retrieves the count of 'bills' records that match the given conditions.
     */
    let currentBillPayable = {
        global_search: `due_date >= '${moment().format('YYYY-MM-DD')}' and write_off_id is null and entity_type = 'bill'`,
        is_void: false,
        status: ['Submitted', 'Partially Paid']
    }

    var currentBillAmount = await indexRepository.sum('ledgers', currentBillPayable, 'balance_amount', [], true);
    currentBillAmount = currentBillAmount.data;

    /**
     * Calculates the total amount of overdue bills based on the given criteria.
     */
    let overduebillPayable = {
        global_search: `due_date < '${moment().format('YYYY-MM-DD')}' and write_off_id is null and entity_type = 'bill'`,
        is_void: false,
        status: ['Submitted', 'Partially Paid']
    }
    var overdueBillAmount = await indexRepository.sum('ledgers', overduebillPayable, 'balance_amount', [], true);
    overdueBillAmount = overdueBillAmount.data;

    var currentBill = currentBillAmount ? currentBillAmount : 0;
    var overdueBill = overdueBillAmount ? overdueBillAmount : 0;
    var totalPayableBill = currentBill + overdueBill;
    var totalBillsPayable = {
        total: totalPayableBill,
        current: currentBill ? currentBill : 0,
        overdue: overdueBill ? overdueBill : 0
    }

    var receiablesPayablesData = {
        receivables: totalReceivables,
        payables: totalBillsPayable,
    };

    if (receiablesPayablesData) {
        return {
            status: true, data: receiablesPayablesData
        };
    } else {
        return { status: false, message: responseMessages.common.noRecordFound, error: "" };
    }
}

/**
 * For Cash flow all the data must be of Paid/Received amount
 *  - So for cash type status must be Paid or partially paid and took amount which is amount paid
 * For Accrual all the data must be of about to paid or receive
 *  - So for accrual type status must approved or partially paid and took balance_amount which is yet to be paid
 */
const cashFlow = async (condition) => {

    const monthsInfo = getMonthInfoBetweenDates(condition.from_date, condition.to_date);
    let monthNames = [];
    let monthWiseInflow = [];
    let monthWiseOutflow = [];

    // If view Type is Cash Basis
    if (condition.view_type == 'cash') {

        for(let item in monthsInfo){
            let monthData = monthsInfo[item];

            /**
             * Calculate Inflow.
             * Sum of - Invoice Amount, Balance effected deductions, Payroll deducted amount
            */
            // Invoice Amount
            const invoiceAmountCondition =
            {
                date_between: [{
                    column: 'created_at', date1: monthData.start, date2: monthData.end
                }],
                status:['Paid', 'Partially paid'],
                is_void: false,
                write_off_id: null
            }
            const invoiceAmount = await indexRepository.sum('ledgers', invoiceAmountCondition, 'amount', [], true);

            // Balance effected deductions
            const balanceEffectDeductionsConditions = {
                global_search: `expense_transaction_type = '1'`,
                date_between: [{
                    column: 'created_at', date1: monthData.start, date2: monthData.end
                }],
                status: ['Processed']
            };
            const balanceEffectDeductions = await indexRepository.sum('expense_management', balanceEffectDeductionsConditions, 'amount', [], true);

            // Payroll deducted amount
            const payrollDeductedAmountConditions = {
                date_between: [{
                    column: 'payroll_payment_details.created_at', date1: monthData.start, date2: monthData.end
                }],
                'payroll_configuration.status': 'Submitted'
            }
            payrollDeductedAmount = await indexRepository.sum('payroll_payment_details', payrollDeductedAmountConditions, 'debited_expense', [{ table: 'payroll_configuration', condition: ['payroll_configuration.id', 'payroll_payment_details.payroll_configuration_id'] }], true);

            /**
             * Calculate OutFlow.
             * Sum of - Payroll Amount, Balance Effected Reimbursement, payroll reimbursment amount.
             */
            // Payroll Amount
            const payrollAmountCondition =
            {
                date_between: [{
                    column: 'payroll.created_at', date1: monthData.start, date2: monthData.end
                }],
                'payroll_configuration.status': 'Submitted'
            }
            const payrollAmount = await indexRepository.sum('payroll', payrollAmountCondition, 'total_amount', [{ table: 'payroll_configuration', condition: ['payroll_configuration.id', 'payroll.payroll_configuration_id'] }], true);

            // Balance effected deductions
            const balanceEffectReimbursementConditions = {
                global_search: `expense_transaction_type = '2'`,
                date_between: [{
                    column: 'created_at', date1: monthData.start, date2: monthData.end
                }],
                status: ['Processed']
            };
            const balanceEffectReimbursement = await indexRepository.sum('expense_management', balanceEffectReimbursementConditions, 'amount', [], true);

            // Payroll reiumbursement amount
            const payrollReimbursementAmountConditions = {
                date_between: [{
                    column: 'payroll_payment_details.created_at', date1: monthData.start, date2: monthData.end
                }],
                'payroll_configuration.status': 'Submitted'
            }
            payrollReimbursementAmount = await indexRepository.sum('payroll_payment_details', payrollReimbursementAmountConditions, 'credited_expense', [{ table: 'payroll_configuration', condition: ['payroll_configuration.id', 'payroll_payment_details.payroll_configuration_id'] }], true);

            const inflow_amount = invoiceAmount.data + balanceEffectDeductions.data + payrollDeductedAmount.data;

            const outflow_amount = payrollAmount.data + balanceEffectReimbursement.data + payrollReimbursementAmount.data;

            monthWiseInflow.push(+(inflow_amount).toFixed(2));
            monthWiseOutflow.push(+(outflow_amount).toFixed(2));
            monthNames.push(monthData.month);
        }

        // Generate Y-axis values.
        // Combine both arrays
        const combinedArray = monthWiseInflow.concat(monthWiseOutflow);

        // Find the maximum value
        const maxValue = Math.max(...combinedArray);

        // Divide the maximum value into 5 equal parts
        const dividedValues = [];
        const increment = maxValue / 5;
        for (let i = 0; i <= 5; i++) {
            dividedValues.push(i * (increment).toFixed(2));
        }

        return {
            status: true,
            data: {
                monthNames: monthNames,
                monthWiseInflow: monthWiseInflow,
                monthWiseOutflow: monthWiseOutflow,
                yaxis: dividedValues,
                inflow_amount: monthWiseInflow.reduce((accumulator, currentValue) => accumulator + currentValue, 0),
                outflow_amount: monthWiseOutflow.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
            }
        };

    }

    if (condition.view_type == 'accrual') {

        for(let item in monthsInfo){
            let monthData = monthsInfo[item];

            /**
             * Calculate Inflow.
             * Sum of - Invoice Amount, Balance effected deductions, Payroll deducted amount
            */
            // Invoice Amount
            const invoiceAmountCondition =
            {
                date_between: [{
                    column: 'created_at', date1: monthData.start, date2: monthData.end
                }],
                status:['Approved', 'Partially paid'],
                is_void: false,
                write_off_id: null
            }
            const invoiceAmount = await indexRepository.sum('ledgers', invoiceAmountCondition, 'balance_amount', [], true);

            // Balance effected deductions
            const balanceEffectDeductionsConditions = {
                global_search: `expense_transaction_type = '1'`,
                date_between: [{
                    column: 'created_at', date1: monthData.start, date2: monthData.end
                }],
                status: ['Approved', 'Reimbursement In Progress']
            };
            const balanceEffectDeductions = await indexRepository.sum('expense_management', balanceEffectDeductionsConditions, 'due_amount', [], true);

            // Payroll deducted amount
            const payrollDeductedAmountConditions = {
                date_between: [{
                    column: 'payroll_payment_details.created_at', date1: monthData.start, date2: monthData.end
                }],
                global_search: `'payroll_configuration.status' NOT IN ('Submitted', 'Skipped')`
            }
            payrollDeductedAmount = await indexRepository.sum('payroll_payment_details', payrollDeductedAmountConditions, 'debited_expense', [{ table: 'payroll_configuration', condition: ['payroll_configuration.id', 'payroll_payment_details.payroll_configuration_id'] }], true);

            /**
             * Calculate OutFlow.
             * Sum of - Payroll Amount, Balance Effected Reimbursement, payroll reimbursment amount.
             */
            // Payroll Amount
            const payrollAmountCondition =
            {
                date_between: [{
                    column: 'payroll.created_at', date1: monthData.start, date2: monthData.end
                }],
                global_search: `'payroll_configuration.status' NOT IN ('Submitted', 'Skipped')`
            }
            const payrollAmount = await indexRepository.sum('payroll', payrollAmountCondition, 'total_amount', [{ table: 'payroll_configuration', condition: ['payroll_configuration.id', 'payroll.payroll_configuration_id'] }], true);

            // Balance effected deductions
            const balanceEffectReimbursementConditions = {
                global_search: `expense_transaction_type = '2'`,
                date_between: [{
                    column: 'created_at', date1: monthData.start, date2: monthData.end
                }],
                status: ['Approved', 'Deduction In Progress']
            };
            const balanceEffectReimbursement = await indexRepository.sum('expense_management', balanceEffectReimbursementConditions, 'due_amount', [], true);

            // Payroll reiumbursement amount
            const payrollReimbursementAmountConditions = {
                date_between: [{
                    column: 'payroll_payment_details.created_at', date1: monthData.start, date2: monthData.end
                }],
                global_search: `'payroll_configuration.status' NOT IN ('Submitted', 'Skipped')`
            }
            payrollReimbursementAmount = await indexRepository.sum('payroll_payment_details', payrollReimbursementAmountConditions, 'credited_expense', [{ table: 'payroll_configuration', condition: ['payroll_configuration.id', 'payroll_payment_details.payroll_configuration_id'] }], true);

            const inflow_amount = invoiceAmount.data + balanceEffectDeductions.data + payrollDeductedAmount.data;

            const outflow_amount = payrollAmount.data + balanceEffectReimbursement.data + payrollReimbursementAmount.data;

            monthWiseInflow.push(+(inflow_amount).toFixed(2));
            monthWiseOutflow.push(+(outflow_amount).toFixed(2));
            monthNames.push(monthData.month);
        }

        // Generate Y-axis values.
        // Combine both arrays
        const combinedArray = monthWiseInflow.concat(monthWiseOutflow);

        // Find the maximum value
        const maxValue = Math.max(...combinedArray);

        // Divide the maximum value into 5 equal parts
        const dividedValues = [];
        const increment = maxValue / 5;
        for (let i = 0; i <= 5; i++) {
            dividedValues.push(i * (increment).toFixed(2));
        }

        return {
            status: true,
            data: {
                monthNames: monthNames,
                monthWiseInflow: monthWiseInflow,
                monthWiseOutflow: monthWiseOutflow,
                yaxis: dividedValues,
                inflow_amount: parseFloat(monthWiseInflow.reduce((accumulator, currentValue) => accumulator + currentValue, 0)).toFixed(2),
                outflow_amount: parseFloat(monthWiseOutflow.reduce((accumulator, currentValue) => accumulator + currentValue, 0)).toFixed(2)
            }
        };

    }
}

const payRoll = async (condition) => {
    let othoursExistsInPayroll = false;
    let enableSubmit = true;
    const responseData = [];

    let lastTwoPayrolls = await indexRepository.findDistinct('payroll_configuration', ['payroll_configuration.id', 'payroll_configuration.pay_config_setting_id', 'payroll_configuration.check_date'], { 'payroll_configuration.pay_config_setting_id': `${condition.payroll_setting_id}`, 'payroll_payment_details.is_finalize': true }, 2, [{ table: 'payroll_payment_details', condition: ['payroll_payment_details.payroll_configuration_id', 'payroll_configuration.pay_config_setting_id'], type: 'inner' }], [], ['payroll_configuration.check_date'], 'DESC');

    let labels = ['Placement Ending', 'Left Company', 'W2', 'Project Completed', 'Internal Employee', '1099', 'Others'];

    if (lastTwoPayrolls.status && lastTwoPayrolls.data.length > 1) {
        for (let keys in lastTwoPayrolls.data) {

            /**
             * Fetching the payment details
             */
            let fields = ['employee.id', 'employee.employment_type_id', 'payroll_payment_details.payroll_configuration_id', 'employee_categories.name as employee_categorie_name'];
            let filters = { 'payroll_payment_details.payroll_configuration_id': lastTwoPayrolls.data[keys].pay_config_setting_id };
            let joins = [
                {
                    table: 'payroll_payment_details',
                    condition: ['employee.id', 'payroll_payment_details.employee_id'],
                    type: 'inner'
                },
                {
                    table: 'employee_categories',
                    condition: ['employee.employee_category_id', 'employee_categories.id'],
                    type: 'inner'
                }
            ];
            var payrollData = await indexRepository.find('employee', fields,
                filters, null, joins);
            if (payrollData.status) {
                /* Variables */
                var listingObject = [];
                let leftEmployeeData = 0;
                let PlacementGoingToComplete = 0;
                let PlacementCompleted = 0;
                let internalEmployee = 0;
                let w2Employee = 0;
                let onezero99 = 0;
                let contractorEmployee = [];
                let other = 0;

                let placementEndedSno = 0;
                let placementGoingToEndSno = 0;
                let leftSno = 0;
                let internalSno = 0;
                let contractorSno = 0;
                let w2Sno = 0;
                let onezero99Sno = 0;
                let otherSno = 0;
                var total_details = payrollData.data;

                for (let key in total_details) {
                    var item = total_details[key];

                    /**
                         * Retrieves the payroll information for a specific employee and payroll configuration.
                         * , active_projects: moment(item.from_date).format("YYYY-MM-DD") 
                         */
                    let placements_info = await payRollRepository.listingFind({ employee_id: item.employee_id, pay_roll_configuration_id: item.payroll_configuration_id });

                    /**
                         * Deduct expense amount through payroll
                         */
                    let placement_is_going_end = false;
                    let placement_ended = false;

                    if (placements_info.data.length > 0) {
                        for (let keys in placements_info.data) {
                            let placementWisePayInfo = placements_info.data[keys];
                            // If the placement is going to end in 1 month, then push the data to placement ending object
                            if (placementWisePayInfo.placement_end_date) {
                                if (moment(item.to_date).format('YYYY/MM/DD') > moment(placementWisePayInfo.placement_end_date).format('YYYY/MM/DD')) {
                                    placement_ended = true;
                                    placement_is_going_end = false;
                                } else {
                                    placement_ended = false;
                                    placement_is_going_end = true;
                                    break;
                                }
                            } else {
                                break;
                            }
                        }
                    }

                    let currentArrayObject;
                    if (item.employment_type_id == 1) {
                        currentArrayObject = 3; // Internal Employees
                    } else if (placement_ended) {
                        currentArrayObject = 4; //Project Completed
                    } else if (placement_is_going_end) {
                        currentArrayObject = 5; //Placement Going To End
                    } else if (!item.status) {
                        currentArrayObject = 6; // Inactive Employees
                    } else if (item.employee_categorie_name == 'W2') {
                        currentArrayObject = 1; // W2 Employee
                    } else if (item.employee_categorie_name == '1099') {
                        currentArrayObject = 2; // 1099 Employee
                    } else {
                        currentArrayObject = 7; // Other    
                    }

                    if (!item.status) { // Inactive employees
                        leftSno = leftSno + 1;
                        listingObject.sno = leftSno;
                        leftEmployeeData = leftSno;
                    }
                    else if (placement_ended) { // Placement Ended Employees
                        placementEndedSno = placementEndedSno + 1;
                        listingObject.sno = placementEndedSno;
                        PlacementCompleted = placementEndedSno;;
                    } else if (placement_is_going_end) { // Placement is going to end
                        placementGoingToEndSno = placementGoingToEndSno + 1;
                        listingObject.sno = placementGoingToEndSno;
                        PlacementGoingToComplete = placementGoingToEndSno;
                    } else if (item.employment_type_id == 1) { // Internal Employee
                        internalSno = internalSno + 1;
                        listingObject.sno = internalSno;
                        internalEmployee = internalSno;
                    }
                    // else if (item.employment_type_id == 3) { // Contractors
                    //     contractorSno = contractorSno + 1
                    //     listingObject.sno = contractorSno;
                    //     contractorEmployee.push(listingObject);
                    // } 
                    else if (item.employee_categorie_name == 'W2') { // Consultant W2 Employee
                        w2Sno = w2Sno + 1;
                        listingObject.sno = w2Sno;
                        w2Employee = w2Sno;
                    } else if (item.employee_categorie_name == '1099') { // Consultant 1099 Employee
                        onezero99Sno = onezero99Sno + 1;
                        listingObject.sno = onezero99Sno;
                        onezero99 = onezero99Sno;
                    } else {  // Other employee
                        otherSno = otherSno + 1;
                        listingObject.sno = otherSno;
                        other = otherSno;
                    }
                }
                let series = parseInt(keys) + 1;
                let tempResponse = {
                    name: 'Series ' + series,
                    data: [PlacementGoingToComplete, leftEmployeeData, w2Employee, PlacementCompleted, internalEmployee, onezero99, other]
                };

                responseData.push(tempResponse);
            } else {
                return payrollData;
            }
        }
        return { status: true, data: { series: responseData, labels: labels } };
    } else {
        const sampleSeries = [
            {
                "name": "Series 1",
                "data": [
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
                ]
            },
            {
                "name": "Series 2",
                "data": [
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
                ]
            }]
        return { status: true, data: { series: sampleSeries, labels: labels } };
    }
}

/**
 * 
 * @param {*} startDate 
 * @param {*} endDate 
 * @returns 
 */
const employeeMargin = async (condition) => {

    totalPercentage = 100;

    // Get revenue amount
    const dateFiltercondition =
    {
        date_between: [{
            column: 'created_at', date1: condition.from_date, date2: condition.to_date
        }]
    }

    const costdateFiltercondition =
    {
        date_between: [{
            column: 'payroll.created_at', date1: condition.from_date, date2: condition.to_date
        }]
    }
    let revenue = await indexRepository.sum('ledgers', {...dateFiltercondition, status:['Paid', 'Partially Paid'], is_void: false, write_off_id: null, entity_type: 'invoice' }, 'amount', [], true);
    revenue = revenue.data;

    const balanceEffectReimbursementConditions = {
        ...dateFiltercondition,
        global_search: `expense_transaction_type = '2'`,
        status: ['Processed']
    };
    const balanceEffectReimbursement = await indexRepository.sum('expense_management', balanceEffectReimbursementConditions, 'amount', [], true);
    let expenseReceived = balanceEffectReimbursement.data;

    // Get employee costs
    let employeeCosts = await indexRepository.sum('payroll', {...costdateFiltercondition, 'payroll_configuration.status':'Submitted'}, 'payroll.total_amount', [{ table: 'payroll_configuration', condition: ['payroll_configuration.id', 'payroll.payroll_configuration_id'] }]);
    employeeCosts = employeeCosts.data;

    let bills = await indexRepository.sum('ledgers', {...dateFiltercondition, status:['Paid', 'Partially Paid'], is_void: false, write_off_id: null, entity_type: 'bill' }, 'amount', [], true);
    bills = bills.data;

    const balanceEffectDeductionsConditions = {
        ...dateFiltercondition,
        global_search: `expense_transaction_type = '1'`,
        status: ['Processed']
    };
    const balanceEffectDeductions = await indexRepository.sum('expense_management', balanceEffectDeductionsConditions, 'amount', [], true);
    let expensePaid = balanceEffectDeductions.data;

    // Percentage Calculation of margin.
    let margin = (((revenue) - (employeeCosts+bills)) / revenue) * 100

    let employeeBalance = await indexRepository.sum('employee',null,'balance_amount',[]);
    employeeBalance = employeeBalance.data

    // Balance Calculation 
    const balance = totalPercentage - margin;

    const series = [parseFloat(balance).toFixed(2), parseFloat(margin).toFixed(2)];
    const labels = ['Balance', 'Margin']
    return {
        status: true,
        data: {
            series: series,
            labels: labels,
            balance_amount: parseFloat(employeeBalance).toFixed(2),
            margin_amount: parseFloat(revenue - (employeeCosts+bills)).toFixed(2),
            total_amount: parseFloat(employeeBalance + revenue - (employeeCosts+bills)).toFixed(2)
        }
    };
}

function getMonthInfoBetweenDates(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = [];

    let currentDate = new Date(start);
    while (currentDate <= end) {
        const monthName = currentDate.toLocaleString('default', { month: 'short' });
        const monthStart = currentDate.getFullYear() + '-' +
            String(currentDate.getMonth() + 1).padStart(2, '0') + '-01 00:00:00.000Z';

        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const monthEnd = lastDayOfMonth.getFullYear() + '-' +
            String(lastDayOfMonth.getMonth() + 1).padStart(2, '0') + '-' +
            String(lastDayOfMonth.getDate()).padStart(2, '0') + ' 23:59:59.999Z';

        months.push({
            month: monthName,
            start: monthStart,
            end: monthEnd
        });

        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }

    return months;
}

module.exports = { employeesCount, topCompanies, receivablesPayables, cashFlow, payRoll, employeeMargin }