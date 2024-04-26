
const { check, validationResult } = require('express-validator');
const { tryCatch } = require('../../../../../utils/tryCatch');
const { logRequest, logResponse } = require('../../../../../utils/log');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const { responseHandler } = require('../../../../responseHandler');
const ocrService = require('../../services/ocr/index');
const indexService = require('../../services/index');
const { regexPatterns } = require('../../../../../constants/regexPatterns');

/**
 * Third party OCR API integration
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
        logRequest('info', req, "OCR API request");
        /* Log Request */

        /* Getting OCR Document type */
        const requestSegments = req.path.split('/');
        const documentType = requestSegments[2];
        switch (documentType) {
            case 'ssn':
                req.body.document_type = 'ssn-data';
                break;
            case 'ead':
                req.body.document_type = 'ead-data';
                break;
            case 'passport':
                req.body.document_type = 'passport-data';
                break;
            case 'h1b':
                req.body.document_type = 'h1b-data';
                break;
            case 'i94':
                req.body.document_type = 'i94-data';
                break;
            case 'cheque':
                req.body.document_type = 'cheque';
                break;
            default:
                req.body.document_type = null;
                break;
        }
        /* Getting Approval Module from URL */

        /* Writing validation conditions to the input request */
        var validations = [
            check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
            /*check("document_id")
                .trim()
                .notEmpty()
                .withMessage(responseMessages.common.ocrDocumentIdRequired)
                .isUUID()
                .withMessage(responseMessages.common.invalidOCRDocumentId)
                .custom(async (value) => {
                    const document = await indexService.find('temp_upload_documents', ['id', 'document_url'], { id: value }, 1, [], null, null, null, false);
                    if (!document.status) {
                        return Promise.reject(responseMessages.common.invalidOCRDocumentId);
                    }
                    req.body.document_url = document.data[0].document_url;
                    return true;
                })*/
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
            var response = await ocrService.index(req.body);
            if (response.status) {
                responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: response.data }
            } else {
                responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error };
            }

            /* Log Response */
            logResponse("info", req, responseData, "OCR API Response");
            /* Log Response */

            /* Return the response */
            responseHandler(res, responseData);
            /* Return the response */

        } else {
            throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
        }
    });

module.exports = { index }

