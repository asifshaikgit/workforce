const balanceSheetExport = async (tenantDb) => {
    try {
        await tenantDb.raw(`
            DROP FUNCTION IF EXISTS getBalancesheetExportData();
            CREATE OR REPLACE FUNCTION getBalancesheetExportData()
            RETURNS TABLE(
                display_name VARCHAR(250),
                balance_amount DOUBLE PRECISION,
                hours_worked DOUBLE PRECISION,
                employee_id VARCHAR(25),
                reimbursement DOUBLE PRECISION,
                deduction DOUBLE PRECISION,
                ampunt_paid DOUBLE PRECISION
            )
            AS $$
            BEGIN 
                RETURN QUERY
                SELECT 
                    emp.display_name,
                    emp.balance_amount,
                    emp.hours_worked,
                    emp.reference_id,
                    (
                        SELECT SUM(exm.amount) AS reimbursement
                        FROM expense_management AS exm 
                        WHERE exm.employee_id = emp.id AND expense_transaction_type = 1
                    ),
                    (
                        SELECT SUM(exm.amount) AS deduction
                        FROM expense_management AS exm 
                        WHERE exm.employee_id = emp.id AND expense_transaction_type = 2
                    ),
                    (
                        SELECT SUM(total_amount)
                        FROM payroll AS pr
                        WHERE pr.employee_id = emp.id
                    ) AS amount_paid
                FROM employee AS emp;
            END;
            $$ LANGUAGE plpgsql;
        `);
    } catch (e) {
        console.log(e.message);
    }
}

module.exports = balanceSheetExport;
