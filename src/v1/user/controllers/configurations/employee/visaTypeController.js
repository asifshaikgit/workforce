const { check, validationResult } = require('express-validator');
const { responseMessages } = require('../../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../../constants/responseCodes');
const { logRequest, logResponse } = require('../../../../../../utils/log');
const visaTypeService = require('../../../services/configurations/employee/visaTypeService');
const indexServices = require('../../../services/index');
const { responseHandler } = require('../../../../../responseHandler');
const { tryCatch } = require('../../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../../error/InvalidRequestError');
const { pagination } = require('../../../../../../config/pagination');

/**
 * Visa Type destroy request to delete Visa type data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ delete the details in 'visa_types' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + id(params) is mandatory, it should be a integer and checked for its existence in 'visa_types' table.
 *    - check if the visa type is being used for any employee in 'employee' table.
 *    - check if the visa type is being used for any visa in 'visa_document_types' table.
 *    - check if the visa type is being used for any employee in 'employee_visa_details' table.
 *    - check if the visa type is being used for any employee in 'employee_dependent_details' table.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the visa type information.
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
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const destroy = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Delete visaType request');
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
      .withMessage(responseMessages.configurations.visaType.IdRequired)
      .isInt().withMessage(responseMessages.configurations.visaType.IdInvalid)
      .custom(async (value) => {
        const visatype = await indexServices.find('visa_types', ['id', 'is_editable', 'name'], { id: value });
        const visatypeData = visatype.status;
        if (!visatypeData) {
          return Promise.reject(responseMessages.configurations.visaType.IdNotExists);
        }
        if (!visatype.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.department.notAllowToModify);
        }

        req.body.name = visatype.data[0].name
      })
      .custom(async (value) => {
        const visatype = await indexServices.count('visa_document_types', { visa_type_id: value }, [], true);
        if (Number(visatype.data) != 0) {
          return Promise.reject("visa type is mapped for" + " " + visatype.data + " " + "visa document types");
        }
      })
      .custom(async (value) => {
        const employee = await indexServices.count('employee', { visa_type_id: value }, [], true);
        if (Number(employee.data) != 0) {
          return Promise.reject("visa type is mapped for" + " " + employee.data + " " + "employees ");
        }
      })
      .custom(async (value) => {
        const employeeVisa = await indexServices.count('employee_visa_details', { visa_type_id: value }, [], true);
        if (Number(employeeVisa.data) != 0) {
          return Promise.reject("visa type is mapped for" + " " + employeeVisa.data + " " + "employee visa details ");
        }
      }).custom(async (value) => {
        const employeeDependentVisa = await indexServices.count('employee_dependent_details', { visa_type_id: value }, [], true);
        if (Number(employeeDependentVisa.data) != 0) {
          return Promise.reject("visa type is mapped for" + " " + employeeDependentVisa.data + " " + "employee dependent details ");
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
   * + Delete visa Type details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    let condition = { id: req.params.id } // condition
    await visaTypeService.destroy(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.deletedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'visaType delete Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Visa Type dropdown request to fetch Visa type data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'visa_types' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + emp_type_id(query) is not mandatory, it should be a integer.
 *    + search(query) is not mandatory, it should be a string.

 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to fetch the visa type information.
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
 * @throws {InvalidRequestError} - If the request ID is missing or empty.
 */
const dropdown = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting Visa type dropdown Details request.');
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
    const visaTypeData = await indexServices.find('visa_types', ['id', 'name as value'], condition, 0, [], 0, 'id', 'ASC');
    if (!visaTypeData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        error: visaTypeData.error,
        message: responseMessages.common.noRecordFound,
        data: [],
      };
    } else {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: visaTypeData.data,
      };
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse('info', req, responseData, 'Getting Visa type dropdown Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Visa Type index request to fetch Visa type data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'visa_types' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + id(query) is mandatory, it should be a integer and should be available in 'visa_types' table.
 *   
 *  - Run the validation rules
 *    + If validation success
 *     ~ Define condition object to fetch the visa type information.
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
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} Json
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'getting visa type index request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.visaType.IdRequired)
      .isInt().withMessage(responseMessages.configurations.visaType.IdInvalid)
      .custom((value) => {
        return indexServices.find('visa_types', ['id'], { id: value }).then((visaData) => {
          const status = visaData.status;
          if (!status) {
            return Promise.reject(responseMessages.configurations.visaType.IdNotExists);
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
   *    + call the update service function
   *        - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
  */
  if (errors.isEmpty()) {
    const condition = { id: req.query.id };
    const visaData = await visaTypeService.index(condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: visaData.data };

    /* Log Response */
    logResponse('info', req, responseData, 'visa type index Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Visa Type listing request to fetch Visa type data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'visa_types' table and return the data
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
 *   ~ Define condition object to fetch the visa type information.
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
 * @throws {InvalidRequestError} - If the request ID is missing or empty.
 */
const listing = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting Visa type listing Details request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  const requestId = req.query.request_id;
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    /* Default variable */
    const limit = req.query.limit ? req.query.limit : pagination.limit;
    const page = req.query.page ? req.query.page : pagination.page;
    const search = req.query.search ? req.query.search : '';
    const sortColumn = req.query.sort_column ? req.query.sort_column : '';
    const sortOrder = req.query.sort_order === 'A' ? 'asc' : req.query.sort_order === 'D' ? 'desc' : 'desc';
    /* Default variable */

    /* Writing validation rules to the input request */
    const condition = { search };
    const visaTypeData = await visaTypeService.listing(condition, page, limit, sortColumn, sortOrder);
    if (!visaTypeData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        error: visaTypeData.error,
        message: responseMessages.common.noRecordFound,
        data: [],
      };
    } else {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: visaTypeData.data,
        pagination: visaTypeData.pagination_data,
        activity: visaTypeData.activity,
      };
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse('info', req, responseData, 'Getting Visa type listing Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Visa Type Store request to store Visa type data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Store the details in 'visa_types' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + name(body) is mandatory, it should not contain certain special characters and its existence is checked in 'visa_types' table to avoid duplicates.
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
  logRequest('info', req, 'New visaType creation request');
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
      .withMessage(responseMessages.configurations.visaType.visaTypeNameRequired)
      .not().matches(/[{}?!'~$%*><]/)
      .withMessage(responseMessages.configurations.visaType.visaTypeNameInvalid)
      .custom((value) => {
        return indexServices.find('visa_types', ['id'], { name: value }).then((visatype) => {
          const visatypeData = visatype.status;
          if (visatypeData) {
            return Promise.reject(
              responseMessages.configurations.visaType.visaTypeNameExists,
            );
          }
        });
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.visaType.visaTypeStatusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.visaType.visaTypeStatusInvalid),
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
   *    + Call the create visa type service function
   *        - Based on the status in createvisa type function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    await visaTypeService.store(req.body);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.addedSuccessfully,
    };

    /* Log Response */
    logResponse(
      'info',
      req,
      responseData,
      'New Visa Type Response',
    );
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Visa Type update request to update Visa type data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ update the details in 'visa_types' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + id(params) is mandatory, it should be a integer and checked for its existence in 'visa_types' table.
 *    + name(body) is mandatory, it should not contain certain special characters and its existence is checked in 'visa_types' table to avoid duplicates.
 *    + is_active(body) is mandatory and should be a boolean.
 *    - check if the visa type is being used for any employee in 'employee' table.
 *    - check if the visa type is being used for any visa in 'visa_document_types' table.
 *    - check if the visa type is being used for any employee in 'employee_visa_details' table.
 *    - check if the visa type is being used for any employee in 'employee_dependent_details' table.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the visa type information.
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
 * @throws {InvalidRequestError} - If there are validation errors in the request body.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update status visa type request.');
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
      .withMessage(responseMessages.configurations.visaType.IdRequired)
      .isInt().withMessage(responseMessages.configurations.visaType.IdInvalid)
      .custom(async (value) => {
        const visatype = await indexServices.find('visa_types', ['id', 'is_editable'], { id: value });
        const visatypeData = visatype.status;
        if (!visatypeData) {
          return Promise.reject(responseMessages.configurations.visaType.IdNotExists);
        }
        if (!visatype.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.department.notAllowToModify);
        }
      }),
    check('name')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.visaType.visaTypeNameRequired)
      .not().matches(/[{}?!'~$%*><]/)
      .withMessage(responseMessages.configurations.visaType.visaTypeNameInvalid)
      .custom(async (value) => {
        const visatype = await indexServices.find('visa_types', ['id'], { name: value });
        const status = visatype.status;
        if (status) {
          if (visatype.data[0].id !== Number(req.params.id)) {
            return Promise.reject(responseMessages.configurations.visaType.visaTypeNameExists);
          }
        }
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.visaType.visaTypeStatusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.visaType.visaTypeStatusInvalid)
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('visa_document_types', { visa_type_id: req.params.id }, [], true).then((visatype) => {
            if (Number(visatype.data) != 0) {
              return Promise.reject("visa type is mapped for" + " " + visatype.data + " " + "visa document types");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee', { visa_type_id: req.params.id }, [], true).then((employee) => {
            if (Number(employee.data) != 0) {
              return Promise.reject("visa type is mapped for" + " " + employee.data + " " + "employees ");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee_visa_details', { visa_type_id: req.params.id }, [], true).then((employeeVisa) => {
            if (Number(employeeVisa.data) != 0) {
              return Promise.reject("visa type is mapped for" + " " + employeeVisa.data + " " + "employee visa details ");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee_dependent_details', { visa_type_id: req.params.id }, [], true).then((employeeDependentVisa) => {
            if (Number(employeeDependentVisa.data) != 0) {
              return Promise.reject("visa type is mapped for" + " " + employeeDependentVisa.data + " " + "employee dependent details ");
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
    await visaTypeService.update(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'Update status Visa Type Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Visa Type update-status request to update Visa type data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ update the details in 'visa_types' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + id(params) is mandatory, it should be a integer and checked for its existence in 'visa_types' table.
 *    + is_active(body) is mandatory and should be a boolean.
 *   - check if the visa type is being used for any employee in 'employee' table.
 *   - check if the visa type is being used for any visa in 'visa_document_types' table.
 *   - check if the visa type is being used for any employee in 'employee_visa_details' table.
 *   - check if the visa type is being used for any employee in 'employee_dependent_details' table.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the visa type information.
 *    ~ Call the service function(updateStatus) to update the data and send request body and condition in params to the updateStatus function. *        # Add the service function(updateStatus) return data to response.
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
  logRequest('info', req, 'update visa type request.');
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
      .withMessage(responseMessages.configurations.visaType.IdRequired)
      .isInt().withMessage(responseMessages.configurations.visaType.IdInvalid)
      .custom(async (value) => {
        const visatype = await indexServices.find('visa_types', ['id', 'is_editable'], { id: value });
        const visatypeData = visatype.status;
        if (!visatypeData) {
          return Promise.reject(responseMessages.configurations.visaType.IdNotExists);
        } 
        if (!visatype.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.department.notAllowToModify);
        }
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.visaType.visaTypeStatusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.visaType.visaTypeStatusInvalid)
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('visa_document_types', { visa_type_id: req.params.id }, [], true).then((visatype) => {
            if (Number(visatype.data) != 0) {
              return Promise.reject("visa type is mapped for" + " " + visatype.data + " " + "visa document types");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee', { visa_type_id: req.params.id }, [], true).then((employee) => {
            if (Number(employee.data) != 0) {
              return Promise.reject("visa type is mapped for" + " " + employee.data + " " + "employees ");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee_visa_details', { visa_type_id: req.params.id }, [], true).then((employeeVisa) => {
            if (Number(employeeVisa.data) != 0) {
              return Promise.reject("visa type is mapped for" + " " + employeeVisa.data + " " + "employee visa details ");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee_dependent_details', { visa_type_id: req.params.id }, [], true).then((employeeDependentVisa) => {
            if (Number(employeeDependentVisa.data) != 0) {
              return Promise.reject("visa type is mapped for" + " " + employeeDependentVisa.data + " " + "employee dependent details ");
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
    let condition = { id: req.params.id } // condition
    await visaTypeService.updateStatus(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'Update Visa Type Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = { destroy, dropdown, index, listing, store, update, updateStatus };
