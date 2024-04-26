const { logRequest, logResponse } = require("../../../../../../utils/log");
const { check, validationResult } = require('express-validator');
const { tryCatch } = require("../../../../../../utils/tryCatch");
const payrollExportServices = require("../../../services/export/payroll/payrollExportServices");
const payRollService = require('../../../services/payroll/payRollService')

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
 * Payroll Export request to export the payroll data.
 * Overview of API:
 * - Validate the request.
 *   + If success
 *     ~ Call the service function.
 *     ~ Fetch the data from 'payroll' table ad return the data.
 *     ~ Add success to the response
 *   + Else
 *     ~ add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Logging incoming request
 * - Define the validation rules as follows.
 *   + request(query) is mandatory.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *    + Set additional variables for status based on query parameters.
 *    + Create a condition object for filtering based on provided criteria.
 *    + Retrieve a list of balancesheet details based on the condition.
 *    + If successful:
 *      - Prepare the response with the retrieved data.
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
const payrollExport = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "Getting Payroll Export Request.");
    /* Log Request */

    /* Default Variable */
    var responseData = '';
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check("request_id")
            .trim().escape()
            .notEmpty().withMessage(responseMessages.common.requestIdRequired),
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

        const body = req.body;
        let search = (body.search) ? (body.search) : '';
        let visa_type_id = (body.visa_type_id) ? body.visa_type_id.replace(/\[/g, '(').replace(/\]/g, ')') : [];
        let pay_roll_configuration_id = (body.payroll_configuration_id) ? body.payroll_configuration_id : null;
        let condition = { 'pc.id': pay_roll_configuration_id };

        if (search != '') {
            condition.global_search = `"emp"."display_name" ilike '%${search}%'`;
        }
        if (visa_type_id != '' && visa_type_id != []) {
            condition.global_search = `"emp"."visa_type_id" in ${visa_type_id}`;
        }

        var payRollSummary = await payRollService.paymentsListing(condition, 1, null);
        var exportData = await payrollExportServices.exportPayrollInfo(payRollSummary);
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
        logResponse('info', req, responseData, "Getting Payroll export Details Response");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity,);
    }
});

module.exports = { payrollExport }