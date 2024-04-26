const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { logRequest, logResponse } = require('../../../../../utils/log');
const indexServices = require('../../services/index');
const { responseHandler } = require('../../../../responseHandler');
const { tryCatch } = require('../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');

/**
 * Cycles dropdown request to fetch cycke data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'cycles' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + exclude_id(query) is not mandatory, it should be a integer .
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to fetch the category information.
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
 * @throws {InvalidRequestError} - If the request ID is missing or empty.
 */
const dropdown = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting cycle dropdown Details request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  const requestId = req.query.request_id;
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    /* Default variable */
    const excludeId = req.query.exclude_id ? req.query.exclude_id : 0;
    /* Default variable */

    /* Writing validation rules to the input request */
    const condition = {global_search: `(id != '${excludeId}')` };
    const cycleData = await indexServices.find('cycles', ['id', 'name as value'], condition, 0);
    if (!cycleData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: cycleData.message,
        error: cycleData.error,
        data: [],
      };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: cycleData.data };
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse('info', req, responseData, 'Getting cycle dropdown Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

module.exports = { dropdown };
