
const getSelfServiceListingInformation = async (tenantDb) => {

	try {
		await tenantDb.raw(`
			DROP FUNCTION IF EXISTS  getSelfServiceListingInformation(
				from_date_filter TIMESTAMP,
				to_date_filter TIMESTAMP,
				raised_filter BOOLEAN,
				received_filter BOOLEAN,
				employee_filter BOOLEAN,
				status_filter TEXT,
				self_service_filter TEXT,
				search_filter TEXT,
				loginId UUID,
				date_format TEXT,
				page_size INT,
				page_number INT
			);
			CREATE OR REPLACE FUNCTION getSelfServiceListingInformation(
                    from_date_filter TIMESTAMP,
                    to_date_filter TIMESTAMP,
                    raised_filter BOOLEAN,
					received_filter BOOLEAN,
					employee_filter BOOLEAN,
                    status_filter TEXT,
                    self_service_filter TEXT,
                    search_filter TEXT,
                    loginId UUID,
                    date_format TEXT,
                    page_size INT,
                    page_number INT
                )
                RETURNS TABLE (
					id UUID,
					label TEXT,
					status TEXT,
					subject VARCHAR(255),
					documents JSONB,
					raised_on TEXT,
					description VARCHAR(255),
					raised_time TEXT,
					re_assigned BOOLEAN,
					reference_id VARCHAR(50),
					assigned_employees JSONB,
					employee_id UUID,
					employee_name VARCHAR(250),
					gender VARCHAR(255),
					profile_picture_url VARCHAR(255),
					raised_employee_id UUID,
					raised_employee_name VARCHAR(250),
					raised_gender VARCHAR(255),
					raised_profile_picture_url VARCHAR(255),
					self_service_types_id INT,
					self_service_type_name VARCHAR(100),
					total_ess_count BIGINT
                )
                AS $$
                DECLARE
                    self_service_filter_array INT[];
                    status_filter_array TEXT[];
                BEGIN
                    self_service_filter_array := string_to_array(self_service_filter, ',')::INT[];
                    status_filter_array := string_to_array(status_filter, ',')::TEXT[];
                    RETURN QUERY
					Select
					ess.id,
					CASE
						WHEN ess.id IN (SELECT employee_self_service_id FROM employee_self_service_chat_messages WHERE employee_self_service_id = ess.id  ) THEN 'old' ELSE 'new'
					END as label,
					ess.status,
					ess.subject,
                    COALESCE(jsonb_agg(DISTINCT jsonb_build_object('id', essd.id, 'document_url', essd.document_url)), '[]'::JSONB) AS documents,
					TO_CHAR(ess.raised_on, date_format) as raised_on,
					ess.description,
					TO_CHAR(ess.updated_at, 'HH24:MI') as raised_time,
					ess.re_assigned,
					ess.reference_id,
					jsonb_agg(DISTINCT jsonb_build_object('id', ae.id,  'employee_id', ae.employee_id, 'employee_name', ssae_details.display_name)) as assigned_employees,
					ess.employee_id as employee_id,
					employee_details.display_name as employee_name,
					employee_details.gender,
					COALESCE(employee_details.profile_picture_url, ''),
					ess.created_by as raised_employee_id,
					raised_employee_details.display_name as raised_employee_name,
					raised_employee_details.gender,
					COALESCE(raised_employee_details.profile_picture_url, ''),
					ess.self_service_types_id,
					est.name as self_service_type_name,
					(
						SELECT COUNT(*)
                        FROM employee_self_services AS ess_count
						LEFT JOIN employee as employee_details on ess_count.employee_id = employee_details.id
						LEFT JOIN employee as raised_employee_details on ess.created_by = raised_employee_details.id
                        WHERE
                        (status_filter IS NULL OR ess_count.status = ANY(status_filter_array))
                        AND (self_service_filter IS NULL OR ess_count.self_service_types_id = ANY(self_service_filter_array))
                        AND (
							search_filter IS NULL
						   OR (LOWER(ess_count.reference_id)) LIKE '%' || (LOWER(search_filter)) || '%'
						   OR (LOWER(employee_details.display_name)) LIKE '%' || (LOWER(search_filter)) || '%'
						   OR (LOWER(raised_employee_details.display_name)) LIKE '%' || (LOWER(search_filter)) || '%'
						   )
                        AND (
                            raised_filter is FALSE
                            OR (ess_count.created_by = loginId )
                            )
						OR (
							received_filter is TRUE
							AND (ess_count.employee_id = loginId)
						)
						AND (
							employee_filter is FALSE
							OR (ess_count.employee_id = loginId AND ess_count.employee_id != ess_count.created_by)
							)
                        AND ess_count.deleted_at is NULL
						AND (
							(from_date_filter IS NOT NULL AND to_date_filter IS NOT NULL AND ess_count.created_at BETWEEN from_date_filter AND to_date_filter)
							OR (from_date_filter IS NULL OR to_date_filter IS NULL)
						)
					) as total_ess_count
					from employee_self_services AS ess
					LEFT JOIN expense_and_service_types AS est ON est.id = ess.self_service_types_id
					LEFT JOIN assignee_employees AS ae ON ae.referrable_id = est.id
					LEFT JOIN employee as ssae_details on ae.employee_id = ssae_details.id
					LEFT JOIN employee as employee_details on ess.employee_id = employee_details.id
					LEFT JOIN employee as raised_employee_details on ess.created_by = raised_employee_details.id
					LEFT JOIN employee_self_service_documents AS essd ON essd.employee_self_service_id = ess.id
					WHERE
					(status_filter IS NULL OR ess.status = ANY(status_filter_array))
					AND (self_service_filter IS NULL OR ess.self_service_types_id = ANY(self_service_filter_array))	
					AND (
						search_filter IS NULL
					   OR (LOWER(ess.reference_id)) LIKE '%' || (LOWER(search_filter)) || '%'
					   OR (LOWER(employee_details.display_name)) LIKE '%' || (LOWER(search_filter)) || '%'
					   OR (LOWER(raised_employee_details.display_name)) LIKE '%' || (LOWER(search_filter)) || '%'
					   )
					AND (
						raised_filter is FALSE
						OR (ess.created_by = loginId)
					)
					OR (
						received_filter is TRUE
						AND (ess.employee_id = loginId)
					)
					AND (
						employee_filter is FALSE
						OR (ess.employee_id = loginId AND ess.employee_id != ess.created_by)
						)
					AND ess.deleted_at is NULL
					AND (
						(from_date_filter IS NOT NULL AND to_date_filter IS NOT NULL AND ess.created_at BETWEEN from_date_filter AND to_date_filter)
						OR (from_date_filter IS NULL OR to_date_filter IS NULL)
					)
					AND est.referrable_type = 1
					AND ae.referrable_type = 1
					Group by employee_details.gender, ess.id, employee_details.display_name, employee_details.profile_picture_url,raised_employee_details.display_name, raised_employee_details.gender, raised_employee_details.profile_picture_url, est.name, essd.employee_self_service_id
					ORDER BY ess.created_at DESC
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

module.exports = getSelfServiceListingInformation;