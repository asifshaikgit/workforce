const GetLedgerBillDashboardAnalytics = async (tenantDb) => {
    try {
        await tenantDb.raw(
            `DROP FUNCTION IF EXISTS GetLedgerBillDashboardAnalytics(
                entity_type_filter TEXT,
                payment_entity_type_filter TEXT
            );
            CREATE OR REPLACE FUNCTION GetLedgerBillDashboardAnalytics(
                entity_type_filter TEXT,
                payment_entity_type_filter TEXT
            )
            RETURNS TABLE (
                partially_paid BIGINT,
                awaiting_approval BIGINT,
                overdue BIGINT,
                raised_amount DOUBLE PRECISION,
                overdue_amount DOUBLE PRECISION,
                pending_amount DOUBLE PRECISION,
                received_amount DOUBLE PRECISION,
                over_due_percentage DOUBLE PRECISION,
                pending_amount_percentage DOUBLE PRECISION,
                received_percentage DOUBLE PRECISION
            )
            AS $$
            BEGIN 
                RETURN QUERY
                WITH 
                    partially_paid AS (
                        SELECT COUNT(*) AS partially_paid_count
                        FROM ledgers
                        WHERE status = 'Partially Paid'
                        AND entity_type = entity_type_filter
                    ),
                    awaiting_approval_ledgers AS (
                        Select COUNT(*) AS awaiting_approval_ledgers_count
                        FROM ledgers
                        WHERE status IN ('Submitted','Approval In Progress')
                        AND entity_type = entity_type_filter
                    ),
                    overdue_invoices AS (
                        SELECT COUNT(*) AS overdue_invoices_count
                        FROM ledgers
                        WHERE due_date < CURRENT_DATE 
                        AND status IN ('Submitted', 'Partially Paid')
                        AND entity_type = entity_type_filter
                    ),
                    amount_raised AS (
                        SELECT COALESCE(SUM(amount), 0) AS amount_raised
                        FROM ledgers
                        WHERE entity_type = entity_type_filter
                        AND status IN ('Submitted', 'Paid', 'Partially Paid')
                    ),
                    amount_overdue AS (
                        SELECT COALESCE(SUM(balance_amount), 0) AS amount_overdue
                        FROM ledgers 
                        WHERE due_date < CURRENT_DATE
                        AND entity_type = entity_type_filter
                        AND status IN ('Submitted', 'Partially Paid')
                    ),
                    amount_pending AS (
                        SELECT COALESCE(SUM(balance_amount), 0) AS amount_pending
                        FROM ledgers
                        WHERE entity_type = entity_type_filter
                        AND status IN ('Submitted', 'Partially Paid')
                    ),
                    amount_received AS (
                        SELECT COALESCE(SUM(total_received_amount), 0) AS amount_received
                        FROM ledger_payments
                        WHERE entity_type = payment_entity_type_filter
                    )

                SELECT 
                    (SELECT partially_paid_count FROM partially_paid),
                    (SELECT awaiting_approval_ledgers_count FROM awaiting_approval_ledgers),
                    (SELECT overdue_invoices_count FROM overdue_invoices),
                    (SELECT amount_raised FROM amount_raised),
                    (SELECT amount_overdue FROM amount_overdue),
                    (SELECT amount_pending FROM amount_pending),
                    (SELECT amount_received FROM amount_received),
                    CASE 
                        WHEN (SELECT amount_raised FROM amount_raised) != 0 
                        THEN ((SELECT amount_overdue FROM amount_overdue)::numeric / (SELECT amount_raised FROM amount_raised)) * 100 
                        ELSE 0 
                    END,
                    CASE 
                        WHEN (SELECT amount_raised FROM amount_raised) != 0
                        THEN ((SELECT amount_pending FROM amount_pending)::numeric / (SELECT amount_raised FROM amount_raised)) * 100
                        ELSE 0
                    END,
                    CASE 
                        WHEN (SELECT amount_raised FROM amount_raised) != 0 
                        THEN ((SELECT amount_received FROM amount_received)::numeric / (SELECT amount_raised FROM amount_raised)) * 100 
                        ELSE 0 
                    END;
            END;
            $$ LANGUAGE plpgsql;`
        );
    } catch (e) {
        console.log(e.message);
    }
}

module.exports = GetLedgerBillDashboardAnalytics;
