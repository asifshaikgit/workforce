
const getTimesheetsWeekView = async (tenantDb) => {

    try {
        await tenantDb.raw(`
        DROP FUNCTION IF EXISTS getTimesheetsWeekView(
            from_date_filter TIMESTAMP,
            to_date_filter TIMESTAMP,
            employee_id_filter TEXT,
            search_filter TEXT,
            date_format TEXT,
            page_size INT,
            page_number INT
        );
        CREATE OR REPLACE FUNCTION getTimesheetsWeekView(
                from_date_filter TIMESTAMP,
                to_date_filter TIMESTAMP,
                employee_id_filter TEXT,
                search_filter TEXT,
                date_format TEXT,
                page_size INT,
                page_number INT
            )
            RETURNS TABLE (
                serial_number BIGINT,
                timesheet_id UUID,
                timesheet_reference_id VARCHAR(50),
                employee_id UUID,
                profile_picture_url VARCHAR(255),
                employee_reference_id VARCHAR(25),
                employee_name VARCHAR(250),
                visa_type_id TEXT,
                visa_type_name VARCHAR(100),
                placement_id UUID,
                client_name VARCHAR(100),
                client_reference_id VARCHAR(25),
                inv_cycle_name VARCHAR(30),
                total_billable_hours TEXT,
                total_ot_hours TEXT,
                total_hours TEXT,
                ts_count BIGINT
            ) AS $$
            DECLARE
                employee_id_filter_array TEXT[];
            BEGIN
                employee_id_filter_array := string_to_array(employee_id_filter, ',')::TEXT[];
                RETURN QUERY
                select 
                ROW_NUMBER() OVER (ORDER BY p.created_at DESC) AS serial_number,
                ts.id as timesheet_id,
                ts.reference_id as timesheet_reference_id,
                emp.id as employee_id,
                emp.profile_picture_url,
                emp.reference_id as employee_reference_id,
                emp.display_name as employee_name,
                COALESCE(CAST(emp.visa_type_id AS TEXT), '') AS visa_type_id,
                COALESCE(vt.name, '') AS visa_type_name,
                p.id as placement_id,
                c.name as client_name,
                c.reference_id as client_reference_id,
                cycles.name as inv_cycle_name,
                CASE 
                    WHEN EXTRACT(HOUR FROM SUM(tsh.billable_hours)) >= 100 THEN 
                        EXTRACT(HOUR FROM SUM(tsh.billable_hours)) || ':' || LPAD(EXTRACT(MINUTE FROM SUM(tsh.billable_hours))::TEXT, 2, '0')
                    ELSE 
                        LPAD(EXTRACT(HOUR FROM SUM(tsh.billable_hours))::TEXT, 2, '0') || ':' || LPAD(EXTRACT(MINUTE FROM SUM(tsh.billable_hours))::TEXT, 2, '0')
                END as total_billable_hours,
                
                CASE 
                    WHEN EXTRACT(HOUR FROM SUM(tsh.ot_hours)) >= 100 THEN 
                        EXTRACT(HOUR FROM SUM(tsh.ot_hours)) || ':' || LPAD(EXTRACT(MINUTE FROM SUM(tsh.ot_hours))::TEXT, 2, '0')
                    ELSE 
                        LPAD(EXTRACT(HOUR FROM SUM(tsh.ot_hours))::TEXT, 2, '0') || ':' || LPAD(EXTRACT(MINUTE FROM SUM(tsh.ot_hours))::TEXT, 2, '0')
                END as total_ot_hours,
                
                CASE 
                    WHEN EXTRACT(HOUR FROM SUM(tsh.total_hours)) >= 100 THEN 
                        EXTRACT(HOUR FROM SUM(tsh.total_hours)) || ':' || LPAD(EXTRACT(MINUTE FROM SUM(tsh.total_hours))::TEXT, 2, '0')
                    ELSE 
                        LPAD(EXTRACT(HOUR FROM SUM(tsh.total_hours))::TEXT, 2, '0') || ':' || LPAD(EXTRACT(MINUTE FROM SUM(tsh.total_hours))::TEXT, 2, '0')
                END as total_hours,
                (
                    SELECT COUNT(*) as record_count
                        FROM (
                            SELECT
                                ts.id as timesheet_id,
                                ts.reference_id as timesheet_reference_id,
                                emp.id as employee_id,
                                emp.profile_picture_url,
                                emp.reference_id as employee_reference_id,
                                emp.display_name,
                                emp.visa_type_id,
                                vt.name as visa_type_name,
                                p.id as placement_id,
                                c.name as client_name,
                                c.reference_id as client_reference_id,
                                cycles.name as inv_cycle_name,
                                SUM(tsh.billable_hours) as total_billable_hours ,
                                SUM(tsh.ot_hours) as total_ot_hours, 
                                SUM(tsh.total_hours) as total_hours
                            FROM placements as p 
                                inner join "employee" as emp  on "emp"."id" = "p"."employee_id" 
                                left join "companies" as "c" on "c"."id" = "p"."client_id" 
                                left join "invoice_configurations" as "inv_config" 
                                on "inv_config"."id" = "p"."invoice_configuration_id" 
                                left join "cycles" as "cycles" on "inv_config"."cycle_id" = "cycles"."id" 
                                inner join "timesheets" as "ts" on "p"."id" = "ts"."placement_id" 
                                inner join "timesheet_hours" as "tsh" on "ts"."id" = "tsh"."timesheet_id" 
                                left join "visa_types" as "vt" on "vt"."id" = "emp"."visa_type_id" 
                                WHERE p.id IS NOT NULL
                                AND ts.id IS NOT NULL
                                AND p.deleted_at is null
                                AND ts.deleted_at is null
                                AND tsh.date BETWEEN from_date_filter AND to_date_filter
                                AND (
                                    employee_id_filter IS NULL OR emp.id = ANY(employee_id_filter_array::uuid[])
                                )
                                AND  (
                                    search_filter IS NULL
                                    OR (LOWER(emp.display_name)) LIKE '%' || (LOWER(search_filter)) || '%'
                                    OR (LOWER(emp.reference_id)) LIKE '%' || (LOWER(search_filter)) || '%'
                                    OR (LOWER(ts.reference_id)) LIKE '%' || (LOWER(search_filter)) || '%'
                                    OR (LOWER(c.name)) LIKE '%' || (LOWER(search_filter)) || '%'
                                )
                                GROUP BY  emp.profile_picture_url, ts.id, ts.reference_id, emp.reference_id , emp.id, vt.name, cycles.name, p.id, c.name, c.reference_id
                        ) AS subquery_alias

                ) AS total_ts_count
                from "placements" as "p"
                inner join "employee" as emp  on "emp"."id" = "p"."employee_id" 
                left join "companies" as "c" on "c"."id" = "p"."client_id" 
                left join "invoice_configurations" as "inv_config" 
                on "inv_config"."id" = "p"."invoice_configuration_id" 
                left join "cycles" as "cycles" on "inv_config"."cycle_id" = "cycles"."id" 
                inner join "timesheets" as "ts" on "p"."id" = "ts"."placement_id" 
                inner join "timesheet_hours" as "tsh" on "ts"."id" = "tsh"."timesheet_id" 
                left join "visa_types" as "vt" on "vt"."id" = "emp"."visa_type_id" 
                where ( tsh.date between from_date_filter AND to_date_filter )
                AND (
                    employee_id_filter IS NULL OR emp.id = ANY(employee_id_filter_array::uuid[])
                )
                AND  (
                    search_filter IS NULL
                    OR (LOWER(emp.display_name)) LIKE '%' || (LOWER(search_filter)) || '%'
                    OR (LOWER(emp.reference_id)) LIKE '%' || (LOWER(search_filter)) || '%'
                    OR (LOWER(ts.reference_id)) LIKE '%' || (LOWER(search_filter)) || '%'
                    OR (LOWER(c.name)) LIKE '%' || (LOWER(search_filter)) || '%'
                )
                and "p"."deleted_at" is null 
                and "c"."deleted_at" is null 
                and "ts"."deleted_at" is null
                and tsh.deleted_at is null
                GROUP BY emp.profile_picture_url, ts.id, ts.reference_id, emp.reference_id , emp.id, vt.name, cycles.name, p.id, c.name, c.reference_id
                ORDER BY emp.display_name ASC
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

module.exports = getTimesheetsWeekView;