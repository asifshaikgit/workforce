const indexService = require('../../services/index');
const companiesServices = require('../../services/companies/companiesServices');
const { check, validationResult } = require('express-validator');
const { logRequest, logResponse } = require('../../../../../utils/log');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { responseHandler } = require("../../../../responseHandler");
const { tryCatch } = require("../../../../../utils/tryCatch");
const { pagination } = require("../../../../../config/pagination");
const InvalidRequestError = require("../../../../../error/InvalidRequestError");
const { regexPatterns } = require('../../../../../constants/regexPatterns');

/**
 * Dashboard fucntion to get the company dashboard details.
 * 
 * Overview of function:
 */
const dashboardData = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, "Get Companies Dashboard Data");

    const requestSegments = req.path.split('/');
    const entity_type = requestSegments[2];
    req.query.entity_type = entity_type;

    // Default Variable
    var responseData;

    // Writing validation rules to the input request.
    var validations = [
        check("request_id")
            .trim().escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('entity_type')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.slugNameRequired)
            .isIn(['client', 'vendor', 'end-client'])
            .withMessage(responseMessages.companies.slugNameShouldbe),
        check('id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.companies.companyIdRequired)
            .isUUID()
            .withMessage(responseMessages.companies.companyIDInvalid)
            .custom(async value => {
                const companyData = await indexService.find('companies', ['id'], { id: value, entity_type: req.query.entity_type });
                if (!companyData.status) {
                    return Promise.reject(responseMessages.companies.companyIdNotExists);
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
        var dashboardData = await companiesServices.dashboard(req.query);
        if (dashboardData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, data: dashboardData }
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.somethindWentWrong, error: companiesData.error }
        }


        // Log Response
        logResponse("info", req, responseData, "Companies Dashborad Data.");

        // Return the response
        responseHandler(res, responseData);

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }

});

/**
 * Store function to create a new Company Details record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'store' service function to create a new Company Details record.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Extract the 'slug_name' from the URL path and add it to the request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'slug_name' (body), must not be empty and should be one of ['client', 'vendor', 'end-client'].
 *    + 'name' (body), must not be empty and should:
 *       - Meet specific criteria (additional details can be provided here, e.g., minimum length, character restrictions).
 *       - Be unique, i.e., not already existing in the 'companies' table.
 *    + 'reference_id' (body), must not be empty and should be unique, i.e., not already existing in the 'companies' table.
 *    + 'net_pay_terms_id' (body), if the 'slug_name' is 'vendor', it must not be empty, should be a valid number, and should exist in the 'net_pay_terms' table.
 *    + 'same_as_above' (body), must not be empty and should be a boolean value (true or false).
 *    + Validation for billing address:
 *      - 'billing_address.*.address_line_one' (body), must not be empty and should meet specific criteria.
 *      - 'billing_address.*.address_line_two' (body), must not be empty and should meet specific criteria.
 *      - 'billing_address.*.city' (body), must not be empty and should consist of alphabets, hyphens, forward slashes, and spaces.
 *      - 'billing_address.*.state_id' (body), must not be empty, should be an integer, and should exist in the 'states' table.
 *      - 'billing_address.*.country_id' (body), must not be empty, should be an integer, and should exist in the 'countries' table.
 *      - 'billing_address.*.zip_code' (body), must not be empty and should:
 *         - Consist of numbers and spaces.
 *         - Have a length between a specific range (e.g., 5 to 10 characters).
 *    + Validation for shipping address (conditional based on 'same_as_above'(req.body)):
 *      - If 'same_as_above' is false, validate the following fields:
 *        - 'shipping_address.*.address_line_one' (body), must not be empty and should meet specific criteria.
 *        - 'shipping_address.*.address_line_two' (body), must not be empty and should meet specific criteria.
 *        - 'shipping_address.*.city' (body), must not be empty and should consist of alphabets, hyphens, forward slashes, and spaces.
 *        - 'shipping_address.*.state_id' (body), must not be empty, should be an integer, and should exist in the 'states' table.
 *        - 'shipping_address.*.country_id' (body), must not be empty, should be an integer, and should exist in the 'countries' table.
 *        - 'shipping_address.*.zip_code' (body), must not be empty and should:
 *          - Consist of numbers and spaces.
 *          - Have a length between a specific range (e.g., 5 to 10 characters).
 *    + 'documents.*.new_document_id' (body), if not empty, should be a valid UUID and should exist in the 'temp_upload_documents' table.
 *
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the 'store' service function to create a new Company Details record.
 *    + If successful:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with an error message.
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
const store = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "Store companies details request");
    /* Log Request */

    const requestSegments = req.path.split('/');
    const slug = requestSegments[2];
    req.body.slug_name = slug;

    /* Default Variable */
    var responseData = "";
    /* Default Variable */

    /* Writing validation conditions to the input request */
    var validations = [
        check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check('slug_name')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.slugNameRequired)
            .isIn(['client', 'vendor', 'end-client'])
            .withMessage(responseMessages.companies.slugNameShouldbe),
        check('name')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.companies.companyNameRequired)
            .not().matches(regexPatterns.specialCharactersRegex).withMessage(responseMessages.companies.companyNameInvalid)
            .custom(async value => {
                const companyData = await indexService.find('companies', ['id'], { name: value, entity_type: req.body.slug_name });
                if (companyData.status) {
                    return Promise.reject(responseMessages.companies.companyNameExists);
                }
                return true
            }),
        // check('reference_id')
        //     .trim()
        //     .escape()
        //     .notEmpty()
        //     .withMessage(responseMessages.companies.referenceIdRequired)
        //     .custom(async value => {
        //         const companyData = await indexService.find('companies', ['id'], { reference_id: value, entity_type: req.body.slug_name });
        //         if (companyData.status) {
        //             return Promise.reject(responseMessages.companies.referenceIdExists);
        //         }
        //         return true;
        //     }),
        check('net_pay_terms_id')
            .trim().escape()
            .custom(async value => {
                if (req.body.slug_name == 'vendor') {
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.bills.netPayTermsRequired);
                    } else if (isNaN(value)) {
                        return Promise.reject(responseMessages.bills.netPayTermsInvalid);
                    } else {
                        const netPayTermsData = await indexService.find('net_pay_terms', ['id'], { id: value });
                        if (!netPayTermsData.status) {
                            return Promise.reject(responseMessages.bills.netPayTermsDoesNotExist);
                        }
                    }
                }
                return true
            }),
        // check("is_active")
        //     .trim()
        //     .escape()
        //     .notEmpty()
        //     .withMessage(responseMessages.companies.isActivestatusRequired)
        //     .isBoolean()
        //     .withMessage(responseMessages.companies.isActivestatusInvalid),
        check("same_as_above")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.sameAsAboveRequired)
            .isBoolean()
            .withMessage(responseMessages.companies.sameAsAboveInvalid),
        check('billing_address')
            .notEmpty()
            .withMessage(responseMessages.companies.billingAddressArrayRequired)
            .custom(async (array) => {
                // Custom validation function for the 'bank_information' array
                if (!Array.isArray(array)) {
                    return Promise.reject(
                        responseMessages.companies.billingAddressArray
                    )
                }
            }),
        check('billing_address.*.address_line_one')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.billingAddressLineOneRequired)
            .not().matches(regexPatterns.specialCharactersRegex)
            .withMessage(responseMessages.companies.billingAddressLineOneInvalid),
        check('billing_address.*.address_line_two')
            .optional()
            .not()
            .matches(regexPatterns.specialCharactersRegex)
            .withMessage(responseMessages.companies.billingAddressLineTwoInvalid),
        check('billing_address.*.city')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.billingCityRequired)
            .matches(regexPatterns.alphaCharactersAndSpacesOnly)
            .withMessage(responseMessages.companies.billingCityInvalid),
        //.notEmpty().withMessage(responseMessages.clients.commcityRequired)
        check('billing_address.*.state_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.companies.billingStateRequired)
            .isInt()
            .withMessage(responseMessages.companies.billingStateInvalid)
            .custom(async (value) => {
                const state = await indexService.find('states', ['id'], { id: value });
                if (!state.status) {
                    return Promise.reject(responseMessages.companies.billingStateIdNotExists);
                }
                return true
            }),
        check('billing_address.*.country_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.companies.billingCountryRequired)
            .isInt()
            .withMessage(responseMessages.companies.billingCountryInvalid)
            .custom(async (value) => {
                const countryData = await indexService.find('countries', ['id'], { id: value });
                if (!countryData.status) {
                    return Promise.reject(responseMessages.companies.billingCountryNotExists);
                }
            }),
        check("billing_address.*.zip_code")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.billingZipCodeRequired)
            .matches(regexPatterns.numbersSpaceRegex)
            .withMessage(responseMessages.companies.billingZipCodeInvalid)
            .isLength({ min: 5, max: 10 })
            .withMessage(responseMessages.companies.billingZipCodeShouldBe),
        check('shipping_address')
            .custom(async (arrays) => {
                // Custom validation function for the 'shipping_address' array
                if (req.body.same_as_above == 'false') {
                    if (arrays != '' && arrays != null && arrays != undefined) {
                        if (!Array.isArray(arrays)) {
                            return Promise.reject(
                                responseMessages.companies.shippingAddressArray
                            )
                        }
                    } else {
                        return Promise.reject(
                            responseMessages.companies.shippingAddressArrayRequired
                        )
                    }
                }
                return true
            }),
        check('shipping_address.*.address_line_one')
            .trim()
            .custom((value, { req }) => {
                if (req.body.same_as_above == 'false') {
                    // If same_as_above is false, validate the address_line_one field.
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.companies.shipaddressLineOneRequired);
                    } else if (regexPatterns.specialCharactersRegex.test(value)) {
                        return Promise.reject(responseMessages.companies.shipaddressLineOneInvalid);
                    }
                }
                return true;
            }),
        check('shipping_address.*.address_line_two')
            .trim()
            .custom((value, { req }) => {
                if (req.body.same_as_above == 'false') {
                    // If same_as_above is false, validate the address_line_two field.
                    if (value != '' || value != null) {
                        if (regexPatterns.specialCharactersRegex.test(value)) {
                            return Promise.reject(responseMessages.companies.shipaddressLineTwoInvalid);
                        }
                    }
                }
                return true;
            }),
        check('shipping_address.*.city')
            .trim()
            .custom((value, { req }) => {
                if (req.body.same_as_above == 'false') {
                    // If same_as_above is false, validate the city field.
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.companies.shipcityRequired);
                    } else if (!regexPatterns.alphaCharactersAndSpacesOnly.test(value)) {
                        return Promise.reject(responseMessages.companies.shipcityInvalid);
                    }
                }
                return true;
            }),
        check('shipping_address.*.state_id')
            .trim()
            .custom(async (value) => {
                if (req.body.same_as_above == 'false') {
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.companies.shipstateRequired);
                    } else if (!Number.isInteger(Number(value))) {
                        return Promise.reject(responseMessages.companies.shipstateInvalid);
                    } else {
                        const state = await indexService.find('states', ['id'], { id: value });
                        if (!state.status) {
                            return Promise.reject(responseMessages.companies.shipstateIdNotExists);
                        }
                    }
                }
                return true;
            }),
        check('shipping_address.*.country_id')
            .trim()
            .custom(async (value) => {
                if (req.body.same_as_above == 'false') {
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.companies.shipcountryRequired);
                    } else if (!Number.isInteger(Number(value))) {
                        return Promise.reject(responseMessages.companies.shipcountryInvalid);
                    } else {
                        const countryData = await indexService.find('countries', ['id'], { id: value });
                        if (!countryData.status) {
                            return Promise.reject(responseMessages.companies.shipcountryIdNotExists);
                        }
                    }
                }
                return true;
            }),
        check('shipping_address.*.zip_code')
            .trim()
            .custom((value, { req }) => {
                if (req.body.same_as_above == 'false') {
                    // If same_as_above is false, validate the zipcode field.
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.companies.shipzipCodeRequired);
                    } else if (!regexPatterns.numbersSpaceRegex.test(value)) {
                        return Promise.reject(responseMessages.companies.shipzipCodeInvalid);
                    } else if (value.length < 5 || value.length > 10) {
                        return Promise.reject(responseMessages.companies.shipZipCodeShouldBe);
                    }
                }
                return true;
            }),
        check('documents.*.new_document_id')
            .trim()
            .escape()
            .custom(async (value) => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        return indexService.find('temp_upload_documents', ['*'], { id: value }, null, [], null, null, null, false).then((documentsData) => {
                            if (!documentsData.status) {
                                return Promise.reject(responseMessages.employee.documents.newDocumentIdNotExists);
                            }
                        });
                    } else {
                        return Promise.reject(responseMessages.employee.documents.newDocumentIdInvalid);
                    }
                } else {
                    return true;
                }
            })
    ];
    /* Writing validation conditions to the input request */

    /*Run the validation rules. */
    for (let validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    /*Run the validation rules. */

    if (errors.isEmpty()) {
        var companiesData = await companiesServices.store(req.body);
        if (companiesData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully, data: companiesData.data[0] }
        } else {
            responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: companiesData.error }
        }


        /* Log Response */
        logResponse("info", req, responseData, "clients Create Response.");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Update function to modify a Company Details record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'update' service function to modify the Company Details record.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Extract the 'slug_name' from the URL path and add it to the request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'slug_name' (body), must not be empty and should be one of ['client', 'vendor', 'end-client'].
 *    + 'id' (body), must not be empty, should be a valid UUID, and should exist in the 'companies' table.
 *    + 'name' (body), must not be empty and should:
 *       - Meet specific criteria (additional details can be provided here, e.g., minimum length, character restrictions).
 *       - Be unique within the scope of the 'entity_type' and not match the name of the company being updated.
 *    + 'reference_id' (body), must not be empty and should be unique within the scope of the 'entity_type' and not match the reference_id of the company being updated.
 *    + 'net_pay_terms_id' (body), if the 'slug_name' is 'vendor', it must not be empty, should be a valid number, and should exist in the 'net_pay_terms' table.
 *    + 'same_as_above' (body), must not be empty and should be a boolean value (true or false).
 *    + Validation for billing address:
 *      - 'billing_address.*.id' (body), if not empty, should be a valid ID and exist in the 'company_address' table with an 'address_type' of 1.
 *      - 'billing_address.*.address_line_one' (body), must not be empty and should meet specific criteria.
 *      - 'billing_address.*.address_line_two' (body), should meet specific criteria.
 *      - 'billing_address.*.city' (body), must not be empty and should consist of alphabets, hyphens, forward slashes, and spaces.
 *      - 'billing_address.*.state_id' (body), must not be empty, should be an integer, and should exist in the 'states' table.
 *      - 'billing_address.*.country_id' (body), must not be empty, should be an integer, and should exist in the 'countries' table.
 *      - 'billing_address.*.zip_code' (body), must not be empty and should:
 *         - Consist of numbers and spaces.
 *         - Have a length between a specific range (e.g., 5 to 10 characters).
 *    + Validation for shipping address (conditional based on 'same_as_above' (req.body)):
 *      - If 'same_as_above' is false, validate the following fields:
 *        - 'shipping_address.*.id' (body), if not empty, should be a valid ID and exist in the 'company_address' table with an 'address_type' of 2.
 *        - 'shipping_address.*.address_line_one' (body), must not be empty and should meet specific criteria.
 *        - 'shipping_address.*.address_line_two' (body), should meet specific criteria.
 *        - 'shipping_address.*.city' (body), must not be empty and should consist of alphabets, hyphens, forward slashes, and spaces.
 *        - 'shipping_address.*.state_id' (body), must not be empty, should be an integer, and should exist in the 'states' table.
 *        - 'shipping_address.*.country_id' (body), must not be empty, should be an integer, and should exist in the 'countries' table.
 *        - 'shipping_address.*.zip_code' (body), must not be empty and should:
 *          - Consist of numbers and spaces.
 *          - Have a length between a specific range (e.g., 5 to 10 characters).
 *
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the 'update' service function to modify the Company Details record.
 *    + If successful:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with an error message.
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
const update = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "Update company details request.");
    /* Log Request */

    const requestSegments = req.path.split('/');
    const slug = requestSegments[2];
    req.body.slug_name = slug;

    /* Default Variable */
    var responseData = '';
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check("request_id")
            .trim().escape()
            .notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check('slug_name')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.slugNameRequired)
            .isIn(['client', 'vendor', 'end-client'])
            .withMessage(responseMessages.companies.slugNameShouldbe),
        check('id')
            .trim().escape()
            .notEmpty().withMessage(responseMessages.companies.companyIdRequired)
            .isUUID().withMessage(responseMessages.companies.companyIDInvalid)
            .custom(async value => {
                const companyData = await indexService.find('companies', ['id'], { id: value, entity_type: req.body.slug_name });
                if (!companyData.status) {
                    return Promise.reject(responseMessages.companies.companyIdNotExists);
                }
            }),
        check('name')
            .trim().escape()
            .notEmpty().withMessage(responseMessages.companies.companyNameRequired)
            .not().matches(regexPatterns.specialCharactersRegex).withMessage(responseMessages.companies.companyNameInvalid)
            .custom(async value => {
                const companyData = await indexService.find('companies', ['id'], { name: value, entity_type: req.body.slug_name });
                if (companyData.status) {
                    if (companyData.data[0].id != req.params.id) {
                        return Promise.reject(responseMessages.companies.companyNameExists);
                    }
                }
                return true;
            }),
        // check('reference_id')
        //     .trim().escape()
        //     .notEmpty().withMessage(responseMessages.companies.referenceIdRequired)
        //     .custom(async value => {
        //         const companyData = await indexService.find('companies', ['id'], { reference_id: value, entity_type: req.body.slug_name });
        //         if (companyData.status) {
        //             if (companyData.data[0].id != req.params.id) {
        //                 return Promise.reject(responseMessages.companies.referenceIdExists);
        //             }
        //         }
        //         return true;
        //     }),
        check('net_pay_terms_id')
            .trim().escape()
            .custom(async (value) => {
                if (req.body.slug_name == 'vendor') {
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.bills.netPayTermsRequired);
                    } else if (isNaN(value)) {
                        return Promise.reject(responseMessages.bills.netPayTermsInvalid);
                    } else {
                        const netPayTermsData = await indexService.find('net_pay_terms', ['id'], { id: value });
                        if (!netPayTermsData.status) {
                            return Promise.reject(responseMessages.bills.netPayTermsDoesNotExist);
                        }
                    }
                }
                return true
            }),
        check("same_as_above")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.sameAsAboveRequired)
            .isBoolean()
            .withMessage(responseMessages.companies.sameAsAboveInvalid),
        check('billing_address')
            .notEmpty()
            .withMessage(responseMessages.companies.billingAddressArrayRequired)
            .custom(async (array) => {
                // Custom validation function for the 'bank_information' array
                if (!Array.isArray(array)) {
                    return Promise.reject(
                        responseMessages.companies.billingAddressArray
                    )
                }
            }),
        check('billing_address.*.id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.companies.billingAddressIdRequired)
            .isInt()
            .withMessage(responseMessages.companies.billingAddressIdInvalid)
            .custom(value => {
                if (value != null && value != '') {
                    return indexService.find('company_address', ['id'], { id: value, address_type: 1 }).then(companyData => {
                        if (!companyData.status) {
                            return Promise.reject(responseMessages.companies.billingAddressIdNotExists);
                        }
                    });
                }
                return true;
            }),
        check('billing_address.*.address_line_one')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.billingAddressLineOneRequired)
            .not().matches(regexPatterns.specialCharactersRegex)
            .withMessage(responseMessages.companies.billingAddressLineOneInvalid),
        check('billing_address.*.address_line_two')
            .optional()
            .not()
            .matches(regexPatterns.specialCharactersRegex)
            .withMessage(responseMessages.companies.billingAddressLineTwoInvalid),
        check('billing_address.*.city')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.billingCityRequired)
            .matches(regexPatterns.alphaCharactersAndSpacesOnly)
            .withMessage(responseMessages.companies.billingCityInvalid),
        //.notEmpty().withMessage(responseMessages.clients.commcityRequired)
        check('billing_address.*.state_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.companies.billingStateRequired)
            .isInt()
            .withMessage(responseMessages.companies.billingStateInvalid)
            .custom(async (value) => {
                const state = await indexService.find('states', ['id'], { id: value });
                if (!state.status) {
                    return Promise.reject(responseMessages.companies.billingStateIdNotExists);
                }
                return true
            }),
        check('billing_address.*.country_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.companies.billingCountryRequired)
            .isInt()
            .withMessage(responseMessages.companies.billingCountryInvalid)
            .custom(async value => {
                const countryData = await indexService.find('countries', ['id'], { id: value });
                if (!countryData.status) {
                    return Promise.reject(responseMessages.companies.billingCountryNotExists);
                }
            }),

        check("billing_address.*.zip_code")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.billingZipCodeRequired)
            .matches(regexPatterns.numbersSpaceRegex)
            .withMessage(responseMessages.companies.billingZipCodeInvalid)
            .isLength({ min: 5, max: 10 })
            .withMessage(responseMessages.companies.billingZipCodeShouldBe),
        check('shipping_address')
            .custom(async (arrays) => {
                // Custom validation function for the 'shipping_address' array
                if (req.body.same_as_above == 'false') {
                    if (arrays != '' && arrays != null && arrays != undefined) {
                        if (!Array.isArray(arrays)) {
                            return Promise.reject(
                                responseMessages.companies.shippingAddressArray
                            )
                        }
                    } else {
                        return Promise.reject(
                            responseMessages.companies.shippingAddressArrayRequired
                        )
                    }
                }
                return true
            }),

        check('shipping_address.*.id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.companies.shippingAddressIdRequired)
            .isInt()
            .withMessage(responseMessages.companies.shippingAddressIdInvalid)
            .custom(value => {
                if (value != null && value != '') {
                    return indexService.find('company_address', ['id'], { id: value, address_type: 2 }).then(companyAddress => {
                        if (!companyAddress.status) {
                            return Promise.reject(responseMessages.companies.ShippingaddressIdNotExists);
                        }
                    });
                }
                return true;
            }),
        check('shipping_address.*.address_line_one')
            .trim()
            .custom((value, { req }) => {
                if (req.body.same_as_above == 'false') {
                    // If same_as_above is false, validate the address_line_one field.
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.companies.shipaddressLineOneRequired);
                    } else if (regexPatterns.specialCharactersRegex.test(value)) {
                        return Promise.reject(responseMessages.companies.shipaddressLineOneInvalid);
                    }
                }
                return true;
            }),
        check('shipping_address.*.address_line_two')
            .trim()
            .custom((value, { req }) => {
                if (req.body.same_as_above === 'false') {
                    // If same_as_above is false, validate the address_line_two field.
                    if (value != '' || value != null) {
                        if (regexPatterns.specialCharactersRegex.test(value)) {
                            return Promise.reject(responseMessages.companies.shipaddressLineTwoInvalid);
                        }
                    }
                }
                return true;
            }),
        check('shipping_address.*.city')
            .trim()
            .custom((value, { req }) => {
                if (req.body.same_as_above === 'false') {
                    // If same_as_above is false, validate the city field.
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.companies.shipcityRequired);
                    } else if (!regexPatterns.alphaCharactersAndSpacesOnly.test(value)) {
                        return Promise.reject(responseMessages.companies.shipcityInvalid);
                    }
                }
                return true;
            }),
        check('shipping_address.*.state_id')
            .trim()
            .custom(async (value) => {
                if (req.body.same_as_above === 'false') {
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.companies.shipstateRequired);
                    } else if (!Number.isInteger(Number(value))) {
                        return Promise.reject(responseMessages.companies.shipstateInvalid);
                    } else {
                        const state = await indexService.find('states', ['id'], { id: value });
                        if (!state.status) {
                            return Promise.reject(responseMessages.companies.shipstateIdNotExists);
                        }
                    }
                }
                return true;
            }),
        check('shipping_address.*.country_id')
            .trim()
            .custom(async (value) => {
                if (req.body.same_as_above === 'false') {
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.companies.shipcountryRequired);
                    } else if (!Number.isInteger(Number(value))) {
                        return Promise.reject(responseMessages.companies.shipcountryInvalid);
                    } else {
                        const countryData = await indexService.find('countries', ['id'], { id: value });
                        if (!countryData.status) {
                            return Promise.reject(responseMessages.companies.shipcountryIdNotExists);
                        }
                    }
                }
                return true;
            }),
        check('shipping_address.*.zip_code')
            .trim()
            .custom((value, { req }) => {
                if (req.body.same_as_above === 'false') {
                    // If same_as_above is false, validate the zipcode field.
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.companies.shipzipCodeRequired);
                    } else if (!regexPatterns.numbersSpaceRegex.test(value)) {
                        return Promise.reject(responseMessages.companies.shipzipCodeInvalid);
                    } else if (value.length < 5 || value.length > 10) {
                        return Promise.reject(responseMessages.companies.shipZipCodeShouldBe);
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
        const condition = { id: req.params.id };
        var response = await companiesServices.update(req.body, condition);
        if (response.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully }
        } else {
            responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error }
        }

        /* Log Response */
        logResponse("info", req, responseData, "Update company details Response.");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Index function to retrieve company details based on specific criteria.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Retrieve company details based on the provided criteria.
 *      ~ Prepare the response with the retrieved data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Extract the 'slug_name' from the URL path and add it to the request's query parameters.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'slug_name' (query), must not be empty and should be one of ['client', 'vendor', 'end-client'].
 *    + 'id' (query), must not be empty, should be a valid UUID, and should exist in the 'companies' table with the matching 'entity_type'(req.query.slug_name).
 *
 * - Run the validation rules.
 * - If validation is successful:
 *    + Create a condition object which contains company id(req.query.id)
 *    + Retrieve company details based on the provided condition.
 *    + If successful:
 *      - Prepare the response with the retrieved data.
 *    + Else:
 *      - Prepare the response with an error message.
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
const index = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "Getting company details index request");
    /* Log Request */

    const requestSegments = req.path.split('/');
    const slug = requestSegments[2];
    req.query.slug_name = slug;

    /* Default Variable */
    var responseData = '';
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check("request_id")
            .trim().escape()
            .notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check('slug_name')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.slugNameRequired)
            .isIn(['client', 'vendor', 'end-client'])
            .withMessage(responseMessages.companies.slugNameShouldbe),
        check('id')
            .trim().escape()
            .notEmpty().withMessage(responseMessages.companies.companyIdRequired)
            .isUUID().withMessage(responseMessages.companies.companyIDInvalid)
            .custom(async value => {
                const companyData = await indexService.find('companies', ['id'], { id: value, entity_type: req.query.slug_name });
                if (!companyData.status) {
                    return Promise.reject(responseMessages.companies.companyIdNotExists);
                }
            }),
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
        var condition = { 'companies.id': req.query.id };
        var companyData = await companiesServices.index(condition);
        responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: companyData.data }

        /* Log Response */
        logResponse("info", req, responseData, "Getting company details index Response.");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity,);
    }
});

/**
 * Listing function to retrieve a list of company details based on specific criteria.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Retrieve a list of company details based on the provided criteria.
 *      ~ Prepare the response with the retrieved data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Extract the 'slug_name' from the URL path and add it to the request's query parameters.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'slug_name' (query), must not be empty and should be one of ['client', 'vendor', 'end-client'].
 *    + 'status' (query), if provided, must be either 'true' or 'false' (conditional validation).
 *
 * - Run the validation rules.
 * - If validation is successful:
 *    + Set additional variables for pagination, search, and status based on query parameters.
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
const listing = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "Getting Company details listing request");
    /* Log Request */

    const requestSegments = req.path.split('/');
    const entity_type = requestSegments[2];
    req.query.entity_type = entity_type;

    /* Default Variable */
    var responseData = '';
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
            entity_type: req.query.slug_name
        };
        let limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
        let page = (req.query.page) ? (req.query.page) : pagination.page;
        condition.entity_type = (req.query.entity_type && req.query.entity_type != '') ? req.query.entity_type : null;
        condition.search = (req.query.search && req.query.search != '') ? `'${req.query.search}'` : null;
        if (req.query.status && req.query.status != '') {
            condition.status = req.query?.status ? `'${req.query?.status}'` : null;
            condition.is_draft = req.query.status == 2 ? true : null;
        } else {
            condition.status = condition.is_draft = null;
        }
        /* Condition */

        var companyData = await companiesServices.listing(condition, page, limit);
        if (companyData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: companyData.data, pagination: companyData.pagination_data };
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.noRecordFound, data: [] }
        }

        /* Log Response */
        logResponse('info', req, responseData, "Getting Company details listing Response");
        /* Log Response */
        /**
         * Updates client data and addresses in the database.
         * @param {Object} body - The request body containing the updated client data and addresses.
         * @returns {Promise} - A promise that resolves to the repository response.
         */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity,);
    }
});

/**
 * Update Company Status function to modify the status of a company (Client/Vendor/End-client).
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'updateStatus' service function to update the status of Company.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Extract the 'slug_name' from the URL path and add it to the request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *   - 'request_id' (body): Must not be empty.
 *   - 'slug_name' (body): Must not be empty and should be one of ['client', 'vendor', 'end-client'].
 *   - 'id' (params): Must not be empty, should be a valid UUID, and should exist in the 'companies' table with the specified entity type ('slug_name').
 *   - 'is_active' (body): Must not be empty and should be a valid boolean.
 *
 * - Run the validation rules.
 * - If validation is successful:
 *   - Define the condition object for identifying the company based on the 'id' parameter.
 *   - Call the 'updateStatus' service function to modify the company's status.
 *   - Prepare the response with success data.
 *   - Log the response.
 *   - Return the response using `responseHandler()`.
 * - If validation fails:
 *   - Add error validation to the response.
 *
 * Notes:
 * - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const updateStatus = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "Update Company Status request.");
    /* Log Request */

    const requestSegments = req.path.split('/');
    const slug = requestSegments[2];
    req.body.slug_name = slug;

    /* Default Variable */
    var responseData = '';
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check("request_id").trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check('slug_name')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.slugNameRequired)
            .isIn(['client', 'vendor', 'end-client'])
            .withMessage(responseMessages.companies.slugNameShouldbe),
        check('id')
            .trim().escape()
            .notEmpty().withMessage(responseMessages.companies.companyIdRequired)
            .isUUID().withMessage(responseMessages.companies.companyIDInvalid)
            .custom(async value => {
                const companyData = await indexService.find('companies', ['id'], { id: value, entity_type: req.body.slug_name });
                if (!companyData.status) {
                    return Promise.reject(responseMessages.companies.companyIdNotExists);
                }
            }),
        check("status")
            .trim().escape()
            .notEmpty().withMessage(responseMessages.clients.isActivestatusRequired)
            .isIn(['Active', 'In Active'])
            .withMessage(responseMessages.clients.isActivestatusInvalid),
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
        var response = await companiesServices.updateStatus(req.body, condition);
        if (response.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully }
        } else {
            responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error }
        }


        /* Log Response */
        logResponse("info", req, responseData, "Update Company Status Response.");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Delete function to remove a Company Contact Details record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Define the condition object for identifying the record to be deleted.
 *      ~ Call the 'destroy' service function to delete the Company Contact Details record.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Extract the 'slug_name' from the URL path and add it to the request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'slug_name' (body), must not be empty and should be one of ['client', 'vendor', 'end-client'].
 *    + 'id' (params), must not be empty, should be a valid integer, and should exist in the 'company_contacts' table. The 'display_name' of the contact is added to the request.
 *    + 'company_id' (body), must not be empty, should be a valid UUID, and should exist in the 'companies' table.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *    + Define the condition object for identifying the record to be deleted based on the 'id' parameter.
 *    + Call the 'destroy' service function to delete the Company Contact Details record.
 *    + Prepare the response with success data.
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
const destroy = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "Delete company details request");
    /* Log Request */

    const requestSegments = req.path.split('/');
    const slug = requestSegments[2];
    req.body.slug_name = slug;

    /* Default Variable */
    var responseData = '';
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check('request_id')
            .trim().escape()
            .notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check('slug_name')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.slugNameRequired)
            .isIn(['client', 'vendor', 'end-client'])
            .withMessage(responseMessages.companies.slugNameShouldbe),
        check('id')
            .trim().escape()
            .notEmpty().withMessage(responseMessages.companies.companyIdRequired)
            .isUUID().withMessage(responseMessages.companies.companyIDInvalid)
            .custom(async value => {
                const companyData = await indexService.find('companies', ['id', 'name', 'reference_id'], { id: value, entity_type: req.body.slug_name });
                if (!companyData.status) {
                    return Promise.reject(responseMessages.companies.companyIdNotExists);
                }
                req.body.company_name = companyData.data[0].name
                req.body.company_reference_id = companyData.data[0].reference_id

                if (req.body.slug_name == 'client') {
                    const placementData = await indexService.find('placements', ['id'], { client_id: value });
                    if (placementData.status) {
                        return Promise.reject(responseMessages.companies.companyIdExistsPlacements);
                    }

                    const invoiceData = await indexService.find('ledgers', ['id'], { company_id: value });
                    if (invoiceData.status) {
                        return Promise.reject(responseMessages.companies.companyIdExistsInvoices);
                    }
                }

                if (req.body.slug_name == 'vendor') {
                    const billstData = await indexService.find('ledgers', ['id'], { company_id: value });
                    if (billstData.status) {
                        return Promise.reject(responseMessages.companies.companyIdExistsBills);
                    }
                }
            })
    ];
    /* Writing validation conditions to the input request */

    /*Run the validation rules. */
    for (let validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    /*Run the validation rules. */

    /**
     * If validation is success
     * + Delete  clients in the collection.  
     * If Validation Fails
     * + Return the error message.
    */
    if (errors.isEmpty()) {
        const condition = { id: req.params.id }
        var response = await companiesServices.destroy(req.body, condition);
        if (response.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.deletedSuccessfully }
        } else {
            responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error }
        }

        /* Log Response */
        logResponse('info', req, responseData, "Delete company details Response");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});


/**
* Get company dropdown data.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'dropdown' service function to get the Company dropdown.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 * 
* Logic:
* - Log the incoming request.
* - Extract the 'slug_name' from the URL path and add it to the request.
* - Set default variables for `responseData`.
* - Define the validation rules as follows:
*    + 'request_id' (query), must not be empty.
*    + 'slug_name' (query), must not be empty and should be one of ['client', 'vendor', 'end-client'].
* 
* - Run the validation rules.
* - If validation is successful:
*   + Determine the 'condition' object based on the 'search' query parameter.
*   + Call the 'dropdown' service function to retrieve company dropdown data.
*   + If data exists:
      ~ Prepare the response with fetched data.
    + Else:
      ~ Prepare the response with error message with empty data
*   + Log the response.
*   + Return the response using `responseHandler()`.
* - If validation fails:
*   + Add error validation to the response.
*
* Notes:
* - Exception handling using try-catch.
*
* @param {Request} req - The request object.
* @param {Response} res - The response object.
* @returns {JSON} JSON
* @throws {InvalidRequestError} - If there are validation errors in the request.
*/
const dropdown = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "Getting company dropdown request");
    /* Log Request */

    const requestSegments = req.path.split('/');
    const slug = requestSegments[2];
    req.query.slug_name = slug;

    /* Writing validation rules to the input request */
    var validations = [
        check('request_id')
            .trim().escape()
            .notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check('slug_name')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.slugNameRequired)
            .isIn(['client', 'vendor', 'end-client'])
            .withMessage(responseMessages.companies.slugNameShouldbe)
    ];
    /* Writing validation conditions to the input request */

    /*Run the validation rules. */
    for (let validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    /*Run the validation rules. */

    /**
     * If validation is success
     * + Delete  clients in the collection.  
     * If Validation Fails
     * + Return the error message.
    */
    if (errors.isEmpty()) {

        if (req.query.search != undefined && req.query.search != '') {
            var condition = { global_search: `"name" ilike '%${req.query.search}%'`, status: 'Active', entity_type: req.query.slug_name };
        } else {
            var condition = { status: 'Active', entity_type: req.query.slug_name };
        }


        var companyData = await companiesServices.dropdown(condition);
        if (companyData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: companyData.data };
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: companyData.message, error: companyData.error, message: responseMessages.common.noRecordFound, data: [] }
        }

        /* Log Response */
        logResponse('info', req, responseData, "Getting company dropdown response");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Update Company Profile function to modify company profile information.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful:
 *      ~ Define the condition object for identifying the company's profile to update.
 *      ~ Call the 'updateProfile' service function to update the company's profile.
 *      ~ Prepare the response with success data.
 *    + Else:
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Extract the 'slug_name' from the URL path and add it to the request.
 * - Set default variables for 'responseData'.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'slug_name' (body), must not be empty and should be one of ['client', 'vendor', 'end-client'].
 *    + 'id' (params), must not be empty, should be a valid UUID, and should exist in the 'companies' table.
 *    + 'documents.*.new_document_id' (body), must not be empty, should be a valid UUID, and should exist in the 'temp_upload_documents' table.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Define the condition object for identifying the company's profile to update based on the 'id' parameter.
 *    + Call the 'updateProfile' service function to update the company's profile.
 *    + Prepare the response with success data.
 *    + Log the response.
 *    + Return the response using 'responseHandler()'.
 * - If validation fails:
 *    + Add error validation to the response.
 *
 * Notes:
 * - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const updateProfile = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "Update Company Profile request");
    /* Log Request */

    /* Reading segment values */
    const requestSegments = req.path.split('/');
    const slug = requestSegments[2];
    req.body.slug_name = slug;
    /* Reading segment values */

    /* Default Variable */
    var responseData = '';
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check("request_id").trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check('slug_name')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.slugNameRequired)
            .isIn(['client', 'vendor', 'end-client'])
            .withMessage(responseMessages.companies.slugNameShouldbe),
        check('id')
            .trim().escape()
            .notEmpty().withMessage(responseMessages.companies.companyIdRequired)
            .isUUID().withMessage(responseMessages.companies.companyIDInvalid)
            .custom(async value => {
                const companyData = await indexService.find('companies', ['id', 'reference_id'], { id: value, entity_type: req.body.slug_name });
                if (!companyData.status) {
                    return Promise.reject(responseMessages.companies.companyIdNotExists);
                }
                req.body.reference_id = companyData.data[0].reference_id
            }),
        check('documents.*.new_document_id')
            .trim()
            .escape()
            .notEmpty().withMessage(responseMessages.employee.documents.newDocumentIdRequired)
            .isUUID().withMessage(responseMessages.employee.documents.newDocumentIdInvalid)
            .custom(async (value) => {
                const documentsData = await indexService.find('temp_upload_documents', ['*'], { id: value }, null, [], null, null, null, false);
                if (!documentsData.status) {
                    return Promise.reject(responseMessages.employee.documents.newDocumentIdNotExists);
                }
            }),
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
        var response = await companiesServices.updateProfile(req.body, condition);
        if (response.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully, profile_link: response.data[0].logo_document_url }
        } else {
            responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error }
        }

        /* Log Response */
        logResponse("info", req, responseData, "Update Company Profile Response.");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Add Company Address Function is to add the company address
 * 
 * Overview of FUnction:
 * - Validate the request.
 *   + If successful.
 *     ~ Call the 'addCompanyAddress' service function to add the address for a company.
 *     ~ Prepare the response with success data.
 *   + Else
 *     ~ Add error valdiation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Extract the 'slug_name' from the URL path and add it to the result.
 * - Set default variables for 'responseData'.
 * - Define the valdiation rules as follows:
 *   + 'request_id' (body), must not tbe empty.
 *   + 'address_type' (body), must not be empty and should be one of ['billing', 'shipping'].
 *    + 'id' (body), must not be empty, should be a valid UUID, and should exist in the 'companies' table.
 *        - 'address_line_one' (body), must not be empty and should meet specific criteria.
 *        - 'address_line_two' (body), should meet specific criteria.
 *        - 'city' (body), must not be empty and should consist of alphabets, hyphens, forward slashes, and spaces.
 *        - 'state_id' (body), must not be empty, should be an integer, and should exist in the 'states' table.
 *        - 'country_id' (body), must not be empty, should be an integer, and should exist in the 'countries' table.
 *        - 'zip_code' (body), must not be empty and should:
 *          - Consist of numbers and spaces.
 *          - Have a length between a specific range (e.g., 5 to 10 characters).
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the 'addCompanyAddress' service function to add the Company address Details record.
 *    + If successful:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with an error message.
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
const companyAddress = tryCatch(async (req, res) => {
    // Log Request
    logRequest('info', req, "Add Company Address request");

    // Default Variable
    var responseData;

    // Writing validation rules to the input request
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('id')
            .trim()
            .custom(async value => {
                if (value != '' && value) {
                    let companyAddressData = await indexService.find('company_address', ['id'], { id: value, company_id: req.body.company_id });
                    if (!companyAddressData.status) {
                        return Promise.reject(responseMessages.companies.companyIdNotExists);
                    }
                }
            }),
        check('address_type')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.addressTypeRequired)
            .isIn(['billing', 'shipping'])
            .withMessage(responseMessages.companies.addressTypeInvalid),
        check('company_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.companies.companyIdRequired)
            .isUUID()
            .withMessage(responseMessages.companies.companyIDInvalid)
            .custom(async value => {
                const companyData = await indexService.find('companies', ['id'], { id: value, entity_type: req.body.slug_name });
                if (!companyData.status) {
                    return Promise.reject(responseMessages.companies.companyIdNotExists);
                }
            }),
        check('address_line_one')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.AddressLineOneRequired)
            .not().matches(regexPatterns.specialCharactersRegex)
            .withMessage(responseMessages.companies.AddressLineOneInvalid),
        check('address_line_two')
            .optional()
            .not()
            .matches(regexPatterns.specialCharactersRegex)
            .withMessage(responseMessages.companies.AddressLineTwoInvalid),
        check('city')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.CityRequired)
            .matches(regexPatterns.alphaCharactersAndSpacesOnly)
            .withMessage(responseMessages.companies.CityInvalid),
        check('state_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.companies.StateRequired)
            .isInt()
            .withMessage(responseMessages.companies.StateInvalid)
            .custom(async (value) => {
                const state = await indexService.find('states', ['id'], { id: value });
                if (!state.status) {
                    return Promise.reject(responseMessages.companies.StateIdNotExists);
                }
                return true
            }),
        check('country_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.companies.CountryRequired)
            .isInt()
            .withMessage(responseMessages.companies.CountryInvalid)
            .custom(async value => {
                const countryData = await indexService.find('countries', ['id'], { id: value });
                if (!countryData.status) {
                    return Promise.reject(responseMessages.companies.CountryNotExists);
                }
            }),
        check("zip_code")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.ZipCodeRequired)
            .matches(regexPatterns.numbersSpaceRegex)
            .withMessage(responseMessages.companies.ZipCodeInvalid)
            .isLength({ min: 5, max: 10 })
            .withMessage(responseMessages.companies.ZipCodeShouldBe),
    ];

    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    if (errors.isEmpty()) {
        req.body.address_type = (req.body.address_type == 'billing') ? 1 : 2;
        var response = await companiesServices.companyAddress(req.body);
        if (response.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.updatedSuccessfully
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error
            }
        }
        // Log Response
        logResponse("info", req, responseData, "Add Company Address Response.");

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }

});

/**
 * Get Company Addresses function to get the listing of shipping and billing addresses of the a specific company.
 * 
 * Overview of Function:
 * - Validate the request.
 *   + If successful
 *     ~ Retrieve the list of company addresses.
 *     ~ Prepare the response with the retrieved data.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'company_id' (query), must not be empty and must be the id of the companies.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *    + Retrieve a list of company addresses based on the condition of company id.
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
const getCompanyAddress = tryCatch(async (req, res) => {
    // Log Request
    logRequest('info', req, "Getting Company adress listing request");

    const requestSegments = req.path.split('/');
    const slug = requestSegments[2];
    req.query.address_type = slug;

    // Default Variable
    var responseData;

    // Writing validation rules to the input request
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('address_type')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.addressTypeRequired)
            .isIn(['billing', 'shipping'])
            .withMessage(responseMessages.companies.addressTypeInvalid),
        check('company_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.companies.companyIdRequired)
            .isUUID()
            .withMessage(responseMessages.companies.companyIDInvalid)
            .custom(async value => {
                const companyData = await indexService.find('companies', ['id'], { id: value, entity_type: req.body.slug_name });
                if (!companyData.status) {
                    return Promise.reject(responseMessages.companies.companyIdNotExists);
                }
            })
    ];

    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    if (errors.isEmpty()) {
        /* Default Variable */
        let condition = {
            company_id: req.query.company_id,
            address_type: (req.query.address_type == 'billing') ? 1 : 2
        };

        var companyAddress = await companiesServices.getCompanyAddress(condition);

        if (companyAddress.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: companyAddress.data
            };
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess, message: responseMessages.common.noRecordFound,
                data: []
            }
        }

        // Log Response
        logResponse('info', req, responseData, "Getting Company Address details listing Response");

        // Return the response
        responseHandler(res, responseData);

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity,);
    }

});

module.exports = { destroy, dropdown, index, listing, updateStatus, store, update, updateProfile, dashboardData, companyAddress, getCompanyAddress };