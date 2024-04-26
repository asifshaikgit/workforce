const { check, validationResult } = require('express-validator')
const { responseMessages } = require('../../../../../constants/responseMessage')
const { responseCodes } = require('../../../../../constants/responseCodes')
const { logRequest, logResponse } = require('../../../../../utils/log')
const employeeSelfServiceChatService = require('../../services/employee_self_service/employeeSelfServiceChatService')
const { responseHandler } = require('../../../../responseHandler')
const { tryCatch } = require('../../../../../utils/tryCatch')
const InvalidRequestError = require('../../../../../error/InvalidRequestError')
const { pagination } = require('../../../../../config/pagination')
const indexService = require('../../services/index');
const format = require('../../../../../helpers/format');
const { regexPatterns } = require('../../../../../constants/regexPatterns')
const moment = require('moment');

const chatMessages = tryCatch(async (req, res) => {
    // Log Request
    logRequest('info', req, 'getting employee self service chat request')

    // Default Variable
    var responseData;

    // Writing validation rules to the input request
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
            .withMessage(
                responseMessages.employeeSelfService.employeeSelfServiceIdRequired
            )
            .custom(async (value) => {
                const selfService = await indexService.find('employee_self_services', ['id'], { id: value })
                var selfServiceData = selfService.status
                if (!selfServiceData) {
                    return Promise.reject(
                        responseMessages.employeeSelfService.IdNotExists
                    )
                }
            })
    ];

    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req)
        if (result.errors.length) break
    }
    var errors = validationResult(req);

    if (errors.isEmpty()) {
        let condition = { id: req.query.id } // condition
        // Default Variable
        let limit = (req.query.limit) ? (req.query.limit) : 100;
        let page = (req.query.page) ? (req.query.page) : pagination.page
        var listingData = await employeeSelfServiceChatService.chatMessagesListing(condition, page, limit);
        if (!listingData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: listingData.message, error: listingData.error, message: responseMessages.common.noRecordFound, data: [], pagination: listingData.pagination }
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: listingData.data, pagination: listingData.pagination_data };
        }

        // Log Response
        logResponse('info', req, responseData, 'getting employee self service chat request.');

        // Return the response
        responseHandler(res, responseData);

    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
});

module.exports = { chatMessages };