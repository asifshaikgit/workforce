const { check, validationResult } = require('express-validator');
const { responseMessages } = require('../../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../../constants/responseCodes');
const { logRequest, logResponse } = require('../../../../../../utils/log');
const invoiceTaxesService = require('../../../services/configurations/invoice/invoiceTaxesService');
const indexServices = require('../../../services/index');
const { responseHandler } = require('../../../../../responseHandler');
const { tryCatch } = require('../../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../../error/InvalidRequestError');
const { pagination } = require('../../../../../../config/pagination');

/**
 * Create a new invoice tax entry based on the provided request body.
 * 
 * * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to fetch contact information data.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log Request
 *  - Set default variable for the response data
 *  - Define the validation rules as follows:
 *    + 'request_id' is mandatory.
 *    + 'name' is mandatory and should not contain special characters.
 *      - checks if 'name' already exists in the 'invoice_taxes' table.
 *    + 'type' is mandatory and should be either 1 or 2.
 *    + 'value' is mandatory and depends on 'type':
 *      - If 'type' is 1, 'value' should be between 0 and 100 (inclusive).
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the 'store' function from the Invoice Taxes service.
 *    + Prepare a response with success status and message.
 *  - If validation fails:
 *    + Return an error message with the status code 'Unprocessable Entity'.
 * 
 * @param {Object} req - The HTTP request object containing the request body.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const store = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'New invoice taxes creation request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('name')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.InvoiceTaxes.InvoiceTaxesNameRequired)
      .not().matches(/[{}?!'~$%*><]/)
      .withMessage(responseMessages.configurations.InvoiceTaxes.InvoiceTaxesNameInvalid)
      .custom((value) => {
        return indexServices.find('invoice_taxes', ['id'], { name: value }).then((invoiceTaxes) => {
          const invoiceTaxesData = invoiceTaxes.status;
          if (invoiceTaxesData) {
            return Promise.reject(responseMessages.configurations.InvoiceTaxes.InvoiceTaxesNameExists)
          }
        })
      }),
    check('type')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.InvoiceTaxes.InvoiceTaxesTypeRequired)
      .isIn([1, 2])
      .withMessage(responseMessages.configurations.InvoiceTaxes.InvoiceTaxesTypeInvalid),
    check('value')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.InvoiceTaxes.InvoiceTaxesValueRequired)
      .custom((value, { req }) => {
        if (req.body.type === '1') {
          const floatValue = parseFloat(value);
          if (floatValue <= 0 || floatValue > 100) {
            throw new Error('If type is 1, the value should be between 0 and 100 (inclusive).');
          }
        }
        return true;
      })
      .withMessage(responseMessages.configurations.InvoiceTaxes.InvoiceTaxesValueInvalid),
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
     *  + Call the create invoice taxes service function
     *  - Based on the status in create invoice taxes function response, segregate the response and prepare the response
     * If Validation Fails
     *  + Return the error message.
     */
  if (errors.isEmpty()) {
    await invoiceTaxesService.store(req.body);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.addedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'New invoice Taxes registration response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Update an existing invoice tax entry based on the provided request body.
 * 
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to update the existing invoice tax data.
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
 *    + 'id' is mandatory, should be a numeric value, and must exist in the 'invoice_taxes' table.
 *    + 'name' is mandatory and should not contain special characters.
 *    + 'type' is mandatory and should be either 1 or 2.
 *    + 'value' is mandatory and depends on 'type':
 *      - If 'type' is 1, 'value' should be between 0 and 100 (inclusive).
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Construct a condition object for updating the entry based on the request parameters.
 *    + Call the 'update' function from the Invoice Taxes service.
 *    + Prepare a response with success status and message.
 *  - Else:
 *    + Return an error message with the status code.
 * 
 * @param {Object} req - The HTTP request object containing the request body and parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update invoice taxes request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.InvoiceTaxes.invoiceTaxesIdRequired)
      .isInt().withMessage(responseMessages.configurations.InvoiceTaxes.invoiceTaxesIdInvalid)
      .custom((value) => {
        return indexServices.find('invoice_taxes', ['id'], { id: value }).then(invoiceTaxes => {
          const invoiceTaxesData = invoiceTaxes.status;
          if (!invoiceTaxesData) {
            return Promise.reject(responseMessages.configurations.InvoiceTaxes.IdNotExists);
          }
        });
      }),

    check('name')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.InvoiceTaxes.InvoiceTaxesNameRequired)
      .not().matches(/[{}?!'~$%*><]/)
      .withMessage(responseMessages.configurations.InvoiceTaxes.InvoiceTaxesNameInvalid),
    check('type')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.InvoiceTaxes.InvoiceTaxesTypeRequired)
      .isIn([1, 2])
      .withMessage(responseMessages.configurations.InvoiceTaxes.InvoiceTaxesTypeInvalid),
    check('value')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.InvoiceTaxes.InvoiceTaxesValueRequired)
      .custom((value, { req }) => {
        if (req.body.type === '1') {
          const floatValue = parseFloat(value);
          if (floatValue <= 0 || floatValue > 100) {
            throw new Error('If type is 1, the value should be between 0 and 100 (inclusive).');
          }
        }
        return true;
      })
      .withMessage(responseMessages.configurations.InvoiceTaxes.InvoiceTaxesValueInvalid),
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
     *  + call the update service function
     *   - Based on the status in update function response, segregate the response and prepare the response
     * If Validation Fails
     *  + Return the error message.
     */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    await invoiceTaxesService.update(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'Update invoice taxes Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Update the configuration to enable or disable taxes for invoices.
 * 
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to update the configuration.
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
 *    + 'enable_taxes_for_invoices' is mandatory and should be a boolean value.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the 'updateEnableTaxInvoice' function from the Invoice Taxes service.
 *    + Prepare a response with success status and message.
 *  - Else:
 *    + Return an error message with the status code.
 * 
 * @param {Object} req - The HTTP request object containing the request body.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const updateEnableTaxInvoice = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update organization request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('enable_taxes_for_invoices')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.InvoiceTaxes.enableTaxesForInvoicesRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.InvoiceTaxes.enableTaxesForInvoicesInvalid),
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
     *  + call the update service function
     *   - Based on the status in update function response, segregate the response and prepare the response
     * If Validation Fails
     *  + Return the error message.
     */
  if (errors.isEmpty()) {
    await invoiceTaxesService.updateEnableTaxInvoice(req.body);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'Update organization Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Retrieve a paginated list of invoice taxes details based on the provided search criteria.
 * 
 * Overview of API:
 *  - Validate the request, ensuring the presence of a request ID.
 *    + If successful
 *      ~ Call the service function to fetch invoice taxes data.
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
 *    + Call the 'listing' function from the Invoice Taxes service.
 *    + If data exists:
 *       ~ Prepare a response with the fetched data, pagination details, and activity logs.
 *    + Else :
 *       ~ Prepare a response with the error massage and empty data, pagination details, and activity logs.
 *  - Else:
 *    + Return an error message indicating the request ID is required.
 * 
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If a valid request ID is not provided.
 */
const listing = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting invoice taxes Details request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  const requestId = req.query.request_id;
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    /* Default variable */
    const limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
    const page = (req.query.page) ? (req.query.page) : pagination.page;
    const search = req.query.search ? req.query.search : '';
    /* Default variable */

    /* Writing validation rules to the input request */
    const condition = { search };
    const invoiceTaxesData = await invoiceTaxesService.listing(condition, page, limit);
    if (!invoiceTaxesData.status) {
      responseData = { statusCode: responseCodes.codeInternalError, error: invoiceTaxesData.error, message: responseMessages.common.noRecordFound, data: [], pagination: invoiceTaxesData.pagination_data, activity: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: invoiceTaxesData.data, pagination: invoiceTaxesData.pagination_data, activity: invoiceTaxesData.activity };
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Getting invoice taxes Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Retrieve the details of an invoice tax by its ID.
 * 
 * Overview of API:
 *  - Validate the request, ensuring the presence of a request ID and a valid 'id'.
 *    + If successful
 *      ~ Call the service function to fetch invoice tax details by ID.
 *      ~ Prepare the response with the fetched data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set a default variable for the response data.
 *  - Define the validation rules as follows:
 *    + 'request_id' is mandatory.
 *    + 'id' is mandatory, should be an integer, and must exist in the 'invoice_taxes' table.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the 'index' function from the Invoice Taxes service to fetch the invoice tax details.
 *    + Prepare a response with the fetched data.
 *  - Else :
 *    + Return an error message with the status code.
 * 
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there are validation errors in the request or if the request ID is missing.
 */
const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'getting invoice taxes index request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.InvoiceTaxes.invoiceTaxesIdRequired)
      .isInt().withMessage(responseMessages.configurations.InvoiceTaxes.invoiceTaxesIdInvalid)
      .custom(async (value) => {
        const invoiceTaxesData = await indexServices.find('invoice_taxes', ['id'], { id: value });
        const status = invoiceTaxesData.status;
        if (!status) {
          return Promise.reject(responseMessages.configurations.InvoiceTaxes.IdNotExists);
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
     *  + call the update service function
     *  - Based on the status in update function response, segregate the response and prepare the response
     * If Validation Fails
     *  + Return the error message.
    */
  if (errors.isEmpty()) {
    const condition = { id: req.query.id };
    const invoiceTaxesData = await invoiceTaxesService.index(condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: invoiceTaxesData.data };

    /* Log Response */
    logResponse('info', req, responseData, 'invoice taxes index Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Retrieve a list of invoice taxes for use in a dropdown or selection.
 * 
 * Overview of API:
 *  - Validate the request by checking the presence of a request ID.
 *    + If successful
 *      ~ Call the service function to retrieve a list of invoice taxes based on the search criteria.
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
 *    + Check for a search query parameter; if not provided, use an empty string.
 *    + Call the common 'find' function to retrieve a list of invoice taxes from 'invoice_taxes' table.
 *    + Prepare the response with the fetched data
 *    + Logging the response
 *    + Return the response using responseHandler()  
 *  - Else :
 *    - Throw an 'InvalidRequestError' with an appropriate message.
 * 
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there is no request ID provided in the request.
 */
const dropdown = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting invoice taxes Details Request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  const requestId = req.query.request_id;
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    /* Default variable */
    const search = req.query.search ? req.query.search : '';
    /* Default variable */

    /* Writing validation rules to the input request */
    const condition = { search };
    const invoiceTaxesData = await indexServices.find('invoice_taxes', ['id', 'name as value'], condition);
    if (!invoiceTaxesData.status) {
      responseData = { statusCode: responseCodes.codeInternalError, error: invoiceTaxesData.error, message: responseMessages.common.noRecordFound, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: invoiceTaxesData.data };
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse('info', req, responseData, 'Getting invoice taxes Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Delete an invoice tax entry from the collection.
 * 
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Delete the invoice tax details.
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
 *    + 'id' (Request params) is mandatory, should be an integer, and must exist in the 'invoice_taxes' table as an editable item.
 *  - Run the validation rules.
 *    + If validation is successful:
 *      ~ Call the service function (destroy) to remove the invoice tax details.
 *      ~ Prepare the response with success and a deletion message.
 *    + If validation fails:
 *      ~ Return an error message with a status code.
 *  - Log the response.
 *  - Return the response using responseHandler().
 *        
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const destroy = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Delete invoice taxes Request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.InvoiceTaxes.invoiceTaxesIdRequired)
      .isInt().withMessage(responseMessages.configurations.InvoiceTaxes.invoiceTaxesIdInvalid)
      .custom((value) => {
        return indexServices.find('invoice_taxes', ['id', 'name'], { id: value }).then((invoicetax) => {
          const invoicetaxData = invoicetax.status;
          if (!invoicetaxData) {
            return Promise.reject(
              responseMessages.configurations.InvoiceTaxes.invoiceTaxesIdNotExists,
            );
          }
          req.body.name = invoicetax.data[0].name
        });
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
     * + Delete  invoice taxes details in the collection.
     * If Validation Fails
     * + Return the error message.
     */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    await invoiceTaxesService.destroy(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.deletedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'invoice taxes delete Response');
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
},
);

module.exports = { destroy, dropdown, index, listing, store, update, updateEnableTaxInvoice };
