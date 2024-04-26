const getLedgerPaymentsListing = async (tenantDb) => {
    try {
        await tenantDb.raw(`
        DROP FUNCTION IF EXISTS GetLedgerPaymentsListing(
            entity_type_filter TEXT,
            company_id_filter UUID,
            search_filter TEXT,
            page_size INT,
            page_number INT
        );
        CREATE OR REPLACE FUNCTION GetLedgerPaymentsListing(
                entity_type_filter TEXT,
                company_id_filter UUID,
                search_filter TEXT,
                page_size INT,
                page_number INT
            )
            RETURNS TABLE (
                total_count BIGINT,
                id UUID,
                payment_ref_no VARCHAR,
                payment_no VARCHAR,
                amount DOUBLE PRECISION,
                company_name VARCHAR,
                company_reference_id VARCHAR,
                company_id UUID,
                company_logo VARCHAR,
                company_profile_perecentage INT,
                invoice_numbers JSON,
                payment_type VARCHAR
            )
            AS $$
            BEGIN
                RETURN QUERY
                SELECT
                    COUNT(*) OVER () AS total_count,
                    lp.id,
                    lp.reference_id AS payment_ref_no,
                    lp.payment_reference_number AS payment_no,
                    lp.total_received_amount AS amount,
                    c.name AS company_name,
                    c.reference_id, 
                    c.id AS company_id,
                    c.logo_document_url AS company_logo,
                    CASE
                    WHEN c.entity_type = 'client' THEN
                        CASE WHEN c.id IS NOT NULL THEN 25 ELSE 0 END +
                        CASE WHEN c.invoice_approval_id IS NOT NULL THEN 25 ELSE 0 END +
                        CASE WHEN c.timesheet_approval_id IS NOT NULL THEN 25 ELSE 0 END +
                        CASE WHEN c_contacts.company_id IS NOT NULL THEN 25 ELSE 0 END
                    WHEN c.entity_type = 'end-client' OR c.entity_type = 'vendor' THEN
                        CASE WHEN c.id IS NOT NULL THEN 50 ELSE 0 END +
                        CASE WHEN c_contacts.company_id IS NOT NULL THEN 50 ELSE 0 END
                    END as profile_perecentage,
                    json_agg(DISTINCT jsonb_build_object(
                        'no', l.reference_id
                    )) AS invoice_numbers,
                    pm.name AS payment_type
                FROM
                    ledger_payments AS lp
                LEFT JOIN
                    companies AS c ON lp.company_id = c.id
                    LEFT JOIN
                    company_contacts AS c_contacts ON c_contacts.company_id = c.id
                LEFT JOIN
                    payment_modes AS pm ON lp.payment_mode_id = pm.id
                LEFT JOIN
                    ledger_payment_section_details AS lpsc ON lp.id = lpsc.ledger_payment_id
                LEFT JOIN
                    ledgers AS l ON lpsc.ledger_id = l.id
                WHERE
                    lp.entity_type = entity_type_filter
                    AND (company_id_filter IS NULL OR lp.company_id = company_id_filter)
                    AND (
                        search_filter IS NULL
                        OR lp.reference_id ILIKE '%' || search_filter || '%'
                        OR c.name ILIKE '%' || search_filter || '%'
                    )
                GROUP BY
                    lp.id, c.name, pm.name, c.id, c_contacts.company_id
                ORDER BY
                    lp.created_at DESC
                LIMIT 
                    page_size
                OFFSET 
                    (page_number - 1) * page_size;
            END;
            $$ LANGUAGE plpgsql;
            `        )
    } catch (e) {
        console.log(e.message);
    }
}

module.exports = getLedgerPaymentsListing;
