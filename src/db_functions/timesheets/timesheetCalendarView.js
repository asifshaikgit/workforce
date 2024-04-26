const getTimesheetsCalendarView = async (tenantDb) => {
 
    try {
        await tenantDb.raw(`
        DROP FUNCTION IF EXISTS getTimesheetsCalendarView(
            from_date_filter TIMESTAMP,
            to_date_filter TIMESTAMP,
            employee_id_filter TEXT,
            placement_id_filter UUID,
            date_format TEXT
        );
        CREATE OR REPLACE FUNCTION getTimesheetsCalendarView(
                from_date_filter TIMESTAMP,
                to_date_filter TIMESTAMP,
                employee_id_filter TEXT,
                placement_id_filter UUID,
                date_format TEXT
            )
            RETURNS TABLE (
                data JSONB
            ) AS $$
            DECLARE
            employee_id_filter_array TEXT[];
            BEGIN
            employee_id_filter_array := string_to_array(employee_id_filter, ',')::TEXT[];
                RETURN QUERY
                WITH sum_total_hours AS (
                    SELECT
                    e.id as employee_id,
                    
                    CASE
                    WHEN EXTRACT(HOUR FROM SUM(tsh.total_hours)) >= 100 THEN 
                      EXTRACT(HOUR FROM SUM(tsh.total_hours)) || ':' || LPAD(EXTRACT(MINUTE FROM SUM(tsh.total_hours))::TEXT, 2, '0')
                    ELSE 
                      LPAD(EXTRACT(HOUR FROM SUM(tsh.total_hours))::TEXT, 2, '0') || ':' || LPAD(EXTRACT(MINUTE FROM SUM(tsh.total_hours))::TEXT, 2, '0')
                  END as total_hours,
                    CASE
                    WHEN EXTRACT(HOUR FROM SUM(tsh.ot_hours)) >= 100 THEN 
                      EXTRACT(HOUR FROM SUM(tsh.ot_hours)) || ':' || LPAD(EXTRACT(MINUTE FROM SUM(tsh.ot_hours))::TEXT, 2, '0')
                    ELSE 
                      LPAD(EXTRACT(HOUR FROM SUM(tsh.ot_hours))::TEXT, 2, '0') || ':' || LPAD(EXTRACT(MINUTE FROM SUM(tsh.ot_hours))::TEXT, 2, '0')
                  END as ot_hours,
                    CASE
                    WHEN EXTRACT(HOUR FROM SUM(tsh.billable_hours)) >= 100 THEN 
                      EXTRACT(HOUR FROM SUM(tsh.billable_hours)) || ':' || LPAD(EXTRACT(MINUTE FROM SUM(tsh.billable_hours))::TEXT, 2, '0')
                    ELSE 
                      LPAD(EXTRACT(HOUR FROM SUM(tsh.billable_hours))::TEXT, 2, '0') || ':' || LPAD(EXTRACT(MINUTE FROM SUM(tsh.billable_hours))::TEXT, 2, '0')
                  END as billable_hours

                    FROM
                        employee AS e
                    JOIN placements AS p ON p.employee_id = e.id
                    JOIN timesheets as ts ON ts.placement_id = p.id
                    JOIN timesheet_hours AS tsh ON tsh.timesheet_id = ts.id
                    WHERE 
                    (
                            placement_id_filter IS NULL
                            OR p.id = placement_id_filter 
                        )
                        AND 
                        (from_date_filter IS NOT NULL AND to_date_filter IS NOT NULL AND tsh.date BETWEEN from_date_filter AND to_date_filter)
                        OR (from_date_filter IS NULL OR to_date_filter IS NULL)
                    group by e.id
                ),
                
                TS_Hours AS (
                    SELECT
                        e.id as employee_id, com.id as client_id,
                        jsonb_agg(DISTINCT jsonb_build_object(
                            'id', tsh.id,
                            'date', tsh.date,
                            'ot_hours', LPAD(EXTRACT(HOUR FROM tsh.ot_hours)::TEXT, 2, '0') || ':' || LPAD(EXTRACT(MINUTE FROM tsh.ot_hours)::TEXT, 2, '0'),
                            'billable_hours', LPAD(EXTRACT(HOUR FROM tsh.billable_hours)::TEXT, 2, '0') || ':' || LPAD(EXTRACT(MINUTE FROM tsh.billable_hours)::TEXT, 2, '0'),
                            'total_hours', LPAD(EXTRACT(HOUR FROM tsh.total_hours)::TEXT, 2, '0') || ':' || LPAD(EXTRACT(MINUTE FROM tsh.total_hours)::TEXT, 2, '0'),
                            'status', ts.status,
                            'invoice_raised', tsh.invoice_raised,
                            'payroll_raised', tsh.payroll_raised
                        )) AS ts_hours
                    FROM
                          employee AS e
                    JOIN placements AS p ON p.employee_id = e.id
                    JOIN companies as com ON com.id = p.client_id AND com.entity_type = 'client'
                    JOIN timesheets as ts ON ts.placement_id = p.id
                    JOIN timesheet_hours AS tsh ON tsh.timesheet_id = ts.id
                    WHERE 
                        (from_date_filter IS NOT NULL AND to_date_filter IS NOT NULL AND tsh.date BETWEEN from_date_filter AND to_date_filter)
                        OR (from_date_filter IS NULL OR to_date_filter IS NULL)
                        AND (
                            placement_id_filter IS NULL
                            OR p.id = placement_id_filter 
                        )
                        GROUP BY e.id, com.id
                ),
                
                TS_info AS (
                    SELECT
                    e.id as employee_id,
                        jsonb_agg(DISTINCT jsonb_build_object(
                            'client_id', p.client_id,
                            'client_name', com.name,
                            'placement_id', p.id,
                            'timesheet_hours',  COALESCE((SELECT ts_hours FROM TS_Hours WHERE employee_id = p.employee_id and client_id = com.id), '[]'::jsonb)
                        )) AS ts_info
                    FROM
                         employee AS e
                    JOIN placements AS p ON p.employee_id = e.id
                    JOIN companies as com ON com.id = p.client_id AND com.entity_type = 'client'
                    JOIN timesheets as ts ON ts.placement_id = p.id
                    JOIN timesheet_hours AS tsh ON tsh.timesheet_id = ts.id
                    WHERE 
                    (
                        placement_id_filter IS NULL
                        OR p.id = placement_id_filter 
                    )
                    AND 
                    (from_date_filter IS NOT NULL AND to_date_filter IS NOT NULL AND tsh.date BETWEEN from_date_filter AND to_date_filter)
                    OR (from_date_filter IS NULL OR to_date_filter IS NULL)
                    group by e.id
                )
                
                SELECT
                    jsonb_build_object(
                        'data', jsonb_agg(DISTINCT jsonb_build_object(
                            'employee_id', p.employee_id,
                            'employee_name', e.display_name,
                            'profile_picture_url', COALESCE(e.profile_picture_url, ''),
                            'sum_hours', (SELECT total_hours FROM sum_total_hours WHERE employee_id = p.employee_id),
                            'sum_ot_hours', (SELECT ot_hours FROM sum_total_hours WHERE employee_id = p.employee_id),
                            'sum_billed_hours', (SELECT billable_hours FROM sum_total_hours WHERE employee_id = p.employee_id),
                            'ts_info', COALESCE((SELECT ts_info FROM TS_info where employee_id = p.employee_id), '[]'::jsonb)
                        )))
                    
                FROM
                employee AS e
                JOIN placements AS p ON e.id = p.employee_id
                JOIN timesheets AS ts ON ts.placement_id = p.id
                JOIN timesheet_hours AS tsh ON tsh.timesheet_id = ts.id
                WHERE 
                    (tsh.date BETWEEN from_date_filter AND to_date_filter)
                AND (
                    employee_id_filter IS NULL OR e.id = ANY(employee_id_filter_array::uuid[])
                );
            END;
            $$ LANGUAGE plpgsql;`
        )
    } catch (e) {
        console.log(e.message);
    }
};

module.exports = getTimesheetsCalendarView;