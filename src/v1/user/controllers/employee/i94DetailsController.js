const { check, validationResult } = require('express-validator')
const { logRequest, logResponse } = require('../../../../../utils/log')
const { responseMessages } = require('../../../../../constants/responseMessage')
const { responseCodes } = require('../../../../../constants/responseCodes')
const { responseHandler } = require('../../../../responseHandler')
const employeeI94Service = require('../../services/employee/i94DetailsService')
const { tryCatch } = require('../../../../../utils/tryCatch')
const InvalidRequestError = require('../../../../../error/InvalidRequestError')
const indexService = require('../../services/index');
const format = require('../../../../../helpers/format');
const moment = require('moment')
const { regexPatterns } = require('../../../../../constants/regexPatterns')


/**
 * Store function to create a new Employee I-94 record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'store' service function to create a new Employee I-94 record.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Retrieve the organization date format using `format.getDateFormat()`.
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Modify the 'valid_from' and 'valid_till' dates to 'YYYY-MM-DD' format using Moment.js and update the request.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *    + 'document_number' (body), must not be empty, should contain only alphanumeric characters, and should not already exist in the 'employee_i94_details' table.
 *    + 'country_id' (body), must not be empty, and should exist in 'countries' table.
 *    + 'valid_from' (body) must not be empty and should be a valid date.
 *    + 'status' (body), must not be empty, should be either 0 or 1.
 *    + 'expiry_type' (body), must not be empty, should be either 1 or 2.
 *    + 'valid_till' (body), if 'expiry_type' is 2, must not be empty and should be a valid date.
 *    + 'documents.*.new_document_id' (body), must not be empty, should be a valid UUID, and should exist in the 'temp_upload_documents' table.
 *
 * Run the validation rules.
 * If validation is successful:
 *    + Call the 'store' service function to create a new Employee I-94 record.
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

  if (req.body.documents?.length > 0) {
    req.body.documents = req.body.documents.filter(obj => Object.values(obj).some(value => value !== ''));
  }

  // Store Data only when there are values to update excluding status
  if (req.body.country_id || req.body.valid_from || req.body.expiry_type || req.body.valid_till || req.body.document_number || req.body.documents?.length > 0) {

    let dateFormat = await format.getDateFormat(); // date format

    /* Log Request */
    logRequest('info', req, 'Employee i94 creation request')
    /* Log Request */

    /* Default Variable */
    var responseData = ''
    /* Default Variable */

    if (req.body.valid_from != '' && req.body.valid_from != null && req.body.valid_from != undefined) {
      let modified_from_date = moment(req.body.valid_from, dateFormat).format('YYYY-MM-DD');
      req.body.valid_from = modified_from_date; // Modify the from_date property
    }

    if (req.body.valid_till != '' && req.body.valid_till != null && req.body.valid_till != undefined) {
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
        .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
        .isUUID()
        .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
        .custom(async (value) => {
          const employee = await indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: value })
          var employeeData = employee.status
          if (!employeeData) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
          } else {
            const employee = await indexService.find('employee_i94_details', ['id'], { employee_id: value, status: 1, employee_dependent_id: null })
            var employeeData = employee.status
            if (employeeData) {
              if (Number(req.body.status) == 1) {
                return Promise.reject(responseMessages.employee.i94Details.employeeI94)
              }
            }
          }
          req.body.employee_name = employee.data[0].display_name
          req.body.employee_reference_id = employee.data[0].reference_id
          return true
        }),
      check('document_number')
        .trim()
        .escape()
        .custom(async (value) => {
          // If document number value exit then only check for validations
          if (value != '' && value != undefined && value != null) {

            // i94 document number alphanumeric Regex pattern validation
            let pattern = regexPatterns.documentPatterns?.i94DocumentNumber;
            if (!pattern.test(value)) {
              return Promise.reject(responseMessages.employee.i94Details.documentNumberInvalid);
            }

            var documentData = await indexService.find('employee_i94_details', ['id'], { document_number: value })
            if (documentData.status) {
              return Promise.reject(responseMessages.employee.i94Details.documentNumberAlreadyExists)
            }
          } else {
            if (!req.body?.clear_all) {
              return Promise.reject(responseMessages.employee.i94Details.documentNumberRequired)
            }
          }
          return true;
        }),
      check('country_id')
        .trim()
        .escape()
        .custom(async (value) => {

          if (value != '' && value != undefined && value != null) {
            const contactData = await indexService.find('countries', ['id'], { id: value })
            if (!contactData.status) {
              return Promise.reject(responseMessages.configurations.country.IdNotExists)
            }
          }
          return true;
        }),
      check('valid_from')
        .trim()
        .custom((value) => {

          if (value != '' && value != undefined && value != null) {

            var isDate = new Date(value);
            if (isNaN(isDate.getTime())) {
              return Promise.reject(responseMessages.employee.i94Details.InvalidDateValidFrom);
            }
            // 'valid_from' should be always less than 'valid_till'
            if (isDate.getTime() > new Date(req.body.valid_till).getTime()) {
              return Promise.reject(responseMessages.employee.visaDetails.InvalidDateValidFrom);
            }
          }
          return true;
        }),
      check('status')
        .trim()
        .escape()
        .custom(value => {
          if (value != '' && value != undefined && value != null) {

            // '1 - Active, 0 - Expired'
            if (value >= 0 && value <= 1) {
              return true;
            } else {
              return Promise.reject(responseMessages.employee.i94Details.statusInvalid);
            }
          }
          return true;
        }),
      check('expiry_type')
        .trim()
        .escape()
        .custom(value => {
          if (value != '' && value != undefined && value != null) {

            //'1 - D/S or Duration of Status and 2 - has expirty date'
            if (value >= 1 && value <= 2) {

            } else {
              return Promise.reject(responseMessages.employee.i94Details.expiryTypeShouldBe);
            }
          }
          return true;
        }),
      check('valid_till')
        .trim()
        .custom((value) => {
          if (req.body.expiry_type == 2) {
            if (value === '' || value === null) {
              return Promise.reject(responseMessages.employee.i94Details.validTillRequired);
            } else {
              var regex = regexPatterns.dateRegex;
              if (!regex.test(value)) {
                return Promise.reject(responseMessages.employee.i94Details.InvalidDateValidTill);
              }
              // 'valid_till' should always be greater than 'valid_from'
              if (isDate.getTime() < new Date(req.body.valid_from).getTime() || new Date(req.body.valid_from) === 'Invalid Date') {
                return Promise.reject(responseMessages.employee.visaDetails.InvalidDateValidTill);
              }
              return true
            }
          }
          return true
        }),
      check('documents')
        .optional()
        .isArray()
        .withMessage(responseMessages.employee.i94Details.documentsNotArray)
        .custom(async docs => {

          if (docs.length > 1) {
            return Promise.reject(responseMessages.employee.documents.onlyOneDocumentAllowed)
          }

          await Promise.all(docs.map(async value => {
            const new_document_id = value.new_document_id;
            if (new_document_id != '' && new_document_id != undefined && new_document_id != null) {
              var pattern =
                regexPatterns.uuidRegex
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

    /*Run the validation rules. */
    for (let validation of validations) {
      var result = await validation.run(req)
      if (result.errors.length) break
    }
    var errors = validationResult(req)
    /*Run the validation rules. */

    /**
     * If validation is success
     *    + Call the createTenant service function
     *        - Based on the status in createTenant function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
     */
    if (errors.isEmpty()) {
      var employeeI94 = await employeeI94Service.store(req.body)
      if (employeeI94.status) {
        responseData = {
          statusCode: responseCodes.codeSuccess,
          message: responseMessages.common.addedSuccessfully,
          data: employeeI94.data
        }
      } else {
        responseData = {
          statusCode: responseCodes.codeInternalError,
          message: responseMessages.common.somethindWentWrong,
          error: employeeI94.error
        }
      }
      /* Log Response */
      logResponse(
        'info',
        req,
        responseData,
        'employee i94 Detail store response'
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
  } else {
    throw new InvalidRequestError(responseMessages.employee.i94Details.invalidData);
  }
});

/**
 * Update function to modify an existing Employee I-94 record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'update' service function to modify an existing Employee I-94 record.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Retrieve the organization date format using `format.getDateFormat()`.
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Modify the 'valid_from' and 'valid_till' dates to 'YYYY-MM-DD' format using Moment.js and update the request.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *    + 'id' (params), must not be empty, should be an integer, and should exist in the 'employee_i94_details' table.
 *    + 'country_id' (body), must not be empty and should exist in the 'countries' table.
 *    + 'valid_from' (body) must not be empty and should be a valid date.
 *    + 'status' (body), must not be empty and should be a boolean (0 or 1).
 *    + 'expiry_type' (body), must not be empty and should be either 1 or 2.
 *    + 'valid_till' (body), if 'expiry_type' is 2, must not be empty and should be a valid date.
 *    + 'document_number' (body), must not be empty, should contain only alphanumeric characters, and should not already exist in the 'employee_i94_details' table.
 *    + 'documents.*.new_document_id' (body), must not be empty, should be a valid UUID, and should exist in the 'temp_upload_documents' table.
 *    + 'documents.*.id' (body), must not be empty, should be an integer, and should exist in the 'employee_mapped_documents' table.
 *
 * Run the validation rules.
 * If validation is successful:
 *    + Call the 'update' service function to modify an existing Employee I-94 record.
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

  if (req.body.documents?.length > 0) {
    req.body.documents = req.body.documents.filter(obj => Object.values(obj).some(value => value !== ''));
  }
  let dateFormat = await format.getDateFormat(); // date format

  /* Log Request */
  logRequest('info', req, 'update i94 details request.')
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
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdRequired)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async (value) => {

        // Check Employee Exist or not
        const employee = await indexService.find('employee', ['*'], { id: value });
        var employeeData = employee.status
        if (!employeeData) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
        } else {
          const employeei94 = await indexService.find('employee_i94_details', ['id'], { employee_id: value, status: 1, employee_dependent_id: null })
          var employeeData = employeei94.status
          if (employeeData) {
            if (Number(employeei94.data[0]?.id) != Number(req.body.id)) {
              if (Number(req.body.status) === 1) {
                return Promise.reject(responseMessages.employee.i94Details.employeeI94)
              }
            }
          }
        }
        req.body.employee_name = employee.data[0].display_name
        req.body.employee_reference_id = employee.data[0].reference_id
        return true;
      }),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.i94Details.i94DetailsIdRequired)
      .isInt()
      .withMessage(responseMessages.employee.i94Details.I94DetailsIdInvalid)
      .custom(async (value) => {
        var empi94Data = await indexService.find('employee_i94_details', ['id', 'document_number'], { id: value })
        if (!empi94Data.status) {
          return Promise.reject(responseMessages.employee.i94Details.i94DetailsIdNotFound)
        } else {
          empi94Data = await indexService.find('employee_i94_details', ['id', 'document_number'], { id: value, employee_id: req.body.employee_id })
          if (!empi94Data.status) {
            return Promise.reject(responseMessages.employee.i94Details.noMatchingDetailsi94)
          }
          req.body.document_number = empi94Data?.data[0]?.document_number;
        }
      }),
    check('country_id')
      .trim()
      .escape()
      .custom(async (value) => {

        if (value != '' && value != undefined && value != null) {
          const contactData = await indexService.find('countries', ['id'], { id: value })
          if (!contactData.status) {
            return Promise.reject(responseMessages.configurations.country.IdNotExists)
          }
        }
        return true;
      }),
    check('valid_from')
      .trim()
      .custom((value) => {
        if (value != '' && value != undefined && value != null) {
          var isDate = new Date(value);
          var validTill = new Date(req.body.valid_till)
          if (isNaN(isDate.getTime())) {
            return Promise.reject(responseMessages.employee.i94Details.InvalidDateValidFrom);
          }
          // 'valid_from' should be always less than 'valid_till'
          if (isDate.getTime() > validTill.getTime()) {
            return Promise.reject(responseMessages.employee.visaDetails.InvalidDateValidFrom);
          }
        }
        return true;
      }),
    check('expiry_type')
      .trim()
      .escape()
      .custom(value => {
        if (value != '' && value != undefined && value != null) {

          //'1 - D/S or Duration of Status and 2 - has expirty date'
          if (value >= 1 && value <= 2) {

          } else {
            return Promise.reject(responseMessages.employee.i94Details.expiryTypeShouldBe);
          }
        }
        return true;
      }),
    check('valid_till')
      .trim()
      .custom((value) => {
        if (value != '' && value != undefined && value != null) {
          var isDate = new Date(value);
          var validFrom = new Date(req.body.valid_from)
          var regex = regexPatterns.dateRegex;
          if (!regex.test(value)) {
            return Promise.reject(responseMessages.employee.i94Details.InvalidDateValidTill);
          }
          // 'valid_till' should always be greater than 'valid_from'
          if (isDate.getTime() < validFrom.getTime() || new Date(req.body.valid_from) === 'Invalid Date') {
            return Promise.reject(responseMessages.employee.visaDetails.InvalidDateValidTill);
          }
        }
        return true
      }),
    check('document_number')
      .trim()
      .escape()
      .custom(async (value) => {

        // If document number value exit then only check for validations
        if (value != '' && value != undefined && value != null) {

          // i94 document number alphanumeric Regex pattern validation
          let pattern = regexPatterns.documentPatterns?.i94DocumentNumber;
          if (!pattern.test(value)) {
            return Promise.reject(responseMessages.employee.i94Details.documentNumberInvalid);
          }

          var documentData = await indexService.find('employee_i94_details', ['id'], { document_number: value, global_search: `employee_id != '${req.body.employee_id}'` });
          if (documentData.status) {
            if (documentData.data[0].id !== Number(req.params.id)) {
              return Promise.reject(responseMessages.employee.i94Details.documentNumberAlreadyExists)
            }
          }
        } else {
          if (!req.body?.clear_all) {
            return Promise.reject(responseMessages.employee.i94Details.documentNumberRequired)
          }
        }
        return true;
      }),
    check('status')
      .trim()
      .escape()
      .custom(value => {
        if (value != '' && value != undefined && value != null) {

          // '1 - Active, 0 - Expired'
          if (value >= 0 && value <= 1) {
            return true;
          } else {
            return Promise.reject(responseMessages.employee.i94Details.statusInvalid);
          }
        }
        return true;
      }),
    check('documents.*.new_document_id')
      .trim()
      .escape()
      .custom(async (value) => {
        if (value != null && value != undefined && value != '') {
          var pattern = regexPatterns.uuidRegex;
          if (pattern.test(value)) {
            return await indexService.find('temp_upload_documents', ['*'], { id: value }, null, [], null, null, null, false).then((documentsData) => {
              if (!documentsData.status) {
                return Promise.reject(responseMessages.employee.documents.newDocumentIdNotExists)
              }
            })
          } else {
            return Promise.reject(responseMessages.employee.documents.newDocumentIdInvalid)
          }
        }
        return true;
      }),
    check('documents.*.id')
      .trim()
      .escape()
      .custom(async (value) => {
        if (value != undefined && value != null && value != '') {

          return await indexService.find('employee_mapped_documents', ['id'], { id: value }).then((documentsData) => {
            if (!documentsData.status) {
              return Promise.reject(responseMessages.employee.documents.documenIdNoExists)
            }
            return true
          })
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

  /**
   * If validation is success
   *    + call the update service function
   *        - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id }
    let employeeI94;
    if (req.body?.clear_all) {
      employeeI94 = await employeeI94Service.destroy(req.body, condition);
    } else {
      employeeI94 = await employeeI94Service.update(req.body, condition);
    }
    if (employeeI94.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.updatedSuccessfully
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong,
        error: employeeI94.error
      }
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Update i94 Type Response.')
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
 * Index function to retrieve a list of Employee I-94 records.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'index' service function to retrieve a list of Employee I-94 records.
 *      ~ Prepare the response with the retrieved data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'id' (query), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *
 * Run the validation rules.
 * If validation is successful:
 *    + Call the 'index' service function to retrieve a list of Employee I-94 records.
 *    + Prepare the response with the retrieved data.
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
  logRequest('info', req, "getting i94 Details index request");
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
      .custom(async (value) => {
        const i94DetailsData = await indexService.find('employee', ['id'], { id: value })
        var status = i94DetailsData.status
        if (!status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotFound)
        }
      }),
  ];

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
    var condition = { 'employee_i94_details.employee_id': req.query.id, 'employee_i94_details.employee_dependent_id': null };
    var i94DetailsData = await employeeI94Service.index(condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: i94DetailsData.data }

    /* Log Response */
    logResponse("info", req, responseData, "i94 Details index Response.");
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */

  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity,);
  }
});

/**
 * Destroy function to delete an existing Employee I-94 record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'destroy' service function to delete an existing Employee I-94 record.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *    + 'id' (params), must not be empty, should be an integer, and should exist in the 'employee_i94_details' table.
 *
 * Run the validation rules.
 * If validation is successful:
 *    + Call the 'destroy' service function to delete an existing Employee I-94 record.
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
  logRequest('info', req, 'Delete i94  Details request')
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
      .withMessage(responseMessages.employee.behalfOnboarding.invalidEmployeeId)
      .custom((value) => {
        return indexService.find('employee', ['id', 'reference_id'], { id: value }).then((data) => {
          if (!data.status) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.invalidEmployeeId)
          }
          req.body.employee_reference_id = data.data.reference_id;
          return true;
        })
      }),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.i94Details.i94DetailsIdRequired)
      .isInt()
      .withMessage(responseMessages.employee.i94Details.I94DetailsIdInvalid)
      .custom(async (value) => {
        var empi94Data = await indexService.find('employee_i94_details', ['id', 'document_number'], { id: value })
        var i94Data = empi94Data.status
        if (!i94Data) {
          return Promise.reject(responseMessages.employee.i94Details.i94DetailsIdNotFound)
        } else {
          empi94Data = await indexService.find('employee_i94_details', ['id', 'document_number'], { id: value, employee_id: req.body.employee_id })
          if (!empi94Data.status) {
            return Promise.reject(responseMessages.employee.i94Details.noMatchingDetailsi94)
          }
          req.body.document_number = empi94Data.data[0].document_number;
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
   * + Delete  i94 details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id }
    var employeeI94 = await employeeI94Service.destroy(req.body, condition)
    if (employeeI94.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.deletedSuccessfully
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong,
        error: employeeI94.error
      }
    }

    /* Log Response */
    logResponse('info', req, responseData, 'employee i94 Detail delete Response')
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
  logRequest('info', req, 'I94 document delete request')
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
        let docData = await indexService.find('employee_mapped_documents', ['id'], { id: value, referrable_type: 4 });
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
    await employeeI94Service.deleteDocument(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.deletedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'i94 document delete Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});


module.exports = { destroy, index, store, update, destroyDocument }
