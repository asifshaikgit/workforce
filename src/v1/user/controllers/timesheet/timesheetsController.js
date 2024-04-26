/**
 * @constant check Creates a middleware/validation chain for one or more fields that may be located in any of the following:
 */
const { check, validationResult } = require('express-validator');

/**
 * @constant tryCatch Default class for try catch handling 
 */
const { tryCatch } = require('../../../../../utils/tryCatch');

/**
 * @constant logRequest Default class for logging the current event 
 */
const { logRequest, logResponse } = require('../../../../../utils/log');

/**
 * @constant responseMessages responseMessage constant variables
 */
const { responseMessages } = require('../../../../../constants/responseMessage');

/**
 * @constant responseCodes responseCodes constant variables
 */
const { responseCodes } = require('../../../../../constants/responseCodes');

/**
 * @constant InvalidRequestError Default class for handling invalid request
 */
const InvalidRequestError = require("../../../../../error/InvalidRequestError");

/**
 * @constant hoursValidationRegex hoursValidationRegex const regex validate hours format eg: 34:00
 */
const hoursValidationRegex = /(\d+):(\d+)/;

const { regexPatterns } = require('../../../../../constants/regexPatterns');
/**
 * @constant dayHoursValidationRegex dayHoursValidationRegex const regex validate hours format for day eg: 01:00 - 24:00
 */
const dayHoursValidationRegex = regexPatterns.time24HoursRegex;
const indexService = require('../../services/index');
// const timesheetService = require('../../services/timesheet/timesheetService');
const { responseHandler } = require('../../../../responseHandler');
const format = require('../../../../../helpers/format');
const moment = require('moment');
const timesheetsService = require('../../services/timesheet/timesheetsService');
const uuidPattern = regexPatterns.uuidRegex;
const { pagination } = require('../../../../../config/pagination');
const { removeEmptyAndUndefinedKeys } = require('../../../../../helpers/globalHelper');

/**
 * Validation Rules for employee timesheet storing
 * - Define the validation rules as follows:
 *   + 'id' (body-timesheet_id), must not be empty, valid uuid, shoudl exist in 'timesheets' table.
 *   + 'request_id' (body), must not be empty.
 *   + 'employee_id' (body), must not be empty, should be a valid UUID, should exist in the 'employee' table (if not empty), employee_id should not have active passport.
 *   + 'placement_id' (body), must not be empty, should be a valid UUID, should exist in the 'placement' table, check if any timesheet exist for placement_id with from and to date getting from the request.
 *   + 'timesheet_configuration_id' (body), must not be empty, should exist in the 'timesheet_configurations' table.
 *   + 'start_date' (body), must not be empty, should be valid date, 'start_date' should be always less than 'end_date', should be always greater than current placement 'start_date'
 *   + 'end_date' (body), must not be empty, should be valid date, 'end_date' should always be greater than 'start_date'.
 *   + 'comments' (body), optional.
 *   + 'total_billable_hours' (body), must not be empty, hours format validation.
 *   + 'total_hours' (body), must not be empty, hours format validation.
 *   + 'total_ot_hours' (body), must not be empty, hours format validation.
 * */
async function validationRules(req) {
    let updateValidationRules = [];
    if (req.body.id) {
        updateValidationRules = [
            check('id')
                .trim()
                .escape()
                .notEmpty()
                .withMessage(responseMessages.timesheet.TimesheetIdRequired)
                .isUUID()
                .withMessage(responseMessages.timesheet.TimesheetIdInvalid)
                .custom(async (value) => {
                    const timesheets = await indexService.find('timesheets', ['id', 'status', 'reference_id', 'submitted_on'], { id: value });
                    let timesheetData = timesheets.status;
                    if (!timesheetData && value != '') {
                        return Promise.reject(
                            responseMessages.timesheet.TimesheetIdDoesNotExist);
                    } else {
                        if (timesheets.data[0].status == 'Drafted' || timesheets.data[0].status == 'Rejected') {
                            req.body.status = 'Submitted';
                        } else {
                            req.body.status = timesheets.data[0].status;
                        }
                        req.body.timesheet_reference_id = timesheets.data[0].reference_id;
                        req.body.submitted_on = timesheets.data[0].submitted_on;
                    }
                    return true;
                }),
            check('timesheet')
                .notEmpty()
                .withMessage(responseMessages.timesheet.idRequired)
                .custom(async (array) => {
                    // Custom validation function for the 'bank_information' array
                    if (!Array.isArray(array)) {
                        return Promise.reject(
                            responseMessages.timesheet.invalidTimesheetHourId
                        )
                    }

                    array = array.map(obj => obj.id);

                    // find every id in an array is valid or not by getting data from 'timesheet_hours' table.
                    const timesheetHoursData = await indexService.find('timesheet_hours', ['id', 'invoice_raised', 'payroll_raised'], { id: array, timesheet_id: req.body.id }, null); //  id: array,
                    if (timesheetHoursData?.data?.length != array.length) {
                        return Promise.reject(
                            responseMessages.timesheet.invalidTimesheetHourId
                        )
                    } else {
                        // check if any of the timesheet hour has 'invoice' and 'payroll' raised.
                        for (const obj of array) {
                            if (obj.invoice_raised === true) {
                                return Promise.reject(responseMessages.timesheet.timesheetHourInvoices);
                            }

                            if (obj.payroll_raised === true) {
                                return Promise.reject(responseMessages.timesheet.timesheetHourPayrolls);
                            }
                        }
                        return true;
                    }
                }),
            check('documents.*.id')
                .trim()
                .escape()
                .custom(async (value) => {
                    if (check(value).isInt() && value != null && value != '') {
                        return indexService.find('timesheet_documents', ['id'], { id: value }).then((documentsData) => {
                            if (!documentsData.data[0]) {
                                return Promise.reject(
                                    responseMessages.employee.documents.noMatchDocument
                                )
                            }
                        })
                    } else if (value === null || value == '') {
                        return true
                    } else {
                        return Promise.reject(
                            responseMessages.employee.documents.documentIdInvalid
                        )
                    }
                })
        ];
    }
    const validationRules = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('employee_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
            .isUUID()
            .withMessage(responseMessages.employee.employeeIdInvalid)
            .custom(async (value) => {

                /** Check if employee exist or not */
                const employee = await indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: value });
                if (!employee.status) {
                    return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists);
                } else {

                    req.body.employee_name = employee.data[0].display_name;
                    req.body.employee_reference_id = employee.data[0].reference_id;
                    return true;
                }
            }),
        check('placement_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.timesheet.placementIdRequired)
            .isUUID()
            .withMessage(responseMessages.timesheet.invalidPlacementID)
            .custom(async (value) => {
                joins = [
                    {
                        table: 'companies',
                        condition: ['companies.id', 'placements.client_id'],
                        type: 'inner'
                    }
                ];
                const placements = await indexService.find('placements', ['placements.id', 'placements.reference_id', 'companies.reference_id as client_reference_id', 'placements.timesheet_configuration_id', 'placements.start_date', 'companies.name as company_name', 'placements.ts_next_cycle_start'], { 'placements.id': value }, null, joins);
                if (!placements.status) {
                    return Promise.reject(responseMessages.timesheet.placementIdDoesNotExist);
                } else {

                    // check if any timesheet exist for placement_id with from and to date getting from the request
                    const timesheets = await indexService.find('timesheets', ['id'], { placement_id: value, from: req.body.start_date, to: req.body.end_date });
                    if (timesheets.status) {
                        if (req.body.id != timesheets?.data[0]?.id) {
                            throw new InvalidRequestError(
                                responseMessages.timesheet.timesheetAlreadyExists,
                                responseCodes.codeUnprocessableEntity);
                        }
                    }
                    req.body.timesheet_configuration_id = placements.data[0].timesheet_configuration_id;
                    req.body.current_placement_start_date = placements.data[0].start_date;
                    req.body.placement_reference_id = placements.data[0].reference_id;
                    req.body.client_reference_id = placements.data[0].client_reference_id;
                    req.body.existing_ts_next_cycle_start = placements.data[0].ts_next_cycle_start;
                    req.body.company_name = placements.data[0].company_name;
                    return true;
                }
            }),
        check('timesheet_configuration_id')
            .custom(async (value) => {
                if (value) {
                    const timesheetConfig = await indexService.find('timesheet_configurations', ['cycle_id', 'ts_mandatory'], { id: value });
                    if (timesheetConfig.data[0]?.ts_mandatory) {
                        if (req.body.documents && req.body.documents.some(doc => doc.new_document_id || doc.id)) {

                        } else {
                            return Promise.reject(responseMessages.timesheet.tsMandatoryInvalid);
                        }
                    }
                } else {
                    return Promise.reject(responseMessages.timesheet.noTimeSheetConfiguration);
                }
            }),
        check('start_date')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.timesheet.startDateRequired)
            .custom(async (value) => {
                let isDate = new Date(value);
                // Invalid date
                if (isNaN(isDate.getTime())) {
                    return Promise.reject(responseMessages.timesheet.invalidStartDate);
                }
                // 'start_date' should be always less than 'end_date'
                if (isDate.getTime() > new Date(req.body.end_date).getTime()) {
                    return Promise.reject(responseMessages.timesheet.invalidStartDate);
                }

                // 'start_date' should be always greater than current placement start_date
                let currentPlacementStartDate = new Date(req.body.current_placement_start_date)
                if (isDate.getTime() < new Date(currentPlacementStartDate).getTime()) {
                    return Promise.reject(responseMessages.timesheet.timsheetDateIsGreaterThanStartDate);
                }

                const timesheetConfig = await indexService.find('timesheets', ['id', 'placement_id', 'to'], { 'global_search': `"placement_id" = '${req.body.placement_id}' and "from" <= '${value}' and "to" >= '${req.body.start_date}'` });
                if (timesheetConfig.status) {
                    if (req.body.id != timesheetConfig?.data[0]?.id) {
                        return Promise.reject(responseMessages.timesheet.timesheetAlreadyExists);
                    }
                }
            }),
        check('end_date')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.timesheet.endDateRequired)
            .custom((value) => {
                // In Valid Date
                let isDate = new Date(value);
                if (isNaN(isDate.getTime())) {
                    return Promise.reject(responseMessages.timesheet.invalidEndDate);
                }

                // 'end_date' should always be greater than 'start_date'
                if (isDate.getTime() < new Date(req.body.start_date).getTime()) {
                    return Promise.reject(responseMessages.timesheet.invalidEndDate);
                }
                return true;
            }),
        check('comments')
            .trim()
            .escape()
            .isString()
            .withMessage(responseMessages.timesheet.commentsInvalid),
        check('total_billable_hours')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.timesheet.totalBillableHoursRequired)
            .custom((value) => {
                if (!hoursValidationRegex.test(value)) {
                    return Promise.reject(responseMessages.timesheet.totalBillableHoursInvalid);
                }
                return true;
            }),
        check('total_hours')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.timesheet.totalHoursRequired)
            .custom(async (value) => {
                if (!hoursValidationRegex.test(value)) {
                    return Promise.reject(responseMessages.timesheet.totalHoursInvalid);
                }

                // 'total_hours' should be equal to all total_hours from 'timesheet' array
                const hoursValidation = await hoursMinutesValidation(req.body.timesheet, req.body?.total_hours, 'total_hours');

                if (hoursValidation) {
                    return true;
                } else {
                    return Promise.reject(responseMessages.timesheet.totalHoursInvalid);
                }
            }),
        check('total_ot_hours')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.timesheet.totalApprovedHoursRequired)
            .custom(async (value) => {
                if (!hoursValidationRegex.test(value)) {
                    return Promise.reject(responseMessages.timesheet.totalApprovetimesheetAlreadyExistsdHoursInvalid);
                }

                // 'total_ot_hours' should be equal to all ot_hours from 'timesheet' array.
                const hoursValidation = await hoursMinutesValidation(req.body.timesheet, req.body?.total_ot_hours, 'ot_hours');
                if (hoursValidation) {
                    return true;
                } else {
                    return Promise.reject(responseMessages.timesheet.totalOtHoursInvalid);
                }
            }),
        check('timesheet.*.date')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.timesheet.dateRequired)
            .isDate()
            .withMessage(responseMessages.timesheet.dateInvalid).custom((value) => {
                let isDate = new Date(value);
                if (isNaN(isDate.getTime())) {
                    return Promise.reject(responseMessages.timesheet.dateInvalid);
                }
                if (!moment(value).isBetween(req.body.start_date, req.body.end_date, 'days', [])) {
                    return Promise.reject(responseMessages.timesheet.timesheetHoursNotInRange);
                }
                return true;
            }),
        check('timesheet.*.ot_hours')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.timesheet.otHoursRequired)
            .custom((value) => {
                if (!dayHoursValidationRegex.test(value)) {
                    return Promise.reject(responseMessages.timesheet.approvedHoursInvalid);
                }
                return true;
            }),
        check('timesheet.*.billable_hours')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.timesheet.billableHoursRequired)
            .custom((value) => {
                if (!dayHoursValidationRegex.test(value)) {
                    return Promise.reject(responseMessages.timesheet.billableHoursInvalid);
                }
                return true;
            }),

        check('timesheet.*.total_hours')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.timesheet.totalHoursRequired)
            .custom((value) => {
                if (!dayHoursValidationRegex.test(value)) {
                    return Promise.reject(responseMessages.timesheet.totalHoursInvalid);
                }
                return true;
            }),
        check('documents.*.new_document_id')
            .trim()
            .escape()
            .custom(async (value) => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        return indexService.find('temp_upload_documents', ['*'], { id: value }, null, [], null, null, null, false).then((documentsData) => {
                            if (!documentsData.status) {
                                return Promise.reject(responseMessages.employee.documents.newDocumentIdNotExists);
                            }
                        });
                    } else {
                        return Promise.reject(responseMessages.employee.documents.newDocumentIdInvalid);
                    }
                } else {
                    return true;
                }
            })
    ];

    /* Writing validation rules to the input request */
    return [...updateValidationRules, ...validationRules];
}

/**
 * Store function to create a new timesheet
 * 
 * Overview of function:
 * - Validate the request.
 *   + If successful
 *   ~ Call the 'store' service function to create a new timesheet.
 *   ~ Prepare the response with success data.
 *   Else
 *   ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Retrieve the organization date format using `format.getDateFormat()`.
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Convert 'start_date' & 'end_date' from organization dates to database format dates
 * - Call 'validationRules' function to get the validation array,
 * - Validate the rules 
 *   + If successfull
 * - Extra Validation
 *   + Make the timesheets dates order.
 *   + Timesheets hours should be equal to the days difference of 'start_dat' & 'end_date'
 *   + timesheet ('tsUniqueCheck') hours first 'date' should be equal to 'start_date' 
 *   + If successful
 * - Call the store function to create the timesheets
 *    + If Success:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with error message.
 * - If validation fails:
 *    + Add error validation to the response.
 * - Log the response.
 * - Return the response using `responseHandler()`.
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
    logRequest('info', req, 'New timesheet creation request');
    /* Log Request */

    /* Default Variable */
    let responseData;
    /* Default Variable */

    if (req.body.timesheet && req.body.start_date && req.body.end_date) {
        // convert organization dates to database format dates
        req.body.timesheet.forEach((item) => {
            if (item.date) {
                item.date = moment(item.date, dateFormat).format('YYYY-MM-DD');
            }
        });
        req.body.start_date = moment(req.body.start_date, dateFormat).format('YYYY-MM-DD');
        req.body.end_date = moment(req.body.end_date, dateFormat).format('YYYY-MM-DD');

        validations = await validationRules(req);

        /*Run the validation rules. */
        for (let validation of validations) {
            let result = await validation.run(req);
            if (result.errors.length) break;
        }
        let errors = validationResult(req);
        /*Run the validation rules. */

        /**
         * If validation is success
         *    + Call the create new timesheet service function
         *    - Based on the status in create new timesheet function response, segregate the response and prepare the response
         * If Validation Fails
         *    + Return the error message.
         */
        if (errors.isEmpty()) {
            let weeklyBody = req.body.timesheet;
            const start_date = req.body.start_date;
            const end_date = req.body.end_date;
            const cycle_days = moment(end_date).diff(start_date, 'days');

            // Make the timesheets dates order
            const tsUniqueCheck = [...new Set(weeklyBody.map((item) => item.date))].sort();

            /* Checking dates */
            timesheetOrder = false;
            if (tsUniqueCheck.length == cycle_days + 1) {  // timesheets hours should be equal to the days difference of 'start_dat' & 'end_date'
                timesheetOrder = true;
                let currentTS = start_date;

                // timesheet ('tsUniqueCheck') hours first 'date' should be equal to 'start_date' 
                tsUniqueCheck.map(async (order) => {
                    if (currentTS != order) {
                        timesheetOrder = false;
                    }
                    currentTS = moment(currentTS).add(1, 'days').format('YYYY-MM-DD');
                });
            }
            /* Checking dates */
            if (timesheetOrder) {
                req.body.isDrafted = false
                var timesheetData = await timesheetsService.store(req.body);
                if (timesheetData.status) {
                    responseData = {
                        statusCode: responseCodes.codeSuccess,
                        message: responseMessages.common.success,
                    };
                } else {
                    responseData = {
                        statusCode: responseCodes.codeInternalError,
                        message: responseMessages.common.somethindWentWrong,
                        error: timesheetData.error
                    };
                }

            } else {
                throw new InvalidRequestError(
                    responseMessages.timesheet.timesheetHoursInvalid,
                    responseCodes.codeUnprocessableEntity,
                );
            }

            /* Log Response */
            logResponse('info', req, responseData, 'New new timesheet registration response');
            /* Log Response */

            /* Return the response */
            responseHandler(res, responseData);
            /* Return the response */

        } else {
            throw new InvalidRequestError(
                errors.array()[0].msg,
                responseCodes.codeUnprocessableEntity,
            );
        }
    } else {
        throw new InvalidRequestError(responseMessages.timesheet.invalidData);
    }
});

/**
 * ocr Store function to create a new timesheet
 * 
 * Overview of function:
 * - Validate the request.
 *   + If successful
 *   ~ Call the 'store' service function to create a new timesheet.
 *   ~ Prepare the response with success data.
 *   Else
 *   ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Retrieve the organization date format using `format.getDateFormat()`.
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Convert 'start_date' & 'end_date' from organization dates to database format dates
 * - Call 'validationRules' function to get the validation array,
 * - Validate the rules 
 *   + If successfull
 * - Extra Validation
 *   + Make the timesheets dates order.
 *   + Timesheets hours should be equal to the days difference of 'start_dat' & 'end_date'
 *   + timesheet ('tsUniqueCheck') hours first 'date' should be equal to 'start_date' 
 *   + If successful
 * - Call the store function to create the timesheets
 *    + If Success:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with error message.
 * - If validation fails:
 *    + Add error validation to the response.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 * 
 * Notes:
 *  - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const ocrStore = tryCatch(async (req, res) => {
    let dateFormat = await format.getDateFormat(); // date format

    /* Log Request */
    logRequest('info', req, 'New ocr timesheet creation request');
    /* Log Request */

    /* Default Variable */
    let responseData;
    /* Default Variable */

    if (req.body.timesheet && req.body.timesheet.length > 0) {
        for(const key in req.body.timesheet) {
            req.body.timesheet[key].ot_hours = req.body.timesheet[key].ot_hours.replace('.', ':');
            req.body.timesheet[key].billable_hours = req.body.timesheet[key].billable_hours.replace('.', ':');
            req.body.timesheet[key].total_hours = req.body.timesheet[key].total_hours.replace('.', ':');
        }
    }

    if(req.body.total_billable_hours != null && req.body.total_billable_hours != ""){
        req.body.total_billable_hours = req.body.total_billable_hours.replace('.', ':');
    }

    if(req.body.total_hours != null && req.body.total_hours != ""){
        req.body.total_hours = req.body.total_hours.replace('.', ':');
    }

    if(req.body.total_ot_hours != null && req.body.total_ot_hours != ""){
        req.body.total_ot_hours = req.body.total_ot_hours.replace('.', ':');
    }

    if (req.body.timesheet && req.body.start_date && req.body.end_date) {
        // convert organization dates to database format dates
        req.body.timesheet.forEach((item) => {
            if (item.date) {
                item.date = moment(item.date, dateFormat).format('YYYY-MM-DD');
            }
        });
        req.body.start_date = moment(req.body.start_date, dateFormat).format('YYYY-MM-DD');
        req.body.end_date = moment(req.body.end_date, dateFormat).format('YYYY-MM-DD');

        const validations = [
            check('request_id')
                .trim()
                .escape()
                .notEmpty()
                .withMessage(responseMessages.common.requestIdRequired),
            check('employee_id')
                .trim()
                .escape()
                .notEmpty()
                .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
                .isUUID()
                .withMessage(responseMessages.employee.employeeIdInvalid)
                .custom(async (value) => {
                    /** Check if employee exist or not */
                    const employee = await indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: value });
                    if (!employee.status) {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists);
                    } else {
                        req.body.employee_name = employee.data[0].display_name;
                        req.body.employee_reference_id = employee.data[0].reference_id;
                        return true;
                    }
                }),
        check('client_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.client.clientIdRequired)
            .isUUID()
            .withMessage(responseMessages.client.clientIdInvalid)
            .custom(async value => {
                const cleintData = await indexService.find('companies', ['id', 'reference_id'], { id: value, entity_type: 'client' });
                if (!cleintData.status) {
                    return Promise.reject(responseMessages.client.clientIdNotExists);
                }
                let condition = {
                    employee_id: req.body.employee_id,
                    client_id: value,
                    project_closed: false
                }
                const placementData = await indexService.find('placements', ['id'], condition)
                if(placementData.status){
                    req.body.placement_id = placementData.data[0].id
                } else {
                    return Promise.reject(`No active placement found for Employee ${req.body.employee_reference_id} with Client ${cleintData.data[0].reference_id}.`);
                }
            }),
            check('placement_id')
                .trim()
                .escape()
                .notEmpty()
                .withMessage(responseMessages.timesheet.placementIdRequired)
                .isUUID()
                .withMessage(responseMessages.timesheet.invalidPlacementID)
                .custom(async (value) => {
                    joins = [
                        {
                            table: 'companies',
                            condition: ['companies.id', 'placements.client_id'],
                            type: 'inner'
                        }
                    ];
                    const placements = await indexService.find('placements', ['placements.id', 'placements.reference_id', 'companies.reference_id as client_reference_id', 'placements.timesheet_configuration_id', 'placements.start_date', 'companies.name as company_name', 'placements.ts_next_cycle_start'], { 'placements.id': value }, null, joins);
                    if (!placements.status) {
                        return Promise.reject(responseMessages.timesheet.placementIdDoesNotExist);
                    } else {
    
                        // check if any timesheet exist for placement_id with from and to date getting from the request
                        const timesheets = await indexService.find('timesheets', ['id'], { placement_id: value, from: req.body.start_date, to: req.body.end_date });
                        if (timesheets.status) {
                            if (req.body.id != timesheets?.data[0]?.id) {
                                throw new InvalidRequestError(
                                    responseMessages.timesheet.timesheetAlreadyExists,
                                    responseCodes.codeUnprocessableEntity);
                            }
                        }
                        req.body.timesheet_configuration_id = placements.data[0].timesheet_configuration_id;
                        req.body.current_placement_start_date = placements.data[0].start_date;
                        req.body.placement_reference_id = placements.data[0].reference_id;
                        req.body.client_reference_id = placements.data[0].client_reference_id;
                        req.body.existing_ts_next_cycle_start = placements.data[0].ts_next_cycle_start;
                        req.body.company_name = placements.data[0].company_name;
                        return true;
                    }
                }),
            check('timesheet_configuration_id')
                .custom(async (value) => {
                    if (value) {
                        const timesheetConfig = await indexService.find('timesheet_configurations', ['cycle_id', 'ts_mandatory'], { id: value });
                        if (timesheetConfig.data[0]?.ts_mandatory) {
                            if (req.body.documents && req.body.documents.some(doc => doc.new_document_id || doc.id)) {
    
                            } else {
                                return Promise.reject(responseMessages.timesheet.tsMandatoryInvalid);
                            }
                        }
                    } else {
                        return Promise.reject(responseMessages.timesheet.noTimeSheetConfiguration);
                    }
                }),
            check('start_date')
                .trim()
                .notEmpty()
                .withMessage(responseMessages.timesheet.startDateRequired)
                .custom(async (value) => {
                    let isDate = new Date(value);
                    // Invalid date
                    if (isNaN(isDate.getTime())) {
                        return Promise.reject(responseMessages.timesheet.invalidStartDate);
                    }
                    // 'start_date' should be always less than 'end_date'
                    if (isDate.getTime() > new Date(req.body.end_date).getTime()) {
                        return Promise.reject(responseMessages.timesheet.invalidStartDate);
                    }
    
                    // 'start_date' should be always greater than current placement start_date
                    let currentPlacementStartDate = new Date(req.body.current_placement_start_date)
                    if (isDate.getTime() < new Date(currentPlacementStartDate).getTime()) {
                        return Promise.reject(responseMessages.timesheet.timsheetDateIsGreaterThanStartDate);
                    }
    
                    const timesheetConfig = await indexService.find('timesheets', ['id', 'placement_id', 'to'], { 'global_search': `"placement_id" = '${req.body.placement_id}' and "from" <= '${value}' and "to" >= '${req.body.start_date}'` });
                    if (timesheetConfig.status) {
                        if (req.body.id != timesheetConfig?.data[0]?.id) {
                            return Promise.reject(responseMessages.timesheet.timesheetAlreadyExists);
                        }
                    }
                }),
            check('end_date')
                .trim()
                .notEmpty()
                .withMessage(responseMessages.timesheet.endDateRequired)
                .custom((value) => {
                    // In Valid Date
                    let isDate = new Date(value);
                    if (isNaN(isDate.getTime())) {
                        return Promise.reject(responseMessages.timesheet.invalidEndDate);
                    }
    
                    // 'end_date' should always be greater than 'start_date'
                    if (isDate.getTime() < new Date(req.body.start_date).getTime()) {
                        return Promise.reject(responseMessages.timesheet.invalidEndDate);
                    }
                    return true;
                }),
            check('comments')
                .trim()
                .escape()
                .isString()
                .withMessage(responseMessages.timesheet.commentsInvalid),
            check('total_billable_hours')
                .trim()
                .notEmpty()
                .withMessage(responseMessages.timesheet.totalBillableHoursRequired)
                .custom((value) => {
                    if (!hoursValidationRegex.test(value)) {
                        return Promise.reject(responseMessages.timesheet.totalBillableHoursInvalid);
                    }
                    return true;
                }),
            check('total_hours')
                .trim()
                .notEmpty()
                .withMessage(responseMessages.timesheet.totalHoursRequired)
                .custom(async (value) => {
                    if (!hoursValidationRegex.test(value)) {
                        return Promise.reject(responseMessages.timesheet.totalHoursInvalid);
                    }
    
                    // 'total_hours' should be equal to all total_hours from 'timesheet' array
                    const hoursValidation = await hoursMinutesValidation(req.body.timesheet, req.body?.total_hours, 'total_hours');
    
                    if (hoursValidation) {
                        return true;
                    } else {
                        return Promise.reject(responseMessages.timesheet.totalHoursInvalid);
                    }
                }),
            check('total_ot_hours')
                .trim()
                .notEmpty()
                .withMessage(responseMessages.timesheet.totalApprovedHoursRequired)
                .custom(async (value) => {
                    if (!hoursValidationRegex.test(value)) {
                        return Promise.reject(responseMessages.timesheet.totalApprovetimesheetAlreadyExistsdHoursInvalid);
                    }
    
                    // 'total_ot_hours' should be equal to all ot_hours from 'timesheet' array.
                    const hoursValidation = await hoursMinutesValidation(req.body.timesheet, req.body?.total_ot_hours, 'ot_hours');
                    if (hoursValidation) {
                        return true;
                    } else {
                        return Promise.reject(responseMessages.timesheet.totalOtHoursInvalid);
                    }
                }),
            check('timesheet.*.date')
                .trim()
                .notEmpty()
                .withMessage(responseMessages.timesheet.dateRequired)
                .isDate()
                .withMessage(responseMessages.timesheet.dateInvalid).custom((value) => {
                    let isDate = new Date(value);
                    if (isNaN(isDate.getTime())) {
                        return Promise.reject(responseMessages.timesheet.dateInvalid);
                    }
                    if (!moment(value).isBetween(req.body.start_date, req.body.end_date, 'days', [])) {
                        return Promise.reject(responseMessages.timesheet.timesheetHoursNotInRange);
                    }
                    return true;
                }),
            check('timesheet.*.ot_hours')
                .trim()
                .notEmpty()
                .withMessage(responseMessages.timesheet.otHoursRequired)
                .custom((value) => {
                    if (!dayHoursValidationRegex.test(value)) {
                        return Promise.reject(responseMessages.timesheet.approvedHoursInvalid);
                    }
                    return true;
                }),
            check('timesheet.*.billable_hours')
                .trim()
                .notEmpty()
                .withMessage(responseMessages.timesheet.billableHoursRequired)
                .custom((value) => {
                    if (!dayHoursValidationRegex.test(value)) {
                        return Promise.reject(responseMessages.timesheet.billableHoursInvalid);
                    }
                    return true;
                }),
    
            check('timesheet.*.total_hours')
                .trim()
                .notEmpty()
                .withMessage(responseMessages.timesheet.totalHoursRequired)
                .custom((value) => {
                    if (!dayHoursValidationRegex.test(value)) {
                        return Promise.reject(responseMessages.timesheet.totalHoursInvalid);
                    }
                    return true;
                }),
            check('documents.*.new_document_id')
                .trim()
                .escape()
                .custom(async (value) => {
                    if (value != null && value != '') {
                        let pattern = regexPatterns.uuidRegex;
                        if (pattern.test(value)) {
                            return indexService.find('temp_upload_documents', ['*'], { id: value }, null, [], null, null, null, false).then((documentsData) => {
                                if (!documentsData.status) {
                                    return Promise.reject(responseMessages.employee.documents.newDocumentIdNotExists);
                                }
                            });
                        } else {
                            return Promise.reject(responseMessages.employee.documents.newDocumentIdInvalid);
                        }
                    } else {
                        return true;
                    }
                })
        ];
        /*Run the validation rules. */
        for (let validation of validations) {
            let result = await validation.run(req);
            if (result.errors.length) break;
        }
        let errors = validationResult(req);
        /*Run the validation rules. */

        /**
         * If validation is success
         *    + Call the create new timesheet service function
         *    - Based on the status in create new timesheet function response, segregate the response and prepare the response
         * If Validation Fails
         *    + Return the error message.
         */
        if (errors.isEmpty()) {
            let weeklyBody = req.body.timesheet;
            const start_date = req.body.start_date;
            const end_date = req.body.end_date;
            const cycle_days = moment(end_date).diff(start_date, 'days');

            // Make the timesheets dates order
            const tsUniqueCheck = [...new Set(weeklyBody.map((item) => item.date))].sort();

            /* Checking dates */
            timesheetOrder = false;
            if (tsUniqueCheck.length == cycle_days + 1) {  // timesheets hours should be equal to the days difference of 'start_dat' & 'end_date'
                timesheetOrder = true;
                let currentTS = start_date;

                // timesheet ('tsUniqueCheck') hours first 'date' should be equal to 'start_date' 
                tsUniqueCheck.map(async (order) => {
                    if (currentTS != order) {
                        timesheetOrder = false;
                    }
                    currentTS = moment(currentTS).add(1, 'days').format('YYYY-MM-DD');
                });
            }
            /* Checking dates */
            if (timesheetOrder) {
                req.body.isDrafted = true
                var timesheetData = await timesheetsService.store(req.body);
                if (timesheetData.status) {
                    responseData = {
                        statusCode: responseCodes.codeSuccess,
                        message: responseMessages.common.success,
                    };
                } else {
                    responseData = {
                        statusCode: responseCodes.codeInternalError,
                        message: responseMessages.common.somethindWentWrong,
                        error: timesheetData.error
                    };
                }

            } else {
                throw new InvalidRequestError(
                    responseMessages.timesheet.timesheetHoursInvalid,
                    responseCodes.codeUnprocessableEntity,
                );
            }

            /* Log Response */
            logResponse('info', req, responseData, 'New new timesheet registration response');
            /* Log Response */

            /* Return the response */
            responseHandler(res, responseData);
            /* Return the response */

        } else {
            throw new InvalidRequestError(
                errors.array()[0].msg,
                responseCodes.codeUnprocessableEntity,
            );
        }
    } else {
        throw new InvalidRequestError(responseMessages.timesheet.invalidData);
    }
});

/**
 * Update function to update the details of the timesheet
 * 
 * Overview of the function:
 * - Validate the request.
 *   + If successful
 *     ~ Call the 'status' service function to update the status of a timesheet.
 *     ~ Prepare the response with success data.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Convert 'start_date' & 'end_date' from organization dates to database format dates
 * - Call 'validationRules' function to get the validation array,
 * - Validate the rules 
 *   + If successfull
 * - Extra Validation
 *   + Make the timesheets dates order.
 *   + Timesheets hours should be equal to the days difference of 'start_dat' & 'end_date'
 *   + timesheet ('tsUniqueCheck') hours first 'date' should be equal to 'start_date' 
 *   + If successful
 * - Call the update function to update the timesheets data
 *    + If Success:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with error message.
 * - If validation fails:
 *    + Add error validation to the response.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 * 
 * Notes:
 *  - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns Json
 * @throws {InvalidRequestError} If the request data is invalid.
 */
const update = tryCatch(async (req, res) => {
    let dateFormat = await format.getDateFormat(); // date format
    /* Log Request */
    logRequest('info', req, 'Timesheet updation request');
    /* Log Request */

    /* Default Variable */
    let responseData;
    /* Default Variable */

    if (req.body.timesheet && req.body.start_date && req.body.end_date) {

        req.body.start_date = moment(req.body.start_date, dateFormat).format('YYYY-MM-DD');
        req.body.end_date = moment(req.body.end_date, dateFormat).format('YYYY-MM-DD');

        req.body.id = req.params.id;
        validations = await validationRules(req);

        /*Run the validation rules. */
        for (let validation of validations) {
            let result = await validation.run(req);
            if (result.errors.length) break;
        }
        let errors = validationResult(req);
        /*Run the validation rules. */

        /**
         * If validation is success
         *    + Call the create new timesheet service function
         *    - Based on the status in create new timesheet function response, segregate the response and prepare the response
         * If Validation Fails
         *    + Return the error message.
         */
        if (errors.isEmpty()) {
            let weeklyBody = req.body.timesheet;
            const start_date = req.body.start_date;
            const end_date = req.body.end_date;
            const cycle_days = moment(end_date).diff(start_date, 'days');

            // Make the timesheets dates order
            const tsUniqueCheck = [...new Set(weeklyBody.map((item) => item.date))].sort();

            /* Checking dates */
            timesheetOrder = false;
            if (tsUniqueCheck.length == cycle_days + 1) {  // timesheets hours should be equal to the days difference of 'start_dat' & 'end_date'
                timesheetOrder = true;
                let currentTS = start_date;

                // timesheet ('tsUniqueCheck') hours first 'date' should be equal to 'start_date' 
                tsUniqueCheck.map(async (order) => {
                    if (currentTS != order) {
                        timesheetOrder = false;
                    }
                    currentTS = moment(currentTS).add(1, 'days').format('YYYY-MM-DD');
                });
            }

            /* Checking dates */
            if (timesheetOrder) {
                var timesheetData = await timesheetsService.update(req.body);
                if (timesheetData.status) {
                    responseData = {
                        statusCode: responseCodes.codeSuccess,
                        message: responseMessages.common.success,
                    };
                } else {
                    responseData = {
                        statusCode: responseCodes.codeInternalError,
                        message: responseMessages.common.somethindWentWrong,
                        error: timesheetData.error
                    };
                }
            } else {
                throw new InvalidRequestError(
                    responseMessages.timesheet.dateInvalid,
                    responseCodes.codeUnprocessableEntity,
                );
            }

            /* Log Response */
            logResponse('info', req, responseData, 'TImsheet updation completed');
            /* Log Response */

            /* Return the response */
            responseHandler(res, responseData);
            /* Return the response */

        } else {
            throw new InvalidRequestError(
                errors.array()[0].msg,
                responseCodes.codeUnprocessableEntity,
            );
        }
    } else {
        throw new InvalidRequestError(responseMessages.timesheet.invalidData);
    }
});

async function hoursMinutesValidation(hours, compareHours, key) {
    // Initialize variables to store the total hours and total minutes
    let totalHours = 0;
    let totalMinutes = 0;

    // Iterate through the 'timesheet' array and calculate the sum of total_hours
    hours.forEach((item) => {
        const time = item[key];
        const [hours, minutes] = time.split(":").map(Number);
        totalHours += hours;
        totalMinutes += minutes;
    });

    // If the total minutes exceed 60, adjust the total hours
    if (totalMinutes >= 60) {
        const additionalHours = Math.floor(totalMinutes / 60);
        totalHours += additionalHours;
        totalMinutes = totalMinutes % 60;
    }

    const [targetHours, targetMinutes] = compareHours.split(":").map(Number);

    if (totalHours < targetHours || (totalHours === targetHours && totalMinutes < targetMinutes)) {
        // The 'timesheet -> total_hours' time is less than 'total_hours'".
        return false;
    } else if (totalHours === targetHours && totalMinutes === targetMinutes) {
        return true;
    } else {
        // "The 'timesheet -> total_hours' is greater total_hours'".
        return false;
    }
}



const index = tryCatch(async (req, res) => {

    let dateFormat = await format.getDateFormat();

    /* Log Request */
    logRequest('info', req, 'getting single Approval Configuaration request');
    /* Log Request */

    /* Default Variable */
    let responseData;
    /* Default Variable */

    // Writing validation rules to the input request
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('id')
            .trim().escape()
            .custom(async value => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        const timesheetData = await indexService.find('timesheets', ['id'], { id: value });
                        if (!timesheetData.status) {
                            return Promise.reject(responseMessages.timesheet.TimesheetIdDoesNotExist);
                        }
                    } else {
                        return Promise.reject(responseMessages.timesheet.invalidData);
                    }
                } else {
                    return Promise.reject(responseMessages.timesheet.TimesheetIdRequired);

                }
            }),
    ]

    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);


    if (errors.isEmpty()) {

        let query = removeEmptyAndUndefinedKeys(req.query);

        /* Default Variable */
        let condition = {};
        /* Default Variable */

        condition.id = query.id;
        condition.loginUserId = req.body.loginUserId;

        let timesheetData = await timesheetsService.index(condition, dateFormat, req.body);
        if (!timesheetData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: timesheetData.message, error: timesheetData.error, message: responseMessages.common.noRecordFound, data: [] };
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: timesheetData.data };
        }
        /* Writing validation rules to the input request */

        /* Log Response */
        logResponse('info', req, responseData, 'Approval Setting index Response');
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors, responseCodes.codeUnprocessableEntity);
    }
});


/**
 * Retrieves timesheet listings based on provided query parameters.
 *
 * @param {object} req - The request object containing query parameters.
 * @param {object} res - The response object to send the retrieved timesheet listings.
 * @returns {object} - An object containing retrieved timesheet listings, pagination details, and statistics.
 *
 * Logic:
 * - Validates the request query parameters for various conditions like employee ID, placement ID, client ID, etc.
 * - Validates 'from_date' and 'to_date' if provided in the query parameters.
 * - Constructs a condition object based on query parameters and applies default values for pagination.
 * - Executes a service function 'timesheetsService.listing' to fetch timesheet listings based on the constructed condition.
 * - Handles the response based on the success or failure of fetching timesheet listings.
 * - Returns an object with status, retrieved data, pagination details, and statistics (if available).
 */
const listing = tryCatch(async (req, res) => {
    let dateFormat = await format.getDateFormat(); // date format

    /* Log Request */
    logRequest('info', req, 'getting Timesheet Listing request');
    /* Log Request */

    /* Default Variable */
    let responseData;
    /* Default Variable */

    var condition = {
        from_date: null,
        to_date: null
    };

    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('employee_id')
            .trim().escape()
            .optional()
            .custom(async value => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        const employeeData = await indexService.find('employee', ['id', 'reference_id'], { id: value });
                        if (!employeeData.status) {
                            return Promise.reject(responseMessages.employee.employeeIdNotExists);
                        }
                    } else {
                        return Promise.reject(responseMessages.employee.employeeIdInvalid);

                    }
                }
            }),
        check('placement_id')
            .trim().escape()
            .optional()
            .custom(async value => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        const employeeData = await indexService.find('placements', ['id', 'reference_id'], { id: value });
                        if (!employeeData.status) {
                            return Promise.reject(responseMessages.placement.placementIdNotExists);
                        }
                    } else {
                        return Promise.reject(responseMessages.placement.placementIdInvalid);

                    }
                }
            }),
        check('client_id')
            .trim().escape()
            .optional()
            .custom(async value => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        const employeeData = await indexService.find('companies', ['id', 'reference_id'], { id: value, entity_type: 'client' });
                        if (!employeeData.status) {
                            return Promise.reject(responseMessages.client.clientIdNotExists);
                        }
                    } else {
                        return Promise.reject(responseMessages.client.clientIdInvalid);

                    }
                }
            }),
        check('end_client_id')
            .trim().escape()
            .optional()
            .custom(async value => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        const employeeData = await indexService.find('companies', ['id', 'reference_id'], { id: value, entity_type: 'end-client' });
                        if (!employeeData.status) {
                            return Promise.reject(responseMessages.endClients.IdNotExists);
                        }
                    } else {
                        return Promise.reject(responseMessages.endClients.endClientIdInvalid);

                    }
                }
            }),
        check('employee_name')
            .trim().escape()
            .optional()
            .custom(async value => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.alphaCharactersAndSpacesOnly;
                    if (!pattern.test(value)) {
                        return Promise.reject(responseMessages.employee.invalidEmployeeName);
                    }
                }
            }),
        check('client_name')
            .trim().escape()
            .optional()
            .custom(async value => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.alphaCharactersAndSpacesOnly;
                    if (!pattern.test(value)) {
                        return Promise.reject(responseMessages.client.clientNameInvalid);
                    }
                }
            }),
        check('end_client_name')
            .trim().escape()
            .optional()
            .custom(async value => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.alphaCharactersAndSpacesOnly;
                    if (!pattern.test(value)) {
                        return Promise.reject(responseMessages.endClients.endClientsNameInvalid);
                    }
                }
            }),

    ];

    // validate 'from_date' and 'to_date'
    if (req.query.from_date && req.query.to_date) {
        const from_date = moment(req.query.from_date, dateFormat).format('YYYY-MM-DD');
        const to_date = moment(req.query.to_date, dateFormat).format('YYYY-MM-DD');
        if (regexPatterns.dateRegex.test(from_date) && regexPatterns.dateRegex.test(to_date)) {
            condition.from_date = from_date;
            condition.to_date = to_date;
        } else {
            return Promise.reject(responseMessages.timesheet.dateInvalid);
        }
    }

    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    if (errors.isEmpty()) {

        let query = removeEmptyAndUndefinedKeys(req.query);

        /* Default Variable */
        let limit = (query.limit) ? (query.limit) : pagination.limit;
        let page = (query.page) ? (query.page) : pagination.page;

        // let sort_column = query.sort_column ? query.sort_column : '';
        // let sort_order = query.sort_order === 'A' ? 'asc' : req.body.sort_order === 'D' ? 'desc' : '';
        /* Default Variable */

        condition.status = query.status || null;
        condition.placement_id = query.placement_id || null;
        condition.employee_id = query.employee_id || null;
        condition.client_id = query.client_id || null;
        condition.end_client_id = query.end_client_id || null;
        condition.employee_name = query.employee_name || null;
        condition.client_name = query.client_name || null;
        condition.end_client_name = query.end_client_name || null;
        condition.ts_status = (req.query.ts_status) ? req.query.ts_status : null;
        condition.search = query.search ? query.search : null;

        /* Writing validation rules to the input request */
        let timesheetData = await timesheetsService.listing(condition, dateFormat, page, limit);
        if (!timesheetData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.noRecordFound, error: timesheetData.error, message: responseMessages.common.noRecordFound, data: [], pagination: timesheetData.pagination_data };
        }
        else {
            responseData = { statusCode: responseCodes.codeSuccess, message: timesheetData.message, data: timesheetData.data, pagination: timesheetData.pagination_data, statistics: timesheetData.statistics };
        }
        /* Writing validation rules to the input request */

        /* Log Response */
        logResponse('info', req, responseData, 'Approval Setting   Response');
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * deleteTimesheet fucntion to delete the the timesheet
 * 
 * Overview of Function:
 * - Validate the request.
 *   + If successful
 *     ~ Call the 'deleteTimesheets' service function to delete the timesheet.
 *     ~ Prepare the response with success data.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Login:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *   + 'request_id' (body), must not be empty.
 *   + 'id' (body), must not be empty, must be uuid, should exist in 'timesheets' table.
 *   + 'placement_id' (body), must not be empty, must be uuid, should exist in 'placements' table.
 *   + 'timesheet_hour_ids' (body), must not be empty, restrict to delete if 'invoice' and 'payroll' are raised.
 *     ~ find every id in an array is valid or not by getting data from 'timesheet_hours' table
 *     ~ check if any of the timesheet hour has 'invoice' and 'payroll' raised.
 * - Run the validation rules.
 * - If validation is successful:
 *   + Call the `deleteTimesheets` service function to delete a timesheet.
 *   + If Success:
 *     - Prepare the response with success data.
 *   + Else:
 *     - Prepare the response with error message.
 * - If validation fails:
 *   + Add error validation to the response.
 *  - Log the response.
 *  - Return the response using `responseHandler()`.
 * 
 * Notes:
 * - Exception handling using try-catch
 * 
 * Handles the delete request for timesheet delete.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns Json
 * @throws {InvalidRequestError} If the request is invalid.
 */
const deleteTimesheet = tryCatch(async (req, res) => {

    /* Log Request */
    logRequest('info', req, 'getting single Approval Configuaration request');
    /* Log Request */

    /* Default Variable */
    let responseData;
    /* Default Variable */

    req.body.id = req.params.id;

    /* Writing validation rules to the input request */
    let validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.timesheet.TimesheetIdRequired)
            .isUUID()
            .withMessage(responseMessages.timesheet.TimesheetIdInvalid)
            .custom(async (value) => {
                const timesheets = await indexService.find('timesheets', ['id', 'status', 'reference_id', 'placement_id'], { id: value });
                let status = timesheets.status;
                if (!status) {
                    return Promise.reject(responseMessages.timesheet.TimesheetIdInvalid);
                }
                if (timesheets.data[0].status = 'Drafted') {
                    return Promise.reject(responseMessages.timesheet.TimesheetNotDelete);
                }
                req.body.timesheet_reference_id = timesheets.data[0].reference_id;
                req.body.placement_id = timesheets.data[0].placement_id;
                return true;
            }),
    ];
    /* Writing validation rules to the input request */

    /*Run the validation rules. */
    for (let validation of validations) {
        let result = await validation.run(req);
        if (result.errors.length) break;
    }
    let errors = validationResult(req);
    /*Run the validation rules. */

    if (errors.isEmpty()) {
        var timesheetData = await timesheetsService.deleteTimesheets(req.body);
        if (timesheetData.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.deletedSuccessfully
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeInternalError,
                message: responseMessages.common.somethindWentWrong,
                error: timesheetData.error
            }
        }

        /* Log Response */
        logResponse('info', req, responseData, 'Delete Timesheet');
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity,
        );
    }

});

/**
 * Status function to update the status of the timesheet
 * 
 * Overview of the function:
 * - Validate the request.
 *   + If successful
 *     ~ Call the 'status' service function to update the status of a timesheet.
 *     ~ Prepare the response with success data.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *   + 'request_id' (body), must not be empty.
 *   + 'timesheet_id' (body), must not be empty, valid uuid, shoudl exist in 'timesheets' table.
 *   + 'placement_id' (body), must not be empty, should be a valid UUID, should exist in the 'placements' table, should have 'timesheet_approval_id'.
 *   + 'status' (body), must not be empty, must be boolean.
 *   + 'comments' (body), optional, must be string.
 *   + 'timesheet_approval_id' (body), mandatory for status update.
 *     ~ must exist in 'approval_settings' table.
 * - Run the validation rules.
 * - If validation is successful:
 *   + Call the `status` service function to update the status of an timesheet.
 *    + If Success:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with error message.
 * - If validation fails:
 *    + Add error validation to the response.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 * 
 * Notes:
 *  - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns Json
 * @throws {InvalidRequestError} - If there are validation errors.
 */
const status = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, 'Timesheet status update request');
    /* Log Request */

    /* Default Variable */
    let responseData;
    /* Default Variable */

    /* Writing validation rules to the input request */
    const validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('timesheet_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.timesheet.TimesheetIdRequired)
            .isUUID()
            .withMessage(responseMessages.timesheet.TimesheetIdInvalid)
            .custom(async (value) => {
                const timesheets = await indexService.find('timesheets', ['id', 'approval_level', 'reference_id'], { id: value });
                let timesheetData = timesheets.status;
                if (!timesheetData && value != '') {
                    return Promise.reject(
                        responseMessages.timesheet.TimesheetIdDoesNotExist);
                } else {
                    req.body.approval_level = timesheets.data[0].approval_level;
                    req.body.level = timesheets.data[0].approval_level; // for storing in approval track not manipulatimg the original level
                    req.body.reference_id = timesheets.data[0].reference_id;
                }
                return true;
            }),
        check('placement_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.timesheet.placementIdRequired)
            .isUUID()
            .withMessage(responseMessages.timesheet.invalidPlacementID)
            .custom(async (value) => {
                const placements = await indexService.find('placements', ['id', 'timesheet_approval_id', 'client_id', 'employee_id'], { id: value });
                let placementData = placements.status;
                if (!placementData && value != '') {
                    return Promise.reject(
                        responseMessages.timesheet.placementIdDoesNotExist);

                } else if (placements.data[0].timesheet_approval_id == null) { //should have 'timesheet_approval_id
                    return Promise.reject(
                        responseMessages.timesheet.enableToConfigureTimesheet);
                } else {
                    req.body.timesheet_approval_id = placements.data[0].timesheet_approval_id;
                    req.body.client_id = placements.data[0].client_id
                    req.body.employee_id = placements.data[0].employee_id
                }
                return true;
            }),
        check('status')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.timesheet.statusRequired)
            .isIn(['Drafted', 'Approval In Progress', 'Rejected', 'Approved'])
            .withMessage(responseMessages.timesheet.statusInvalid),
        check('comments')
            .trim()
            .escape()
            .isString()
            .withMessage(responseMessages.timesheet.commentsInvalid),
        check('timesheet_approval_id')
            .custom(async (value) => {
                const approvalConfig = await indexService.find('approval_settings', ['id', 'approval_count'], { id: value });
                if (!approvalConfig.status) {
                    return Promise.reject(
                        responseMessages.timesheet.cycleInvalid);
                } else {
                    req.body.approval_count = approvalConfig.data[0].approval_count;

                    const joins = [
                        {
                            table: 'approval_users',
                            condition: ['approval_users.approval_level_id', 'approval_levels.id'],
                            type: 'left'
                        }
                    ];
                    const approvalUsers = await indexService.find('approval_levels', ['approval_users.approver_id as employee_id'], { 'approval_levels.approval_setting_id': value, 'approval_users.approver_id': req.body.loginUserId, 'approval_levels.level': req.body.approval_level }, null, joins);

                    if (!approvalUsers.status && !req.body.loginUserAdmin) {
                        return Promise.reject(
                            responseMessages.timesheet.userIsNotAuthorized);
                    } else {
                        if (req.body.approval_level < req.body.approval_count && req.body.status == 'Approved') {
                            req.body.approval_level = req.body.approval_level + 1;
                            req.body.status = 'Approval In Progress'; // Patial Approved
                        } else if (req.body.approval_level == req.body.approval_count && req.body.status == 'Approved') {
                            req.body.approval_level = req.body.approval_level;
                            req.body.status = 'Approved'; // Approved
                        } else {
                            req.body.approval_level = 1;
                            req.body.status = 'Rejected'; // Rejected
                        }
                        return true;
                    }
                }
            })
    ];
    /* Writing validation rules to the input request */

    /*Run the validation rules. */
    for (let validation of validations) {
        let result = await validation.run(req);
        if (result.errors.length) break;
    }
    let errors = validationResult(req);
    /*Run the validation rules. */

    /**
     * If validation is success
     *    + Call the create new timesheet service function
     *    - Based on the status in create new timesheet function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
     */
    if (errors.isEmpty()) {

        var response = await timesheetsService.status(req.body);
        if (response.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
            };
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.somethindWentWrong,
                error: response.error
            };
        }

        /* Log Response */
        logResponse('info', req, responseData, 'Timesheet status update request');
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity,
        );
    }
});

// submittedTimesheetsDashboard
const submittedTimesheetsDashboard = tryCatch(async (req, res) => {

    let dateFormat = await format.getDateFormat(); // date format

    /* Log Request */
    logRequest('info', req, 'Getting Submitted Timesheets Details request')
    /* Log Request */

    /* Default Variable */
    var responseData = [];
    var condition = {
        from_date: null,
        to_date: null
    };
    /* Default Variable */

    // Writing validation rules to the input request
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
    ];

    // validate 'from_date' and 'to_date'
    if (req.query.from_date && req.query.to_date) {
        const from_date = moment(req.query.from_date, dateFormat).format('YYYY-MM-DD');
        const to_date = moment(req.query.to_date, dateFormat).format('YYYY-MM-DD');
        if (regexPatterns.dateRegex.test(from_date) && regexPatterns.dateRegex.test(to_date)) {
            condition.from_date = from_date;
            condition.to_date = to_date;
        } else {
            return Promise.reject(responseMessages.timesheet.dateInvalid);
        }
    }

    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    /*Run the validation rules. */

    /**
    * If validation is success
    *    + Call the listing service function
    *        - Based on the status in listing function response, segregate the response and prepare the response
    * If Validation Fails
    *    + Return the error message.
    */
    if (errors.isEmpty()) {

        // Default Variable
        let limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
        let page = (req.query.page) ? (req.query.page) : pagination.page
        condition.search = req.query.search ? req.query.search : null;

        /* Writing validation rules to the input request */
        var timesheetSumittedData = await timesheetsService.submittedTimesheetsDashboard(condition, dateFormat, page, limit);
        if (timesheetSumittedData.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: timesheetSumittedData.data,
                pagination: timesheetSumittedData.pagination_data,
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.noRecordFound,
                data: [],
                pagination: timesheetSumittedData.pagination_data
            }
        }

        /* Log Response */
        logResponse(
            'info',
            req,
            responseData,
            'Getting Submitted Timesheets Details Response'
        )
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData)
        /* Return the response */

    }
    else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
})

/**
 * Retrieves various statistics for dashboard cards:
 * - Counts total invoiced timesheets, pending timesheets,
 *   timesheets pending for approval, and invoice-ready timesheets
 *   based on provided conditions.
 *
 * @param {object} condition - An object containing 'from_date', 'to_date',
 *   and 'status_type' properties.
 * @returns {object} - An object with 'status' indicating the success or failure
 *   of the operation and 'data' containing the retrieved statistics.
 *
 * Logic:
 * - Constructs specific queries to fetch statistics for different types
 *   of timesheets based on the 'status_type' provided.
 * - Executes SQL queries using 'indexRepository.rawQuery' and retrieves counts
 *   for each type of timesheet.
 * - Handles optional 'from_date' and 'to_date' conditions within the queries.
 * - Prepares and returns an object with 'status' indicating success or failure
 *   and 'data' containing the retrieved statistics.
 */
const dashboardCardsData = tryCatch(async (req, res) => {

    // Get the `status_type` from `req.path` id any.
    const requestSegments = req.path.split('/');
    req.query.status_type = requestSegments[4];

    let dateFormat = await format.getDateFormat();

    // Log Request
    logRequest('info', req, "Getting Timesheets Dashboard cards details request");

    // Default Variable
    var responseData;
    var condition = {
        from_date: null,
        to_date: null,
        current_date: moment(new Date()).format('YYYY-MM-DD'),
        status_type: (req.query.status_type) ? req.query.status_type : null
    };

    // Writing validation rules to the input request
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
    ];

    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    if (errors.isEmpty()) {

        // validate 'from_date' and 'to_date'
        if (req.query.from_date && req.query.to_date) {
            const from_date = moment(req.query.from_date, dateFormat).format('YYYY-MM-DD');
            const to_date = moment(req.query.to_date, dateFormat).format('YYYY-MM-DD');
            if (regexPatterns.dateRegex.test(from_date) && regexPatterns.dateRegex.test(to_date)) {
                condition.from_date = from_date;
                condition.to_date = to_date;
            } else {
                return Promise.reject(responseMessages.timesheet.dateInvalid);
            }
        }

        const tsCardsDetails = await timesheetsService.dashboardCardsData(condition);

        if (!tsCardsDetails.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                error: tsCardsDetails.error, message: responseMessages.common.noRecordFound
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: tsCardsDetails.data
            };
        }

        // Log Response
        logResponse('info', req, responseData, "Getting Timesheets Dashboard cards details request");

        // Return the response
        responseHandler(res, responseData);

    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
});

const invoiceReadyTimesheet = tryCatch(async (req, res) => {

    // Log Response
    logResponse('info', req, "Getting Timesheet Details request");

    const timesheetId = req.params.id;
    const timesheetData = await timesheetsService.invoiceReadyTimesheet(timesheetId);

    if (!timesheetData.status) {
        responseData = {
            statusCode: responseCodes.codeSuccess,
            error: timesheetData.error,
            message: responseMessages.common.noRecordFound
        }
    } else {
        responseData = {
            statusCode: responseCodes.codeSuccess,
            message: responseMessages.common.success,
            data: timesheetData?.data
        };
    }

    // Log Response
    logResponse('info', req, responseData, "Getting Timesheet Details response");

    // Return the response
    responseHandler(res, responseData);
});


module.exports = { store, update , deleteTimesheet, status, listing, index, submittedTimesheetsDashboard, dashboardCardsData, invoiceReadyTimesheet, ocrStore };