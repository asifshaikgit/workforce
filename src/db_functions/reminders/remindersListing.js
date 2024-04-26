const getRemindersListing = async (tenantDb) => {
    try {
        await tenantDb.raw(`
        DROP FUNCTION IF EXISTS getRemindersListing(
            employee_id_filter UUID,
            reminder_slug_filter TEXT,
            referrable_type_filter TEXT,
            pay_cycle_filter INTEGER,
            from_date_filter TIMESTAMP,
            to_date_filter TIMESTAMP,
            date_format TEXT,
            page_size INT,
            page_number INT
        );
          CREATE OR REPLACE FUNCTION getRemindersListing(
                employee_id_filter UUID,
                reminder_slug_filter TEXT,
                referrable_type_filter TEXT,
                pay_cycle_filter INTEGER,
                from_date_filter TIMESTAMP,
                to_date_filter TIMESTAMP,
                date_format TEXT,
                page_size INT,
                page_number INT
            )
            RETURNS TABLE (
                id UUID,
                employee_id UUID,
                template TEXT,
                redirection_info JSONB,
                is_read BOOLEAN,
                name VARCHAR,
                referrable_type VARCHAR,
                total_count BIGINT
            ) AS $$
            DECLARE
                reminder_slug_filter_array INT[];
            BEGIN
                reminder_slug_filter_array := string_to_array(reminder_slug_filter, ',')::INT[];
            RETURN QUERY
                SELECT
                    rm.id,
                    rm.employee_id,
                    rm.template,
                    rm.redirection_info,
                    rm.is_read,
                    rc.name,
                    rc.referrable_type,
                    (
                        SELECT 
                        COUNT(*)
                        FROM reminders AS rm_count
                        LEFT JOIN reminder_configurations AS rc_count ON rm_count.reminder_slug_id = rc_count.id
                        LEFT JOIN timesheets AS tm_count on 
                        CASE 
                            WHEN rm_count.redirection_info->>'id' ~ '^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$' THEN (rm_count.redirection_info->>'id')::UUID = tm_count.id 
                            ELSE TRUE 
                        END
                        LEFT JOIN placements AS plc on plc.id = tm_count.placement_id
                        LEFT JOIN timesheet_configurations as tc on tc.id = plc.timesheet_configuration_id
                        WHERE 
                        rm_count.employee_id = employee_id_filter
                        AND rm_count.reminder_slug_id = ANY(reminder_slug_filter_array)
                        AND rc_count.referrable_type = referrable_type_filter
                        AND (pay_cycle_filter IS NULL OR tc.cycle_id = pay_cycle_filter)
                        AND rc_count.referrable_type = referrable_type_filter
                        AND (
							(from_date_filter IS NOT NULL AND to_date_filter IS NOT NULL AND rm_count.created_at BETWEEN from_date_filter AND to_date_filter)
							OR (from_date_filter IS NULL OR to_date_filter IS NULL)
						)
                    ) AS total_reminders_count
                FROM 
                    reminders AS rm 
                    LEFT JOIN reminder_configurations AS rc ON rm.reminder_slug_id = rc.id
                    LEFT JOIN timesheets AS tm on 
                    CASE 
                        WHEN rm.redirection_info->>'id' ~ '^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$' THEN (rm.redirection_info->>'id')::UUID = tm.id 
                        ELSE TRUE 
                    END
                    LEFT JOIN placements AS plc on plc.id = tm.placement_id
                    LEFT JOIN timesheet_configurations as tc on tc.id = plc.timesheet_configuration_id
                WHERE 
                    rm.employee_id = employee_id_filter
                    AND rm.reminder_slug_id = ANY(reminder_slug_filter_array)
                    AND rc.referrable_type = referrable_type_filter
                    AND (pay_cycle_filter IS NOT NULL OR tc.cycle_id = pay_cycle_filter)
                    AND (
						(from_date_filter IS NOT NULL AND to_date_filter IS NOT NULL AND rm.created_at BETWEEN from_date_filter AND to_date_filter)
						OR (from_date_filter IS NULL OR to_date_filter IS NULL)
					)
                ORDER BY 
                    rm.created_at DESC
                LIMIT 
                    page_size
                OFFSET 
                    (page_number - 1) * page_size;
            END;
            $$ LANGUAGE plpgsql;`
        );
    } catch (e) {
        console.log(e.message);
    }
}

module.exports = getRemindersListing;
