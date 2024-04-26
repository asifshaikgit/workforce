/**
 * @constant check Creates a middleware/validation chain for one or more fields that may be located in any of the following:
 */
const { check, validationResult } = require('express-validator');

/**
 * @constant tryCatch Default class for try catch handling
 * 
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
const InvalidRequestError = require('../../../../../error/InvalidRequestError');

const indexServices = require("../../repositories/index");
const moment = require('moment');
const format = require('../../../../../helpers/format');
const ledgerRecurringConfigurationServices = require('../../services/ledgers/ledgerRecurringConfigurationServices');
const { responseHandler } = require('../../../../responseHandler');
const INVOICES = 'invoice';
const BILLS = 'bill';


/**
 * Validation Rules for store ad update.
 * - Define the validation rules as follows:
 *   + 'request_id' (body), must not be empty.
 *   + 'entity_type' (body), must not be empty, should be in ['invoices', 'bills'].
 *   + 'company_id' (body), must not be empty, must be valid uuid, should exist in `companies` table.
 *   + 'order_number' (body). must not be empty.
 *   + 'net_pay_terms_id' (body), must not be empty,  should be 'int', should exist in `net_pay_terms` table.
 *   + 'date' (body). must not be empty, should be a valid date.
 *   + 'recurring_end_date' (body), must not bt empty.
 *   + 'customer_note' (body), must not be empty.
 *   + 'terms_and_conditions' (body), must not be emoty.
 *   + 'documents' (body), must be array.
 *   + 'sub_total_amount' (body), must not be empty, must not be float.
 *   + 'discount_type' (body), should be 1 or 2 if 'entity_type' is 'invoices'.
 *   + 'discount_amount' (body), must not be empty if 'entity_type' is 'invoices'.
 *   + 'discount_value' (body), must not be empty if 'entity_type' is 'invoices'.
 *   + 'ledger_item_details' (body), must be array,'sub_total_amount' received and ledger_item_details `amount` should be same.
 *   + 'ledger_item_details.*.employee_id' (body), must not be empty, must be uuid, should exist in `employee` table.
 *   + 'ledger_item_details.*.placement_id' (body), must not be empty, must be uuid, should exist in `placements` table.
 *   + 'ledger_item_details.*.hours' (body), must not be empty, must not be float.
 *   + 'ledger_item_details.*.rate' (body), must not be empty, must not be float.
 *   + 'ledger_item_details.*.amount' (body), must not be empty, must not be float.
 *   + 'ledger_item_details.*.timesheet_hour_ids' (body), if not empty validate the ids exist in 'timesheer_hours' table with invoice_raised as false.
 *   + 'ledger_item_details.*.shipping_address' (body), must not be empty object.
 *   + 'ledger_item_details.*.billing_address' (body), must not be empty object, shipping_address and billing_address state and country ids must be different.
 */
async function validationRules(req) {

    // initialize updateValidationRules & placementIdValidation empty rules.
    let updateValidationRules = [];

    const validationRules = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('entity_type')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.ledgers.slugNameRequired)
            .isIn([INVOICES, BILLS])
            .withMessage(responseMessages.ledgers.slugNameShouldbe),
        check('ledger_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgers.idRequired)
            .isUUID()
            .withMessage(responseMessages.ledgers.idInvalid)
            .custom(async (value) => {
                const ledgers = await indexServices.find('ledgers', ['id', 'date'], { id: value });
                if (!ledgers.status) {
                    return Promise.reject(responseMessages.ledgers.idNotExists);
                } else {
                    let join = [{ table: 'ledger_item_details as lid', alias: 'lid', condition: ['lid.ledger_id', 'ledgers.id'], type: 'left' }]
                    var timesheetIds = await indexServices.find('ledgers', ['lid.timesheets_available'], { 'lid.ledger_id': req.body.ledger_id }, null, join)
                    if (timesheetIds.data[0].timesheets_available) {
                        return Promise.reject(responseMessages.ledgers.recurring.recurringNotAllowed);
                    }
                }
                if (!req.body.action) {
                    const ledgerrecurring = await indexServices.find('ledger_recurring_configurations', ['id'], { ledger_id: value });
                    if (ledgerrecurring.status) {
                        return Promise.reject(responseMessages.ledgers.recurring.ledgerRecurringExists);
                    }
                }
                req.body.ledger_date = ledgers.data[0].date
                return true
            }),
        check('recurring_cycle_type')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.ledgers.recurring.recurringCycleTypeRequired)
            .isIn(['1', '2', '3', '4'])
            .withMessage(responseMessages.ledgers.recurring.invalidRecurringCycleType),
        check('recurring_cycle_number')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.ledgers.recurring.recurringCycleNumberRequired)
            .isInt()
            .withMessage(responseMessages.ledgers.recurring.invalidRecurringCycleNumber),
        check('recurring_start_date')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.ledgers.recurring.recurringStartDateRequired)
            .custom((value) => {
                if (value != 'Invalid date') {
                    const isDate = new Date(value);
                    if (isNaN(isDate.getTime())) {
                        return Promise.reject(responseMessages.ledgers.recurring.recurringStartDateInvalid);
                    }
                    return true;
                } else {
                    return Promise.reject(responseMessages.ledgers.dateFormetInvalid);
                }
            }),
        check('recurring_end_date')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.ledgers.recurringEndDateRequired)
            .custom((value) => {
                if (req.body.recurring_never_expires) {
                    if (value != 'Invalid date') {
                        const isDate = new Date(value);
                        if (isNaN(isDate.getTime())) {
                            return Promise.reject(responseMessages.ledgers.recurring.recurringEndDateInvalid);
                        }
                        return true
                    } else {
                        return Promise.reject(responseMessages.ledgers.dueDateFormetInvalid);
                    }
                }
                return true
            }),
        check('recurring_never_expires')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.ledgers.recurring.recurringNeverExpiresRequired)
            .isBoolean()
            .withMessage(responseMessages.ledgers.recurring.recurringNeverExpiresInvalid)
    ];
    return validationRules;
}

/**
 * Store function to create a new ledger
 * 
 * Overview of fucntion:
 * - Validate the request
 *   + If successful
 *     ~ Call the 'store' service function to create a new ledger.
 *     ~ Prepare the response with success data.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Get the `entity_type` from `req.path`.
 * - Convert 'date', 'recurring_end_date' in the request to 'YYYY-MM-DD' format using Moment.js and update the request.
 * - Call the validationRules function to get the validation rules.
 * - Run the validation rules.
 * - If validation is successful:
 *   + Call the `store` service function to create a new ledger.
 *   + If success:
 *     - Prepare the resposne with success data.
 *   + Else: 
 *     - Prepare the response with error message.
 * - If validation fails:
 *   + Add error validation to the resposne.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 * 
 * Notes:
 * - Exception handling using try-catch
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const store = tryCatch(async (req, res) => {

    let dateFormat = await format.getDateFormat(); // date format

    // Log Request
    await logRequest('info', req, 'Store new ledgers recurring configurations request');

    // Default Variable
    let responseData;

    // Get the `entity_type` from `req.path`.
    const requestSegments = req.path.split('/');
    req.body.entity_type = requestSegments[3];

    // Convert 'recurring_start_date', 'recurring_end_date' in the request to 'YYYY-MM-DD' format.
    req.body.recurring_start_date = req.body.recurring_start_date ? moment(req.body.recurring_start_date, dateFormat).format('YYYY-MM-DD') : req.body.recurring_start_date; // for formating start date
    req.body.recurring_end_date = req.body.recurring_end_date ? moment(req.body.recurring_end_date, dateFormat).format('YYYY-MM-DD') : req.body.recurring_end_date; // for formating end date

    if (req.body.custom_recurring_cycle_type != '' && req.body.custom_recurring_cycle_type != null && req.body.custom_recurring_cycle_type != undefined) {
        req.body.recurring_cycle_type = req.body.custom_recurring_cycle_type
        req.body.is_custom = true
    } // for inserting the custom information to main keys

    if (req.body.custom_recurring_cycle_number != '' && req.body.custom_recurring_cycle_number != null && req.body.custom_recurring_cycle_number != undefined) {
        req.body.recurring_cycle_number = req.body.custom_recurring_cycle_number
        req.body.is_custom = true
    }// for inserting the custom information to main keys

    // Call the validationRules function to get the validation rules.
    var validations = await validationRules(req);

    // Run the validation rules. */
    for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
    }
    const errors = validationResult(req);

    /**
     * If validation is success
     *    + Call the create new ledger service function
     *    - Based on the status in create new ledger function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
     */
    if (errors.isEmpty()) {
        var response = await ledgerRecurringConfigurationServices.store(req.body);
        if (response.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success };
        } else {
            responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error };
        }

        // Log Response */
        await logResponse('info', req, responseData, 'Store new ledgers recurring response');

        // Return the response */
        await responseHandler(res, responseData);

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Update function to create a new ledger
 * 
 * Overview of fucntion:
 * - Validate the request
 *   + If successful
 *     ~ Call the 'update' service function to update a ledger.
 *     ~ Prepare the response with success data.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Get the `entity_type` from `req.path`.
 * - Convert 'date', 'recurring_end_date' in the request to 'YYYY-MM-DD' format using Moment.js and update the request.
 * - Call the validationRules function to get the validation rules.
 * - Run the validation rules.
 * - If validation is successful:
 *   + Call the `update` service function to update the ledger.
 *   + If success:
 *     - Prepare the resposne with success data.
 *   + Else: 
 *     - Prepare the response with error message.
 * - If validation fails:
 *   + Add error validation to the resposne.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 * 
 * Notes:
 * - Exception handling using try-catch
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
    let dateFormat = await format.getDateFormat(); // date format

    // Log Request
    await logRequest('info', req, 'Update new ledgers recurring request');

    // Default Variable
    let responseData;

    // Get the `entity_type` from `req.path`.
    const requestSegments = req.path.split('/');
    req.body.entity_type = requestSegments[3];
    req.body.action = requestSegments[4]; // depending on action whether it is store or update

    // Convert 'recurring_start_date', 'recurring_end_date' in the request to 'YYYY-MM-DD' format.
    req.body.recurring_start_date = req.body.recurring_start_date ? moment(req.body.recurring_start_date, dateFormat).format('YYYY-MM-DD') : req.body.recurring_start_date; // for formating start date
    req.body.recurring_end_date = req.body.recurring_end_date ? moment(req.body.recurring_end_date, dateFormat).format('YYYY-MM-DD') : req.body.recurring_end_date; // for formating end date

    if (req.body.custom_recurring_cycle_type != '' && req.body.custom_recurring_cycle_type != null && req.body.custom_recurring_cycle_type != undefined) {
        req.body.recurring_cycle_type = req.body.custom_recurring_cycle_type
        req.body.is_custom = true
    } // for inserting the custom information to main keys

    if (req.body.custom_recurring_cycle_number != '' && req.body.custom_recurring_cycle_number != null && req.body.custom_recurring_cycle_number != undefined) {
        req.body.recurring_cycle_number = req.body.custom_recurring_cycle_number
        req.body.is_custom = true
    }// for inserting the custom information to main keys

    // Call the validationRules function to get the validation rules.
    var validations = await validationRules(req);

    // Run the validation rules. */
    for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
    }
    const errors = validationResult(req);

    if (errors.isEmpty()) {

        var response = await ledgerRecurringConfigurationServices.update(req.body);
        if (response.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };
        } else {
            responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error };
        }

        // Log Response */
        await logResponse('info', req, responseData, 'Store new ledgers response');

        // Return the response */
        await responseHandler(res, responseData);

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Handles the index request for a single Approval Configuration.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns None
 * @throws {InvalidRequestError} If the request_id or invoice_id is missing.
 */
const index = tryCatch(async (req, res) => {
    // Log Request
    logRequest('info', req, 'getting ledger recurring details');

    let dateFormat = await format.getDateFormat();

    // Get the `entity_type` from `req.path`.
    const requestSegments = req.path.split('/');
    req.query.entity_type = requestSegments[3];

    // Default Variable
    var responseData;

    // Writing validation rules to the input request
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check("entity_type")
            .trim()
            .escape()
            .isIn([INVOICES, BILLS])
            .withMessage(responseMessages.ledgers.slugNameShouldbe),
        check('ledger_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgers.ledgerIdRequired)
            .isUUID()
            .withMessage(responseMessages.ledgers.idInvalid)
            .custom(async (value) => {
                const ledgers = await indexServices.find('ledgers', ['id'], { id: value, entity_type: req.body.entity_type });
                if (!ledgers.status) {
                    return Promise.reject(responseMessages.ledgers.idNotExists);
                } else {
                    const ledgerrecurring = await indexServices.find('ledger_recurring_configurations', ['id'], { ledger_id: value, deleted_at: null });
                    if (!ledgerrecurring.status) {
                        return Promise.reject(responseMessages.ledgers.recurring.ledgerRecurringNotExists);
                    }
                }
                return true
            }),
    ];

    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    if (errors.isEmpty()) {
        let condition = { ledger_id: req.query.ledger_id }
        var ledgerRecurringData = await ledgerRecurringConfigurationServices.index(condition, dateFormat);
        if (!ledgerRecurringData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: ledgerRecurringData.message, error: ledgerRecurringData.error, message: responseMessages.common.noRecordFound, data: [] }
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: ledgerRecurringData.data };
        }

        // Log Response
        logResponse(
            'info',
            req,
            responseData,
            'Getting ledger recurring details Response'
        )

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

module.exports = { store, update, index };
