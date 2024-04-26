
const { check, validationResult } = require('express-validator');
const { tryCatch } = require('../../../../../utils/tryCatch');
const { logRequest, logResponse } = require('../../../../../utils/log');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const { responseHandler } = require('../../../../responseHandler');
const chartService = require('../../services/chart/index');

/**
 * Third party Chart API integration
 *
 * Logic:
 * - Validate the request
 * - Call the OCR API service and return the response
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
        logRequest('info', req, "Chart API request");
        /* Log Request */

        /* Writing validation conditions to the input request */
        var validations = [
            check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
            check('question').trim().escape().notEmpty().withMessage(responseMessages.chatBot.questionRequired)
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
         *    + call the service function
         *    + Return the API response from the service
         * If Validation Fails
         *    + Return the error message.
        */
        if (errors.isEmpty()) {
            let responseData;
            var response = await chartService.index(req.body);
            if (response.status) {
                responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: response.data }
            } else {
                responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error };
            }

            /* Log Response */
            logResponse("info", req, responseData, "Chart API Response");
            /* Log Response */

            /* Return the response */
            responseHandler(res, responseData);
            /* Return the response */

        } else {
            throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
        }
    });

module.exports = { index }

