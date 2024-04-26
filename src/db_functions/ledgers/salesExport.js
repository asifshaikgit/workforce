const salesExport = async (tenantDb) => {
    try {
        await tenantDb.raw(`
            DROP FUNCTION IF EXISTS getSalesExportData(
                entity_type_filter TEXT,
                company_id_filter UUID,
                from_date_filter TIMESTAMP,
                to_date_filter TIMESTAMP
            );
            CREATE OR REPLACE FUNCTION 
            getSalesExportData(
                entity_type_filter TEXT,
                company_id_filter UUID,
                from_date_filter TIMESTAMP,
                to_date_filter TIMESTAMP
            )
            RETURNS TABLE (
                company_name VARCHAR(100),
                invoice_id VARCHAR(20),
                employee_name JSONB,
                employee_id JSONB,
                client_id VARCHAR(25),
                status TEXT,
                timesheet_id JSONB
            ) AS $$
            BEGIN
            RETURN QUERY
                SELECT 
                    subquery.company_name,
                    subquery.invoice_id,
                    subquery.employee_name,
                    subquery.employee_id,
                    subquery.client_id,
                    subquery.status,
                    (
                        SELECT jsonb_agg(reference_id)
                        FROM timesheets
                        WHERE timesheets.id = ANY(ARRAY(SELECT jsonb_array_elements_text(subquery.timesheet_ids)::uuid))
                    ) AS timesheet_id
                FROM (
                    SELECT 
                        c.name AS company_name,
                        ld.reference_id AS invoice_id,
                        (
                            SELECT jsonb_agg(emp.display_name)
                            FROM ledger_item_details AS lid
                            LEFT JOIN placements AS plc ON lid.placement_id = plc.id
                            LEFT JOIN employee AS emp ON plc.employee_id = emp.id
                            WHERE lid.ledger_id = ld.id
                        ) AS employee_name,
                        (
                            SELECT jsonb_agg(emp.reference_id)
                            FROM ledger_item_details AS lid
                            LEFT JOIN placements AS plc ON lid.placement_id = plc.id
                            LEFT JOIN employee AS emp ON plc.employee_id = emp.id
                            WHERE lid.ledger_id = ld.id
                        ) AS employee_id,
                        c.reference_id AS client_id,
                        ld.status,
                        ld.id,
                        (
                            SELECT jsonb_agg(DISTINCT th.timesheet_id)
                            FROM ledger_item_details AS lid
                            LEFT JOIN timesheet_hours AS th ON th.id = ANY(lid.timesheet_hour_ids)
                            WHERE lid.ledger_id = ld.id
                        ) AS timesheet_ids
                    FROM ledgers AS ld
                    LEFT JOIN companies AS c ON ld.company_id = c.id
                    WHERE ld.entity_type = entity_type_filter 
                    AND 
                    (company_id_filter IS NULL OR ld.company_id = company_id_filter) AND 
                    (
                        (from_date_filter IS NOT NULL AND to_date_filter IS NOT NULL AND ld.date BETWEEN from_date_filter AND to_date_filter)
                        OR (from_date_filter IS NULL OR to_date_filter IS NULL)
                    )
                ) AS subquery;
            END;
            $$ LANGUAGE plpgsql;
        `);
    } catch (e) {
        console.log(e.message);
    }
};

module.exports = salesExport;
