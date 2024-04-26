
const getTimesheetsListing = async (tenantDb) => {

    try {
        await tenantDb.raw(
            `DROP FUNCTION IF EXISTS getTimesheetsListing(
                from_date_filter TIMESTAMP,
                to_date_filter TIMESTAMP,
                status_filter TEXT,
                search_filter TEXT,
                placement_id_filter UUID,
                employee_id_filter UUID,
                client_id_filter UUID,
                endClient_id_filter UUID,
                employee_name_filter TEXT,
                client_name_filter TEXT,
                endClient_name_filter TEXT,
                ts_status_filter TEXT,
                date_format TEXT,
                page_size INT,
                page_number INT
            );
            CREATE OR REPLACE FUNCTION getTimesheetsListing(
                from_date_filter TIMESTAMP,
                to_date_filter TIMESTAMP,
                status_filter TEXT,
                search_filter TEXT,
                placement_id_filter UUID,
                employee_id_filter UUID,
                client_id_filter UUID,
                endClient_id_filter UUID,
                employee_name_filter TEXT,
                client_name_filter TEXT,
                endClient_name_filter TEXT,
                ts_status_filter TEXT,
                date_format TEXT,
                page_size INT,
                page_number INT
            )
            RETURNS TABLE (
                serial_number BIGINT,
                timesheet_id UUID, 
                placement_id UUID,
                placement_reference_id VARCHAR(100),
                invoice_configuration_id INT,
                client_reference_id VARCHAR(25),
                profile_picture_url VARCHAR(255),
                client_logo VARCHAR(255),
                gender VARCHAR(255),
                employee_name VARCHAR(250),
                employee_reference_id VARCHAR(25),
                timesheet_no VARCHAR(50),
                client_name VARCHAR(100),
                end_client_name VARCHAR(100),
                status TEXT,
                billable_hours NUMERIC,
                over_time NUMERIC,
                document_url JSONB,
                from_date TEXT,
                to_date TEXT,
                total_hours NUMERIC,
                submitted_on TEXT,
                submitted_by VARCHAR(250),
                approved_on TEXT,
                drafted_on TEXT,
                count BIGINT
            ) AS $$
            BEGIN
                RETURN QUERY
                select 
                ROW_NUMBER() OVER (ORDER BY ts.created_at DESC) AS serial_number,
                ts.id timesheet_id,
	            p.id as placement_id,
                p.reference_id as placement_reference_id,
                p.invoice_configuration_id,
                c.reference_id as client_reference_id,
                emp.profile_picture_url,
                c.logo_document_url as client_logo,
                emp.gender,
                emp.display_name as employee_name,
                emp.reference_id as employee_reference_id,
                ts.reference_id as timesheet_no,
                c.name as client_name,
                ec.name as end_client_name,
                ts.status as status,
                EXTRACT(HOUR FROM ts.total_billable_hours) as billable_hours,
                EXTRACT(HOUR FROM ts.total_ot_hours) as over_time,
                jsonb_agg(
                    DISTINCT jsonb_build_object(
                        'id', td.id,
                        'timesheet_document_id', td.id,
                        'document_name', td.document_name,
                        'document_url', td.document_url,
                        'aws_s3_status', td.aws_s3_status
                    )
                ) AS documents,
                TO_CHAR(ts.from, date_format) AS from_date,
                TO_CHAR(ts.to, date_format) AS to_date,
                EXTRACT(HOUR FROM ts.total_hours),
                TO_CHAR(ts.created_at , date_format) AS submitted_on,
                submitted_emp.display_name as submitted_by,
                TO_CHAR(ts.approved_on, date_format) AS approved_on,
                TO_CHAR(ts.drafted_on, date_format) AS drafted_on,
                (
                    SELECT COUNT(*)
                    FROM timesheets as ts_count
                	left join placements as p_count on ts_count.placement_id = p_count.id
                	left join employee as emp_count on p_count.employee_id = emp_count.id
                	left join companies as c_count on p_count.client_id = c_count.id
                	left join companies as ec_count on p_count.end_client_id = ec_count.id
                    WHERE
                        (
                            search_filter IS NULL
                            OR (LOWER(emp_count.display_name)) LIKE '%' || (LOWER(search_filter)) || '%'
                            OR (LOWER(ts_count.reference_id)) LIKE '%' || (LOWER(search_filter)) || '%'
                            OR (LOWER(c_count.name)) LIKE '%' || (LOWER(search_filter)) || '%'
                        )
                        AND (
                            placement_id_filter IS NULL
                            OR p_count.id = placement_id_filter 
                        )
                        AND (
                            employee_id_filter IS NULL
                            OR emp_count.id = employee_id_filter 
                        )
                        AND (
                            client_id_filter IS NULL
                            OR c_count.id = client_id_filter 
                        )
                        AND (
                            endClient_id_filter IS NULL
                            OR ec_count.id = endClient_id_filter 
                        )
                        AND (
                            employee_name_filter IS NULL
                            OR (LOWER(emp_count.display_name)) LIKE '%' || (LOWER(employee_name_filter)) || '%'
                        )
                        AND (
                            client_name_filter IS NULL
                            OR (LOWER(c_count.name)) LIKE '%' || (LOWER(client_name_filter)) || '%'
                        )
                        AND (
                            endClient_name_filter IS NULL
                            OR (LOWER(ec_count.name)) LIKE '%' || (LOWER(endClient_name_filter)) || '%'
                        )
                        AND (
                            ts_status_filter IS NULL
                            OR ((ts_count.status = 'Submitted' OR ts_count.status = 'Approval In Progress')  AND (ts_status_filter='total_pending_approval_timesheets' OR ts_status_filter='Approval In Progress'))
                            OR (ts_count.status = 'Drafted'  AND (ts_status_filter='total_pending_timesheets' OR ts_status_filter='Drafted'))
                            OR ((ts_count.status = 'Approved' AND NOT EXISTS (
                                SELECT 1
                                FROM timesheet_hours AS tsh
                                WHERE tsh.timesheet_id = ts_count.id AND tsh.invoice_raised = true
                            ))  AND ts_status_filter='total_invoice_ready_timesheets')
                            OR (ts_count.status = 'Approved'  AND (ts_status_filter='total_approved_timesheets' OR  ts_status_filter='Approved'))
                            OR (ts_count.status = 'Rejected'  AND ts_status_filter='total_rejected_timesheets')
                        )
                        AND ts_count.deleted_at is NULL
                        AND (
                            from_date_filter IS NULL AND to_date_filter IS NULL
                            OR
                            ( ts_count.from >= from_date_filter AND ts_count.to <= to_date_filter)
                        )
                        AND tsh.deleted_at is null
                ) AS total_ts_count
                from timesheets as ts
                left join placements as p on ts.placement_id = p.id
                left join employee as emp on p.employee_id = emp.id
                left join companies as c on p.client_id = c.id
                left join companies as ec on p.end_client_id = ec.id
                left join employee as created_emp on ts.created_by = created_emp.id
                left join employee as submitted_emp on ts.submitted_by = submitted_emp.id
                left join timesheet_hours as tsh on ts.id = tsh.timesheet_id
                left join timesheet_documents as td on td.timesheet_id = ts.id
                where
                (
                    search_filter IS NULL
                    OR (LOWER(emp.display_name)) LIKE '%' || (LOWER(search_filter)) || '%'
                    OR (LOWER(ts.reference_id)) LIKE '%' || (LOWER(search_filter)) || '%'
                    OR (LOWER(c.name)) LIKE '%' || (LOWER(search_filter)) || '%'
                )
                AND (
                    placement_id_filter IS NULL
                    OR p.id = placement_id_filter 
                )
                AND (
                    employee_id_filter IS NULL
                    OR emp.id = employee_id_filter 
                )
                AND (
                    client_id_filter IS NULL
                    OR c.id = client_id_filter 
                )
                AND (
                    endClient_id_filter IS NULL
                    OR ec.id = endClient_id_filter 
                )
                AND (
                    employee_name_filter IS NULL
                    OR (LOWER(emp.display_name)) LIKE '%' || (LOWER(employee_name_filter)) || '%'
                )
                AND (
                    client_name_filter IS NULL
                    OR (LOWER(c.name)) LIKE '%' || (LOWER(client_name_filter)) || '%'
                )
                AND (
                    endClient_name_filter IS NULL
                    OR (LOWER(ec.name)) LIKE '%' || (LOWER(endClient_name_filter)) || '%'
                )
                AND
                (ts_status_filter IS NULL
                    OR ((ts.status = 'Submitted' OR ts.status = 'Approval In Progress')  AND (ts_status_filter='total_pending_approval_timesheets' OR ts_status_filter='Approval In Progress'))
                    OR (ts.status = 'Drafted'  AND (ts_status_filter='total_pending_timesheets' OR ts_status_filter='Drafted'))
                    OR ((ts.status = 'Approved' AND NOT EXISTS (
                            SELECT 1
                            FROM timesheet_hours AS tsh
                            WHERE tsh.timesheet_id = ts.id AND tsh.invoice_raised = true
                        ))  AND ts_status_filter='total_invoice_ready_timesheets')
                    OR (ts.status = 'Approved'  AND (ts_status_filter='total_approved_timesheets' OR ts_status_filter='Approved'))
                    OR (ts.status = 'Rejected'  AND ts_status_filter='total_rejected_timesheets') 
                )
                AND ts.deleted_at is NULL
                AND (
                    from_date_filter IS NULL AND to_date_filter IS NULL
                    OR
                    ( ts.from >= from_date_filter AND ts.to <= to_date_filter)
                )
                GROUP BY tsh.deleted_at,  emp.id, ts.id, p.id, created_emp.display_name, emp.display_name, emp.reference_id, c.name, emp.profile_picture_url, c.logo_document_url, ec.name , c.reference_id, submitted_emp.display_name
                order by ts.created_at desc
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

module.exports = getTimesheetsListing;