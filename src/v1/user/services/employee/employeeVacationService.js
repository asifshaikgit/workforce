const moment = require('moment');
const indexRepository = require("../../repositories/index")
const format = require('../../../../../helpers/format');
const { event } = require('../../../../../events/employeeActivityEvent');

/**
 * Store function to create a new Employee Vacation entry.
 *
 * Logic:
 * - Create an object 'employeeVacation' with properties extracted from the request 'body'.
 * - Call the 'indexRepository.store' function to store the new employee vacation information in the 'employee_vacation' table.
 * - Prepare an activity object for tracking the creation of the vacation entry.
 * - Trigger the 'employeeStoreActivity' event to log the activity.
 * - Return the response with information about the stored employee vacation record.
 *
 * Notes:
 * - Some functionality mentioned in the function description is not present in the code, and it is assumed to be implemented outside of this function.
 *
 * @param {Object} body - The request body containing Employee Vacation details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {

    /**
     * Creates an object representing an employee vacation with the provided data.
     */
    const employeeVacation = {
        employee_id: body.employee_id,
        name: body.name,
        from_date: body.from_date,
        to_date: body.to_date,
        do_not_disturb: body.do_not_disturb,
        preferred_from_time: body.preferred_from_time ? body.preferred_from_time : null,
        preferred_to_time: body.preferred_to_time  ? body.preferred_to_time: null,
        time_zone: body.time_zone ? body.time_zone : null,
        created_by: body.created_by,
        created_at: new Date()
    };
    /**
     * Stores the employee vacation data in the index repository.
     */
    const employeeVacationData = await indexRepository.store('employee_vacation', employeeVacation);

    /**Activity track */
    activity = {
        employee_id: body.employee_id,
        referrable_type: 13,
        referrable_type_id: employeeVacationData.data[0].id,
        action_type: 1,
        created_by: body.created_by,
      };

      event.emit('employeeStoreActivity', { activity } );
      /**Activity track */

    return employeeVacationData;
};

/**
 * Update function to modify an existing Employee Vacation entry.
 *
 * Logic:
 * - Create an 'updateData' object with properties extracted from the request 'body'.
 * - Fetch the Employee Vacation data before the update using the 'getVacationDetails' function.
 * - Update the 'employee_vacation' repository with the given condition and 'updateData'.
 * - Fetch the Employee Vacation data after the update using the 'getVacationDetails' function.
 * - Prepare an activity object to track the update of the vacation entry.
 * - Trigger the 'employeeUpdateActivity' event to log the activity, including the data before and after the update.
 * - Return the response with information about the update operation.
 *
 * @param {Object} body - The request body containing Employee Vacation details to update.
 * @param {Object} condition - The condition to identify the Employee Vacation to update.
 * @returns {Object} Repository response.
 */
const update = async (body, condition) => {

    /* Creating update entry object */
    var updateData = {
        employee_id: body.employee_id,
        name: body.name,
        from_date: body.from_date,
        to_date: body.to_date,
        do_not_disturb: body.do_not_disturb,
        preferred_from_time: body.preferred_from_time ? body.preferred_from_time : null,
        preferred_to_time: body.preferred_to_time ? body.preferred_to_time: null,
        time_zone: body.time_zone ? body.time_zone : null,
        updated_at: new Date(),
        updated_by: body.updated_by
    }

    /** Fetching Employee Vacation data before update */
    const beforeUpdateData = await getVacationDetails({ 'employee_vacation.employee_id': body.employee_id, 'employee_vacation.id': condition.id })
    /** Fetching Employee Vacation data before update */

    /**
     * Updates the 'employee_vacation' repository with the given condition and update data.
     */
    var repositoryResponse = await indexRepository.update('employee_vacation', condition, updateData);

    /* Fetching Employee Vacation data after update */
    const afterUpdateData = await getVacationDetails({ 'employee_vacation.employee_id': body.employee_id, 'employee_vacation.id': condition.id })
    /* Fetching Employee Vacation data after update */

    /**Activity track */
   activity = {
    employee_id: body.employee_id,
    referrable_type: 13,
    referrable_type_id: repositoryResponse.data[0].id,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('employeeUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

    return repositoryResponse;
};

/**
 * getVacationDetails function to retrieve details of an Employee Vacation entry based on the provided condition.
 *
 * Logic:
 * - Fetch the date format from the 'format' module.
 * - Define the fields to fetch from the 'employee_vacation' table, including related employee data.
 * - Specify the join conditions with 'employee' tables for 'created_by' and 'updated_by' references.
 * - Call the 'indexRepository.find' function to retrieve data from the 'employee_vacation' table using the given condition and join settings.
 * - Extract relevant vacation details from the response data and format them as a structured object.
 * - Return the structured vacation details.
 *
 * @param {Object} condition - The condition to filter Employee Vacation data.
 * @returns {Object} Structured vacation details.
 */
const getVacationDetails = async (condition) => {
    let dateFormat = await format.getDateFormat(); // date format

    const fields = ['employee_vacation.*', 'create.display_name as create_emp', 'update.display_name as updated_emp']; // fields to fetch
    const joins = [
        { table: 'employee as create', alias: 'create', condition: ['employee_vacation.created_by', 'create.id'], type: 'left', ignoreDeletedAt: true },
        { table: 'employee as update', alias: 'update', condition: ['employee_vacation.updated_by', 'update.id'], type: 'left', ignoreDeletedAt: true }
    ];
    var vacationData = await indexRepository.find('employee_vacation', fields, condition, null, joins);
    vacationData = vacationData.data[0]
    const vacationDetails = {
        'Name': vacationData.name,
        'From Date': moment(vacationData.from_date).format(dateFormat),
        'To Date': moment(vacationData.to_date).format(dateFormat),
        'Do not disturb': vacationData.do_not_disturb == 0 ? 'No' : vacationData.do_not_disturb == 1 ? 'Yes' : vacationData.do_not_disturb == 2 ? 'Emergency' : '-',
        'Preferred From Time': vacationData.do_not_disturb == 0 ? vacationData.preferred_from_time.slice(0, -3) : '-',
        'Preferred To Time': vacationData.do_not_disturb == 0 ? vacationData.preferred_to_time.slice(0, -3) : '-',
        'Time Zone': vacationData.do_not_disturb == 0 ? vacationData.time_zone == 0 ? 'GST' : vacationData.time_zone == 1 ? 'GMT' : vacationData.time_zone == 2 ? 'CAT' : '-' : '-'
    }
    return vacationDetails
}

/**
 * Listing function to retrieve a paginated list of Employee Vacation entries based on the provided condition.
 *
 * Logic:
 * - Define the fields and joins to fetch the information for the employee vacation using 'indexRepository.findByPagination'.
 * - If the retrieval of Employee Vacation entries is successful:
 *   + Create an empty 'responseData' array to store paginated entries.
 *   + Extract date format from the 'format' module.
 *   + Initialize variables for the response.
 *   + Calculate the 'serial_no' for serial numbering in the response.
 *   + Iterate through 'total_details' and create a 'listingObject' for each entry.
 *   + Format date-related fields using the provided date format.
 *   + Append each 'listingObject' to the 'responseData' array.
 *   + Return the response with the structured data and pagination details.
 * - If there is an error during data retrieval, return the error response from 'employeeVacationList'.
 *
 * @param {Object} condition - The condition to filter Employee Vacation data.
 * @param {number} page - The page number for pagination.
 * @param {number} limit - The number of entries per page for pagination.
 * @returns {Object} Structured data and pagination details for the list of Employee Vacation entries.
 */
const listing = async (condition, page, limit) => {

    /**
     * Define the fields and joins to fetch the information for the employee vacation
     */
    var employeeVacationList = await indexRepository.findByPagination('employee_vacation', ['*'], condition, [], page, limit);
    if (employeeVacationList.status) {
        let dateFormat = await format.getDateFormat(); // date format

        /* Variables */
        var responseData = []
        var total_details = employeeVacationList.data
        var pagination_details = employeeVacationList.pagination
        /* Variables */

        /* Using Map to iterate the loop and prepare the response */
        serial_no = (page - 1) * limit + 1;
        for (const obj in total_details) {

            let listingObject = {
                serial_no: serial_no,
                id: total_details[obj].id,
                employee_id: total_details[obj].employee_id,
                name: total_details[obj].name,
                from_date: moment(total_details[obj].from_date).format(dateFormat),
                to_date: moment(total_details[obj].to_date).format(dateFormat),
                do_not_disturb: total_details[obj].do_not_disturb,
                preferred_from_time: total_details[obj].preferred_from_time ? total_details[obj].preferred_from_time.slice(0, -3) : '',
                preferred_to_time: total_details[obj].preferred_to_time ? total_details[obj].preferred_to_time.slice(0, -3) : '',
                time_zone: total_details[obj].time_zone ? total_details[obj].time_zone : ''
            }
            serial_no++
            responseData.push(listingObject);
        }
        return {
            status: true,
            data: responseData,
            pagination_data: pagination_details
        }
    } else {
        return employeeVacationList
    }
};


/**
 * Vacation Dates function to check overlapping vacation date ranges for an employee.
 *
 * Logic:
 * - Define the fields to fetch from the 'employee_vacation' table (from_date and to_date).
 * - Retrieve a list of employee vacation date ranges using 'indexRepository.find'.
 * - Initialize a sample input date range using the provided 'query' object.
 * - Create a set ('overlappingRanges') to store overlapping ranges.
 * - Iterate through the retrieved date ranges from the database:
 *   + Parse the start and end dates for each range.
 *   + Check if the input date range overlaps with the current date range.
 *   + If there is an overlap, add the overlapping range to 'overlappingRanges'.
 * - If there are overlapping date ranges, join them and return a response indicating the overlapping vacation periods.
 * - If there are no overlapping date ranges, return a response with status false.
 *
 * @param {Object} query - The query object containing employee and date range information.
 * @returns {Object} Response indicating overlapping vacation periods if any, or status false if there is no overlap.
 */
const vacationDates = async (query) => {

    const fields = ['from_date', 'to_date']; // fields to fetch

    var employeeVacationList = await indexRepository.find('employee_vacation', fields, { employee_id: query.employee_id, deleted_at: null }, 0, [], 0, 'created_at', 'asc');
    dateRanges = employeeVacationList.data

    // Sample input date range
    const inputStartDate = moment(query.from_date);
    const inputEndDate = moment(query.to_date);

    // Set to store overlapping ranges
    const overlappingRanges = [];

    // Check for overlapping date ranges
    dateRanges.forEach(dateRange => {
        const startDate = moment(dateRange.from_date);
        const endDate = moment(dateRange.to_date);

        if (
            (inputStartDate.isSameOrBefore(endDate) && inputEndDate.isSameOrAfter(startDate)) ||
            (startDate.isSameOrBefore(inputEndDate) && endDate.isSameOrAfter(inputStartDate))
        ) {
            overlappingRanges.push(
                `${startDate.format('YYYY-MM-DD')} to ${endDate.format('YYYY-MM-DD')}`
            );
        }
    })
    if (overlappingRanges.length > 0) {
        var overlappingRange = overlappingRanges.join(' and ')
        return { status: true, Information: 'Employee is on vacation from' + ' ' + overlappingRange }
    } else {
        return { status: false }
    }
};

/**
 * Destroy function to delete an existing Employee Vacation entry.
 *
 * Logic:
 * - Create a 'deleteData' object to set the 'deleted_at', 'updated_at', and 'updated_by' properties.
 * - Call the 'update' method from the repository to perform the deletion by updating the record with the provided condition.
 * - Prepare an activity object to track the deletion of the vacation entry.
 * - Trigger the 'employeeDeleteActivity' event to log the activity.
 * - Return the response with information about the deletion operation.
 *
 * @param {Object} body - The request body containing Employee Vacation details for deletion.
 * @param {Object} condition - The condition to identify the Employee Vacation entry to delete.
 * @returns {Object} Repository response.
 */
const destroy = async (body, condition) => {

    /* Creating delete entry object */
    var updateData = {
        deleted_at: new Date(),
        updated_at: new Date(),
        updated_by: body.updated_by
    };
    /* Creating delete entry object */

    /* calling update method from repository to update a new entry*/
    var repositoryResponse = await indexRepository.update('employee_vacation', condition, updateData);

    /** Activity track */
    activity = {
        employee_id: body.employee_id,
        referrable_type: 13,
        referrable_type_id: repositoryResponse.data[0].id,
        action_type: 3,
        created_by: body.created_by,
      };
      event.emit("employeeDeleteActivity", activity)
      /** Activity track */

    return repositoryResponse
    /* calling update method from repository to update a new entry*/
};

module.exports = { destroy, listing, store, update, vacationDates };
