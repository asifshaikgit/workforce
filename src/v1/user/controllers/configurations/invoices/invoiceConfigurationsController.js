const invoiceConfigurationService = require('../../../services/configurations/invoice/invoiceConfigurationsService');
const indexServices = require('../../../services/index');
const { check, validationResult } = require('express-validator');
const { logRequest, logResponse } = require('../../../../../../utils/log');
const { responseMessages } = require('../../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../../constants/responseCodes');
const { responseHandler } = require('../../../../../responseHandler');
const { tryCatch } = require('../../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../../error/InvalidRequestError');

/**
 * Create a new invoice configuration entry based on the provided request body.
 * 
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to fetch contact information data.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set a default variable for the response data.
 *  - Define validation rules for the input request:
 *    + 'request_id' is mandatory.
 *    + 'net_pay_terms_id' is mandatory and should exist in 'net_pay_terms' table.
 *    + 'cycle_id' is mandatory and should exist in 'cycles' table.
 *    + 'is_global' is mandatory, should be a boolean
 *        ~ if true, no other global configuration should exist.
 *    + 'day_start_id' is required under certain conditions.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the 'store' function from the Invoice Configuration service.
 *    + Prepare a response with success status and message.
 *    + Log the response.
 *    + Return the response using responseHandler.
 *  - If validation fails:
 *    + Throw an 'InvalidRequestError' with the first error message and a status code of 'Unprocessable Entity'.
 * 
 * @param {Object} req - The HTTP request object containing the request body.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const  store = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'New Invoice Configuration request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('net_pay_terms_id').trim().escape().notEmpty().withMessage(responseMessages.configurations.invoiceConfiguration.netPayTermsIdRequired)
      .custom(async (value) => {
        const netPayTermsData = await indexServices.find('net_pay_terms', ['id'], { id: value });
        if (!netPayTermsData.status) {
          return Promise.reject(responseMessages.configurations.invoiceConfiguration.invalidNetPayTermsId);
        }
      }),
    check('cycle_id').trim().escape().notEmpty().withMessage(responseMessages.configurations.invoiceConfiguration.cycleIdRequired)
      .custom(async (value) => {
        const cycleData = await indexServices.find('cycles', ['id'], { id: value });
        if (!cycleData.status) {
          return Promise.reject(responseMessages.configurations.invoiceConfiguration.invalidCycleId);
        }
      }),
    check('is_global').trim().escape().notEmpty().withMessage(responseMessages.configurations.invoiceConfiguration.globalRequired)
      .isBoolean().withMessage(responseMessages.configurations.invoiceConfiguration.globalInvalid)
      .custom(async (value) => {
        if (value === 'true') {
          const invoiceConfigData = await indexServices.find('invoice_configurations', ['id'], { is_global: true });
          if (invoiceConfigData.status) {
            return Promise.reject(responseMessages.configurations.invoiceConfiguration.globalAlreadyExist);
          }
        }
      }),
    check('day_start_id').trim().escape()
      .custom((value) => {
        if (req.body.cycle_id === 1 || req.body.cycle_id === 2) {
          if (!value) {
            return Promise.reject(responseMessages.configurations.invoiceConfiguration.startDayRequired);
          }
        }
        if (req.body.cycle_id === 1 || req.body.cycle_id === 2) {
          return indexServices.find('days', ['id'], { id: value }).then((daysData) => {
            if (!daysData.status) {
              return Promise.reject(responseMessages.configurations.invoiceConfiguration.invalidDayId);
            }
          });
        }
        return true;
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
    await invoiceConfigurationService.store(req.body);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'Invoice Configuration response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Update an existing invoice configuration entry based on the provided request body and parameters.
 * 
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to update the invoice configuration.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set a default variable for the response data.
 *  - Define validation rules for the input request:
 *    + 'request_id' is mandatory.
 *    + 'id' is mandatory and should exist in 'invoice_configurations' table without being deleted.
 *    + 'net_pay_terms_id' is mandatory and should exist in 'net_pay_terms' table.
 *    + 'cycle_id' is mandatory and should exist in 'cycles' table.
 *    + 'is_global' is mandatory, should be a boolean, and if true, no other global configuration should exist except for the one being updated.
 *    + 'day_start_id' is required under certain conditions.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the 'update' function from the Invoice Configuration service.
 *    + Prepare a response with success status and message.
 *    + Log the response.
 *    + Return the response using responseHandler.
 *  - If validation fails:
 *    + Throw an 'InvalidRequestError' with the error message and a status code.
 * 
 * @param {Object} req - The HTTP request object containing the request body and parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update Invoice Configuration request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.invoiceConfiguration.IdRequired)
      .custom(async (value) => {
        const invoiceData = await indexServices.find('invoice_configurations', ['id'], { id: value, deleted_at: null });
        if (!invoiceData.status) {
          return Promise.reject(responseMessages.configurations.invoiceConfiguration.IdNotExists);
        }
      }),
    check('net_pay_terms_id').trim().escape().notEmpty().withMessage(responseMessages.configurations.invoiceConfiguration.netPayTermsIdRequired)
      .custom((value) => {
        return indexServices.find('net_pay_terms', ['id'], { id: value }).then((netPayTermsData) => {
          if (!netPayTermsData.status) {
            return Promise.reject(responseMessages.configurations.invoiceConfiguration.invalidNetPayTermsId);
          }
        });
      }),
    check('cycle_id').trim().escape().notEmpty().withMessage(responseMessages.configurations.invoiceConfiguration.cycleIdRequired)
      .custom((value) => {
        return indexServices.find('cycles', ['id'], { id: value }).then((cycleData) => {
          if (!cycleData.status) {
            return Promise.reject(responseMessages.configurations.invoiceConfiguration.invalidCycleId);
          }
        });
      }),
    check('is_global').trim().escape().notEmpty().withMessage(responseMessages.configurations.invoiceConfiguration.globalRequired)
      .isBoolean().withMessage(responseMessages.configurations.invoiceConfiguration.globalInvalid)
      .custom((value) => {
        if (value === 'true') {
          return indexServices.find('invoice_configurations', ['id'], { is_global: true }).then((invoiceData) => {
            if (invoiceData.status) {
              if (invoiceData.data[0].id !== Number(req.params.id)) {
                return Promise.reject(responseMessages.configurations.invoiceConfiguration.globalAlreadyExist);
              }
            }
          });
        }
        return true;
      }),
    check('day_start_id').trim().escape()
      .custom((value) => {
        if (req.body.cycle_id === 1 || req.body.cycle_id === 2) {
          if (!value) {
            return Promise.reject(responseMessages.configurations.invoiceConfiguration.startDayRequired);
          }
        }
        if (req.body.cycle_id === 1 || req.body.cycle_id === 2) {
          return indexServices.find('days', ['id'], { id: value }).then((daysData) => {
            if (!daysData.status) {
              return Promise.reject(responseMessages.configurations.invoiceConfiguration.invalidDayId);
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
    await invoiceConfigurationService.update(req.body, null, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'Invoice Configuration Update response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Retrieve the details of an invoice configuration entry by its ID.
 * 
 * Overview of API:
 *  - Validate the request, ensuring the presence of a request ID.
 *    + If successful
 *      ~ Call the service function to fetch invoice configuration details.
 *      ~ Prepare the response with the fetched data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set a default variable for the response data.
 *  - Extract the 'request_id' from the query parameters.
 *  - If 'request_id' is present and not empty:
 *    + Call the 'index' function from the Invoice Configuration service to fetch the details from 'invoice_configurations' table.
 *    + Prepare a response with the fetched data.
 *  - If 'request_id' is missing or empty:
 *    + Throw an 'InvalidRequestError' with the error message stating that 'request_id' is required.
 * 
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If 'request_id' is missing or empty.
 */
const index = tryCatch(
  async (req, res) => {
    /* Log Request */
    logRequest('info', req, 'getting single Invoice Configuaration request');
    /* Log Request */

    /* Default variable */
    let responseData = [];
    const requestId = req.query.request_id;
    /* Default variable */

    if (requestId !== undefined && requestId !== '') {
      const condition = { is_global: true };
      const invoiceData = await invoiceConfigurationService.index(condition);
      if (!invoiceData.status) {
        responseData = { statusCode: responseCodes.codeSuccess, message: invoiceData.message, error: invoiceData.error, data: [] };
      } else {
        responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: invoiceData.data };
      }
      /* Writing validation rules to the input request */

      /* Log Response */
      logResponse('info', req, responseData, 'Invoice Configuration index Response');
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData);
      /* Return the response */
    } else {
      throw new InvalidRequestError(responseMessages.common.requestIdRequired);
    }
});

module.exports = { index, store, update };
