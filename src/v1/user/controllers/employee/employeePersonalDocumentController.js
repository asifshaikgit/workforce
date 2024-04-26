const { check, validationResult } = require('express-validator');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { logRequest, logResponse } = require('../../../../../utils/log');
const employeePersonalDocumentService = require('../../services/employee/employeePersonalDocumentService');
const { responseHandler } = require('../../../../responseHandler');
const { tryCatch } = require('../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const indexService = require('../../services/index');
const format = require('../../../../../helpers/format');
const moment = require('moment');
const { response } = require('express');
const { regexPatterns } = require('../../../../../constants/regexPatterns')

/**
 * Store function to create a new Personal Document record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'store' service function to create a new Personal Document record.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Retrieve the organization date format using `format.getDateFormat()`.
 * - Log the incoming request.
 * - Set default variables for `responseData` and `documentValidation`.
 * - Fetch the document type data from 'document_types' table based on the 'document_type_id' provided in the request.
 * - Modify the 'valid_from' and 'valid_till' dates to 'YYYY-MM-DD' format using Moment.js and update the request.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *    + 'document_type_id' (body), must not be empty, should be an integer, and should exist in the 'document_types' table.
 *       ~ If the 'status' is 1 (Active), it checks for the existence of an active document of the same type for the same employee in 'employee_personal_documents' table.
 *       ~ Sets the 'document_type_name' property in the request based on the document type data.
 *    + 'valid_from' (body), must be provided if 'valid_from_mandatory' is true in the document type.
 *    + 'valid_till' (body), must be provided if 'valid_to_mandatory' is true in the document type.
 *    + 'document_number' (body), must be provided if 'number_mandatory' is true in the document type.
 *    + 'status' (body), must be provided if 'status_mandatory' is true in the document type.
 *    + 'documents.*.new_document_id' (body), must be provided if 'upload_mandatory' is true in the document type.
 *       ~ Check if 'new_document_id' is a valid UUID and exists in the 'temp_upload_documents' table.
 *       ~ Keep track of document validation by incrementing 'documentValidation'.
 *       
 * Run the validation rules.
 * If validation is successful:
 *    + Check for 'upload_mandatory', and if 'documentValidation' is 0, throw an error.
 *    + Call the 'store' service function to create a new Personal Document record.
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
  let dateFormat = await format.getDateFormat(); // date format

  /* Log Request */
  logRequest('info', req, 'New personal documents request');
  /* Log Request */

  /* Default Variable */
  let responseData = '';
  let documentValidation = 0;
  /* Default Variable */

  let modified_date = req.body.valid_from != '' ? moment(req.body.valid_from, dateFormat).format('YYYY-MM-DD') : '';
  req.body.valid_from = modified_date // From date format

  let modified_date1 = req.body.valid_till != '' ? moment(req.body.valid_till, dateFormat).format('YYYY-MM-DD') : '';
  req.body.valid_till = modified_date1 // From date format

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
        const employeeData = await indexService.find('employee', ['id', 'reference_id'], { id: value });
        if (!employeeData.status) {
          return Promise.reject(responseMessages.employee.employeeIdNotExists);
        }
        req.body.employee_reference_id = employeeData.data[0].reference_id;
        return true;
      }),
    check('document_type_id')
      .trim()
      .escape()
      .custom(async (value) => {
        var documentData = await indexService.find('document_types', ['id', 'name'], { id: value });
        let status = documentData.status;
        if (!status) {
          return Promise.reject(responseMessages.employee.documents.documentTypeIdNotExists);
        } else {
          req.body.document_type_name = documentData.data[0].name
          if (req.body.status == 0) {
            return indexService.find('employee_personal_documents', ['id'], { document_type_id: value, status: 0, employee_id: req.body.employee_id }).then((personalDocumentData) => {
              if (personalDocumentData.status) {
                return Promise.reject(responseMessages.employee.documents.activeDocumentExists);
              }
            });
          }
          return true
        }
      }),
    check('valid_from')
      .trim()
      .custom(async (value) => {
        if (value != '') {
          isDate = new Date(value);
          if (isNaN(isDate.getTime())) {
            return Promise.reject(responseMessages.employee.personalDocuments.InvalidfromDate);
          }
          // 'valid_from' should be always less than 'valid_till'
          if (isDate.getTime() > new Date(req.body.valid_till).getTime()) {
            return Promise.reject(responseMessages.employee.personalDocuments.InvalidfromDate);
          }
        } else {
          return true;
        }
      }),
    check('valid_till')
      .trim()
      .custom(async (value) => {
        if (value != '') {
          isDate = new Date(value);
          if (isNaN(isDate.getTime())) {
            return Promise.reject(responseMessages.employee.personalDocuments.validTillDateInvalid);
          }
          // 'valid_till' should always be greater than 'valid_from'
          if ((isDate.getTime() < new Date(req.body.valid_from).getTime()) || (new Date(req.body.valid_from).toString() === 'Invalid Date')) {
            return Promise.reject(responseMessages.employee.personalDocuments.validTillDateInvalid);
          }
        } else {
          return true;
        }
      }),
    check('document_number')
      .trim()
      .custom(async (value) => {
        if (value != '') {
          let pattern = (regexPatterns.specialCharactersRegex);
          if (pattern.test(value)) {
            return Promise.reject(responseMessages.employee.personalDocuments.inValid_Document_Number);
          }
          if (value.length > 25) {
            return Promise.reject(responseMessages.employee.personalDocuments.lengthInvalid);
          }
        } else {
          if (req.body.document_type_id != 4) {
            return Promise.reject(responseMessages.employee.personalDocuments.document_number);
          }
          return true
        }
      }),
    check('status')  // 1 - Active, 0 - Expired
      .trim()
      .custom(async (value) => {
        if (value != '') {
          let pattern = (/^[0-1]*$/);
          if (!pattern.test(value)) {
            return Promise.reject(responseMessages.employee.personalDocuments.statusInvalid);
          }
        } else {
          return true;
        }
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
  ];
  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    let result = await validation.run(req);
    if (result.errors.length) break;
  }
  let errors = validationResult(req);
  /*Run the validation rules. */

  /**
   * If validation is success
   *    + Call the create personal document service function
   *        - Based on the status in create personal document function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    var personalDoc = await employeePersonalDocumentService.store(req.body);
    if (personalDoc.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.addedSuccessfully,
        data: personalDoc.data
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong, error: personalDoc.error
      }
    }
    /* Log Response */
    logResponse(
      'info',
      req,
      responseData,
      'New personal documents response',
    );
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity,
    );
  }
});


/**
 * Update function to modify an existing Personal Document record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'update' service function to modify the Personal Document record.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Retrieve the organization date format using `format.getDateFormat()`.
 * - Log the incoming request.
 * - Set default variables for `responseData` and `documentValidation`.
 * - Fetch the document type data from 'document_types' table based on the 'document_type_id' provided in the request.
 * - Modify the 'valid_from' and 'valid_till' dates to 'YYYY-MM-DD' format using Moment.js and update the request.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *    + 'id' (params), must not be empty, should be an integer, and should exist in 'employee_personal_documents' table for the same employee.
 *    + 'document_type_id' (body), must not be empty, should be an integer, and should exist in the 'document_types' table.
 *       ~ If the 'status' is 1 (Active), it checks for the existence of an active document of the same type for the same employee in 'employee_personal_documents' table.
 *       ~ Sets the 'document_type_name' property in the request based on the document type data.
 *    + 'valid_from' (body), must be provided if 'valid_from_mandatory' is true in the document type.
 *    + 'valid_till' (body), must be provided if 'valid_to_mandatory' is true in the document type.
 *    + 'document_number' (body), must be provided if 'number_mandatory' is true in the document type.
 *    + 'status' (body), must be provided if 'status_mandatory' is true in the document type.
 *    + 'documents.*.new_document_id' (body), must be provided if 'upload_mandatory' is true in the document type.
 *       ~ Check if 'new_document_id' is a valid UUID and exists in the 'temp_upload_documents' table.
 *       ~ Keep track of document validation by incrementing 'documentValidation'.
 *    + 'documents.*.id' (body), not mandatory , if 'id' is not empty, should be an integer, and should exist in the 'employee_mapped_documents' table.
 *       ~ Keep track of document validation by incrementing 'documentValidation'.
 *       
 * Run the validation rules.
 * If validation is successful:
 *    + Check for 'upload_mandatory', and if 'documentValidation' is 0, throw an error.
 *    + Call the 'update' service function to modify the Personal Document record.
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
  let dateFormat = await format.getDateFormat(); // date format

  /* Log Request */
  logRequest('info', req, 'update personal documents request.');
  /* Log Request */

  /* Default Variable */
  let responseData = '';
  let documentValidation = 0;
  /* Default Variable */

  let documentTypesData = await indexService.find('document_types', ['*'], { id: req.body.document_type_id });
  let documentType = documentTypesData.data[0];

  let modified_date = req.body.valid_from != '' ? moment(req.body.valid_from, dateFormat).format('YYYY-MM-DD') : '';
  req.body.valid_from = modified_date // From date format

  let modified_date1 = req.body.valid_till != '' ? moment(req.body.valid_till, dateFormat).format('YYYY-MM-DD') : '';
  req.body.valid_till = modified_date1 // From date format

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
      .withMessage(responseMessages.employee.personalDocuments.personaldocumentId)
      .isInt()
      .withMessage(responseMessages.employee.personalDocuments.personaldocumentIdInvalid)
      .custom(async (value) => {
        let perosnalData = await indexService.find('employee_personal_documents', ['id', 'document_type_id'], { id: value });
        if (!perosnalData.status) {
          return Promise.reject(responseMessages.employee.personalDocuments.IdNotExists);
        } else {
          perosnalData = await indexService.find('employee_personal_documents', ['id', 'document_number', 'document_type_id'], { id: value, employee_id: req.body.employee_id });
          if (!perosnalData.status) {
            return Promise.reject(
              responseMessages.employee.personalDocuments.noMatchingDetailsPensonal,
            );
          }
          req.body.document_number = perosnalData?.data[0]?.document_number;
          req.body.document_type_id = perosnalData?.data[0]?.document_type_id;
          return true;
        }
      }),
    check('document_type_id')
      .trim()
      .escape()
      .custom(async (value) => {
        var documentData = await indexService.find('document_types', ['id', 'name'], { id: value });
        if (!documentData.status) {
          return Promise.reject(responseMessages.employee.documents.documentTypeIdNotExists);
        } else {
          req.body.document_type_name = documentData.data[0].name
          if (req.body.status == 0) {
            return indexService.find('employee_personal_documents', ['id'], { document_type_id: value, status: 1, employee_id: req.body.employee_id }).then((personalDocumentData) => {
              let status = personalDocumentData.status;
              if (status) {
                if (personalDocumentData.data[0].id != req.body.employee_personal_document_id) {
                  return Promise.reject(responseMessages.employee.documents.activeDocumentExists);
                }
              }
            });
          }
        }

      }),
    check('valid_from')
      .trim()
      .custom(async (value) => {
        if (value != '') {
          isDate = new Date(value);
          if (isNaN(isDate.getTime())) {
            return Promise.reject(responseMessages.employee.personalDocuments.InvalidfromDate);
          }
          // 'valid_from' should be always less than 'valid_till'
          if (isDate.getTime() > new Date(req.body.valid_till).getTime()) {
            return Promise.reject(responseMessages.employee.personalDocuments.InvalidfromDate);
          }
        } else {
          return true;
        }
      }),
    check('valid_till')
      .trim()
      .custom(async (value) => {
        if (value != '') {
          isDate = new Date(value);
          if (isNaN(isDate.getTime())) {
            return Promise.reject(responseMessages.employee.personalDocuments.validTillDateInvalid);
          }
          // 'valid_till' should always be greater than 'valid_from'
          if (isDate.getTime() < new Date(req.body.valid_from).getTime() || new Date(req.body.valid_from) === "Invalid Date") {
            return Promise.reject(responseMessages.employee.personalDocuments.validTillDateInvalid);
          }
        } else {
          return true;
        }
      }),
    check('document_number')
      .trim()
      .custom(async (value) => {
        if (value != '') {
          let pattern = (regexPatterns.specialCharactersRegex);
          if (pattern.test(value)) {
            return Promise.reject(responseMessages.employee.personalDocuments.inValid_Document_Number);
          }
          if (value.length > 25) {
            return Promise.reject(responseMessages.employee.personalDocuments.lengthInvalid);
          }
        } else {
          if (req.body.document_type_id != 4 && (!req.body?.clear_all)) {
            return Promise.reject(responseMessages.employee.personalDocuments.document_number);
          }
          return true;
        }
      }),
    check('status')
      .trim()
      .custom(async (value) => {
        if (value != '') {
          let pattern = (/^[0-1]*$/);
          if (!pattern.test(value)) {
            return Promise.reject(responseMessages.employee.personalDocuments.statusInvalid);
          }
        } else {
          return true;
        }
      }),
    check('documents.*.new_document_id')
      .trim()
      .escape()
      .custom(async (value) => {
        if (value != null && value != '') {
          let pattern = regexPatterns.uuidRegex;
          if (pattern.test(value)) {
            return indexService.find('temp_upload_documents', ['*'], { id: req.body.documents.new_document_id }, null, [], null, null, null, false).then((documentsData) => {
              if (!documentsData.status) {
                return Promise.reject(responseMessages.employee.documents.newDocumentIdNotExists);
              }
              documentValidation = documentValidation + 1;
            });
          } else {
            return Promise.reject(responseMessages.employee.documents.newDocumentIdInvalid);
          }
        } else if (value === null || value == '') {
          return true;
        }
      }),
    check('documents.*.id')
      .trim()
      .escape()
      .custom(async (value) => {
        if (check(value).isInt() && value != null && value != '') {
          return await indexService.find('employee_mapped_documents', ['id'], { id: value }).then((documentsData) => {
            if (!documentsData.status) {
              return Promise.reject(responseMessages.employee.documents.documenIdNoExists);
            }
            documentValidation = documentValidation + 1;
          });
        } else if (value === null || value == '') {
          return true;
        } else {
          return Promise.reject(responseMessages.employee.documents.documentIdInvalid);
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
              return Promise.reject(responseMessages.employee.documents.documenIdNoExists);
            }
          } else {
            return Promise.reject(responseMessages.employee.documents.DeleteDocumentInvalid)
          }
        }
        return true
      })
  ];
  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    let result = await validation.run(req);
    if (result.errors.length) break;
  }
  let errors = validationResult(req);
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
    if (req.body?.clear_all) {
      var personalDoc = await employeePersonalDocumentService.destroy(req.body, condition);
    } else {
      var personalDoc = await employeePersonalDocumentService.update(req.body, condition);
    }
    if (personalDoc.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: personalDoc.error
      }
    }
    /* Log Response */
    logResponse('info', req, responseData, 'Update personal documents Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */

  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
},
);

/**
 * Index function to retrieve a list of Employee Personal Document records based on the provided employee_id.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'index' service function to retrieve Employee Personal Document records.
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
 *    + Call the 'index' service function to retrieve Employee Personal Document records.
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
  logRequest('info', req, 'getting employee personal document request');
  /* Log Request */

  /* Default Variable */
  let responseData = '';
  /* Default Variable */

  let validations = [
    check('request_id')
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
        const employeeData = await indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: value });
        let status = employeeData.status;
        if (!status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists);
        }
      }),
  ];
  for (let validation of validations) {
    let result = await validation.run(req);
    if (result.errors.length) break;
  }
  /* Default Variable */
  let errors = validationResult(req);
  /* Default Variable */


  /* Writing validation rules to the input request */
  if (errors.isEmpty()) {
    let condition = { 'employee_personal_documents.employee_id': req.query.id };
    let personalDocumentData = await employeePersonalDocumentService.index(condition);

    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: personalDocumentData.data };
    /* Log Response */
    logResponse('info', req, responseData, 'personal document index Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  }
  else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Destroy Document function to delete a Personal Document record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Delete the personal document details from the collection.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set a default variable for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'id' (params), must not be empty, should be an integer, and should exist in the 'employee_mapped_documents' table.
 *       
 * Run the validation rules.
 * If validation is successful:
 *    + call 'employeePersonalDocumentService.deleteDocument' function to delete the personal document details from 'employee_mapped_documents' table.
 *    + Prepare the response with success data.
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
  logRequest('info', req, 'personal document delete request');
  /* Log Request */

  /* Default Variable */
  let responseData = '';
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
      .withMessage(responseMessages.employee.personalDocuments.documentIdRequired)
      .isInt()
      .withMessage(responseMessages.employee.personalDocuments.documentIdInvalid)
      .custom(async (value) => {
        let docData = await indexService.find('employee_mapped_documents', ['id'], { id: value });
        if (!docData.status) {
          return Promise.reject(
            responseMessages.employee.personalDocuments.documentIdDoesNotExist,
          );
        }
        return true;
      }),
    check('personal_document_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.personalDocuments.personaldocumentId)
      .isInt()
      .withMessage(responseMessages.employee.personalDocuments.personaldocumentIdInvalid)
      .custom(async (value) => {
        let perosnalData = await indexService.find('employee_personal_documents', ['id'], { id: value })
        if (!perosnalData.status) {
          return Promise.reject(responseMessages.employee.personalDocuments.IdNotExists);
        } else {
          perosnalData = await indexService.find('employee_personal_documents', ['id'], { id: value, employee_id: req.body.employee_id });
          if (!perosnalData.status) {
            return Promise.reject(
              responseMessages.employee.personalDocuments.noMatchingDetailsPensonal,
            );
          }
          return true;
        }
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
    await employeePersonalDocumentService.deleteDocument(req.body, condition);
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
})

/**
 * Destroy function to delete a Personal Document record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Delete the personal document details from the collection.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set a default variable for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *    + 'id' (params), must not be empty, should be an integer, and should exist in 'employee_personal_documents' table for the same employee.
 *       ~ Joins the 'employee_personal_documents' table with 'document_types' and fetch document type name.
 *       ~ Sets the 'document_type_name' property in the request based on the document type data.
 *       
 * - Run the validation rules.
 * - If validation is successful:
 *    + Delete the personal document details from the collection.
 *    + Prepare the response with success data.
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
const destroy = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'employee personal document request');
  /* Log Request */

  /* Default Variable */
  let responseData = '';
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
        const employeeData = await indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: value })
        let status = employeeData.status;
        if (!status) {
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
      .withMessage(responseMessages.employee.personalDocuments.employeePersonalDocumentId)
      .isInt()
      .withMessage(responseMessages.employee.personalDocuments.personaldocumentIdInvalid)
      .custom(async (value) => {
        let perosnalData = await indexService.find('employee_personal_documents', ['id'], { id: value });
        if (!perosnalData.status) {
          return Promise.reject(
            responseMessages.employee.personalDocuments.IdNotExists,
          );
        } else {
          const joins = [
            { table: 'document_types', condition: ['employee_personal_documents.document_type_id', 'document_types.id'], type: 'left' }
          ];
          const documentTypedata = await indexService.find('employee_personal_documents', ['employee_personal_documents.id', 'employee_personal_documents.document_number', 'document_types.name', 'document_types.id as document_type_id'], { 'employee_personal_documents.id': value, 'employee_personal_documents.employee_id': req.body.employee_id }, null, joins);
          if (!documentTypedata.status) {
            return Promise.reject(responseMessages.employee.personalDocuments.noMatchingDetailsPensonal);
          }
          req.body.document_type_name = documentTypedata.data[0].name;
          req.body.document_type_id = documentTypedata.data[0].document_type_id;
          req.body.document_number = documentTypedata.data[0].document_number;
          return true;
        }
      }),
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
    const personalDocument = await employeePersonalDocumentService.destroy(req.body, condition);
    if (personalDocument.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.deletedSuccessfully,
      };
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseCodes.common.somethindWentWrong,
        error: personalDocument.error
      };
    }


    /* Log Response */
    logResponse('info', req, responseData, 'employee personal document delete Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */

  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = { destroy, index, store, update, destroyDocument };
