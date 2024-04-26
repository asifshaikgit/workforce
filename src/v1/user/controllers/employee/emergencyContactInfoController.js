const { check, validationResult } = require('express-validator')
const { logRequest, logResponse } = require('../../../../../utils/log')
const { responseMessages } = require('../../../../../constants/responseMessage')
const { responseCodes } = require('../../../../../constants/responseCodes')
const { responseHandler } = require('../../../../responseHandler')
const emergencyContactInfoService = require('../../services/employee/emergencyContactInfoService')
const { tryCatch } = require('../../../../../utils/tryCatch')
const InvalidRequestError = require('../../../../../error/InvalidRequestError')
const { pagination } = require("../../../../../config/pagination")
const indexService = require('../../services/index');
const { join } = require('path')
const { regexPatterns } = require('../../../../../constants/regexPatterns')

/**
 * Update function to modify an employee's emergency contact information.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'emergencyContactInfoService.update' service function to modify employee's emergency contact information.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table (if not empty).
 *    + 'emergency_contact.*.id' (body), must not be empty, should be an integer, and should exist in 'emergency_contact_information' table.
 *    + 'emergency_contact.*.relationship_id' (body), must not be empty, should be an integer, and should exist in 'relationship_types' table.
 *    + 'emergency_contact.*.name' (body), must not be empty, and should contain only alphabetic characters.
 *    + 'emergency_contact.*.contact_number' (body), must not be empty and should contain only valid characters for contact numbers.
 *    + 'emergency_contact.*.email_id' (body), must not be empty and should be a valid email address.
 *    + 'emergency_contact.*.address_1' (body), must not be empty.
 *    + 'emergency_contact.*.city' (body), must not be empty, and should not contain certain special characters.
 *    + 'emergency_contact.*.zip_code' (body), must not be empty, and should have a specific length.
 *    + 'emergency_contact.*.state_id' (body), must not be empty, and should exist in 'states'.
 *    + 'emergency_contact.*.country_id' (body), must not be empty, and should exist in 'countries'.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `emergencyContactInfoService.update` service function to modify the employee's emergency contact information.
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
    logRequest('info', req, "update employee emergency Contact Info request.");
    /* Log Request */

    /* Default Variable */
    var responseData = '';
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check("employee_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
            .isUUID()
            .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
            .custom(async (value) => {
                const employee = await indexService.find('employee', ['id', 'employment_type_id'], { id: value })
                if (!employee.status && value != '') {
                    return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
                }
                req.body.employment_type_id = employee.data[0].employment_type_id
                return true
            }),
        check('emergency_contact.*.id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.employee.emergencyContactInfo.id)
            .isInt().withMessage(responseMessages.employee.emergencyContactInfo.IdInvalid)
            .custom(async (value) => {
                const emergencyContactInfo = await indexService.find('emergency_contact_information', ['id'], { id: value })
                if (!emergencyContactInfo.status) {
                    return Promise.reject(responseMessages.employee.emergencyContactInfo.IdNotExists)
                }
                return true
            })
    ];
    /* Writing validation rules to the input request */

    /** Get Emergency Contact Validation Rules */
    var emergencyContact = await emergencyContactValidations(req);
    validations = [...validations, ...emergencyContact];

    /*Run the validation rules. */
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    /*Run the validation rules. */

    /**
     * Updates the employee's emergency contact information if there are no errors.
     * Otherwise, throws an InvalidRequestError with the first error message.t.
     */
    if (errors.isEmpty()) {
        let emergency_contact = req.body.emergency_contact;
        if (emergency_contact?.length > 0) {
            emergency_contact = emergency_contact.filter(obj => Object.values(obj).some(value => value !== '' && value !== null));
        }
        if (emergency_contact.length > 0) {
            let emergency;
            if (emergency_contact[0]?.clear_all === true) {
                const condition = { id: emergency_contact[0].id }
                emergency = await emergencyContactInfoService.destroy(req.body, condition)
            } else {
                emergency = await emergencyContactInfoService.update(req.body);
            }
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully }
            if (emergency.status) {
                responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully }
            } else {
                responseData = {
                    statusCode: responseCodes.codeInternalError,
                    message: responseMessages.common.somethindWentWrong, error: emergency.error
                }
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: ''
            }
        }

        /* Log Response */
        logResponse("info", req, responseData, "Update employee emergency Contact Info  Response.");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Destroy function to delete an employee's emergency contact details.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'emergencyContactInfoService.destroy' service function to delete the employee's emergency contact details.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'id' (params), must not be empty, should be an integer, and should exist in 'emergency_contact_information' table.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `emergencyContactInfoService.destroy` service function to delete the employee's emergency contact details.
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
const destroy = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, 'Delete emergency contact details request')
    /* Log Request */

    /* Default Variable */
    var responseData = ''
    /* Default Variable */

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
            .withMessage(responseMessages.employee.emergencyContactInfo.id)
            .isInt().withMessage(responseMessages.employee.emergencyContactInfo.IdInvalid)
            .custom(async (value) => {
                const emergencyContactInfo = await indexService.find('emergency_contact_information', ['id', 'employee_id'], { id: value })
                if (!emergencyContactInfo.status) {
                    return Promise.reject(responseMessages.employee.emergencyContactInfo.IdNotExists)
                } else {
                    // Get Employee Details 
                    const employee = await indexService.find('employee', ['id', 'employment_type_id'], { id: emergencyContactInfo.data?.[0].employee_id });
                    req.body.employee_id = employee?.data[0].id;
                    if (employee?.data[0]?.employment_type_id == 2) {
                        const emergencyContactlength = await indexService.find('emergency_contact_information', ['id'], { employee_id: emergencyContactInfo.data[0]?.employee_id, deleted_at: null });
                        if (emergencyContactlength.data.length < 3) {
                            return Promise.reject(responseMessages.employee.emergencyContactInfo.atLeastTwoContacts)
                        }
                    }
                    return true
                }
            })
    ]

    /*Run the validation rules. */
    for (let validation of validations) {
        var result = await validation.run(req)
        if (result.errors.length) break
    }
    var errors = validationResult(req)
    /*Run the validation rules. */

    if (errors.isEmpty()) {
        const condition = { id: req.params.id };
        await emergencyContactInfoService.destroy(req.body, condition);
        responseData = {
            statusCode: responseCodes.codeSuccess,
            message: responseMessages.common.deletedSuccessfully
        }

        /* Log Response */
        logResponse('info', req, responseData, 'Delete emergency contact details Response')
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData)
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity)
    }
});

/**
 * Store function to modify an employee's emergency contact information.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'emergencyContactInfoService.store' service function to modify employee's emergency contact information.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table (if not empty).
 *    + 'emergency_contact.*.relationship_id' (body), must not be empty, should be an integer, and should exist in 'relationship_types' table.
 *    + 'emergency_contact.*.name' (body), must not be empty, and should contain only alphabetic characters.
 *    + 'emergency_contact.*.contact_number' (body), must not be empty and should contain only valid characters for contact numbers.
 *    + 'emergency_contact.*.email_id' (body), must not be empty and should be a valid email address.
 *    + 'emergency_contact.*.address_1' (body), must not be empty.
 *    + 'emergency_contact.*.city' (body), must not be empty, and should not contain certain special characters.
 *    + 'emergency_contact.*.zip_code' (body), must not be empty, and should have a specific length.
 *    + 'emergency_contact.*.state_id' (body), must not be empty, and should exist in 'states'.
 *    + 'emergency_contact.*.country_id' (body), must not be empty, and should exist in 'countries'.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `emergencyContactInfoService.store` service function to store the employee's emergency contact information.
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
    logRequest('info', req, "store employee emergency Contact Info request.");
    /* Log Request */

    /* Default Variable */
    var responseData = '';
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check("employee_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
            .isUUID()
            .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
            .custom(async (value) => {
                const employee = await indexService.find('employee', ['id', 'employment_type_id'], { id: value })
                if (!employee.status && value != '') {
                    return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
                }
                req.body.employment_type_id = employee.data[0].employment_type_id;
                return true
            })
    ];
    /* Writing validation rules to the input request */


    /** Get Emergency Contact Validation Rules */
    var emergencyContact = await emergencyContactValidations(req);
    validations = [...validations, ...emergencyContact];

    /*Run the validation rules. */
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    /*Run the validation rules. */

    /**
     * Stores the employee's emergency contact information if there are no errors.
     * Otherwise, throws an InvalidRequestError with the first error message.t.
     */
    if (errors.isEmpty()) {
        let emergency_contact = req.body.emergency_contact;
        if (emergency_contact?.length > 0) {
            emergency_contact = emergency_contact.filter(obj => {
                // Check if any value in the object is not empty or null (excluding 'clear_all')
                return Object.entries(obj).some(([key, value]) => key !== 'clear_all' && value !== '' && value !== null);
            });
        }
        if (emergency_contact.length > 0) {
            var emergency = await emergencyContactInfoService.store(req.body);
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully }
            if (emergency.status) {
                responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully }
            } else {
                responseData = {
                    statusCode: responseCodes.codeInternalError,
                    message: responseMessages.common.somethindWentWrong, error: emergency.error
                }
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: ''
            }
        }

        /* Log Response */
        logResponse("info", req, responseData, "Update employee emergency Contact Info  Response.");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
})

/**
 * Validation Rules for Employee Emergency Contacts
 * Only For Consultant each key in emergency contacts are mandatory.
 * 
 *    + 'emergency_contact.*.relationship_id' (body), must not be empty, should be an integer, and should exist in 'relationship_types' table.
 *    + 'emergency_contact.*.name' (body), must not be empty, and should contain only alphabetic characters.
 *    + 'emergency_contact.*.contact_number' (body), must not be empty and should contain only valid characters for contact numbers.
 *    + 'emergency_contact.*.address_1' (body), must not be empty.
 *    + 'emergency_contact.*.city' (body), must not be empty, and should not contain certain special characters.
 *    + 'emergency_contact.*.zip_code' (body), must not be empty, and should have a specific length.
 *    + 'emergency_contact.*.state_id' (body), must not be empty, and should exist in 'states' table.
 *    + 'emergency_contact.*.country_id' (body), must not be empty, and should exist in 'countries' table.
 * @param {*} employment_type_id 
 * @returns array
 */
async function emergencyContactValidations(req) {
    const employee = await indexService.find('employee', ['id', 'employment_type_id'], { id: req.body.employee_id })
    if (!employee.status && req.body.employee_id != '') {
        return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
    }
    let employment_type_id = employee.data[0].employment_type_id
    let validations = [];
    validations = [
        check('emergency_contact.*.relationship_id')
            .trim()
            .escape()
            .custom(async value => {
                if (value != undefined && value != null && value != '') {
                    const relationShipData = await indexService.find('relationship_types', ['id'], { id: value, is_active: true })
                    if (!relationShipData.status) {
                        return Promise.reject(responseMessages.employee.emergencyContactInfo.relationIdNotExists)
                    }
                }
                return true;
            }),
        check("emergency_contact.*.name")
            .trim()
            .custom(value => {
                let pattern = regexPatterns.alphaCharactersAndSpacesThirtyThreeOnly
                if (value != undefined && value != '' && value != null) {
                    if (value.length > 33) {
                        return Promise.reject(
                            responseMessages.employee.behalfOnboarding.thirtyThreeCharOnly
                        )
                    }
                }
                return true;
            }),
        check("emergency_contact.*.contact_number")
            .trim()
            .custom(value => {
                let pattern = regexPatterns.phoneRegex
                if (value != undefined && value != '' && value != null) {
                    if (!pattern.test(value)) {
                        return Promise.reject(
                            responseMessages.employee.behalfOnboarding.thirtyThreeCharOnly
                        )
                    }
                }
                return true;
            }),
        check("emergency_contact.*.address_1")
            .trim()
            .custom(value => {
                if (value != undefined && value != '' && value != null) {
                    if (value.length > 255) {
                        return Promise.reject(
                            responseMessages.employee.emergencyContactInfo.addressOneInvalid
                        )
                    }
                }
                return true;
            }),
        check("emergency_contact.*.address_2")
            .trim()
            .custom(value => {
                if (value != undefined && value != '' && value != null) {
                    if (value.length > 255) {
                        return Promise.reject(
                            responseMessages.employee.emergencyContactInfo.addressTwoInvalid
                        )
                    }
                }
                return true;
            }),
        check("emergency_contact.*.city")
            .trim()
            .custom(value => {
                let pattern = regexPatterns.alphaNumericCharactersAndSpacesFiftyOnly
                if (value != undefined && value != '' && value != null) {
                    if (!pattern.test(value)) {
                        return Promise.reject(
                            responseMessages.employee.emergencyContactInfo.cityInvalid
                        )
                    }
                }
                return true;
            }),
        check("emergency_contact.*.zip_code")
            .trim()
            .custom(value => {
                let pattern = regexPatterns.zipcode
                if (value != undefined && value != '' && value != null) {
                    if (!pattern.test(value)) {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.zipCodeShouldBe)
                    }
                }
                return true;
            }),
        check('emergency_contact.*.state_id')
            .trim()
            .escape()
            .custom(async (value) => {
                if (value != undefined && value != null && value != '') {
                    const state = await indexService.find('states', ['id'], { id: value })
                    if (!state.status) {
                        return Promise.reject(responseMessages.configurations.state.IdNotExists)
                    }
                }
                return true;
            }),
        check('emergency_contact.*.country_id')
            .trim()
            .escape()
            .custom(async (value) => {

                if (value != undefined && value != null && value != '') {
                    const contactData = await indexService.find('countries', ['id'], { id: value })
                    const status = contactData.status
                    if (!status) {
                        return Promise.reject(responseMessages.configurations.country.IdNotExists)
                    }
                }
                return true;
            })
    ];
    return validations;
}

module.exports = { destroy, update, store };
