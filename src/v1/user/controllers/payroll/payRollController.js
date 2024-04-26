const { responseMessages } = require('../../../../../constants/responseMessage')
const { check, validationResult } = require('express-validator')
const payRollService = require('../../services/payroll/payRollService')
const indexServices = require('../../services/index')
const { tryCatch } = require('../../../../../utils/tryCatch')
const { logRequest, logResponse } = require('../../../../../utils/log')
const { responseCodes } = require('../../../../../constants/responseCodes')
const { responseHandler } = require('../../../../responseHandler')
const InvalidRequestError = require('../../../../../error/InvalidRequestError')
const { pagination } = require('../../../../../config/pagination')
const moment = require('moment')
const format = require('../../../../../helpers/format')
const { removeEmptyAndUndefinedKeys } = require('../../../../../helpers/globalHelper');
const { regexPatterns } = require('../../../../../constants/regexPatterns');


/**
 * Route handler to generate payroll for a specific payroll configuration.
 *
 * @param {Object} req - Request object containing payload.
 * @param {Object} res - Response object to send the response.
 *
 * Logic:
 * - Log the incoming request for debugging purposes.
 *
 * - Initialize an empty variable 'responseData'.
 *
 * Define validation rules for the input request:
 *   - Ensure 'request_id' is provided.
 *   - Ensure 'payroll_configuration_id' is provided, is a positive integer, and meets certain conditions.
 *     - Check if the payroll configuration with this ID has been submitted. If yes, reject with an error.
 *     - Check if there are any unsubmitted previous payroll configurations based on certain criteria. If found, reject with an error.
 *
 * - Run the validation rules on the incoming request payload.
 *
 * - If validation is successful:
 *   - Call the 'generatePayroll' service function with the request payload.
 *   - Check the status of the service response.
 *     - If the response status is true, prepare a success response message.
 *     - If the response status is false, prepare a response with an error message and details.
 *
 * - Log the response for debugging purposes.
 *
 * - Send the prepared response using 'responseHandler'.
 */
const generatePayroll = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, 'generate payroll request.')
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
        check('payroll_configuration_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.payroll.payrollConfigIdRequired)
            .isInt()
            .withMessage(responseMessages.payroll.payrollConfigIdInvalid)
            .custom(async (value) => {
                const payrollconfig = await indexServices.find('payroll_configuration', ['id', 'status', 'pay_config_setting_id', 'from_date'], { id: value }, null, [], null, null, null, false)
                var payrollconfigData = payrollconfig.data[0].status
                if (payrollconfigData === 'Submitted') {
                    return Promise.reject(responseMessages.payroll.payrollAlreadySubmitted)
                } else if (payrollconfigData === 'Skipped') {
                    return Promise.reject(responseMessages.payroll.payrollAlreadykipped)
                } else {
                    let condition = {
                        global_search: `"pay_config_setting_id" = '${payrollconfig.data[0].pay_config_setting_id}' and "status" not in('Submitted', 'Skipped') and "from_date" < '${moment(payrollconfig.data[0].from_date).format('YYYY-MM-DD')}' `
                    }

                    return indexServices.find('payroll_configuration', ['id'], condition, null, [], null, null, null, false).then((payrollconfiguration) => {
                        if (payrollconfiguration.status) {
                            return Promise.reject(responseMessages.payroll.submitPreviousPayroll)
                        } else {
                            return true
                        }
                    })
                }
            })
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
     * If validation is success
     *    + Call the generate payroll service function
     *    - Based on the status in generate payroll function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
     */
    if (errors.isEmpty()) {
        var payRollData = await payRollService.generatePayroll(req.body)
        if (payRollData.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeBadRequest,
                message: responseMessages.payroll.transactionFailed,
                error: payRollData.error
            }
        }

        /* Log Response */
        logResponse('info', req, responseData, 'Payroll Generate response')
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData)
        /* Return the response */
    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        )
    }
})

/**
 * Retrieves payroll listings based on provided parameters.
 *
 * @param {object} req - The request object containing query parameters.
 * @param {object} res - The response object to be sent back.
 *
 * Logic:
 * - Log the incoming request.
 * - Initialize response data and extract request parameters.
 * - Check for the existence of the request ID.
 * - If the request ID exists:
 *   - Set up conditions based on query parameters.
 *   - Retrieve payroll data from the payRollService using conditions, page, and limit.
 *   - If payroll data retrieval is successful:
 *     - Construct response data with retrieved data, pagination details, payroll period, OT hours existence, and submission enable status.
 *   - If payroll data retrieval fails:
 *     - Generate a response indicating no records found.
 *   - Log the response.
 *   - Return the constructed response using responseHandler.
 * - If the request ID is not provided or empty:
 *   - Throw an InvalidRequestError with an unprocessable entity code.
 */
const paymentsListing = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "get payrolls listing request.");
    /* Log Request */

    /* Default Variable */
    var responseData = [];
    var request_id = req.query.request_id;
    /* Default Variable */

    if (request_id != undefined && request_id != '') {
        /* Default Variable */
        let limit = (req.query.limit) ? (req.query.limit) : 1000;
        let page = (req.query.page) ? (req.query.page) : 1;
        let search = (req.query.search) ? (req.query.search) : '';
        let visa_type_id = (req.query.visa_type_id) ? req.query.visa_type_id.replace(/\[/g, '(').replace(/\]/g, ')') : [];
        let pay_roll_configuration_id = (req.query.payroll_configuration_id) ? req.query.payroll_configuration_id : null;
        let condition = { 'pc.id': pay_roll_configuration_id };

        if (search != '') {
            condition.global_search = `"emp"."display_name" ilike '%${search}%'`;
        }
        if (visa_type_id != '' && visa_type_id != []) {
            condition.global_search = `"emp"."visa_type_id" in ${visa_type_id}`;
        }

        var payRollData = await payRollService.paymentsListing(condition, page, limit);
        if (payRollData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: payRollData.data, pagination: payRollData.pagination_data, 'payroll_period': payRollData.payrollPeriod, ot_hours_exists: payRollData.ot_hours_exists, enable_submit: payRollData.enable_submit };
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: payRollData.message, error: payRollData.error, message: responseMessages.common.noRecordFound, data: [], ot_hours_exists: false, enable_submit: payRollData.enable_submit }
        }
        /* Log Response */
        logResponse("info", req, responseData, "get payrolls Response.");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Handles payroll submission updates based on the provided request.
 *
 * @param {object} req - The request object containing payroll submission details.
 * @param {object} res - The response object to be sent back.
 *
 * Logic:
 * - Logs the incoming request for payroll submission update.
 * - Initializes a variable 'responseData'.
 * - Defines validation rules for the input request.
 * - Runs the defined validation rules against the request.
 * - If there are validation errors:
 *   - Throws an InvalidRequestError with an unprocessable entity code, providing the first error message encountered.
 * - If validation is successful:
 *   - Calls the payroll run service function using the data from the request body.
 *   - Constructs a success response indicating successful submission.
 *   - Logs the response.
 *   - Sends the constructed response using the responseHandler.
 */
const payrollRun = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, 'Payroll submission Update  request')
    /* Log Request */

    /* Default Variable */
    var responseData = ''
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check('payroll_configuration_id').trim().escape().notEmpty().withMessage(responseMessages.payroll.payrollConfigIdRequired)
            .isInt().withMessage(responseMessages.payroll.payrollConfigIdInvalid)
            .custom(async (value) => {
                const payrollconfig = await indexServices.find('payroll_configuration', ['id', 'status'], { id: value }, null, [], null, null, null, false);
                var payrollconfigData = payrollconfig.status;
                if (!payrollconfigData && value != '') {
                    return Promise.reject(
                        responseMessages.payroll.payrollConfigIdDoesNotExist
                    );
                }
                if (payrollconfig.data[0].status == 'Submitted') {
                    return Promise.reject(responseMessages.payroll.payrollAlreadySubmitted);
                }
                return true;
            })
            .custom(async (value) => {
                const payrollPaymentFinilize = await indexServices.count('payroll_payment_details', { global_search: `("amount_paid" > 0)`, payroll_configuration_id: value, is_finalize: false });
                if (payrollPaymentFinilize.data > 0) {
                    return Promise.reject(
                        responseMessages.payroll.payrollEmployeeFinalizeIsPending
                    );
                }
                return true;
            })
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
     * If validation is success
     *    + Call the payroll run service function
     *    - Based on the status in payroll run function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
     */
    if (errors.isEmpty()) {

        await payRollService.payrollRun(req.body)
        responseData = {
            statusCode: responseCodes.codeSuccess,
            message: responseMessages.common.success
        }

        /* Log Response */
        logResponse('info', req, responseData, 'Payroll Submission Update response')
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData)
        /* Return the response */

    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        )
    }
})

/**
 * Handles payroll payment updates based on the provided request.
 *
 * @param {object} req - The request object containing payroll payment details for multiple employees.
 * @param {object} res - The response object to be sent back.
 *
 * Logic:
 * - Logs the incoming request for payroll payment update.
 * - Initializes a variable 'responseData'.
 * - Defines validation rules for the input request.
 * - Runs the defined validation rules against the request.
 * - If there are validation errors:
 *   - Throws an InvalidRequestError with an unprocessable entity code, providing the first error message encountered.
 * - If validation is successful:
 *   - Calls the submit payroll service function using the data from the request body.
 *   - Constructs a success response indicating successful payment update.
 *   - Logs the response.
 *   - Sends the constructed response using the responseHandler.
 */
const submitPayroll = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, 'Payroll payment Update  request')
    /* Log Request */

    /* Default Variable */
    var responseData = ''
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check('employees.*.employee_id').trim().escape().notEmpty().withMessage(responseMessages.payroll.requiredEmployeeId)
            .isUUID().withMessage(responseMessages.payroll.employeeIdInvalid)
            .custom(async value => {
                const employee = await indexServices.find('employee', ['id'], { id: value });
                if (!employee.status && value != '') {
                    return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists);
                }
                return true;
            }),
        check('employees.*.payroll_configuration_id').trim().escape().notEmpty().withMessage(responseMessages.payroll.payrollConfigIdRequired)
            .isInt().withMessage(responseMessages.payroll.payrollConfigIdInvalid)
            .custom(async value => {
                const payrollconfig = await indexServices.find('payroll_configuration', ['id'], { id: value }, null, [], null, null, null, false);
                var payrollconfigData = payrollconfig.status;
                if (!payrollconfigData) {
                    return Promise.reject(responseMessages.payroll.payrollConfigIdDoesNotExist);
                }
                return true;
            }),
        check('employees.*.amount_paid').trim().escape().notEmpty().withMessage(responseMessages.payroll.paidAmountRequired)
            .isFloat().withMessage(responseMessages.payroll.paidAmountInvalid)
            .custom(value => {
                if (value < 0) {
                    return Promise.reject(responseMessages.payroll.amountPaidInvalid)
                }
                return true;
            }),
        check("employees.*.is_draft").notEmpty().withMessage(responseMessages.payroll.draftRequited)
            .isBoolean().withMessage(responseMessages.payroll.draftInvalid),
        check("employees.*.is_finalize").notEmpty().withMessage(responseMessages.payroll.isFinilizeRequired)
            .isBoolean().withMessage(responseMessages.payroll.isFinilizeInvalid),
        check().custom(async (value, { req }) => {
            const { employees } = req.body;
            for (let key in employees) {
                let obj = req.body.employees[key];
                let employeeData = await indexServices.find('employee', ['balance_amount'], { id: obj.employee_id });
                obj.existing_balance = employeeData.data[0].balance_amount;
            };
            return true;
        }),
        check("employees.*.comments")
            .optional()
            .custom(async (value) => {
                if (value != null && value != '' && value != undefined) {
                    if (value.length >= 100) {
                        return Promise.reject(responseMessages.payroll.maxLength);
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
     * If validation is success
     *    + Call the submit payroll service function
     * If Validation Fails
     *    + Return the error message.
     */
    if (errors.isEmpty()) {
        await payRollService.submitPayroll(req.body)
        responseData = {
            statusCode: responseCodes.codeSuccess,
            message: responseMessages.common.success
        }

        /* Log Response */
        logResponse('info', req, responseData, 'Payroll Payment Update response')
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData)
        /* Return the response */

    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        )
    }
})

const payrollPaymentInfo = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, 'getting payroll payment info request');
    /* Log Request */

    /* Default variable */
    let responseData = [];
    const limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
    const page = (req.query.page) ? (req.query.page) : pagination.page;
    /* Default variable */

    /* Writing validation rules to the input request */
    const validations = [
        check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check('payroll_configuration_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.configurations.payrollConfigurations.payrollConfigIdRequired)
            .isInt()
            .withMessage(responseMessages.configurations.payrollConfigurations.payrollConfigIdInvalid)
            .custom(async (value) => {
                const configData = await indexServices.find('payroll_configuration', ['id'], { id: value }, null, [], null, null, null, false);
                const configStatus = configData.status;
                if (!configStatus) {
                    return Promise.reject(responseMessages.configurations.payrollConfigurations.payrollConfigIdNotExist);
                }
            }),
    ];
    /* Writing validation rules to the input request */

    /* Run the validation rules. */
    for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
    }
    const errors = validationResult(req);
    /* Run the validation rules. */

    /**
       * If validation is success
       *    + call the update service function
       *    - Based on the status in update function response, segregate the response and prepare the response
       * If Validation Fails
       *    + Return the error message.
      */
    if (errors.isEmpty()) {

        let pay_roll_configuration_id = (req.query.payroll_configuration_id) ? req.query.payroll_configuration_id : null;
        let condition = { 'pc.id': pay_roll_configuration_id };
        let search = (req.query.search) ? (req.query.search) : '';
        let visa_type_id = (req.query.visa_type_id) ? req.query.visa_type_id.replace(/\[/g, '(').replace(/\]/g, ')') : [];
        if (search != '') {
            condition.global_search = `"emp"."display_name" ilike '%${search}%'`;
        }
        if (visa_type_id != '' && visa_type_id != []) {
            condition.global_search = `"emp"."visa_type_id" in ${visa_type_id}`;
        }

        const payrollData = await payRollService.payrollPaymentInfo(condition, page, limit);
        if (!payrollData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, error: payrollData.error, message: responseMessages.common.noRecordFound, data: [], payroll_period: '', ot_hours_exists: false };
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: payrollData.data, pagination: payrollData.pagination_data, payroll_period: payrollData.payrollPeriod, ot_hours_exists: payrollData.ot_hours_exists };
        }
        /* Log Response */
        logResponse('info', req, responseData, 'payroll payment info Response');
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

const payrollPaymentInfo1 = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, 'getting payroll payment info request');
    /* Log Request */

    let dateFormat = await format.getDateFormat();

    /* Default variable */
    let responseData = [];

    /* Default variable */

    /* Writing validation rules to the input request */
    const validations = [
        check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check('payroll_configuration_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.configurations.payrollConfigurations.payrollConfigIdRequired)
            .isInt()
            .withMessage(responseMessages.configurations.payrollConfigurations.payrollConfigIdInvalid)
            .custom(async (value) => {
                const configData = await indexServices.find('payroll_configuration', ['id'], { id: value }, null, [], null, null, null, false);
                const configStatus = configData.status;
                if (!configStatus) {
                    return Promise.reject(responseMessages.configurations.payrollConfigurations.payrollConfigIdNotExist);
                }
            }),
        check("visa_type_id")
            .optional()
            .custom(async (value) => {
                if (value != null && value != '' && value != undefined) {

                    if (!Array.isArray(value)) {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.visaMustBeArray);
                    }

                    var pattern = regexPatterns.numbersSpaceRegex
                    if (pattern.test(value)) {
                        const employmentTypeData = await indexService.find('visa_types', ['id', 'name'], { id: value, is_active: 1 })
                        if (!employmentTypeData.status) {
                            return Promise.reject(responseMessages.employee.behalfOnboarding.visaTypeIdNotExists)
                        }
                        return true
                    } else {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.visaTypeIdInvalid)
                    }
                }
                return true
            })
    ];
    /* Writing validation rules to the input request */

    /* Run the validation rules. */
    for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
    }
    const errors = validationResult(req);
    /* Run the validation rules. */

    /**
       * If validation is success
       *    + call the update service function
       *    - Based on the status in update function response, segregate the response and prepare the response
       * If Validation Fails
       *    + Return the error message.
      */
    if (errors.isEmpty()) {

        let body = removeEmptyAndUndefinedKeys(req.body);

        // Default Variable
        let limit = (body.limit) ? (body.limit) : pagination.limit;
        let page = (body.page) ? (body.page) : pagination.page;
        var condition = {};


        condition.pay_roll_configuration_id = body.pay_roll_configuration_id;
        condition.visa_type_id = (body.visa_type_id?.length > 0) ? body.visa_type_id.toString() : null;
        condition.search = (body.search) ? body.search : '';

        const payrollData = await payRollService.payrollPaymentInfo1(condition, page, limit);
        if (!payrollData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, error: payrollData.error, message: responseMessages.common.noRecordFound, data: [], payroll_period: '', ot_hours_exists: false };
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: payrollData.data, pagination: payrollData.pagination_data, payroll_period: payrollData.payrollPeriod, ot_hours_exists: payrollData.ot_hours_exists };
        }
        /* Log Response */
        logResponse('info', req, responseData, 'payroll payment info Response');
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Retrieves balance sheet index data based on the provided conditions:
 * - Logs the incoming request to get balance sheet index data.
 * - Initializes variables for the response and conditions to filter data.
 * - Retrieves the date format for processing.
 * - Sets up validation rules for various parameters like request ID, employee ID, and expense transaction type.
 * - Validates 'from_date' and 'to_date' parameters if provided.
 * - Executes validations on the request parameters and handles potential errors.
 * - If no validation errors:
 *    - Constructs the condition object with the provided 'from_date', 'to_date', and 'employee_id'.
 *    - Calls the payRollService's 'balanceSheetIndexCard' function to get the balance sheet index data.
 *    - Constructs the response data based on the fetched data or error messages.
 *    - Logs the response.
 *    - Returns the response data with the fetched balance sheet index data or an error message if no data found.
 * - If validation errors exist, throws an InvalidRequestError with the first error message.
 */
const balanceSheetIndexCard = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, "Getting balance sheet index Data request");

    // Default Variable
    var responseData;
    var condition = {};

    let dateFormat = await format.getDateFormat();

    // Writing validation rules to the input request
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('employee_id')
            .trim().escape()
            .notEmpty().withMessage(responseMessages.employee.employeeIdRequired)
            .isUUID().withMessage(responseMessages.employee.employeeIdInvalid)
            .custom(async value => {
                const employeeData = await indexServices.find('employee', ['id', 'reference_id', 'display_name', 'gender', 'profile_picture_url', 'balance_amount'], { id: value });
                if (!employeeData.status) {
                    return Promise.reject(responseMessages.employee.employeeIdNotExists);
                }
                req.query.reference_id = employeeData.data[0].reference_id
                req.query.display_name = employeeData.data[0].display_name
                req.query.gender = employeeData.data[0].gender
                req.query.profile_picture_url = employeeData.data[0].profile_picture_url
                req.query.balance_amount = employeeData.data[0].balance_amount

            }),
        check('expense_transaction_type')
            .trim().escape()
            .custom(async value => {
                const financialSummary = req.query.financial_summary;
                if (financialSummary == 'expense_summary') {
                    if (!value) {
                        return Promise.reject(responseMessages.payroll.requiredExpenseType);
                    } else if (value && value !== '1' && value !== '2') {
                        return Promise.reject(responseMessages.payroll.invalidExpenseType);
                    }
                }
            }),
        check('financial_summary')
            .trim().escape()
            .notEmpty().withMessage(responseMessages.payroll.summaryTypeRequired)
            .custom(async value => {
                if (value != null && value != '' && value != undefined) {
                    const isValid = value === 'expense_summary' || value === 'payroll_summary';
                    if (!isValid) {
                        return Promise.reject(responseMessages.payroll.invalidSummaryType);
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

        condition.employee_id = req.query.employee_id

        // Get Graph Data of Employment Type Contractor and Consultant Information
        let balanceSheetCardInfo = await payRollService.balanceSheetIndexCard(req.query, condition);


        if (!balanceSheetCardInfo.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: balanceSheetCardInfo.message,
                error: balanceSheetCardInfo.error,
                message: responseMessages.common.noRecordFound
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: [
                    balanceSheetCardInfo.data
                ]
            };
        }

        // Log Response
        logResponse('info', req, responseData, "Getting balance sheet index Data response");

        // Return the response
        responseHandler(res, responseData);
    } else {

        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
});

const index = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "getting single Payroll request");
    /* Log Request */

    let dateFormat = await format.getDateFormat();

    /* Default Variable */
    var responseData = '';
    var request_id = req.query.request_id;
    let condition = {}
    /* Default Variable */

    if (request_id != undefined && request_id != '') {

        /* Default Variables */
        let limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
        let page = (req.query.page) ? (req.query.page) : pagination.page;
        let employee_id = req.query.employee_id;
        let payroll_configuration_id = req.query.payroll_configuration_id;
        /* Default variables */

        if (employee_id != undefined && employee_id != '') {
            var pattern = regexPatterns.uuidRegex;

            /* Writing validation rules to the input request */
            if (pattern.test(employee_id)) {

                // validate 'from_date' and 'to_date'
                if (req.query.from_date && req.query.to_date) {
                    const from_date = moment(req.query.from_date, dateFormat).format('YYYY-MM-DD');
                    const to_date = moment(req.query.to_date, dateFormat).format('YYYY-MM-DD');
                    if (regexPatterns.dateRegex.test(from_date) && regexPatterns.dateRegex.test(to_date)) {
                        condition = {
                            ...condition, ...{
                                date_between: [{
                                    column: 'pc.check_date', date1: from_date, date2: to_date
                                }]
                            }
                        }
                    } else {
                        return Promise.reject(responseMessages.timesheet.dateInvalid);
                    }
                }

                condition = { ...condition, ...{ 'payroll_payment_details.employee_id': employee_id, 'pc.id' : payroll_configuration_id , 'pc.status': 'Submitted' } }; 
                var payRollData = await payRollService.index(condition, page, limit);
                if (!payRollData.status) {
                    responseData = { statusCode: responseCodes.codeSuccess, message: payRollData.message, error: payRollData.error, message: responseMessages.common.noRecordFound, data: [], ot_hours_exists: false }
                } else {
                    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, payroll: payRollData.data, expenses: payRollData.expenseData, statistics: payRollData.statistics, pagination: payRollData.pagination_data, ot_hours_exists: payRollData.ot_hours_exists };
                }
            } else {
                responseData = { statusCode: responseCodes.codeBadRequest, message: responseMessages.employee.employeeIdInvalid }
            }
            /* Writing validation rules to the input request */

            /* Log Response */
            logResponse('info', req, responseData, "Payroll index Response");
            /* Log Response */

            /* Return the response */
            responseHandler(res, responseData);
            /* Return the response */
        } else {
            throw new InvalidRequestError(responseMessages.timesheet.TimesheetIdRequired);
        }
    } else {
        throw new InvalidRequestError(responseMessages.common.requestIdRequired);
    }
});

const payrollPdf = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "Payroll PDF request");
    /* Log Request */

    let dateFormat = await format.getDateFormat();

    /* Default Variable */
    var responseData = '';
    var request_id = req.query.request_id;
    let condition = {}
    /* Default Variable */

    if (request_id != undefined && request_id != '') {

        /* Default Variables */
        let limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
        let page = (req.query.page) ? (req.query.page) : pagination.page;
        let employee_id = req.query.employee_id;
        let payroll_configuration_id = req.query.payroll_configuration_id;
        /* Default variables */

        if (employee_id != undefined && employee_id != '') {
            var pattern = regexPatterns.uuidRegex;

            /* Writing validation rules to the input request */
            if (pattern.test(employee_id)) {

                // validate 'from_date' and 'to_date'
                if (req.query.from_date && req.query.to_date) {
                    const from_date = moment(req.query.from_date, dateFormat).format('YYYY-MM-DD');
                    const to_date = moment(req.query.to_date, dateFormat).format('YYYY-MM-DD');
                    if (regexPatterns.dateRegex.test(from_date) && regexPatterns.dateRegex.test(to_date)) {
                        condition = {
                            ...condition, ...{
                                date_between: [{
                                    column: 'pc.check_date', date1: from_date, date2: to_date
                                }]
                            }
                        }
                    } else {
                        return Promise.reject(responseMessages.timesheet.dateInvalid);
                    }
                }

                condition = { ...condition, ...{ 'payroll_payment_details.employee_id': employee_id, 'pc.id' : payroll_configuration_id  } }; // 'pc.status': 'Submitted' 
                var payRollData = await payRollService.pdfData(condition, page, limit);
                if (!payRollData.status) {
                    responseData = { statusCode: responseCodes.codeSuccess, message: payRollData.message, error: payRollData.error, message: responseMessages.common.noRecordFound, data: [], ot_hours_exists: false }
                } else {
                    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, payroll: payRollData.data, expenses: payRollData.expenseData, statistics: payRollData.statistics, pagination: payRollData.pagination_data, ot_hours_exists: payRollData.ot_hours_exists };
                }
            } else {
                responseData = { statusCode: responseCodes.codeBadRequest, message: responseMessages.employee.employeeIdInvalid }
            }
            /* Writing validation rules to the input request */

            /* Log Response */
            logResponse('info', req, responseData, "Payroll PDF Response");
            /* Log Response */

            /* Return the response */
            responseHandler(res, responseData);
            /* Return the response */
        } else {
            throw new InvalidRequestError(responseMessages.timesheet.TimesheetIdRequired);
        }
    } else {
        throw new InvalidRequestError(responseMessages.common.requestIdRequired);
    }
});

/**
 * Handles the update of payroll payments:
 * - Validates the incoming request against specified rules using the 'express-validator' library.
 * - If validation is successful, calls the 'payRollService.update' function with the request body.
 * - Constructs a response object based on the success or failure of the 'update' function.
 * - Logs the request and response.
 * - Sends the constructed response using the 'responseHandler' function.
 *
 * @param {object} req - Express request object containing the payroll payment update details.
 * @param {object} res - Express response object for sending the response.
 */
const update = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, 'Payroll payment Update  request')
    /* Log Request */

    /* Default Variable */
    var responseData = ''
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check('employees.*.employee_id').trim().escape().notEmpty().withMessage(responseMessages.payroll.requiredEmployeeId)
            .isUUID().withMessage(responseMessages.payroll.employeeIdInvalid)
            .custom(async value => {
                const employee = await indexServices.find('employee', ['id'], { id: value });
                if (!employee.status && value != '') {
                    return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists);
                }
                return true;
            }),
        check('employees.*.payroll_configuration_id')
        .trim().escape()
        .notEmpty().withMessage(responseMessages.payroll.payrollConfigIdRequired)
        .isInt().withMessage(responseMessages.payroll.payrollConfigIdInvalid)
        .custom(async value => {
            let payrollconfig = await indexServices.find('payroll_configuration', ['id'], { id: value }, null, [], null, null, null, false);
            if (!payrollconfig.status) {
                return Promise.reject(responseMessages.payroll.payrollConfigIdDoesNotExist);
            } 
            return true;
        }),
        check('employees.*.amount_paid').trim().escape().notEmpty().withMessage(responseMessages.payroll.paidAmountRequired)
            .isFloat().withMessage(responseMessages.payroll.paidAmountInvalid)
            .custom(value => {
                if (value < 0) {
                    return Promise.reject(responseMessages.payroll.amountPaidInvalid)
                }
                return true;
            }),
        check("employees.*.is_draft").notEmpty().withMessage(responseMessages.payroll.draftRequited)
            .isBoolean().withMessage(responseMessages.payroll.draftInvalid),
        check("employees.*.is_finalize").notEmpty().withMessage(responseMessages.payroll.isFinilizeRequired)
            .isBoolean().withMessage(responseMessages.payroll.isFinilizeInvalid),
        check("employees.*.comments")
            .trim().escape()
            .custom(value => {
                if (value.length > 100) {
                    return Promise.reject(responseMessages.payroll.payrollCommets)
                }
                return true;
            }),
        // check().custom(async (value, { req }) => {
        //     const { employees } = req.body;
        //     for (let key in employees) {
        //         let obj = req.body.employees[key];
        //         let employeeData = await indexServices.find('employee', ['balance_amount'], { id: obj.employee_id });
        //         obj.existing_balance = employeeData.data[0].balance_amount;
        //     };
        //     return true;
        // })
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
     * If validation is success
     *    + Call the create new invoice service function
     *    - Based on the status in create new invoice function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
     */
    if (errors.isEmpty()) {
        for(const item of req.body.employees) {
            // Check is_finalize only for the specified employee
            if (item.is_finalize) {
                // Find payroll data for the specific employee with timesheet_approval_pending=true
                var payrollData = await indexServices.find('payroll', ['id'], { employee_id: item.employee_id, payroll_configuration_id: item.payroll_configuration_id , timesheet_approval_pending: true });

                // If payroll data is found, reject with the specified message
                if (payrollData.status) {
                    throw new InvalidRequestError(
                        responseMessages.payroll.payrollEmployeeFinalizeIsNotAllowed,
                        responseCodes.codeUnprocessableEntity,
                    );
                }
            } else {
                // Find payroll data for the specific employee with timesheet_approval_pending=true
                var payrollData = await indexServices.find('payroll', ['id'], { employee_id: item.employee_id, payroll_configuration_id: item.payroll_configuration_id , timesheet_approval_pending: true });

                // If payroll data is found, reject with the specified message
                if (payrollData.status) {
                    if(parseFloat(item.amount_paid) > 0) {
                        throw new InvalidRequestError(
                            responseMessages.payroll.payrollSalAmtNonFinalizeShouldBeZero,
                            responseCodes.codeUnprocessableEntity,
                        );
                    }
                } else {
                    if(!item.is_draft) {
                        if(parseFloat(item.amount_paid) > 0) {
                            throw new InvalidRequestError(
                                responseMessages.payroll.payrollSalAmtNonFinalizeShouldBeZeroNoTimesheet,
                                responseCodes.codeUnprocessableEntity,
                            );
                        }
                    }
                }
            }
        }

        let payrollUpdate = await payRollService.update(req.body)
        if(payrollUpdate.status){
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeInternalError,
                message: responseMessages.common.somethindWentWrong,
                error: placement_data.error,
            }
        }
       

        /* Log Response */
        logResponse('info', req, responseData, 'Payroll Payment Update response')
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData)
        /* Return the response */

    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        )
    }
})

/**
 * Retrieves payroll listings based on provided parameters.
 *
 * @param {object} req - The request object containing query parameters.
 * @param {object} res - The response object to be sent back.
 *
 * Logic:
 * - Log the incoming request.
 * - Initialize response data and extract request parameters.
 * - Check for the existence of the request ID.
 * - If the request ID exists:
 *   - Set up conditions based on query parameters.
 *   - Retrieve payroll data from the payRollService using conditions, page, and limit.
 *   - If payroll data retrieval is successful:
 *     - Construct response data with retrieved data, pagination details, payroll period, OT hours existence, and submission enable status.
 *   - If payroll data retrieval fails:
 *     - Generate a response indicating no records found.
 *   - Log the response.
 *   - Return the constructed response using responseHandler.
 * - If the request ID is not provided or empty:
 *   - Throw an InvalidRequestError with an unprocessable entity code.
 */
const finalizeListing = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "get payrolls finalize employee request.");
    /* Log Request */

    /* Default Variable */
    var responseData = [];
    var request_id = req.query.request_id;
    /* Default Variable */

    if (request_id != undefined && request_id != '') {
        /* Default Variable */
        let pay_roll_configuration_id = (req.query.payroll_configuration_id) ? req.query.payroll_configuration_id : null;
        let visa_type = (req.query.visa_type) ? req.query.visa_type : '';
        let condition = { payroll_configuration_id: pay_roll_configuration_id, 'emp.visa_type_id': visa_type, is_finalize: true };


        let limit = (req.query.limit) ? (req.query.limit) : 1000;
        let page = (req.query.page) ? (req.query.page) : 1;

        var finalizeData = await payRollService.finalizeListing(condition, page, limit);
        if (finalizeData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: finalizeData.data, pagination: finalizeData.pagination_data };
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: finalizeData.message, error: finalizeData.error, message: responseMessages.common.noRecordFound, data: [] }
        }
        /* Log Response */
        logResponse("info", req, responseData, "get payrolls Response.");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(responseCodes.codeUnprocessableEntity);
    }
});

/**
* Retrieves payroll listings based on provided parameters.
*
* @param {object} req - The request object containing query parameters.
* @param {object} res - The response object to be sent back.
*
* Logic:
* - Log the incoming request.
* - Initialize response data and extract request parameters.
* - Check for the existence of the request ID.
* - If the request ID exists:
*   - Set up conditions based on query parameters.
*   - Retrieve payroll data from the payRollService using conditions, page, and limit.
*   - If payroll data retrieval is successful:
*     - Construct response data with retrieved data, pagination details, payroll period, OT hours existence, and submission enable status.
*   - If payroll data retrieval fails:
*     - Generate a response indicating no records found.
*   - Log the response.
*   - Return the constructed response using responseHandler.
* - If the request ID is not provided or empty:
*   - Throw an InvalidRequestError with an unprocessable entity code.
*/
const finalizedEmployee = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "get payrolls finalize employee request.");
    /* Log Request */

    /* Default Variable */
    var responseData = [];
    var request_id = req.query.request_id;
    /* Default Variable */

    if (request_id != undefined && request_id != '') {
        /* Default Variable */
        let pay_roll_configuration_id = (req.query.payroll_configuration_id) ? req.query.payroll_configuration_id : null;
        let condition = { payroll_configuration_id: pay_roll_configuration_id };

        var finalizeData = await payRollService.finalizedEmployee(condition);
        if (finalizeData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: finalizeData.data, net_payable_amount: finalizeData.net_payable_amount };
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: finalizeData.message, error: finalizeData.error, message: responseMessages.common.noRecordFound, data: [] }
        }
        /* Log Response */
        logResponse("info", req, responseData, "get payrolls Response.");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Updates payroll finalization based on the provided request body:
 * - Validates the request body parameters to ensure data integrity.
 * - Executes the payroll finalization operation using the 'payRollService.payrollFinalize' function.
 * - Prepares and sends a response object indicating the success or failure of the finalization operation.
 *
 * @param {object} req - Request object containing payroll finalization information.
 * @param {object} res - Response object to send back the result of the operation.
 */
const payrollFinalize = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, 'update payroll finalize request');
    /* Log Request */

    let dateFormat = await format.getDateFormat();

    /* Default variable */
    let responseData = [];

    /* Default variable */

    /* Writing validation rules to the input request */
    const validations = [
        check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check('finalize_id')
            .isArray({ min: 1 })
            .withMessage(responseMessages.configurations.payrollConfigurations.finalizeIdRequired)
            .custom(async (value) => {
                const invalidIds = value.filter(id => !Number.isInteger(id));
                if (invalidIds.length > 0) {
                    return Promise.reject(responseMessages.configurations.payrollConfigurations.finalizeIdInvalid);
                }

                const configData = await indexServices.find('payroll_payment_details', ['id'], { id: value }, null, [], null, null, null, false);
                const configStatus = configData.status;
                if (!configStatus) {
                    return Promise.reject(responseMessages.configurations.payrollConfigurations.finalizeIdNotExist);
                }
            }),
        check("visa_type_id")
            .optional()
            .custom(async (value) => {
                if (value != null && value != '' && value != undefined) {

                    if (!Array.isArray(value)) {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.visaMustBeArray);
                    }

                    var pattern = regexPatterns.numbersSpaceRegex
                    if (pattern.test(value)) {
                        const employmentTypeData = await indexService.find('visa_types', ['id', 'name'], { id: value, is_active: 1 })
                        if (!employmentTypeData.status) {
                            return Promise.reject(responseMessages.employee.behalfOnboarding.visaTypeIdNotExists)
                        }
                        return true
                    } else {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.visaTypeIdInvalid)
                    }
                }
                return true
            })
    ];
    /* Writing validation rules to the input request */

    /* Run the validation rules. */
    for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
    }
    const errors = validationResult(req);
    /* Run the validation rules. */

    /**
       * If validation is success
       *    + call the update service function
       *    - Based on the status in update function response, segregate the response and prepare the response
       * If Validation Fails
       *    + Return the error message.
      */
    if (errors.isEmpty()) {


        const payrollData = await payRollService.payrollFinalize(req.body);
        if (!payrollData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, error: payrollData.error };
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };
        }
        /* Log Response */
        logResponse('info', req, responseData, 'update payroll finalize Response');
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Handles payroll skip updates based on the provided request.
 *
 * @param {object} req - The request object containing payroll skip details.
 * @param {object} res - The response object to be sent back.
 *
 * Logic:
 * - Logs the incoming request for payroll skip update.
 * - Initializes a variable 'responseData'.
 * - Defines validation rules for the input request.
 * - Runs the defined validation rules against the request.
 * - If there are validation errors:
 *   - Throws an InvalidRequestError with an unprocessable entity code, providing the first error message encountered.
 * - If validation is successful:
 *   - Calls the payroll skip service function using the data from the request body.
 *   - Constructs a success response indicating successful skip.
 *   - Logs the response.
 *   - Sends the constructed response using the responseHandler.
 */
const payrollSkip = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, 'Payroll skip Update  request')
    /* Log Request */

    /* Default Variable */
    var responseData = ''
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check('payroll_configuration_id').trim().escape().notEmpty().withMessage(responseMessages.payroll.payrollConfigIdRequired)
            .isInt().withMessage(responseMessages.payroll.payrollConfigIdInvalid)
            .custom(async (value) => {
                const payrollconfig = await indexServices.find('payroll_configuration', ['id', 'status'], { id: value }, null, [], null, null, null, false);
                var payrollconfigData = payrollconfig.status;
                if (!payrollconfigData && value != '') {
                    return Promise.reject(
                        responseMessages.payroll.payrollConfigIdDoesNotExist
                    );
                }
                if (payrollconfig.data[0].status == 3) {
                    return Promise.reject(responseMessages.payroll.payrollAlreadySubmitted);
                }
                return true;
            })
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
     * If validation is success
     *    + Call the payroll skip service function
     *    - Based on the status in payroll run function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
     */
    if (errors.isEmpty()) {

        await payRollService.payrollSkip(req.body)
        responseData = {
            statusCode: responseCodes.codeSuccess,
            message: responseMessages.common.success
        }

        /* Log Response */
        logResponse('info', req, responseData, 'Payroll Skip Update response')
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData)
        /* Return the response */

    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        )
    }
})

module.exports = { index, payrollPdf, update, balanceSheetIndexCard, generatePayroll, paymentsListing, payrollRun, submitPayroll, payrollPaymentInfo, payrollPaymentInfo1, finalizeListing, finalizedEmployee, payrollFinalize, payrollSkip }
