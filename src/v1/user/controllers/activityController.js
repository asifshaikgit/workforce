const activitytrackService = require('../services/activityServices');
const indexServices = require('../services/index')
const { check, validationResult } = require('express-validator');
const { logRequest, logResponse } = require('../../../../utils/log');
const { responseMessages } = require('../../../../constants/responseMessage');
const { responseCodes } = require('../../../../constants/responseCodes');
const { responseHandler } = require('../../../responseHandler');
const { tryCatch } = require('../../../../utils/tryCatch');
const { pagination } = require('../../../../config/pagination');
const InvalidRequestError = require('../../../../error/InvalidRequestError');
const { regexPatterns } = require('../../../../constants/regexPatterns')
const format = require('../../../../helpers/format');
const employeeExportServices = require("../services/export/employee/employeeExportServices");

/**
 * Activity Track Listing Request to fetch activity track data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the listing service function.
 *      ~ Fetch the data based on the provided query parameters.
 *      ~ Add success to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 *  - Logging incoming request.
 *  - Define the validation rules as follows:
 *    + request_id is mandatory and must be provided.
 *    + employee_id is not mandatory and must be an UUID.
 *  - Run the validation rules.
 *    + If validation is successful:
 *      ~ Call the listing service function to fetch the data.
 *      ~ Add the returned data to the response.
 *    + Else:
 *      ~ Add error validation to the response.
 *  - Prepare the response with appropriate status codes.
 *  - Log the response.
 *  - Return the response using responseHandler().
 *
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns None.
 * @throws {InvalidRequestError} - If the request ID or referrable ID is missing or invalid.
 */
const employeeActivitylisting = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, 'Employee Activity Track Listing Request')

    // Default variable
    let responseData = [];

    // Writing validation rules to the input request
    const validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('employee_id')
            .trim().escape()
            .optional()
            .custom(async value => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        const employeeData = await indexServices.find('employee', ['id'], { id: value });
                        if (!employeeData.status) {
                            return Promise.reject(responseMessages.employee.employeeIdNotExists);
                        }
                    } else {
                        return Promise.reject(responseMessages.employee.employeeIdInvalid);

                    }
                }
                return true
            }),
    ];

    // Run the validation rules.
    for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
    }
    const errors = validationResult(req);

    /**
     * If Validation is success
     *    + Call the listing service function
     *      - Based on the slug it will return the data
     * If Validation Fails
     *    + Return the error message. 
     */
    if (errors.isEmpty()) {

        let dateFormat = await format.getDateFormat(); // date format

        /* Default Variable */
        let limit = (req.body.limit) ? (req.body.limit) : pagination.limit;
        let page = (req.body.page) ? (req.body.page) : pagination.page;
        if (req.body.employee_id != '' && req.body.employee_id != null) {
            req.body.employee_id = req.body.employee_id
        } else {
            req.body.employee_id = null
        }
        const employeeActivityTrackListing = await activitytrackService.employeeActivitylisting(req.body, page, limit, dateFormat);
        if (!employeeActivityTrackListing.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.noRecordFound,
                error: employeeActivityTrackListing.error,
                data: []
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                data: employeeActivityTrackListing.data,
                pagination: employeeActivityTrackListing.pagination_data
            }
        }
        // Log Response
        logResponse('info', req, responseData, 'Employee Activity Track Listing Response');

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

const employeeActivityExport = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, 'Employee Activity Track Export Request')

    // Writing validation rules to the input request
    const validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('employee_id')
            .trim().escape()
            .optional()
            .custom(async value => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        const employeeData = await indexServices.find('employee', ['id'], { id: value });
                        if (!employeeData.status) {
                            return Promise.reject(responseMessages.employee.employeeIdNotExists);
                        }
                    } else {
                        return Promise.reject(responseMessages.employee.employeeIdInvalid);

                    }
                }
                return true
            }),
    ];

    // Run the validation rules.
    for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
    }
    const errors = validationResult(req);

    /**
     * If Validation is success
     *    + Call the listing service function
     *      - Based on the slug it will return the data
     * If Validation Fails
     *    + Return the error message. 
     */
    if (errors.isEmpty()) {

        /* Default Variable */
        let condition = {
            employee_id: req.body.employee_id
        };
        /* Condition */

        var exportData = await employeeExportServices.exportEmployeeActivityInfo(condition);
        if (!exportData.status) {
            responseData = {
                statusCode: responseCodes.codeInternalError,
                error: exportData.error,
                message: responseMessages.common.noRecordFound
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                path: exportData.filepath
            };
        }
        /* Log Response */
        logResponse('info', req, responseData, "Getting Employee Activity Track Export Response");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity,);
    }
})

/**
 * Activity Track Listing Request to fetch activity track data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the listing service function.
 *      ~ Fetch the data based on the provided query parameters.
 *      ~ Add success to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 *  - Logging incoming request.
 *  - Define the validation rules as follows:
 *    + request_id is mandatory and must be provided.
 *    + company_id is not mandatory and must be an UUID.
 *  - Run the validation rules.
 *    + If validation is successful:
 *      ~ Call the listing service function to fetch the data.
 *      ~ Add the returned data to the response.
 *    + Else:
 *      ~ Add error validation to the response.
 *  - Prepare the response with appropriate status codes.
 *  - Log the response.
 *  - Return the response using responseHandler().
 *
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns None.
 * @throws {InvalidRequestError} - If the request ID or referrable ID is missing or invalid.
 */
const companyActivitylisting = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, 'Company Activity Track Listing Request')

    // Default variable
    let responseData = [];

    // Writing validation rules to the input request
    const validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('slug_name')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.slugNameRequired)
            .isIn(['client', 'vendor', 'end-client'])
            .withMessage(responseMessages.companies.slugNameShouldbe),
        check('company_id')
            .trim().escape()
            .optional()
            .custom(async value => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        const companyData = await indexServices.find('companies', ['id'], { id: value });
                        if (!companyData.status) {
                            return Promise.reject(responseMessages.companies.companyIdNotExists);
                        }
                    } else {
                        return Promise.reject(responseMessages.companies.companyIDInvalid);

                    }
                }
                return true
            }),
    ];

    // Run the validation rules.
    for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
    }
    const errors = validationResult(req);

    /**
     * If Validation is success
     *    + Call the listing service function
     *      - Based on the slug it will return the data
     * If Validation Fails
     *    + Return the error message. 
     */
    if (errors.isEmpty()) {

        let dateFormat = await format.getDateFormat(); // date format

        /* Default Variable */
        let limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
        let page = (req.query.page) ? (req.query.page) : pagination.page;
        if (req.query.company_id != '' && req.query.company_id != null) {
            req.query.company_id = req.query.company_id
        } else {
            req.query.company_id = null
        }
        const companyActivityTrackListing = await activitytrackService.companyActivitylisting(req.query, page, limit, dateFormat);
        if (!companyActivityTrackListing.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.noRecordFound,
                error: companyActivityTrackListing.error,
                data: []
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                data: companyActivityTrackListing.data,
                pagination: companyActivityTrackListing.pagination_data
            }
        }
        // Log Response
        logResponse('info', req, responseData, 'Company Activity Track Listing Response');

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Activity Track Listing Request to fetch activity track data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the listing service function.
 *      ~ Fetch the data based on the provided query parameters.
 *      ~ Add success to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 *  - Logging incoming request.
 *  - Define the validation rules as follows:
 *    + request_id is mandatory and must be provided.
 *    + employee_id is not mandatory and must be an UUID.
 *  - Run the validation rules.
 *    + If validation is successful:
 *      ~ Call the listing service function to fetch the data.
 *      ~ Add the returned data to the response.
 *    + Else:
 *      ~ Add error validation to the response.
 *  - Prepare the response with appropriate status codes.
 *  - Log the response.
 *  - Return the response using responseHandler().
 *
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns None.
 * @throws {InvalidRequestError} - If the request ID or referrable ID is missing or invalid.
 */
const timesheetActivitylisting = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, 'TImesheet Activity Track Listing Request')

    // Default variable
    let responseData = [];

    // Writing validation rules to the input request
    const validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('timesheet_id')
            .trim().escape()
            .optional()
            .custom(async value => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        const timesheetData = await indexServices.find('timesheets', ['id'], { id: value });
                        if (!timesheetData.status) {
                            return Promise.reject(responseMessages.timesheet.TimesheetIdDoesNotExist);
                        }
                    } else {
                        return Promise.reject(responseMessages.timesheet.TimesheetIdInvalid);

                    }
                }
                return true
            }),
    ];

    // Run the validation rules.
    for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
    }
    const errors = validationResult(req);

    /**
     * If Validation is success
     *    + Call the listing service function
     *      - Based on the slug it will return the data
     * If Validation Fails
     *    + Return the error message. 
     */
    if (errors.isEmpty()) {

        let dateFormat = await format.getDateFormat(); // date format

        /* Default Variable */
        let limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
        let page = (req.query.page) ? (req.query.page) : pagination.page;
        if (req.query.timesheet_id != '' && req.query.timesheet_id != null) {
            req.query.timesheet_id = req.query.timesheet_id
        } else {
            req.query.timesheet_id = null
        }
        const timesheetActivityTrackListing = await activitytrackService.timesheetActivitylisting(req.query, page, limit, dateFormat);
        if (!timesheetActivityTrackListing.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.noRecordFound,
                error: timesheetActivityTrackListing.error,
                data: []
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                data: timesheetActivityTrackListing.data,
                pagination: timesheetActivityTrackListing.pagination_data
            }
        }
        // Log Response
        logResponse('info', req, responseData, 'Timesheet Activity Track Listing Response');

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

// /**
//  * Activity Track Listing Request to fetch activity track data.
//  * Overview of API:
//  *  - Validate the request.
//  *    + If success
//  *      ~ Call the listing service function.
//  *      ~ Fetch the data based on the provided query parameters.
//  *      ~ Add success to the response.
//  *    + Else
//  *      ~ Add error validation to the response.
//  *  - Return the response.
//  *
//  * Logic:
//  *  - Logging incoming request.
//  *  - Define the validation rules as follows:
//  *    + request_id is mandatory and must be provided.
//  *    + employee_id is not mandatory and must be an UUID.
//  *  - Run the validation rules.
//  *    + If validation is successful:
//  *      ~ Call the listing service function to fetch the data.
//  *      ~ Add the returned data to the response.
//  *    + Else:
//  *      ~ Add error validation to the response.
//  *  - Prepare the response with appropriate status codes.
//  *  - Log the response.
//  *  - Return the response using responseHandler().
//  *
//  * Notes:
//  *  - Exception handling using try-catch.
//  *
//  * @param {Request} req - The request object.
//  * @param {Response} res - The response object.
//  * @returns None.
//  * @throws {InvalidRequestError} - If the request ID or referrable ID is missing or invalid.
//  */
// const timesheetApprovalActivitylisting = tryCatch(async (req, res) => {

//     // Log Request
//     logRequest('info', req, 'TImesheet Approval Activity Track Listing Request')

//     // Default variable
//     let responseData = [];

//     // Writing validation rules to the input request
//     const validations = [
//         check('request_id')
//             .trim()
//             .escape()
//             .notEmpty()
//             .withMessage(responseMessages.common.requestIdRequired),
//         check('timesheet_id')
//             .trim().escape()
//             .optional()
//             .custom(async value => {
//                 if (value != null && value != '') {
//                     let pattern = regexPatterns.uuidRegex;
//                     if (pattern.test(value)) {
//                         const timesheetData = await indexServices.find('timesheets', ['id'], { id: value });
//                         if (!timesheetData.status) {
//                             return Promise.reject(responseMessages.timesheet.TimesheetIdDoesNotExist);
//                         }
//                     } else {
//                         return Promise.reject(responseMessages.timesheet.TimesheetIdInvalid);

//                     }
//                 }
//                 return true
//             }),
//     ];

//     // Run the validation rules.
//     for (const validation of validations) {
//         const result = await validation.run(req);
//         if (result.errors.length) break;
//     }
//     const errors = validationResult(req);

//     /**
//      * If Validation is success
//      *    + Call the listing service function
//      *      - Based on the slug it will return the data
//      * If Validation Fails
//      *    + Return the error message. 
//      */
//     if (errors.isEmpty()) {

//         let dateFormat = await format.getDateFormat(); // date format

//         /* Default Variable */
//         let limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
//         let page = (req.query.page) ? (req.query.page) : pagination.page;
//         if (req.query.timesheet_id != '' && req.query.timesheet_id != null) {
//             req.query.timesheet_id = req.query.timesheet_id
//         } else {
//             req.query.timesheet_id = null
//         }
//         const timesheetActivityTrackListing = await activitytrackService.timesheetApprovalActivitylisting(req.query, page, limit, dateFormat);
//         if (!timesheetActivityTrackListing.status) {
//             responseData = {
//                 statusCode: responseCodes.codeSuccess,
//                 message: responseMessages.common.noRecordFound,
//                 error: timesheetActivityTrackListing.error,
//                 data: []
//             }
//         } else {
//             responseData = {
//                 statusCode: responseCodes.codeSuccess,
//                 data: timesheetActivityTrackListing.data,
//                 pagination: timesheetActivityTrackListing.pagination_data
//             }
//         }
//         // Log Response
//         logResponse('info', req, responseData, 'Timesheet Approval Activity Track Listing Response');

//         // Return the response
//         responseHandler(res, responseData);
//     } else {
//         throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
//     }
// });

// /**
//  * Activity Track Listing Request to fetch activity track data.
//  * Overview of API:
//  *  - Validate the request.
//  *    + If success
//  *      ~ Call the listing service function.
//  *      ~ Fetch the data based on the provided query parameters.
//  *      ~ Add success to the response.
//  *    + Else
//  *      ~ Add error validation to the response.
//  *  - Return the response.
//  *
//  * Logic:
//  *  - Logging incoming request.
//  *  - Define the validation rules as follows:
//  *    + request_id is mandatory and must be provided.
//  *    + employee_id is not mandatory and must be an UUID.
//  *  - Run the validation rules.
//  *    + If validation is successful:
//  *      ~ Call the listing service function to fetch the data.
//  *      ~ Add the returned data to the response.
//  *    + Else:
//  *      ~ Add error validation to the response.
//  *  - Prepare the response with appropriate status codes.
//  *  - Log the response.
//  *  - Return the response using responseHandler().
//  *
//  * Notes:
//  *  - Exception handling using try-catch.
//  *
//  * @param {Request} req - The request object.
//  * @param {Response} res - The response object.
//  * @returns None.
//  * @throws {InvalidRequestError} - If the request ID or referrable ID is missing or invalid.
//  */
// const ledgerApprovalActivitylisting = tryCatch(async (req, res) => {

//     // Log Request
//     logRequest('info', req, 'ledger Approval Activity Track Listing Request')

//     // Default variable
//     let responseData = [];

//     // Writing validation rules to the input request
//     const validations = [
//         check('request_id')
//             .trim()
//             .escape()
//             .notEmpty()
//             .withMessage(responseMessages.common.requestIdRequired),
//         check('ledger_id')
//             .trim().escape()
//             .optional()
//             .custom(async value => {
//                 if (value != null && value != '') {
//                     let pattern = regexPatterns.uuidRegex;
//                     if (pattern.test(value)) {
//                         const ledgerData = await indexServices.find('ledgers', ['id'], { id: value });
//                         if (!ledgerData.status) {
//                             return Promise.reject(responseMessages.ledgers.idNotExists);
//                         }
//                     } else {
//                         return Promise.reject(responseMessages.ledgers.idInvalid);

//                     }
//                 }
//                 return true
//             }),
//     ];

//     // Run the validation rules.
//     for (const validation of validations) {
//         const result = await validation.run(req);
//         if (result.errors.length) break;
//     }
//     const errors = validationResult(req);

//     /**
//      * If Validation is success
//      *    + Call the listing service function
//      *      - Based on the slug it will return the data
//      * If Validation Fails
//      *    + Return the error message. 
//      */
//     if (errors.isEmpty()) {

//         let dateFormat = await format.getDateFormat(); // date format

//         /* Default Variable */
//         let limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
//         let page = (req.query.page) ? (req.query.page) : pagination.page;
//         if (req.query.ledger_id != '' && req.query.ledger_id != null) {
//             req.query.ledger_id = req.query.ledger_id
//         } else {
//             req.query.ledger_id = null
//         }
//         const ledgerActivityTrackListing = await activitytrackService.ledgerApprovalActivitylisting(req.query, page, limit, dateFormat);
//         if (!ledgerActivityTrackListing.status) {
//             responseData = {
//                 statusCode: responseCodes.codeSuccess,
//                 message: responseMessages.common.noRecordFound,
//                 error: ledgerActivityTrackListing.error,
//                 data: []
//             }
//         } else {
//             responseData = {
//                 statusCode: responseCodes.codeSuccess,
//                 data: ledgerActivityTrackListing.data,
//                 pagination: ledgerActivityTrackListing.pagination_data
//             }
//         }
//         // Log Response
//         logResponse('info', req, responseData, 'ledger Approval Activity Track Listing Response');

//         // Return the response
//         responseHandler(res, responseData);
//     } else {
//         throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
//     }
// });

/**
 * Activity Track Listing Request to fetch activity track data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the listing service function.
 *      ~ Fetch the data based on the provided query parameters.
 *      ~ Add success to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 *  - Logging incoming request.
 *  - Define the validation rules as follows:
 *    + request_id is mandatory and must be provided.
 *    + employee_self_service_id is not mandatory and must be an UUID.
 *  - Run the validation rules.
 *    + If validation is successful:
 *      ~ Call the listing service function to fetch the data.
 *      ~ Add the returned data to the response.
 *    + Else:
 *      ~ Add error validation to the response.
 *  - Prepare the response with appropriate status codes.
 *  - Log the response.
 *  - Return the response using responseHandler().
 *
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns None.
 * @throws {InvalidRequestError} - If the request ID or referrable ID is missing or invalid.
 */
const employeeSelfServiceActivitylisting = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, 'Employee Self Service Activity Track Listing Request')

    // Default variable
    let responseData = [];

    // Writing validation rules to the input request
    const validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('employee_self_service_id')
            .trim().escape()
            .optional()
            .custom(async value => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        const employeeSelfServiceData = await indexServices.find('employee_self_services', ['id'], { id: value });
                        if (!employeeSelfServiceData.status) {
                            return Promise.reject(responseMessages.employeeSelfService.employeeSelfServiceIdNotExists);
                        }
                    } else {
                        return Promise.reject(responseMessages.employeeSelfService.employeeSelfServiceIdInvalid);

                    }
                }
                return true
            }),
    ];

    // Run the validation rules.
    for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
    }
    const errors = validationResult(req);

    /**
     * If Validation is success
     *    + Call the listing service function
     *      - Based on the slug it will return the data
     * If Validation Fails
     *    + Return the error message. 
     */
    if (errors.isEmpty()) {

        let dateFormat = await format.getDateFormat(); // date format

        /* Default Variable */
        let limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
        let page = (req.query.page) ? (req.query.page) : pagination.page;
        if (req.query.employee_self_service_id != '' && req.query.employee_self_service_id != null) {
            req.query.employee_self_service_id = req.query.employee_self_service_id
        } else {
            req.query.employee_self_service_id = null
        }
        const employeeSelfServiceActivitylisting = await activitytrackService.employeeSelfServiceActivitylisting(req.query, page, limit, dateFormat);
        if (!employeeSelfServiceActivitylisting.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.noRecordFound,
                error: employeeSelfServiceActivitylisting.error,
                data: []
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                data: employeeSelfServiceActivitylisting.data,
                pagination: employeeSelfServiceActivitylisting.pagination_data
            }
        }
        // Log Response
        logResponse('info', req, responseData, 'Employee Self Service Activity Track Listing Response');

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Activity Track Listing Request to fetch activity track data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the listing service function.
 *      ~ Fetch the data based on the provided query parameters.
 *      ~ Add success to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 *  - Logging incoming request.
 *  - Define the validation rules as follows:
 *    + request_id is not  mandatory and must be provided.
 *    + expense_id is mandatory and must be an UUID.
 *  - Run the validation rules.
 *    + If validation is successful:
 *      ~ Call the listing service function to fetch the data.
 *      ~ Add the returned data to the response.
 *    + Else:
 *      ~ Add error validation to the response.
 *  - Prepare the response with appropriate status codes.
 *  - Log the response.
 *  - Return the response using responseHandler().
 *
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns None.
 * @throws {InvalidRequestError} - If the request ID or referrable ID is missing or invalid.
 */
const expenseActivitylisting = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, 'Expense Activity Track Listing Request')

    // Default variable
    let responseData = [];

    // Writing validation rules to the input request
    const validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('expense_id')
            .trim().escape()
            .optional()
            .custom(async value => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        const expenseData = await indexServices.find('expense_management', ['id'], { id: value });
                        if (!expenseData.status) {
                            return Promise.reject(responseMessages.expensesManagement.IdNotExists);
                        }
                    } else {
                        return Promise.reject(responseMessages.expensesManagement.IdInvalid);

                    }
                }
                return true
            }),
    ];

    // Run the validation rules.
    for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
    }
    const errors = validationResult(req);

    /**
     * If Validation is success
     *    + Call the listing service function
     *      - Based on the slug it will return the data
     * If Validation Fails
     *    + Return the error message. 
     */
    if (errors.isEmpty()) {

        let dateFormat = await format.getDateFormat(); // date format

        /* Default Variable */
        let limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
        let page = (req.query.page) ? (req.query.page) : pagination.page;
        if (req.query.employee_self_service_id != '' && req.query.employee_self_service_id != null) {
            req.query.employee_self_service_id = req.query.employee_self_service_id
        } else {
            req.query.employee_self_service_id = null
        }
        const expenseActivitylisting = await activitytrackService.expenseActivitylisting(req.query, page, limit, dateFormat);
        if (!expenseActivitylisting.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.noRecordFound,
                error: expenseActivitylisting.error,
                data: []
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                data: expenseActivitylisting.data,
                pagination: expenseActivitylisting.pagination_data
            }
        }
        // Log Response
        logResponse('info', req, responseData, 'Expense Activity Track Listing Response');

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

module.exports = { employeeActivitylisting, employeeActivityExport, companyActivitylisting, timesheetActivitylisting, employeeSelfServiceActivitylisting, expenseActivitylisting };