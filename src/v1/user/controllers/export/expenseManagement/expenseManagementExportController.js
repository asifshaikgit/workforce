
const expenseManagementExportServices = require('../../../services/export/expenseManagement/expenseManagementExportServices')
const { responseMessages } = require('../../../../../../constants/responseMessage')
const { responseCodes } = require('../../../../../../constants/responseCodes')
const { logRequest, logResponse } = require('../../../../../../utils/log')
const { responseHandler } = require('../../../../../responseHandler')
const { tryCatch } = require('../../../../../../utils/tryCatch')
const InvalidRequestError = require('../../../../../../error/InvalidRequestError')
const { regexPatterns } = require('../../../../../../constants/regexPatterns');
const format = require('../../../../../../helpers/format');
const { removeEmptyAndUndefinedKeys } = require('../../../../../../helpers/globalHelper');
const { check, validationResult } = require('express-validator');
const indexService = require('../../../services/index');

/**
 * Handles the export of expense management data based on the provided request parameters.
 * - Retrieves the date format from the format module.
 * - Logs the incoming request.
 * - Validates the request parameters:
 *    - Checks for the presence of request_id.
 *    - Validates expense_type, status, and expense_transaction_type if provided.
 * - Constructs the condition object based on the request parameters.
 * - Retrieves the logged-in user's employment type.
 * - Executes the exportExpenseManagement service function with the constructed condition, page, limit, and dateFormat.
 * - If expense management data is exported successfully:
 *    - Constructs a success response with the file path.
 * - If no expense management data is exported:
 *    - Constructs an error response indicating no records found.
 * - Logs the response.
 * - Sends the response back to the client.
 *
 * @param {Object} req - Express request object containing export-related details.
 * @param {Object} res - Express response object to send the response back.
 */
const expenseManagementExport = tryCatch(async (req, res) => {

    let dateFormat = await format.getDateFormat(); // date format

    /* Log Request */
    logRequest('info', req, "Getting expense listing request");
    /* Log Request */

    /* Default Variable */
    var responseData;
    /* Default Variable */

    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check("expense_type")
            .optional()
            .custom(async (value) => {
                if (!Array.isArray(value)) {
                    return Promise.reject(responseMessages.expensesManagement.expenseTypeNotArray);
                }
                for (const expenseType of value) {
                    if (!Number.isInteger(expenseType)) {
                        return Promise.reject(responseMessages.expensesManagement.expenseTypeInvalidType);
                    }
                }
                return true;
            }),
        check("status")
            .optional()
            .custom(async (value) => {
                if (!Array.isArray(value)) {
                    return Promise.reject(responseMessages.expensesManagement.statusNotArray);
                }
                for (const status of value) {
                    if (!['Submitted', 'Approved', 'Approval In Progress', 'Rejected'].includes(status)) {
                        return Promise.reject(responseMessages.expensesManagement.statusInvalidValue);
                    }
                }
                return true;
            }),
        check("expense_transaction_type")
            .optional()
            .custom(async (value) => {
                if (!Array.isArray(value)) {
                    return Promise.reject(responseMessages.expensesManagement.invalidTransactionType);
                }
                for (const transaction_type of value) {
                    if (![1,2].includes(transaction_type)) {
                        return Promise.reject(responseMessages.expensesManagement.invalidTransactionValue);
                    }
                }
                return true;
            }),

        // check("expense_transaction_type")
        //     .optional()
        //     .custom(async (value) => {
        //         if (value !== undefined && value !== '' && !Number.isInteger(parseInt(value))) {
        //             return Promise.reject(responseMessages.expensesManagement.invalidTransactionType);
        //         }
        //         if (value !== undefined && value !== '' && ![1, 2].includes(parseInt(value))) {
        //             return Promise.reject(responseMessages.expensesManagement.invalidTransactionValue);
        //         }
        //         return true;
        //     }),

    ]

    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    if (errors.isEmpty()) {

        let body = removeEmptyAndUndefinedKeys(req.body);

        /* Default Variables */
        const limit = (body.limit) ? (body.limit) : null;
        const page = (body.page) ? (body.page) : 1;
        var condition = {
            from_date: null,
            to_date: null
        };

        var logedInUserId = req.body.loginUserId

        const employeee = await indexService.find('employee', ['display_name', 'employment_type_id'], { id: logedInUserId });

        condition.expense_type = (body.expense_type?.length > 0) ? body.expense_type.toString() : null;
        condition.status = (body.status?.length > 0) ? (body.status).toString() : null;
        condition.employee_id = (body.employee_id?.length > 0) ? body?.employee_id : null;
        condition.employment_type = employeee.data[0].employment_type_id;
        condition.search = (body.search) ? body.search : null;
        // condition.expense_transaction_type = (body.transaction_type) ? body.transaction_type : null;
        condition.expense_transaction_type = (body.expense_transaction_type?.length > 0) ? (body.expense_transaction_type).toString() : null;
        condition.balance_sheet = (body.balance_sheet) ? body.balance_sheet : null;
        if (body.from_date && body.to_date) {
            condition.from_date = moment(body.from_date, dateFormat).format('YYYY-MM-DD');
            condition.to_date = moment(body.to_date, dateFormat).format('YYYY-MM-DD');
        }

        /* Default Variable */

        /* Writing validation rules to the input request */
        var expenseData = await expenseManagementExportServices.exportExpenseManagement(condition, page, limit, dateFormat);
        if (!expenseData.status) {
            responseData = { statusCode: responseCodes.codeInternalError, error: expenseData.error, message: responseMessages.common.noRecordFound }
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, path: expenseData.filepath };
        }

        /* Log Response */
        logResponse('info', req, responseData, "Getting expense management Details Response");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(responseMessages.common.requestIdRequired);
    }
}
);

module.exports = {expenseManagementExport};