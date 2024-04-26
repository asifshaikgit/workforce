const moment = require('moment')
const indexRepository = require("../../../repositories/index")
const { convertJsonToExcelEmployee } = require('../../../../../../utils/json_to_excel')

/**
 * Handles the export of expense management data based on the provided condition, page, limit, and date format.
 * - Constructs a SQL query based on the condition parameters to fetch expense management data.
 * - Executes the SQL query using indexRepository.rawQuery.
 * - If expense management data is retrieved:
 *    - Maps the retrieved data to a standardized format for export.
 *    - Converts the mapped data to an Excel file using convertJsonToExcelEmployee function.
 *    - Returns an object indicating successful export with the file path.
 * - If no expense management data is retrieved:
 *    - Returns an object indicating failure with the data retrieved.
 *
 * @param {Object} condition - Object containing conditions for filtering expense management data.
 * @param {number} page - Page number for pagination.
 * @param {number} limit - Limit for the number of records per page.
 * @param {string} dateFormat - Date format for formatting dates.
 * @returns {Object} - Object containing the status of the export operation and the file path if successful.
 */
const exportExpenseManagement = async (condition, page, limit, dateFormat) => {

    let query = `SELECT * FROM getExpenseManagementListing(`;
    query += (condition.expense_type !== null) ? `'${condition.expense_type}',` : `${condition.expense_type},`;
    query += (condition.employment_type != null) ? `'${condition.employment_type}',` : `${condition.employment_type},`;
    query += (condition.status !== null) ? `'${condition.status}',` : `${condition.status},`;
    query += (condition.expense_transaction_type !== null) ? `'${condition.expense_transaction_type}',` : `${condition.expense_transaction_type},`;
    query += (condition.employee_id != null) ? `'${condition.employee_id}',` : `${condition.employee_id},`;
    query += (condition.balance_sheet != null) ? `'${condition.balance_sheet}',` : `${condition.balance_sheet},`;
    query += (condition.search !== null) ? `'${condition.search}',` : `${condition.search},`;
    query += (condition.from_date && condition.to_date) ? `'${condition.from_date}', '${condition.to_date}',` : `${condition.from_date}, ${condition.to_date},`;
    query += `${limit}, ${page},`;
    query += `'${dateFormat}')`;

    const expenseManagementListing = await indexRepository.rawQuery(query);

    if (expenseManagementListing.length > 0) {
        const listingData = expenseManagementListing.map((expense, index) => ({
            'SNo': index + 1,
            'Expense ID':  expense.reference_id,
            'Employee ID':  expense.employee_reference_id,
            'Employee Name':  expense.display_name,
            'Expense Type Name':  expense.expense_type,
            'Expense Transaction Type' : expense.expense_transaction_type,
            'Expense Amount':  expense.amount,
            'Expense Raised Date': moment(expense.raised_date, 'MM/DD/YYYY').format('YYYY-MM-DD'),
            'Description':  expense.description ? expense.description  : '',
            // 'Due Amount':  expense.due_amount,
            'Status': expense.status,
        }));
            
        var excelfile = await convertJsonToExcelEmployee( listingData, 'Expense-Management')
        return { status: true, filepath: excelfile }

    } else {
        return {
            status: false,
            data: expenseManagementListing
        }
    }
}

  module.exports = {exportExpenseManagement};