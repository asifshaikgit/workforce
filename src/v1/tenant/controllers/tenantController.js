const { check, validationResult } = require('express-validator');
const { responseMessages } = require('../../../../constants/responseMessage');
const { responseCodes } = require('../../../../constants/responseCodes');
const { logRequest, logResponse } = require('../../../../utils/log');
const tenantService = require('../services/tenantService');
const { responseHandler, tenantResponseHandler } = require('../../../responseHandler');
const { tryCatch } = require('../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../error/InvalidRequestError');
const { regexPatterns } = require('../../../../constants/regexPatterns');

/**
 * Validate the tenant registration request.
 * If request validation success call cerate tenant services function.
 *
 * @param {object} req
 * @param {object} res
 * @return Json
 * @return InvalidRequestError
 */
const store = tryCatch(
  async (req, res) => {

    /* Log Request */
    logRequest('info', req, 'New tenant account creation  request');
    /* Log Request */

    /* Default Variable */
    let responseData = '';
    /* Default Variable */

    /* Writing validation rules to the input request */
    const validations = [
      check('request_id')
        .trim()
        .escape()
        .notEmpty().withMessage(responseMessages.common.requestIdRequired),
      check('first_name')
        .trim()
        .notEmpty().withMessage(responseMessages.registration.firstNameRequired)
        .matches(regexPatterns.alphaCharactersAndSpacesOnly).withMessage(responseMessages.registration.firstNameInvalid),
      check('middle_name')
        .trim()
        .matches(regexPatterns.alphaCharactersAndSpacesOnly).withMessage(responseMessages.registration.middleNameInvalid),
      check('last_name')
        .trim()
        .notEmpty().withMessage(responseMessages.registration.lastNameRequired)
        .matches(regexPatterns.alphaCharactersAndSpacesOnly).withMessage(responseMessages.registration.lastNameInvalid),
      check('email_id')
        .trim()
        .escape()
        .notEmpty().withMessage(responseMessages.registration.emailIdRequired)
        .isEmail().withMessage(responseMessages.registration.emailIdInvalid).custom((value) => {
          return tenantService.find({ email_id: value }).then((userData) => {
            if (userData.status) {
              return Promise.reject(responseMessages.registration.emailIdExists);
            } else {
              if (value.includes('@gmail.')) {
                return Promise.reject(responseMessages.registration.emailIdNotAllowed);
              }
            }
          });
        }),
      check('contact_number')
        .trim()
        .notEmpty()
        .withMessage(responseMessages.registration.contactNumberRequired)
        .matches(regexPatterns.phoneRegex)
        .withMessage(responseMessages.registration.contactNumberInvalid)
        .custom((value) => {
          return tenantService.find({ contact_number: value }).then((data) => {
            if (data.status && value != '') {
              return Promise.reject(responseMessages.registration.contactNumberExists);
            }
          });
        }),
      check('organization_name')
        .trim()
        .escape()
        .notEmpty().withMessage(responseMessages.registration.organizationNameRequired)
        .custom((value) => {
          return tenantService.find({ organization_name: value }).then((userData) => {
            if (userData.status) {
              return Promise.reject(responseMessages.registration.organizationNameExists);
            }
          });
        }),
      check('date_format')
        .trim()
        .notEmpty()
        .withMessage(responseMessages.registration.dateFormatRequired),
      check('currency_symbol')
        .trim()
        .notEmpty()
        .withMessage(responseMessages.registration.currencySymbolRequired),
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
      check('mobile_number')
        .trim()
        .notEmpty()
        .withMessage(
          responseMessages.employee.behalfOnboarding.phoneNumberRequired
        )
        .matches(regexPatterns.numberOrHyphenRegex)
        .withMessage(
          responseMessages.employee.behalfOnboarding.phoneNumberInvalid
        ),
      check('personal_email_id')
        .trim()
        .notEmpty()
        .withMessage(responseMessages.employee.behalfOnboarding.emailIdRequired)
        .isEmail()
        .withMessage(responseMessages.employee.behalfOnboarding.emailIdInvalid),
      check('organization_phone_number')
        .trim()
        .notEmpty()
        .withMessage(
          responseMessages.employee.behalfOnboarding.phoneNumberRequired
        )
        .matches(regexPatterns.numberOrHyphenRegex)
        .withMessage(
          responseMessages.employee.behalfOnboarding.phoneNumberInvalid
        ),
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
    ];
    /* Writing validation rules to the input request */

    /*Run the validation rules. */
    for (let validation of validations) {
      let result = await validation.run(req);
      if (result.errors.length) break;
    }
    let errors = validationResult(req);
    /*Run the validation rules. */

    /**
     * If validation is success
     *    + Call the createTenant service function
     * If Validation Fails
     *    + Return the error message.
     */
    if (errors.isEmpty()) {
      await tenantService.store(req.body);
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success };

      /* Log Response */
      logResponse('info', req, responseData, 'New Tenant account registration response');
      /* Log Response */

      /* Return the response */
      tenantResponseHandler(res, responseData);
      /* Return the response */
    } else {
      throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
  },
);

/**
 * Validate the tenant registration request.
 * If request validation success call create tenant services function.
 *
 * @param {object} req
 * @param {object} res
 * @return Json
 * @return InvalidRequestError
 */
const index = tryCatch(
  async (req, res) => {

    /* Log Request */
    logRequest('info', req, 'Function to return the tenant details');
    /* Log Request */

    /* Default Variable */
    let responseData = '';
    /* Default Variable */

    /* Writing validation rules to the input request */
    const validations = [
      check('request_id')
        .trim()
        .escape()
        .notEmpty().withMessage(responseMessages.common.requestIdRequired),
    ];
    /* Writing validation rules to the input request */

    /*Run the validation rules. */
    for (let validation of validations) {
      let result = await validation.run(req);
      if (result.errors.length) break;
    }
    let errors = validationResult(req);
    /*Run the validation rules. */

    /**
     * If validation is success
     *    + Return the all tenants
     */
    if (errors.isEmpty()) {
      let tenantList = await tenantService.find();

      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: tenantList.data };

      /* Log Response */
      logResponse('info', req, responseData, 'New Tenant account registration response');
      /* Log Response */

      /* Return the response */
      tenantResponseHandler(res, responseData);
      /* Return the response */
    } else {
      throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
  },
);

/**
 * Funtion used to verify the otp that sent to registered email id
 *
 * @param {object} req
 * @param {object} res
 * @return Json
 * @return InvalidRequestError
 */
const verifyTenantOtp = tryCatch(
  async (req, res) => {

    /* Log Request */
    logRequest('info', req, 'New tenant creation request');
    /* Log Request */

    /* Default Variable */
    var responseData = '';
    /* Default Variable */

    /* Writing validation conditions to the input request */
    const validations = [
      check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
      check('otp').trim().escape().notEmpty().withMessage(responseMessages.login.otpRequired),
      check('email_id').notEmpty().withMessage(responseMessages.registration.emailIdRequired).trim().escape().isEmail().withMessage(responseMessages.employee.behalfOnboarding.emailIdInvalid).custom((value) => {
        return tenantService.find({ email_id: value }).then((tenantData) => {
          if (!tenantData.status) {
            return Promise.reject(responseMessages.registration.emailIdNotExists);
          } else if (tenantData.data[0].is_verified) {
            return Promise.reject(responseMessages.registration.accountAlreadyVerified);
          } else {
            if (tenantData.data[0].otp != req.body.otp) {
              return Promise.reject(responseMessages.registration.otpInvalid);
            }
          }
        });
      }),
    ];
    /* Writing validation rules to the input request */

    /*Run the validation rules. */
    for (let validation of validations) {
      let result = await validation.run(req);
      if (result.errors.length) break;
    }
    let errors = validationResult(req);
    /*Run the validation rules. */

    /**
     * If validation is success
     *    + call the verifyTenantOTP function in services
     * If Validation Fails
          */
    var responseData = '';
    if (errors.isEmpty()) {

      let tenantUpdateData = await tenantService.verifyTenantOTP(req.body);

      if (tenantUpdateData.status) {
        responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success };
      } else {
        throw new InvalidRequestError(tenantUpdateData.message, responseCodes.codeUnprocessableEntity);
      }

      /* Log Response */
      logResponse('info', req, responseData, 'OTP Verification for registered tenant request');
      /* Log Response */

      /* Return the response */
      tenantResponseHandler(res, responseData);
      /* Return the response */

    } else {
      throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
  },
);

const resendOTP = tryCatch(
  async (req, res) => {

    /* Log Request */
    logRequest('info', req, 'Resend OTP request');
    /* Log Request */

    /* Default Variable */
    var responseData = '';
    /* Default Variable */

    /* Writing validation conditions to the input request */
    const validations = [
      check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
      check('email_id').notEmpty().withMessage(responseMessages.registration.emailIdRequired).trim().escape().isEmail().withMessage(responseMessages.employee.behalfOnboarding.emailIdInvalid).custom((value) => {
        return tenantService.find({ email_id: value }).then((tenantData) => {
          if (!tenantData.status) {
            return Promise.reject(responseMessages.registration.emailIdNotExists);
          } else if (tenantData.data[0].is_verified) {
            return Promise.reject(responseMessages.registration.accountAlreadyVerified);
          } else {
            return true;
          }
        });
      }),
    ];
    /* Writing validation rules to the input request */

    /*Run the validation rules. */
    for (let validation of validations) {
      let result = await validation.run(req);
      if (result.errors.length) break;
    }
    let errors = validationResult(req);
    /*Run the validation rules. */

    /**
     * If validation is success
     *    + call the verifyTenantOTP function in services
     * If Validation Fails
          */
    var responseData = '';
    if (errors.isEmpty()) {
      await tenantService.resendOTP(req.body);
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success };

      /* Log Response */
      logResponse('info', req, responseData, 'OTP Resend Response');
      /* Log Response */

      /* Return the response */
      tenantResponseHandler(res, responseData);
      /* Return the response */

    } else {
      throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
  },
);

/**
 * Validate the tenant registration request.
 * If request validation success call create tenant services function.
 *
 * @param {object} req
 * @param {object} res
 * @return Json
 * @return InvalidRequestError
 */
const subdomainValidate = tryCatch(
  async (req, res) => {

    /* Log Request */
    logRequest('info', req, 'Function to check subdomain in the tenant details');
    /* Log Request */

    /* Default Variable */
    let responseData = '';
    /* Default Variable */
    if (req.body.subdomain_name != undefined && req.body.subdomain_name != '') {
      let tenantList = await tenantService.find({ subdomain_name: req.body.subdomain_name });
      if (tenantList.status) {
        responseData = { statusCode: responseCodes.codeSuccess, domain_exists: true, message: responseMessages.common.success };

      } else {
        responseData = { statusCode: responseCodes.codeSuccess, domain_exists: false, message: responseMessages.common.success };
      }
      /* Log Response */
      logResponse('info', req, responseData, 'Function to check subdomain in the tenant details');
      /* Log Response */

      /* Return the response */
      tenantResponseHandler(res, responseData);

      /* Return the response */
    } else {
      throw new InvalidRequestError(responseMessages.common.fail, responseCodes.codeUnprocessableEntity);
    }
  });

module.exports = { index, store, verifyTenantOtp, resendOTP, subdomainValidate };














