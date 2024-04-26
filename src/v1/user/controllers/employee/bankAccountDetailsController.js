/**
 * @constant check Creates a middleware/validation chain for one or more fields that may be located in any of the following:
 */
const { check, validationResult } = require('express-validator');

/**
 * @constant tryCatch Default class for try catch handling 
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
const InvalidRequestError = require("../../../../../error/InvalidRequestError");

const indexService = require('../../services/index');
const employeeBankDetailsService = require('../../services/employee/bankAccountDetailsService');
const { responseHandler } = require('../../../../responseHandler');
const { regexPatterns } = require('../../../../../constants/regexPatterns');

/** 
 * Validation Rules For Store and Update 
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, should exist in the 'employee' table (if not empty).
 *    + 'bank_name' (body), must not be empty.
 *    + 'account_type' (body), must not be empty.
 *    + 'account_number' (body), must not be empty.
 *  */
async function validationRules(req) {

    let updateValidationRules = [];

    if (req.body.id) {
        updateValidationRules = [
            check('bank_information.*.bank_account_details_id')
                .trim()
                .escape()
                .notEmpty()
                .withMessage(responseMessages.common.bankAccountDetailsIdRequired)
                .custom(async (value) => {
                    if (value) {
                        var empBankDetails = await indexService.find('employee_bank_account_details', ['id', 'employee_id'], { id: value });

                        if (!empBankDetails.status) {
                            return Promise.reject(
                                responseMessages.employee.bankDetails.IdNotExists
                            )
                        } else if (req.body.employee_id !== empBankDetails.data[0].employee_id) {
                            return Promise.reject(
                                responseMessages.employee.bankDetails.noMatchingEmployee
                            )
                        }
                    }
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
                const employee = await indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: value });
                if (!employee?.status) {
                    return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists);
                } else {
                    req.body.employee_name = employee.data[0]?.display_name;
                    req.body.employee_reference_id = employee.data[0]?.reference_id;
                    return true;
                }
            }),
        check('bank_information')
            .isArray()
            .custom((array) => {
                // Custom validation function for the 'bank_information' array
                if (!Array.isArray(array)) {
                    return Promise.reject(
                        responseMessages.employee.bankDetails.inValidBankDetails
                    )
                }

                // no other 'account_number' should be same in the 'bank_information' array objects
                const key = 'account_number';
                const valueSet = new Set();
                /*for (const obj of array) {
                    const value = obj[key];
                    if (valueSet.has(value)) {
                        return Promise.reject(
                            responseMessages.employee.bankDetails.noTwoAccountNumberShouldbeSame
                        )
                    }
                    valueSet.add(value);
                }*/
                // no other 'account_number' should be same in the 'bank_information' array objects

                // 'account_number' & 'confirm_account_number' should be same
                for (let bank of array) {
                    if (bank.account_number === bank.confirm_account_number) {
                        return true; // Same keys found
                    } else {
                        return Promise.reject(
                            responseMessages.employee.bankDetails.invalidConfirmationAccountNumber
                        )
                    }
                }
            }),
        check('bank_information.*.bank_name')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.employee.bankDetails.bankNameRequired)
            .not().matches(regexPatterns.specialCharactersRegex).withMessage(responseMessages.employee.bankDetails.invalidBankName)
            .isLength({ min: 2, max: 100 })
            .withMessage(responseMessages.employee.bankDetails.bankLengthInvalid),
        check('bank_information.*.account_type')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.employee.bankDetails.accountTypeRequired),
        check('bank_information.*.account_number')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.employee.bankDetails.accontNumberRequired)
            .matches(regexPatterns.numericOnlyRegex)
            .withMessage(responseMessages.employee.bankDetails.invalidAccountNumber)
            .isLength({ min: 8, max: 12 })
            .withMessage(responseMessages.employee.bankDetails.lengthInvalid)
            .custom(async (value) => {

                let filterConditions = { account_number: value };
                // Check if any one has the same account already in existance
                /*var empBankDetails = await indexService.find('employee_bank_account_details', ['id', 'employee_id'], { account_number: value, id: req.body.bank_account_details_id })
                if (empBankDetails.status) {
                    if (empBankDetails.data[0].employee_id !== req.body.employee_id) {
                        return Promise.reject(
                            responseMessages.employee.bankDetails.bankAccountNumberExists
                        )
                    }
                }*/
                return true
            }),
        check('bank_information.*.confirm_account_number')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.employee.bankDetails.accontNumberRequired),
        check('bank_information.*.routing_number')
            .notEmpty()
            .trim()
            .escape()
            .withMessage(responseMessages.employee.bankDetails.routeNumberRequired)
            .matches(regexPatterns.alphanumericSpaceRegex)
            .withMessage(responseMessages.employee.bankDetails.invalidRouteNumber)
            .isLength({ min: 9, max: 9 })
            .withMessage(responseMessages.employee.bankDetails.routeLengthInvalid),
        check('bank_information.*.confirm_routing_number')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.employee.bankDetails.confirmRouteNumberRequired),
        check('bank_information.*.deposit_type')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.employee.bankDetails.depositTypeRequired)
            .isInt({ min: 1, max: 4 })  // 1 Full, 2 Partial, 3 Partial Percentage, 4 - Remainder Amount.
            .withMessage(responseMessages.employee.bankDetails.depositTypeInvalid),
        check('bank_information.*.deposit_value')
            .trim()
            .escape(),
        check('bank_information.*.void_cheque_documents')
            .optional()
            .isArray()
            .withMessage(responseMessages.employee.bankDetails.documentsNotArray)
            .custom(async (docs) => {
                if (!req.body.hasOwnProperty('employee_id')) {
                    if (value == null && value == '') {
                        return Promise.reject(responseMessages.employee.bankDetails.voidChequeDocumentRequired)
                    }
                }
            }),
        check('bank_information.*.void_cheque_documents.*')
            .trim()
            .escape()
            .custom(async (doc) => {
                const value = doc.new_document_id;
                if (!req.body.hasOwnProperty('employee_id')) {
                    if (value == null && value == '') {
                        return Promise.reject(responseMessages.employee.bankDetails.voidChequeDocumentRequired)
                    }
                } else {
                    if (value != '' && value != undefined) {
                        if (!regexPatterns.uuidRegex.test(value)) {
                            return Promise.reject(responseMessages.employee.bankDetails.voidChequeDocumentIdInvalid)
                        }
                    }
                }
                var tableName = 'temp_upload_documents';
                if (doc.slug == 'invite_via_link') {
                    tableName = 'invited_employee_documents';
                }
                var documentsData = await indexService.find(tableName, ['id'], { id: value }, null, [], null, null, null, false)
                if (documentsData.length === 0) {
                    return Promise.reject(responseMessages.employee.bankDetails.voidChequeDocumentNotExists)
                }
                return true;
            }),
        check('bank_information.*.deposit_form_documents.*')
            .trim()
            .escape()
            .custom(async (doc) => {
                const value = doc.new_document_id;
                if (!req.body.hasOwnProperty('employee_id')) {
                    if (value == null && value == '') {
                        return Promise.reject(responseMessages.employee.bankDetails.depositFormDocumentRequired)
                    }
                } else {
                    if (value != '' && value != undefined) {
                        if (!regexPatterns.uuidRegex.test(value)) {
                            return Promise.reject(responseMessages.employee.bankDetails.depositFormDocumentIdInvalid)
                        }
                    }
                }
                var tableName = 'temp_upload_documents';
                if (doc.slug == 'invite_via_link') {
                    tableName = 'invited_employee_documents';
                }
                var documentsData = await indexService.find(tableName, ['id'], { id: value }, null, [], null, null, null, false)
                if (documentsData.length === 0) {
                    return Promise.reject(responseMessages.employee.bankDetails.depositFormDocumentNotExists)
                }
                return true
            }),
        check('delete_bank_accounts.*')
            .trim()
            .custom(async (value) => {
                if (value) {
                    var empBankDetails = await indexService.find('employee_bank_account_details', ['id', 'employee_id'], { id: value })
                    var bankData = empBankDetails.status;
                    if (bankData) {
                        if (empBankDetails.data[0]?.employee_id !== req.body.employee_id) {
                            return Promise.reject(
                                responseMessages.employee.bankDetails.IdNotExists
                            )
                        }
                    }
                }
            })
    ];

    return [...updateValidationRules, ...validationRules];
}

/**
 * store Funtion is to add bank details for an employee 
 * 
 * Overview of FUnction:
 * - Validate the request
 * - Call the 'validationRules' function to the validation messages.
 * - Run the validation rules.
 * - If default validation is successful:
 * - Extra Validations for 'bank-information' & 'deposit-configuration'.
 *    + Alteast one bank account must be required.
 *    + Not allowed to add more than one bank account for full net payment distribution
 *    + Not allowed to have any other distribution except 'remainder' distribution if first bank is 'partial' distribution
 * - If 'bank-information' & 'deposit-configuration' validation is successful.
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
    logRequest('info', req, "Store employee bank details information");
    /* Log Request */

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
        const bankDetails = req.body.bank_information;

        // Check If employee already have 5 banks
        const bankCount = await indexService.count('employee_bank_account_details', { employee_id: req.body.employee_id });

        if (bankDetails.length > 5 || ((bankDetails.length + Number(bankCount.data) - req.body?.delete_bank_accounts.length) > 5)) {
            throw new InvalidRequestError(responseMessages.employee.bankDetails.maxBankDetails, responseCodes.partialpaymentError);
        }

        // Alteast one bank account must be required
        if (bankDetails.length == 0) {
            throw new InvalidRequestError(responseMessages.employee.bankDetails.bankDetailsError, responseCodes.partialpaymentError);
        }
        if (bankDetails.length == 1) {
            if (bankDetails[0].deposit_type !== 2) {
                req.body.bank_information[0].deposit_type = 1;
                req.body.bank_information[0].deposit_value = '';
            }
        }
        // Alteast one bank account must be required

        // Not allowed to add more than one bank account for full net payment distribution.
        let depositDistributionType = bankDetails[0].deposit_type;
        if (depositDistributionType == 1) { // Full net payment
            if (bankDetails.length > 1) {
                throw new InvalidRequestError(responseMessages.employee.bankDetails.fullpaymentError, responseCodes.codeUnprocessableEntity);
            }
        }
        // Not allowed to add more than one bank account for full net payment distribution.

        // Not allowed to have any other distribution except 'remainder' distribution if first bank is 'partial' distribution 
        else if (depositDistributionType == 2) { // Partial Payment
            let remainderExists = 0;
            for (let keys in bankDetails) {
                if (bankDetails.length > 1) {
                    let depositDistributionType = bankDetails[keys].deposit_type;
                    if (depositDistributionType == 4) { // Remainder
                        remainderExists = remainderExists + 1;
                    }
                    if (depositDistributionType == 1) {  // Full net payment
                        throw new InvalidRequestError(responseMessages.employee.bankDetails.fullpaymentPartialAllowedError, responseCodes.codeUnprocessableEntity);
                    }
                    if (depositDistributionType == 3) {  // partial percentage
                        throw new InvalidRequestError(responseMessages.employee.bankDetails.partialPercentagePartialPaymentError, responseCodes.codeUnprocessableEntity);
                    }
                    bankDetails[bankDetails.length - 1].deposit_value = '';
                    bankDetails[bankDetails.length - 1].deposit_type = 4;
                } else {
                    throw new InvalidRequestError(responseMessages.employee.bankDetails.partialHasNoRemainderError, responseCodes.codeUnprocessableEntity);
                }
            }
            //if (remainderExists != 1) {
            //    throw new InvalidRequestError(responseMessages.employee.bankDetails.partialpaymentError, responseCodes.codeUnprocessableEntity);
            //}
        }
        // Not allowed to have any other distribution except 'remainder' distribution if first bank is 'partial' distribution

        // Not allowed to have any other distribution except 'patial-percentage' if first first bank details distribution is 'patial-percentage'.
        else if (depositDistributionType == 3) { // Partial percentage
            let deposit_value = Number(bankDetails[0].deposit_value);
            let depositPercentage = 0;
            for (let keys in bankDetails) {
                let depositDistributionType = bankDetails[keys].deposit_type;
                if (bankDetails.length > 1) {
                    if (depositDistributionType == 3) { // Percentage Deposit
                        depositPercentage = depositPercentage + Number(bankDetails[keys].deposit_value);
                    }
                    if (depositDistributionType == 1) {  // Full net payment
                        throw new InvalidRequestError(responseMessages.employee.bankDetails.fullpaymentPartialAllowedError, responseCodes.codeUnprocessableEntity);
                    }
                    if (depositDistributionType == 2) {  // partial percentage
                        throw new InvalidRequestError(responseMessages.employee.bankDetails.partialPercentagePartialPaymentError, responseCodes.codeUnprocessableEntity);
                    }
                    if (depositDistributionType == 4) {  // partial percentage
                        // throw new InvalidRequestError(responseMessages.employee.bankDetails.remainderPaymentError, responseCodes.codeUnprocessableEntity);
                    }
                } else {
                    if (deposit_value != 100) {
                        // check if any of the bank details had reminder deposit configuration
                        if (!bankDetails.some(item => item.deposit_type == 4)) {

                            throw new InvalidRequestError(responseMessages.employee.bankDetails.partialPercentageNoRemainderError, responseCodes.codeUnprocessableEntity);
                        }
                    }
                }
            }
            //  Not allowed to have any other distribution except 'patial-percentage' if first first bank details distribution is 'patial-percentage'.

            // 'deposit_value' not allowed to have more than 100
            if (depositPercentage > 0 && depositPercentage != 100) {
                if (!bankDetails.some(item => item.deposit_type == 4)) {
                    throw new InvalidRequestError(responseMessages.employee.bankDetails.partialPercentageNoRemainderError, responseCodes.codeUnprocessableEntity);
                } else {
                    let sumDepositType3 = 0;

                    // Calculate the sum of deposit_value for deposit_type 3
                    bankDetails.forEach(item => {
                        if (item.deposit_type == 3 && item.deposit_value) {
                            sumDepositType3 += parseFloat(item.deposit_value);
                        }
                    });

                    // Calculate the remaining value
                    const remainingValue = 100 - sumDepositType3;

                    // Find the object with deposit_type 4
                    const depositType4Object = bankDetails.find(item => item.deposit_type == 4);

                    // Update deposit_value of deposit_type 4 object with remaining value
                    if (depositType4Object) {
                        depositType4Object.deposit_value = remainingValue.toString();
                    }
                }
            } else {
                bankDetails[bankDetails.length - 1].deposit_value = '';
                bankDetails[bankDetails.length - 1].deposit_type = 4;
            }
            // 'deposit_value' not allowed to have more than 100

        } else if (depositDistributionType == 4) { // Partial percentage
            throw new InvalidRequestError(responseMessages.employee.bankDetails.remainderPaymentError, responseCodes.codeUnprocessableEntity);
        }

        var employeeBankDetails = await employeeBankDetailsService.store(req.body);
        if (employeeBankDetails.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.addedSuccessfully
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeInternalError,
                message: responseMessages.common.somethindWentWrong,
                error: employeeBankDetails.error
            }
        }

        /* Log Response */
        logResponse('info', req, responseData, "Add Employee Bank Details");
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
 * store Funtion is to add bank details for an employee 
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
const update = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "Store employee bank details information");
    /* Log Request */

    /* Default Variable */
    var responseData;
    /* Default Variable */

    req.body.employee_id = req?.params?.id;
    var validations = await validationRules(req);

    /*Run the validation rules. */
    for (let validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    /*Run the validation rules. */

    if (errors.isEmpty()) {
        var employeeBankDetails = await employeeBankDetailsService.store(req.body);
        if (employeeBankDetails.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.addedSuccessfully
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeInternalError,
                message: responseMessages.common.somethindWentWrong,
                error: employeeBankDetails.error
            }
        }

        /* Log Response */
        logResponse('info', req, responseData, "Add Employee Bank Details");
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
 * Validate the destroy registration request.
 * If request validation success call destoryBankDetails services function.
 *
 * @param {object} req
 * @param {object} res
 * @return Json
 * @throws InvalidRequestError
 */
const destroy = tryCatch(
    async (req, res) => {

        /* Log Request */
        logRequest('info', req, 'bank details delete request')
        /* Log Request */

        /* Default Variable */
        var responseData;
        /* Default Variable */

        /* Writing validation rules to the input request */
        var validations = [
            check('request_id')
                .trim()
                .escape()
                .notEmpty()
                .withMessage(responseMessages.common.requestIdRequired),
            check('employee_id')
                .trim()
                .escape()
                .notEmpty()
                .withMessage(responseMessages.employee.behalfOnboarding.employeeIdRequired)
                .isUUID()
                .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
                .custom(async (value) => {
                    const employeeData = await indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: value })
                    let status = employeeData.status;
                    if (!status) {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists);
                    }
                    req.body.employee_name = employeeData.data[0].display_name;
                    req.body.employee_reference_id = employeeData.data[0].reference_id;
                    return true;
                }),
            check('id')
                .trim()
                .escape()
                .notEmpty()
                .withMessage(responseMessages.employee.bankDetails.bankAccountDetailsIdRequired)
                .isInt()
                .withMessage(responseMessages.employee.bankDetails.bankAccountDetailsIdInvalid)
                .custom(async (value) => {
                    // check if bank_account_details_id exist or not
                    var empBankDetails = await indexService.find('employee_bank_account_details', ['id', 'employee_id'], { id: value })
                    if (!empBankDetails.status) {
                        return Promise.reject(
                            responseMessages.employee.bankDetails.IdNotExists
                        )
                    } else {
                        // check if bank_account_details_id belongs to employee or not
                        var empBankDetails = await indexService.find('employee_bank_account_details', ['id', 'employee_id', 'bank_name', 'account_number'], { id: value, employee_id: req.body.employee_id })
                        if (!empBankDetails.status) {
                            return Promise.reject(
                                responseMessages.employee.bankDetails.noMatchingDetailsBank
                            )
                        }
                        return true
                    }
                })
        ]
        /* Writing validation conditions to the input request */
        if (req.params.id) {
            req.body.bank_account_details_id = req.params.id;
        }

        /*Run the validation rules. */
        for (let validation of validations) {
            var result = await validation.run(req)
            if (result.errors.length) break
        }
        var errors = validationResult(req)
        /*Run the validation rules. */

        /**
         * If validation is success
         * + Delete  bank account details in the collection.
         * If Validation Fails
         * + Return the error message.
         */
        if (errors.isEmpty()) {
            await employeeBankDetailsService.destroy(req.body)
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.deletedSuccessfully
            }

            /* Log Response */
            logResponse('info', req, responseData, 'bank details delete Response')
            /* Log Response */

            /* Return the response */
            responseHandler(res, responseData)
            /* Return the response */

        } else {
            throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity)
        }
    });

/**
 * Index function to retrieve an employee's bank details.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the bankDetailsIndex service function to retrieve the employee banks.
 *      ~ Prepare the response with the retrieved data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 *  - Log the incoming request.
 *  - Set default variables for `responseData`.
 * 
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'id' (query) must be a valid UUID and should exist in the 'employee' table.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `index` service function to retrieve the employee's details.
 *    + If Data exists:
 *      - prepare the response with the succeess code and retrieved data.
 *    + Else:
 *      - Prepare the reponse with error message
 * - Log the response.
 * - Return the response using `responseHandler()`.
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
const index = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest("info", req, "Index employee request");
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
        check('employee_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.employeeIdRequired)
            .isUUID()
            .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
            .custom(async (value) => {
                const employee = await indexService.find('employee', ['id'], { id: value })
                if (!employee.status) {
                    return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
                }
            })
    ];
    /* Writing validation rules to the input request */

    /*Run the validation rules. */
    for (let validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    /*Run the validation rules. */

    if (errors.isEmpty()) {
        let condition = { 'employee_id': req.query.employee_id };
        if (req.query.id) {
            condition = { ...condition, ...{ id: req.query.id } };
        }
        const fetchData = await employeeBankDetailsService.index(condition);
        if (!fetchData.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: fetchData.message,
                data: []
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: fetchData.data
            };
        }
        /* Log Response */
        logResponse("info", req, responseData, "Index employee response");
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

module.exports = { store, update, destroy, index };