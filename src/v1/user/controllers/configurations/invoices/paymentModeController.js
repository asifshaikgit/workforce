const paymentModeservice = require('../../../services/configurations/invoice/paymentModeService');
const indexServices = require('../../../services/index');
const { check, validationResult } = require('express-validator');
const { logRequest, logResponse } = require('../../../../../../utils/log');
const { responseMessages } = require('../../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../../constants/responseCodes');
const { responseHandler } = require('../../../../../responseHandler');
const { tryCatch } = require('../../../../../../utils/tryCatch');
const { pagination } = require('../../../../../../config/pagination');
const InvalidRequestError = require('../../../../../../error/InvalidRequestError');

/**
 * Store function to save Payment Mode data.
 * 
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to store Payment Mode data.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic: 
 *  - Log incoming request.
 *  - Define the validation rules as follows:
 *    + `request_id` (Request body) is mandatory.
 *    + `name` (Request body) is mandatory, should not contain special characters
 *      ~ Check if name is already exists in 'payment_modes' table
 *    + `is_active` (Request body) is mandatory and should be a boolean value.
 * - Run the validation rules.
 *    + If validation is successful:
 *      ~ Call the service function (store) to store the Payment Mode data.
 *      ~ Prepare the response with success and the added data.
 *    + If validation fails:
 *      ~ Return an error message with a status code.
 *  - Log the response.
 *  - Return the response using responseHandler().
 *        
 * Notes:
 *    - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const store = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'create Payment Mode request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation conditions to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('name')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.configurations.paymentMode.paymentModeNameRequired)
      .not().matches(/[{}?!'~$%*><]/).withMessage(responseMessages.configurations.paymentMode.paymentModeNameInvalid)
      .custom((value) => {
        return indexServices.find('payment_modes', ['id'], { name: value }).then((paymentModeData) => {
          const paymentModeStatus = paymentModeData.status;
          if (paymentModeStatus) {
            return Promise.reject(responseMessages.configurations.paymentMode.paymentModeNameExists);
          }
        });
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.configurations.paymentMode.statusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.paymentMode.statusInvalid),
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
       *    + call the create service function
       *        - Based on the status in create function response, segregate the response and prepare the response
       * If Validation Fails
       *    + Return the error message.
      */
  if (errors.isEmpty()) {
    await paymentModeservice.store(req.body);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'Payment Mode Create Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Update function to modify Payment Mode data.
 * 
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Call the service function to update Payment Mode data.
 *     ~ Add a success message to the response.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic: 
 * - Log incoming request.
 * - Define default variable 'responseData'.
 * - Write validation rules for the input request:
 *    + `request_id` (Request body) is mandatory.
 *    + `id` (Request param) is mandatory, should be an integer, and must exist in the 'payment_modes' table as an editable item.
 *    + `name` (Request body) is mandatory, should not contain special characters
 *      ~ check it must be unique in 'payment_modes' table (excluding the current Payment Mode).
 *    + `is_active` (Request body) is mandatory and should be a boolean value.
 *    + If 'is_active' is set to 'false', check if the Payment Mode is associated with any 'payments'.
 * - Run the validation rules.
 *    + If validation is successful:
 *      ~ Call the service function (update) to modify the Payment Mode data.
 *      ~ Prepare the response with success and an update message.
 *    + If validation fails:
 *      ~ Return an error message with a status code.
 * - Log the response.
 * - Return the response using responseHandler().
 *        
 * Notes:
 *    - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update Payment Mode request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.configurations.paymentMode.paymentModeIdRequired)
      .isInt().withMessage(responseMessages.configurations.paymentMode.paymentModeIdInvalid)
      .custom(async (value) => {
        const paymentModeData = await indexServices.find('payment_modes', ['id', 'is_editable'], { id: value });
        const status = paymentModeData.status;
        if (!status) {
          return Promise.reject(responseMessages.configurations.paymentMode.IdNotExists);
        }
        if (!paymentModeData.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.department.notAllowToModify);
        }
      }),
    check('name')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.configurations.paymentMode.paymentModeNameRequired)
      .not().matches(/[{}?!'~$%*><]/).withMessage(responseMessages.configurations.paymentMode.paymentModeNameInvalid)
      .custom((value) => {
        return indexServices.find('payment_modes', ['id'], { name: value }).then((paymentModeData) => {
          const paymentModeStatus = paymentModeData.status;
          if (paymentModeStatus) {
            if (paymentModeData.data[0].id !== Number(req.params.id)) {
              return Promise.reject(responseMessages.configurations.paymentMode.paymentModeNameExists);
            }
          }
        });
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.configurations.paymentMode.statusRequired)
      .isBoolean().withMessage(responseMessages.configurations.paymentMode.statusInvalid)
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('ledger_payments', { payment_mode_id: req.params.id }, [], true).then((paymentMode) => {
            if (Number(paymentMode.data) != 0) {
              return Promise.reject("payment mode is mapped for" + " " + paymentMode.data + " " + "payments");
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
    await paymentModeservice.update(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'Payment Mode Update Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Update Status function to modify Payment Mode status.
 * 
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Call the service function to update the Payment Mode status.
 *     ~ Add a success message to the response.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic: 
 * - Log incoming request.
 * - Define default variable 'responseData'.
 * - Write validation rules for the input request:
 *    + `request_id` (Request body) is mandatory.
 *    + `id` (Request params) is mandatory, should be an integer, and must exist in the 'payment_modes' table as an editable item.
 *    + `is_active` (Request body) is mandatory and should be a boolean value.
 *      ~ If 'is_active' is set to 'false', check if the Payment Mode is mapped with any 'payments' table records.
 * - Run the validation rules.
 *    + If validation is successful:
 *      ~ Call the service function (updateStatus) to modify the Payment Mode status.
 *      ~ Prepare the response with success and an update message.
 *    + If validation fails:
 *      ~ Return an error message with a status code.
 * - Log the response.
 * - Return the response using responseHandler().
 *        
 * Notes:
 *    - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON.
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
      .notEmpty().withMessage(responseMessages.configurations.paymentMode.paymentModeIdRequired)
      .isInt().withMessage(responseMessages.configurations.paymentMode.paymentModeIdInvalid)
      .custom(async (value) => {
        const paymentModeData = await indexServices.find('payment_modes', ['id','is_editable'], { id: value });
        const status = paymentModeData.status;
        if (!status) {
          return Promise.reject(responseMessages.configurations.paymentMode.IdNotExists);
        }if (!paymentModeData.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.department.notAllowToModify);
        }
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.paymentMode.statusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.paymentMode.statusInvalid)
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('ledger_payments', { payment_mode_id: req.params.id }, [], true).then((paymentMode) => {
            if (Number(paymentMode.data) != 0) {
              return Promise.reject("payment mode is mapped for" + " " + paymentMode.data + " " + "payments");
            }
          });
        }
        return true
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
     * + call the update service function
     * If Validation Fails
     * + Return the error message.
     */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    await paymentModeservice.updateStatus(req.body, condition);
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
 * Listing function to retrieve a paginated list of Payment Modes.
 * 
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Fetch a paginated list of Payment Modes based on search criteria.
 *     ~ Return the list of Payment Modes, pagination data, and activity information.
 *   + Else
 *     ~ Return an error message.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Define default variable 'responseData'.
 * - Extract the 'request_id' from the request query.
 * - Check if 'request_id' is provided and not empty.
 * - Define default variables 'limit' and 'page' for pagination.
 * - Extract 'limit' and 'page' from the request query if provided.
 * - Extract 'search' from the request query to filter Payment Modes based on search criteria.
 * - Writing validation rules for the input request:
 *   + Check if 'search' is provided.
 * - Run the validation rules.
 *   + If validation is successful, proceed with data retrieval.
 *     ~ Create a condition based on the provided 'search', 'limit', and 'page'.
 *     ~ Call the service function to retrieve a paginated list of Payment Modes.
 *     ~ Prepare the response based on the success or failure of the data retrieval.
 *   + If validation fails, return an error message.
 * - Log the response.
 * - Return the response using responseHandler().
 *        
 * Notes:
 * - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const listing = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting payment mode Details request');
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
    const paymentModeData = await paymentModeservice.listing(condition, page, limit);
    if (!paymentModeData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: paymentModeData.message, error: paymentModeData.error, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: paymentModeData.data, pagination: paymentModeData.pagination_data, activity: paymentModeData.activity };
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse('info', req, responseData, 'Getting payment mode Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Index function to retrieve Payment Mode details by ID.
 * 
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Fetch Payment Mode details based on the provided ID.
 *     ~ Return the Payment Mode data.
 *   + Else
 *     ~ Return an error message.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Define default variable 'responseData'.
 * - Writing validation rules to the input request:
 *   + Check if 'request_id' is provided and not empty.
 *   + Check if 'id' is provided and not empty, and it must exist in the 'payment_modes' table.
 * - Run the validation rules.
 *   + If validation is successful, proceed with data retrieval.
 *     ~ Create a condition based on the provided 'id'(request params).
 *     ~ Call the service function to retrieve Payment Mode details from 'payment_modes' table.
 *     ~ Prepare the response based on the success or failure of the data retrieval.
 *   + Else:
 *     ~ return an error message.
 * - Log the response.
 * - Return the response using responseHandler().
 *        
 * Notes:
 * - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'getting payment mode index request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.paymentMode.paymentModeIdRequired)
      .isInt().withMessage(responseMessages.configurations.paymentMode.paymentModeIdInvalid)
      .custom((value) => {
        return indexServices.find('payment_modes', ['id'], { id: value }).then((paymentModeData) => {
          const status = paymentModeData.status;
          if (!status) {
            return Promise.reject(responseMessages.configurations.paymentMode.IdNotExists);
          }
        });
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
    const paymentModeData = await paymentModeservice.index(condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: paymentModeData.data };

    /* Log Response */
    logResponse('info', req, responseData, 'payment mode index Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Dropdown function to retrieve Payment Mode details for populating dropdowns.
 * 
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Fetch Payment Mode details based on search criteria.
 *     ~ Return the Payment Mode data.
 *   + Else
 *     ~ Return an error message.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Define default variable 'responseData'.
 * - Extract 'request_id' from the query parameters.
 * - Check if 'request_id' is provided and not empty.
 *   + If true, proceed with the data retrieval.
 *     ~ Define a search criteria based on the 'search' query parameter and active status.
 *     ~ Call the service function to retrieve Payment Mode details from 'payment_modes' table.
 *     ~ If data exists:
 *        - Prepare response with success code and data.
 *     ~ Else:
 *        - Prepare response with success code and empty data
 *   + Else:
 *     ~ return an error message.
 * - Log the response.
 * - Return the response using responseHandler().
 *        
 * Notes:
 * - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const dropdown = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting payment mode dropdown Details request.');
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
    const condition = { search, is_active: true };
    const paymentModeData = await indexServices.find('payment_modes', ['id', 'name as value'], condition, 0);
    if (!paymentModeData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: paymentModeData.message, error: paymentModeData.error, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: paymentModeData.data };
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse('info', req, responseData, 'Getting payment mode dropdown Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Destroy function to remove a Payment Mode from the collection.
 * 
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Delete the Payment Mode details.
 *     ~ Add a success message to the response.
 *   + Else
 *     ~ Return the error message.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Define default variable 'responseData'.
 * - Write validation rules for the input request:
 *    + `request_id` (Request body) is mandatory.
 *    + `id` (Request params) is mandatory, should be an integer, and must exist in the 'payment_modes' table as an editable item.
 *    + Check if the Payment Mode is linked to any 'payments' records.
 * - Run the validation rules.
 *    + If validation is successful:
 *      ~ Call the service function (destroy) to remove the Payment Mode details.
 *      ~ Prepare the response with success and a deletion message.
 *    + If validation fails:
 *      ~ Return an error message with a status code.
 * - Log the response.
 * - Return the response using responseHandler().
 *        
 * Notes:
 *    - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const destroy = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'delete Payment Mode request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.paymentMode.paymentModeIdRequired)
      .isInt().withMessage(responseMessages.configurations.paymentMode.paymentModeIdInvalid)
      .custom(async (value) => {
        const paymentMode = await indexServices.find('payment_modes', ['id','is_editable', 'name'], { id: value });
        const paymentModeData = paymentMode.status;
        if (!paymentModeData) {
          return Promise.reject(responseMessages.configurations.paymentMode.IdNotExists);
        }if (!paymentMode.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.department.notAllowToModify);
        }
        req.body.name = paymentMode.data[0].name
      }).custom(async (value) => {
        const paymentMode = await indexServices.count('ledger_payments', { payment_mode_id: value }, [], true);
        if (Number(paymentMode.data) != 0) {
          return Promise.reject("payment mode is mapped for" + " " + paymentMode.data + " " + "payments");
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
       * + Delete  payment mode in the collection.
       * If Validation Fails
       * + Return the error message.
      */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    await paymentModeservice.destroy(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.deletedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'Payment Mode Delete Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = { destroy, dropdown, index, listing, store, update, updateStatus };
