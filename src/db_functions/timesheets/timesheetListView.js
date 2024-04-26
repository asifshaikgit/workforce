
const getTimesheetsListView = async (tenantDb) => {

    try {
        await tenantDb.raw(`
        DROP FUNCTION IF EXISTS getTimesheetsListView(
            from_date_filter TIMESTAMP,
            to_date_filter TIMESTAMP,
            employee_id_filter TEXT,
            search_filter TEXT,
            date_format TEXT,
            page_size INT,
            page_number INT
        );
        CREATE OR REPLACE FUNCTION getTimesheetsListView(
                from_date_filter TIMESTAMP,
                to_date_filter TIMESTAMP,
                employee_id_filter TEXT,
                search_filter TEXT,
                date_format TEXT,
                page_size INT,
                page_number INT
            )
            RETURNS TABLE (
                timesheet_id UUID,
                employee_name VARCHAR(250),
                profile_picture_url VARCHAR(255),
                employee_id UUID,
                employee_reference_id VARCHAR(25),
                company_name VARCHAR(100),
                client_reference_id VARCHAR(25),
                placement_id UUID,
                timesheet_reference_id VARCHAR(50),
                timesheet_status TEXT,
                documents JSONB,
                submitted_on TEXT,
                submitted_by VARCHAR(250),
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
                ts.id as timesheet_id,
                emp.display_name as employee_name,
                emp.profile_picture_url,
                emp.id as employee_id ,
                emp.reference_id as employee_reference_id,
                c.name as company_name,
                c.reference_id as client_reference_id,
                p.id as placement_id,
                ts.reference_id as timesheet_reference_id,
                ts.status as timesheet_status,
                jsonb_agg(
                        DISTINCT jsonb_build_object(
                            'id', td.id,
                            'timesheet_document_id', td.id,
                            'document_name', td.document_name,
                            'document_url', td.document_url,
                            'aws_s3_status', td.aws_s3_status
                        )
                ) AS documents,
                TO_CHAR(ts.submitted_on, date_format) AS submitted_on, 
                created.display_name as submitted_by,
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
                                emp.display_name as employee_name,
                                emp.profile_picture_url,
                                emp.id as employee_id,
                                emp.reference_id as employee_reference_id,
                                c.name as company_name,
                                c.reference_id as client_reference_id,
                                p.id as placement_id,
                                ts.reference_id as timesheet_reference_id,
                               ts.status as timesheet_status,
                                jsonb_agg(
                                    DISTINCT jsonb_build_object(
                                        'id', td.id,
                                        'timesheet_document_id', td.id,
                                        'document_name', td.document_name,
                                        'document_url', td.document_url,
                                        'aws_s3_status', td.aws_s3_status
                                    )
                                ) AS documents,
                                TO_CHAR(ts.submitted_on, date_format) AS submitted_on, 
                                created.display_name as submitted_by,
                                SUM(tsh.billable_hours) as total_billable_hours ,
                                SUM(tsh.ot_hours) as total_ot_hours, 
                                SUM(tsh.total_hours) as total_hours
                            FROM placements as p 
                            LEFT JOIN employee as emp ON p.employee_id = emp.id
                            LEFT JOIN timesheets as ts ON p.id = ts.placement_id
                            left join timesheet_documents as td on td.timesheet_id = ts.id
                            LEFT JOIN employee as created ON created.id = ts.created_by
                            LEFT JOIN companies as c ON c.id = p.client_id
                            LEFT JOIN timesheet_hours as tsh ON ts.id = tsh.timesheet_id
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
                                OR (LOWER(c.name)) LIKE '%' || (LOWER(search_filter)) || '%'
                                OR (LOWER(ts.reference_id)) LIKE '%' || (LOWER(search_filter)) || '%'
                            )
                            GROUP BY emp.profile_picture_url, ts.id, created.display_name,  ts.submitted_on,  emp.reference_id , ts.status, ts.reference_id , emp.id, c.name, c.reference_id, p.id, p.created_at
                    ) AS subquery_alias

                ) AS total_ts_count
                from placements as p  
                LEFT JOIN employee as emp ON p.employee_id = emp.id
                LEFT JOIN timesheets as ts ON p.id = ts.placement_id
                left join timesheet_documents as td on td.timesheet_id = ts.id
                LEFT JOIN employee as created ON created.id = ts.created_by
                LEFT JOIN companies as c ON c.id = p.client_id
                LEFT JOIN timesheet_hours as tsh ON ts.id = tsh.timesheet_id
                where ( tsh.date between from_date_filter AND to_date_filter )
                AND (
                    employee_id_filter IS NULL OR emp.id = ANY(employee_id_filter_array::uuid[])
                )
                AND  (
                    search_filter IS NULL
                    OR (LOWER(emp.display_name)) LIKE '%' || (LOWER(search_filter)) || '%'
                    OR (LOWER(emp.reference_id)) LIKE '%' || (LOWER(search_filter)) || '%'
                    OR (LOWER(c.name)) LIKE '%' || (LOWER(search_filter)) || '%'
                    OR (LOWER(ts.reference_id)) LIKE '%' || (LOWER(search_filter)) || '%'
                )
                AND p.id IS NOT NULL
                AND ts.id IS NOT NULL
                AND p.deleted_at is null
                AND ts.deleted_at is null
                GROUP BY emp.profile_picture_url , ts.id , ts.submitted_on , created.display_name , emp.reference_id , ts.status , ts.reference_id , emp.id, c.name, c.reference_id, p.id, p.created_at
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

module.exports = getTimesheetsListView;