const { check, validationResult } = require('express-validator');
const { logRequest, logResponse } = require('../../../../../utils/log');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { responseHandler } = require('../../../../responseHandler');
const { tryCatch } = require('../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const payrollConfigurationServices = require('../../services/configurations/payrollConfigurationServices');
const indexServices = require('../../services/index');

/**
 * Payroll Configuration dropdown request to fetch payroll data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'payroll' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + pay_config_setting_id(query) is not mandatory, it should be a integer and should be existed in 'payroll_configuration' table.

 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to fetch the payroll information.
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
  logRequest('info', req, 'Drop Down Payroll request');
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
    check('pay_config_setting_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.payConfigSettingIdRequired)
      .isInt()
      .withMessage(responseMessages.configurations.payrollConfigurations.payConfigSettingIdInvalid)
      .custom((value) => {
        return indexServices.find('payroll_configuration', ['id'], { pay_config_setting_id: value }).then((configData) => {
          const configStatus = configData.status;
          if (!configStatus) {
            return Promise.reject(responseMessages.configurations.payrollConfigurations.payConfigSettingIdNotExist);
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
     *
     *  Based on the status in create function response, segregate the response and prepare the response
     *
     * If Validation Fails
     *    + Return the error message.
     */
  if (errors.isEmpty()) {
    const condition = { pay_config_setting_id: req.query.pay_config_setting_id, status: 'Yet to generate' };
    const payrollConfigData = await payrollConfigurationServices.dropdown(condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.success,
      data: payrollConfigData.data,
    };
    /* Log Response */
    logResponse('info', req, responseData, 'Drop down Payroll response');
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

module.exports = { dropdown };
