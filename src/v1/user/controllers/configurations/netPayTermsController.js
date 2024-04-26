const { check, validationResult } = require('express-validator');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { logRequest, logResponse } = require('../../../../../utils/log');
const netPayTermsService = require('../../services/configurations/netPayTermsService');
const { responseHandler } = require('../../../../responseHandler');
const { tryCatch } = require('../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const { pagination } = require('../../../../../config/pagination');
const indexServices = require('../../services/index');
const indexRepository = require('../../repositories/index');
const { regexPatterns } = require('../../../../../constants/regexPatterns');


/**
 * Create a new net pay terms entry based on the provided request body.
 * 
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to create a new net pay terms entry.
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
 *    + 'days' is mandatory and should be a positive integer.
 *      - Checks if 'days' already exists in the 'net_pay_terms' table.
 *    + 'is_active' is mandatory and should be a boolean value.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the 'store' function from the Net Pay Terms service.
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
  logRequest('info', req, 'New net pay terms creation  request');
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
    check('days')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.netPayTerms.daysRequired)
      .matches(regexPatterns.numbersSpaceRegex).withMessage(responseMessages.configurations.netPayTerms.daysInvalid)
      .custom((value) => {
        return indexServices.find('net_pay_terms', ['id'], { days: value }).then((netPayTerms) => {
          const netPayTermsData = netPayTerms.status;
          if (netPayTermsData) {
            return Promise.reject(
              responseMessages.configurations.netPayTerms.daysAlreadyExists,
            );
          }
        });
      }),
    check('is_active').notEmpty().withMessage(responseMessages.configurations.netPayTerms.statusRequired).isBoolean().withMessage(responseMessages.configurations.netPayTerms.statusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.netPayTerms.statusRequired).isBoolean().withMessage(responseMessages.configurations.netPayTerms.statusInvalid),
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
   *    + Call the createTenant service function
   *        - Based on the status in createTenant function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    await netPayTermsService.store(req.body);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.addedSuccessfully,
    };
    /* Log Response */
    logResponse('info', req, responseData, 'New net pay terms registration response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Update an existing net pay terms entry based on the provided request body and identifier.
 * 
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to update the net pay terms entry.
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
 *    + 'id' is mandatory and should be a valid integer that exists in the 'net_pay_terms' table.
 *    + 'days' is mandatory and should be a positive integer.
 *      - Checks if 'days' already exists in the 'net_pay_terms' table, excluding the current entry.
 *    + 'is_active' is mandatory and should be a boolean value.
 *      - If 'is_active' is set to 'false' (or 0)
 *          ~ check if the net pay terms entry is associated with 'invoice_configurations', 'invoices', or 'bills' tables based on net_pay_terms_id(req.params.id).
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the 'update' function from the Net Pay Terms service.
 *    + Prepare a response with success status and message.
 *  - If validation fails:
 *    + Return an error message with the status code 'Unprocessable Entity'.
 * 
 * @param {Object} req - The HTTP request object containing the request body and identifier.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update netPay Terms type request.');
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
      .withMessage(responseMessages.configurations.netPayTerms.IdRequired)
      .isInt().withMessage(responseMessages.configurations.netPayTerms.IdInvalid)
      .custom(async (value) => {
        const netPayTerms = await indexServices.find('net_pay_terms', ['id'], { id: value }, req.headers.tenant_id);
        const netPayTermsData = netPayTerms.status;
        if (!netPayTermsData) {
          return Promise.reject(responseMessages.configurations.netPayTerms.IdNotExists);
        }
      }),
    check('days')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.netPayTerms.daysRequired)
      .matches(regexPatterns.numbersSpaceRegex).withMessage(responseMessages.configurations.netPayTerms.daysInvalid)
      .custom(async (value) => {
        const netPayTerms = await indexServices.find('net_pay_terms', ['id'], { days: value, deleted_at: null });
        const status = netPayTerms.status;
        if (status) {
          if (netPayTerms.data[0].id !== Number(req.params.id)) {
            return Promise.reject(responseMessages.configurations.netPayTerms.daysAlreadyExists);
          }
        }
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.configurations.netPayTerms.statusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.netPayTerms.statusInvalid)
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('invoice_configurations', { net_pay_terms_id: req.params.id }, [], true).then((netPayTerms) => {
            if (Number(netPayTerms.data) != 0) {
              return Promise.reject("net pay terms is mapped for" + " " + netPayTerms.data + " " + "invoice configurations");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('ledgers', { net_pay_terms_id: req.params.id }, [], true).then((netPayTerms) => {
            if (Number(netPayTerms.data) != 0) {
              return Promise.reject("net pay terms is mapped for" + " " + netPayTerms.data + " " + "ledgers");
            }
          });
        }
        return true
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
   *    + call the update service function
   *        - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
  */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    await netPayTermsService.update(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'Update net pay terms Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Update the status of an existing net pay terms entry based on the provided request body and identifier.
 * 
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to update the status of the net pay terms entry.
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
 *    + 'id' is mandatory and should be a valid integer that exists in the 'net_pay_terms' table.
 *    + 'is_active' is mandatory and should be a boolean value.
 *      - If 'is_active' is set to 'false' (or 0)
 *          ~ check if the net pay terms entry is associated with 'invoice_configurations', 'invoices', or 'bills' tables based on net_pay_terms_id(req.params.id).
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the 'updateStatus' function from the Net Pay Terms service.
 *    + Prepare a response with success status and message.
 *  - If validation fails:
 *    + Return an error message with the status code 'Unprocessable Entity'.
 * 
 * @param {Object} req - The HTTP request object containing the request body and identifier.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const updateStatus = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'status update request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.netPayTerms.IdRequired)
      .isInt().withMessage(responseMessages.configurations.netPayTerms.IdInvalid)
      .custom((value) => {
        return indexServices.find('net_pay_terms', ['id'], { id: value }, req.headers.tenant_id).then((netPayTerms) => {
          const netPayTermsData = netPayTerms.status;
          if (!netPayTermsData) {
            return Promise.reject(responseMessages.configurations.netPayTerms.IdNotExists);
          }
        });
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.configurations.netPayTerms.statusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.netPayTerms.statusInvalid)
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('invoice_configurations', { net_pay_terms_id: req.params.id }, [], true).then((netPayTerms) => {
            if (Number(netPayTerms.data) != 0) {
              return Promise.reject("net pay terms is mapped for" + " " + netPayTerms.data + " " + "invoice configurations");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('ledgers', { net_pay_terms_id: req.params.id }, [], true).then((netPayTerms) => {
            if (Number(netPayTerms.data) != 0) {
              return Promise.reject("net pay terms is mapped for" + " " + netPayTerms.data + " " + "ledgers");
            }
          });
        }
        return true
      })
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
   * + Call the service function
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    await netPayTermsService.updateStatus(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'status update Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Retrieve a paginated list of net pay details based on the provided search criteria.
 * 
 * Overview of API:
 *  - Validate the request, ensuring the presence of a request ID.
 *    + If successful
 *      ~ Call the service function to fetch net pay details data.
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
 *    + Call the 'listing' function from the Net Pay Terms service and fecth the data from 'net_pay_terms' table.
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
  logRequest('info', req, 'Getting netPay Details request');
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
    if (search != '' && search != null && search != undefined) {
      var condition = { global_search: `"net_pay_terms"."days" = ${search}` }
    } else {
      var condition = {}
    }

    const netPayData = await netPayTermsService.listing(condition, page, limit);
    if (!netPayData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: netPayData.message, error: netPayData.error, data: [], pagination: netPayData.pagination };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: netPayData.data, pagination: netPayData.pagination_data, activity: netPayData.activity };
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Getting netPay Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Retrieve the details of an net pay details by its ID.
 * 
 * Overview of API:
 *  - Validate the request, ensuring the presence of a request ID and a valid 'id'.
 *    + If successful
 *      ~ Call the service function to fetch net pay details by ID.
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
 *    + 'id' is mandatory, should be an integer, and must exist in the 'net_pay_terms' table.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the 'index' function from the 'netPayTermsService' service to fetch the net pay details.
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
  logRequest('info', req, 'getting netPayTerms index request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.netPayTerms.IdRequired)
      .isInt().withMessage(responseMessages.configurations.netPayTerms.IdInvalid)
      .custom(async (value) => {
        const netPayTermsData = await indexServices.find('net_pay_terms', ['id'], { id: value });
        const status = netPayTermsData.status;
        if (!status) {
          return Promise.reject(responseMessages.configurations.netPayTerms.IdNotExists);
        }
      }),
  ];
  /* Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req);
    if (result.errors.length) break;
  }
  const errors = validationResult(req);
  /* Run the validation rules. */

  /**
     * If validation is success
     *    + call the index service function
     *        - Based on the status in index function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
    */
  if (errors.isEmpty()) {
    const condition = { id: req.query.id };
    const netPayTermsData = await netPayTermsService.index(condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: netPayTermsData.data };

    /* Log Response */
    logResponse('info', req, responseData, 'netPayTerms index Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Retrieve a list of net pay terms for use in a dropdown or selection.
 * 
 * Overview of API:
 *  - Validate the request by checking the presence of a request ID.
 *    + If successful
 *      ~ Call the service function to retrieve a list of net pay terms based on the search criteria.
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
 *    + Check for a search query parameter
 *      ~ if not provided, use an empty string.
 *    + Call the common 'find' function to retrieve a list of net pay terms from 'net_pay_terms' table.
 *    + If data exists:
 *       ~ Prepare a response with the fetched data, pagination details, and activity logs.
 *    + Else :
 *       ~ Prepare a response with the error massage and empty data, pagination details, and activity logs.
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
  logRequest('info', req, 'Getting netPay Details request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];

  const requestId = req.query.request_id;
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    /* Default variable */
    const search = req.query.search ? req.query.search : '';
    /* Default variable */
    let condition;
    if (search != '' && search != undefined) {
      condition = { global_search: `"days" >= ${search}`, is_active: true };
    } else {
      condition = { is_active: true };
    }

    /* Writing validation rules to the input request */
    const netPayData = await indexRepository.find('net_pay_terms', ['id', 'days as value'], condition, 0, [], 0, 'days', 'asc');
    if (!netPayData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: netPayData.message, error: netPayData.error, data: [] };
    } else {
      const modifiedData = netPayData.data.map(item => {
        // Renaming 'value' key to 'days' in each object
        return { ...item, days: item.value, value: undefined };
      });
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: modifiedData };
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse('info', req, responseData, 'Getting net pay  Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Delete a net pay terms entry from the collection.
 * 
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Delete the net pay terms details.
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
 *    + 'id' (Request params) is mandatory, should be an integer, and must exist in the 'net_pay_terms' table as an editable item.
  *      ~ check if the net pay terms entry is associated with 'invoice_configurations', 'invoices', or 'bills' tables based on net_pay_terms_id(req.params.id).
 *  - Run the validation rules.
 *    + If validation is successful:
 *      ~ Create a condition object based id(req.params.id)
 *      ~ Call the service function (destroy) to remove the net pay terms details.
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
  logRequest('info', req, 'Delete netPayTerms request');
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
      .withMessage(responseMessages.configurations.netPayTerms.IdRequired)
      .isInt().withMessage(responseMessages.configurations.netPayTerms.IdInvalid)
      .custom((value) => {
        return indexServices.find('net_pay_terms', ['id', 'days'], { id: value }).then((netPayTerms) => {
          const netPayTermsData = netPayTerms.status;
          if (!netPayTermsData) {
            return Promise.reject(responseMessages.configurations.netPayTerms.IdNotExists);
          }
          req.body.days = netPayTerms.data[0].days
        });
      })
      .custom((value) => {
        return indexServices.count('invoice_configurations', { net_pay_terms_id: value }, [], true).then((netPayTerms) => {
          if (Number(netPayTerms.data) != 0) {
            return Promise.reject("net pay terms is mapped for" + " " + netPayTerms.data + " " + "invoice configurations");
          }
        });
      })
      .custom((value) => {
        return indexServices.count('ledgers', { net_pay_terms_id: value }, [], true).then((netPayTerms) => {
          if (Number(netPayTerms.data) != 0) {
            return Promise.reject("net pay terms is mapped for" + " " + netPayTerms.data + " " + "ledgers");
          }
        })
      })
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
   * + Delete  netPayTerms details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    await netPayTermsService.destroy(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.deletedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'netPayTerms delete Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = { destroy, dropdown, listing, index, store, update, updateStatus };
