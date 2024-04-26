const { check, validationResult } = require('express-validator');
const { responseMessages } = require('../../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../../constants/responseCodes');
const { logRequest, logResponse } = require('../../../../../../utils/log');
const visaDocumentTypeService = require('../../../services/configurations/employee/visaDocumentTypeService');
const indexServices = require('../../../services/index');
const { responseHandler } = require('../../../../../responseHandler');
const { tryCatch } = require('../../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../../error/InvalidRequestError');
const { pagination } = require('../../../../../../config/pagination');

/**
 * Visa Document destroy request to delete visa document data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ delete the details in 'visa_document_types' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + id(params) is mandatory, it should be a integer and checked for its existence in 'visa_document_types' table.
 *    - check if the visa document is being used for any visa type in 'visa_documents' table.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the visa document information.
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
  logRequest('info', req, 'Delete Visa Document Type Request');
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
      .withMessage(responseMessages.configurations.visaDocumentType.IdRequired)
      .isInt().withMessage(responseMessages.configurations.visaDocumentType.IdInvalid)
      .custom(async (value) => {
        const visaDocumentType = await indexServices.find('visa_document_types', ['id', 'is_editable', 'name'], { id: value });
        const visaDocumentTypeData = visaDocumentType.status;
        if (!visaDocumentTypeData) {
          return Promise.reject(
            responseMessages.configurations.visaDocumentType.IdNotExists);
        }
        if (!visaDocumentType.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.department.notAllowToModify);
        }
        req.body.name = visaDocumentType.data[0].name
      })
      // .custom(async (value) => {
      //   const visaDocumentType = await indexServices.count('visa_documents', { visa_document_type_id: value }, [], true);
      //   if (Number(visaDocumentType.data) != 0) {
      //     return Promise.reject("visa document type is mapped for" + " " + visaDocumentType.data + " " + "visa documents ");
      //   }
      // }),
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
   * + Delete  visa Document Type details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    let condition = { id: req.params.id } // condition
    await visaDocumentTypeService.destroy(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.deletedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'Visa Document Type Delete Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Visa Document dropdown request to fetch visa document data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'visa_document_types' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + visa_type_id(query) is mandatory, it should be a integer and checked if it exists in 'visa_types' table.
 *    + search(query) is not mandatory, it should be a string.

 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to fetch the visa document information.
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
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const dropdown = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting Visa Document Types dropdown Details request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('visa_type_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.visaType.IdRequired)
      .isInt().withMessage(responseMessages.configurations.visaType.IdInvalid)
      .custom(async (value) => {
        const visaTypeData = await indexServices.find('visa_types', ['id'], { id: value });
        const status = visaTypeData.status;
        if (!status) {
          return Promise.reject(responseMessages.configurations.visaType.IdNotExists);
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

  if (errors.isEmpty()) {
    const search = req.query.search ? req.query.search : '';
    const visaTypeId = req.query.visa_type_id;
    const condition = { search, visa_type_id: visaTypeId, is_active: true };
    const visaDocumentTypeData = await indexServices.find('visa_document_types', ['id', 'name as value'], condition, 0);
    if (!visaDocumentTypeData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        error: visaDocumentTypeData.error,
        message: responseMessages.common.noRecordFound,
        data: [],
      };
    } else {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: visaDocumentTypeData.data,
      };
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse('info', req, responseData, 'Getting Visa Document Types dropdown Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseMessages.common.requestIdRequired);
  }
});

/**
 * Visa Document index request to fetch visa document data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'visa_document_types' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + id(query) is mandatory, it should be a integer and should be available in 'visa_document_types' table.
 *   
 *  - Run the validation rules
 *    + If validation success
 *     ~ Define condition object to fetch the visa document information.
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
  logRequest('info', req, 'Getting Visa Document Types Index Request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.visaDocumentType.IdRequired)
      .isInt().withMessage(responseMessages.configurations.visaDocumentType.IdInvalid)
      .custom(async (value) => {
        const visaDocTypeData = await indexServices.find('visa_document_types', ['id'], { id: value });
        const status = visaDocTypeData.status;
        if (!status) {
          return Promise.reject(responseMessages.configurations.visaDocumentType.IdNotExists);
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
    const countryData = await visaDocumentTypeService.index(condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: countryData.data };

    /* Log Response */
    logResponse('info', req, responseData, 'Visa Document Types index Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Visa Document listing request to fetch visa document data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'visa_document_types' table and return the data
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
 *   ~ Define condition object to fetch the visa document information.
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
  logRequest('info', req, 'Getting Visa Document Types listing Details request');
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
    const visaDocumentTypeData = await visaDocumentTypeService.listing(condition, page, limit, sortColumn, sortOrder);
    if (!visaDocumentTypeData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        error: visaDocumentTypeData.error,
        message: responseMessages.common.noRecordFound,
        data: [],
      };
    } else {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: visaDocumentTypeData.data,
        pagination: visaDocumentTypeData.pagination_data,
        activity: visaDocumentTypeData.activity,
      };
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Getting Visa Document Types listing Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Visa Document Store request to store visa document data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Store the details in 'visa_document_types' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + visa_type_id(body) is mandatory, it should be a integer and checked for its existence in 'visa_types' table.
 *    + name(body) is mandatory, it should not contain certain special characters and its existence is checked in 'visa_document_types' table to avoid duplicates.
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
  logRequest('info', req, 'New visa Document Type creation request');
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
    check('visa_type_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.visaType.IdRequired)
      .isInt().withMessage(responseMessages.configurations.visaType.IdInvalid)
      .custom(async (value) => {
        const visatype = await indexServices.find('visa_types', ['id'], { id: value });
        const visatypeData = visatype.status;
        if (!visatypeData) {
          return Promise.reject(responseMessages.configurations.visaType.IdNotExists);
        }
      }),
    check('name')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.visaDocumentType.visaDocumentTypeNameRequired)
      .not().matches(/[{}?!'~$%*><]/)
      .withMessage(responseMessages.configurations.visaDocumentType.visaDocumentTypeNameInvalid)
      .custom(async (value) => {
        const visaDocumentType = await indexServices.find('visa_document_types', ['id'], { name: value, visa_type_id: req.body.visa_type_id });
        const visaDocumentTypeData = visaDocumentType.status;
        if (visaDocumentTypeData) {
          return Promise.reject(responseMessages.configurations.visaDocumentType.visaDocumentTypeNameExists);
        }
        const visaDocumentsAvailable = await indexServices.find('visa_document_types', ['id'], { visa_type_id: req.body.visa_type_id });
        const visaDocumentsAvailableStatus = visaDocumentsAvailable.status;
        if (visaDocumentsAvailableStatus && visaDocumentsAvailable.data.length >= 5){
          return Promise.reject(responseMessages.configurations.visaDocumentType.visaDocumentTypeLimitExceeded);
        }
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.visaDocumentType.visaDocumentTypeStatusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.visaDocumentType.visaDocumentTypeStatusInvalid),
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
   *    + Call the createvisa type document service function
   *        - Based on the status in createvisa type document function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    await visaDocumentTypeService.store(req.body);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.addedSuccessfully,
    };

    /* Log Response */
    logResponse(
      'info',
      req,
      responseData,
      'New visa type document Creation response',
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
 * Visa Document update request to update visa document data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ update the details in 'visa_document_types' table and return the data
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
 *    + visa_type_id(body) is mandatory, it should be a integer and checked for its existence in 'visa_types' table.
 *    + name(body) is mandatory, it should not contain certain special characters and its existence is checked in 'visa_document_types' table to avoid duplicates.
 *    + is_active(body) is mandatory and should be a boolean.
 *  - check if the visa document is being used for any visa type in 'visa_documents' table.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the visa document information.
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
  logRequest('info', req, 'update Visa Document Types request.');
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
      .withMessage(responseMessages.configurations.visaDocumentType.IdRequired)
      .isInt().withMessage(responseMessages.configurations.visaDocumentType.IdInvalid)
      .custom(async (value) => {
        const visaDocumentType = await indexServices.find('visa_document_types', ['id','is_editable'], { id: value });
        const visaDocumentTypeData = visaDocumentType.status;
        if (!visaDocumentTypeData) {
          return Promise.reject(responseMessages.configurations.visaDocumentType.IdNotExists);
        }if (!visaDocumentType.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.department.notAllowToModify);
        }
      }),
    check('visa_type_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.visaType.IdRequired)
      .isInt().withMessage(responseMessages.configurations.visaType.IdInvalid)
      .custom(async (value) => {
        const visatype = await indexServices.find('visa_types', ['id'], { id: value });
        const visatypeData = visatype.status;
        if (!visatypeData) {
          return Promise.reject(responseMessages.configurations.visaType.IdNotExists);
        }
      }),
    check('name')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.visaDocumentType.visaDocumentTypeNameRequired)
      .not().matches(/[{}?!'~$%*><]/)
      .withMessage(responseMessages.configurations.visaDocumentType.visaDocumentTypeNameInvalid)
      .custom(async (value) => {
        const visaDocumentType = await indexServices.find('visa_document_types', ['id'], { name: value, visa_type_id: req.body.visa_type_id });
        const status = visaDocumentType.status;
        if (status) {
          if (visaDocumentType.data[0].id !== Number(req.params.id)) {
            return Promise.reject(responseMessages.configurations.visaDocumentType.visaDocumentTypeNameExists);
          }
        }
        const visaDocumentsAvailable = await indexServices.find('visa_document_types', ['id'], { visa_type_id: req.body.visa_type_id });
        const visaDocumentsAvailableStatus = visaDocumentsAvailable.status;
        if (visaDocumentsAvailableStatus && visaDocumentsAvailable.data.length >= 5){
          return Promise.reject(responseMessages.configurations.visaDocumentType.visaDocumentTypeLimitExceeded);
        }
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.visaDocumentType.visaDocumentTypeStatusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.visaDocumentType.visaDocumentTypeStatusInvalid)
      // .custom((value) => {
      //   if (value == 'false' || Number(value) == 0) {
      //     return indexServices.count('visa_documents', { visa_document_type_id: req.params.id }, [], true).then((visaDocumentType) => {
      //       if (Number(visaDocumentType.data) != 0) {
      //         return Promise.reject("visa document type is mapped for" + " " + visaDocumentType.data + " " + "visa documents ");
      //       }
      //     });
      //   }
      //   return true
      // }),
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
    await visaDocumentTypeService.update(req.body, condition);

    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'Update Visa Document Types Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Visa Document update-status request to update visa document data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ update the details in 'visa_document_types' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + id(params) is mandatory, it should be a integer and checked for its existence in 'visa_document_types' table.
 *    + is_active(body) is mandatory and should be a boolean.
 *  *  - check if the visa document is being used for any visa in 'visa_documents' table.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the visa document information.
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
 * @throws {InvalidRequestError} If there are validation errors in the request body.
 */
const updateStatus = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Update Status Visa Document Types request.');
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
      .withMessage(responseMessages.configurations.visaDocumentType.IdRequired)
      .isInt().withMessage(responseMessages.configurations.visaDocumentType.IdInvalid)
      .custom(async (value) => {
        const visaDocumentType = await indexServices.find('visa_document_types', ['id','is_editable'], { id: value });
        const visaDocumentTypeData = visaDocumentType.status;
        if (!visaDocumentTypeData) {
          return Promise.reject(responseMessages.configurations.visaDocumentType.IdNotExists);
        }if (!visaDocumentType.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.department.notAllowToModify);
        }
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.visaDocumentType.visaDocumentTypeStatusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.visaDocumentType.visaDocumentTypeStatusInvalid)
      // .custom((value) => {
      //   if (value == 'false' || Number(value) == 0) {
      //     return indexServices.count('visa_documents', { visa_document_type_id: req.params.id }, [], true).then((visaDocumentType) => {
      //       if (Number(visaDocumentType.data) != 0) {
      //         return Promise.reject("visa document type is mapped for" + " " + visaDocumentType.data + " " + "visa documents ");
      //       }
      //     });
      //   }
      //   return true
      // }),
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
    await visaDocumentTypeService.updateStatus(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'Update Status Visa Document Types Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = { destroy, dropdown, index, listing, store, update, updateStatus };
