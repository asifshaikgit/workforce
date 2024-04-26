const { responseCodes } = require("../../../../../constants/responseCodes");
const { responseMessages } = require("../../../../../constants/responseMessage");
const { logRequest, logResponse } = require("../../../../../utils/log");
const { tryCatch } = require("../../../../../utils/tryCatch");
const { responseHandler } = require("../../../../responseHandler");
const { check, validationResult } = require('express-validator');
const dashboardService = require('../../services/dashboard/dashboardService');
const indexService = require('../../services/index');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const moment = require('moment');
const format = require('../../../../../helpers/format');
const { regexPatterns } = require("../../../../../constants/regexPatterns");

/**
 * Get Employees Data - Count of Overall employees, Internal Employees, Consultant, Contrtactor.
 * 
 * Overview of Function:
 * - Validate the request
 *    + If successful.
 *      ~ Call the 'getEmployeesCount' service function to fetch the employees count.
 *      ~ Prepare the response with the fetched data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `getEmployeesCount` service function to fetch employees count.
 *    + Prepare the response with the fetched data.
 * - Log the response.
 * - Return the response using `responseHandler()`. 
 * - If validation fails:
 *    + Add error validation to the response.
 * Notes:
 *  - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const getEmployeesData = tryCatch(async (req, res) => {

    // Log Request
    logRequest("info", req, "Employees Count request");

    // Default Variable
    var responseData;

    // Writing validation rules to the input request
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired)
    ];

    // Run the validation rules.
    for (let validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    /**
     * If validation is success
     * get employee count in the collection.
     * If Validation Fails
     * + Return the error message.
     */
    if (errors.isEmpty()) {

        const employeesCount = await dashboardService.employeesCount();

        if (employeesCount.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: employeesCount.data ? employeesCount.data : [],
            };
        } else {
            throw new InvalidRequestError(
                responseMessages.common.failedToFetch,
                responseCodes.codeUnprocessableEntity
            );
        }
        // Log Response
        logResponse("info", req, responseData, "Get employees count response");

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
});

/**
 * Get List of Companies with more placements
 * 
 * Overview of function:
 * - Validate the request.
 *    + If successful.
 *      ~ Call the 'topCompanies' service function to get list of top companies with more placements.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 * - Run the validation rules.
 * - If validation is successful:
 *   + Call the 'getTopCompanies' service function to get the companies data with more placements.
 *   + If Success:
 *     - Prepare the response with success data.
 *   + Else:
 *     - Prepare the response with error message.
 * - If Validation fails:
 *   + Add error validation to the response.
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
const getTopCompanies = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, "Get Top Companies with more placements");

    let dateFormat = await format.getDateFormat(); // date format

    // Default Variable
    var responseData;

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

    if (errors.isEmpty()) {

        const companiesData = await dashboardService.topCompanies();

        if (companiesData.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: companiesData.data ? companiesData.data : [],
            };
        } else {
            throw new InvalidRequestError(
                responseMessages.common.failedToFetch,
                responseCodes.codeUnprocessableEntity
            );
        }

        // Log Response
        logResponse('info', req, responseData, "Getting dashboard top companies data response");

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
});

/**
 * Receivables and payables are the overview data of the amount need to get received and paid
 * 
 * Overview of function:
 * - Validate the request.
 *   + If successful.
 *      ~ Check and validate various fields such as 'request_id'.
 *      ~ Call the 'receivablesPayables' service function to get amount values of receivables and payables.
 *      ~ Prepare the response with a success message.
 *   + Else 
 *      ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `receivablesPayables` service function to get the updated values.
 *    + Prepare the response with a success message.
 * - Log the response.
 * - Return the response using `responseHandler()`. 
 * - If validation fails:
 *    + Add error validation to the response.
 * 
 * Notes:
 *  - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const receivablesPayables = tryCatch(async (req, res) => {
    // Log Request
    logRequest('info', req, "Dashboard Receivable payable request");

    // Default Variable
    var responseData;

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

        const receiablePayable = await dashboardService.receivablesPayables();

        if (receiablePayable.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: receiablePayable.data
            };
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: receiablePayable.message,
                error: receiablePayable.error,
                message: responseMessages.common.noRecordFound,
                data: []
            }
        }
        // Log Response
        logResponse('info', req, responseData, "Dashboard Receivable payable response");

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
})

/**
 * CashFlow Function to get Inflow and Outflow values of overall application.
 * 
 * Overview of Function:
 * - Validate the request.
 *    + If successful.
 *      ~ Call the 'cashFlow' service function to get the inflow and outflow values of the complete organization.
 *      ~ Prepare the reponse with success data.
 *    + Else
 *      ~ Add error validation to the resposne.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *   + 'request_id' (body), must not be empty.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `cashFlow` service function to get the inflow and outflow values of the organization.
 *    + Prepare the response with a success message.
 * - Log the response.
 * - Return the response using `responseHandler()`. 
 * - If validation fails:
 *    + Add error validation to the response.
 * 
 * Notes:
 *  - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const cashFlow = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, "Dashboard CashFlow request");

    let dateFormat = await format.getDateFormat(); // date format

    var condition = {};

    // Default Variable
    var responseData;

    // Writing validation rules to the input request
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check("view_type")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.mainDashboard.cashFlowViewTypeRequired)
            .isIn(['cash', 'accrual'])
            .withMessage(responseMessages.mainDashboard.cashFlowViewTypeInvalid)
    ];

    // validate 'from_date' and 'to_date'
    if (req.query.from_date && req.query.to_date) {
        const from_date = moment(req.query.from_date, dateFormat).format('YYYY-MM-DD');
        const to_date = moment(req.query.to_date, dateFormat).format('YYYY-MM-DD');
        console.log(from_date, to_date)
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

        condition.view_type = req.query.view_type;
        const cashFlow = await dashboardService.cashFlow(condition);

        if (cashFlow.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: cashFlow.data
            };
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: cashFlow.message,
                error: cashFlow.error,
                message: responseMessages.common.noRecordFound,
                data: []
            }
        }

        // Log Response
        logResponse('info', req, responseData, "Dashboard CashFlow response");

        // Return the response
        responseHandler(res, responseData);

    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
});

const employeeMargin = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, "Dashboard Employee Margin request");

    let dateFormat = await format.getDateFormat(); // date format

    // Default Variable
    var responseData;
    var condition = {};

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
        console.log(from_date, to_date)
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

        const margin = await dashboardService.employeeMargin(condition);

        if (margin.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: margin.data
            };
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: margin.message,
                error: margin.error,
                message: responseMessages.common.noRecordFound,
                data: []
            }
        }

        // Log Response
        logResponse('info', req, responseData, "Dashboard Employee Margin response");

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
});

const payRoll = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, "Dashboard Payroll request");

    var condition = {};

    // Default Variable
    var responseData;

    // Writing validation rules to the input request
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check("payroll_setting_id")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.mainDashboard.payrollSettingIdRequired)
            .custom(async (value) => {
                const payRollConfigData = await indexService.find('payroll_config_settings', ['id'], { id: value });
                const payRollConfigStatus = payRollConfigData.status;
                if (!payRollConfigStatus) {
                    return Promise.reject(responseMessages.mainDashboard.payrollSettingIdInvalid);
                }
            }),
    ];

    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    if (errors.isEmpty()) {

        condition.payroll_setting_id = req.query.payroll_setting_id;
        const payRoll = await dashboardService.payRoll(condition);

        if (payRoll.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: payRoll.data
            };
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: payRoll.message,
                error: payRoll.error,
                message: responseMessages.common.noRecordFound,
                data: []
            }
        }

        // Log Response
        logResponse('info', req, responseData, "Dashboard payRoll response");

        // Return the response
        responseHandler(res, responseData);

    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
});

module.exports = { getEmployeesData, getTopCompanies, receivablesPayables, cashFlow, payRoll, employeeMargin }