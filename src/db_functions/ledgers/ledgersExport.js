const ledgersExport = async (tenantDb) => {
    try {
        await tenantDb.raw(`
        DROP FUNCTION IF EXISTS getledgersExportData(
            entity_type_filter TEXT,
            company_id_filter UUID,
            from_date_filter TIMESTAMP,
            to_date_filter TIMESTAMP
        );
        CREATE OR REPLACE FUNCTION
        getledgersExportData(
            entity_type_filter TEXT,
            company_id_filter UUID,
            from_date_filter TIMESTAMP,
            to_date_filter TIMESTAMP
        )
        RETURNS TABLE (
            company_name VARCHAR(100),
            payment_id VARCHAR(30),
            invoice_id VARCHAR(20),
            client_id VARCHAR(25),
            status TEXT,
            timesheet_id JSONB
        ) AS $$
        BEGIN
        RETURN QUERY
        Select 
 	subquery.company_name, 
	subquery.payment_id,
	subquery.invoice_id,
	subquery.client_id,
	subquery.status,
	(
		SELECT jsonb_agg(reference_id)
		FROM timesheets
		WHERE timesheets.id = ANY(ARRAY(SELECT jsonb_array_elements_text(subquery.timesheet_ids)::uuid))
	) AS timesheet_id
	from
	(
		Select 
			cmp.name as company_name, 
			lp.reference_id as payment_id,
			ld.reference_id as invoice_id,
			cmp.reference_id client_id,
			ld.status as status,
		(
			SELECT jsonb_agg(DISTINCT th.timesheet_id)
			FROM ledger_item_details AS lid
			LEFT JOIN timesheet_hours AS th ON th.id = ANY(lid.timesheet_hour_ids)
			WHERE lid.ledger_id = lpsd.ledger_id
		) AS timesheet_ids
		from ledger_payments as lp
		left join companies as cmp on lp.company_id = cmp.id
		left join ledger_payment_section_details as lpsd on lp.id = lpsd.ledger_payment_id
		left join ledgers as ld on lpsd.ledger_id = ld.id
		where lp.entity_type = entity_type_filter
        AND 
        (company_id_filter IS NULL OR ld.company_id = company_id_filter) AND 
        (
            (from_date_filter IS NOT NULL AND to_date_filter IS NOT NULL AND ld.date BETWEEN from_date_filter AND to_date_filter)
            OR (from_date_filter IS NULL OR to_date_filter IS NULL)
        )
		group by cmp.name, lp.reference_id, cmp.reference_id, ld.reference_id, ld.status, lp.id, lpsd.ledger_id
	) as subquery;
    END;
    $$ LANGUAGE plpgsql;	
        `);
    } catch (e) {
        console.log(e.message);
    }
}
module.exports = ledgersExport;