const placementBillingServices = require('../../services/placement/placementBillingServices.js')
const { check, validationResult } = require('express-validator');
const { logRequest, logResponse } = require('../../../../../utils/log');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { responseHandler } = require("../../../../responseHandler");
const { tryCatch } = require("../../../../../utils/tryCatch");
const moment = require('moment');
const InvalidRequestError = require("../../../../../error/InvalidRequestError");
const indexService = require('../../services/index')
const format = require('../../../../../helpers/format');
const { regexPatterns } = require('../../../../../constants/regexPatterns')


/**
 * Index function to retrieve placement billing details.
 *
 * Logic:
 * - Log the incoming request.
 * - Initialize variables for response data, request_id, and placement_id.
 * - If a 'request_id' is provided:
 *   - Define a pattern for validating 'placement_id'.
 *   - If 'placement_id' is provided and matches the pattern:
 *     - Create a condition to filter billing details based on 'placement_id'.
 *     - Call the 'placementBillingServices.index' function to retrieve billing data.
 *     - Check if billing data retrieval was successful:
 *       - If successful, prepare a response with a status code, success message, and the retrieved data.
 *       - If no records are found, prepare a response with a status code, a message indicating no records found, and an empty data array.
 *     - If there's an issue with the 'placement_id', prepare an error response.
 *   - If 'placement_id' is not provided or doesn't match the pattern, prepare an error response.
 *   - Log the response.
 *   - Return the response to the client.
 * - If 'request_id' is not provided, throw an 'InvalidRequestError' with a message indicating that 'request_id' is required.
 *
 * @param {Object} req - The request object containing query parameters for filtering billing details.
 * @param {Object} res - The response object for sending the API response.
 * @returns {Object} Response data based on successful retrieval or validation failure.
 * @returns None
 * @throws {InvalidRequestError} If the request ID is missing or invalid.
 */
const index = tryCatch(
    async (req, res) => {

        /* Log Request */
        logRequest('info', req, "getting index billing details request");
        /* Log Request */

        /* Default Variable */
        var responseData = '';
        var request_id = req.query.request_id;
        let placement_id = req.query.id
        /* Default Variable */

        if (request_id != undefined && request_id != '') {

            /* Default Variable */
            var pattern = regexPatterns.uuidRegex

            /* Writing validation rules to the input request */
            if (placement_id != undefined && placement_id != '' && pattern.test(placement_id)) {
                var condition = { placement_id: placement_id };
                var billingData = await placementBillingServices.index(condition);
                if (!billingData.status) {
                    responseData = { statusCode: responseCodes.codeSuccess, message: billingData.message, error: billingData.error, message: responseMessages.common.noRecordFound, data: [] }
                } else {
                    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: billingData.data, max_invoice_date: billingData.max_invoice_date };
                }
            } else {
                responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.placement.placementIdInvalid }
            }
            /* Writing validation rules to the input request */

            /* Log Response */
            logResponse('info', req, responseData, "billing details index Response");
            /* Log Response */

            /* Return the response */
            responseHandler(res, responseData);
            /* Return the response */

        } else {
            throw new InvalidRequestError(responseMessages.common.requestIdRequired);
        }
    });

/**
 * Store function to create a new Placement Billing record.
 *
 * Logic:
 * - Retrieve the date format for formatting dates.
 * - Log the incoming request.
 * - Initialize variables for response data.
 * - Modify the 'effective_from' date format to 'YYYY-MM-DD'.
 * - Define validation conditions for the input request using the 'check' function from a validation library.
 * - Run validation rules for the input request.
 * - If validation passes, call the 'placementBillingServices.store' function.
 * - Check the response status from the 'store' function:
 *   - If successful, prepare a success response with status code, message, and data.
 *   - If unsuccessful, prepare an error response with status code, error message, and error details.
 * - Log the response.
 * - Return the response to the client.
 * - If validation fails, throw an 'InvalidRequestError' with the first validation error message.
 *
 * @param {Object} req - The request object containing placement billing data.
 * @param {Object} res - The response object for sending the API response.
 * @returns {Object} Response data indicating success or failure.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const store = tryCatch(async (req, res) => {
    let dateFormat = await format.getDateFormat(); // date format

    /* Log Request */
    logRequest('info', req, "create placement billing request.");
    /* Log Request */

    /* Default Variable */
    var responseData = "";
    /* Default Variable */

    let modified_date = moment(req.body.effective_from, dateFormat).format('YYYY-MM-DD');
    req.body.effective_from = modified_date; // Modify the end_date property

    /* Writing validation conditions to the input request */
    var validations = [
        check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check("placement_id")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.placement.placementIdRequired)
            .isUUID()
            .withMessage(responseMessages.placement.placementIdInvalid)
            .custom(async (value) => {
                const placement = await indexService.find('placements', ['id'], { id: value });
                if (!placement.status) {
                    return Promise.reject(responseMessages.placement.placementIdInvalid);
                }
                return true;
            }),
        check('bill_type')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.placement.billingTypeRequired)
            .isInt({ min: 1, max: 2 })
            .withMessage(responseMessages.placement.billingTypeInvalid),
        check("bill_rate")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.placement.billigRateRequired)
            .isFloat()
            .withMessage(responseMessages.placement.billingRateInvalid),
        check("effective_from")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.placement.payRateEffectiveDateRequired)
            .isDate()
            .withMessage(responseMessages.placement.payRateEffectiveDateInvalid)
            .custom(async (value) => {
                var date = await placementBillingServices.getPlacementBillingAllowFromDate(req.body.placement_id)
                if (date.status) {
                    var billingDate = moment(date.data[0].date).format('YYYY-MM-DD')
                    if (value <  billingDate) {
                        return Promise.reject(responseMessages.placement.payRateEffectiveDateInvalid);
                    }
                }
                return true
            }),
        check("ot_bill_rate")
            .trim()
            .escape()
            .custom((value) => {
                if (value != '') {
                    if (!regexPatterns.decimalNumberWithTwoDecimalsRegex.test(value)) {
                        throw new Error(responseMessages.placement.otBillRateInvalid);
                    }
                }
                return true
            }),
        check("ot_pay_rate_config_type")
            .trim()
            .escape()
            .custom((value) => {
                if (req.body.ot_bill_rate != '') {
                    if (value != '') {
                        if (value === '1' || value === '2' || value === '3') {
                            return true
                        } else {
                            throw new Error(responseMessages.placement.otPayRateConfigTypeInvalid);
                        }
                    } else {
                        throw new Error(responseMessages.placement.otPayRateConfigTypeRequired);
                    }
                }
                return true;
            }),
        check("ot_pay_rate")
            .trim()
            .escape()
            .custom((value) => {
                if (req.body.ot_bill_rate != '') {
                    const otPayRateConfigType = req.body.ot_pay_rate_config_type;
                    if (otPayRateConfigType === '2') {
                        if (value === '') {
                            throw new Error(responseMessages.placement.otPayRateRequired);
                        } else if (!regexPatterns.decimalNumberWithTwoDecimalsRegex.test(value)) {
                            throw new Error(responseMessages.placement.otPayRateInvalid);
                        }
                    }
                }
                return true
            }),
        check("ot_pay_rate_multiplier")
            .trim()
            .escape()
            .optional()
            .custom((value) => {
                if (req.body.ot_bill_rate != '') {
                    const otPayRateConfigType = req.body.ot_pay_rate_config_type;
                    if (otPayRateConfigType === '3') {
                        if (value === '') {
                            throw new Error(responseMessages.placement.otPayRateMultiplierRequired);
                        } else if (!regexPatterns.decimalNumberWithTwoDecimalsRegex.test(value)) {
                            throw new Error(responseMessages.placement.otPayRateMultiplierInvalid);
                        }
                    }
                }
                return true
            }),
        check("bill_rate_discount")
            .trim()
            .escape()
            .custom((value) => {
                if (req.body.bill_rate_discount_type == 1) { // percentage
                    if (value != '') {
                        if (!regexPatterns.decimalNumberWithTwoDecimalsRegex.test(value) || Number(value) > 100) {
                            throw new Error(responseMessages.placement.discountBillRateInvalid);
                        }
                    } else {
                        throw new Error(responseMessages.placement.discountBillRateRequired);
                    }
                } else if (req.body.bill_rate_discount_type == 2) {
                    if (value != '') {
                        if (!regexPatterns.decimalNumberWithTwoDecimalsRegex.test(value) || Number(value) == 0) {
                            throw new Error(responseMessages.placement.discountBillRateInvalid);
                        }
                    } else {
                        throw new Error(responseMessages.placement.discountBillRateRequired);
                    }
                }
                return true
            }),
        check("bill_rate_discount_type")
            .trim()
            .escape()
            .custom((value) => {
                if (value != '') {
                    if (Number(value) > 2) {
                        throw new Error(responseMessages.placement.discountBillDiscountTypeInvalid);
                    }
                }
                return true
            })
    ];
    /* Writing validation conditions to the input request */

    /*Run the validation rules. */
    for (let validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    /*Run the validation rules. */

    /**
     * If validation is success
     *    + call the create service function
     *        - Based on the status in create function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
    */
    if (errors.isEmpty()) {
        var response = await placementBillingServices.store(req.body);
        if (response.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully, data: response[0] }
        } else {
            responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error };
        }

        /* Log Response */
        logResponse("info", req, responseData, "placement billing Create Response.");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Update function to modify placement billing details.
 *
 * Logic:
 * - Log the incoming request.
 * - Initialize a variable for response data.
 * - Define validation conditions for the input request, including checking placement and billing details.
 * - Run the validation rules, checking for errors.
 * - If validation is successful:
 *   - Call the 'placementBillingServices.update' function to update billing details.
 *   - Prepare a response with a success status code and the updated data.
 *   - Log the response.
 *   - Return the response to the client.
 * - If validation fails:
 *   - Return an error message with an appropriate status code.
 *
 * @param {Object} req - The request object containing data for updating placement billing details.
 * @param {Object} res - The response object for sending the API response.
 * @returns {Object} Response data based on successful update or validation failure.
 */
const update = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "Update placement billing request.");
    /* Log Request */

    /* Default Variable */
    var responseData = "";
    /* Default Variable */

    /* Writing validation conditions to the input request */
    var validations = [
        check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check("placement_id")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.placement.placementIdRequired)
            .isUUID()
            .withMessage(responseMessages.placement.placementIdInvalid)
            .custom(async (value) => {
                const placement = await indexService.find('placements', ['id'], { id: value });
                if (!placement.status) {
                    return Promise.reject(responseMessages.placement.placementIdInvalid);
                }
                return true;
            }),
        check('billing_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.placement.billingIdRequired)
            .custom(async (value) => {
                const billing = await indexService.find('placement_billing_details', ['id'], { id: value });
                if (!billing.status) {
                    return Promise.reject(responseMessages.placement.billingIdInvalid);
                }
                return true;
            }),
        check('bill_type')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.placement.billingTypeRequired)
            .isInt({ min: 1, max: 2 })
            .withMessage(responseMessages.placement.billingTypeInvalid),
        check("bill_rate")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.placement.payRateRequired)
            .isInt()
            .withMessage(responseMessages.placement.payRateInvalid),
        check("ot_bill_rate")
            .trim()
            .escape()
            .custom((value) => {
                if (value != '') {
                    if (!regexPatterns.decimalNumberWithTwoDecimalsRegex.test(value)) {
                        throw new Error(responseMessages.placement.otBillRateInvalid);
                    }
                }
                return true
            }),
        check("ot_pay_rate_config_type")
            .trim()
            .escape()
            .custom((value) => {
                if (req.body.ot_bill_rate != '') {
                    if (value != '') {
                        if (value === '1' || value === '2' || value === '3') {
                            return true
                        } else {
                            throw new Error(responseMessages.placement.otPayRateConfigTypeInvalid);
                        }
                    } else {
                        throw new Error(responseMessages.placement.otPayRateConfigTypeRequired);
                    }
                }
                return true;
            }),

        check("ot_pay_rate")
            .trim()
            .escape()
            .custom((value) => {
                if (req.body.ot_bill_rate != '') {
                    const otPayRateConfigType = req.body.ot_pay_rate_config_type;
                    if (otPayRateConfigType === '2') {
                        if (value === '') {
                            throw new Error(responseMessages.placement.otPayRateRequired);
                        } else if (!regexPatterns.decimalNumberWithTwoDecimalsRegex.test(value)) {
                            throw new Error(responseMessages.placement.otPayRateInvalid);
                        }
                    }
                }
                return true
            }),
        check("ot_pay_rate_multiplier")
            .trim()
            .escape()
            .optional()
            .custom((value) => {
                if (req.body.ot_bill_rate != '') {
                    const otPayRateConfigType = req.body.ot_pay_rate_config_type;
                    if (otPayRateConfigType === '3') {
                        if (value === '') {
                            throw new Error(responseMessages.placement.otPayRateMultiplierRequired);
                        } else if (!regexPatterns.decimalNumberWithTwoDecimalsRegex.test(value)) {
                            throw new Error(responseMessages.placement.otPayRateMultiplierInvalid);
                        }
                    }
                }
                return true
            })
    ];
    /* Writing validation conditions to the input request */

    /*Run the validation rules. */
    for (let validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    /*Run the validation rules. */

    /**
     * If validation is success
     *    + call the create service function
     *        - Based on the status in create function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
    */
    if (errors.isEmpty()) {
        var response = await placementBillingServices.update(req.body);
        responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully, data: response[0] }

        /* Log Response */
        logResponse("info", req, responseData, "placement billing Update Response.");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});


module.exports = { index, store, update };