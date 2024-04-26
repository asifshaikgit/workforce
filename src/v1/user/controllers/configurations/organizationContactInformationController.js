const { check, validationResult } = require('express-validator');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { logRequest, logResponse } = require('../../../../../utils/log');
const organizationContactInformationService = require('../../services/configurations/organizationContactInformationService');
const indexService = require('../../services/index');
const { responseHandler } = require('../../../../responseHandler');
const { tryCatch } = require('../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const { regexPatterns } = require('../../../../../constants/regexPatterns')



/**
 * Create New Organization Contact Information for an Organization.
 * Overview of API:
 *  - Validate the request to ensure it adheres to defined rules.
 *    + If successful
 *      ~ Call the service function to create new Organization contact information for an organization.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic : 
 *  - Log incoming request
 *  - Define the validation rules as follows
 *    + 'request_id' (body) is mandatory.
 *    + 'organization_name' (body) is mandatory, and special characters are not allowed.
 *    + 'address_line_1' (body) is mandatory and should not contain special characters.
 *    + 'country_id' (body) is mandatory and should exist in the 'countries' table.
 *    + 'city' (body) is mandatory and should not contain special characters.
 *    + 'state_id' (body) is mandatory and should exist in the 'states' table.
 *    + 'zip_code' (body) is mandatory, should only contain numbers and spaces, and should have a length between 5 and 10.
 *    + 'company_email_id' (body) is mandatory and should be a valid email address.
 *    + 'company_phone_number' (body) is mandatory, should match a specific format (numeric with optional dashes and parentheses), and have a length between 10 and 12.
 *    + 'website_url' (body) is mandatory.
 * 
 *  - Run the validation rules
 *    + If validation success
 *      ~ Call the service function to store the provided Organization contact information.
 *      ~ Add a success message to the response.
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
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const store = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'create new Organization contact information');
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
    check('organization_name')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.organizationContactInformation.nameRequired)
      .not().matches(regexPatterns.specialCharactersRegex)
      .withMessage(responseMessages.configurations.organizationContactInformation.invalidName)
      .custom(async (value) => {
        const organization = await indexService.find('organization_contact_information', ['id'], {});
        const organizationData = organization.status;
        if (organizationData) {
          return Promise.reject(responseMessages.configurations.organizationContactInformation.recordAlreadyExists);
        }
      }),
    check('address_line_1')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.organizationContactInformation.addressLine1Required)
      .not().matches(regexPatterns.specialCharactersRegex)
      .withMessage(responseMessages.configurations.organizationContactInformation.addressInvalid),
    check('country_id').trim().escape().notEmpty().withMessage(responseMessages.configurations.state.countryId).custom((value) => {
      return indexService.find('countries', ['id'], { id: value }).then((contactData) => {
        const status = contactData.status;
        if (!status) {
          return Promise.reject(responseMessages.configurations.country.IdNotExists);
        }
      });
    }),
    check('city')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.organizationContactInformation.cityNameRequired)
      .not().matches(regexPatterns.specialCharactersRegex)
      .withMessage(responseMessages.configurations.organizationContactInformation.cityNameInvalid),
    check('state_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.state.stateId)
      .custom((value) => {
        return indexService.find('states', ['id'], { id: value }).then((state) => {
          const stateData = state.status;
          if (!stateData) {
            return Promise.reject(responseMessages.configurations.state.IdNotExists);
          }
        });
      }),
    check('zip_code')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.organizationContactInformation.zipCode)
      .matches(regexPatterns.numbersSpaceRegex)
      .withMessage(responseMessages.configurations.organizationContactInformation.zipCodeIsInvalid)
      .isLength({ min: 5, max: 10 })
      .withMessage(responseMessages.configurations.organizationContactInformation.zipCodeShouldBe),
    check('company_email_id')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.organizationContactInformation.companyEmailIdRequired)
      .isEmail()
      .withMessage(responseMessages.configurations.organizationContactInformation.companyEmailIdInvalid),
    check('company_phone_number')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.organizationContactInformation.phoneNumberRequired)
      .matches(regexPatterns.phoneRegex).withMessage(responseMessages.configurations.organizationContactInformation.invalidPhoneNumber)
      .isLength({ min: 10, max: 12 }).withMessage(responseMessages.configurations.organizationContactInformation.invalidPhoneNumber),
    check('website_url')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.organizationContactInformation.websiteURLReequired),
  ];
  /* Writing validation rules to the input request */

  /* Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req);
    if (result.errors.length) {
      break;
    }
  }
  const errors = validationResult(req);
  /* Run the validation rules. */

  /**
   * If validation is success
   *    + Call the store service function
   *        - Based on the status in store function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    await organizationContactInformationService.store(req.body);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully };
    /* Log Response */
    logResponse('info', req, responseData, 'New store response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Update Organization Contact Information for an Organization.
 * Overview of API:
 *  - Validate the request to ensure it adheres to defined rules.
 *    + If successful
 *      ~ Call the service function to update Organization contact information for an organization.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic : 
 *  - Log incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + id(params) is mandatory, should be a numeric value, and must exist in the 'organization_contact_information' table.
 *    + organization_name(body) is mandatory and should not contain special characters.
 *    + address_line_1(body) is mandatory and should not contain special characters.
 *    + country_id(body) is mandatory and must exist in the 'countries' table.
 *    + city(body) is mandatory and should not contain special characters.
 *    + state_id(body) is mandatory and must exist in the 'states' table.
 *    + zip_code(body) is mandatory, should be numeric, and within a specific length range.
 *    + company_email_id(body) is mandatory and should be a valid email address.
 *    + company_phone_number(body) is mandatory, should match a specific format (numeric with optional dashes and parentheses), and should be within a specific length range.
 *    + website_url(body) is mandatory.
 *  - Run the validation rules
 *    + If validation is successful
 *      ~ Call the service function to update the provided Organization contact information.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Logging the response
 *  - Return the response using responseHandler()  
 *        
 * Notes :
 *    - Handling exceptions using try-catch
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update Organization contact info request.');
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
      .withMessage(responseMessages.configurations.organizationContactInformation.contactIdRequired)
      .matches(regexPatterns.numericOnlyRegex)
      .withMessage(responseMessages.configurations.organizationContactInformation.InvalidContactId)
      .custom((value) => {
        return indexService.find('organization_contact_information', ['id'], { id: value }).then((contact) => {
          const contactData = contact.status;
          if (!contactData) {
            return Promise.reject(responseMessages.configurations.organizationContactInformation.IdNotExists);
          }
        });
      }),
    check('organization_name')
      .trim()
      .notEmpty().withMessage(responseMessages.configurations.organizationContactInformation.nameRequired)
      .not().matches(regexPatterns.specialCharactersRegex)
      .withMessage(responseMessages.configurations.organizationContactInformation.invalidName),
    check('address_line_1')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.organizationContactInformation.addressLine1Required)
      .not().matches(regexPatterns.specialCharactersRegex)
      .withMessage(responseMessages.configurations.organizationContactInformation.addressInvalid),
    check('country_id').trim().escape().notEmpty().withMessage(responseMessages.configurations.state.countryId).custom((value) => {
      return indexService.find('countries', ['id'], { id: value }).then((contactData) => {
        const status = contactData.status;
        if (!status) {
          return Promise.reject(responseMessages.configurations.country.IdNotExists);
        }
      });
    }),
    check('city')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.organizationContactInformation.cityNameRequired)
      .not().matches(regexPatterns.specialCharactersRegex)
      .withMessage(responseMessages.configurations.organizationContactInformation.cityNameInvalid),
    check('state_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.state.stateId)
      .custom((value) => {
        return indexService.find('states', ['id'], { id: value }).then((state) => {
          const stateData = state.status;
          if (!stateData) {
            return Promise.reject(responseMessages.configurations.state.IdNotExists);
          }
        });
      }),
    check('zip_code')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.organizationContactInformation.zipCode)
      .matches(regexPatterns.numbersSpaceRegex)
      .withMessage(responseMessages.configurations.organizationContactInformation.zipCodeIsInvalid)
      .isLength({ min: 5, max: 10 })
      .withMessage(responseMessages.configurations.organizationContactInformation.zipCodeShouldBe),
    check('company_email_id')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.organizationContactInformation.companyEmailIdRequired)
      .isEmail()
      .withMessage(responseMessages.configurations.organizationContactInformation.companyEmailIdInvalid),
    check('company_phone_number')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.organizationContactInformation.companyEmailIdRequired)
      .matches('^(\\d{3}[-]?){2}\\d{4}$').withMessage(responseMessages.configurations.organizationContactInformation.invalidPhoneNumber)
      .isLength({ min: 10, max: 12 }).withMessage(responseMessages.configurations.organizationContactInformation.invalidPhoneNumber),
    check('website_url')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.organizationContactInformation.websiteURLReequired),

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
    await organizationContactInformationService.update(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'Update contact info Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Contact Information Index to return contact information data.
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to fetch contact information data.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Define the validation rules as follows:
 *    + request_id(request param) is mandatory.
 *  - Run the validation rules.
 *    + If validation is successful:
 *      ~ Call the service function (index) to fetch the contact information data.
 *        # Add the service function (index) return data to the response.
 *    + Else:
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Log the response.
 *  - Return the response using responseHandler().
 *        
 * Notes:
 *  - Handling expection using try catch
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'getting contact info ');
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
      .withMessage(responseMessages.configurations.organizationContactInformation.contactIdRequired)
      .matches(regexPatterns.numericOnlyRegex)
      .withMessage(responseMessages.configurations.organizationContactInformation.InvalidContactId)
      .custom((value) => {
        return indexService.find('organization_contact_information', ['id'], { id: value }).then((contact) => {
          const contactData = contact.status;
          if (!contactData) {
            return Promise.reject(responseMessages.configurations.organizationContactInformation.IdNotExists);
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
   *        - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
  */
  if (errors.isEmpty()) {
    const condition = { id : req.query.id}
    const contactData = await organizationContactInformationService.index(condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: contactData.data };

    /* Log Response */
    logResponse('info', req, responseData, 'contact index Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = { store, update, index };
