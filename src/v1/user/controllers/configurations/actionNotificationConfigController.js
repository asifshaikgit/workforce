const { responseCodes } = require("../../../../../constants/responseCodes");
const { responseMessages } = require("../../../../../constants/responseMessage");
const { logRequest, logResponse } = require("../../../../../utils/log");
const { tryCatch } = require("../../../../../utils/tryCatch");
const actionNotificationConfigService = require("../../services/configurations/actionNotificationConfigService")
const { check, validationResult } = require('express-validator');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const { responseHandler } = require('../../../../responseHandler');

/**
 * Retrieve a list of Action Notifications.
 * 
 * Overview of API:
 * - Validate the request, ensuring the presence of a request ID.
 *   + If successful
 *     ~ Call the service function to fetch a list of action notifications entries.
 *     ~ Prepare the response with the fetched data.
 *   + Else 
 *     ~ Add an error message to the response.
 * - Return the response.
 * 
 * Login:
 *  - Log the incoming request.
 *  - Set default variables for the response data.
 *  - Define the validation rules as follows:
 *    + 'request_id' is mandatory.
 *    + 'slug' is mandatory, it should either action or notification type.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the `listing` service function from the actionNotificationConfigService service.
 *    + Prepare a response with success status and message.
 *    + Log the response.
 *    + Return the response using 'responseHandler'.
 *  - If validation fails:
 *    + Return an error message with the status code 'Unprocessable Entity'.
 * 
 * @param {Object} req - The HTTP request object containing the request body.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const listing = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, 'Action Notification Listing Request')

    // Getting slug from url
    const requestSegments = req.path.split('/');
    req.body.slug = requestSegments[2];
    req.body.request_id = req.query.request_id;

    // Default variable
    let responseData = [];

    // Writing validation rules to the input request
    const validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('slug')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.configurations.slugNameRequired)
            .isIn(['action', 'notification'])
            .withMessage(responseMessages.configurations.slugNameInvalid)
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

        const actionNotificationsListing = await actionNotificationConfigService.listing(req.body);
        if (!actionNotificationsListing.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: actionNotificationsListing.message,
                error: actionNotificationsListing.error,
                data: []
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                data: actionNotificationsListing.data
            }
        }
        // Log Response
        logResponse('info', req, responseData, 'Action Notification Listing Response');

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

const update = async (req, res) => {

    // Log Request
    logRequest('info', req, 'Action Notifications Update request');

    // Default variables
    let responseData = [];

    /* Writing validation rules to the input request */
    const validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.configurations.actionNotifications.updateIdRequired)
            .isInt()
            .withMessage(responseMessages.configurations.actionNotifications.updateIdInvalid)
            .custom(async (value) => {
                const actionNotification = await indexServices.find('action_notifications_config', ['id'], { id: value });
                if (!actionNotification.status) {
                    return Promise.reject(responseMessages.configurations.actionNotifications.updateIdNotExists);
                }
            }),
        check('groups.*')
            .isArray({ min: 1 })
            .withMessage(responseMessages.configurations.actionNotifications.groupMustBeArray)
            .custom(async (value) => {
                // check group id is valid or not
                const groupExistance = await indexServices.find('groups', ['id'], { id: value });
                if (!groupExistance.status) {
                    return Promise.reject(responseMessages.configurations.actionNotifications.invalidGroup);
                }
                return true;
            })
    ];

    /*Run the validation rules. */
    for (let validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    /**
     * If validation is success
     *     + call the create service function to update the data
     * If Validation Fails
     *     + Return the error message.
     */
    if (errors.isEmpty()) {

        const update = await actionNotificationConfigService.update(req.body);

        /* Log Response */
        logResponse("info", req, responseData, "Action Notifications Update Response.");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
}

module.exports = { listing, update };