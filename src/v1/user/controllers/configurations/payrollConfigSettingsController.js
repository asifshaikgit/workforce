const { check, validationResult } = require('express-validator');
const { logRequest, logResponse } = require('../../../../../utils/log');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { responseHandler } = require('../../../../responseHandler');
const { tryCatch } = require('../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const payrollConfigSettingsServices = require('../../services/configurations/payrollConfigSettingsServices');
const indexServices = require('../../services/index');
const { pagination } = require('../../../../../config/pagination');
const moment = require('moment');
const format = require('../../../../../helpers/format');

/**
 * Store function to create a new payroll configuration settings.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the store service function to create a new payroll configuration settings.
 *      ~ Prepare the response with a success message.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 *  - Retrieve the organization date format using `format.getDateFormat()`.
 *  - Log the incoming request.
 *  - Set default variables for `responseData`.
 *  - Convert and format dates in the input request:
 *    + Convert 'from_date' in the request to 'YYYY-MM-DD' format using Moment.js and update the request.
 *    + Convert 'to_date' in the request to 'YYYY-MM-DD' format using Moment.js and update the request.
 *    + Convert 'check_date' in the request to 'YYYY-MM-DD' format using Moment.js and update the request.
 *    + Convert 'actual_check_date' in the request to 'YYYY-MM-DD' format using Moment.js and update the request.
 *    + Convert 'second_from_date' to 'YYYY-MM-DD' format using Moment.js if not empty and update the request.
 *    + Convert 'second_to_date' to 'YYYY-MM-DD' format using Moment.js if not empty and update the request.
 *    + Convert 'second_check_date' to 'YYYY-MM-DD' format using Moment.js if not empty and update the request.
 *    + Convert 'second_actual_check_date' to 'YYYY-MM-DD' format using Moment.js if not empty and update the request.
 *
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'name' (body) must not be empty, should not contain special characters,
 *      - Check if name already exists in the 'payroll_config_settings' table.
 *      - If it exists, return an error with the message 'Payroll config settings name must be unique'.
 *    + 'payroll_cycle_id' (body) must not be empty, should be an integer.
 *      - Check it should exist in the 'cycles' table.
 *      - If not exists, return an error with the message 'payroll cycle id does not exist'.
 *    + 'from_date' (body) must not be empty, should be a valid date.
 *    + 'to_date' (body) must not be empty, should be a valid date.
 *      - Must match the corresponding date from 'payrollConfigSettingsServices.date' result.
 *      - If it does not match, return an error with the message 'to date is Invalid'.
 *    + 'check_date' (body) must not be empty, should be a valid date.
 *      - Check it should not be before 'to_date'.
 *    + 'actual_check_date' (body) must not be empty, should be a valid date.
 *      - Check it should not be before 'to_date'.
 *      - If 'actual_check_date' is a Saturday or Sunday:
 *        ~ Subtract 1 or 2 days, respectively.
 *      - Must match 'check_date'.
 *    + Additional validations for specific conditions (if 'payroll_cycle_id' is equal to 3):
 *      + 'second_from_date' (body) must not be empty, should be a valid date.
 *        - Check it must be equal to 'to_date' + 1 day.
 *      + 'second_to_date' (body) must not be empty, should be a valid date.
 *        - Check it must match the corresponding date from 'payrollConfigSettingsServices.date' result.
 *      + 'second_check_date' (body) must not be empty, should be a valid date.
 *      + 'second_actual_check_date' (body) must not be empty, should be a valid date.
 *        - Check it should not be before 'second_to_date'.
 *        - If 'second_actual_check_date' is a Saturday or Sunday:
 *          ~ Subtract 1 or 2 days, respectively.
 *        - Must match 'second_check_date'.
 *
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `store` service function to create a new payroll configuration settings.
 *    + Prepare the response with a success message.
 * - If validation fails:
 *    + Add error validation to the response.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 *
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const store = tryCatch(async (req, res) => {
  let dateFormat = await format.getDateFormat(); // date format

  /* Log Request */
  logRequest('info', req, 'create a payroll config settings request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  // Convert all request date formts to proper date format
  let modified_date1 = moment(req.body.from_date, dateFormat).format('YYYY-MM-DD')
  req.body.from_date = modified_date1

  let modified_date2 = moment(req.body.to_date, dateFormat).format('YYYY-MM-DD')
  req.body.to_date = modified_date2

  let modified_date3 = moment(req.body.check_date, dateFormat).format('YYYY-MM-DD')
  req.body.check_date = modified_date3

  let modified_date4 = moment(req.body.actual_check_date, dateFormat).format('YYYY-MM-DD')
  req.body.actual_check_date = modified_date4

  let modified_date5 = req.body.second_from_date != '' ? moment(req.body.second_from_date, dateFormat).format('YYYY-MM-DD') : ''
  req.body.second_from_date = modified_date5

  let modified_date6 = req.body.second_to_date != '' ? moment(req.body.second_to_date, dateFormat).format('YYYY-MM-DD') : ''
  req.body.second_to_date = modified_date6

  let modified_date7 = req.body.second_check_date != '' ? moment(req.body.second_check_date, dateFormat).format('YYYY-MM-DD') : ''
  req.body.second_check_date = modified_date7

  let modified_date8 = req.body.second_actual_check_date != '' ? moment(req.body.second_actual_check_date, dateFormat).format('YYYY-MM-DD') : ''
  req.body.second_actual_check_date = modified_date8

  /* Writing validation conditions to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('name')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.nameRequired)
      .custom(async (value) => {
        const configData = await indexServices.find('payroll_config_settings', ['id'], { name: value }, null, [], null, null, null, false);
        const configStatus = configData.status;
        if (configStatus) {
          return Promise.reject(responseMessages.configurations.payrollConfigurations.nameUnique);
        }
      }),
    check('payroll_cycle_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.payrollTypeIdRequired)
      .isInt()
      .withMessage(responseMessages.configurations.payrollConfigurations.payrollTypeIdInvalid)
      .custom(async (value) => {
        const cycleData = await indexServices.find('cycles', ['id'], { id: value });
        const cycleStatus = cycleData.status;
        if (!cycleStatus) {
          return Promise.reject(responseMessages.configurations.payrollConfigurations.payrollTypeIdNotExist);
        }
      }),
    check('from_date')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.fromDateRequired)
      .isDate()
      .withMessage(responseMessages.configurations.payrollConfigurations.fromDateInvalid),
    check('to_date')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.toDateRequired)
      .isDate()
      .withMessage(responseMessages.configurations.payrollConfigurations.toDateInvalid)
      .custom((value) => {
        return payrollConfigSettingsServices.date(req.body).then((newDate) => {
          if (newDate.toDate !== value) {
            return Promise.reject(responseMessages.configurations.payrollConfigurations.toDateInvalid);
          }
          return true
        });
      }),
    check('check_date')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.checkDateRequired)
      .isDate()
      .withMessage(responseMessages.configurations.payrollConfigurations.checkDateInvalid)
      .custom((value) => {
        if (moment(value).isBefore(req.body.to_date)) {
          return Promise.reject(responseMessages.configurations.payrollConfigurations.checkDateInvalid);
        } else {
          return true;
        }
      }),
    check('actual_check_date')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.actualCheckDateRequired)
      .isDate()
      .withMessage(responseMessages.configurations.payrollConfigurations.actualCheckDateInvalid)
      .custom((value) => {
        const momentValue = moment(value);
        const toDate = moment(req.body.to_date);
        if (momentValue.isBefore(toDate)) {
          return Promise.reject(responseMessages.configurations.payrollConfigurations.actualCheckDateInvalid);
        } else {
          const dayOfWeek = momentValue.day();
          if (dayOfWeek === 6) { // Saturday
            momentValue.subtract(1, 'day');
          } else if (dayOfWeek === 0) { // Sunday
            momentValue.subtract(2, 'days');
          }
          if (momentValue.format('YYYY-MM-DD') !== req.body.check_date) {
            return Promise.reject(responseMessages.configurations.payrollConfigurations.actualCheckDateInvalid);
          }
          return true;
        }
      }),
    check('second_from_date')
      .trim()
      .escape()
      .if((value, { req }) => req.body.payroll_cycle_id == 3)
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.secondFromDateRequired)
      .isDate()
      .withMessage(responseMessages.configurations.payrollConfigurations.secondFromDateInvalid)
      .custom((value) => {
        if (moment(value).format('YYYY-MM-DD') !== moment(req.body.to_date).add(1, 'days').format('YYYY-MM-DD')) {
          return Promise.reject(responseMessages.configurations.payrollConfigurations.secondFromDateInvalid);
        } else {
          return true;
        }
      }),
    check('second_to_date')
      .trim()
      .escape()
      .if((value, { req }) => req.body.payroll_cycle_id == 3)
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.secondToDateRequired)
      .isDate()
      .withMessage(responseMessages.configurations.payrollConfigurations.secondToDateInvalid)
      .custom((value) => {
        return payrollConfigSettingsServices.date(req.body).then((newDate) => {
          if (moment(newDate.secondToDate).format('YYYY-MM-DD') !== moment(req.body.second_to_date).format('YYYY-MM-DD')) {
            return Promise.reject(responseMessages.configurations.payrollConfigurations.secondToDateInvalid);
          } else {
            return true;
          }
        });
      }),
    check('second_check_date')
      .trim()
      .escape()
      .if((value, { req }) => req.body.payroll_cycle_id == 3) // Monthly cycle
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.secondCheckDateRequired)
      .isDate()
      .withMessage(responseMessages.configurations.payrollConfigurations.secondCheckDateInvalid),
    check('second_actual_check_date')
      .trim()
      .escape()
      .if((value, { req }) => req.body.payroll_cycle_id == 3) // Monthly cycle
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.secondActualCheckDateRequired)
      .isDate()
      .withMessage(responseMessages.configurations.payrollConfigurations.secondActualCheckDateInvalid)
      .custom((value) => {
        const momentValue = moment(value);
        const toDate = moment(req.body.second_to_date);

        if (momentValue.isBefore(toDate)) {
          return Promise.reject(responseMessages.configurations.payrollConfigurations.secondActualCheckDateInvalid);
        } else {
          const dayOfWeek = momentValue.day();

          if (dayOfWeek === 6) { // Saturday
            momentValue.subtract(1, 'day');
          } else if (dayOfWeek === 0) { // Sunday
            momentValue.subtract(2, 'days');
          }

          if (momentValue.format('YYYY-MM-DD') !== req.body.second_check_date) {
            return Promise.reject(responseMessages.configurations.payrollConfigurations.secondActualCheckDateInvalid);
          }
          return true;
        }
      }),
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
   *    + call the create service function
   *        - Based on the status in create function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
  */
  if (errors.isEmpty()) {
    await payrollConfigSettingsServices.store(req.body);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.addedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'create a payroll config settings Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Update function to update a payroll configuration settings.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the `update` service function to update the payroll configuration settings.
 *      ~ Prepare the response with a success message.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 *  - Retrieve the organization date format using `format.getDateFormat()`.
 *  - Log the incoming request.
 *  - Set default variables for `responseData`.
 *  - Convert and format dates in the input request (similar to the `store` function).
 *
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'id' (params) must not be empty, it must be exists in 'payroll_config_settings' table
 *    + 'name' (body) must not be empty, should not contain special characters,
 *      - Check if name already exists in the 'payroll_config_settings' table excluding current id recored.
 *      - If it exists, return an error with the message 'Payroll config settings name must be unique'.
 *    + 'payroll_cycle_id' (body) must not be empty, should be an integer.
 *      - Check it should exist in the 'cycles' table.
 *      - If not exists, return an error with the message 'payroll cycle id does not exist'.
 *    + 'from_date' (body) must not be empty, should be a valid date.
 *    + 'to_date' (body) must not be empty, should be a valid date.
 *      - Must match the corresponding date from 'payrollConfigSettingsServices.date' result.
 *      - If it does not match, return an error with the message 'to date is Invalid'.
 *    + 'check_date' (body) must not be empty, should be a valid date.
 *      - Check it should not be before 'to_date'.
 *    + 'actual_check_date' (body) must not be empty, should be a valid date.
 *      - Check it should not be before 'to_date'.
 *      - If 'actual_check_date' is a Saturday or Sunday:
 *        ~ Subtract 1 or 2 days, respectively.
 *      - Must match 'check_date'.
 *    + Additional validations for specific conditions (if 'payroll_cycle_id' is equal to 3):
 *      + 'second_from_date' (body) must not be empty, should be a valid date.
 *        - Check it must be equal to 'to_date' + 1 day.
 *      + 'second_to_date' (body) must not be empty, should be a valid date.
 *        - Check it must match the corresponding date from 'payrollConfigSettingsServices.date' result.
 *      + 'second_check_date' (body) must not be empty, should be a valid date.
 *      + 'second_actual_check_date' (body) must not be empty, should be a valid date.
 *        - Check it should not be before 'second_to_date'.
 *        - If 'second_actual_check_date' is a Saturday or Sunday:
 *          ~ Subtract 1 or 2 days, respectively.
 *        - Must match 'second_check_date'.
 *
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `update` service function to update a payroll configuration setting.
 *    + Prepare the response with a success message.
 * - If validation fails:
 *    + Add error validation to the response.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 *
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
  let dateFormat = await format.getDateFormat(); // date format

  /* Log Request */
  logRequest('info', req, 'update a payroll config request request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  // Convert all request date formts to proper date format
  let modified_date1 = moment(req.body.from_date, dateFormat).format('YYYY-MM-DD')
  req.body.from_date = modified_date1

  let modified_date2 = moment(req.body.to_date, dateFormat).format('YYYY-MM-DD')
  req.body.to_date = modified_date2

  let modified_date3 = moment(req.body.check_date, dateFormat).format('YYYY-MM-DD')
  req.body.check_date = modified_date3

  let modified_date4 = moment(req.body.actual_check_date, dateFormat).format('YYYY-MM-DD')
  req.body.actual_check_date = modified_date4

  let modified_date5 = req.body.second_from_date != '' ? moment(req.body.second_from_date, dateFormat).format('YYYY-MM-DD') : ''
  req.body.second_from_date = modified_date5

  let modified_date6 = req.body.second_to_date != '' ? moment(req.body.second_to_date, dateFormat).format('YYYY-MM-DD') : ''
  req.body.second_to_date = modified_date6

  let modified_date7 = req.body.second_check_date != '' ? moment(req.body.second_check_date, dateFormat).format('YYYY-MM-DD') : ''
  req.body.second_check_date = modified_date7

  let modified_date8 = req.body.second_actual_check_date != '' ? moment(req.body.second_actual_check_date, dateFormat).format('YYYY-MM-DD') : ''
  req.body.second_actual_check_date = modified_date8

  /* Writing validation conditions to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('name')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.nameRequired)
      .custom(async (value) => {
        const configData = await indexServices.find('payroll_config_settings', ['id'], { name: value }, null, [], null, null, null, false);
        const configStatus = configData.status;
        if (configStatus) {
          if (configData.data[0].id != req.params.id) {
            return Promise.reject(responseMessages.configurations.payrollConfigurations.nameUnique);
          }
        }
      }),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.payrollConfigSettingIdRequired)
      .isInt()
      .withMessage(responseMessages.configurations.payrollConfigurations.payrollConfigSettingIdInvalid)
      .custom(async (value) => {
        const configData = await indexServices.find('payroll_config_settings', ['id'], { id: value }, null, [], null, null, null, false);
        const configStatus = configData.status;
        if (!configStatus) {
          return Promise.reject(responseMessages.configurations.payrollConfigurations.payrollConfigSettingIdNotExist);
        }
      }),
    check('payroll_cycle_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.payrollTypeIdRequired)
      .isInt()
      .withMessage(responseMessages.configurations.payrollConfigurations.payrollTypeIdInvalid)
      .custom(async (value) => {
        const cycleData = await indexServices.find('cycles', ['id'], { id: value });
        const cycleStatus = cycleData.status;
        if (!cycleStatus) {
          return Promise.reject(responseMessages.configurations.payrollConfigurations.payrollTypeIdNotExist);
        }
      }),
    check('from_date')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.fromDateRequired)
      .isDate()
      .withMessage(responseMessages.configurations.payrollConfigurations.fromDateInvalid),
    check('to_date')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.toDateRequired)
      .isDate()
      .withMessage(responseMessages.configurations.payrollConfigurations.toDateInvalid)
      .custom((value) => {
        return payrollConfigSettingsServices.date(req.body).then((newDate) => {
          if (newDate.toDate !== value) {
            return Promise.reject(responseMessages.configurations.payrollConfigurations.toDateInvalid);
          }
        });
      }),
    check('check_date')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.checkDateRequired)
      .isDate()
      .withMessage(responseMessages.configurations.payrollConfigurations.checkDateInvalid)
      .custom((value) => {
        if (moment(value).isBefore(req.body.to_date)) {
          return Promise.reject(responseMessages.configurations.payrollConfigurations.checkDateInvalid);
        } else {
          return true;
        }
      }),
    check('actual_check_date')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.actualCheckDateRequired)
      .isDate()
      .withMessage(responseMessages.configurations.payrollConfigurations.actualCheckDateInvalid)
      .custom((value) => {
        const momentValue = moment(value);
        const toDate = moment(req.body.to_date);
        if (momentValue.isBefore(toDate)) {
          return Promise.reject(responseMessages.configurations.payrollConfigurations.actualCheckDateInvalid);
        } else {
          const dayOfWeek = momentValue.day();
          if (dayOfWeek === 6) { // Saturday
            momentValue.subtract(1, 'day');
          } else if (dayOfWeek === 0) { // Sunday
            momentValue.subtract(2, 'days');
          }
          if (momentValue.format('YYYY-MM-DD') !== req.body.check_date) {
            return Promise.reject(responseMessages.configurations.payrollConfigurations.actualCheckDateInvalid);
          }
          return true;
        }
      }),
    check('second_from_date')
      .trim()
      .escape()
      .if((value, { req }) => req.body.payroll_cycle_id == 3)
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.secondFromDateRequired)
      .isDate()
      .withMessage(responseMessages.configurations.payrollConfigurations.secondFromDateInvalid)
      .custom((value) => {
        if (moment(value).format('YYYY-MM-DD') !== moment(req.body.to_date).add(1, 'days').format('YYYY-MM-DD')) {
          return Promise.reject(responseMessages.configurations.payrollConfigurations.secondFromDateInvalid);
        } else {
          return true;
        }
      }),
    check('second_to_date')
      .trim()
      .escape()
      .if((value, { req }) => req.body.payroll_cycle_id == 3)
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.secondToDateRequired)
      .isDate()
      .withMessage(responseMessages.configurations.payrollConfigurations.secondToDateInvalid)
      .custom((value) => {
        return payrollConfigSettingsServices.date(req.body).then((newDate) => {
          if (moment(newDate.secondToDate).format('YYYY-MM-DD') !== moment(req.body.second_to_date).format('YYYY-MM-DD')) {
            return Promise.reject(responseMessages.configurations.payrollConfigurations.secondToDateInvalid);
          } else {
            return true;
          }
        });
      }),
    check('second_check_date')
      .trim()
      .escape()
      .if((value, { req }) => req.body.payroll_cycle_id == 3) // Monthly Cycle
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.secondCheckDateRequired)
      .isDate()
      .withMessage(responseMessages.configurations.payrollConfigurations.secondCheckDateInvalid),
    check('second_actual_check_date')
      .trim()
      .escape()
      .if((value, { req }) => req.body.payroll_cycle_id == 3)  // Monthly Cycle
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.secondActualCheckDateRequired)
      .isDate()
      .withMessage(responseMessages.configurations.payrollConfigurations.secondActualCheckDateInvalid)
      .custom((value) => {
        const momentValue = moment(value);
        const toDate = moment(req.body.second_to_date);

        if (momentValue.isBefore(toDate)) {
          return Promise.reject(responseMessages.configurations.payrollConfigurations.secondActualCheckDateInvalid);
        } else {
          const dayOfWeek = momentValue.day();

          if (dayOfWeek === 6) { // Saturday
            momentValue.subtract(1, 'day');
          } else if (dayOfWeek === 0) { // Sunday
            momentValue.subtract(2, 'days');
          }

          if (momentValue.format('YYYY-MM-DD') !== req.body.second_check_date) {
            return Promise.reject(responseMessages.configurations.payrollConfigurations.secondActualCheckDateInvalid);
          }
          return true;
        }
      }),
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
   *    + call the create service function
   *        - Based on the status in create function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
  */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
     var payrollSettingsData = await payrollConfigSettingsServices.update(req.body, condition);
    if(payrollSettingsData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        error: payrollSettingsData.error,
        message: responseMessages.common.noRecordFound,
        data: []
    }
    }

    /* Log Response */
    logResponse('info', req, responseData, 'update a payroll config setting Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Handles the request to get Payroll Configuration details.
 * 
 * Overview of API:
 *  - Validate the request, ensuring the presence of a request ID.
 *    + If successful
 *      ~ Extract optional query parameters such as 'limit' and 'page'.
 *      ~ Call the service function to fetch a list of Payroll Configurations with optional pagination.
 *      ~ Prepare the response with the fetched data and optional pagination details.
 *    + Else
 *      ~ Add an error message to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set default variables for the response data, including 'limit' and 'page'.
 *  - Check the presence of 'request_id' and assign it to 'requestId'.
 *  - If 'requestId' is provided and not empty:
 *    + Extract optional query parameters: 'limit' and 'page'.
 *    + Call the 'listing' function from the 'payrollConfigSettingsServices' service to fetch the list of Payroll Configurations.
 *    + If data exists:
 *      ~ Prepare a response with the status true, fetched data, including optional pagination details.
 *    + If data doesn't exist, 
 *      ~ Add an error message to the response.
 *    + Log the response.
 *    + Return the response using 'responseHandler'.
 *  - If 'requestId' is missing or empty, 
 *     + Throw an 'InvalidRequestError' with a message indicating the 'requestId' is required.
 * Notes:
 * - Exception handling using try-catch.
 * 
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If the 'requestId' is missing or empty.
 */
const listing = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting payroll configuration request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  const requestId = req.query.request_id;
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    /* Default variable */
    const limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
    const page = (req.query.page) ? (req.query.page) : pagination.page;
    /* Default variable */

    /* Writing validation rules to the input request */
    const payrollData = await payrollConfigSettingsServices.listing(page, limit);
    if (!payrollData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: payrollData.message, error: payrollData.error, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: payrollData.data, pagination: payrollData.pagination_data };
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Getting payroll configuration Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * Handles the request to get Payroll Configuration Setting details by ID.
 * 
 * Overview of API:
 *  - Validate the request by checking for 'request_id' and 'payroll_config_settings_id'.
 *    + If successful
 *      ~ Call the service function to fetch Payroll Configuration Setting data by ID.
 *      ~ Prepare the response with the fetched data.
 *    + Else
 *      ~ Return an error message with details.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set default variables for the response data.
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'payroll_config_settings_id' (query) must not be empty, it must be exists in 'payroll_config_settings' table
 *  - Run the validation rules on the request and check for errors.
 *  - If validation is successful:
 *    + Create condition object, which contain Payroll Configuration Setting Id(req.query.payroll_config_settings_id)
 *    + Call the 'index' function from the 'payrollConfigSettingsServices' service to fetch Payroll Configuration Setting data from 'payroll_config_settings' table.
 *    + Prepare a response with the status true, fetched data, and additional details.
 *    + Log the response.
 *    + Return the response using 'responseHandler'.
 *  - Else:
 *    + throw an 'InvalidRequestError' with the appropriate error message and status code.
 * Notes:
 * - Exception handling using try-catch.
 * 
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If validation fails, with an error message and status code.
 */
const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'getting payroll config setting index request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('payroll_config_settings_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.payrollConfigurations.payrollConfigSettingIdRequired)
      .isInt()
      .withMessage(responseMessages.configurations.payrollConfigurations.payrollConfigSettingIdInvalid)
      .custom(async (value) => {
        const configData = await indexServices.find('payroll_config_settings', ['id'], { id: value }, null, [], null, null, null, false);
        const configStatus = configData.status;
        if (!configStatus) {
          return Promise.reject(responseMessages.configurations.payrollConfigurations.payrollConfigSettingIdNotExist);
        }
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
     *    + call the update service function
     *    - Based on the status in update function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
    */
  if (errors.isEmpty()) {
    const condition = { id: req.query.payroll_config_settings_id };
    const payrollData = await payrollConfigSettingsServices.index(condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, setting_data: payrollData.setting_data, data: payrollData.config_data, edit_from_date: payrollData.edit_from_date };

    /* Log Response */
    logResponse('info', req, responseData, 'payroll config setting index Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Handles the request to get previous run payrolls for Payroll Configuration Setting.
 * 
 * Overview of API:
 *  - Validate the request by checking for 'request_id'.
 *    + If successful
 *      ~ Extract optional query parameters such as 'limit' and 'page'.
 *      ~ Call the service function to fetch previous run payrolls for the Payroll Configuration Setting.
 *      ~ Prepare the response with the fetched data and optional pagination details.
 *    + Else
 *      ~ Return an error message with details.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set default variables for the response data, including 'limit' and 'page'.
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *  - Run the validation rules on the request and check for errors.
 *  - If validation is successful:
 *    + Create a condition object, which can include filters based on the request.
 *    + Call the 'previous' function from the 'payrollConfigSettingsServices' service to fetch previous run payrolls.
 *    + If data exists:
 *      ~ Prepare a response with the status true, fetched data, and optional pagination details.
 *    + Else:
 *      ~ Prepare a response with the status false, empty data, and error message.
 *    + Log the response.
 *    + Return the response using 'responseHandler'.
 *  - If validation fails, throw an 'InvalidRequestError' with the appropriate error message and status code.
 * Notes:
 * - Exception handling using try-catch.
 * 
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If validation fails, with an error message and status code.
 */
const previous = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'getting payroll config setting previous run payrolls request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  const limit = (req.body.limit) ? (req.body.limit) : pagination.limit;
  const page = (req.body.page) ? (req.body.page) : pagination.page;
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
     *    + call the update service function
     *    - Based on the status in update function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
    */
  if (errors.isEmpty()) {
    const condition = { status: 'Yet to generate' };
    const payrollData = await payrollConfigSettingsServices.previous(condition, page, limit);

    if (!payrollData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, error: payrollData.error, message: responseMessages.common.noRecordFound, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: payrollData.data, pagination: payrollData.pagination_data };
    }
    /* Log Response */
    logResponse('info', req, responseData, 'payroll config setting previous run payrolls Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Handles the request to get payroll list information.
 * 
 * Overview of API:
 *  - Validate the request by checking for 'request_id'.
 *    + If successful
 *      ~ Extract optional query parameters such as 'limit', 'page', and 'status'.
 *      ~ Fetch the date format by calling 'await format.getDateFormat()' and store it in the 'dateFormat' variable.
 *      ~ Call the service function to fetch payroll list information based on the provided condition, page, and limit.
 *      ~ Prepare the response with the fetched data and optional pagination details.
 *    + Else
 *      ~ Return an error message with details.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set default variables for the response data.
 *  - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'status' (query), optional, must be one of [1, 2, 3, 4].
 *  - Run the validation rules on the request and check for errors.
 *  - If validation is successful:
 *    + Fetch the date format using 'await format.getDateFormat()' and store it in the 'dateFormat' variable.
 *    + Create default variables for 'limit' and 'page', extracting them from the request query if available.
 *    + Create a condition object, setting the 'status' filter if provided.
 *    + Call the 'payrollList' function from the 'payrollConfigSettingsServices' service to fetch payroll list information.
 *    + If data exists:
 *      ~ Prepare a response with the status true, fetched data, and optional pagination details.
 *    + Else:
 *      ~ Prepare a response with the status false, empty data, and error message.
 *    + Log the response.
 *    + Return the response using 'responseHandler'.
 *  - If validation fails, throw an 'InvalidRequestError' with the appropriate error message and status code.
 * Notes:
 * - Exception handling using try-catch.
 * 
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If validation fails, with an error message and status code.
 */
const payrollList = tryCatch(async (req, res) => {
  let dateFormat = await format.getDateFormat(); // date format
  /* Log Request */
  logRequest('info', req, 'getting payroll list info request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  // Writing validation rules to the input request
  var validations = [
    check("request_id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('status')
      .optional()
      .isIn(['Yet to generate', 'Drafted', 'Submitted', 'Skipped']) // 1 is yet to generate, 2 is Draft, 3 is Submit, 4 is Skip
      .withMessage(responseMessages.configurations.payrollConfigurations.statusInvalid)
  ]
  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  /**
   * If validation is success
   *    + Call the payroll list service function
   *        - Based on the status in createTenant function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */

  if (errors.isEmpty()) {

    // Default Variable
    let limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
    let page = (req.query.page) ? (req.query.page) : pagination.page;
    let condition = {};

    condition.status = req.query.status || null;
    if(req.query.status == 'Drafted' || req.query.status == 'Yet to generate'){
      var sort_order = 'asc'
    } else {
      var sort_order = 'desc'
    }

    var listingData = await payrollConfigSettingsServices.payrollList(condition, page, limit, dateFormat, sort_order);
    if (!listingData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: listingData.message, error: listingData.error, message: responseMessages.common.noRecordFound, data: [], pagination: listingData.pagination }
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: listingData.data, pagination: listingData.pagination_data };
    }

    /* Log Response */
    logResponse('info', req, responseData, "Getting employee listing Response");
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */

  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    );
  }
});

/**
 * Handles the request to get payroll list information.
 * 
 * Overview of API:
 *  - Validate the request by checking for 'request_id'.
 *    + If successful
 *      ~ Extract optional query parameters such as 'limit', 'page', and 'status'.
 *      ~ Fetch the date format by calling 'await format.getDateFormat()' and store it in the 'dateFormat' variable.
 *      ~ Call the service function to fetch payroll list information based on the provided condition, page, and limit.
 *      ~ Prepare the response with the fetched data and optional pagination details.
 *    + Else
 *      ~ Return an error message with details.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set default variables for the response data.
 *  - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'status' (query), optional, must be one of [1, 2, 3, 4].
 *  - Run the validation rules on the request and check for errors.
 *  - If validation is successful:
 *    + Fetch the date format using 'await format.getDateFormat()' and store it in the 'dateFormat' variable.
 *    + Create default variables for 'limit' and 'page', extracting them from the request query if available.
 *    + Create a condition object, setting the 'status' filter if provided.
 *    + Call the 'payrollList' function from the 'payrollConfigSettingsServices' service to fetch payroll list information.
 *    + If data exists:
 *      ~ Prepare a response with the status true, fetched data, and optional pagination details.
 *    + Else:
 *      ~ Prepare a response with the status false, empty data, and error message.
 *    + Log the response.
 *    + Return the response using 'responseHandler'.
 *  - If validation fails, throw an 'InvalidRequestError' with the appropriate error message and status code.
 * Notes:
 * - Exception handling using try-catch.
 * 
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If validation fails, with an error message and status code.
 */
const upcomingPayrollList = tryCatch(async (req, res) => {

  /* Log Request */
  logRequest('info', req, 'getting upcoming payroll list info request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  // Writing validation rules to the input request
  var validations = [
    check("request_id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired)
  ]
  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  /**
   * If validation is success
   *    + Call the payroll list service function
   *        - Based on the status in createTenant function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */

  if (errors.isEmpty()) {

    // Default Variable
    let limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
    let page = (req.query.page) ? (req.query.page) : pagination.page;

    var listingData = await payrollConfigSettingsServices.upcomingPayrollList(page, limit);
    if (!listingData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: listingData.message, error: listingData.error, message: responseMessages.common.noRecordFound, data: [], pagination: listingData.pagination }
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: listingData.data, pagination: listingData.pagination_data };
    }

    /* Log Response */
    logResponse('info', req, responseData, "Getting employee listing Response");
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */

  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    );
  }
});

/**
 * Handles the request to get payroll dashboard information.
 * 
 * Overview of API:
 *  - Validate the request by checking for 'request_id'.
 *    + If successful
 *      ~ Fetch the date format by calling 'await format.getDateFormat()' and store it in the 'dateFormat' variable.
 *      ~ Call the service function to fetch payroll dashboard information based on the provided date format.
 *      ~ Prepare the response with the fetched data and optional pagination details.
 *    + Else
 *      ~ Return an error message with details.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set default variables for the response data.
 *  - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *  - Run the validation rules on the request and check for errors.
 *  - If validation is successful:
 *    + Fetch the date format using 'await format.getDateFormat()' and store it in the 'dateFormat' variable.
 *    + Call the 'payrollDashboard' function from the 'payrollConfigSettingsServices' service to fetch payroll dashboard information.
 *    + If data exists:
 *      ~ Prepare a response with the status true, fetched data, and optional pagination details.
 *    + Else:
 *      ~ Prepare a response with the status false, empty data, and error message.
 *    + Log the response.
 *    + Return the response using 'responseHandler'.
 *  - If validation fails, throw an 'InvalidRequestError' with the appropriate error message and status code.
 * Notes:
 * - Exception handling using try-catch.
 * 
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If validation fails, with an error message and status code.
 */
const payrollDashboard = tryCatch(async (req, res) => {
  let dateFormat = await format.getDateFormat(); // date format
  /* Log Request */
  logRequest('info', req, 'getting payroll list info request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  // Writing validation rules to the input request
  var validations = [
    check("request_id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired)
  ]
  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  /**
   * If validation is success
   *    + Call the payroll list service function
   *        - Based on the status in createTenant function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */

  if (errors.isEmpty()) {
    var listingData = await payrollConfigSettingsServices.payrollDashboard(dateFormat);
    if (!listingData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: listingData.message, error: listingData.error, message: responseMessages.common.noRecordFound, data: [], pagination: listingData.pagination }
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: listingData.data, pagination: listingData.pagination_data };
    }

    /* Log Response */
    logResponse('info', req, responseData, "Getting employee listing Response");
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */

  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    );
  }
});

/**
 * Handles the request to get a dropdown of payroll configuration settings.
 * 
 * Overview of API:
 *  - Validate the request by checking for 'request_id'.
 *    + If successful
 *      ~ Call the service function to fetch a dropdown of payroll configuration settings.
 *      ~ Prepare the response with the fetched data.
 *    + Else
 *      ~ Return an error message with details.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set default variables for the response data.
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *  - Run the validation rules on the request and check for errors.
 *  - If validation is successful:
 *    + Call the 'find' function from the 'indexServices' service to fetch a dropdown of payroll configuration settings.
 *    + Prepare a response with the status true, fetched data, and a success message.
 *    + Log the response.
 *    + Return the response using 'responseHandler'.
 *  - If validation fails, throw an 'InvalidRequestError' with the appropriate error message and status code.
 * Notes:
 * - Exception handling using try-catch.
 * 
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object for sending a response.
 * @throws {InvalidRequestError} - If validation fails, with an error message and status code.
 */
const dropdown = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'getting payroll config setting dropdown request');
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
     *    + call the update service function
     *    - Based on the status in update function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
    */
  if (errors.isEmpty()) {
    const payrollData = await indexServices.find('payroll_config_settings', ['id', 'name as value'], {}, 0, [], null, null, null, false);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: payrollData.data };

    /* Log Response */
    logResponse('info', req, responseData, 'payroll config setting index Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

module.exports = { store, update, listing, index, previous, payrollList, dropdown, payrollDashboard, upcomingPayrollList };
