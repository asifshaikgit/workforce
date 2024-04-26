const { responseCodes } = require("../../../../../constants/responseCodes");
const { responseMessages } = require("../../../../../constants/responseMessage");
const { logRequest, logResponse } = require("../../../../../utils/log");
const { tryCatch } = require("../../../../../utils/tryCatch");
const activityTrackService = require("../../services/configurations/activityTrackServices")
const { check, validationResult } = require('express-validator');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const { responseHandler } = require('../../../../responseHandler');
const { pagination } = require('../../../../../config/pagination');
const format = require('../../../../../helpers/format');


/**
 * Activity Track Listing Request to fetch activity track data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the listing service function.
 *      ~ Fetch the data based on the provided query parameters.
 *      ~ Add success to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 *  - Logging incoming request.
 *  - Define the validation rules as follows:
 *    + request_id is mandatory and must be provided.
 *    + referrable_id is mandatory and must be an integer.
 *  - Run the validation rules.
 *    + If validation is successful:
 *      ~ Call the listing service function to fetch the data.
 *      ~ Add the returned data to the response.
 *    + Else:
 *      ~ Add error validation to the response.
 *  - Prepare the response with appropriate status codes.
 *  - Log the response.
 *  - Return the response using responseHandler().
 *
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns None.
 * @throws {InvalidRequestError} - If the request ID or referrable ID is missing or invalid.
 */
const listing = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, 'Activity Track Listing Request')

    // Default variable
    let responseData = [];

    // Writing validation rules to the input request
    const validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('referrable_id')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.activity.referrableIdRequired)
            .isInt()
            .withMessage(responseMessages.activity.referrableIdInvalid)
    ];

    // Run the validation rules.
    for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
    }
    const errors = validationResult(req);

    /**
     * If Validation is success
     *    + Call the listing service function
     *      - Based on the slug it will return the data
     * If Validation Fails
     *    + Return the error message. 
     */
    if (errors.isEmpty()) {

        let dateFormat = await format.getDateFormat(); // date format

        /* Default Variable */
        let limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
        let page = (req.query.page) ? (req.query.page) : pagination.page;
        req.query.slug_id = (req.query.slug_id) ? (req.query.slug_id) : null;

        const activityTrackListing = await activityTrackService.listing(req.query, page, limit, dateFormat);
        if (!activityTrackListing.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: activityTrackListing.message,
                error: activityTrackListing.error,
                data: []
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                data: activityTrackListing.data,
                pagination: activityTrackListing.pagination_data
            }
        }
        // Log Response
        logResponse('info', req, responseData, 'Activity Track Listing Response');

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

module.exports = { listing };