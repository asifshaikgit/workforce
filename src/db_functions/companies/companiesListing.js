
const getCompaniesListingInformation = async (tenantDb) => {

    try {
        await tenantDb.raw(`  
        -- Drop the existing function if it exists
        DROP FUNCTION IF EXISTS GetCompaniesListingInformation(TEXT, VARCHAR(255), VARCHAR(255), INT, INT, TEXT, TEXT);
        
        -- Create the function
        CREATE OR REPLACE FUNCTION GetCompaniesListingInformation(
            active_filter TEXT,
            entity_type_filter VARCHAR(255),
            search_filter VARCHAR(255),
            page_size INT,
            page_number INT,
            sort_column TEXT,
            sort_order TEXT
        )
        RETURNS TABLE (
            company_id UUID,
            company_name VARCHAR,
            reference VARCHAR,
            document_url VARCHAR,
            telephone_number VARCHAR,
            mobile_number VARCHAR,
            contact_email VARCHAR,
            status TEXT,
            profile_percentage INT,
            created_at TIMESTAMPTZ,
            total_companies_count BIGINT,
            primary_contact VARCHAR
        )
        AS $$
        BEGIN
            RETURN QUERY
            SELECT
                c.id,
                c.name,
                c.reference_id,
                COALESCE(c.logo_url, '') AS document_url,
                COALESCE(cc.telephone_number, ''),
                COALESCE(cc.mobile_number, ''),
                COALESCE(cc.email_id, ''),
                c.status,
                CASE WHEN c.id IS NOT NULL THEN 50 ELSE 0 END +
                CASE WHEN cc.email_id IS NOT NULL THEN 50 ELSE 0 END as profile_percentage,
                c.created_at,
                (
                    SELECT COUNT(*)
                    FROM companies AS companies_count
                    WHERE (active_filter IS NULL OR companies_count.status = active_filter)
                    AND (entity_type_filter IS NULL OR companies_count.entity_type = entity_type_filter)
                    AND (
                        search_filter IS NULL
                        OR (LOWER(companies_count.reference_id) LIKE '%' || LOWER(search_filter) || '%')
                        OR (LOWER(companies_count.name) LIKE '%' || LOWER(search_filter) || '%')
                    )
                    AND companies_count.deleted_at IS NULL
                ) AS total_companies_count,
                cc.display_name as primary_contact
            FROM
                companies c
            LEFT JOIN LATERAL (
                SELECT
                    company_contacts.display_name,
                    company_contacts.telephone_number,
                    company_contacts.mobile_number,
                    company_contacts.email_id
                FROM
                    company_contacts
                WHERE
                    company_contacts.company_id = c.id AND is_primary = TRUE
                ORDER BY
                    c.created_at DESC
                LIMIT 1
            ) cc ON true
            WHERE
                (active_filter IS NULL OR c.status = active_filter)
                AND (entity_type_filter IS NULL OR c.entity_type = entity_type_filter)
                AND (
                    search_filter IS NULL
                    OR (LOWER(c.reference_id) LIKE '%' || LOWER(search_filter) || '%')
                    OR (LOWER(c.name) LIKE '%' || LOWER(search_filter) || '%')
                )
                AND c.deleted_at IS NULL
            ORDER BY 
                CASE 
                    WHEN sort_order = 'DESC' THEN 
                        CASE sort_column
                            WHEN 'c.name' THEN lower(c.name)
                            WHEN 'c.status' THEN c.status
                            WHEN 'c.created_at' THEN cast(c.created_at as text)
                        END
                    END DESC,
                CASE
                    WHEN sort_order = 'ASC' THEN
                        CASE sort_column
                            WHEN 'c.name' THEN lower(c.name)
                            WHEN 'c.status' THEN c.status
                            WHEN 'c.created_at' THEN cast(c.created_at as text)
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

module.exports = getCompaniesListingInformation;