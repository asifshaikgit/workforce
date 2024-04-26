/**
 * @constant check Creates a middleware/validation chain for one or more fields that may be located in any of the following:
 */
const { check, validationResult } = require('express-validator');

/**
 * @constant tryCatch Default class for try catch handling
 */
const { tryCatch } = require('../../../../../utils/tryCatch');

/**
 * @constant logRequest Default class for logging the current event
 */
const { logRequest, logResponse } = require('../../../../../utils/log');

/**
 * @constant responseMessages responseMessage constant variables
 */
const { responseMessages } = require('../../../../../constants/responseMessage');

/**
 * @constant responseCodes responseCodes constant variables
 */
const { responseCodes } = require('../../../../../constants/responseCodes');

/**
 * @constant InvalidRequestError Default class for handling invalid request
 */
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const indexService = require('../../services/index');
const employeePassportServices = require('../../services/employee/employeePassportService');
const { responseHandler } = require('../../../../responseHandler');
const { regexPatterns } = require('../../../../../constants/regexPatterns');
const { removeEmptyAndUndefinedKeys } = require('../../../../../helpers/globalHelper');

/**
 * Validation Rules For Store and Update
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, should exist in the 'employee' table (if not empty), employee_id should not have active passport.
 *    + 'document_number' (body), must not be empty, document number should not exist in employee_passport_details table for any other employee.
 *    + 'issued_country_id' (body), must not be empty.
 *    + 'status' (body), must not be empty.
 *    + 'valid_from' (body), must not be empty, valid_from should not be greater than valid_till.
 *    + 'valid_till' (body), must not be empty, valid_till should not be less thean valid_from.
 *    + 'documents' (body), must not be empty.
 *       - if new_document_id exist update the new document
 * */
async function validationRules(req) {
  let updateValidationRules = []

  if (req.body.id) {
    updateValidationRules = [
      check('id')
        .trim()
        .escape()
        .notEmpty()
        .withMessage(responseMessages.common.updateIdRequired)
        .custom(async (value) => {
          /** Check whether the id exist is employee_passport_details table */
          const empPassport = await indexService.find(
            'employee_passport_details',
            ['id', 'document_number'],
            { id: value }
          )
          if (!empPassport.status) {
            return Promise.reject(responseMessages.common.updateIdNotExist)
          }
          passport_details_id = empPassport.data[0].id
          req.body.document_number = empPassport.data[0].document_number
          return true
        }),
      check('documents.*.id')
        .trim()
        .escape()
        .custom(async (value) => {
          if (check(value).isInt() && value != null && value != '') {
            return indexService.find('employee_mapped_documents', ['id', 'referrable_type_id'], { id: value }).then((documentsData) => {
              if (documentsData.data[0].referrable_type_id !== passport_details_id) {
                return Promise.reject(responseMessages.employee.documents.noMatchDocument)
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
              let documentsData = await indexService.find('employee_mapped_documents', ['id', 'referrable_type_id'], { id: value }, null)
              if (!documentsData.status) {
                if (documentsData.data[0].referrable_type_id !== passport_details_id) {
                  return Promise.reject(responseMessages.employee.documents.noMatchDocument)
                }
              }
            } else {
              return Promise.reject(responseMessages.employee.documents.DeleteDocumentInvalid)
            }
          }
          return true
        })
    ];
  }

  const validationRules = [
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
      .withMessage(responseMessages.employee.employeeIdInvalid)
      .custom(async (value) => {
        /** Check if employee exist or not */
        const employee = await indexService.find(
          'employee',
          ['id', 'display_name', 'reference_id'],
          { id: value }
        )
        if (!employee.status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
        } else {
          if (req.body?.status == 1) {
            /** If employee exist check whether employe already had an active passport */
            const employeePassport = await indexService.find(
              'employee_passport_details',
              ['id', 'employee_id'],
              { employee_id: value, status: 1, employee_dependent_id: null }
            )

            if (employeePassport.status) {
              if (req.body.id) {
                if (employeePassport?.data[0]?.employee_id != value) {
                  return Promise.reject(responseMessages.employee.passportDetails.nomatchPassport)
                }
              } else {
                return Promise.reject(responseMessages.employee.passportDetails.employeePassport)
              }
            }
          }

          req.body.employee_name = employee.data[0].display_name
          req.body.employee_reference_id = employee.data[0].reference_id
          return true
        }
      }),
    check('valid_from')
      .trim()
      .custom((value) => {
        // If Value Exist then only perform valid_from validations
        if (value != '' && value != undefined && value != null) {
          var isDate = new Date(value)
          if (isNaN(isDate.getTime())) {
            return Promise.reject(responseMessages.employee.passportDetails.InvalidDateValidFrom)
          }
        }
        return true;
      }),
    check('valid_till')
      .trim()
      .custom((value) => {
        // If Value Exist then only perform valid_till validations
        if (value != '' && value != undefined && value != null) {
          var isDate = new Date(value)
          var validFrom = new Date(req.body.valid_from)
          if (isNaN(isDate.getTime())) {
            return Promise.reject(responseMessages.employee.passportDetails.InvalidDateValidTill)
          }

          // check valid till should be always greatee than valid from
          if ((isDate.getTime() < validFrom.getTime()) || (validFrom.toString() === 'Invalid Date')) {
            return Promise.reject(responseMessages.employee.passportDetails.InvalidDateValidTill)
          }
        }
        return true;
      }),
    check('document_number')
      .trim()
      .escape()
      .custom(async (value) => {
        if (value != '' && value != undefined && value != null) {

          // Passport document number alphanumeric Regex pattern validation
          let pattern = regexPatterns.alphanumericSpaceRegex;
          if (!pattern.test(value)) {
            return Promise.reject(responseMessages.employee.passportDetails.documentNumberInvalid);
          }

          // Passport document number check value if string and min 5 and max 18
          if (typeof value === 'string' && value?.length >= 8 && value?.length <= 12) {

          } else {
            return Promise.reject(responseMessages.employee.passportDetails.lengthInvalid);
          }

          // check whether the document exist for any other employee or not
          var documentData = await indexService.find('employee_passport_details', ['id'], { document_number: value })
          if (documentData.status) {
            if (!req.body.id) {
              return Promise.reject(responseMessages.employee.passportDetails.documentNumberAlreadyExists)
            } else {
              if (documentData.data[0].id !== Number(req.body.id)) {
                return Promise.reject(responseMessages.employee.passportDetails.documentNumberAlreadyExists)
              }
            }
          }
        } else {
          if (!req.body?.clear_all) {
            return Promise.reject(responseMessages.employee.passportDetails.documentNumber)
          }
        }
      }),
    check('status')
      .trim()
      .escape()
      .custom(value => {
        if (value != undefined && value != null && value != '') {
          if (!['0', '1', 0, 1].includes(value)) {
            return Promise.reject(responseMessages.employee.passportDetails.statusInvalid)
          }
        }
        return true;
      }),
    check('issued_country_id')
      .trim()
      .escape()
      .custom((value) => {
        if (value != '' && value != undefined && value != null) {
          if (check(value).isInt()) {
            return indexService
              .find('countries', ['id'], { id: value })
              .then((countryData) => {
                var status = countryData.status
                if (!status) {
                  return Promise.reject(responseMessages.employee.passportDetails.issuedCountryNotExist)
                }
              })
          } else {
            throw new InvalidRequestError(responseMessages.employee.passportDetails.issuedCountryInvalid)
          }
        } else {
          return true
        }
      }),
    check('documents')
      .optional()
      .isArray()
      .withMessage(responseMessages.employee.passportDetails.documentsNotArray)
      .custom(async docs => {

        if (docs.length > 1) {
          return Promise.reject(responseMessages.employee.documents.onlyOneDocumentAllowed)
        }

        await Promise.all(docs.map(async value => {
          const new_document_id = value.new_document_id;
          if (new_document_id != '' && new_document_id != undefined && new_document_id != null) {
            var pattern =
              regexPatterns.uuidRegex;
            if (pattern.test(new_document_id)) {

              var tableName = 'temp_upload_documents';
              condition = { id: new_document_id };
              if (value.slug == 'invite_via_link') {
                tableName = 'invited_employee_documents';
                condition = { ...condition, ...{ 'document_slug': value.document_slug } };
              }
              var documentsData = await indexService.find(
                tableName,
                ['id'],
                condition,
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
  ];
  /* Writing validation rules to the input request */
  return [...updateValidationRules, ...validationRules]
}

/**
 * store function to add the employee passport information.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'documentService.update' service function to modify employee's passport information.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `emergencyContactInfoService.update` service function to modify the employee's emergency contact information.
 *    + If Success:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with error message.
 * - If validation fails:
 *    + Add error validation to the response.
 * - Log the response.
 * - Return the response using `responseHandler()`.
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

  if (req.body.documents?.length > 0) {
    req.body.documents = req.body.documents.filter(obj => Object.values(obj).some(value => value !== ''));
  }

  // Store Data only when there are values to update excluding status
  if (req.body.issued_country_id || req.body.valid_from || req.body.valid_till || req.body.document_number || req.body.documents?.length > 0) {

    /* Log Request */
    logRequest('info', req, 'Store employee passport information')
    /* Log Request */

    /* Default Variable */
    var responseData
    /* Default Variable */

    var validations = await validationRules(req)

    /*Run the validation rules. */
    for (let validation of validations) {
      var result = await validation.run(req)
      if (result.errors.length) break
    }
    var errors = validationResult(req)
    /*Run the validation rules. */

    if (errors.isEmpty()) {
      var employee_data = await employeePassportServices.store(req.body)
      if (employee_data?.status) {
        responseData = {
          statusCode: responseCodes.codeSuccess,
          message: responseMessages.common.addedSuccessfully,
          data: employee_data.data
        }
      } else {
        responseData = {
          statusCode: responseCodes.codeInternalError,
          message: responseMessages.common.somethindWentWrong,
          error: employee_data.error
        }
      }

      /* Log Response */
      logResponse(
        'info',
        req,
        responseData,
        'Employee password information updated'
      )
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData)
      /* Return the response */
    } else {
      throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity)
    }
  } else {
    throw new InvalidRequestError(responseMessages.employee.passportDetails.invalidData);
  }
})


/**
 * update function to update the employee passport information.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'documentService.update' service function to modify employee's passport information.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `emergencyContactInfoService.update` service function to modify the employee's emergency contact information.
 *    + If Success:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with error message.
 * - If validation fails:
 *    + Add error validation to the response.
 * - Log the response.
 * - Return the response using `responseHandler()`.
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

  if (req.body.documents?.length > 0) {
    req.body.documents = req.body.documents.filter(obj => Object.values(obj).some(value => value !== ''));
  }

  /* Log Request */
  logRequest('info', req, 'update employee passport information')
  /* Log Request */

  /* Default Variable */
  var responseData
  /* Default Variable */

  req.body.id = req?.params?.id;
  // var condition = { id: req.body.id };
  var validations = await validationRules(req)

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  if (errors.isEmpty()) {
    if (req.body?.clear_all && req.body?.id) {
      var employee_data = await employeePassportServices.destroy(req.body, { id: req.body.id })
    } else {
      var employee_data = await employeePassportServices.store(req.body);
    }

    if (employee_data?.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.updatedSuccessfully,
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong,
        error: employee_data.error,
        // data: []
      }
    }

    /* Log Response */
    logResponse('info', req, responseData, "Employee password information updated");
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    );
  }
});

/**
 * Funtion used to validate the index request and seperate the body,pass to services and returns the response.
 *
 * @param {object} req
 * @param {object} res
 * @return Json
 * @throws InvalidRequestError
 */
const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'getting passport Details index request')
  /* Log Request */

  /* Default Variable */
  var responseData
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
      .custom((value) => {
        return indexService
          .find('employee', ['id'], { id: value })
          .then((passportData) => {
            if (!passportData.status) {
              return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotFound)
            }
          })
      })
  ]

  /*Run the validation rules. */
  for (var validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  /**
   * If validation is success
   *    + call the index service function
   *        - Based on the status in index function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    var employee_id = req.query.employee_id
    var condition = { 'employee_passport_details.employee_id': employee_id }
    if (req.query.id) {
      condition = { ...condition, ...{ id: req.query.id } }
    }
    var employee_sub_module = 6 /* Employee Passport activity */
    var passportData = await employeePassportServices.index(
      condition,
      employee_id,
      employee_sub_module
    )
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.success,
      data: passportData.data
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Employee Passport index Response.')
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
 * Destroy function is to delete an existing Employee passport record.
 *
 * Overview of Function
 * - Validate the request
 *   + If successful
 *     ~ Call the 'destroy' service function to delete an existing Employee passport record.
 *     ~ Prepare the response with success data
 *   + Else
 *     ~ Add error validation to the response
 * - Return the response
 *
 * Logic:
 * - Log the incoming request
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *   + 'request_id' (body), must not be empty.
 *   + 'employee_id' (body), must not be empty.
 *   + 'id' (params), must not be empty, should be an integer, and should exist in 'employee_passport_details' table.
 *
 * Run the validation rules.
 * If validation is successful:
 *   + Call the 'destroy' service function to delte an existingEmployee passport record.
 *   + If successful:
 *     - Prepare the response with success data.
 *   + Else:
 *     - Prepare the response with an error message.
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
const destroy = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Delete Passport Details request')
  /* Log Request */

  /* Default Variable */
  var responseData;
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
      .withMessage(responseMessages.employee.behalfOnboarding.invalidEmployeeId)
      .custom(async (value) => {
        const data = await indexService
          .find('employee', ['id', 'display_name', 'reference_id'], {
            id: value
          });
        if (!data.status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.invalidEmployeeId);
        }
        req.body.employee_name = data.data[0]?.display_name;
        req.body.reference_id = data.data[0]?.reference_id;
        return true;
      }),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.passportDetails.passportDetailsIdRequired)
      .isInt()
      .withMessage(responseMessages.employee.imigration.passportDetailsIdInvalid)
      .custom(async (value) => {
        var passportData = await indexService.find(
          'employee_passport_details',
          ['id'],
          { id: value }
        )
        if (!passportData?.status) {
          return Promise.reject(responseMessages.employee.passportDetails.IdInvalid)
        } else {
          passportData = await indexService.find(
            'employee_passport_details',
            ['id', 'document_number'],
            { id: value, employee_id: req.body.employee_id }
          )
          if (!passportData?.status) {
            return Promise.reject(responseMessages.employee.passportDetails.noMatchingDetailsPassport)
          } else {
            req.body.passport_number = passportData?.data[0]?.document_number
            return true
          }
        }
      })
  ];
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
   * + Delete  passport details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id }
    var empPassport = await employeePassportServices.destroy(
      req.body,
      condition
    )
    if (empPassport.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.deletedSuccessfully
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong,
        error: empPassport.error
      }
    }

    /* Log Response */
    logResponse(
      'info',
      req,
      responseData,
      'employee passport Detail delete Response'
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
});

/**
 * Destroy Document function to delete an employee passport document record.
 * 
 * Overview of function:
 * - Validate the request.
 *   + If successful
 *     ~ Call the 'deletedocument' service function to delete an Employee Passport Document record.
 *     ~ Prepare the response with success data.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *    + 'id' (params), must not be empty, should be a valid integer, and should exist in the 'employee_mapped_documents' table.
 * 
 * Run the validation rules.
 * If validation is successful:
 *    + Call the 'deleteDocument' service function to delete an Employee Passport Document record.
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
const destroyDocument = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Passport document delete request')
  /* Log Request */

  /* Default Variable */
  var responseData = ''
  /* Default Variable */

  /* Writing validation rules to the input request */
  let validations = [
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
        const employeeData = await indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: value });
        let employee = employeeData.status;
        if (!employee) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists);
        }
        req.body.employee_name = employeeData.data[0].display_name;
        req.body.employee_reference_id = employeeData.data[0].reference_id;
        return true;
      }),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.passportDetails.documentIdRequired)
      .isInt()
      .withMessage(responseMessages.employee.passportDetails.documentIdInvalid)
      .custom(async (value) => {
        let docData = await indexService.find('employee_mapped_documents', ['id'], { id: value, referrable_type: 6 });
        if (!docData.status) {
          return Promise.reject(responseMessages.employee.passportDetails.documentIdDoesNotExist);
        }
        return true;
      })
  ];
  /* Writing validation conditions to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    let result = await validation.run(req);
    if (result.errors.length) break;
  }
  let errors = validationResult(req);
  /*Run the validation rules. */

  /**
   * If validation is success
   * + Delete personal document details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id }
    await employeePassportServices.deleteDocument(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.deletedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'personal document delete Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }

});

module.exports = { store, update, index, destroy, destroyDocument }
