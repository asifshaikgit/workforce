const getExpenseActivityListingInformation = async (tenantDb) => {

    try {
        await tenantDb.raw(`
        DROP FUNCTION IF EXISTS getExpenseActivityInformation(
            expense_filter UUID,
            date_format TEXT,
            page_size INT,
            page_number INT
        );  
        CREATE OR REPLACE FUNCTION getExpenseActivityInformation(
            expense_filter UUID,
            date_format TEXT,
            page_size INT,
            page_number INT
        )
        RETURNS TABLE (
            serial_number BIGINT,
            id INT,
            expense_id UUID,
            action_type SMALLINT,
            action_type_name TEXT,
            created_by VARCHAR(250),
            created_at TEXT,
            created_time TEXT,
            field_changes TEXT, -- Change type to TEXT
            total_activity_count BIGINT
        )
        AS $$
        BEGIN
          RETURN QUERY
            SELECT 
                ROW_NUMBER() OVER (ORDER BY esst.created_at) AS serial_number,
                esst.id, 
                esst.expense_id,
                esst.action_type,
                CASE 
                    WHEN esst.action_type = 1 THEN 'store'
                    WHEN esst.action_type = 2 THEN 'update'
                    WHEN esst.action_type = 3 THEN 'delete'
                    ELSE 'unknown'
                END AS action_type_name,
                created.display_name as created_by, 
                TO_CHAR(esst.created_at, date_format) AS created_at,
                TO_CHAR(esst.created_at, 'HH24:MI') AS created_time,
                STRING_AGG(essfc.field_name || ' has been changed from ' || essfc.old_value || ' to ' || essfc.new_value, ', ') as field_changes,
                (
                    SELECT COUNT(DISTINCT eat_count.id)
                    FROM 
                        expense_activity_track AS eat_count
                    LEFT JOIN 
                        expense_fields_changes AS efc_count ON eat_count.id = efc_count.expense_activity_track_id
                    LEFT JOIN 
                        employee AS emp_count ON emp_count.id = eat_count.created_by
                    WHERE 
                        (expense_filter IS NULL OR eat_count.expense_id = expense_filter)    
                ) AS total_activity_count
            FROM 
                expense_activity_track AS esst
            LEFT JOIN 
                expense_fields_changes AS essfc ON esst.id = essfc.expense_activity_track_id
            LEFT JOIN 
                employee AS created ON created.id = esst.created_by
            WHERE 
                (expense_filter IS NULL OR esst.expense_id = expense_filter)  
            GROUP BY 
                esst.id,
                esst.expense_id,                 
                esst.action_type,
                esst.created_by,
                esst.created_at,
                created.display_name
            ORDER BY
                esst.created_at DESC 
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

module.exports = getExpenseActivityListingInformation;
