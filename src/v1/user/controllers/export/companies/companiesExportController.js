const { logRequest, logResponse } = require("../../../../../../utils/log");
const { check, validationResult } = require('express-validator');
const { tryCatch } = require("../../../../../../utils/tryCatch");
const companiesExportServices = require("../../../services/export/companies/companiesExportServices");
const format = require('../../../../../../helpers/format');
const { pagination } = require("../../../../../../config/pagination");
/**
 * @constant responseMessages responseMessage constant variables
 */
const { responseMessages } = require('../../../../../../constants/responseMessage');

/**
 * @constant responseCodes responseCodes constant variables
 */
const { responseCodes } = require('../../../../../../constants/responseCodes');

/**
 * @constant InvalidRequestError Default class for handling invalid request
 */
const InvalidRequestError = require('../../../../../../error/InvalidRequestError');
const { responseHandler } = require("../../../../../responseHandler");

/**
 * Companies Export request to export the companies data.
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
 *   + request(query) is mandatory.
 *   + 'slug_name' (query), must not be empty and should be one of ['client', 'vendor', 'end-client']. 
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *    + Set additional variables for status based on query parameters.
 *    + Create a condition object for filtering based on provided criteria.
 *    + Retrieve a list of company details based on the condition.
 *    + If successful:
 *      - Prepare the response with the retrieved data and pagination information.
 *    + If no records are found:
 *      - Prepare the response with a message indicating no records found.
 *    + Log the response.
 *    + Return the response using `responseHandler()`.
 * - If validation fails:
 *    + Add error validation to the response.
 * 
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const companiesExport = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "Getting companies Details Request.");
    /* Log Request */

    const requestSegments = req.path.split('/');
    const entity_type = requestSegments[2];
    req.query.entity_type = entity_type;

    /* Default Variable */
    var responseData = '';
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check("request_id")
            .trim().escape()
            .notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check('entity_type')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.slugNameRequired)
            .isIn(['client', 'vendor', 'end-client'])
            .withMessage(responseMessages.companies.slugNameShouldbe),
        check("status")
            .optional()
            .custom(async (value) => {
                if (value != null && value != '' && value != undefined) {
                    if (value !== 'Active' && value !== 'In Active') {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.invalidStatus);
                    }
                }
                return true;
            })
    ];
    /* Writing validation rules to the input request */

    /*Run the validation rules. */
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    /*Run the validation rules. */

    if (errors.isEmpty()) {

        /* Default Variable */
        let condition = {
            entity_type: req.query.entity_type,
            status: (req.body.status) ? req.body.status : null
        };
        /* Condition */

        var exportData = await companiesExportServices.exportCompaniesInfo(condition);
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
        /* Log Response */
        logResponse('info', req, responseData, "Getting companies Details Response");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity,);
    }

});

module.exports = { companiesExport }