const getTimesheetApprovalActivityListingInformation = async (tenantDb) => {

    try {
        await tenantDb.raw(`    
        DROP FUNCTION IF EXISTS getTimesheetApprovalActivityInformation(
            timesheet_filter UUID,
            date_format TEXT,
            page_size INT,
            page_number INT
        );
        CREATE OR REPLACE FUNCTION getTimesheetApprovalActivityInformation(
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
            employee_name VARCHAR(250),
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
            approver.display_name,
            TO_CHAR(tat.created_at, date_format) AS created_at,
            TO_CHAR(tat.created_at, 'HH24:MI') AS created_time,
            CASE
                WHEN tat.approval_level IS NOT NULL THEN
                    STRING_AGG('Timesheet ' || ts.reference_id || ' has been approved by ' || approver.display_name || ' for Level ' || tat.approval_level, ', ') -- Regular aggregation
                ELSE
                    '[]' -- Return empty array as string
            END AS field_changes,
            (
                SELECT COUNT(DISTINCT tat_count.id)
                FROM 
                    timesheet_approval_track AS tat_count
                LEFT JOIN 
                    timesheets AS ts_count ON ts_count.id = tat_count.timesheet_id
                LEFT JOIN 
                    employee AS approver_count ON approver_count.id = tat_count.approval_user_id
                WHERE 
                    (timesheet_filter IS NULL OR tat_count.timesheet_id = timesheet_filter)    
            ) AS total_activity_count
        FROM 
            timesheet_approval_track AS tat
        LEFT JOIN 
            timesheets AS ts ON ts.id = tat.timesheet_id
        LEFT JOIN 
            employee AS approver ON approver.id = tat.approval_user_id
        WHERE 
            (timesheet_filter IS NULL OR tat.timesheet_id = timesheet_filter)  
        GROUP BY 
            tat.timesheet_id,
            ts.id,
            tat.created_at,
            tat.approval_level,
            approver.display_name,
            tat.id  
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

module.exports = getTimesheetApprovalActivityListingInformation;
