const timesheetConfigurationService = require('../../../services/configurations/timesheet/timesheetConfigurationsService');
const indexServices = require('../../../services/index');
const { check, validationResult } = require('express-validator');
const { logRequest, logResponse } = require('../../../../../../utils/log');
const { responseMessages } = require('../../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../../constants/responseCodes');
const { responseHandler } = require('../../../../../responseHandler');
const { tryCatch } = require('../../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../../error/InvalidRequestError');

/**
 * Timesheet Configuration Store request to store timesheet configuration data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Store the details in 'timesheet_configurations' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + cycle_id(body) is mandatory, it should be a integer and checked for its existence in 'cycles' table.
 *    + is_global(body) is mandatory, it should be a boolean and if it is true and need to check if a value exists in 'timesheet_configurations' as true or not  .
 *    + ts_mandatory(body) is mandatory and should be a boolean.
 *    + day_start_id(body) is mandatory if cycle_id is 1 or 2, it should be a integer and its existence is checked in 'days' table.
 *    + default_hours(body) is mandatory, it should be in time format(HH:MM:ss).
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
  logRequest('info', req, 'New Timesheet Configuration request');
  /* Log Request */

  /* Default Variable */
  let responseData = [];
  /* Default Variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('cycle_id').trim().escape().notEmpty().withMessage(responseMessages.configurations.timesheetConfiguration.cycleIdRequired)
      .custom((value) => {
        return indexServices.find('cycles', ['id'], { id: value }).then((cycleData) => {
          if (!cycleData.status) {
            return Promise.reject(responseMessages.configurations.timesheetConfiguration.invalidCycleId);
          }
        });
      }),
    check('is_global').trim().escape().notEmpty().withMessage(responseMessages.configurations.timesheetConfiguration.globalRequired)
      .isBoolean().withMessage(responseMessages.configurations.timesheetConfiguration.globalInvalid)
      .custom((value) => {
        if (value === 'true') {
          return indexServices.find('timesheet_configurations', ['id'], { is_global: true }).then((timesheetData) => {
            if (timesheetData.status) {
              return Promise.reject(responseMessages.configurations.timesheetConfiguration.globalAlreadyExist);
            }
          });
        }
        return true;
      }),
    check('ts_mandatory').trim().escape().notEmpty().withMessage(responseMessages.configurations.timesheetConfiguration.timesheetRequired)
      .isBoolean().withMessage(responseMessages.configurations.timesheetConfiguration.timesheetInvalid),
    check('day_start_id').trim().escape()
      .custom((value) => {
        if (req.body.cycle_id === 1 || req.body.cycle_id === 2) {
          if (value === '' || value === null) {
            return Promise.reject(responseMessages.configurations.timesheetConfiguration.startDayRequired);
          }
        }
        if (req.body.cycle_id === 1 || req.body.cycle_id === 2) {
          return indexServices.find('days', ['id'], { id: value }).then((daysData) => {
            if (!daysData.status) {
              return Promise.reject(responseMessages.configurations.timesheetConfiguration.invalidDayId);
            }
          });
        }
        return true;
      }),
    check('default_hours').notEmpty().trim().withMessage(responseMessages.configurations.timesheetConfiguration.defaultHourRequired)
      .isTime().withMessage(responseMessages.configurations.timesheetConfiguration.defaultHourInvalid),
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
   * + Delete  self service types in the collection.
   * If Validation Fails
   * + Return the error message.
  */
  if (errors.isEmpty()) {
    await timesheetConfigurationService.store(req.body);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'Timesheet Configuration response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Timesheet Configuration index request to fetch timesheet configuration data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'timesheet_configurations' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + id(query) is mandatory, it should be a integer and should be available in 'timesheet_configurations' table.
 *   
 *  - Run the validation rules
 *    + If validation success
 *     ~ Define condition object to fetch the timesheet configuration information.
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
  logRequest('info', req, 'getting single Timesheet Configuaration request');
  /* Log Request */

  /* Default Variable */
  let responseData = [];
  const requestId = req.query.request_id;
  /* Default Variable */

  if (requestId !== undefined && requestId !== '') {
    const condition = { is_global: true };
    const timesheetData = await timesheetConfigurationService.index(condition);
    if (!timesheetData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.configurations.timesheetConfiguration.timesheetGlobalApprovalNotExists, error: timesheetData.error, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: timesheetData.data };
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse('info', req, responseData, 'Timesheet Setting index Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Timesheet Configuration update request to update timesheet configuration data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ update the details in 'timesheet_configurations' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + id(params) is mandatory, it should be a integer and checked for its existence in 'timesheet_configurations' table.
 *    + cycle_id(body) is mandatory, it should be a integer and checked for its existence in 'cycles' table.
 *    + is_global(body) is mandatory, it should be a boolean and if it is true and need to check if a value exists in 'timesheet_configurations' as true or not  .
 *    + ts_mandatory(body) is mandatory and should be a boolean.
 *    + day_start_id(body) is mandatory if cycle_id is 1 or 2, it should be a integer and its existence is checked in 'days' table.
 *    + default_hours(body) is mandatory, it should be in time format(HH:MM:ss).
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the timesheet configuration information.
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
 * @throws {InvalidRequestError} - If there are validation errors in the request data.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update Timesheet Configuration request.');
  /* Log Request */

  /* Default Variable */
  let responseData = [];
  /* Default Variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.timesheetConfiguration.IdRequired)
      .isInt().withMessage(responseMessages.configurations.timesheetConfiguration.IdInvalid)
      .custom((value) => {
        return indexServices.find('timesheet_configurations', ['id'], { id: value }).then((timesheetData) => {
          if (!timesheetData.status) {
            return Promise.reject(responseMessages.configurations.timesheetConfiguration.IdNotExists);
          }
        });
      }),
    check('cycle_id').trim().escape().notEmpty().withMessage(responseMessages.configurations.timesheetConfiguration.cycleIdRequired)
      .custom((value) => {
        return indexServices.find('cycles', ['id'], { id: value }).then((cycleData) => {
          if (!cycleData.status) {
            return Promise.reject(responseMessages.configurations.timesheetConfiguration.invalidCycleId);
          }
        });
      }),
    check('is_global').trim().escape().notEmpty().withMessage(responseMessages.configurations.timesheetConfiguration.globalRequired)
      .isBoolean().withMessage(responseMessages.configurations.timesheetConfiguration.globalInvalid)
      .custom((value) => {
        if (value === 'true') {
          return indexServices.find('timesheet_configurations', ['id'], { is_global: true, id: req.params.id }).then((timesheetData) => {
            if (!timesheetData.status) {
              return Promise.reject(responseMessages.configurations.timesheetConfiguration.globalAlreadyExist);
            }
          });
        }
        return true;
      }),

    check('ts_mandatory').trim().escape().notEmpty().withMessage(responseMessages.configurations.timesheetConfiguration.timesheetRequired)
      .isBoolean().withMessage(responseMessages.configurations.timesheetConfiguration.timesheetInvalid),
    check('day_start_id').trim().escape()
      .custom((value) => {
        if (req.body.cycle_id === 1 || req.body.cycle_id === 2) {
          if (!value) {
            return Promise.reject(responseMessages.configurations.timesheetConfiguration.startDayRequired);
          }
        }
        if (req.body.cycle_id === 1 || req.body.cycle_id === 2) {
          return indexServices.find('days', ['id'], { id: value }).then((daysData) => {
            if (!daysData.status) {
              return Promise.reject(responseMessages.configurations.timesheetConfiguration.invalidDayId);
            }
          });
        }
        return true;
      }),
    check('default_hours').notEmpty().trim().withMessage(responseMessages.configurations.timesheetConfiguration.defaultHourRequired)
      .isTime().withMessage(responseMessages.configurations.timesheetConfiguration.defaultHourInvalid),
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
    await timesheetConfigurationService.update(req.body, null, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'Timesheet Configuration Update response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = { index, store, update };
