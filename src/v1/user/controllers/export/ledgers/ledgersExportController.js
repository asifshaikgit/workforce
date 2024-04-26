const { responseCodes } = require("../../../../../../constants/responseCodes");
const { responseMessages } = require("../../../../../../constants/responseMessage");
const { logRequest, logResponse } = require("../../../../../../utils/log");
const { tryCatch } = require("../../../../../../utils/tryCatch");
const { responseHandler } = require("../../../../../responseHandler");
const ledgersExportServices = require("../../../services/export/ledgers/ledgersExportServices")
const format = require('../../../../../../helpers/format');
/**
 * @constant check Creates a middleware/validation chain for one or more fields that may be located in any of the following:
 */
const { check, validationResult } = require('express-validator');

/**
 * @constant InvalidRequestError Default class for handling invalid request
 */
const InvalidRequestError = require('../../../../../../error/InvalidRequestError');
const moment = require('moment');
const { regexPatterns } = require("../../../../../../constants/regexPatterns");
const indexService = require('../../../services/index');
const INVOICES = 'invoice';
const BILLS = 'bill';
const PAYMENTS = 'payment';
const CLIENT = 'client';
const VENDOR = 'vendor';
const ENDCLIENT = 'end-client';
const BILL_PAYMENTS = 'bill-payment';

/**
 * Sales Export request to export invoices and bills data company wise
 * Overview of API:
 * - Validate the request.
 *   + If success
 *     ~ Call the service function.
 *     ~ Fetch the data from 'companies' table ad return the data.
 *     ~ Add success to the response
 *   + Else
 *     ~ add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Logging incoming request
 * - Define the validation rules as follows.
 *   + 'request_id' (body), must not be empty.
 *   + 'entity_type' (body), must not be empty, should be in ['invoices', 'bills'].
 *   + 'company_id' (body), must not be empty, must be valid uuid, should exist in `companies` table.
 * 
 * - Run the validation rules. 
 *   + If validation success
 *      ~ Call the service function(listing) to fetch the data and send the condition(defined above),
 *        # Add the service function(listing) return data to response. 
 *   + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Logging the response
 *  - Return response using responseHandler() 
 * 
 * Notes :
 *    - Handling expection using try catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns None
 * @throws {InvalidRequestError} - If the request ID is missing.
 */
const salesExport = tryCatch(async (req, res) => {

    /* Log Request */
    logRequest('info', req, "Getting complete sales Details Request.");
    /* Log Request */

    // date format
    const dateFormat = await format.getDateFormat();

    /* Default Variable */
    var responseData = '';
    let condition = {
        from_date: null,
        to_date: null
    }
    /* Default Variable */

    // Get the `entity_type` from `req.path`.
    const requestSegments = req.path.split('/');
    req.body.entity_type = requestSegments[2];
    const entity_type = req.body.entity_type;
    let company_entity_type;

    let allowedEntityTypes = [];
    if (entity_type == INVOICES || entity_type == BILLS) {
        allowedEntityTypes = [INVOICES, BILLS];
        company_entity_type = (entity_type == INVOICES) ? CLIENT : VENDOR;
    }

    // Writing validation rules to the input request
    const validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check("entity_type")
            .trim()
            .escape()
            .isIn(allowedEntityTypes)
            .withMessage(responseMessages.ledgers.slugNameShouldbe)
            .custom(async value => {
                if (value != null && value != '') {
                    condition = { ...condition, ...{ entity_type: value } };
                }
            }),
        check('company_id')
            .custom(async value => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        const companyData = await indexService.find('companies', ['id', 'reference_id'], { 'id': value, 'entity_type': company_entity_type });
                        if (!companyData.status) {
                            return Promise.reject(responseMessages.companies.companyIdNotExists);
                        } else {
                            condition = { ...condition, ...{ company_id: value } };
                        }
                    } else {
                        return Promise.reject(responseMessages.companies.companyIDInvalid);
                    }
                } else {
                    condition = { ...condition, ...{ company_id: null } };
                }
            })
    ];

    // validate 'from_date' and 'to_date'
    if (req.body.from_date && req.body.to_date) {
        const from_date = moment(req.body.from_date, dateFormat).format('YYYY-MM-DD');
        const to_date = moment(req.body.to_date, dateFormat).format('YYYY-MM-DD');
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

        var exportData = await ledgersExportServices.exportSalesInfo(condition);

        if (!exportData.status) {
            responseData = {
                statusCode: responseCodes.codeInternalError,
                error: exportData.error,
                message: responseMessages.common.noRecordFound
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                path: exportData.filepath
            };
        }

        // Log Response
        logResponse('info', req, responseData, "Getting ledgers listing Response");

        // Return the response
        responseHandler(res, responseData);

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

const ledgersExport = tryCatch(async (req, res) => {

    /* Log Request */
    logRequest('info', req, "Export complete ledgers Details Request.");
    /* Log Request */

    // date format
    const dateFormat = await format.getDateFormat();

    /* Default Variable */
    var responseData = '';
    let condition = {
        from_date: null,
        to_date: null
    }
    /* Default Variable */

    // Get the `entity_type` from `req.path`.
    const requestSegments = req.path.split('/');
    req.body.entity_type = requestSegments[2];
    const entity_type = req.body.entity_type;

    let allowedEntityTypes = [];
    let company_entity_type;
    if (entity_type == PAYMENTS || entity_type == BILL_PAYMENTS) {
        allowedEntityTypes = [PAYMENTS, BILL_PAYMENTS]
        company_entity_type = (entity_type == PAYMENTS) ? CLIENT : VENDOR;
    }

    // Writing validation rules to the input request
    const validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check("entity_type")
            .trim()
            .escape()
            .isIn(allowedEntityTypes)
            .withMessage(responseMessages.ledgers.slugNameShouldbe)
            .custom(async value => {
                if (value != null && value != '') {
                    condition = { ...condition, ...{ entity_type: value } };
                }
            }),
        check('company_id')
            .custom(async value => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        const companyData = await indexService.find('companies', ['id', 'reference_id'], { 'id': value, 'entity_type': company_entity_type });
                        if (!companyData.status) {
                            return Promise.reject(responseMessages.companies.companyIdNotExists);
                        } else {
                            condition = { ...condition, ...{ company_id: value } };
                        }
                    } else {
                        return Promise.reject(responseMessages.companies.companyIDInvalid);
                    }
                } else {
                    condition = { ...condition, ...{ company_id: null } };
                }
            })
    ];

    // validate 'from_date' and 'to_date'
    if (req.body.from_date && req.body.to_date) {
        const from_date = moment(req.body.from_date, dateFormat).format('YYYY-MM-DD');
        const to_date = moment(req.body.to_date, dateFormat).format('YYYY-MM-DD');
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
        var exportData = await ledgersExportServices.exportLedgersInfo(condition);

        if (!exportData.status) {
            responseData = {
                statusCode: responseCodes.codeInternalError,
                error: exportData.error,
                message: responseMessages.common.noRecordFound
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                path: exportData.filepath
            };
        }

        // Log Response
        logResponse('info', req, responseData, "Getting ledgers listing Response");

        // Return the response
        responseHandler(res, responseData);

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

module.exports = { salesExport, ledgersExport }