const invoiceReadyTimeSheet = async (tenantDb) => {
    try {
        await tenantDb.raw(`
        DROP FUNCTION IF EXISTS getInvoiceReadyTimesheetData(
            timesheet_id_filter UUID
        );
        CREATE OR REPLACE FUNCTION getInvoiceReadyTimesheetData(
                timesheet_id_filter UUID
            )
            RETURNS TABLE (
                company_id UUID,
                company_name VARCHAR(100),
                placement_id UUID,
                placement_reference_id VARCHAR(50),
                current_bill_rate DOUBLE PRECISION,
                employee_name VARCHAR(250),
                placed_employee_name VARCHAR(250),
                employee_reference_id VARCHAR(50),
                profile_picture_url VARCHAR(255), 
                gender VARCHAR(255),
                employee_id UUID,
                net_pay_term_id INTEGER,
                timesheet_id UUID,
                net_pay_terms_name INTEGER,
                timesheet_hours JSONB
            ) AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    cmpny.id AS company_id, 
                    cmpny.name AS company_name, 
                    ts.placement_id AS placement_id,
                    plcmnt.reference_id AS placement_reference_id, 
                    pbd.bill_rate AS current_bill_rate,
                    emp.display_name AS employee_name,
                    emp.display_name AS placed_employee_name,
                    emp.reference_id AS employee_reference_id,
                    emp.profile_picture_url, 
                    emp.gender,
                    emp.id AS employee_id,
                    npt.id AS net_pay_terms_id, 
                    ts.id AS timesheet_id, 
                    npt.days AS net_pay_terms_name,
                    jsonb_agg(jsonb_build_object(
                        'timesheet_hours_id', tmhrs.id,
                        'date', tmhrs.date,
                        'total_hours', 
                        to_char(floor(EXTRACT(EPOCH FROM tmhrs.total_hours) / 3600)::int, 'FM09') || '.' || 
                        to_char((floor(EXTRACT(EPOCH FROM tmhrs.total_hours) / 60) % 60)::int, 'FM09'),
                        'ot_hours', 
                        to_char(floor(EXTRACT(EPOCH FROM tmhrs.ot_hours) / 3600)::int, 'FM09') || '.' || 
                        to_char((floor(EXTRACT(EPOCH FROM tmhrs.ot_hours) / 60) % 60)::int, 'FM09'),
                        'billable_hours', 
                        to_char(floor(EXTRACT(EPOCH FROM tmhrs.billable_hours) / 3600)::int, 'FM09') || '.' || 
                        to_char((floor(EXTRACT(EPOCH FROM tmhrs.billable_hours) / 60) % 60)::int, 'FM09'),
                        'non_billable_hours', 
                        to_char(floor(EXTRACT(EPOCH FROM tmhrs.non_billable_hours) / 3600)::int, 'FM09') || '.' || 
                        to_char((floor(EXTRACT(EPOCH FROM tmhrs.non_billable_hours) / 60) % 60)::int, 'FM09')
                    )) AS timesheet_hours 
                FROM 
                    timesheets AS ts 
                    LEFT JOIN placements AS plcmnt ON ts.placement_id = plcmnt.id 
                    LEFT JOIN companies AS cmpny ON plcmnt.client_id = cmpny.id 
                    LEFT JOIN timesheet_hours AS tmhrs ON ts.id = tmhrs.timesheet_id AND invoice_raised = false 
                    LEFT JOIN placement_billing_details AS pbd ON pbd.placement_id = plcmnt.id 
                    LEFT JOIN employee AS emp ON plcmnt.employee_id = emp.id 
                    LEFT JOIN net_pay_terms AS npt ON cmpny.net_pay_terms_id = npt.id 
                WHERE 
                    ts.id = timesheet_id_filter 
                GROUP BY 
                    cmpny.id, 
                    ts.placement_id, 
                    plcmnt.reference_id, 
                    pbd.bill_rate, 
                    emp.display_name,
                    emp.reference_id, 
                    npt.id, 
                    ts.id,
                    emp.id,
                    emp.profile_picture_url, 
                    emp.gender;
            END;
            $$ LANGUAGE plpgsql;
            `
        )
    } catch (e) {
        console.log(e.message);
    }
}

module.exports = invoiceReadyTimeSheet