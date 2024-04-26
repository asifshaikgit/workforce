const { check, validationResult } = require('express-validator')
const { logRequest, logResponse } = require('../../../../../utils/log')
const { responseMessages } = require('../../../../../constants/responseMessage')
const { responseCodes } = require('../../../../../constants/responseCodes')
const { responseHandler } = require('../../../../responseHandler')
const employeeVisaService = require('../../services/employee/employeeVisaService')
const { tryCatch } = require('../../../../../utils/tryCatch')
const InvalidRequestError = require('../../../../../error/InvalidRequestError')
const indexServices = require('../../services/index')
const format = require('../../../../../helpers/format');
const moment = require('moment')
const { regexPatterns } = require('../../../../../constants/regexPatterns')


/**
 * Store function to create a new Employee Visa Details record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'store' service function to create a new Employee Visa Details record.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Retrieve the organization date format using `format.getDateFormat()`.
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Modify the 'valid_from' and 'valid_till' dates to 'YYYY-MM-DD' format using Moment.js and update the request.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *       ~ If the 'status' is 1(Active), it checks for the existence of an employee's visa record with status 0.
 *          - If such a record exists, it returns an error message indicating that a visa already exists.
 *       ~ Fetch the employee reference_id from 'employee' table and  sets the 'employee_reference_id' property in the request.
 *    + 'visa_type_id' (body), must not be empty, and should exist in the 'visa_types' table.
 *    + 'valid_from' (body), must not be empty and should be a valid date.
 *    + 'valid_till' (body), must not be empty and should be a valid date.
 *    + 'document_number' (body), must not be empty, and should only contain alphanumeric characters and spaces.
 *    + 'status' (body), must not be empty and should be either 0(Active) or 1(In-Active).
 *    + 'visa_document_upload_id' (body), must not be empty, should be a valid UUID, and should exist in the 'temp_upload_documents' table.
 *    + 'i9document_upload_id' (body), if not empty, should be a valid UUID, and should exist in the 'temp_upload_documents' table.
 *    + 'support_documents.*.visa_document_type_id' (body), if not empty, should be a valid integer and should exist in the 'visa_document_types' table.
 *    + 'support_documents.*.visa_document_upload_id' (body), if not empty, should be a valid UUID and should exist in the 'temp_upload_documents' table.
 *
 * Run the validation rules.
 * If validation is successful:
 *    + Call the 'store' service function to create a new Employee Visa Details record.
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

  if (req.body.support_documents?.length > 0) {
    req.body.support_documents = req.body.support_documents.filter(obj => Object.values(obj).some(value => value !== ''));
  }

  // Store Data only when there are values to update excluding status
  if (req.body.visa_type_id || req.body.valid_from || req.body.valid_till || req.body.support_documents?.length > 0) {

    let dateFormat = await format.getDateFormat(); // date format

    /* Log Request */
    logRequest('info', req, 'Employee visa details creation request')
    /* Log Request */

    /* Default Variable */
    var responseData = ''
    /* Default Variable */

    if (req.body.valid_from) {
      let modified_from_date = moment(req.body.valid_from, dateFormat).format('YYYY-MM-DD');
      req.body.valid_from = modified_from_date; // Modify the from_date property
    }

    if (req.body.valid_till) {
      let modified_to_date = req.body.valid_till != '' ? moment(req.body.valid_till, dateFormat).format('YYYY-MM-DD') : '';
      req.body.valid_till = modified_to_date; // Modify the to_date property
    }

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
        .custom(async (value) => {
          const employee = await indexServices.find('employee', ['reference_id'], { id: value })
          var employeeData = employee.status
          if (!employeeData) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
          } else {
            if (req.body.status && Number(req.body.status) === 0) {
              return indexServices.find('employee_visa_details', ['id'], { employee_id: value }).then((empVisaServiceData) => {
                if (empVisaServiceData.status) {
                  return Promise.reject(responseMessages.configurations.visaType.visaAlreadyExists)
                }
              })
            }
          }
          req.body.employee_reference_id = employee.data[0].reference_id
          return true
        }),
      check('visa_type_id')
        .trim()
        .escape()
        .custom(async (value) => {
          if (value != undefined && value != null && value != '') {
            const visaTypeServiceData = await indexServices.find('visa_types', ['id', 'name'], { id: value })
            if (!visaTypeServiceData.status) {
              return Promise.reject(responseMessages.configurations.visaType.IdNotExists)
            }
            req.body.visa_type_name = visaTypeServiceData.data[0].name
          } else {
            if (!req.body?.clear_all) {
              return Promise.reject(responseMessages.configurations.visaType.IdRequired)
            }
          }
          return true;
        }),
      check('valid_from')
        .trim()
        .custom(async (value) => {
          if (value != undefined && value != null && value != '') {
            let isDate = new Date(value);
            // Invalid date
            if (isNaN(isDate.getTime())) {
              return Promise.reject(responseMessages.employee.visaDetails.InvalidDateValidFrom);
            }
            // 'valid_from' should be always less than 'valid_till'
            if (isDate.getTime() > new Date(req.body.valid_till).getTime()) {
              return Promise.reject(responseMessages.employee.visaDetails.InvalidDateValidFrom);
            }

            if ((req.body.visa_type_id == '' || req.body.visa_type_id == null) && (req.body.support_documents.length > 0 ? (req.body.support_documents[0].visa_document_upload_id == '' || req.body.support_documents[0].visa_document_upload_id == null) : true)) {
              return Promise.reject(responseMessages.employee.visaDetails.cannotAcceptDates);
            }
          }
          return true;
        }),
      check('valid_till')
        .trim()
        .custom((value) => {
          if (value != undefined && value != null && value != '') {
            // In Valid Date
            let isDate = new Date(value);
            if (isNaN(isDate.getTime())) {
              return Promise.reject(responseMessages.employee.visaDetails.InvalidDateValidTill);
            }

            // 'valid_till' should always be greater than 'valid_from'
            if (isDate.getTime() < new Date(req.body.valid_from).getTime() || new Date(req.body.valid_from) === 'Invalid Date') {
              return Promise.reject(responseMessages.employee.visaDetails.InvalidDateValidTill);
            }

            if ((req.body.visa_type_id == '' || req.body.visa_type_id == null) && (req.body.support_documents.length > 0 ? (req.body.support_documents[0].visa_document_upload_id == '' || req.body.support_documents[0].visa_document_upload_id == null) : true)) {
              return Promise.reject(responseMessages.employee.visaDetails.cannotAcceptDates);
            }
          }
          return true;
        }),
      check('support_documents')
        .optional()
        .isArray()
        .withMessage(responseMessages.employee.passportDetails.documentsNotArray)
        .custom(async docs => {

          if (docs.length > 10) {
            return Promise.reject(responseMessages.employee.visaDetails.maxTenFilesOnly)
          }

          await Promise.all(docs.map(async value => {
            const new_document_id = value.visa_document_upload_id;
            if (new_document_id != '' && new_document_id != undefined && new_document_id != null) {
              var pattern =
                regexPatterns.uuidRegex
              if (pattern.test(new_document_id)) {

                var tableName = 'temp_upload_documents';
                if (value.slug == 'invite_via_link') {
                  tableName = 'invited_employee_documents';
                }
                var documentsData = await indexServices.find(
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

    /**
     * If validation is success
     *    + Call the store service function
     *        - Based on the status in store function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
     */
    if (errors.isEmpty()) {
      var employeeVisa = await employeeVisaService.store(req.body)
      if (employeeVisa.status) {
        responseData = {
          statusCode: responseCodes.codeSuccess,
          message: responseMessages.common.addedSuccessfully,
          data: employeeVisa.data
        }
      } else {
        responseData = {
          statusCode: responseCodes.codeInternalError,
          message: responseMessages.common.somethindWentWrong,
          error: employeeVisa.error
        }
      }
      /* Log Response */
      logResponse('info', req, responseData, 'employee Visa Detail store response')
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData)
      /* Return the response */
    } else {
      throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity)
    }
  } else {
    throw new InvalidRequestError(
      responseMessages.employee.visaDetails.invalidData
    );
  }
});

/**
 * Update function to modify an existing Employee Visa Details record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'update' service function to modify the Employee Visa Details record.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Retrieve the organization date format using `format.getDateFormat()`.
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Modify the 'valid_from' and 'valid_till' dates to 'YYYY-MM-DD' format using Moment.js and update the request.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *       ~ If the 'status' is 1 (Active), it checks for the existence of an employee's visa record with status 0.
 *          - If such a record exists and it's not the same as the one being updated, it returns an error message indicating that a visa already exists.
 *       ~ Fetch the employee reference_id from the 'employee' table and set the 'employee_reference_id' property in the request.
 *    + 'id' (params), must not be empty, should be an integer, and should exist in the 'employee_visa_details' table.
 *    + 'visa_type_id' (body), must not be empty, and should exist in the 'visa_types' table.
 *    + 'valid_from' (body), must not be empty and should be a valid date.
 *    + 'valid_till' (body), must not be empty and should be a valid date.
 *    + 'document_number' (body), must not be empty, and should only contain alphanumeric characters and spaces.
 *    + 'status' (body), must not be empty and should be either 1 (Active) or 0 (Inactive).
 *    + 'visa_document_name' (body), must not be empty.
 *    + 'visa_document_upload_id' (body), if not empty, should be a valid UUID and should exist in the 'temp_upload_documents' table.
 *    + 'i9document_upload_id' (body), if not empty, should be a valid UUID and should exist in the 'temp_upload_documents' table.
 *    + 'support_documents.*.id' (body), if not empty, should be an integer and should exist in the 'employee_visa_detail_documents' table.
 *    + 'support_documents.*.visa_document_type_id' (body), if not empty, should be a valid integer and should exist in the 'visa_document_types' table.
 *    + 'support_documents.*.new_visa_document_upload_id' (body), if not empty, should be a valid UUID and should exist in the 'temp_upload_documents' table.
 *
 * Run the validation rules.
 * If validation is successful:
 *    + Call the 'update' service function to modify the Employee Visa Details record.
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

  if (req.body.support_documents?.length > 0) {
    req.body.support_documents = req.body.support_documents.filter(obj => Object.values(obj).some(value => value !== ''));
  }
  let dateFormat = await format.getDateFormat(); // date format

  /* Log Request */
  logRequest('info', req, 'update employee visa request.')
  /* Log Request */

  /* Default Variable */
  var responseData = ''
  /* Default Variable */

  if (req.body.valid_from) {
    let modified_from_date = moment(req.body.valid_from, dateFormat).format('YYYY-MM-DD');
    req.body.valid_from = modified_from_date; // Modify the from_date property
  }

  if (req.body.valid_till) {
    let modified_to_date = req.body.valid_till != '' ? moment(req.body.valid_till, dateFormat).format('YYYY-MM-DD') : '';
    req.body.valid_till = modified_to_date; // Modify the to_date property
  }

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
      .custom(async (value) => {
        const employee = await indexServices.find('employee', ['reference_id'], { id: value })
        if (!employee.status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
        } else {
          if (req.body.status && Number(req.body.status) === 0) {
            return indexServices.find('employee_visa_details', ['id'], { employee_id: value }).then((empVisaServiceData) => {
              if (empVisaServiceData.status) {
                if (empVisaServiceData.data[0].id != req.params.id) {
                  return Promise.reject(responseMessages.configurations.visaType.visaAlreadyExists)
                }
              }
            })
          }
        }
        req.body.employee_reference_id = employee.data[0].reference_id
        return true
      }),
    check('id')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.visaDetails.IdRequired)
      .isInt()
      .withMessage(responseMessages.employee.visaDetails.IdInvalid)
      .custom(async (value) => {
        var visaData = await indexServices.find('employee_visa_details', ['id'], { id: value })
        if (!visaData.status) {
          return Promise.reject(responseMessages.employee.visaDetails.IdNotExists)
        } else {
          const joins = [
            { table: 'visa_types', condition: ['employee_visa_details.visa_type_id', 'visa_types.id'], type: 'left' },
          ];
          visaData = await indexServices.find('employee_visa_details', ['employee_visa_details.id', 'employee_visa_details.document_number', 'visa_types.name'], { 'employee_visa_details.id': value, 'employee_visa_details.employee_id': req.body.employee_id }, null, joins)
          if (!visaData.status) {
            return Promise.reject(responseMessages.employee.visaDetails.noMatchingDetailsVisa)
          }
          req.body.document_number = visaData.data[0].document_number
          req.body.visa_type_name = visaData.data[0].name
        }
      }),
    check('visa_type_id')
      .trim()
      .escape()
      .custom(async (value) => {

        if (value != undefined && value != null && value != '') {
          const visaTypeServiceData = await indexServices.find('visa_types', ['id', 'name'], { id: value })
          var status = visaTypeServiceData.status
          if (!status) {
            return Promise.reject(responseMessages.configurations.visaType.IdNotExists)
          }
          req.body.visa_type_name = visaTypeServiceData.data[0].name
        } else {
          if (!req.body?.clear_all) {
            return Promise.reject(responseMessages.configurations.visaType.IdRequired)
          }
        }
        return true;
      }),
    check('valid_from')
      .trim()
      .custom(async (value) => {

        if (value != undefined && value != null && value != '') {
          let isDate = new Date(value);
          // Invalid date
          if (isNaN(isDate.getTime())) {
            return Promise.reject(responseMessages.employee.visaDetails.InvalidDateValidFrom);
          }
          // 'valid_from' should be always less than 'valid_till'
          if (isDate.getTime() > new Date(req.body.valid_till).getTime()) {
            return Promise.reject(responseMessages.employee.visaDetails.InvalidDateValidFrom);
          }

          if ((req.body.visa_type_id == '' || req.body.visa_type_id == null) && (req.body.support_documents.length > 0 ? (req.body.support_documents[0].visa_document_upload_id == '' || req.body.support_documents[0].visa_document_upload_id == null || req.body.support_documents[0].id == '' || req.body.support_documents[0].id == null) : true)) {
            return Promise.reject(responseMessages.employee.visaDetails.cannotAcceptDates);
          }
        }
        return true;
      }),
    check('valid_till')
      .trim()
      .custom((value) => {

        if (value != undefined && value != null && value != '') {

          // In Valid Date
          let isDate = new Date(value);
          if (isNaN(isDate.getTime())) {
            return Promise.reject(responseMessages.employee.visaDetails.InvalidDateValidTill);
          }

          // 'valid_till' should always be greater than 'valid_from'
          if (isDate.getTime() < new Date(req.body.valid_from).getTime() || new Date(req.body.valid_from) === 'Invalid Date') {
            return Promise.reject(responseMessages.employee.visaDetails.InvalidDateValidTill);
          }

          if ((req.body.visa_type_id == '' || req.body.visa_type_id == null) && (req.body.support_documents.length > 0 ? (req.body.support_documents[0].visa_document_upload_id == '' || req.body.support_documents[0].visa_document_upload_id == null || req.body.support_documents[0].id == '' || req.body.support_documents[0].id == null) : true)) {
            return Promise.reject(responseMessages.employee.visaDetails.cannotAcceptDates);
          }
        }
        return true;
      }),

    check('support_documents').isArray({ max: 10 }).withMessage(responseMessages.employee.visaDetails.maxTenFilesOnly),
    check('support_documents.*.id')
      .trim()
      .escape()
      .custom(async (value) => {
        if (value != '' && value != null) {
          if (isNaN(value)) {
            return Promise.reject(responseMessages.employee.documents.DeleteI9DocumentInvalid)
          } else {
            let documentsData = await indexServices.find('employee_visa_detail_documents', ['id'], { id: value })
            if (!documentsData.status) {
              return Promise.reject(responseMessages.employee.documents.documentIdInvalid)
            }
          }
        }
        return true
      }),
    check('support_documents.*.visa_document_upload_id')
      .trim()
      .escape()
      .custom(async (value) => {
        if (value != null && value != '') {
          var pattern = regexPatterns.uuidRegex;
          if (pattern.test(value)) {
            var documentsData = await indexServices.find('temp_upload_documents', ['id'], { id: value }, null, [], null, null, null, false)
            if (!documentsData.status) {
              return Promise.reject(responseMessages.employee.visaDetails.supportVisaDocumentUploadIdNotExists)
            }
          } else {
            return Promise.reject(responseMessages.employee.visaDetails.supportVisaDocumentUploadIdInvalid)
          }
        }
        return true
      }),
    check('support_documents_deleted_ids.*')
      .trim()
      .escape()
      .custom(async (value) => {
        if (value != '') {
          var pattern = /^[0-9]*$/;
          if (pattern.test(value)) {
            let documentsData = await indexServices.find('employee_visa_detail_documents', ['id'], { id: value }, null)
            if (!documentsData.status) {
              return Promise.reject(
                responseMessages.employee.documents.DeleteDocumentInvalid
              )
            }
          } else {
            return Promise.reject(
              responseMessages.employee.documents.DeleteDocumentInvalid
            )
          }
        }
        return true
      })
  ];
  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (var validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  let x = req.body.support_documents.length > 0 ? (req.body.support_documents[0].visa_document_upload_id == '' || req.body.support_documents[0].visa_document_upload_id == null || req.body.support_documents[0].id == '' || req.body.support_documents[0].id == null) : true;

  let y = req.body.visa_type_id == '' || req.body.visa_type_id == null

  /**
   * If validation is success
   *    + call the update service function
   *        - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id }
    let visaData;
    if (req.body?.clear_all) {
      visaData = await employeeVisaService.destroy(req.body, condition);
    } else {
      visaData = await employeeVisaService.update(req.body, condition)
    }
    if (visaData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully }
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: visaData.error
      }
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Update Visa Type Response.')
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity)
  }
});

/**
 * Index function to retrieve a list of Employee Visa Details records based on the provided employee_id.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'index' service function to retrieve Employee Visa Details records.
 *      ~ Prepare the response with the retrieved data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'id' (query), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *
 * Run the validation rules.
 * If validation is successful:
 *    + Call the 'index' service function to retrieve Employee Visa Details records.
 *    + If successful:
 *      - Prepare the response with the retrieved data.
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
const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, "getting visa details index request");
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
    check('employee_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdRequired)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async value => {
        const employeeDetailsData = await indexServices.find('employee', ['id'], { id: value })
        var status = employeeDetailsData.status
        if (!status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotFound)
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

  /**
   * If validation is success
   *    + call the index service function
   *        - Based on the status in index function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
  */
  if (errors.isEmpty()) {
    var condition = { 'employee_visa_details.employee_id': req.query.employee_id };
    var visaDetailsData = await employeeVisaService.index(condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: visaDetailsData.data }

    /* Log Response */
    logResponse("info", req, responseData, "visa details index Response.");
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */

  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity,);
  }
});

/**
 * destroyDocument function to delete an Employee Visa Document record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'deleteDocument' service function to delete an Employee Visa Document record.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *    + 'id' (params), must not be empty, should be a valid integer, and should exist in the 'employee_visa_detail_documents' table.
 *
 * Run the validation rules.
 * If validation is successful:
 *    + Call the 'deleteDocument' service function to delete an Employee Visa Document record.
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
        const employee = await indexServices.find('employee', ['id', 'reference_id'], { id: value })
        if (!employee.status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
        }
        req.body.employee_reference_id = employee.data[0].reference_id
        return true
      }),
    check('visa_details_id')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.visaDetails.IdRequired)
      .isInt()
      .withMessage(responseMessages.employee.visaDetails.IdInvalid)
      .custom(async (value) => {
        var visaData = await indexServices.find('employee_visa_details', ['id'], { id: value })
        if (!visaData.status) {
          return Promise.reject(responseMessages.employee.visaDetails.IdNotExists)
        } else {
          visaData = await indexServices.find('employee_visa_details', ['id'], { id: value, employee_id: req.body.employee_id })
          if (!visaData.status) {
            return Promise.reject(responseMessages.employee.visaDetails.noMatchingDetailsVisa)
          }
        }
      }),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.visaDetails.documentIdRequired)
      .isInt()
      .withMessage(responseMessages.employee.visaDetails.documentIdInvalid)
      .custom(async (value) => {
        const join = [
          { table: 'employee_visa_details', condition: ['employee_visa_detail_documents.employee_visa_details_id', 'employee_visa_details.id'], type: 'left' },
          { table: 'visa_types', condition: ['employee_visa_details.visa_type_id', 'visa_types.id'], type: 'left' },
        ];
        const fileds = ['employee_visa_detail_documents.id', 'employee_visa_detail_documents.employee_visa_details_id', 'visa_types.name as visa_type_name']
        var docData = await indexServices.find('employee_visa_detail_documents', fileds, { 'employee_visa_detail_documents.id': value }, null, join)
        if (!docData.status) {
          return Promise.reject(responseMessages.employee.visaDetails.documentIdDoesNotExist)
        }
        req.body.visa_type_name = docData.data[0].visa_type_name
        req.body.employee_visa_details_id = docData.data[0].employee_visa_details_id
        req.body.visa_document_type_name = docData.data[0].name
        return true
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
    await employeeVisaService.deleteDocument(req.body, condition)
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.deletedSuccessfully
    }

    /* Log Response */
    logResponse('info', req, responseData, 'visa document delete Response')
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */

  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity)
  }
});

/**
 * Destroy function to delete an Employee Visa Detail record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'destroy' service function to delete an Employee Visa Detail record.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *    + 'id' (params), must not be empty, should be a valid integer, and should exist in the 'employee_visa_details' table.
 *       ~ It also fetches 'visa_type_name' and 'document_number' from the 'employee_visa_details' and 'visa_types' tables and stores them in the request for further use.
 *
 * Run the validation rules.
 * If validation is successful:
 *    + Call the 'destroy' service function to delete an Employee Visa Detail record.
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
const destroy = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Delete employee Visa Detail request')
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
        const employee = await indexServices.find('employee', ['id', 'reference_id'], { id: value })
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
      .withMessage(responseMessages.employee.visaDetails.IdRequired)
      .isInt()
      .withMessage(responseMessages.employee.visaDetails.IdInvalid)
      .custom(async (value) => {
        var visaData = await indexServices.find('employee_visa_details', ['id'], { id: value })
        if (!visaData.status) {
          return Promise.reject(responseMessages.employee.visaDetails.IdNotExists)
        } else {
          const joins = [
            { table: 'visa_types', condition: ['employee_visa_details.visa_type_id', 'visa_types.id'], type: 'left' },
          ];
          visaData = await indexServices.find('employee_visa_details', ['employee_visa_details.id', 'employee_visa_details.document_number', 'visa_types.name'], { 'employee_visa_details.id': value, 'employee_visa_details.employee_id': req.body.employee_id }, null, joins)
          if (!visaData.status) {
            return Promise.reject(responseMessages.employee.visaDetails.noMatchingDetailsVisa)
          }
          req.body.document_number = visaData.data[0].document_number
          req.body.visa_type_name = visaData.data[0].name
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
   * + Delete  Visa details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id }
    await employeeVisaService.destroy(req.body, condition)
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.deletedSuccessfully
    }

    /* Log Response */
    logResponse('info', req, responseData, 'employee Visa Detail delete Response')
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = { destroy, index, store, update, destroyDocument }
