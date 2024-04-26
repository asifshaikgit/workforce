const getLedgerPaymentDetails = async (tenantDb) => {
	try {
		await tenantDb.raw(`
		DROP FUNCTION IF EXISTS GetLedgerPaymentDetails(
			ledger_payment_id_filter UUID,
			entity_type_filter TEXT,
			ledger_entity_type_filter TEXT,
			date_format TEXT
		);
		CREATE OR REPLACE FUNCTION GetLedgerPaymentDetails(
                ledger_payment_id_filter UUID,
                entity_type_filter TEXT,
				ledger_entity_type_filter TEXT,
                date_format TEXT
            )
            RETURNS TABLE (
                id UUID,
                reference_id VARCHAR(30),
				payment_reference_number VARCHAR(255),
				debited_credits DOUBLE PRECISION,
                company_id UUID,
                company_name VARCHAR(100),
                company_available_balance DOUBLE PRECISION,
                total_received_amount DOUBLE PRECISION,
                received_on TEXT,
                total_excess_amount DOUBLE PRECISION,
				payment_mode_id INT,
                payment_mode VARCHAR(100),
                ledger_section_details JSONB,
				documents JSONB
                ) AS $$
                BEGIN
                RETURN QUERY
                SELECT
	lp.id,
	lp.reference_id,
	lp.payment_reference_number,
	lp.debited_credits,
	cmpny.id,
	cmpny.name,
	cmpny.available_balance,
	lp.total_received_amount,
	TO_CHAR(lp.received_on, date_format) as received_on, 
	lp.total_excess_amount,
	pm.id as payment_mode_id,
	pm.name as payment_mode,
	jsonb_agg(DISTINCT jsonb_build_object('id',ld.id, 'ledger_id',ld.id, 'date', TO_CHAR(ld.date, date_format), 'due_date',TO_CHAR(ld.due_date, date_format), 'invoice_id', ld.reference_id, 'amount', ld.amount, 'balance_amount', ld.balance_amount, 'balance_amount_total', ld.balance_amount, 'hours', subquery.total_hours, 'ledger_payment_section_details_id', lpsd.id, 'received_amount_previous', subquery_amount.total_received_amount, 'received_amount', COALESCE(lpsd.received_amount, 0), 'status', ld.status)) as ledger_payment_section_details,
	jsonb_agg(DISTINCT jsonb_build_object('id', lpd.id, 'ledger_payment_id' , lpd.ledger_payment_id, 'document_name', lpd.document_name, 'document_url', lpd.document_url)) as documents
	from ledger_payments as lp
	LEFT JOIN companies as cmpny on lp.company_id = cmpny.id
	LEFT JOIN payment_modes as pm on lp.payment_mode_id = pm.id
	LEFT JOIN ledgers as ld on lp.company_id = ld.company_id AND ld.entity_type = ledger_entity_type_filter AND (ld.status = 'Partially Paid' OR ld.status = 'Approved' OR (ld.status = 'Paid' AND ld.id = (
		Select lpsd.ledger_id from ledger_payment_section_details as lpsd where ledger_payment_id = ledger_payment_id_filter AND ld.id = lpsd.ledger_id
	)))
	LEFT JOIN ledger_payment_section_details as lpsd on lp.id = lpsd.ledger_payment_id AND lpsd.ledger_id = ld.id
	LEFT JOIN ledger_payment_documents as lpd on lp.id = lpd.ledger_payment_id
	LEFT JOIN
		(
			SELECT 
			lpsd.id AS id,
			SUM(lid.hours) AS total_hours
			FROM
			ledger_payment_section_details AS lpsd
			LEFT JOIN ledgers AS ld ON lpsd.ledger_id = ld.id
			LEFT JOIN ledger_item_details AS lid ON ld.id = lid.ledger_id
			GROUP BY
        	lpsd.ledger_payment_id,
			lpsd.id
		) AS subquery ON lpsd.id = subquery.id
	LEFT JOIN
	(
		SELECT 
			ld_all.id AS ld_id,
			SUM(lpsd_all.received_amount) AS total_received_amount
		FROM
			ledger_payment_section_details AS lpsd_all
		LEFT JOIN ledgers AS ld_all ON lpsd_all.ledger_id = ld_all.id
		GROUP BY
			ld_all.id
	) AS subquery_amount ON subquery_amount.ld_id = ld.id
	where lp.id = ledger_payment_id_filter
    AND lp.entity_type = entity_type_filter
	GROUP BY cmpny.name, 
			 cmpny.available_balance, 
			 lp.total_received_amount,
			 lp.received_on,
			 lp.id,
			 pm.id,
			 pm.name,
			 cmpny.id;
             END;
             $$ LANGUAGE plpgsql;`
		)
	} catch (e) {
		console.log(e.message);
	}
}

module.exports = getLedgerPaymentDetails;