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
/**
 * @constant regexPatterns regexPatterns constant patterns
 */
const { regexPatterns } = require('../../../../../constants/regexPatterns');
const { removeEmptyAndUndefinedKeys } = require('../../../../../helpers/globalHelper');

const indexService = require('../../services/index');
const indexServices = require("../../repositories/index");
const moment = require('moment');
const format = require('../../../../../helpers/format');
const ledgersService = require('../../services/ledgers/ledgersService');
const { responseHandler } = require('../../../../responseHandler');
const { pagination } = require('../../../../../config/pagination');
const INVOICES = 'invoice';
const BILLS = 'bill';
const CLIENT = 'client';
const VENDOR = 'vendor';
const PAYMENT = 'payment';
const BILLPAYMENT = 'bill-payment';
const ENTITY_TYPES = [INVOICES, BILLS];
// LEDGER STATUSES
const VOID = 'Void';
const WRITE_OFF = 'Write Off';
const DRAFTED = 'Drafted';
const APPROVED = 'Approved';
const PAID = 'Paid';
const PARTIALLY_PAID = 'Partially Paid';

/**
 * Validation Rules for store and update.
 * - Define the validation rules as follows:
 *   + 'request_id' (body), must not be empty.
 *   + 'entity_type' (body), must not be empty, should be in ['invoices', 'bills'].
 *   + 'company_id' (body), must not be empty, must be valid uuid, should exist in `companies` table.
 *   + 'order_number' (body). must not be empty.
 *   + 'net_pay_terms_id' (body), must not be empty,  should be 'int', should exist in `net_pay_terms` table.
 *   + 'date' (body). must not be empty, should be a valid date.
 *   + 'due_date' (body), must not bt empty.
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
    let placementIdValidation = [];

    if (req.body.id) {

        // If we got `req.body.id` append `id`, `ledger_item_details.*.id`, `documents.*.id` validation.
        updateValidationRules = [
            check('id')
                .trim()
                .escape()
                .notEmpty()
                .withMessage(responseMessages.ledgers.idRequired)
                .isUUID()
                .withMessage(responseMessages.ledgers.idInvalid)
                .custom(async (value) => {
                    const ledgers = await indexServices.find('ledgers', ['id', 'reference_id', 'approval_level'], { id: value });
                    if (!ledgers.status) {
                        return Promise.reject(responseMessages.ledgers.idNotExists);
                    }

                    if ([VOID, WRITE_OFF, PAID, PARTIALLY_PAID].includes(ledgers.data[0]?.status)) {
                        return Promise.reject(responseMessages.ledgers.actionNotAllowed);
                    }
                    req.body.reference_id = ledgers.data[0]?.reference_id;
                    req.body.current_approval_level = ledgers.data[0]?.approval_level;
                    return true
                }),
            check('ledger_item_details.*.id')
                .trim()
                .custom(async (value) => {
                    if (value != undefined && value != '') {
                        const ledgerItem = await indexServices.find('ledger_item_details', ['id'], { id: value });
                        if (!ledgerItem.status) {
                            return Promise.reject(responseMessages.ledgers.ledgerItemIdInvalid);
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
                        return await indexService.find('ledger_documents', ['id'], { id: value }).then((documentsData) => {
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
    } else {
        updateValidationRules = [
            check('ledger_item_details.*.employee_id')
                .trim()
                .escape()
                .notEmpty()
                .withMessage(responseMessages.employee.employeeIdRequired)
                .isUUID()
                .withMessage(responseMessages.employee.employeeIdInvalid)
                .custom(async value => {
                    const employeeData = await indexService.find('employee', ['id', 'reference_id'], { id: value });
                    if (!employeeData.status) {
                        return Promise.reject(responseMessages.employee.employeeIdNotExists);
                    }
                    req.body.reference_id = employeeData.data[0].reference_id
                })
        ];

        // `ledger_item_details.*.placement_id` is only mandatory when entity_type is 'invoice'
        if (req.body.entity_type == INVOICES) {
            placementIdValidation = [
                check('ledger_item_details.*.placement_id')
                    .trim()
                    .escape()
                    .notEmpty()
                    .withMessage(responseMessages.placement.placementIdRequired)
                    .isUUID()
                    .withMessage(responseMessages.placement.placementIdInvalid)
                    .custom(async (value) => {
                        const placementData = await indexServices.find('placements', ['id'], { id: value, employee_id: req.body.employee_id });
                        if (!placementData.status) {
                            return Promise.reject(responseMessages.placement.placedEmployeeIdInvalid);
                        }
                        return true;
                    })
            ];
        }

        updateValidationRules = [...updateValidationRules, ...placementIdValidation];
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
            .isIn([INVOICES, BILLS])
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
                condition = (req.body.entity_type == INVOICES) ? { ...condition, ...{ entity_type: CLIENT } } : { ...condition, ...{ entity_type: VENDOR } };

                const companyData = await indexServices.find('companies', ['invoice_configuration_id', 'invoice_approval_id', 'name', 'reference_id', 'entity_type'], condition);
                if (!companyData.status) {
                    return Promise.reject(responseMessages.ledgers.CompanyIdDoesNotExist);
                }
                req.body.company_name = companyData.data[0]?.name;
                req.body.company_entity_type = companyData.data[0]?.entity_type;
                req.body.invoice_configuration_id = companyData.data[0]?.invoice_configuration_id;
                req.body.invoice_approval_id = companyData.data[0]?.invoice_approval_id;
                req.body.company_reference_id = companyData.data[0]?.reference_id;
                return true;
            }),
        check('order_number')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.ledgers.orderNumberRequired)
            .custom(async (value) => {
                if (value !== undefined && value !== '') {
                    let regexp = regexPatterns.alphanumericSpaceRegex;
                    if (!regexp.test(value)) {
                        return Promise.reject(responseMessages.ledgers.orderNumberInvalid)
                    } else {
                        var orderNumber = await indexServices.find('ledgers', ['id'], { order_number: value, entity_type: req.body.entity_type })
                        if (orderNumber.status) {
                            if (req.body.id) {
                                if (req.body.id != orderNumber.data[0].id) {
                                    return Promise.reject(responseMessages.ledgers.orderNumberExists)
                                }
                                return true;
                            } else {
                                return Promise.reject(responseMessages.ledgers.orderNumberExists)
                            }
                        }
                        return true;
                    }
                }
                return true;
            }),
        check('net_pay_terms_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgers.netPayTermsIdRequired)
            .isInt()
            .withMessage(responseMessages.ledgers.invalidNetPayTermsId)
            .custom(async (value) => {
                const netPayTermsData = await indexServices.find('net_pay_terms', ['id', 'days'], { id: value });
                if (!netPayTermsData.status) {
                    return Promise.reject(responseMessages.ledgers.netPayTermsIdNotExists);
                }
                req.body.net_pay_term_days = netPayTermsData.data[0].days;
                return true;
            }),
        check('date')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.ledgers.dateRequired)
            .custom((value) => {
                if (value != 'Invalid date') {
                    const isDate = new Date(value);
                    if (isNaN(isDate.getTime())) {
                        return Promise.reject(responseMessages.ledgers.dateInvalid);
                    }
                    return true;
                } else {
                    return Promise.reject(responseMessages.ledgers.dateFormetInvalid);
                }
            }),
        check('due_date')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.ledgers.dueDateRequired)
            .custom((value) => {
                if (value != 'Invalid date') {
                    const isDate = new Date(value);
                    if (isNaN(isDate.getTime())) {
                        return Promise.reject(responseMessages.ledgers.dueDateInvalid);
                    }
                    if (moment(isDate).format('YYYY-MM-DD') !== moment(req.body.date).add(req.body.net_pay_term_days, 'days').format('YYYY-MM-DD')) {
                        return Promise.reject(responseMessages.ledgers.dueDateEqualNetPayDay);
                    }
                    return true
                } else {
                    return Promise.reject(responseMessages.ledgers.dueDateFormetInvalid);
                }
            }),
        check('customer_note')
            .trim()
            .escape(),
        check('terms_and_conditions')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.invoice.termsAndConditionsRequired),
        check('sub_total_amount')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.ledgers.subTotalAmountRequired),
        // .isFloat()
        // .withMessage(responseMessages.ledgers.subTotalAmountInvalid),
        check('adjustment_amount')
            .trim()
            .escape(),
        // .isFloat()
        // .withMessage(responseMessages.ledgers.adjustmentAmountInvalid),
        check('discount_type')
            .trim()
            .escape()
            .isIn([1, 2]) // 1-Fixed value, 2-Percentage value
            .withMessage(responseMessages.ledgers.discountTypeInvalid),
        check('discount_value')
            .trim()
            .escape()
            .isFloat()
            .withMessage(responseMessages.ledgers.discountValueInvalid),
        check('discount_amount')
            .trim()
            .escape()
            .custom(async value => {
                value = parseFloat(value);
                req.body.sub_total_amount = parseFloat(req.body.sub_total_amount);
                req.body.adjustment_amount = parseFloat(req.body.adjustment_amount);
                req.body.discount_value = parseFloat(req.body.discount_value);
                req.body.discount_amount = parseFloat(req.body.discount_amount);

                // calculate discount amount from discount_value
                const discountAmount = (req.body.discount_type == 1) ? req.body.discount_value : ((req.body.sub_total_amount + req.body.adjustment_amount) * req.body.discount_value) / 100;
                if (parseFloat(discountAmount).toFixed(2) != req.body.discount_amount) {
                    return Promise.reject(responseMessages.ledgers.discountAmountInvalid)
                }

                return true
            }),
        check('total_amount')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.ledgers.totalAmountRequired)
            .isFloat()
            .withMessage(responseMessages.ledgers.totalAmountInvalid)
            .custom(async value => {

                value = parseFloat(value);
                req.body.sub_total_amount = parseFloat(req.body.sub_total_amount);
                req.body.adjustment_amount = parseFloat(req.body.adjustment_amount);
                req.body.discount_amount = parseFloat(req.body.discount_amount);

                if (req.body.discount_amount) {
                    if (parseFloat(req.body.sub_total_amount + req.body.adjustment_amount - req.body.discount_amount).toFixed(2) !== parseFloat(value).toFixed(2)) {
                        return Promise.reject(responseMessages.ledgers.totalAmountNotMatchedDiscount);
                    }
                } else {
                    if (parseFloat(req.body.sub_total_amount + req.body.adjustment_amount).toFixed(2) !== parseFloat(value).toFixed(2)) {
                        return Promise.reject(responseMessages.ledgers.totalAmountNotMatched);
                    }
                }
            }),
        check('documents')
            .optional()
            .custom(async (array) => {
                // Custom validation function for the 'bank_information' array
                if (!Array.isArray(array)) {
                    return Promise.reject(
                        responseMessages.ledgers.docmentMustBeArray
                    )
                }
            }),
        check('documents.*.new_document_id')
            .trim()
            .escape()
            .custom(async (value) => {
                if (value !== undefined && value !== '') {
                    if (regexPatterns.uuidRegex.test(value)) {
                        return await indexServices.find('temp_upload_documents', ['id'], { id: value }, null, [], null, null, null, false).then((documentsData) => {
                            if (!documentsData.status) {
                                return Promise.reject(responseMessages.ledgers.documentIdNotExists);
                            }
                        });
                    } else {
                        return Promise.reject(responseMessages.ledgers.documentIdInvalid)
                    }
                }
            }),
        check('ledger_item_details')
            .custom(async (array) => {

                // Custom validation function for the 'bank_information' array
                if (!Array.isArray(array)) {
                    return Promise.reject(
                        responseMessages.ledgers.ledgerItemsMustBeArray
                    )
                } else if (array.length == 0) {
                    return Promise.reject(
                        responseMessages.ledgers.ledgerItemsRequired
                    )
                }

                // Calculate the 'sub_total_amount' received and ledger_item_details amount should be same.
                const amount = array.reduce((accumulator, currentValue) => accumulator + parseFloat(currentValue['amount']), 0);
                if (parseFloat(req.body.sub_total_amount) != amount) {
                    return Promise.reject(responseMessages.ledgers.subTotalAmountInvalid);
                }

                // timesheet_hour_ids must be unique for all 'ledger_item_deails'
                if (req.body.entity_type == INVOICES && array.every(obj => obj.hasOwnProperty('timesheet_hour_ids'))) {
                    var timesheetHourIds = array.reduce((accumulator, obj) => {
                        return accumulator.concat(obj["timesheet_hour_ids"]);
                    }, []);
                    if (new Set(timesheetHourIds).size != timesheetHourIds.length) {
                        return Promise.reject(responseMessages.ledgers.timesheetHourIdsUnique);
                    }
                }

                // Validate amount of each ledger item details - hours * bill_rate = amount
                await Promise.all(array.map(async (ledgerItem) => {
                    if (!((ledgerItem.hours * ledgerItem.rate).toFixed(2) == ledgerItem.amount)) {
                        throw new Error(responseMessages.ledgers.invalidLedgerAmount);
                    }

                    if (req.body.entity_type == INVOICES && ledgerItem.timesheet_hour_ids) {
                        if (ledgerItem.timesheet_hour_ids?.length > 0) {
                            if (!ledgerItem.id) {
                                const timesheetHour = await indexServices.find('timesheet_hours', ['id'], { id: ledgerItem.timesheet_hour_ids, invoice_raised: true });
                                if (timesheetHour.status) {
                                    return Promise.reject(responseMessages.ledgers.invalidTimesheetHourID);
                                }
                            }
                        }
                    }
                }));
                return true;
            }),
        check('ledger_item_details.*.description')
            .trim()
            .escape(),
        check('ledger_item_details.*.hours')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.ledgers.hoursRequired),
        check('ledger_item_details.*.rate')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.ledgers.rateRequired)
            .isFloat()
            .withMessage(responseMessages.ledgers.rateInvalid),
        check('ledger_item_details.*.amount')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.ledgers.amountRequired)
            .isFloat()
            .withMessage(responseMessages.ledgers.amountInvalid),
        check('ledger_item_details.*.timesheets_available')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.ledgers.tsAvailableRequired)
            .isBoolean()
            .withMessage(responseMessages.ledgers.invalidTsAvailable),
        check('ledger_item_details.*.timesheet_hour_ids.*') //need to cross check
            .trim(),
        check("shipping_address.*.address_line_one")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.addressOneRequired),
        check("shipping_address.*.address_line_two")
            .trim()
            .escape(),
        check("shipping_address.*.city")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.cityRequired)
            .not().matches(regexPatterns.specialCharactersRegex)
            .withMessage(responseMessages.employee.behalfOnboarding.cityInvalid),
        check("shipping_address.*.zip_code")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.zipCodeRequired)
            .isLength({ min: 5, max: 10 })
            .withMessage(responseMessages.employee.behalfOnboarding.zipCodeShouldBe),
        check('shipping_address.*.state_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.configurations.state.stateIdRequired)
            .custom(async (value) => {
                const state = await indexService.find('states', ['id'], { id: value })
                if (!state.status) {
                    return Promise.reject(responseMessages.configurations.state.IdNotExists)
                }
            }),
        check('shipping_address.*.country_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.configurations.state.countryId)
            .isInt().withMessage(responseMessages.configurations.country.countryIdInvalid)
            .custom(async (value) => {
                const contactData = await indexService.find('countries', ['id'], { id: value })
                const status = contactData.status
                if (!status) {
                    return Promise.reject(responseMessages.configurations.country.IdNotExists)
                }
            }),
        check("billing_address.*.address_line_one")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.address1Required),
        check("billing_address.*.address_line_two")
            .trim()
            .escape(),
        check("billing_address.*.city")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.cityRequired)
            .not().matches(regexPatterns.specialCharactersRegex)
            .withMessage(responseMessages.employee.behalfOnboarding.cityInvalid),
        check("billing_address.*.zip_code")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.zipCodeRequired)
            .isLength({ min: 5, max: 10 })
            .withMessage(responseMessages.employee.behalfOnboarding.zipCodeShouldBe),
        check('billing_address.*.state_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.configurations.state.stateIdRequired)
            .custom(async (value) => {
                const state = await indexService.find('states', ['id'], { id: value })
                if (!state.status) {
                    return Promise.reject(responseMessages.configurations.state.IdNotExists)
                }
            }),
        check('billing_address.*.country_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.configurations.state.countryId)
            .isInt().withMessage(responseMessages.configurations.country.countryIdInvalid)
            .custom(async (value) => {
                const contactData = await indexService.find('countries', ['id'], { id: value })
                const status = contactData.status
                if (!status) {
                    return Promise.reject(responseMessages.configurations.country.IdNotExists)
                }
            }),
    ];
    return [...updateValidationRules, ...validationRules];
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
 * - Convert 'date', 'due_date' in the request to 'YYYY-MM-DD' format using Moment.js and update the request.
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
 * - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const store = tryCatch(async (req, res) => {

    let dateFormat = await format.getDateFormat(); // date format

    // Log Request
    await logRequest('info', req, 'Store new ledgers request');

    // Default Variable
    let responseData;

    // Get the `entity_type` from `req.path`.
    const requestSegments = req.path.split('/');
    req.body.entity_type = requestSegments[2];

    // Convert 'date', 'due_date' in the request to 'YYYY-MM-DD' format.
    req.body.due_date = req.body.due_date ? moment(req.body.due_date, dateFormat).format('YYYY-MM-DD') : req.body.due_date;
    req.body.date = req.body.date ? moment(req.body.date, dateFormat).format('YYYY-MM-DD') : req.body.date;

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
        var response = await ledgersService.store(req.body);
        if (response.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success };
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
 * - Convert 'date', 'due_date' in the request to 'YYYY-MM-DD' format using Moment.js and update the request.
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
    await logRequest('info', req, 'Update new ledgers request');

    // Default Variable
    let responseData;

    // Get the `entity_type` from `req.path`.
    const requestSegments = req.path.split('/');
    req.body.entity_type = requestSegments[2];

    // Convert 'date', 'due_date' in the request to 'YYYY-MM-DD' format.
    req.body.due_date = req.body.due_date ? moment(req.body.due_date, dateFormat).format('YYYY-MM-DD') : req.body.due_date;
    req.body.date = req.body.date ? moment(req.body.date, dateFormat).format('YYYY-MM-DD') : req.body.date;

    // Call the validationRules function to get the validation rules.
    req.body.id = req.params.id;
    var validations = await validationRules(req);

    // Run the validation rules. */
    for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
    }
    const errors = validationResult(req);

    if (errors.isEmpty()) {

        var response = await ledgersService.update(req.body);
        if (response.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success };
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
 * Destroy function is to delete an Ledger Item permanently.
 *
 * Overview of Function
 * - Validate the request
 *   + If successful
 *     ~ Call the 'destroy' service function to delete an Ledger Item permanently.
 *     ~ Prepare the response with success data
 *   + Else
 *     ~ Add error validation to the response
 * - Return the response
 *
 * Logic:
 * - Log the incoming request
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *   + 'request_id' (body), must not be empty.
 *   + 'ledger_item_id - id' (body), must not be empty, should exist in 'ledger_item_details'.
 *
 * Run the validation rules.
 * If validation is successful:
 *   + Call the 'destroy' service function to delete an existing ledger item.
 *   + If successful:
 *     - Prepare the response with success data.
 *   + Else:
 *     - Prepare the response with an error message.
 * If validation fails:
 *    + Add error validation to the response.
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
    // Log Request
    logRequest('info', req, 'Delete Ledger Item request');

    // Default Variable
    var responseData;

    // validation rules to the input request
    var validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgers.ledgerItemIdRequired)
            .isInt()
            .withMessage(responseMessages.ledgers.ledgerItemIdInvalid)
            .custom(async (value) => {
                const ledgerItemData = await indexServices.find('ledger_item_details', ['id', 'timesheet_hour_ids'], { id: value });
                if (!ledgerItemData.status) {
                    return Promise.reject(responseMessages.ledgers.ledgerItemIdNotExists);
                }
                req.body.timesheet_hour_ids = ledgerItemData.data[0]?.timesheet_hour_ids;
                return true;
            })
    ];

    // Run the validation rules.
    for (let validation of validations) {
        var result = await validation.run(req)
        if (result.errors.length) break
    }
    var errors = validationResult(req);

    if (errors.isEmpty()) {
        var response = await ledgersService.destroy(req.body);
        if (response.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success };
        } else {
            responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error };
        }

        // Log Response */
        await logResponse('info', req, responseData, 'Delete ledgers response');

        // Return the response */
        await responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }

});

/**
 * Endpoint to retrieve uninvoiced timesheets based on query parameters.
 *
 * @param {Object} req - Express request object containing query parameters.
 * @param {Object} res - Express response object for sending the result.
 *
 * Logic:
 * - Retrieve the date format using 'format.getDateFormat'.
 * - Log the incoming request details.
 * - Initialize an empty variable 'responseData'.
 * 
 * - Modify the 'start_date' and 'end_date' properties in the request to match the expected date format.
 * 
 * - Define validation rules for the input request using 'validations':
 *   - Ensure 'request_id' is present.
 *   - Ensure 'placement_id' is present and validate its existence in the 'placements' table.
 *   - Validate 'start_date' and 'end_date' properties for correct date format.
 * 
 * - Run the validation rules on the request.
 * - Get validation errors if they exist.
 * 
 * - If there are no validation errors:
 *   - Retrieve timesheet data using 'ledgersService.getUninvoicedTimesheets' based on the modified request query.
 *   - If timesheet data retrieval is successful:
 *     - Prepare the 'responseData' object with the status, message, data, statistics, and pagination.
 *   - If no timesheet data is found:
 *     - Prepare 'responseData' indicating that no records were found.
 *   
 *   - Log the response details.
 *   - Return the response using 'responseHandler'.
 * 
 * - If there are validation errors:
 *   - Throw an 'InvalidRequestError' with the first error message and 'codeUnprocessableEntity'.
 */
const getUninvoicedTimesheets = tryCatch(async (req, res) => {
    let dateFormat = await format.getDateFormat(); // date format

    /* Log Request */
    await logRequest('info', req, 'fetch timesheet hours listing for uninvoiced timesheets request');
    /* Log Request */

    /* Default Variable */
    let responseData;
    /* Default Variable */

    req.query.start_date = (req.query.start_date && req.query.start_date != '') ? moment(req.query.start_date, dateFormat).format('YYYY-MM-DD') : '';

    req.query.end_date = (req.query.end_date && req.query.end_date != '') ? moment(req.query.end_date, dateFormat).format('YYYY-MM-DD') : '';

    /* Writing validation rules to the input request */
    const validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('placement_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.placement.placementIdRequired)
            .custom(async (value) => {
                /** Check whether the id exist is placements table */
                const placement = await indexServices.find('placements', ['id', 'client_id', 'reference_id'], { id: value });
                if (!placement.status) {
                    return Promise.reject(
                        responseMessages.placement.placementIdNotExists
                    );
                } else {
                    req.body.existing_client_id = placement.data[0].client_id;
                    req.body.placement_reference_id = placement.data[0].reference_id;
                    return true;
                }
            }),
        check('start_date')
            .trim()
            .custom((value) => {
                if (value !== '' && value !== null) {
                    const isDate = new Date(value);
                    if (isNaN(isDate.getTime())) {
                        return Promise.reject(responseMessages.timesheet.invalidStartDate);
                    }
                }
                return true;
            }),
        check('end_date')
            .trim()
            .custom((value) => {
                if (value !== '' && value !== null) {
                    const isDate = new Date(value);
                    if (isNaN(isDate.getTime())) {
                        return Promise.reject(responseMessages.timesheet.invalidEndDate);
                    }
                }
                return true
            })
    ];
    /* Writing validation rules to the input request */

    /* Run the validation rules. */
    for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
    }
    const errors = validationResult(req);
    /* Run the validation rules. */

    /**
     * If validation is success
     *    + Call the getUninvoicedTimesheets service function
     *    - Based on the status in getUninvoicedTimesheets function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
     */
    if (errors.isEmpty()) {

        let timesheetData = await ledgersService.getUninvoicedTimesheets(req.query);
        if (!timesheetData.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                error: timesheetData.error,
                message: responseMessages.common.noRecordFound,
                data: [],
            }
        }
        else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: timesheetData.data,
                total_hours: timesheetData.total_hours
            };
        }

        /* Log Response */
        await logResponse('info', req, responseData, 'fetch timesheet hours listing for uninvoiced timesheets response');
        /* Log Response */

        /* Return the response */
        await responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Route handler to fetch employee and placement details for a client.
 *
 * @param {Object} req - Request object containing query parameters.
 * @param {Object} res - Response object to send the response.
 *
 * Logic:
 * - Log the incoming request for debugging purposes.
 * 
 * - Initialize an empty variable 'responseData'.
 * 
 * - Define validation rules for the input request:
 *   - Ensure 'request_id' is provided.
 *   - Ensure 'client_id' is provided, valid UUID, and exists in the 'companies' table.
 * 
 * - Run the validation rules on the incoming query parameters.
 * 
 * - If validation is successful:
 *   - Call the 'getEmployeeDetailsByClientId' service function with the query parameters.
 *   - Check the status of the service response.
 *   - If the response status is false, prepare an empty response with a message indicating no records found.
 *   - If the response status is true, prepare a success response with the retrieved data.
 * 
 * - Log the response for debugging purposes.
 * 
 * - Send the prepared response using 'responseHandler'.
 */
const getEmployeeDetails = tryCatch(async (req, res) => {

    /* Log Request */
    await logRequest('info', req, 'fetch employee & placement details for client request');
    /* Log Request */

    // date format
    const dateFormat = await format.getDateFormat();

    /* Default Variable */
    let responseData;
    /* Default Variable */

    /* Writing validation rules to the input request */
    const validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check("any")
            .trim()
            .escape()
            .isIn([CLIENT, VENDOR])
            .withMessage(responseMessages.ledgers.invalidCompanyEntityType),
        check('id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.companies.companyIdRequired)
            .isUUID()
            .withMessage(responseMessages.companies.companyIDInvalid)
            .custom(async value => {
                const companyData = await indexService.find('companies', ['id'], { id: value, entity_type: req.params.any });
                if (!companyData.status) {
                    return Promise.reject(responseMessages.companies.companyIdNotExists);
                }
            })
    ];
    /* Writing validation rules to the input request */

    /* Run the validation rules. */
    for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
    }
    const errors = validationResult(req);
    /* Run the validation rules. */

    /**
     * If validation is success
     *    + Call the create new invoice service function
     *    - Based on the status in create new invoice function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
     */
    if (errors.isEmpty()) {
        let employeeData;
        if (req.params.any == CLIENT) {
            employeeData = await ledgersService.getEmployeeDetailsByClientId(req.params, dateFormat);
        } else if (req.params.any == VENDOR) {
            employeeData = await ledgersService.getEmployeeDetailsByVendorId(req.params.id);
        }
        if (!employeeData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: employeeData.message, error: employeeData.error, message: responseMessages.common.noRecordFound, data: [] };
        }
        else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: employeeData.data };
        }

        /* Log Response */
        await logResponse('info', req, responseData, 'fetch employee & placement details for client response');
        /* Log Response */

        /* Return the response */
        await responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Route handler to fetch ledger item details based on timesheets ids
 *
 * @param {Object} req - Request object containing query parameters.
 * @param {Object} res - Response object to send the response.
 *
 * Logic:
 * - Log the incoming request for debugging purposes.
 * - Initialize an empty variable 'responseData'.
 * 
 * - Define validation rules for the input request:
 *   - Define the validation rules for the request and timesheet hour id's
 * - Run the validation rules.
 * 
 * - If validation is successful:
 *   - Call the 'getLedgerItemDetailsByTimesheetIds' service function..
 *   - Check the status of the service response.
 *   - If the response status is false, prepare an empty response with a message indicating no records found.
 *   - If the response status is true, prepare a success response with the retrieved data.
 * 
 * - Log the response for debugging purposes.
 * 
 * - Send the prepared response using 'responseHandler'.
 */
const getLedgerItemDetailsByTimesheetIds = tryCatch(async (req, res) => {

    /* Log Request */
    logRequest('info', req, 'Fetch ledger item details request.');
    /* Log Request */

    /* Default Variable */
    let responseData = '';
    /* Default Variable */

    /* Writing validation rules to the input request */
    const validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('placement_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
            .isUUID()
            .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
            .custom(async (value) => {
                const placements = await indexServices.find('placements', ['id'], { id: value });
                if (!placements.status) {
                    return Promise.reject(responseMessages.timesheet.placementIdDoesNotExist);
                }
                return true;
            }),
        check('timesheet_hour_ids.*')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.timesheet.TimesheetIdInvalid)
            .custom(async (value) => {
                const timesheet = await indexServices.find('timesheet_hours', ['id'], { id: value, invoice_raised: false });
                if (!timesheet.status) {
                    return Promise.reject(responseMessages.timesheet.invalidTimesheetHourId);
                }
                return true;
            }),
    ];
    /* Writing validation rules to the input request */

    /*Run the validation rules. */
    for (let validation of validations) {
        let result = await validation.run(req);
        if (result.errors.length) break;
    }
    let errors = validationResult(req);
    /*Run the validation rules. */

    /**
     * If validation is success
     *    + Call the create email function
     *    - Based on the status of the send to email function
     * If Validation Fails
     *    + Return the error message.
     */
    if (errors.isEmpty()) {
        let ledgerItemInfo = await ledgersService.getLedgerItemDetailsByTimesheetIds(req.body);
        if (ledgerItemInfo.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: ledgerItemInfo.data,
            };
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.noRecordFound,
                data: [],
            };
        }

        /* Log Response */
        logResponse('info', req, responseData, 'Fetch ledger item details response.');
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg + errors.array()[0].value,
            responseCodes.codeUnprocessableEntity,
        );
    }
});

/**
 * Ledgers Listing request to fetch ledgers data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Fetch the data from 'ledgers' table and return the data.
 *      ~ Add success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response.
 * 
 * Logic:
 * - Logging incoming request
 * - Define the validation rules as follows
 *   + request(query) is mandatory.
 *   + limit(query) is not mandatory, it should be a integer.
 *   + page(query) is not mandatory, it should be a integer.
 *   + search(query) is mandatory, it should be a string.
 * - Loop the req.query and using switch case and assign to the condition.
 * 
 * - Run the validation rules
 *   + If validation success
 *      ~ Call the service function(listing) to fetch the data and send the condition(defined above), limit, page,
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
const listing = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, "Getting ledgers listing request");

    // date format
    const dateFormat = await format.getDateFormat();

    // Get the `entity_type` from `req.path`.
    const requestSegments = req.path.split('/');
    req.query.entity_type = requestSegments[2];

    // Default Variable
    var responseData;
    var condition = {
        from_date: null,
        to_date: null
    };

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
            .withMessage(responseMessages.ledgers.slugNameShouldbe),
        check('company_id')
            .custom(async value => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        const companyData = await indexService.find('companies', ['id', 'reference_id'], { id: value });
                        if (!companyData.status) {
                            return Promise.reject(responseMessages.companies.companyIdNotExists);
                        }
                    } else {
                        return Promise.reject(responseMessages.companies.companyIDInvalid);
                    }
                }
            })
    ];

    // validate 'from_date' and 'to_date'
    if (req.query.from_date && req.query.to_date) {
        const from_date = moment(req.query.from_date, dateFormat).format('YYYY-MM-DD');
        const to_date = moment(req.query.to_date, dateFormat).format('YYYY-MM-DD');
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

        let body = removeEmptyAndUndefinedKeys(req.query);

        // Default Variable
        let limit = (body.limit) ? (body.limit) : pagination.limit;
        let page = (body.page) ? (body.page) : pagination.page;

        condition.entity_type = (body.entity_type) ? body.entity_type : null;
        condition.company_id = (body.company_id) ? body.company_id : null;
        condition.status = (body.status) ? body.status : null;
        condition.search = (body.search) ? body.search : null;
        condition.status = (body.payment == 'true') ? 'Payment' : ((body.status) ? body.status : null);

        var listingData = await ledgersService.listing(condition, dateFormat, page, limit);

        if (!listingData.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: listingData.message,
                error: listingData.error,
                message: responseMessages.common.noRecordFound,
                data: []
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: listingData.data,
                pagination: listingData.pagination_data
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

/**
 * Handles the index request for a single Approval Configuration.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns None
 * @throws {InvalidRequestError} If the request_id or invoice_id is missing.
 */
const index = tryCatch(async (req, res) => {
    // Log Request
    logRequest('info', req, 'getting ledger details');

    let dateFormat = await format.getDateFormat();

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
            .withMessage(responseMessages.ledgers.slugNameShouldbe),
        check('ledger_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgers.ledgerIdRequired)
            .isUUID()
            .withMessage(responseMessages.ledgers.idInvalid)
            .custom(async (value) => {
                const ledgers = await indexServices.find('ledgers', ['id', 'reference_id', 'company_id', 'approval_level'], { id: value, entity_type: req.body.entity_type });
                if (!ledgers.status) {
                    return Promise.reject(responseMessages.ledgers.idNotExists);
                }
                req.body.company_id = ledgers.data[0]?.company_id;
                req.body.approval_level = ledgers.data[0]?.approval_level;
                req.body.ledger_id = ledgers.data[0]?.id;
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
        let condition = {
            ledger_id: req.query.ledger_id,
            entity_type: req.query.entity_type,
            date_format: dateFormat
        }
        var invoiceData = await ledgersService.index(condition, req.body);

        if (!invoiceData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: invoiceData.message, error: invoiceData.error, message: responseMessages.common.noRecordFound, data: [] }
        }
        else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: invoiceData.data };
        }

        // Log Response
        logResponse(
            'info',
            req,
            responseData,
            'Getting ledger details Response'
        )

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

const ledgersTheme = tryCatch(async (req, res) => {
    // Log Request
    logRequest('info', req, 'getting ledgers theme details');

    let dateFormat = await format.getDateFormat();

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
            .withMessage(responseMessages.ledgers.slugNameShouldbe),
        check('ledger_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgers.ledgerIdRequired)
            .isUUID()
            .withMessage(responseMessages.ledgers.idInvalid)
            .custom(async (value) => {
                const ledgers = await indexServices.find('ledgers', ['id', 'reference_id', 'company_id', 'approval_level'], { id: value, entity_type: req.body.entity_type });
                if (!ledgers.status) {
                    return Promise.reject(responseMessages.ledgers.idNotExists);
                }
                req.body.company_id = ledgers.data[0]?.company_id;
                req.body.approval_level = ledgers.data[0]?.approval_level;
                req.body.ledger_id = ledgers.data[0]?.id;
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
        let condition = {
            ledger_id: req.query.ledger_id,
            entity_type: req.query.entity_type,
            date_format: dateFormat,
            is_pdf: true
        }
        var invoiceData = await ledgersService.pdfData(condition, req.body);

        if (!invoiceData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: invoiceData.message, error: invoiceData.error, message: responseMessages.common.noRecordFound, data: [] }
        }
        else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: invoiceData.data.data };
        }

        // Log Response
        logResponse(
            'info',
            req,
            responseData,
            'Getting ledgers theme Response'
        )

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

const ledgersReminder = tryCatch(async (req, res) => {
    // Log Request
    logRequest('info', req, 'getting invoice reminder');

    // Get the `entity_type` from `req.path`.
    const requestSegments = req.path.split('/');
    req.query.entity_type = requestSegments[2];
    let dateFormat = await format.getDateFormat();

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
            .withMessage(responseMessages.ledgers.slugNameShouldbe),
        check('id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgers.ledgerIdRequired)
            .isUUID()
            .withMessage(responseMessages.ledgers.idInvalid)
            .custom(async (value) => {
                const ledgers = await indexServices.find('ledgers', ['id', 'reference_id', 'company_id', 'approval_level'], { id: value, entity_type: req.body.entity_type });
                if (!ledgers.status) {
                    return Promise.reject(responseMessages.ledgers.idNotExists);
                }
                req.body.company_id = ledgers.data[0]?.company_id;
                req.body.approval_level = ledgers.data[0]?.approval_level;
                req.body.ledger_id = ledgers.data[0]?.id;
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
        let condition = { 
            ledger_id: req.params.id, 
            entity_type: req.query.entity_type,
            date_format: dateFormat,
            is_pdf: true 
        }
        var invoiceData = await ledgersService.ledgersReminder(condition, req.body);

        if (!invoiceData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, error: invoiceData.error, data: [] }
        }
        else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: invoiceData.data };
        }

        // Log Response
        logResponse('info', req, responseData, 'Getting invoice reminder Response')

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Ledgers Dashboard Data request to fetch the overall ledgers values.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function 
 *      ~ Fetch the data from 'ledgers' table and return the data.
 *      ~ Add success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic:
 * - Logging incoming request.
 * - Define the validation rules as follows.
 *    + request_id(query) is mandatory.
 *  - Loop the req.query and using switch case and assign to the condition.
 * 
 *  - Run the validation rules
 *    + If validation success
 *      ~ Call the service function(dashboardData) to fetch the ledgers over data 
 *        # Add the service function(dashboardData) return data to response
 *    + Else
 *      ~ Add error validation to the response.
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
const dashboardData = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, "Getting leders dashbaord anlytics request");

    // Get the `entity_type` from `req.path`.
    const requestSegments = req.path.split('/');
    req.body.entity_type = requestSegments[2];

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
            .withMessage(responseMessages.ledgers.slugNameShouldbe),
    ];

    // Run the validation rules.
    for (let validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    if (errors.isEmpty()) {
        const paymentEntityType = (req.body.entity_type == INVOICES) ? PAYMENT : BILLPAYMENT;
        const dashboardData = await ledgersService.dashboardAnalytics(req.body.entity_type, paymentEntityType);
        if (dashboardData.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: dashboardData.data?.[0]
            };
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: dashboardData.message,
                error: dashboardData.error,
                message: responseMessages.common.noRecordFound,
                data: []
            }
        }

        // Log Response
        logResponse("info", req, responseData, "leders dashbaord anlytics response");

        // Return the response
        responseHandler(res, responseData);

    } else {

        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
});

/**
 * Ledgers Update Status request to update the status of the ledger i.e mark_as_sent, convert_to_draft, stop_recurring, void, approve, reject.
 * overview of API:
 * - Validate the request
 *   + If success
 *     ~ Call the service function to update the specific status of a ledger.
 *     ~ Fetch the updateed ledger data from `ledgers` table and return the data.
 *     ~ Add success to the response
 *   + Else
 *     ~ add error validation to the response
 *   - Return the reponse
 * 
 * Logic:
 * - Logging incoming request.
 * - Define the validation rules as follows.
 *   + request_id (body) is mandatory.
 *   + ledger_id (body) is mandatory, should be uuid, id should exist in ledgers table.
 *   + status_key (body) is mandatory, should be one of the keys - mark_as_sent, convert_to_draft, stop_recurring, void, approve, reject. validate status_value based on the status_key that we get.
 *   + status_value (body) is mandatory.
 * 
 *  - Run the validation rules.
 *    + If validation success
 *      ~ Call the service function to update the status.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Loggig the response.
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
const updateStatus = tryCatch(async (req, res) => {

    let dateFormat = await format.getDateFormat(); // date format

    // Log Request
    logRequest('info', req, "Ledgers status update request");

    // Default Variable
    var responseData;
    var updateData = {};
    var recurringValidation = [];
    let ledgers;
    let approveUpdate;
    let ledgerApprovalTrack = {};

    // Wrinting recurring data rules to the input request
    if (req.body.status_key == 'mark_as_recurring') {

        // Convert 'start_date', 'end_date' in the request to 'YYYY-MM-DD' format.
        req.body.start_date = req.body.start_date ? moment(req.body.start_date, dateFormat).format('YYYY-MM-DD') : req.body.start_date;
        req.body.end_date = req.body.end_date ? moment(req.body.end_date, dateFormat).format('YYYY-MM-DD') : req.body.end_date;

        recurringValidation = [
            check('recurring_data.recurring_cycle_number')
                .notEmpty()
                .withMessage(responseMessages.ledgers.recurring.recurringCycleNumberRequired)
                .isInt()
                .withMessage(responseMessages.ledgers.recurringCycleNumberInvalid),
            check('recurring_data.recurring_cycle_type')
                .notEmpty()
                .withMessage(responseMessages.ledgers.recurring.recurringCycleTypeRequired)
                .isIn(['1', '2', '3', '4'])
                .withMessage(responseMessages.ledgers.recurring.invalidRecurringCycleType),
            // check('recurring_data.recurring_payment')
            //     .notEmpty()
            //     .withMessage(responseMessages.ledgers.recurring.recurringPaymentRequired),
            check('recurring_data.recurring_start_date')
                .notEmpty()
                .withMessage(responseMessages.ledgers.recurring.recurringStartDateRequired),
            check('recurring_data.recurring_end_date')
                .notEmpty()
                .withMessage(responseMessages.ledgers.recurring.recurringEndDateRequired)
        ];
    }

    // Writing validation rules to the input request
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('ledger_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgers.idRequired)
            .isUUID()
            .withMessage(responseMessages.ledgers.idInvalid)
            .custom(async (value) => {
                ledgers = await indexServices.find('ledgers', ['id', 'reference_id', 'approval_level', 'status', 'company_id'], { 'id': value }, null);
                if (!ledgers.status) {
                    return Promise.reject(responseMessages.ledgers.idNotExists);
                }

                if ([VOID, WRITE_OFF].includes(ledgers.data[0]?.status)) {
                    return Promise.reject(responseMessages.ledgers.actionNotAllowed);
                }
                req.body.reference_id = ledgers.data[0]?.reference_id;
                req.body.current_approval_level = ledgers.data[0]?.approval_level;
                req.body.ledger_id = ledgers.data[0]?.id;
                req.body.approval_level = ledgers.data[0]?.approval_level;
                req.body.company_id = ledgers.data[0]?.company_id;
                req.body.status = ledgers.data[0]?.status;
                return true
            }),
        check('write_off_id')
            .optional()
            .custom(async (value) => {
                const write_off = await indexService.find('write_off', ['id'], { id: value });
                if (!write_off.status) {
                    return Promise.reject(responseMessages.ledgers.invalidWriteOffId);
                }
                return true
            }),
        check('loginUserId')
            .notEmpty()
            .withMessage(responseMessages.ledgers.approverRequired)
            .custom(async (value) => {

                if (req.body.status_key == 'approve') {
                    // define `approvedUsers` ids of users who have access to approve the invoice.
                    let approvedUsers = await ledgersService.getApproverIds(req.body);
                    console.log(approvedUsers, req.body, 'approvedUsers')
                    const approvers = approvedUsers?.approval_users;
                    const invoice_approval_id = approvedUsers?.invoice_approval_id;
                    req.body.invoice_approval_id = approvedUsers?.invoice_approval_id;

                    // Check employee has approver access or not.
                    if (!approvers.includes(value)) {
                        return Promise.reject(responseMessages.ledgers.invalidApprover);
                    }

                    // Get the final Approval Level of an `invoice_approval_id`.
                    const approvalLevels = await indexService.find('approval_levels', ['approval_levels.level'], { 'approval_levels.approval_setting_id': invoice_approval_id }, 1, [], null, 'DESC');

                    if (approvalLevels?.data[0]?.level == ledgers.data[0]?.approval_level) {

                        // If approval Update is a final level change approved status to approved
                        approveUpdate = { 'status': 'Approved', 'approved_on': new Date() };
                    } else {
                        // If approval Update is not a final level change approved status to partially approved
                        approveUpdate = { 'status': 'Approval In Progress', 'approval_level': (ledgers.data[0]?.approval_level + 1), 'approved_on': new Date() };
                    }

                    // Prepare the object to store ledger approval track
                    ledgerApprovalTrack = {
                        'ledger_id': ledgers.data[0]?.id,
                        'approval_user_id': req.body.loginUserId
                    }
                }
                return true;
            }),
        check('status_key')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgers.statusUpdateKeyRequired)
            .isIn(['mark_as_sent', 'convert_to_draft', 'stop_recurring', 'void', 'approve', 'reject', 'mark_as_recurring', 'write_off'])
            .withMessage(responseMessages.ledgers.statusUpdateKeyInvalid)
            .custom(async (value) => {
                if (value == 'mark_as_sent') {
                    updateData = {
                        ...updateData, ...{ 'is_sent': true }
                    };
                } else if (value == 'mark_as_recurring') {
                    updateData = {
                        ...updateData, ...{ 'enable_recurring': true }
                    };
                } else if (value == 'convert_to_draft') {

                    // Status of Ledger Should be in 'Submitted' or 'Approved' then only we can draft the ledger
                    if (ledgers.data[0]?.status == PARTIALLY_PAID) {

                        return Promise.reject(responseMessages.ledgers.draftNotAllowedWhenPartiallyPaid);
                    } else if (ledgers.data[0]?.status == PAID) {

                        return Promise.reject(responseMessages.ledgers.draftNotAllowedWhenPaid);
                    } else if (ledgers.data[0]?.status == DRAFTED) {

                        return Promise.reject(responseMessages.ledgers.cannotPerformSameAction);
                    } else if (ledgers.data[0]?.status != APPROVED) {

                        return Promise.reject(responseMessages.ledgers.draftNotAllowed);
                    }
                    updateData = {
                        ...updateData, ...{ 'status': 'Drafted' }
                    };

                } else if (value == 'stop_recurring') {
                    updateData = {
                        ...updateData, ...{ 'enable_recurring': false }
                    };
                } else if (value == 'void') {

                    // Status of Ledger Should be in 'Submitted' or 'Approved' then only we can void the ledger
                    if (ledgers.data[0]?.status == PARTIALLY_PAID) {

                        return Promise.reject(responseMessages.ledgers.voidNotAllowedWhenPartiallyPaid);
                    } else if (ledgers.data[0]?.status == PAID) {

                        return Promise.reject(responseMessages.ledgers.voidNotAllowedWhenPaid);
                    }
                    updateData = {
                        ...updateData, ...{ 'status': 'Void' }
                    };
                } else if (value == 'approve') {
                    updateData = {
                        ...updateData, ...approveUpdate
                    };
                } else if (value == 'reject') {
                    if (req.body.reject_reason != null && req.body.reject_reason != undefined) {

                        updateData = {
                            ...updateData, ...{ 'status': 'Rejected', reject_reason: req.body.reject_reason }
                        };
                    } else {
                        return Promise.reject(responseMessages.ledgers.rejectReasonRequired);
                    }
                } else if (value == 'write_off') {

                    if ([PAID].includes(ledgers.data[0]?.status)) {
                        return Promise.reject(responseMessages.ledgers.writeOffNotAllowed);
                    } else {

                        updateData = {
                            ...updateData, ...{ 'write_off_id': req.body.write_off_id, 'status': 'Write Off' }
                        };
                    }
                }
                return true;
            })
    ];

    validations = [...validations, ...recurringValidation];

    // Run the validation rules.
    for (let validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }

    var errors = validationResult(req);

    if (errors.isEmpty()) {

        const statusUpdate = await ledgersService.updateStatus(req.body, updateData, ledgerApprovalTrack);

        if (statusUpdate.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: statusUpdate.data?.[0]
            };
        } else {
            responseData = {
                statusCode: responseCodes.codeInternalError,
                message: statusUpdate.message,
                error: statusUpdate.error,
                message: responseMessages.common.noRecordFound,
                data: []
            }
        }

        // Log Response
        logResponse("info", req, responseData, "Ledgers status update response");

        // Return the response
        responseHandler(res, responseData);

    } else {

        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
});

/**
 * Send Email Notitification function to send email to current Level Approval Users.
 * 
 * OviewView of function:
 * - Validate hte request.
 *   + If sucessful.
 *     ~ Call the 'sendEmailNotification' service function to send emails to the current approval user.
 *     ~ Prepare the reponse with success data.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Get the `entity_type` from `req.path`.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *   + request_id (body) is mandatory.
 *   + ledger_id (body) is mandatory, should be uuid, id should exist in ledgers table.
 * 
 *  - Run the validation rules.
 *    + If validation success
 *      ~ Call the service function to update the status.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Loggig the response.
 *  - Return response using responseHandler()
 * 
 * Notes :
 *    - Handling expection using try catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const sendEmailNotification = tryCatch(async (req, res) => {

    // Log Request
    logRequest("info", req, "Send Email Notificatiopn for current approval Level Users Request");

    // Default Variable
    var responseData;

    // Get the `entity_type` from `req.path`.
    const requestSegments = req.path.split('/');
    req.body.entity_type = requestSegments[2];

    // Writing validation rules to the input request
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('entity_type')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.ledgers.slugNameRequired)
            .isIn([INVOICES])
            .withMessage(responseMessages.ledgers.slugNameShouldbe),
        check('ledger_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.ledgers.idRequired)
            .isUUID()
            .withMessage(responseMessages.ledgers.idInvalid)
            .custom(async (value) => {
                const ledgers = await indexServices.find('ledgers', ['id', 'reference_id', 'company_id', 'approval_level'], { id: value, entity_type: req.body.entity_type });
                if (!ledgers.status) {
                    return Promise.reject(responseMessages.ledgers.idNotExists);
                }
                req.body.company_id = ledgers.data[0]?.company_id;
                req.body.approval_level = ledgers.data[0]?.approval_level;
                return true
            }),
    ];

    // Run the validation rules.
    for (let validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    /**
     * If Validation is success
     *    + Store invited employee details in 'invited_employee' table
     * If Validation Fails
     *    + Return the error message.
     */
    if (errors.isEmpty()) {

        const sendEmail = await ledgersService.sendEmailNotification(req.body);

        // Log Response
        logResponse("info", req, responseData, "Send Email Notificatiopn for current approval Level Users response");

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
})

module.exports = { store, update, destroy, listing, index, ledgersTheme, ledgersReminder, getUninvoicedTimesheets, getEmployeeDetails, getLedgerItemDetailsByTimesheetIds, dashboardData, updateStatus, sendEmailNotification };
