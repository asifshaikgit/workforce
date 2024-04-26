const expenseAndServiceTypesService = require('../../services/configurations/expenseAndServiceTypesService');
const indexServices = require('../../services/index');
const { check, validationResult } = require('express-validator');
const { logRequest, logResponse } = require('../../../../../utils/log');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { responseHandler } = require('../../../../responseHandler');
const { tryCatch } = require('../../../../../utils/tryCatch');
const { pagination } = require('../../../../../config/pagination');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const { regexPatterns } = require('../../../../../constants/regexPatterns')

/**
 * Handles the creation of expense and service types based on the received request.
 * - Logs the incoming request for creating expense and service types.
 * - Initializes a default variable for the response data.
 * - Extracts the `entity_type` from the request path and sets it in the request body.
 * - Sets the `referrable_type` based on the `entity_type`.
 * - Validates the incoming request for the necessary fields.
 * - If validation passes, invokes the store function from the expenseAndServiceTypesService.
 *    - Based on the status in the store function response, prepares the response accordingly:
 *       - If successful, constructs a success response indicating the types were added successfully.
 *       - If unsuccessful, constructs an error response with a message and potential error details.
 * - Logs the generated response.
 * - Returns the response to the client.
 *
 * @param {Object} req - Express request object containing details for creating expense and service types.
 * @param {Object} res - Express response object to send the response back.
 */
const store = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'create expense & service types request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  // Get the `entity_type` from `req.path`.
  const requestSegments = req.path.split('/');
  req.body.entity_type = requestSegments[2];
  const referrable_type = requestSegments[2] === 'employee-self-service-types' ? 1 : 2;

  /* Writing validation conditions to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('entity_type')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.actionNotifications.slugNameRequired)
      .isIn(['employee-self-service-types', 'expense-management-types'])
      .withMessage(responseMessages.configurations.actionNotifications.slugNameShouldbe),
    check('name').trim().escape().notEmpty().withMessage(responseMessages.configurations.selfServiceTypes.nameRequired)
      .not().matches(regexPatterns.specialCharactersRegex).withMessage(responseMessages.configurations.selfServiceTypes.nameInvalid)
      .custom(async (value) => {
        const selfServiceTypesData = await indexServices.find('expense_and_service_types', ['id'], { name: value, referrable_type : referrable_type });
        const selfServiceTypesStatus = selfServiceTypesData.status;
        if (selfServiceTypesStatus) {
          return Promise.reject(responseMessages.configurations.selfServiceTypes.nameExists);
        }
      }),
    check('assignee_employee_ids.*.employee_id').trim().escape().notEmpty().withMessage(responseMessages.configurations.selfServiceTypes.employeeIdRequired)
      .isUUID().withMessage(responseMessages.configurations.selfServiceTypes.assignEmployeeIdIsInvalid)
      .custom(async (value) => {
        const employeeData = await indexServices.find('employee', ['id'], { id: value });
        const employeeStatus = employeeData.status;
        if (!employeeStatus) {
          return Promise.reject(responseMessages.configurations.selfServiceTypes.employeeIdDoesNotExist);
        }
      }),
      check('is_active')
        .trim()
        .escape()
        .notEmpty().withMessage(responseMessages.configurations.documentTypes.statusRequired)
        .isBoolean()
        .withMessage(responseMessages.configurations.documentTypes.statusInvalid),
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
       *    + call the create service function
       *        - Based on the status in create function response, segregate the response and prepare the response
       * If Validation Fails
       *    + Return the error message.
      */
  if (errors.isEmpty()) {
     const respondeDetails = await expenseAndServiceTypesService.store(req.body);
    if (respondeDetails.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully };
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: expenseAndServiceTypesService.message,
        data: []
    }
    }

    /* Log Response */
    logResponse('info', req, responseData, 'expense & service types Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Handles the update of expense and service types based on the received request.
 * - Logs the incoming request for updating expense and service types.
 * - Initializes a default variable for the response data.
 * - Extracts the `entity_type` from the request path and sets it in the request body.
 * - Sets the `referrable_type` based on the `entity_type`.
 * - Validates the incoming request for the necessary fields.
 * - If validation passes, invokes the update function from the expenseAndServiceTypesService.
 *    - Based on the status in the update function response, prepares the response accordingly:
 *       - If successful, constructs a success response indicating the types were updated successfully.
 *       - If unsuccessful, constructs an error response with a message and potential error details.
 * - Logs the generated response.
 * - Returns the response to the client.
 *
 * @param {Object} req - Express request object containing details for updating expense and service types.
 * @param {Object} res - Express response object to send the response back.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update expense & service types request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  // Get the `entity_type` from `req.path`.
  const requestSegments = req.path.split('/');
  req.body.entity_type = requestSegments[2];
  const referrable_type = requestSegments[2] === 'employee-self-service-types' ? 1 : 2;


  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('entity_type')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.actionNotifications.slugNameRequired)
      .isIn(['employee-self-service-types', 'expense-management-types'])
      .withMessage(responseMessages.configurations.actionNotifications.slugNameShouldbe),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.common.idRequired)
      .isInt()
      .withMessage(responseMessages.common.IdInvalid).custom((value) => {
        return indexServices.find('expense_and_service_types', ['id'], { id: value , referrable_type : referrable_type  }).then((selfServiceTypesData) => {
          const status = selfServiceTypesData.status;
          if (!status) {
            return Promise.reject(responseMessages.common.IdNotExists);
          }
          req.body.id = selfServiceTypesData.data[0].id
        });
      }),
    check('name').trim().escape().notEmpty().withMessage(responseMessages.configurations.selfServiceTypes.nameRequired)
      .not().matches(regexPatterns.specialCharactersRegex).withMessage(responseMessages.configurations.selfServiceTypes.nameInvalid)
      .custom(async (value) => {
        const selfServiceTypesData = await indexServices.find('expense_and_service_types', ['id'], {  name: value , referrable_type : referrable_type });
        if (selfServiceTypesData.status) {
          if (selfServiceTypesData.data[0].id != req.params.id ) {
            return Promise.reject(responseMessages.configurations.selfServiceTypes.nameExists);
          }
        }
      }),
    check('assignee_employee_ids.*.employee_id').trim().escape().notEmpty().withMessage(responseMessages.configurations.selfServiceTypes.selfServiceTypesIdRequired)
      .isUUID().withMessage(responseMessages.configurations.selfServiceTypes.assignEmployeeIdIsInvalid),
    check('is_active').trim().escape().notEmpty().withMessage(responseMessages.configurations.selfServiceTypes.statusInvalid)
      .isBoolean().withMessage(responseMessages.configurations.selfServiceTypes.statusInvalid)
      // .custom((value) => {
      //   if (value == 'false' || Number(value) == 0) {
      //   return indexServices.count('employee_self_services',{ expense_and_service_types_id: req.params.id }, [], true).then((selfServiceTypes) => {
      //     if (Number(selfServiceTypes.data) != 0) {
      //       return Promise.reject("self service type is mapped for" + " "  + selfServiceTypes.data + " " +  "employee_self_service");
      //     }
      //   });
      // }
      // return true
      // }),
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
    var responseDetails = await expenseAndServiceTypesService.update(req.body, condition);
    if(responseDetails.status){
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };
    } else {
      responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: responseDetails.error };
    }

    /* Log Response */
    logResponse('info', req, responseData, ' Update expense & service types Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Handles the update of status for expense and service types based on the received request.
 * - Logs the incoming request for updating status.
 * - Initializes a default variable for the response data.
 * - Extracts the `entity_type` from the request path and sets it in the request body.
 * - Sets the `referrable_type` based on the `entity_type`.
 * - Validates the incoming request for the necessary fields.
 * - If validation passes, invokes the updateStatus function from the expenseAndServiceTypesService.
 *    - Based on the status in the updateStatus function response, prepares the response accordingly:
 *       - If successful, constructs a success response indicating the status was updated successfully.
 *       - If unsuccessful, throws an InvalidRequestError with the appropriate error message.
 * - Logs the generated response.
 * - Returns the response to the client.
 *
 * @param {Object} req - Express request object containing details for updating status.
 * @param {Object} res - Express response object to send the response back.
 */
const updateStatus = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update status request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  // Get the `entity_type` from `req.path`.
  const requestSegments = req.path.split('/');
  req.body.entity_type = requestSegments[2];
  const referrable_type = requestSegments[2] === 'employee-self-service-types' ? 1 : 2;

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('entity_type')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.actionNotifications.slugNameRequired)
      .isIn(['employee-self-service-types', 'expense-management-types'])
      .withMessage(responseMessages.configurations.actionNotifications.slugNameShouldbe),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.common.idRequired)
      .isInt()
      .withMessage(responseMessages.common.IdInvalid).custom((value) => {
        return indexServices.find('expense_and_service_types', ['id'], { id: value , referrable_type : referrable_type }).then((selfServiceTypesData) => {
          const status = selfServiceTypesData.status;
          if (!status) {
            return Promise.reject(responseMessages.common.IdNotExists);
          }
        });
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.selfServiceTypes.statusInvalid)
      .isBoolean()
      .withMessage(responseMessages.configurations.selfServiceTypes.statusInvalid)
      // .custom((value) => {
      //   if (value == 'false' || Number(value) == 0) {
      //   return indexServices.count('employee_self_services',{ expense_and_service_types_id: req.params.id }, [], true).then((selfServiceTypes) => {
      //     if (Number(selfServiceTypes.data) != 0) {
      //       return Promise.reject("self service type is mapped for" + " "  + selfServiceTypes.data + " " +  "employee_self_service");
      //     }
      //   });
      // }
      // return true
      // }),
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
       * + Call the service function
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    expenseAndServiceTypesService.updateStatus(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'status update Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Retrieve a paginated list of self-service types based on the provided search criteria.
 * 
 * Overview of API:
 *  - Validate the request, ensuring the presence of a request ID.
 *    + If successful
 *      ~ Call the service function to fetch self-service types data.
 *      ~ Prepare the response with the fetched data, pagination details, and activity logs.
 *    + Else
 *      ~ Add an error message to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set default variables for the response data and request ID.
 *  - If a valid request ID is provided:
 *    + Extract pagination parameters (limit and page) and search criteria from the request.
 *    + Define validation rules for the search condition.
 *    + Call the 'listing' function from the Self-Service Types service and fetch the data from 'expense_and_service_types' table based on condition provided.
 *    + If data exists:
 *       ~ Prepare a response with the fetched data, pagination details, and activity logs.
 *    + Else :
 *       ~ Prepare a response with the error massage and empty data, pagination details, and activity logs.
 *  - Else:
 *    + Return an error message indicating the request ID is required.
 * Notes:
 *  - Exception handling using try-catch.
 * 
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If a valid request ID is not provided.
 */
const listing = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting  self service types Details request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  const requestId = req.query.request_id;
  /* Default variable */

  // Get the `entity_type` from `req.path`.
  const requestSegments = req.path.split('/');
  const referrable_type = requestSegments[2] === 'employee-self-service-types' ? 1 : 2;


  if (requestId !== undefined && requestId !== '') {
    /* Default variable */
    const limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
    const page = (req.query.page) ? (req.query.page) : pagination.page;
    const search = req.query.search ? req.query.search : '';
    /* Default variable */

    /* Writing validation rules to the input request */
    const condition = { search, referrable_type : referrable_type };
    const selfServiceTypesData = await expenseAndServiceTypesService.listing(condition, page, limit);
    if (!selfServiceTypesData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: selfServiceTypesData.message, error: selfServiceTypesData.error, data: [], pagination: selfServiceTypesData.pagination_data, activity: selfServiceTypesData.activity };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: selfServiceTypesData.data, pagination: selfServiceTypesData.pagination_data, activity: selfServiceTypesData.activity };
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse('info', req, responseData, 'Getting  self service types Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Retrieve details of a self-service type based on the provided ID.
 * 
 * Overview of API:
 *  - Validate the request, ensuring the presence of a request ID and a valid self-service type ID.
 *    + If successful
 *      ~ Call the service function to fetch the self-service type data.
 *      ~ Prepare the response with the fetched data.
 *    + Else
 *      ~ Add an error message to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set default variables for the response data.
 *  - If valid request ID and self-service type ID are provided:
 *    + Define validation rules for the self-service type ID.
 *    + Call the 'index' function from the Self-Service Types service and fetch the data from the 'expense_and_service_types' table based on the provided ID.
 *    + If data exists:
 *       ~ Prepare a response with the fetched data.
 *    + Else:
 *       ~ Prepare a response with an error message.
 *  - Else:
 *    + Return an error message indicating the request ID and a valid self-service type ID are required.
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If a valid request ID and a valid self-service type ID are not provided.
 */
const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'getting self service index request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  // Get the `entity_type` from `req.path`.
  const requestSegments = req.path.split('/');
  req.body.entity_type = requestSegments[2]
  const referrable_type = requestSegments[2] === 'employee-self-service-types' ? 1 : 2;

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('entity_type')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.actionNotifications.slugNameRequired)
      .isIn(['employee-self-service-types', 'expense-management-types'])
      .withMessage(responseMessages.configurations.actionNotifications.slugNameShouldbe),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.selfServiceTypes.selfServiceTypesIdRequired)
      .isInt()
      .withMessage(responseMessages.configurations.selfServiceTypes.IdInvalid).custom((value) => {
        return indexServices.find('expense_and_service_types', ['id'], { id: value }).then((selfServiceTypesData) => {
          const status = selfServiceTypesData.status;
          if (!status) {
            return Promise.reject(responseMessages.configurations.selfServiceTypes.IdNotExists);
          }
        });
      }),
  ];
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
    const condition = { id: req.query.id , referrable_type : referrable_type };
    const selfServiceData = await expenseAndServiceTypesService.index(condition);
    if(selfServiceData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: selfServiceData.data };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: selfServiceData.message, error: selfServiceData.error, message: responseMessages.common.noRecordFound, data: [],  pagination: selfServiceData.pagination };
    }

    /* Log Response */
    logResponse('info', req, responseData, 'self service  Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Retrieve a list of self-service types for use in a dropdown or selection.
 * 
 * Overview of API:
 *  - Validate the request by checking the presence of a request ID.
 *    + If successful
 *      ~ Call the service function to retrieve a list of self-service types based on the search criteria.
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
 *    + Check for a search query parameter;
 *      ~ if not provided, use an empty string.
 *    + Call the common 'find' function to retrieve a list of self-service types from the 'expense_and_service_types' table.
 *    + If data exists:
 *      ~ Prepare the response with the fetched data.
 *    + Else:
 *       ~ Prepare the response with the empty data.
 *    + Logging the response.
 *    + Return the response using responseHandler().  
 *  - Else:
 *    - Throw an 'InvalidRequestError' with an appropriate message.
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there is no request ID provided in the request.
 */
const dropdown = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting self service types Details request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];

  // Get the `entity_type` from `req.path`.
  const requestSegments = req.path.split('/');
  req.body.entity_type = requestSegments[2]
  const referrable_type = requestSegments[2] === 'employee-self-service-types' ? 1 : 2;

  const requestId = req.query.request_id;
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    /* Default variable */
    const search = req.query.search ? req.query.search : '';
    /* Default variable */

    /* Writing validation rules to the input request */
    const condition = { search, is_active: true, referrable_type : referrable_type };
    const selfServiceTypesData = await indexServices.find('expense_and_service_types', ['id', 'name as value'], condition, 0);
    if (!selfServiceTypesData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: selfServiceTypesData.message, error: selfServiceTypesData.error, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: selfServiceTypesData.data };
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse('info', req, responseData, 'Getting self service types Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Delete a self-service type entry from the collection.
 * 
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Delete the self-service type details.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Return the error message.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set a default variable 'responseData'.
 *  - Define validation rules for the input request:
 *    + 'request_id' (Request body) is mandatory.
 *    + 'id' (Request params) is mandatory, should be an integer, and must exist in the 'expense_and_service_types' table as an editable item.
 *    + Check if the self-service type is mapped to 'employee_self_service'.
 *  - Run the validation rules.
 *    + If validation is successful:
 *      ~ Call the service function (destroy) to remove the self-service type details.
 *      ~ Prepare the response with success and a deletion message.
 *    + If validation fails:
 *      ~ Return an error message with a status code.
 *  - Log the response.
 *  - Return the response using responseHandler().
 * Notes:
 *  - Exception handling using try-catch.
 *      
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const destroy = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'delete self service types request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  // Get the `entity_type` from `req.path`.
  const requestSegments = req.path.split('/');
  req.body.entity_type = requestSegments[2]
  const referrable_type = requestSegments[2] === 'employee-self-service-types' ? 1 : 2;

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('entity_type')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.actionNotifications.slugNameRequired)
      .isIn(['employee-self-service-types', 'expense-management-types'])
      .withMessage(responseMessages.configurations.actionNotifications.slugNameShouldbe),
      check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.selfServiceTypes.selfServiceTypesIdRequired)
      .isInt()
      .withMessage(responseMessages.configurations.selfServiceTypes.IdInvalid)
      .custom(async (value) => {
        const selfServiceTypes = await indexServices.find('expense_and_service_types', ['id', 'name'], { id: value , referrable_type : referrable_type });
        const selfServiceTypesData = selfServiceTypes.status;
        if (!selfServiceTypesData) {
          return Promise.reject(responseMessages.configurations.selfServiceTypes.IdNotExists);
        }
        req.body.name = selfServiceTypes.data[0].name;
      })
      // .custom((value) => {
      //   return indexServices.count('employee_self_services',{ self_service_types_id: value }, [], true).then((selfServiceTypes) => {
      //     if (Number(selfServiceTypes.data) != 0) {
      //       return Promise.reject("self service type is mapped for" + " "  + selfServiceTypes.data + " " +  "employee_self_service");
      //     }
      //   });
      // }),
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
       * + Delete  self service types in the collection.
       * If Validation Fails
       * + Return the error message.
      */
  if (errors.isEmpty()) {
    const condition = { id: parseInt(req.params.id) , referrable_type : referrable_type};
    await expenseAndServiceTypesService.destroy(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.deletedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'self service types Delete Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = { destroy, dropdown, index, listing, store, update, updateStatus };
