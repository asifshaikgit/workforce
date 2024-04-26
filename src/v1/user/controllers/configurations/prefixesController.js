const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { logRequest, logResponse } = require('../../../../../utils/log');
const prefixesService = require('../../services/configurations/prefixesServices');
const indexServices = require('../../services/index');
const { responseHandler } = require('../../../../responseHandler');
const { tryCatch } = require('../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const { check, validationResult } = require('express-validator');

/**
 * Prefixes index request to fetch prefix data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'prefixes' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + search(query) is not mandatory, it should be a string.
 * 
 *  - Run the validation rules
 *    + If validation success
 *     ~ Define condition object to fetch the prefix information.
 *     ~ Call the common service function(find) to fetch the data and send the condition(defined above).
 *        # Add the service function(index) return data to response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Logging the response
 *  - Return response using responseHandler()  
 *        
 * Notes :
 *    - Handling expection using try catch
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} Json
 * @throws {InvalidRequestError} If the request ID is missing or empty.
 */
const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting prefixes index Details request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  const requestId = req.query.request_id;
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    /* Default variable */
    const search = req.query.search ? req.query.search : '';
    /* Default variable */

    /* Writing validation rules to the input request */
    const condition = { name: search };
    const prefixesData = await indexServices.find('prefixes', ['id', 'name as module', 'slug', 'prefix_name', 'separator', 'number'], condition);
    if (!prefixesData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: prefixesData.message,
        error: prefixesData.error,
        data: [],
      };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: prefixesData.data };
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse('info', req, responseData, 'Getting prefixes index Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Prefixes update request to update prefix data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ update the details in 'prefixes' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *  + prefixes array where it contains objects of id, prefix_name, separator and number
 *     - id(params) is mandatory, it should be a integer and checked for its existence in 'prefixes' table.
 *     - prefix_name(body) is mandatory.
 *     - separator(body) is mandatory.
 *     - number(body) is mandatory.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Call the service function(update) to update the data and send request body.
 *        # Add the service function(update) return data to response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Logging the response
 *  - Return response using responseHandler()  
 *        
 * Notes :
 *    - Handling expection using try catch
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} Json
 * @throws {InvalidRequestError} If there are validation errors or if the update fails.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'prefixes update request');
  /* Log Request */

  /* variables */
  let responseData = [];
  /* variables */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('prefixes').notEmpty().withMessage(responseMessages.client.invalidReferencesObject),
    check('prefixes.*.id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.prefixes.prefixesIdRequired)
      .custom(async (value) => {
        const prefixes = await indexServices.find('prefixes', ['id'], { id: value })
        if (!prefixes.status) {
          return Promise.reject(responseMessages.prefixes.prefixesIdNotFound)
        }
      }),
    check('prefixes.*.prefix_name')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.prefixes.prefixesPrefixNameRequired),
    check('prefixes.*.separator')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.prefixes.prefixesSeparatorRequired),
    check('prefixes.*.number')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.prefixes.prefixesNumberRequired),
  ];
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
   *    + call the update service function
   *     - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    const permissions = await prefixesService.update(req.body);
    if (permissions.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.updatedSuccessfully,
      };
    } else {
      throw new InvalidRequestError(permissions.error, responseCodes.codeUnprocessableEntity);
    }
    /* Log Response */
    logResponse('info', req, responseData, 'prefixes update response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Prefixes getPrefix request to fetch prefix data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'prefixes' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + slug(query) is mandatory, it should be a string and should be available in 'prefixes' table.
 *   
 *  - Run the validation rules
 *    + If validation success
 *     ~ Define slug object to fetch the prefix information.
 *     ~ Call the service function(getPrefix) to fetch the data and send the slug(defined above).
 *        # Add the service function(getPrefix) return data to response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Logging the response
 *  - Return response using responseHandler()  
 *        
 * Notes :
 *    - Handling expection using try catch
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {JSON} Json
 * @throws {InvalidRequestError} If the request parameters are invalid or missing.
 */
const getPrefix = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting prefixes Details request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('slug').trim().escape().toLowerCase().notEmpty().withMessage(responseMessages.employee.behalfOnboarding.slugRequired)
      .matches(/^[a-zA-Z- ]*$/).withMessage(responseMessages.employee.behalfOnboarding.slugNameInvalid)
      .custom(async (value) => {
        const slug = await indexServices.find('prefixes', ['id'], { slug: value });
        if (!slug.status) {
          return Promise.reject(responseMessages.prefixes.prefixesNotFound);
        }
      }),
  ];
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
   *
   *  Based on the status in create function response, segregate the response and prepare the response
   *
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    const slug = req.query.slug;
    const fetchData = await prefixesService.getPrefix({ slug });
    if (fetchData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: fetchData.data };
    } else {
      throw new InvalidRequestError(responseMessages.common.failedToFetch, responseCodes.codeUnprocessableEntity);
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Getting prefixes Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

module.exports = { index, update, getPrefix };
