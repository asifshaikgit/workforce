const { check, validationResult } = require('express-validator');
const { responseMessages } = require('../../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../../constants/responseCodes');
const { logRequest, logResponse } = require('../../../../../../utils/log');
const categoryService = require('../../../services/configurations/employee/categoryService');
const indexServices = require('../../../services/index');
const { responseHandler } = require('../../../../../responseHandler');
const { tryCatch } = require('../../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../../error/InvalidRequestError');
const { pagination } = require('../../../../../../config/pagination');
const { regexPatterns } = require('../../../../../../constants/regexPatterns')


/**
 * Employee Category destroy request to delete Category data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ delete the details in 'employee_categories' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + id(params) is mandatory, it should be a integer and checked for its existence in 'employee_categories' table.
 *    - check if the category is being used for any employee in 'employee' table.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the category information.
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
 * @returns {JSON} - Json Response
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const destroy = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Delete Category Request');
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
      .withMessage(responseMessages.configurations.category.IdRequired)
      .isInt().withMessage(responseMessages.configurations.category.IdInvalid)
      .custom(async (value) => {
        const category = await indexServices.find('employee_categories', ['id', 'is_editable', 'name'], { id: value });
        const categoryData = category.status;
        if (!categoryData) {
          return Promise.reject(responseMessages.configurations.category.IdNotExists);
        }
        if (!category.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.category.notAllowToModify);
        }
        req.body.name = category.data[0].name
      })
      .custom(async (value) => {
        const category = await indexServices.count('employee', { employee_category_id: Number(value) }, [], true);
        if (Number(category.data != 0)) {
          return Promise.reject("category is mapped for" + " " + category.data + " " + "employees ");
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
   * + Delete  category details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    let condition = { id: req.params.id } // condition
    await categoryService.destroy(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.deletedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'Delete Category Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Employee Category dropdown request to fetch Category data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'employee_categories' table and return the data
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
 *    ~ Define condition object to fetch the category information.
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
 * @returns {JSON} - Json Response
 * @throws {InvalidRequestError} - If the requestId or emp_type_id is missing or empty.
 */
const dropdown = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting Category dropdown Details Request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  const requestId = req.query.request_id;
  const empTypeId = req.query.emp_type_id;
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    if (empTypeId !== undefined && empTypeId !== '') {
      /* Default variable */
      const search = req.query.search ? req.query.search : '';
      const myArray = empTypeId ? empTypeId.split(',') : '';
      /* Default variable */

      const condition = { search, is_active: true, employment_type_id: myArray }; // condition
      const categoryData = await indexServices.find('employee_categories', ['id', 'name as value'], condition, 0, [], 0, 'id', 'ASC');
      if (!categoryData.status) {
        responseData = { statusCode: responseCodes.codeInternalError, error: categoryData.error, message: responseMessages.common.noRecordFound, data: [] };
      } else {
        responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: categoryData.data };
      }

      /* Log Response */
      logResponse('info', req, responseData, 'Getting category dropdown Details Response');
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData);
      /* Return the response */
    } else {
      throw new InvalidRequestError(responseMessages.configurations.employmentType.employmentTypeId);
    }
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Employee Category index request to fetch Category data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'employee_categories' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + id(query) is mandatory, it should be a integer and should be available in 'employee_categories' table.
 *   
 *  - Run the validation rules
 *    + If validation success
 *     ~ Define condition object to fetch the category information.
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
  logRequest('info', req, 'getting category index request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.category.IdRequired)
      .isInt().withMessage(responseMessages.configurations.category.IdInvalid)
      .custom(async (value) => {
        const categoryData = await indexServices.find('employee_categories', ['id'], { id: value });
        const status = categoryData.status;
        if (!status) {
          return Promise.reject(responseMessages.configurations.category.IdNotExists);
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
   *    - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Throws an InvalidRequestError with the error message.
  */
  if (errors.isEmpty()) {
    const condition = { 'employee_categories.id': req.query.id };
    const categoryData = await categoryService.index(condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: categoryData.data };

    /* Log Response */
    logResponse('info', req, responseData, 'getting category index Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Employee Category listing request to fetch Category data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'employee_categories' table and return the data
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
 *   ~ Define condition object to fetch the category information.
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
 * @returns {JSOn} Json
 * @throws {InvalidRequestError} - If the requestId is not provided.
 */
const listing = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting category listing Details request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  const requestId = req.query.request_id;
  const empTypeId = req.query.employment_type_id;
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    /* Default variable */
    const limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
    const page = (req.query.page) ? (req.query.page) : pagination.page;
    const search = req.query.search ? req.query.search : '';
    const sortColumn = req.query.sort_column ? req.query.sort_column : '';
    const sortOrder = req.query.sort_order === 'A' ? 'asc' : req.query.sort_order === 'D' ? 'desc' : 'desc';
    /* Default variable */

    let condition = {}
    if(empTypeId){
      condition['employee_categories.employment_type_id'] = empTypeId
    }

    condition.search = search;     //condition

    const categoryData = await categoryService.listing(condition, page, limit, sortColumn, sortOrder);
    if (!categoryData.status) {
      responseData = { statusCode: responseCodes.codeInternalError, error: categoryData.error, message: responseMessages.common.noRecordFound, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: categoryData.data, pagination: categoryData.pagination_data, activity: categoryData.activity };
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Getting category listing Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Employee Category Store request to store Category data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Store the details in 'employee_categories' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + employment_type_id(body) is mandatory, it should be a integer and checked for its existence in 'employment_types' table.
 *    + name(body) is mandatory, it should not contain certain special characters and its existence is checked in 'employee_categories' table to avoid duplicates.
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
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {JSON} Json
 * @throws {InvalidRequestError} - If there are validation errors.
 */
const store = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'New category creation request');
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
    check('employment_type_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.employmentType.employmentTypeId)
      .isInt().withMessage(responseMessages.configurations.employmentType.IdInvalid)
      .custom(async (value) => {
        const employmentType = await indexServices.find('employment_types', ['id', 'name'], { id: value, is_active: true });
        const employmentTypeData = employmentType.status;
        if (!employmentTypeData) {
          return Promise.reject(responseMessages.configurations.employmentType.IdNotExists);
        } else if (employmentType.data[0].name == 'Internal Employee') {
          return Promise.reject(responseMessages.configurations.employmentType.cannotAddCategory);
        }
      }),
    check('name')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.category.categoryNameRequired)
      .not().matches(regexPatterns.specialCharactersRegex)
      .withMessage(responseMessages.configurations.category.categoryNameInvalid)
      .custom(async (value) => {
        const category = await indexServices.find('employee_categories', ['id'], { name: value, employment_type_id: req.body.employment_type_id, is_active: true });
        const categoryData = category.status;
        if (categoryData) {
          return Promise.reject(responseMessages.configurations.category.categoryNameExists);
        }
        const categoriesAvailable = await indexServices.find('employee_categories', ['id'], { employment_type_id: req.body.employment_type_id, is_editable: true });
        const categoriesAvailableStatus = categoriesAvailable.status;
        if (categoriesAvailableStatus && categoriesAvailable.data.length >= 5){
          return Promise.reject(responseMessages.configurations.category.categoryLimitExceeded);
        }
      }),
      check('description')
        .custom(value => {
          if (value != '' && value != null) {
            if (value.length > 100) {
              return Promise.reject(responseMessages.role.roleDescriptionInvalid);
            }
          }
          return true
        }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.category.statusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.category.statusInvalid),
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
   *    + Call the create category service function
   *    - Based on the status in create category function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    await categoryService.store(req.body);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.addedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'New category creation response');
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
 * Employee Category update request to update Category data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ update the details in 'employee_categories' table and return the data
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
 *    + name(body) is mandatory, it should not contain certain special characters and its existence is checked in 'employee_categories' table to avoid duplicates.
 *    + is_active(body) is mandatory and should be a boolean.
 *  - check if the category is being used for any employee in 'employee' table.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the category information.
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
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {JSOn} Json
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update category request.');
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
      .withMessage(responseMessages.configurations.category.IdRequired)
      .isInt().withMessage(responseMessages.configurations.category.IdInvalid)
      .custom(async (value) => {
        const category = await indexServices.find('employee_categories', ['id', 'is_editable'], { id: value });
        const categoryData = category.status;
        if (!categoryData) {
          return Promise.reject(responseMessages.configurations.category.IdNotExists);
        }
        if (!category.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.category.notAllowToModify);
        }
      }),
    check('employment_type_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.employmentType.employmentTypeId)
      .isInt().withMessage(responseMessages.configurations.employmentType.IdInvalid)
      .custom(async (value) => {
        const employmentType = await indexServices.find('employment_types', ['id', 'name'], { id: value, is_active: true });
        const employmentTypeData = employmentType.status;
        if (!employmentTypeData) {
          return Promise.reject(responseMessages.configurations.employmentType.IdNotExists);
        } else if(employmentType.data[0].name == 'Internal Employee') {
          return Promise.reject(responseMessages.configurations.employmentType.cannotAddCategory);
        }
      }),
    check('name')
      .trim()
      .notEmpty().withMessage(responseMessages.configurations.category.categoryNameRequired)
      .not().matches(regexPatterns.specialCharactersRegex).withMessage(responseMessages.configurations.category.categoryNameInvalid)
      .custom(async (value) => {
        const category = await indexServices.find('employee_categories', ['id'], { name: value, employment_type_id: req.body.employment_type_id, is_active: true });
        const status = category.status;
        if (status) {
          if (category.data[0].id !== Number(req.params.id)) {
            return Promise.reject(responseMessages.configurations.category.categoryNameExists);
          }
        }
        const categoriesAvailable = await indexServices.find('employee_categories', ['id'], { employment_type_id: req.body.employment_type_id, is_editable: true, global_search: `id != '${req.params.id}'`  });
        const categoriesAvailableStatus = categoriesAvailable.status;
        if (categoriesAvailableStatus && categoriesAvailable.data.length >= 5){
          return Promise.reject(responseMessages.configurations.category.categoryLimitExceeded);
        }
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.category.statusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.category.statusInvalid)
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee', { employee_category_id: Number(req.params.id) }, [], true).then((category) => {
            if (Number(category.data != 0)) {
              return Promise.reject("category is mapped for" + " " + category.data + " " + "employees ");
            }
          })
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
   *     - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    let condition = { id: req.params.id } // condition
    await categoryService.update(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'Update Category Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Employee Category update-status request to update Category data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ update the details in 'employee_categories' table and return the data
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
 *    + is_active(body) is mandatory and should be a boolean.
 *  *  - check if the category is being used for any employee in 'employee' table.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the category information.
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
 * @returns {JSOn} Json
 * @throws {InvalidRequestError} If there are validation errors in the request.
 */
const updateStatus = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update status category request.');
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
      .withMessage(responseMessages.configurations.category.IdRequired)
      .isInt().withMessage(responseMessages.configurations.category.IdInvalid)
      .custom(async (value) => {
        const category = await indexServices.find('employee_categories', ['id', 'is_editable'], { id: value });
        const categoryData = category.status;
        if (!categoryData) {
          return Promise.reject(responseMessages.configurations.category.IdNotExists);
        }
        if (!category.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.category.notAllowToModify);
        }
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.category.statusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.category.statusInvalid)
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee', { employee_category_id: Number(req.params.id) }, [], true).then((category) => {
            if (Number(category.data != 0)) {
              return Promise.reject("category is mapped for" + " " + category.data + " " + "employees ");
            }
          })
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
   *     - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    let condition = { id: req.params.id } // condition
    await categoryService.updateStatus(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'Update status Category Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = { destroy, dropdown, index, listing, store, update, updateStatus };
