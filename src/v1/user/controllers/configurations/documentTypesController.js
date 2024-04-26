const { check, validationResult } = require('express-validator');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { logRequest, logResponse } = require('../../../../../utils/log');
const documentTypesService = require('../../services/configurations/documentTypesService');
const indexServices = require('../../services/index');
const { responseHandler } = require('../../../../responseHandler');
const { tryCatch } = require('../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const { pagination } = require('../../../../../config/pagination');

/**
 * Store function to store new document data
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Add a new document store.
 *     ~ Track the activity related to this creation.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request to create a new document store.
 * - Extract the category slug name from the request's URL.
 * - Define the validation rules to ensure the request is valid:
 *   + `request_id` (body) is mandatory.
 *   + `category_slug_name` (body) must correspond to an existing document category.
 *   + `name` (body) should be a valid name for the document type and not contain special characters.
 *   + `number_mandatory` (body) must be valid booleans
 *   + 'number_display' (body) must be valid booleans
 *      ~ if `number_mandatory` (body) is set to `true`, `number_display` (body) is also set to `true`
 *   + `valid_from_mandatory` (body) must be valid booleans
 *   + `valid_from_display` (body) must be valid booleans
 *      ~  if `valid_from_mandatory` (body) is set to `true`, `valid_from_display` (body) is also set to `true`.
 *   + `valid_to_mandatory (body)` must be valid booleans
 *   + 'valid_to_display' (body) must be valid booleans
 *      ~ if `valid_to_mandatory`(body) is set to `true`, `valid_to_display`(body) is also set to `true`.
 *   + `status_mandatory`(body) must be valid booleans
 *   + 'status_display'(body) must be valid booleans
 *      ~ if `status_mandatory`(body) is set to `true`, `status_display`(body) is also set to `true`.
 *   + `upload_mandatory`(body) must be valid booleans.
 *   + 'upload_display'(body) must be valid booleans.
 *      ~ if `upload_mandatory`(body) is set to `true`, `upload_display`(body) is also set to `true`.
 *   + `is_active`(body) must be a valid boolean.
 *   + Check if the document type name is unique within the specified document category.
 * - Run the validation rules.
 *   + If validation is successful:
 *     ~ Call the store service function to add a new document store.
 *   + Else:
 *     ~ Add an error message to the response.
 * - Log the response.
 * - Return the response with status codes, indicating the outcome of the creation.
 *        
 * Notes:
 * - Exception handling is implemented using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
const store = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'store new document data request');
  /* Log Request */

  const requestSegments = req.path.split('/');
  const categorySlugName = requestSegments[2];
  req.body.category_slug_name = categorySlugName;

  /* Default variable */
  let responseData = [];
  /* Default variable */

  const documentCategory = {
    slug: req.body.category_slug_name,
    is_active: true,
  };
  const documentCategoryDetails = await indexServices.find('document_categories', ['id'], documentCategory);

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('category_slug_name')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.categorySlugNameRequired)
      .custom(async (value) => {
        const documentCategoryData = await indexServices.find('document_categories', ['id'], { slug: value, is_active: true });
        const status = documentCategoryData.status;
        if (!status) {
          return Promise.reject(responseMessages.configurations.documentTypes.documentCategorySlugInvalid);
        }
      }),
    check('name')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.documentTypeNameRequired)
      .not().matches(/[{}?!'~$%*><|]/)
      .withMessage(responseMessages.configurations.documentTypes.documentTypeNameInvalid)
      .custom(async (value) => {
        const document = await indexServices.find('document_types', ['id'], { name: value, document_category_id: documentCategoryDetails.data[0].id });
        var documentData = document.status;
        if (documentData) {
          return Promise.reject(responseMessages.configurations.documentTypes.documentTypeNameExists);
        }
      }),
    check('number_mandatory')
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.NumberMandatoryRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.NumberMandatoryInvalid)
      .custom(async (value) => {
        const display = req.body.number_display;
        if (value && !display) {
          return Promise.reject(responseMessages.configurations.documentTypes.NumberMandatoryDisplayNone);
        }
      }),
    check('number_display')
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.NumberDisplayRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.NumberDisplayInvalid),
    check('valid_from_mandatory')
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.ValidFromMandatoryRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.ValidFromMandatoryInvalid)
      .custom(async (value) => {
        const display = req.body.valid_from_display;
        if (value && !display) {
          return Promise.reject(responseMessages.configurations.documentTypes.ValidFromMandatoryDisplayNone);
        }
      }),

    check('valid_from_display')
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.ValidFromDisplayRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.ValidFromDisplayInvalid),
    check('valid_to_mandatory')
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.ValidToMandatoryRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.ValidToMandatoryInvalid)
      .custom(async (value) => {
        const display = req.body.valid_to_display;
        if (value && !display) {
          return Promise.reject(responseMessages.configurations.documentTypes.ValidToMandatoryDisplayNone);
        }
      }),
    check('valid_to_display')
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.ValidToDisplayRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.ValidtoDisplayInvalid),
    check('status_mandatory')
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.StatusMandatoryRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.StatusMandatoryInvalid)
      .custom(async (value) => {
        const display = req.body.status_display;
        if (value && !display) {
          return Promise.reject(responseMessages.configurations.documentTypes.StatusMandatoryDisplayNone);
        }
      }),
    check('status_display')
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.StatusDisplayRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.StatusDisplayInvalid),
    check('upload_mandatory')
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.UploadMandatoryRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.UploadMandatoryInvalid)
      .custom(async (value) => {
        const display = req.body.upload_display;
        if (value && !display) {
          return Promise.reject(responseMessages.configurations.documentTypes.UploadMandatoryDisplayNone);
        }
      }),
    check('upload_display')
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.UploadDisplayRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.UploadDisplayInvalid),
    check('description')
    .trim()
    .escape()
    .custom(async (value) => {
      if(value.length > 50){
        return Promise.reject(responseMessages.configurations.documentTypes.discriptionLengthExceed);
      }
    }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.configurations.documentTypes.statusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.statusInvalid),
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
   *    + Call the store service function
   *        - Based on the status in store function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    await documentTypesService.store(req.body);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.addedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'store new document data request');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Update function to modify an existing document type and track the activity.
 * Overview of API:
 * - Validate the request.
 *   + If successful:
 *     ~ Update the document type.
 *   + Else:
 *     ~ Return an error response.
 * - Return the response with the outcome of the update.
 * 
 * Logic:
 * - Log the request
 * - Extract the category slug name ('category_slug_name') from the request's URL and assign to request body.
 * - Define validation rules to ensure the request is valid:
 *   + `request_id` (body) is mandatory.
 *   + `id` (body) should be a valid integer and correspond to an existing in 'document_types' table.
 *   + `category_slug_name` (body) must correspond to an existing int 'document_categories' table.
 *   + `name` (body) should be a valid name for the document type and not contain special characters.
 *   + `number_mandatory` (body) must be valid booleans.
 *   + 'number_display' (body) must be valid booleans.
 *      ~ If `number_mandatory` (body) is set to `true`, `number_display` (body) is also set to `true`.
 *   + `valid_from_mandatory` (body) must be valid booleans.
 *   + `valid_from_display` (body) must be valid booleans.
 *      ~ If `valid_from_mandatory` (body) is set to `true`, `valid_from_display` (body) is also set to `true`.
 *   + `valid_to_mandatory (body)` must be valid booleans.
 *   + 'valid_to_display' (body) must be valid booleans.
 *      ~ If `valid_to_mandatory`(body) is set to `true`, `valid_to_display`(body) is also set to `true`.
 *   + `status_mandatory`(body) must be valid booleans.
 *   + 'status_display'(body) must be valid booleans.
 *      ~ If `status_mandatory`(body) is set to `true`, `status_display`(body) is also set to `true`.
 *   + `upload_mandatory`(body) must be valid booleans.
 *   + 'upload_display'(body) must be valid booleans.
 *      ~ If `upload_mandatory`(body) is set to `true`, `upload_display`(body) is also set to `true`.
 *   + `is_active`(body) must be a valid boolean.
 *      ~ If 'is_active' is false:
 *        # Check if the document type ID is mapped to any 'employee_personal_documents' or 'placement_documents' tables.
 * - Run the validation rules.
 *   + If validation is successful:
 *     ~ Call the update service function to modify the document type.
 *   + Else:
 *     ~ Add an error message to the response.
 * - Log the response.
 * - Return the response with status codes indicating the outcome of the update.
 * 
 * Notes:
 * - Exception handling is implemented using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update document types request.');
  /* Log Request */

  const requestSegments = req.path.split('/');
  const categorySlugName = requestSegments[2];
  req.body.category_slug_name = categorySlugName;

  /* Default variable */
  let responseData = [];
  /* Default variable */

  const documentCategory = {
    slug: req.body.category_slug_name,
    is_active: true,
  };
  const documentCategoryDetails = await indexServices.find('document_categories', ['id'], documentCategory);

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.documentTypes.documentTypeId)
      .isInt().withMessage(responseMessages.configurations.documentTypes.documentTypeIdInvalid)
      .custom(async (value) => {
        const data = await indexServices.find('document_types', ['id','is_editable'], { id: value });
        var documentData = data.status;
        if (!documentData) {
          return Promise.reject(responseMessages.configurations.documentTypes.IdNotExists);
        }if (!data.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.department.notAllowToModify);
        }
      }),
    check('category_slug_name').trim().escape().notEmpty().withMessage(responseMessages.configurations.documentTypes.categorySlugNameRequired).custom(async (value) => {
      const documentCategoryData = await indexServices.find('document_categories', ['id'], { slug: value, is_active: true });
      const status = documentCategoryData.status;
      if (!status) {
        return Promise.reject(responseMessages.configurations.documentTypes.documentCategorySlugInvalid);
      }
    }),
    check('name')
      .trim()
      .notEmpty().withMessage(responseMessages.configurations.documentTypes.documentTypeNameRequired)
      .not().matches(/[{}?!'~$%*><|]/).withMessage(responseMessages.configurations.documentTypes.documentTypeNameInvalid)
      .custom(async (value) => {
        const employeeTeam = await indexServices.find('document_types', ['id'], { name: value, document_category_id: documentCategoryDetails.data[0].id });
        const status = employeeTeam.status;
        if (status) {
          if (employeeTeam.data[0].id !== Number(req.body.id)) {
            return Promise.reject(responseMessages.configurations.documentTypes.documentTypeNameExists);
          }
        }
      }),
    check('number_mandatory')
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.NumberMandatoryRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.NumberMandatoryInvalid)
      .custom(async (value) => {
        const display = req.body.number_display;
        if (value && !display) {
          return Promise.reject(responseMessages.configurations.documentTypes.NumberMandatoryDisplayNone);
        }
      }),
    check('number_display')
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.NumberDisplayRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.NumberDisplayInvalid),
    check('valid_from_mandatory')
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.ValidFromMandatoryRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.ValidFromMandatoryInvalid)
      .custom(async (value) => {
        const display = req.body.valid_from_display;
        if (value && !display) {
          return Promise.reject(responseMessages.configurations.documentTypes.ValidFromMandatoryDisplayNone);
        }
      }),

    check('valid_from_display')
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.ValidFromDisplayRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.ValidFromDisplayInvalid),
    check('valid_to_mandatory')
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.ValidToMandatoryRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.ValidToMandatoryInvalid)
      .custom(async (value) => {
        const display = req.body.valid_to_display;
        if (value && !display) {
          return Promise.reject(responseMessages.configurations.documentTypes.ValidToMandatoryDisplayNone);
        }
      }),
    check('valid_to_display')
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.ValidToDisplayRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.ValidtoDisplayInvalid),
    check('status_mandatory')
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.StatusMandatoryRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.StatusMandatoryInvalid)
      .custom(async (value) => {
        const display = req.body.status_display;
        if (value && !display) {
          return Promise.reject(responseMessages.configurations.documentTypes.StatusMandatoryDisplayNone);
        }
      }),
    check('status_display')
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.StatusDisplayRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.StatusDisplayInvalid),
    check('upload_mandatory')
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.UploadMandatoryRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.UploadMandatoryInvalid)
      .custom(async (value) => {
        const display = req.body.upload_display;
        if (value && !display) {
          return Promise.reject(responseMessages.configurations.documentTypes.UploadMandatoryDisplayNone);
        }
      }),
    check('upload_display')
      .notEmpty()
      .withMessage(responseMessages.configurations.documentTypes.UploadDisplayRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.UploadDisplayInvalid),

    check('is_active')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.configurations.documentTypes.statusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.statusInvalid)
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee_personal_documents', { document_type_id: req.params.id }, [], true).then((documentType) => {
            if (Number(documentType.data) != 0) {
              return Promise.reject("document type id is mapped for" + " " + documentType.data + " " + "employee personal documents ");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('placement_documents', { document_type_id: req.params.id }, [], true).then((documentType) => {
            if (Number(documentType.data) != 0) {
              return Promise.reject("document type id is mapped for" + " " + documentType.data + " " + "placement documents ");
            }
          });
        }
        return true
      }),
    check('description')
      .trim()
      .escape()
      .custom(async (value) => {
        if(value.length > 50){
          return Promise.reject(responseMessages.configurations.documentTypes.discriptionLengthExceed);
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
    const condition = { id: req.params.id };
    await documentTypesService.update(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'Update employee Team Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Update Document Type Status to enable or disable.
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Call the service function to update the document type status.
 *     ~ Add a success message to the response.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request to update the document type status.
 * - Define the validation rules as follows:
 *   + `request_id` (Request body) is mandatory.
 *   + `id` (Request body) is mandatory, should be an integer, and must exist in the 'document_types' table.
 *   + `is_active` (Request body) is mandatory, should be a boolean value.
 *      ~ If 'is_active' is false:
 *        # Check if the document type ID is mapped to any 'employee_personal_documents' or 'placement_documents' tables.
 * - Run the validation rules.
 *   + If validation is successful:
 *     ~ Create a condition based on the provided 'id'(request params).
 *     ~ Call the service function (`documentTypesService.updateStatus`) to update the document type status.
 *   + Else:
 *     ~ Add an error validation to the response.
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
const updateStatus = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update document types request.');
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
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.documentTypes.documentTypeId)
      .isInt().withMessage(responseMessages.configurations.documentTypes.documentTypeIdInvalid)
      .custom(async (value) => {
        const data = await indexServices.find('document_types', ['id','is_editable'], { id: value });
        var documentData = data.status;
        if (!documentData) {
          return Promise.reject(responseMessages.configurations.documentTypes.IdNotExists);
        }if (!data.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.department.notAllowToModify);
        }
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.configurations.documentTypes.statusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.documentTypes.statusInvalid)
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee_personal_documents', { document_type_id: req.params.id }, [], true).then((documentType) => {
            if (Number(documentType.data) != 0) {
              return Promise.reject("document type id is mapped for" + " " + documentType.data + " " + "employee personal documents ");
            }
          });
        }
        return true
      })
  //     .custom((value) => {
  //       if (value == 'false' || Number(value) == 0) {
  //         return indexServices.count('placement_documents', { document_type_id: req.params.id }, [], true).then((documentType) => {
  //           if (Number(documentType.data) != 0) {
  //             return Promise.reject("document type id is mapped for" + " " + documentType.data + " " + "placement documents ");
  //           }
  //         });
  //       }
  //       return true
  //     }),
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
    await documentTypesService.updateStatus(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'Update employee Team Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Document Type Listing Request to Fetch Document Type Data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service functions to fetch data.
 *      ~ Fetch the data from 'document_types' table.
 *      ~ Add success to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Logging incoming request.
 *  - Extract categorySlugName from the URL path.
 *  - Define validation rules as follows:
 *    + request_id (query) is mandatory.
 *    + limit (query) is optional, it should be an integer.
 *    + page (query) is optional, it should be an integer.
 *    + search (query) is optional, it should be a string.
 *   
 *  - Run the validation rules.
 *    + If validation succeeds
 *      ~ Fetch the document category information based on the categorySlugName.
 *      ~ Define condition object to fetch the document type information.
 *      ~ Call the service function (listing) to fetch the data and send the condition, limit, page, and categorySlugName.
 *      ~ Add the service function's return data to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Logging the response.
 *  - Return the response using responseHandler().
 *        
 * Notes:
 *  - Exception handling is done using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If the requestId is not provided or if the document category slug is invalid.
 */
const listing = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting document type Details request');
  /* Log Request */

  const requestSegments = req.path.split('/');
  const categorySlugName = requestSegments[2];
  req.body.category_slug_name = categorySlugName;

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

    const documentCategory = {
      slug: req.body.category_slug_name,
      is_active: true,
    };
    const documentCategoryData = await indexServices.find('document_categories', ['id'], documentCategory);
    if (documentCategoryData.status) {
      const condition = { search, document_category_id: documentCategoryData.data[0].id };
      const documentTypeData = await documentTypesService.listing(condition, page, limit, req.body.category_slug_name);
      if (!documentTypeData.status) {
        responseData = { statusCode: responseCodes.codeSuccess, message: documentTypeData.message, error: documentTypeData.error, data: [], pagination: documentTypeData.pagination_data, activity: documentTypeData.activity };
      } else {
        responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: documentTypeData.data, pagination: documentTypeData.pagination_data, activity: documentTypeData.activity };
      }

      /* Log Response */
      logResponse('info', req, responseData, 'Getting document type Details Response');
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData);
      /* Return the response */
    } else {
      throw new InvalidRequestError(responseMessages.configurations.documentTypes.documentCategorySlugInvalid);
    }
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Document Type Index to retrieve document type data based on document type ID.
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Call the service function to fetch document type data.
 *     ~ Retrieve data from the 'document_types' table and return it.
 *     ~ Add a success message to the response.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Parse the request path to extract the category slug name and add it to the request body.
 * - Initialize default variables, including responseData and requestId.
 * - Check if requestId is provided and not empty.
 *   + If true, 
 *      ~ check if documentTypeId is provided and not empty.
 *        # If documentTypeId is provided:
 *           + Define a condition object to fetch document type information based on the documentTypeId.
 *           + Call the service function (documentTypesService.index) to fetch the data based on the condition.
 *           + Prepare the response based on the success or failure of the service function.
 *        # Else :
 *            + set an error response indicating the document type ID is missing.
 *   + Else:
 *      ~  set an error response indicating the request ID is required.
 * - Log the response.
 * - Return the response using the responseHandler.
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
  logRequest('info', req, 'getting document type index request');
  /* Log Request */

  const requestSegments = req.path.split('/');
  const categorySlugName = requestSegments[2];
  req.body.category_slug_name = categorySlugName;

  /* Default variable */
  let responseData = [];
  const requestId = req.query.request_id;
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    /* Default variable */
    const documentTypeId = req.query.id;
    /* Default variable */

    /* Writing validation rules to the input request */
    if (documentTypeId !== undefined && documentTypeId !== '') {
      const condition = { id: documentTypeId };
      const documentTypeData = await documentTypesService.index(condition);
      if (!documentTypeData.status) {
        responseData = { statusCode: responseCodes.codeSuccess, message: documentTypeData.message, error: documentTypeData.error, data: [] };
      } else {
        responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: documentTypeData.data };
      }
    } else {
      responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.configurations.documentTypes.documentTypeId };
    }

    /* Log Response */
    logResponse('info', req, responseData, 'getting document type index response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Document Types Dropdown to return a list of document types based on the provided category slug.
 * 
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Fetch document types based on the specified category slug.
 *     ~ Add success to the response.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Extract the category slug from the request path.
 * - Define default variables and request ID.
 * - If request ID provided and not empty.
 *   + If it is, proceed with fetching document types.
 *     -> Check if the document category in 'document_categories' table based on the provided category slug is active.
 *     -> If data exists:
 *        ~ Define a default variable for search.
 *        ~ Define the condition to filter document types based on the category ID, search, and active status.
 *        ~ Fetch document types data from 'document_types' table based condition(defined above).
 *        ~ If document types data exists :
 *            # prepare the response with success and data.
 *        ~ Else:
 *            # prepare the response with success but no data.
 *    -> Else :
 *        ~ throw an 'InvalidRequestError' with an error message 'document category slug name invalid'.
 * - Else:
 *   + throw an 'InvalidRequestError' with an error message 'Request id is required'.
 * - Log the response.
 * - Return the response using 'responseHandler'.
 * 
 * Notes:
 * - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const dropdown = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting document types dropdown request.');
  /* Log Request */

  const requestSegments = req.path.split('/');
  const categorySlugName = requestSegments[2];
  req.body.category_slug_name = categorySlugName;

  /* Default variable */
  let responseData = [];
  const requestId = req.query.request_id;
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    const documentCategory = {
      slug: req.body.category_slug_name,
      is_active: true,
    };
    const documentCategoryData = await indexServices.find('document_categories', ['id'], documentCategory);
    if (documentCategoryData.status) {
      /* Default variable */
      const search = req.query.search ? req.query.search : '';
      /* Default variable */

      /* Writing validation rules to the input request */
      const condition = { search, document_category_id: documentCategoryData.data[0].id, is_active: 1 };
      const documentTypeData = await indexServices.find('document_types', ['id', 'name as value', 'number_mandatory', 'number_display', 'valid_from_mandatory', 'valid_from_display', 'valid_to_mandatory', 'valid_to_display', 'status_mandatory', 'status_display', 'upload_mandatory', 'upload_display'], condition, 0);
      if (!documentTypeData.status) {
        responseData = { statusCode: responseCodes.codeSuccess, message: documentTypeData.message, error: documentTypeData.error, data: [] };
      } else {
        responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: documentTypeData.data };
      }
      /* Writing validation rules to the input request */

      /* Log Response */
      logResponse('info', req, responseData, 'Getting document types dropdown Response');
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData);
      /* Return the response */
    } else {
      throw new InvalidRequestError(responseMessages.configurations.documentTypes.documentCategorySlugInvalid);
    }
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Delete Document Types.
 * 
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Delete the document type details.
 *     ~ Add a success message to the response.
 *   + Else
 *     ~ Return the error message.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Define the default variable 'responseData'.
 * - Define the following validation rules:
 *      - `request_id` (Request body) is mandatory.
 *      - `id` (Request body) is mandatory, should be an integer, and must exist in the 'document_types' table.
 *      - `is_active` (Request body) is mandatory and should be a boolean value.
 *         ~ If 'is_active' is false, additional checks are performed:
 *           # Verify if the document type ID is mapped to any records in the 'employee_personal_documents' or 'placement_documents' tables.
 * - Execute the validation rules and collect validation errors.
 * - If there are no validation errors:
 *   + Create a condition based on the provided 'id'(request params).
 *   + Call 'documentTypesService.destroy' to delete the document type details.
 *   + Prepare the response with a success message indicating the deletion.
 * - Else :
 *    + throw an 'InvalidRequestError' with the corresponding error message and a 'Unprocessable Entity' status code.
 * - Log the response.
 * - Return the response using 'responseHandler'.
 *        
 * Notes:
 * - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const destroy = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Delete document types request');
  /* Log Request */

  const requestSegments = req.path.split('/');
  const categorySlugName = requestSegments[2];
  req.body.category_slug_name = categorySlugName;

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
      .withMessage(responseMessages.configurations.documentTypes.documentTypeId)
      .isInt().withMessage(responseMessages.configurations.documentTypes.documentTypeIdInvalid)
      .custom(async (value) => {
        const employeeTeam = await indexServices.find('document_types', ['id', 'is_editable', 'name', 'document_category_id'], { id: value });
        const documentTypeData = employeeTeam.status;
        if (!documentTypeData) {
          return Promise.reject(responseMessages.configurations.documentTypes.IdNotExists);
        }
        if (!employeeTeam.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.department.notAllowToModify);
        }
        req.body.name = employeeTeam.data[0].name
        req.body.document_category_id = employeeTeam.data[0].document_category_id
      })
      .custom(async (value) => {
        return indexServices.count('employee_personal_documents', { document_type_id: value }, [], true).then((documentType) => {
          if (Number(documentType.data) != 0) {
            return Promise.reject("document type id is mapped for" + " " + documentType.data + " " + "employee personal documents ");
          }
        });
      })
      .custom((value) => {
        return indexServices.count('placement_documents', { document_type_id: value }, [], true).then((documentType) => {
          if (Number(documentType.data) != 0) {
            return Promise.reject("document type id is mapped for" + " " + documentType.data + " " + "placement documents ");
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
   * + Delete  document type details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    await documentTypesService.destroy(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.deletedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'document type delete Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = { destroy, dropdown, index, listing, store, update, updateStatus };
