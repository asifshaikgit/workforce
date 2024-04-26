
const getPayrollList = async (tenantDb) => {

    try {
        await tenantDb.raw(`
        DROP FUNCTION IF EXISTS getPayrollList(
            status_filter TEXT,
            date_format TEXT,
            page_size INT,
            page_number INT,
            sort_order TEXT
);
        CREATE OR REPLACE FUNCTION getPayrollList(
                status_filter TEXT,
                date_format TEXT,
                page_size INT,
                page_number INT,
                sort_order TEXT
 )
            RETURNS TABLE (
                id INT,
                pay_config_setting_id INT,
                pay_config_setting_name VARCHAR(50),
                from_date TEXT,
                to_date TEXT,
                check_date TEXT,
                status TEXT,
                is_adhoc BOOLEAN,
                total_payroll_count BIGINT
            ) AS $$
            BEGIN
                RETURN QUERY
                select 
                pc.id,
                pc.pay_config_setting_id,
                pcs.name as pay_config_setting_name,
                TO_CHAR(pc.from_date, date_format) AS from_date,
                TO_CHAR(pc.to_date, date_format) AS to_date,
                TO_CHAR(pc.check_date, date_format) AS check_date,
                pc.status,
                pc.is_adhoc,
                (
                    SELECT COUNT(*)
                    FROM payroll_configuration AS payConfig
                    LEFT JOIN payroll_config_settings AS payConfigSett ON payConfigSett.id = payConfig.pay_config_setting_id
                  WHERE
                    (
                        payConfig.status = status_filter
                    )
                    AND payConfig.deleted_at IS NULL
                  ) AS total_payroll_count
                
                FROM payroll_configuration as pc
                INNER JOIN payroll_config_settings AS pcs on pcs.id = pc.pay_config_setting_id
                where
                (
                    status_filter IS NULL
                    OR (pc.status = status_filter) 
                ) and 
                (
                  status_filter <> 'Yet to generate'
                  OR CAST(pc.check_date AS DATE) <= CURRENT_DATE
                )
                AND pc.deleted_at IS NULL
                Group by pc.pay_config_setting_id, pc.id, pcs.name
                ORDER BY 
                CASE WHEN sort_order = 'asc' THEN pc.check_date END ASC,
                CASE WHEN sort_order = 'desc' THEN pc.check_date END DESC
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
};

module.exports = getPayrollList;