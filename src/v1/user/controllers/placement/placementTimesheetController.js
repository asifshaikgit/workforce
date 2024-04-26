const placementTimesheetServices = require('../../services/placement/placementTimesheetServices')
const { check, validationResult } = require('express-validator')
const { logRequest, logResponse } = require('../../../../../utils/log')
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { responseHandler } = require("../../../../responseHandler");
const { tryCatch } = require("../../../../../utils/tryCatch");
const InvalidRequestError = require("../../../../../error/InvalidRequestError");
const indexService = require('../../services/index')
const moment = require('moment')
const format = require('../../../../../helpers/format');
const { regexPatterns } = require('../../../../../constants/regexPatterns')


/**
 * Store placement timesheet configuration function to add a timesheet configuration for a placement.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful:
 *      ~ Add the timesheet configuration for the placement using the 'store' service function.
 *      ~ Prepare the response with success data.
 *    + Else:
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for 'responseData'.
 * - Modify the 'timesheet_start_date' property to the appropriate format.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'placement_id' (body), must not be empty, should be a valid UUID, and should exist in the 'placements' table.
 *    + 'timesheet_settings_config_type' (body), must not be empty and should be one of [1, 2, 3].
 *    + Based on 'timesheet_settings_config_type':
 *      ~ If '1', validate the existence of a global timesheet configuration.
 *      ~ If '2', validate the existence of a client-specific timesheet configuration.
 *      ~ If '3', validate 'cycle_id' and 'ts_mandatory'.
 *    + 'cycle_id' (body), if 'timesheet_settings_config_type' is '3', must not be empty and should exist in the 'cycles' table.
 *    + 'ts_mandatory' (body), if 'timesheet_settings_config_type' is '3', must not be empty and should be a boolean value.
 *    + 'timesheet_start_date' (body), must not be empty and must be in the correct date format.
 *    + 'day_start_id' (body), if 'timesheet_settings_config_type' is '3', optional based on cycle type, and should exist in the 'days' table.
 *    + 'default_hours' (body), if 'timesheet_settings_config_type' is '3', must not be empty and should be in the correct format 'hh:mm'.
 *    + 'timesheet_approval_config_type' (body), must not be empty and should be one of [1, 2, 3].
 *    + Based on 'timesheet_approval_config_type':
 *      ~ If '1', validate the existence of a global timesheet approval configuration.
 *      ~ If '2', validate the existence of a client-specific timesheet approval configuration.
 *    + 'approvals.*.approver_ids.*.employee_id' (body), if 'timesheet_approval_config_type' is '3', optional but if provided, should be a valid UUID and exist in the 'employee' table.
 *    + 'approvals.*.rank' (body), if 'timesheet_approval_config_type' is '3', must not be empty and should be numeric.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Check for rank order in the 'approvals' array (if applicable).
 *    + If the rank order is correct, set 'rankOrder' to true, indicating that ranks are in order.
 *    + If not, set 'rankOrder' to false, indicating an issue with the rank order.
 *    + If 'rankOrder' is true:
 *      ~ Set additional parameters for the create operation.
 *      ~ Call the 'placementTimesheetServices.store' service function to add the timesheet configuration.
 *      ~ If Success:
 *        - Prepare the response with success data.
 *      ~ Else:
 *        - Prepare the response with an error message.
 *      ~ Log the response.
 *      ~ Return the response using 'responseHandler()'
 *    + If 'rankOrder' is false:
 *      ~ Raise an exception with an error message.
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
const store = tryCatch(async (req, res) => {
    let dateFormat = await format.getDateFormat(); // date format

    /* Log Request */
    logRequest('info', req, "Store placement timesheet configuration request.");
    /* Log Request */

    /* Default Variable */
    var responseData = "";
    /* Default Variable */

    let modified_date = req.body.timesheet_start_date ? moment(req.body.timesheet_start_date, dateFormat).format('YYYY-MM-DD') : req.body.timesheet_start_date;
    req.body.timesheet_start_date = modified_date; // Modify the timesheet_start_date property

    /* Writing validation conditions to the input request */
    var validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check("placement_id")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.placement.placementIdRequired)
            .isUUID()
            .withMessage(responseMessages.placement.placementIdInvalid)
            .custom(async (value) => {
                const placementData = await indexService.find('placements', ['id', 'reference_id', 'timesheet_configuration_id', 'timesheet_approval_id', 'client_id', 'start_date'], { id: value })
                if (!placementData.status) {
                    return Promise.reject(responseMessages.placement.placementIdNotExists)
                }
                if (placementData.data[0].timesheet_configuration_id != null || placementData.data[0].timesheet_approval_id != null) {
                    return Promise.reject(responseMessages.placement.timesheetAlreadyExistsForPlacement)
                } else {
                    req.body.client_id = placementData.data[0].client_id
                    req.body.reference_id = placementData.data[0].reference_id
                    req.body.current_placement_start_date = placementData.data[0].start_date
                }
                return true
            }),
        check('timesheet_settings_config_type')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.configurations.timesheetConfiguration.tsConfigurationTypeRequired)
            .isIn([1, 2, 3])
            .withMessage(responseMessages.configurations.timesheetConfiguration.tsConfigurationTypeInvalid) // 1 for default, 2 for client configure, 3 for custom configure
            .custom(value => {
                if (value == '1') { //default
                    return indexService.find('timesheet_configurations', ['id', 'cycle_id'], { is_global: true, deleted_at: null }).then(timesheetConfigData => {
                        if (!timesheetConfigData.status) {
                            return Promise.reject(responseMessages.configurations.timesheetConfiguration.globalDoesNotExist)
                        } else {
                            req.body.default_timesheet_configuration_id = timesheetConfigData.data[0].id
                            req.body.default_cycle_id = timesheetConfigData.data[0].cycle_id
                        }
                    })
                }
                if (value == '2') {
                    let joins = [{ table: 'timesheet_configurations as tc', alias: 'tc', condition: ['tc.id', 'companies.timesheet_configuration_id'], type: 'left' }]
                    return indexService.find('companies', ['companies.id', 'companies.timesheet_configuration_id', 'tc.cycle_id'], { 'companies.id': req.body.client_id, 'companies.deleted_at': null }, null, joins).then(clientData => {
                        if (!clientData.status || clientData.data[0].timesheet_configuration_id == null) {
                            return Promise.reject(responseMessages.configurations.invoiceConfiguration.clientNotHaveTimesheetConfiguration)
                        } else {
                            req.body.default_timesheet_configuration_id = clientData.data[0].timesheet_configuration_id
                            req.body.default_cycle_id = clientData.data[0].cycle_id
                        }
                    })
                }
                return true
            }),
        check('cycle_id')
            .trim().escape()
            .custom(async value => {
                if (req.body.timesheet_settings_config_type == '3') {
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.configurations.timesheetConfiguration.cycleIdRequired)
                    } else if (isNaN(value)) {
                        return Promise.reject(responseMessages.configurations.timesheetConfiguration.invalidCycleId)
                    } else {
                        const cycleData = await indexService.find('cycles', ['id'], { id: value })
                        if (!cycleData.status) {
                            return Promise.reject(responseMessages.configurations.timesheetConfiguration.invalidCycleId)
                        }
                    }
                    req.body.default_cycle_id = value
                }
                return true
            }),
        check("ts_mandatory")
            .trim().escape()
            .custom(async (value) => {
                if (req.body.timesheet_settings_config_type == '3') {
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.configurations.timesheetConfiguration.timesheetRequired)
                    } else if (value != 'true' && value != 'false') {
                        return Promise.reject(responseMessages.configurations.timesheetConfiguration.timesheetInvalid)
                    }
                }
                return true
            }),

        check('timesheet_start_date')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.configurations.timesheetConfiguration.startDateRequired)
            .custom(async value => {
                if (value != 'Invalid date') {
                    let placemnt_start_date = new Date(req.body.current_placement_start_date);
                    if (moment(value).isBefore(placemnt_start_date)) {
                        return Promise.reject(responseMessages.configurations.timesheetConfiguration.startDateInvalid);
                    }
                } else {
                    return Promise.reject(responseMessages.configurations.timesheetConfiguration.timesheetStartDateInvalid);
                }
                return true;
            }),

        check('day_start_id')
            .trim().escape()
            .custom(value => {
                if (req.body.timesheet_settings_config_type == '3') {
                    if (req.body.cycle_id == '1' || req.body.cycle_id == '2') {
                        if (value == '' || value == null) {
                            return Promise.reject(responseMessages.configurations.timesheetConfiguration.startDayRequired)
                        } else if (isNaN(value)) {
                            return Promise.reject(responseMessages.configurations.timesheetConfiguration.invalidDayId)
                        } else {
                            return indexService.find('days', ['id'], { id: value }).then(daysData => {
                                if (!daysData.status) {
                                    return Promise.reject(responseMessages.configurations.timesheetConfiguration.dayStartIdNotExists)
                                }

                                if (req.body.cycle_id == '2') {
                                    let ts_start_date = req.body.timesheet_start_date;
                                    var start_day = moment(ts_start_date).day();
                                    if (start_day == 0) {
                                        if (Number(value) != 7) {
                                            return Promise.reject(responseMessages.configurations.timesheetConfiguration.forBiweeklyCycleError)
                                        }
                                    } else {
                                        if (start_day != Number(value)) {
                                            return Promise.reject(responseMessages.configurations.timesheetConfiguration.forBiweeklyCycleError)
                                        }
                                    }
                                }
                            })
                        }
                    }
                }

                return true
            }),
        check('default_hours')
            .trim()
            .custom((value) => {
                if (req.body.timesheet_settings_config_type == '3') {
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.configurations.timesheetConfiguration.defaultHourRequired)
                    } else if (!regexPatterns.twentyFourHourTimeRegex.test(value)) {
                        return Promise.reject(responseMessages.configurations.timesheetConfiguration.defaultHourInvalid)
                    }
                }
                return true
            }),

        check('timesheet_approval_config_type')
            .trim()
            .notEmpty().withMessage(responseMessages.configurations.timesheetConfiguration.approvalConfigurationTypeRequired)
            .isIn([1, 2, 3]).withMessage(responseMessages.configurations.timesheetConfiguration.approvalConfigurationTypeInvalid) // 1 for default, 2 for client configure, 3 for custom configure
            .custom(value => {
                if (value == '1') {
                    return indexService.find('approval_settings', ['id'], { approval_module: 1, is_global: true, deleted_at: null }).then(approvalData => {
                        if (!approvalData.status) {
                            return Promise.reject(responseMessages.configurations.timesheetConfiguration.timesheetGlobalApprovalNotExists)
                        } else {
                            req.body.default_timesheet_approval_id = approvalData.data[0].id
                        }
                    })
                }
                if (value == '2') {
                    return indexService.find('companies', ['id', 'timesheet_approval_id'], { id: req.body.client_id, deleted_at: null }).then(clientData => {
                        if (!clientData.status || clientData.data[0].timesheet_approval_id == null) {
                            return Promise.reject(responseMessages.configurations.timesheetConfiguration.clientTimesheetApprovalNotExists)
                        } else {
                            req.body.default_timesheet_approval_id = clientData.data[0].timesheet_approval_id
                        }
                    })
                }
                return true
            }),

        check('approvals.*.approver_ids.*.employee_id')
            .trim()
            .notEmpty()
            .withMessage()
            .custom(async value => {
                if (req.body.timesheet_approval_config_type == '3') {
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.configurations.approvalConfiguration.approverIdRequired)
                    } else if (!regexPatterns.uuidRegex.test(value)) {
                        return Promise.reject(responseMessages.configurations.approvalConfiguration.approverIdInvalid)
                    } else {
                        const userData = await indexService.find('employee', ['id'], { id: value, status: 'Active', deleted_at: null })
                        if (!userData.status) {
                            return Promise.reject(responseMessages.configurations.approvalConfiguration.IdNotExists)
                        }
                    }
                }
                return true
            }),
        check('approvals.*.rank')
            .trim()
            .custom((value) => {
                if (req.body.timesheet_approval_config_type == '3') {
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.configurations.approvalConfiguration.rankRequired)
                    } else if (isNaN(value)) {
                        return Promise.reject(responseMessages.configurations.approvalConfiguration.rankInvalid)
                    }
                }
                return true
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

        if (req.body.timesheet_approval_config_type == '3') {
            let approvalBody = req.body.approvals;
            /* Checking Rank Order */
            var rankUniqueCheck = [...new Set(approvalBody.map(rankChecking => rankChecking.rank))].sort();
            if (approvalBody.length > 0) {
                req.body.approval_count = approvalBody.length;
                if (approvalBody.length == rankUniqueCheck.length) {
                    var rankOrder = true;
                    var currentRankCheck = 1;
                    rankUniqueCheck.map(order => {
                        if (currentRankCheck != order) {
                            rankOrder = false;
                        }
                        currentRankCheck += 1;
                    });
                    if (!rankOrder) {
                        throw new InvalidRequestError(
                            responseMessages.configurations.approvalConfiguration.rankOrderInvalid,
                            responseCodes.codeUnprocessableEntity
                        );
                    }
                }
            } else {
                throw new InvalidRequestError(
                    responseMessages.configurations.approvalConfiguration.approvalRequired,
                    responseCodes.codeUnprocessableEntity
                );
            }
        } else {
            var rankOrder = true
        }

        req.body.is_global = false;
        req.body.approval_module = 1;
        var response = await placementTimesheetServices.store(req.body);
        if (response.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully, data: { id: response.data[0].id } }
        } else {
            responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: placementTimesheetData.error }
        }

        /* Log Response */
        logResponse("info", req, responseData, "Store placement timesheet configuration Response.");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Update placement timesheet configuration function to update a timesheet configuration for a placement.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful:
 *      ~ Update the timesheet configuration for the placement using the 'update' service function.
 *      ~ Prepare the response with success data.
 *    + Else:
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for 'responseData'.
 * - Modify the 'timesheet_start_date' property to the appropriate format.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'placement_id' (body), must not be empty, should be a valid UUID, and should exist in the 'placements' table.
 *    + 'timesheet_settings_config_type' (body), must not be empty and should be one of [1, 2, 3].
 *    + Based on 'timesheet_settings_config_type':
 *      ~ If '1', validate the existence of a global timesheet configuration.
 *      ~ If '2', validate the existence of a client-specific timesheet configuration.
 *      ~ If '3', validate 'cycle_id' and 'ts_mandatory'.
 *    + 'cycle_id' (body), if 'timesheet_settings_config_type' is '3', must not be empty and should exist in the 'cycles' table.
 *    + 'ts_mandatory' (body), if 'timesheet_settings_config_type' is '3', must not be empty and should be a boolean value.
 *    + 'timesheet_start_date' (body), must not be empty and must be in the correct date format.
 *    + 'day_start_id' (body), if 'timesheet_settings_config_type' is '3', optional based on cycle type, and should exist in the 'days' table.
 *    + 'default_hours' (body), if 'timesheet_settings_config_type' is '3', must not be empty and should be in the correct format 'hh:mm'.
 *    + 'timesheet_approval_config_type' (body), must not be empty and should be one of [1, 2, 3].
 *    + Based on 'timesheet_approval_config_type':
 *      ~ If '1', validate the existence of a global timesheet approval configuration.
 *      ~ If '2', validate the existence of a client-specific timesheet approval configuration.
 *    + 'approvals.*.approver_ids.*.employee_id' (body), if 'timesheet_approval_config_type' is '3', optional but if provided, should be a valid UUID and exist in the 'employee' table.
 *    + 'approvals.*.rank' (body), if 'timesheet_approval_config_type' is '3', must not be empty and should be numeric.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Check for rank order in the 'approvals' array (if applicable).
 *    + If the rank order is correct, set 'rankOrder' to true, indicating that ranks are in order.
 *    + If not, set 'rankOrder' to false, indicating an issue with the rank order.
 *    + If 'rankOrder' is true:
 *      ~ Set additional parameters for the update operation.
 *      ~ Call the 'placementTimesheetServices.update' service function to update the timesheet configuration.
 *      ~ If Success:
 *        - Prepare the response with success data.
 *      ~ Else:
 *        - Prepare the response with an error message.
 *      ~ Log the response.
 *      ~ Return the response using 'responseHandler()'
 *    + If 'rankOrder' is false:
 *      ~ Raise an exception with an error message.
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
const update = tryCatch(async (req, res) => {
    let dateFormat = await format.getDateFormat(); // date format

    /* Log Request */
    logRequest('info', req, "Update placement timesheet configuration request");
    /* Log Request */

    /* Default Variable */
    var responseData = '';
    /* Default Variable */

    let modified_date = req.body.timesheet_start_date ? moment(req.body.timesheet_start_date, dateFormat).format('YYYY-MM-DD') : req.body.timesheet_start_date;
    req.body.timesheet_start_date = modified_date; // Modify the timesheet_start_date property

    /* Writing validation rules to the input request */
    var validations = [
        check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check("placement_id")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.placement.placementIdRequired)
            .isUUID()
            .withMessage(responseMessages.placement.placementIdInvalid)
            .custom(async (value) => {
                const placementData = await indexService.find('placements', ['client_id', 'reference_id', 'ts_next_cycle_start', 'timesheet_start_date'], { id: value });
                if (!placementData.status && value != '') {
                    return Promise.reject(responseMessages.placement.placementIdInvalid);
                } else {
                    req.body.reference_id = placementData.data[0].reference_id
                    req.body.client_id = placementData.data[0].client_id;
                    req.body.current_placement_ts_start_date = placementData.data[0].ts_next_cycle_start;
                    req.body.current_timesheet_start_date = placementData.data[0].timesheet_start_date;
                }
                return true;
            }),
        check('timesheet_settings_config_type')
            .trim()
            .notEmpty().withMessage(responseMessages.configurations.timesheetConfiguration.tsConfigurationTypeRequired)
            .isIn([1, 2, 3]).withMessage(responseMessages.configurations.timesheetConfiguration.tsConfigurationTypeInvalid)
            .custom((value) => {
                if (value == 1) {
                    return indexService.find('timesheet_configurations', ['id'], { is_global: true, deleted_at: null }).then(timesheetConfigData => {
                        if (!timesheetConfigData.status) {
                            return Promise.reject(responseMessages.configurations.timesheetConfiguration.globalDoesNotExist)
                        } else {
                            req.body.default_timesheet_configuration_id = timesheetConfigData.data[0].id
                        }
                    })
                }
                if (value == 2) {
                    return indexService.find('companies', ['timesheet_configuration_id'], { id: req.body.client_id, deleted_at: null }).then(clientData => {
                        if (!clientData.status || clientData.data[0].timesheet_configuration_id == null) {
                            return Promise.reject(responseMessages.configurations.invoiceConfiguration.clientNotHaveTimesheetConfiguration)
                        } else {
                            req.body.default_timesheet_configuration_id = clientData.data[0].timesheet_configuration_id
                        }
                    })
                }
                return true
            }),
        check('cycle_id')
            .trim().escape()
            .custom(async value => {
                if (req.body.timesheet_settings_config_type == '3') {
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.configurations.timesheetConfiguration.cycleIdRequired)
                    } else if (isNaN(value)) {
                        return Promise.reject(responseMessages.configurations.timesheetConfiguration.invalidCycleId)
                    } else {
                        const cycleData = await indexService.find('cycles', ['id'], { id: value })
                        if (!cycleData.status) {
                            return Promise.reject(responseMessages.configurations.timesheetConfiguration.invalidCycleId)
                        }
                    }
                }
                return true
            }),
        check("ts_mandatory")
            .trim().escape()
            .custom(async (value) => {
                if (req.body.timesheet_settings_config_type == '3') {
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.configurations.timesheetConfiguration.timesheetRequired)
                    } else if (value != 'true' && value != 'false') {
                        return Promise.reject(responseMessages.configurations.timesheetConfiguration.timesheetInvalid)
                    }
                }
                return true
            }),
        check('day_start_id')
            .trim().escape()
            .custom(value => {
                if (req.body.timesheet_settings_config_type == '3') {
                    if (req.body.cycle_id == '1' || req.body.cycle_id == '2') {
                        if (value == '' || value == null) {
                            return Promise.reject(responseMessages.configurations.timesheetConfiguration.startDayRequired)
                        } else if (isNaN(value)) {
                            return Promise.reject(responseMessages.configurations.timesheetConfiguration.invalidDayId)
                        } else {
                            return indexService.find('days', ['id'], { id: value }).then(daysData => {
                                if (!daysData.status) {
                                    return Promise.reject(responseMessages.configurations.timesheetConfiguration.dayStartIdNotExists)
                                }

                                if (req.body.cycle_id == '2') {
                                    let ts_start_date = req.body.timesheet_start_date;
                                    var start_day = moment(ts_start_date).day();
                                    if (start_day == 0) {
                                        if (Number(value) != 7) {
                                            return Promise.reject(responseMessages.configurations.timesheetConfiguration.forBiweeklyCycleError)
                                        }
                                    } else {
                                        if (start_day != Number(value)) {
                                            return Promise.reject(responseMessages.configurations.timesheetConfiguration.forBiweeklyCycleError)
                                        }
                                    }
                                }
                            })
                        }
                    }
                }
                return true
            }),
        check('default_hours')
            .trim()
            .custom((value) => {
                if (req.body.timesheet_settings_config_type == '3') {
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.configurations.timesheetConfiguration.defaultHourRequired)
                    } else if (!regexPatterns.twentyFourHourTimeRegex.test(value)) {
                        return Promise.reject(responseMessages.configurations.timesheetConfiguration.defaultHourInvalid)
                    }
                }
                return true
            }),
        check('timesheet_start_date')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.configurations.timesheetConfiguration.startDateRequired)
            .custom(async (value) => {
                if (value != 'Invalid date') {
                    let abc = moment(req.body.current_timesheet_start_date).format('YYYY-MM-DD');
                    let current_timesheet_start_date = new Date(abc);
                    let abc1 = moment(req.body.current_placement_ts_start_date).format('YYYY-MM-DD');
                    let placemnt_current_start_date = new Date(abc1);
                    let requestDate = new Date(value);

                    if (current_timesheet_start_date.getTime() != requestDate.getTime()) {
                        if (placemnt_current_start_date < requestDate) {
                            return Promise.reject(responseMessages.configurations.timesheetConfiguration.tsConfiglIdInvald);
                        } else {
                            req.body.start_date_modified = true
                        }
                    }
                } else {
                    return Promise.reject(responseMessages.configurations.timesheetConfiguration.timesheetStartDateInvalid);
                }
                return true
            }),
        check('timesheet_approval_config_type')
            .trim()
            .notEmpty().withMessage(responseMessages.configurations.timesheetConfiguration.approvalConfigurationTypeRequired)
            .isIn([1, 2, 3]).withMessage(responseMessages.configurations.timesheetConfiguration.approvalConfigurationTypeInvalid) // 1 for default, 2 for client configure, 3 for custom configure
            .custom(value => {
                console.log(value, 'value');
                if (value == '1') {
                    return indexService.find('approval_settings', ['id'], { approval_module: 1, is_global: true, deleted_at: null }).then(approvalData => {
                        if (!approvalData.status) {
                            return Promise.reject(responseMessages.configurations.timesheetConfiguration.timesheetGlobalApprovalNotExists)
                        } else {
                            req.body.default_timesheet_approval_id = approvalData.data[0].id
                        }
                    })
                }
                if (value == '2') {
                    return indexService.find('companies', ['id', 'timesheet_approval_id'], { id: req.body.client_id, deleted_at: null }).then(clientData => {
                        if (!clientData.status || clientData.data[0].timesheet_approval_id == null) {
                            return Promise.reject(responseMessages.configurations.timesheetConfiguration.clientTimesheetApprovalNotExists)
                        } else {
                            req.body.default_timesheet_approval_id = clientData.data[0].timesheet_approval_id
                        }
                    })
                }
                return true
            }),
        check('approvals.*.id')
            .trim()
            .custom(value => {
                if (value != null && value != '') {
                    if (isNaN(value)) {
                        return Promise.reject(responseMessages.configurations.approvalConfiguration.approvalLevelIdInvalid);
                    } else {
                        return indexService.find('approval_levels', ['id'], { id: value }).then(approvalLevelData => {
                            if (!approvalLevelData.status) {
                                return Promise.reject(responseMessages.configurations.approvalConfiguration.levelIdNotExists);
                            }
                        })
                    }
                }
                return true
            }),
        check('approvals.*.rank')
            .trim()
            .custom((value) => {
                if (req.body.timesheet_approval_config_type == '3') {
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.configurations.approvalConfiguration.rankRequired)
                    } else if (isNaN(value)) {
                        return Promise.reject(responseMessages.configurations.approvalConfiguration.rankInvalid)
                    }
                }
                return true
            }),
        check('approvals.*.approver_ids.*.employee_id')
            .trim()
            .notEmpty().withMessage()
            .custom(async value => {
                if (req.body.timesheet_approval_config_type == '3') {
                    if (value == '' || value == null) {
                        return Promise.reject(responseMessages.configurations.approvalConfiguration.approverIdRequired)
                    } else if (!regexPatterns.uuidRegex.test(value)) {
                        return Promise.reject(responseMessages.configurations.approvalConfiguration.approverIdInvalid)
                    } else {
                        const userData = await indexService.find('employee', ['id'], { id: value, status: 'Active', deleted_at: null })
                        if (!userData.status) {
                            return Promise.reject(responseMessages.configurations.approvalConfiguration.IdNotExists)
                        }
                    }
                }
                return true
            }),
        check('approvals.*.approver_ids.*.id')
            .trim()
            .custom(value => {
                if (value != null && value != '') {
                    if (isNaN(value)) {
                        return Promise.reject(responseMessages.configurations.approvalConfiguration.approvalUserIdInvalid);
                    } else {
                        return indexService.find('approval_users', ['id'], { id: value }).then(approvalUserData => {
                            if (!approvalUserData.status) {
                                return Promise.reject(responseMessages.configurations.approvalConfiguration.IdNotExists);
                            }
                        })
                    }
                }
                return true
            }),
        check('delete_user_ids.*')
            .trim()
            .custom(value => {
                if (value != null && value != '') {
                    return indexService.find('approval_users', ['id'], { id: value }).then(approvalUserData => {
                        if (!approvalUserData.status) {
                            return Promise.reject(responseMessages.configurations.approvalConfiguration.deleteUserIdNotExists);
                        }
                    })
                }
                return true
            }),
        check('delete_approval_level_ids.*')
            .trim()
            .custom(value => {
                if (value != null && value != '') {
                    return indexService.find('approval_levels', ['id'], { id: value }).then(approvalLevelData => {
                        if (!approvalLevelData.status) {
                            return Promise.reject(responseMessages.configurations.approvalConfiguration.deleteLevelIdNotExists);
                        }
                    })
                }
                return true
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

    /**
     * If validation is success
     *    + call the update service function
     *        - Based on the status in update function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
    */
    if (errors.isEmpty()) {
        let approvalBody = req.body.approvals;
        if (req.body.timesheet_approval_config_type == '3') {

            /* Checking Rank Order */
            var rankUniqueCheck = [...new Set(approvalBody.map(rankChecking => rankChecking.rank))].sort();
            if (approvalBody.length > 0) {
                req.body.approval_count = approvalBody.length;
                if (approvalBody.length == rankUniqueCheck.length) {
                    var rankOrder = true;
                    var currentRankCheck = 1;
                    rankUniqueCheck.map(order => {
                        if (currentRankCheck != order) {
                            rankOrder = false;
                        }
                        currentRankCheck += 1;
                    });

                    if (!rankOrder) {
                        throw new InvalidRequestError(
                            responseMessages.configurations.approvalConfiguration.rankOrderInvalid,
                            responseCodes.codeUnprocessableEntity
                        );
                    }
                }
            } else {
                throw new InvalidRequestError(
                    responseMessages.configurations.approvalConfiguration.approvalRequired,
                    responseCodes.codeUnprocessableEntity
                );
            }
        }

        req.body.is_global = false;
        req.body.approval_module = 1;
        let placementTimesheetData = await placementTimesheetServices.update(req.body);
        if (placementTimesheetData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully }
        } else {
            responseData = { statusCode: responseCodes.codeInternalError, message: placementTimesheetData.message, error: placementTimesheetData.error }
        }

        /* Log Response */
        logResponse("info", req, responseData, "Update placement timesheet configuration Response.");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Getting placement timesheet configuration index function to retrieve timesheet configurations for a placement.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful:
 *      ~ Retrieve timesheet configurations for the placement using the 'index' service function.
 *      ~ Prepare the response with success data.
 *    + Else:
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for 'responseData'.
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'placement_id' (query), must not be empty, should be a valid UUID, and should exist in the 'placements' table.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Create a condition to retrieve timesheet configurations based on the placement's ID.
 *    + Call the 'index' service function to retrieve the timesheet data.
 *    + If data exists:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with an error message and empty data.
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
const index = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "Getting placement timesheet configuration index request");
    /* Log Request */

    /* Default Variable */
    var responseData = '';
    /* Writing validation rules to the input request */
    var validations = [
        check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check('id')
            .trim().escape()
            .notEmpty().withMessage(responseMessages.placement.placementIdRequired)
            .isUUID().withMessage(responseMessages.placement.placementIdInvalid)
            .custom(async value => {
                const companyData = await indexService.find('placements', ['id'], { id: value });
                if (!companyData.status) {
                    return Promise.reject(responseMessages.placement.placementIdNotExists);
                }
                return true
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

    /**
     * If validation is success
     *    + call the update service function
     *        - Based on the status in update function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
    */
    if (errors.isEmpty()) {
        var condition = { 'placements.id': req.query.id };
        var timesheetData = await placementTimesheetServices.index(condition);
        if (!timesheetData.status) {
            responseData = { statusCode: responseCodes.codeInternalError, message: timesheetData.message, error: timesheetData.error, message: responseMessages.common.noRecordFound, data: [] }
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: timesheetData.data };
        }

        /* Log Response */
        logResponse('info', req, responseData, "Getting placement timesheet configuration index Response");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Approved users Function is to get the list of users approved for a invoice or the timesheet.
 * 
 * Overview of the function
 * - Validate the request
 *    + If successful:
 *      ~ Retrieve the users approved for a specific timesheet or placement.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Set default variables for 'responseData'.
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + ':slug' (query), must be 'timesheer' or 'placement'.
 *    + 'id' (query), must not be empty, should be a valid UUID, and should exist in their respective table.
 * - Run the validation rules.
 * - If validation is successful:
 *   + Call the 'approveduser' servi
 */
const approvedUsers = tryCatch(async (req, res) => {

    // Log Request
    logRequest('info', req, "Get the approved users request");

    // Default variables
    var responseData;

    // Writing validation rules to the input request
    var validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('slug')
            .escape()
            .notEmpty()
            .withMessage(responseMessages.placement.slugRequired)
            .isIn(['timesheets', 'invoices'])
            .withMessage(responseMessages.placement.slugInvalid),
        check('id')
            .escape()
            .notEmpty()
            .withMessage(responseMessages.placement.idRequired)
            .custom(async (value) => {

                console.log(req.params.slug, 'value');

                // Find the respective record
                const data = await indexService.find(req.params.slug, ['id'], { 'id': value });

                if (!data.status) {
                    return Promise.reject(responseMessages.placement.inValidIdToGetApprovedusers)
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
     * If validation is success.
     *    + call the apprved users function to the list of users approved.
     * If Validation Fails.
     *    + Return the error message.
     */
    if (errors.isEmpty()) {

        const approvedUsers = await placementTimesheetServices.approvedUsers(req.params.slug, req.query.id);

        if (!approvedUsers.status) {
            responseData = { statusCode: responseCodes.codeInternalError, message: approvedUsers.message, error: approvedUsers.error, message: responseMessages.common.noRecordFound, data: [] }
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: approvedUsers?.data?.map(item => item.display_name) };
        }

        // Log Response
        logResponse("info", req, responseData, "Get the approved users Response.");

        // Return the response
        responseHandler(res, responseData);
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

module.exports = { index, store, update, approvedUsers };
