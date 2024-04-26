const indexRepository = require('../../repositories/index');

/**
 * DashboardData function to get the balancesheet data
 * Logic
 *  - Fetch the `total_payroll_amount` from 'payroll' table.
 *  - Fetch the `total_expense` from 'expense_management' table.
 *  - Fetch the 'total_balance' from 'employee' table.
 *  - If data exists,
*     + sum the `total_payroll_amount`, `total_expense_amout` and `total_balance` of each employee.
 *    + Prepare the response
 *    + return the response with status as true
 *  - Else
 *    + return the response with status as false
 *   
 * @param {object} condition
 * @returns {object} - An object containing the retrieved total_payroll_amount, total_expense, and total_balance.
 */
const dashboardData = async (condition) => {

    let data = {};

    // Fetch the total_payroll_amount from 'payroll' table
    data.total_payroll_amount = await indexRepository.rawQuery(`SELECT SUM(total_amount) as total_payroll_amount from payroll INNER JOIN payroll_configuration ON payroll_configuration.id = payroll.payroll_configuration_id where payroll.deleted_at is NULL AND payroll_configuration.status = 'Submitted'`);

    // Fetch the total_expense_amount from 'expense_management_table' table
    data.total_expense_amount = await indexRepository.rawQuery(`SELECT SUM(amount) as total_expense_amount from expense_management 
    where (status = 'Processed' OR status = 'Deduction In Progress' OR status = 'Reimbursement In Progress') AND deleted_at is NULL`); // amount raised by admin with employee approval and amount raised by admin without employee approval

    // Fetch the total_expense_amount from 'expense_management_table' table
    data.total_balance = await indexRepository.rawQuery(`SELECT SUM(balance_amount) as balance_amount from employee where deleted_at is NULL`);


    if (condition.from_date && condition.to_date) {
        data.total_expense_amount = await indexRepository.rawQuery(`SELECT SUM(amount) as total_expense_amount from expense_management 
        where (status = 'Processed' OR status = 'Deduction In Progress' OR status = 'Reimbursement In Progress') AND deleted_at is NULL AND raised_date BETWEEN '${condition.from_date}' AND '${condition.to_date}'`);
    }

    if (data.total_payroll_amount && data.total_expense_amount && data.total_balance) {

        const parseAmount = (value) => {
            return parseFloat((value != null ? value : 0).toFixed(2)) || "";
        };

        data.total_payroll_amount = parseAmount(data.total_payroll_amount[0]?.total_payroll_amount) || 0;
        data.total_expense_amount = parseAmount(data.total_expense_amount[0]?.total_expense_amount) || 0;
        data.total_balance = parseAmount(data.total_balance[0]?.balance_amount) || 0;

        return {
            status: true,
            data: data
        }
    } else {
        return total_payroll_amount;
    }
}



module.exports = { dashboardData }