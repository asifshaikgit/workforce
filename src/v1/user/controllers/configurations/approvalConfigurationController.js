const approvalConfigurationService = require('../../services/configurations/approvalConfigurationService');
const indexServices = require('../../services/index');
const { check, validationResult } = require('express-validator');
const { logRequest, logResponse } = require('../../../../../utils/log');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { responseHandler } = require('../../../../responseHandler');
const { tryCatch } = require('../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');

/**
 * Approval Configuration Store request to store approval data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Store the details in 'approval_settings' table  and 'approval_levels' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  + insert the aprroval_module into the body depending on the route
 *  - Define the validation rules as follows
 *   + request_id(body) is mandatory.
 *   + approval_module(body) is mandatory and it should be a 1 or 2 or 3.
 *   + Add approvals array add approver_ids array which has objects add employee_id which is mandatory and should exist in 'employee' table
 *   + In approvals array add rank in objects that is mandatory and should be an integer
 *    + is_global(body) is mandatory and should be a boolean and if it is true we need to check if the value of same configuration exists in 'approval_settings'.
 *  - Run the validation rules
 *    + If validation success
 *    + we take data from approvals in body to check the uniqueness and order of the rank
 *     - for example when we expect employee_id as objects in array of approvers rank should be place for those approvers. they should go as 1, 2, 3, 4 ... and non repetetive
 *     - we throw the error if they repeat the ranks or miss the order of the ranks 
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
 * @throws {InvalidRequestError} If there are validation errors or the rank order is invalid.
 */
const store = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'New Approval Configuration request');
  /* Log Request */

  /* Getting Approval Module from URL */
  const requestSegments = req.path.split('/');
  const approvalModule = requestSegments[2];
  switch (approvalModule) {
    case 'timesheet':
      req.body.approval_module = 1;
      break;
    case 'invoice':
      req.body.approval_module = 2;
      break;
    default:
      req.body.approval_module = null;
      break;
  }
  /* Getting Approval Module from URL */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    // 1 for timesheet and 2 for invoice and 3 for employee self service
    check('approval_module').trim().escape().notEmpty().withMessage(responseMessages.configurations.approvalConfiguration.approvalModuleRequired)
      .isIn([1, 2, 3]).withMessage(responseMessages.configurations.approvalConfiguration.invalidApprovalModule),
    check('approvals.*.approver_ids.*.employee_id').notEmpty().trim().withMessage(responseMessages.configurations.approvalConfiguration.approverIdRequired)
      .custom((value) => {
        return indexServices.find('employee', ['id'], { id: value, status: 'Active', deleted_at: null }).then((userData) => {
          if (!userData.status) {
            return Promise.reject(responseMessages.configurations.approvalConfiguration.IdNotExists);
          }
        });
      }),
    check('approvals.*.rank').notEmpty().trim().withMessage(responseMessages.configurations.approvalConfiguration.rankRequired).isNumeric().withMessage(responseMessages.configurations.approvalConfiguration.rankInvalid),
    check('is_global').trim().escape().notEmpty().withMessage(responseMessages.configurations.approvalConfiguration.globalRequired)
      .isBoolean().withMessage(responseMessages.configurations.approvalConfiguration.globalInvalid)
      .custom((value) => {
        if (value === 'true') {
          return indexServices.find('approval_settings', ['id'], { approval_module: req.body.approval_module, is_global: true }).then((approvalData) => {
            if (approvalData.status) {
              return Promise.reject(responseMessages.configurations.approvalConfiguration.globalAlreadyExist);
            }
          });
        }
        return true;
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
   * + store the approvals in the collection.
   * If Validation Fails
   * + Return the error message.
  */
  if (errors.isEmpty()) {
    const approvalBody = req.body.approvals;

    // Sorts the rank from approval array in ascending order.
    const rankUniqueCheck = [...new Set(approvalBody.map((rankChecking) => rankChecking.rank))].sort();
    let rankOrder = false;
    if (approvalBody.length > 0) {
      /**
       * Checks if the length of the approvalBody array is equal to the length of the rankUniqueCheck array.
       * If they are equal, it sets the rankOrder variable to true and checks if the values in rankUniqueCheck
       * are in ascending order starting from 1. If any value is not in the correct order, it sets rankOrder to false.
       */
      if (approvalBody.length === rankUniqueCheck.length) {
        rankOrder = true;
        let currentRankCheck = 1;
        for (const order in rankUniqueCheck) {
          if (currentRankCheck !== Number(rankUniqueCheck[order])) {
            rankOrder = false;
          }
          currentRankCheck += 1;
        }
      }
    } else {
      throw new InvalidRequestError(responseMessages.configurations.approvalConfiguration.approvalRequired, responseCodes.codeUnprocessableEntity);
    }

    if (rankOrder) {
      req.body.approval_count = approvalBody.length;
      await approvalConfigurationService.store(req.body);
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully };
    } else {
      throw new InvalidRequestError(responseMessages.configurations.approvalConfiguration.rankOrderInvalid, responseCodes.codeUnprocessableEntity);
    }
    /* Log Response */
    logResponse('info', req, responseData, 'Approval Configuration response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Approval Configuration index request to fetch approval data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'approval_settings' table and 'approval_levels' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + insert the aprroval_module into the body depending on the route
 *  - Run the validation rules
 *    + If validation success
 *     ~ Define condition object to fetch the approval information.
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
 * @throws {InvalidRequestError} - If the request ID is missing or empty.
 */
const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'getting single Approval Configuaration request');
  /* Log Request */

  /* Getting Approval Module from URL */
  const requestSegments = req.path.split('/');
  const approvalModule = requestSegments[2];
  switch (approvalModule) {
    case 'timesheet':
      req.body.approval_module = 1;
      break;
    case 'invoice':
      req.body.approval_module = 2;
      break;
    case 'self-service':
      req.body.approval_module = 3;
      break;
    default:
      req.body.approval_module = null;
      break;
  }
  /* Getting Approval Module from URL */

  /* Default variable */
  let responseData = [];
  const requestId = req.query.request_id;
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    const condition = { is_global: true, approval_module: req.body.approval_module };
    const approvalData = await approvalConfigurationService.index(condition);
    if (!approvalData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: approvalData.message, error: approvalData.error, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: approvalData.data };
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse('info', req, responseData, 'Approval Setting index Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Approval Configuration Update request to update approval data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Update the details in 'approval_settings' table, 'approval_users' table  and 'approval_levels' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  + insert the aprroval_module into the body depending on the route
 *  - Define the validation rules as follows
 *   + request_id(body) is mandatory.
 *   + id(params) is mandatory, it should be a integern and should exist in 'approval_settings' table
 *   + approval_module(body) is mandatory and it should be a 1 or 2 or 3.
 *    In approvals array add id in objects that is mandatory and should be an integer and shoul exist in 'approval_levels' table
 *   + In approvals array add rank in objects that is mandatory and should be an integer
 *   + Add approvals array in approver_ids array which has objects add employee_id which is mandatory and should exist in 'employee' table
 *   + Add approvals array in approver_ids array which has objects add which id is mandatory and should exist in 'approval_users' table
 *   + is_global(body) is mandatory and should be a boolean and if it is true we need to check if the value of same configuration exists in 'approval_settings'.
 *   + delete_user_ids(body) in an array is mandatory and should be a integer and should exist in 'approval_users' table.
 *   + delete_approval_level_ids(body) in an array is mandatory and should be a integer and should exist in 'approval_levels' table.
 *  - Run the validation rules
 *    + If validation success
 *    + we take data from approvals in body to check the uniqueness and order of the rank
 *     - for example when we expect employee_id as objects in array of approvers rank should be place for those approvers. they should go as 1, 2, 3, 4 ... and non repetetive
 *     - we throw the error if they repeat the ranks or miss the order of the ranks 
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
 * @throws {InvalidRequestError} If there are validation errors or the rank order is invalid.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update approval Configuration request.');
  /* Log Request */

  /* Getting Approval Module from url */
  const requestSegments = req.path.split('/');
  const approvalModule = requestSegments[2];
  switch (approvalModule) {
    case 'timesheet':
      req.body.approval_module = 1;
      break;
    case 'invoice':
      req.body.approval_module = 2;
      break;
    default:
      req.body.approval_module = null;
      break;
  }
  /* Getting Approval Module from url */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.approvalConfiguration.settingIdRequired)
      .custom((value) => {
        return indexServices.find('approval_settings', ['id'], { id: value, approval_module: req.body.approval_module, is_global: true }).then((approvalData) => {
          if (!approvalData.status) {
            return Promise.reject(responseMessages.configurations.approvalConfiguration.settingIdNotExists);
          }
        });
      }),
    check('approval_module').trim().escape().notEmpty().withMessage(responseMessages.configurations.approvalConfiguration.approvalModuleRequired)
      .isIn([1, 2, 3]).withMessage(responseMessages.configurations.approvalConfiguration.invalidApprovalModule),

    check('approvals.*.id').trim()
      .custom((value) => {
        if (value !== null && value !== '') {
          return indexServices.find('approval_levels', ['id'], { id: value }).then((approvalLevelData) => {
            if (!approvalLevelData.status) {
              return Promise.reject(responseMessages.configurations.approvalConfiguration.levelIdNotExists);
            }
          });
        }
        return true;
      }),
    check('approvals.*.rank').notEmpty().trim().withMessage(responseMessages.configurations.approvalConfiguration.rankRequired).isNumeric().withMessage(responseMessages.configurations.approvalConfiguration.rankInvalid),

    check('approvals.*.approver_ids.*.employee_id').notEmpty().trim().withMessage(responseMessages.configurations.approvalConfiguration.approverIdRequired)
      .custom((value) => {
        return indexServices.find('employee', ['id'], { id: value, status: 'Active', deleted_at: null }).then((userData) => {
          if (!userData.status) {
            return Promise.reject(responseMessages.configurations.approvalConfiguration.IdNotExists);
          }
        });
      }),
    check('approvals.*.approver_ids.*.id')
      .trim()
      .custom((value) => {
        if (value !== null && value !== '') {
          return indexServices.find('approval_users', ['id'], { id: value }).then((approvalUserData) => {
            if (!approvalUserData.status) {
              return Promise.reject(responseMessages.configurations.approvalConfiguration.IdNotExists);
            }
          });
        }
        return true;
      }),
    check('delete_user_ids.*')
      .trim()
      .custom((value) => {
        if (value !== null && value !== '') {
          return indexServices.find('approval_users', ['id'], { id: value, deleted_at: null }).then((approvalUserData) => {
            if (!approvalUserData.status) {
              return Promise.reject(responseMessages.configurations.approvalConfiguration.deleteUserIdNotExists);
            }
          });
        }
        return true;
      }),
    check('is_global').trim().escape().notEmpty().withMessage(responseMessages.configurations.approvalConfiguration.globalRequired)
      .isBoolean().withMessage(responseMessages.configurations.approvalConfiguration.globalInvalid)
      .custom((value) => {
        if (value === 'true') {
          return indexServices.find('approval_settings', ['id'], { approval_module: req.body.approval_module, is_global: true }).then((approvalData) => {
            if (!approvalData.status) {
              return Promise.reject(responseMessages.configurations.approvalConfiguration.globalAlreadyExist);
            }
          });
        }
        return true;
      }),
    check('delete_approval_level_ids.*')
      .trim()
      .custom((value) => {
        if (value !== null && value !== '') {
          return indexServices.find('approval_levels', ['id'], { id: value, deleted_at: null }).then((approvalLevelData) => {
            if (!approvalLevelData.status) {
              return Promise.reject(responseMessages.configurations.approvalConfiguration.levelIdNotExists);
            }
          });
        }
        return true;
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
    const approvalBody = req.body.approvals;

    // Sorts the rank from approval array in ascending order.
    const rankUniqueCheck = [...new Set(approvalBody.map((rankChecking) => rankChecking.rank))].sort();
    let rankOrder = false;
    if (approvalBody.length > 0) {
      /**
       * Checks if the length of the approvalBody array is equal to the length of the rankUniqueCheck array.
       * If they are equal, it sets the rankOrder variable to true and checks if the values in rankUniqueCheck
       * are in ascending order starting from 1. If any value is not in the correct order, it sets rankOrder to false.
       */
      if (approvalBody.length === rankUniqueCheck.length) {
        rankOrder = true;
        let currentRankCheck = 1;
        for (const order in rankUniqueCheck) {
          if (currentRankCheck !== Number(rankUniqueCheck[order])) {
            rankOrder = false;
          }
          currentRankCheck += 1;
        }
      }
    } else {
      throw new InvalidRequestError(responseMessages.configurations.approvalConfiguration.approvalRequired, responseCodes.codeUnprocessableEntity);
    }

    if (rankOrder) {
      req.body.approval_count = approvalBody.length;
      let condition  = { id: req.params.id } // condition (approval_settings id)
      await approvalConfigurationService.update(req.body, null, condition);
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };
    } else {
      throw new InvalidRequestError(responseMessages.configurations.approvalConfiguration.rankOrderInvalid, responseCodes.codeUnprocessableEntity);
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Approval Configuration Update response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = { index, store, update };
