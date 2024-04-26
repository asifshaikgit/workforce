const getEmployeesListing = async (tenantDb) => {

    try {
        await tenantDb.raw(
            `DROP FUNCTION IF EXISTS GetEmployeeListing(
                employment_type_id_filter TEXT,
                employee_category_id_filter TEXT,
                visa_type_id_filter TEXT,
                employee_status_filter TEXT,
                enable_balance_sheet_filter TEXT,
                search_filter VARCHAR(255),
                page_size INT,
                page_number INT,
                sort_column TEXT,
                sort_order TEXT
            );
            CREATE OR REPLACE FUNCTION GetEmployeeListing(
                employment_type_id_filter TEXT,
                employee_category_id_filter TEXT,
                visa_type_id_filter TEXT,
                employee_status_filter TEXT,
                enable_balance_sheet_filter TEXT,
                search_filter VARCHAR(255),
                page_size INT,
                page_number INT,
                sort_column TEXT,
                sort_order TEXT
            )
            RETURNS TABLE (
                id UUID,
                first_name VARCHAR(100),
                middle_name VARCHAR(100),
                last_name VARCHAR(50),
                full_name VARCHAR(255),
                profile_picture_url VARCHAR(255),
                contact_number VARCHAR(12),
                email_id VARCHAR(100),
                reference_id VARCHAR(25),
                sub_status TEXT,
                status TEXT,
                e_verified SMALLINT,
                gender VARCHAR(50),
                visa_type_id INT,
                visa_type VARCHAR(100),
                employee_category VARCHAR(100),
                employment_type VARCHAR(100),
                profile_progress NUMERIC,
                total_employees_count BIGINT,
                enable_placement BOOLEAN,
                is_pay_configuration_set BOOLEAN,
                drafted_stage TEXT,
                placement_exists BOOLEAN,
                complete_profile TEXT
            ) AS $$
            DECLARE
                employment_type_id_filter_array INT[];
                employee_category_id_filter_array INT[];
                visa_type_id_filter_array INT[];
                employee_status_filter_array TEXT[];
            BEGIN
                employment_type_id_filter_array := string_to_array(employment_type_id_filter, ',')::INT[];
                employee_category_id_filter_array := string_to_array(employee_category_id_filter, ',')::INT[];
                visa_type_id_filter_array := string_to_array(visa_type_id_filter, ',')::INT[];
                employee_status_filter_array := string_to_array(employee_status_filter, ',')::TEXT[];
                RETURN QUERY
                SELECT 
                    emp.id,
                    emp.first_name,
                    emp.middle_name,
                    emp.last_name,
                    emp.display_name,
                    emp.profile_picture_url,
                    emp.contact_number,
                    emp.email_id,
                    emp.reference_id,
                    emp.sub_status, 
                    emp.status,
                    emp.e_verified,
                    emp.gender,
                    vt.id AS visa_type_id,
                    vt.name AS visa_type,
                    ec.name AS employee_category,
                    emp_type.name AS employment_type,
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
                    END AS percentage,
                    (
                        SELECT COUNT(*)
                        FROM employee AS emp_count
                        WHERE 
                            (employment_type_id_filter IS NULL OR emp_count.employment_type_id = ANY(employment_type_id_filter_array))
                            AND (employee_category_id_filter IS NULL OR emp_count.employee_category_id = ANY(employee_category_id_filter_array))
                            AND (visa_type_id_filter IS NULL OR emp_count.visa_type_id = ANY(visa_type_id_filter_array))
                            AND (employee_status_filter IS NULL OR emp_count.status = ANY(employee_status_filter_array))
                            AND (
                                search_filter IS NULL
                                OR (LOWER(emp_count.display_name)) LIKE '%' || (LOWER(search_filter)) || '%'
                                OR (LOWER(emp_count.reference_id)) LIKE '%' || (LOWER(search_filter)) || '%'
                            )
                            AND  (enable_balance_sheet_filter IS NULL OR emp_count.enable_balance_sheet = true)
                            AND emp_count.deleted_at IS NULL
                    ) AS total_employees_count,
                    (
                        CASE 
                        WHEN emp.payroll_config_settings_id IS NOT NULL
                        AND (emp.e_verified = 1) 
                        AND (emp.enable_payroll = true) 
                        AND (emp.last_working_day IS NULL)
                        AND (emp.status = 'Active')
                        THEN TRUE ELSE False 
                        END     
                    ) AS enable_placement,
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
                    emp.drafted_stage, 
                    (
                        CASE 
                            WHEN EXISTS (SELECT 1 FROM placements WHERE employee_id = emp.id)
                            THEN TRUE 
                            ELSE FALSE 
                        END
                    ) AS placement_exists,
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
                    END AS complete_profile
                FROM 
                    employee AS emp
                LEFT JOIN 
                    employee_address_details as emp_address ON emp_address.employee_id = emp.id
                LEFT JOIN 
                    visa_types AS vt ON emp.visa_type_id = vt.id
                LEFT JOIN 
                    employee_categories AS ec ON emp.employee_category_id = ec.id
                LEFT JOIN 
                    employment_types AS emp_type ON emp.employment_type_id = emp_type.id
                LEFT JOIN
                    employee_education_details AS emp_edu_details ON emp_edu_details.employee_id = emp.id AND emp_edu_details.deleted_at IS NULL
                LEFT JOIN
                    employee_skill_details AS emp_skill_details ON emp_skill_details.employee_id = emp.id AND emp_skill_details.deleted_at IS NULL
                LEFT JOIN
                    employee_personal_documents AS emp_prsnl_doc ON emp_prsnl_doc.employee_id = emp.id AND emp_prsnl_doc.deleted_at IS NULL
                LEFT JOIN
                    employee_bank_account_details AS emp_bnk_details ON emp_bnk_details.employee_id = emp.id AND emp_bnk_details.deleted_at IS NULL
                LEFT JOIN
                    emergency_contact_information AS emg_cnt_info ON emg_cnt_info.employee_id = emp.id
                LEFT JOIN
                    employee_passport_details AS emp_psprt_details ON emp_psprt_details.employee_id = emp.id AND emp_psprt_details.deleted_at IS NULL
                LEFT JOIN
                    employee_visa_details AS emp_visa_details ON emp_visa_details.employee_id = emp.id AND emp_visa_details.deleted_at IS NULL
                LEFT JOIN
                    employee_i94_details AS emp_i94_details ON emp_i94_details.employee_id = emp.id AND emp_i94_details.deleted_at IS NULL
                WHERE 
                    (employment_type_id_filter IS NULL OR emp.employment_type_id = ANY(employment_type_id_filter_array))
                    AND (employee_category_id_filter IS NULL OR emp.employee_category_id = ANY(employee_category_id_filter_array))
                    AND (visa_type_id_filter IS NULL OR emp.visa_type_id = ANY(visa_type_id_filter_array))
                    AND (employee_status_filter IS NULL OR emp.status = ANY(employee_status_filter_array))
                    AND (
                        search_filter IS NULL
                        OR (LOWER(emp.display_name)) LIKE '%' || (LOWER(search_filter)) || '%'
                        OR (LOWER(emp.reference_id)) LIKE '%' || (LOWER(search_filter)) || '%'
                    )
                    AND  (enable_balance_sheet_filter IS NULL OR emp.enable_balance_sheet = true)
                    AND emp.deleted_at IS NULL
                GROUP BY 
                    emp.id,
                    vt.id,
                    vt.name,
                    ec.name,
                    ec.id,
                    emp_type.id,
                    emp_type.name
                ORDER BY 
                    CASE 
                        WHEN sort_order = 'DESC' THEN 
                            CASE sort_column
                                WHEN 'emp.display_name' THEN lower(emp.display_name)
                                WHEN 'emp_type.name' THEN emp_type.name
                                WHEN 'vt.name' THEN vt.name
                                WHEN 'emp.sub_status' THEN emp.sub_status
                                WHEN 'emp.status' THEN emp.status
                                WHEN 'emp.created_at' THEN cast(emp.created_at as text)
                            END
                        END DESC,
                    CASE
                        WHEN sort_order = 'ASC' THEN
                            CASE sort_column
                                WHEN 'emp.display_name' THEN lower(emp.display_name)
                                WHEN 'emp_type.name' THEN emp_type.name
                                WHEN 'vt.name' THEN vt.name
                                WHEN 'emp.sub_status' THEN emp.sub_status
                                WHEN 'emp.status' THEN emp.status
                                WHEN 'emp.created_at' THEN cast(emp.created_at as text)
                            END
                        END ASC
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

module.exports = getEmployeesListing;