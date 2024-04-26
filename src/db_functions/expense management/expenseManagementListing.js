const getExpenseManagementListing = async (tenantDb) => {
  try {
    await tenantDb.raw(`
      DROP FUNCTION IF EXISTS getExpenseManagementListing(
        expense_type_filter TEXT,
        employment_type_filter SMALLINT,
        status_filter TEXT,
        expense_transaction_filter TEXT,
        employee_id_filter UUID,
        balance_sheet_filter TEXT,
        search_filter VARCHAR(255),
        from_date_filter TIMESTAMP,
        to_date_filter TIMESTAMP,
        page_size INT,
        page_number INT,
        date_format TEXT
      );
      CREATE OR REPLACE FUNCTION getExpenseManagementListing(
        expense_type_filter TEXT,
        employment_type_filter SMALLINT,
        status_filter TEXT,
        expense_transaction_filter TEXT,
        employee_id_filter UUID,
        balance_sheet_filter TEXT,
        search_filter VARCHAR(255),
        from_date_filter TIMESTAMP,
        to_date_filter TIMESTAMP,
        page_size INT,
        page_number INT,
        date_format TEXT
      ) 
      RETURNS TABLE (
        lable TEXT,
        display_name VARCHAR(250),
        employee_id UUID,
        employee_reference_id VARCHAR(25),
        gender VARCHAR(20),
        profile_picture_url VARCHAR(255),
        e_verified SMALLINT,
        contact_number VARCHAR(12),
        id UUID,
        expense_type VARCHAR(100),
        created_by VARCHAR(250),
        reference_id VARCHAR(50),
        amount DOUBLE PRECISION,
        has_goal_amount BOOLEAN,
        goal_amount DOUBLE PRECISION,
        is_recurring BOOLEAN,
        recurring_count INTEGER,
        expense_transaction_type SMALLINT,
        status TEXT,
        raised_date TEXT,
        description TEXT,
        due_amount DOUBLE PRECISION,
        enable_approval  BOOLEAN,
        transaction_amount DOUBLE PRECISION,
        total_expense_count BIGINT
      )
      AS $$
      DECLARE
          expense_type_id_filter_array INT[];
          status_filter_array TEXT[];
          expense_transaction_filter_array INT[];
      BEGIN
        expense_type_id_filter_array := string_to_array(expense_type_filter, ',')::INT[];
        expense_transaction_filter_array := string_to_array(expense_transaction_filter, ',')::INT[];
        status_filter_array := string_to_array(status_filter, ',')::TEXT[];
        RETURN QUERY
        SELECT
        (CASE WHEN  expense_management.status NOT IN('Deduction In Progress','Reimbursement In Progress', 'Processed', 'Rejected') THEN 'new' ELSE '' END) AS lable,          employee.display_name,
          employee.id as employee_id,
          employee.reference_id as employee_reference_id,
          employee.gender,
          employee.profile_picture_url ,
          employee.e_verified,
          employee.contact_number,
          expense_management.id as id,
          expense_and_service_types.name AS expense_type,
          ce.display_name AS created_by,
          expense_management.reference_id,
          expense_management.amount, 
          expense_management.has_goal_amount, 
          expense_management.goal_amount, 
          expense_management.is_recurring, 
          expense_management.recurring_count, 
          expense_management.expense_transaction_type,
          expense_management.status,
          TO_CHAR(expense_management.raised_date, date_format) AS raised_date, 
          expense_management.description,
          expense_management.due_amount,
          CASE
              WHEN employment_type_filter = 1 AND expense_management.enable_approval = true AND expense_management.raised_by = 2 AND expense_management.status != 'Processed' AND expense_management.status != 'Approved' AND expense_management.status != 'Rejected' THEN true
              WHEN employment_type_filter = 2 AND expense_management.enable_approval = true AND expense_management.raised_by = 1 AND expense_management.status != 'Processed' AND expense_management.status != 'Approved' AND expense_management.status != 'Rejected' THEN true  -- AND expense_management.expense_transaction_type = 2
              ELSE false
          END AS enable_approval,
          CASE
          WHEN expense_management.has_goal_amount = 'true' THEN 
              COALESCE(SUM(expense_transaction_track.amount), 0)
          ELSE 
            0
          END AS transaction_amount,
          (
            SELECT COUNT(*)
            FROM expense_management AS expense_count
            JOIN employee as employee_count on employee_count.id = expense_count.employee_id
            WHERE 
            (employee_id_filter IS NULL OR expense_count.employee_id = employee_id_filter)
            AND (
              balance_sheet_filter IS NULL 
              OR ((expense_count.status = 'Processed' OR expense_count.status = 'Deduction In Progress' OR expense_count.status = 'Reimbursement In Progress') AND expense_count.status != 'Rejected')
          )
            AND (expense_type_filter IS NULL OR expense_count.expense_type_id = ANY(expense_type_id_filter_array))
            AND (expense_transaction_filter IS NULL OR expense_count.expense_transaction_type = ANY(expense_transaction_filter_array))
            AND (status_filter IS NULL OR expense_count.status = ANY(status_filter_array))
            AND (
              search_filter IS NULL
              OR (LOWER(expense_count.reference_id)) ILIKE '%' || (LOWER(search_filter)) || '%'
              OR (LOWER(employee_count.display_name)) ILIKE '%' || (LOWER(search_filter)) || '%'
            )
            AND (
              (from_date_filter IS NOT NULL AND to_date_filter IS NOT NULL AND expense_count.raised_date BETWEEN from_date_filter AND to_date_filter)
              OR 
              (from_date_filter IS NULL OR to_date_filter IS NULL)
              AND expense_count.deleted_at IS NULL
          )          
            AND expense_count.deleted_at IS NULL
          ) AS total_expense_count
        FROM 
          expense_management 
          INNER JOIN employee  ON expense_management.employee_id = employee.id
          INNER JOIN employee AS ce ON expense_management.created_by = ce.id
          LEFT JOIN expense_and_service_types  ON expense_management.expense_type_id = expense_and_service_types.id
          LEFT JOIN expense_transaction_track  ON expense_transaction_track.expense_id = expense_management.id
        WHERE 
        (employee_id_filter IS NULL OR expense_management.employee_id = employee_id_filter)
        AND (
          balance_sheet_filter IS NULL 
          OR ((expense_management.status = 'Processed' OR expense_management.status = 'Deduction In Progress' OR expense_management.status = 'Reimbursement In Progress') AND expense_management.status != 'Rejected')
      )
        AND (expense_type_filter IS NULL OR expense_management.expense_type_id = ANY(expense_type_id_filter_array))
          AND (expense_transaction_filter IS NULL OR expense_management.expense_transaction_type = ANY(expense_transaction_filter_array))
          AND (status_filter IS NULL OR expense_management.status = ANY(status_filter_array))
          AND (
            search_filter IS NULL
            OR (LOWER(expense_management.reference_id)) ILIKE '%' || (LOWER(search_filter)) || '%'
            OR (LOWER(employee.display_name)) ILIKE '%' || (LOWER(search_filter)) || '%'
          )
          AND (
            (from_date_filter IS NOT NULL AND to_date_filter IS NOT NULL AND expense_management.raised_date BETWEEN from_date_filter AND to_date_filter)
            OR 
            (from_date_filter IS NULL OR to_date_filter IS NULL)
            AND expense_management.deleted_at IS NULL
        )      
          AND expense_management.deleted_at IS NULL
        GROUP BY
        expense_management.id, expense_and_service_types.name, employee.display_name, employee.id, ce.display_name
        ORDER BY
        expense_management.created_at DESC
        LIMIT
          CASE WHEN page_size IS NULL THEN 
            NULL 
          ELSE 
            page_size 
          END
        OFFSET
          CASE WHEN page_size IS NULL THEN 
            0 
          ELSE 
            (page_number - 1) * page_size 
          END;
      END;
      $$ LANGUAGE plpgsql;
    `);
  } catch (e) {
    console.log(e.message);
  }
};

module.exports = getExpenseManagementListing;
