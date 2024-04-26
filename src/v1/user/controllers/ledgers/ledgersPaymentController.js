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
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
/**
 * @constant regexPatterns regexPatterns constant patterns
 */
const { regexPatterns } = require('../../../../../constants/regexPatterns');
const { removeEmptyAndUndefinedKeys } = require('../../../../../helpers/globalHelper');

const indexServices = require("../../repositories/index");
const ledgersPaymentService = require('../../services/ledgers/ledgersPaymentService');
const format = require('../../../../../helpers/format');
const { responseHandler } = require('../../../../responseHandler');
const { pagination } = require('../../../../../config/pagination')
const moment = require('moment');
const indexService = require('../../services/index');
const PAYMENT = 'payment';
const BILLPAYMENT = 'bill-payment';
const CLIENT = 'client';
const VENDOR = 'vendor';
const ENTITY_TYPES = [PAYMENT, BILLPAYMENT];
const APPROVED = 'Approved';
const PARTIALLY_PAID = 'Partially Paid';
const PAID = 'Paid';

/**
 * Validation Rules for store ad update.
 * - Define the validation rules as follows:
 *   + 'request_id' (body), must not be empty.
 *   + 'entity_type' (body), must not be empty, should be in ['', 'bills'].
 *   + 'company_id' (body), must not be empty, must be valid uuid, should exist in `companies` table.
 *   + 'payment_mode_id' (body), must not be empty, should be valid mode_id should exist in `payment_modes` table.
 *   + 'received_on' (body), must not be empty, must be a date, must be equal or less than current date.
 *   + 'ledgers' (body), must not be empty, must be array, validate ledger ids of ledgers array.
 *   + 'legders.*.ledger_id' (body), must not be empty.
 *   + 'legders.*.amount' (body), must not be empty.
 *   + 'legders.*.received_amount' (body), must not be empty.
 *   + 'documents.*.new_document_id' (body), must not be empty, should be a valid UUID, and should exist in the 'temp_upload_documents' table.
 *   + 'total_ledger_amount' (body), must not be empty, must be equal to `amount` of all ledgers of the company.
 *   + 'total_received_amount' (body), must not be empty.
 *   + 'total_balance_amount' (body), must not be empty, must not be difference between `total_ledger_amount` and `total_received_amount`.
 *   + 'total_excess_amount' (body), can be empty.
 *   + 'payment_reference_number' (body), must not be empty, reference number should be unique in complete `ledgers` table.
 *   + 'notes' (body), can be empty.
 * 
 */
async function validationRules(req) {
    let updateValidationRules = [];

    if (req.body.id) {
        updateValidationRules = [
            check('id')
                .trim()
                .escape().
                notEmpty()
                .withMessage(responseMessages.ledgerPayments.updateIdRequired)
                .isUUID()
                .withMessage(responseMessages.ledgerPayments.updateIdInvalid)
                .custom(async (value) => {
                    const ledgers = await indexServices.find('ledger_payments', ['id', 'reference_id'], { id: value });
                    if (!ledgers.status) {
                        return Promise.reject(responseMessages.ledgers.idNotExists);
                    }
                    req.body.reference_id = ledgers.data[0]?.reference_id;
                    return true
                }),
            check('ledgers.*.id')
                .notEmpty()
                .withMessage(responseMessages.ledgerPayments.ledgerPaymentSectionIdRequired)
                .trim()
                .custom(async (value) => {
                    if (value !== undefined && value !== '') {
                        const ledgerItem = await indexServices.find('ledger_payment_section_details', ['id'], { id: value, ledger_payment_id: req.body.id });
                        if (!ledgerItem.status) {
                            return Promise.reject(responseMessages.ledgers.ledgerPaymentSectionIdInvalid);
                        }
                        return true;
                    }
                    return true;
                }),
            check('documents.*.id')
                .trim()
                .escape()
                .custom(async (value) => {
                    if (check(value).isInt() && value != null && value != '') {
                        return await indexService.find('ledger_payment_documents', ['id'], { id: value }).then((documentsData) => {
                            if (!documentsData.status) {
                                return Promise.reject(
                                    responseMessages.employee.documents.documenIdNoExists
                                )
                            }
                        })
                    } else if (value === null || value == '') {
                        return true
                    } else {
                        return Promise.reject(
                            responseMessages.employee.documents.documentIdInvalid
                        )
                    }
                }),
        ];
    }

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
            .isIn([PAYMENT, BILLPAYMENT])
            .withMessage(responseMessages.ledgers.slugNameShouldbe),
        check('company_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgers.companyIdRequired)
            .isUUID()
            .withMessage(responseMessages.ledgers.companyIdInvalid)
            .custom(async (value) => {

                // Find Company Condition
                let condition = { id: value };
                condition = (req.body.entity_type == PAYMENT) ? { ...condition, ...{ entity_type: CLIENT } } : { ...condition, ...{ entity_type: VENDOR } };

                // Fetch the company data
                const companyData = await indexServices.find('companies', ['available_balance'], condition);
                if (!companyData.status) {
                    return Promise.reject(responseMessages.ledgers.CompanyIdDoesNotExist);
                }
                req.body.company_available_balance = companyData.data[0]?.available_balance;
                return true;
            }),
        check('received_on')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgerPayments.receivedDateRequired)
            .isDate()
            .withMessage(responseMessages.ledgerPayments.receivedDateInvalid),
        check('payment_mode_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgerPayments.paymentModeRequired)
            .isInt()
            .withMessage(responseMessages.ledgerPayments.paymentModeInvalid)
            .custom(async (value) => {
                const paymentModes = await indexServices.find('payment_modes', ['id'], { id: value });
                if (!paymentModes.status) {
                    return Promise.reject(responseMessages.ledgerPayments.ledgerPaymentIdNotExist);
                }
                return true
            }),
        check('debited_credits')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgerPayments.debitClientCreditsRequired)
            .isFloat()
            .withMessage(responseMessages.ledgerPayments.debitClientCreditsInvalid)
            .custom((value) => {
                return indexServices.find('companies', ['available_balance'], { 'id': req.body.company_id }).then((clients) => {
                    var clientData = clients.status
                    if (clientData && clients.data[0].available_balance < value) {
                        return Promise.reject(responseMessages.ledgerPayments.debitClientCreditsInvalid)
                    }
                })
            }),
        check('payment_reference_number')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgerPayments.paymentReferenceIdRequired)
            .isString()
            .withMessage(responseMessages.ledgerPayments.paymentReferenceIdInvalid)
            .custom((value) => {
                return indexServices.find('ledger_payments', ['id', 'payment_reference_number'], { 'payment_reference_number': value })
                    .then((paymentData) => {
                        if (paymentData.status) {
                            if (req.body.id) {
                                if (paymentData?.data[0]?.id != req.body.id) {
                                    return Promise.reject(
                                        responseMessages.ledgerPayments.paymentReferenceIdExists
                                    )
                                }
                            } else {
                                return Promise.reject(responseMessages.ledgerPayments.paymentReferenceIdExists)
                            }
                        }
                    })
            }),
        check('notes')
            .trim()
            .escape(),
        check('documents.*.new_document_id')
            .trim()
            .escape()
            .custom(async (value) => {
                if (value != '' && value != null) {
                    if (regexPatterns.uuidRegex.test(value)) {
                        return await indexServices.find('temp_upload_documents', ['id'], { id: value }, null, [], null, null, null, false).then((documentsData) => {
                            if (!documentsData.status) {
                                return Promise.reject(responseMessages.payments.documentIdInvalid)
                            }
                        })
                    } else {
                        return Promise.reject(responseMessages.payments.documentIdInvalid)
                    }
                }
            }),
        check('ledger_section_details')
            .notEmpty()
            .withMessage(responseMessages.ledgerPayments.ledgersRequired)
            .isArray()
            .custom(async array => {

                // Custom validation function for the 'bank_information' array
                if (!Array.isArray(array)) {
                    return Promise.reject(
                        responseMessages.ledgerPayments.invalidLedgersFormat
                    );
                }

                // Validate the existane of ledger
                await Promise.all(array.map(async ledger => {
                    const condition = { id: ledger.ledger_id, amount: ledger.amount };
                    const ledgerData = await indexServices.find('ledgers', ['id', 'status'], condition);

                    // If no ledger found
                    if (!ledgerData.status) {
                        return Promise.reject(responseMessages.ledgerPayments.LedgerIdDoesNotExist);
                    }

                    // If Invoice payment then check the status
                    if (req.body.entity_type == PAYMENT) {
                        console.log(ledgerData.data[0]?.status, 'ledgerData.data[0]?.status')
                        if (![APPROVED, PARTIALLY_PAID, PAID].includes(ledgerData.data[0]?.status)) {
                            return Promise.reject(responseMessages.ledgerPayments.ledgerIsNotApproved);
                        }
                    };

                    if (req.body.received_amount_previous) {
                        ledger.received_amount_previous = req.body.received_amount_previous;
                    }

                    if (ledger.received_amount_previous > 0) {
                        ledger.received_amount_previous = parseFloat(ledger.received_amount_previous)
                    } else {
                        ledger.received_amount_previous = 0;
                    }

                    if (req.body.record_payment == true) {

                        // validate balance amount of ledgers
                        if (parseFloat(ledger.received_amount) + parseFloat(ledger.balance_amount) + ledger.received_amount_previous != parseFloat(ledger.amount) + parseFloat(req.body.total_excess_amount)) {
                            return Promise.reject(responseMessages.ledgerPayments.invalidLedgerAmount);
                        }
                    } else {
                        // validate balance amount of ledgers
                        if (parseFloat(ledger.received_amount) + parseFloat(ledger.balance_amount) + ledger.received_amount_previous != parseFloat(ledger.amount)) {
                            return Promise.reject(responseMessages.ledgerPayments.invalidLedgerAmount);
                        }
                    }

                }));
                return true;
            }),
        check('ledger_section_details.*.ledger_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgerPayments.LedgerIdRequired)
            .isUUID()
            .withMessage(responseMessages.ledgers.idInvalid)
            .custom(async (value) => {
                const ledgers = await indexServices.find('ledgers', ['id', 'reference_id'], { id: value });
                if (!ledgers.status) {
                    return Promise.reject(responseMessages.ledgers.idNotExists);
                }
                req.body.reference_id = ledgers.data[0]?.reference_id;
                return true
            }),
        check('ledger_section_details.*.amount')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgerPayments.ledgerAmountRequired)
            .isFloat()
            .withMessage(responseMessages.ledgerPayments.ledgerAmountInvalid),
        check('ledger_section_details.*.received_amount')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgerPayments.ledgerReceivedAmountRequired)
            .isFloat()
            .withMessage(responseMessages.ledgerPayments.ledgerReceivedAmountInvalid),
        check('ledger_section_details.*.balance_amount')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgerPayments.ledgerBalanceAmountRequired)
            .isFloat()
            .withMessage(responseMessages.ledgerPayments.ledgerBalanceAmountInvalid),
        check('total_ledger_amount')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgerPayments.totalLedgerAmountRequired)
            .isFloat()
            .withMessage(responseMessages.ledgerPayments.totalLedgerAmountInvalid),
        check('total_received_amount')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgerPayments.totalReceivedAmountRequired)
            .isFloat()
            .withMessage(responseMessages.ledgerPayments.totalReceivedAmountInvalid)
            .custom(value => {

                // validate `total_received_amount` with the received amount of ledgers.
                const ledgers = req.body.ledger_section_details;

                // Calculate the sum of 'received_amount' property using reduce
                const receivedAmountSum = ledgers.reduce((accumulator, currentValue) => {
                    return accumulator + parseFloat(currentValue.received_amount); // Assuming 'received_amount' is the property you want to sum
                }, 0); // Initial value of the accumulator is 0

                if ((req.body.record_payment == false) && (parseFloat(value) != receivedAmountSum + parseFloat(req.body.total_excess_amount))) {
                    return Promise.reject(responseMessages.ledgerPayments.invalidLedgerTotalReceivedAmount);
                }
                // validate `total_received_amount` with the received amount of ledgers.

                // Validate whether total amount is equals to sum of received(against each ledger) amount and balance amounts(against each ledger)
                // Calculate the sum of 'balance_amount' property using reduce
                // const balanceAmountSum = ledgers.reduce((accumulator, currentValue) => {
                //     return accumulator + parseFloat(currentValue.balance_amount); // Assuming 'balance_amount' is the property you want to sum
                // }, 0); 
                // Initial value of the accumulator is 0


                // if ((balanceAmountSum + receivedAmountSum) != req.body.total_ledger_amount) {
                //     throw new InvalidRequestError(responseMessages.payments.invoiceAmountInvalid, responseCodes.codeUnprocessableEntity);
                // }
                // Validate whether total amount is equals to sum of received(against each ledger) amount and balance amounts(against each ledger)

                return true;
            }),
        check('total_balance_amount')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgerPayments.totalBalanceAmountRequired)
            .isFloat()
            .withMessage(responseMessages.ledgerPayments.totalBalanceAmountInvalid)
            .custom(value => {

                // validate `balance_amount`
                // if (parseFloat(req.body.total_received_amount) + parseFloat(value) != parseFloat(req.body.total_ledger_amount)) {
                //     return Promise.reject(responseMessages.ledgerPayments.invalidLedgerTotalAmount);
                // }
                return true;
            }),
        check('total_excess_amount')
            .trim()
            .escape(),
    ];
    return [...updateValidationRules, ...validationRules];
}

/**
 * Store function to create a new ledger payment record for the  of a company
 * 
 * Overview of function
 * - Validate the request
 *   + If successfull
 *     ~ Call the 'store' function to create a new ledger payment record against a company.
 *     ~ Prepare the response with success data.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Login: 
 * - Log the incoming request.
 * - Set default variable for `responseData`.
 * - Get the `entity_type` from `req.path`.
 * - Convert 'received_on' in the request to 'YYYY-MM-DD' format using Moment.js and update the request.
 * - Call the validationRules function to get the validation rules.
 * - Run the validation rules.
 * - If validation is successful:
 *   + Call the `store` function to create a new ledger payment record against a company.
 *   + If success:
 *     - Prepare the response with success data.
 *   + Else
 *     - Prepare the response with error message.
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

    // Log Request
    await logRequest('info', req, 'Store new ledgers Payemnt Record request');

    // date format
    let dateFormat = await format.getDateFormat();

    // Convert 'received_on' in the request to 'YYYY-MM-DD' format.
    req.body.received_on = req.body.received_on ? moment(req.body.received_on, dateFormat).format('YYYY-MM-DD') : req.body.due_date;

    // Default Variable
    let responseData;

    // Get the `entity_type` from `req.path`.
    const requestSegments = req.path.split('/');
    req.body.entity_type = requestSegments[2];

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
     *    + Call the create new ledger payment service function
     *    + Based on the status in create new ledger function response, segregate the reposne and prepare the reponse.
     * If Validation Fails
     *    + Return the error message. 
     */
    if (errors.isEmpty()) {
        var response = await ledgersPaymentService.store(req.body);

        if (response.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success };
        } else {
            responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error };
        }

        // Log Response */
        await logResponse('info', req, responseData, 'Store new ledgers Payment response');

        // Return the response */
        await responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Update function to create a new ledger payment
 * 
 * Overview of fucntion:
 * - Validate the request
 *   + If successful
 *     ~ Call the 'update' service function to create a new ledger Payment.
 *     ~ Prepare the response with success data.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Get the `entity_type` from `req.path`.
 * - Convert 'received_on' in the request to 'YYYY-MM-DD' format using Moment.js and update the request.
 * - Call the validationRules function to get the validation rules.
 * - Run the validation rules.
 * - If validation is successful:
 *   + Call the `update` service function to create a new ledger.
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
    // Log Request
    await logRequest('info', req, 'Upate ledgers Payemnt Record request');

    // date format
    let dateFormat = await format.getDateFormat();

    // Convert 'received_on' in the request to 'YYYY-MM-DD' format.
    req.body.received_on = req.body.received_on ? moment(req.body.received_on, dateFormat).format('YYYY-MM-DD') : req.body.due_date;

    // Default Variable
    let responseData;

    // Get the `entity_type` from `req.path`.
    const requestSegments = req.path.split('/');
    req.body.entity_type = requestSegments[2];

    // Call the validationRules function to get the validation rules.
    req.body.id = req.params.id;
    var validations = await validationRules(req);

    // Run the validation rules. */
    for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
    }
    const errors = validationResult(req);

    /**
     * If validation is success
     *    + Call the create new ledger payment service function
     *    + Based on the status in create new ledger function response, segregate the reposne and prepare the reponse.
     * If Validation Fails
     *    + Return the error message. 
     */
    if (errors.isEmpty()) {
        var response = await ledgersPaymentService.update(req.body);

        if (response.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success };
        } else {
            responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error };
        }

        // Log Response */
        await logResponse('info', req, responseData, 'Update ledgers Payment response');

        // Return the response */
        await responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Ledger Payments Listing request to fetch the ledger payments data.
 * overview of API:
 * - Validate the request.
 *   + If success
 *     ~ Call the service function.
 *     ~ Fetch the data from 'ledger_payments' table and return the data.
 *     ~ Add success to the response.
 *   + Else
 *     ~ add error validation to the response.
 * - Return the response.
 * 
 * Logic: 
 * - Logging incoming rerquest.
 * - Define the validation rules as follows
 *   + request(query) is mandatory.
 *   + limit(query) is not mandatory, it should be a integer.
 *   + page(query) is not mandatory, it should be a integer.
 *   + search(query) is mandatory, it should be a string.
 * - Loop the req.query and using switch case and assign to the condition.
 *
 * - Run the validation rules
 *   + If validation success
 *     ~ Call the service function(listing) to fetch the data and send the condition(defined above), limit, page.
 *       # Add the service function(listing) return data to response.
 *   + Else
 *     ~ Add error validation to the response.
 * - Prepare the reponse with status codes.
 * - Logging the response.
 * - Reuturn response using responseHandler()
 * 
 * Notes : 
 *   - Handling expection using try catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns None
 * @throws {InvalidRequestError} - If the request ID is missing. 
 */
const listing = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, "Getting ledger Payments listing request");

    // Get the `entity_type` from `req.path`.
    const requestSegments = req.path.split('/');
    req.query.entity_type = requestSegments[2];

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
            .isIn(ENTITY_TYPES)
            .withMessage(responseMessages.ledgers.ledgerPaymentslugNameShouldbe),
        check('company_id')
            .trim().escape()
            .optional()
            .custom(async value => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        const companyData = await indexService.find('companies', ['id', 'reference_id'], { id: value });
                        if (!companyData.status) {
                            return Promise.reject(responseMessages.client.clientIdNotExists);
                        }
                    } else {
                        return Promise.reject(responseMessages.client.clientIdInvalid);
                    }
                }
            }),
    ];

    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    if (errors.isEmpty()) {

        let body = removeEmptyAndUndefinedKeys(req.query);

        // Default Variable
        let limit = (body.limit) ? (body.limit) : pagination.limit;
        let page = (body.page) ? (body.page) : pagination.page;
        var condition = {};

        condition.entity_type = (body.entity_type) ? body.entity_type : null;
        condition.company_id = (body.company_id) ? body.company_id : null;
        condition.search = (body.search) ? body.search : '';

        var listingData = await ledgersPaymentService.listing(condition, page, limit);

        if (!listingData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: listingData.message, error: listingData.error, message: responseMessages.common.noRecordFound, data: [], pagination: listingData.pagination }
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: listingData.data, pagination: listingData.pagination_data };
        }

        // Log Response
        logResponse('info', req, responseData, "Getting ledger Payments listing Response");

        // Return the response
        responseHandler(res, responseData);

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Index Function to retrieve an specific ledger payemnt details.
 * 
 * Overview of Function
 * - Validate the request
 *   + If successful.
 *     ~ Call the index Service function to retrieve the ledger payment detaila
 *     ~ Prepare the response with the reterieved data
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * 
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'id' (query) must be a valid UUID and should exist in the 'ledger_payments' table.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `index` service function to retrieve the ledger payment details.
 *    + If Data exists:
 *      - prepare the response with the succeess code and retrieved data.
 *    + Else:
 *      - Prepare the reponse with error message.
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

    // Log Request
    logRequest("info", req, "Index ledger payments request");

    let dateFormat = await format.getDateFormat();

    // Get the `entity_type` from `req.path`.
    const requestSegments = req.path.split('/');
    req.query.entity_type = requestSegments[2];

    // Default Variable
    var responseData;

    // Writing validation rules to the input request.
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check("entity_type")
            .trim()
            .escape()
            .isIn(ENTITY_TYPES)
            .withMessage(responseMessages.ledgers.slugNameShouldbe),
        check('id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgerPayments.ledgerPaymentIdRequired)
            .isUUID()
            .withMessage(responseMessages.ledgerPayments.ledgerPaymentIdInvalid)
            .custom(async (value) => {
                const legerPayment = await indexServices.find('ledger_payments', ['id'], { id: value })
                if (!legerPayment.status) {
                    return Promise.reject(responseMessages.ledgerPayments.ledgerPaymentIdNotExist)
                }
            })
    ];

    // Run the validation rules.
    for (let validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    if (errors.isEmpty()) {
        let condition = {
            ledger_payment_id: req.query.id,
            entity_type: req.query.entity_type,
            ledger_entity_type: (req.query.entity_type == 'payment') ? 'invoice' : 'bill',
            date_format: dateFormat
        }
        const fetchData = await ledgersPaymentService.index(condition);
        if (!fetchData.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess, message: fetchData.message,
                error: fetchData.error,
                message: responseMessages.common.noRecordFound,
                data: []
            }
        }
        else {
            responseData = {
                statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: fetchData.data
            };
        }
        // Log Response
        logResponse("info", req, responseData, "Index ledger Payments response");

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
});

module.exports = { store, update, listing, index }
