const typesService = require('../../../services/configurations/workPermit/typesService')
const indexServices = require('../../../services/index')
const { check, validationResult } = require('express-validator')
const { logRequest, logResponse } = require('../../../../../../utils/log')
const {
  responseMessages
} = require('../../../../../../constants/responseMessage')
const { responseCodes } = require('../../../../../../constants/responseCodes')
const { responseHandler } = require('../../../../../responseHandler')
const { tryCatch } = require('../../../../../../utils/tryCatch')
const InvalidRequestError = require('../../../../../../error/InvalidRequestError')
const { pagination } = require('../../../../../../config/pagination');

/**
 * Store Immigration Case Types
 *
 * Overview:
 * This function validates a request to store or update immigration case types.
 * If the validation succeeds:
 *   - Logs the request.
 *   - Calls the typesService.store function to create or update the case types.
 *   - Adds a success message to the response.
 * If the validation fails:
 *   - Adds error details to the response.
 * Returns the response.
 *
 * Logic:
 * - Logs the incoming request.
 * - Defines the validation rules for the input request as follows:
 *   - 'request_id' (body) is mandatory.
 *   - 'name' (body) is mandatory and should consist of letters, numbers, and spaces.
 *     - Checks if the name already exists in the 'immigration_case_types' table.
 *   - 'is_active' (body) is mandatory and should be a boolean value.
 *   - 'description' (body) is mandatory.
 * - Runs the validation rules.
 * - If validation is successful:
 *   - Calls the typesService.store function to create or update immigration case types.
 *   - Adds a success message to the response.
 * - Else:
 *   - Adds error details to the response.
 * - Prepares the response with appropriate status codes.
 * - Logs the response.
 * - Returns the response using responseHandler().
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
  logRequest('info', req, 'Store immigration Case Types request.')
  /* Log Request */

  /* Default Variable */
  let responseData = ''
  /* Default Variable */

  /* Writing validation conditions to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('name')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.immigrationCaseTypes.nameIsRequired)
      .matches(/^[a-zA-Z0-9\s]+$/)
      .withMessage(responseMessages.immigrationCaseTypes.invalidName)
      .custom(async (value) => {
          const typeCasesData = await indexServices.find('immigration_case_types', ['id'],{ name: value })
          const status = typeCasesData.status
          if (status) {
            return Promise.reject(
              responseMessages.immigrationCaseTypes.nameAlreadyExist
            )
          } else {
            return true
          }
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.immigrationCaseTypes.statusIsRequired)
      .isBoolean()
      .withMessage(responseMessages.immigrationCaseTypes.invalidBoolean),
    check('description')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.immigrationCaseTypes.discriptionRequired)
  ]

  /* Writing validation conditions to the input request */

  /*Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req)
    if (result.errors.length) break
  }
  const errors = validationResult(req)
  /*Run the validation rules. */

  if (errors.isEmpty()) {
    const response =  await typesService.store(req.body)
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully, data: response.data };

    /* Log Response */
    logResponse(
      'info',
      req,
      responseData,
      'Stores immigration Case Types Response.'
    )
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    )
  }
})

/**
 * Update Immigration Case Types
 *
 * Overview:
 * This function validates a request to update immigration case types.
 * If the validation succeeds:
 *   - Logs the request.
 *   - Calls the typesService.update function to update the case types.
 *   - Adds a success message to the response.
 * Else:
 *   - Adds error details to the response.
 * Returns the response.
 *
 * Logic:
 * - Logs the incoming request.
 * - Defines the validation rules for the input request as follows:
 *   - 'request_id' (body) is mandatory.
 *   - 'id' (params) is mandatory and should exist in the 'immigration_case_types' table.
 *     + Checks if the ID exists, and if not, rejects the request.
 *   - 'name' (body) is mandatory and should consist of letters, numbers, and spaces.
 *     - Checks if the name already exists in 'immigration_case_types' but allows updates with the same name.
 *   - 'is_active' (body) is mandatory and should be a boolean value.
 *   - 'description' (body) is mandatory.
 * - Runs the validation rules.
 * - If validation is successful:
 *   - Calls the typesService.update function to update immigration case types.
 *   - Adds a success message to the response.
 * - If validation fails:
 *   - Adds error details to the response.
 * - Prepares the response with appropriate status codes.
 * - Logs the response.
 * - Returns the response using responseHandler().
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
  logRequest('info', req, 'Update immigration Case Types request.')
  /* Log Request */

  /* Default Variable */
  let responseData = ''
  /* Default Variable */

  /* Writing validation conditions to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('id')
      .trim()
      .escape()
      .custom(async (value) => {
        const typeCasesData = await indexServices.find('immigration_case_types', ['id'], { id: value })
        const status = typeCasesData.status
        if (!status) {
          return Promise.reject(
            responseMessages.immigrationCaseTypes.idDoesNotExist
          )
        }          
        return true
      }),
    check('name')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.immigrationCaseTypes.nameIsRequired)
      .matches(/^[a-zA-Z0-9\s]+$/)
      .withMessage(responseMessages.immigrationCaseTypes.invalidName)
      .custom(async (value) => {
        const typeCasesData = await indexServices.find('immigration_case_types', ['id'],{ name: value })
        const status = typeCasesData.status
        if (status) {
          if (typeCasesData.data[0].id != req.params.id) {
            return Promise.reject(responseMessages.immigrationCaseTypes.nameAlreadyExist)
          }
        }     
        return true
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.immigrationCaseTypes.statusIsRequired)
      .isBoolean()
      .withMessage(responseMessages.immigrationCaseTypes.invalidBoolean),
    check('description')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.immigrationCaseTypes.discriptionRequired)
  ]

  /* Writing validation conditions to the input request */

  /*Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req)
    if (result.errors.length) break
  }
  const errors = validationResult(req)
  /*Run the validation rules. */

  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    await typesService.update(req.body, condition)
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };

    /* Log Response */
    logResponse(
      'info',
      req,
      responseData,
      'Updates immigration Case Types Response.'
    )
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    )
  }
})

/**
 * Updates the status of a Immigration case Types based on the request body.
 * 
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Call the service function to update the entity status.
 *     ~ Add a success message to the response.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Define the validation rules as follows:
 *   + `request_id` (Request body) is mandatory.
 *   + `id` (Request Params) is mandatory, should be an integer, and must exist in the 'immigration_case_types' table.
 *   + `is_active` (Request body) is mandatory, should be a boolean value.
 * - Run the validation rules.
 *   + If validation is successful:
 *     ~ Create a condition based on the provided 'id' (request params).
 *     ~ Call the service function (e.g., `typesService.updateStatus`) to update the status.
 *   + Else:
 *     ~ Add error validation to the response.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 *        
 * Notes:
 * - Exception handling using try-catch.
 *  
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {JSON} Json
 * @throws {InvalidRequestError} If there are validation errors in the request body.
 */
const updateStatus = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update case Types status request.')
  /* Log Request */

  /* Default variable */
  let responseData = []
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
      .withMessage(responseMessages.immigrationCaseTypes.idRequired)
      .custom(async (value) => {
        const typeCases = await indexServices.find(
          'immigration_case_types',
          ['id'],
          { id: value }
        )
        const typeCasesData = typeCases.status
        if (!typeCasesData) {
          return Promise.reject(
            responseMessages.immigrationCaseTypes.idDoesNotExist
          )
        }
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.immigrationCaseTypes.statusIsRequired)
      .isBoolean()
      .withMessage(responseMessages.immigrationCaseTypes.invalidBoolean)
  ]
  /* Writing validation rules to the input request */

  /* Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req)
    if (result.errors.length) break
  }
  const errors = validationResult(req)
  /* Run the validation rules. */

  /**
   * If validation is success
   *    + call the update service function
   *        - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    await typesService.updateStatus(req.body, condition)
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully
    }

    /* Log Response */
    logResponse(
      'info',
      req,
      responseData,
      'Update Immigration case Types Response.'
    )
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    )
  }
})

/**
 * Handles the request to get Immigration case Types details.
 * 
 * Overview of API:
 *  - Validate the request, ensuring the presence of a request ID.
 *    + If successful
 *      ~ Extract optional query parameters such as 'limit', 'page', 'search', 'sort_column', and 'sort_order'.
 *      ~ Call the service function to fetch a list of Immigration Case Types with optional search, sorting, and pagination.
 *      ~ Prepare the response with the fetched data and optional pagination details.
 *    + Else
 *      ~ Add an error message to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set default variables for the response data, including 'limit', 'page', 'search', 'sort_column', and 'sort_order'.
 *  - Check the presence of 'request_id' and assign it to 'requestId'.
 *  - If 'requestId' is provided and not empty:
 *    + Extract optional query parameters: 'limit', 'page', 'search', 'sort_column', and 'sort_order'.
 *    + Call the 'listing' function from the 'typesService' service to fetch the list of Immigration Case Types.
 *    + If data exists:
 *      ~ Prepare a response with the fetched data, including optional pagination details.
 *    + If data doesn't exist, 
 *      ~ Add an error message to the response.
 *    + Log the response.
 *    + Return the response using 'responseHandler'.
 *  - If 'requestId' is missing or empty, 
 *     + Throw an 'InvalidRequestError' with a message indicating the 'requestId' is required.
 * Notes:
 * - Exception handling using try-catch.
 * 
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If the 'requestId' is missing or empty.
 */
const listing = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting Immigration case Types Details request')
  /* Log Request */

  /* Default variable */
  let responseData = []
  const requestId = req.query.request_id
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    /* Default variable */
    const limit = req.query.limit ? req.query.limit : pagination.limit
    const page = req.query.page ? req.query.page : pagination.page
    const search = req.query.search ? req.query.search : ''
    const sort_column = req.query.sort_column ? req.query.sort_column : ''
    const sort_order = req.query.sort_order === 'A' ? 'asc' : req.query.sort_order === 'D' ? 'desc' : ''
    /* Default variable */

    /* Writing validation rules to the input request */
    const condition = { search }
    const caseTypesData = await typesService.listing( condition, page, limit, sort_column, sort_order)
    if (!caseTypesData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        error: caseTypesData.error,
        message: responseMessages.common.noRecordFound,
        data: [],
        pagination: caseTypesData.pagination_data
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: caseTypesData.data,
        pagination: caseTypesData.pagination_data
      }
    }

    /* Log Response */
    logResponse(
      'info',
      req,
      responseData,
      'Getting Immigration case Types Details Response'
    )
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired)
  }
})

/**
 * Handles the dropdown request by retrieving details based on the provided request ID.
 * 
 * Overview of API:
 *  - Validate the request by checking the presence of a request ID.
 *    + If successful
 *      ~ Call the service function to retrieve a list of Immigration Case Types based on the search criteria.
 *      ~ Prepare the response with the fetched data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set a default variable for the response data.
 *  - Check if a request ID is provided and not empty.
 *  - If a request ID is present:
 *    + Check for a search query parameter
 *       ~ If not provided, use an empty string.
 *    + Call the common 'find' function to retrieve a list of Immigration Case Types from the 'immigration_case_types' table.
 *    + If data exists:
 *       ~ Prepare a response with the fetched data.
 *    + If data doesn't exist:
 *       ~ Prepare a response with the error message and empty data.
 *    + Logging the response.
 *    + Return the response using responseHandler().
 *  - If a request ID is missing or empty:
 *    - Throw an 'InvalidRequestError' with an appropriate message.
 * Notes:
 * - Exception handling using try-catch.
 * 
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there is no request ID provided in the request.
 */
const dropdown = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting case Types Details request.')
  /* Log Request */

  /* Default variable */
  let responseData = []
  const requestId = req.query.request_id
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    const search = req.query.search ? req.query.search : '';
    const condition = {search, is_active: 1 }
    const caseTypesData = await indexServices.find(
      'immigration_case_types',
      ['id', 'name as value'],
      condition,
      0
    )
    if (!caseTypesData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: caseTypesData.message,
        error: caseTypesData.error,
        data: []
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: caseTypesData.data
      }
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse(
      'info',
      req,
      responseData,
      'Getting Immigration case Types Details Response'
    )
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired)
  }
})

/**
 * Destroys a vendor record based on the request parameters.
 * 
 * Overview of API:
 *  - Validate the request, ensuring the presence of a request ID and a valid 'id'.
 *    + If successful
 *      ~ Call the service function to delete an Immigration Case Type entry by ID.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Define the validation rules as follows:
 *    + 'request_id' is mandatory.
 *    + 'id' is mandatory, should be an integer, and must exist in the 'immigration_case_types' table.
 *       ~ Check if the Immigration Case Type exists.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the 'destroy' function from the 'typesService' service to delete the Immigration Case Type entry.
 *    + Prepare a response with a success status and message.
 *    + Log the response.
 *    + Return the response using 'responseHandler'.
 *  - If validation fails:
 *    + Return an error message with 'InvalidRequestError()'.
 * Notes:
 * - Exception handling using try-catch.
 * 
 * @param {Object} req - The HTTP request object containing request parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there are validation errors in the request or if the request ID is missing.
 */
const destroy = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'delete case types request')
  /* Log Request */

  /* Default Variable */
  var responseData = ''
  /* Default Variable */

  /* Writing validation rules to the input request */
  var validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.immigrationCaseTypes.idRequired)
      .custom(async (value) => {
        const typeCases = await indexServices.find(
          'immigration_case_types',
          ['id'],
          { id: value }
        )
        const typeCasesData = typeCases.status
        if (!typeCasesData) {
          return Promise.reject(
            responseMessages.immigrationCaseTypes.idDoesNotExist
          )
        }
      })
  ]
  /* Writing validation conditions to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  /**
   * If validation is success
   * + Delete  vendors in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    await typesService.destroy(req.body, condition)
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.deletedSuccessfully
    }

    /* Log Response */
    logResponse(
      'info',
      req,
      responseData,
      'Immigration case Types Delete Response'
    )
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    )
  }
})

module.exports = { store, update, listing, dropdown, updateStatus, destroy }
