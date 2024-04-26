
const { getConnection } = require('../../../../middlewares/connectionManager');
const indexRepository = require('../../repositories/index');

/**
 * update function to update the employee payroll configuration.
 * - Create a new object 'payrollConfigObj' with properties from the request body for the Employee payroll configuration.
 * - Call the 'indexRepository.update' function to update the 'payrollConfigObj' to the 'employee' table.
 * 
 * - Update Employee Balance Amount Audit Track
 *   + create a new object 'auditTrackObj' with properties from the request body for the Employee payroll configuration.
 *   + Based the changes made in balance_amount, standard_pay_amount add information to employee_
 * 
 * - EMployee Update Activity Track
 * - Return the response from the repository.
 * 
 * @param {Object} employee - The request body containing Employee payroll details.
 * @returns {Object} Repository response.
 */
const update = async (body) => {
    let trx;
    try {
        // Initialize a database transaction
        const db = await getConnection();
        trx = await db.transaction()

        const condition = { id: body.employee_id };

        // Create an object 'payrollConfigObj' to store employee details.
        const payrollConfigObj = {
            balance_amount: Number(body.balance_amount),
            hours_worked: Number(body.hours_worked),
            standard_pay_amount: Number(body.standard_pay_amount),
            enable_payroll: body.enable_payroll,
            enable_balance_sheet: body.enable_balance_sheet,
            payroll_config_settings_id: body.enable_payroll ? body.payroll_config_settings_id : null,
            updated_by: body.updated_by,
            updated_at: new Date()
        };

        // Update the employee details in the 'employee' table using the indexRepository, based on the provided condition.
        const employeePayRollDetails = await indexRepository.update('employee', condition, payrollConfigObj);

        // Update Employee Balance Amount Audit Track
        let auditTrackData = {
            employee_id: body.employee_id,
            remarks: body.remarks ? body.remarks : '',
            created_by: body.created_by,
            created_at: new Date()
        };

        // If balance has been change update audit track Information message
        if (body.old_balance_amount && body.old_balance_amount != body.balance_amount) {
            auditTrackData.information = `Balance amount updated from ${body.old_balance_amount} to ${body.balance_amount} `;
        }

        // If standart Pay Amount has been change update audit track Information message
        if (body.old_standard_pay_amount && body.old_standard_pay_amount != body.standard_pay_amount) {
            const and = (auditTrackData.information) ? `any ` : ` `;
            auditTrackData.information += and + `Standard Pay amount updated from ${body.old_standard_pay_amount} to ${body.standard_pay_amount}`;
        }

        // If standart Pay Amount has been change update audit track Information message
        if (body.old_hours_worked && body.old_hours_worked != body.hours_worked) {
            const and = (auditTrackData.information) ? `any ` : ` `;
            auditTrackData.information += and + `Hours updated from ${body.old_hours_worked} to ${body.hours_worked}`;
        }

        if (auditTrackData.information) {
            await indexRepository.store('emp_balance_amount_audit_track', auditTrackData);
        }

        await trx.commit();
        return { status: true, data: employeePayRollDetails };

    } catch (error) {
        // Handle errors and rollback the transaction in case of an exception
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

module.exports = { update } 