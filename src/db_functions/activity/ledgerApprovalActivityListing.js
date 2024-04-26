const getledgerApprovalActivityListingInformation = async (tenantDb) => {

    try {
        await tenantDb.raw(`    
        DROP FUNCTION IF EXISTS getledgerApprovalActivityInformation(
            ledger_filter UUID,
            date_format TEXT,
            page_size INT,
            page_number INT
        );
        CREATE OR REPLACE FUNCTION getledgerApprovalActivityInformation(
            ledger_filter UUID,
            date_format TEXT,
            page_size INT,
            page_number INT
        )
        RETURNS TABLE (
            serial_number BIGINT,
            id INT,
            ledger_id UUID,
            reference_id VARCHAR(50),
            employee_name VARCHAR(250),
            created_at TEXT,
            created_time TEXT,
            field_changes TEXT,
            total_activity_count BIGINT
        )
        AS $$
        BEGIN
            RETURN QUERY
            SELECT 
            ROW_NUMBER() OVER (ORDER BY lat.created_at) AS serial_number,
            lat.id,
            ld.id as ledger_id,
            ld.reference_id as reference_id,
            approver.display_name,
            TO_CHAR(lat.created_at, date_format) AS created_at,
            TO_CHAR(lat.created_at, 'HH24:MI') AS created_time,
            CASE
                WHEN lat.approval_level IS NOT NULL THEN
                    STRING_AGG('Ledger ' || ld.reference_id || ' has been approved by ' || approver.display_name || ' for Level ' || lat.approval_level, ', ') -- Regular aggregation
                ELSE
                    '[]' -- Return empty array as string
            END AS field_changes,
            (
                SELECT COUNT(DISTINCT lat_count.id)
                FROM 
                    ledger_approval_track AS lat_count
                LEFT JOIN 
                    ledgers AS ld_count ON ld_count.id = lat_count.ledger_id
                LEFT JOIN 
                    employee AS approver_count ON approver_count.id = lat_count.approval_user_id
                WHERE 
                    (ledger_filter IS NULL OR lat_count.ledger_id = ledger_filter)    
            ) AS total_activity_count
        FROM 
            ledger_approval_track AS lat
        LEFT JOIN 
            ledgers AS ld ON ld.id = lat.ledger_id
        LEFT JOIN 
            employee AS approver ON approver.id = lat.approval_user_id
        WHERE 
            (ledger_filter IS NULL OR lat.ledger_id = ledger_filter)  
        GROUP BY 
            lat.ledger_id,
            ld.id,
            lat.created_at,
            lat.approval_level,
            approver.display_name,
            lat.id        
        ORDER BY
            lat.created_at DESC 
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

module.exports = getledgerApprovalActivityListingInformation;
