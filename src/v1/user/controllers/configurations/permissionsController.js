const { check, validationResult } = require('express-validator');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { logRequest, logResponse } = require('../../../../../utils/log');
const { responseHandler } = require('../../../../responseHandler');
const { tryCatch } = require('../../../../../utils/tryCatch');
const InvalidRequestException = require('../../../../../error/InvalidRequestError');
const permissionsServices = require('../../services/configurations/permissionsServices');

/**
 * Employee Category index request to fetch Category data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'employee_categories' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + id(query) is mandatory, it should be a integer and should be available in 'employee_categories' table.
 *   
 *  - Run the validation rules
 *    + If validation success
 *     ~ Define condition object to fetch the category information.
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
 * @throws {InvalidRequestException} If there are validation errors or if the permissions retrieval fails.
 */
const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Fetch permissions request');
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
     *    - Based on the status in update function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Throws an InvalidRequestError with the error message.
    */
  if (errors.isEmpty()) {
    const permissions = await permissionsServices.index();
    if (permissions.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: permissions.data,
      };
    } else {
      throw new InvalidRequestException(
        permissions.error,
        responseCodes.codeUnprocessableEntity,
      );
    }
    /* Log Response */
    logResponse('info', req, responseData, 'Fetch permissions response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestException(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = { index };
