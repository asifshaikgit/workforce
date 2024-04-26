const { responseMessages } = require("../../../../../constants/responseMessage");
const { logRequest, logResponse } = require("../../../../../utils/log");
const { tryCatch } = require("../../../../../utils/tryCatch");
const onBoardingDocumentTypesService = require("../../services/configurations/onBoardingDocumentTypeService");
const indexServices = require("../../repositories/index");
const { responseHandler } = require('../../../../responseHandler');
const format = require('../../../../../helpers/format');

/**
 * @constant check Creates a middleware/validation chain for one or more fields that may be located in any of the following:
 */
const { check, validationResult } = require('express-validator');

/**
 * @constant InvalidRequestError Default class for handling invalid request
 */
const InvalidRequestError = require('../../../../../error/InvalidRequestError');

/**
 * @constant responseCodes responseCodes constant variables
 */
const { responseCodes } = require('../../../../../constants/responseCodes');

/**
 * Validation Rules for store and update
 * - Define the validation rules as follows:
 *   + 'request_id' (body), must not be empty.
 *   + 'name' (body), must not be empty, must be unique with other records.
 *   + 'is_editable' (body), must not be empty, should be Boolean.
 *   + 'description' (body), 
 *   + 'is_mandatory' (body), must not be empty, should be boolean.
 *   + 'status' (body), must not be empty, should be boolean.
 */
async function validationRules(req) {

    let updateValidationRules = [];

    if (req.body.id) {
        updateValidationRules = [
            check('id')
                .trim()
                .escape()
                .notEmpty()
                .withMessage(responseMessages.configurations.IdNotExists)
                .custom(async (value) => {
                    const documentExistance = await indexServices.find('onboarding_document_types', ['id', 'is_editable'], { id: value });

                    if (!documentExistance.status) {
                        return Promise.reject(
                            responseMessages.configurations.documentTypes.IdNotExists
                        )
                    } else {
                        if (!documentExistance.data[0].is_editable) {
                            return Promise.reject(
                                responseMessages.configurations.documentTypes.notAllowToModify
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
        check('name')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.configurations.documentTypes.documentTypeNameRequired)
            .custom(async (value) => {
                let uniqueName = await indexServices.find('onboarding_document_types', ['id'], { name: value });
                // if req.body consists of id name should be unique from other names of the records
                if (uniqueName.status) {
                    if (req.body.id && (req.body.id == uniqueName.data[0].id)) {
                        return true;
                    } else {
                        return Promise.reject(
                            responseMessages.configurations.documentTypes.documentTypeNameExists
                        )
                    }
                }
            }),
        // check('is_editable')
        //     .trim()
        //     .notEmpty()
        //     .withMessage(responseMessages.configurations.onboardingDocument.isEditableRequired)
        //     .isBoolean()
        //     .withMessage(responseMessages.configurations.onboardingDocument.isEditableInvalid),
        check('is_mandatory')
            .trim()
            .isBoolean()
            .withMessage(responseMessages.configurations.onboardingDocument.isMandatoryInvalid),
        check('status')
            .trim()
            .isBoolean()
            .withMessage(responseMessages.configurations.onboardingDocument.statusInvalid)
    ];

    return [...updateValidationRules, ...validationRules];
}

/**
 * On Boarding Document Types Store request to store on boarding document types
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Store the details in `onboarding_document_types` table and return the data.
 *      ~ Add success to the response
 *    + Else 
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Log the incoming request.
 *  - Set default variables for `responseData`.
 *  - Call the validationRules function to get the validation rules.
 *  - Run the validation rules.
 *  - If validation is successful:
 *      + Call the `store` service function to create a new document_type.
 *      + If success:
 *        - Prepare the resposne with success data.
 *       Else:
 *        - Prepare the response with error message.
 *  - If validation fails:
 *    + Add error validation to the resposne.
 *  - Log the response.
 *  - Return the response using `responseHandler()`.
 * 
 * Notes:
 * - Exception handling using try-catch
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 * 
 */
// As per the new requirement no new Onboarding Documents can be added.
//const store = tryCatch(async (req, res) => {
//    // Log Request
//    logRequest('info', req, 'New On Boarding Document Types request');

//    // Default variable
//    let responseData = [];

//    var validations = await validationRules(req);

//    /* Run the validation rules. */
//    for (const validation of validations) {
//        const result = await validation.run(req);
//        if (result.errors.length) break;
//    }
//    const errors = validationResult(req);
//    /* Run the validation rules. */

//    /**
//     * If validation is success
//     *    + Call the create onBoardingDocumentType service function
//     *    - Based on the status in create onBoardingDocumentType function response, segregate the response and prepare the response
//     * If Validation Fails
//     *    + Return the error message.
//     */
//    if (errors.isEmpty()) {

//        const onBoardingDocumentType = await onBoardingDocumentTypesService.store(req.body);

//        if (onBoardingDocumentType.status) {
//            responseData = {
//                statusCode: responseCodes.codeSuccess,
//                message: responseMessages.common.addedSuccessfully
//            };
//        } else {
//            responseData = {
//                statusCode: responseCodes.codeInternalError,
//                message: responseMessages.common.somethindWentWrong,
//                error: onBoardingDocumentType.error
//            };
//        }

//        // Log Response
//        logResponse('info', req, responseData, "New On Boarding Document Types Respose");

//        // Return the response
//        responseHandler(res, responseData);

//    } else {
//        throw new InvalidRequestError(
//            errors.array()[0].msg,
//            responseCodes.codeUnprocessableEntity
//        );
//    }
//});

/**
 * On Boarding Document Types Update request to update on boarding document types
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Update the details in `onboarding_document_types` table and return the data.
 *      ~ Add success to the response
 *    + Else 
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Log the incoming request.
 *  - Set default variables for `responseData`.
 *  - Set the id from request params to request body.
 *  - Call the validationRules function to get the validation rules.
 *  - Run the validation rules.
 *  - If validation is successful:
 *      + Call the `update` service function to update the existing document_type.
 *      + If success:
 *        - Prepare the response with success data.
 *       Else:
 *        - Prepare the response with error message.
 *  - If validation fails:
 *    + Add error validation to the response.
 *  - Log the response.
 *  - Return the response using `responseHandler()`.
 * 
 * Notes:
 * - Exception handling using try-catch
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 * 
 */
const update = tryCatch(async (req, res) => {
    // Log the incoming request
    logRequest('info', req, 'Update On Boarding Document Types request');

    // Set the id from request params to request body
    req.body.id = req.params.id;

    // Default variable for response data
    let responseData = [];

    // Define validation rules for the input request
    var validations = await validationRules(req);

    // Run the validation rules
    for (let validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break; // If there are errors, stop validation
    }

    // Get validation errors
    var errors = validationResult(req);

    // If there are no validation errors
    if (errors.isEmpty()) {
        // Call the service function to update the data
        const onBoardingDocumentType = await onBoardingDocumentTypesService.update(req.body);

        // Check if the update operation was successful
        if (onBoardingDocumentType.status) {
            // Prepare success response
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.updatedSuccessfully
            };
        } else {
            // Prepare error response if something went wrong during update
            responseData = {
                statusCode: responseCodes.codeInternalError,
                message: responseMessages.common.somethindWentWrong,
                error: onBoardingDocumentType.error
            };
        }

        // Log the response
        logResponse('info', req, responseData, "Update On Boarding Document Types Response");

        // Return the response
        responseHandler(res, responseData);
    } else {
        // If there are validation errors, throw an InvalidRequestError
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
});

/**
 * On Board Document Types Listing request to get on boarding document types listing
 * Overview of API:
 *  - Log Request
 *  - Format date
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Get on boarding document types listing and return the data.
 *    + Else 
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Log the incoming request.
 *  - Get date format.
 *  - Set default variable for responseData.
 *  - Write validation rules to the input request.
 *  - Run the validation rules.
 *  - If validation is successful:
 *      + Call the `listing` service function to get the on boarding document types listing.
 *      + If success:
 *        - Prepare the response with success data.
 *       Else:
 *        - Prepare the response with error message.
 *  - If validation fails:
 *    + Add error validation to the response.
 *  - Log the response.
 *  - Return the response using `responseHandler()`.
 * 
 * Notes:
 * - Exception handling using try-catch
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 * 
 */
const listing = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, "Getting On Board Document Types request");

    // date format
    var dateFormat = await format.getDateFormat();

    // Default Variable
    var responseData;

    // Writing validation rules to the input request
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired)
    ];

    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    /**
     * If validation is success
     * + get employee details in the collection.
     * If Validation Fails
     * + Return the error message.
     */
    if (errors.isEmpty()) {

        const listing = await onBoardingDocumentTypesService.listing(dateFormat);

        if (!listing.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: listing.message,
                error: listing.error,
                message: responseMessages.common.noRecordFound,
                data: []
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: listing.data
            }
        }
        // Log Response 
        logResponse('info', req, responseData, "Getting on boarding document types listing Response");

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
 * On Board Document Types Index request to get on boarding document types index
 * Overview of API:
 *  - Log Request
 *  - Format date
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Get on boarding document types index and return the data.
 *    + Else 
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Log the incoming request.
 *  - Get date format.
 *  - Set default variable for responseData.
 *  - Write validation rules to the input request.
 *  - Run the validation rules.
 *  - If validation is successful:
 *      + Call the `index` service function to get the on boarding document types index.
 *      + If success:
 *        - Prepare the response with success data.
 *       Else:
 *        - Prepare the response with error message.
 *  - If validation fails:
 *    + Add error validation to the response.
 *  - Log the response.
 *  - Return the response using `responseHandler()`.
 * 
 * Notes:
 * - Exception handling using try-catch
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 * 
 */
const index = tryCatch(async (req, res) => {
    // Log Request
    logRequest('info', req, "Getting On Board Document Types index request");

    // date format
    const dateFormat = await format.getDateFormat();

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
            .withMessage(responseMessages.configurations.documentTypes.documentTypeId)
            .isInt()
            .withMessage(responseMessages.configurations.documentTypes.IdInvalid)
            .custom(async (value) => {
                const documentExistance = await indexServices.find('onboarding_document_types', ['id', 'is_editable'], { id: value });
                if (!documentExistance.status) {
                    return Promise.reject(
                        responseMessages.configurations.documentTypes.IdNotExists
                    )
                }
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
     * + get employee details in the collection.
     * If Validation Fails
     * + Return the error message.
     */
    if (errors.isEmpty()) {
        var condition = { id: req.query.id }
        const index = await onBoardingDocumentTypesService.index(dateFormat, condition);

        if (!index.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: index.message,
                error: index.error,
                message: responseMessages.common.noRecordFound,
                data: []
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: index.data
            }
        }
        // Log Response 
        logResponse('info', req, responseData, "Getting on boarding document types index Response");

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
 * On Board Document Types Update Status request to update status of on boarding document types
 * Overview of API:
 *  - Log Request
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Update status of on boarding document types and return the data.
 *    + Else 
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Log the incoming request.
 *  - Set default variable for responseData.
 *  - Write validation rules to the input request.
 *  - Run the validation rules.
 *  - If validation is successful:
 *      + Call the `updateStatus` service function to update the status of on boarding document types.
 *      + If success:
 *        - Prepare the response with success data.
 *       Else:
 *        - Prepare the response with error message.
 *  - If validation fails:
 *    + Add error validation to the response.
 *  - Log the response.
 *  - Return the response using `responseHandler()`.
 * 
 * Notes:
 * - Exception handling using try-catch
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 * 
 */
const updateStatus = tryCatch(async (req, res) => {
    // Log Request
    logRequest('info', req, "Getting On Board Document Types update status request");

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
            .withMessage(responseMessages.configurations.IdNotExists)
            .isInt()
            .withMessage(responseMessages.configurations.documentTypes.IdInvalid)
            .custom(async (value) => {
                const documentExistance = await indexServices.find('onboarding_document_types', ['id', 'is_editable'], { id: value });
                if (!documentExistance.status) {
                    return Promise.reject(
                        responseMessages.configurations.documentTypes.IdNotExists
                    )
                } else {
                    if (documentExistance.data[0].is_editable) {
                        return Promise.reject(
                            responseMessages.configurations.documentTypes.notAllowToModify
                        )
                    }
                }
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
     * + get employee details in the collection.
     * If Validation Fails
     * + Return the error message.
     */
    if (errors.isEmpty()) {
        var condition = { id: req.params.id }
        const updateStatus = await onBoardingDocumentTypesService.updateStatus(req.body, condition);

        if (!updateStatus.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: updateStatus.message,
                error: updateStatus.error,
                message: responseMessages.common.somethindWentWrong,
                data: []
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.updatedSuccessfully,
                data: updateStatus.data
            }
        }
        // Log Response 
        logResponse('info', req, responseData, "Getting on boarding document types update status Response");

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
 * On Board Document Types Destroy request to delete on boarding document types
 * Overview of API:
 *  - Log Request
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Delete on boarding document types and return the data.
 *    + Else 
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Log the incoming request.
 *  - Set default variable for responseData.
 *  - Write validation rules to the input request.
 *  - Run the validation rules.
 *  - If validation is successful:
 *      + Call the `destroy` service function to delete the on boarding document types.
 *      + If success:
 *        - Prepare the response with success data.
 *       Else:
 *        - Prepare the response with error message.
 *  - If validation fails:
 *    + Add error validation to the response.
 *  - Log the response.
 *  - Return the response using `responseHandler()`.
 * 
 * Notes:
 * - Exception handling using try-catch
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 * 
 */
// As per the new requirement these documents cannot be deleted.
//const destroy = tryCatch(async (req, res) => {
//    // Log Request
//    logRequest('info', req, "On Board Document Types destroy request");

//    // Default Variable
//    var responseData;

//    // Writing validation rules to the input request
//    var validations = [
//        check("request_id")
//            .trim()
//            .escape()
//            .notEmpty()
//            .withMessage(responseMessages.common.requestIdRequired),
//        check('id')
//            .trim()
//            .escape()
//            .notEmpty()
//            .withMessage(responseMessages.configurations.IdNotExists)
//            .isInt()
//            .withMessage(responseMessages.configurations.documentTypes.IdInvalid)
//            .custom(async (value) => {
//                const documentExistance = await indexServices.find('onboarding_document_types', ['id', 'is_editable'], { id: value });
//                if (!documentExistance.status) {
//                    return Promise.reject(
//                        responseMessages.configurations.documentTypes.IdNotExists
//                    )
//                } else {
//                    if (documentExistance.data[0].is_editable) {
//                        return Promise.reject(
//                            responseMessages.configurations.documentTypes.notAllowToModify
//                        )
//                    }
//                }
//            })
//    ];

//    // Run the validation rules.
//    for (var validation of validations) {
//        var result = await validation.run(req);
//        if (result.errors.length) break;
//    }
//    var errors = validationResult(req);

//    /**
//     * If validation is success
//     * + get employee details in the collection.
//     * If Validation Fails
//     * + Return the error message.
//     */
//    if (errors.isEmpty()) {
//        var condition = { id: req.params.id }
//        const updateStatus = await onBoardingDocumentTypesService.destroy(req.body, condition);

//        if (!updateStatus.status) {
//            responseData = {
//                statusCode: responseCodes.codeSuccess,
//                message: updateStatus.message,
//                error: updateStatus.error,
//                message: responseMessages.common.somethindWentWrong,
//                data: []
//            }
//        } else {
//            responseData = {
//                statusCode: responseCodes.codeSuccess,
//                message: responseMessages.common.updatedSuccessfully,
//                data: updateStatus.data
//            }
//        }
//        // Log Response 
//        logResponse('info', req, responseData, "on boarding document types destroy Response");

//        // Return the response
//        responseHandler(res, responseData);
//    } else {
//        throw new InvalidRequestError(
//            errors.array()[0].msg,
//            responseCodes.codeUnprocessableEntity
//        );
//    }
//});

/**
 * On Board Document Types Listing for invite link with default and mandatory seperated request.
 * Overview of API:
 *  - Log Request
 *  - Format date
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Get on boarding document types listing and return the data.
 *    + Else 
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Log the incoming request.
 *  - Get date format.
 *  - Set default variable for responseData.
 *  - Write validation rules to the input request.
 *  - Run the validation rules.
 *  - If validation is successful:
 *      + Call the `listing` service function to get the on boarding document types listing.
 *      + If success:
 *        - Prepare the response with success data.
 *       Else:
 *        - Prepare the response with error message.
 *  - If validation fails:
 *    + Add error validation to the response.
 *  - Log the response.
 *  - Return the response using `responseHandler()`.
 * 
 * Notes:
 * - Exception handling using try-catch
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const inviteLinkDocuments = tryCatch(async (req, res) => {
    // Log Request
    logRequest('info', req, "Getting On Board Document Types request");

    // date format
    var dateFormat = await format.getDateFormat();

    // Default Variable
    var responseData;

    // Writing validation rules to the input request
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired)
    ];

    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    /**
     * If validation is success
     * + get employee details in the collection.
     * If Validation Fails
     * + Return the error message.
     */
    if (errors.isEmpty()) {

        const listing = await onBoardingDocumentTypesService.listing(dateFormat);

        if (!listing.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: listing.message,
                error: listing.error,
                message: responseMessages.common.noRecordFound,
                data: []
            }
        } else {
            let finalObject = {};
            listing?.data?.forEach(document => {
                const object = {
                    [document.slug]: {
                        'default': document?.is_mandatory,
                        'checked': (document?.is_mandatory) ?? false,
                        'status': false,
                        'data':[]

                    }
                };
                finalObject = { ...finalObject, ...object };
            });

            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: finalObject
            }
        }
        // Log Response 
        logResponse('info', req, responseData, "Getting on boarding document types listing Response");

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
});

module.exports = { update, listing, index, updateStatus, inviteLinkDocuments }