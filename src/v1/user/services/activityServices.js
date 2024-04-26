const moment = require('moment');
const indexRepository = require('../repositories/index');
const format = require('../../../../helpers/format');


/**
 * Listing Function to get activity information data.
 * Logic:
 * - Fetch the data from the 'activity' table using query(parameter) by calling a database function.
 *  - If data exists,
 *    + Map the data and add referrable name to the object.
 *    + Prepare the response.
 *    + Return the response with status as true.
 *  - Else
 *    + Return the response with status as false.
 *
 * @param {object} query - The query parameters to filter the activity information data.
 * @param {number} page - The page number of the results to retrieve.
 * @param {number} limit - The maximum number of results per page.
 * @param {string} date_format - The format of the date.
 * @returns {object} - An object containing the retrieved activity information data, pagination details, and status.
 */
const employeeActivitylisting = async (query, page, limit, date_format) => {

    let rawquery = `SELECT * FROM getEmployeeActivityInformation(`;
    rawquery += (query.employee_id !== null) ? `'${query.employee_id}',` : `${query.employee_id},`;
    rawquery += (query.search !== null) ? `'${query.search}',` : `${query.search},`;
    rawquery += `'${date_format}', ${limit}, ${page})`;

    var activityListing = await indexRepository.rawQuery(rawquery);
    if (activityListing.length > 0) {
        const activity_count = activityListing[0]?.total_activity_count; // for pagination
        await Promise.all(activityListing.map(async (activity) => { // to make sure all values are mapped
            delete activity.total_activity_count; // deleting the count
        }));

        if (activity_count !== undefined && activity_count !== null) {
            pagination_details = {
                total: parseInt(activity_count),
                currentPage: page,
                perPage: limit,
                totalPages: Math.ceil(activity_count / limit)
            };
        }

        return {
            status: true,
            data: activityListing,
            pagination_data: pagination_details
        }
    } else {
        return { status: false, data: activityListing };
    }
}

// to get name of the employee mapped to the 
const getemployeeReferrableName = async (activity) => {

    let table;
    let name;

    switch (activity.referrable_type_name) {
        case 'Emergency Contact Details':
            table = "emergency_contact_information"; // table
            name = "name";// column name
            break;
        case 'Passport Details':
            table = "employee_passport_details";
            name = "Passport";
            break;
        case 'I-94 Details':
            table = "employee_i94_details";
            name = "I-94";
            break;
        case 'Visa Details':
            table = "employee_visa_details";
            name = "Visa";
            break;
        case 'Education Details':
            table = "employee_education_details";
            name = "Education";
            break;
        case 'Personal Documents':
            table = "employee_personal_documents";
            name = "Personal Documents";
            break;
        case 'Bank Details':
            table = "employee_bank_account_details";
            name = "bank_name";
            break;
        case 'Dependent Details':
            table = "employee_dependent_details";
            name = "name";
            break;
        case 'Vacation Details':
            table = "employee_vacation";
            name = "name";
            break;
        case 'Skill Details':
            table = "employee_skill_details";
            name = "skills";
            break;
        case 'Contact Details':
            table = "employee_skill_details";
            name = "contacts";
            break;
        default:
            table = "unknown_table";
            name = "name";
            break;
    }


    if (table != 'employee_passport_details' && table != 'employee_i94_details' && table != 'employee_education_details' && table != 'employee_visa_details' && table != 'employee_personal_documents' && table != 'employee_dependent_details' && table != 'employee_skill_details' && table != 'unknown_table' && table != 'unknown_table') { // if not these tables since these do not contain names we assign name static way
        let joins = [
            { table: `${table} as e`, alias: 'e', condition: ['e.id', 'employee_profile_activity_track.referrable_type_id'], type: 'left' }
        ]

        var data = await indexRepository.find('employee_profile_activity_track', [`e.${name}`], { 'employee_profile_activity_track.id': activity.id }, null, joins, null, null, null, false)
        name = data.data[0][name] // name column in a dynamic way2 mins
    } else if (table == 'employee_dependent_details') {
        let joins = [
            { table: `${table} as e`, alias: 'e', condition: ['e.id', 'employee_profile_activity_track.referrable_type_id'], type: 'left' },
            { table: `relationship_types as r`, alias: 'r', condition: ['r.id', 'e.relationship_id'], type: 'left' }
        ]

        var data = await indexRepository.find('employee_profile_activity_track', [`r.${name}`], { 'employee_profile_activity_track.id': activity.id }, null, joins, null, null, null, false)
        name = data.data[0][name] // name column in a dynamic way
    }
    return name
}

/**
 * Listing Function to get activity information data.
 * Logic:
 * - Fetch the data from the 'activity' table using query(parameter) by calling a database function.
 *  - If data exists,
 *    + Map the data and add referrable name to the object.
 *    + Prepare the response.
 *    + Return the response with status as true.
 *  - Else
 *    + Return the response with status as false.
 *
 * @param {object} query - The query parameters to filter the activity information data.
 * @param {number} page - The page number of the results to retrieve.
 * @param {number} limit - The maximum number of results per page.
 * @param {string} date_format - The format of the date.
 * @returns {object} - An object containing the retrieved activity information data, pagination details, and status.
 */
const companyActivitylisting = async (query, page, limit, date_format) => {

    let rawquery = `SELECT * FROM getCompanyActivityInformation(`;
    rawquery += (query.company_id !== null) ? `'${query.company_id}',` : `${query.company_id},`;
    rawquery += (query.slug_name !== null) ? `'${query.slug_name}',` : `${query.slug_name},`;
    rawquery += `'${date_format}', ${limit}, ${page})`;

    var activityListing = await indexRepository.rawQuery(rawquery);
    if (activityListing.length > 0) {
        const activity_count = activityListing[0]?.total_activity_count; // for pagination
        await Promise.all(activityListing.map(async (activity) => { // to make sure all values are mapped
            delete activity.total_activity_count; // deleting the count
        }));

        if (activity_count !== undefined && activity_count !== null) {
            pagination_details = {
                total: parseInt(activity_count),
                currentPage: page,
                perPage: limit,
                totalPages: Math.ceil(activity_count / limit)
            };
        }

        return {
            status: true,
            data: activityListing,
            pagination_data: pagination_details
        }
        // }
    } else {
        return { status: false, data: activityListing }
    }
}

/**
 * Listing Function to get activity information data.
 * Logic:
 * - Fetch the data from the 'activity' table using query(parameter) by calling a database function.
 *  - If data exists,
 *    + Map the data and add referrable name to the object.
 *    + Prepare the response.
 *    + Return the response with status as true.
 *  - Else
 *    + Return the response with status as false.
 *
 * @param {object} query - The query parameters to filter the activity information data.
 * @param {number} page - The page number of the results to retrieve.
 * @param {number} limit - The maximum number of results per page.
 * @param {string} date_format - The format of the date.
 * @returns {object} - An object containing the retrieved activity information data, pagination details, and status.
 */
const timesheetActivitylisting = async (query, page, limit, date_format) => {

    let rawquery = `SELECT * FROM getTimesheetActivityInformation(`;
    rawquery += (query.timesheet_id !== null) ? `'${query.timesheet_id}',` : `${query.timesheet_id},`;
    rawquery += `'${date_format}', ${limit}, ${page})`;

    var activityListing = await indexRepository.rawQuery(rawquery);
    if (activityListing.length > 0) {
        const activity_count = activityListing[0]?.total_activity_count; // for pagination
        await Promise.all(activityListing.map(async (activity) => { // to make sure all values are mapped
            delete activity.total_activity_count; // deleting the count
        }));

        if (activity_count !== undefined && activity_count !== null) {
            pagination_details = {
                total: parseInt(activity_count),
                currentPage: page,
                perPage: limit,
                totalPages: Math.ceil(activity_count / limit)
            };
        }

        return {
            status: true,
            data: activityListing,
            pagination_data: pagination_details
        }
        // }
    } else {
        return { status: false, data: activityListing }
    }
}

// /**
//  * Listing Function to get activity information data.
//  * Logic:
//  * - Fetch the data from the 'activity' table using query(parameter) by calling a database function.
//  *  - If data exists,
//  *    + Map the data and add referrable name to the object.
//  *    + Prepare the response.
//  *    + Return the response with status as true.
//  *  - Else
//  *    + Return the response with status as false.
//  *
//  * @param {object} query - The query parameters to filter the activity information data.
//  * @param {number} page - The page number of the results to retrieve.
//  * @param {number} limit - The maximum number of results per page.
//  * @param {string} date_format - The format of the date.
//  * @returns {object} - An object containing the retrieved activity information data, pagination details, and status.
//  */
// const timesheetApprovalActivitylisting = async (query, page, limit, date_format) => {

//     let rawquery = `SELECT * FROM getTimesheetApprovalActivityInformation(`;
//     rawquery += (query.timesheet_id !== null) ? `'${query.timesheet_id}',` : `${query.timesheet_id},`;
//     rawquery += `'${date_format}', ${limit}, ${page})`;

//     var activityListing = await indexRepository.rawQuery(rawquery);
//     if (activityListing.length > 0) {
//         const activity_count = activityListing[0]?.total_activity_count; // for pagination
//         await Promise.all(activityListing.map(async (activity) => { // to make sure all values are mapped
//             delete activity.total_activity_count; // deleting the count
//         }));

//         if (activity_count !== undefined && activity_count !== null) {
//             pagination_details = {
//                 total: parseInt(activity_count),
//                 currentPage: page,
//                 perPage: limit,
//                 totalPages: Math.ceil(activity_count / limit)
//             };
//         }

//         return {
//             status: true,
//             data: activityListing,
//             pagination_data: pagination_details
//         }
//     } else {
//         return { status: false, data: activityListing }
//     }
// }

// /**
//  * Listing Function to get activity information data.
//  * Logic:
//  * - Fetch the data from the 'activity' table using query(parameter) by calling a database function.
//  *  - If data exists,
//  *    + Map the data and add referrable name to the object.
//  *    + Prepare the response.
//  *    + Return the response with status as true.
//  *  - Else
//  *    + Return the response with status as false.
//  *
//  * @param {object} query - The query parameters to filter the activity information data.
//  * @param {number} page - The page number of the results to retrieve.
//  * @param {number} limit - The maximum number of results per page.
//  * @param {string} date_format - The format of the date.
//  * @returns {object} - An object containing the retrieved activity information data, pagination details, and status.
//  */
// const ledgerApprovalActivitylisting = async (query, page, limit, date_format) => {

//     let rawquery = `SELECT * FROM getledgerApprovalActivityInformation(`;
//     rawquery += (query.ledger_id !== null) ? `'${query.ledger_id}',` : `${query.ledger_id},`;
//     rawquery += `'${date_format}', ${limit}, ${page})`;

//     var activityListing = await indexRepository.rawQuery(rawquery);
//     if (activityListing.length > 0) {
//         const activity_count = activityListing[0]?.total_activity_count; // for pagination
//         await Promise.all(activityListing.map(async (activity) => { // to make sure all values are mapped
//             delete activity.total_activity_count; // deleting the count
//         }));

//         if (activity_count !== undefined && activity_count !== null) {
//             pagination_details = {
//                 total: parseInt(activity_count),
//                 currentPage: page,
//                 perPage: limit,
//                 totalPages: Math.ceil(activity_count / limit)
//             };
//         }

//         return {
//             status: true,
//             data: activityListing,
//             pagination_data: pagination_details
//         }
//     } else {
//         return { status: false, data: activityListing }
//     }
// }

/**
 * Listing Function to get activity information data.
 * Logic:
 * - Fetch the data from the 'activity' table using query(parameter) by calling a database function.
 *  - If data exists,
 *    + Map the data and add referrable name to the object.
 *    + Prepare the response.
 *    + Return the response with status as true.
 *  - Else
 *    + Return the response with status as false.
 *
 * @param {object} query - The query parameters to filter the activity information data.
 * @param {number} page - The page number of the results to retrieve.
 * @param {number} limit - The maximum number of results per page.
 * @param {string} date_format - The format of the date.
 * @returns {object} - An object containing the retrieved activity information data, pagination details, and status.
 */
const employeeSelfServiceActivitylisting = async (query, page, limit, date_format) => {

    let rawquery = `SELECT * FROM getEmployeeSelfServiceActivityInformation(`;
    rawquery += (query.employee_self_service_id !== null) ? `'${query.employee_self_service_id}',` : `${query.employee_self_service_id},`;
    rawquery += `'${date_format}', ${limit}, ${page})`;

    var activityListing = await indexRepository.rawQuery(rawquery);
    if (activityListing.length > 0) {
        const activity_count = activityListing[0]?.total_activity_count; // for pagination
        await Promise.all(activityListing.map(async (activity) => { // to make sure all values are mapped
            delete activity.total_activity_count; // deleting the count
        }));

        if (activity_count !== undefined && activity_count !== null) {
            pagination_details = {
                total: parseInt(activity_count),
                currentPage: page,
                perPage: limit,
                totalPages: Math.ceil(activity_count / limit)
            };
        }

        return {
            status: true,
            data: activityListing,
            pagination_data: pagination_details
        }
    } else {
        return { status: false, data: activityListing }
    }
}
/**
 * Listing Function to get activity information data.
 * Logic:
 * - Fetch the data from the 'activity' table using query(parameter) by calling a database function.
 *  - If data exists,
 *    + Map the data and add referrable name to the object.
 *    + Prepare the response.
 *    + Return the response with status as true.
 *  - Else
 *    + Return the response with status as false.
 *
 * @param {object} query - The query parameters to filter the activity information data.
 * @param {number} page - The page number of the results to retrieve.
 * @param {number} limit - The maximum number of results per page.
 * @param {string} date_format - The format of the date.
 * @returns {object} - An object containing the retrieved activity information data, pagination details, and status.
 */
const expenseActivitylisting = async (query, page, limit, date_format) => {

    let rawquery = `SELECT * FROM getExpenseActivityInformation(`;
    rawquery += (query.employee_self_service_id !== null) ? `'${query.employee_self_service_id}',` : `${query.employee_self_service_id},`;
    rawquery += `'${date_format}', ${limit}, ${page})`;

    var activityListing = await indexRepository.rawQuery(rawquery);
    if (activityListing.length > 0) {
        const activity_count = activityListing[0]?.total_activity_count; // for pagination
        await Promise.all(activityListing.map(async (activity) => { // to make sure all values are mapped
            delete activity.total_activity_count; // deleting the count
        }));

        if (activity_count !== undefined && activity_count !== null) {
            pagination_details = {
                total: parseInt(activity_count),
                currentPage: page,
                perPage: limit,
                totalPages: Math.ceil(activity_count / limit)
            };
        }

        return {
            status: true,
            data: activityListing,
            pagination_data: pagination_details
        }
    } else {
        return { status: false, data: activityListing }
    }
}

module.exports = { employeeActivitylisting, companyActivitylisting, timesheetActivitylisting, employeeSelfServiceActivitylisting, expenseActivitylisting };
