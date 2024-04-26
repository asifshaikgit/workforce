const invoiceSettingsservice = require('../../../services/configurations/invoice/invoiceSettingsService');
const indexServices = require('../../../services/index');
const { check, validationResult } = require('express-validator');
const { logRequest, logResponse } = require('../../../../../../utils/log');
const { responseMessages } = require('../../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../../constants/responseCodes');
const { responseHandler } = require('../../../../../responseHandler');
const { tryCatch } = require('../../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../../error/InvalidRequestError');

/**
 * Retrieve the details of an invoice settings by its ID.
 * 
 * Overview of API:
 *  - Validate the request, ensuring the presence of a request ID and a valid 'id'.
 *    + If successful
 *      ~ Call the global service function to fetch invoice tax details by ID.
 *      ~ Prepare the response with the fetched data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set a default variable for the response data.
 *  - Define the validation rules as follows:
 *    + 'request_id' is mandatory.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the 'find' function from the global index to fetch the invoice settings details.
 *    + Prepare a response with the fetched data.
 *  - Else :
 *    + Return an error message with the status code.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} Json
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting Invoice Settings Details request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

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
    const invoiceList = await indexServices.find('invoice_settings_information', ['id', 'name', 'description', 'is_active'], {});
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: invoiceList.data };

    /* Log Response */
    logResponse('info', req, responseData, 'invoice settings data response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Update an existing invoice settings entry based on the provided request body.
 * 
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to update the existing invoice setting data.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set a default variable for the response data.
 *  - Define the validation rules as follows:
 *    + 'request_id' is mandatory.
 *    + 'id' is mandatory, should be a numeric value, and must exist in the 'invoice_settings_information' table.
 *    + 'is_active' is mandatory and should be Boolean.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Construct a condition object for updating the entry based on the request parameters.
 *    + Call the 'update' function from the Invoice Settings service.
 *    + Prepare a response with success status and message.
 *  - Else:
 *    + Return an error message with the status code.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} Json
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update Invoice Settings request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.invoiceSettings.invoiceSettingsIdRequired)
      .isInt().withMessage(responseMessages.configurations.invoiceSettings.invoiceSettingsIdInvalid)
      .custom((value) => {
        return indexServices.find('invoice_settings_information', ['id'], { id: value }).then((invoiceSettingsData) => {
          const status = invoiceSettingsData.status;
          if (!status) {
            return Promise.reject(responseMessages.configurations.invoiceSettings.IdNotExists);
          }
        });
      }),
    check('is_active').trim().escape().notEmpty().withMessage(responseMessages.configurations.invoiceSettings.statusrequired)
      .isBoolean().withMessage(responseMessages.configurations.invoiceSettings.statusInvalid),
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
    let condition = { id : req.params.id } // condition
    await invoiceSettingsservice.update(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'Invoice Settings Update Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = { index, update };
