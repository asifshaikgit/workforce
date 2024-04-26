const { check, validationResult } = require('express-validator');
const { responseMessages } = require('../../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../../constants/responseCodes');
const { logRequest, logResponse } = require('../../../../../../utils/log');
const educationLevelService = require('../../../services/configurations/employee/educationLevelService');
const indexServices = require('../../../services/index');
const { responseHandler } = require('../../../../../responseHandler');
const { tryCatch } = require('../../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../../error/InvalidRequestError');
const { pagination } = require('../../../../../../config/pagination');

/**
 * Educational level destroy request to delete educational level data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ delete the details in 'educational_levels' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + id(params) is mandatory, it should be a integer and checked for its existence in 'educational_levels' table.
 *    - check if the educational level is being used for any employee in 'employee_education_details' table.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the educational level information.
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
 * rs.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {JSON} Json
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const destroy = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Delete education level request');
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
      .withMessage(responseMessages.configurations.educationLevel.IdRequired)
      .isInt().withMessage(responseMessages.configurations.educationLevel.IdInvalid)
      .custom((value) => {
        return indexServices.find('education_levels', ['id', 'is_editable', 'name'], { id: value }).then((educationLevel) => {
          const educationLevelData = educationLevel.status;
          if (!educationLevelData) {
            return Promise.reject(responseMessages.configurations.educationLevel.IdNotExists);
          } if (!educationLevel.data[0].is_editable) {
            return Promise.reject(responseMessages.configurations.department.notAllowToModify);
          }
          req.body.name = educationLevel.data[0].name
        });
      })
      .custom((value) => {
        return indexServices.count('employee_education_details', { education_level_id: value }, [], true)
          .then((educationLevel) => {
            if (Number(educationLevel.data) != 0) {
              return Promise.reject("educational level is mapped for" + " " + educationLevel.data + " " + "employee education details");
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
   * + Delete  education Level details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    let condition = { id: req.params.id } // condition
    await educationLevelService.destroy(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.deletedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'educational level delete Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Education level dropdown request to fetch educational level data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'educational_levels' table and return the data
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
 *    ~ Define condition object to fetch the educational level information.
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
  logRequest('info', req, 'Getting education level dropdown Details request.');
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
    const educationLevelData = await indexServices.find('education_levels', ['id', 'name as value'], condition, 0);
    if (!educationLevelData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: educationLevelData.message, error: educationLevelData.error, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: educationLevelData.data };
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Getting education level dropdown Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Education level index request to fetch educational level data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'educational_levels' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + id(query) is mandatory, it should be a integer and should be available in 'educational_levels' table.
 *   
 *  - Run the validation rules
 *    + If validation success
 *     ~ Define condition object to fetch the educational level information.
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
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'getting education level details index request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.educationLevel.IdRequired)
      .isInt().withMessage(responseMessages.configurations.educationLevel.IdInvalid)
      .custom(async (value) => {
        const educationLevelData = await indexServices.find('education_levels', ['id', 'name'], { id: value });
        const status = educationLevelData.status;
        if (!status) {
          return Promise.reject(responseMessages.configurations.educationLevel.IdNotExists);
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
    const condition = { 'education_levels.id': req.query.id };
    const educationLevelData = await educationLevelService.index(condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: educationLevelData.data };

    /* Log Response */
    logResponse('info', req, responseData, ' education level details index Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Education level listing request to fetch educational level data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'educational_levels' table and return the data
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
 *   ~ Define condition object to fetch the educational level information.
 *      ~ Call the service function(listing) to fetch the data and send the condition(defined above), limit, page, sort_column, sort_order.
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
 * @throws {InvalidRequestError} - If the requestId is missing or empty.
 */
const listing = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting education level listing Details request');
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
    const sortColumn = req.query.sort_column ? req.query.sort_column : '';
    const sortOrder = req.query.sort_order === 'A' ? 'asc' : req.query.sort_order === 'D' ? 'desc' : 'desc';
    /* Default variable */

    const condition = { search };
    const educationLevelData = await educationLevelService.listing(condition, page, limit, sortColumn, sortOrder);
    if (!educationLevelData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: educationLevelData.message, error: educationLevelData.error, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: educationLevelData.data, pagination: educationLevelData.pagination_data, activity: educationLevelData.activity };
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Getting education level listing Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Education level Store request to store educational level data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Store the details in 'educational_levels' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + name(body) is mandatory, it should not contain certain special characters and its existence is checked in 'educational_levels' table to avoid duplicates.
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
 * @throws {InvalidRequestError} - If the request data is invalid.
 */
const store = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'New educational level creation  request');
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
      .withMessage(responseMessages.configurations.educationLevel.educationLevelNameRequired)
      .not().matches(/[{}?!'~$%*><]/)
      .withMessage(responseMessages.configurations.educationLevel.educationLevelNameInvalid)
      .custom((value) => {
        return indexServices.find('education_levels', ['id'], { name: value }).then((educationLevel) => {
          const educationLevelData = educationLevel.status;
          if (educationLevelData) {
            return Promise.reject(responseMessages.configurations.educationLevel.educationLevelNameExists);
          }
        });
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.educationLevel.educationLevelStatusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.educationLevel.educationLevelStatusInvalid),
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
   *    + Call the create Educational level service function
   *        - Based on the status in create Educational level function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    await educationLevelService.store(req.body);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully };
    /* Log Response */
    logResponse('info', req, responseData, 'New educational level registration response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Education level update request to update educational level data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ update the details in 'educational_levels' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + id(params) is mandatory, it should be a integer and checked for its existence in 'educational_levels' table.
 *    + name(body) is mandatory, it should not contain certain special characters and its existence is checked in 'educational_levels' table to avoid duplicates.
 *    + is_active(body) is mandatory and should be a boolean.
 *  - check if the educational level is being used for any employee in 'employee_education_details' table.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the educational level information.
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
 * @throws {InvalidRequestError} - If there are validation errors in the request data.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update education level request.');
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
      .withMessage(responseMessages.configurations.educationLevel.IdRequired)
      .isInt().withMessage(responseMessages.configurations.educationLevel.IdInvalid)
      .custom(async (value) => {
        const educationLevel = await indexServices.find('education_levels', ['id', 'is_editable'], { id: value });
        const educationLevelData = educationLevel.status;
        if (!educationLevelData) {
          return Promise.reject(
            responseMessages.configurations.educationLevel.IdNotExists);
        } if (!educationLevel.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.department.notAllowToModify);
        }
      }),
    check('name')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.educationLevel.educationLevelNameRequired)
      .not().matches(/[{}?!'~$%*><]/)
      .withMessage(responseMessages.configurations.educationLevel.educationLevelNameInvalid)
      .custom((value) => {
        return indexServices.find('education_levels', ['id'], { name: value }).then((educationLevel) => {
          const status = educationLevel.status;
          if (status) {
            if (educationLevel.data[0].id !== Number(req.params.id)) {
              return Promise.reject(responseMessages.configurations.educationLevel.educationLevelNameExists);
            }
          }
        });
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.educationLevel.educationLevelStatusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.educationLevel.educationLevelStatusInvalid)
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee_education_details', { education_level_id: req.params.id }, [], true)
            .then((educationLevel) => {
              if (Number(educationLevel.data) != 0) {
                return Promise.reject("educational level is mapped for" + " " + educationLevel.data + " " + "employee education details");
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
    await educationLevelService.update(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'Update education level Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Education level update-status request to update educational level data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ update the details in 'educational_levels' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + id(params) is mandatory, it should be a integer and checked for its existence in 'educational_levels' table.
 *    + is_active(body) is mandatory and should be a boolean.
 *  *  - check if the educational level is being used for any employee in 'employee_education_details' table.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the educational level information.
 *    ~ Call the service function(updateStatus) to update the data and send request body and condition in params to the updateStatus function. 
 *    # Add the service function(update) return data to response.
 *    + updateStatus
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
 * @throws {InvalidRequestError} If there are validation errors in the request.
 */
const updateStatus = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update status education level request.');
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
      .withMessage(responseMessages.configurations.educationLevel.IdRequired)
      .isInt().withMessage(responseMessages.configurations.educationLevel.IdInvalid)
      .custom(async (value) => {
        const educationLevel = await indexServices.find('education_levels', ['id', 'is_editable'], { id: value });
        const educationLevelData = educationLevel.status;
        if (!educationLevelData) {
          return Promise.reject(
            responseMessages.configurations.educationLevel.IdNotExists);
        } if (!educationLevel.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.department.notAllowToModify);
        }
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.educationLevel.educationLevelStatusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.educationLevel.educationLevelStatusInvalid)
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee_education_details', { education_level_id: req.params.id }, [], true)
            .then((educationLevel) => {
              if (Number(educationLevel.data) != 0) {
                return Promise.reject("educational level is mapped for" + " " + educationLevel.data + " " + "employee education details");
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
    await educationLevelService.updateStatus(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'Update status education level Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = { destroy, dropdown, index, listing, store, update, updateStatus };
