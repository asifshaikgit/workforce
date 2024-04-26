const getEmployeeDetails = async (tenantDb) => {
    try {
        await tenantDb.raw(`
            DROP FUNCTION IF EXISTS getEmployeeDetails(
                employee_id_filter UUID,
                date_format TEXT
            );
            CREATE OR REPLACE FUNCTION getEmployeeDetails(
                employee_id_filter UUID,
                date_format TEXT
            )
            RETURNS TABLE (
                id UUID,
                status TEXT,
                profile_picture_url VARCHAR(255),
                gender VARCHAR(255),
                last_working_day TEXT,
                profile_progress NUMERIC,
                e_verified SMALLINT,
                project_status TEXT,
                label_name TEXT,
                basic_details JSON,
                contact_details JSON,
                emergency_contacts JSONB,
                current_address JSON,
                employment_details JSON,
                is_pay_configuration_set BOOLEAN,
                confirm_rehire BOOLEAN,
                enable_payroll BOOLEAN,
                complete_profile TEXT,
                documents_pending BOOLEAN,
                bank_pending BOOLEAN,
                skills_pending BOOLEAN
            ) AS $$
            BEGIN
                RETURN QUERY
                SELECT
                    emp.id,
                    emp.status,
                    emp.profile_picture_url,
                    emp.gender,
                    TO_CHAR(emp.last_working_day, date_format),
                    CASE
                        WHEN emp.employment_type_id = 1
                        THEN 100 
                        WHEN (emp.is_us_citizen = 0 OR emp.is_us_citizen IS NULL) 
                        THEN 
                            ROUND(
                                (
                                    (
                                        CASE WHEN (emp.contact_number IS NOT NULL AND emp.email_id IS NOT NULL) THEN 5 ELSE 0 END +
                                        CASE WHEN EXISTS (SELECT 1 FROM employee_education_details WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                        CASE WHEN EXISTS (SELECT 1 FROM employee_passport_details WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                        CASE WHEN EXISTS (SELECT 1 FROM employee_i94_details WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                        CASE WHEN EXISTS (SELECT 1 FROM employee_visa_details WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                        CASE WHEN EXISTS (SELECT 1 FROM employee_personal_documents WHERE employee_id = emp.id AND document_type_id = 4 AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                        CASE WHEN EXISTS (SELECT 1 FROM employee_personal_documents WHERE employee_id = emp.id AND document_type_id IN (1,3) AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                        CASE WHEN EXISTS (SELECT 1 FROM employee_personal_documents WHERE employee_id = emp.id AND document_type_id = 2 AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                        CASE WHEN EXISTS (SELECT 1 FROM employee_bank_account_details WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                        CASE WHEN EXISTS (SELECT 1 FROM employee_skill_details WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN 1 ELSE 0 END 
                                    ) / 14.0
                                ) * 100, 2)
                        WHEN emp.is_us_citizen = 1 
                        THEN 
                            ROUND(
                                (
                                    (
                                        CASE WHEN (emp.contact_number IS NOT NULL AND emp.email_id IS NOT NULL) THEN 5 ELSE 0 END +
                                        CASE WHEN EXISTS (SELECT 1 FROM employee_education_details WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                        CASE WHEN EXISTS (SELECT 1 FROM employee_personal_documents WHERE employee_id = emp.id AND document_type_id = 4 AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                        CASE WHEN EXISTS (SELECT 1 FROM employee_bank_account_details WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                        CASE WHEN EXISTS (SELECT 1 FROM employee_skill_details WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN 1 ELSE 0 END 
                                    ) / 9.0
                                ) * 100, 2)
                    END AS profile_progress,
                    emp.e_verified,
                    emp.sub_status as project_status,
                    CASE
                    WHEN emp.is_active = true THEN 'Active - ' || emp.sub_status
                    END AS label_name,
                    json_build_object('first_name', emp.first_name,'middle_name', emp.middle_name, 'last_name', emp.last_name, 'full_name', emp.display_name, 'dob', TO_CHAR(emp.dob, date_format), 'gender', emp.gender, 'blood_group', emp.blood_group, 'marital_status', emp.marital_status, 'vendor_id', emp.preferable_vendor_id, 'vendor_price', emp.vendor_price_per_hour ) as basic_details, 
                    json_build_object('contact_number', emp.contact_number, 'alternate_contact_number', COALESCE(emp.alternate_contact_number, ''), 'email_id', emp.email_id, 'alternate_email_id', COALESCE(emp.alternate_email_id, '')) contact_details,
                    (
                        select
                        jsonb_agg(DISTINCT jsonb_build_object('id', emg_cnt_info.id, 'name', emg_cnt_info.name, 'email_id', emg_cnt_info.email_id, 'contact_number', emg_cnt_info.contact_number, 'address_1', emg_cnt_info.address_1, 'address_2', emg_cnt_info.address_2, 'city', emg_cnt_info.city, 'state_name', states.name, 'state_id', emg_cnt_info.state_id, 'country_name', countries.name, 'country_id', emg_cnt_info.country_id, 'zip_code', emg_cnt_info.zip_code, 'relationship_id', emg_cnt_info.relationship_id, 'relationship_name', rt.name )) from emergency_contact_information as emg_cnt_info
                        LEFT JOIN states on states.id = emg_cnt_info.state_id 
                        LEFT JOIN countries on countries.id = emg_cnt_info.country_id 
                        LEFT JOIN relationship_types as rt on rt.id = emg_cnt_info.relationship_id
                        where emg_cnt_info.employee_id = emp.id 
                        AND emg_cnt_info.deleted_at is NULL
                    ),
                    json_build_object('address_line_one', ead.address_one, 'address_line_two', ead.address_two, 'city', ead.city, 'state_id', ead.state_id, 'state_name', sead.name, 'country_id', ead.country_id, 'country_name', cead.name, 'zip_code', ead.zip_code) as current_address,
                    json_build_object('reference_id', emp.reference_id, 'employment_type', et.name, 'employment_type_id', emp.employment_type_id, 'date_of_joining', TO_CHAR(emp.date_of_joining, date_format), 'rejoin_date', TO_CHAR(emp.rejoin_date, date_format), 'employee_category', ec.name, 'department_id', emp.department_id, 'department_name', d.name, 'team_id', emp.team_id, 'team_name', tm.name, 'employment_category_id', emp.employee_category_id, 'is_usc', emp.is_us_citizen, 'ssn', CASE WHEN emp.ssn IS NULL THEN '' ELSE emp.ssn END, 'reporting_manager_id', emp.reporting_manager_id, 'reporting_manager', rm.display_name, 'visa_type', vt.name, 'visa_type_id', emp.visa_type_id, 'drafted_stage', emp.drafted_stage, 'role_id', emp.role_id, 'role_name', roles.name, 'enable_login',  CASE 
                    WHEN emp.enable_login = true THEN 1
                    ELSE 0
                END) as employemnt_details,
                (
                    SELECT 
                        CASE 
                            WHEN COUNT(*) > 0 THEN TRUE 
                            ELSE FALSE 
                        END
                    FROM 
                        pay_type_configuration 
                    WHERE 
                        employee_id = emp.id 
                        AND is_global = true
                ) AS is_pay_configuration_set,
                emp.confirm_rehire,
                emp.enable_payroll,
                CASE
                    WHEN emp.employment_type_id = 1 THEN ''
                    WHEN NOT EXISTS (SELECT 1 FROM employee_education_details WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN 'education_documents'
                    WHEN NOT EXISTS (SELECT 1 FROM employee_passport_details WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN 'passport_document'
                    WHEN NOT EXISTS (SELECT 1 FROM employee_i94_details WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN 'i94_document'
                    WHEN NOT EXISTS (SELECT 1 FROM employee_visa_details WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN 'visa_document'
                    WHEN NOT EXISTS (SELECT 1 FROM employee_personal_documents WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN 'personal_documents'
                    WHEN NOT EXISTS (SELECT 1 FROM employee_bank_account_details WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN 'bank_accounts'
                    WHEN NOT EXISTS (SELECT 1 FROM employee_skill_details WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN 'skills'
                    ELSE ''
                END AS complete_profile,
                CASE
                    WHEN emp.employment_type_id = 1 THEN FALSE
                    WHEN NOT EXISTS (SELECT 1 FROM employee_education_details WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN TRUE
                    WHEN NOT EXISTS (SELECT 1 FROM employee_passport_details WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN TRUE
                    WHEN NOT EXISTS (SELECT 1 FROM employee_i94_details WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN TRUE
                    WHEN NOT EXISTS (SELECT 1 FROM employee_visa_details WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN TRUE
                    WHEN NOT EXISTS (SELECT 1 FROM employee_personal_documents WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN TRUE
                    ELSE FALSE
                END AS documents_pending,
                CASE
                    WHEN emp.employment_type_id = 1 THEN FALSE
                    WHEN NOT EXISTS (SELECT 1 FROM employee_bank_account_details WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN TRUE
                    ELSE FALSE
                END AS bank_pending,
                CASE
                    WHEN emp.employment_type_id = 1 THEN FALSE
                    WHEN NOT EXISTS (SELECT 1 FROM employee_skill_details WHERE employee_id = emp.id AND deleted_at IS  NULL) THEN TRUE
                    ELSE FALSE
                END AS skills_pending
                FROM
                    employee AS emp
                LEFT JOIN
                    employee_education_details AS emp_edu_details ON emp_edu_details.employee_id = emp.id AND emp_edu_details.deleted_at IS NULL
                LEFT JOIN
                    employee_skill_details AS emp_skill_details ON emp_skill_details.employee_id = emp.id AND emp_skill_details.deleted_at IS NULL
                LEFT JOIN
                    employee_personal_documents AS emp_prsnl_doc ON emp_prsnl_doc.employee_id = emp.id AND emp_prsnl_doc.deleted_at IS NULL
                LEFT JOIN
                    employee_bank_account_details AS emp_bnk_details ON emp_bnk_details.employee_id = emp.id AND emp_bnk_details.deleted_at IS NULL
                LEFT JOIN
                    emergency_contact_information AS emg_cnt ON emg_cnt.employee_id = emp.id AND emg_cnt.deleted_at IS NULL
                LEFT JOIN
                    employee_passport_details AS emp_psprt_details ON emp_psprt_details.employee_id = emp.id AND emp_psprt_details.deleted_at IS NULL
                LEFT JOIN
                    employee_visa_details AS emp_visa_details ON emp_visa_details.employee_id = emp.id AND emp_visa_details.deleted_at IS NULL
                LEFT JOIN
                    employee_i94_details AS emp_i94_details ON emp_i94_details.employee_id = emp.id AND emp_i94_details.deleted_at IS NULL
                LEFT JOIN 
                    employee_address_details as ead on ead.employee_id = emp.id
                LEFT JOIN 
                    roles on roles.id = emp.role_id
                LEFT JOIN 
                    states as sead on ead.state_id = sead.id
                LEFT JOIN 
                    countries as cead on ead.country_id = cead.id
                LEFT JOIN 
                    employment_types as et on et.id = emp.employment_type_id
                LEFT JOIN 
                    employee_categories as ec on ec.id = emp.employee_category_id
                LEFT JOIN 
                    departments as d on d.id = emp.department_id
                LEFT JOIN 
                    teams as tm on tm.id = emp.team_id
                LEFT JOIN
                    visa_types as vt on vt.id = emp.visa_type_id
                LEFT JOIN 
                    employee as rm on rm.id = emp.reporting_manager_id
                WHERE
                    emp.id = employee_id_filter
                    AND emp.deleted_at is NULL
                GROUP BY
                    emp.id,
                    ead.address_one,
                    ead.address_two,
                    ead.city,
                    ead.state_id,
                    ead.country_id,
                    ead.zip_code,
                    et.name,
                    ec.name,
                    d.name,
                    tm.name,
                    rm.display_name,
                    sead.name,
                    cead.name,
                    vt.name,
                    roles.name,
                    emp_edu_details.id,
                    emp_psprt_details.id,
                    emp_i94_details.id,
                    emp_visa_details.id,
                    emp_prsnl_doc.id,
                    emp_bnk_details.id,
                    emp_skill_details.id;
                END;
            $$ LANGUAGE plpgsql;`
        )
    } catch (e) {
        console.log(e.message);
    }
}

module.exports = getEmployeeDetails;