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

/**
 * @constant responseCodes responseCodes constant variables
 */
const { responseCodes } = require('../../../../../constants/responseCodes');

/**
 * @constant InvalidRequestError Default class for handling invalid request
 */
const InvalidRequestError = require("../../../../../error/InvalidRequestError")
const format = require('../../../../../helpers/format');
const { regexPatterns } = require('../../../../../constants/regexPatterns');
const placementDashboardService = require('../../services/placement/placementDashboardService');
const { tryCatch } = require('../../../../../utils/tryCatch');
const moment = require('moment');
const { responseHandler } = require('../../../../responseHandler');

/**
 * Dashboard Analytic function to get the graph data of the placement dashboard
 * 
 * Overview of Function:
 * - Validate the request.
 *   + If successful
 *     ~ Call the 'employeeAnalytics' service function to get the employee analytics.
 *     ~ Call the 'skillAnalytics' service function to get the skills data based on placement.
 *   + Else
 *     ~ Add error Validation to the response.
 * - Return the response.
 * 
 * Logic: 
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *   + 'request_id' (body), must not be empty.
 * - Run the validation rules.
 * - If validation is successful:
 *   + Call the 'employeeAnalytics' service function to get the employee analytics.
 *   + Call the 'skillAnalytics' service function to get the skills data based on placement.
 *   + If Success:
 *     - Prepare the response with success data.
 *   + Else:
 *     - Prepare the response with error messgae.
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
const dashboardAnalytics = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, "Getting Placement Dashboard Data Analytics request");

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


        const skillWiseCondition = req.body.skill_wise

        const placementAddedCondition = req.body.placement_added

        // Get Graph Data of Employment Type Contractor and Consultant Information
        let employeeInformation = await placementDashboardService.placedEmployeeAnalytics();

        // Get Graph Data of No of Employees Placed for each Skill
        let skillsInformation = await placementDashboardService.placedSkillsAnalytics(skillWiseCondition);

        let stateWiseData = await placementDashboardService.getStateWisePlacementCount()

        let visaCount = await placementDashboardService.getEmployeeVisaCount()

        let additionAndAttrition = await placementDashboardService.getAdditionandAttritionCount(placementAddedCondition)
        let dateFormat = await format.getDateFormat();
        var condition
        if(req.body.addition_rate.from_date == ''){
            condition = {
                from_date: moment().startOf('year').format('YYYY-MM-DD'),
                to_date: moment().endOf('year').format('YYYY-MM-DD'),
                interval: '1 month'
            };
        }
        else{
            condition = {
                from_date: moment(req.body.addition_rate.from_date, dateFormat).startOf('year').format('YYYY-MM-DD'),
                to_date: moment(req.body.addition_rate.to_date, dateFormat).endOf('year').format('YYYY-MM-DD'),
                interval: '1 month'
            };    
        }
        let additionAndAttritionGraph = await placementDashboardService.graphplacedEmployeeAttritionRate(condition);

        if (!employeeInformation.status || !skillsInformation.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: employeeInformation.message,
                error: employeeInformation.error,
                message: responseMessages.common.noRecordFound
            }
        } else {
            employeeInformation = employeeInformation.data?.employeeAalytics[0];
            skillsInformation = skillsInformation.data?.skillsAnalytics;

            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: {
                    employeeInformation, skillsInformation, stateWiseData, visaCount, additionAndAttrition, additionAndAttritionGraph
                },
            };
        }

        // Log Response
        logResponse('info', req, responseData, "Getting Placement Dashboard Data Analytics request");

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
 * Employee Attrition Rate function to get the graph data of no of employees added and removed from overall placement based on the filter.
 * 
 * Overview of Function:
 * - Validate the rerquest.
 *   + If successful.
 *     ~ Call the 'employeeAttritionRate' service function to get the employee analytics.
 *   + Else
 *     ~ Add error Validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *   + 'request_id' (body), must not be empty.
 * - Run the validation rules.
 * - If validation is successful:
 *   + Call the 'employeeAttritionRate' service function to get the employee analytics.
 *   + If Success:
 *     - Prepare the response with success data.
 *   + Else:
 *     - Prepare the response with error messgae.
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
const employeeAttritionRate = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, "Getting Placement Attrition Rate Data Analytics request");

    // Default Variable
    var responseData;
    var condition = {
        from_date: moment().startOf('year').format('YYYY-MM-DD'),
        to_date: moment().endOf('year').format('YYYY-MM-DD'),
        interval: '1 month'
    };

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

        // Get Graph Data of Employment Type Contractor and Consultant Information
        let employeeInformation = await placementDashboardService.placedEmployeeAttritionRate(condition);

        if (!employeeInformation.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: employeeInformation.message,
                error: employeeInformation.error,
                message: responseMessages.common.noRecordFound
            }
        } else {
            employeeInformation = employeeInformation.data;

            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: {
                    employeeInformation: employeeInformation?.placedEmployeeAtritionRate
                },
            };
        }

        // Log Response
        logResponse('info', req, responseData, "Getting Placement Attrition Rate Data Analytics request");

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
 * statusAnalytics function to retrieve the status analytics of the placements
 */
const statusAnalytics = tryCatch(async (req, res) => {

    // Get the `status_type` from `req.path` id any.
    const requestSegments = req.path.split('/');
    req.query.status_type = requestSegments[3];

    let dateFormat = await format.getDateFormat();

    // Log Request
    logRequest('info', req, "Getting Placement Dashboard Status Analytics request");

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

        const statusAnalytics = await placementDashboardService.statusAnalytics(condition);
        if (!statusAnalytics.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                error: statusAnalytics.error, message: responseMessages.common.noRecordFound
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: statusAnalytics.data
            };
        }

        // Log Response
        logResponse('info', req, responseData, "Getting Placement Dashboard Status Analytics request");

        // Return the response
        responseHandler(res, responseData);

    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
});

module.exports = { statusAnalytics, dashboardAnalytics, employeeAttritionRate }