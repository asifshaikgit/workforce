const { check, validationResult } = require('express-validator');
const { logRequest, logResponse } = require('../../../../../../utils/log');
const { responseMessages } = require('../../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../../constants/responseCodes');
const { responseHandler } = require('../../../../../responseHandler');
const relationshipTypesService = require('../../../services/configurations/employee/relationshipTypesService');
const indexServices = require('../../../services/index');
const { tryCatch } = require('../../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../../error/InvalidRequestError');
const { pagination } = require('../../../../../../config/pagination');

/**
 * Relationship Type destroy request to delete relationship type data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ delete the details in 'relationship_types' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + id(params) is mandatory, it should be a integer and checked for its existence in 'relationship_types' table.
 *    - check if the relationship type is being used for any employee in 'employee_dependent_details' table.
 *    - check if the relationship type is being used for any employee in 'emergency_contact_information' table.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the relationship type information.
 *      ~ Call the service function(destroy) to delete the data and send request body to the store function.
 *        # Add the service function(destroy) return data to response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Logging the response
 *  - Return response using responseHandler()  
 *        
 * Notes :
 *    - Handling expection using try catch
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {JSON} Json
 * @throws {InvalidRequestError} - If there are validation errors or the relationship type does not exist.
 */
const destroy = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Delete relationship types request');
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
      .withMessage(responseMessages.configurations.relationshipTypes.relationshipTypesId)
      .isInt().withMessage(responseMessages.configurations.relationshipTypes.relationshipTypesIdInvalid)
      .custom((value) => {
        return indexServices.find('relationship_types', ['id', 'name'], { id: value }).then((relationshipTypes) => {
          const relationshipTypesData = relationshipTypes.status;
          if (!relationshipTypesData) {
            return Promise.reject(
              responseMessages.configurations.relationshipTypes.IdNotExists,
            );
          }
          req.body.name = relationshipTypes.data[0].name
        });
      })
      .custom((value) => {
        return indexServices.count('employee_dependent_details', { relationship_id: value }, [], true).then((relationshipTypes) => {
          if (Number(relationshipTypes.data) != 0) {
            return Promise.reject("relationship is mapped for" + " " + relationshipTypes.data + " " + "employee dependent details ");
          }
        });
      })
      .custom((value) => {
        return indexServices.count('emergency_contact_information', { relationship_id: value }, [], true).then((relationshipTypes) => {
          if (Number(relationshipTypes.data) != 0) {
            return Promise.reject("relationship is mapped for" + " " + relationshipTypes.data + " " + "emergency contact information ");
          }
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
       * + Delete relationshipTypes details in the collection.
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    let condition = { id: req.params.id } // condition
    await relationshipTypesService.destroy(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.deletedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'relationshipTypes delete Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Relationship Type dropdown request to fetch relationship type data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'relationship_types' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + search(query) is not mandatory, it should be a string.

 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to fetch the relationship type information.
 *    ~ Call the service function(find) to fetch the data and send the condition(defined above).
 *        # Add the service function(find) return data to response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Logging the response
 *  - Return response using responseHandler()  
 *        
 * Notes :
 *    - Handling expection using try catch
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} Json
 * @throws {InvalidRequestError} - If the requestId is missing or empty.
 */
const dropdown = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting relationshipTypes dropdown Details request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  const requestId = req.query.request_id;
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    /* Default variable */
    const search = req.query.search ? req.query.search : '';
    /* Default variable */

    const condition = { search, is_active: true };
    const relationshipTypesData = await indexServices.find('relationship_types', ['id', 'name as value'], condition, 0);
    if (!relationshipTypesData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: relationshipTypesData.message, error: relationshipTypesData.error, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: relationshipTypesData.data };
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Getting relationshipTypes dropdown Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Handles the update of relationship status based on the received request.
 * - Logs the incoming request for updating relationship status.
 * - Initializes a default variable for the response data.
 * - Validates the incoming request for the necessary fields.
 * - If validation passes, updates the relationship status using the update service function.
 *    - Based on the status in the update function response, prepares the response accordingly:
 *       - If successful, constructs a success response indicating the status update.
 *       - If unsuccessful, constructs an error response with a message and potential error details.
 * - Logs the generated response.
 * - Returns the response to the client.
 *
 * @param {Object} req - Express request object containing details for updating relationship status.
 * @param {Object} res - Express response object to send the response back.
 */
const updateStatus = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update relationship status request.');
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
      .withMessage(responseMessages.configurations.relationshipTypes.relationshipTypesId)
      .isInt().withMessage(responseMessages.configurations.relationshipTypes.relationshipTypesIdInvalid)
      .custom((value) => {
        return indexServices.find('relationship_types', ['id'], { id: value }).then((relationshipTypes) => {
          const relationshipTypesData = relationshipTypes.status;
          if (!relationshipTypesData) {
            return Promise.reject(responseMessages.configurations.relationshipTypes.IdNotExists);
          }
        });
      }),
      check('is_active')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.configurations.relationshipTypes.statusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.relationshipTypes.statusInvalid)
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee_dependent_details', { relationship_id: req.params.id }, [], true).then((relationshipTypes) => {
            if (Number(relationshipTypes.data) != 0) {
              return Promise.reject("relationship is mapped for" + " " + relationshipTypes.data + " " + "employee dependent details ");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('emergency_contact_information', { relationship_id: req.params.id }, [], true).then((relationshipTypes) => {
            if (Number(relationshipTypes.data) != 0) {
              return Promise.reject("relationship is mapped for" + " " + relationshipTypes.data + " " + "emergency contact information ");
            }
          });
        }
        return true
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
    let condition = { id: req.params.id } // condition
    await relationshipTypesService.updateStatus(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'Update relationship status Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Relationship Type index request to fetch relationship type data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'relationship_types' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + id(query) is mandatory, it should be a integer and should be available in 'relationship_types' table.
 *   
 *  - Run the validation rules
 *    + If validation success
 *     ~ Define condition object to fetch the relationship type information.
 *     ~ Call the service function(index) to fetch the data and send the condition(defined above).
 *        # Add the service function(index) return data to response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Logging the response
 *  - Return response using responseHandler()  
 *        
 * Notes :
 *    - Handling expection using try catch
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {JSON} Json
 * @throws {InvalidRequestError} - If there are validation errors.
 */
const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'getting relationshipTypes index request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.relationshipTypes.relationshipTypesId)
      .isInt().withMessage(responseMessages.configurations.relationshipTypes.relationshipTypesIdInvalid)
      .custom(async (value) => {
        const relationshipTypesData = await indexServices.find('relationship_types', ['id'], { id: value });
        const status = relationshipTypesData.status;
        if (!status) {
          return Promise.reject(responseMessages.configurations.relationshipTypes.IdNotExists);
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
    const relationshipTypesData = await relationshipTypesService.index(condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: relationshipTypesData.data };

    /* Log Response */
    logResponse('info', req, responseData, 'relationshipTypes index Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Relationship Type listing request to fetch relationship type data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'relationship_types' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + limit(query) is not mandatory, it should be a integer.
 *    + page(query) is not mandatory, it should be a integer.
 *    + search(query) is mandatory, it should be a string.
 *    + sort_column(query) is not mandatory.
 *    + sort_order(query) is not mandatory.
 *   
 *  - Run the validation rules
 *    + If validation success
 *   ~ Define condition object to fetch the relationship type information.
 *      ~ Call the service function(listing) to fetch the data and send the condition(defined above), limit, page, sort_column, sort_order
 *        # Add the service function(listing) return data to response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Logging the response
 *  - Return response using responseHandler()  
 *        
 * Notes :
 *    - Handling expection using try catch
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} Json
 * @throws {InvalidRequestError} - If the requestId is not provided.
 */
const listing = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting relationshipTypes listing Details request');
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
    const sortColumn = req.query.sort_column ? req.query.sort_column : 'id';
    const sortOrder = req.query.sort_order ? req.query.sort_order : 'DESC';
    /* Default variable */

    const condition = { search };
    const relationshipTypesData = await relationshipTypesService.listing(condition, page, limit, sortColumn, sortOrder);
    if (!relationshipTypesData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: relationshipTypesData.message, error: relationshipTypesData.error, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: relationshipTypesData.data, pagination: relationshipTypesData.pagination_data, activity: relationshipTypesData.activity };
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Getting relationshipTypes listing Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Relationship Type Store request to store relationship type data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Store the details in 'relationship_types' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + name(body) is mandatory, it should not contain certain special characters and its existence is checked in 'relationship_types' table to avoid duplicates.
 *    + is_active(body) is mandatory and should be a boolean.
 *  - Run the validation rules
 *    + If validation success
 *      ~ Call the service function(store) to store the data and send request body to the store function.
 *        # Add the service function(store) return data to response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Logging the response
 *  - Return response using responseHandler()  
 *        
 * Notes :
 *    - Handling expection using try catch
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} Json
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const store = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'New relationship types creation request');
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
      .withMessage(responseMessages.configurations.relationshipTypes.relationshipTypesNameRequired)
      .not().matches(/[{}?!'~$%*><]/)
      .withMessage(responseMessages.configurations.relationshipTypes.relationshipTypesNameInvalid)
      .custom((value) => {
        return indexServices.find('relationship_types', ['id'], { name: value }).then((relationshipTypes) => {
          const relationshipTypesData = relationshipTypes.status;
          if (relationshipTypesData) {
            return Promise.reject(
              responseMessages.configurations.relationshipTypes.relationshipTypesNameExists,
            );
          }
        });
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.configurations.relationshipTypes.statusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.relationshipTypes.statusInvalid),
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
       *    + Call the relationship types service function
       *       - Based on the status in relationship types function response, segregate the response and prepare the response
       * If Validation Fails
       *    + Return the error message.
       */
  if (errors.isEmpty()) {
    await relationshipTypesService.store(req.body);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.addedSuccessfully,
    };
    /* Log Response */
    logResponse('info', req, responseData, 'New relationship Types creation request');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Relationship Type update request to update relationship type data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ update the details in 'relationship_types' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + id(params) is mandatory, it should be a integer and checked for its existence in 'employee_catgories' table.
 *    + employment_type_id(body) is mandatory, it should be a integer and checked for its existence in employment_types table.
 *    + name(body) is mandatory, it should not contain certain special characters and its existence is checked in 'relationship_types' table to avoid duplicates.
 *    + is_active(body) is mandatory and should be a boolean.
 *  - check if the relationship type is being used for any employee in 'employee' table.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the relationship type information.
 *    ~ Call the service function(update) to update the data and send request body and condition in params to the update function.
 *        # Add the service function(update) return data to response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Logging the response
 *  - Return response using responseHandler()  
 *        
 * Notes :
 *    - Handling expection using try catch
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} Json
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update relationshipTypes request.');
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
      .withMessage(responseMessages.configurations.relationshipTypes.relationshipTypesId)
      .isInt().withMessage(responseMessages.configurations.relationshipTypes.relationshipTypesIdInvalid)
      .custom((value) => {
        return indexServices.find('relationship_types', ['id'], { id: value }).then((relationshipTypes) => {
          const relationshipTypesData = relationshipTypes.status;
          if (!relationshipTypesData) {
            return Promise.reject(responseMessages.configurations.relationshipTypes.IdNotExists);
          }
        });
      }),
    check('name')
      .trim()
      .notEmpty().withMessage(responseMessages.configurations.relationshipTypes.relationshipTypesNameRequired)
      .not().matches(/[{}?!'~$%*><]/).withMessage(responseMessages.configurations.relationshipTypes.relationshipTypesNameInvalid)
      .custom((value) => {
        return indexServices.find('relationship_types', ['id'], { name: value }).then((relationshipTypes) => {
          const status = relationshipTypes.status;
          if (status) {
            if (relationshipTypes.data[0].id !== Number(req.params.id)) {
              return Promise.reject(responseMessages.configurations.relationshipTypes.relationshipTypesNameExists);
            }
          }
        });
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.configurations.relationshipTypes.statusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.relationshipTypes.statusInvalid)
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee_dependent_details', { relationship_id: req.params.id }, [], true).then((relationshipTypes) => {
            if (Number(relationshipTypes.data) != 0) {
              return Promise.reject("relationship is mapped for" + " " + relationshipTypes.data + " " + "employee dependent details ");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('emergency_contact_information', { relationship_id: req.params.id }, [], true).then((relationshipTypes) => {
            if (Number(relationshipTypes.data) != 0) {
              return Promise.reject("relationship is mapped for" + " " + relationshipTypes.data + " " + "emergency contact information ");
            }
          });
        }
        return true
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
    let condition = { id: req.params.id } // condition
    await relationshipTypesService.update(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'Update relationshipTypes  Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = { destroy, dropdown, index, listing, store, update , updateStatus };
