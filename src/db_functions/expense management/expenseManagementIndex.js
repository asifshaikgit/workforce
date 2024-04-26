
const getExpenseManagementIndex = async (tenantDb) => {

    try {
        // ENABLE APPROVAL
        await tenantDb.raw(`
        DROP FUNCTION IF EXISTS getExpenseManagementIndex(
            expense_id_filter UUID,
            employment_type_filter SMALLINT,
            employee_id_filter UUID,
            transaction_type_filter SMALLINT,
            search_filter VARCHAR(255),
            page_size INT,
            page_number INT,
            date_format TEXT
        );
        CREATE OR REPLACE FUNCTION getExpenseManagementIndex(
                expense_id_filter UUID,
                employment_type_filter SMALLINT,
                employee_id_filter UUID,
                transaction_type_filter SMALLINT,
                search_filter VARCHAR(255),
                page_size INT,
                page_number INT,
                date_format TEXT
            )
            RETURNS TABLE (
                id UUID,
                employee_id UUID,
                employee_name VARCHAR(250),
                reference_id VARCHAR(50),
                expense_type_id INTEGER,
                expense_type VARCHAR(100),
                amount DOUBLE PRECISION,
                expense_effect_on SMALLINT,
                status TEXT,
                recurring_count INTEGER,
                add_to TEXT,
                due_amount DOUBLE PRECISION,
                has_goal_amount BOOLEAN,
                goal_amount DOUBLE PRECISION,
                is_recurring BOOLEAN,
                raised_date TEXT,
                description TEXT,
                enable_approval BOOLEAN,
                check_box boolean,
                count BIGINT
            ) AS $$
            BEGIN
                RETURN QUERY
                select 
                em.id,
                emp.id as employee_id,
                emp.display_name,
                em.reference_id,
                em.expense_type_id,
                emt.name as expense_type,
                em.amount,
                em.expense_effect_on,
                em.status,
                em.recurring_count,
                CASE
                    WHEN em.expense_effect_on = 1 THEN 'Payroll'
                    WHEN em.expense_effect_on = 2 THEN 'Balance Sheet'
                    ELSE NULL 
                END AS add_to,
                em.due_amount,
                COALESCE(em.has_goal_amount, false) AS has_goal_amount,
                COALESCE(em.goal_amount, 0) AS goal_amount,
                COALESCE(em.is_recurring, false) AS is_recurring,
                TO_CHAR(em.raised_date, date_format) AS raised_date, 
                COALESCE(em.description, '') AS description,
                CASE
                    WHEN employment_type_filter = 1 AND em.enable_approval = true AND em.raised_by = 2 AND em.status != 'Processed' AND em.status != 'Approved' AND em.status != 'Rejected' THEN true
                    WHEN employment_type_filter = 2 AND em.enable_approval = true AND em.raised_by = 1 AND em.status != 'Processed' AND em.status != 'Approved' AND em.status != 'Rejected' THEN true  -- AND em.expense_transaction_type = 2
                    ELSE false
                END AS enable_approval,
                em.enable_approval as check_box,
                (
                    SELECT COUNT(*) 
                    FROM  expense_management AS expense_count
                    LEFT JOIN employee AS e_count ON e_count.id = expense_count.employee_id 
                    WHERE 
                    (                        
                        expense_id_filter IS NULL OR expense_count.id = expense_id_filter
                    )
                    AND (employee_id_filter IS NULL OR expense_count.employee_id = employee_id_filter)
                    AND (transaction_type_filter IS NULL OR expense_count.expense_transaction_type = transaction_type_filter)
                    AND (search_filter IS NULL OR (LOWER(expense_count.reference_id)) LIKE '%' || (LOWER(search_filter)) || '%' )
                ) AS count
                
                FROM expense_management as em
                INNER JOIN employee AS emp on emp.id = em.employee_id
                INNER JOIN expense_and_service_types AS emt on emt.id = em.expense_type_id
                where
                ( 
                    expense_id_filter IS NULL OR em.id = expense_id_filter 
                )
                AND (employee_id_filter IS NULL OR em.employee_id = employee_id_filter)
                AND (transaction_type_filter IS NULL OR em.expense_transaction_type = transaction_type_filter)
                AND (search_filter IS NULL OR (LOWER(em.reference_id)) LIKE '%' || (LOWER(search_filter)) || '%' )
                AND em.deleted_at IS NULL
            ORDER BY
                em.created_at DESC
            LIMIT
                page_size
            OFFSET
                (page_number - 1) * page_size;
            END;
            $$ LANGUAGE plpgsql;`
        )
    } catch (e) {
        console.log(e.message);
    }
};

module.exports = getExpenseManagementIndex;