const { check, validationResult } = require('express-validator')
const { responseMessages } = require('../../../../../constants/responseMessage')
const { responseCodes } = require('../../../../../constants/responseCodes')
const { logRequest, logResponse } = require('../../../../../utils/log')
const employeeSelfServiceServices = require('../../services/employee_self_service/employeeSelfServiceServices')
const { responseHandler } = require('../../../../responseHandler')
const { tryCatch } = require('../../../../../utils/tryCatch')
const InvalidRequestError = require('../../../../../error/InvalidRequestError')
const { pagination } = require('../../../../../config/pagination')
const indexService = require('../../services/index');
const format = require('../../../../../helpers/format');
const { regexPatterns } = require('../../../../../constants/regexPatterns')
const moment = require('moment');

/**
 * Retrieve the details of an employee self service by its ID.
 * 
 * Overview of API:
 *  - Log the incoming request.
 *  - Set a default variable for the response data.
 *  - Define the validation rules for the request parameters.
 *  - Run the validation rules and check for errors.
 *  - If validation is successful:
 *    + Call the 'indexService.find' function to fetch employee self service details by ID.
 *    + Prepare a response with the fetched data.
 *  - If validation fails:
 *    + Return an error message with the appropriate status code.
 * 
 * Logic:
 *  - Log the incoming request for tracking purposes.
 *  - Initialize a default variable for the response data.
 *  - Define the validation rules for the input request:
 *    + 'request_id' is mandatory.
 *    + 'id' is mandatory, should be a valid UUID, and must exist in the 'employee_self_services' table.
 *  - Run the validation rules to check for errors.
 *  - If there are no validation errors:
 *    + Define the condition to retrieve data based on the provided ID.
 *    + Call the 'indexService.find' function to fetch employee self service details.
 *    + Prepare a response object with the fetched data.
 *  - If there are validation errors:
 *    + Throw an 'InvalidRequestError' with the first validation error message and the status code.
 * 
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there are validation errors in the request or if the request ID is missing.
 */

const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'getting employee self service request')
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
      .withMessage(responseMessages.employeeSelfService.selfServiceId)
      .isUUID()
      .withMessage(responseMessages.employeeSelfService.IdInvalid)
      .custom(async (value) => {
        const selfServiceData = await indexService.find('employee_self_services', ['id'], { id: value })
        var status = selfServiceData.status
        if (!status) {
          return Promise.reject(
            responseMessages.employeeSelfService.IdNotExists
          )
        }
      })
  ]
  /*Run the validation rules. */
  for (var validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  if (errors.isEmpty()) {
    var condition = { 'employee_self_services.id': req.query.id, 'est.referrable_type' : 1 , 'ae.referrable_type' : 1 }
    var selfServiceData = await employeeSelfServiceServices.index(condition)
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.success,
      data: selfServiceData.data
    }

    /* Log Response */
    logResponse('info', req, responseData, 'self service index Response.')
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
 * Employee Self Service Listing Request
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Fetch the data from 'employee_self_services' table based on the provided conditions and return the data.
 *      ~ Add Success to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 *  - Logging incoming request.
 *  - Define the validation rules as follows:
 *    + request_id (query) is mandatory.
 *    + received (body) is mandatory, should be a boolean.
 *    + raised (body) is mandatory, should be a boolean.
 *    + status (body) is optional, should be an array of integers (1, 2, or 3).
 *    + self_service (body) is optional, should be an array of integers representing self service types.
 *    + search (body) is optional, should be a string.
 *    + from_date (body) is optional, should be a valid date string.
 *    + to_date (body) is optional, should be a valid date string.
 *    + limit (body) is optional, should be an integer.
 *    + page (body) is optional, should be an integer.
 *  - Loop through req.body and validate each parameter using switch cases, assign to the condition.
 *  - Validate 'from_date' and 'to_date' using moment library and regex patterns.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the 'listing' service function with the provided conditions.
 *    + Based on the status in the 'listing' function response, segregate the response and prepare the final response.
 *  - If validation fails:
 *    + Return the error message.
 *  - Prepare the response with status codes.
 *  - Logging the response.
 *  - Return response using responseHandler().
 *
 * Notes:
 *  - Handling exceptions using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns None
 * @throws {InvalidRequestError} - If the request validation fails.
 */
const listing = tryCatch(async (req, res) => {

  let dateFormat = await format.getDateFormat(); // date format

  /* Log Request */
  logRequest('info', req, 'Getting self service Details request')
  /* Log Request */

  /* Default Variable */
  var responseData = [];
  var condition = {
    from_date: null,
    to_date: null
  };
  /* Default Variable */

  // Writing validation rules to the input request
  var validations = [
    check("request_id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check("received")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employeeSelfService.receivedRequired)
      .isBoolean()
      .withMessage(responseMessages.employeeSelfService.receivedInvalid),
    check("raised")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employeeSelfService.raisedRequired)
      .isBoolean()
      .withMessage(responseMessages.employeeSelfService.raisedInvalid),
    check("employee")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employeeSelfService.employeeRequired)
      .isBoolean()
      .withMessage(responseMessages.employeeSelfService.employeeInvalid),
    check("status")
      .optional()
      .custom(async (value) => {
        if (value != null && value != '' && value != undefined) {

          if (!Array.isArray(value)) {
            return Promise.reject(responseMessages.employeeSelfService.statusArray);
          }
          // for (const status of value) {
          //   if (!Number.isInteger(status)) {
          //     return Promise.reject(responseMessages.employee.behalfOnboarding.statusInvalid);
          //   }

          //   // if (![1, 2, 3].includes(status)) {
          //   //   return Promise.reject(responseMessages.employee.behalfOnboarding.statusInvalid);
          //   // }
          // }

          return true;
        }
      }),
    check("self_service")
      .optional()
      .custom(async (value) => {
        if (value != null && value != '' && value != undefined) {

          if (!Array.isArray(value)) {
            return Promise.reject(responseMessages.employeeSelfService.selfServiceArray);
          }
        }
        return true
      }),
    check("self_service.*")
      .optional()
      .custom(async (value) => {
        if (value != null && value != '' && value != undefined) {
          var pattern = regexPatterns.numbersSpaceRegex
          if (pattern.test(value)) {
            const selfServiceData = await indexService.find('expense_and_service_types', ['id'], { id: value, is_active: 1, referrable_type : 1 })
            if (!selfServiceData.status) {
              return Promise.reject(responseMessages.employeeSelfService.selfServiceTypesIdNotExists)
            }
            return true
          } else {
            return Promise.reject(responseMessages.employeeSelfService.selfServiceTypesIdInvalid)
          }
        }
        return true
      })
  ];

  // validate 'from_date' and 'to_date'
  if (req.body.from_date && req.body.to_date) {
    const from_date = moment(req.body.from_date, dateFormat).format('YYYY-MM-DD');
    const to_date = moment(req.body.to_date, dateFormat).format('YYYY-MM-DD');
    if (regexPatterns.dateRegex.test(from_date) && regexPatterns.dateRegex.test(to_date)) {
      condition.from_date = from_date;
      condition.to_date = to_date;
    } else {
      return Promise.reject(responseMessages.timesheet.dateInvalid);
    }
  }

  // Run the validation rules.
  for (var validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);
  /*Run the validation rules. */

  /**
  * If validation is success
  *    + Call the listing service function
  *        - Based on the status in listing function response, segregate the response and prepare the response
  * If Validation Fails
  *    + Return the error message.
  */
  if (errors.isEmpty()) {

    // Default Variable
    let limit = (req.body.limit) ? (req.body.limit) : pagination.limit;
    let page = (req.body.page) ? (req.body.page) : pagination.page
    condition.received = (req.body.received) ? req.body.received : null;
    condition.employee = (req.body.employee) ? req.body.employee : null;
    condition.raised = (req.body.raised) ? req.body.raised : null;
    condition.loginId = req.body.loginUserId
    condition.status = (req.body.status && req.body.status?.length > 0) ? req.body.status.toString() : null;
    condition.self_service = (req.body.self_service?.length > 0) ? req.body.self_service : [];
    condition.search = req.body.search ? req.body.search : null;

    /* Writing validation rules to the input request */
    var selfServiceData = await employeeSelfServiceServices.listing(condition, dateFormat, page, limit);
    if (selfServiceData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: selfServiceData.data,
        pagination: selfServiceData.pagination_data,
        receivedCount: selfServiceData.receivedCount,
        raisedCount: selfServiceData.raisedCount
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.noRecordFound,
        data: [],
        pagination: selfServiceData.pagination_data
      }
    }

    /* Log Response */
    logResponse(
      'info',
      req,
      responseData,
      'Getting employee self service Details Response'
    )
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */

  }
  else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    );
  }
})

/**
 * Store Function to create a new employe self service request
 * 
 * Overview of Function:
 * - Validate the request.
 *   + If successful
 *     ~ Call the 'store' service function to create a new employe self service request
 *     ~ Prepare the response with success data.
 *   + Else
 *     ~ Add error validation to the response
 * - Return the response
 * 
 * Logic:
 * - Log the incoming request.
 * - Set default variables for 'responseData'
 * - Define the validation rules as follows:
 *   + 'request_id' (body), must not be empty.
 *   + 'employee_id' (body), must not be empty, check employee_id in 'employee' table whether it is valid ot not.
 *   + 'self_service_types_id' (body), must not be empty, check self_service_types_id in 'expense_and_service_types' table whether it is valid or not.
 *   + 'subject' (body), must not be empty.
 *   + 'description' (body), must not be empty.
 *   + 'documents.*.new_document_id' (body), must not be empty, should be a valid UUID, and should exist in the 'temp_upload_documents' table.
 *
 * RUn the validation rules.
 * If validation is successful:
 *   + Call the 'store' service functuion to create new emploee self service request
 *   + If successful:
 *     - Prepare the response with success data.
 *   + Else:
 *     - Prepare the response with an error message.
 * If validation fails:
 * 
 * */
const store = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'New self service creation  request')
  /* Log Request */

  /* Default Variable */
  var responseData = ''
  /* Default Variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('employee_id')
      .trim()
      .escape()
      .notEmpty()
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async (value) => {
        const employee = await indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: value })
        var employeeData = employee.status;
        if (!employeeData) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
        } else {
          req.body.employee_name = employee.data[0].display_name;
          req.body.employee_reference_id = employee.data[0].reference_id;
          return true
        }
      }),
    check('self_service_types_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employeeSelfService.selfServiceTypesIdRequired)
      .isInt()
      .withMessage(responseMessages.employeeSelfService.IdInvalid)
      .custom(async (value) => {
        const selfServiceData = await indexService.find('expense_and_service_types', ['id'], { id: value, referrable_type : 1 })
        var status = selfServiceData.status
        if (!status) {
          return Promise.reject(
            responseMessages.employeeSelfService.IdNotExists
          )
        }
      }),
    check('subject')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employeeSelfService.subjectRequired),
    check('description')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employeeSelfService.descriptionRequired),
    check('documents.*.new_document_id')
      .trim()
      .escape()
      .custom(async (value) => {
        if (value != '' && value != null) {
          var pattern = regexPatterns.uuidRegex;
          if (pattern.test(value)) {
            return await indexService.find('temp_upload_documents', ['id'], { id: value }, null, [], null, null, null, false)
              .then((documentsData) => {
                if (!documentsData.status) {
                  return Promise.reject(
                    responseMessages.employee.documents.invalidDocumentsId
                  )
                }
              });
          }
        }
      })
  ];
  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  /**
    * If validation is success
    *    + call the create service function
    *        - Based on the status in create function response, segregate the response and prepare the response
    * If Validation Fails
    *    + Return the error message.
   */
  if (errors.isEmpty()) {
    var response = await employeeSelfServiceServices.store(req.body)
    if (response.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.addedSuccessfully,
        data: response.data[0]
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong,
        error: response.error
      }
    }
    /* Log Response */
    logResponse('info', req, responseData, 'New self service creation  request')
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
 * Update an existing self-service entry based on the provided request body and identifier.
 * 
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to update the self-service entry.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set a default variable for the response data.
 *  - Define the validation rules as follows:
 *    + 'request_id' is mandatory.
 *    + 'id' is mandatory and should be a valid UUID that exists in the 'employee_self_services' table.
 *    + 'self_service_types_id' is mandatory and should be a valid UUID that exists in the 'expense_and_service_types' table.
 *    + 'subject' is mandatory.
 *    + 'employee_id' is mandatory and should be a valid UUID that exists in the 'employee' table.
 *    + 'status' is mandatory and should be an integer within the range [1, 2].
 *    + 'documents.*.new_document_id' should be valid UUIDs and should exist in the 'temp_upload_documents' table.
 *    + 'deleted_documents_id.*' should be valid UUIDs and should exist in the 'employee_self_service_documents' table.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the 'update' function from the Self-Service service to update the entry.
 *    + Prepare a response with a success status and message.
 *    + If the update operation fails, include an error message.
 *  - If validation fails:
 *    + Return an error message with the status code 'Unprocessable Entity'.
 * 
 * @param {Object} req - The HTTP request object containing the request body and identifier.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update self service request.')
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
      .withMessage(
        responseMessages.employeeSelfService.employeeSelfServiceIdRequired
      )
      .custom(async (value) => {
        const selfService = await indexService.find('employee_self_services', ['id'], { id: value })
        var selfServiceData = selfService.status
        if (!selfServiceData) {
          return Promise.reject(
            responseMessages.employeeSelfService.IdNotExists
          )
        }
      }),
    check('self_service_types_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employeeSelfService.selfServiceTypesIdRequired)
      .custom(async (value) => {
        const selfServiceData = await indexService.find('expense_and_service_types', ['id'], { id: value, referrable_type : 1 })
        var status = selfServiceData.status
        if (!status) {
          return Promise.reject(responseMessages.employeeSelfService.IdNotExists)
        }
      }),
    check('subject')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employeeSelfService.subjectRequired),
    check('employee_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employeeSelfService.employeeIdRequired)
      .isUUID()
      .withMessage(responseMessages.employeeSelfService.employeeIdInvalid)
      .custom(async (value) => {
        const selfServiceData = await indexService.find('employee', ['id'], { id: value })
        var status = selfServiceData.status
        if (!status) {
          return Promise.reject(
            responseMessages.employeeSelfService.IdNotExists
          )
        }
      }),
    check('status')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employeeSelfService.status)
      .isIn(['Drafted', 'In Progress', 'Closed', 'Cancel', 'Reopen'])
      .withMessage(responseMessages.employeeSelfService.statusInvalid),
    check('documents.*.new_document_id')
      .trim()
      .escape()
      .custom(async (value) => {
        if (value != '' && value != null) {
          var pattern = regexPatterns.uuidRegex;
          if (pattern.test(value)) {
            return await indexService.find('temp_upload_documents', ['id'], { id: value }, null, [], null, null, null, false)
              .then((documentsData) => {
                if (documentsData.length === 0) {
                  return Promise.reject(
                    responseMessages.employee.documents.invalidDocumentsId
                  )
                }
              });
          }
        }
      }),
    check('deleted_documents_id.*').trim().escape().custom((value) => {
      if (value != '' && value != null) {
        return indexService.find('employee_self_service_documents', ['*'], { id: value }).then((documentsData) => {
          if (documentsData.length === 0) {
            return Promise.reject(responseMessages.timesheet.documentIdInvalid);
          }
        });
      }
      return true;
    }),
  ]
  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (var validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  if (errors.isEmpty()) {
    let condition = { id: req.params.id } // condition
    var response = await employeeSelfServiceServices.update(req.body, condition)
    if (response.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.updatedSuccessfully
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong,
        error: response.error
      }
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Update self service  Response.')
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

// /**
//  * Retrieves the employee listing for self service details based on the provided request ID.
//  * @param {Object} req - The request object.
//  * @param {Object} res - The response object.
//  * @returns None
//  * @throws {InvalidRequestError} - If the request ID is missing or invalid.
//  */
// const employeelisting = tryCatch(async (req, res) => {
//   /* Log Request */
//   logRequest('info', req, 'Getting self service Details request')
//   /* Log Request */

//   /* Default Variable */
//   var responseData = ''
//   var request_id = req.query.request_id
//   /* Default Variable */

//   if (request_id != undefined && request_id != '') {
//     /* Default Variable */
//     const employee_id = verifyAccessToken(req.query.access_token)
//     let limit = req.query.limit ? req.query.limit : pagination.limit
//     let page = req.query.page ? req.query.page : pagination.page
//     let search = req.query.search ? req.query.search : ''
//     /* Default Variable */

//     /* Writing validation rules to the input request */
//     if (search != undefined && search != '') {
//       var condition = { search: search, raised_employee_id: employee_id }
//     } else {
//       var condition = { raised_employee_id: employee_id }
//     }

//     var selfServiceData = await employeeSelfServiceServices.listing(condition, page, limit)
//     if (!selfServiceData.status) {
//       responseData = {
//         statusCode: responseCodes.codeSuccess,
//         message: responseMessages.common.noRecordFound,
//         data: [],
//         pagination: selfServiceData.pagination_data
//       }
//     } else {
//       responseData = {
//         statusCode: responseCodes.codeSuccess,
//         message: responseMessages.common.success,
//         data: selfServiceData.data,
//         pagination: selfServiceData.pagination_data
//       }
//     }

//     /* Log Response */
//     logResponse(
//       'info',
//       req,
//       responseData,
//       'Getting employee self service Details Response'
//     )
//     /* Log Response */

//     /* Return the response */
//     responseHandler(res, responseData)
//     /* Return the response */
//   } else {
//     throw new InvalidRequestError(responseMessages.common.requestIdRequired)
//   }
// })

/**
 * Update the ticket status for an existing employee self-service entry based on the provided request body and identifier.
 * 
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to update the ticket status of the employee self-service entry.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set a default variable for the response data.
 *  - Define the validation rules as follows:
 *    + 'request_id' is mandatory.
 *    + 'id' is mandatory and should be a valid UUID that exists in the 'employee_self_services' table.
 *    + 'status' is mandatory and should be an integer within the range [1, 2].
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the 'updateTicket' function from the Employee Self-Service service to update the ticket status of the entry.
 *    + Prepare a response with a success status and message.
 *    + If the update operation fails, include an error message.
 *  - If validation fails:
 *    + Return an error message with the status code 'Unprocessable Entity'.
 * 
 * @param {Object} req - The HTTP request object containing the request body and identifier.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const ticketStatus = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'ticket status update employee self service request')
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
      .withMessage(
        responseMessages.employeeSelfService.employeeSelfServiceIdRequired
      )
      .isUUID()
      .withMessage(responseMessages.employeeSelfService.employeeSelfServiceIdInvalid)
      .custom(async (value) => {
        const selfService = await indexService.find('employee_self_services', ['id', 'reference_id'], { id: value })
        var selfServiceData = selfService.status
        if (!selfServiceData) {
          return Promise.reject(
            responseMessages.employeeSelfService.employeeSelfServiceIdNotExists
          )
        }
        req.body.reference_id = selfService.data[0].reference_id
      }),
    check('status')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employeeSelfService.status)
  ]
  /*Run the validation rules. */
  for (var validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  if (errors.isEmpty()) {
    let condition = { id: req.params.id } // condition
    var response = await employeeSelfServiceServices.updateTicket(req.body, condition)
    if (response.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.updatedSuccessfully
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong,
        error: response.error
      }
    }

    /* Log Response */
    logResponse('info', req, responseData, 'ticket status update employee self service Response.')
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
 * Update the ticket status for an existing employee self-service entry based on the provided request body and identifier.
 * 
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to update the ticket status of the employee self-service entry.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set a default variable for the response data.
 *  - Define the validation rules as follows:
 *    + 'request_id' is mandatory.
 *    + 'id' is mandatory and should be a valid UUID that exists in the 'employee_self_services' table.
 *    + 'status' is mandatory and should be an integer within the range [1, 2].
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the 'updateTicket' function from the Employee Self-Service service to update the ticket status of the entry.
 *    + Prepare a response with a success status and message.
 *    + If the update operation fails, include an error message.
 *  - If validation fails:
 *    + Return an error message with the status code 'Unprocessable Entity'.
 * 
 * @param {Object} req - The HTTP request object containing the request body and identifier.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const selfServiceEmployee = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'get employees based on self service type request')
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
    check('self_service_type_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(
        responseMessages.configurations.selfServiceTypes.selfServiceTypeIdRequired)
      .isInt()
      .withMessage(responseMessages.configurations.selfServiceTypes.selfServiceTypesIdInvalid)
      .custom(async (value) => {
        const selfService = await indexService.find('expense_and_service_types', ['id'], { id: value })
        var selfServiceData = selfService.status
        if (!selfServiceData) {
          return Promise.reject(
            responseMessages.configurations.selfServiceTypes.selfServiceTypesIdNotExists
          )
        }
      })
  ]
  /*Run the validation rules. */
  for (var validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  if (errors.isEmpty()) {
    let condition = { 'expense_and_service_types.id': req.query.self_service_type_id , 'expense_and_service_types.referrable_type' : 1} // condition
    var response = await employeeSelfServiceServices.selfServiceEmployee(condition)
    if (response.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: response.data
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong,
        error: response.error
      }
    }

    /* Log Response */
    logResponse('info', req, responseData, 'ticket status update employee self service Response.')
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

module.exports = { index, listing, store, update, ticketStatus, selfServiceEmployee }
