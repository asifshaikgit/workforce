/**
 * @constant check Creates a middleware/validation chain for one or more fields that may be located in any of the following:
 */
const { check, validationResult } = require('express-validator');

/**
 * @constant tryCatch Default class for try catch handling 
 */
const { tryCatch } = require('#utils/tryCatch.js');

/**
 * @constant responseMessages responseMessage constant variables
 */
const { responseMessages } = require('../../../../../constants/responseMessage');

/**
 * @constant logRequest Default class for logging the current event 
 */
const { logRequest, logResponse } = require('../../../../../utils/log');

/**
 * @constant InvalidRequestError Default class for handling invalid request
 */
const InvalidRequestError = require("../../../../../error/InvalidRequestError");

/**
 * @constant responseCodes responseCodes constant variables
 */
const { responseCodes } = require('../../../../../constants/responseCodes');

const indexService = require('../../services/index');
const expenseManagementService = require('../../services/expense_management/expenseManagementService');
const { responseHandler } = require('../../../../responseHandler');
const { pagination } = require('../../../../../config/pagination');
const format = require('../../../../../helpers/format');
const moment = require('moment')
const { regexPatterns } = require('../../../../../constants/regexPatterns');
const { query } = require('express');
const { removeEmptyAndUndefinedKeys } = require('../../../../../helpers/globalHelper');



/**
 * Validation Rules Function define the validations that need to apply at the time of adding and expense or at the time of updating an expense
 * - Define the Validation rules as follows:
 *   + 'request_id' (body), must not be empty.
 *   + 'employee_id' (body), must not be empty.
 *   + 'expense_type_id' (body), must not be empty.
 *   + 'raised_date' (body), must not be empty.
 *   + 'expense_transaction_type', must not be empty.
 *   + 'expense_effect_on', must not be empty.
 *   + 'description', optional.
 *   + 'enable_approval', default false.
 *   + 'amount', must not be empty.
 */
async function validationRules(req) {

    let updateValidationRules = [];
    if (req.body.id) {
        updateValidationRules = [
            check('expense_management_id')
                .trim()
                .escape()
                .notEmpty()
                .withMessage(responseMessages.common.updateIdRequired)
                .custom(async (value) => {
                    /** Check whether the id exist is expense_management table */
                    const empExpense = await indexService.find('expense_management', ['id', 'reference_id'], { id: value });
                    if (!empExpense.status) {
                        return Promise.reject(
                            responseMessages.common.updateIdNotExist
                        );
                    }
                    req.body.reference_id = empExpense.data[0].reference_id;
                }),
            check('documents.*.id').trim().escape().optional({ nullable: true }).isInt().withMessage(responseMessages.expensesManagement.documentIdInvalid)
                .custom(async (value) => {
                    return await indexService.find('expense_documents', ['id'], { 'id': value }).then(document => {
                        if (!document.status) {
                            return Promise.reject(responseMessages.expensesManagement.documentDoesNotExists)
                        }
                        return true
                    })
                })
        ];
    }

    const validationRules = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('employee_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
            .isUUID()
            .withMessage(responseMessages.employee.employeeIdInvalid)
            .custom(async (value) => {

                /** Check if employee exist or not */
                const employee = await indexService.find('employee', ['id', 'display_name', 'reference_id', 'employment_type_id'], { id: value });
                if (!employee?.status) {
                    return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists);
                } else {
                    req.body.employee_display_name = employee?.data[0]?.display_name;
                    req.body.employee_reference_id = employee?.data[0]?.reference_id;
                    req.body.employment_type_id = employee?.data[0]?.employment_type_id;
                    return true;
                }
            }),
        check('expense_type_id')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.expensesManagement.expenseIdRequired)
            .isInt()
            .withMessage(responseMessages.expensesManagement.expenseIdInvalid)
            .custom(async (value) => {
                const expenseData = await indexService.find('expense_and_service_types', ['id', 'name'], { id: value, is_active: true, referrable_type : 2 })
                var status = expenseData.status
                if (!status) {
                    return Promise.reject(
                        responseMessages.expensesManagement.expenseIdNotExists
                    )
                } else {
                    req.body.expense_type_name = expenseData?.data[0]?.name;
                    req.body.expense_reference_id = expenseData?.data[0]?.id;
                    return true;
                }
            }),
        check('raised_date')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.expensesManagement.raisedDateRequired)
            .isDate()
            .withMessage(responseMessages.expensesManagement.raisedDateInvalid),
        check('expense_transaction_type')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.expensesManagement.expenseTransactionTypeRequired)
            .isIn([1, 2]) // 1 Reimbusment, 2 Deduction
            .withMessage(responseMessages.expensesManagement.expenseTransactionTypeInvalid),
        check('expense_effect_on')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.expensesManagement.effectedOnRequired)
            .isIn([1, 2]) // 1 Payroll, 2 Balance Sheet
            .withMessage(responseMessages.expensesManagement.effectedOnInvalid),
        check('amount')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.expensesManagement.amountRequired)
            .isFloat()
            .withMessage(responseMessages.expensesManagement.amountInvalid),
        check('enable_approval')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.expensesManagement.enableApprovalRequired)
            .isBoolean()
            .withMessage(responseMessages.expensesManagement.enableApprovalInvalid),
        check('is_recurring')
            .trim()
            .custom((value) => {
                if (req.body.expense_transaction_type == 1 && req.body.expense_effect_on == 1) {
                    if (value != undefined || value != '' || value != null) {
                        if (value == '1' || value == '0' || value == 'true' || value == 'false') {
                            return true
                        } else {
                            return Promise.reject(responseMessages.expensesManagement.recurringInvalid)
                        }
                    } else {
                        return Promise.reject(responseMessages.expensesManagement.recurringRequired)
                    }
                }
                return true
            }),
        check('recurring_count')
            .custom((value) => {
                if (req.body.is_recurring == 'true' || req.body.is_recurring == 1) {
                    if (value == undefined || value == '' || value == null) {
                        return Promise.reject(responseMessages.expensesManagement.recurringCountRequired)
                    }
                }
                return true
            }),
        check('has_goal_amount')
            .trim()
            .custom((value) => {
                if (req.body.expense_effect_on == 1 && req.body.expense_transaction_type == 2) {
                    if (value == undefined || value == '' || value == null) {
                        return Promise.reject(responseMessages.expensesManagement.hasGoalAmountRequired)
                    }
                }
                return true
            }),
        check('goal_amount')
            .custom((value) => {
                if (req.body.has_goal_amount == '1' && (value == '' || value == undefined || value == null)) {
                    return Promise.reject(responseMessages.expensesManagement.goalAmountRequired)
                } else if (req.body.has_goal_amount == '1' && Number(value) < Number(req.body.amount)) {
                    return Promise.reject(responseMessages.expensesManagement.goalAmountInvalid)
                }
                return true
            }),
        check('documents.*.new_document_id').trim().escape()
            .custom(async (value) => {
                if (value != null && value != '') {
                    var pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        var documentsData = await indexService.find('temp_upload_documents', ['id'], { id: value }, 1, [], null, null, null, false);
                        if (documentsData.length === 0) {
                            return Promise.reject(
                                responseMessages.employee.documents.newDocumentIdNotExists
                            )
                        }
                    } else {
                        return Promise.reject(
                            responseMessages.employee.documents.newDocumentIdInvalid
                        )
                    }
                }
                return true
            }),
    ];

    return [...updateValidationRules, ...validationRules];
};

/**
 * Add Expense Funtion is to add expense for an employee 
 * 
 * Overview of FUnction:
 * - Validate the request
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `store` service function to create a new employee.
 *    + If Success:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with error message.
 * - If validation fails:
 *    + Add error validation to the response.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 *
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const store = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "New expense management creation  request");
    /* Log Request */

    var dateFormat = await format.getDateFormat(); // date format
    req.body.raised_date = moment(req.body.raised_date, dateFormat).format('YYYY-MM-DD');


    /* Default Variable */
    var responseData;
    /* Default Variable */

    var validations = await validationRules(req);

    /*Run the validation rules. */
    for (let validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    /*Run the validation rules. */

    if (errors.isEmpty()) {

        // Remove Recurring Count if expense_effect_on is balancesheet
        if (req.body?.expense_effect_on == 2) {
            delete req.body.is_recurring;
            delete req.body.recurring_count;
        }

        var expense_data = await expenseManagementService.store(req.body);
        if (expense_data?.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.addedSuccessfully,
                data: expense_data.data
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeInternalError,
                message: responseMessages.common.somethindWentWrong,
                error: expense_data.error
            }
        }

        /* Log Response */
        logResponse('info', req, responseData, "New expense management registration response");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
});

/**
 * updateExpense Expense Funtion is to updateExpense expense for an employee 
 * 
 * Overview of FUnction:
 * - Validate the request
 * - Add extra Validation whether expense record id is valid or whether it exist or not 
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `store` service function to create a new employee.
 *    + If Success:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with error message.
 * - If validation fails:
 *    + Add error validation to the response.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 *
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "Update expense management request");
    /* Log Request */

    var dateFormat = await format.getDateFormat(); // date format
    req.body.raised_date = moment(req.body.raised_date, dateFormat).format('YYYY-MM-DD');

    /* Default Variable */
    var responseData;
    /* Default Variable */

    req.body.expense_management_id = req?.params?.id;
    var validations = await validationRules(req);

    /*Run the validation rules. */
    for (let validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    /*Run the validation rules. */

    if (errors.isEmpty()) {

        // Remove Recurring Count if expense_effect_on is balancesheet
        if (req.body?.expense_effect_on == 2) {
            delete req.body.is_recurring;
            delete req.body.recurring_count;
        }

        var expense_data = await expenseManagementService.update(req.body);
        if (expense_data?.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.updatedSuccessfully
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeInternalError,
                message: responseMessages.common.somethindWentWrong,
                error: expense_data.error
            }
        }

        /* Log Response */
        logResponse('info', req, responseData, "Update expense management response");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
});

/**
 * Destroy function to delete an existing Employee Expense record.
 * 
 * Overview of function
 * - Validate the request
 *   + If successful
 *     ~ Call the `destroy` service function to delete an expense added for an exployee
 *     ~ Prepare the response with success data
 *   + Else
 *     ~ Add error validation to the response
 * - Return the response
 * 
 * Login
 * - Log the incoming request
 * - Set default variables for `responseData`
 * - Define the validation rules as follows:
 *   + 'request_id' (body), must not be empty.
 *   + 'id' (params), must not be empty, should be ab uuid, and should exit in the 'expense_mangement' table
 * 
 * Run the validation rules.
 * If Validation is successful:
 *   + Call the 'destroy' service function to delete an employee expense
 *   + If successfull:
 *     - Prepare the reponse with success data.
 *   + Else:
 *     - Prepare the response with an error message.
 * If Validation fails:
 *   + Add error validation to the response. 
 * Log the response.
 * Return the response using `responseHandler()`.
 *
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const destroy = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, 'Delete expense Details request')
    /* Log Request */

    /* Default Variable */
    var responseData;
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.configurations.expenseManagement.IdRequired)
            .isUUID()
            .withMessage(responseMessages.configurations.expenseManagement.idInvalid)
            .custom(async (value) => {
                const expense = await indexService.find('expense_management', ['id', 'employee_id'], { id: value });
                if (!expense.status) {
                    return Promise.reject(responseMessages.configurations.expenseManagement.IdNotExists);
                } else {

                    // get employee details
                    const employee = await indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: expense.data[0]?.employee_id });
                    req.body.employee_display_name = employee?.data[0]?.display_name;
                    req.body.employee_reference_id = employee?.data[0]?.reference_id;

                    // get expense type details
                    const expenseType = await indexService.find('expense_and_service_types', ['id', 'name'], { id: expense.data[0]?.expense_type_id , referrable_type : 2});
                    req.body.expense_type_name = expenseType?.data[0]?.name;
                    req.body.expense_reference_id = expenseType?.data[0]?.id;
                    return true;
                }
            })
    ];
    /* Writing validation conditions to the input request */


    /*Run the validation rules. */
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    /*Run the validation rules. */

    /**
     * If validation is success
     *    + call the index service function
     *        - Based on the status in index function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
    */
    if (errors.isEmpty()) {
        const condition = { id: req.params.id };
        var expenseData = await expenseManagementService.destroy(req.body, condition);
        if (expenseData.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.deletedSuccessfully
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeInternalError,
                message: responseMessages.common.somethindWentWrong,
                error: expenseData.error
            }
        }

        /* Log Response */
        logResponse('info', req, responseData, 'expense Detail delete Response')
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData)
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity,);
    }
});

/**
 * Expense Listing requrest to fetch expense management data
 * Overview of API:
 * - Validate the request.
 *   + If success
 *     ~ Call the service function.
 *     ~ Fetch the data from 'expense_management' table and return the data
 *     ~ Add Success to the response
 *   + Else
 *     ~ add error validation to the response
 * - Return the response
 * 
 * Login : 
 * - Logging incoming request
 * - Define the validation rules as follows
 *   + request_id(query) is mandatory.
 *   + limit(query) is not mandatory, it should be a integer.
 *   + page(query) is not mandatory, it should be integer.
 * - Loop the req.query and using switch case and assign to the condition
 * 
 * - Run the validation rules
 *   + If validation success
 *     ~ Call the serivce function(listing) to fetch the data and send the condition(defined above), limit, page.
 *     ~ Add the service function(listing) return data to response.
 *   + Else
 *     ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Logging the response
 *  - Return response using responseHandler()  
 *        
 * Notes :
 *    - Handling expection using try catch
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns None
 * @throws {InvalidRequestError} - If the request ID is missing.
 */
const listing = tryCatch(async (req, res) => {

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
                    if (!['Submitted', 'Processed' , 'Approved', 'Approval In Progress', 'Reimbursement In Progress', 'Deduction In Progress' , 'Rejected'].includes(status)) {
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
        const limit = (body.limit) ? (body.limit) : pagination.limit;
        const page = (body.page) ? (body.page) : pagination.page;
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
        var listingData = await expenseManagementService.listing(condition, page, limit, dateFormat);

        if (!listingData?.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: listingData.message,
                error: listingData.error,
                message: responseMessages.common.noRecordFound,
                data: [],
                newly_raised_data: listingData.newly_raised_data,
                pagination: listingData.pagination
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: listingData.data,
                pagination: listingData.pagination_data,
                newly_raised_data: listingData.newly_raised_data
            };
        }


        /* Log Response */
        logResponse('info', req, responseData, "Getting expense mangement listing Response");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors, responseCodes.codeUnprocessableEntity);
    }

});

/**
 * Function to approve an expense and update related details.
 *
 * Logic:
 * - Log the incoming request.
 * - Retrieve the date format and update the approved date in the request.
 * - Initialize a variable 'responseData'.
 * 
 * - Define validation rules for the input request, including checks for request_id, expense id, and approved_date.
 * - Run the validation rules and collect any validation errors.
 * 
 * - If there are no validation errors (i.e., 'errors' is empty):
 *   - Call the 'approveExpense' service function with the request body.
 *   - Based on the status in the response from 'approveExpense', prepare the response data.
 *     - If successful, set the response data with a success message.
 *     - If there's an error, set the response data with an error message.
 * 
 * - Log the response.
 * - Return the response to the client.
 * 
 * - If there are validation errors:
 *   - Throw an 'InvalidRequestError' with the first validation error message and a status code indicating unprocessable entity.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */

const approveExpense = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, 'updating expense status & details request')
    /* Log Request */

    var dateFormat = await format.getDateFormat(); // date format
    let modified_date = req.body.approved_date != '' ? moment(req.body.approved_date, dateFormat).format('YYYY-MM-DD') : '';
    req.body.approved_date = modified_date // From date format

    /* Default Variable */
    var responseData;
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.configurations.expenseManagement.IdRequired)
            .isUUID()
            .withMessage(responseMessages.configurations.expenseManagement.idInvalid)
            .custom(async (value) => {
                const expense = await indexService.find('expense_management', ['id', 'employee_id'], { id: value });
                if (!expense.status) {
                    return Promise.reject(responseMessages.configurations.expenseManagement.IdNotExists);
                }
            }),
        check('approved_date')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.expensesManagement.approvedDateRequired)
            .isDate()
            .withMessage(responseMessages.expensesManagement.approvedDateInvalid),
    ];
    /* Writing validation conditions to the input request */


    /*Run the validation rules. */
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    /*Run the validation rules. */

    /**
     * If validation is success
     *    + call the approveExpense service function
     *        - Based on the status in approveExpense function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
    */
    if (errors.isEmpty()) {
        var expenseData = await expenseManagementService.approveExpense(req.body);
        if (expenseData.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.updatedSuccessfully
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeInternalError,
                message: responseMessages.common.somethindWentWrong,
                error: expenseData.error
            }
        }

        /* Log Response */
        logResponse('info', req, responseData, 'updating expense status & details response')
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData)
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity,);
    }
});

/**
 * Updates the status of an expense entry based on the provided ID.
 *
 * @param {object} req - The request object containing the update details.
 * @param {object} res - The response object to send the updated status.
 * @returns {object} - Returns the response object with a success message or an error message.
 *
 * Logic:
 * - Logs the incoming request to update the expense status.
 * - Initializes the response data variable.
 * - Sets up validation rules for the request parameters (request ID, expense ID, and status).
 * - Executes validations on the request parameters and handles potential errors.
 * - If no validation errors:
 *    - Constructs a condition object with the provided expense ID.
 *    - Calls the expenseManagementService's 'updateStatus' function to update the status.
 *    - Constructs the response data based on the update status operation's result.
 *    - Logs the response.
 *    - Returns the response with a success message if the update is successful, else returns an error message.
 * - If validation errors exist, throws an InvalidRequestError with the first error message.
 */
const updateStatus = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "Update expense  Status request.");
    /* Log Request */

    /* Default Variable */
    var responseData = '';
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check("request_id").trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check('id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.configurations.expenseManagement.IdRequired)
            .isUUID()
            .withMessage(responseMessages.configurations.expenseManagement.idInvalid)
            .custom(async (value) => {
                const expense = await indexService.find('expense_management', ['id', 'employee_id', 'expense_type_id' ,'enable_approval', 'employee_id' , 'raised_by', 'status'], { id: value });
                if (!expense.status) {
                    return Promise.reject(responseMessages.configurations.expenseManagement.IdNotExists);
                }
                req.body.enable_approval = expense?.data[0]?.enable_approval; // 1
                req.body.raised_by = expense?.data[0]?.raised_by; // 2
                req.body.approve_status = expense?.data[0]?.status; // != 1
                req.body.employee_id = expense?.data[0]?.employee_id
                req.body.expense_type_id = expense?.data[0].expense_type_id
                req.body.approversCount = await expenseManagementService.getApproversCount(req.body.expense_type_id, req.body.employee_id, req.body.loginUserId)

            }),
        check("status")
            .trim().escape()
            .notEmpty()
            .custom(async (value) => {
                if ((req.body.enable_approval == 1 && req.body.raised_by == 2 && req.body.approve_status != 1) || req.body.approversCount[0].has_employee_id || req.body?.employee_id != req.body.loginUserId  ) {
                    if (!value) {
                        return Promise.reject(responseMessages.configurations.expenseManagement.expenseStatusRequired);
                    } else if (!value == 'Approved' || !value == 'Rejected') {
                        return Promise.reject(responseMessages.configurations.expenseManagement.expenseStatusInvalid);
                    }
                } else if ((req.body.raised_by == 1 && req.body?.status)  ) {
                    return Promise.reject(responseMessages.configurations.expenseManagement.dontHavePermission);
                }
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
        const condition = { id: req.params.id }
        var response = await expenseManagementService.updateStatus(req.body, condition);
        if (response.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully }
        } else {
            responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error }
        }


        /* Log Response */
        logResponse("info", req, responseData, "Update expense Status Response.");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Retrieves expense management details based on the provided expense ID.
 *
 * @param {object} req - The request object containing the query parameters.
 * @param {object} res - The response object to send the retrieved data.
 * @returns {object} - Returns the response object with data or an error message.
 *
 * Logic:
 * - Logs the incoming request to retrieve expense management details.
 * - Retrieves the date format needed for processing.
 * - Initializes the response data variable.
 * - Sets up validation rules for the request parameters.
 * - Executes validations on the request parameters and handles potential errors.
 * - If no validation errors:
 *    - Constructs a condition object with the provided expense ID.
 *    - Calls the expenseManagementService's 'index' function to retrieve expense details.
 *    - Constructs the response data with retrieved expense details.
 *    - Logs the response.
 *    - Returns the response with the expense details.
 * - If validation errors exist, throws an InvalidRequestError with the first error message.
 */
const index = tryCatch(async (req, res) => {

    /* Log Request */
    logRequest('info', req, "getting expense management index request");
    /* Log Request */

    let dateFormat = await format.getDateFormat(); // date format


    /* Default Variable */
    var responseData = '';
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check("request_id").trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    ]
    /* Writing validation rules to the input request */

    /*Run the validation rules. */
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    /*Run the validation rules. */

    if (errors.isEmpty()) {

        let query = removeEmptyAndUndefinedKeys(req.query);

        // Default Variable
        let limit = (query.limit) ? (query.limit) : pagination.limit;
        let page = (query.page) ? (query.page) : pagination.page;
        var condition = {};

        var logedInUserId = req.body.loginUserId

        const employeee = await indexService.find('employee', ['display_name', 'employment_type_id'], { id: logedInUserId });


        condition.id = (query.id?.length > 0) ? query.id : null;
        condition.employment_type = employeee.data[0].employment_type_id;
        condition.employee_id = (query.employee_id?.length > 0) ? query?.employee_id : null;
        condition.transaction_type_id = (query.transaction_type_id?.length > 0) ? query?.transaction_type_id : null;
        condition.search = (query?.search) ? query?.search : '';
        condition.loginId = req.body.loginUserId;

        var expenseData = await expenseManagementService.index(condition, limit, page, dateFormat);
        if (expenseData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: expenseData.data, pagination: expenseData.pagination_data }
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.noRecordFound, data: [] }
        }

        /* Log Response */
        logResponse("info", req, responseData, "expense management index Response");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity,);
    }
});

module.exports = { index, store, update, updateStatus, destroy, listing, approveExpense };