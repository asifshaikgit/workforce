const { tryCatch } = require("../../../../../utils/tryCatch");
const balanceSheetService = require('../../services/balancesheet/balanceSheetService');

/**
 * @constant check Creates a middleware/validation chain for one or more fields that may be located in any of the following:
 */
const { check, validationResult } = require('express-validator');

/**
 * @constant logRequest Default class for logging the current event 
 */
const { logRequest, logResponse } = require('../../../../../utils/log');

/**
 * @constant responseMessages responseMessage constant variables
 */
const { responseMessages } = require('../../../../../constants/responseMessage');
const InvalidRequestError = require("../../../../../error/InvalidRequestError")
const { responseCodes } = require('../../../../../constants/responseCodes');
const { responseHandler } = require('../../../../responseHandler');
const { removeEmptyAndUndefinedKeys } = require('../../../../../helpers/globalHelper');
const { pagination } = require('../../../../../config/pagination');
const moment = require('moment');
const format = require('../../../../../helpers/format');
const { regexPatterns } = require('../../../../../constants/regexPatterns');


/**
 * Balancesheet dashboard request to fetch balancesheet data.
 * Overview of API
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Add Success to the response.
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic :
 *  - Logging incoming request.
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *  - Loop the req.query and using switch case and assign to the condition.
 *  - Run the validation rules
 *    + If validation success.
 *      ~ Call the service function(listing) to fetch the data and send the condition(defined above), limit, page,
 *        # Add the service function(listing) return data to response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Logging the response
 *  - Return response using responseHandler()  
 * 
 * Notes :
 *    - Handling expection using try catch
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns None
 * @throws {InvalidRequestError} - If the request ID is missing.
 */
const dashboardData = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, "Getting BalanceSheet Dashboard Data request");

    // Default Variable
    let dateFormat = await format.getDateFormat();
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

    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    const filterParams = req.query;

    if (errors.isEmpty()) {
        // validate 'from_date' and 'to_date'
        if (filterParams.from_date && filterParams.to_date) {
            const from_date = moment(filterParams.from_date, dateFormat).format('YYYY-MM-DD');
            const to_date = moment(filterParams.to_date, dateFormat).format('YYYY-MM-DD');
            if (regexPatterns.dateRegex.test(from_date) && regexPatterns.dateRegex.test(to_date)) {
                condition.from_date = from_date;
                condition.to_date = to_date;
            } else {
                return Promise.reject(responseMessages.timesheet.dateInvalid);
            }
        }

        var dashboardData = await balanceSheetService.dashboardData(condition);
        if (!dashboardData.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: dashboardData.message,
                error: dashboardData.error,
                message: responseMessages.common.noRecordFound,
                data: []
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: dashboardData.data,
                pagination: dashboardData.pagination_data
            };
        }

        // Log Response
        logResponse('info', req, responseData, "Getting BalanceSheet Dashboard Data request");

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
 * Balancesheet payrollSummary request to fetch a payroll summary of an employee.
 */
const payrollSummary = tryCatch(async (req, res) => {
    
});



module.exports = { dashboardData, payrollSummary  }