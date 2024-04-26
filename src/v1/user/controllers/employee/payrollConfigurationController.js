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
const payrollConfigurationService = require('../../services/employee/payrollConfigurationService');
const indexService = require('../../services/index');
const { responseHandler } = require('../../../../responseHandler')
const { regexPatterns } = require('../../../../../constants/regexPatterns');


/**
 * updatePayroll Funtion is to update the payroll details for an employee 
 * 
 * Overview of FUnction:
 * - Validate the request.
 *    + If successful
 *      ~ Call the payrollConfigUpdate service function to modify the employee's payroll details.
 *      ~ Prepare the response with a success message.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 *  Logic:
 *  - Log the incoming request.
 *  - Set default variables for `responseData`.
 *  - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty.
 *    + 'balance_amount' (body), must not be empty.
 *    + 'hours_worked' (body), check hours_worked is a valid number.
 *    + 'standard_pay_amount' (body), check standard_pay_amount is a valid number.
 *    + 'enable_payroll' (body), must not be empty.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `payrollConfigUpdate` service function to modify the employee's details.
 *    + Prepare the response with a success message.
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
const updatePayroll = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest("info", req, "Employee Pay roll Configuration Update");
    /* Log Request */

    /* Default Variable */
    var responseData;
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('employee_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.employeeIdRequired)
            .isUUID()
            .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
            .custom(async (value) => {
                const employee = await indexService.find('employee', ['*'], { id: value })
                var employeeData = employee.status
                if (!employeeData) {
                    return Promise.reject(
                        responseMessages.employee.behalfOnboarding.employeeIdNotExists
                    )
                }
                req.body.employee_name = employee.data[0].display_name;
                req.body.employee_reference_id = employee.data[0].reference_id;
                req.body.old_balance_amount = employee.data[0].balance_amount;
                req.body.old_standard_pay_amount = employee.data[0].standard_pay_amount;
                req.body.old_hours_worked = employee.data[0].hours_worked;
                return true;
            }),
        check('balance_amount')
            .trim()
            .custom((value) => {
                if (value && isNaN(value)) {
                    return Promise.reject(responseMessages.employee.balanceAmountInvalid)
                }
                return true
            }),
        check('hours_worked')
            .trim()
            .custom((value) => {
                if (value) {
                    let pattern = regexPatterns.decimalNumberRegex
                    if (!pattern.test(value)) {
                        return Promise.reject(responseMessages.employee.hoursWorkedInvalid)
                    }
                }
                return true
            }),
        check('standard_pay_amount')
            .trim()
            .custom((value) => {
                if (value !== '' && value !== null) {
                    let pattern = regexPatterns.decimalNumberRegex
                    if (!pattern.test(value)) {
                        return Promise.reject(responseMessages.employee.standardPayAmountInvalid)
                    }
                }
                return true
            }),
        check('enable_payroll')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.enablePayrollRequired)
            .isBoolean()
            .withMessage(responseMessages.employee.behalfOnboarding.enablePayrollInvalid),
        check('enable_balance_sheet')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.enableBalanceRequired)
            .isBoolean()
            .withMessage(responseMessages.employee.behalfOnboarding.enableBalancelInvalid),
        check('payroll_config_settings_id')
            .trim()
            .escape()
            .custom(async value => {
                let is_enable = req.body.enable_payroll;
                if (is_enable == 'true') {
                    if (value == '') {
                        return Promise.reject(responseMessages.configurations.payrollConfigurations.payrollConfigSettingIdRequired);
                    }
                    const configData = await indexService.find('payroll_config_settings', ['id'], { id: value }, null, [], null, null, null, false);
                    var configStatus = configData.status;
                    if (!configStatus) {
                        return Promise.reject(responseMessages.configurations.payrollConfigurations.payrollConfigSettingIdNotExist);
                    }
                }
            }),
    ];
    /* Writing validation rules to the input request */

    /*Run the validation rules. */
    for (let validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    /*Run the validation rules. */

    if (errors.isEmpty()) {
        var employeePayroll = await payrollConfigurationService.update(req.body);
        if (employeePayroll.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.updatedSuccessfully,
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeInternalError,
                message: responseMessages.common.somethindWentWrong,
                data: employeePayroll.error
            }
        }
        /* Log Response */
        logResponse("info", req, responseData, "Update employee basic details response");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
});

module.exports = { updatePayroll };
