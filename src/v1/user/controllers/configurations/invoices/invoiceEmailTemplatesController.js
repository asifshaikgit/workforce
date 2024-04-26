const invoiceEmailTemplatesService = require('../../../services/configurations/invoice/invoiceEmailTemplatesService');
const indexServices = require('../../../services/index');
const { check, validationResult } = require('express-validator');
const { logRequest, logResponse } = require('../../../../../../utils/log');
const { responseMessages } = require('../../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../../constants/responseCodes');
const { responseHandler } = require('../../../../../responseHandler');
const { tryCatch } = require('../../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../../error/InvalidRequestError');

/**
 * Create New Invoice Configuration for Invoice Email Templates.
 * Overview of API:
 * - Validate the request to ensure it adheres to defined rules.
 *   + If successful
 *     ~ Call the service function to create a new Invoice Configuration for Invoice Email Templates.
 *     ~ Add a success message to the response.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log incoming request.
 * - Define validation rules as follows:
 *   + 'request_id' (body) is mandatory.
 *   + 'to' (body) should be an array.
 *      ~ Each element of 'to' array should either be empty or a valid email address.
 *   + 'subject' (body) is mandatory.
 *   + 'template' (body) is mandatory.
 *   + 'cc' (body) should be an array.
 *      ~ Each element of 'cc' array should either be empty or a valid email address.
 *   + 'bcc' (body) should be an array.
 *      ~ Each element of 'bcc' array should either be empty or a valid email address.
 *   + 'is_global' (body) is mandatory, should be a boolean,
 *      ~ if 'true', ensure that a global configuration doesn't already exist in 'invoice_email_templates' table.
 * 
 * - Run the validation rules.
 *   + If validation is successful:
 *     ~ Call the service function to store the provided Invoice Configuration for Invoice Email Templates.
 *     ~ Add a success message to the response.
 *   + Else:
 *     ~ Add error validation to the response.
 * - Prepare the response with status codes.
 * - Log the response.
 * - Return the response using responseHandler().
 * 
 * Notes:
 * - Exception handling is implemented using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const store = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Store Invoice Email Templates request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('to').isArray().withMessage(responseMessages.configurations.invoiceEmailTemplates.toArray),
    check('to.*').trim()
      .custom((value) => {
        if (value === '' || value === null) {
          if (req.body.invoice_email_template_type === 1) {
            return true;
          } else {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(value)) {
              return Promise.reject(responseMessages.configurations.invoiceEmailTemplates.toEmailIdRequired);
            }
          }
        }
        return true;
      }),
    check('subject').trim().notEmpty().withMessage(responseMessages.configurations.invoiceEmailTemplates.subjectRequired),
    check('template').trim().notEmpty().withMessage(responseMessages.configurations.invoiceEmailTemplates.templateRequired),
    check('cc').isArray().withMessage(responseMessages.configurations.invoiceEmailTemplates.CCArray),
    check('cc.*').trim()
      .custom((value) => {
        if (value === '' || value === null) {
          if (req.body.invoice_email_template_type === 1) {
            return true;
          } else {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(value)) {
              return Promise.reject(responseMessages.configurations.invoiceEmailTemplates.ccEmailIdInvalid);
            }
          }
        }
        return true;
      }),
    check('bcc').isArray().withMessage(responseMessages.configurations.invoiceEmailTemplates.BccArray),
    check('bcc.*').trim()
      .custom((value) => {
        if (value === '' || value === null) {
          if (req.body.invoice_email_template_type === 1) {
            return true;
          } else {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(value)) {
              return Promise.reject(responseMessages.configurations.invoiceEmailTemplates.bccEmailIdInvalid);
            }
          }
        }
        return true;
      }),
    check('is_global').trim().escape().notEmpty().withMessage(responseMessages.configurations.invoiceEmailTemplates.globalRequired)
      .isBoolean().withMessage(responseMessages.configurations.invoiceEmailTemplates.globalInvalid)
      .custom(async (value) => {
        if (value === 'true') {
          const invoiceEmailData = await indexServices.find('invoice_email_templates', ['id'], { is_global: true });
          if (invoiceEmailData.status) {
            return Promise.reject(responseMessages.configurations.invoiceEmailTemplates.globalAlreadyExist);
          }
        }
      }),
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
    await invoiceEmailTemplatesService.store(req.body);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'Store Invoice Email Templates response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Update Invoice Configuration for Invoice Email Templates.
 * Overview of API:
 * - Validate the request to ensure it adheres to defined rules.
 *   + If successful
 *     ~ Call the service function to update an existing Invoice Configuration for Invoice Email Templates.
 *     ~ Add a success message to the response.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log incoming request.
 * - Define validation rules as follows:
 *   + 'request_id' (body) is mandatory.
 *   + 'id' (params) is mandatory, should exist in the 'invoice_email_templates' table, and must not be deleted.
 *   + 'subject' (body) is mandatory.
 *   + 'template' (body) is mandatory.
 *   + 'cc' (body) should be an array.
 *      ~ Each element of 'cc' array should either be empty or a valid email address.
 *   + 'bcc' (body) should be an array.
 *      ~ Each element of 'bcc' array should either be empty or a valid email address.
 *   + 'is_global' (body) is mandatory, should be a boolean
 *      ~ if 'true', ensure that a global configuration doesn't already exist in 'invoice_email_templates' table, except for the current configuration being updated.
 * 
 * - Run the validation rules.
 *   + If validation is successful:
 *     ~ Call the service function to update the provided Invoice Configuration for Invoice Email Templates.
 *     ~ Add a success message to the response.
 *   + Else:
 *     ~ Add error validation to the response.
 * - Prepare the response with status codes.
 * - Log the response.
 * - Return the response.
 * 
 * Notes:
 * - Exception handling is implemented using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update Invoice Email Templates request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.invoiceEmailTemplates.IdRequired)
      .custom(async (value) => {
        const invoiceData = await indexServices.find('invoice_email_templates', ['id'], { id: value, deleted_at: null });
        if (!invoiceData.status) {
          return Promise.reject(responseMessages.configurations.invoiceEmailTemplates.IdNotExists);
        }
      }),
    check('subject').notEmpty().withMessage(responseMessages.configurations.invoiceEmailTemplates.subjectRequired),
    check('template').notEmpty().withMessage(responseMessages.configurations.invoiceEmailTemplates.templateRequired),
    check('cc').isArray().withMessage(responseMessages.configurations.invoiceEmailTemplates.CCArray),
    check('cc.*').trim()
      .custom((value) => {
        if (value === '' || value === null) {
          if (req.body.invoice_email_template_type === 1) {
            return true;
          } else {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(value)) {
              return Promise.reject(responseMessages.configurations.invoiceEmailTemplates.ccEmailIdInvalid);
            }
          }
        }
        return true;
      }),
    check('bcc').isArray().withMessage(responseMessages.configurations.invoiceEmailTemplates.BccArray),
    check('bcc.*').trim()
      .custom((value) => {
        if (value === '' || value === null) {
          if (req.body.invoice_email_template_type === 1) {
            return true;
          } else {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(value)) {
              return Promise.reject(responseMessages.configurations.invoiceEmailTemplates.bccEmailIdInvalid);
            }
          }
        }
        return true;
      }),
    check('is_global').trim().escape().notEmpty().withMessage(responseMessages.configurations.invoiceEmailTemplates.globalRequired)
      .isBoolean().withMessage(responseMessages.configurations.invoiceEmailTemplates.globalInvalid)
      .custom((value) => {
        if (value === 'true') {
          return indexServices.find('invoice_email_templates', ['id'], { is_global: true }).then((invoiceData) => {
            if (invoiceData.status) {
              if (invoiceData.data[0].id !== Number(req.params.id)) {
                return Promise.reject(responseMessages.configurations.invoiceEmailTemplates.globalAlreadyExist);
              }
            }
          });
        }
        return true;
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
   *    + call the update service function
   *        - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
  */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    await invoiceEmailTemplatesService.update(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'upadte Invoice Email Templates response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 *Index Invoice Email Templates.
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to fetch Invoice Email Templates data.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Define the validation rules as follows:
 *    + request_id(request param) is mandatory.
 *  - Run the validation rules.
 *    + If validation is successful:
 *      ~ Call the service(invoiceEmailTemplatesService) function(index) to fetch the Invoice Email Templates data from 'invoice_email_templates' table.
 *        # Add the service function (index) return data to the response.
 *    + Else:
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Log the response.
 *  - Return the response using responseHandler().
 *        
 * Notes:
 *  - Handling expection using try catch
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Index Invoice Email Templates request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  const requestId = req.query.request_id;
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    const condition = { is_global: true };
    const invoiceData = await invoiceEmailTemplatesService.index(condition);
    if (!invoiceData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: invoiceData.message, error: invoiceData.error, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: invoiceData.data };
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse('info', req, responseData, 'Index Invoice Email Templates Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

module.exports = { index, store, update };
