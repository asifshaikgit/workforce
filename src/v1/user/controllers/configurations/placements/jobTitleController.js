const jobTitleService = require('../../../services/configurations/placements/jobTitleService');
const { check, validationResult } = require('express-validator');
const { logRequest, logResponse } = require('../../../../../../utils/log');
const { responseMessages } = require('../../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../../constants/responseCodes');
const { responseHandler } = require('../../../../../responseHandler');
const { tryCatch } = require('../../../../../../utils/tryCatch');
const { pagination } = require('../../../../../../config/pagination');
const InvalidRequestError = require('../../../../../../error/InvalidRequestError');
const indexServices = require('../../../services/index');
const { regexPatterns } = require('../../../../../../constants/regexPatterns')


/**
 * Create a Job Title.
 * Overview of API:
 *  - Validate the request  .
 *    + If successful
 *      ~ Call the service function to create a new job title.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic: 
 *  - Log incoming request.
 *  - Define the validation rules as follows:
 *    + request_id (body) is mandatory.
 *    + name (body) is mandatory, should not contain special characters, and must be unique.
 *    + is_active (body) is mandatory and should be a valid boolean.
 *  - Run the validation rules.
 *    + If validation is successful:
 *      ~ Call the service function to create a new job title.
 *      ~ Add a success message to the response.
 *    + Else:
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Logging the response.
 *  - Return the response using responseHandler().
 *        
 * Notes:
 *    - Handling exceptions using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const store = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'create job title request.');
  /* Log Request */

  /* Default Variable */
  let responseData = [];
  /* Default Variable */

  /* Writing validation conditions to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('name').trim().escape().notEmpty().withMessage(responseMessages.configurations.jobTitle.jobTitleNameRequired)
      .not().matches(regexPatterns.specialCharactersRegex).withMessage(responseMessages.configurations.jobTitle.jobTitleNameInvalid)
      .custom((value) => {
        return indexServices.find('job_titles', ['id'], { name: value }).then((jobTitle) => {
          const jobTitleData = jobTitle.status;
          if (jobTitleData) {
            return Promise.reject(responseMessages.configurations.jobTitle.jobTitleNameExists);
          }
        });
      }),
    check('is_active').trim().escape().notEmpty().withMessage(responseMessages.configurations.jobTitle.jobTitleStatusRequired)
      .isBoolean().withMessage(responseMessages.configurations.jobTitle.jobTitleStatusInvalid),
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
     *    + call the store service function
     *        - Based on the status in store function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
    */
  if (errors.isEmpty()) {
    await jobTitleService.store(req.body);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'job title Create Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Update an existing Job Title.
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to update the job title.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic: 
 *  - Log incoming request.
 *  - Define the validation rules as follows:
 *    + request_id (body) is mandatory.
 *    + id (body) is mandatory, should be a valid numeric value, and must exist in the 'job_titles' table.
 *    + name (body) is mandatory and should not contain special characters. It must also be unique among job titles.
 *    + is_active (body) is mandatory and should be a valid boolean.
 *      ~ Check if it is false
 *        - need to check id mapped to any 'placements' table 
 *  - Run the validation rules.
 *    + If validation is successful:
 *      ~ Create a condition based on the provided 'id'(request params).
 *      ~ Call the service function to update the job title.
 *      ~ Add a success message to the response.
 *    + Else:
 *      ~ Add error validation to the response.
 *  - Prepare the response with appropriate status codes.
 *  - Log the response.
 *  - Return the response using responseHandler().
 *        
 * Notes:
 *  - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} - A JSON response indicating the status of the update process.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update job title request.');
  /* Log Request */

  /* Default Variable */
  let responseData = [];
  /* Default Variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.jobTitle.IdRequired)
      .isInt().withMessage(responseMessages.configurations.jobTitle.IdInvalid)
      .custom(async (value) => {
        const jobTitle = await indexServices.find('job_titles', ['id', 'is_editable'], { id: value });
        const jobTitleData = jobTitle.status;
        if (!jobTitleData) {
          return Promise.reject(responseMessages.configurations.jobTitle.IdNotExists);
        }
        if (!jobTitle.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.department.notAllowToModify);
        }
      }),
    check('name').trim().escape().notEmpty().withMessage(responseMessages.configurations.jobTitle.jobTitleNameRequired)
      .not().matches(regexPatterns.specialCharactersRegex).withMessage(responseMessages.configurations.jobTitle.jobTitleNameInvalid)
      .custom((value) => {
        return indexServices.find('job_titles', ['id'], { name: value }).then((jobTitleData) => {
          const jobTitleStatus = jobTitleData.status;
          if (jobTitleStatus) {
            if (jobTitleData.data[0].id !== Number(req.params.id)) {
              return Promise.reject(responseMessages.configurations.jobTitle.jobTitleNameExists);
            }
          }
        });
      }),

    check('is_active').trim().escape().notEmpty().withMessage(responseMessages.configurations.jobTitle.jobTitleStatusRequired)
      .isBoolean().withMessage(responseMessages.configurations.jobTitle.jobTitleStatusInvalid)
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('placements', { job_title_id: req.params.id }, [], true)
            .then((jobTitle) => {
              if (Number(jobTitle.data) != 0) {
                return Promise.reject("job title is mapped for" + " " + jobTitle.data + " " + "placements");
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
    const condition = { id: req.params.id };
    await jobTitleService.update(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, ' Update job title Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Job Title Index to return job title data.
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Call the service function to fetch job title data.
 *     ~ Add a success message to the response.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Define the validation rules as follows:
 *   + `request_id` (request param) is mandatory.
 *   + `id` (request param) is mandatory, should be an integer, and must exist in the 'job_titles' table.
 * - Run the validation rules.
 *   + If validation is successful:
 *     ~ Call the service function (`index`) to fetch the job title data.
 *     ~ Add the service function (`index`) return data to the response.
 *   + Else:
 *     ~ Add error validation to the response.
 * - Prepare the response with status codes.
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

const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'getting job title index request');
  /* Log Request */

  /* Default Variable */
  let responseData = [];
  /* Default Variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.jobTitle.IdRequired)
      .isInt().withMessage(responseMessages.configurations.jobTitle.jobTileIdInvalid)
      .custom((value) => {
        return indexServices.find('job_titles', ['id'], { id: value }).then((jobTitleData) => {
          const status = jobTitleData.status;
          if (!status) {
            return Promise.reject(responseMessages.configurations.jobTitle.IdNotExists);
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
       *    + call the index service function
       *        - Based on the status in index function response, segregate the response and prepare the response
       * If Validation Fails
       *    + Return the error message.
      */
  if (errors.isEmpty()) {
    const condition = { id: req.query.id };
    const jobTitleData = await jobTitleService.index(condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: jobTitleData.data };

    /* Log Response */
    logResponse('info', req, responseData, 'jobTitle index Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Job Title Listing to return job title data.
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Call the service function to fetch job title data.
 *     ~ Add a success message to the response.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Define the validation rules as follows:
 *   + `request_id` (Request parameter) is mandatory.
 * - Run the validation rules.
 *   + If validation is successful:
 *     ~ Prepare variables for `limit`, `page`, and `search`, if provided in the request.
 *     ~ Call the service function (`jobTitleService.listing`) to fetch job title data based on the specified condition, page, and limit.
 *     ~ Based on the status in the service function response, prepare the response with data, pagination details, and activity information.
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
const listing = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting Job Title Details request');
  /* Log Request */

  /* Default Variable */
  let responseData = [];
  const requestId = req.query.request_id;
  /* Default Variable */

  if (requestId !== undefined && requestId !== '') {
    /* Default Variable */
    const limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
    const page = (req.query.page) ? (req.query.page) : pagination.page;
    const search = req.query.search ? req.query.search : '';
    /* Default Variable */

    /* Writing validation rules to the input request */
    const condition = { search };
    const jobTitleData = await jobTitleService.listing(condition, page, limit);
    if (!jobTitleData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: jobTitleData.message, error: jobTitleData.error, data: [], pagination: jobTitleData.pagination };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: jobTitleData.data, pagination: jobTitleData.pagination_data, activity: jobTitleData.activity };
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse('info', req, responseData, 'Getting Job Title Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Update Job Title Status to enable or disable
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Call the service function to update the job title status.
 *     ~ Add a success message to the response.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Define the validation rules as follows:
 *   + `request_id` (Request body) is mandatory.
 *   + `id` (Request body) is mandatory, should be an integer, and must exist in the 'job_titles' table.
 *   + `is_active` (Request body) is mandatory, should be a boolean value.
 *      ~ If 'is_active' false:
 *        # Check if the job title id is mapped any placement in 'placements' table based on 'id'(params)
 * - Run the validation rules.
 *   + If validation is successful:
 *     ~ Create a condition based on the provided 'id'(request params).
 *     ~ Call the service function (`jobTitleService.updateStatus`) to update the job title status.
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
const updateStatus = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'job title status update request');
  /* Log Request */

  /* Default Variable */
  let responseData = [];
  /* Default Variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.jobTitle.IdRequired)
      .isInt().withMessage(responseMessages.configurations.jobTitle.IdInvalid)
      .custom(async (value) => {
        const jobTitle = await indexServices.find('job_titles', ['id', 'is_editable'], { id: value });
        const jobTitleData = jobTitle.status;
        if (!jobTitleData) {
          return Promise.reject(responseMessages.configurations.jobTitle.IdNotExists);
        }
        if (!jobTitle.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.department.notAllowToModify);
        }
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.jobTitle.jobTitleStatusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.jobTitle.jobTitleStatusInvalid)
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('placements', { job_title_id: req.params.id }, [], true)
            .then((jobTitle) => {
              if (Number(jobTitle.data) != 0) {
                return Promise.reject("job title is mapped for" + " " + jobTitle.data + " " + "placements");
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
    await jobTitleService.updateStatus(req.body, condition);
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
 * Job Title Dropdown to Retrieve Active Job Titles.
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Fetch a list of active job titles.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the request.
 * - Define the validation rules as follows:
 *   + `request_id` (Request parameter) is mandatory.
 * - Run the validation rules.
 *   + If validation is successful:
 *     ~ Prepare variables for filtering based on `search` and `is_active`.
 *     ~ Call the service function (`indexServices.find`) to retrieve active job titles.
 *   + Else:
 *     ~ Add error validation to the response.
 * - Log the response.
 * - Return the response with status codes, including a list of active job titles if successful.
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
  logRequest('info', req, 'Getting job title Details request.');
  /* Log Request */

  /* Default Variable */
  let responseData = [];
  const requestId = req.query.request_id;
  /* Default Variable */

  if (requestId !== undefined && requestId !== '') {
    /* Default Variable */
    const search = req.query.search ? req.query.search : '';
    /* Default Variable */

    /* Writing validation rules to the input request */
    const condition = { search, is_active: true };
    const jobTitleData = await indexServices.find('job_titles', ['id', 'name as value'], condition, 0);
    if (!jobTitleData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: jobTitleData.message, error: jobTitleData.error, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: jobTitleData.data };
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse('info', req, responseData, 'Getting job title Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Delete Job Title.
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Delete the specified job title.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the request.
 * - Define the validation rules to ensure the request is valid:
 *   + `request_id` (Request parameter) is mandatory.
 *   + `id` (Request parameter) must be a valid integer and must exist in the 'job_titles' table.
 *      ~  Check if the job title is editable and not associated with any placements.
 * - Run the validation rules.
 *   + If validation is successful:
 *     ~ Create a condition based on the provided 'id'(request params).
 *     ~ Delete the specified job title details in the collection.
 *   + Else:
 *     ~ Add an error message to the response.
 * - Log the response.
 * - Return the response with status codes, indicating the outcome of the deletion.
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
  logRequest('info', req, 'Delete Job Title request');
  /* Log Request */

  /* Default Variable */
  let responseData = [];
  /* Default Variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.jobTitle.IdRequired)
      .isInt().withMessage(responseMessages.configurations.jobTitle.IdInvalid)
      .custom(async (value) => {
        const jobTitle = await indexServices.find('job_titles', ['id', 'is_editable', 'name'], { id: value });
        const jobTitleData = jobTitle.status;
        if (!jobTitleData) {
          return Promise.reject(responseMessages.configurations.jobTitle.IdNotExists);
        }
        if (!jobTitle.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.department.notAllowToModify);
        }
        req.body.name = jobTitle.data[0].name
      })
      .custom(async (value) => {
        const jobTitle = await indexServices.count('placements', { job_title_id: value }, [], true);
        if (Number(jobTitle.data) != 0) {
          return Promise.reject("job title is mapped for" + " " + jobTitle.data + " " + "placements");
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
       * + Delete  jobTitle details in the collection.
       * If Validation Fails
       * + Return the error message.
      */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    await jobTitleService.destroy(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.deletedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'job Title delete Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});



module.exports = { destroy, dropdown, index, listing, store, update, updateStatus };
