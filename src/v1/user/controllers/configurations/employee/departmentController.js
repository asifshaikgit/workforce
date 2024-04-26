const { check, validationResult } = require('express-validator');
const { responseMessages } = require('../../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../../constants/responseCodes');
const { logRequest, logResponse } = require('../../../../../../utils/log');
const departmentService = require('../../../services/configurations/employee/departmentService');
const indexServices = require('../../../services/index');
const { responseHandler } = require('../../../../../responseHandler');
const { tryCatch } = require('../../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../../error/InvalidRequestError');
const { pagination } = require('../../../../../../config/pagination');


/**
 * Department destroy request to delete department data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ delete the details in 'departments' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + id(body) is mandatory, it should be a integer and checked for its existence in 'departments' table.
 *    - check if the department is being used for any employee in 'employee' table.
 *  - check if the department is being used for any team in 'teams' table.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the department information.
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
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} Json
 * @throws {InvalidRequestError} - If there are validation errors.
 */
const destroy = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Delete Department Request');
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
      .withMessage(responseMessages.configurations.department.departmentId)
      .isInt().withMessage(responseMessages.configurations.department.departmentIdInvalid)
      .custom(async (value) => {
        const department = await indexServices.find('departments', ['id', 'is_editable', 'name'], { id: value });
        const departmentData = department.status;
        if (!departmentData) {
          return Promise.reject(responseMessages.configurations.department.IdNotExists);
        }
        if (!department.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.department.notAllowToModify);

        }
        req.body.name = department.data[0].name
      })
      .custom(async (value) => {
        const department = await indexServices.count('teams', { department_id: value }, [], true);
        if (Number(department.data) != 0) {
          return Promise.reject("department is mapped for" + " " + department.data + " " + "teams ");
        }
      })
      .custom(async (value) => {
        const department = await indexServices.count('employee', { department_id: value }, [], true);
        if (Number(department.data) != 0) {
          return Promise.reject("department is mapped for" + " " + department.data + " " + "employees ");
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
   * + Delete  department details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    let condition = { id: req.params.id } // condition
    await departmentService.destroy(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.deletedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'delete department Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Department dropdown request to fetch department data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'departments' table and return the data
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
 *   
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to fetch the department information.
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
 * @param {object} req
 * @param {object} res
 * @return Json
 * @throws InvalidRequestError
 */
const dropdown = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting department dropdown Details request.');
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
    const departmentData = await indexServices.find('departments', ['id', 'name as value'], condition, 0);
    if (!departmentData.status) {
      responseData = { statusCode: responseCodes.codeInternalError, error: departmentData.error, message: responseMessages.common.noRecordFound, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: departmentData.data };
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Getting Department dropdown Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Departments index request to fetch department data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'departments' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + id(query) is mandatory, it should be a integer and should be available in 'departments' table.
 *   
 *  - Run the validation rules
 *    + If validation success
 *     ~ Define condition object to fetch the department information.
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
 * @param {object} req
 * @param {object} res
 * @return Json
 * @throws InvalidRequestError
 */
const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'getting department details index request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.department.departmentId)
      .isInt().withMessage(responseMessages.configurations.department.departmentIdInvalid)
      .custom(async (value) => {
        const departmentData = await indexServices.find('departments', ['id', 'name'], { id: value });
        const status = departmentData.status;
        if (!status) {
          return Promise.reject(responseMessages.configurations.department.IdNotExists);
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
   *    + call the update service function
   *        - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
  */
  if (errors.isEmpty()) {
    const condition = { 'departments.id': req.query.id }; // condition
    const departmentData = await departmentService.index(condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: departmentData.data };

    /* Log Response */
    logResponse('info', req, responseData, 'department details index Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Departments listing request to fetch department data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'departments' table and return the data
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
 *   ~ Define condition object to fetch the department information.
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
* @param {object} req
* @param {object} res
* @return Json
* @throws InvalidRequestError
*/
const listing = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting department listing Details request');
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
    const departmentData = await departmentService.listing(condition, page, limit, sortColumn, sortOrder);
    if (!departmentData.status) {
      responseData = { statusCode: responseCodes.codeInternalError, error: departmentData.error, message: responseMessages.common.noRecordFound, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: departmentData.data, pagination: departmentData.pagination_data, activity: departmentData.activity };
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Getting department listing Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Departments Store request to store department data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Store the details in 'departments' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + name(body) is mandatory, it should not contain certain special characters and its existence is checked in 'departments' table to avoid duplicates.
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
 * @throws {InvalidRequestError} If the request body fails validation.
 */
const store = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'New department creation request');
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
      .withMessage(responseMessages.configurations.department.departmentNameRequired)
      .not().matches(/[{}?!'~$%*><|]/)
      .withMessage(responseMessages.configurations.department.departmentNameInvalid)
      .custom(async (value) => {
        const department = await indexServices.find('departments', ['id'], { name: value });
        const departmentData = department.status;
        if (departmentData) {
          return Promise.reject(responseMessages.configurations.department.departmentNameExists);
        }
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(
        responseMessages.configurations.department.statusRequired,
      )
      .isBoolean()
      .withMessage(
        responseMessages.configurations.department.statusInvalid,
      ),
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
   *    + Call the department service function
   *    - Based on the status in department function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    await departmentService.store(req.body);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.addedSuccessfully,
    };
    /* Log Response */
    logResponse(
      'info',
      req,
      responseData,
      'New department creation response',
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
 * Departments update request to update department data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ update the details in 'deparments' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + id(body) is mandatory, it should be a integer and checked for its existence in 'departments' table.
 *    + name(body) is mandatory, it should not contain certain special characters and its existence is checked in 'departments' table to avoid duplicates.
 *    + is_active(body) is mandatory and should be a boolean.
 *    - check if the department is being used for any team in 'teams' table.
 *    - check if the department is being used for any employee in 'employee' table.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the department information.
 *      ~ Call the service function(update) to update the data and send request body to the update function.
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
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {JSON} Json
 * @throws {InvalidRequestError} If there are validation errors in the request body.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update department request.');
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
      .withMessage(responseMessages.configurations.department.departmentId)
      .isInt().withMessage(responseMessages.configurations.department.departmentIdInvalid)
      .custom(async (value) => {
        const department = await indexServices.find('departments', ['id', 'is_editable'], { id: value });
        const departmentData = department.status;
        if (!departmentData) {
          return Promise.reject(
            responseMessages.configurations.department.IdNotExists);
        } if (!department.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.department.notAllowToModify);
        }
      }),
    check('name')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(
        responseMessages.configurations.department.departmentNameRequired,
      )
      .not().matches(/[{}?!'~$%*><|]/)
      .withMessage(
        responseMessages.configurations.department.departmentNameInvalid,
      )
      .custom(async (value) => {
        const department = await indexServices.find('departments', ['id'], { name: value });
        const status = department.status;
        if (status) {
          if (department.data[0].id !== Number(req.params.id)) {
            return Promise.reject(
              responseMessages.configurations.department.departmentNameExists);
          }
        }
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(
        responseMessages.configurations.department.statusRequired,
      )
      .isBoolean()
      .withMessage(
        responseMessages.configurations.department.statusInvalid,
      )
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('teams', { department_id: req.params.id }, [], true).then((department) => {
            if (Number(department.data) != 0) {
              return Promise.reject("department is mapped for" + " " + department.data + " " + "team");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee', { department_id: req.params.id }, [], true).then((department) => {
            if (Number(department.data) != 0) {
              return Promise.reject("department is mapped for" + " " + department.data + " " + "employee");
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
    await departmentService.update(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'Update department Response.');
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
 * Department update-status request to update department data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ update the details in 'departments' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + id(body) is mandatory, it should be a integer and checked for its existence in 'departments' table.
 *    + is_active(body) is mandatory and should be a boolean.
 *    - check if the department is being used for any team in 'teams' table.
 *    - check if the department is being used for any employee in 'employee' table. 
 *   - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the department information.
 *      ~ Call the service function(updateStatus) to update the data and send request body to the update function.
 *        # Add the service function(update) return data to response.
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
  logRequest('info', req, 'update status department request.');
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
      .withMessage(responseMessages.configurations.department.departmentId)
      .isInt().withMessage(responseMessages.configurations.department.departmentIdInvalid)
      .custom((value) => {
        return indexServices.find('departments', ['id', 'is_editable'], { id: value }).then((department) => {
          const departmentData = department.status;
          if (!departmentData) {
            return Promise.reject(
              responseMessages.configurations.department.IdNotExists,
            );
          }
          if (!department.data[0].is_editable) {
            return Promise.reject(responseMessages.configurations.department.notAllowToModify);
          }
        });
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(
        responseMessages.configurations.department.statusRequired,
      )
      .isBoolean()
      .withMessage(
        responseMessages.configurations.department.statusInvalid,
      )
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('teams', { department_id: req.params.id }, [], true).then((department) => {
            if (Number(department.data) != 0) {
              return Promise.reject("department is mapped for" + " " + department.data + " " + "team");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee', { department_id: req.params.id }, [], true).then((department) => {
            if (Number(department.data) != 0) {
              return Promise.reject("department is mapped for" + " " + department.data + " " + "employee");
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
    await departmentService.updateStatus(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'Update status department Response.');
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

module.exports = { destroy, dropdown, index, listing, store, update, updateStatus };
