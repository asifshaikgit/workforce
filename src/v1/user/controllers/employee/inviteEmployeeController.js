const inviteEmployeeService = require('../../services/employee/inviteEmployeeService')
const { tryCatch } = require('../../../../../utils/tryCatch')
const { logRequest, logResponse } = require('../../../../../utils/log')
const { responseMessages } = require('../../../../../constants/responseMessage')
const { responseCodes } = require('../../../../../constants/responseCodes')
const { responseHandler } = require('../../../../responseHandler')
const { check, validationResult } = require('express-validator');
const { pagination } = require('../../../../../config/pagination');
const InvalidRequestError = require("../../../../../error/InvalidRequestError")
const moment = require('moment');
const indexService = require('../../services/index');
const indexRepository = require('../../repositories/index');
const format = require('../../../../../helpers/format');
const { regexPatterns } = require('../../../../../constants/regexPatterns');

// Invited Employeee Status Constants
const INVITATION_SENT = 'Invitation Sent';
const OFFER_ACCEPTED = 'Offer Accepted';
const OFFER_REJECTED = 'Offer Rejected';
const IN_PROGRESS = 'In Progress';
const LINK_EXPIRED = 'Link Expired';
const WAITING = 'Waiting';
const PENDING = 'Pending';
const APPROVED = 'Approved';
const SUBMITTED = 'Submitted';
const REJECTED = 'Rejected';

/**
 * Invite Via Link function to create a employee data in `invited_employee` table
 * 
 * overview of funtion:
 * - Validate the request.
 *   + If successfull
 *     ~ Call the 'invite_link' service function to create a invite link for an employee.
 *     ~ Prepare the reponse with success data.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic: 
 * - Retrieve the organization date format using `format.getDateFormat()`.
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Convert 'dob' in the request to 'YYYY-MM-DD' format using Moment.js and update the request.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'first_name' (body), must not be empty, should contain only alphabetic characters.
 *    + 'last_name' (body), must not be empty, should contain only alphabetic characters.
 *    + 'middle_name' (body), should contain only alphabetic characters.
 *    + 'dob' (body) must not be empty, should be a valid date.
 *    + 'gender' (body) should contain only alphabetic characters.
 *    + 'email_id' (body) must not be empty, should match a valid email pattern.
 *    + 'mobile_number' (body) must not be empty, should match a valid phone number pattern.
 *    + 'documents.*.new_document_id' (body), must not be empty, should be a valid UUID, and should exist in the 'temp_upload_documents' table.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `invite_link` service function to create a new invited employee.
 *    + If Success:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with error message.
 * - If validation fails:
 *    + Add error validation to the response.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 * 
 *  * Notes:
 *  - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const store = tryCatch(async (req, res) => {
    let dateFormat = await format.getDateFormat(); // date format

    // Log Request
    logRequest("info", req, "Create a INVITE LINK EMPLOYEE request");

    // Default Variable
    var responseData;

    let modified_date = req.body.dob != '' ? moment(req.body.dob, dateFormat).format('YYYY-MM-DD') : '';
    req.body.dob = modified_date // From date format

    // Writing validation rules to the input request
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check("first_name")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.firstNameRequired)
            .matches(regexPatterns.alphaCharactersAndSpacesOnly)
            .withMessage(responseMessages.employee.behalfOnboarding.firstNameInvalid),
        check("last_name")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.lastNameRequired)
            .matches(regexPatterns.alphaCharactersAndSpacesOnly)
            .withMessage(responseMessages.employee.behalfOnboarding.lastNameInvalid),
        check("middle_name")
            .trim()
            .matches(regexPatterns.alphaCharactersAndSpacesOnly)
            .withMessage(responseMessages.employee.behalfOnboarding.middleNameInvalid),
        check("email_id")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.emailIdRequired)
            .isEmail()
            .withMessage(responseMessages.employee.behalfOnboarding.emailIdInvalid)
            .custom(async (value) => {
                const employeeData = await indexService.find('employee', ['id'], { email_id: value, status: 'Active' });
                if (employeeData.status && value != '') {
                    return Promise.reject(responseMessages.employee.behalfOnboarding.emailIdExists);
                }

                // Check if `email_id` already exist in invited_employee table
                const invited_employee = await indexService.find('invited_employee', ['id', 'status'], { email_id: value, global_search: `status != 'Rejected'` });
                if (invited_employee && invited_employee.data?.length > 0) {
                    if (invited_employee?.data[0]?.status != LINK_EXPIRED) {
                        return Promise.reject(responseMessages.invitedEmployee.invitationAlreadySent);
                    } else {
                        // If Status of the `invited_employee` is LINK_EXPIRED then update the status to WAITING and `re_requested_on` time.
                        req.body.reRequestUpdate = {
                            status: WAITING,
                            re_requested_on: moment()
                        }
                        req.body.id = invited_employee?.data[0]?.id;
                    }
                }

                return true;
            }),
        check("mobile_number")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.invitedEmployee.mobileNumberRequired)
            .matches(regexPatterns.phoneRegex)
            .withMessage(responseMessages.invitedEmployee.mobileNumberInvalid)
            .custom(async (value) => {
                const employeeData = await indexService.find('employee', ['id'], { contact_number: value });
                if (employeeData.status) {
                    return Promise.reject(responseMessages.employee.behalfOnboarding.contactNumberExists);
                }
                return true;
            }),
        check("dob")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.requiredDob)
            .isDate()
            .withMessage(responseMessages.employee.behalfOnboarding.invalidDob),
        check("employment_type_id")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.employmentTypeIdRequired)
            .isInt()
            .withMessage(responseMessages.employee.behalfOnboarding.employmentTypeIdInvalid)
            .isIn(['2', 2])
            .withMessage(responseMessages.invitedEmployee.allowedOnlyConsultant)
            .custom(async (value) => {
                const employmentTypeData = await indexService.find('employment_types', ['id', 'name'], { id: value, is_active: 1 })
                if (!employmentTypeData.status) {
                    return Promise.reject(responseMessages.employee.behalfOnboarding.employmentTypeIdNotExists)
                }
                req.body.employment_type_name = employmentTypeData.data[0].name
                return true
            }),
        check("employee_category_id")
            .trim()
            .custom(async (value) => {
                if (value != null && value != '' && value != undefined) {
                    var pattern = regexPatterns.numbersSpaceRegex
                    if (pattern.test(value)) {
                        const employmentCategoryData = await indexService.find('employee_categories', ['id'], { id: value, is_active: 1 })
                        if (!employmentCategoryData.status && value != '') {
                            return Promise.reject(responseMessages.employee.behalfOnboarding.employeeCategoryIdNotExists)
                        }
                    } else {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.employeeCategoryIdInvalid)
                    }
                } else {
                    return Promise.reject(responseMessages.employee.behalfOnboarding.employeeCategoryIdRequired)
                }
                return true;
            }),
        check("gender")
            .trim()
            .matches(regexPatterns.alphaCharactersAndSpacesOnly)
            .withMessage(responseMessages.employee.behalfOnboarding.genderInvalid),
        check("offer_letter_id")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.invitedEmployee.requiredOfferLetter)
            .isUUID()
            .withMessage(responseMessages.employee.behalfOnboarding.requiredOfferLetter)
            .custom(async (value) => {
                const documentsData = await indexService.find('temp_upload_documents', ['*'], { id: value }, null, [], null, null, null, false);
                if (!documentsData.status) {
                    return Promise.reject(responseMessages.invitedEmployee.invalidOfferLetterId);
                }
                return true;
            })
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
        req.body.status = INVITATION_SENT;

        var invite_link = await inviteEmployeeService.store(req.body, dateFormat);
        if (invite_link.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.addedSuccessfully,
                data: invite_link.data
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeInternalError,
                message: responseMessages.common.somethindWentWrong,
                error: invite_link.error,
                data: []
            }
        }

        // Log Response
        logResponse("info", req, responseData, "Create a INVITE LINK EMPLOYEE response");

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
 * Invite Via Link Index function to retrieve the Invited Employee Data.
 * 
 * Overview of Function:
 * - Validate the request.
 *   + If successful
 *     ~ Call the invitedEmployeeIndex service function to retrieve the invited employee details.
 *     ~ Prepare the response with the retrieved data. 
 *   + Else
 *     ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set default variables for `responseData`.
 *  - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'id' (body), must be an integer, must exist in 'invited_employee' table wih status 'invitation_sent'.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *   + Call the `invitedEmployeeIndex` service function to get the data of invited employee.
 *   + If success:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with error message.
 * - If validation fails:
 *    + Add error validation to the response.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 * 
 *  * Notes:
 *  - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const index = tryCatch(async (req, res) => {
    // Log Request
    logRequest("info", req, "Index of INVITE LINK EMPLOYEE request");

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
            .escape()
            .notEmpty()
            .withMessage(responseMessages.invitedEmployee.inviteEmployeeIdRequired)
            .isInt()
            .withMessage(responseMessages.invitedEmployee.inviteEmployeeIdInvalid)
            .custom(async value => {
                const employeeData = await indexService.find('invited_employee', ['id'], { id: value });
                if (!employeeData.status) {
                    return Promise.reject(responseMessages.invitedEmployee.invitedEmployeeIdNotExists);
                }
                return true;
            })
    ];

    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    /**
     * If validation is success
     * + Update employee details in the collection.
     * If Validation Fails
     * + Return the error message.
     */
    if (errors.isEmpty()) {

        const condition = { 'invited_employee.id': req.query.id };
        var response = await inviteEmployeeService.index(condition);

        if (!response.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: response.message, error: response.error,
                message: responseMessages.common.noRecordFound,
                data: []
            }
        }
        else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: response.data
            };
        }

        // Log Response
        logResponse("info", req, responseData, "Index of INVITE LINK EMPLOYEE Response.");

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

const listing = tryCatch(async (req, res) => {
    // Log Request
    logRequest("info", req, "Listing of INVITE LINK EMPLOYEE request");

    // Default Variable
    var responseData;
    let limit = (req.body.limit) ? (req.body.limit) : pagination.limit;
    let page = (req.body.page) ? (req.body.page) : pagination.page;
    let sort_column = (req.body.sort_column) ? (req.body.sort_column) : 'created_at';
    let sort_order = (req.body.sort_order) ? (req.body.sort_order) : 'DESC';
    let status = (req.body.status) ? (req.body.status) : [];
    var condition = {};

    // Writing validation rules to the input request
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check("sort_column")
            .optional()
            .custom(async (value) => {
                if (value != null && value != '' && value != undefined) {
                    let columns = ["first_name", "created_at"];
                    if (!columns.includes(value)) {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.invalidSortColumn);
                    }
                }
                return true;
            }),
        check("sort_order")
            .optional()
            .custom(async (value) => {
                if (value != null && value != '' && value != undefined) {
                    let order = ["ASC", "DESC", "asc", "desc"];
                    if (!order.includes(value)) {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.invalidSortOrder);
                    }
                }
                return true;
            }),
    ];

    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    /**
     * If validation is success
     * + Update employee details in the collection.
     * If Validation Fails
     * + Return the error message.
     */
    if (errors.isEmpty()) {

        if (req.body.search) {
            condition.global_search = `invited_employee.first_name ilike '%${req.body.search}%'`
        }

        if (status.length > 0) {
            condition['invited_employee.status'] = status
        }

        if (sort_column == 'first_name') {
            sort_column = `LOWER(invited_employee.first_name) ${sort_order}`
            sort_order = 'raw'
        } else if (sort_column == 'created_at') {
            sort_column = `invited_employee.created_at`;
        }

        if (sort_column == 'created_at') {
            sort_column = `invited_employee.created_at`
        }

        var response = await inviteEmployeeService.listing(condition, page, limit, sort_column, sort_order);

        if (!response.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: response.message, error: response.error,
                message: responseMessages.common.noRecordFound,
                data: []
            }
        }
        else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                pagination: response.pagination,
                data: response.data
            };
        }

        // Log Response
        logResponse("info", req, responseData, "Index of INVITE LINK EMPLOYEE Response.");

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Update Invite Via Link function is to update the status of the link sent to the employee.
 * 
 * Overview of function:
 * - Validate the request.
 *   + If successfull
 *     ~ Call the 'updateInviteLink' service function which will update the status of the link sent to invited employee.
 *     ~ Prepare the response with success data.
 *   + Else 
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'id' (body), must be an integer, must exist in 'invited_employee' table wih status 'invitation_sent', must not exceed `link_expires_on` date.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *   + Call the `updateInviteLink` service function to update the status of invited employee
 *   + If success:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with error message.
 * - If validation fails:
 *    + Add error validation to the response.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 * 
 *  * Notes:
 *  - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
    // Log Request
    logRequest("info", req, "Update status of INVITE LINK EMPLOYEE request");

    // Default Variable
    var responseData;
    var employeeData;

    // Writing validation rules to the input request
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
            .withMessage(responseMessages.invitedEmployee.inviteEmployeeIdRequired)
            .isInt()
            .withMessage(responseMessages.invitedEmployee.inviteEmployeeIdInvalid)
            .custom(async value => {
                employeeData = await indexService.find('invited_employee', ['id', 'link_expires_on', 'upload_documents', 'i9_document_id', 'w4_document_id'], { id: value, status: [INVITATION_SENT, PENDING, WAITING] });
                if (!employeeData.status) {
                    return Promise.reject(responseMessages.invitedEmployee.invitedEmployeeIdNotExists);
                } else if (employeeData.data[0].status === OFFER_ACCEPTED) {
                    return Promise.reject(responseMessages.invitedEmployee.AlreadyAcceptedOffer)
                }
                req.body.i9_document_uploaded = employeeData.data[0].i9_document_id
                req.body.w4_document_uploaded = employeeData.data[0].w4_document_id

                // current time Must not exceed 'link_expires_on' time.
                if (employeeData.data[0].link_expires_on < new Date()) {
                    return Promise.reject(responseMessages.invitedEmployee.invitedEmployeeLinkExpired);
                }
            }),
        check('status')
            .notEmpty()
            .isIn([OFFER_ACCEPTED, OFFER_REJECTED, PENDING])
            .withMessage(responseMessages.invitedEmployee.invitedEmployeeStatusInvalid),
        check('i9andw4.i9_document.id')
            .custom(async (value) => {

                // If status value is approved check for mandatory keys required for each specific document
                if (req.body.status == OFFER_ACCEPTED && req.body.final && req.body.i9_document_uploaded == null) {
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.invitedEmployee.requiredI9DocumentId)
                    } else {
                        var pattern = regexPatterns.uuidRegex;
                        if (pattern.test(value)) {
                            var documentsData = await indexService.find('temp_upload_documents', ['id'], { id: value }, null, [], null, null, null, false)
                            if (!documentsData.status) {
                                return Promise.reject(responseMessages.invitedEmployee.documentNotFound)
                            }
                        } else {
                            return Promise.reject(responseMessages.invitedEmployee.invalidI9DocumentId)
                        }
                    }

                }
                return true;
            }),
        check('i9andw4.w4_document.id')
            .custom(async (value) => {

                // If status value is approved check for mandatory keys required for each specific document
                if (req.body.status == OFFER_ACCEPTED && req.body.final && req.body.w4_document_uploaded == null) {
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.invitedEmployee.requiredW4DocumentId)
                    } else {
                        var pattern = regexPatterns.uuidRegex;
                        if (pattern.test(value)) {
                            var documentsData = await indexService.find('temp_upload_documents', ['id'], { id: value }, null, [], null, null, null, false)
                            if (!documentsData.status) {
                                return Promise.reject(responseMessages.invitedEmployee.documentNotFound)
                            }
                        } else {
                            return Promise.reject(responseMessages.invitedEmployee.invalidW4DocumentId)
                        }
                    }

                }
                return true;
            }),
        check('emergency_contacts.*.relationship_id')
            .trim()
            .escape()
            //.notEmpty().withMessage(responseMessages.employee.emergencyContactInfo.relationship_id)
            //.isInt().withMessage(responseMessages.employee.emergencyContactInfo.relationshipIdInvalid)
            .custom(async value => {
                let pattern = regexPatterns.numericOnlyRegex
                if (req.body.final) {
                    if (value == null || value === '') {
                        return Promise.reject(responseMessages.employee.emergencyContactInfo.relationship_id)
                    } else if (!pattern.test(value)) {
                        return Promise.reject(responseMessages.employee.emergencyContactInfo.relationshipIdInvalid)
                    } else {
                        const relationShipData = await indexService.find('relationship_types', ['id'], { id: value, is_active: true })
                        if (!relationShipData.status) {
                            return Promise.reject(responseMessages.employee.emergencyContactInfo.relationIdNotExists)
                        }
                    }
                }
                return true
            }),
        check("emergency_contacts.*.name")
            .trim()
            .custom(async value => {
                let pattern = regexPatterns.alphaCharactersAndSpacesOnly
                if (req.body.final) {
                    if (value == null || value === '') {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.nameRequired)
                    } else if (!pattern.test(value)) {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.nameInvalid)
                    }
                }
                return true
            }),
        check("emergency_contacts.*.mobile_number")
            .trim()
            .custom(async value => {
                let pattern = regexPatterns.digitsHyphensParenthesesOnly
                if (req.body.final) {
                    if (value == null || value === '') {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.contactNumberRequired)
                    } else if (!pattern.test(value)) {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.contactNumberInvalid)
                    }
                }
                return true
            }),
        check("emergency_contacts.*.address_1")
            .trim()
            .custom(async value => {
                if (req.body.final) {
                    if (value == null || value === '') {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.address1Required)
                    }
                }
                return true
            }),
        check("emergency_contacts.*.city")
            .trim()
            .custom(async value => {
                let pattern = regexPatterns.alphaNumericCharactersAndSpacesFiftyOnly
                if (req.body.final) {
                    if (value == null || value === '') {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.cityRequired)
                    } else if (!pattern.test(value)) {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.cityInvalid)
                    }
                }
                return true
            }),
        check("emergency_contacts.*.zip_code")
            .trim()
            .custom(async value => {
                if (req.body.final) {
                    if (value == null || value === '') {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.zipCodeRequired)
                    } else if (value.length < 5 && value.length > 10) {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.zipCodeShouldBe)
                    }
                }
                return true
            }),
        check('emergency_contacts.*.state_id')
            .trim()
            .escape()
            .custom(async (value) => {
                if (req.body.final) {
                    let pattern = regexPatterns.numericOnlyRegex
                    if (value == null || value === '') {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.stateIdRequired)
                    } else if (!pattern.test(value)) {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.stateIdInvalid)
                    } else {
                        const state = await indexService.find('states', ['id'], { id: value })
                        if (!state.status) {
                            return Promise.reject(responseMessages.configurations.state.IdNotExists)
                        }
                    }
                }
                return true
            }),
        check('emergency_contacts.*.country_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.configurations.state.countryId)
            .isInt().withMessage(responseMessages.configurations.country.countryIdInvalid)
            .custom(async (value) => {
                if (req.body.final) {
                    let pattern = regexPatterns.numericOnlyRegex
                    if (value == null || value === '') {
                        return Promise.reject(responseMessages.configurations.state.countryId)
                    } else if (!pattern.test(value)) {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.countryIdInvalid)
                    } else {
                        const contactData = await indexService.find('countries', ['id'], { id: value })
                        const status = contactData.status
                        if (!status) {
                            return Promise.reject(responseMessages.configurations.country.IdNotExists)
                        }
                    }
                }
            }),
        check('upload_documents').custom(async (value, { req }) => {
            let educationDocsCount = 0;
            for (const docType in value) {
                if (value.hasOwnProperty(docType)) {
                    const data = value[docType].data;
                    if (docType === 'education_documents') {
                        educationDocsCount = data.length;
                        if (educationDocsCount > 10) {
                            return Promise.reject(responseMessages.employee.visaDetails.maxTenFilesOnly)
                        }
                    } else if (docType === 'passport' || docType === 'i94' || docType === 'signed_ssn' || docType === 'drivers_license') {
                        educationDocsCount = data.length;
                        if (educationDocsCount > 1) {
                            return Promise.reject(responseMessages.employee.visaDetails.maxOneFilesOnly)
                        }
                    } else {
                        if (data.length > 5) {
                            return Promise.reject(responseMessages.employee.visaDetails.maxFiveFilesOnly)
                        }
                    }
                }
            }
            return true;
        })
    ];

    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    /**
     * If validation is success
     * + Update employee details in the collection.
     * If Validation Fails
     * + Return the error message.
     */
    if (errors.isEmpty()) {

        const condition = { id: req.params.id };
        var response = await inviteEmployeeService.update(req.body, condition);

        if (response.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.updatedSuccessfully,
                data: response.data[0]
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error
            }
        }

        // Log Response
        logResponse("info", req, responseData, "Update status of INVITE LINK EMPLOYEE Response.");

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

const onboardEmployee = tryCatch(async (req, res) => {
    let dateFormat = await format.getDateFormat(); // date format

    // Log Request
    logRequest("info", req, "Onboarding of INVITE LINK EMPLOYEE request");

    // Default Variable
    var responseData;
    var employeeData;

    let modified_date = req.body.date_of_joining != '' ? moment(req.body.date_of_joining, dateFormat).format('YYYY-MM-DD') : '';
    req.body.date_of_joining = modified_date // From date format

    // Writing validation rules to the input request
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
            .withMessage(responseMessages.invitedEmployee.inviteEmployeeIdRequired)
            .isInt()
            .withMessage(responseMessages.invitedEmployee.inviteEmployeeIdInvalid)
            .custom(async value => {
                employeeData = await indexService.find('invited_employee', ['id', 'link_expires_on', 'email_id'], { id: value, status: APPROVED });
                if (!employeeData.status) {
                    return Promise.reject(responseMessages.invitedEmployee.invitedEmployeeIdNotExists);
                } else {
                    req.body.email_id = employeeData.data[0].email_id;
                    return true;
                }
            }),
        check('email_id')
            .custom(async value => {
                existingEmployeeData = await indexService.find('employee', ['id'], { email_id: value });
                if (existingEmployeeData.status) {
                    return Promise.reject(responseMessages.invitedEmployee.employeeAlreadyExists)
                }
                return true;
            }),
        check("employment_type_id")
            .trim()
            .custom(async (value) => {
                if (value != null && value != '' && value != undefined) {
                    var pattern = regexPatterns.numbersSpaceRegex
                    if (pattern.test(value)) {
                        const employmentTypeData = await indexService.find('employment_types', ['id', 'name'], { id: value, is_active: 1 })
                        if (!employmentTypeData.status) {
                            return Promise.reject(responseMessages.employee.behalfOnboarding.employmentTypeIdNotExists)
                        }
                        req.body.employment_type_name = employmentTypeData.data[0].name
                        return true
                    } else {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.employmentTypeIdInvalid)
                    }
                } else {
                    return Promise.reject(responseMessages.employee.behalfOnboarding.employmentTypeIdRequired)
                }
            }),
        check('enable_login')
            .trim()
            .custom((value) => {
                if (value != null && value != '' && value != undefined) {
                    if (value != true && value != false && value != 1 && value != 0 && value != '1' && value != '0' && value != 'true' && value != 'false') {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.isEnableLoginIsInvalid);
                    }
                    return true
                } else {
                    return Promise.reject(responseMessages.employee.behalfOnboarding.isEnableLoginRequired)
                }
            }),
        check("employment_category_id")
            .trim()
            .custom(async (value) => {
                if (value != null && value != '' && value != undefined) {
                    var pattern = regexPatterns.numbersSpaceRegex
                    if (pattern.test(value)) {
                        const employmentCategoryData = await indexService.find('employee_categories', ['id'], { id: value, is_active: 1 })
                        if (!employmentCategoryData.status && value != '') {
                            return Promise.reject(responseMessages.employee.behalfOnboarding.employeeCategoryIdNotExists)
                        }
                        return true
                    } else {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.employeeCategoryIdInvalid)
                    }
                } else {
                    return Promise.reject(responseMessages.employee.behalfOnboarding.employeeCategoryIdRequired)
                }
            }),
        check("ssn")
            .trim()
            .custom(async (value) => {
                if (value != null && value != '' && value != undefined) {
                    var pattern = regexPatterns.ssnRegex
                    if (pattern.test(value)) {
                        return true
                    } else {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.ssnInvalid);
                    }
                } else {
                    // return Promise.reject(responseMessages.employee.behalfOnboarding.ssnRequired)
                    return true;
                }
            }),
        check('vendor_id')
            .trim()
            .custom(async (value) => {
                const vendor = await indexService.find('companies', ['id'], { id: value, entity_type: 'vendor', status: 'Active' }) // 
                if (value) {
                    if (!vendor.status) {
                        return Promise.reject(responseMessages.companies.vendorIdNotExists)
                    } else {
                        return true;
                    }
                }
            }),
        check('vendor_price')
            .trim()
            .custom((value) => {
                if (req.body?.vendor_id && (value == null || value === '' || value == undefined)) {
                    return Promise.reject(responseMessages.companies.vendorPriceRequired);
                } else if (req.body?.vendor_id && !regexPatterns.decimalNumberRegex.test(value)) {
                    return Promise.reject(responseMessages.companies.invalidVendorPrice);
                } else {
                    return true;
                }
            }),
        check("is_usc")
            .custom((value) => {
                if ((value != null && value != undefined && value != '') || value == 0) {
                    if (value != true && value != false && value != 1 && value != 0 && value != '1' && value != '0' && value != 'true' && value != 'false') {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.invalidUSCitizen)
                    }
                    return true
                } else {
                    return Promise.reject(responseMessages.employee.behalfOnboarding.requiredUSCitizen)
                }
            }),
        check('reporting_manager_id')
            .trim()
            .custom(async (value) => {
                if (req.body.employment_type_id == 1) {
                    if (value != null && value != '') {
                        var pattern = regexPatterns.uuidRegex;
                        if (pattern.test(value)) {
                            const employeeData = await indexService.find('employee', ['id'], { id: value, status: 'Active' });
                            if (!employeeData.status) {
                                return Promise.reject(responseMessages.employee.behalfOnboarding.reportingEmployeeIdNotExists)
                            }
                        } else {
                            return Promise.reject(responseMessages.employee.behalfOnboarding.reportingEmployeeIdInvalid)
                        }
                    } else {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.reportingEmployeeIdRequired)
                    }
                }
                return true
            }),
        check("department_id")
            .trim()
            .custom(async (value) => {
                if (req.body.employment_type_id == 1) {
                    if (value != null && value != '') {
                        if (Number.isInteger(Number(value))) {
                            var department = await indexService.find('departments', ['id'], { id: value, is_active: 1 })
                            if (!department.status && value != '') {
                                return Promise.reject(responseMessages.employee.behalfOnboarding.departmentIdNotExists);
                            }
                        } else {
                            return Promise.reject(responseMessages.employee.behalfOnboarding.departmentIdInvalid);
                        }
                    } else {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.departmentIdRequired)
                    }
                }
                return true
            }),
        check('role_id')
            .trim()
            .custom(async (value) => {
                if (req.body.employment_type_id == 1) {
                    if (value != null && value != '') {
                        var pattern = regexPatterns.numbersSpaceRegex;
                        if (pattern.test(value)) {
                            const roleData = await indexService.find('roles', ['id'], { id: value, is_active: 1 });
                            if (!roleData.status) {
                                return Promise.reject(responseMessages.employee.behalfOnboarding.roleIdNotExists)
                            }
                        } else {
                            return Promise.reject(responseMessages.employee.behalfOnboarding.invalidRoleId)
                        }
                    } else {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.roleIdRequired)
                    }
                } else {
                    return true
                }
            }),
        check("date_of_joining")
            .trim()
            .custom((value) => {
                if (value != null && value != '' && value != undefined) {
                    var isDate = new Date(value);
                    if (isNaN(isDate.getTime())) {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.dateOfJoiningInvalid);
                    }
                    return true
                } else {
                    return Promise.reject(responseMessages.employee.behalfOnboarding.dateOfJoiningRequired)
                }
            }),
        check("team_id")
            .trim()
            .custom(async (value) => {
                if (req.body.employment_type_id == 1) {
                    if (value != null && value != '') {
                        if (Number.isInteger(Number(value))) {
                            const employeeTeamData = await indexService.find('teams', ['id'], { id: value, is_active: 1 })
                            if (!employeeTeamData.status && value != '') {
                                return Promise.reject(responseMessages.employee.behalfOnboarding.teamIdNotExists)
                            }
                        } else {
                            return Promise.reject(responseMessages.employee.behalfOnboarding.teamIdInvalid)
                        }
                    } else {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.teamIdRequired)
                    }
                }
                return true
            })
    ];

    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    /**
     * If validation is success
     * + Update employee details in the collection.
     * If Validation Fails
     * + Return the error message.
     */
    if (errors.isEmpty()) {

        const condition = { id: req.params.id };
        var response = await inviteEmployeeService.onBoardEmployee(req.body, condition);

        if (response.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.updatedSuccessfully,
                data: response.data[0]
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error
            }
        }

        // Log Response
        logResponse("info", req, responseData, "Onboarding of INVITE LINK EMPLOYEE Response.");

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Update Status function to resubmit rejected documents of an invited employee.
 * 
 * Overview of function:
 * - Validate the request.
 *   + If successful
 *     ~ Call the 'updateStatus' service function to resubmit rejected documents of the invited employee.
 *     ~ Prepare the response with success data.
 *   + Else 
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'id' (body), must be an integer, must exist in 'invited_employee' table with status 'rejected', must not exceed `link_expires_on` date.
 *    + 'status' (body), must not be empty, must be either 'approved' or 'rejected'.
 *    + 'invited_employee_data' (body), must exist and must not be empty.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *   + Call the `updateStatus` service function to resubmit rejected documents of the invited employee.
 *   + If success:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with error message.
 * - If validation fails:
 *    + Add error validation to the response.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 * 
 *  * Notes:
 *  - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */

const updateStatus = tryCatch(async (req, res) => {
    // Log Request
    logRequest("info", req, "resubmit Rejected Documents of INVITE LINK EMPLOYEE request");

    // Default Variable
    var responseData;
    var employeeData;

    // Writing validation rules to the input request
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
            .withMessage(responseMessages.invitedEmployee.inviteEmployeeIdRequired)
            .isInt()
            .withMessage(responseMessages.invitedEmployee.inviteEmployeeIdInvalid)
            .custom(async value => {
                employeeData = await indexService.find('invited_employee', ['id', 'link_expires_on'], { id: value, status: [REJECTED, SUBMITTED] });
                if (!employeeData.status) {
                    return Promise.reject(responseMessages.invitedEmployee.invitedEmployeeIdNotExists);
                }

                // current time Must not exceed 'link_expires_on' time.
                if (employeeData.data[0].link_expires_on < new Date()) {
                    return Promise.reject(responseMessages.invitedEmployee.invitedEmployeeLinkExpired);
                }
            }),
        check('status')
            .notEmpty()
            .isIn([APPROVED, REJECTED])
            .withMessage(responseMessages.invitedEmployee.invitedEmployeeStatusInvalid)
            .custom(value => {

                // If status value is approved check for mandatory keys required for each specific document
                // if (value == APPROVED) {
                //   const documentsDataRequired = employeeData.data[0].upload_documents;

                // }
                return true;
            }),
        check('invited_employee_data')
            .custom(value => {
                if (value && Object.keys(value).length === 0) {
                    return Promise.reject(responseMessages.invitedEmployee.documentDataRequired)
                }
                return true;
            })
    ];

    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    /**
     * If validation is success
     * + Update employee details in the collection.
     * If Validation Fails
     * + Return the error message.
     */
    if (errors.isEmpty()) {

        const condition = { invited_employee_id: req.params.id };
        var response = await inviteEmployeeService.updateStatus(req.body, condition);

        if (response.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.updatedSuccessfully,
                data: response.data[0]
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error
            }
        }

        // Log Response
        logResponse("info", req, responseData, "Update status of INVITE LINK EMPLOYEE Response.");

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Invitation Reminder function to send a reminder for invitation to an employee.
 * 
 * Overview of function:
 * - Validate the request.
 *   + If successful
 *     ~ Call the 'invitationReminder' service function to send a reminder for invitation to the employee.
 *     ~ Prepare the response with success data or error message.
 *   + Else 
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'id' (body), must be an integer, must exist in 'invited_employee' table with status 'invitation_sent'.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *   + Call the `invitationReminder` service function to send a reminder for invitation to the employee.
 *   + If success:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with error message.
 * - If validation fails:
 *    + Add error validation to the response.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 * 
 *  * Notes:
 *  - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */

const invitationReminder = tryCatch(async (req, res) => {
    // Log Request
    logRequest('info', req, 'sending invitation reminder');

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
            .escape()
            .notEmpty()
            .withMessage(responseMessages.invitedEmployee.inviteEmployeeIdRequired)
            .isInt()
            .withMessage(responseMessages.invitedEmployee.inviteEmployeeIdInvalid)
            .custom(async value => {
                employeeData = await indexService.find('invited_employee', ['id', 'link_expires_on', 'upload_documents'], { id: value, status: INVITATION_SENT });
                if (!employeeData.status) {
                    return Promise.reject(responseMessages.invitedEmployee.invitedEmployeeIdNotExists);
                }
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
        let condition = { id: req.params.id }
        var employeeData = await inviteEmployeeService.invitationReminder(req.body, condition);

        if (!employeeData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, error: employeeData.error, data: [] }
        }
        else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: employeeData.data };
        }

        // Log Response
        logResponse('info', req, responseData, 'sending invitation reminder Response')

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

const updateDocumentStatus = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, 'Update Invite Via Link Document Status Request');

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
            .escape()
            .notEmpty()
            .withMessage(responseMessages.invitedEmployee.inviteEmployeeIdRequired)
            .isInt()
            .withMessage(responseMessages.invitedEmployee.inviteEmployeeIdInvalid)
            .custom(async value => {
                const employeeData = await indexService.find('invited_employee', ['id'], { id: value });
                if (!employeeData.status) {
                    return Promise.reject(responseMessages.invitedEmployee.invitedEmployeeIdNotExists);
                }
                return true;
            }),
        check('upload_documents')
            .notEmpty()
            .withMessage(responseMessages.invitedEmployee.uploadDocumentsRequired)
            .custom(documentsData => {
                if (documentsData) {
                    for (const key of Object.keys(documentsData)) {
                        const documentData = documentsData[key]?.data;
                        for (const obj of documentData) {
                            console.log(obj.name, key, 'obj.name test')
                            if (!obj.hasOwnProperty('name') || obj.name !== key) {
                                return Promise.reject(responseMessages.invitedEmployee.invalidDocument + '--' + key);
                            }
                        }
                    }
                }
                return true;
            })
    ];

    // process.exit();
    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    if (errors.isEmpty()) {

        req.body.updateStatus = IN_PROGRESS;
        var response = await inviteEmployeeService.documentUpdate(req.body);

        if (!response.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: response.message, error: response.error,
                message: responseMessages.common.noRecordFound,
                data: []
            }
        }
        else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: response.data
            };
        }

        // Log Response
        logResponse('info', req, responseData, 'Update Invite Via Link Document Status Response')

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }

});

module.exports = { store, index, listing, update, onboardEmployee, invitationReminder, updateStatus, updateDocumentStatus }