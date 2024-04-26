const { check, validationResult } = require('express-validator');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { logRequest, logResponse } = require('../../../../../utils/log');
const { responseHandler } = require('../../../../responseHandler');
const { tryCatch } = require('../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const { pagination } = require('../../../../../config/pagination');
const selfReminderServices = require('../../services/configurations/selfReminderServices');
const indexServices = require('../../services/index');
const { regexPatterns } = require('../../../../../constants/regexPatterns');
const format = require('../../../../../helpers/format');
const moment = require('moment');

/**
 * Define validation rules for the reminder configuration request.
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ For update operation, check if the provided IDs exist in the relevant tables.
 *      ~ Add custom validation for specific fields.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the validation rules.
 * 
 * Logic:
 *  - If 'id' is provided in the request body:
 *    + Define update validation rules:
 *      ~ 'reminder_referrable_id' must exist in the 'reminder_referrables' table.
 *      ~ 'reminders.*.id' must exist in the 'reminder_occurances' table for the specified 'reminder_referrable_id'.
 *  - Define common validation rules for all requests:
 *    + 'request_id' is mandatory.
 *    + 'reminder_name_id' must exist in the 'reminder_configurations' table.
 *    + 'referrable_id' must be a number or null.
 *    + 'status' is mandatory and must be a boolean.
 *    + 'content' is mandatory and must be a string.
 *    + 'group_ids' must be an array, and each 'group_ids.*' must exist in the 'groups' table.
 *    + 'employee_ids' must be an array, and each 'employee_ids.*' must exist in the 'employee' table.
 *    + 'reminder_time' is mandatory and must be a valid time.
 *    + 'reminder_date' is mandatory and must be a valid date.
 *    + Custom validations for 'reminders.*' fields.
 *  - Return the combined validation rules.
 * 
 * Notes:
 *  - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @returns {Array} Array of validation rules.
 */
async function validationRules(req) {

    // inserting is_recurring key depending on days
    let reminders = req.body.reminders
    reminders.forEach(reminder => {
        if (reminder.recurring_days != '' && reminder.recurring_days != undefined && reminder.recurring_days != null) {
            reminder.is_recurring = 'true';
        } else {
            reminder.is_recurring = 'false';
        }
    });

    let updateValidationRules = [];
    if (req.params.id) {
        updateValidationRules = [
            check('id')
                .trim()
                .escape()
                .notEmpty()
                .withMessage(responseMessages.configurations.reminder.reminderConfigurationIdRequired)
                .isInt()
                .withMessage(responseMessages.configurations.reminder.reminderConfigurationIdInvalid)
                .custom(async (value) => {
                    /** Check whether the id exist is reminder_configurations table */
                    const reminderOccurance = await indexServices.find('reminder_configurations', ['id', 'slug'], { id: value });
                    if (!reminderOccurance.status) {
                        return Promise.reject(
                            responseMessages.configurations.reminder.reminderConfigurationIdNotExists
                        );
                    }
                    req.body.slug = reminderOccurance.data[0].slug
                }),
            check('reminders.*.reminder_referrable_id')
                .trim()
                .escape()
                .notEmpty()
                .withMessage(responseMessages.configurations.reminder.reminderReferrableIdRequired)
                .isInt()
                .withMessage(responseMessages.configurations.reminder.reminderReferrableIdInvalid)
                .custom(async (value) => {
                    /** Check whether the id exist is reminder_configurations table */
                    const reminderOccurance = await indexServices.find('reminder_referrables', ['id'], { id: value });
                    if (!reminderOccurance.status) {
                        return Promise.reject(
                            responseMessages.configurations.reminder.reminderReferrableIdNotExists
                        );
                    }
                }),
            check('reminder_referrable_id')
                .trim()
                .escape()
                .notEmpty()
                .withMessage(responseMessages.configurations.reminder.reminderReferrableIdRequired)
                .isInt()
                .withMessage(responseMessages.configurations.reminder.reminderReferrableIdInvalid)
                .custom(async (value) => {
                    /** Check whether the id exist is reminder_configurations table */
                    const reminderOccurance = await indexServices.find('reminder_referrables', ['id'], { id: value });
                    if (!reminderOccurance.status) {
                        return Promise.reject(
                            responseMessages.configurations.reminder.reminderReferrableIdNotExists
                        );
                    }
                }),
            check('reminders.*.id')
                .trim()
                .escape()
                .custom(async (value) => {
                    /** Check whether the id exist is reminder_configurations table */
                    if (value != '' && value != null && value != undefined) {
                        var reminderRegex = regexPatterns.numericOnlyRegex;
                        if (!reminderRegex.test(value)) {
                            return Promise.reject(responseMessages.configurations.reminder.reminderOccuranceIdInvalid);
                        }
                        const reminderOccurance = await indexServices.find('reminder_occurances', ['id'], { id: value, reminder_referrable_id: req.body.reminder_referrable_id });
                        if (!reminderOccurance.status) {
                            return Promise.reject(
                                responseMessages.configurations.reminder.reminderOccuranceIdNotExists
                            );
                        }
                    }
                }),
            check('deleted_reminder_occurance_id.*').trim().escape().custom(async (value) => {
                if (value != '' && value != null) {
                    var remindOccurData = await indexServices.find('reminder_occurances', ['*'], { id: value })
                    if (!remindOccurData.status) {
                        return Promise.reject(responseMessages.configurations.reminder.reminderOccuranceIdInvalid);
                    }
                }
                return true;
            }),
            check('documents.*.id')
                .trim()
                .escape()
                .custom(async (value) => {
                    if (check(value).isInt() && value != null && value != '') {
                        return await indexServices.find('reminder_documents', ['id'], { id: value }).then((documentsData) => {
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
        check('name')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.configurations.reminder.nameRequired)
            .matches(regexPatterns.alphaCharactersAndSpacesOnly)
            .withMessage(responseMessages.configurations.reminder.nameInvalid),
        check('documents.*.new_document_id')
            .trim()
            .escape()
            .custom(async (value) => {
                if (value !== undefined && value !== '') {
                    if (regexPatterns.uuidRegex.test(value)) {
                        return await indexServices.find('temp_upload_documents', ['id'], { id: value }, null, [], null, null, null, false).then((documentsData) => {
                            if (!documentsData.status) {
                                return Promise.reject(responseMessages.reminder.documentIdNotExists);
                            }
                        });
                    } else {
                        return Promise.reject(responseMessages.reminder.documentIdInvalid)
                    }
                }
            }),
        check('is_payroll_reminder')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.configurations.reminder.payrollReminderRequired)
            .isBoolean() // '1 - Active, 0 - Expired'
            .withMessage(responseMessages.configurations.reminder.payrollReminderInvalid),
        check('pay_config_setting_id')
            .trim()
            .escape()
            .custom((value) => {
                if (req.body.is_payroll_reminder == 'true') {
                    if (value != '' && value != null && value != undefined) {
                        var pattern = regexPatterns.numbersSpaceRegex;
                        if (pattern.test(value)) {
                            return indexServices.find('payroll_config_settings', ['id'], { id: value }).then((configData) => {
                                const configStatus = configData.status;
                                if (!configStatus) {
                                    return Promise.reject(responseMessages.configurations.payrollConfigurations.payConfigSettingIdNotExist);
                                }
                            })
                        } else {
                            return Promise.reject(responseMessages.configurations.payrollConfigurations.payConfigSettingIdInvalid);
                        }
                    } else {
                        return Promise.reject(responseMessages.configurations.payrollConfigurations.payConfigSettingIdRequired);
                    }
                }
                return true
            }),
        check('check_date')
            .trim()
            .escape()
            .custom((value) => {
                if (req.body.is_payroll_reminder == 'true') {
                    if (value != '' && value != null && value != undefined) {
                        var pattern = regexPatterns.dateRegex;
                        if (!pattern.test(value)) {
                            return Promise.reject(responseMessages.configurations.payrollConfigurations.checkDateInvalid);
                        }
                        return true
                    } else {
                        return Promise.reject(responseMessages.configurations.payrollConfigurations.checkDateRequired);
                    }
                }
                return true
            }),
        check('reminder_date')
            .trim()
            .escape()
            .custom((value) => {
                if (req.body.is_payroll_reminder == 'false') {
                    if (value != '' && value != null && value != undefined) {
                        var pattern = regexPatterns.dateRegex;
                        if (!pattern.test(value)) {
                            return Promise.reject(responseMessages.configurations.reminder.reminderDateInvalid);
                        }
                        return true
                    } else {
                        return Promise.reject(responseMessages.configurations.reminder.reminderDateRequired);
                    }
                }
                return true
            }),
        check('reminder_time')
            .trim()
            .escape()
            .custom((value) => {
                if (req.body.is_payroll_reminder == 'false') {
                    if (value != '' && value != null && value != undefined) {
                        var pattern = regexPatterns.twentyFourHourTimeRegex;
                        if (!pattern.test(value)) {
                            return Promise.reject(responseMessages.configurations.reminder.reminderTimeInvalid);
                        }
                        return true
                    } else {
                        return Promise.reject(responseMessages.configurations.reminder.reminderTimeRequired);
                    }
                }
                return true
            }),
        check('employee_ids').isArray().withMessage(responseMessages.configurations.reminder.employeeIdsArray),
        check('employee_ids.*.id')
            .custom((value) => {
                if (value != '' && value != null && value != undefined) {
                    var pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        return indexServices.find('employee', ['id'], { id: value, status: 'Active' }).then((employees) => {
                            const employeeData = employees.status;
                            if (!employeeData) {
                                return Promise.reject(responseMessages.configurations.reminder.employeeIdNotExists);
                            }
                        })
                    } else {
                        return Promise.reject(responseMessages.configurations.reminder.employeeIdsInvalid);
                    }
                }
                return true
            }),
        check('reminders.*.occurance_order')
            .trim()
            .escape()
            .custom((value) => {
                if (req.body.is_payroll_reminder == 'true') {
                    if (value != '' && value != null && value != undefined) {
                        if (!['1', '2', 1, 2].includes(value)) {
                            return Promise.reject(responseMessages.configurations.reminder.occuranceOrderInvalid);
                        }
                        return true
                    } else {
                        return Promise.reject(responseMessages.configurations.reminder.occuranceOrderRequired);
                    }
                }
                return true
            }),
        check('reminders.*.number')
            .trim()
            .escape()
            .custom((value) => {
                if (req.body.is_payroll_reminder == 'true') {
                    if (value != '' && value != null && value != undefined) {
                        var pattern = regexPatterns.numericOnlyRegex;
                        if (!pattern.test(value)) {
                            return Promise.reject(responseMessages.configurations.reminder.numberInvalid);
                        }
                        return true
                    }
                    else {
                        return Promise.reject(responseMessages.configurations.reminder.numberRequired);
                    }
                }
                return true
            }),
        check('reminders.*.cycle')
            .trim()
            .escape()
            .custom((value) => {
                if (req.body.is_payroll_reminder == 'true') {
                    if (value != '' && value != null && value != undefined) {
                        if (!['days', 'weeks', 'months'].includes(value)) {
                            return Promise.reject(responseMessages.configurations.reminder.cycleInvalid);
                        }
                        return true
                    } else {
                        return Promise.reject(responseMessages.configurations.reminder.cycleRequired);
                    }
                }
                return true
            }),
        // check('reminders.*.is_recurring')
        //     .trim()
        //     .escape()
        //     .custom((value) => {
        //         if (req.body.is_payroll_reminder == 'true') {
        //             if (value != '' && value != null && value != undefined) {
        //                 if (!['true', 'false', true, false].includes(value)) {
        //                     return Promise.reject(responseMessages.configurations.reminder.recurringInvalid);
        //                 }
        //                 return true
        //             } else {
        //                 return Promise.reject(responseMessages.configurations.reminder.recurringRequired);
        //             }
        //         }
        //         return true
        //     }),
        check('reminders.*.recurring_days')
            .trim()
            .custom(async (value) => {
                if (value != '' && value != undefined && value != null) {
                    var pattern = regexPatterns.numbersSpaceRegex;
                    if (!pattern.test(value)) {
                        return Promise.reject(responseMessages.configurations.reminder.recurringDaysInvalid);
                    }
                    return true
                }
                return true
            })
    ];

    return [...updateValidationRules, ...validationRules];
};


/**
 * Create a new reminder configuration.
 * Overview of API:
 *  - Log incoming request.
 *  - Retrieve the date format for proper validation and conversion.
 *  - Convert the 'check_date' and 'reminder_date' in the request body to the proper date format.
 *  - Define the validation rules using the 'validationRules' function.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Convert all request date formats to the proper date format.
 *    + Call the service function to store a new self reminder configuration.
 *    + Add a success message to the response.
 *  - If Validation Fails:
 *    + Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Log the response.
 *  - Return the response using responseHandler().
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

    let dateFormat = await format.getDateFormat(); // date format

    /* Log Request */
    logRequest('info', req, 'create new self reminder configuration store request');
    /* Log Request */

    // Convert all request date formts to proper date format
    if (req.body.check_date != '' && req.body.check_date != null) {
        let modified_date1 = moment(req.body.check_date, dateFormat).format('YYYY-MM-DD')
        req.body.check_date = modified_date1
    }

    if (req.body.reminder_date != '' && req.body.reminder_date != null) {
        let modified_date1 = moment(req.body.reminder_date, dateFormat).format('YYYY-MM-DD')
        req.body.reminder_date = modified_date1
    }

    /* Default variable */
    let responseData = [];
    /* Default variable */

    /* Writing validation rules to the input request */
    const validations = await validationRules(req)
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
     *    + Call the store service function
     *        - Based on the status in store function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
     */
    if (errors.isEmpty()) {
        let reminders = req.body.reminders;
        let recurringCount = 0;

        for (const reminder of reminders) {
            if (reminder.is_recurring == 'true') {
                recurringCount++;

                if (recurringCount > 1) {
                    // Validation fails if is_recurring is true more than once
                    throw new InvalidRequestError(responseMessages.configurations.reminder.multipleRecurring);
                }

                if (reminder.recurring_days == undefined || reminder.recurring_days == '' || reminder.recurring_days == null) {
                    // Validation fails if recurring_days is missing when is_recurring is true
                    throw new InvalidRequestError(responseMessages.configurations.reminder.recurringDaysInvalid);
                }
            }
        }

        var reminder = await selfReminderServices.store(req.body);
        if (reminder.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.addedSuccessfully,
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeUnprocessableEntity,
                message: responseMessages.common.failedToCreate,
                error: reminder.error
            }
        }

        /* Log Response */
        logResponse('info', req, responseData, 'create new reminder configuration store response');
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const updateStatus = tryCatch(async (req, res) => {

    /* Log Request */
    logRequest('info', req, 'update self reminder status request');
    /* Log Request */

    /* Default variable */
    let responseData = [];
    /* Default variable */

    /* Writing validation rules to the input request */
    const validations = [
        check('reminder_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.configurations.reminder.idRequired)
            .isUUID()
            .withMessage(responseMessages.configurations.reminder.idInvalid)
            .custom(async (value) => {
                /** Check whether the id exist is reminder_configurations table */
                const reminderOccurance = await indexServices.find('reminders', ['id'], { id: value, status: 'Pending' });
                if (!reminderOccurance.status) {
                    return Promise.reject(
                        responseMessages.configurations.reminder.idNotExists
                    );
                }
                req.body.slug = reminderOccurance.data[0].slug
            }),
        check('status')
            .isIn(['Completed', 'Stop'])
            .withMessage(responseMessages.configurations.reminder.invalidReminderStatus)
    ];

    // Run the validation rules.
    for (let validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }

    var errors = validationResult(req);

    if (errors.isEmpty()) {

        const statusUpdate = await selfReminderServices.updateStatus(req.body);

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
        logResponse("info", req, responseData, "Reminders status update response");

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
 * Update an existing self reminder configuration.
 * Overview of API:
 *  - Log incoming request.
 *  - Retrieve the date format for proper validation and conversion.
 *  - Convert the 'check_date' and 'reminder_date' in the request body to the proper date format.
 *  - Define the validation rules using the 'validationRules' function.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Convert all request date formats to the proper date format.
 *    + Call the update service function.
 *    + Add a success message to the response.
 *  - If Validation Fails:
 *    + Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Log the response.
 *  - Return the response using responseHandler().
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

    let dateFormat = await format.getDateFormat(); // date format

    /* Log Request */
    logRequest('info', req, 'update self reminder configuration request');
    /* Log Request */

    // Convert all request date formts to proper date format
    if (req.body.check_date != '' && req.body.check_date != null) {
        let modified_date1 = moment(req.body.check_date, dateFormat).format('YYYY-MM-DD')
        req.body.check_date = modified_date1
    }

    if (req.body.reminder_date != '' && req.body.reminder_date != null) {
        let modified_date1 = moment(req.body.reminder_date, dateFormat).format('YYYY-MM-DD')
        req.body.reminder_date = modified_date1
    }

    /* Default variable */
    let responseData = [];
    /* Default variable */

    /* Writing validation rules to the input request */
    const validations = await validationRules(req)
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
     *    + Call the update service function
     *        - Based on the status in store function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
     */
    if (errors.isEmpty()) {
        let reminders = req.body.reminders;
        let recurringCount = 0;

        for (const reminder of reminders) {
            if (reminder.is_recurring == 'true') {
                recurringCount++;

                if (recurringCount > 1) {
                    // Validation fails if is_recurring is true more than once
                    throw new InvalidRequestError(responseMessages.configurations.reminder.multipleRecurring);
                }

                if (reminder.recurring_days == undefined || reminder.recurring_days == '' || reminder.recurring_days == null) {
                    // Validation fails if recurring_days is missing when is_recurring is true
                    throw new InvalidRequestError(responseMessages.configurations.reminder.recurringDaysInvalid);
                }
            }
        }

        const condition = { id: req.params.id };
        await selfReminderServices.update(req.body, condition);
        responseData = {
            statusCode: responseCodes.codeSuccess,
            message: responseMessages.common.updatedSuccessfully,
        }

        /* Log Response */
        logResponse('info', req, responseData, 'update self reminder configuration response');
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

// /**
//  * Update the status of an existing reminder configuration.
//  * Overview of API:
//  *  - Validate the request.
//  *    + If successful
//  *      ~ Call the service function to update the status of an existing reminder configuration.
//  *      ~ Add a success message to the response.
//  *    + Else
//  *      ~ Add error validation to the response.
//  *  - Return the response.
//  * 
//  * Logic:
//  *  - Log incoming request.
//  *  - Define the validation rules as follows:
//  *    + 'request_id' (body) is mandatory.
//  *    + 'id' (body) is mandatory, should be an integer, and must exist in the 'reminder_referrables' table.
//  *    + 'status' (body) is mandatory and should be a boolean.
//  *  - Run the validation rules.
//  *  - If validation is successful:
//  *    + Call the service function to update the status of an existing reminder configuration.
//  *    + Add a success message to the response.
//  *  - Else:
//  *    + Add error validation to the response.
//  *  - Prepare the response with status codes.
//  *  - Log the response.
//  *  - Return the response using responseHandler().
//  *        
//  * Notes:
//  *  - Exception handling using try-catch.
//  * 
//  * @param {Request} req - The request object.
//  * @param {Response} res - The response object.
//  * @returns {JSON} JSON
//  * @throws {InvalidRequestError} - If there are validation errors in the request.
//  */
// const updateStatus = tryCatch(async (req, res) => {
//     /* Log Request */
//     logRequest('info', req, 'update reminder configuration request.');
//     /* Log Request */

//     /* Default variable */
//     let responseData = [];
//     /* Default variable */

//     /* Writing validation rules to the input request */
//     const validations = [
//         check('request_id')
//             .trim()
//             .escape()
//             .notEmpty()
//             .withMessage(responseMessages.common.requestIdRequired),
//         check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.reminder.reminderReferrableIdRequired)
//             .isInt().withMessage(responseMessages.configurations.reminder.reminderReferrableIdInvalid)
//             .custom(async (value) => {
//                 const data = await indexServices.find('reminder_referrables', ['id'], { id: value });
//                 const reminderData = data.status;
//                 if (!reminderData) {
//                     return Promise.reject(responseMessages.configurations.reminder.reminderReferrableIdNotExists);
//                 }
//             }),
//         check('status')
//             .trim()
//             .escape()
//             .notEmpty().withMessage(responseMessages.configurations.reminder.statusRequired)
//             .isBoolean()
//             .withMessage(responseMessages.configurations.reminder.statusInvalid),
//     ];
//     /* Writing validation rules to the input request */

//     /* Run the validation rules. */
//     for (const validation of validations) {
//         const result = await validation.run(req);
//         if (result.errors.length) break;
//     }
//     const errors = validationResult(req);
//     /* Run the validation rules. */

//     /**
//      * If validation is success
//      *    + call the update status service function
//      *        - Based on the status in update function response, segregate the response and prepare the response
//      * If Validation Fails
//      *    + Return the error message.
//     */
//     if (errors.isEmpty()) {
//         const condition = { id: req.params.id };
//         await selfReminderServices.updateStatus(req.body, condition);
//         responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };

//         /* Log Response */
//         logResponse('info', req, responseData, 'Update reminder configuration Response.');
//         /* Log Response */

//         /* Return the response */
//         responseHandler(res, responseData);
//         /* Return the response */
//     } else {
//         throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
//     }
// });

/**
 * Retrieve details of a self reminder configuration.
 * Overview of API:
 *  - Log incoming request.
 *  - Initialize default response variable.
 *  - Define validation rules for the input request.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Get reminder details in the collection.
 *    + Prepare the response with status codes, success message, and data.
 *  - If Validation Fails:
 *    + Return the error message.
 *  - Log the response.
 *  - Return the response using responseHandler().
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
    logRequest('info', req, 'index reminder configuration request');
    /* Log Request */

    /* Default variable */
    let responseData = [];
    /* Default variable */

    /* Writing validation rules to the input request */
    const validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.configurations.reminder.reminderConfigurationIdRequired)
            .isInt().withMessage(responseMessages.configurations.reminder.reminderConfigurationIdInvalid)
            .custom(async (value) => {
                const reminder = await indexServices.find('reminder_configurations', ['id'], { id: value, referrable_type: 'self' });
                const reminderData = reminder.status;
                if (!reminderData) {
                    return Promise.reject(
                        responseMessages.configurations.reminder.reminderConfigurationIdNotExists);
                }
            })
    ];
    /* Writing validation conditions to the input request */

    /* Run the validation rules. */
    for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
    }
    const errors = validationResult(req);
    /* Run the validation rules. */

    /**
     * If validation is success
     * + get reminder details in the collection.
     * If Validation Fails
     * + Return the error message.
     */
    if (errors.isEmpty()) {
        condition = { 'rc.id': req.query.id }
        reminderData = await selfReminderServices.index(condition);
        responseData = {
            statusCode: responseCodes.codeSuccess,
            message: responseMessages.common.success,
            data: reminderData.data
        };

        /* Log Response */
        logResponse('info', req, responseData, 'reminder index configuration Response');
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Get details of self reminder configurations based on the provided request parameters.
 * Overview of API:
 *  - Log incoming request.
 *  - Initialize default response variable.
 *  - Extract the 'request_id' from the request query parameters.
 *  - If 'request_id' is present:
 *    + Set default values for 'limit' and 'page' based on request parameters or use default pagination values.
 *    + Define validation rules for the input request.
 *    + Run the validation rules.
 *    + If validation is successful:
 *      ~ Retrieve self reminder details with optional pagination.
 *      ~ Prepare the response with status codes, success message, data, and pagination details.
 *    + If Validation Fails:
 *      ~ Return the error message.
 *  - If 'request_id' is missing:
 *    + Throw an InvalidRequestError with a message indicating the missing 'request_id'.
 *  - Log the response.
 *  - Return the response using responseHandler().
 *        
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request or 'request_id' is missing.
 */
const listing = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, 'Getting self reminder Details request');
    /* Log Request */

    let dateFormat = await format.getDateFormat(); // date format

    // Convert all request date formts to proper date format
    if (req.query.date != '' && req.query.date != null) {
        let modified_date1 = moment(req.query.date, dateFormat).format('YYYY-MM-DD')
        req.query.date = modified_date1
    }

    /* Default variable */
    let responseData = [];
    const requestId = req.query.request_id;
    /* Default variable */

    if (requestId !== undefined && requestId !== '') {
        /* Default variable */
        const limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
        const page = (req.query.page) ? (req.query.page) : pagination.page;
        var date = (req.query.date) ? (req.query.date) : null;
        /* Default variable */

        /* Writing validation rules to the input request */
        if (date != null) {
            var condition = { global_search: `"rc"."referrable_type"= 'self' AND ('${date}' IS NULL OR ("reminder_referrables"."check_date" = '${date}' OR "reminder_referrables"."reminder_date" = '${date}'))` }
        } else {
            var condition = { 'rc.referrable_type': 'self' }
        }
        const reminderData = await selfReminderServices.listing(condition, page, limit);
        if (!reminderData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: reminderData.message, error: reminderData.error, data: [] };
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: reminderData.data, pagination: reminderData.pagination_data };
        }


        /* Log Response */
        logResponse('info', req, responseData, 'Getting self reminder Details Response');
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(responseMessages.common.requestIdRequired);
    }
});

/**
 * Delete self reminder configuration based on the provided request parameters.
 * Overview of API:
 *  - Log incoming request.
 *  - Initialize default response variable.
 *  - Define validation rules for the input request.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Delete self reminder configuration based on the provided 'id'.
 *    + Prepare the response with status codes and success message.
 *  - If Validation Fails:
 *    + Return the error message.
 *  - Log the response.
 *  - Return the response using responseHandler().
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
    logRequest('info', req, 'Delete self reminder configuration request');
    /* Log Request */

    /* Default variable */
    let responseData = [];
    /* Default variable */

    /* Writing validation rules to the input request */
    const validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.configurations.reminder.reminderConfigurationIdRequired)
            .isInt().withMessage(responseMessages.configurations.reminder.reminderConfigurationIdInvalid)
            .custom(async (value) => {
                const reminder = await indexServices.find('reminder_configurations', ['id'], { id: value, referrable_type: 'self' });
                const reminderData = reminder.status;
                if (!reminderData) {
                    return Promise.reject(
                        responseMessages.configurations.reminder.reminderConfigurationIdNotExists);
                }
            })
    ];
    /* Writing validation conditions to the input request */

    /* Run the validation rules. */
    for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
    }
    const errors = validationResult(req);
    /* Run the validation rules. */

    /**
     * If validation is success
     * + Delete  reminder type details in the collection.
     * If Validation Fails
     * + Return the error message.
     */
    if (errors.isEmpty()) {
        const condition = { id: req.params.id };
        await selfReminderServices.destroy(req.body, condition);
        responseData = {
            statusCode: responseCodes.codeSuccess,
            message: responseMessages.common.deletedSuccessfully,
        };

        /* Log Response */
        logResponse('info', req, responseData, 'self reminder delete configuration Response');
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

module.exports = { store, update, index, listing, destroy, updateStatus };
