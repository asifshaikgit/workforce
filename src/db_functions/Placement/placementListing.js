const getPlacementListing = async (tenantDb) => {
  try {
    await tenantDb.raw(`
      DROP FUNCTION getPlacementListing( 
        client_id_filter TEXT,
        recruiter_id_filter TEXT,
        timesheet_cycle_filter TEXT,
        status_type_filter TEXT,
        from_date_filter TEXT,
        to_date_filter TEXT,
        search_filter TEXT,
        date_format TEXT,
        page_size INT,
        page_number INT,
        sort_column TEXT,
        sort_order TEXT
      );
      CREATE OR REPLACE FUNCTION getPlacementListing( 
        client_id_filter TEXT,
        recruiter_id_filter TEXT,
        timesheet_cycle_filter TEXT,
        status_type_filter TEXT,
        from_date_filter TEXT,
        to_date_filter TEXT,
        search_filter TEXT,
        date_format TEXT,
        page_size INT,
        page_number INT,
        sort_column TEXT,
        sort_order TEXT
    ) 
    RETURNS TABLE (
        id UUID,
        employee_id UUID,
        client_id UUID,
        employee_name VARCHAR(250),
        employee_reference_id VARCHAR(25),
        placement_reference_id VARCHAR(25),
        client_name VARCHAR(100),
        start_date TEXT,
        end_date TEXT,
        status TEXT,
        timesheet_cycle VARCHAR(30),
        pay_rate DOUBLE PRECISION,
        bill_rate DOUBLE PRECISION,
        recruiter_name VARCHAR(250),
        profile_picture_url VARCHAR(255),
        profile_progress NUMERIC,
        total_placements_count BIGINT
    )
    AS $$
    DECLARE
        client_id_array UUID[];
        recruiter_id_array INT[];
        timesheet_cycle_array TEXT[];
        status_type_array TEXT[];
        from_date_array DATE[];
        to_date_array DATE[];
    BEGIN
        -- Convert comma-separated strings to arrays if they are not empty
        IF client_id_filter <> '' THEN
            client_id_array := string_to_array(client_id_filter, ',')::UUID[];
        END IF;
        
        IF recruiter_id_filter <> '' THEN
            recruiter_id_array := string_to_array(recruiter_id_filter, ',')::INT[];
        END IF;
        
        IF timesheet_cycle_filter <> '' THEN
            timesheet_cycle_array := string_to_array(timesheet_cycle_filter, ',')::TEXT[];
        END IF;
        
        IF status_type_filter <> '' THEN
            status_type_array := string_to_array(status_type_filter, ',')::TEXT[];
        END IF;
        
        IF from_date_filter <> '' THEN
            from_date_array := string_to_array(from_date_filter, ',')::DATE[];
        END IF;
        
        IF to_date_filter <> '' THEN
            to_date_array := string_to_array(to_date_filter, ',')::DATE[];
        END IF;      
          
    RETURN QUERY
        SELECT
            p.id,
            p.employee_id,
            p.client_id,
            e.display_name AS employee_name,
            e.reference_id AS employee_reference_id,
            p.reference_id AS placement_reference_id,
            c.name AS client_name,
            TO_CHAR(p.start_date, date_format),
            TO_CHAR(p.end_date, date_format),
            p.status,
            p.timesheet_cycle,
            pbd.bill_rate,
            pbd.bill_rate,
            r.display_name AS recruiter_name,
            e.profile_picture_url,
            CASE
                WHEN e.employment_type_id = 1
                THEN 100 
                WHEN (e.is_us_citizen = 0 OR e.is_us_citizen IS NULL) 
                THEN 
                    ROUND(
                        (
                            (
                                CASE WHEN (e.contact_number IS NOT NULL AND e.email_id IS NOT NULL) THEN 5 ELSE 0 END +
                                CASE WHEN EXISTS (SELECT 1 FROM employee_education_details WHERE employee_education_details.employee_id = e.id AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                CASE WHEN EXISTS (SELECT 1 FROM employee_passport_details WHERE employee_passport_details.employee_id = e.id AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                CASE WHEN EXISTS (SELECT 1 FROM employee_i94_details WHERE employee_i94_details.employee_id = e.id AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                CASE WHEN EXISTS (SELECT 1 FROM employee_visa_details WHERE employee_visa_details.employee_id = e.id AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                CASE WHEN EXISTS (SELECT 1 FROM employee_personal_documents WHERE employee_personal_documents.employee_id = e.id AND document_type_id = 4 AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                CASE WHEN EXISTS (SELECT 1 FROM employee_personal_documents WHERE employee_personal_documents.employee_id = e.id AND document_type_id IN (1,3) AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                CASE WHEN EXISTS (SELECT 1 FROM employee_personal_documents WHERE employee_personal_documents.employee_id = e.id AND document_type_id = 2 AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                CASE WHEN EXISTS (SELECT 1 FROM employee_bank_account_details WHERE employee_bank_account_details.employee_id = e.id AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                CASE WHEN EXISTS (SELECT 1 FROM employee_skill_details WHERE employee_skill_details.employee_id = e.id AND deleted_at IS  NULL) THEN 1 ELSE 0 END 
                            ) / 14.0
                        ) * 100, 2)
                WHEN e.is_us_citizen = 1 
                THEN 
                    ROUND(
                        (
                            (
                                CASE WHEN (e.contact_number IS NOT NULL AND e.email_id IS NOT NULL) THEN 5 ELSE 0 END +
                                CASE WHEN EXISTS (SELECT 1 FROM employee_education_details WHERE employee_education_details.employee_id = e.id AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                CASE WHEN EXISTS (SELECT 1 FROM employee_personal_documents WHERE employee_personal_documents.employee_id = e.id AND document_type_id = 4 AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                CASE WHEN EXISTS (SELECT 1 FROM employee_bank_account_details WHERE employee_bank_account_details.employee_id = e.id AND deleted_at IS  NULL) THEN 1 ELSE 0 END + 
                                CASE WHEN EXISTS (SELECT 1 FROM employee_skill_details WHERE employee_skill_details.employee_id = e.id AND deleted_at IS  NULL) THEN 1 ELSE 0 END 
                            ) / 9.0
                        ) * 100, 2)
            END AS profile_progress,
            (
                SELECT COUNT(*)
                FROM placements AS p 
                LEFT JOIN employee AS e ON e.id = p.employee_id
                LEFT JOIN companies AS c ON p.client_id = c.id
                WHERE 
                    (
                        array_length(status_type_array, 1) IS NULL -- Check if status_type_array is empty
                        OR p.status IN (SELECT unnest(status_type_array))
                    )
                    AND (
                        array_length(from_date_array, 1) IS NULL -- Check if from_date_array is empty
                        OR (p.start_date BETWEEN from_date_array[1] AND from_date_array[2])
                    )
                    AND (
                        array_length(to_date_array, 1) IS NULL -- Check if to_date_array is empty
                        OR (p.end_date BETWEEN to_date_array[1] AND to_date_array[2])
                    )
                    AND (
                        search_filter IS NULL
                        OR LOWER(e.display_name) LIKE '%' || LOWER(search_filter) || '%'
                        OR LOWER(e.reference_id) LIKE '%' || LOWER(search_filter) || '%'
                        OR LOWER(c.reference_id) LIKE '%' || LOWER(search_filter) || '%'
                        OR LOWER(p.reference_id) LIKE '%' || LOWER(search_filter) || '%'
                        OR LOWER(c.name) LIKE '%' || LOWER(search_filter) || '%'
                    )
                    AND (
                        array_length(client_id_array, 1) IS NULL -- Check if client_id_array is empty
                        OR c.id = ANY(client_id_array) -- Check if client_id exists in the filter array
                    )
                    AND (
                        array_length(recruiter_id_array, 1) IS NULL -- Check if recruiter_id_array is empty
                        OR p.recruiter_id = ANY(recruiter_id_array) -- Check if recruiter_id exists in the filter array
                    )
                    AND (
                        array_length(timesheet_cycle_array, 1) IS NULL -- Check if timesheet_cycle_array is empty
                        OR p.timesheet_cycle = ANY(timesheet_cycle_array) -- Check if timesheet_cycle exists in the filter array
                    )
            ) AS total_placements_count
        FROM 
            placements AS p 
            LEFT JOIN employee AS e ON e.id = p.employee_id
            LEFT JOIN companies AS c ON p.client_id = c.id
            LEFT JOIN recruiters AS r ON p.recruiter_id = r.id
            LEFT JOIN placement_billing_details AS pbd ON pbd.placement_id = p.id
                AND pbd.effective_from <= CURRENT_DATE
                AND (pbd.effective_to >= CURRENT_DATE OR pbd.effective_to IS NULL)
        WHERE 
            (
                array_length(status_type_array, 1) IS NULL -- Check if status_type_array is empty
                OR p.status IN (SELECT unnest(status_type_array))
            )
            AND (
                array_length(from_date_array, 1) IS NULL -- Check if from_date_array is empty
                OR (p.start_date BETWEEN from_date_array[1] AND from_date_array[2])
            )
            AND (
                array_length(to_date_array, 1) IS NULL -- Check if to_date_array is empty
                OR (p.end_date BETWEEN to_date_array[1] AND to_date_array[2])
            )
            AND (
                search_filter IS NULL
                OR LOWER(e.display_name) LIKE '%' || LOWER(search_filter) || '%'
                OR LOWER(e.reference_id) LIKE '%' || LOWER(search_filter) || '%'
                OR LOWER(c.reference_id) LIKE '%' || LOWER(search_filter) || '%'
                OR LOWER(p.reference_id) LIKE '%' || LOWER(search_filter) || '%'
                OR LOWER(c.name) LIKE '%' || LOWER(search_filter) || '%'
            )
            AND (
                array_length(client_id_array, 1) IS NULL -- Check if client_id_array is empty
                OR c.id = ANY(client_id_array) -- Check if client_id exists in the filter array
            )
            AND (
                array_length(recruiter_id_array, 1) IS NULL -- Check if recruiter_id_array is empty
                OR p.recruiter_id = ANY(recruiter_id_array) -- Check if recruiter_id exists in the filter array
            )
            AND (
                array_length(timesheet_cycle_array, 1) IS NULL -- Check if timesheet_cycle_array is empty
                OR p.timesheet_cycle = ANY(timesheet_cycle_array) -- Check if timesheet_cycle exists in the filter array
            )
        ORDER BY 
            CASE 
                WHEN sort_order = 'DESC' THEN 
                    CASE sort_column
                        WHEN 'e.display_name' THEN lower(e.display_name)
                        WHEN 'p.created_at' THEN cast(p.created_at as text)
                    END
            END DESC,
            CASE
                WHEN sort_order = 'ASC' THEN
                    CASE sort_column
                        WHEN 'e.display_name' THEN lower(e.display_name)
                        WHEN 'p.created_at' THEN cast(p.created_at as text)
                    END
            END ASC
        LIMIT
            page_size
        OFFSET
            (page_number - 1) * page_size;
    END;
    $$ LANGUAGE plpgsql;   
      
      `);
  } catch (e) {
    console.log(e.message);
  }
};

module.exports = getPlacementListing;
