const clientTimesheetServices = require('../../services/companies/clientTimesheetServices')
const { check, validationResult } = require('express-validator')
const { logRequest, logResponse } = require('../../../../../utils/log')
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { responseHandler } = require("../../../../responseHandler");
const { tryCatch } = require("../../../../../utils/tryCatch");
const InvalidRequestError = require("../../../../../error/InvalidRequestError");
const indexService = require('../../services/index');
const { regexPatterns } = require('../../../../../constants/regexPatterns');

/**
 * Store client timesheet configuration function to add a timesheet configuration for a client.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful:
 *      ~ Add the timesheet configuration for the client using the 'store' service function.
 *      ~ Prepare the response with success data.
 *    + Else:
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for 'responseData'.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'id' (body), must not be empty, should be a valid UUID, and should exist in the 'companies' table for clients.
 *    + 'cycle_id' (body), must not be empty and should exist in the 'cycles' table.
 *    + 'ts_mandatory' (body), must not be empty and should be a boolean value.
 *    + 'day_start_id' (body), optional based on the cycle type and should exist in the 'days' table.
 *    + 'default_hours' (body), must not be empty and should be in the format 'hh:mm'.
 *    + 'approvals.*.approver_ids.*.employee_id' (body), optional but if provided, should exist in the 'employee' table.
 *    + 'approvals.*.rank' (body), must be numeric.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Check for rank order in the 'approvals' array.
 *    + If the rank order is correct, set 'rankOrder' to true, indicating that ranks are in order.
 *    + If not, set 'rankOrder' to false, indicating an issue with the rank order.
 *    + If 'rankOrder' is true:
 *      ~ Set additional parameters for the create operation.
 *      ~ Call the 'clientTimesheetServices.store' service function to add the timesheet configuration.
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

	/* Log Request */
	logRequest('info', req, "Store client timesheet configuration request");
	/* Log Request */

	/* Default Variable */
	var responseData = "";
	/* Default Variable */

	/* Writing validation conditions to the input request */
	var validations = [
		check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
		check('id')
			.trim().escape()
			.notEmpty().withMessage(responseMessages.companies.companyIdRequired)
			.isUUID().withMessage(responseMessages.companies.companyIDInvalid)
			.custom(async value => {
				const companyData = await indexService.find('companies', ['id'], { id: value, entity_type: 'client'});
				if (!companyData.status) {
					return Promise.reject(responseMessages.companies.companyIdNotExists);
				}
			}),
		check('cycle_id')
			.trim().escape()
			.notEmpty().withMessage(responseMessages.configurations.timesheetConfiguration.cycleIdRequired)
			.custom(async value => {
				const cycleData = await indexService.find('cycles', ['id'], { id: value })
                if (!cycleData.status) {
                    return Promise.reject(responseMessages.configurations.timesheetConfiguration.invalidCycleId)
                }
			}),
		check("ts_mandatory")
			.trim().escape()
			.notEmpty().withMessage(responseMessages.configurations.timesheetConfiguration.timesheetRequired)
			.isBoolean().withMessage(responseMessages.configurations.timesheetConfiguration.timesheetInvalid),
		check('day_start_id')
			.trim().escape()
			.custom(value => {
				if (req.body.cycle_id == 1 || req.body.cycle_id == 2) { //1 for weekly , 2 for bi-weekly
					if (value == '' && value == null) {
						return Promise.reject(responseMessages.configurations.timesheetConfiguration.startDayRequired)
					} else {
						return indexService.find('days', ['id'], { id: value }).then(daysData => {
							if (!daysData.status) {
								return Promise.reject(responseMessages.configurations.timesheetConfiguration.invalidDayId)
							}
						})
					}
				}
				return true;
			}),
			check('default_hours')
				.trim()
				.notEmpty().withMessage(responseMessages.configurations.timesheetConfiguration.defaultHourRequired)
				.custom((value) => {
					const timeRegex = regexPatterns.twentyFourHourTimeRegex;
					if (!timeRegex.test(value)) {
						return Promise.reject(responseMessages.configurations.timesheetConfiguration.defaultHourInvalid);
					}
					return true
				}),
			// .isTime().withMessage(responseMessages.configurations.timesheetConfiguration.defaultHourInvalid),
		check('approvals')
			.isArray({ min: 1 })
			.withMessage(responseMessages.configurations.timesheetConfiguration.approvalLevelRequired)
			.custom(value => {
			  // Check if at least one approval level has a non-empty employee_id
			  const hasValidEmployeeId = value.some(approval => {
				return approval.approver_ids.some(approver => {
				  return approver.employee_id.trim() !== '';
				});
			  });
			  if (!hasValidEmployeeId) {
				return Promise.reject(responseMessages.configurations.timesheetConfiguration.approvalEmployeeRequired);
			  }
			  return true;
			}),
		check('approvals.*.approver_ids.*.employee_id')
			.trim()
			.custom(value => {
				if (value != '' && value != null) {
					return indexService.find('employee', ['id'], { id: value, status: 'Active' }).then(approvalUserData => {
						if (!approvalUserData.status) {
							return Promise.reject(responseMessages.configurations.approvalConfiguration.IdNotExists);
						}
					});
				}
				return true;
			}),
		check('approvals.*.rank')
			.trim()
			.escape()
			.notEmpty()
			.withMessage(responseMessages.configurations.approvalConfiguration.rankRequired)
			.isNumeric().withMessage(responseMessages.configurations.approvalConfiguration.rankInvalid)
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
		let approvalBody = req.body.approvals;

		/* Checking Rank Order */
		var rankUniqueCheck = [...new Set(approvalBody.map(rankChecking => rankChecking.rank))].sort();
		if (approvalBody.length == rankUniqueCheck.length) {
			var rankOrder = true;
			var currentRankCheck = 1;
			rankUniqueCheck.map(order => {
                if (currentRankCheck != order) {
                    rankOrder = false
                }
                currentRankCheck += 1
            });
		}
		/* Checking Rank Order */

		if (rankOrder) {
			req.body.approval_count = approvalBody.length;
			req.body.is_global = false;
			req.body.approval_module = 1;
			var response = await clientTimesheetServices.store(req.body);
			if(response.status){
				responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully}
			} else {
				responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error }
			}
			
		} else {
			throw new InvalidRequestError(
				responseMessages.configurations.approvalConfiguration.rankOrderInvalid,
				responseCodes.codeUnprocessableEntity
			);
		}
		/* Log Response */
		logResponse("info", req, responseData, "Store client timesheet configuration Response.");
		/* Log Response */

		/* Return the response */
		responseHandler(res, responseData);
		/* Return the response */

	} else {
		throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
	}
});


/**
 * Update client timesheet configuration function to modify timesheet configuration for a client.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful:
 *      ~ Update the timesheet configuration for the client using the 'update' service function.
 *      ~ Prepare the response with success data.
 *    + Else:
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for 'responseData'.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'id' (body), must not be empty, should be a valid UUID, and should exist in the 'companies' table for clients.
 *    + 'cycle_id' (body), must not be empty and should exist in the 'cycles' table.
 *    + 'ts_mandatory' (body), must not be empty and should be a boolean value.
 *    + 'day_start_id' (body), optional based on the cycle type and should exist in the 'days' table.
 *    + 'default_hours' (body), must not be empty and should be in the format 'hh:mm'.
 *    + 'approvals.*.id' (body), optional but if provided, should exist in the 'approval_levels' table.
 *    + 'approvals.*.rank' (body), must be numeric.
 *    + 'approvals.*.approver_ids.*.employee_id' (body), optional but if provided, should exist in the 'employee' table.
 *    + 'approvals.*.approver_ids.*.id' (body), optional but if provided, should exist in the 'approval_users' table.
 *    + 'delete_user_ids.*' (body), optional but if provided, should exist in the 'approval_users' table.
 *    + 'delete_approval_level_ids.*' (body), optional but if provided, should exist in the 'approval_levels' table.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Check for rank order in the 'approvals' array.
 *    + If the rank order is correct, set 'rankOrder' to true, indicating that ranks are in order.
 *    + If not, set 'rankOrder' to false, indicating an issue with the rank order.
 *    + If 'rankOrder' is true:
 *      ~ Set additional parameters for the update operation.
 *      ~ Call the 'clientTimesheetServices.update' service function to modify the timesheet configuration.
 * 		~ If Success:
 * 		  - Prepare the response with success data. 
 *      ~ Else:
 * 		  - Prepare the response with error message. 
 *      ~ Log the response.
 * 		~ Return the response using 'responseHandler()'
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
	/* Log Request */
	logRequest('info', req, "Update client timesheet configuration request");
	/* Log Request */

	/* Default Variable */
	var responseData = '';
	/* Default Variable */

	/* Writing validation rules to the input request */
	var validations = [
		check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
		check('id')
			.trim().escape()
			.notEmpty().withMessage(responseMessages.companies.companyIdRequired)
			.isUUID().withMessage(responseMessages.companies.companyIDInvalid)
			.custom(async value => {
				const companyData = await indexService.find('companies', ['id', 'timesheet_approval_id', 'timesheet_configuration_id'], { id: value, entity_type: 'client'});
				if (!companyData.status) {
					return Promise.reject(responseMessages.companies.companyIdNotExists);
				}
				req.body.timesheet_approval_id = companyData.data[0].timesheet_approval_id
				req.body.timesheet_configuration_id = companyData.data[0].timesheet_configuration_id
				return true
			}),
		check('cycle_id')
			.trim().escape()
			.notEmpty().withMessage(responseMessages.configurations.timesheetConfiguration.cycleIdRequired)
			.custom(async value => {
				const cycleData = await indexService.find('cycles', ['id'], { id: value })
				if (!cycleData.status) {
					return Promise.reject(responseMessages.configurations.timesheetConfiguration.invalidCycleId)
				}
				return true
			}),
		check("ts_mandatory")
			.trim().escape()
			.notEmpty().withMessage(responseMessages.configurations.timesheetConfiguration.timesheetRequired)
			.isBoolean().withMessage(responseMessages.configurations.timesheetConfiguration.timesheetInvalid),
		check('day_start_id').trim().escape()
			.custom(value => {
				if (req.body.cycle_id == 1 || req.body.cycle_id == 2) {
					if (!value) {
						return Promise.reject(responseMessages.configurations.timesheetConfiguration.startDayRequired)
					} else {
						return indexService.find('days', ['id'], { id: value }).then(daysData => {
							if (!daysData.status) {
								return Promise.reject(responseMessages.configurations.timesheetConfiguration.invalidDayId)
							}
						})
					}
				}
				return true;
			}),
		check('default_hours')
			.trim()
			.notEmpty().withMessage(responseMessages.configurations.timesheetConfiguration.defaultHourRequired)
			.custom((value) => {
				const timeRegex = regexPatterns.twentyFourHourTimeRegex;
				if (!timeRegex.test(value)) {
					return Promise.reject(responseMessages.configurations.timesheetConfiguration.defaultHourInvalid);
				}
				return true
			}),
		check('approvals')
			.isArray({ min: 1 })
			.withMessage(responseMessages.configurations.timesheetConfiguration.approvalLevelRequired)
			.custom(value => {
			  // Check if at least one approval level has a non-empty employee_id
			  const hasValidEmployeeId = value.some(approval => {
				return approval.approver_ids.some(approver => {
				  return approver.employee_id.trim() !== '';
				});
			  });
			  if (!hasValidEmployeeId) {
				return Promise.reject(responseMessages.configurations.timesheetConfiguration.approvalEmployeeRequired);
			  }
			  return true;
			}),
		check('approvals.*.id')
			.trim()
			.custom( async value => {
				if (value != null && value != '') {
					const approvalLevelData = await indexService.find('approval_levels', ['id'], { id: value })
					if (!approvalLevelData.status) {
						return Promise.reject(responseMessages.configurations.approvalConfiguration.levelIdNotExists);
					}
					req.body.approval_level_id = approvalLevelData.data[0].id
				}
				
				return true
			}),
		check('approvals.*.rank')
		.trim()
		.notEmpty()
		.withMessage(responseMessages.configurations.approvalConfiguration.rankRequired)
		.isNumeric().withMessage(responseMessages.configurations.approvalConfiguration.rankInvalid),


		check('approvals.*.approver_ids.*.employee_id').trim().custom( async value => {
			if (value != '' && value != null) {
				const userData = await  indexService.find('employee', ['id'], { id: value, status: 'Active' })
				if (!userData.status) {
					return Promise.reject(responseMessages.configurations.approvalConfiguration.IdNotExists);
				}
				req.body.approver_emp_id = userData.data[0].id
			}
			return true;
		}),
		check('approvals.*.approver_ids.*.id')
			.trim()
			.custom(async value => {
				if (value != null && value != '') {
					 const approvalUserData = await indexService.find('approval_users', ['id'], { id: value })
						if (!approvalUserData.status) {
							return Promise.reject(responseMessages.configurations.approvalConfiguration.IdNotExists);
						}
				}
				return true
			}),
		check('delete_user_ids.*')
			.trim()
			.custom(async value => {
				if (value != null && value != '' && value != undefined) {
					var approvalLevelsCount = await indexService.count('approval_users', { approval_level_id: req.body.approval_level_id }, [], true)
					if (Number(approvalLevelsCount.data) == 1 && req.body.approver_emp_id == '') {
						return Promise.reject(responseMessages.configurations.approvalConfiguration.canNotDeleteUser);
					}
					var approvalUserData = await indexService.find('approval_users', ['id'], { id: value })
					if (!approvalUserData.status) {
						return Promise.reject(responseMessages.configurations.approvalConfiguration.deleteUserIdNotExists);
					}
				}
				return true
			}),
		check('delete_approval_level_ids.*')
			.trim()
			.custom(async value => {
				if (value != null && value != '') {
				var approvalLevelsCount = await indexService.count('approval_levels', { approval_setting_id: req.body.timesheet_approval_id }, [], true)
				if (Number(approvalLevelsCount.data) == 1) {
					return Promise.reject(responseMessages.configurations.approvalConfiguration.canNotDeleteLevel);
				}
				var approvalLevelData = await indexService.find('approval_levels', ['id'], { id: value })
				if (!approvalLevelData.status) {
					return Promise.reject(responseMessages.configurations.approvalConfiguration.deleteLevelIdNotExists);
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
		let approvalBody = req.body.approvals;

		/* Checking Rank Order */
		var rankUniqueCheck = [...new Set(approvalBody.map(rankChecking => rankChecking.rank))].sort();
		if (approvalBody.length == rankUniqueCheck.length) {
			var rankOrder = true;
			var currentRankCheck = 1;
			rankUniqueCheck.map(order => {
				if (currentRankCheck != order) {
					rankOrder = false
				}
				currentRankCheck += 1
			});
		}
		/* Checking Rank Order */

		if (rankOrder) {
			req.body.approval_count = approvalBody.length;
			req.body.is_global = false;
			req.body.approval_module = 1;
			const condition = {id: req.params.id}
			var response = await clientTimesheetServices.update(req.body, condition);
			if(response.status){
				responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully }
			} else {
				responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error}
			}
			
		} else {
			throw new InvalidRequestError(
				responseMessages.configurations.approvalConfiguration.rankOrderInvalid,
				responseCodes.codeUnprocessableEntity
			);
		}

		/* Log Response */
		logResponse("info", req, responseData, "Update client timesheet configuration Response.");
		/* Log Response */

		/* Return the response */
		responseHandler(res, responseData);
		/* Return the response */

	} else {
		throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
	}
});

/**
 * Getting client timesheet configuration index function to retrieve timesheet configurations for a client.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful:
 *      ~ Retrieve timesheet configurations for the client using the 'index' service function.
 *      ~ Prepare the response with success data.
 *    + Else:
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for 'responseData' and 'request_id'.
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'id' (query), must not be empty, should be a valid UUID, and should exist in the 'companies' table for clients.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Create a condition to retrieve timesheet configurations based on the client's ID.
 *    + Call the 'index' service function to retrieve the timesheet data.
 * 	  + If data exists:
 * 		- Prepare the response with success data
 *    + Else:
 * 		- Prepare the response with error message and empty data.
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
	logRequest('info', req, "Getting client timesheet configuration index request");
	/* Log Request */

	/* Default Variable */
	var responseData = '';
	/* Default Variable */

	/* Writing validation rules to the input request */
	var validations = [
		check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
		check('id')
			.trim().escape()
			.notEmpty().withMessage(responseMessages.companies.companyIdRequired)
			.isUUID().withMessage(responseMessages.companies.companyIDInvalid)
			.custom(async value => {
				const companyData = await indexService.find('companies', ['id'], { id: value, entity_type: 'client'});
				if (!companyData.status) {
					return Promise.reject(responseMessages.companies.companyIdNotExists);
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
		var condition = { 'companies.id': req.query.id };
		var timesheetData = await clientTimesheetServices.index(condition);
		if (timesheetData.status) {
			responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: timesheetData.data};
		} else {
			responseData = { statusCode: responseCodes.codeSuccess, message: timesheetData.message, data: []}
		}

		/* Log Response */
		logResponse('info', req, responseData, "Getting client timesheet configuration index Response");
		/* Log Response */

		/* Return the response */
		responseHandler(res, responseData);
		/* Return the response */

	} else {
		throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
	}
});


module.exports = { index, store, update };