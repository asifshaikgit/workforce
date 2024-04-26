const getPlacementIndexInformation = async (tenantDb) => {

    try {
        await tenantDb.raw(`
            DROP FUNCTION IF EXISTS getPlacementIndexInformation(
                placement_id_filter UUID,
                date_format TEXT
            );
            CREATE OR REPLACE FUNCTION getPlacementIndexInformation(
                placement_id_filter UUID,
                date_format TEXT
            )
            RETURNS TABLE (
                data jsonb
            ) AS $$
            BEGIN
                RETURN QUERY
                WITH PayRateConfig AS (
                    SELECT
                    prc.pay_type_configuration_id,
                        jsonb_agg(DISTINCT jsonb_build_object(
                            'id', prc.id,
                            'pay_type_configuration_id', prc.pay_type_configuration_id,
                            'pay_in', prc.pay_in,
                            'from_hour', prc.from_hour,
                            'to_hour', COALESCE(prc.to_hour::TEXT, ''),
                            'rate', prc.rate
                        )) AS pay_rate_configurations
                    FROM
                        pay_rate_configuration AS prc  
                     GROUP BY
                       prc.pay_type_configuration_id
                ),
                Documents AS (
                    SELECT
                        pd.placement_id,
                        jsonb_agg(DISTINCT jsonb_build_object(
                            'name', pd.document_name,
                            'document_url', pd.document_url,
                            'id', pd.id,
                            'document_status', pd.document_status,
                            'document_type_id', docs.id,
                            'document_type_name', docs.name
                        )) AS documents
                    FROM
                        placement_documents AS pd
                    LEFT JOIN
                        document_types AS docs ON pd.document_type_id = docs.id
 
                    WHERE pd.placement_id = placement_id_filter
 
                    GROUP BY
                        pd.placement_id
                ),
                TS_Approval_user AS (
                               SELECT ts_approval_sett.id as setting_id, ts_approval_lev.level as level,
                    ts_approval_usr.deleted_at as deleted_at,
                   jsonb_build_object(
                     'id', ts_approval_usr.id,
                     'employee_id', ts_approval_usr.approver_id,
                     'full_name', e.display_name
                    ) AS ts_approval_user
                    from placements as p
                left join approval_settings as ts_approval_sett on p.timesheet_approval_id = ts_approval_sett.id
                left join approval_levels as ts_approval_lev on ts_approval_lev.approval_setting_id = ts_approval_sett.id
                left join approval_users as ts_approval_usr on ts_approval_usr.approval_level_id = ts_approval_lev.id
                left join employee as e on ts_approval_usr.approver_id = e.id
 
                WHERE p.id = placement_id_filter AND ts_approval_usr.deleted_at IS NULL AND ts_approval_lev.deleted_at IS NULL
 
                GROUP BY
                p.timesheet_approval_id, ts_approval_usr.id, e.display_name, ts_approval_lev.level,
                    ts_approval_sett.id, ts_approval_lev.id
                    ),
               
                Timesheet_approvals AS (
                               SELECT p.timesheet_approval_id,
                    jsonb_build_object(
                     'id', ts_approval_lev.id,
                    'rank', ts_approval_lev.level,
                    'approver_ids',  COALESCE((
                                SELECT jsonb_agg(ts_approval_user)
                                FROM TS_Approval_user
                        where setting_id = p.timesheet_approval_id and level = ts_approval_lev.level and
                        deleted_at is null
                           ), '[]'::jsonb)::jsonb -- Explicitly cast to jsonb
                        ) AS approvals
                   
                    from placements as p
                left join approval_settings as ts_approval_sett on p.timesheet_approval_id = ts_approval_sett.id
                left join approval_levels as ts_approval_lev on ts_approval_lev.approval_setting_id = ts_approval_sett.id
                left join approval_users as ts_approval_usr on ts_approval_usr.approval_level_id = ts_approval_lev.id
               
                WHERE p.id = placement_id_filter AND ts_approval_usr.deleted_at IS NULL AND ts_approval_lev.deleted_at IS NULL
               
                GROUP BY
                p.timesheet_approval_id,  ts_approval_lev.id, ts_approval_lev.level
                    ),
                   
                Timesheet_details AS (
                               SELECT p.timesheet_configuration_id,
                    jsonb_build_object(
                     'placement_id', p.id,
                     'timesheet_configuration_id', p.timesheet_configuration_id,
                     'timesheet_approval_id', p.timesheet_approval_id,
                     'timesheet_approval_config_type', p.timesheet_approval_config_type,
                     'timesheet_settings_config_type', p.timesheet_settings_config_type,
                     'timesheet_start_date', TO_CHAR(p.timesheet_start_date, date_format),
                     'timesheet_effictive_start_date', '',
                     'ts_mandatory', ts_config.ts_mandatory,
                     'cycle_id', ts_config.cycle_id,
                     'cycle_name', cycles.name,
                     'day_start_id', ts_config.day_start_id,
                     'day_name', days.name,
                     'default_hours', ts_config.default_hours,
                      'approvals', COALESCE((
                                SELECT jsonb_agg(approvals)
                                FROM Timesheet_approvals AS timesheet_approvals
                                WHERE timesheet_approvals.timesheet_approval_id = p.timesheet_approval_id
                             ), '[]'::jsonb)::jsonb -- Explicitly cast to jsonb
                        ) AS timesheet_details
                       
                    from
                    placements as p
                    LEFT join timesheet_configurations as ts_config on p.timesheet_configuration_id = ts_config.id
                    LEFT join cycles as cycles on ts_config.cycle_id = cycles.id
                    LEFT join days as days on ts_config.day_start_id = days.id
                    LEFT join approval_settings as ts_approval on p.timesheet_approval_id = ts_approval.id
                    LEFT join approval_levels as ts_app_lev on ts_app_lev.approval_setting_id = ts_approval.id
 
                    WHERE p.id = placement_id_filter AND ts_app_lev.deleted_at IS NULL
 
                    GROUP BY
                       p.id,ts_config.ts_mandatory, ts_config.cycle_id, cycles.name,
                    ts_config.day_start_id, days.name,ts_config.default_hours, ts_approval.id
                ),
               
                INV_Approval_user AS (
                               SELECT inv_approval_sett.id as setting_id, inv_approval_lev.level as level,
                    inv_approval_usr.deleted_at as deleted_at,
                   jsonb_build_object(
                     'id', inv_approval_usr.id,
                     'employee_id', inv_approval_usr.approver_id,
                     'full_name', e.display_name
                    ) AS approval_user
                    from placements as p
                left join approval_settings as inv_approval_sett on p.invoice_approval_id = inv_approval_sett.id
                left join approval_levels as inv_approval_lev on inv_approval_lev.approval_setting_id = inv_approval_sett.id
                left join approval_users as inv_approval_usr on inv_approval_usr.approval_level_id = inv_approval_lev.id
                left join employee as e on inv_approval_usr.approver_id = e.id
 
                WHERE p.id = placement_id_filter
 
                GROUP BY
                p.invoice_approval_id, inv_approval_usr.id, e.display_name, inv_approval_lev.level,
                    inv_approval_sett.id, inv_approval_lev.id
                    ),
               
               
                Invoice_approvals AS (
                               SELECT p.invoice_approval_id,
                    jsonb_build_object(
                     'id', inv_approval_lev.id,
                    'rank', inv_approval_lev.level,
                    'approver_ids',  COALESCE((
                                SELECT jsonb_agg(approval_user)
                                FROM INV_Approval_user
                        where setting_id = p.invoice_approval_id and level = inv_approval_lev.level and
                        deleted_at is null
                           ), '[]'::jsonb)::jsonb -- Explicitly cast to jsonb
                        ) AS approvals
                   
                    from placements as p
                left join approval_settings as inv_approval_sett on p.invoice_approval_id = inv_approval_sett.id
                left join approval_levels as inv_approval_lev on inv_approval_lev.approval_setting_id = inv_approval_sett.id
                left join approval_users as inv_approval_usr on inv_approval_usr.approval_level_id = inv_approval_lev.id
               
                WHERE p.id = placement_id_filter
               
                GROUP BY
                p.invoice_approval_id,  inv_approval_lev.id, inv_approval_lev.level
                    )
                    ,
                   
                Invoice_details AS (
                               SELECT p.invoice_configuration_id,
                    jsonb_build_object(
                     'placement_id', p.id,
                     'invoice_configuration_id', p.invoice_configuration_id,
                     'invoice_approval_id', p.invoice_approval_id,
                     'invoice_approval_config_type', p.invoice_approval_config_type,
                     'invoice_settings_config_type', p.invoice_settings_config_type,
                     'invoice_start_date', TO_CHAR(p.invoice_start_date, date_format),
                     'cycle_id', inv_config.cycle_id,
                     'cycle_name', cycles.name,
                     'day_start_id', inv_config.day_start_id,
                     'day_name', days.name,
                     'net_pay_terms_id', inv_config.net_pay_terms_id,
                     'net_pay_days', npt.days,
                      'approvals', COALESCE((
                                SELECT jsonb_agg(approvals)
                                FROM Invoice_approvals AS invoice_approvals
                                WHERE invoice_approvals.invoice_approval_id = p.invoice_approval_id
                             ), '[]'::jsonb)::jsonb -- Explicitly cast to jsonb
                        ) AS invoice_details
                       
                    from
                    placements as p
                    LEFT join invoice_configurations as inv_config on p.invoice_configuration_id = inv_config.id
                    LEFT join cycles as cycles on inv_config.cycle_id = cycles.id
                    LEFT join days as days on inv_config.day_start_id = days.id
                    LEFT join net_pay_terms as npt on inv_config.net_pay_terms_id = npt.id
                    LEFT join approval_settings as inv_approval on p.invoice_approval_id = inv_approval.id
                    LEFT join approval_levels as inv_app_lev on inv_app_lev.approval_setting_id = inv_config.id
 
                    WHERE p.id = placement_id_filter
 
                    GROUP BY
                       p.id, inv_config.cycle_id, cycles.name,inv_config.day_start_id, days.name,
                    inv_approval.id, inv_config.net_pay_terms_id, npt.days    
                ),
 
                timesheet_last_action AS (
                    SELECT MAX(t.to) AS timesheet_last_action_date
                    FROM timesheets AS t
                    WHERE t.placement_id = placement_id_filter
                )
               
                SELECT
                    jsonb_build_object(
                        'data', jsonb_agg(DISTINCT jsonb_build_object(
                            'id', p.id,
                            'placement_reference_id',p.reference_id,
                            'status',CASE
                            WHEN p.end_date IS NOT NULL THEN
                                CASE
                                    WHEN CURRENT_DATE < p.end_date - INTERVAL '1 month' THEN 'Going To End'
                                        ELSE 'Completed'
                                    END
                                ELSE 'Active'
                            END,
                            'employee_id', p.employee_id,
                            'profile_picture_url', e.profile_picture_url,
                            'employee_status', e.status,
                            'reference_id' , e.reference_id,
                            'gender' , e.gender,
                            'e_verified', e.e_verified,
                            'placed_employee_id', p.placed_employee_id,
                            'employee_name',  COALESCE(e.display_name::TEXT, ''),
                            'project_name',  COALESCE(p.project_name::TEXT, ''),
                            'current_bill_rate',  COALESCE(pbd.bill_rate::TEXT, ''),
                            'current_ot_bill_rate',  COALESCE(pbd.ot_bill_rate::TEXT, ''),
                            'placement_pay_type', CASE WHEN ptc.pay_type = 1 THEN 'Salary' WHEN ptc.pay_type = 2 THEN 'Hourly' END,
                            'timesheet_last_action_date',CASE
                            WHEN (SELECT timesheet_last_action_date FROM timesheet_last_action) IS NULL THEN ''
                            ELSE TO_CHAR((SELECT timesheet_last_action_date FROM timesheet_last_action), date_format)
                        END,
                            'client_details', jsonb_build_object(
                                'client_id', p.client_id,
                                'client_name', cl.name,
                                'end_client_id', COALESCE(ec.id::TEXT, ''),
                                'end_client_name', COALESCE(ec.name::TEXT, ''),
                                'client_reference_id', cl.reference_id,
                                'end_client_reference_id', COALESCE(ec.reference_id::TEXT, ''),
                                'job_title', COALESCE(jt.name::TEXT, ''),
                                'job_title_id', COALESCE(p.job_title_id::TEXT, ''),
                                'end_client_contact_one_id', COALESCE(pecc1.companies_contact_id::TEXT, ''),
                                'end_client_contact_two_id', COALESCE(pecc2.companies_contact_id::TEXT, ''),
                                'end_client_contact_one_name', COALESCE(ecc1.display_name::TEXT, ''),
                                'end_client_contact_two_name', COALESCE(ecc2.display_name::TEXT, ''),
                                'client_contact_one_id', COALESCE(pcc1.companies_contact_id::TEXT, ''),
                                'client_contact_two_id', COALESCE(pcc2.companies_contact_id::TEXT, ''),
                                'client_contact_one_name', COALESCE(cc1.display_name::TEXT, ''),
                                'client_contact_two_name', COALESCE(cc2.display_name::TEXT, ''),
                                'project_name', COALESCE(p.project_name::TEXT, ''),
                                'work_email_id', COALESCE(p.work_email_id::TEXT, ''),
                                'notice_period', COALESCE(p.notice_period::TEXT, ''),
                                'work_location_type',  COALESCE(p.work_location_type::TEXT, ''),
                                'work_location_address_line_one',  COALESCE(p.work_location_address_line_one::TEXT, ''),
                                'work_location_address_line_two',  COALESCE(p.work_location_address_line_two::TEXT, ''),
                                'work_location_city',  COALESCE(p.work_location_city::TEXT, ''),
                                'work_location_zipcode',  COALESCE(p.work_location_zipcode::TEXT, ''),
                                'work_location_state_id', COALESCE(p.work_location_state_id::TEXT, ''),
                                'work_location_country_id',  COALESCE(p.work_location_country_id::TEXT, ''),
                                'state_name',  COALESCE(s.name::TEXT, ''),
                                'country_name',  COALESCE(c.name::TEXT, ''),
                                'placed_employee_id', p.placed_employee_id,
                                'start_date', TO_CHAR(p.start_date, date_format),
                                'end_date', TO_CHAR(p.end_date, date_format),
                                'enable_edit', (
                                    CASE
                                        WHEN (p.timesheet_configuration_id IS NOT NULL OR p.invoice_configuration_id IS NOT NULL
                                            OR p.timesheet_approval_id IS NOT NULL OR p.invoice_approval_id IS NOT NULL) THEN false
                                        ELSE true
                                    END
                                ),
                                'payroll_configuration_type', COALESCE(p.payroll_configuration_type::TEXT, ''),
                                'pay_type_configuration_id', COALESCE(p.pay_type_configuration_id::TEXT, ''),
                                'pay_cycle', CASE pcs.payroll_cycle_id
                                WHEN 1 THEN 'Weekly'
                                WHEN 2 THEN 'Bi-Weekly'
                                WHEN 3 THEN 'Semi-Monthly'
                                WHEN 4 THEN 'Monthly'
                            END,           
                                'pay_value', COALESCE(ptc.pay_value::TEXT, ''),
                                'pay_type', COALESCE(ptc.pay_type::TEXT, ''),
                                'payroll_pay', COALESCE(ptc.payroll_pay::TEXT, ''),
                                'pay_rate_configurations', COALESCE((SELECT pay_rate_configurations
                                                                      FROM PayRateConfig
                                                                      WHERE pay_type_configuration_id = p.pay_type_configuration_id), '[]'::jsonb),
                            'documents', COALESCE((SELECT documents from Documents
                                                    WHERE placement_id = p.id), '[]'::jsonb)),
                       
                            'timesheet_details', COALESCE(
                                                (SELECT jsonb_agg(timesheet_details)
                                                 FROM Timesheet_details
                                                 WHERE timesheet_configuration_id = ts_config.id), '[]'::jsonb),
                           
                            'invoice_details', COALESCE(
                                                (SELECT jsonb_agg(invoice_details)
                                                 FROM Invoice_details
                                                 WHERE invoice_configuration_id = inv_config.id), '[]'::jsonb)
                            )))
                       
                       
                    AS result
                from placements as p
                left join employee as e on e.id = p.employee_id
                left join states as s on s.id = p.work_location_state_id
                left join countries as c on c.id = p.work_location_country_id
                left join pay_type_configuration as ptc on ptc.id = p.pay_type_configuration_id
                left join pay_rate_configuration as prc on prc.pay_type_configuration_id = ptc.id
                left join companies as cl on cl.id = p.client_id
                left join placement_companies_contacts as pcc1 on pcc1.placement_id = p.id and pcc1.priority = 1 and pcc1.referrable_type = 'client'
                left join placement_companies_contacts as pcc2 on pcc2.placement_id = p.id and pcc2.priority = 2 and pcc2.referrable_type = 'client'
                left join company_contacts as cc1 on cc1.id = pcc1.companies_contact_id and pcc1.priority = 1 and pcc1.referrable_type = 'client'
                left join company_contacts as cc2 on cc2.id = pcc2.companies_contact_id and pcc2.priority = 2 and pcc2.referrable_type = 'client'
                left join companies as ec on ec.id = p.end_client_id
                left join placement_companies_contacts as pecc1 on pecc1.placement_id = p.id and pecc1.priority = 1 and pecc1.referrable_type = 'end-client'
                left join placement_companies_contacts as pecc2 on pecc2.placement_id = p.id and pecc2.priority = 2 and pecc2.referrable_type = 'end-client'
                left join company_contacts as ecc1 on ecc1.id = pecc1.companies_contact_id and pecc1.priority = 1 and pecc1.referrable_type = 'end-client'
                left join company_contacts as ecc2 on ecc2.id = pecc2.companies_contact_id and pecc2.priority = 2 and pecc2.referrable_type = 'end-client'
                left join job_titles as jt on jt.id = p.job_title_id
                left join placement_documents as pd on pd.placement_id = p.id
                left join document_types as docs on pd.document_type_id = docs.id
                left join placement_billing_details as pbd on pbd.placement_id = p.id
                left join timesheet_configurations as ts_config on p.timesheet_configuration_id = ts_config.id
                left join approval_settings as ts_approval on p.timesheet_approval_id = ts_approval.id
                left join invoice_configurations as inv_config on p.invoice_configuration_id = inv_config.id
                left join payroll_config_settings as pcs on e.payroll_config_settings_id = pcs.id
               
                WHERE p.id = placement_id_filter
               
                group by e.e_verified, e.reference_id, p.id, e.display_name, c.name, s.name, ptc.pay_type, pbd.bill_rate, pbd.ot_bill_rate,
                cl.name, ec.id, cl.reference_id, jt.name, pecc1.companies_contact_id, pecc2.companies_contact_id,
                ecc1.display_name, ecc2.display_name,pcc1.companies_contact_id, pcc2.companies_contact_id,
                cc1.display_name, cc2.display_name, ptc.pay_value, ptc.payroll_pay, ptc.id, prc.pay_type_configuration_id;
            END;
            $$ LANGUAGE plpgsql;`
        )
    } catch (e) {
        console.log(e.message);
    }
};

module.exports = getPlacementIndexInformation;