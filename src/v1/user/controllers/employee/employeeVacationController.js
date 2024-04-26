const { check, validationResult } = require('express-validator')
const { logRequest, logResponse } = require('../../../../../utils/log')
const { responseMessages } = require('../../../../../constants/responseMessage')
const { responseCodes } = require('../../../../../constants/responseCodes')
const { responseHandler } = require('../../../../responseHandler')
const employeeVacationService = require('../../services/employee/employeeVacationService')
const { tryCatch } = require('../../../../../utils/tryCatch')
const InvalidRequestError = require('../../../../../error/InvalidRequestError')
const { pagination } = require("../../../../../config/pagination")
const moment = require('moment')
const indexService = require('../../services/index');
const format = require('../../../../../helpers/format');
const { regexPatterns } = require('../../../../../constants/regexPatterns')



/**
 * Store function to store a new Employee vacation data record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'store' service function to create a new Employee Emergency Contact Info Types record.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Retrieve the organization date format using `format.getDateFormat()`.
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Modify the 'from_date' and 'to_date' dates to 'YYYY-MM-DD' format using Moment.js and update the request.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *       ~ Set the 'employee_reference_id' property in the request.
 *    + 'name' (body), must not be empty, and should not contain specific characters.
 *    + 'from_date' (body), must be a valid date and should not overlap with an existing Employee Emergency Contact Info Types record 'employee_vacations' table for the same employee.
 *    + 'to_date' (body), must be a valid date.
 *    + 'do_not_disturb' (body), must be one of the specified values and 0 - No, 1 - Yes, 2 - Emergency'.
 *    + 'preferred_from_time' (body), must be provided if 'do_not_disturb' is 0, and it should match a specific time format.
 *    + 'preferred_to_time' (body), must be provided if 'do_not_disturb' is 0, and it should match a specific time format.
 *    + 'time_zone' (body), must be provided if 'do_not_disturb' is 0.
 *       
 * Run the validation rules.
 * If validation is successful:
 *    + Call the 'store' service function to create a new Employee Emergency Contact Info Types record.
 *    + Prepare the response with success data.
 * If validation fails:
 *    + Add error validation to the response.
 * Log the response.
 * Return the response using `responseHandler()`.
 *
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const store = tryCatch(async (req, res) => {
    let dateFormat = await format.getDateFormat(); // date format
    /* Log Request */
    logRequest('info', req, 'Store a employee vacation data request')
    /* Log Request */

    /* Default Variable */
    var responseData = ''
    /* Default Variable */

    let modified_from_date = moment(req.body.from_date, dateFormat).format('YYYY-MM-DD');
    req.body.from_date = modified_from_date; // Modify the from_date property

    let modified_to_date = req.body.to_date != '' ? moment(req.body.to_date, dateFormat).format('YYYY-MM-DD') : '';
    req.body.to_date = modified_to_date; // Modify the to_date property

    /* Writing validation rules to the input request */
    const validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check("employee_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
            .isUUID()
            .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
            .custom(async (value) => {
                const employee = await indexService.find('employee', ['id', 'reference_id'], { id: value })
                if (!employee.status && value != '') {
                    return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
                }
                req.body.employee_reference_id = employee.data[0].reference_id;
                return true
            }),
        check("name")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.employee.employeeVacation.nameRequired)
            .not().matches(regexPatterns.specialCharactersRegex)
            .withMessage(responseMessages.employee.employeeVacation.nameInvalid),
        check('from_date')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.employee.employeeVacation.fromDateRequired)
            .isDate()
            .withMessage(responseMessages.employee.employeeVacation.fromDateInvalid)
            .custom(async (value) => {
                const fromDate = await indexService.find('employee_vacation', ['from_date', 'to_date'], { employee_id: req.body.employee_id, global_search: `("employee_vacation"."from_date" <= '${req.body.from_date}' and "employee_vacation"."to_date" >= '${req.body.from_date}') or ("employee_vacation"."from_date" >= '${req.body.from_date}' and "employee_vacation"."from_date" <= '${req.body.from_date}')` })
                if (fromDate.status) {
                    return Promise.reject(responseMessages.employee.employeeVacation.employeeVacationExists)
                }
            }),
        check('to_date')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.employee.employeeVacation.toDateRequired)
            .isDate()
            .withMessage(responseMessages.employee.employeeVacation.toDateInvalid),
        check('do_not_disturb')
            .trim()
            .escape()
            .isIn([0, 1, 2])//0 - No, 1 - Yes, 2 - Emergency'
            .withMessage(responseMessages.employee.employeeVacation.doNotDisturbInvalid),
        check('preferred_from_time')
            .trim()
            .escape()
            .custom((value) => {
                if (req.body.do_not_disturb == 1) {
                    if (value != '' && value != null) {
                        regex = regexPatterns.time24HoursRegex;
                        if (!regex.test(value)) {
                            return Promise.reject(responseMessages.employee.employeeVacation.preferredFromTimeInvalid)
                        }
                        return true;
                    } else {
                        return Promise.reject(responseMessages.employee.employeeVacation.preferredFromTimeRequired)
                    }
                }
                return true
            }),
        check('preferred_to_time')
            .trim()
            .escape()
            .custom((value) => {
                if (req.body.do_not_disturb == 1) {
                    if (value != '' && value != null) {
                        regex = regexPatterns.time24HoursRegex;
                        if (!regex.test(value)) {
                            return Promise.reject(responseMessages.employee.employeeVacation.preferredToTimeInvalid)
                        }
                        return true;
                    } else {
                        return Promise.reject(responseMessages.employee.employeeVacation.preferredToTimeRequired)
                    }
                }
                return true
            }),
        check('time_zone')
            .trim()
            .escape()
            .custom((value) => {
                if (req.body.do_not_disturb == 1) {
                    if (value != '' && value != null) {
                        return true
                    } else {
                        return Promise.reject(responseMessages.employee.employeeVacation.timeZoneRequired)
                    }
                }
                return true
            }),
    ]
    /* Writing validation rules to the input request */

    /*Run the validation rules. */
    for (let validation of validations) {
        var result = await validation.run(req)
        if (result.errors.length) break
    }
    var errors = validationResult(req)
    /*Run the validation rules. */

    /**
     * If there are no errors, store the employee vacation data and return a success response.
     * If there are errors, throw an InvalidRequestError with the first error message.
     */
    if (errors.isEmpty()) {
        const vacationData = await employeeVacationService.store(req.body)
        responseData = {
            statusCode: responseCodes.codeSuccess,
            message: responseMessages.common.addedSuccessfully,
            data: vacationData.data
        }
        /* Log Response */
        logResponse(
            'info',
            req,
            responseData,
            'Store a employee vacation data response'
        )
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData)
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity)
    }
})

/**
 * Update function to modify an existing employee vacation details.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'update' service function to modify the Employee Emergency Contact Info record.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Retrieve the organization date format using `format.getDateFormat()`.
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Modify the 'from_date' and 'to_date' dates to 'YYYY-MM-DD' format using Moment.js and update the request.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'id' (params), must not be empty, should be an integer, and should exist in the 'employee_vacation' table.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *       ~ Set the 'employee_reference_id' property in the request.
 *    + 'name' (body), must not be empty, and should not contain specific characters.
 *    + 'from_date' (body), must be a valid date,  must be a valid date and should not overlap with an existing Employee Emergency Contact Info Types record 'employee_vacations' table for the same employee.
 *    + 'to_date' (body), must be a valid date and not be earlier than 'from_date'.
 *    + 'do_not_disturb' (body), must be one of the specified values.
 *    + 'preferred_from_time' (body), must be provided if 'do_not_disturb' is 0, and it should match a specific time format.
 *    + 'preferred_to_time' (body), must be provided if 'do_not_disturb' is 0, and it should match a specific time format.
 *    + 'time_zone' (body), must be provided if 'do_not_disturb' is 0.
 *       
 * Run the validation rules.
 * If validation is successful:
 *    + Call the 'update' service function to modify the Employee Emergency Contact Info record.
 *    + Prepare the response with success data.
 * If validation fails:
 *    + Add error validation to the response.
 * Log the response.
 * Return the response using `responseHandler()`.
 *
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
    let dateFormat = await format.getDateFormat(); // date format

    /* Log Request */
    logRequest('info', req, "Update employee vacation details request.");
    /* Log Request */

    /* Default Variable */
    var responseData = '';
    /* Default Variable */

    let modified_from_date = moment(req.body.from_date, dateFormat).format('YYYY-MM-DD');
    req.body.from_date = modified_from_date; // Modify the from_date property

    let modified_to_date = req.body.to_date != '' ? moment(req.body.to_date, dateFormat).format('YYYY-MM-DD') : '';
    req.body.to_date = modified_to_date; // Modify the to_date property

    /* Writing validation rules to the input request */
    var validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.employee.employeeVacation.idRequired)
            .isInt().withMessage(responseMessages.employee.employeeVacation.idInvalid)
            .custom(async (value) => {
                const vacationData = await indexService.find('employee_vacation', ['id'], { id: value })
                if (!vacationData.status) {
                    return Promise.reject(responseMessages.employee.employeeVacation.IdNotExists)
                }
                return true
            }),
        check("employee_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
            .isUUID()
            .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
            .custom(async (value) => {
                const employee = await indexService.find('employee', ['id', 'reference_id'], { id: value })
                if (!employee.status && value != '') {
                    return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
                }
                req.body.employee_reference_id = employee.data[0].reference_id;
                return true
            }),
        check("name")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.employee.employeeVacation.nameRequired)
            .not().matches(regexPatterns.specialCharactersRegex)
            .withMessage(responseMessages.employee.employeeVacation.nameInvalid),
        check('from_date')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.employee.employeeVacation.fromDateRequired)
            .isDate()
            .withMessage(responseMessages.employee.employeeVacation.fromDateInvalid)
            .custom(async (value) => {
                const fromDate = await indexService.find('employee_vacation', ['id', 'from_date', 'to_date'], { employee_id: req.body.employee_id, global_search: `("employee_vacation"."from_date" <= '${req.body.from_date}' and "employee_vacation"."to_date" >= '${req.body.from_date}') or ("employee_vacation"."from_date" >= '${req.body.from_date}' and "employee_vacation"."from_date" <= '${req.body.from_date}')` })
                if (fromDate.status) {
                    if (fromDate.data[0].id != req.params.id) {
                        return Promise.reject(responseMessages.employee.employeeVacation.employeeVacationExists)
                    }
                }
            }),
        check('to_date')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.employee.employeeVacation.toDateRequired)
            .isDate()
            .withMessage(responseMessages.employee.employeeVacation.toDateInvalid)
            .custom(value => {
                if (moment(value).isBefore(req.body.from_date)) {
                    return Promise.reject(responseMessages.employee.employeeVacation.toDateInvalid)
                } else {
                    return true
                }
            }),
        check('do_not_disturb')
            .trim()
            .escape()
            .isIn([0, 1, 2]) //0 - No, 1 - Yes, 2 - Emergency'
            .withMessage(responseMessages.employee.employeeVacation.doNotDisturbInvalid),
        check('preferred_from_time')
            .trim()
            .escape()
            .custom((value) => {
                if (req.body.do_not_disturb == 0) {
                    if (value != '' && value != null) {
                        regex = regexPatterns.time24HoursRegex;
                        if (!regex.test(value)) {
                            return Promise.reject(responseMessages.employee.employeeVacation.preferredFromTimeInvalid)
                        }
                        return true;
                    } else {
                        return Promise.reject(responseMessages.employee.employeeVacation.preferredFromTimeRequired)
                    }
                }
                return true
            }),
        check('preferred_to_time')
            .trim()
            .escape()
            .custom((value) => {
                if (req.body.do_not_disturb == 0) {
                    if (value != '' && value != null) {
                        regex = regexPatterns.time24HoursRegex;
                        if (!regex.test(value)) {
                            return Promise.reject(responseMessages.employee.employeeVacation.preferredToTimeInvalid)
                        }
                        return true;
                    } else {
                        return Promise.reject(responseMessages.employee.employeeVacation.preferredToTimeRequired)
                    }
                }
                return true
            }),
        check('time_zone')
            .trim()
            .escape()
            .custom((value) => {
                if (req.body.do_not_disturb == 0) {
                    if (value != '' && value != null) {
                        return true
                    } else {
                        return Promise.reject(responseMessages.employee.employeeVacation.timeZoneRequired)
                    }
                }
                return true
            })
    ];
    /* Writing validation rules to the input request */

    /*Run the validation rules. */
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    /*Run the validation rules. */

    /**
     * Updates the employee vacation information if there are no errors in the request.
     * If there are errors, throws an InvalidRequestError with the first error message.
     */
    if (errors.isEmpty()) {
        const condition = { id: req.params.id }
        await employeeVacationService.update(req.body, condition);
        responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully }

        /* Log Response */
        logResponse("info", req, responseData, "Update employee vacation details Response.");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
}
);


/**
 * Listing function to retrieve Employee vacation details with optional filters.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ If 'request_id' is provided, continue with processing.
 *      ~ If 'employee_id' is provided and valid, retrieve the Employee's Emergency Contact Info records.
 *      ~ Handle optional filters: 'limit', 'page', 'search'.
 *      ~ Prepare the query condition based on the filters.
 *      ~ Call the 'listing' service function.
 *      ~ Prepare the response with retrieved data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`, `request_id`, `limit`, `page`, `employee_id`, and `search`.
 * - Check if 'request_id' is provided, and if not, add an error to the response.
 * - Validate 'employee_id':
 *    + If provided, check if it's a valid UUID and exists in the 'employee' table.
 *    + If not provided or invalid, add an error to the response.
 * - Handle optional filters:
 *    + 'limit' and 'page': Use provided values or default values.
 *    + 'search': Use provided value if available.
 * - Based on 'employee_id' and optional 'search', prepare the query condition.
 * - Call the 'employeeVacationService.listing' service function to retrieve Employee Emergency Contact Info records.
 * - If records are found, prepare a success response with data and pagination.
 * - If no records are found, add a message to the response.
 * Log the response.
 * Return the response using `responseHandler()`.
 *
 * Notes:
 * - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const listing = tryCatch(async (req, res) => {

    /* Log Request */
    logRequest('info', req, "Getting employee vacation details request");
    /* Log Request */

    /* Default Variable */
    var responseData = '';
    var request_id = req.query.request_id;
    /* Default Variable */

    if (request_id != undefined && request_id != '') {
        /* Default Variable */
        let limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
        let page = (req.query.page) ? (req.query.page) : pagination.page;
        let employee_id = req.query.employee_id
        let search = req.query.search ? req.query.search : "";
        /* Default Variable */

        /* Writing validation rules to the input request */
        if (employee_id != undefined && employee_id != '') {
            var pattern = regexPatterns.uuidRegex;
            if (pattern.test(employee_id)) {
                const employeeData = await indexService.find('employee', ['id'], { id: employee_id })
                if (!employeeData.status) {
                    return Promise.reject(responseMessages.employee.employeeIdNotExists)
                }

                // Prepare the condition to fetch the information
                if (search != undefined && search != '') {
                    var condition = { 'global_search': `"employee_vacation"."name" ilike '%${search}%' and "employee_vacation"."employee_id" = '${employee_id}'` }
                } else {
                    var condition = { 'employee_vacation.employee_id': `${employee_id}` }
                }

                var vacationInfoData = await employeeVacationService.listing(condition, page, limit, employee_id);
                if (vacationInfoData.status) {
                    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: vacationInfoData.data, pagination: vacationInfoData.pagination };
                } else {
                    responseData = { statusCode: responseCodes.codeSuccess, message: vacationInfoData.message, error: vacationInfoData.error, message: responseMessages.common.noRecordFound, data: [], pagination: vacationInfoData.pagination_data }
                }
            } else {
                throw new InvalidRequestError(responseMessages.employee.employeeIdInvalid);
            }
        } else {
            throw new InvalidRequestError(responseMessages.employee.employeeIdRequired);
        }

        /* Log Response */
        logResponse('info', req, responseData, "Getting employee vacation details Response");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(responseMessages.common.requestIdRequired);
    }
}
);


/**
 * Vacation Dates function to retrieve Employee's vacation dates within a specific date range.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ If 'request_id' is provided, continue with processing.
 *      ~ Validate 'employee_id' and retrieve related employee data.
 *      ~ Validate and process 'from_date' and 'to_date' for the date range.
 *      ~ Call the 'vacationDates' service function to retrieve vacation dates within the date range.
 *      ~ Prepare the response with retrieved data or add an error message if no data is found.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`, `request_id`, and `employee_id`.
 * - Check if 'request_id' is provided, and if not, add an error to the response.
 * - Validate 'employee_id':
 *    + If provided, check if it's a valid UUID and exists in the 'employee' table.
 *    + If not provided or invalid, add an error to the response.
 * - Validate and process 'from_date' and 'to_date':
 *    + Check if they are provided and in the correct date format.
 *    + Verify that 'from_date' is before 'to_date'.
 * - Call the 'vacationDates' service function to retrieve vacation dates within the specified date range.
 * - Prepare a success response with data if records are found, or add a message if no records are found.
 * Log the response.
 * Return the response using `responseHandler()`.
 *
 * Notes:
 * - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const vacationDates = tryCatch(async (req, res) => {

    /* Log Request */
    logRequest('info', req, "Getting employee vacation dates request");
    /* Log Request */

    /* Default Variable */
    var responseData = '';
    var request_id = req.query.request_id;
    /* Default Variable */

    if (request_id != undefined && request_id != '') {
        /* Default Variable */
        let employee_id = req.query.employee_id
        /* Default Variable */

        /* Writing validation rules to the input request */
        if (request_id != undefined && request_id != '') {
            if (employee_id != undefined && employee_id != '') {
                var pattern = regexPatterns.uuidRegex;
                if (pattern.test(employee_id)) {
                    const employeeData = await indexService.find('employee', ['id'], { id: employee_id })
                    if (!employeeData.status) {
                        return Promise.reject(responseMessages.employee.employeeVacation.employeeIdNotExists)
                    }
                    if (req.query.from_date != '' && req.query.from_date != null && req.query.to_date != '' && req.query.to_date != null) {
                        req.query.from_date = moment(req.query.from_date, dateFormat).format('YYYY-MM-DD')
                        req.query.to_date = moment(req.query.to_date, dateFormat).format('YYYY-MM-DD')
                        var pattern = /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/;
                        if (pattern.test(req.query.from_date)) {
                            if (pattern.test(req.query.to_date)) {
                                if (moment(req.query.from_date).isBefore(moment(req.query.to_date))) {
                                    var vacationData = await employeeVacationService.vacationDates(req.query);
                                    if (!vacationData.status) {
                                        responseData = { statusCode: responseCodes.codeInternalError, error: vacationData.error, message: responseMessages.common.noRecordFound }
                                    }
                                    else {
                                        responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: vacationData };
                                    }
                                } else {
                                    throw new InvalidRequestError(responseMessages.employee.employeeVacation.invalidToDate)
                                }
                            } else {
                                throw new InvalidRequestError(responseMessages.employee.employeeVacation.dateInvalid)
                            }
                        } else {
                            throw new InvalidRequestError(responseMessages.employee.employeeVacation.dateInvalid)
                        }
                    } else {
                        throw new InvalidRequestError(responseMessages.employee.employeeVacation.startDateAndEndDateRequired)
                    }
                } else {
                    throw new InvalidRequestError(responseMessages.employee.employeeVacation.employeeIdInvalid);
                }
            } else {
                throw new InvalidRequestError(responseMessages.employee.employeeVacation.employeeIdRequired);
            }
        } else {
            throw new InvalidRequestError(responseMessages.common.requestIdRequired);
        }

        /* Log Response */
        logResponse('info', req, responseData, "Getting employee vacation dates response");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(responseMessages.common.requestIdRequired);
    }
}
);

/**
 * Destroy function to delete an existing Employee vacation details record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'destroy' service function to delete the Employee Emergency Contact Info record.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *       ~ Set the 'employee_reference_id' property in the request.
 *    + 'id' (params), must not be empty, should be an integer, and should exist in the 'employee_vacation' table.
 *       ~ Set the 'vacation_name' property in the request.
 *       
 * Run the validation rules.
 * If validation is successful:
 *    + Call the 'destroy' service function to delete the Employee Emergency Contact Info record.
 *    + Prepare the response with success data.
 * If validation fails:
 *    + Add error validation to the response.
 * Log the response.
 * Return the response using `responseHandler()`.
 *
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const destroy = tryCatch(async (req, res) => {

    /* Log Request */
    logRequest('info', req, 'Delete Employee Vacation Details request')
    /* Log Request */

    /* Default Variable */
    var responseData = ''
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check("employee_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
            .isUUID()
            .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
            .custom(async (value) => {
                const employee = await indexService.find('employee', ['id', 'reference_id'], { id: value })
                if (!employee.status) {
                    return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
                }
                req.body.employee_reference_id = employee.data[0].reference_id
                return true
            }),
        check('id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.employee.employeeVacation.idRequired)
            .isInt().withMessage(responseMessages.employee.employeeVacation.idInvalid)
            .custom((value) => {
                return indexService.find('employee_vacation', ['id', 'name'], { id: value }).then((vacationData) => {
                    if (!vacationData.status) {
                        return Promise.reject(responseMessages.employee.employeeVacation.IdNotExists)
                    }
                    req.body.vacation_name = vacationData.data[0].name
                    return true;
                })
            })
    ]
    /* Writing validation conditions to the input request */

    /*Run the validation rules. */
    for (let validation of validations) {
        var result = await validation.run(req)
        if (result.errors.length) break
    }
    var errors = validationResult(req)
    /*Run the validation rules. */

    if (errors.isEmpty()) {
        const condition = { id: req.params.id }
        await employeeVacationService.destroy(req.body, condition)
        responseData = {
            statusCode: responseCodes.codeSuccess,
            message: responseMessages.common.deletedSuccessfully
        }

        /* Log Response */
        logResponse('info', req, responseData, 'Delete Employee Vacation Details Response')
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData)
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity)
    }
});

module.exports = { destroy, listing, store, update, vacationDates };
