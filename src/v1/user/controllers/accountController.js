const { check, validationResult } = require('express-validator');
const accountService = require('../services/accountService');
const tenantService = require('../../tenant/services/tenantService');
const indexService = require('../services/index');
const { responseMessages } = require('../../../../constants/responseMessage');
const { responseCodes, httpCodes } = require('../../../../constants/responseCodes');
const { logRequest, logResponse } = require('../../../../utils/log');
const { responseHandler } = require('../../../responseHandler');
const { tryCatch } = require('../../../../utils/tryCatch');
const InvalidRequestException = require('../../../../error/InvalidRequestError');

/**
 * Change password function
 *
 * @param req object.
 * @param res object.
 * @return Json
 */
const changepassword = tryCatch(async (req, res) => {
  logRequest('info', req, 'Change password request');

  /* Writing validation conditions to the input request */
  const validations = [
    check('request_id').notEmpty().withMessage(responseMessages.common.requestIdRequired).trim().escape(),
    check('confirm_password').trim().notEmpty().withMessage(responseMessages.login.confirmPasswordRequired),
    check('old_password').trim().notEmpty().withMessage(responseMessages.login.oldPasswordRequired),
    check('password').trim().notEmpty().withMessage(responseMessages.login.passwordRequired)
      .isLength({ min: 8, max: 20 }).withMessage(responseMessages.login.passwordInvalid)
      .matches(/(?=.*?[A-Z])/).withMessage(responseMessages.login.passwordInvalid)
      .matches(/(?=.*?[a-z])/).withMessage(responseMessages.login.passwordInvalid)
      .matches(/(?=.*?[0-9])/).withMessage(responseMessages.login.passwordInvalid)
      .matches(/(?=.*?[#?!@$%^&*-])/).withMessage(responseMessages.login.passwordInvalid)
      .not().matches(/^$|\s+/).withMessage(responseMessages.login.passwordInvalid),
    check('confirm_password').equals(req.body.password).withMessage(responseMessages.login.confirmPasswordMismatch),
  ];
  /* Writing validation conditions to the input request */

  /**
  *  Run the validation rules. If validations error occurs return the error message else proceed with next step.
  */
  for (const validation of validations) {
    const result = await validation.run(req);
    if (result.errors.length) break;
  }
  let responseData = [];
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    const serviceResponse = await accountService.changePassword(req.body);
    if (serviceResponse.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success };
      logResponse('info', req, responseData, 'Change password response'); // Log the response
    }
    responseHandler(res, responseData);
  } else {
    throw new InvalidRequestException(errors.array()[0].msg);
  }
});

/**
 * Reset password function
 *
 * @param req object.
 * @param res object.
 * @return Json
 */
const resetpassword = tryCatch(async (req, res) => {
  logRequest('info', req, 'Reset password request');

  /* Writing validation conditions to the input request */
  const validations = [
    check('request_id').notEmpty().withMessage(responseMessages.common.requestIdRequired).trim().escape(),
    check('email_id').notEmpty().withMessage(responseMessages.login.emailIdRequired).trim().escape().isEmail().withMessage(responseMessages.emailIdInvalid).custom((value) => {
      return indexService.find('employee', ['id'], { email_id: value, status: 'Active' }).then((userData) => {
        if (!userData.status) {
          return Promise.reject(responseMessages.login.accountNotFound);
        }
      });
    }),
    check('confirm_password').trim().notEmpty().withMessage(responseMessages.login.confirmPasswordRequired),
    check('password').trim().notEmpty().withMessage(responseMessages.login.passwordRequired)
      .isLength({ min: 8, max: 20 }).withMessage(responseMessages.login.passwordInvalid)
      .matches(/(?=.*?[A-Z])/).withMessage(responseMessages.login.passwordInvalid)
      .matches(/(?=.*?[a-z])/).withMessage(responseMessages.login.passwordInvalid)
      .matches(/(?=.*?[0-9])/).withMessage(responseMessages.login.passwordInvalid)
      .matches(/(?=.*?[#?!@$%^&*-])/).withMessage(responseMessages.login.passwordInvalid)
      .not().matches(/^$|\s+/).withMessage(responseMessages.login.passwordInvalid),
    check('confirm_password').equals(req.body.password).withMessage(responseMessages.login.confirmPasswordMismatch),
  ];
  /* Writing validation conditions to the input request */

  /**
  *  Run the validation rules. If validations error occurs return the error message else proceed with next step.
  */
  for (const validation of validations) {
    const result = await validation.run(req);
    if (result.errors.length) break;
  }
  let responseData = [];
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    const serviceResponse = await accountService.resetPassword(req.body);
    if (serviceResponse.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success };
      logResponse('info', req, responseData, 'Rest password response'); // Log the response
    }
    responseHandler(res, responseData);
  } else {
    throw new InvalidRequestException(errors.array()[0].msg);
  }
});

/**
 * User login check function
 *
 * @param req object.
 * @param res object.
 * @return Json
 */
const login = tryCatch(async (req, res) => {
  logRequest('info', req, 'User login request');
  let responseData = [];

  /* Writing validation conditions to the input request */
  const validations = [
    check('request_id').notEmpty().withMessage(responseMessages.common.requestIdRequired).trim().escape(),
    check('password').notEmpty().withMessage(responseMessages.login.passwordRequired).isLength({ min: 8, max: 20 })
      .withMessage(responseMessages.login.passwordLengthError),
    check('email_id').notEmpty().withMessage(responseMessages.login.emailIdRequired).trim().isEmail().withMessage(responseMessages.login.emailIdInvalid)
      .custom(async (value) => {
        return indexService.find('employee', ['id', 'employment_type_id', 'password'], { email_id: value.toLowerCase(), status: 'Active' }).then((userData) => {
          if (!userData.status) {
            return Promise.reject(responseMessages.login.emailIdInvalid);
          } else {
            const userInfo = userData.data[0];
            if (userInfo.employment_type_id !== 1) {  
              return Promise.reject(responseMessages.login.contractorConsultantNotAllowed);
            } else if (userInfo.password === '' || userInfo.password === null) {
              return Promise.reject(responseMessages.login.passwordExpied);
            }
          }
          return true;
        });
      }),
    check('subdomain_name').trim().escape().notEmpty().withMessage(responseMessages.login.subDomainNameRequired)
      .custom(async (value) => {
        const userData = await tenantService.find({ subdomain_name: value });
        if (!userData.status) {
          return Promise.reject(responseMessages.login.subDomainNameNotExists);
        }
        return true;
      }),
  ];
  /* Writing validation conditions to the input request */

  /**
  *  Run the validation rules. If validations error occurs return the error message else proceed with next step.
  */
  for (const validation of validations) {
    const result = await validation.run(req);
    if (result.errors.length) break;
  }
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    const serviceResponse = await accountService.login(req);
    responseData = { statusCode: responseCodes.codeSuccess, data: serviceResponse.data };
    logResponse('info', req, responseData, 'User login response'); // Log the response
    responseHandler(res, responseData);
  } else {
    throw new InvalidRequestException(errors.array()[0].msg);
  }
});

/**
 * User login check function
 *
 * @param req object.
 * @param res object.
 * @return Json
 */
const forgotPassword = tryCatch(async (req, res) => {
  logRequest('info', req, 'User Forgot Password request');
  let responseData = [];

  /* Writing validation conditions to the input request */
  const validations = [
    check('request_id').notEmpty().withMessage(responseMessages.login.requestId).trim().escape(),
    check('email_id').notEmpty().withMessage(responseMessages.login.emailIdRequired).trim().escape().isEmail().withMessage(responseMessages.emailIdInvalid).custom((value) => {
      return indexService.find('employee', ['id'], { email_id: value, status: 'Active' }).then((userData) => {
        if (!userData.status) {
          return Promise.reject(responseMessages.login.accountNotFound);
        }
      });
    }),
    check('subdomain_name').trim().escape().notEmpty().withMessage(responseMessages.login.subDomainNameRequired)
      .custom(async (value) => {
        const userData = await tenantService.find({ subdomain_name: value });
        if (!userData.status) {
          return Promise.reject(responseMessages.login.subDomainNameNotExists);
        }
      }),
  ];
  /* Writing validation conditions to the input request */

  /**
*  Run the validation rules. If validations error occurs return the error message else proceed with next step.
*/
  for (const validation of validations) {
    const result = await validation.run(req);
    if (result.errors.length) break;
  }

  const errors = validationResult(req);
  if (errors.isEmpty()) {
    const serviceResponse = await accountService.forgotPassword(req.body);
    if (serviceResponse.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success };
      logResponse('info', req, responseData, 'User Forgot Password Response'); // Log the response
      responseHandler(res, responseData);
    }
  } else {
    throw new InvalidRequestException(errors.array()[0].msg);
  }
});

/**
 * User login check function
 *
 * @param req object.
 * @param res object.
 * @return Json
 */
const verifyOtpSendPassword = tryCatch(async (req, res) => {
  logRequest('info', req, 'New Password generation request');

  /* Writing validation conditions to the input request */
  const validations = [
    check('otp')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.login.otpRequired)
      .matches(/^[0-9]{6}$/)
      .withMessage(responseMessages.login.otpError),
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.login.requestId),
    check('email_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.login.emailIdRequired)
      .isEmail()
      .withMessage(responseMessages.login.emailIdInvalid).custom((value) => {
        return indexService.find('employee', ['id'], { email_id: value, status: 'Active' }).then((userData) => {
          if (!userData.status) {
            return Promise.reject(responseMessages.login.accountNotFound);
          }
        });
      }),
    check('subdomain_name').trim().escape().notEmpty().withMessage(responseMessages.login.subDomainNameRequired)
      .custom(async (value) => {
        const userData = await tenantService.find({ subdomain_name: value });
        if (!userData.status) {
          return Promise.reject(responseMessages.login.subDomainNameNotExists);
        }
      }),
  ];
  /* Writing validation conditions to the input request */

  /**
*  Run the validation rules. If validations error occurs return the error message else proceed with next step.
*/
  for (const validation of validations) {
    const result = await validation.run(req);
    if (result.errors.length) break;
  }
  let responseData = [];
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    const serviceResponse = await accountService.verifyOtpSendPassword(req.body);
    if (serviceResponse.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success };
      logResponse('info', req, responseData, 'New Password generation response'); // Log the response
      responseHandler(res, responseData);
    }
  } else {
    throw new InvalidRequestException(errors.array()[0].msg);
  }
});

/**
 * User login check function
 *
 * @param req object.
 * @param res object.
 * @return Json
 */
const logout = tryCatch(async (req, res) => {
  logRequest('info', req, 'logout request');

  /* Writing validation conditions to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.requestId),
    check('login_id')
      .notEmpty()
      .withMessage(responseMessages.login.loginIdRequired)
      .isUUID()
      .withMessage(responseMessages.login.loginIdInvalid)
      .custom(async (value) => {
        const userData = await indexService.find('employee', ['id'], { id: value });
        if (!userData.status) {
          return Promise.reject(responseMessages.login.accountNotFound);
        }
      }),
  ];
  /* Writing validation conditions to the input request */

  /**
*  Run the validation rules. If validations error occurs return the error message else proceed with next step.
*/
  for (const validation of validations) {
    const result = await validation.run(req);
    if (result.errors.length) break;
  }
  let responseData = [];
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    const serviceResponse = await accountService.logout(req.body);
    if (serviceResponse.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success };
      logResponse('info', req, responseData, 'logout response'); // Log the response
    } else {
      responseData = { statusCode: responseCodes.code_internal_error, message: serviceResponse.message, error: serviceResponse.error };
      logResponse('error', req, responseData, 'logout response'); // Log the response
    }
  } else {
    throw new InvalidRequestException(errors.array()[0].msg);
  }
  responseHandler(res, responseData);
});

/**
 * User regenerate password function
 *
 * @param req object.
 * @param res object.
 * @return Json
 */
const regenerateNewPassword = tryCatch(async (req, res) => {
  logRequest('info', req, 'regenerate Password generation request');

  /* Writing validation conditions to the input request */
  const validations = [

    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.login.requestId),
    check('employee_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdRequired)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employee_IdInvalid).custom((value) => {
        return indexService.find('employee', ['id'], { id: value }).then((userData) => {
          if (!userData.status) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotFound);
          }
        });
      }),
  ];
  /* Writing validation conditions to the input request */

  /**
*  Run the validation rules. If validations error occurs return the error message else proceed with next step.
*/
  for (const validation of validations) {
    const result = await validation.run(req);
    if (result.errors.length) break;
  }
  let responseData = [];
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    const serviceResponse = await accountService.regenerateNewPassword(req.body);
    if (serviceResponse.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success };
      logResponse('info', req, responseData, 'regenerate new Password generation response'); // Log the response
      responseHandler(res, responseData);
    }
  } else {
    throw new InvalidRequestException(errors.array()[0].msg);
  }
});

module.exports = { login, forgotPassword, verifyOtpSendPassword, logout, changepassword, resetpassword, regenerateNewPassword };
