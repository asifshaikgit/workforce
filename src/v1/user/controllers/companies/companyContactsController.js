const companyContactsService = require('../../services/companies/companyContactsService');
const { check, validationResult } = require('express-validator');
const { logRequest, logResponse } = require('../../../../../utils/log');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { responseHandler } = require("../../../../responseHandler");
const { tryCatch } = require("../../../../../utils/tryCatch");
const { pagination } = require("../../../../../config/pagination");
const InvalidRequestError = require("../../../../../error/InvalidRequestError");
const indexService = require('../../services/index');
const indexRepository = require('../../repositories/index');
const { regexPatterns } = require('../../../../../constants/regexPatterns');

/**
 * Store function to create a new Company Contact Details record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'store' service function to create a new Company Contact Details record.
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
 *    + 'company_id' (body), must not be empty, should be a valid UUID, and should exist in the 'companies' table.
 *    + Validation for each contact details object in the 'contacts' array:
 *      - 'first_name' (body), must not be empty and should meet specific criteria.
 *      - 'middle_name' (body), should meet specific criteria (optional).
 *      - 'last_name' (body), must not be empty and should meet specific criteria.
 *      - 'email_id' (body), must not be empty and should be a valid email address.
 *      - 'mobile_number' (body), must not be empty, should consist of numbers, dashes, and parentheses, and have a specific length.
 *      - 'contact_number' (body), must not be empty, should consist of numbers, dashes, and parentheses, and have a specific length.
 *      - 'ext' (body), must not be empty and should consist of a plus sign and digits.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the 'companyContactsService.store' service function to create a new Company Contact Details record.
 *    + If successful:
 *      - Prepare the response with success data.
 *    + If there is an error during the creation process:
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
    logRequest('info', req, "Store company contact details request.");
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
        check('company_id').trim().escape().notEmpty().withMessage(responseMessages.companies.companyIdRequired)
            .isUUID().withMessage(responseMessages.companies.companyIDInvalid)
            .custom(async (value) => {
                const companyData = await indexService.find('companies', ['id', 'name', 'reference_id'], { id: value, entity_type: req.body.slug_name });
                if (!companyData.status) {
                    return Promise.reject(responseMessages.companies.companyIdNotExists);
                }
                req.body.company_name = companyData.data[0].name
                req.body.company_reference_id = companyData.data[0].reference_id
            }),
        check("contacts.*.first_name").trim().notEmpty().withMessage(responseMessages.companyContacts.firstNameRequired)
            .not().matches(regexPatterns.specialCharactersRegex).withMessage(responseMessages.companyContacts.firstNameInvalid),
        check("contacts.*.middle_name").trim().not().matches(regexPatterns.specialCharactersRegex).withMessage(responseMessages.companyContacts.middleNameInvalid),
        check("contacts.*.last_name").trim().notEmpty().withMessage(responseMessages.companyContacts.lastNameRequired)
            .not().matches(regexPatterns.specialCharactersRegex).withMessage(responseMessages.companyContacts.lastNameInvalid),
        check("contacts.*.email_id").trim().notEmpty().withMessage(responseMessages.companyContacts.emailIdRequired)
            .isEmail().withMessage(responseMessages.companyContacts.emailIdInvalid),
        check("contacts.*.mobile_number")
            .trim()
            .custom(async (value) => {
                if (value != '' && value != null && value != undefined) {
                    if (!regexPatterns.usPhoneNumberRegex.test(value)) {
                        return Promise.reject(responseMessages.companyContacts.mobileNumberInvalid);
                    } else {
                        if (!regexPatterns.contactNumberRegex.test(value)) {
                            return Promise.reject(responseMessages.companyContacts.mobileNumberLength);
                        }
                        return true
                    }
                }
                return true;
            }),
        check("contacts.*.contact_number")
            .trim()
            .custom(async (value) => {
                if (value != '' && value != null && value != undefined) {
                    if (!regexPatterns.usPhoneNumberRegex.test(value)) {
                        return Promise.reject(responseMessages.companyContacts.contactNumberInvalid);
                    } else {
                        if (!regexPatterns.contactNumberRegex.test(value)) {
                            return Promise.reject(responseMessages.companyContacts.contactNumberLength);
                        }
                        return true
                    }
                }
                return true;
            }),

        check("contacts.*.ext")
            .trim()
            .custom(async (value) => {
                if (value != '' && value != null && value != undefined) {
                    var pattern = regexPatterns.phoneNumberWithCountryCodeRegex
                    if (!pattern.test(value)) {
                        return Promise.reject(responseMessages.companyContacts.extensionInvalid);
                    }
                }
                return true;
            }),
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
     *    + call the create service function
     *        - Based on the status in create function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
    */
    if (errors.isEmpty()) {
        const contacts = req.body.contacts
        var isValid = true
        for(const key in contacts) {
            var  contactDetails = await indexRepository.find('company_contacts',['id'], {email_id: contacts[key].email_id ,mobile_number: contacts[key].mobile_number})
            if(contactDetails.status){
                isValid =false 
            }
        }
        if(isValid) {
            const companyContactData = await companyContactsService.store(req.body);
            if (companyContactData.status) {
                responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully, data: companyContactData.data }
            } else {
                responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: companyContactData.error }
            }

            /* Log Response */
            logResponse("info", req, responseData, "Store company contact details Response.");
            /* Log Response */

            /* Return the response */
            responseHandler(res, responseData);
            /* Return the response */
        } else {
            throw new InvalidRequestError(responseMessages.companyContacts.contactDetailsAlreadyExists, responseCodes.codeUnprocessableEntity);
        }
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});


/**
 * Update function to modify Company Contact Details records.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Define the condition object for identifying the records to be updated.
 *      ~ Call the 'update' service function to modify the Company Contact Details records.
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
 *    + Validation for each contact details object in the 'contacts' array:
 *      - 'id' (body), must be a valid integer and should exist in the 'company_contacts' table.
 *      - 'first_name' (body), must not be empty and should meet specific criteria.
 *      - 'middle_name' (body), should meet specific criteria (optional).
 *      - 'last_name' (body), must not be empty and should meet specific criteria.
 *      - 'email_id' (body), must not be empty and should be a valid email address.
 *      - 'mobile_number' (body), must not be empty, should consist of numbers, dashes, and parentheses, and have a specific length.
 *      - 'contact_number' (body), must not be empty, should consist of numbers, dashes, and parentheses, and have a specific length.
 *      - 'ext' (body), must not be empty and should consist of a plus sign and digits.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *    + Define the condition object for identifying the records to be updated based on the 'company_id' parameter.
 *    + Call the 'companyContactsService.update' service function to modify the Company Contact Details records.
 *    + If successful:
 *      - Prepare the response with success data.
 *    + If there is an error during the update process:
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
    logRequest('info', req, "Update company contact details request.");
    /* Log Request */

    const requestSegments = req.path.split('/');
    const slug = requestSegments[2];
    req.body.slug_name = slug;
    req.body.id = req.params?.id;

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
            .notEmpty().withMessage(responseMessages.companies.slugNameRequired)
            .isIn(['client', 'vendor', 'end-client'])
            .withMessage(responseMessages.companies.slugNameShouldbe),
        check('id').trim().escape().notEmpty().withMessage(responseMessages.clientContacts.clientsIdRequired)
            .isUUID().withMessage(responseMessages.clientContacts.clientsIdInvalid)
            .custom(async value => {
                const companyData = await indexService.find('companies', ['id', 'name', 'reference_id'], { id: value, entity_type: req.body.slug_name });
                if (!companyData.status) {
                    return Promise.reject(responseMessages.clientContacts.clientIdNotExists);
                }
                req.body.company_name = companyData.data[0].name
                req.body.company_reference_id = companyData.data[0].reference_id
            }),
        check('contacts.*.id').trim().escape()
            .custom(async value => {
                if (isNaN(value)) {
                    return Promise.reject(responseMessages.companyContacts.idInvalid);
                } else {
                    const companyContactData = await indexService.find('company_contacts', ['id'], { id: value });
                    if (!companyContactData.status) {
                        return Promise.reject(responseMessages.companyContacts.idNotExists);
                    }
                }
            }),
        check("contacts.*.first_name").trim().notEmpty().withMessage(responseMessages.clientContacts.firstNameRequired)
            .not().matches(regexPatterns.specialCharactersRegex).withMessage(responseMessages.clientContacts.firstNameInvalid),
        check("contacts.*.middle_name").trim().not().matches(regexPatterns.specialCharactersRegex).withMessage(responseMessages.clientContacts.middleNameInvalid),
        check("contacts.*.last_name").trim().notEmpty().withMessage(responseMessages.clientContacts.lastNameRequired)
            .not().matches(regexPatterns.specialCharactersRegex).withMessage(responseMessages.clientContacts.lastNameInvalid),
        check("contacts.*.email_id").trim().notEmpty().withMessage(responseMessages.clientContacts.emailIdRequired)
            .isEmail().withMessage(responseMessages.clientContacts.emailIdInvalid),
        check("contacts.*.mobile_number")
            .trim()
            .custom(async (value) => {
                if (value != '' && value != null && value != undefined) {
                    var pattern = regexPatterns.usPhoneNumberRegex
                    if (!pattern.test(value)) {
                        return Promise.reject(responseMessages.companyContacts.mobileNumberInvalid);
                    } else {
                        var patterns = regexPatterns.contactNumberRegex
                        if (!patterns.test(value)) {
                            return Promise.reject(responseMessages.companyContacts.mobileNumberLength);
                        }
                        return true
                    }
                }
                return true;
            }),
        check("contacts.*.contact_number")
            .trim()
            .custom(async (value) => {
                if (value != '' && value != null && value != undefined) {
                    var pattern = regexPatterns.usPhoneNumberRegex
                    if (!pattern.test(value)) {
                        return Promise.reject(responseMessages.companyContacts.contactNumberInvalid);
                    } else {
                        var patterns = regexPatterns.contactNumberRegex
                        if (!patterns.test(value)) {
                            return Promise.reject(responseMessages.companyContacts.contactNumberLength);
                        }
                        return true
                    }
                }
                return true;
            }),

        check("contacts.*.ext")
            .trim()
            .custom(async (value) => {
                if (value != '' && value != null && value != undefined) {
                    var pattern = regexPatterns.phoneNumberWithCountryCodeRegex
                    if (!pattern.test(value)) {
                        return Promise.reject(responseMessages.companyContacts.extensionInvalid);
                    }
                }
                return true;
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

    /**
     * If validation is success
     *    + call the update service function
     *        - Based on the status in update function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
    */
    if (errors.isEmpty()) {
        const contacts = req.body.contacts
        var isValid = true
        for(const key in contacts) {
            var  contactDetails = await indexRepository.find('company_contacts',['id','company_id'], {email_id: contacts[key].email_id ,mobile_number: contacts[key].mobile_number})
            if(contactDetails.status){
                if(contacts[key].id != ""){
                    if(contactDetails.data[0].id  != contacts[key].id){
                        isValid =false 
                    }
                } else {
                    isValid =false 
                }
            }
        }
        if(isValid) {
            const condition = { company_id: req.params.id }
            await companyContactsService.update(req.body, condition);
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully }

            /* Log Response */
            logResponse("info", req, responseData, "Update company contact details Response.");
            /* Log Response */

            /* Return the response */
            responseHandler(res, responseData);
            /* Return the response */
        } else {
            throw new InvalidRequestError(responseMessages.companyContacts.contactDetailsAlreadyExists, responseCodes.codeUnprocessableEntity);
        }
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Index function to retrieve Company Contact Details records based on company_id.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Define the condition object for identifying the records to be retrieved.
 *      ~ Call the 'index' service function to retrieve Company Contact Details records.
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
 *    + 'company_id' (query), must not be empty, should be a valid UUID, and should exist in the 'companies' table.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *    + Define the condition object for identifying the records to be retrieved based on the 'company_id' parameter.
 *    + Call the 'companyContactsService.index' service function to retrieve Company Contact Details records.
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
const index = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "Getting company contacts index request");
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
        check('company_id')
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
    /*Run the validation rules. */
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    /*Run the validation rules. */

    if (errors.isEmpty()) {
        var condition = { company_id: req.query.company_id };
        var companyData = await companyContactsService.index(condition);
        // 
        if (companyData?.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: companyData.data
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeInternalError,
                message: companyData.message,
                data: []
            }
        }

        /* Log Response */
        logResponse("info", req, responseData, "Getting company contacts index request Response.");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity,);
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
 *    + Call the 'companyContactsService.destroy' service function to delete the Company Contact Details record.
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
    logRequest('info', req, "Delete company contact details request");
    /* Log Request */

    const requestSegments = req.path.split('/');
    const slug = requestSegments[2];
    req.query.slug_name = slug;

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
            .notEmpty().withMessage(responseMessages.companies.slugNameRequired)
            .isIn(['client', 'vendor', 'end-client']).withMessage(responseMessages.companies.slugNameShouldbe),
        check('id')
            .trim().escape()
            .notEmpty().withMessage(responseMessages.companyContacts.idRequired)
            .isInt().withMessage(responseMessages.companyContacts.idInvalid)
            .custom(async value => {
                const companyContactData = await indexService.find('company_contacts', ['display_name'], { id: value });
                if (!companyContactData.status) {
                    return Promise.reject(responseMessages.companyContacts.idNotExists);
                }
                req.body.contact_name = companyContactData.data[0].display_name
            }),
        check('company_id')
            .trim().escape()
            .notEmpty().withMessage(responseMessages.companies.companyIdRequired)
            .isUUID().withMessage(responseMessages.companies.companyIDInvalid)
            .custom(async value => {
                const companyData = await indexService.find('companies', ['id'], { id: value, entity_type: req.query.slug_name });
                if (!companyData.status) {
                    return Promise.reject(responseMessages.companies.companyIdNotExists);
                } else {
                    const companycontactData = await indexService.find('company_contacts', ['id'], { company_id: value, id: req.body.id });
                    if (!companycontactData.status) {
                        return Promise.reject(responseMessages.companyContacts.companyContactIdnotExists);
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

    if (errors.isEmpty()) {
        const condition = { id: req.params.id }
        const companyContacts = await companyContactsService.destroy(req.body, condition);
        if (companyContacts.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.deletedSuccessfully }
        } else {
            responseData = { statusCode: responseCodes.codeInternalError, message: companyContacts.message, error: companyContacts.error }
        }

        /* Log Response */
        logResponse('info', req, responseData, "Delete company contact details Response");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Get company contacts dropdown data.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Prepare the condition based on the 'search' query parameter and 'employee_id'.
 *      ~ Call the 'find' function from 'indexService' to get company contacts dropdown data.
 *      ~ If data exists, prepare the response with success data.
 *      ~ If no data exists, prepare the response with an empty array and a success message.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'company_id' (query), must not be empty, be a valid UUID, and should exist in the 'companies' table.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *   + Determine the 'condition' object based on the 'company_id'.
 *   + Define 'joins' to include the 'companies' table.
 *   + Call the 'find' function from 'indexRepository' to retrieve company contacts dropdown data.
 *   + If data exists:
 *      ~ Prepare the response with fetched data.
 *    + Else:
 *      ~ Prepare the response with an empty array and a success message.
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

    const requestSegments = req.path.split('/');
    const slug = requestSegments[2];
    req.query.slug_name = slug;

    /* Log Request */
    logRequest('info', req, "Getting company contacts dropdown request");
    /* Log Request */

    /* Writing validation rules to the input request */
    var validations = [
        check('request_id')
            .trim().escape()
            .notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check('company_id')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.companyIdRequired)
            .isUUID()
            .withMessage(responseMessages.companies.companyIDInvalid)
            .custom(async value => {
                const companyData = await indexService.find('companies', ['id'], { id: value, entity_type: req.query.slug_name });                if (!companyData.status) {
                    return Promise.reject(responseMessages.companies.companyIdNotExists);
                }
            }),
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
     * + get companies in the collection.  
     * If Validation Fails
     * + Return the error message.
    */
    if (errors.isEmpty()) {

        var condition = { company_id: req.query.company_id };

        var contactsData = await indexRepository.find('company_contacts', ['company_contacts.id', 'company_contacts.display_name as name'], condition, null);
        if (contactsData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: contactsData.data };
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: contactsData.message, error: contactsData.error, message: responseMessages.common.noRecordFound, data: [] }
        }

        /* Log Response */
        logResponse('info', req, responseData, "Getting company contatcs dropdown response");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

module.exports = { destroy, index, store, update, dropdown };