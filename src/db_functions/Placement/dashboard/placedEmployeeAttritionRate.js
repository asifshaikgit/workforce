const getPlacedEmployeeAttritionRate = async (tenantDb) => {
    try {
        await tenantDb.raw(`
        DROP FUNCTION IF EXISTS  GetPlacedEmployeeAttritionRate(
            from_date DATE,
            to_date DATE,
            interval_val INTERVAL
            );
        CREATE OR REPLACE FUNCTION GetPlacedEmployeeAttritionRate(
            from_date DATE,
            to_date DATE,
            interval_val INTERVAL
            )
            RETURNS TABLE(
                year NUMERIC,
                month TEXT,
                added_employees_count BIGINT,
                attrition_employees_count BIGINT
            ) AS $$
            BEGIN
            RETURN QUERY
            SELECT
            EXTRACT(YEAR FROM calendar.month) AS year,
            TO_CHAR(calendar.month, 'Month') AS month_name,
            COALESCE(start_date_counts.employee_count, 0) AS start_date_count,
            COALESCE(end_date_counts.employee_count, 0) AS end_date_count
        FROM (
            SELECT
                generate_series(
                    COALESCE(from_date, (SELECT MIN(start_date) FROM placements)),
                    COALESCE(to_date, (SELECT MAX(end_date) FROM placements)),
                    INTERVAL '1 month'
                ) AS month
        ) AS calendar
        LEFT JOIN (
            SELECT
                EXTRACT(YEAR FROM start_date) AS year,
                EXTRACT(MONTH FROM start_date) AS month,
                COUNT(*) AS employee_count
            FROM placements
            WHERE (from_date IS NULL OR start_date BETWEEN from_date AND to_date)
            GROUP BY EXTRACT(YEAR FROM start_date), EXTRACT(MONTH FROM start_date)
        ) AS start_date_counts ON EXTRACT(YEAR FROM calendar.month) = start_date_counts.year
                                AND EXTRACT(MONTH FROM calendar.month) = start_date_counts.month
        LEFT JOIN (
            SELECT
                EXTRACT(YEAR FROM end_date) AS year,
                EXTRACT(MONTH FROM end_date) AS month,
                COUNT(*) AS employee_count
            FROM placements
            WHERE (from_date IS NULL OR end_date BETWEEN from_date AND to_date)
            GROUP BY EXTRACT(YEAR FROM end_date), EXTRACT(MONTH FROM end_date)
        ) AS end_date_counts ON EXTRACT(YEAR FROM calendar.month) = end_date_counts.year
                              AND EXTRACT(MONTH FROM calendar.month) = end_date_counts.month
        ORDER BY year, EXTRACT(MONTH FROM calendar.month);                
        END;
        $$ LANGUAGE plpgsql;`
        )
    } catch (e) {
        console.log(e.message);
    }
}

module.exports = getPlacedEmployeeAttritionRate 