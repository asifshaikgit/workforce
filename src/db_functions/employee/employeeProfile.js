const getEmployeeProfile = async (tenantDb) => {
    try {
        await tenantDb.raw(`
            DROP FUNCTION IF EXISTS getEmployeeProfile(
                employee_id_filter UUID
            );
            CREATE OR REPLACE FUNCTION getEmployeeProfile(
                employee_id_filter UUID
            )
            RETURNS TABLE (
                status TEXT,
                profile_picture_url VARCHAR(255),
                profile_progress NUMERIC,
                e_verified SMALLINT
            ) AS $$
            BEGIN
                RETURN QUERY
                SELECT
                    emp.status,
                    emp.profile_picture_url,
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
                    emp.e_verified
                FROM
                    employee AS emp
                WHERE
                    emp.id = employee_id_filter
                    AND emp.deleted_at is NULL
                GROUP BY
                    emp.id;
                END;
            $$ LANGUAGE plpgsql;`
        )
    } catch (e) {
        console.log(e.message);
    }
}

module.exports = getEmployeeProfile;