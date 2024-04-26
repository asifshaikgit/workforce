const documentsService = require('../../../services/configurations/workPermit/documentsService');
const indexServices = require('../../../services/index');
const { check, validationResult } = require('express-validator');
const { logRequest, logResponse } = require('../../../../../../utils/log');
const { responseMessages } = require('../../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../../constants/responseCodes');
const { responseHandler } = require('../../../../../responseHandler');
const { tryCatch } = require('../../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../../error/InvalidRequestError');
const { pagination } = require('../../../../../../config/pagination');

/**
 * Store immigration document types in the database.
 * 
 * Overview of API:
 *   - Validate the request.
 *     + If successful
 *       ~ Call the service function to store immigration document types.
 *       ~ Add a success message and response data to the response.
 *     + Else
 *       ~ Add error validation to the response.
 *   - Return the response.
 * 
 * Logic:
 *   - Log incoming request.
 *   - Define the validation rules as follows:
 *     + 'request_id' (body) is mandatory.
 *     + 'name' (body) is mandatory, should not contain special characters, and must be unique.
 *     + 'is_active' (body) is mandatory, should be a boolean value.
 *     + 'referrable_type' (body) is mandatory, should be a valid integer between 1 and 7.
 *   - Run the validation rules.
 *   - If validation is successful:
 *     + Call the service function to store immigration document types.
 *     + Add a success message and response data to the response.
 *   - If validation fails:
 *     + Add error validation to the response.
 *   - Prepare the response with status codes.
 *   - Log the response.
 *   - Return the response using responseHandler().
 * 
 * Notes:
 *   - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const store = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, "Store immigration documents Types request.");
  /* Log Request */

  /* Default Variable */
  let responseData = "";
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
      .withMessage(responseMessages.immigrationDocTypes.nameIsRequired)
      .matches(/^[a-zA-Z0-9-\s]+$/)
      .withMessage(responseMessages.immigrationDocTypes.invalidName)
      .custom(async (value) => {
        const typeCasesData = await indexServices.find(
          'immigration_document_types',
          ['id'],
          { name: value }
        )
        const status = typeCasesData.status
        if (status) {
          return Promise.reject(
            responseMessages.immigrationDocTypes.nameAlreadyExist
          )
        }        
        return true
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.immigrationDocTypes.statusIsRequired)
      .isBoolean()
      .withMessage(responseMessages.immigrationDocTypes.invalidBoolean),
    // check('description')
    //   .trim()
    //   .notEmpty()
    //   .withMessage(responseMessages.immigrationDocTypes.discriptionRequired),
    check('referrable_type')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.immigrationDocTypes.typeIsRequired)
      .isInt({ min: 1, max: 7 })
      .withMessage(responseMessages.immigrationDocTypes.invalidType)
  ];

  /* Writing validation conditions to the input request */

  /*Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req);
    if (result.errors.length) break;
  }
  const errors = validationResult(req);
  /*Run the validation rules. */

  if (errors.isEmpty()) {
    const response = await documentsService.store(req.body)
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully, data: response.data };

    /* Log Response */
    logResponse("info", req, responseData, "Stores immigration documents Types Response.");
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Update immigration document types in the database.
 * 
 * Overview of API:
 *   - Validate the request.
 *     + If successful
 *       ~ Call the service function to update immigration document types.
 *       ~ Add a success message to the response.
 *     + Else
 *       ~ Add error validation to the response.
 *   - Return the response.
 * 
 * Logic:
 *   - Log incoming request.
 *   - Define the validation rules as follows:
 *     + 'request_id' (body) is mandatory.
 *     + 'id' (params) is mandatory and should exist in the 'immigration_document_types' table.
 *     + 'name' (body) is mandatory, should not contain special characters, and must be unique (excluding the current document type).
 *     + 'is_active' (body) is mandatory, should be a boolean value.
 *     + 'referrable_type' (body) is mandatory, should be a valid integer between 1 and 7.
 *   - Run the validation rules.
 *   - If validation is successful:
 *     + Call the service function to update immigration document types.
 *     + Add a success message to the response.
 *   - If validation fails:
 *     + Add error validation to the response.
 *   - Prepare the response with status codes.
 *   - Log the response.
 *   - Return the response using responseHandler().
 *        
 * Notes:
 *   - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, "Update immigration documents Types request.");
  /* Log Request */

  /* Default Variable */
  let responseData = "";
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
        if (value != '' && value != null && value != undefined) {
          const typeCasesData = await indexServices.find(
            'immigration_document_types',
            ['id', 'is_editable'],
            { id: value }
          )
          const status = typeCasesData.status
          if (!status) {
            return Promise.reject(
              responseMessages.immigrationDocTypes.idDoesNotExist
            )
          }
          if(!typeCasesData.data[0].is_editable){
            return Promise.reject(responseMessages.immigrationDocTypes.notAllowToModify);
          }
        }
        return true
      }),
    check('name')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.immigrationDocTypes.nameIsRequired)
      .matches(/^[a-zA-Z0-9-\s]+$/)
      .withMessage(responseMessages.immigrationDocTypes.invalidName)
      .custom(async (value) => {
        const typeCasesData = await indexServices.find(
          'immigration_document_types',
          ['id'],
          { name: value }
        )
        const status = typeCasesData.status
        if (status) {
          if (typeCasesData.data[0].id != req.params.id) {
            return Promise.reject(
              responseMessages.immigrationDocTypes.nameAlreadyExist
            )
          }
        }       
        return true
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.immigrationDocTypes.statusIsRequired)
      .isBoolean()
      .withMessage(responseMessages.immigrationDocTypes.invalidBoolean),
    // check('description')
    //   .trim()
    //   .notEmpty()
    //   .withMessage(responseMessages.immigrationDocTypes.discriptionRequired),
    check('referrable_type')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.immigrationDocTypes.typeIsRequired)
      .isInt({ min: 1, max: 7 })
      .withMessage(responseMessages.immigrationDocTypes.invalidType)
  ];

  /* Writing validation conditions to the input request */

  /*Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req);
    if (result.errors.length) break;
  }
  const errors = validationResult(req);
  /*Run the validation rules. */

  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    await documentsService.update(req.body, condition)
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };


    /* Log Response */
    logResponse("info", req, responseData, "Updates immigration documents Types Response.");
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Handles the request to get Immigration Document Types details.
 * 
 * Overview of API:
 *  - Validate the request, ensuring the presence of a request ID.
 *    + If successful
 *      ~ Extract optional query parameters such as 'limit', 'page', 'search', 'sort_column', and 'sort_order'.
 *      ~ Call the service function to fetch a list of Immigration Document Types with optional search, sorting, and pagination.
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
 *    + Call the 'listing' function from the 'documentsService' service to fetch the list of Immigration Document Types.
 *    + If data exists:
 *      ~ Prepare a response with the status true, fetched data, including optional pagination details.
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
  logRequest('info', req, 'Getting immigration documents Types Details request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  const requestId = req.query.request_id;
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    /* Default variable */
    const limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
    const page = (req.query.page) ? (req.query.page) : pagination.page;
    const search = req.query.search ? req.query.search : '';
    const sort_column = req.query.sort_column ? req.query.sort_column : '';
    const sort_order = req.query.sort_order === 'A' ? 'asc' : req.query.sort_order === 'D' ? 'desc' : '';
    /* Default variable */

    /* Writing validation rules to the input request */
    const condition = { search };
    const documentTypesData = await documentsService.listing(condition, page, limit, sort_column, sort_order);
    if (!documentTypesData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, error: documentTypesData.error, message: responseMessages.common.noRecordFound, data: [], pagination: documentTypesData.pagination_data };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: documentTypesData.data, pagination: documentTypesData.pagination_data };
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Getting immigration documents Types Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Handles the dropdown request by retrieving details based on the provided request ID.
 * 
 * Overview of API:
 *  - Validate the request by checking the presence of a request ID.
 *    + If successful
 *      ~ Call the service function to retrieve a list of Immigration Document Types based on the search criteria.
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
 *    + Check for additional query parameters, such as 'exclude_id' and 'referrable_type'.
 *    + If 'referrable_type' is not provided or empty:
 *      ~ Set the search query parameter, or use an empty string if not provided.
 *      ~ Call the common 'find' function to retrieve a list of Immigration Document Types from the 'immigration_document_types' table.
 *    + If 'referrable_type' is provided:
 *      ~ Set the 'condition' to filter by 'referrable_type' and 'is_active'.
 *      ~ Call the common 'find' function to retrieve a list of Immigration Document Types based on the 'condition'.
 *    + If data exists:
 *      ~ Prepare a response with the fetched data.
 *    + If data doesn't exist:
 *      ~ Prepare a response with the error message and empty data.
 *    + Logging the response.
 *    + Return the response using responseHandler().
 *  - Else(request ID is missing or empty):
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
  logRequest('info', req, 'Getting documents Types Details request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  const requestId = req.query.request_id;
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    /* Default variable */
    const excludeId = req.query.exclude_id ? req.query.exclude_id : 0;
    /* Default variable */
    if (!req.query.referrable_type || req.query.referrable_type === '') {
      const search = req.query.search ? req.query.search : '';
      const condition = { search, is_active: 1 };
      const documentTypesData = await indexServices.find('immigration_document_types', ['id', 'name as value'], condition, 0);
      if (!documentTypesData.status) {
        responseData = {
          statusCode: responseCodes.codeSuccess,
          message: documentTypesData.message,
          error: documentTypesData.error,
          data: [],
        };
      } else {
        responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: documentTypesData.data };
      }
      /* Writing validation rules to the input request */
    }
    else {
      const condition = { is_active: 1, referrable_type: req.query.referrable_type };
      const documentTypesData = await indexServices.find('immigration_document_types', ['id', 'name'], condition, 0);
      if (!documentTypesData.status) {
        responseData = {
          statusCode: responseCodes.codeSuccess,
          message: documentTypesData.message,
          error: documentTypesData.error,
          data: [],
        };
      }
      else {
        responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: documentTypesData.data };
      }
    }



    /* Log Response */
    logResponse('info', req, responseData, 'Getting cycle Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Updates the status of an Immigration Document Types based on the request body.
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
 *   + `id` (Request Params) is mandatory, should be an integer, and must exist in the 'immigration_document_types' table.
 *   + `is_active` (Request body) is mandatory, should be a boolean value.
 * - Run the validation rules.
 *   + If validation is successful:
 *     ~ Create a condition based on the provided 'id' (request params).
 *     ~ Call the service function (e.g., `documentsService.updateStatus`) to update the status.
 *   + Else:
 *     ~ Add error validation to the response.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 *        
 * Notes:
 * - Exception handling using try-catch.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {JSON} - JSON response containing status and message.
 * @throws {InvalidRequestError} - If there are validation errors in the request body.
 */
const updateStatus = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update documents Types status request.');
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
      .withMessage(responseMessages.immigrationDocTypes.idRequired)
      .custom(async (value) => {
        const documentTypes = await indexServices.find('immigration_document_types', ['id', 'is_editable'], { id: value });
        const documentTypesData = documentTypes.status;
        if (!documentTypesData) {
          return Promise.reject(responseMessages.immigrationDocTypes.idDoesNotExist);
        }
        if(!documentTypesData.data[0].is_editable){
          return Promise.reject(responseMessages.immigrationDocTypes.notAllowToModify);
        }
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.immigrationDocTypes.statusIsRequired)
      .isBoolean()
      .withMessage(responseMessages.immigrationDocTypes.invalidBoolean)
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
   *        - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    await documentsService.updateStatus(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'Update Visa Document Types Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Destroys a document type record based on the request parameters.
 * 
 * Overview of API:
 *  - Validate the request, ensuring the presence of a request ID and a valid 'id'.
 *    + If successful
 *      ~ Call the service function to delete an Immigration Document Type entry by ID.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Define the validation rules as follows:
 *    + 'request_id' is mandatory.
 *    + 'id' is mandatory, should be an integer, and must exist in the 'immigration_document_types' table.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the 'destroy' function from the 'documentsService' service to delete the Immigration Document Type entry.
 *    + Prepare a response with a success status and message.
 *    + Log the response.
 *    + Return the response using 'responseHandler'.
 *  - Else(validation fails):
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
  logRequest('info', req, "delete documents types request");
  /* Log Request */

  /* Default Variable */
  var responseData = '';
  /* Default Variable */

  /* Writing validation rules to the input request */
  var validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.immigrationDocTypes.idRequired)
      .custom(async (value) => {
        const documentTypes = await indexServices.find('immigration_document_types', ['id'], { id: value });
        const documentTypesData = documentTypes.status;
        if (!documentTypesData) {
          return Promise.reject(responseMessages.immigrationDocTypes.idDoesNotExist);
        }
      }),
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
   * + Delete  vendors in the collection.  
   * If Validation Fails
   * + Return the error message.
  */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    await documentsService.destroy(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.deletedSuccessfully }

    /* Log Response */
    logResponse('info', req, responseData, "vendors Delete Response");
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */

  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = { store, update, listing, dropdown, updateStatus, destroy };