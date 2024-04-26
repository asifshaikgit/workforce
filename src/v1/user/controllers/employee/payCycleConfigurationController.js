const payCycleConfigurationService = require('../../services/employee/payCycleConfigurationService');
const { check, validationResult } = require('express-validator');
const { logRequest, logResponse } = require('../../../../../utils/log');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { responseHandler } = require("../../../../responseHandler");
const { tryCatch } = require("../../../../../utils/tryCatch");
const InvalidRequestError = require("../../../../../error/InvalidRequestError");
const indexService = require('../../services/index');
const { regexPatterns } = require('../../../../../constants/regexPatterns')


/**
 * Validate and process the creation of a new pay cycle configuration.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Check if the employee exists and is active.
 *      ~ Check if there's no existing pay type configuration for the employee.
 *      ~ Perform additional validations for various fields.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * Logic:
 * Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *    + 'is_default' (body), must not be empty and should be a boolean value.
 *    + 'pay_value' (body), if provided, should be a numeric value.
 *    + 'payroll_pay' (body), if provided, should be a numeric value.
 *    + 'pay_type' (body), must not be empty and should be either 1 or 2.
 *    + 'pay_rate_configurations' (body), an array of objects with the following rules:
 *      ~ 'from_hour', if provided, should be an integer.
 *      ~ 'to_hour', if provided, should be a numeric value.
 *      ~ 'value', if provided, should be a numeric value.
 *      ~ 'pay_in', if provided, should be either 1 or 2.
 *
 * Prepare the response with success data if all validations pass.
 * 
 * Stores the request data and performs some validation checks.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns None
 */
const store = tryCatch(
	async (req, res) => {

		/* Log Request */
		logRequest('info', req, "New Approval Configuration request");
		/* Log Request */

		/* Default Variable */
		var responseData = '';
		/* Default Variable */

		/* Writing validation rules to the input request */
		var validations = [
			check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
			check('employee_id').trim().escape().notEmpty().withMessage(responseMessages.configurations.payCycleConfiguration.employeeIdRequired)
			.isUUID().withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
				.custom(async value => {
					const userData = await indexService.find('employee', ['id', 'balance_amount', 'display_name', 'reference_id'], { id: value, status: 'Active', deleted_at: null });
					if (!userData.status) {
						return Promise.reject(responseMessages.configurations.payCycleConfiguration.IdNotExists);
					}
					req.body.employee_name = userData.data[0].display_name;
					req.body.employee_reference_id = userData.data[0].reference_id;
				})
				.custom(async value => {
					const userData = await indexService.find('pay_type_configuration', ['id'], { employee_id: value, deleted_at: null, is_global: true });
					if (userData.status) {
						return Promise.reject(responseMessages.configurations.payCycleConfiguration.IdAlreadyExists);
					}
				}),
			check('pay_value').trim().escape().optional({ nullable: true })
				.custom(value => {
					if (value != '') {
						if (isNaN(value)) {
							return Promise.reject(responseMessages.configurations.payCycleConfiguration.payValueInvalid);
						}
					}
					return true
				}),
			check('payroll_pay').trim().escape().optional({ nullable: true })
				.custom(value => {
					if (value != '') {
						if (isNaN(value)) {
							return Promise.reject(responseMessages.configurations.payCycleConfiguration.payrollPayValueInvalid);
						}
					}
					return true
				}),
			check("pay_type").trim().escape().notEmpty().withMessage(responseMessages.configurations.payCycleConfiguration.payTypeRequired)
			.isIn([1, 2]).withMessage(responseMessages.configurations.payCycleConfiguration.payTypeInvalid), //  1 - Salary and 2 - Hourly
			check('pay_rate_configurations.*.from_hour').trim().optional({ nullable: true })
				.isInt().withMessage(responseMessages.configurations.payCycleConfiguration.fromHourInvalid),
			check('pay_rate_configurations.*.to_hour').trim().escape().optional({ nullable: true })
				.custom(value => {
					if (value != '') {
						if (isNaN(value)) {
							return Promise.reject(responseMessages.configurations.payCycleConfiguration.toHourInvalid);
						}
					}
					return true
				}),
			check('pay_rate_configurations.*.rate').trim().optional({ nullable: true })
				.isNumeric().withMessage(responseMessages.configurations.payCycleConfiguration.valueInvalid),
			check('pay_rate_configurations.*.pay_in').trim().optional({ nullable: true })  // 1- percentage, 2- value
				.isIn([1, 2]).withMessage(responseMessages.configurations.payCycleConfiguration.payInInvalid)
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
		 * + Delete  self service types in the collection.  
		 * If Validation Fails
		 * + Return the error message.
		*/
		if (errors.isEmpty()) {
			let payRateConfigurations = req.body.pay_rate_configurations;
			let pay_type = req.body.pay_type;
			req.body.is_global = true;
			var verify = true;
			/* Checking Rank Order if pay config is hourly pay */
			if (pay_type == 2) {
				if (payRateConfigurations.length > 1) {
					for (let i = 0; i < payRateConfigurations.length; i++) {
						for (let j = i + 1; j < payRateConfigurations.length; j++) {
							var current = payRateConfigurations[i];
							var next = payRateConfigurations[j];

							if (payRateConfigurations[payRateConfigurations.length - 1].to_hour) {
								if (next.from_hour != current.to_hour) {
									verify = false;
								}
							}
							if (payRateConfigurations[0].from_hour == 0) {
								verify = false
							}
						}
					}
				} else {
					var verify = true;
					if (payRateConfigurations[0].from_hour == 0) {
						verify = false
					}
					if (payRateConfigurations[payRateConfigurations.length - 1].to_hour) {
						verify = false;
					}
				}
			}
			/* Checking Rank Order if pay config is hourly pay */

			if (verify) {
				var payCycle = await payCycleConfigurationService.store(req.body);
				if (payCycle.status) {
					responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully }
				} else {
					responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: payCycle.error }
				}
			} else {
				throw new InvalidRequestError(
					responseMessages.configurations.payCycleConfiguration.invalidPayRate,
					responseCodes.codeUnprocessableEntity
				);
			}
			/* Log Response */
			logResponse("info", req, responseData, "Approval Configuration response");
			/* Log Response */

			/* Return the response */
			responseHandler(res, responseData);
			/* Return the response */

		} else {
			throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
		}
});

/**
 * Validate the request for an index operation.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Proceed with the index operation.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *
 * - Prepare the response with success data if all validations pass.
 * - Return the response.
 *
 * Notes:
 * - Exception handling using try-catch is assumed but not explicitly provided here.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {ValidationError} - If there are validation errors in the request.
 **/
const index = tryCatch(
	async (req, res) => {

		/* Log Request */
		logRequest('info', req, "getting single Approval Configuaration request");
		/* Log Request */

		/* Default Variable */
		var responseData = '';
		var request_id = req.query.request_id;
		/* Default Variable */

		if (request_id != undefined && request_id != '') {

			/* Default Variable */
			let employee_id = req.query.id
			/* Default Variable */

			/* Writing validation rules to the input request */
			if (employee_id != undefined && employee_id != '') {
				var pattern = regexPatterns.uuidRegex;
				if (pattern.test(employee_id)) {
					var condition = { 'pay_type_configuration.employee_id': employee_id, 'pay_type_configuration.is_global': true };
					var payCycleData = await payCycleConfigurationService.index(condition);
					if (!payCycleData.status) {
						responseData = { statusCode: responseCodes.codeSuccess, error: payCycleData.error, message: responseMessages.common.noRecordFound, data: [] }
					} else {
						responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: payCycleData.data };
					}
				} else {
					throw new InvalidRequestError(responseMessages.configurations.payCycleConfiguration.invalidEmployeeID)

				}
			} else {
				responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.configurations.payCycleConfiguration.employeeIdRequired }
			}
			/* Writing validation rules to the input request */

			/* Log Response */
			logResponse('info', req, responseData, "Approval Setting index Response");
			/* Log Response */

			/* Return the response */
			responseHandler(res, responseData);
			/* Return the response */

		} else {
			throw new InvalidRequestError(responseMessages.common.requestIdRequired);
		}
});

/**
 * Validate and process the update of an existing pay cycle configuration.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Check if the employee exists and is active.
 *      ~ Check if there's no existing pay type configuration for the employee.
 *      ~ Perform additional validations for various fields.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * Logic:
 * Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'id' (body), must not be empty and should be a integer value , and should exist in the 'pay_type_configuration' table.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *    + 'is_default' (body), must not be empty and should be a boolean value.
 *    + 'pay_value' (body), if provided, should be a numeric value.
 *    + 'payroll_pay' (body), if provided, should be a numeric value.
 *    + 'pay_type' (body), must not be empty and should be either 1 or 2.
 *    + 'pay_rate_configurations' (body), an array of objects with the following rules:
 *      ~ 'from_hour', if provided, should be an integer.
 *      ~ 'to_hour', if provided, should be a numeric value.
 *      ~ 'value', if provided, should be a numeric value.
 *      ~ 'pay_in', if provided, should be either 1 or 2.
 *
 * Prepare the response with success data if all validations pass.
 * validate the update request 
 * If request validation success call services function.
 *
 * @param {object} req
 * @param {object} res
 * @return Json
 * @throws InvalidRequestError
 */
const update = tryCatch(
	async (req, res) => {

		/* Log Request */
		logRequest('info', req, "update approval Configuration request.");
		/* Log Request */

		/* Default Variable */
		var responseData = '';
		/* Default Variable */

		/* Writing validation rules to the input request */
		var validations = [
			check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
			check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.payCycleConfiguration.IdRequired)
				.isInt().withMessage(responseMessages.configurations.payCycleConfiguration.IdInvalid)
				.custom(async value => {
					const payCycleData = await indexService.find('pay_type_configuration', ['id'], { id: value });
					if (!payCycleData.status) {
						return Promise.reject(responseMessages.configurations.payCycleConfiguration.payCycleIdNotExists);
					}
				}),
			check('employee_id').trim().escape().notEmpty().withMessage(responseMessages.configurations.payCycleConfiguration.employeeIdRequired)
				.isUUID().withMessage(responseMessages.configurations.payCycleConfiguration.invalidEmployeeID)
				.custom(async value => {
					const userData = await indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: value, status: 'Active', deleted_at: null });
					if (!userData.status) {
						return Promise.reject(responseMessages.configurations.payCycleConfiguration.IdNotExists);
					}
					req.body.employee_name = userData.data[0].display_name
					req.body.employee_reference_id = userData.data[0].reference_id
				}).custom(async value => {
					const userData = await indexService.find('pay_type_configuration', ['id'], { employee_id: value, id: req.body.id, deleted_at: null });
					if (!userData.status) {
						return Promise.reject(responseMessages.configurations.payCycleConfiguration.invalidEmployeeID);
					}
				}),
			check('pay_value').trim().escape().optional({ nullable: true })
				.custom(value => {
					if (value != '') {
						if (isNaN(value)) {
							return Promise.reject(responseMessages.configurations.payCycleConfiguration.payValueInvalid);
						}
					}
					return true
				}),
			check('payroll_pay').trim().escape().optional({ nullable: true })
				.custom(value => {
					if (value != '') {
						if (isNaN(value)) {
							return Promise.reject(responseMessages.configurations.payCycleConfiguration.payrollPayValueInvalid);
						}
					}
					return true
				}),
			check("pay_type").trim().escape().notEmpty().withMessage(responseMessages.configurations.payCycleConfiguration.payTypeRequired)
				.isIn([1, 2]).withMessage(responseMessages.configurations.payCycleConfiguration.payTypeInvalid),
			check('pay_rate_configurations.*.from_hour').trim().optional({ nullable: true })
				.isInt().withMessage(responseMessages.configurations.payCycleConfiguration.fromHourInvalid),
			check('pay_rate_configurations.*.to_hour').trim().escape().optional({ nullable: true })
				.custom(value => {
					if (value != '') {
						if (isNaN(value)) {
							return Promise.reject(responseMessages.configurations.payCycleConfiguration.toHourInvalid);
						}
					}
					return true
				}),
			check('pay_rate_configurations.*.rate').trim().optional({ nullable: true })
				.isNumeric().withMessage(responseMessages.configurations.payCycleConfiguration.valueInvalid),
			check('pay_rate_configurations.*.pay_in').trim().optional({ nullable: true })
				.isIn([1, 2]).withMessage(responseMessages.configurations.payCycleConfiguration.payInInvalid)
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
			let payRateConfigurations = req.body.pay_rate_configurations;
			let pay_type = req.body.pay_type;
			req.body.is_global = true;
			var verify = true;
			/* Checking Rank Order if pay config is hourly pay */
			if (pay_type == 2) {
				if (payRateConfigurations.length > 1) {
					for (let i = 0; i < payRateConfigurations.length; i++) {
						for (let j = i + 1; j < payRateConfigurations.length; j++) {
							var current = payRateConfigurations[i];
							var next = payRateConfigurations[j];

							if (payRateConfigurations[payRateConfigurations.length - 1].to_hour) {
								if (next.from_hour != current.to_hour) {
									verify = false;
								}
							}
							if (payRateConfigurations[0].from_hour == 0) {
								verify = false;
							}
						}
					}
				} else {
					var verify = true;
					if (payRateConfigurations[0].from_hour == 0) {
						verify = false;
					}
					if (payRateConfigurations[payRateConfigurations.length - 1].to_hour) {
						verify = false;
					}
				}
			}
			/* Checking Rank Order */

			if (verify) {
				const condition = {id: req.params.id}
				var payCycle = await payCycleConfigurationService.update(req.body, condition);
				if (payCycle.status) {
					responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully }
				} else {
					responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: payCycle.error }
				}

			} else {
				throw new InvalidRequestError(
					responseMessages.configurations.payCycleConfiguration.invalidPayRate,
					responseCodes.codeUnprocessableEntity
				);
			}
			/* Log Response */
			logResponse("info", req, responseData, "Approval Configuration Update response");
			/* Log Response */

			/* Return the response */
			responseHandler(res, responseData);
			/* Return the response */

		} else {
			throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
		}
});

module.exports = { index, store, update };