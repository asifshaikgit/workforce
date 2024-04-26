const { check, validationResult } = require('express-validator');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { logRequest, logResponse } = require('../../../../../utils/log');
const { responseHandler } = require('../../../../responseHandler');
const { tryCatch } = require('../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const { pagination } = require('../../../../../config/pagination');
const announcementService = require('../../services/configurations/announcementService');
const indexService = require('../../services/index');
const format = require('../../../../../helpers/format');
const moment = require('moment');
const { regexPatterns } = require('../../../../../constants/regexPatterns');

/**
 * Store a new announcement based on the provided request.
 * Overview of API:
 *  - Log the incoming request.
 *  - Set default variables.
 *  - Extract the 'expression_type' from the request path and map it to 'expression_type_id'.
 *  - If 'expression_type' is 'web', set 'expression_type_id' to 1; if 'mobile', set to 2; otherwise, set to 0.
 *  - Define validation rules for the input request using the 'check' function.
 *  - Run the validation rules and handle errors if any.
 *  - If validation is successful:
 *    + Call the announcementService's store function.
 *    + Prepare a success or failure response based on the store function's result.
 *  - If validation fails:
 *    + Throw an InvalidRequestError with the appropriate error message.
 *  - Log the outgoing response.
 *  - Return the response using responseHandler().
 * 
 * Logic:
 *  - Log incoming request.
 *  - Set default variables and map 'expression_type' to 'expression_type_id'.
 *  - Define validation rules for the input request using the 'check' function.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the announcementService's store function.
 *    + Prepare a success or failure response based on the store function's result.
 *  - If validation fails:
 *    + Throw an InvalidRequestError with the appropriate error message.
 *  - Log the outgoing response.
 *  - Return the response using responseHandler().
 * 
 * Notes:
 *  - Utilizes tryCatch to handle exceptions.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const store = tryCatch(async (req, res) => {

  /* Log Request */
  logRequest('info', req, 'create new announcement store request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  const requestSegments = req.path.split('/');
  req.body.expression_type = requestSegments[2];

  if(req.body.expression_type == 'web'){
    req.body.expression_type_id = 1;
  } else if (req.body.expression_type == 'mobile') {
    req.body.expression_type_id = 2;
  } else {
    req.body.expression_type_id = 0
  }

  /* Writing validation rules to the input request */
  var validations = [
    check("request_id").trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('expression_type_id')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.announcement.expressionTypeRequired)
      .isIn([1, 2])
      .withMessage(responseMessages.configurations.announcement.expressionTypeInvalid),
    check('documents.*.new_document_id')
      .trim()
      .escape()
      .custom(async (value) => {
        if(value == '' && value == null){
          return Promise.reject(responseMessages.employee.documents.newDocumentIdRequired);
        }

        var pattern = regexPatterns.uuidRegex;
        if (!pattern.test(value)) {
          return Promise.reject(responseMessages.employee.documents.newDocumentIdInvalid)
        }

        const documentsData = await indexService.find('temp_upload_documents', ['*'], { id: value }, null, [], null, null, null, false);
        if (!documentsData.status) {
          return Promise.reject(responseMessages.employee.documents.newDocumentIdNotExists);
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
   *    + Call the store service function
   *        - Based on the status in store function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    var announcement = await announcementService.store(req.body);
    if (announcement.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.addedSuccessfully,
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeUnprocessableEntity,
        message: responseMessages.common.failedToCreate,
        error: announcement.error
      }
    }

    /* Log Response */
    logResponse('info', req, responseData, 'create new announcement store response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Publish an existing announcement based on the provided request.
 * Overview of API:
 *  - Log the incoming request.
 *  - Retrieve the date format for proper validation and conversion.
 *  - Convert the 'publish_date' in the request body to the proper date format.
 *  - Set default variables.
 *  - Extract the 'expression_type' from the request path and map it to 'expression_type_id'.
 *  - If 'expression_type' is 'web', set 'expression_type_id' to 1; if 'mobile', set to 2; otherwise, set to 0.
 *  - Define validation rules for the input request using the 'check' function.
 *  - Run the validation rules and handle errors if any.
 *  - If validation is successful:
 *    + Call the announcementService's publish function.
 *    + Prepare a success response.
 *  - If validation fails:
 *    + Throw an InvalidRequestError with the appropriate error message.
 *  - Log the outgoing response.
 *  - Return the response using responseHandler().
 * 
 * Logic:
 *  - Log incoming request.
 *  - Retrieve the date format for proper validation and conversion.
 *  - Convert 'publish_date' in the request body to the proper date format.
 *  - Set default variables and map 'expression_type' to 'expression_type_id'.
 *  - Define validation rules for the input request using the 'check' function.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the announcementService's publish function.
 *    + Prepare a success response.
 *  - If validation fails:
 *    + Throw an InvalidRequestError with the appropriate error message.
 *  - Log outgoing response.
 *  - Return the response using responseHandler().
 * 
 * Notes:
 *  - Utilizes tryCatch to handle exceptions.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const publish = tryCatch(async (req, res) => {
  let dateFormat = await format.getDateFormat(); // date format
  
  /* Log Request */
  logRequest('info', req, 'Publish Announcement request.');
  /* Log Request */

  if(req.body.publish_date != null && req.body.publish_date != ''){
    req.body.publish_date = moment(req.body.publish_date, dateFormat).format('YYYY-MM-DD');
  }
  
  /* Default variable */
  let responseData = [];
  /* Default variable */

  const requestSegments = req.path.split('/');
  req.body.expression_type = requestSegments[2];

  if(req.body.expression_type == 'web'){
    req.body.expression_type_id = 1;
  } else if (req.body.expression_type == 'mobile') {
    req.body.expression_type_id = 2;
  } else {
    req.body.expression_type_id = 0
  }

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('expression_type_id')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.announcement.expressionTypeRequired)
      .isIn([1, 2])
      .withMessage(responseMessages.configurations.announcement.expressionTypeInvalid),
    check('id')
      .trim().escape()
      .notEmpty().withMessage(responseMessages.configurations.announcement.announcementIdRequired)
      .isInt().withMessage(responseMessages.configurations.announcement.announcementIdInvalid)
      .custom(async (value) => {
        const data = await indexService.find('announcements', ['id'], { id: value, expression_type: req.body.expression_type_id});
        const announcementData = data.status;
        if (!announcementData) {
          return Promise.reject(responseMessages.configurations.announcement.announcementIdNotExists);
        }
      }),
    check('publish_date')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.announcement.publishDateRequired)
      .custom(async (value) => {
          let isDate = new Date(value);
          // Invalid date
          if (isNaN(isDate.getTime())) {
              return Promise.reject(responseMessages.configurations.announcement.publishDateInvalid);
          }
        })
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
   *    + call the update status service function
   *        - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
  */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id, expression_type: req.body.expression_type_id};
    await announcementService.publish(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'Publish Announcement Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});


/**
 * Destroy (delete) an existing announcement based on the provided request.
 * Overview of API:
 *  - Log the incoming request.
 *  - Set default variables.
 *  - Extract the 'expression_type' from the request path and map it to 'expression_type_id'.
 *  - If 'expression_type' is 'web', set 'expression_type_id' to 1; if 'mobile', set to 2; otherwise, set to 0.
 *  - Define validation rules for the input request using the 'check' function.
 *  - Run the validation rules and handle errors if any.
 *  - If validation is successful:
 *    + Call the announcementService's destroy function.
 *    + Prepare a success response.
 *  - If validation fails:
 *    + Throw an InvalidRequestError with the appropriate error message.
 *  - Log the outgoing response.
 *  - Return the response using responseHandler().
 * 
 * Logic:
 *  - Log incoming request.
 *  - Set default variables and map 'expression_type' to 'expression_type_id'.
 *  - Define validation rules for the input request using the 'check' function.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the announcementService's destroy function.
 *    + Prepare a success response.
 *  - If validation fails:
 *    + Throw an InvalidRequestError with the appropriate error message.
 *  - Log outgoing response.
 *  - Return the response using responseHandler().
 * 
 * Notes:
 *  - Utilizes tryCatch to handle exceptions.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const destroy = tryCatch(async (req, res) => {

  /* Log Request */
  logRequest('info', req, 'Destory Announcement request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  const requestSegments = req.path.split('/');
  req.body.expression_type = requestSegments[2];

  if(req.body.expression_type == 'web'){
    req.body.expression_type_id = 1;
  } else if (req.body.expression_type == 'mobile') {
    req.body.expression_type_id = 2;
  } else {
    req.body.expression_type_id = 0
  }

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('expression_type_id')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.announcement.expressionTypeRequired)
      .isIn([1, 2])
      .withMessage(responseMessages.configurations.announcement.expressionTypeInvalid),
    check('id')
      .trim().escape()
      .notEmpty().withMessage(responseMessages.configurations.announcement.announcementIdRequired)
      .isInt().withMessage(responseMessages.configurations.announcement.announcementIdInvalid)
      .custom(async (value) => {
        const data = await indexService.find('announcements', ['id'], { id: value, expression_type: req.body.expression_type_id });
        const announcementData = data.status;
        if (!announcementData) {
          return Promise.reject(responseMessages.configurations.announcement.announcementIdNotExists);
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
   *    + call the update status service function
   *        - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
  */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id, expression_type: req.body.expression_type_id};
    await announcementService.destroy(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'Destory Announcement Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Retrieve a list of announcements based on the provided request.
 * Overview of API:
 *  - Log the incoming request.
 *  - Set default variables.
 *  - Extract the 'expression_type' from the request path and map it to 'expression_type_id'.
 *  - If 'expression_type' is 'web', set 'expression_type_id' to 1; if 'mobile', set to 2; otherwise, set to 0.
 *  - Define validation rules for the input request using the 'check' function.
 *  - Run the validation rules and handle errors if any.
 *  - If validation is successful:
 *    + Call the announcementService's announcementListing function to retrieve announcements.
 *    + Prepare a success response with retrieved announcement data.
 *  - If validation fails:
 *    + Throw an InvalidRequestError with the appropriate error message.
 *  - Log the outgoing response.
 *  - Return the response using responseHandler().
 * 
 * Logic:
 *  - Log incoming request.
 *  - Set default variables and map 'expression_type' to 'expression_type_id'.
 *  - Define validation rules for the input request using the 'check' function.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the announcementService's announcementListing function.
 *    + Prepare a success response with retrieved announcement data.
 *  - If validation fails:
 *    + Throw an InvalidRequestError with the appropriate error message.
 *  - Log outgoing response.
 *  - Return the response using responseHandler().
 * 
 * Notes:
 *  - Utilizes tryCatch to handle exceptions.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const announcementListing = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Announcement listing request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  const requestSegments = req.path.split('/');
  req.query.expression_type = requestSegments[2];

  if(req.query.expression_type == 'web'){
    req.query.expression_type_id = 1;
  } else if (req.query.expression_type == 'mobile') {
    req.query.expression_type_id = 2;
  } else {
    req.query.expression_type_id = 0
  }

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('expression_type_id')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.announcement.expressionTypeRequired)
      .isIn([1, 2])
      .withMessage(responseMessages.configurations.announcement.expressionTypeInvalid),
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
   * + get reminder details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    condition = { expression_type : req.query.expression_type_id }
    announcamentData = await announcementService.announcementListing(condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.success,
      data: announcamentData.data
    };

    /* Log Response */
    logResponse('info', req, responseData, 'Announcement listing Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = { store, announcementListing, destroy, publish };

