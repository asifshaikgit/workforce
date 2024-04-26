const { check, validationResult } = require('express-validator')
const { logRequest, logResponse } = require('../../../../../utils/log')
const { responseMessages } = require('../../../../../constants/responseMessage')
const { responseCodes } = require('../../../../../constants/responseCodes')
const { responseHandler } = require('../../../../responseHandler')
const educationDetailsService = require('../../services/employee/educationDetailsService')
const { tryCatch } = require('../../../../../utils/tryCatch')
const InvalidRequestError = require('../../../../../error/InvalidRequestError')
const indexService = require('../../services/index');
const format = require('../../../../../helpers/format');
const moment = require('moment')
const { regexPatterns } = require('../../../../../constants/regexPatterns')


/**
 * Store function to create a new Education record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'store' service function to create a new Education record.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Retrieve the organization date format using `format.getDateFormat()`.
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Modify the 'start_date' and 'end_date' dates to 'YYYY-MM-DD' format using Moment.js and update the request.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *    + 'education_level_id' (body), must not be empty, should be a valid integer, and should exist in the 'education_levels' table.
 *    + 'field_of_study' (body), must not be empty, and should not contain certain special characters.
 *    + 'university_name' (body), must not be empty, and should not contain certain special characters.
 *    + 'start_date' (body), must not be empty and should be a valid date.
 *    + 'end_date' (body), if not empty, should be a valid date.
 *    + 'state_id' (body), must not be empty, should be a valid integer, and should exist in the 'states' table.
 *    + 'country_id' (body), must not be empty, should be a valid integer, and should exist in the 'countries' table.
 *    + 'documents.*.new_document_id' (body), if not empty, should be a valid UUID, and should exist in the 'temp_upload_documents' table.
 *
 * Run the validation rules.
 * If validation is successful:
 *    + Call the 'store' service function to create a new Education record.
 *    + If successful:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with an error message.
 * If validation fails:
 *    + Add error validation to the response.
 * Log the response.
 * Return the response using `responseHandler()`.
 *
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const store = tryCatch(async (req, res) => {
  // let dateFormat = await format.getDateFormat(); // date format
  /* Log Request */
  logRequest('info', req, 'Employee education Detail store request')
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
      .withMessage(responseMessages.employee.employeeIdRequired)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async value => {
        const employeeData = await indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: value })
        if (!employeeData.status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
        }
        req.body.employee_name = employeeData.data[0].display_name
        req.body.employee_reference_id = employeeData.data[0].reference_id
        return true
      }),
    check('documents')
      .optional()
      .isArray()
      .withMessage(responseMessages.employee.documents.documentsNotArray)
      .custom(async docs => {

        await Promise.all(docs.map(async value => {
          const new_document_id = value.new_document_id;
          if (new_document_id != '' && new_document_id != undefined && new_document_id != null) {
            var pattern =
              regexPatterns.uuidRegex
            if (pattern.test(new_document_id)) {

              var tableName = 'temp_upload_documents';
              if (value.slug == 'invite_via_link') {
                tableName = 'invited_employee_documents';
              }
              var documentsData = await indexService.find(
                tableName,
                ['id'],
                { id: new_document_id },
                null,
                [],
                null,
                null,
                null,
                false
              );
              if (!documentsData.status) {
                return Promise.reject(responseMessages.employee.documents.newDocumentIdNotExists)
              }
            } else {
              return Promise.reject(responseMessages.employee.documents.newDocumentIdInvalid)
            }
          }
        }))
      })
  ]
  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  if (errors.isEmpty()) {
    var educationDetails = await educationDetailsService.store(req.body)
    if (educationDetails.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully, data: educationDetails.data };
    } else {
      responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: educationDetails.error };
    }
    /* Log Response */
    logResponse('info', req, responseData, 'Employee education Detail store response')
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
});

/**
 * Update function to modify an existing Education record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'update' service function to modify the Education record.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Retrieve the organization date format using `format.getDateFormat()`.
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Modify the 'start_date' and 'end_date' dates to 'YYYY-MM-DD' format using Moment.js and update the request.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *    + 'id' (params), must not be empty, should be a valid integer, and should correspond to an existing Education record for the specified employee.
 *    + 'education_level_id' (body), must not be empty, should be a valid integer, and should exist in the 'education_levels' table.
 *    + 'field_of_study' (body), must not be empty, and should not contain certain special characters.
 *    + 'university_name' (body), must not be empty, and should not contain certain special characters.
 *    + 'start_date' (body), must not be empty and should be a valid date.
 *    + 'end_date' (body), if not empty, should be a valid date.
 *    + 'state_id' (body), must not be empty, should be a valid integer, and should exist in the 'states' table.
 *    + 'country_id' (body), must not be empty, should be a valid integer, and should exist in the 'countries' table.
 *    + 'documents.*.new_document_id' (body), if not empty, should be a valid UUID, and should exist in the 'temp_upload_documents' table.
 *    + 'documents.*.id' (body), if not empty, should be a valid integer and correspond to an existing 'employee_mapped_documents' table.
 *
 * Run the validation rules.
 * If validation is successful:
 *    + create a 'condition' object using education details id(req.params.id)
 *    + Call the 'update' service function to modify the Education record.
 *    + If successful:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with an error message.
 * If validation fails:
 *    + Add error validation to the response.
 * Log the response.
 * Return the response using `responseHandler()`.
 *
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
  // let dateFormat = await format.getDateFormat(); // date format
  /* Log Request */
  logRequest('info', req, 'Employee education details update request.')
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
      .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async value => {
        const employeeData = await indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: value })
        var status = employeeData.status
        if (!status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
        }
        req.body.employee_name = employeeData.data[0].display_name
        req.body.employee_reference_id = employeeData.data[0].reference_id
        return true
      }),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.educationDetails.educationDetailsIdRequired)
      .isInt()
      .withMessage(responseMessages.employee.educationDetails.educationDetailsIdInvalid)
      .custom(async (value) => {
        var empEducation = await indexService.find('employee_education_details', ['id', 'employee_id'], { id: value })
        var educationData = empEducation.status
        if (!educationData) {
          return Promise.reject(responseMessages.employee.educationDetails.educationDetailsIdNotExists)
        } else {
          if (empEducation.data[0].employee_id != req.body.employee_id) {
            return Promise.reject(responseMessages.employee.educationDetails.noMatchingDetailsEducation)
          }
          return true
        }
      }),
    check('documents.*.new_document_id')
      .trim()
      .escape()
      .custom(async (value) => {
        if (value != null && value != '') {
          var pattern = regexPatterns.uuidRegex;
          if (pattern.test(value)) {
            return await indexService.find('temp_upload_documents', ['id'], { id: value }, 1, [], null, null, null, false).then((documentsData) => {
              if (!documentsData.status) {
                return Promise.reject(responseMessages.employee.documents.newDocumentIdNotExists)
              }
            })
          } else {
            return Promise.reject(responseMessages.employee.documents.newDocumentIdInvalid)
          }
        } else if (value === null || value == '') {
          return true
        }
      }),
    check('documents.*.id')
      .trim()
      .escape()
      .custom(async (value) => {
        if (check(value).isInt() && value != null && value != '') {
          return await indexService.find('employee_mapped_documents', ['id'], { id: value }).then((documentsData) => {
            if (!documentsData.status) {
              return Promise.reject(responseMessages.employee.documents.documenIdNoExists)
            }
          })
        } else if (value === null || value == '') {
          return true
        } else {
          return Promise.reject(responseMessages.employee.documents.documentIdInvalid)
        }
      }),
    check('documents_deleted_ids.*')
      .trim()
      .escape()
      .custom(async (value) => {
        if (value != '') {
          var pattern = /^[0-9]*$/;
          if (pattern.test(value)) {
            let documentsData = await indexService.find('employee_mapped_documents', ['id'], { id: value }, null)
            if (!documentsData.status) {
              return Promise.reject(responseMessages.employee.documents.DeleteDocumentInvalid)
            }
          } else {
            return Promise.reject(responseMessages.employee.documents.DeleteDocumentInvalid)
          }
        }
        return true
      })
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
    const condition = { id: req.params.id }
    if (req.body?.clear_all) {
      var educationDetails = await educationDetailsService.destroy(req.body, condition)
    } else {
      var educationDetails = await educationDetailsService.update(req.body, condition)
    }
    if (educationDetails.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.updatedSuccessfully
      }
    } else {
      responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: educationDetails.error };
    }


    /* Log Response */
    logResponse('info', req, responseData, 'Employee education details update Response.')
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
});

/**
 * Index function to retrieve a list of Education Details for a specific employee.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Retrieve a list of Education Details for the specified employee.
 *      ~ Prepare the response with success data or an empty list if no records are found.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'id' (query), must not be empty, should be a valid UUID, and should correspond to an existing 'employee' table.
 *
 * Run the validation rules.
 * If validation is successful:
 *    + Create a 'condition' object using id(req.query.id).
 *    + Call the 'educationDetailsService.index' function to get education details based on condition(above defined)
 *    + If data exists:
 *      - Prepare the response with fetched data.
 *    + Else:
 *      - Prepare the response with a error message and an empty data array.
 * Log the response.
 * Return the response using `responseHandler()`.
 * If validation fails:
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
  logRequest('info', req, "Getting employee education Details index request");
  /* Log Request */

  /* Default Variable */
  var responseData = '';
  /* Default Variable */

  /* Writing validation rules to the input request */
  var validations = [
    check("request_id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdRequired)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async value => {
        const employeeData = await indexService.find('employee', ['id'], { id: value })
        if (!employeeData.status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
        }
      })
  ]

  /*Run the validation rules. */
  for (var validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);
  /*Run the validation rules. */

  if (errors.isEmpty()) {
    var condition = { 'employee_education_details.employee_id': req.query.id };
    var educationDetailsData = await educationDetailsService.index(condition);
    if (!educationDetailsData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: educationDetailsData.message, error: educationDetailsData.error, message: responseMessages.common.noRecordFound, data: [] }
    }
    else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: educationDetailsData.data };
    }

    /* Log Response */
    logResponse("info", req, responseData, "Getting employee education Details index Response.");
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */

  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity,);
  }
});

/**
 * Destroy function to delete an Education Detail record for a specific employee.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Delete the specified Education Detail record.
 *      ~ Prepare the response with a success message.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should correspond to an existing 'employee' table.
 *      ~ Additionally get 'display_name' and 'reference_id' of provided 'employee_id' and map to request body as 'employee_name' and 'employee_reference_id'
 *    + 'id' (params), must not be empty, should be a valid integer, and should correspond to an existing in 'employee_education_details' table.
 *      ~ Additionally join the 'education_levels' table based on 'education_level_id' id to get 'education_name' map to request body
 *      ~ fetch 'field_of_study' and map to request body.
 *
 * - Run the validation rules.
 * - If validation is successful:
 *    + Create 'condition' object based on id(req.params.id)
 *    + Call the 'educationDetailsService.destroy' function to delete the education details based on condition(above defined)
 *    + Prepare the response with a success message.
 * - Log the response.
 * - Return the response using `responseHandler()`.
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
const destroy = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Delete employee education Detail request')
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
    check('employee_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdRequired)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async (value) => {
        const employeeData = await indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: value })
        var status = employeeData.status
        if (!status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
        }
        req.body.employee_name = employeeData.data[0].display_name;
        req.body.employee_reference_id = employeeData.data[0].reference_id;
        return true;
      }),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.educationDetails.educationDetailsIdRequired)
      .isInt()
      .withMessage(responseMessages.employee.educationDetails.educationDetailsIdInvalid)
      .custom(async (value) => {
        const joins = [
          { table: 'education_levels as el', alias: 'el', condition: ['employee_education_details.education_level_id', 'el.id'], type: 'left' },
        ]
        var empEducation = await indexService.find('employee_education_details', ['employee_education_details.id', 'employee_education_details.employee_id', 'employee_education_details.field_of_study', 'el.name'], { 'employee_education_details.id': value }, null, joins)
        if (!empEducation.status) {
          return Promise.reject(responseMessages.employee.educationDetails.educationDetailsIdNotExists)
        } else {
          if (empEducation.data[0].employee_id != req.body.employee_id) {
            return Promise.reject(responseMessages.employee.educationDetails.noMatchingDetailsEducation)
          }
          req.body.education_name = empEducation.data[0].name
          req.body.field_of_study = empEducation.data[0].field_of_study
          return true
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

  if (errors.isEmpty()) {
    const condition = { id: req.params.id }
    await educationDetailsService.destroy(req.body, condition)
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.deletedSuccessfully
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Delete employee education Detail Response')
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
});

const destroyDocument = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'visa document delete request')
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
    check('employee_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.employeeIdRequired)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async (value) => {
        const employee = await indexService.find('employee', ['id', 'reference_id'], { id: value })
        if (!employee.status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
        }
        req.body.employee_reference_id = employee.data[0].reference_id
        return true
      }),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.visaDetails.documentIdRequired)
      .isInt()
      .withMessage(responseMessages.employee.visaDetails.documentIdInvalid)
      .custom(async (value) => {
        let docData = await indexService.find('employee_mapped_documents', ['id'], { id: value });
        if (!docData.status) {
          return Promise.reject(
            responseMessages.employee.personalDocuments.documentIdDoesNotExist,
          );
        }
        return true;
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
   * + Delete  bank account details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id }
    await educationDetailsService.deleteDocument(req.body, condition)
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.deletedSuccessfully
    }

    /* Log Response */
    logResponse('info', req, responseData, 'education details document delete Response')
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */

  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity)
  }
});

module.exports = { destroy, index, store, update, destroyDocument }
