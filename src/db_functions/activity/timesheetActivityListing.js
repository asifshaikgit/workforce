const getTimesheetActivityListingInformation = async (tenantDb) => {

    try {
        await tenantDb.raw(`    
        DROP FUNCTION IF EXISTS getTimesheetActivityInformation(
            timesheet_filter UUID,
            date_format TEXT,
            page_size INT,
            page_number INT
        );
        CREATE OR REPLACE FUNCTION getTimesheetActivityInformation(
            timesheet_filter UUID,
            date_format TEXT,
            page_size INT,
            page_number INT
        )
        RETURNS TABLE (
            serial_number BIGINT,
            id INT,
            timesheet_id UUID,
            reference_id VARCHAR(50),
            action_type SMALLINT,
            action_type_name TEXT,
            delete_hour_ids TEXT,
            is_document_modified BOOLEAN,
            created_by VARCHAR(250),
            created_at TEXT,
            created_time TEXT,
            field_changes TEXT,
            total_activity_count BIGINT
        )
        AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                ROW_NUMBER() OVER (ORDER BY tat.created_at) AS serial_number,
                tat.id, 
                ts.id as timesheet_id,
                ts.reference_id as reference_id,
                tat.action_type,
                CASE 
                    WHEN tat.action_type = 1 THEN 'store'
                    WHEN tat.action_type = 2 THEN 'update'
                    WHEN tat.action_type = 3 THEN 'delete'
                    WHEN tat.action_type = 4 THEN 'approval'
                    ELSE 'unknown'
                END AS action_type_name, 
                tat.delete_hour_ids,
                bool_or(tat.is_document_modified) AS is_document_modified,
                created.display_name as created_by, 
                TO_CHAR(tat.created_at, date_format) AS created_at,
                TO_CHAR(tat.created_at, 'HH24:MI') AS created_time,
                CASE 
                    WHEN tat.action_type = 2 THEN 
                        CASE 
                            WHEN bool_or(tat.is_document_modified) THEN 
                                (
                                    SELECT STRING_AGG(field_change_message, ', ')
                                    FROM (
                                        SELECT 
                                            CASE 
                                                WHEN tat.is_document_modified THEN tfc.field_name || ' has been modified'
                                                ELSE tfc.field_name || ' has been changed from ' || tfc.old_value || ' to ' || tfc.new_value
                                            END AS field_change_message
                                        FROM timesheet_fields_changes AS tfc
                                        WHERE tat.id = tfc.timesheet_activity_track_id
                                    ) AS field_changes
                                )
                            ELSE 
                                (
                                    SELECT STRING_AGG(
                                        CASE 
                                            WHEN tfc.timesheet_hours_id IS NOT NULL AND (tfc.field_name = 'billable_hours' OR tfc.field_name = 'total_hours' OR tfc.field_name = 'ot_hours') THEN 
                                                tfc.field_name || ' has been changed from ' || tfc.old_value || ' to ' || tfc.new_value || ' on ' || to_char(th.date, date_format)
                                            ELSE 
                                                tfc.field_name || ' has been changed from ' || tfc.old_value || ' to ' || tfc.new_value
                                        END, ', '
                                    )
                                    FROM timesheet_fields_changes AS tfc
                                    LEFT JOIN timesheet_hours AS th ON tfc.timesheet_hours_id = th.id
                                    WHERE tat.id = tfc.timesheet_activity_track_id
                                )
                        END
                    WHEN tat.action_type = 4 THEN 
                        CASE
                            WHEN tat.approval_level IS NOT NULL THEN
                                STRING_AGG('Timesheet ' || ts.reference_id || ' has been approved by ' || approver.display_name || ' for Level ' || tat.approval_level, ', ') -- Regular aggregation
                            ELSE
                                '[]' -- Return empty array as string
                        END
                    ELSE '[]'
                END AS field_changes,
                (
                    SELECT COUNT(DISTINCT tat_count.id)
                    FROM 
                        timesheet_activity_track AS tat_count
                    LEFT JOIN 
                        timesheet_fields_changes AS tfc_count ON tat_count.id = tfc_count.timesheet_activity_track_id
                    LEFT JOIN 
                        employee AS emp_count ON emp_count.id = tat_count.created_by
                    LEFT JOIN 
                        employee AS approver_count ON approver_count.id = tat_count.approval_user_id
                    WHERE 
                        (timesheet_filter IS NULL OR tat_count.timesheet_id = timesheet_filter)    
                ) AS total_activity_count
            FROM 
                timesheet_activity_track AS tat
            LEFT JOIN 
                timesheet_fields_changes AS tfc ON tat.id = tfc.timesheet_activity_track_id
            LEFT JOIN 
                timesheets AS ts ON ts.id = tat.timesheet_id
            LEFT JOIN 
                employee AS created ON created.id = tat.created_by
            LEFT JOIN 
                employee AS approver ON approver.id = tat.approval_user_id
            WHERE 
                (timesheet_filter IS NULL OR tat.timesheet_id = timesheet_filter)  
            GROUP BY 
                tat.id, 
                tat.action_type,
                tat.created_by,
                tat.created_at,
                created.display_name,
                ts.id
            ORDER BY
                tat.created_at DESC
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

module.exports = getTimesheetActivityListingInformation;
