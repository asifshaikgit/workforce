
const getCompanyDashboardData = async (tenantDb) => {
    try {
        await tenantDb.raw(`
        DROP FUNCTION IF EXISTS GetCompanyDashboardData(id_company uuid);
        CREATE OR REPLACE FUNCTION GetCompanyDashboardData(id_company uuid)
    RETURNS TABLE (
        total_invoice_raised DOUBLE PRECISION,
        received_amount DOUBLE PRECISION
    ) AS $$

    BEGIN
        RETURN QUERY
        with combinedData as (
            select 'Invoice' AS type, sum(amount) as total_amount from ledgers where company_id=id_company union all
            select 'Payment' AS type, sum(total_received_amount) as total_amount from ledger_payments where company_id=id_company
        ) 
        select COALESCE(SUM(CASE WHEN type = 'Invoice' THEN total_amount ELSE 0 END), 0) AS total_invoice_raised, COALESCE(SUM(CASE WHEN type = 'Payment' THEN total_amount ELSE 0 END), 0) AS received_amount from combinedData;
    END;
    $$ LANGUAGE plpgsql;`
        );
    } catch (e) {
        console.log(e.message);
    }
};

module.exports = getCompanyDashboardData;
