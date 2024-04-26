const clientInvoiceServices = require('../../services/companies/clientInvoiceServices')
const { check, validationResult } = require('express-validator')
const { logRequest, logResponse } = require('../../../../../utils/log')
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { responseHandler } = require("../../../../responseHandler");
const { tryCatch } = require("../../../../../utils/tryCatch");
const InvalidRequestError = require("../../../../../error/InvalidRequestError");
const indexService = require('../../services/index');

/**
 * Store client invoice configuration function to add invoice configuration for a client.
 *
 * Overview of Function:
 * - Validate the request.
 *   + If successful:
 *     ~ Add the invoice configuration for the client using the 'clientInvoiceServices.store' service function.
 *     ~ Prepare the response with success data.
 *   + Else:
 *     ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for 'responseData'.
 * - Define the validation rules as follows:
 *   + 'request_id' (body), must not be empty.
 *   + 'id' (body), must not be empty, should be a valid UUID, and should exist in the 'companies' table for clients.
 *   + 'net_pay_terms_id' (body), must not be empty and should exist in the 'net_pay_terms' table.
 *   + 'cycle_id' (body), must not be empty and should exist in the 'cycles' table.
 *   + 'day_start_id' (body), optional based on the cycle type and should exist in the 'days' table.
 *   + 'approvals.*.approver_ids.*.employee_id' (body), optional but if provided, should exist in the 'employee' table.
 *   + 'approvals.*.rank' (body), must be numeric.
 *   + 'invoice_email_template_type' (body), must be numeric(1 for default , 2 for custom).
 * 		- If value equal to 1:
 * 		  ~ Fetch the defualt invoice email template from 'invoice_email_templates' table based condition 'is_global' true and 'deleted_at' is null
 *   + 'subject' (body), optional for default templates, should not be empty for custom templates.
 *   + 'template' (body), optional for default templates, should not be empty for custom templates.
 *   + 'bcc' (body), should be an array.
 *   + 'bcc.*' (body), optional for default templates, should be a valid email address for custom templates.
 *   + 'cc' (body), should be an array.
 *   + 'cc.*' (body), optional for default templates, should be a valid email address for custom templates.
 * - Run the validation rules.
 * - If validation is successful:
 *   + Check for rank order in the 'approvals' array.
 *   + If the rank order is correct, set 'rankOrder' to true, indicating that ranks are in order.
 *   + If not, set 'rankOrder' to false, indicating an issue with the rank order.
 *   + If 'rankOrder' is true:
 *     ~ Set additional parameters for the create operation.
 *     ~ Call the 'clientInvoiceServices.store' service function to add the invoice configuration.
 *     ~ If Success:
 *       - Prepare the response with success data.
 *     ~ Else:
 *       - Prepare the response with an error message.
 *     ~ Log the response.
 *     ~ Return the response using 'responseHandler()'.
 *   + If 'rankOrder' is false:
 *     ~ Raise an exception with an error message.
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
const store = tryCatch(async (req, res) => {
	/* Log Request */
	logRequest('info', req, "Store client invoice configuartion request.");
	/* Log Request */

	/* Default Variable */
	var responseData = "";
	/* Default Variable */

	/* Writing validation conditions to the input request */
	var validations = [
		check('request_id')
			.trim()
			.escape()
			.notEmpty()
			.withMessage(responseMessages.common.requestIdRequired),
		check("id")
			.trim()
			.notEmpty()
			.withMessage(responseMessages.companies.companyIdRequired)
			.isUUID()
			.withMessage(responseMessages.companies.companyIDInvalid)
			.custom(async (value) => {
				const companyData = await indexService.find('companies', ['id', 'name', 'reference_id', 'invoice_approval_id', 'invoice_configuration_id', 'invoice_email_template_id'], { id: value, entity_type: 'client' });
				if (!companyData.status) {
					return Promise.reject(responseMessages.companies.companyIdNotExists);
				}
				if (companyData.data[0].invoice_configuration_id != null || companyData.data[0].invoice_approval_id != null) {
					return Promise.reject(responseMessages.configurations.invoiceConfiguration.clientInvAlreadyExists);
				}
				if (companyData.data[0].invoice_email_template_id != null) {
					return Promise.reject(responseMessages.configurations.invoiceConfiguration.clientInvEmailAlreadyExists);
				}
				req.body.company_name = companyData.data[0].name
				req.body.company_reference_id = companyData.data[0].reference_id
				return true;
			}),
		check('net_pay_terms_id').trim().escape()
			.notEmpty().withMessage(responseMessages.configurations.invoiceConfiguration.netPayTermsIdRequired)
			.custom(async value => {
				const netPayTermsData = await indexService.find('net_pay_terms', ['id'], { id: value });
				if (!netPayTermsData.status) {
					return Promise.reject(responseMessages.configurations.invoiceConfiguration.invalidNetPayTermsId);
				}
			}),
		check('cycle_id')
			.trim()
			.escape()
			.notEmpty()
			.withMessage(responseMessages.configurations.invoiceConfiguration.cycleIdRequired)
			.custom(async value => {
				const cycleData = await indexService.find('cycles', ['id'], { id: value });
				if (!cycleData.status) {
					return Promise.reject(responseMessages.configurations.invoiceConfiguration.invalidCycleId);
				}
			}),
		check('day_start_id')
			.trim()
			.escape()
			.custom(value => {
				if (req.body.cycle_id == 1 || req.body.cycle_id == 2) {
					if (value == '' || value == null) {
						return Promise.reject(responseMessages.configurations.invoiceConfiguration.startDayRequired)
					}
				}
				if (req.body.cycle_id == 1 || req.body.cycle_id == 2) {
					return indexService.find('days', ['id'], { id: value }).then(daysData => {
						if (!daysData.status) {
							return Promise.reject(responseMessages.configurations.invoiceConfiguration.invalidDayId)
						}
					})
				}
				return true;
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
		check('approvals.*.approver_ids.*.employee_id')
			.trim()
			.custom(value => {
				if (value != null && value != '') {
					return indexService.find('employee', ['id'], { id: value, status: 'Active' }).then(userData => {
						if (!userData.status) {
							return Promise.reject(responseMessages.configurations.approvalConfiguration.IdNotExists);
						}
					});
				}
				return true;
			}),
		check('approvals.*.rank')
			.trim()
			.notEmpty()
			.withMessage(responseMessages.configurations.approvalConfiguration.rankRequired)
			.isNumeric()
			.withMessage(responseMessages.configurations.approvalConfiguration.rankInvalid),
		check('invoice_email_template_type')
			.trim() // 1 for default , 2 for custom
			.isNumeric()
			.withMessage(responseMessages.configurations.approvalConfiguration.invoiceEmailTemplateTypeRequired)
			.custom(value => {
				if (value == 1) {
					return indexService.find('invoice_email_templates', ['id'], { is_global: true, deleted_at: null }).then(invoiceEmailTemplateData => {
						if (!invoiceEmailTemplateData.status) {
							return Promise.reject(responseMessages.configurations.invoiceConfiguration.globalDoesNotExist)
						} else {
							req.body.default_invoice_email_template_id = invoiceEmailTemplateData.data[0].id
						}
					})
				} else if (value == 2) {
					if (!Array.isArray(req.body.bcc)) {
						return Promise.reject(
							responseMessages.configurations.invoiceEmailTemplates.BccArray
						)
					}

					if (!Array.isArray(req.body.cc)) {
						return Promise.reject(
							responseMessages.configurations.invoiceEmailTemplates.CCArray
						)
					}
				}
				return true
			}),
		check('subject')
			.trim()
			.custom(value => {
				if (value == "" || value == null) {
					if (req.body.invoice_email_template_type == 1) {
						return true
					} else {
						return Promise.reject(responseMessages.configurations.invoiceEmailTemplates.subjectRequired)
					}
				}
				return true
			}),
		check('template')
			.trim()
			.custom(value => {
				if (value == "" || value == null) {
					if (req.body.invoice_email_template_type == 1) {
						return true
					} else {
						return Promise.reject(responseMessages.configurations.invoiceEmailTemplates.templateRequired)
					}
				}
				return true
			}),
		check('bcc.*')
			.trim()
			.custom(value => {
				console.log(value, 'value')
				if (value == "" || value == null) {
					if (req.body.invoice_email_template_type == 1) {
						return true
					} else {
						var email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
						if (!email_pattern.test(value)) {
							return Promise.reject(responseMessages.configurations.invoiceEmailTemplates.bccEmailIdInvalid)
						}
					}
				}
				return true
			}),
		check('cc.*')
			.trim()
			.custom(value => {
				if (value == "" || value == null) {
					if (req.body.invoice_email_template_type == 1) {
						return true
					} else {
						var email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
						if (!email_pattern.test(value)) {
							return Promise.reject(responseMessages.configurations.invoiceEmailTemplates.ccEmailIdInvalid)
						}
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
					rankOrder = false;
				}
				currentRankCheck += 1;
			});
		}
		/* Checking Rank Order */

		if (rankOrder) {
			req.body.approval_count = approvalBody.length;
			req.body.is_global = false;
			req.body.approval_module = 2;
			var response = await clientInvoiceServices.store(req.body);
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
		logResponse("info", req, responseData, "Store client invoice configuartion Response.");
		/* Log Response */

		/* Return the response */
		responseHandler(res, responseData);
		/* Return the response */

	} else {
		throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
	}
});

/**
 * Update client invoice configuration function to modify invoice configuration for a client.
 *
 * Overview of Function:
 * - Validate the request.
 *   + If successful:
 *     ~ Update the invoice configuration for the client using the 'clientInvoiceServices.update' service function.
 *     ~ Prepare the response with success data.
 *   + Else:
 *     ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for 'responseData'.
 * - Define the validation rules as follows:
 *   + 'request_id' (body), must not be empty.
 *   + 'id' (body), must not be empty, should be a valid UUID, and should exist in the 'companies' table for clients with a non-null 'invoice_configuration_id' or 'invoice_approval_id'.
 *   + 'net_pay_terms_id' (body), must not be empty and should exist in the 'net_pay_terms' table.
 *   + 'cycle_id' (body), must not be empty and should exist in the 'cycles' table.
 *   + 'day_start_id' (body), optional based on the cycle type and should exist in the 'days' table.
 *   + 'approvals.*.id' (body), optional but if provided, should exist in the 'approval_levels' table.
 *   + 'approvals.*.rank' (body), must be numeric.
 *   + 'approvals.*.approver_ids.*.employee_id' (body), optional but if provided, should exist in the 'employee' table.
 *   + 'approvals.*.approver_ids.*.id' (body), optional but if provided, should exist in the 'approval_users' table.
 *   + 'invoice_email_template_id' (body), must not be empty, should be numeric, and should exist in the 'companies' table for clients.
 *   + 'invoice_email_template_type' (body), must be numeric(1 for default, 2 for custom).
 * 		- If value equal to 1:
 * 		  ~ Fetch the default invoice email template from 'invoice_email_templates' table based on condition 'is_global' true and 'deleted_at' is null.
 *   + 'subject' (body), optional for default templates, should not be empty for custom templates.
 *   + 'template' (body), optional for default templates, should not be empty for custom templates.
 *   + 'bcc' (body), should be an array.
 *   + 'bcc.*' (body), optional for default templates, should be a valid email address for custom templates.
 *   + 'cc' (body), should be an array.
 *   + 'cc.*' (body), optional for default templates, should be a valid email address for custom templates.
 *   + 'delete_user_ids.*' (body), optional but if provided, should exist in the 'approval_users' table.
 *   + 'delete_approval_level_ids.*' (body), optional but if provided, should exist in the 'approval_levels' table with a non-null 'deleted_at' field.
 * - Run the validation rules.
 * - If validation is successful:
 *   + Check for rank order in the 'approvals' array.
 *   + If the rank order is correct, set 'rankOrder' to true, indicating that ranks are in order.
 *   + If not, set 'rankOrder' to false, indicating an issue with the rank order.
 *   + If 'rankOrder' is true:
 *     ~ Set additional parameters for the update operation.
 *     ~ Call the 'clientInvoiceServices.update' service function to modify the invoice configuration.
 *     ~ If Success:
 *       - Prepare the response with success data.
 *     ~ Else:
 *       - Prepare the response with an error message.
 *     ~ Log the response.
 *     ~ Return the response using 'responseHandler()'.
 *   + If 'rankOrder' is false:
 *     ~ Raise an exception with an error message.
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
const update = tryCatch(async (req, res) => {
	/* Log Request */
	logRequest('info', req, "Update client invoice configuration request.");
	/* Log Request */

	/* Default Variable */
	var responseData = '';
	/* Default Variable */

	/* Writing validation rules to the input request */
	var validations = [
		check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
		check("id")
			.trim()
			.notEmpty()
			.withMessage(responseMessages.companies.companyIdRequired)
			.isUUID()
			.withMessage(responseMessages.companies.companyIDInvalid)
			.custom(async (value) => {
				const companyData = await indexService.find('companies', ['id', 'invoice_approval_id', 'invoice_configuration_id'], { id: value, entity_type: 'client' });
				if (!companyData.status) {
					return Promise.reject(responseMessages.companies.companyIDInvalid);
				}
				if (companyData.data[0].invoice_configuration_id == null && companyData.data[0].invoice_approval_id == null) {
					return Promise.reject(responseMessages.companies.companyIDInvalid);
				}
				req.body.invoice_approval_id = companyData.data[0].invoice_approval_id
				req.body.invoice_configuration_id = companyData.data[0].invoice_configuration_id
				return true;
			}),
		check('net_pay_terms_id')
			.trim().escape()
			.notEmpty().withMessage(responseMessages.configurations.invoiceConfiguration.netPayTermsIdRequired)
			.custom(async value => {
				const netPayTermsData = await indexService.find('net_pay_terms', ['id'], { id: value });
				if (!netPayTermsData.status) {
					return Promise.reject(responseMessages.configurations.invoiceConfiguration.invalidNetPayTermsId);
				}
			}),
		check('cycle_id').trim().escape().notEmpty().withMessage(responseMessages.configurations.invoiceConfiguration.cycleIdRequired)
			.custom(async value => {
				const cycleData = await indexService.find('cycles', ['id'], { id: value });
				if (!cycleData.status) {
					return Promise.reject(responseMessages.configurations.invoiceConfiguration.invalidCycleId);
				}
			}),
		check('day_start_id').trim().escape()
			.custom(value => {
				if (req.body.cycle_id == 1 || req.body.cycle_id == 2) {
					if (!value) {
						return Promise.reject(responseMessages.configurations.invoiceConfiguration.startDayRequired)
					} else {
						return indexService.find('days', ['id'], { id: value }).then(daysData => {
							if (!daysData.status) {
								return Promise.reject(responseMessages.configurations.invoiceConfiguration.invalidDayId)
							}
						})
					}
				}
				return true;
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
		check('approvals.*.rank').trim()
		.notEmpty()
		.withMessage(responseMessages.configurations.approvalConfiguration.rankRequired)
		.isNumeric().withMessage(responseMessages.configurations.approvalConfiguration.rankInvalid),
		check('approvals.*.approver_ids.*.employee_id').trim().custom(value => {
			if (value != null && value != '') {
				return indexService.find('employee', ['id'], { id: value, status: 'Active', deleted_at: null }).then(userData => {
					if (!userData.status) {
						return Promise.reject(responseMessages.configurations.approvalConfiguration.IdNotExists);
					}
				});
			}
			return true;
		}),
		check('approvals.*.approver_ids.*.id')
			.trim()
			.custom(value => {
				if (value != null && value != '') {
					return indexService.find('approval_users', ['id'], { id: value }).then(approvalUserData => {
						if (!approvalUserData.status) {
							return Promise.reject(responseMessages.configurations.approvalConfiguration.IdNotExists);
						}
					})
				}
				return true
			}),
		check("invoice_email_template_id")
			.trim()
			.notEmpty()
			.withMessage(responseMessages.configurations.invoiceConfiguration.invoiceEmailTemplateIdRequired)
			.isNumeric()
			.withMessage(responseMessages.configurations.invoiceConfiguration.invoiceEmailTemplateIdInvalid)
			.custom(async (value) => {
				const clientData = await indexService.find('companies', ['id'], { invoice_email_template_id: value, entity_type: 'client' });
				if (!clientData.status && value != '') {
					return Promise.reject(responseMessages.configurations.invoiceConfiguration.invoiceEmailTemplateIdInvalid);
				}
				return true;
			}),
		check('invoice_email_template_type')
			.trim()
			.notEmpty()
			.withMessage(responseMessages.configurations.invoiceConfiguration.invoiceEmailTemplateTypeRequired)
			.isNumeric()
			.withMessage(responseMessages.configurations.invoiceConfiguration.invoiceEmailTemplateTypeInvalid)
			.custom(value => {
				if (value == 1) {
					return indexService.find('invoice_email_templates', ['id'], { is_global: true, deleted_at: null }).then(approvalData => {
						if (!approvalData.status) {
							return Promise.reject(responseMessages.configurations.invoiceConfiguration.globalDoesNotExist)
						} else {
							req.body.default_invoice_email_template_id = approvalData.data[0].id
						}
					});
				} else if (value == 2) {
					if (!Array.isArray(req.body.bcc)) {
						return Promise.reject(
							responseMessages.configurations.invoiceEmailTemplates.BccArray
						)
					}

					if (!Array.isArray(req.body.cc)) {
						return Promise.reject(
							responseMessages.configurations.invoiceEmailTemplates.CCArray
						)
					}
				}
				return true
			}),
		check('subject').trim()
			.custom(value => {
				if (value == "" || value == null) {
					if (req.body.invoice_email_template_type == 1) {
						return true
					} else {
						return Promise.reject(responseMessages.configurations.invoiceEmailTemplates.subjectRequired)
					}
				}
				return true
			}),
		check('template').trim()
			.custom(value => {
				if (value == "" || value == null) {
					if (req.body.invoice_email_template_type == 1) {
						return true
					} else {
						return Promise.reject(responseMessages.configurations.invoiceEmailTemplates.templateRequired)
					}
				}
				return true
			}),
		check('bcc.*').trim()
			.custom(value => {
				if (value == "" || value == null) {
					if (req.body.invoice_email_template_type == 1) {
						return true
					} else {
						var email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
						if (!email_pattern.test(value)) {
							return Promise.reject(responseMessages.configurations.invoiceEmailTemplates.bccEmailIdInvalid)
						}
					}
				}
				return true
			}),
		check('cc.*').trim()
			.custom(value => {
				if (value == "" || value == null) {
					if (req.body.invoice_email_template_type == 1) {
						return true
					} else {
						var email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
						if (!email_pattern.test(value)) {
							return Promise.reject(responseMessages.configurations.invoiceEmailTemplates.ccEmailIdInvalid)
						}
					}
				}
				return true
			}),
		check('delete_user_ids.*')
			.trim()
			.custom(async value => {
				if (value != null && value != '') {
					var approvalLevelsCount = await indexService.count('approval_users', { approval_level_id: req.body.approval_level_id }, [], true)
					if (Number(approvalLevelsCount.data) == 1) {
						return Promise.reject(responseMessages.configurations.approvalConfiguration.canNotDeleteUser);
					}
					const approvalUserData = await indexService.find('approval_users', ['id'], { id: value })
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
					var approvalLevelsCount = await indexService.count('approval_levels', { approval_setting_id: req.body.invoice_approval_id }, [], true)
					if (Number(approvalLevelsCount.data) == 1) {
						return Promise.reject(responseMessages.configurations.approvalConfiguration.canNotDeleteLevel);
					}
					const approvalLevelData = await  indexService.find('approval_levels', ['id'], { id: value, deleted_at: null })
					if (!approvalLevelData.status) {
						return Promise.reject(responseMessages.configurations.approvalConfiguration.deleteLevelIdNotExists);
					}
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

		/* Checking Rank Order */
		var rankUniqueCheck = [...new Set(approvalBody.map(rankChecking => rankChecking.rank))].sort();
		if (approvalBody.length == rankUniqueCheck.length) {
			var rankOrder = true;
			var currentRankCheck = 1;
			await rankUniqueCheck.map(order => {
				if (currentRankCheck != order) {
					rankOrder = false;
				}
				currentRankCheck += 1;
			});
		}
		/* Checking Rank Order */

		if (rankOrder) {
			req.body.approval_count = approvalBody.length;
			req.body.is_global = false;
			req.body.approval_module = 2;
			const condition = { id: req.params.id }
			var response = await clientInvoiceServices.update(req.body, condition);
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
		logResponse("info", req, responseData, "Update client invoice configuration Response.");
		/* Log Response */

		/* Return the response */
		responseHandler(res, responseData);
		/* Return the response */

	} else {
		throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
	}
});

/**
 * Getting client invoice configuration index function to retrieve invoice configurations for a client.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful:
 *      ~ Retrieve invoice configurations for the client using the 'index' service function.
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
 *    + Create a condition to retrieve invoice configurations based on the client's ID.
 *    + Call the 'index' service function to retrieve the invoice data.
 *    + If data exists:
 * 		- Prepare the response with success data
 *    + Else:
 * 		- Prepare the response with error message and empty data.
 *    + Log the response.
 *    + Return the response using 'responseHandler()'.
 * - If validation fails:
 *    + Add error validation to the response.
 *
 * Additional Logic:
 * - Check for an optional 'client_id' query parameter.
 *   + If provided, validate it using a UUID pattern.
 *   + If not valid, add an error message to the response.
 *   + If 'request_id' is not defined or empty, add a requirement message to the response.
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
	logRequest('info', req, "Getting client invoice configuration index request");
	/* Log Request */

	/* Default Variable */
	var responseData = '';

	/* Writing validation rules to the input request */
	var validations = [
		check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
		check('id')
			.trim().escape()
			.notEmpty().withMessage(responseMessages.companies.companyIdRequired)
			.isUUID().withMessage(responseMessages.companies.companyIDInvalid)
			.custom(async value => {
				const companyData = await indexService.find('companies', ['id'], { id: value, entity_type: 'client' });
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
		var invoiceData = await clientInvoiceServices.index(condition);
		if (!invoiceData.status) {
			responseData = { statusCode: responseCodes.codeSuccess, message: invoiceData.message, error: invoiceData.error, message: responseMessages.common.noRecordFound, data: [] }
		} else {
			responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: invoiceData.data };
		}

		/* Log Response */
		logResponse('info', req, responseData, "Getting client invoice configuration index Response");
		/* Log Response */

		/* Return the response */
		responseHandler(res, responseData);
		/* Return the response */

	} else {
		throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
	}
});

module.exports = { index, store, update };