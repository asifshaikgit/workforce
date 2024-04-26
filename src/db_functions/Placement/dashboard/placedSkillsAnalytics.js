const getPlacedSkillsAnalytics = async (tenantDb) => {
    try {
        await tenantDb.raw(
            `DROP FUNCTION IF EXISTS GetPlacedSkillsAnalytics();
            CREATE OR REPLACE FUNCTION GetPlacedSkillsAnalytics()
            RETURNS TABLE(
                skill_name VARCHAR,
                employees_count BIGINT,
                urls JSON
            ) AS $$
            BEGIN
            RETURN QUERY
            SELECT 
            s.name as skill_name,
            COUNT(esd.job_title_id) AS employees_count,
            json_agg(e.profile_picture_url) as urls
            FROM job_titles as s 
            JOIN placements as esd ON s.id = esd.job_title_id
            LEFT JOIN employee as e ON esd.employee_id = e.id

        GROUP BY s.id, s.name HAVING COUNT(esd.employee_id) > 0 
        ORDER BY employees_count Desc LIMIT 5;
            END;
            $$ LANGUAGE plpgsql;`
        );
    } catch (e) {
        console.log(e.message);
    }
}

module.exports = getPlacedSkillsAnalytics; 