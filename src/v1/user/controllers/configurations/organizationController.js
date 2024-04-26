const { check, validationResult } = require('express-validator')
const { responseMessages } = require('../../../../../constants/responseMessage')
const { responseCodes } = require('../../../../../constants/responseCodes')
const { logRequest, logResponse } = require('../../../../../utils/log')
const organizationServices = require('../../services/configurations/organizationServices')
const { responseHandler } = require('../../../../responseHandler')
const { tryCatch } = require('../../../../../utils/tryCatch')
const InvalidRequestError = require('../../../../../error/InvalidRequestError')
const indexServices = require('../../services/index')
const { regexPatterns } = require('../../../../../constants/regexPatterns')
const indexRepository = require('../../repositories/index')

/**
 * Organization Index to return organization data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Fetch the data from organization table and return the data
 *      ~ Add success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 *
 * Logic :
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(param) is mandatory.
 *  - Run the validation rules
 *    + If validation success
 *      ~ Define condition object to fetch the organization information.
 *      ~ Call the service function(index) to fetch the data based on the condition(defined above).
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
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'getting organization index request')
  /* Log Request */

  /* Default variable */
  let responseData = []
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired)
  ]

  /* Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req)
    if (result.errors.length) break
  }
  const errors = validationResult(req)
  /* Run the validation rules. */

  /**
   * If validation is success
   *    + call the index service function
   *        - Based on the status in index function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    const condition = {}; //{ id: req.query.id }
    const organizationData = await organizationServices.index(condition)
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.success,
      data: organizationData.data
    }

    /* Log Response */
    logResponse('info', req, responseData, 'organization Response.')
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    )
  }
})

async function validationRules(req) {
  let updateValidationRules = []
  if (req.params.id) {
    updateValidationRules = [
      check('id')
        .trim()
        .escape()
        .notEmpty()
        .withMessage(responseMessages.registration.organizationIdRequired)
        .isInt()
        .withMessage(responseMessages.registration.organizationIdInvalid)
        .custom(async (value) => {
          const organization = await indexServices.find(
            'organization',
            ['id'],
            { id: value }
          )
          const organizationData = organization.status
          if (!organizationData) {
            return Promise.reject(
              responseMessages.registration.organizationIdNotExists
            )
          }
        }),
      check('organization_name')
        .trim()
        .notEmpty()
        .withMessage(responseMessages.registration.organizationNameRequired)
        .not()
        .matches(regexPatterns.specialCharactersRegex)
        .withMessage(responseMessages.employee.behalfOnboarding.orgNameInvalid)
        .custom(async value => {
          const organizationData = await indexServices.find('organization', ['id'], { organization_name: value });
          if (organizationData.status) {
            if (organizationData.data[0].id != req.params.id) {
              return Promise.reject(responseMessages.registration.organizationNameExists);
            }
          }
          return true;
        })
    ]
  } else {
    updateValidationRules = [
      check('organization_name')
        .trim()
        .notEmpty()
        .withMessage(responseMessages.registration.organizationNameRequired)
        .not()
        .matches(regexPatterns.specialCharactersRegex)
        .withMessage(
          responseMessages.employee.behalfOnboarding.orgNameInvalid
        )
        .custom((value) => {
          return indexServices
            .find('organization', ['id'], { organization_name: value })
            .then((organization) => {
              const organizationData = organization.status
              if (organizationData) {
                return Promise.reject(
                  responseMessages.registration.organizationNameExists
                )
              }
            })
        })
    ];
  }

  const validationRules = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),

    check('first_name')
      .trim()
      .custom(async (value) => {
        if (value !== null || value !== '') {
          const regex = regexPatterns.alphaCharactersAndSpacesOnly
          if (regex.test(value)) {
            return true
          } else {
            return Promise.reject(
              responseMessages.employee.behalfOnboarding.firstNameInvalid
            )
          }
        } else {
          return true
        }
      }),
    check('middle_name')
      .trim()
      .custom(async (value) => {
        if (value !== null || value !== '') {
          const regex = regexPatterns.alphaCharactersAndSpacesOnly
          if (regex.test(value)) {
            return true
          } else {
            return Promise.reject(
              responseMessages.employee.behalfOnboarding.middleNameInvalid
            )
          }
        } else {
          return true
        }
      }),
    check('last_name')
      .trim()
      .custom(async (value) => {
        if (value !== null || value !== '') {
          const regex = regexPatterns.alphaCharactersAndSpacesOnly
          if (regex.test(value)) {
            return true
          } else {
            return Promise.reject(
              responseMessages.employee.behalfOnboarding.lastNameInvalid
            )
          }
        } else {
          return true
        }
      }),
    check('ext')
      .trim()
      .custom(async (value) => {
        if (value != '' && value != null && value != undefined) {
          var pattern = regexPatterns.phoneNumberWithCountryCodeRegex
          if (!pattern.test(value)) {
            return Promise.reject(
              responseMessages.companyContacts.extensionInvalid
            )
          }
        }
        return true
      }),
    check('phone_number')
      .trim()
      .notEmpty()
      .withMessage(
        responseMessages.employee.behalfOnboarding.phoneNumberRequired
      )
      .matches(regexPatterns.numberOrHyphenRegex)
      .withMessage(
        responseMessages.employee.behalfOnboarding.phoneNumberInvalid
      ),
    check('email_id')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.emailIdRequired)
      .isEmail()
      .withMessage(responseMessages.employee.behalfOnboarding.emailIdInvalid),
    check('logo_id')
      .trim()
      .escape()
      .custom(async (value, { req }) => {
        // Check if req.params.id is provided
        if (!req.params.id) {
          // If req.params.id is not provided, logo_id is required
          if (!value) {
            throw new Error(responseMessages.employee.documents.logoIdRequired)
          } else {
            // Validate logo_id format
            var pattern = regexPatterns.uuidRegex
            if (!pattern.test(value)) {
              throw new Error(responseMessages.employee.documents.invalidLogoId)
            }
            // Check if document with logo_id exists
            const documentsData = await indexServices.find(
              'temp_upload_documents',
              ['id'],
              { id: value },
              null,
              [],
              null,
              null,
              null,
              false
            )
            if (!documentsData.status) {
              throw new Error(
                responseMessages.employee.documents.documenIdNoExists
              )
            }
          }
        }
      }),
    check('date_format')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.registration.dateFormatRequired),
    check('currency_symbol')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.registration.currencySymbolRequired),
    check('organization_fax_number')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.registration.organizationFaxNumberRequired),
    check('website_url')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.registration.websiteURLReequired),
    check('payable_to')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.registration.payableToRequired),
    check('additional_information')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.registration.additionalInformationRequired)
  ]

  return [...updateValidationRules, ...validationRules]
}

/**
 * Store function to save the organization data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Store the data into organization table and return the id
 *      ~ Add success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 *
 * Logic :
 *  - Log incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + organization_name(body) is mandatory and Special characters are not allowed
 *    + first_name(body) is mandatory and should contain alphabetic characters only
 *    + last_name(body) is mandatory and should contain alphabetic characters only
 *    + middle_name(body) is not-mandatory, if provided then should contain alphabetic characters only
 *    + contact_number(body) is mandatory and should match a specific format (numeric with optional dashes and parentheses).
 *    + mobile_number(body) is not-mandatory, if provided then it should accept numeric values with a maximum length of 12 digits
 *    + email_id(body) is mandatory
 *    + logo_id(body) is mandatory, it must contain a valid UUID and checked for its presence in the 'temp_upload_documents' table
 *    + date_format(body) is mandatory.
 *    + currency_symbol(body) is mandatory.
 *  - Run the validation rules
 *    + If validation success
 *      ~ Call the service function(store) to store the data into organization table.
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
  logRequest('info', req, 'New organization create  request')
  /* Log Request */

  /* Default variable */
  let responseData = []
  /* Default variable */

  var validations = await validationRules(req)

  /* Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req)
    if (result.errors.length) break
  }
  const errors = validationResult(req)
  /* Run the validation rules. */

  /**
   * If validation is success
   *    + Call the store service function
   *        - Based on the status in store function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    await organizationServices.saveOrUpdate(req, req.body)
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.addedSuccessfully,
      data: responseData[0]
    }
    /* Log Response */
    logResponse('info', req, responseData, 'Organization registration response')
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    )
  }
})

/**
 * Update Function for update Organization Data.
 *
 * Overview of API:
 * - Validate the request.
 *   + If successful:
 *     ~ Call the update service function.
 *     ~ Update organization data in the database.
 *     ~ Return a success response.
 *   + If validation fails:
 *     ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log incoming request.
 * - Define validation rules for the input request, including checks for various fields:
 *   + request_id(body) is mandatory.
 *   + id(body) is mandatory, should be an integer, and must exist in the 'organization' table.
 *   + organization_name(body) is mandatory and Special characters are not allowed and it must also not match an existing organization's name in the 'organization' table.
 *   + first_name(body) is mandatory and should contain alphabetic characters only.
 *   + last_name(body) is mandatory and should contain alphabetic characters only.
 *   + middle_name(body) is not mandatory, if provided, should contain alphabetic characters only.
 *   + contact_number(body) is mandatory and should match a specific format (numeric with optional dashes and parentheses).
 *   + mobile_number(body) is not mandatory, if provided, it should accept numeric values with a maximum length of 12 digits.
 *   + email_id(body) is mandatory and should be a valid email address.
 *   + logo_id(body) is mandatory, must be a valid value, and should exist in the 'temp_upload_documents' table.
 *   + date_format(body) is mandatory.
 *   + currency_symbol(body) is mandatory.
 *
 * - Run the validation rules:
 *   + If validation is successful:
 *     ~ Call the update service function (update).
 *     ~ Based on the status in the update function response, segregate the response and prepare the response.
 *   + If validation fails:
 *     ~ Add error validation to the response.
 *
 * - Prepare the response with status codes.
 * - Log the response.
 * - Return the response using the responseHandler() function.
 *
 * Notes:
 * - Handling expection using try catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON response.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update organization  request.')
  /* Log Request */

  /* Default variable */
  let responseData = []
  /* Default variable */

  var validations = await validationRules(req)

  /* Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req)
    if (result.errors.length) break
  }
  const errors = validationResult(req)
  /* Run the validation rules. */

  /**
   * If validation is success
   *    + call the update service function
   *        - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id }
    await organizationServices.saveOrUpdate(req, req.body, condition)
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
      data: responseData[0]
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Update organization  Response.')
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    )
  }
})

/**
 * Updates the invoice theme for an organization
 * Overview of API:
 * - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Update the invoice theme for the organization.
 *      ~ Add success to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Define the validation rules as follows:
 *    + request_id(body) is mandatory.
 *    + invoice_theme_id(body) is mandatory and must be an integer.
 * - Run the validation rules.
 *    + If validation success:
 *      ~ Call the service function(updateInvoiceTheme) to update the organization's invoice theme.
 *      ~ Based on the status in the update function response, segregate the response and prepare the response.
 *    + Else:
 *      ~ Add error validation to the response.
 * - Prepare the response with appropriate status codes.
 * - Log the response.
 * - Return the response using responseHandler().
 *
 * Notes:
 * - Exception handling is implemented using try-catch.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {JSON} Json
 * @throws {InvalidRequestError} If there are validation errors in the request.
 */
const updateInvoiceTheme = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update organization invoice theme request.')
  /* Log Request */

  /* Default variable */
  let responseData = []
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
      .withMessage(responseMessages.registration.organizationIdRequired)
      .isInt()
      .withMessage(responseMessages.registration.organizationIdInvalid)
      .custom(async (value) => { const organization = await indexServices.find( 'organization', ['id'], { id: value } )
        const organizationData = organization.status
        if (!organizationData) {
          return Promise.reject(
            responseMessages.registration.organizationIdNotExists
          )
        }
      }),
    check('invoice_theme')
      .notEmpty()
      .withMessage(responseMessages.registration.invoiceThemeIdRequired)
  ]
  /* Writing validation rules to the input request */

  /* Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req)
    if (result.errors.length) break
  }
  const errors = validationResult(req)
  /* Run the validation rules. */

  /**
   * If validation is success
   *    + call the update service function
   *        - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    let condition = { id: req.params.id } 
    await organizationServices.updateInvoiceTheme(req.body, condition)
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
      data: responseData[0]
    }

    /* Log Response */
    logResponse(
      'info',
      req,
      responseData,
      'Update organization invoice theme request'
    )
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    )
  }
})


const getInvoiceTheme = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update organization invoice theme request.')
  /* Log Request */

  /* Default variable */
  let responseData = []
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
      .withMessage(responseMessages.registration.organizationIdRequired)
      .isInt()
      .withMessage(responseMessages.registration.organizationIdInvalid)
      .custom(async (value) => { const organization = await indexServices.find( 'organization', ['id'], { id: value } )
        const organizationData = organization.status
        if (!organizationData) {
          return Promise.reject(
            responseMessages.registration.organizationIdNotExists
          )
        }
      })
  ]
  /* Writing validation rules to the input request */

  /* Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req)
    if (result.errors.length) break
  }
  const errors = validationResult(req)
  /* Run the validation rules. */

  /**
   * If validation is success
   *    + call the update service function
   *        - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    let data = await organizationServices.getInvoiceTheme(req.query.id)
    responseData = {
      statusCode: responseCodes.codeSuccess,
      data: data
    }

    /* Log Response */
    logResponse(
      'info',
      req,
      responseData,
      'Get organization invoice theme request'
    )
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    )
  }
})

/**
 * Email Signature Index to return email signature data for an organization.
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to fetch email signature data.
 *      ~ Fetch the data from the 'organization' table and return it in the response.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 *  - Log incoming request.
 *  - Define the validation rules as follows:
 *    + 'request_id' (parameter) is mandatory.
 *  - Run the validation rules.
 *    + If validation succeeds
 *      ~ Define a condition object to fetch email signature information.
 *      ~ Call the service function to fetch data based on the condition.
 *        # Add the service function's return data to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with appropriate status codes and messages.
 *  - Log the response.
 *  - Return the response using the 'responseHandler' function.
 *
 * Notes:
 *  - Exception handling is implemented using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const emailSignatureindex = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'getting email signature index request')
  /* Log Request */

  /* Default variable */
  let responseData = []
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired)
  ]
  /* Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req)
    if (result.errors.length) break
  }
  const errors = validationResult(req)
  /* Run the validation rules. */

  /**
   * If validation is success
   *    + call the index service function
   *        - Based on the status in index function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    const organizationData = await indexServices.find('organization', [
      'id',
      'email_signature'
    ])
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.success,
      data: organizationData.data
    }

    /* Log Response */
    logResponse(
      'info',
      req,
      responseData,
      'organization email signature  Response.'
    )
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    )
  }
})

/**
 * Email Signature Update to modify the email signature for an organization.
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the update service function to modify the email signature.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 *  - Log incoming request.
 *  - Define the validation rules as follows:
 *    + 'request_id' (request body) is mandatory.
 *    + 'signature' (request body) is required.
 *  - Run the validation rules.
 *    + If validation succeeds
 *      ~ Call the service function to update the email signature using the request body.
 *        # Add the success message and any relevant data to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with appropriate status codes and messages.
 *  - Log the response.
 *  - Return the response using the 'responseHandler' function.
 *
 * Notes:
 *  - Exception handling is implemented using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const emailSignatureUpdate = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update organization  request.')
  /* Log Request */

  /* Default variable */
  let responseData = []
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
      .withMessage(responseMessages.registration.organizationIdRequired)
      .isInt()
      .withMessage(responseMessages.registration.organizationIdInvalid)
      .custom(async (value) => {
        const organization = await indexServices.find('organization', ['id'], {
          id: value
        })
        const organizationData = organization.status
        if (!organizationData) {
          return Promise.reject(
            responseMessages.registration.organizationIdNotExists
          )
        }
      }),
    check('signature')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.registration.signatureRequired)
  ]
  /* Writing validation rules to the input request */

  /* Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req)
    if (result.errors.length) break
  }
  const errors = validationResult(req)
  /* Run the validation rules. */

  /**
   * If validation is success
   *    + call the update service function
   *        - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id }
    await organizationServices.updateSignature(req.body, condition)
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
      data: responseData[0]
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Update organization  Response.')
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    )
  }
})

/**
 * Organization Profile to retrieve the profile data for an organization.
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to fetch the organization's profile data.
 *      ~ Add the retrieved data to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 *  - Log incoming request.
 *  - Define the validation rules as follows:
 *    + 'request_id' (request parameter) is mandatory.
 *  - Run the validation rules.
 *    + If validation succeeds
 *      ~ Call the service function to fetch the organization's profile data.
 *        # Add the retrieved data to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with appropriate status codes and messages.
 *  - Log the response.
 *  - Return the response using the 'responseHandler' function.
 *
 * Notes:
 *  - Exception handling is implemented using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const profile = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'getting organization profile request')
  /* Log Request */

  /* Default variable */
  let responseData = []
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
      .withMessage(responseMessages.registration.organizationIdRequired)
      .isInt()
      .withMessage(responseMessages.registration.organizationIdInvalid)
      .custom(async (value) => {
        const organization = await indexServices.find('organization', ['id'], {
          id: value
        })
        const organizationData = organization.status
        if (!organizationData) {
          return Promise.reject(
            responseMessages.registration.organizationIdNotExists
          )
        }
      })
  ]
  /* Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req)
    if (result.errors.length) break
  }
  const errors = validationResult(req)
  /* Run the validation rules. */

  /**
   * If validation is success
   *    + call the index service function
   *        - Based on the status in index function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    const condition = { id: req.query.id }
    const organizationLogo = await indexRepository.find(
      'organization',
      ['logo_url'],
      condition,
      null
    )
    if (organizationLogo.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: organizationLogo.data
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: organizationLogo.message,
        data: []
      }
    }

    /* Log Response */
    logResponse('info', req, responseData, 'organization profile Response.')
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    )
  }
})

/**
 * Get Active Invoice Theme Data for an Organization.
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to fetch the active invoice theme data for the organization.
 *      ~ Add the retrieved data to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 *  - Log incoming request.
 *  - Define the validation rules as follows:
 *    + 'request_id' (request parameter) is mandatory.
 *  - Run the validation rules.
 *    + If validation succeeds
 *      ~ Call the service function to fetch the active invoice theme data.
 *        # Add the retrieved data to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with appropriate status codes and messages.
 *  - Log the response.
 *  - Return the response using the 'responseHandler' function.
 *
 * Notes:
 *  - Exception handling is implemented using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const getActiveInvoiceThemeData = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'getting active invoice theme data')
  /* Log Request */

  /* Default variable */
  let responseData = []
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired)
  ]
  /* Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req)
    if (result.errors.length) break
  }
  const errors = validationResult(req)
  /* Run the validation rules. */

  /**
   * If validation is success
   *    + call the index service function
   *        - Based on the status in index function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    const organizationData = await organizationServices.activeInvoiceTheme()
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.success,
      data: organizationData.data
    }

    /* Log Response */
    logResponse(
      'info',
      req,
      responseData,
      'organization active invoice theme id Response.'
    )
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    )
  }
})

/**
 * Store function to save the organization data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Store the data into organization table and return the id
 *      ~ Add success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 *
 * Logic :
 *  - Log incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + organization_name(body) is mandatory and Special characters are not allowed
 *    + first_name(body) is mandatory and should contain alphabetic characters only
 *    + last_name(body) is mandatory and should contain alphabetic characters only
 *    + middle_name(body) is not-mandatory, if provided then should contain alphabetic characters only
 *    + contact_number(body) is mandatory and should match a specific format (numeric with optional dashes and parentheses).
 *    + mobile_number(body) is not-mandatory, if provided then it should accept numeric values with a maximum length of 12 digits
 *    + email_id(body) is mandatory
 *    + logo_id(body) is mandatory, it must contain a valid UUID and checked for its presence in the 'temp_upload_documents' table
 *    + date_format(body) is mandatory.
 *    + currency_symbol(body) is mandatory.
 *  - Run the validation rules
 *    + If validation success
 *      ~ Call the service function(store) to store the data into organization table.
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
const offBoardingStore = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'New organization create  request')
  /* Log Request */

  /* Default variable */
  let responseData = []
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('associated_app_names')
      .trim()
      .custom(async (value) => {
        if (value !== null || value !== '') {
          const regex = regexPatterns.alphanumericSpaceRegex
          if (regex.test(value)) {
            return true
          } else {
            return Promise.reject(
              responseMessages.clientContacts.mobileNumberInvalid
            )
          }
        } else {
          return true
        }
      }),
    check('notify_university_usics')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.lastNameRequired)
      .isBoolean()
      .withMessage(responseMessages.employee.behalfOnboarding.lastNameInvalid),
    check('enable_settlement_amount')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.lastNameRequired)
      .isBoolean()
      .withMessage(responseMessages.employee.behalfOnboarding.lastNameInvalid),
    check('enable_delete_email')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.emailIdRequired)
      .isEmail()
      .withMessage(responseMessages.employee.behalfOnboarding.emailIdInvalid)
  ]
  /* Writing validation rules to the input request */

  /* Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req)
    if (result.errors.length) break
  }
  const errors = validationResult(req)
  /* Run the validation rules. */

  /**
   * If validation is success
   *    + Call the store service function
   *        - Based on the status in store function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    await organizationServices.store(req.body)
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.addedSuccessfully,
      data: responseData[0]
    }
    /* Log Response */
    logResponse('info', req, responseData, 'Organization registration response')
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    )
  }
})

/**
 * Handles the update of organization settings based on the received request.
 * - Logs the incoming request for updating organization settings.
 * - Validates the request body for the required fields and their formats.
 * - If validation succeeds, invokes the 'updateOrganizationSettings' function from organizationServices.
 * - Constructs a response based on the status of the update operation:
 *    - If successful, returns a success response indicating the settings were updated successfully.
 *    - If unsuccessful, returns an error response with details about the encountered issue.
 * - Logs the generated response.
 * - Sends the response back to the client.
 *
 * @param {Object} req - Express request object containing details for updating organization settings.
 * @param {Object} res - Express response object to send the response back.
 */
const updateOrganizationSettings = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update Organization Settings request.');
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
      .withMessage(responseMessages.registration.organizationIdRequired)
      .isInt()
      .withMessage(responseMessages.registration.organizationIdInvalid)
      .custom(async (value) => { const organization = await indexServices.find( 'organization', ['id'], { id: value } )
        const organizationData = organization.status
        if (!organizationData) {
          return Promise.reject(
            responseMessages.registration.organizationIdNotExists
          )
        }
      }),
      check('associated_app_names')
      .trim()
      .custom(async (value) => {
        if (value !== null || value !== '') {
          const regex = regexPatterns.alphaCharactersAndSpacesOnly
          if (regex.test(value)) {
            return true
          } else {
            return Promise.reject(
              responseMessages.employee.behalfOnboarding.associatedAppNamesInvalid
            )
          }
        } else {
          return true
        }
      }),
    check('notify_university_usics')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.organizationContactInformation.notifyUniversityStatusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.organizationContactInformation.notifyUniversitystatusInvalid),
    check('enable_delete_email')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.organizationContactInformation.deleteEmailStatusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.organizationContactInformation.deleteEmailStatusInvalid),
    check('enable_settlement_amount')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.organizationContactInformation.settlementAmountStatusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.organizationContactInformation.settlementAmountStatusInvalid),
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
    let condition = { id: req.params.id } // condition
    await organizationServices.updateOrganizationSettings(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'update Organization Settings Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = {
  emailSignatureUpdate,
  emailSignatureindex,
  index,
  profile,
  store,
  update,
  updateInvoiceTheme,
  getActiveInvoiceThemeData,
  offBoardingStore,
  updateOrganizationSettings,
  getInvoiceTheme
}
