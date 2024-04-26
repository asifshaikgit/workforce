
const getPayrollPaymentInfo = async (tenantDb) => {

    try {
        await tenantDb.raw(`
        DROP FUNCTION IF EXISTS  getPayrollPaymentInfo(
            from_date_filter TIMESTAMP,
            to_date_filter TIMESTAMP,
            status_filter SMALLINT,
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
    CREATE OR REPLACE FUNCTION getPayrollPaymentInfo(
                from_date_filter TIMESTAMP,
                to_date_filter TIMESTAMP,
                status_filter SMALLINT,
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
                id UUID, 
                payroll_configuration_id UUID,
                employee_name VARCHAR(255),
                employee_id VARCHAR(250),
                total_amount VARCHAR(25),
                worked_hours VARCHAR(50),
                visa_type_name VARCHAR(100),
                credited_expense VARCHAR(100),
                debited_expense SMALLINT,
                amount_paid NUMERIC,
                balance_amount NUMERIC,
                comments JSONB,
                available_balance TEXT,
                net_amount TEXT,
                employee_categorie_name NUMERIC,
                placement_information TEXT,
                count BIGINT
            ) AS $$
            BEGIN
                RETURN QUERY
                select 
                ROW_NUMBER() OVER (ORDER BY ts.created_at DESC) AS serial_number,
                ppd.id,
                ppd.payroll_configuration_id,
                emp.display_name as employee_name,
                emp.id as employee_id,
                ppd.total_amount,
                ppd.worked_hours,
                visa_types.name as visa_type_name,
                ppd.credited_expense,
                ppd.debited_expense,
                ppd.amount_paid,
                ppd.balance_amount,
                ppd.comments,
                emp.balance_amount as available_balance, 
                (ppd.amount_paid + ppd.credited_expense) - (ppd.debited_expense) AS net_amount,
                employee_categories.name as employee_categorie_name,
                jsonb_agg(
                    DISTINCT jsonb_build_object(
                        'id', pr.id,
                        'payroll_configuration_id', ppd.payroll_configuration_id,
                        'employee_name', emp.display_name,
                        'client_name', companies.name,
        -- 				'placement_label', td.aws_s3_status,
        -- 				'placement_status' ,
                        'placement_end_date' , p.end_date,
                        'placement_information', pr.hours_rate_information
                    )
                ) AS placement_information,
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
                            OR (LOWER(emp_count.display_name)) ILIKE '%' || (LOWER(search_filter)) || '%'
                            OR (LOWER(ts_count.reference_id)) ILIKE '%' || (LOWER(search_filter)) || '%'
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
                            OR (LOWER(emp_count.display_name)) ILIKE '%' || (LOWER(employee_name_filter)) || '%'
                        )
                        AND (
                            client_name_filter IS NULL
                            OR (LOWER(c_count.name)) ILIKE '%' || (LOWER(client_name_filter)) || '%'
                        )
                        AND (
                            endClient_name_filter IS NULL
                            OR (LOWER(ec_count.name)) ILIKE '%' || (LOWER(endClient_name_filter)) || '%'
                        )
                        AND (
                            ts_status_filter IS NULL
                            OR ((ts_count.status = 'Submitted' OR ts_count.status = 'Approval In Progress')  AND ts_status_filter='total_pending_approval_timesheets')
                            OR (ts_count.status = 'Drafted'  AND ts_status_filter='total_pending_timesheets')
                            OR ((ts_count.status = 'Approved' AND NOT EXISTS (
            SELECT 1
            FROM timesheet_hours AS tsh
            WHERE tsh.timesheet_id = ts_count.id AND tsh.invoice_raised = true
        ))  AND ts_status_filter='total_invoice_ready_timesheets')
                        )
                        AND ts_count.deleted_at is NULL
                        AND (
                            from_date_filter IS NULL AND to_date_filter IS NULL
                            OR
                            ( ts_count.from >= from_date_filter AND ts_count.to <= to_date_filter)
                        )
                        AND tsh.deleted_at is null
                ) AS total_ts_count
                FROM "payroll_payment_details" as ppd
                INNER JOIN "employee" as "emp" 
                on "emp"."id" = "ppd"."employee_id" 
                LEFT JOIN "visa_types" on "emp"."visa_type_id" = "visa_types"."id" 
                INNER JOIN "employee_categories" 
                on "emp"."employee_category_id" = "employee_categories"."id" 
                INNER JOIN "payroll_configuration" as "pc" on "pc"."id" = "ppd"."payroll_configuration_id"
                LEFT JOIN "payroll" as "pr" on "pr"."employee_id" = "ppd"."employee_id" AND "pr"."payroll_configuration_id" = "ppd"."payroll_configuration_id" 
                and "pr"."payroll_configuration_id" = "ppd"."payroll_configuration_id" 
                LEFT JOIN "placements" as "p" on "p"."id" = "pr"."placement_id" 
                LEFT JOIN companies on companies.id = p.client_id
                where
                (
                    search_filter IS NULL
                    OR (LOWER(emp.display_name)) ILIKE '%' || (LOWER(search_filter)) || '%'
                    OR (LOWER(ts.reference_id)) ILIKE '%' || (LOWER(search_filter)) || '%'
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
                    OR (LOWER(emp.display_name)) ILIKE '%' || (LOWER(employee_name_filter)) || '%'
                )
                AND (
                    client_name_filter IS NULL
                    OR (LOWER(c.name)) ILIKE '%' || (LOWER(client_name_filter)) || '%'
                )
                AND (
                    endClient_name_filter IS NULL
                    OR (LOWER(ec.name)) ILIKE '%' || (LOWER(endClient_name_filter)) || '%'
                )
                AND
                (ts_status_filter IS NULL
                    OR ((ts.status = 'Submitted' OR ts.status = 'Approval In Progress')  AND ts_status_filter='total_pending_approval_timesheets')
                    OR (ts.status = 'Drafted'  AND ts_status_filter='total_pending_timesheets')
                    OR ((ts.status = 'Approved' AND NOT EXISTS (
            SELECT 1
            FROM timesheet_hours AS tsh
            WHERE tsh.timesheet_id = ts.id AND tsh.invoice_raised = true
        ))  AND ts_status_filter='total_invoice_ready_timesheets')
                )
                AND ts.deleted_at is NULL
                AND (
                    from_date_filter IS NULL AND to_date_filter IS NULL
                    OR
                    ( ts.from >= from_date_filter AND ts.to <= to_date_filter)
                )
                GROUP BY tsh.deleted_at,  emp.id, ts.id, p.id, created_emp.display_name, emp.display_name, emp.reference_id, c.name, emp.profile_picture_url, ec.name
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

module.exports = getPayrollPaymentInfo;