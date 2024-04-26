const indexRepository = require('../../repositories/index');

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
const listing = async (query, page, limit, date_format) => {

	let rawquery = `SELECT * FROM getConfigurationActivityInformation(`;
	rawquery += (query.referrable_id !== null) ? `'${query.referrable_id}',` : `${query.referrable_id},`;
	rawquery += `'${date_format}', ${limit}, ${page})`;

	var activityListing = await indexRepository.rawQuery(rawquery);
	if (activityListing.length > 0) {

		const activity_count = activityListing[0]?.total_activity_count;
		await Promise.all(activityListing.map(async (activity) => {
			delete activity.total_activity_count;
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
		return activityListing;
	}
}

// to get name of the configurations mapped to the 
const getReferrableName = async (query, id) => {

	let table;
	let name;

	switch (query.referrable_id) {
		case '1':
			table = "employee_categories"; // table
			name = "name";// column name
			break;
		case '2':
			table = "departments";
			name = "name";
			break;
		case '3':
			table = "education_levels";
			name = "name";
			break;
		case '4':
			table = "teams";
			name = "name";
			break;
		case '5':
			table = "relationship_types";
			name = "name";
			break;
		case '6':
			table = "skills";
			name = "name";
			break;
		case '7':
			table = "visa_types";
			name = "name";
			break;
		case '8':
			table = "visa_document_types";
			name = "name";
			break;
		case '9':
			table = "payment_modes";
			name = "name";
			break;
		case '10':
			table = "write_off";
			name = "write_off_reason";
			break;
		case '11':
			table = "invoice_taxes";
			name = "write_off_reason";
			break;
		case '12':
			table = "invoice_configurations";
			name = "invoice configurations";
			break;
		case '13':
			table = "countries";
			name = "name";
			break;
		case '14':
			table = "states";
			name = "name";
			break;
		case '15':
			table = "job_titles";
			name = "name";
			break;
		case '16':
			table = "timesheet_configurations";
			name = "timesheet configurations";
			break;
		case '17':
			table = "expense_and_service_types";
			name = "name";
			break;
		case '18':
			table = "net_pay_terms";
			name = "days";
			break;
		case '19' || '30' || '31' || '32' || '33' || '34':
			table = "document_types";
			name = "name";
			break;
		case '20':
			table = "approval_settings";
			name = "Invoice approvals";
			break;
		case '21':
			table = "organization";
			name = "organization_name";
			break;
		case '22':
			table = "organization";
			name = "organization_name";
			break;
		case '23':
			table = "payroll_config_settings";
			name = "name";
			break;
		case '24':
			table = "prefixes";
			name = "name";
			break;
		case '25':
			table = "expense_and_service_types";
			name = "name";
			break;
		case '26':
			table = "roles";
			name = "name";
			break;
		case '27':
			table = "reminder_configurations";
			name = "name";
			break;
		case '28':
			table = "notification_settings";
			name = "name";
			break;
		default:
			table = "unknown_table";
			name = "name";
			break;
	}


	if (table != 'unknown_table' && table != 'timesheet_configurations' && table != 'invoice_configurations' && table != 'approval_settings') { // if not these tables since these do not contain names we assign name static way
		let joins = [
			{ table: `${table} as e`, alias: 'e', condition: ['e.id', 'configuration_activity_track.referrable_id'], type: 'left' }
		]

		var data = await indexRepository.find('configuration_activity_track', [`e.${name}`], { 'configuration_activity_track.id': id }, null, joins, null, null, null, false)
		name = data.data[0][name] // name column in a dynamic way
	}
	return name
}

module.exports = { listing }