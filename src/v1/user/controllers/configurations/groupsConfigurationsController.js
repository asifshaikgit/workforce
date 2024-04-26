const { check, validationResult } = require('express-validator');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { logRequest, logResponse } = require('../../../../../utils/log');
const { responseHandler } = require('../../../../responseHandler');
const { tryCatch } = require('../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const GroupConfigurationsServices = require('../../services/configurations/groupsConfigurationServices');
const indexServices = require('../../services/index');

/**
 * Retrieve a list of group details for use in a dropdown or selection.
 * 
 * Overview of API:
 *  - Validate the request by checking the presence of a request ID.
 *    + If successful
 *      ~ Call the service function to retrieve a list of group details based on the search criteria.
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
 *    + Call the common 'find' function to retrieve a list of group details from the 'groups' table.
 *    + If data exists:
 *      ~ Prepare the response with the fetched data.
 *    + Else:
 *       ~ Prepare the response with the empty data.
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
  logRequest('info', req, 'Getting group dropdown request.');
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
    const condition = { search };
    const groupData = await indexServices.find('groups', ['id', 'name as value', 'is_active'], condition, 0);
    if (!groupData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: groupData.message, error: groupData.error, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: groupData.data };
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse('info', req, responseData, 'Getting groups dropdown Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Retrieve a list of group details based on a specific identifier.
 * 
 * Overview of API:
 *  - Validate the request by checking the presence of a request ID.
 *    + If successful
 *      ~ Call the service function to retrieve a list of group details based on the provided 'id'.
 *      ~ Prepare the response with the fetched data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set a default variable for the response data.
 *  - Define validation rules for the input request:
 *    + 'request_id' (Request body) is mandatory.
 *    + 'id' (Request body) is mandatory, should be an integer, and must exist in the 'groups' table.
 *  - Run the validation rules.
 *    + If validation is successful:
 *      ~ Create a condition object based on 'req.query.id'.
 *      ~ Call the 'GroupConfigurationsServices.index' function to retrieve a list of group details.
 *      ~ Prepare the response with the fetched data.
 *      ~ Logging the response.
 *      ~ Return the response using responseHandler().
 *    + If validation fails:
 *      ~ Throw an 'InvalidRequestError' with an appropriate message.
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'getting group index request');
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
      .withMessage(responseMessages.configurations.groupsConfigurations.IdRequired)
      .isInt()
      .withMessage(responseMessages.configurations.groupsConfigurations.IdInvalid)
      .custom((value) => {
        return indexServices.find('groups', ['id'], { id: value }).then((groupData) => {
          if (!groupData.status) {
            return Promise.reject(responseMessages.configurations.groupsConfigurations.IdDoesnotExist);
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
    const condition = { 'groups.id': req.query.id, 'notification_group_users.referrable_type' : 1 };
    const netPayTermsData = await GroupConfigurationsServices.index(condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: netPayTermsData.data };

    /* Log Response */
    logResponse('info', req, responseData, 'group index Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Create a new group entity.
 * 
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to create a new group entity.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log incoming request.
 *  - Define the validation rules as follows:
 *    + 'request_id' (body) is mandatory.
 *    + 'name' (body) is mandatory, must be a non-empty string, and check name is already exists in 'groups' table .
 *    + 'is_active' (body) is mandatory, must be a boolean value.
 *    + 'members.*.id' (body) is optional, must be a valid UUID, and should correspond to an existing employee in the 'employee' table.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the service function to create a new group entity.
 *    + Add a success message to the response.
 *  - Else:
 *    + Add error validation to the response.
 *  - Prepare the response with appropriate status codes.
 *  - Log the response.
 *  - Return the response using responseHandler().
 *        
 * Notes:
 *  - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const store = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'New group creation  request');
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
      .withMessage(responseMessages.configurations.groupsConfigurations.nameRequired)
      .isString()
      .withMessage(responseMessages.configurations.groupsConfigurations.nameInvalid)
      .custom(async (value) => {
        const group = await indexServices.find('groups', ['id'], { name: value });
        if (group.status) {
          return Promise.reject(
            responseMessages.configurations.groupsConfigurations.nameExists);
        }
      }),
    check('is_active')
      .notEmpty()
      .withMessage(responseMessages.configurations.groupsConfigurations.statusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.groupsConfigurations.statusInvalid),
    check('members.*.id')
      .trim()
      .optional({ nullable: true })
      .isUUID()
      .withMessage(responseMessages.configurations.groupsConfigurations.memberIdInvalid)
      .custom((value) => {
        return indexServices.find('employee', ['id'], { id: value }).then((employee) => {
          if (!employee.status) {
            return Promise.reject(
              responseMessages.configurations.groupsConfigurations.memberIdDoesNotExists,
            );
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
     *    + Call the createTenant service function
     *        - Based on the status in createTenant function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
     */
  if (errors.isEmpty()) {
    await GroupConfigurationsServices.store(req.body);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.addedSuccessfully,
    };
    /* Log Response */
    logResponse('info', req, responseData, 'New group creation response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Update an existing group entity.
 * 
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to update the group entity.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log incoming request.
 *  - Define the validation rules as follows:
 *    + 'request_id' (body) is mandatory.
 *    + 'id' (params) is mandatory, must be an integer, and must correspond to an existing group in the 'groups' table.
 *    + 'name' (body) is mandatory, must be a non-empty string, and must be unique within the 'groups' table while excluding the current group (by ID).
 *    + 'status' (body) is mandatory, must be a boolean value. 
 *       ~ check if 'status' is 'false' and the group is mapped for 'notification_settings' table.
 *    + 'members.*.id' (body) is optional, must be a valid UUID, and should correspond to an existing employee in the 'employee' table.
 *  - Run the validation rules.
 *  - If validation is successful
 *    + Create a condition object based id(req.params.id):
 *    + Call the service function to update the group entity.
 *    + Add a success message to the response.
 *  - Else:
 *    + Add error validation to the response.
 *  - Prepare the response with appropriate status codes.
 *  - Log the response.
 *  - Return the response using responseHandler().
 *        
 * Notes:
 *  - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update group request.');
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
      .withMessage(responseMessages.configurations.groupsConfigurations.IdRequired)
      .isInt()
      .withMessage(responseMessages.configurations.groupsConfigurations.IdInvalid)
      .custom((value) => {
        return indexServices.find('groups', ['id'], { id: value }).then((group) => {
          if (!group.status) {
            return Promise.reject(responseMessages.configurations.groupsConfigurations.IdDoesnotExist);
          }
        });
      }),
    check('name')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.groupsConfigurations.nameRequired)
      .isString()
      .withMessage(responseMessages.configurations.groupsConfigurations.nameInvalid)
      .custom((value) => {
        return indexServices.find('groups', ['id'], { name: value }).then((group) => {
          if (group.status) {
            if (group.data[0].id !== Number(req.params.id)) {
              return Promise.reject(
                responseMessages.configurations.groupsConfigurations.nameExists,
              );
            }
          }
        });
      }),
    check('is_active')
      .notEmpty()
      .withMessage(responseMessages.configurations.groupsConfigurations.statusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.groupsConfigurations.statusInvalid)
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('notification_settings', { group_id: req.params.id }, [], true).then((groupData) => {
            if (Number(groupData.data) != 0) {
              return Promise.reject("group is mapped for" + " " + groupData.data + " " + "notification settings");
            }
          });
        }
        return true
      }),
    check('members.*.id')
      .trim()
      .optional({ nullable: true })
      .isUUID()
      .withMessage(responseMessages.configurations.groupsConfigurations.memberIdInvalid)
      .custom((value) => {
        return indexServices.find('employee', ['id'], { id: value }).then((employee) => {
          if (!employee.status) {
            return Promise.reject(
              responseMessages.configurations.groupsConfigurations.memberIdDoesNotExists,
            );
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
    const condition = { id: req.params.id };
    await GroupConfigurationsServices.update(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'Update group Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Update the status of a group entity.
 * 
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Call the service function to update the status of a group entity.
 *     ~ Add a success message to the response.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log incoming request.
 * - Define the validation rules as follows:
 *   + 'request_id' (body) is mandatory.
 *   + 'id' (params) is mandatory, should be an integer, and must exist in the 'groups' table.
 *   + 'is_active' (body) is mandatory, should be a valid boolean.
 *     ~ If it is false:
 *       - Check if the group is mapped for 'notification_settings' based on 'group_id' (params.id).
 * - Run the validation rules.
 * - If validation is successful:
 *   + Create a condition object based on id (req.params.id).
 *   + Call the 'GroupConfigurationsServices.updateStatus' function to update the status of a group entity in the 'groups' table based on the condition (defined above).
 *   + Add a success message to the response.
 * - Else:
 *   + Add error validation to the response.
 * - Prepare the response with appropriate status codes.
 * - Log the response.
 * - Return the response using responseHandler().
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
  logRequest('info', req, 'group status update request');
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
      .withMessage(responseMessages.configurations.groupsConfigurations.IdRequired)
      .isInt()
      .withMessage(responseMessages.configurations.groupsConfigurations.IdInvalid)
      .custom((value) => {
        return indexServices.find('groups', ['id'], { id: value }).then((groupData) => {
          if (!groupData.status) {
            return Promise.reject(responseMessages.configurations.groupsConfigurations.IdDoesnotExist);
          }
        });
      }),
    check('is_active')
      .notEmpty()
      .withMessage(responseMessages.configurations.groupsConfigurations.statusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.groupsConfigurations.statusInvalid)
      // .custom((value) => {
      //   if (value == 'false' || Number(value) == 0) {
      //     return indexServices.count('notification_settings', { id: req.params.id }, [], true).then((groupData) => {
      //       if (Number(groupData.data) != 0) {
      //         return Promise.reject("group is mapped for" + " " + groupData.data + " " + "notification settings");
      //       }
      //     });
      //   }
      //   return true
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
       * + Call the service function
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    await GroupConfigurationsServices.updateStatus(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'group status update Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Delete a group entity from the collection.
 * 
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Delete the group details.
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
 *    + 'id' (Request params) is mandatory, should be an integer, and must exist in the 'groups' table as an editable item.
 *      ~ Check if the group is mapped to 'notification_settings'.
 *  - Run the validation rules.
 *    + If validation is successful:
 *      ~ Call the service function (destroy) to remove the group details.
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
  /* Log Request */
  logRequest('info', req, 'Delete group request');
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
      .withMessage(responseMessages.configurations.groupsConfigurations.IdRequired)
      .isInt()
      .withMessage(responseMessages.configurations.groupsConfigurations.IdInvalid)
      .custom((value) => {
        return indexServices.find('groups', ['id'], { id: value }).then((groupData) => {
          if (!groupData.status) {
            return Promise.reject(responseMessages.configurations.groupsConfigurations.IdDoesnotExist);
          }
        });
      })
      
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
     * + Delete  netPayTerms details in the collection.
     * If Validation Fails
     * + Return the error message.
     */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    await GroupConfigurationsServices.destroy(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.deletedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'group delete Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = { destroy, dropdown, index, store, update, updateStatus };
