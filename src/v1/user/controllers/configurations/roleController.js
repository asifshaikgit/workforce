const { check, validationResult } = require('express-validator');
const { tryCatch } = require('../../../../../utils/tryCatch');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const roleServices = require('../../services/configurations/roleServices');
const { logRequest, logResponse } = require('../../../../../utils/log');
const { responseHandler } = require('../../../../responseHandler');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const { pagination } = require('../../../../../config/pagination');
const indexServices = require('../../services/index');
const { regexPatterns } = require('../../../../../constants/regexPatterns')


/**
 * Delete a role entity from the collection.
 * 
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Delete the role details.
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
 *    + 'id' (Request params) is mandatory, should be an integer, and must exist in the 'roles' table as an editable item.
 *      ~ Check if the role is mapped to 'employee' records.
 *      ~ Retrieve the role name from the database for further reference.
 *  - Run the validation rules.
 *    + If validation is successful:
 *      ~ Create a condition object based on id (req.params.id).
 *      ~ Call the service function (destroy) to remove the role details.
 *      ~ Prepare the response with success and a deletion message.
 *    + If validation fails:
 *      ~ Return an error message with a status code.
 *  - Log the response.
 *  - Return the response using responseHandler().
 * 
 * Notes:
 *  - Exception handling using try-catch.
 *      
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const destroy = tryCatch(async (req, res) => {
  /* Log Response */
  logRequest('info', req, 'Role delete request');
  /* Log Response */

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
      .withMessage(responseMessages.role.roleIdRequired)
      .isInt().withMessage(responseMessages.role.IdInvalid)
      .custom(async (value) => {
        const role = await indexServices.find('roles', ['id', 'name'], { id: value });
        if (!role.status) {
          return Promise.reject(responseMessages.role.invalidRoleId);
        }
        req.body.name = role.data[0].name
      })
      .custom(async (value) => {
        const role = await indexServices.count('employee', { role_id: value }, [], true);
        if (Number(role.data) != 0) {
          return Promise.reject("role is mapped for" + " " + role.data + " " + "employee");
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
   * + Delete role details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id }; // condition
    const permissions = await roleServices.destroy(req.body, condition);
    if (permissions.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.deletedSuccessfully,
      };
    } else {
      throw new InvalidRequestError(
        permissions.error,
        responseCodes.codeUnprocessableEntity,
      );
    }
    /* Log Response */
    logResponse('info', req, responseData, 'Role delete response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Fetch role permissions for a specific role.
 * 
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the roleServices.fethRolePermissions function to retrieve role permissions.
 *      ~ Add the role permissions to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set a default variable 'responseData'.
 *  - Define validation rules for the input request:
 *    + 'request_id' (Request query) is mandatory.
 *    + 'id' (Request query) is mandatory, should be an integer, and must exist in the 'roles' table as an active role.
 *  - Run the validation rules.
 *    + If validation is successful:
 *      ~ Create a condition object based on id (req.query.id).
 *      ~ Call the service function (fethRolePermissions) to retrieve role permissions for the specified role.
 *      ~ If data exists:
 *        - Prepare the response with the fetched data.
 *      ~ Else:
 *         - Prepare the response with the empty data.
 *    + If validation fails:
 *      ~ Return an error message with a status code.
 *  - Log the response.
 *  - Return the response using responseHandler().
 * 
 * Notes:
 *  - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const fetchRolePermissions = tryCatch(async (req, res) => {

  /* Log Request */
  logRequest('info', req, 'Role permissions request');
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
      .withMessage(responseMessages.role.roleIdRequired)
      .isInt().withMessage(responseMessages.role.IdInvalid)
      .custom(async (value) => {
        const role = await indexServices.find('roles', ['id'], { id: value, is_active: true });
        if (!role.status) {
          return Promise.reject(responseMessages.role.invalidRoleId);
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
   * + fetch role details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    const condition = { id: req.query.id }
    const permissions = await roleServices.fethRolePermissions(condition);
    if (permissions.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: permissions.data,
      };
    } else {
      throw new InvalidRequestError(permissions.error, responseCodes.codeUnprocessableEntity);
    }
    /* Log Response */
    logResponse('info', req, responseData, 'Role permissions response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Retrieve a list of role permissions based on a specific role identifier.
 * 
 * Overview of API:
 *  - Validate the request by checking the presence of a request ID.
 *    + If successful
 *      ~ Call the service function to retrieve a list of role permissions based on the provided 'id'.
 *      ~ Prepare the response with the fetched data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set a default variable for the response data.
 *  - Define validation rules for the input request:
 *    + 'request_id' (Request query) is mandatory.
 *    + 'id' (Request query) is mandatory, should be an integer, and must exist in the 'roles' table.
 *  - Run the validation rules.
 *    + If validation is successful:
 *      ~ Create a condition object based on 'req.query.id'.
 *      ~ Call the 'roleServices.index' function to retrieve a list of role permissions.
 *      ~ If data exists:
 *        - Prepare the response with the fetched data.
 *      ~ Else:
 *         - Throw an 'InvalidRequestError' with an error message.
 *      ~ Logging the response.
 *      ~ Return the response using responseHandler().
 *    + If validation fails:
 *      ~ Throw an 'InvalidRequestError' with an appropriate message.
 * 
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const index = tryCatch(async (req, res) => {

  /* Log Request */
  logRequest('info', req, 'Role permissions request');
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
      .withMessage(responseMessages.role.roleIdRequired)
      .isInt().withMessage(responseMessages.role.IdInvalid)
      .custom(async (value) => {
        const role = await indexServices.find('roles', ['id'], { id: value });
        if (!role.status) {
          return Promise.reject(responseMessages.role.invalidRoleId);
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
 * + Call the service function
 * If Validation Fails
 * + Return the error message.
 */
  if (errors.isEmpty()) {
    const condition = { id: req.query.id }
    const permissions = await roleServices.index(condition);
    if (permissions.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: permissions.data,
      };
    } else {
      throw new InvalidRequestError(
        permissions.error,
        responseCodes.codeUnprocessableEntity,
      );
    }
    /* Log Response */
    logResponse('info', req, responseData, 'Role permissions response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Retrieve a paginated list of role details based on the provided search criteria.
 * 
 * Overview of API:
 *  - Validate the request, ensuring the presence of a request ID.
 *    + If successful
 *      ~ Call the service function to fetch role data.
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
 *    + Call the 'listing' function from the Role service and fetch the data from 'roles' table based on the provided condition.
 *    + If data exists:
 *      ~ Prepare a response with the fetched data, pagination details, and activity logs.
 *    + Else :
 *      ~ Prepare a response with the error message and empty data, pagination details, and activity logs.
 *  - Else:
 *    + Return an error message indicating the request ID is required.
 * Notes:
 *  - Exception handling using try-catch.
 * 
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If a valid request ID is not provided.
 */
const listing = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting role list Details request');
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
    const condition = { search }
    const expenseData = await roleServices.listing(condition, page, limit);
    if (!expenseData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: expenseData.message, error: expenseData.error, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: expenseData.data, pagination: expenseData.pagination_data, activity: expenseData.activity };
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Getting role list Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Create a new role.
 * 
 * Overview of API:
 *   - Validate the request.
 *     + If successful
 *       ~ Call the roleServices.store function to create a new role.
 *       ~ Add a success message and role data to the response.
 *     + Else
 *       ~ Add error validation to the response.
 *   - Return the response.
 * 
 * Logic:
 *   - Log incoming request.
 *   - Define the validation rules as follows:
 *     + 'request_id' (body) is mandatory.
 *     + 'role_name' (body) is mandatory, should not contain special characters
 *        ~ Check if name already exists in 'roles' table.
 *   - Run the validation rules.
 *   - If validation is successful:
 *     + Call the roleServices.store function to create a new role.
 *     + Add a success message and role data to the response.
 *   - Else:
 *     + Add error validation to the response.
 *   - Prepare the response with status codes.
 *   - Log the response.
 *   - Return the response using responseHandler().
 * 
 * Notes:
 *   - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const store = tryCatch(async (req, res) => {

  /* Log Request */
  logRequest('info', req, 'Role create request');
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
    check('role_name')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.role.roleNameRequired)
      .not().matches(regexPatterns.specialCharactersRegex)
      .withMessage(responseMessages.role.invalidName)
      .custom(async (value) => {
        const role = await indexServices.find('roles', ['id'], { name: value });
        if (role.status && value !== '') {
          return Promise.reject(responseMessages.role.roleNameExists);
        }

        const rolesAvailable = await indexServices.find('roles', ['id'], { is_editable: true });
        if (rolesAvailable.status && rolesAvailable.data.length >= 5) {
          return Promise.reject(responseMessages.role.rolesLimitExceeded);
        }
      }),
    check('description')
      .custom(value => {
        if (value !== '' && value !== null) {
          if (value.length > 100) {
            return Promise.reject(responseMessages.role.roleDescriptionInvalid);
          }
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
 * + Call the service function
 * If Validation Fails
 * + Return the error message.
 */
  if (errors.isEmpty()) {
    const permissions = await roleServices.store(req.body);
    if (permissions.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.addedSuccessfully,
        // data: permissions.data,
      };
    } else {
      throw new InvalidRequestError(permissions.error, responseCodes.codeUnprocessableEntity);
    }
    /* Log Response */
    logResponse('info', req, responseData, 'Role create response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Updates a role based on the request data.
 * 
 * Overview of API:
 *   - Validate the request.
 *     + If successful
 *       ~ Call the roleServices.update function to update a role entity.
 *       ~ Add a success message and role data to the response.
 *     + Else
 *       ~ Add error validation to the response.
 *   - Return the response.
 * 
 * Logic:
 *   - Log incoming request.
 *   - Define the validation rules as follows:
 *     + 'request_id' (body) is mandatory.
 *     + 'id' (params) is mandatory, should be an integer, and must exist in the 'roles' table.
 *     + 'role_name' (body) is mandatory, should not contain special characters
 *        ~ Check 'role_name'  must be unique within the 'roles' table while excluding the current role id. 
 *   - Run the validation rules.
 *   - If validation is successful:
 *     + Create a condition object based on id (req.params.id).
 *     + Call the roleServices.update function to update the role entity.
 *     + Add a success message and role data to the response.
 *   - Else:
 *     + Add error validation to the response.
 *   - Prepare the response with status codes.
 *   - Log the response.
 *   - Return the response using responseHandler().
 * 
 * Notes:
 *   - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {

  /* Log Request */
  logRequest('info', req, 'Role update request');
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
      .withMessage(responseMessages.role.roleIdRequired)
      .isInt().withMessage(responseMessages.role.IdInvalid)
      .custom(async (value) => {
        return indexServices.find('roles', ['id', 'name as Name', 'description as Description', 'is_editable'], { id: value }).then((role) => {
          const rolesData = role.status;
          if (!rolesData) {
            return Promise.reject(responseMessages.role.IdNotExists);
          }
          req.body.roleInfo = role?.data[0];
          //if (!role.data[0].is_editable) {
          //  return Promise.reject(responseMessages.role.editNotAllowed);
          //}
        })
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
    check('role_name')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.role.roleNameRequired)
      .not().matches(regexPatterns.specialCharactersRegex)
      .withMessage(responseMessages.role.invalidName)
      .custom(async (value) => {
        const role = await indexServices.find('roles', ['id'], { name: value });
        if (role.status && value !== '') {
          if (role.data[0].id !== Number(req.params.id)) {
            return Promise.reject(responseMessages.role.roleNameExists);
          }
        }
        const rolesAvailable = await indexServices.find('roles', ['id'], { is_editable: true, global_search: `id != '${req.params.id}'` });
        if (rolesAvailable.status && rolesAvailable.data.length >= 5) {
          return Promise.reject(responseMessages.role.rolesLimitExceeded);
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
 * + Call the service function
 * If Validation Fails
 * + Return the error message.
 */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    const permissions = await roleServices.update(req.body, condition);
    if (permissions.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.updatedSuccessfully,
        data: permissions.data,
      };
    } else {
      throw new InvalidRequestError(
        permissions.error,
        responseCodes.codeUnprocessableEntity,
      );
    }
    /* Log Response */
    logResponse('info', req, responseData, 'Role update response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Update the status of a role entity.
 * 
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Call the `roleServices.updateStatus` function to update the status of a role entity.
 *     ~ Add a success message to the response.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log incoming request.
 * - Define the validation rules as follows:
 *   + 'request_id' (body) is mandatory.
 *   + 'id' (params) is mandatory, should be an integer, and must exist in the 'roles' table.
 *   + 'is_active' (body) is mandatory, should be a valid boolean.
 *     ~ If it is false:
 *       - Check if the role is mapped to 'employee' table based on 'role_id' (params.id).
 * - Run the validation rules.
 * - If validation is successful:
 *   + Create a condition object based on id (req.params.id).
 *   + Call the `roleServices.updateStatus` function to update the status of a role entity.
 *   + Add a success message to the response.
 * - Else:
 *   + Add error validation to the response.
 * - Prepare the response with appropriate status codes.
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
      .notEmpty()
      .withMessage(responseMessages.role.roleIdRequired)
      .isInt().withMessage(responseMessages.role.IdInvalid)
      .custom(async (value) => {
        const data = await indexServices.find('roles', ['id'], { id: value });
        const rolesData = data.status;
        if (!rolesData) {
          return Promise.reject(responseMessages.role.IdNotExists);
        }
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.role.statusRequired)
      .isBoolean()
      .withMessage(responseMessages.role.statusInvalid)
      .custom(async (value) => {
        if (value == 'false' || Number(value) == 0) {
          const role = await indexServices.count('employee', { role_id: req.params.id }, [], true);
          if (Number(role.data) != 0) {
            return Promise.reject("role is mapped for" + " " + role.data + " " + "employee");
          }
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
     * + Call the service function
     * If Validation Fails
     * + Return the error message.
     */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    await roleServices.updateStatus(req.body, condition);
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
 * Retrieve a list of role details for use in a dropdown or selection.
 * 
 * Overview of API:
 *  - Validate the request by checking the presence of a request ID.
 *    + If successful
 *      ~ Call the service function to retrieve a list of role details based on the search criteria.
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
 *    + Check for a search query parameter;
 *      ~ if not provided, use an empty string.
 *    + Call the indexRepository 'find' function to retrieve a list of role details from the 'roles' table.
 *    + If data exists:
 *      ~ Prepare the response with the fetched data.
 *    + Else:
 *      ~ Prepare the response with the empty data.
 *    + Logging the response.
 *    + Return the response using responseHandler().  
 *  - Else:
 *    - Throw an 'InvalidRequestError' with an appropriate message.
 * 
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there is no request ID provided in the request.
 */
const dropdown = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting roles dropdown request.');
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
    const roleData = await indexServices.find('roles', ['id', 'name as value'], condition, 0);
    if (!roleData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: roleData.message, error: roleData.error, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: roleData.data };
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse('info', req, responseData, 'Getting roles dropdown Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

module.exports = { index, store, fetchRolePermissions, update, destroy, listing, updateStatus, dropdown };
