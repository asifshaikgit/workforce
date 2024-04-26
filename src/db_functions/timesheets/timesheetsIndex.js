
const getTimesheetsIndex = async (tenantDb) => {

    try {
        await tenantDb.raw(
            `DROP FUNCTION IF EXISTS getTimesheetsIndex(
                timesheet_id_filter UUID,
                date_format TEXT
            );
            CREATE OR REPLACE FUNCTION getTimesheetsIndex(
                timesheet_id_filter UUID,
                date_format TEXT
            )
            RETURNS TABLE (
                id UUID,
                placement_id UUID,
                timesheet_reference_id VARCHAR(50),
                employee_id UUID,
                emp_reference_id VARCHAR(255),
                e_verified SMALLINT,
                employee_name VARCHAR(250),
                profile_picture_url VARCHAR(255),
                client_id UUID,
                client_name VARCHAR(100),
                end_client_id UUID,
                end_client_name VARCHAR(100),
                start_date TEXT,
                end_date TEXT,
                comments VARCHAR(255),
                total_ot_hours TEXT,
                total_billable_hours TEXT,
                total_hours TEXT,
                status TEXT,
                approval_level INTEGER,
                ts_mandatory BOOLEAN,
                cycle_id INTEGER,
                day_start_id INTEGER,
                submitted_on TEXT,
                approved_on TEXT,
                drafted_on TEXT,
                timesheet_approval_id INTEGER,
                timesheet JSONB,
                documents JSONB
            ) AS $$
            BEGIN
                RETURN QUERY
                select 
                ts.id,
                p.id as placement_id,
                ts.reference_id as timesheet_reference_id,
                emp.id as employee_id,
                emp.reference_id as emp_reference_id,
                emp.e_verified,
                emp.display_name as employee_name,
                emp.profile_picture_url ,
                c.id as client_id,
                c.name as client_name,
                ec.id as end_client_id,
                ec.name as end_client_name,
                TO_CHAR(ts.from, date_format) AS start_date,
                TO_CHAR(ts.to, date_format) AS end_date,
                COALESCE(ts.comments, '') AS comments,
                CASE
                WHEN EXTRACT(HOUR FROM ts.total_ot_hours) < 100 THEN
                    LPAD(EXTRACT(HOUR FROM ts.total_ot_hours)::TEXT, 2, '0')
                ELSE
                    LPAD(EXTRACT(HOUR FROM ts.total_ot_hours)::TEXT, 3, '0')
            END || ':' || LPAD(EXTRACT(MINUTE FROM ts.total_ot_hours)::TEXT, 2, '0') as total_ot_hours,
            CASE
                WHEN EXTRACT(HOUR FROM ts.total_billable_hours) < 100 THEN
                    LPAD(EXTRACT(HOUR FROM ts.total_billable_hours)::TEXT, 2, '0')
                ELSE
                    LPAD(EXTRACT(HOUR FROM ts.total_billable_hours)::TEXT, 3, '0')
            END || ':' || LPAD(EXTRACT(MINUTE FROM ts.total_billable_hours)::TEXT, 2, '0') as total_billable_hours,
            CASE
                WHEN EXTRACT(HOUR FROM ts.total_hours) < 100 THEN
                    LPAD(EXTRACT(HOUR FROM ts.total_hours)::TEXT, 2, '0')
                ELSE
                    LPAD(EXTRACT(HOUR FROM ts.total_hours)::TEXT, 3, '0')
            END || ':' || LPAD(EXTRACT(MINUTE FROM ts.total_hours)::TEXT, 2, '0') as total_hours,
                           
                ts.status,
                ts.approval_level,
                ts_config.ts_mandatory,
		        ts_config.cycle_id,
                ts_config.day_start_id as day_start_id,
                TO_CHAR(ts.submitted_on, date_format) AS submitted_on,
                TO_CHAR(ts.approved_on, date_format) AS approved_on,
                TO_CHAR(ts.drafted_on, date_format) AS drafted_on,
                p.timesheet_approval_id as timesheet_approval_id,
                jsonb_agg(
                    DISTINCT jsonb_build_object(
                        'id', tsh.id,
                        'timesheet_id', tsh.timesheet_id,
                        'date', tsh.date,
                        'ot_hours',  LPAD(EXTRACT(HOUR FROM tsh.ot_hours)::TEXT, 2, '0') || ':' || LPAD(EXTRACT(MINUTE FROM tsh.ot_hours)::TEXT, 2, '0'),
                        'billable_hours', LPAD(EXTRACT(HOUR FROM tsh.billable_hours)::TEXT, 2, '0') || ':' || LPAD(EXTRACT(MINUTE FROM tsh.billable_hours)::TEXT, 2, '0'),
                        'total_hours', LPAD(EXTRACT(HOUR FROM tsh.total_hours)::TEXT, 2, '0') || ':' || LPAD(EXTRACT(MINUTE FROM tsh.total_hours)::TEXT, 2, '0'),
                        'payroll_raised', tsh.payroll_raised,
                        'invoice_raised', tsh.invoice_raised,
                        'comments', 
                            CASE 
                                WHEN tsh.comments IS NULL THEN ''
                                ELSE tsh.comments 
                            END
                    )
                ) AS timesheet,
                CASE
                    WHEN COUNT(td.id) > 0 THEN
                            jsonb_agg(
                                DISTINCT jsonb_build_object(
                                    'id', td.id,
                                    'timesheet_document_id', td.id,
                                    'document_name', td.document_name,
                                    'document_url', td.document_url,
                                    'aws_s3_status', td.aws_s3_status
                                )
                            )
                        ELSE
                            '[]'::jsonb
                END AS documents
                from "timesheets" as "ts" 
                left join timesheet_documents as td on td.timesheet_id = ts.id
                inner join "timesheet_hours" as "tsh" on "tsh"."timesheet_id" = "ts"."id" 
                inner join "placements" as "p" on "p"."id" = "ts"."placement_id" 
                inner join "timesheet_configurations" as "ts_config" 
                on "p"."timesheet_configuration_id" = "ts_config"."id" 
                inner join "employee" as "emp" on "emp"."id" = "p"."employee_id" 
                inner join "companies" as "c" on "c"."id" = "p"."client_id" 
                left join "invoice_configurations" as "inc_c" on "inc_c"."id" = "p"."invoice_configuration_id" 
                left join "net_pay_terms" as "net_terms" on "net_terms"."id" = "inc_c"."net_pay_terms_id" 
                left join "companies" as "ec" on "ec"."id" = "p"."end_client_id" 
                left join "employee" as "create" on "ts"."created_by" = "create"."id" 
                left join "employee" as "update" on "ts"."updated_by" = "update"."id" 
                where
                ( 
                    ts.id = timesheet_id_filter 
                )
                AND ts.deleted_at is NULL
                
                GROUP BY emp.reference_id, ts.id, emp.id, c.id, ec.id, "create".id, update.id, p.id, ts_config.id, net_terms.id                
                order by ts.created_at desc;
            END;
            $$ LANGUAGE plpgsql;`
        )
    } catch (e) {
        console.log(e.message);
    }
};

module.exports = getTimesheetsIndex;