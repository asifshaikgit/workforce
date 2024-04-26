const { check, validationResult } = require('express-validator');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { logRequest, logResponse } = require('../../../../../utils/log');
const { responseHandler } = require('../../../../responseHandler');
const { tryCatch } = require('../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const notificationSettingsServices = require('../../services/configurations/notificationSettingsServices');
const indexServices = require('../../services/index');
const { regexPatterns } = require('../../../../../constants/regexPatterns')
const format = require('../../../../../helpers/format')
const moment = require('moment')
const { pagination } = require('../../../../../config/pagination');


/**
 * Notification Settings update request to update notification data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ update the details in 'notification_settings' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + notification array where it contains objects of id and group_id
 *     - id(params) is mandatory, it should be a integer and checked for its existence in 'notification_settings' table.
 *     - group_id(body) is mandatory, it should be a integer and checked for its existence in 'groups' table.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Call the service function(update) to update the data and send request body.
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
 * @throws {InvalidRequestError} If there are validation errors or if the update fails.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'notification update request');
  /* Log Request */

  /* Default variables */
  let responseData = [];
  /* Default variables */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('id')
      .notEmpty()
      .withMessage(responseMessages.configurations.notificationSettings.IdRequired)
      .isInt()
      .withMessage(responseMessages.configurations.notificationSettings.IdInvalid)
      .custom((value) => {
        return indexServices.find('notification_settings', ['id'], { id: value }, null, [], 0, 'id', 'desc', false).then((notificationData) => {
          if (!notificationData.status) {
            return Promise.reject(responseMessages.configurations.notificationSettings.IdDoesnotExist);
          }
        });
      }),
    check('assignee_employee_ids.*.employee_id')
      .custom(async (employeeId) => {
        var pattern = regexPatterns.uuidRegex;
        if (!pattern.test(employeeId)) {
          return Promise.reject(responseMessages.employee.employeeIdIsInvalid);
        }

        const employee = await indexServices.find('employee', ['id'], { id: employeeId });
        if (!employee.status) {
          return Promise.reject(responseMessages.employee.employeeIdNotExists);
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
 *     - Based on the status in update function response, segregate the response and prepare the response
 * If Validation Fails
 *    + Return the error message.
 */
  if (errors.isEmpty()) {
    const condition = { id: req.body.id };
    const permissions = await notificationSettingsServices.update(req.body, condition);
    if (permissions.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.updatedSuccessfully,
      };
    } else {
      throw new InvalidRequestError(permissions.error, responseCodes.codeUnprocessableEntity);
    }
    /* Log Response */
    logResponse('info', req, responseData, 'notification update response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Notification Settings dropdown request to fetch notification data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'notification_settings' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.

 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to fetch the notification information.
 *    ~ Call the service function(find) to fetch the data.
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
  logRequest('info', req, 'Getting notification settings dropdown request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];

  const requestId = req.query.request_id;
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    /* Writing validation rules to the input request */
    const NotificationData = await indexServices.find('notification_settings', ['id', 'name as value', 'slug', 'employee_ids'], null, null, [], 0, 'id', 'desc', false);
    if (!NotificationData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: NotificationData.message, error: NotificationData.error, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: NotificationData.data };
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse('info', req, responseData, 'Getting notification settings Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Notification update request to update notification data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ update the details in 'notifications' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + id(params) is mandatory and it should be a integer
 *  - Run the validation rules
 *    + If validation success
 *    ~ Call the service function(update) to update the data and send request body.
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
 * @throws {InvalidRequestError} If the request body is invalid or missing required fields.
 */
const updateRead = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'changing notification read status request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];

  const requestId = req.body.request_id;
  const notificationId = req.params.id;
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    const pattern = regexPatterns.uuidRegex;
    if (pattern.test(notificationId)) {
      /* Writing validation rules to the input request */
      const condition = { id: notificationId };
      await notificationSettingsServices.updateRead(condition);

      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success };

      /* Writing validation rules to the input request */

      /* Log Response */
      logResponse('info', req, responseData, 'Getting notification settings Response');
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData);
      /* Return the response */
    } else {
      throw new InvalidRequestError(responseMessages.configurations.notificationSettings.IdInvalid);
    }
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Templates index request to fetch templates data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'notification_settings' table and 'template_parameters' and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + module_slug(query) is mandatory, it should be a string and should exist in 'notification_settings' table.
 *   
 *  - Run the validation rules
 *    + If validation success
 *     ~ Define condition object to fetch the templates information.
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
 * @returns None
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'get notification settings index Request')
  /* Log Request */

  /* Default Variable */
  var responseData = ''
  /* Default Variable */

  /* Writing validation rules to the input request */
  var validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('module_slug')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.template.requiredSlug)
      .custom(async value => {
        const moduleSlugData = await indexServices.find('notification_settings', ['id'], { slug: value }, 1, [], null, 'id', 'desc')
        var status = moduleSlugData.status
        if (!status) {
          return Promise.reject(responseMessages.template.invalidSlug)
        }
      }),
  ]
  /* Writing validation conditions to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  /**
   * If validation is success
   * +  employee  details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    var condition = { slug: req.query.module_slug } // condition
    var paramData = await notificationSettingsServices.index(condition)
    if (paramData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: paramData.data
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: responseMessages.common.noRecordFound
      }
    }

    /* Log Response */
    logResponse('info', req, responseData, 'get notification settings index Response')
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
}
);

/**
 * Listings request to fetch notification data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Fetch the data from 'notifications' table based on the provided date range.
 *      ~ Add Success to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic: 
 *  - Logging incoming request.
 *  - Convert request date formats to proper date format.
 *  - Define the validation rules.
 *    + 'request_id' is mandatory.
 *    + 'from_date' is mandatory and should be a valid date.
 *    + 'to_date' is mandatory and should be a valid date.
 *  - Run the validation rules.
 *    + If validation success
 *      ~ Define condition object to fetch notification information.
 *      ~ Call the service function to fetch the data and send the condition along with pagination parameters.
 *      ~ Add the service function return data to response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Logging the response.
 *  - Return response using responseHandler().
 *        
 * Notes:
 *    - Handling exception using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Object} responseData - The response data
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */

const listing = tryCatch(async (req, res) => {

  let dateFormat = await format.getDateFormat(); // date format

  // // Convert all request date formts to proper date format
  let modified_date1 = moment(req.body.from_date, dateFormat).format('YYYY-MM-DD')
  req.body.from_date = modified_date1

  let modified_date2 = moment(req.body.to_date, dateFormat).format('YYYY-MM-DD')
  req.body.to_date = modified_date2

  /* Log Request */
  logRequest('info', req, 'get notification listing Request')
  /* Log Request */

  /* Default Variable */
  var responseData
  let limit = (req.body.limit) ? (req.body.limit) : pagination.limit;
  let page = (req.body.page) ? (req.body.page) : pagination.page;
  /* Default Variable */

  /* Writing validation rules to the input request */
  var validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('from_date')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.timesheet.fromToDateRequired)
      .custom(async (value) => {
        let isDate = new Date(value);
        // Invalid date
        if (isNaN(isDate.getTime())) {
          return Promise.reject(responseMessages.timesheet.fromDateInvalid);
        }
      }),
    check('to_date')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.timesheet.fromToDateRequired)
      .custom(async (value) => {
        let isDate = new Date(value);
        // Invalid date
        if (isNaN(isDate.getTime())) {
          return Promise.reject(responseMessages.timesheet.toDateInvalid);
        }
      }),
  ]
  /* Writing validation conditions to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  /**
   * If validation is success
   * +  employee  details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    var condition = { employee_id: req.body.loginUserId, date_between: [{ column: 'notifications.created_at', date1: req.body.from_date, date2: req.body.to_date }]} // condition
    var notificationData = await notificationSettingsServices.listing(condition, page, limit)
    if (notificationData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: notificationData.data,
        pagination: notificationData.pagination
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        pagination: notificationData.pagination,
        data: notificationData.data
      }
    }

    /* Log Response */
    logResponse('info', req, responseData, 'get notification settings index Response')
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
})

module.exports = { update, dropdown, updateRead, index, listing };
