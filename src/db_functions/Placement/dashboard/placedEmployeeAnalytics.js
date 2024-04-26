const getPlacedEmployeeAnalytics = async (tenantDb) => {
    try {
        await tenantDb.raw(`
        DROP FUNCTION IF EXISTS  GetPlacedEmployeeAnalytics();
        CREATE OR REPLACE FUNCTION GetPlacedEmployeeAnalytics()
            RETURNS TABLE(
                total_employees BIGINT,
                employees_in_training BIGINT,
                employees_in_marketing BIGINT,
                employees_in_project BIGINT
            ) AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    COUNT(*) AS total_employees, 
                    SUM(0) AS employees_in_training,
                    SUM(CASE WHEN sub_status = 'Marketing' THEN 1 ELSE 0 END) AS employees_in_marketing,
                    SUM(CASE WHEN sub_status = 'Placed' THEN 1 ELSE 0 END) AS employees_in_project 
                FROM employee 
                WHERE deleted_at IS NULL;
            END;
            $$ LANGUAGE plpgsql;`
        );
    } catch (e) {
        console.log(e.message);
    }
}

module.exports = getPlacedEmployeeAnalytics 