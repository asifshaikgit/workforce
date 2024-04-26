const getEmployeeSelfServiceActivityListingInformation = async (tenantDb) => {

    try {
        await tenantDb.raw(`
        DROP FUNCTION IF EXISTS getEmployeeSelfServiceActivityInformation(
            employee_self_service_filter UUID,
            date_format TEXT,
            page_size INT,
            page_number INT
        );  
        CREATE OR REPLACE FUNCTION getEmployeeSelfServiceActivityInformation(
            employee_self_service_filter UUID,
            date_format TEXT,
            page_size INT,
            page_number INT
        )
        RETURNS TABLE (
            serial_number BIGINT,
            id INT,
            employee_self_service_id UUID,
            action_type SMALLINT,
            action_type_name TEXT,
            is_document_modified BOOLEAN,
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
                esst.employee_self_service_id,
                esst.action_type,
                CASE 
                    WHEN esst.action_type = 1 THEN 'store'
                    WHEN esst.action_type = 2 THEN 'update'
                    WHEN esst.action_type = 3 THEN 'delete'
                    ELSE 'unknown'
                END AS action_type_name, 
                bool_or(essfc.is_document_modified) AS is_document_modified,
                created.display_name as created_by, 
                TO_CHAR(esst.created_at, date_format) AS created_at,
                TO_CHAR(esst.created_at, 'HH24:MI') AS created_time,
                CASE 
                    WHEN esst.action_type = 2 THEN 
                        CASE 
                            WHEN bool_or(essfc.is_document_modified) THEN 
                                (
                                    SELECT STRING_AGG(field_change_message, ', ')
                                    FROM (
                                        SELECT 
                                            CASE 
                                                WHEN essfc.is_document_modified THEN essfc.field_name || ' has been modified'
                                                ELSE essfc.field_name || ' has been changed from ' || essfc.old_value || ' to ' || essfc.new_value
                                            END AS field_change_message
                                        FROM employee_fields_changes AS essfc
                                        WHERE esst.id = essfc.employee_profile_activity_track_id
                                    ) AS field_changes
                                )
                            ELSE 
                                STRING_AGG(essfc.field_name || ' has been changed from ' || essfc.old_value || ' to ' || essfc.new_value, ', ') -- Regular aggregation
                        END
                    ELSE '[]' -- Return empty array as string
                END AS field_changes,
                (
                    SELECT COUNT(DISTINCT esst_count.id)
                    FROM 
                        employee_self_service_track AS esst_count
                    LEFT JOIN 
                        employee_self_service_fields_changes AS essfc_count ON esst_count.id = essfc_count.employee_self_service_track_id
                    LEFT JOIN 
                        employee AS emp_count ON emp_count.id = esst_count.created_by
                    WHERE 
                        (employee_self_service_filter IS NULL OR esst_count.employee_self_service_id = employee_self_service_filter)    
                ) AS total_activity_count
            FROM 
                employee_self_service_track AS esst
            LEFT JOIN 
                employee_self_service_fields_changes AS essfc ON esst.id = essfc.employee_self_service_track_id
            LEFT JOIN 
                employee AS created ON created.id = esst.created_by
            WHERE 
                (employee_self_service_filter IS NULL OR esst.employee_self_service_id = employee_self_service_filter)  
            GROUP BY 
                esst.id,
                esst.employee_self_service_id,                 
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

module.exports = getEmployeeSelfServiceActivityListingInformation;
