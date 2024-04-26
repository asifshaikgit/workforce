
const getConfigurationActivityListingInformation = async (tenantDb) => {

    try {
        await tenantDb.raw(` 
        DROP FUNCTION IF EXISTS getConfigurationActivityInformation(
            id_filter INT,
            date_format TEXT,
            page_size INT,
            page_number INT
        );
        
        CREATE OR REPLACE FUNCTION getConfigurationActivityInformation(
            id_filter INT,
            date_format TEXT,
            page_size INT,
            page_number INT
        )
        RETURNS TABLE (
            user_role VARCHAR,
            user_name VARCHAR,
            action TEXT,
            created_at TEXT,
            change_log TEXT[],
            total_activity_count BIGINT
        )
        AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                roles.name as user_role,
                emp.display_name as user_name,
                CASE
                    WHEN action_type = 1 THEN 'Created'
                    WHEN action_type = 2 THEN 'Edited'
                    WHEN action_type = 3 THEN 'Deleted'
                    ELSE 'Unknown'
                END as action_type,
                to_char(cat.created_at::timestamp, 'MM-DD-YYYY') || ' at ' || to_char(cat.created_at::timestamp, 'HH:MI AM') as created_at,
                CASE
                    WHEN action_type = 1 THEN array_agg(concat(jsn->>'value', ' is created by ', emp.display_name))
                    WHEN action_type = 2 THEN array_agg(concat(jsn->>'label_name', ' is updated from ', 
                                                               CASE 
                                                                    WHEN jsn->>'old_value' = 'true' THEN 'Active' 
                                                                    WHEN jsn->>'old_value' = 'false' THEN 'In Active'
                                                                    WHEN jsn->>'old_value' = '' THEN '" "' 
                                                                    ELSE COALESCE(jsn->>'old_value', '" "')
                                                               END,
                                                               ' to ', 
                                                               CASE 
                                                                    WHEN jsn->>'new_value' = 'true' THEN 'Active' 
                                                                    WHEN jsn->>'new_value' = 'false' THEN 'In Active'
                                                                    WHEN jsn->>'new_value' = '' THEN '" "'
                                                                    ELSE COALESCE(jsn->>'new_value', '" "')
                                                                END, 
                                                               ' by ', emp.display_name))
                    WHEN action_type = 3 THEN array_agg(concat(jsn->>'value', ' is deleted by ', emp.display_name))
                    ELSE NULL
                END as change_log,
                (
                    SELECT COUNT(DISTINCT cat_count.id)
                    FROM configuration_activity_track AS cat_count
                    WHERE cat_count.referrable_type = id_filter
                ) AS total_activity_count
            FROM configuration_activity_track as cat
            LEFT JOIN employee as emp on emp.id = cat.created_by
            LEFT JOIN roles on roles.id = emp.role_id
            LEFT JOIN LATERAL jsonb_array_elements(cat.change_log) AS jsn ON true
            WHERE cat.referrable_type = id_filter
            GROUP BY roles.name, cat.action_type, cat.created_at, cat.change_log, emp.display_name
            ORDER BY cat.created_at DESC
            LIMIT page_size
            OFFSET (page_number - 1) * page_size;
        END;
        $$ LANGUAGE plpgsql;                          
        `);
    } catch (e) {
        console.log(e.message);
    }
};

module.exports = getConfigurationActivityListingInformation;