const getEmployeeActivityListingInformation = async (tenantDb) => {

    try {
        await tenantDb.raw(`
        DROP FUNCTION IF EXISTS getEmployeeActivityInformation(
            employee_filter UUID,
            search_filter TEXT,
            date_format TEXT,
            page_size INT,
            page_number INT
        );  
        CREATE OR REPLACE FUNCTION getEmployeeActivityInformation(
            employee_filter UUID,
            search_filter TEXT,
            date_format TEXT,
            page_size INT,
            page_number INT
        )
        RETURNS TABLE (
            activity_name VARCHAR(255),
            created_at TEXT,
            action_by VARCHAR(255),
            change_log TEXT[],
            total_activity_count BIGINT
        )
        AS $$
        BEGIN
          RETURN QUERY
          SELECT 
          emp_prf_activity.activity AS activity_name,
          TO_CHAR(emp_prf_activity.created_at::TIMESTAMP, 'MM-DD-YYYY') || ' at ' || TO_CHAR(emp_prf_activity.created_at::TIMESTAMP, 'HH:MI AM') AS created_at,
          emp.display_name as action_by,
          ARRAY_AGG(
            CASE
                WHEN (jsn->>'action_type')::INT = 1 AND jsn->>'slug' = 'document' THEN
                    CONCAT(
                        jsn->>'value', ' ', jsn->>'label_name', ' added'
                    )
                WHEN (jsn->>'action_type')::INT = 1 THEN
                    CONCAT(
                        jsn->>'label_name', ' > ', jsn->>'value', ' is created'
                    )
                WHEN (jsn->>'action_type')::INT = 2 THEN 
                    CONCAT(
                         CASE
                            WHEN jsn->>'reference_name' != '' THEN CONCAT(jsn->>'reference_name', ' > ')
                            ELSE ''
                         END, jsn->>'label_name', ' is updated from ', 
                         CASE	
                            WHEN jsn->>'old_value' = '' THEN '" "'
                            ELSE COALESCE(jsn->>'old_value', '" "')
                         END,
                        ' to ', 
                        CASE	
                            WHEN jsn->>'new_value' = '' THEN '" "'
                            ELSE COALESCE(jsn->>'new_value', '" "')
                        END)
                WHEN (jsn->>'action_type')::INT = 3 AND jsn->>'slug' = 'document' THEN
                    CONCAT(
                        jsn->>'value', ' ', jsn->>'label_name', ' deleted'
                        )
                WHEN (jsn->>'action_type')::INT = 3 THEN
                    CONCAT(
                       jsn->>'label_name', ' > ', jsn->>'value', ' is deleted'
                    )
                ELSE ''
            END
          ) as change_log,
          (
            SELECT COUNT(DISTINCT emp_prf_activity_count.id)
            FROM employee_profile_activity_track AS emp_prf_activity_count
            WHERE emp_prf_activity_count.employee_id = employee_filter
            AND (
                search_filter IS NULL
                OR (LOWER(emp_prf_activity_count.activity)) LIKE '%' || (LOWER(search_filter)) || '%'
                )
        ) AS total_activity_count
      FROM 
      employee_profile_activity_track AS emp_prf_activity 
      LEFT JOIN LATERAL JSONB_ARRAY_ELEMENTS(emp_prf_activity.change_log) AS jsn ON TRUE
      LEFT JOIN employee as emp on emp.id = emp_prf_activity.created_by
      WHERE 
          emp_prf_activity.employee_id = employee_filter
          AND (
            search_filter IS NULL
            OR (LOWER(emp_prf_activity.activity)) LIKE '%' || (LOWER(search_filter)) || '%'
            )
          GROUP BY emp_prf_activity.activity, emp_prf_activity.created_at, emp.display_name
          ORDER BY emp_prf_activity.created_at DESC
            LIMIT
                page_size
            OFFSET
                (page_number - 1) * page_size;
        END;
        $$ LANGUAGE plpgsql;                                   
        `);
    } catch (e) {
        console.log(e.message);
    }
};

module.exports = getEmployeeActivityListingInformation;
