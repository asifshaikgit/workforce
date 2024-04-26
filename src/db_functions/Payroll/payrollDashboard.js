
const getPayrollDashboard = async (tenantDb) => {

    try {
        await tenantDb.raw(`
        DROP FUNCTION IF EXISTS getPayrollDashboard(
            date_format TEXT
        );
        CREATE OR REPLACE FUNCTION getPayrollDashboard(
                date_format TEXT
            )
            RETURNS TABLE (
                Drafted JSONB,
                Pending JSONB,
                Upcoming BIGINT,
                Skipped BIGINT,
                Summary BIGINT
               
            ) AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    jsonb_agg(DISTINCT jsonb_build_object(
                        'id', pc.id,
                        'pay_config_setting_id', pc.pay_config_setting_id,
                        'pay_config_setting_name', pcs.name,
                        'from_date', TO_CHAR(pc.from_date, date_format),
                        'to_date', TO_CHAR(pc.to_date, date_format),
                        'check_date', TO_CHAR(pc.check_date, date_format),
                        'status', pc.status
                    )) FILTER (WHERE pc.status = 'Drafted') AS Drafted,
                    jsonb_agg(DISTINCT jsonb_build_object(
                        'id', pc.id,
                        'pay_config_setting_id', pc.pay_config_setting_id,
                        'pay_config_setting_name', pcs.name,
                        'from_date', TO_CHAR(pc.from_date, date_format),
                        'to_date', TO_CHAR(pc.to_date, date_format),
                        'check_date', TO_CHAR(pc.check_date, date_format),
                        'status', pc.status
                    )) FILTER (WHERE pc.status = 'Yet to generate' AND CAST(pc.check_date AS DATE) <= CURRENT_DATE) AS Pending,
                    (
                        SELECT COUNT(*)
                        FROM payroll_configuration
                        WHERE payroll_configuration.status = 'Yet to generate' AND CAST(payroll_configuration.check_date AS DATE) > CURRENT_DATE
                    ) AS Upcoming,             
                    (
                        SELECT COUNT(*)
                        FROM payroll_configuration AS payConfig
                        WHERE payConfig.status = 'Skipped' AND payConfig.deleted_at IS NULL
                    ) AS Skipped,
                    (
                        SELECT COUNT(*)
                        FROM payroll_configuration AS payConfig
                        WHERE payConfig.status = 'Submitted' AND payConfig.deleted_at IS NULL
                    ) AS Summary
                    
                FROM payroll_configuration AS pc
                INNER JOIN payroll_config_settings AS pcs ON pcs.id = pc.pay_config_setting_id
                ORDER BY MIN(pc.check_date) ASC; -- Use MIN() to get the earliest check_date for ordering
            END;
            $$ LANGUAGE plpgsql;
            `
        )
    } catch (e) {
        console.log(e.message);
    }
};

module.exports = getPayrollDashboard;