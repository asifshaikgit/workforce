const companyCommentsService = require('../../services/companies/companyCommentsService');
const { check, validationResult } = require('express-validator');
const { logRequest, logResponse } = require('../../../../../utils/log');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { responseHandler } = require("../../../../responseHandler");
const { tryCatch } = require("../../../../../utils/tryCatch");
const { pagination } = require("../../../../../config/pagination");
const InvalidRequestError = require("../../../../../error/InvalidRequestError");
const indexService = require('../../services/index');
const { regexPatterns } = require('../../../../../constants/regexPatterns')


/**
 * Store company comment function to add a comment to a company.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful:
 *      ~ Store the comment for the company using the 'store' service function.
 *      ~ Prepare the response with success data.
 *    + Else:
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Extract the 'slug_name' from the URL path and add it to the request.
 * - Set default variables for 'responseData'.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'slug_name' (body), must not be empty and should be one of ['client', 'vendor'].
 *    + 'company_id' (body), must not be empty, should be a valid UUID, and should exist in the 'companies' table.
 *    + 'comment' (body), must not be empty and should be a string.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Store the comment for the company using the 'store' service function.
 *    + Prepare the response with success data.
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
const store = tryCatch(async (req, res) => {
	/* Log Request */
	logRequest('info', req, "Store company comment request.");
	/* Log Request */

	const requestSegments = req.path.split('/');
    const slug = requestSegments[2];
    req.body.slug_name = slug;


	/* Default Variable */
	var responseData = "";
	/* Default Variable */

	/* Writing validation conditions to the input request */
	var validations = [
		check('request_id')
			.trim().escape()
			.notEmpty().withMessage(responseMessages.common.requestIdRequired),
		check('slug_name')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.slugNameRequired)
            .isIn(['client', 'vendor']),
		check('company_id')
            .trim().escape()
            .notEmpty().withMessage(responseMessages.companies.companyIdRequired)
            .isUUID().withMessage(responseMessages.companies.companyIDInvalid)
            .custom(async value => {
                const companyData = await indexService.find('companies', ['id'], { id: value, entity_type: req.body.slug_name});
                if (!companyData.status) {
                    return Promise.reject(responseMessages.companies.companyIdNotExists);
                }
            }),
		check("comment").trim()
			.notEmpty().withMessage(responseMessages.companyComments.commentRequired)
			.isString().withMessage(responseMessages.companyComments.commentInvalid),

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
		const response = await companyCommentsService.store(req.body);
		if(response.status){
			responseData = {statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully}
		} else {
			responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error }
		}
		

		/* Log Response */
		logResponse("info", req, responseData, "Store company comment Response");
		/* Log Response */

		/* Return the response */
		responseHandler(res, responseData);
		/* Return the response */

	} else {
		throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
	}
});


/**
 * Update company comment function to modify a comment for a company.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful:
 *      ~ Update the comment for the company using the 'update' service function.
 *      ~ Prepare the response with success data.
 *    + Else:
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Extract the 'slug_name' from the URL path and add it to the request.
 * - Set default variables for 'responseData'.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'slug_name' (body), must not be empty and should be one of ['client', 'vendor'].
 *    + 'company_id' (body), must not be empty, should be a valid UUID, and should exist in the 'companies' table.
 *    + 'id' (params), must not be empty and should exist in the 'companies_comments' table with.
 *    + 'comment' (body), must not be empty and should be a string.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Update the comment for the company using the 'update' service function.
 *    + Prepare the response with success data.
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
const update = tryCatch(async (req, res) => {
	/* Log Request */
	logRequest('info', req, "Update company comment request.");
	/* Log Request */

	const requestSegments = req.path.split('/');
    const slug = requestSegments[2];
    req.body.slug_name = slug;

	/* Default Variable */
	var responseData = '';
	/* Default Variable */

	/* Writing validation rules to the input request */
	var validations = [
		check("request_id")
			.trim().escape()
			.notEmpty().withMessage(responseMessages.common.requestIdRequired),
		check('slug_name')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.slugNameRequired)
            .isIn(['client', 'vendor']),
		check('company_id')
            .trim().escape()
            .notEmpty().withMessage(responseMessages.companies.companyIdRequired)
            .isUUID().withMessage(responseMessages.companies.companyIDInvalid)
            .custom(async value => {
                const companyData = await indexService.find('companies', ['id'], { id: value, entity_type: req.body.slug_name});
                if (!companyData.status) {
                    return Promise.reject(responseMessages.companies.companyIdNotExists);
                }
            }),
		check('id')
			.trim().escape()
			.notEmpty().withMessage(responseMessages.companyComments.commentsIdRequired)
			.custom(async value => {
				const commentsData = await indexService.find('companies_comments', ['id'], { id: value});
				if (!commentsData.status) {
					return Promise.reject(responseMessages.companyComments.commentIdNotExists);
				}
			}),

		check("comment")
			.trim()
			.notEmpty().withMessage(responseMessages.companyComments.commentRequired)
			.isString().withMessage(responseMessages.companyComments.commentInvalid),
	];
	/* Writing validation rules to the input request */

	/*Run the validation rules. */
	for (var validation of validations) {
		var result = await validation.run(req);
		if (result.errors.length) break;
	}
	var errors = validationResult(req);
	/*Run the validation rules. */


	if (errors.isEmpty()) {
		const condition = {id: req.param.id}
		const response = await companyCommentsService.update(req.body, condition);
		if(response.status){
			responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully }
		} else {
			responseData = { statusCode: responseCodes.codeInternalError, message: response.message, error: response.error }
		}
		

		/* Log Response */
		logResponse("info", req, responseData, "Update company comment Response.");
		/* Log Response */

		/* Return the response */
		responseHandler(res, responseData);
		/* Return the response */

	} else {
		throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
	}
});

/**
 * Index function to retrieve Company comments Details records based on company_id.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Define the condition object for identifying the records to be retrieved.
 *      ~ Call the 'index' service function to retrieve Company comments Details records.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Extract the 'slug_name' from the URL path and add it to the request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'slug_name' (query), must not be empty and should be one of ['client', 'vendor'].
 *    + 'company_id' (query), must not be empty, should be a valid UUID, and should exist in the 'companies' table.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *    + Define the condition object for identifying the records to be retrieved based on the 'company_id' parameter.
 *    + Call the 'companyCommentsService.index' service function to retrieve Company Contact Details records.
 *    + Prepare the response with success data.
 *    + Log the response.
 *    + Return the response using `responseHandler()`.
 * - If validation fails:
 *    + Add error validation to the response.
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
	logRequest('info', req, "Getting company comments index request");
	/* Log Request */

	const requestSegments = req.path.split('/');
    const slug = requestSegments[2];
    req.query.slug_name = slug;

	/* Default Variable */
	var responseData = '';
	/* Default Variable */

	/* Writing validation rules to the input request */
	var validations = [
		check("request_id")
			.trim().escape()
			.notEmpty().withMessage(responseMessages.common.requestIdRequired),
		check('slug_name')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.slugNameRequired)
            .isIn(['client', 'vendor']),
		check('id')
			.trim().escape()
			.notEmpty().withMessage(responseMessages.companyComments.commentRequired)
			.isInt().withMessage(responseMessages.companyComments.commentInvalid)
			.custom(async value => {
				const commentData = await indexService.find('companies_comments', ['id'], { id: value , referrable_type : 1});
				if (!commentData.status) {
					return Promise.reject(responseMessages.companyComments.commentIdNotExists);
				}
			}),
	]
	/*Run the validation rules. */
	for (var validation of validations) {
		var result = await validation.run(req);
		if (result.errors.length) break;
	}
	var errors = validationResult(req);
	/*Run the validation rules. */

	if (errors.isEmpty()) {
		var condition = { id: req.query.id};
		var commentData = await companyCommentsService.index(condition);
		responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: commentData.data }

		/* Log Response */
		logResponse("info", req, responseData, "Getting company comments index Response.");
		/* Log Response */

		/* Return the response */
		responseHandler(res, responseData);
		/* Return the response */

	} else {
		throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity,);
	}
});


/**
 * Listing function to retrieve a list of company comments based on specific criteria.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Retrieve a list of company details based on the provided criteria.
 *      ~ Prepare the response with the retrieved data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Extract the 'slug_name' from the URL path and add it to the request's query parameters.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'slug_name' (query), must not be empty and should be one of ['client', 'vendor'].
 *	  + 'company_id' (query), must not be empty, should be a valid UUID, and should exist in the 'companies' table.
 *    + 'status' (query), if provided, must be either 'true' or 'false' (conditional validation).
 *
 * - Run the validation rules.
 * - If validation is successful:
 *    + Set additional variables for pagination, search, and status based on query parameters.
 * 	  + Create empty condition object
 * 	  + If 'company_id' is provided, add the 'company_id' to condition object. 
 *    + Call the 'companyCommentsService.listing' function and retrieve the company commets details based on condtion.
 *    + If successful:
 *      - Prepare the response with the retrieved data and pagination information.
 *    + If no records are found:
 *      - Prepare the response with a message indicating no records found.
 *    + Log the response.
 *    + Return the response using `responseHandler()`.
 * - If validation fails:
 *    + Add error validation to the response.
 * 
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const listing = tryCatch(async (req, res) => {
	/* Log Request */
	logRequest('info', req, "Getting companies comment listing request");
	/* Log Request */

	const requestSegments = req.path.split('/');
    const slug = requestSegments[2];
    req.body.slug_name = slug;

	/* Default Variable */
	var responseData = '';

	/* Writing validation rules to the input request */
	var validations = [
		check("request_id")
			.trim().escape()
			.notEmpty().withMessage(responseMessages.common.requestIdRequired),
		check('slug_name')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.companies.slugNameRequired)
            .isIn(['client', 'vendor']),
		check('company_id')
			.trim().escape()
			.custom(async value => {
				if(value != '' && value != null) {
					var pattern = regexPatterns.uuidRegex;
					if (!pattern.test(value)) {
						return Promise.reject(responseMessages.companies.companyIDInvalid)
					} 
					return true
				}
			}),
	]
	/*Run the validation rules. */
	for (var validation of validations) {
		var result = await validation.run(req);
		if (result.errors.length) break;
	}
	var errors = validationResult(req);
	/*Run the validation rules. */

	if (errors.isEmpty()) {
		let limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
		let page = (req.query.page) ? (req.query.page) : pagination.page;

		const condition = {}
		if(req.query.company_id != '' && req.query.company_id != null){
			condition = {company_id: req.query.company_id}
		}
		var companyComments = await companyCommentsService.listing(condition, page, limit);
		if (companyComments.status) {
			responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: companyComments.data, pagination: companyComments.pagination_data };
		}else {
			responseData = { statusCode: responseCodes.codeSuccess, message: companyComments.message, error: companyComments.error, message: responseMessages.common.noRecordFound, data: [] }
		}
		
		/* Log Response */
		logResponse('info', req, responseData, "Getting companies comment listing Response");
		/* Log Response */

		/* Return the response */
		responseHandler(res, responseData);
		/* Return the response */

	} else {
		throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity,);
	}
});

module.exports = {index, listing, store, update };