const getLedgersListing = async (tenantDb) => {
    try {
        await tenantDb.raw(
            `DROP FUNCTION IF EXISTS getLedgersListing(
                entity_type_filter TEXT,
                company_id_filter UUID,
                status_filter TEXT,
                from_date_filter TIMESTAMP,
                to_date_filter TIMESTAMP,
                search_filter TEXT,
                date_format TEXT,
                page_size INT,
                page_number INT
            );
            CREATE OR REPLACE FUNCTION getLedgersListing(
                entity_type_filter TEXT,
                company_id_filter UUID,
                status_filter TEXT,
                from_date_filter TIMESTAMP,
                to_date_filter TIMESTAMP,
                search_filter TEXT,
                date_format TEXT,
                page_size INT,
                page_number INT
            )
            RETURNS TABLE (
                total_count BIGINT,
                id UUID,
                company_id UUID,
                date TEXT,
                due_date TEXT,
                invoice_id VARCHAR(20),
                amount DOUBLE PRECISION,
                balance_due DOUBLE PRECISION,
                status TEXT,
                ledger_document_url VARCHAR(255),
                company_name VARCHAR(100),
                company_logo VARCHAR(255),
                company_reference_id VARCHAR(25),
                hours DOUBLE PRECISION,
                received_amount INTEGER,
                received_amount_previous JSONB,
                profile_perecentage INT
            ) AS $$
            DECLARE
                total_ledgers_count BIGINT;
            BEGIN
                SELECT COUNT(*) INTO total_ledgers_count
                FROM ledgers AS l
                LEFT JOIN companies AS c ON l.company_id = c.id
                WHERE
                    l.entity_type = entity_type_filter
                    AND (company_id_filter IS NULL OR l.company_id = company_id_filter)
                    AND (
                        status_filter IS NULL OR 
                        (status_filter = 'Drafted' AND l.status = 'Drafted') OR
                        (status_filter = 'Submitted' AND l.status = 'Submitted') OR 
                        (status_filter = 'Approval In Progress' AND l.status = 'Approval In Progress') OR
                        (status_filter = 'Approved' AND l.status = 'Approved') OR
                        (status_filter = 'Rejected' AND l.status = 'Rejected') OR
                        (status_filter = 'is_sent' AND l.is_sent = TRUE) OR
                        (status_filter = 'Overdue' AND l.due_date < CURRENT_DATE AND l.status NOT IN ('Paid','Void')) OR
                        (status_filter = 'Partially Paid' AND l.status = 'Partially Paid') OR
                        (status_filter = 'Paid' AND l.status = 'Paid') OR
                        (status_filter = 'Void' AND l.status = 'Void') OR
                        (status_filter = 'Write Off' AND l.status = 'Write Off') OR
                        (status_filter = 'Payment' AND entity_type_filter = 'invoice' AND (l.status = 'Approved' OR l.status = 'Partially Paid')) OR
                        (status_filter = 'Payment' AND entity_type_filter = 'bill' AND (l.status = 'Submitted' OR l.status = 'Partially Paid'))
                        )
                    AND (
                        search_filter IS NULL
                        OR l.reference_id ILIKE '%' || search_filter || '%'
                        OR c.name ILIKE  '%' || search_filter || '%'
                    )
                    AND (
                        (from_date_filter IS NOT NULL AND to_date_filter IS NOT NULL AND l.date BETWEEN from_date_filter AND to_date_filter)
                        OR (from_date_filter IS NULL OR to_date_filter IS NULL)
                    )
                    AND l.deleted_at IS NULL;
                RETURN QUERY
                SELECT
                    total_ledgers_count,
                    l.id,
                    l.company_id,
                    TO_CHAR(l.date, date_format) AS date,
					TO_CHAR(l.due_date, date_format) AS due_date,
                    l.reference_id AS invoice_id,
                    l.amount,
                    l.balance_amount AS balance_due,
                    l.status,
                    (
                        SELECT ld.document_url
                        FROM ledger_documents ld
                        WHERE l.id = ld.ledger_id
                        LIMIT 1
                    ) AS document_url,
                    c.name AS company_name,
                    COALESCE(c.logo_document_url, '') AS company_logo,
                    c.reference_id,
                    SUM(lid.hours) AS total_hours,
                    0 as received_amount,
                    jsonb_object_agg(COALESCE(lpsd.id, 0), lpsd.received_amount) as total_received_amount,
                    CASE
                    WHEN c.entity_type = 'client' THEN
                        CASE WHEN c.id IS NOT NULL THEN 25 ELSE 0 END +
                        CASE WHEN c.invoice_approval_id IS NOT NULL THEN 25 ELSE 0 END +
                        CASE WHEN c.timesheet_approval_id IS NOT NULL THEN 25 ELSE 0 END +
                        CASE WHEN cc.email_id IS NOT NULL THEN 25 ELSE 0 END
                    WHEN c.entity_type = 'end-client' OR c.entity_type = 'vendor' THEN 
                        CASE WHEN c.id IS NOT NULL THEN 50 ELSE 0 END +
                        CASE WHEN cc.email_id IS NOT NULL THEN 50 ELSE 0 END
                    END as profile_perecentage
                FROM
                    ledgers AS l
                LEFT JOIN
                    companies AS c ON l.company_id = c.id
                LEFT JOIN 
                    ledger_item_details as lid on l.id = lid.ledger_id
                LEFT JOIN
                    ledger_payment_section_details as lpsd on l.id = lpsd.ledger_id
				LEFT JOIN LATERAL (
						SELECT
							company_contacts.email_id
						FROM
							company_contacts 
						WHERE
							company_contacts.company_id = c.id
						ORDER BY
							c.created_at DESC
						LIMIT 1
					) cc ON true
                WHERE
                    l.entity_type = entity_type_filter
                    AND (company_id_filter IS NULL OR l.company_id = company_id_filter)
                    AND (
                            status_filter IS NULL OR 
                            (status_filter = 'Drafted' AND l.status = 'Drafted') OR
                            (status_filter = 'Submitted' AND l.status = 'Submitted') OR 
                            (status_filter = 'Approval In Progress' AND l.status = 'Approval In Progress') OR
                            (status_filter = 'Approved' AND l.status = 'Approved') OR
                            (status_filter = 'Rejected' AND l.status = 'Rejected') OR
                            (status_filter = 'is_sent' AND l.is_sent = TRUE) OR
                            (status_filter = 'Overdue' AND l.due_date < CURRENT_DATE AND l.status NOT IN ('Paid','Void')) OR
                            (status_filter = 'Partially Paid' AND l.status = 'Partially Paid') OR
                            (status_filter = 'Paid' AND l.status = 'Paid') OR
                            (status_filter = 'Void' AND l.status = 'Void') OR
                            (status_filter = 'Write Off' AND l.status = 'Write Off') OR
                            (status_filter = 'Payment' AND entity_type_filter = 'invoice' AND (l.status = 'Approved' OR l.status = 'Partially Paid')) OR
                            (status_filter = 'Payment' AND entity_type_filter = 'bill' AND (l.status = 'Submitted' OR l.status = 'Partially Paid'))
                        )
                    AND (
                        search_filter IS NULL
                        OR l.reference_id ILIKE  '%' || search_filter || '%'
                        OR c.name ILIKE  '%' || search_filter || '%'
                    )
                    AND (
                        (from_date_filter IS NOT NULL AND to_date_filter IS NOT NULL AND l.date BETWEEN from_date_filter AND to_date_filter)
                        OR (from_date_filter IS NULL OR to_date_filter IS NULL)
                    )
                    AND l.deleted_at IS NULL
                group by l.id, c.name, c.logo_document_url, c.reference_id, c.entity_type, c.id,cc.email_id 
                ORDER BY
                l.created_at DESC
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
}

module.exports = getLedgersListing;
