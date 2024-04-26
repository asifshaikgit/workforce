const placementInvoiceServices = require('../../services/placement/placementInvoiceServices.js')
const { check, validationResult } = require('express-validator')
const { logRequest, logResponse } = require('../../../../../utils/log')
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { responseHandler } = require("../../../../responseHandler");
const { tryCatch } = require("../../../../../utils/tryCatch");
const InvalidRequestError = require("../../../../../error/InvalidRequestError");
const indexService = require('../../services/index');
const format = require('../../../../../helpers/format');
const moment = require('moment')
const { regexPatterns } = require('../../../../../constants/regexPatterns')

/**
 * Getting invoice details index function to retrieve invoice details for a placement.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful:
 *      ~ Retrieve invoice details for the placement using the 'index' service function.
 *      ~ Prepare the response with success data or an empty data array if no records are found.
 *    + Else:
 *      ~ Prepare an error response with an appropriate message.
 * - Log the incoming request and the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for 'responseData' and 'request_id'.
 * - Check if 'request_id' is provided and not empty.
 * - If 'request_id' exists:
 *    - Extract 'placement_id' from the query parameters.
 *    - Define a regular expression pattern to validate 'placement_id' as a UUID.
 *    - Validate 'placement_id' using the pattern.
 *    - If 'placement_id' is valid:
 *      - Create a condition to retrieve invoice details based on the 'placement_id'.
 *      - Call the 'index' service function to retrieve the invoice data.
 *      - If data exists, prepare the response with success data.
 *      - If no data is found, prepare the response with an empty data array and a success message.
 *    - If 'placement_id' is invalid, prepare an error response with an appropriate message.
 * - If 'request_id' is not provided or empty, prepare an error response for a missing 'request_id'.
 * - Log the response.
 * - Return the response using 'responseHandler()'.
 *
 * Notes:
 * - Exception handling using try-catch is used to handle errors.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const index = tryCatch(
	async (req, res) => {

		/* Log Request */
		logRequest('info', req, "getting index invoice details request");
		/* Log Request */

		/* Default Variable */
		var responseData = '';
		var request_id = req.query.request_id;
		/* Default Variable */

		if (request_id != undefined && request_id != '') {

			let placement_id = req.query.id
			/* Default Variable */
			var pattern = regexPatterns.uuidRegex

			/* Writing validation rules to the input request */
			if (placement_id != undefined && placement_id != '' && pattern.test(placement_id)) {
				var condition = { id: placement_id };
				var invoiceData = await placementInvoiceServices.index(condition);
				if (invoiceData.status) {
					responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: invoiceData.data };
				} else {
					responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.noRecordFound, data: [] }
				}
			} else {
				responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.placement.placementIdInvalid }
			}
			/* Writing validation rules to the input request */

			/* Log Response */
			logResponse('info', req, responseData, "invoice details index Response");
			/* Log Response */

			/* Return the response */
			responseHandler(res, responseData);
			/* Return the response */

		} else {
			throw new InvalidRequestError(responseMessages.common.requestIdRequired);
		}
	});


/**
 * Create Placement Invoice function to add an invoice configuration for a placement.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful:
 *      ~ Add the invoice configuration for the placement using the 'store' service function.
 *      ~ Prepare the response with success data.
 *    + Else:
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for 'responseData'.
 * - Modify the 'invoice_start_date' property to the appropriate format.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'placement_id' (body), must not be empty, should be a valid UUID, and should exist in the 'placements' table.
 *    + 'invoice_start_date' (body), must not be empty and must be in a valid date format.
 *    + 'net_pay_terms_id' (body), if 'invoice_settings_config_type' is '3', should be a valid number and exist in the 'net_pay_terms' table.
 *    + 'cycle_id' (body), if 'invoice_settings_config_type' is '3', should be a valid number and exist in the 'cycles' table.
 *    + 'day_start_id' (body), if 'invoice_settings_config_type' is '3' and cycle is 1 or 2, should be a valid number and exist in the 'days' table.
 *    + 'invoice_settings_config_type' (body), must not be empty and should be one of [1, 2, 3].
 *    + Based on 'invoice_settings_config_type':
 *      ~ If '1', validate the existence of a global invoice configuration.
 *      ~ If '2', validate the existence of a client-specific invoice configuration.
 *    + 'invoice_approval_config_type' (body), must not be empty and should be one of [1, 2, 3].
 *    + Based on 'invoice_approval_config_type':
 *      ~ If '1', validate the existence of a global invoice approval configuration.
 *      ~ If '2', validate the existence of a client-specific invoice approval configuration.
 *    + 'approvals.*.approver_ids.*.employee_id' (body), if 'invoice_approval_config_type' is '3', should be a valid UUID and exist in the 'employee' table.
 *    + 'approvals.*.rank' (body), if 'invoice_approval_config_type' is '3', must not be empty and should be numeric.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Check for rank order in the 'approvals' array (if applicable).
 *    + If the rank order is correct, set 'rankOrder' to true, indicating that ranks are in order.
 *    + If not, set 'rankOrder' to false, indicating an issue with the rank order.
 *    + If 'rankOrder' is true:
 *      ~ Set additional parameters for the create operation.
 *      ~ Call the 'placementInvoiceServices.store' service function to add the invoice configuration.
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
	logRequest('info', req, "create placement invoice request.");
	/* Log Request */

	/* Default Variable */
	var responseData = "";
	/* Default Variable */

	let modified_date = moment(req.body.invoice_start_date, dateFormat).format('YYYY-MM-DD');
	req.body.invoice_start_date = modified_date; // Modify the invoice_start_date property

	/* Writing validation conditions to the input request */
	var validations = [
		check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
		check("placement_id")
			.trim()
			.notEmpty()
			.withMessage(responseMessages.placement.placementIdRequired)
			.isUUID()
			.withMessage(responseMessages.placement.placementIdInvalid)
			.custom(async (value) => {
				const placementData = await indexService.find('placements', ['id', 'invoice_configuration_id', 'invoice_approval_id', 'client_id'], { id: value })
				if (!placementData.status && value != '') {
					return Promise.reject(responseMessages.placement.placementIdInvalid)
				}
				// if (placementData.data[0].invoice_configuration_id != null || placementData.data[0].invoice_approval_id != null) {
				// 	return Promise.reject(responseMessages.placement.placementIdInvalid)
				// } 
				// else {
				// 	req.body.client_id = placementData.data[0].client_id
				// }
				req.body.client_id = placementData.data[0].client_id
				return true
			}),
		check('invoice_start_date').trim().notEmpty().withMessage(responseMessages.configurations.invoiceConfiguration.startDateRequired)
			.isDate()
			.withMessage(responseMessages.configurations.invoiceConfiguration.startDateInvalid),

		check('net_pay_terms_id')
			.trim()
			.custom(async value => {
				if (req.body.invoice_settings_config_type == 3) {
					if (value != null || value != undefined) {
						let pattern = regexPatterns.numericOnlyRegex
						if (pattern.test(value)) {
							const netPayTermsData = await indexService.find('net_pay_terms', ['id'], { id: value });
							if (!netPayTermsData.status) {
								return Promise.reject(responseMessages.configurations.invoiceConfiguration.netPayTermsIdNotExists);
							}
						} else {
							return Promise.reject(responseMessages.configurations.invoiceConfiguration.invalidNetPayTermsId);
						}
					} else {
						return Promise.reject(responseMessages.configurations.invoiceConfiguration.netPayTermsIdRequired);
					}
				}
				return true
			}),
		check('cycle_id').trim().escape().notEmpty().withMessage(responseMessages.configurations.invoiceConfiguration.cycleIdRequired)
			.custom(async value => {
				if (req.body.invoice_settings_config_type == 3) {
					if (value != null || value != undefined) {
						let pattern = regexPatterns.numericOnlyRegex
						if (pattern.test(value)) {
							const cycleData = await indexService.find('cycles', ['id'], { id: value });
							if (!cycleData.status) {
								return Promise.reject(responseMessages.configurations.invoiceConfiguration.cycleIdNotExists);
							}
						} else {
							return Promise.reject(responseMessages.configurations.invoiceConfiguration.invalidCycleId);
						}
					} else {
						return Promise.reject(responseMessages.configurations.invoiceConfiguration.cycleIdRequired);
					}
				}
				return true
			}
			),
		check('day_start_id').trim().escape()
			.custom(async value => {
				if (req.body.invoice_settings_config_type == 3) {
					if (req.body.cycle_id == 1 || req.body.cycle_id == 2) {
						if (value != null || value != undefined) {
							let pattern = regexPatterns.numericOnlyRegex
							if (pattern.test(value)) {
								const daysData = await indexService.find('days', ['id'], { id: value })
								if (!daysData.status) {
									return Promise.reject(responseMessages.configurations.invoiceConfiguration.dayStartIdNotExists)
								}
							} else {
								return Promise.reject(responseMessages.configurations.invoiceConfiguration.invalidDayId)
							}
						} else {
							return Promise.reject(responseMessages.configurations.invoiceConfiguration.startDayRequired)
						}
					}
					return true
				}
				return true
			}),
		check('invoice_settings_config_type').notEmpty().trim().withMessage(responseMessages.configurations.invoiceConfiguration.invGlobalConfigurationRequired)
			.isIn([1, 2, 3]).withMessage(responseMessages.configurations.invoiceConfiguration.invGlobalConfigurationInvalid)
			.custom(value => {
				if (value == 1) {
					return indexService.find('invoice_configurations', ['id'], { is_global: true, deleted_at: null }).then(invoiceConfigData => {
						if (!invoiceConfigData.status) {
							return Promise.reject(responseMessages.configurations.invoiceConfiguration.invGlobalConfigDoesNotExist)
						} else {
							req.body.default_invoice_configuration_id = invoiceConfigData.data[0].id
						}
					})
				}
				if (value == 2) {
					return indexService.find('companies', ['id', 'invoice_configuration_id'], { id: req.body.client_id, entity_type: 'client', deleted_at: null }).then(companyData => {
						if (!companyData.status || companyData.data[0].invoice_configuration_id == null) {
							return Promise.reject(responseMessages.configurations.invoiceConfiguration.clientConfigurationSettingDoesNotExist)
						} else {
							req.body.default_invoice_configuration_id = companyData.data[0].invoice_configuration_id
						}
					})
				}
				return true
			}),

		check('invoice_approval_config_type').notEmpty().trim().withMessage(responseMessages.configurations.invoiceConfiguration.invGlobalApprovalRequired)
			.isIn([1, 2, 3]).withMessage(responseMessages.configurations.invoiceConfiguration.invGlobalApprovalInvalid)
			.custom(value => {
				if (value == 1) {
					return indexService.find('approval_settings', ['id'], { approval_module: 2, is_global: true, deleted_at: null }).then(approvalData => {
						if (!approvalData.status) {
							return Promise.reject(responseMessages.configurations.invoiceConfiguration.invGlobalapprovalDoesNotExist)
						} else {
							req.body.default_invoice_approval_id = approvalData.data[0].id
						}
					})
				}
				if (value == 2) {
					return indexService.find('companies', ['id', 'invoice_approval_id'], { id: req.body.client_id, entity_type: 'client', deleted_at: null }).then(companyData => {
						if (companyData.status && companyData.data[0].invoice_approval_id == null) {
							return Promise.reject(responseMessages.configurations.invoiceConfiguration.clientApprovalSettingDoesNotExist)
						} else {
							req.body.default_invoice_approval_id = companyData.data[0].invoice_approval_id
						}
					})
				}
				return true
			}),

		check('approvals.*.approver_ids.*.employee_id').notEmpty().trim().withMessage(responseMessages.configurations.approvalConfiguration.approverIdRequired)
			.custom(value => {
				return indexService.find('employee', ['id'], { id: value, status: 'Active', deleted_at: null }).then(userData => {
					if (!userData.status) {
						return Promise.reject(responseMessages.configurations.approvalConfiguration.IdNotExists);
					}
				});
			}),
		check('approvals.*.rank').notEmpty().trim().withMessage(responseMessages.configurations.approvalConfiguration.rankRequired)
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

	if (errors.isEmpty()) {

		let approvalBody = req.body.approvals;

		/* Checking Rank Order */
		var rankUniqueCheck = [...new Set(approvalBody.map(rankChecking => rankChecking.rank))].sort();
		if (approvalBody.length > 0) {
			if (approvalBody.length == rankUniqueCheck.length) {
				var rankOrder = true;
				var currentRankCheck = 1;
				rankUniqueCheck.map(order => {
					if (currentRankCheck != order) {
						rankOrder = false;
					}
					currentRankCheck += 1;
				});
			}
		} else {
			throw new InvalidRequestError(
				responseMessages.configurations.approvalConfiguration.approvalRequired,
				responseCodes.codeUnprocessableEntity
			);
		}
		/* Checking Rank Order */

		if (rankOrder) {
			req.body.approval_count = approvalBody.length;
			var response = await placementInvoiceServices.store(req.body);
			if (response.status) {
				responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully, data: response.data[0] }
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
		logResponse("info", req, responseData, "placement invoice Create Response.");
		/* Log Response */

		/* Return the response */
		responseHandler(res, responseData);
		/* Return the response */

	} else {
		throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
	}
});

/**
 * Update placement invoice configuration function to update a invoice configuration for a placement.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful:
 *      ~ Update the invoice configuration for the placement using the 'update' service function.
 *      ~ Prepare the response with success data.
 *    + Else:
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for 'responseData'.
 * - Modify the 'invoice_start_date' property to the appropriate format.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'placement_id' (body), must not be empty, should be a valid UUID, and should exist in the 'placements' table.
 *    + 'invoice_settings_config_type' (body), must not be empty and should be one of [1, 2, 3].
 *    + Based on 'invoice_settings_config_type':
 *      ~ If '1', validate the existence of a global invoice configuration.
 *      ~ If '2', validate the existence of a client-specific invoice configuration.
 *      ~ If '3', validate 'cycle_id'.
 *    + 'cycle_id' (body), if 'invoice_settings_config_type' is '3', must not be empty and should exist in the 'cycles' table.
 *    + 'invoice_start_date' (body), must not be empty and must be in the correct date format.
 *    + 'day_start_id' (body), if 'invoice_settings_config_type' is '3', optional based on cycle type, and should exist in the 'days' table.
 *    + 'invoice_approval_config_type' (body), must not be empty and should be one of [1, 2, 3].
 *    + Based on 'invoice_approval_config_type':
 *      ~ If '1', validate the existence of a global invoice approval configuration.
 *      ~ If '2', validate the existence of a client-specific invoice approval configuration.
 *    + 'approvals.*.approver_ids.*.employee_id' (body), if 'invoice_approval_config_type' is '3', optional but if provided, should be a valid UUID and exist in the 'employee' table.
 *    + 'approvals.*.rank' (body), if 'invoice_approval_config_type' is '3', must not be empty and should be numeric.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Check for rank order in the 'approvals' array (if applicable).
 *    + If the rank order is correct, set 'rankOrder' to true, indicating that ranks are in order.
 *    + If not, set 'rankOrder' to false, indicating an issue with the rank order.
 *    + If 'rankOrder' is true:
 *      ~ Set additional parameters for the update operation.
 *      ~ Call the 'placementInvoiceServices.update' service function to update the invoice configuration.
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
const update = tryCatch(
	async (req, res) => {

		let dateFormat = await format.getDateFormat(); // date format

		/* Log Request */
		logRequest('info', req, "update placement invoice request.");
		/* Log Request */

		/* Default Variable */
		var responseData = '';
		/* Default Variable */

		let modified_date = moment(req.body.invoice_start_date, dateFormat).format('YYYY-MM-DD');
		req.body.invoice_start_date = modified_date; // Modify the invoice_start_date property

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
					const placementData = await indexService.find('placements', ['id', 'client_id', 'reference_id'], { id: value, deleted_at: null });
					if (!placementData.status && value != '') {
						return Promise.reject(responseMessages.placement.placementIdInvalid);
					}
					req.body.client_id = placementData.data[0].client_id
					req.body.reference_id = placementData.data[0].reference_id;
					return true;
				}),
			check('net_pay_terms_id')
				.trim()
				.custom(async value => {
					if (req.body.invoice_settings_config_type == 3) {
						if (value != null || value != undefined) {
							let pattern = regexPatterns.numericOnlyRegex
							if (pattern.test(value)) {
								const netPayTermsData = await indexService.find('net_pay_terms', ['id'], { id: value });
								if (!netPayTermsData.status) {
									return Promise.reject(responseMessages.configurations.invoiceConfiguration.netPayTermsIdNotExists);
								}
							} else {
								return Promise.reject(responseMessages.configurations.invoiceConfiguration.invalidNetPayTermsId);
							}
						} else {
							return Promise.reject(responseMessages.configurations.invoiceConfiguration.netPayTermsIdRequired);
						}
					}
					return true
				}),
			check('cycle_id').trim().escape().notEmpty().withMessage(responseMessages.configurations.invoiceConfiguration.cycleIdRequired)
				.custom(async value => {
					if (req.body.invoice_settings_config_type == 3) {
						if (value != null || value != undefined) {
							let pattern = regexPatterns.numericOnlyRegex
							if (pattern.test(value)) {
								const cycleData = await indexService.find('cycles', ['id'], { id: value });
								if (!cycleData.status) {
									return Promise.reject(responseMessages.configurations.invoiceConfiguration.cycleIdNotExists);
								}
							} else {
								return Promise.reject(responseMessages.configurations.invoiceConfiguration.invalidCycleId);
							}
						} else {
							return Promise.reject(responseMessages.configurations.invoiceConfiguration.cycleIdRequired);
						}
					}
					return true
				}
				),
			check('day_start_id').trim().escape()
				.custom(async value => {
					if (req.body.invoice_settings_config_type == 3) {
						if (req.body.cycle_id == 1 || req.body.cycle_id == 2) {
							if (value != null || value != undefined) {
								let pattern = regexPatterns.numericOnlyRegex
								if (pattern.test(value)) {
									const daysData = await indexService.find('days', ['id'], { id: value })
									if (!daysData.status) {
										return Promise.reject(responseMessages.configurations.invoiceConfiguration.dayStartIdNotExists)
									}
								} else {
									return Promise.reject(responseMessages.configurations.invoiceConfiguration.invalidDayId)
								}
							} else {
								return Promise.reject(responseMessages.configurations.invoiceConfiguration.startDayRequired)
							}
						}
						return true
					}
					return true
				}),

			check('invoice_start_date').trim().notEmpty().withMessage(responseMessages.configurations.invoiceConfiguration.startDateRequired),
			check('invoice_settings_config_type').notEmpty().trim().withMessage(responseMessages.configurations.invoiceConfiguration.invGlobalConfigurationRequired)
				.isIn([1, 2, 3]).withMessage(responseMessages.configurations.invoiceConfiguration.invGlobalConfigurationInvalid)
				.custom(value => {
					if (value == 1) {
						return indexService.find('invoice_configurations', ['id'], { is_global: true, deleted_at: null }).then(invoiceConfigData => {
							if (!invoiceConfigData.status) {
								return Promise.reject(responseMessages.configurations.invoiceConfiguration.invGlobalConfigDoesNotExist)
							} else {
								req.body.default_invoice_configuration_id = invoiceConfigData.data[0].id
							}
						})
					}
					if (value == 2) {
						return indexService.find('companies', ['id', 'invoice_configuration_id'], { id: req.body.client_id, entity_type: 'client', deleted_at: null }).then(companyData => {
							if (!companyData.status || companyData.data[0].invoice_configuration_id == null) {
								return Promise.reject(responseMessages.configurations.invoiceConfiguration.clientConfigurationSettingDoesNotExist)
							} else {
								req.body.default_invoice_configuration_id = companyData.data[0].invoice_configuration_id
							}
						})
					}
					return true
				}),

			check('invoice_approval_config_type').notEmpty().trim().withMessage(responseMessages.configurations.invoiceConfiguration.invGlobalApprovalRequired)
				.isIn([1, 2, 3]).withMessage(responseMessages.configurations.invoiceConfiguration.invGlobalApprovalInvalid)
				.custom(value => {
					if (value == 1) {
						return indexService.find('approval_settings', ['id'], { approval_module: 2, is_global: true, deleted_at: null }).then(approvalData => {
							if (!approvalData.status) {
								return Promise.reject(responseMessages.configurations.invoiceConfiguration.invGlobalapprovalDoesNotExist)
							} else {
								req.body.default_invoice_approval_id = approvalData.data[0].id
							}
						})
					}
					if (value == 2) {
						return indexService.find('companies', ['id', 'invoice_approval_id'], { id: req.body.client_id, entity_type: 'client', deleted_at: null }).then(companyData => {
							if (companyData.status && companyData.data[0].invoice_approval_id == null) {
								return Promise.reject(responseMessages.configurations.invoiceConfiguration.clientApprovalSettingDoesNotExist)
							} else {
								req.body.default_invoice_approval_id = companyData.data[0].invoice_approval_id
							}
						})
					}
					return true
				}),
			check('approvals.*.id')
				.trim()
				.custom(value => {
					if (req.body.invoice_approval_config_type == 3) {
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
					}
					return true
				}),
			check('approvals.*.rank')
				.trim()
				.custom((value) => {
					if (req.body.invoice_approval_config_type == 3) {
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
					if (req.body.invoice_approval_config_type == 3) {
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
					if (req.body.invoice_approval_config_type == 3) {
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

			if (req.body.invoice_approval_config_type == 3) {

				/* Checking Rank Order */
				var rankUniqueCheck = [...new Set(approvalBody.map(rankChecking => rankChecking.rank))].sort();
				if (approvalBody.length > 0) {
					if (approvalBody.length == rankUniqueCheck.length) {
						var rankOrder = true;
						var currentRankCheck = 1;
						rankUniqueCheck.map(order => {
							if (currentRankCheck != order) {
								rankOrder = false;
							}
							currentRankCheck += 1;
						});
					}
				} else {
					throw new InvalidRequestError(
						responseMessages.configurations.approvalConfiguration.approvalRequired,
						responseCodes.codeUnprocessableEntity
					);
				}
			} else {
				var rankOrder = true;
			}
			/* Checking Rank Order */

			if (rankOrder) {
				req.body.approval_count = approvalBody.length;
				var response = await placementInvoiceServices.update(req.body);
				if (response.status) {
					responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully }
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
			logResponse("info", req, responseData, " Update placement invoice Response.");
			/* Log Response */

			/* Return the response */
			responseHandler(res, responseData);
			/* Return the response */

		} else {
			throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
		}
	});

module.exports = { index, store, update };