const { check, validationResult } = require('express-validator');
const { responseMessages } = require('../../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../../constants/responseCodes');
const { logRequest, logResponse } = require('../../../../../../utils/log');
const invoiceWriteOffServices = require('../../../services/configurations/invoice/invoiceWriteOffServices');
const indexServices = require('../../../services/index');
const { responseHandler } = require('../../../../../responseHandler');
const { tryCatch } = require('../../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../../error/InvalidRequestError');
const { pagination } = require('../../../../../../config/pagination');

/**
 * Create a new write-off entry based on the provided request body.
 * 
 * * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to create a new write-off entry.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log Request
 *  - Set a default variable for the response data
 *  - Define the validation rules as follows:
 *    + 'request_id' is mandatory.
 *    + 'write_off_reason' is mandatory and should not contain special characters.
 *      - checks if 'write_off_reason' already exists in the 'write_off' table.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the 'store' function from the write-off service.
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
  logRequest('info', req, 'New write off creation request');
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
    check('write_off_reason')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.writeOff.writeOffRequired)
      .matches(/^[a-zA-Z0-9 /_-]*$/)
      .withMessage(responseMessages.configurations.writeOff.writeOffInvalid)
      .custom((value) => {
        return indexServices.find('write_off', ['id'], { write_off_reason: value }).then((writeOffData) => {
          const writeOffStatus = writeOffData.status;
          if (writeOffStatus) {
            return Promise.reject(responseMessages.configurations.writeOff.writeOffExists);
          }
        });
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
     *    + Call the create write off service function
     *        - Based on the status in create write off function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
     */
  if (errors.isEmpty()) {
    await invoiceWriteOffServices.store(req.body);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'New write off creation response');
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
 * Update an existing write-off entry based on the provided request body and URL parameter (ID).
 * 
 * * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to update the write-off entry.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log Request
 *  - Set a default variable for the response data
 *  - Define the validation rules as follows:
 *    + 'request_id' is mandatory.
 *    + 'id' in URL parameter is mandatory and should be a valid integer representing the write-off ID.
 *      - Checks if the write-off with the provided ID exists in the 'write_off' table.
 *    + 'write_off_reason' is mandatory and should not contain special characters.
 *      - Checks if 'write_off_reason' already exists in the 'write_off' table, excluding the current entry (ID-based).
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the 'update' function from the write-off service.
 *    + Prepare a response with success status and message.
 *  - If validation fails:
 *    + Return an error message with the status code 'Unprocessable Entity'.
 * 
 * @param {Object} req - The HTTP request object containing the request body and URL parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update write off request.');
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
      .notEmpty()
      .withMessage(responseMessages.configurations.writeOff.IdRequired)
      .isInt().withMessage(responseMessages.configurations.writeOff.invalidId)
      .custom(async (value) => {
        const data = await indexServices.find('write_off', ['id'], { id: value });
        if (!data.status) {
          return Promise.reject(responseMessages.configurations.writeOff.invalidId);
        }
      }),
    check('write_off_reason')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.writeOff.writeOffRequired)
      .matches(/^[a-zA-Z0-9 /_-]*$/)
      .withMessage(responseMessages.configurations.writeOff.writeOffRequired)
      .custom((value) => {
        return indexServices.find('write_off', ['id'], { write_off_reason: value }).then((writeOffData) => {
          const status = writeOffData.status;
          if (status) {
            if (writeOffData.data[0].id !== Number(req.params.id)) {
              return Promise.reject(responseMessages.configurations.writeOff.writeOffInvalid);
            }
          }
        });
      }),
      check('is_active')
        .trim()
        .escape()
        .notEmpty()
        .withMessage(responseMessages.configurations.writeOff.statusRequired)
        .isBoolean()
        .withMessage(responseMessages.configurations.writeOff.statusInvalid),
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
    await invoiceWriteOffServices.update(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'Update write Off Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Update Entity Status to enable or disable
 * 
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Call the service function to update the entity status.
 *     ~ Add a success message to the response.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Define the validation rules as follows:
 *   + `request_id` (Request body) is mandatory.
 *   + `id` (Request body) is mandatory, should be an integer, and must exist in the entity table.
 *   + `is_active` (Request body) is mandatory, should be a boolean value.
 *      ~ If 'is_active' is false:
 *        # Check if the entity id is mapped to other entities (e.g., invoices, bills) tables based on write_off_id(req.params.id).
 * - Run the validation rules.
 *   + If validation is successful:
 *     ~ Create a condition based on the provided 'id' (request params).
 *     ~ Call the service function (e.g., `entityService.updateStatus`) to update the entity status.
 *   + Else:
 *     ~ Add error validation to the response.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 *        
 * Notes:
 * - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const updateStatus = tryCatch(
  async (req, res) => {
    /* Log Request */
    logRequest('info', req, 'write-off update status request');
    /* Log Request */

    /* Default variable */
    let responseData = [];
    /* Default variable */

    /* Writing validation rules to the input request */
    const validations = [
      check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
      check('id')
        .trim()
        .notEmpty()
        .withMessage(responseMessages.configurations.writeOff.IdRequired)
        .isInt().withMessage(responseMessages.configurations.writeOff.invalidId)
        .custom((value) => {
          return indexServices.find('write_off', ['id'], { id: value }).then((data) => {
            if (!data.status) {
              return Promise.reject(responseMessages.configurations.writeOff.invalidId);
            }
          });
        }),
      check('is_active')
        .trim()
        .escape()
        .notEmpty()
        .withMessage(responseMessages.configurations.writeOff.statusRequired)
        .isBoolean()
        .withMessage(responseMessages.configurations.writeOff.statusInvalid)
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
       * + call the update service function
       * If Validation Fails
       * + Return the error message.
       */
    if (errors.isEmpty()) {
      const condition = { id: req.params.id };
      await invoiceWriteOffServices.updateStatus(req.body, condition);
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };

      /* Log Response */
      logResponse('info', req, responseData, 'write-off update status response');
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData);
      /* Return the response */
    } else {
      throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});


/**
 * Retrieve a paginated list of write-off details based on the provided search criteria.
 * 
 * Overview of API:
 *  - Validate the request, ensuring the presence of a request ID.
 *    + If successful
 *      ~ Call the service function to fetch write-off details data.
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
 *    + Call the 'listing' function from the Write-Off service.
 *    + Prepare a response with the fetched data, pagination details, and activity logs.
 *  - Else:
 *    + Return an error message indicating the request ID is required.
 * 
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If a valid request ID is not provided.
 */
const listing = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Listing write off Details request');
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
    
    const condition = { global_search: `"write_off"."write_off_reason" ilike '%${req.query.search}%'`};
    const writeOffData = await invoiceWriteOffServices.listing(condition, page, limit);
    if (!writeOffData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: writeOffData.message, error: writeOffData.error, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: writeOffData.data, pagination: writeOffData.pagination_data, activity: writeOffData.activity };
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Listing write off Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
},
);

/**
 * Retrieve the details of an entity by its ID.
 * 
 * Overview of API:
 *  - Validate the request, ensuring the presence of a request ID and a valid 'id'.
 *    + If successful
 *      ~ Call the service function to fetch entity details by ID.
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
 *    + 'id' is mandatory, should be an integer, and must exist in the 'write_off' table.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the 'index' function from the Entity service to fetch the write off details from 'write_off' table.
 *    + Prepare a response with the fetched data.
 *  - Else :
 *    + Return an error message with the status code.
 * 
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there are validation errors in the request or if the request ID is missing.
 */
const index = tryCatch(
  async (req, res) => {
    /* Log Request */
    logRequest('info', req, 'Write off index request');
    /* Log Request */

    /* Default variable */
    let responseData = [];
    /* Default variable */

    /* Writing validation rules to the input request */
    const validations = [
      check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
      check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.writeOff.IdRequired)
        .isInt().withMessage(responseMessages.configurations.writeOff.invalidId)
        .custom(async (value) => {
          const writeOffData = await indexServices.find('write_off', ['id'], { id: value });
          const status = writeOffData.status;
          if (!status) {
            return Promise.reject(responseMessages.configurations.writeOff.IdNotExists);
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
         *    + call the update service function
         *        - Based on the status in update function response, segregate the response and prepare the response
         * If Validation Fails
         *    + Return the error message.
        */
    if (errors.isEmpty()) {
      const condition = { id: req.query.id };
      const writeOffData = await invoiceWriteOffServices.index(condition);
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: writeOffData.data };

      /* Log Response */
      logResponse('info', req, responseData, 'Write off index Response.');
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData);
      /* Return the response */
    } else {
      throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});


/**
 * Retrieve a list of entities for use in a dropdown or selection.
 * 
 * Overview of API:
 *  - Validate the request by checking the presence of a request ID.
 *    + If successful
 *      ~ Call the service function to retrieve a list of entities based on the search criteria.
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
 *       ~ if not provided
 *          - use an empty string.
 *    + Call the common 'find' function to retrieve a list of entities from the 'write_off' table.
 *    + Prepare the response with the fetched data.
 *    + Logging the response.
 *    + Return the response using responseHandler().
 *  - Else:
 *    - Throw an 'InvalidRequestError' with an appropriate message.
 * 
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there is no request ID provided in the request.
 */
const dropdown = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting write off dropdown request.');
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
    const condition = { global_search: `"write_off"."write_off_reason" ilike '%${req.query.search}%'`};
    const writeOffData = await indexServices.find('write_off', ['id', 'write_off_reason as value'], condition, 0);
    if (!writeOffData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: writeOffData.message, error: writeOffData.error, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: writeOffData.data };
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse('info', req, responseData, 'Getting write off dropdown Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
},
);

/**
 * Delete an entity entry from the collection.
 * 
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Delete the entity details.
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
 *    + 'id' (Request params) is mandatory, should be an integer, and must exist in the entity table as an editable item.
 *  - Run the validation rules.
 *    + If validation is successful:
 *      ~ Call the service function (destroy) to remove the entity details from 'write_off' table.
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
  logRequest('info', req, 'Delete write off request');
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
      .withMessage(responseMessages.configurations.writeOff.IdRequired)
      .isInt().withMessage(responseMessages.configurations.writeOff.invalidId)
      .custom((value) => {
        return indexServices.find('write_off', ['id', 'write_off_reason'], { id: value }).then((category) => {
          const writeOffData = category.status;
          if (!writeOffData) {
            return Promise.reject(responseMessages.configurations.writeOff.IdNotExists);
          }
          req.body.name = category.data[0].write_off_reason
        });
      })
      .custom(async (value) => {
        const writeOff = await indexServices.count('ledgers', { write_off_id: value }, [], true);
        if (Number(writeOff.data) != 0) {
          return Promise.reject("write off reason is mapped for" + " " + writeOff.data + " " + "invoices");
        }
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
     * + Delete write off details in the collection.
     * If Validation Fails
     * + Return the error message.
     */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    await invoiceWriteOffServices.destroy(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.deletedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'Delete write off Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
},
);

module.exports = { destroy, dropdown, index, listing, store, update, updateStatus };
