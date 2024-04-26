
const getCompanyInvoiceAmount = async (tenantDb) => {
    try {
        await tenantDb.raw(`
        DROP FUNCTION IF EXISTS GetCompanyInvoiceAmount(
            id_company UUID, 
            start_date DATE,
            end_date DATE,
            interval_val INTERVAL
            );
        CREATE OR REPLACE FUNCTION GetCompanyInvoiceAmount(
            id_company UUID, 
            start_date DATE,
            end_date DATE,
            interval_val INTERVAL
            )
    RETURNS TABLE (
        month NUMERIC,
        year NUMERIC,
        invoice_raised_amount DOUBLE PRECISION,
        payment_received_amount DOUBLE PRECISION
    ) AS $$

    BEGIN
        RETURN QUERY
        with allMonths as (
		    SELECT generate_series(start_date, end_date, interval_val) AS month_date
		),
		combinedData AS (
            SELECT 'Invoice' AS type,
                   date AS transaction_date,
                   SUM(amount) AS total_amount
            FROM ledgers
            WHERE company_id = id_company AND entity_type = 'invoice' AND  EXTRACT(YEAR FROM date) = 2023
            GROUP BY date
            
            UNION ALL
            
            SELECT 'Payment' AS type,
                   received_on AS transaction_date,
                   SUM(total_received_amount) AS total_amount
            FROM ledger_payments
            WHERE company_id = id_company AND entity_type = 'payment' AND  EXTRACT(YEAR FROM received_on) = 2023
            GROUP BY received_on
        ),
		allMonthsData as(
        SELECT EXTRACT(MONTH FROM am.month_date) AS am_month,
               EXTRACT(YEAR FROM am.month_date) AS am_year,
               COALESCE(CASE WHEN type = 'Invoice' THEN total_amount ELSE 0 END) AS total_invoice_raised,
               COALESCE(CASE WHEN type = 'Payment' THEN total_amount ELSE 0 END) AS total_received_amount
			from allMonths am
			    LEFT JOIN combinedData cd ON EXTRACT(MONTH FROM cd.transaction_date) = EXTRACT(MONTH FROM am.month_date)
                               AND EXTRACT(YEAR FROM cd.transaction_date) = EXTRACT(YEAR FROM am.month_date)
			)
		SELECT am_month, am_year, SUM(total_invoice_raised) AS total_invoice_raised, SUM(total_received_amount) AS total_payment_received
        FROM allMonthsData
        GROUP BY am_month, am_year
        ORDER BY am_month, am_year;
    
    END;
    $$ LANGUAGE plpgsql;`
        );
    } catch (e) {
        console.log(e.message);
    }
};

module.exports = getCompanyInvoiceAmount;
