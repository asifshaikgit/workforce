const { responseMessages } = require('../../../../../constants/responseMessage');
const indexRepository = require('../../repositories/index');
const countries = require('../../controllers/configurations/location/countryController')
const moment = require('moment');
const format = require('../../../../../helpers/format');


/**
 * Employee Analytics function to get the employee information of employment type contractor and consultant.
 * 
 * Logic:
 * Call the stored DB funtion to get the employee information
 */
const placedEmployeeAnalytics = async () => {

    const employeeAalytics = await indexRepository.rawQuery(`Select * FROM GetPlacedEmployeeAnalytics()`);
    if (employeeAalytics && employeeAalytics.status == false) {
        return {
            status: false,
            message: responseMessages.common.somethindWentWrong
        }
    } else {
        return {
            status: true,
            data: {
                employeeAalytics
            }
        }
    }
}

/**
 * Skills Analytics gets the total count of employees places for each skill.
 * 
 * Logic:
 * Call the stored DB funtion to get the employee information
 */
const placedSkillsAnalytics = async (condition) => {

    let query
    let dateFormat = await format.getDateFormat();
    let todayDate = moment().format('YYYY-MM-DD')
    const from_date = moment(condition.from_date, dateFormat).format('YYYY-MM-DD');
    const to_date = moment(condition.to_date, dateFormat).format('YYYY-MM-DD');
    if(condition.from_date != '' && condition.to_date != ''){
        query = `SELECT s.name as skill_name, COUNT(esd.job_title_id) AS employees_count, json_agg(e.profile_picture_url) as urls FROM job_titles as s JOIN placements as esd ON s.id = esd.job_title_id LEFT JOIN employee as e ON esd.employee_id = e.id WHERE esd.start_date >= '${from_date}' AND esd.start_date <= '${to_date}' GROUP BY s.id, s.name HAVING COUNT(esd.employee_id) > 0 ORDER BY employees_count Desc LIMIT 5;`
    }
    else{
        query = `SELECT s.name as skill_name, COUNT(esd.job_title_id) AS employees_count, json_agg(e.profile_picture_url) as urls FROM job_titles as s JOIN placements as esd ON s.id = esd.job_title_id LEFT JOIN employee as e ON esd.employee_id = e.id GROUP BY s.id, s.name HAVING COUNT(esd.employee_id) > 0 ORDER BY employees_count Desc LIMIT 5;`
    }
    const skillsAnalytics = await indexRepository.rawQuery(query);

    if (skillsAnalytics && skillsAnalytics.status == false) {
        return {
            status: false,
            message: responseMessages.common.somethindWentWrong
        }
    } else {
        return {
            status: true,
            data: {
                skillsAnalytics
            }
        }
    }
}

/**
 * Placed Employee Attrition Rate to get the total count of employees added and are going ended for a placement
 * 
 * Logic:
 * Call the stored DB funtion to get the employee information
 */
const placedEmployeeAttritionRate = async (condition) => {

    let query = `SELECT * FROM GetPlacedEmployeeAttritionRate(`;
    query += (condition.from_date && condition.to_date) ? `'${condition.from_date}', '${condition.to_date}','${condition.interval}')` : `${condition.from_date}, ${condition.to_date}, null)`;

    let placedEmployeeAtritionRate = await indexRepository.rawQuery(query);

    if (placedEmployeeAtritionRate && placedEmployeeAtritionRate.status == false) {
        return {
            status: false,
            message: responseMessages.common.somethindWentWrong
        }
    } else {
        return {
            status: true,
            data: {
                placedEmployeeAtritionRate
            }
        }
    }
}

const statusAnalytics = async (condition) => {

    return await getPlacementCounts(condition);
}

async function getPlacementCounts(condition) {

    let totalPlacements;
    let activePlacements;
    let endedPlacements;
    let query = "SELECT ";
    const totalPlacementsQuery = `${query} COUNT(*) AS total_placements FROM placements`;
    const totalActivePlacementsQuery = `${query} COUNT(*) AS active_placements FROM placements`;
    const totalEndedPlacementsQuery = `${query} COUNT(*) AS ended_placements FROM placements`;
    let whereClause = "WHERE deleted_at IS NULL";

    if (condition.from_date && condition.to_date) {
        whereClause += ` AND end_date BETWEEN '${condition.from_date}' AND '${condition.to_date}'`;
    } else {
        if (condition.status_type == 'ending_in_placements') {
            whereClause += ` AND end_date >= '${condition.current_date}'`;
        } else if (condition.status_type == 'ended_placements') {
            whereClause += ` AND end_date < '${condition.current_date}'`;
        }
    }
    if (condition.status_type == 'total_placements') {
        totalPlacements = await indexRepository.rawQuery(`${totalPlacementsQuery} ${whereClause}`);
    } else if (condition.status_type == 'ending_in_placements') {
        whereClause += ` AND end_date >= CURRENT_DATE`
        activePlacements = await indexRepository.rawQuery(`${totalActivePlacementsQuery} ${whereClause}`);
    } else if (condition.status_type == 'ended_placements') {
        whereClause += ` AND end_date < CURRENT_DATE`
        endedPlacements = await indexRepository.rawQuery(`${totalEndedPlacementsQuery} ${whereClause}`);
    } else {
        totalPlacements = await indexRepository.rawQuery(`${totalPlacementsQuery} ${whereClause}`);
        activePlacements = await indexRepository.rawQuery(`${totalActivePlacementsQuery} ${whereClause}  AND end_date >= '${condition.current_date}'`);
        endedPlacements = await indexRepository.rawQuery(`${totalEndedPlacementsQuery} ${whereClause} AND end_date < '${condition.current_date}'`);
    }

    if ((totalPlacements && totalPlacements.status == false) || (activePlacements && activePlacements.status == false) || (endedPlacements && endedPlacements.status)) {
        return {
            status: false,
            message: responseMessages.common.somethindWentWrong
        }

    } else {

        return {
            status: true,
            data: {
                total_placements: totalPlacements?.[0].total_placements,
                active_placements: activePlacements?.[0].active_placements,
                ending_in_placements: activePlacements?.[0].active_placements,
                ended_placements: endedPlacements?.[0].ended_placements
            }
        };
    }
}

async function getStateWisePlacementCount() {

    let groupbyQuery = 'select count(work_location_state_id), statename, work_location_country_id from (SELECT work_location_state_id, (select name from states where id = work_location_state_id) as statename, work_location_country_id FROM placements where work_location_country_id IN (233)) as x group by x.statename,x.work_location_country_id'

    let total_count;
    total_count = await indexRepository.rawQuery(`${groupbyQuery}`);
    let obj = {}
    for (let i = 0; i < total_count.length; i++) {
        obj[total_count[i].statename] = total_count[i].count
    }
    return obj;
}

async function getEmployeeVisaCount() {

    let groupbyQuery = 'SELECT COUNT(visa_type_id), visa_types.name FROM employee join visa_types on visa_types.id = employee.visa_type_id GROUP BY visa_type_id, visa_types.id '

    let total_count;
    total_count = await indexRepository.rawQuery(`${groupbyQuery}`);
    return total_count
        ;
}

async function getAdditionandAttritionCount(condition) {
    let dateFormat = await format.getDateFormat();
    let todayDate = moment().format('YYYY-MM-DD')
    const from_date = moment(condition.from_date, dateFormat).format('YYYY-MM-DD');
    const to_date = moment(condition.to_date, dateFormat).format('YYYY-MM-DD');
    let queryForActive
    let queryForInActive 

    if(condition.from_date != '' && condition.to_date != ''){
        queryForActive = `SELECT countValue,case when visaname IS NULL Then 'Others' ELSE visaname END name FROM (select count(pt.id) as countValue, vt.name as visaname from placements pt join employee emp on emp.id = pt.employee_id left join visa_types vt on vt.id = emp.visa_type_id WHERE pt.start_date >= '${from_date}' AND pt.start_date <= '${to_date}' group by vt.id order by visaname ) X`
        queryForInActive = `SELECT countValue,case when visaname IS NULL Then 'Others' ELSE visaname END name FROM (select count(pt.id) as countValue, vt.name as visaname from placements pt join employee emp on emp.id = pt.employee_id left join visa_types vt on vt.id = emp.visa_type_id WHERE pt.end_date >= '${from_date}' AND pt.end_date <= '${to_date}' group by vt.id order by visaname ) X`
    }
    else{
        queryForActive = `SELECT countValue,case when visaname IS NULL Then 'Others' ELSE visaname END name FROM (select count(pt.id) as countValue, vt.name as visaname from placements pt join employee emp on emp.id = pt.employee_id left join visa_types vt on vt.id = emp.visa_type_id WHERE pt.start_date <= '${todayDate}' group by vt.id order by visaname ) X`
        queryForInActive = `SELECT countValue,case when visaname IS NULL Then 'Others' ELSE visaname END name FROM (select count(pt.id) as countValue, vt.name as visaname from placements pt join employee emp on emp.id = pt.employee_id left join visa_types vt on vt.id = emp.visa_type_id WHERE pt.end_date >= '${todayDate}' group by vt.id order by visaname ) X`
    }


    let active = await indexRepository.rawQuery(`${queryForActive}`);
    let inActive = await indexRepository.rawQuery(`${queryForInActive}`);

    let totalCountActive = 0;

    active.forEach(item => {
        totalCountActive += Number(item.countvalue);
    });

    let totalCountInactive = 0;

    inActive.forEach(item => {
        totalCountInactive += Number(item.countvalue);
    });

    return {
        active: active,
        in_active: inActive,
        totalCountActive: totalCountActive,
        totalCountInactive: totalCountInactive
    }
        ;
}

const graphplacedEmployeeAttritionRate = async (condition) => {

    let query = `SELECT * FROM GetPlacedEmployeeAttritionRate(`;
    query += (condition.from_date && condition.to_date) ? `'${condition.from_date}', '${condition.to_date}','${condition.interval}')` : `${condition.from_date}, ${condition.to_date}, null)`;

    let placedEmployeeAtritionRate = await indexRepository.rawQuery(query);

    let labels = []
    let AdditionSets = []
    let AttritionSets = []

    placedEmployeeAtritionRate.forEach((i) => {
        labels.push(i.month.slice(0, 3))
        AdditionSets.push(i.added_employees_count)
        AttritionSets.push(i.attrition_employees_count)
    })

    if (placedEmployeeAtritionRate && placedEmployeeAtritionRate.status == false) {
        return {
            status: false,
            message: responseMessages.common.somethindWentWrong
        }
    } else {
        return {
            labels: labels,
            AdditionSets: AdditionSets,
            AttritionSets: AttritionSets
        }
        // {
        //     status: true,
        //     data: {
        //         placedEmployeeAtritionRate
        //     }
        // }
    }
}

module.exports = { placedEmployeeAnalytics, placedSkillsAnalytics, placedEmployeeAttritionRate, statusAnalytics, getStateWisePlacementCount, getEmployeeVisaCount, getAdditionandAttritionCount, graphplacedEmployeeAttritionRate }