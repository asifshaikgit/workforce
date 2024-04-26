const timesheetSettingService = require('../../../services/configurations/timesheet/timesheetSettingsService');
const indexServices = require('../../../services/index');
const { check, validationResult } = require('express-validator');
const { logRequest, logResponse } = require('../../../../../../utils/log');
const { responseMessages } = require('../../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../../constants/responseCodes');
const { responseHandler } = require('../../../../../responseHandler');
const { tryCatch } = require('../../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../../error/InvalidRequestError');

/**
 * Timesheet Settings index request to fetch timesheet setting data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'timesheet_settings' table and return the data
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
 *     ~ Define condition object to fetch the timesheet setting information.
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
 * @throws {InvalidRequestError} - If the request is invalid.
 */
const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting timesheet Settings Index Details request');
  /* Log Request */

  /* Default Variable */
  let responseData = [];
  /* Default Variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
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
*    + Return the all settings
*/
  if (errors.isEmpty()) {
    const invoiceList = await indexServices.find('timesheet_settings', ['id', 'name', 'description', 'is_active'], {});
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: invoiceList.data };

    /* Log Response */
    logResponse('info', req, responseData, 'timesheet settings data response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Timesheet Settings update request to update timesheet setting data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ update the details in 'timesheet_settings' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + id(params) is mandatory, it should be a integer and checked for its existence in 'timesheet_settings' table.
 *    + is_active(body) is mandatory, it should be a boolean.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the timesheet setting information.
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
 * @throws {InvalidRequestError} If there are validation errors in the request data.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update timesheet Settings request.');
  /* Log Request */

  /* Default Variable */
  let responseData = [];
  /* Default Variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.timesheetSettings.timesheetSettingsIdRequired)
      .isInt().withMessage(responseMessages.configurations.timesheetSettings.timesheetSettingsIdInvalid)
      .custom((value) => {
        return indexServices.find('timesheet_settings', ['id'], { id: value }).then((timesheetSettingsData) => {
          const status = timesheetSettingsData.status;
          if (!status) {
            return Promise.reject(responseMessages.configurations.timesheetSettings.IdNotExists);
          }
        });
      }),
    check('is_active').trim().escape().notEmpty().withMessage(responseMessages.configurations.timesheetSettings.statusrequired)
      .isBoolean().withMessage(responseMessages.configurations.timesheetSettings.statusInvalid),
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
    await timesheetSettingService.update(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'timesheet Settings Update Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = { index, update };
