const getCompanyActivityListingInformation = async (tenantDb) => {

    try {
        await tenantDb.raw(`    
        DROP FUNCTION IF EXISTS getCompanyActivityInformation(
            company_filter UUID,
            entity_type_filter TEXT,
            date_format TEXT,
            page_size INT,
            page_number INT
        ); 
        CREATE OR REPLACE FUNCTION getCompanyActivityInformation(
            company_filter UUID,
            entity_type_filter TEXT,
            date_format TEXT,
            page_size INT,
            page_number INT
        )
        RETURNS TABLE (
            serial_number BIGINT,
            id INT,
            company_id UUID,
            company_name VARCHAR(255),
            entity_type VARCHAR(255),
            referrable_type SMALLINT,
            referrable_type_name TEXT,
            referrable_type_id INT,
            action_type SMALLINT,
            action_type_name TEXT,
            is_document BOOLEAN,
            created_by VARCHAR(250),
            created_at TEXT,
            created_time TEXT,
            field_changes TEXT, -- Change type to TEXT
            total_activity_count BIGINT
        )
        AS $$
        BEGIN
          RETURN QUERY
            SELECT 
                ROW_NUMBER() OVER (ORDER BY cat.created_at) AS serial_number,
                cat.id, 
                com.id as company_id,
                com.name as company_name,
                com.entity_type,
                cat.referrable_type, 
                CASE 
                    WHEN cat.referrable_type = 1 THEN 'Company Details'
                    WHEN cat.referrable_type = 2 THEN 'Contact Details'
                    WHEN cat.referrable_type = 3 THEN 'Invoice configuration'
                    WHEN cat.referrable_type = 4 THEN 'Timesheet Configuration'
                    ELSE 'Unknown'
                END AS referrable_type_name,
                cat.referrable_type_id,
                cat.action_type,
                CASE 
                    WHEN cat.action_type = 1 THEN 'store'
                    WHEN cat.action_type = 2 THEN 'update'
                    WHEN cat.action_type = 3 THEN 'delete'
                    ELSE 'unknown'
                END AS action_type_name, 
                bool_or(cfc.is_document) AS is_document,
                created.display_name as created_by, 
                TO_CHAR(cat.created_at, date_format) AS created_at,
                TO_CHAR(cat.created_at, 'HH24:MI') AS created_time,
                CASE 
                    WHEN cat.action_type = 2 THEN 
                        CASE 
                            WHEN bool_or(cfc.is_document) THEN 
                                (
                                    SELECT STRING_AGG(field_change_message, ', ')
                                    FROM (
                                        SELECT 
                                            CASE 
                                                WHEN cfc.is_document THEN cfc.field_name || ' has been modified'
                                                ELSE cfc.field_name || ' has been changed from ' || cfc.old_value || ' to ' || cfc.new_value
                                            END AS field_change_message
                                        FROM company_fields_changes AS cfc
                                        WHERE cat.id = cfc.company_activity_track_id
                                    ) AS field_changes
                                )
                            ELSE 
                                STRING_AGG(cfc.field_name || ' has been changed from ' || cfc.old_value || ' to ' || cfc.new_value, ', ') -- Regular aggregation
                        END
                    ELSE '[]' -- Return empty array as string
                END AS field_changes,
                (
                    SELECT COUNT(DISTINCT cat_count.id)
                    FROM 
                        companies_activity_track AS cat_count
                    LEFT JOIN 
                        company_fields_changes AS cfc_count ON cat_count.id = cfc_count.company_activity_track_id
                    LEFT JOIN 
                        companies AS com ON com.id = cat_count.company_id
                    LEFT JOIN 
                        employee AS emp_count ON emp_count.id = cat_count.created_by
                    WHERE 
                        (company_filter IS NULL OR cat_count.company_id = company_filter)
                    AND 
                        (entity_type_filter IS NULL OR com.entity_type = entity_type_filter)    
                ) AS total_activity_count
            FROM 
                companies_activity_track AS cat
            LEFT JOIN 
                company_fields_changes AS cfc ON cat.id = cfc.company_activity_track_id
            LEFT JOIN 
                companies AS com ON com.id = cat.company_id
            LEFT JOIN 
                employee AS created ON created.id = cat.created_by
            WHERE 
                (company_filter IS NULL OR cat.company_id = company_filter)
            AND 
                (entity_type_filter IS NULL OR com.entity_type = entity_type_filter)  
            GROUP BY 
                cat.id, 
                cat.referrable_type,
                cat.action_type,
                cat.created_by,
                cat.created_at,
                created.display_name,
                cat.referrable_type_id,
                com.id
            ORDER BY
                cat.created_at DESC
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

module.exports = getCompanyActivityListingInformation;
