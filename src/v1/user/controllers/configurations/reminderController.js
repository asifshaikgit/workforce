const { check, validationResult } = require('express-validator');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { logRequest, logResponse } = require('../../../../../utils/log');
const { responseHandler } = require('../../../../responseHandler');
const { tryCatch } = require('../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const { pagination } = require('../../../../../config/pagination');
const reminderServices = require('../../services/configurations/reminderServices');
const indexServices = require('../../services/index');
const { regexPatterns } = require('../../../../../constants/regexPatterns');
const moment = require('moment');
const format = require('../../../../../helpers/format');
const WEEKLY = 'weekly';
const BIWEEKLY = 'bi_weekly';
const SEMIMONTHLY = 'semi_monthly';
const MONTHLY = 'monthly';

/**
 * Define validation rules for the reminder configuration request.
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ For update operation, check if the provided IDs exist in the relevant tables.
 *      ~ Add custom validation for specific fields.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the validation rules.
 * 
 * Logic:
 *  - If 'id' is provided in the request body:
 *    + Define update validation rules:
 *      ~ 'reminder_referrable_id' must exist in the 'reminder_referrables' table.
 *      ~ 'reminders.*.id' must exist in the 'reminder_occurances' table for the specified 'reminder_referrable_id'.
 *  - Define common validation rules for all requests:
 *    + 'request_id' is mandatory.
 *    + 'reminder_name_id' must exist in the 'reminder_configurations' table.
 *    + 'referrable_id' must be a number or null.
 *    + 'status' is mandatory and must be a boolean.
 *    + 'content' is mandatory and must be a string.
 *    + 'group_ids' must be an array, and each 'group_ids.*' must exist in the 'groups' table.
 *    + 'employee_ids' must be an array, and each 'employee_ids.*' must exist in the 'employee' table.
 *    + 'reminder_time' is mandatory and must be a valid time.
 *    + 'reminder_date' is mandatory and must be a valid date.
 *    + Custom validations for 'reminders.*' fields.
 *  - Return the combined validation rules.
 * 
 * Notes:
 *  - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @returns {Array} Array of validation rules.
 */
async function validationRules(req) {

  // inserting is_recurring key depending on days
  let reminders = req.body.reminders
  reminders.forEach(reminder => {
    if (reminder.recurring_days != '' && reminder.recurring_days != undefined && reminder.recurring_days != null) {
      reminder.is_recurring = 'true';
    } else {
      reminder.is_recurring = 'false';
    }
  });

  let updateValidationRules = [];
  if (req.params.id) {
    updateValidationRules = [
      check('reminders.*.reminder_referrable_id')
        .trim()
        .escape()
        .custom(async (value) => {
          /** Check whether the id exist is reminder_referrables table */
          if (value != null && value != '' && value != undefined) {
            const reminderOccurance = await indexServices.find('reminder_referrables', ['id'], { id: value });
            if (!reminderOccurance.status) {
              return Promise.reject(
                responseMessages.configurations.reminder.reminderReferrableIdNotExists
              );
            }
          }
          return true
        }),
      check('reminders.*.id')
        .trim()
        .escape()
        .custom(async (value) => {
          /** Check whether the id exist is reminder_referrables table */
          if (value != '' && value != null && value != undefined) {
            var reminderRegex = regexPatterns.numericOnlyRegex;
            if (!reminderRegex.test(value)) {
              return Promise.reject(responseMessages.configurations.reminder.reminderOccuranceIdInvalid);
            }
            const reminderOccurance = await indexServices.find('reminder_occurances', ['id'], { id: value, reminder_referrable_id: req.params.id });
            if (!reminderOccurance.status) {
              return Promise.reject(
                responseMessages.configurations.reminder.reminderOccuranceIdNotExists
              );
            }
          }
        }),
      check('deleted_reminder_occurance_id.*').trim().escape().custom(async (value) => {
        if (value != '' && value != null) {
          var remindOccurData = await indexServices.find('reminder_occurances', ['*'], { id: value })
          if (!remindOccurData.status) {
            return Promise.reject(responseMessages.configurations.reminder.reminderOccuranceIdInvalid);
          }
        }
        return true;
      })
    ];
  }

  const validationRules = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('reminder_name_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.reminder.reminderNameIdRequired)
      .isInt()
      .withMessage(responseMessages.configurations.reminder.reminderNameIdInvalid)
      .custom(async (value) => {
        const reminders = await indexServices.find('reminder_configurations', ['id'], { id: value });
        const reminderData = reminders.status;
        if (!reminderData) {
          return Promise.reject(responseMessages.configurations.reminder.reminderNameIdNotExists);
        } else {
          var reminderExist = await indexServices.find('reminder_referrables', ['id'], { reminder_name_id: value });
          const reminderExistData = reminderExist.status
          if (reminderExistData) {
            if (req.params.id) {
              if (req.params.id != reminderExist.data[0].id) {
                return Promise.reject(responseMessages.configurations.reminder.reminderAlreadyExists);
              }
              return true
            } else {
              return Promise.reject(responseMessages.configurations.reminder.reminderAlreadyExists);
            }
          }
        }
      }),
    check('status')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.reminder.statusRequired)
      .isBoolean() // '1 - Active, 0 - Expired'
      .withMessage(responseMessages.configurations.reminder.statusInvalid),
    check('content')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.reminder.contentRequired)
      .isString()
      .withMessage(responseMessages.configurations.reminder.contentInvalid),
    check('group_ids').isArray().withMessage(responseMessages.configurations.reminder.groupIdsArray),
    check('group_ids.*.id')
      .custom((value) => {
        if (value != '' && value != null && value != undefined) {
          var pattern = regexPatterns.numbersSpaceRegex;
          if (pattern.test(value)) {
            return indexServices.find('groups', ['id'], { id: value, is_active: true }).then((groups) => {
              const groupData = groups.status;
              if (!groupData) {
                return Promise.reject(responseMessages.configurations.reminder.groupIdNotExists);
              }
            })
          } else {
            return Promise.reject(responseMessages.configurations.reminder.groupIdsInvalid);
          }
        }
        return true
      }),
    // check('employee_ids').isArray().withMessage(responseMessages.configurations.reminder.employeeIdsArray),
    // check('employee_ids.*')
    //   .custom((value) => {
    //     if (value != '' && value != null && value != undefined) {
    //       var pattern = regexPatterns.uuidRegex;
    //       if (pattern.test(value)) {
    //         return indexServices.find('employee', ['id'], { id: value, status: 'Active' }).then((employees) => {
    //           const employeeData = employees.status;
    //           if (!employeeData) {
    //             return Promise.reject(responseMessages.configurations.reminder.employeeIdNotExists);
    //           }
    //         })
    //       } else {
    //         return Promise.reject(responseMessages.configurations.reminder.employeeIdsInvalid);
    //       }
    //     }
    //     return true
    //   }),
    // check('reminder_time')
    //   .trim()
    //   .notEmpty()
    //   .withMessage(responseMessages.configurations.reminder.reminderTimeRequired)
    //   .isTime()
    //   .withMessage(responseMessages.configurations.reminder.reminderTimeInvalid),
    // check('reminder_date')
    //   .trim()
    //   .notEmpty()
    //   .withMessage(responseMessages.configurations.reminder.reminderDateRequired)
    //   .isDate()
    //   .withMessage(responseMessages.configurations.reminder.reminderDateInvalid),
    check('reminders.*.occurance_order')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.reminder.occuranceOrderRequired)
      .isIn([1, 2])
      .withMessage(responseMessages.configurations.reminder.occuranceOrderInvalid),
    check('reminders.*.number')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.reminder.numberRequired)
      .isInt()
      .withMessage(responseMessages.configurations.reminder.numberInvalid),
    check('reminders.*.cycle')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.reminder.cycleRequired)
      .isIn(['days', 'weeks', 'months'])
      .withMessage(responseMessages.configurations.reminder.cycleInvalid),
    // check('reminders.*.is_recurring')
    //   .trim()
    //   .escape()
    //   .notEmpty()
    //   .withMessage(responseMessages.configurations.reminder.recurringRequired)
    //   .isBoolean()
    //   .withMessage(responseMessages.configurations.reminder.recurringInvalid),
    check('reminders.*.recurring_days')
      .trim()
      .custom(async (value) => {
        if (value != '' && value != undefined && value != null) {
          var pattern = regexPatterns.numbersSpaceRegex;
          if (!pattern.test(value)) {
            return Promise.reject(responseMessages.configurations.reminder.recurringDaysInvalid);
          }
          return true
        }
        return true
      })
  ];

  return [...updateValidationRules, ...validationRules];
};


/**
 * Create a new reminder configuration.
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to store a new reminder configuration.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log incoming request.
 *  - Retrieve the date format for proper validation and conversion.
 *  - Convert the 'reminder_date' in the request body to the proper date format.
 *  - Define the validation rules using the 'validationRules' function.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the service function to store a new reminder configuration.
 *    + Add a success message to the response.
 *  - Else:
 *    + Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Log the response.
 *  - Return the response using responseHandler().
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

  // let dateFormat = await format.getDateFormat(); // date format

  /* Log Request */
  logRequest('info', req, 'create new reminder configuration store request');
  /* Log Request */

  // // Convert all request date formts to proper date format
  // let modified_date1 = moment(req.body.reminder_date, dateFormat).format('YYYY-MM-DD')
  // req.body.reminder_date = modified_date1

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = await validationRules(req)
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
   *    + Call the store service function
   *        - Based on the status in store function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    let reminders = req.body.reminders;
    let recurringCount = 0;

    for (const reminder of reminders) {
      if (reminder.is_recurring == 'true') {
        recurringCount++;

        if (recurringCount > 1) {
          // Validation fails if is_recurring is true more than once
          throw new InvalidRequestError(responseMessages.configurations.reminder.multipleRecurring);
        }

        if (reminder.recurring_days == undefined || reminder.recurring_days == '' || reminder.recurring_days == null) {
          // Validation fails if recurring_days is missing when is_recurring is true
          throw new InvalidRequestError(responseMessages.configurations.reminder.recurringDaysInvalid);
        }
      }
    }

    var reminder = await reminderServices.store(req.body);
    if (reminder.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.addedSuccessfully,
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeUnprocessableEntity,
        message: responseMessages.common.failedToCreate,
        error: reminder.error
      }
    }

    /* Log Response */
    logResponse('info', req, responseData, 'create new reminder configuration store response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Update an existing reminder configuration.
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Convert and validate the date format in the request body.
 *      ~ Call the service function to update an existing reminder configuration.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log incoming request.
 *  - Retrieve the date format for proper validation and conversion.
 *  - Convert the 'reminder_date' in the request body to the proper date format.
 *  - Define the validation rules using the 'validationRules' function.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the service function to update an existing reminder configuration.
 *    + Add a success message to the response.
 *  - Else:
 *    + Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Log the response.
 *  - Return the response using responseHandler().
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
  logRequest('info', req, 'update reminder configuration request');
  /* Log Request */

  // // Convert all request date formts to proper date format
  // let modified_date1 = moment(req.body.reminder_date, dateFormat).format('YYYY-MM-DD')
  // req.body.reminder_date = modified_date1

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = await validationRules(req)
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
   *    + Call the update service function
   *        - Based on the status in store function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    let reminders = req.body.reminders;
    let recurringCount = 0;

    for (const reminder of reminders) {
      if (reminder.is_recurring == 'true') {
        recurringCount++;

        if (recurringCount > 1) {
          // Validation fails if is_recurring is true more than once
          throw new InvalidRequestError(responseMessages.configurations.reminder.multipleRecurring);
        }

        if (reminder.recurring_days == undefined || reminder.recurring_days == '' || reminder.recurring_days == null) {
          // Validation fails if recurring_days is missing when is_recurring is true
          throw new InvalidRequestError(responseMessages.configurations.reminder.recurringDaysInvalid);
        }
      }
    }

    const condition = { id: req.params.id };
    await reminderServices.update(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
    }

    /* Log Response */
    logResponse('info', req, responseData, 'update reminder configuration response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Update the status of an existing reminder configuration.
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Call the service function to update the status of an existing reminder configuration.
 *      ~ Add a success message to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log incoming request.
 *  - Define the validation rules as follows:
 *    + 'request_id' (body) is mandatory.
 *    + 'id' (body) is mandatory, should be an integer, and must exist in the 'reminder_referrables' table.
 *    + 'status' (body) is mandatory and should be a boolean.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Call the service function to update the status of an existing reminder configuration.
 *    + Add a success message to the response.
 *  - Else:
 *    + Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Log the response.
 *  - Return the response using responseHandler().
 *        
 * Notes:
 *  - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const updateStatus = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update reminder configuration request.');
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
    check('id').trim().escape().notEmpty().withMessage(responseMessages.configurations.reminder.reminderReferrableIdRequired)
      .isInt().withMessage(responseMessages.configurations.reminder.reminderReferrableIdInvalid)
      .custom(async (value) => {
        const data = await indexServices.find('reminder_referrables', ['id'], { id: value });
        const reminderData = data.status;
        if (!reminderData) {
          return Promise.reject(responseMessages.configurations.reminder.reminderReferrableIdNotExists);
        }
      }),
    check('status')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.configurations.reminder.statusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.reminder.statusInvalid),
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
   *    + call the update status service function
   *        - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
  */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    await reminderServices.updateStatus(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'Update reminder configuration Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Retrieve details of a specific reminder configuration.
 * Overview of API:
 *  - Validate the request.
 *    + If successful
 *      ~ Retrieve details of the specified reminder configuration.
 *      ~ Add retrieved data to the response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log incoming request.
 *  - Define the validation rules as follows:
 *    + 'request_id' (body) is mandatory.
 *    + 'id' (body) is mandatory, should be an integer, and must exist in the 'reminder_referrables' table.
 *  - Run the validation rules.
 *  - If validation is successful:
 *    + Retrieve details of the specified reminder configuration.
 *    + Add retrieved data to the response.
 *  - Else:
 *    + Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Log the response.
 *  - Return the response using responseHandler().
 *        
 * Notes:
 *  - Exception handling using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const index = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'index reminder configuration request');
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
    check('referrable_type')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.reminder.referrableTypeRequired)
      .isString().withMessage(responseMessages.configurations.reminder.referrableTypeInvalid)
      .custom(async (value) => {
        const reminder = await indexServices.find('reminder_configurations', ['id'], { referrable_type: value });
        const reminderData = reminder.status;
        if (!reminderData) {
          return Promise.reject(
            responseMessages.configurations.reminder.referrableTypeNotExist);
        }
      })
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
   * + get reminder details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    condition = { 'rc.referrable_type': req.query.referrable_type }
    reminderData = await reminderServices.index(condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.success,
      data: reminderData.data
    };

    /* Log Response */
    logResponse('info', req, responseData, 'reminder index configuration Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

const payrollConfigDates = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'index reminder configuration request');
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
   * + get reminder details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    condition = { 'payroll_config_settings.payroll_cycle_id': req.query.payroll_cycle_id }
    reminderData = await reminderServices.payrollConfigDates(condition);
    if (reminderData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: reminderData.data
      };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.noRecordFound, data: [] }
    }


    /* Log Response */
    logResponse('info', req, responseData, 'reminder index configuration Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

// /**
//  * Retrieve a list of reminder details based on specified conditions.
//  * Overview of API:
//  *  - Validate the request.
//  *    + If successful
//  *      ~ Retrieve a list of reminder details.
//  *      ~ Add retrieved data to the response.
//  *    + Else
//  *      ~ Add error validation to the response.
//  *  - Return the response.
//  * 
//  * Logic:
//  *  - Log incoming request.
//  *  - Check if 'request_id' is provided in the query parameters.
//  *  - If 'request_id' is provided:
//  *    ~ Retrieve a list of reminder details based on specified conditions.
//  *    ~ Add retrieved data to the response.
//  *  - If 'request_id' is not provided:
//  *    ~ Throw an InvalidRequestError with the appropriate message.
//  *  - Prepare the response with status codes.
//  *  - Log the response.
//  *  - Return the response using responseHandler().
//  *        
//  * Notes:
//  *  - Exception handling using try-catch.
//  * 
//  * @param {Request} req - The request object.
//  * @param {Response} res - The response object.
//  * @returns {JSON} JSON
//  * @throws {InvalidRequestError} - If there are validation errors in the request or 'request_id' is not provided.
//  */
// const listing = tryCatch(async (req, res) => {
//   /* Log Request */
//   logRequest('info', req, 'Getting reminder Details request');
//   /* Log Request */

//   /* Default variable */
//   let responseData = [];
//   const requestId = req.query.request_id;
//   /* Default variable */

//   if (requestId !== undefined && requestId !== '') {
//     /* Default variable */
//     const limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
//     const page = (req.query.page) ? (req.query.page) : pagination.page;
//     /* Default variable */

//     /* Writing validation rules to the input request */
//     var condition = { 'reminder_referrables.deleted_at': null }
//     const reminderData = await reminderServices.listing(condition, page, limit);
//     if (!reminderData.status) {
//       responseData = { statusCode: responseCodes.codeSuccess, message: reminderData.message, error: reminderData.error, data: [] };
//     } else {
//       responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: reminderData.data, pagination: reminderData.pagination_data };
//     }


//     /* Log Response */
//     logResponse('info', req, responseData, 'Getting reminder Details Response');
//     /* Log Response */

//     /* Return the response */
//     responseHandler(res, responseData);
//     /* Return the response */
//   } else {
//     throw new InvalidRequestError(responseMessages.common.requestIdRequired);
//   }
// });

// /**
//  * Delete an existing reminder configuration.
//  * Overview of API:
//  *  - Validate the request.
//  *    + If successful
//  *      ~ Delete the specified reminder configuration.
//  *      ~ Add a success message to the response.
//  *    + Else
//  *      ~ Add error validation to the response.
//  *  - Return the response.
//  * 
//  * Logic:
//  *  - Log incoming request.
//  *  - Define the validation rules as follows:
//  *    + 'request_id' (body) is mandatory.
//  *    + 'id' (body) is mandatory, should be an integer, and must exist in the 'reminder_referrables' table.
//  *  - Run the validation rules.
//  *  - If validation is successful:
//  *    + Delete the specified reminder configuration.
//  *    + Add a success message to the response.
//  *  - Else:
//  *    + Add error validation to the response.
//  *  - Prepare the response with status codes.
//  *  - Log the response.
//  *  - Return the response using responseHandler().
//  *        
//  * Notes:
//  *  - Exception handling using try-catch.
//  * 
//  * @param {Request} req - The request object.
//  * @param {Response} res - The response object.
//  * @returns {JSON} JSON
//  * @throws {InvalidRequestError} - If there are validation errors in the request.
//  */
// const destroy = tryCatch(async (req, res) => {
//   /* Log Request */
//   logRequest('info', req, 'Delete reminder configuration request');
//   /* Log Request */

//   /* Default variable */
//   let responseData = [];
//   /* Default variable */

//   /* Writing validation rules to the input request */
//   const validations = [
//     check('request_id')
//       .trim()
//       .escape()
//       .notEmpty()
//       .withMessage(responseMessages.common.requestIdRequired),
//     check('id')
//       .trim()
//       .escape()
//       .notEmpty()
//       .withMessage(responseMessages.configurations.reminder.reminderReferrableIdRequired)
//       .isInt().withMessage(responseMessages.configurations.reminder.reminderReferrableIdInvalid)
//       .custom(async (value) => {
//         const reminder = await indexServices.find('reminder_referrables', ['id'], { id: value });
//         const reminderData = reminder.status;
//         if (!reminderData) {
//           return Promise.reject(
//             responseMessages.configurations.reminder.reminderReferrableIdNotExists);
//         }
//       }),
//   ];
//   /* Writing validation conditions to the input request */

//   /* Run the validation rules. */
//   for (const validation of validations) {
//     const result = await validation.run(req);
//     if (result.errors.length) break;
//   }
//   const errors = validationResult(req);
//   /* Run the validation rules. */

//   /**
//    * If validation is success
//    * + Delete  reminder type details in the collection.
//    * If Validation Fails
//    * + Return the error message.
//    */
//   if (errors.isEmpty()) {
//     const condition = { id: req.params.id };
//     await reminderServices.destroy(req.body, condition);
//     responseData = {
//       statusCode: responseCodes.codeSuccess,
//       message: responseMessages.common.deletedSuccessfully,
//     };

//     /* Log Response */
//     logResponse('info', req, responseData, 'reminder delete configuration Response');
//     /* Log Response */

//     /* Return the response */
//     responseHandler(res, responseData);
//     /* Return the response */
//   } else {
//     throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
//   }
// });

const remindersListing = tryCatch(async (req, res) => {

  // Log Request
  logRequest('info', req, "Getting Reminders listing request");

  // date format
  const dateFormat = await format.getDateFormat();

  var condition = {
    'pay_cycle': null,
    'from_date': null,
    'to_date': null
  };

  // Writing validation rules to the input request
  var validations = [
    check("request_id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('referrable_type')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.reminder.typeRequired)
      .isIn(['timesheet', 'invoice', 'employee', 'expense-management', 'employee_self_service', 'payroll', 'immigration', 'self_reminder'])
      .withMessage(responseMessages.configurations.reminder.typeInvalid)
      .custom(async value => {

        // Get respective cycle id based on the cycle name
        const cycle = await indexServices.find('cycles', ['id'], { 'id': req.query.pay_cycle });

        if (!cycle.status) {
          return Promise.reject(responseMessages.configurations.reminder.invalidTimesheetCycle);
        } else {
          condition.pay_cycle = (cycle?.data[0]?.id) ? cycle?.data[0]?.id : null;
        }

        // Get reminder slug id
        let slug_ids = await indexServices.find('reminder_configurations', ['id'], { 'referrable_type': value });

        slug_ids = slug_ids?.data.map(item => item.id);
        condition.reminder_slugs = slug_ids.toString();
        return true;
      })
  ];

  // validate 'from_date' and 'to_date'
  if (req.query.from_date && req.query.to_date) {
    const from_date = moment(req.query.from_date, dateFormat).format('YYYY-MM-DD');
    const to_date = moment(req.query.to_date, dateFormat).format('YYYY-MM-DD');
    if (regexPatterns.dateRegex.test(from_date) && regexPatterns.dateRegex.test(to_date)) {
      condition.from_date = from_date;
      condition.to_date = to_date;
    } else {
      return Promise.reject(responseMessages.timesheet.dateInvalid);
    }
  }

  // Run the validation rules.
  for (var validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);

  let body = req.query;
  if (errors.isEmpty()) {

    // Default Variable
    let limit = (body.limit) ? (body.limit) : pagination.limit;
    let page = (body.page) ? (body.page) : pagination.page;

    condition.referrable_type = req.params.referrable_type;
    condition.employee_id = req.body.loginUserId;

    var listingData = await reminderServices.remindersListing(condition, dateFormat, page, limit);
    if (!listingData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: listingData.message,
        error: listingData.error,
        message: responseMessages.common.noRecordFound,
        data: []
      }
    } else {
      responseData = {
        statusCode:
          responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: listingData.data,
        pagination: listingData.pagination_data,
        total_ledger_amount: listingData.total_ledger_amount
      };
    }

    // Log Response
    logResponse('info', req, responseData, "Getting Reminders listing Response");

    // Return the response
    responseHandler(res, responseData);


  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Reminder Is Read Status Update.
 * Overview of API:
 * - Validate the request.
 *   + If success
 *     ~ Call the isReadUpdate function to update the reminder status to is_read.
 *     ~ Add success to the response.
 *   + Else
 *     ~ add error validation to the response
 *   - Return the reponse.
 * 
 * Logic:
 * - Logging the incoming request.
 * - Define the validation rules as follows.
 *   + request_id (body) is mandatory.
 *   + id (params) is mandatory, should be uuid, id should exist in reminders table.
 * 
 *  - Prepare the response with status codes.
 *  - Loggig the response.
 *  - Return response using responseHandler()
 * 
 * Notes :
*    - Handling expection using try catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns None
 * @throws {InvalidRequestError} - If the request ID is missing. 
 */
const isRead = tryCatch(async (req, res) => {

  let reminderId;
  // Log Request
  logRequest('info', req, "Update Reminder Is Read Status");

  // Writing validation rules to the input request
  var validations = [
    check("request_id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.reminder.idRequired)
      .isUUID()
      .withMessage(responseMessages.configurations.reminder.idInvalid)
      .custom(async (value) => {

        // Check if it is a valid reminder id or not
        const reminder = await indexServices.find('reminders', ['id'], { id: value });

        if (!reminder.status) {
          return Promise.reject(responseMessages.configurations.reminder.idNotExists);
        }
        reminderId = value;
        return true;
      })
  ];

  // Run the validation rules.
  for (let validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }

  var errors = validationResult(req);

  if (errors.isEmpty()) {

    const isReadUpdate = await reminderServices.isReadUpdate(reminderId);

    if (isReadUpdate.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: isReadUpdate.data?.[0]
      };
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: isReadUpdate.message,
        error: isReadUpdate.error,
        message: responseMessages.common.noRecordFound,
        data: []
      }
    }

    // Log Response
    logResponse("info", req, responseData, "Update reminder is read response");

    // Return the response
    responseHandler(res, responseData);

  } else {

    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    );
  }
});

module.exports = { store, update, index, updateStatus, remindersListing, isRead, payrollConfigDates };
