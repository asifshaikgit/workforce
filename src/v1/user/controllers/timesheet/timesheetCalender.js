const timesheetCalender = require('../../services/timesheet/timesheetCalender')
const { check, validationResult } = require('express-validator')
const { logRequest, logResponse } = require('../../../../../utils/log')
const { responseMessages } = require('../../../../../constants/responseMessage')
const { responseCodes } = require('../../../../../constants/responseCodes')
const { responseHandler } = require('../../../../responseHandler')
const { tryCatch } = require('../../../../../utils/tryCatch')
const { pagination } = require('../../../../../config/pagination')
const InvalidRequestError = require('../../../../../error/InvalidRequestError')
const moment = require('moment')
const indexRepository = require('../../repositories/index');

const indexService = require('../../services/index')
const format = require('../../../../../helpers/format')
const { regexPatterns } = require('../../../../../constants/regexPatterns')
const {
  removeEmptyAndUndefinedKeys
} = require('../../../../../helpers/globalHelper')

/**
 * Retrieves the range-based total view for timesheets based on provided conditions.
 *
 * @param {object} req - The request object containing parameters for retrieving timesheet data.
 * @param {object} res - The response object to be sent back.
 *
 * Logic:
 * - Fetches the date format required for processing from the format module.
 * - Logs the incoming request for getting timesheet list view information.
 * - Initializes the conditions for the timesheet retrieval.
 * - Defines validation rules for the input request parameters.
 * - Validates and formats 'from_date' and 'to_date' based on the date format.
 * - Runs validations for 'request_id' and 'employee_id'.
 * - Validates 'from_date' and 'to_date' against date regex patterns.
 * - Processes input request validations and checks for errors.
 * - If the request passes all validations:
 *   - Removes empty and undefined keys from the request body.
 *   - Sets default values for 'limit' and 'page' if not provided in the request.
 *   - Retrieves timesheet data based on conditions, date format, page, and limit.
 *   - Constructs a response object with the retrieved timesheet data and pagination information.
 *   - Logs the response for the timesheet list view.
 *   - Sends the constructed response using the responseHandler.
 * - If there are validation errors in the request:
 *   - Throws an InvalidRequestError with the validation errors and unprocessable entity code.
 */
const rangeTotalView = tryCatch(async (req, res) => {
  let dateFormat = await format.getDateFormat() // date format

  /* Log Request */
  logRequest('info', req, 'getting timesheet list view information')
  /* Log Request */

  var condition = {
    from_date: null,
    to_date: null
  }

  var validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('employee_id')
      .optional()
    //   .custom(async (value) => {
    //     if (value != null && value != '' && value != undefined) {
    //       if (!Array.isArray(value)) {
    //         return Promise.reject(
    //           responseMessages.timesheet.employeesMustBeInArray
    //         )
    //       }

    //       var pattern = regexPatterns.uuid
    //       if (pattern.test(value)) {
    //         const empData = await indexService.find('employee', ['id'], {
    //           id: value,
    //           status: 'Active'
    //         })
    //         if (!empData.status) {
    //           return Promise.reject(
    //             responseMessages.employee.employeeIdNotExists
    //           )
    //         }
    //         return true
    //       } else {
    //         return Promise.reject(responseMessages.employee.employeeIdInvalid)
    //       }
    //     }
    //     return true
    //   })
  ]

  // validate 'from_date' and 'to_date'
  const from_date = moment(req.body.from_date, dateFormat).format('YYYY-MM-DD')
  const to_date = moment(req.body.to_date, dateFormat).format('YYYY-MM-DD')
  if (
    regexPatterns.dateRegex.test(from_date) &&
    regexPatterns.dateRegex.test(to_date)
  ) {
    condition.from_date = from_date
    condition.to_date = to_date
  } else {
    return Promise.reject(responseMessages.timesheet.dateInvalid)
  }

  // Run the validation rules.
  for (var validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)

  if (errors.isEmpty()) {
    /* Writing validation rules to the input request */
    // if (employee_id != undefined && employee_id != '' && employee_id != []) {
    //     condition.employee_id = (employee_id.map(id => `'${id}'`).join(','))
    // }

    let body = removeEmptyAndUndefinedKeys(req.body)
    /* Default Variable */
    let limit = body.limit ? body.limit : pagination.limit
    let page = body.page ? body.page : pagination.page

    condition.employee_id =
    body.employee_id && body.employee_id.length > 0 ? body.employee_id.toString() : null
    condition.search = (req.body.search && req.body.search != '') ? `${req.body.search}` : null;

    let timesheetData = await timesheetCalender.rangeTotalView(
      condition,
      dateFormat,
      page,
      limit
    )
    if (timesheetData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: timesheetData.data,
        pagination: timesheetData.pagination_data
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: timesheetData.message,
        error: timesheetData.error,
        message: responseMessages.common.noRecordFound,
        data: []
      }
    }

    /* Log Response */
    logResponse('info', req, responseData, 'timesheet list view Response')
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors, responseCodes.codeUnprocessableEntity)
  }
})

/**
 * Retrieves timesheet week view information based on provided conditions.
 *
 * @param {object} req - The request object containing parameters for retrieving timesheet week view data.
 * @param {object} res - The response object to be sent back.
 *
 * Logic:
 * - Fetches the required date format for processing from the format module.
 * - Logs the incoming request for getting timesheet week view information.
 * - Initializes the conditions for timesheet retrieval by week.
 * - Defines validation rules for the input request parameters.
 * - Validates and formats 'from_date' and 'to_date' based on the date format.
 * - Runs validations for 'request_id' and 'employee_id'.
 * - Validates 'from_date' and 'to_date' against date regex patterns.
 * - Processes input request validations and checks for errors.
 * - If the request passes all validations:
 *   - Removes empty and undefined keys from the request body.
 *   - Sets default values for 'limit' and 'page' if not provided in the request.
 *   - Retrieves timesheet data based on conditions, date format, page, and limit.
 *   - Constructs a response object with the retrieved timesheet data and pagination information.
 *   - Logs the response for the timesheet week view.
 *   - Sends the constructed response using the responseHandler.
 * - If there are validation errors in the request:
 *   - Throws an InvalidRequestError with the validation errors and unprocessable entity code.
 */
const WeeksView = tryCatch(async (req, res) => {
  let dateFormat = await format.getDateFormat() // date format

  /* Log Request */
  logRequest('info', req, 'getting timesheet week view information')
  /* Log Request */

  var condition = {
    from_date: null,
    to_date: null
  }

  var validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('employee_id')
      .optional()
    //   .custom(async (value) => {
    //     if (value != null && value != '' && value != undefined) {
    //       if (!Array.isArray(value)) {
    //         return Promise.reject(
    //           responseMessages.timesheet.employeesMustBeInArray
    //         )
    //       }

    //       var pattern = regexPatterns.uuidRegex
    //       if (pattern.test(value)) {
    //         const empData = await indexService.find('employee', ['id'], {
    //           id: value,
    //           status: 'Active'
    //         })
    //         if (!empData.status) {
    //           return Promise.reject(
    //             responseMessages.employee.employeeIdNotExists
    //           )
    //         }
    //         return true
    //       } else {
    //         return Promise.reject(responseMessages.employee.employeeIdInvalid)
    //       }
    //     }
    //     return true
    //   })
  ]

  // validate 'from_date' and 'to_date'
  const from_date = moment(req.body.from_date, dateFormat).format('YYYY-MM-DD')
  const to_date = moment(req.body.to_date, dateFormat).format('YYYY-MM-DD')
  if (
    regexPatterns.dateRegex.test(from_date) &&
    regexPatterns.dateRegex.test(to_date)
  ) {
    condition.from_date = from_date
    condition.to_date = to_date
  } else {
    return Promise.reject(responseMessages.timesheet.dateInvalid)
  }

  // Run the validation rules.
  for (var validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)

  if (errors.isEmpty()) {
    /* Writing validation rules to the input request */
    // if (employee_id != undefined && employee_id != '' && employee_id != []) {
    //     condition.employee_id = (employee_id.map(id => `'${id}'`).join(','))
    // }

    let body = removeEmptyAndUndefinedKeys(req.body)
    /* Default Variable */
    let limit = body.limit ? body.limit : pagination.limit
    let page = body.page ? body.page : pagination.page

    condition.employee_id =
    body.employee_id && body.employee_id.length > 0 ? body.employee_id.toString() : null
    condition.search = (req.body.search && req.body.search != '') ? `${req.body.search}` : null;

    let timesheetData = await timesheetCalender.weekView( condition, dateFormat, page, limit )
    if (timesheetData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: timesheetData.data,
        pagination: timesheetData.pagination_data
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: timesheetData.message,
        error: timesheetData.error,
        message: responseMessages.common.noRecordFound,
        data: []
      }
    }

    /* Log Response */
    logResponse('info', req, responseData, 'timesheet week view Response')
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors, responseCodes.codeUnprocessableEntity)
  }
})

/**
 * Retrieves timesheet information for a specified date range.
 *
 * @param {object} req - The request object containing parameters for retrieving timesheet information.
 * @param {object} res - The response object to be sent back.
 *
 * Logic:
 * - Fetches the required date format for processing from the format module.
 * - Modifies and formats the 'from_date' and 'to_date' parameters in the request to the proper date format.
 * - Logs the incoming request for getting timesheet information for a specific date range.
 * - Initializes default variables and condition objects.
 * - Defines validation rules for the input request parameters, including 'request_id', 'employee_id', 'from_date', and 'to_date'.
 * - Validates 'from_date' and 'to_date' against date regex patterns and checks their validity as dates.
 * - Processes input request validations and checks for errors.
 * - If the request passes all validations:
 *   - Sets the conditions for employee IDs, 'from_date', and 'to_date'.
 *   - Retrieves timesheet data based on specified conditions using the timesheetCalender.calendar function.
 *   - Constructs a response object based on the retrieved timesheet data and the operation status.
 *   - Logs the response for the timesheet calendar view.
 *   - Sends the constructed response using the responseHandler.
 * - If there are validation errors in the request:
 *   - Throws an InvalidRequestError with the validation error message and unprocessable entity code.
 */
const calendarView = tryCatch(async (req, res) => {

    let dateFormat = await format.getDateFormat(); // date format

    // // Convert all request date formts to proper date format
    let modified_date1 = moment(req.body.from_date, dateFormat).format('YYYY-MM-DD')
    req.body.from_date = modified_date1

    let modified_date2 = moment(req.body.to_date, dateFormat).format('YYYY-MM-DD')
    req.body.to_date = modified_date2

    /* Log Request */
    logRequest('info', req, 'getting single Approval Configuaration request');
    /* Log Request */

    /* Default Variable */
    let responseData;
    let from_date = req.body.from_date != '' ? req.body.from_date : '';
    let to_date = req.body.to_date != '' ? req.body.to_date : '';
    let condition = {}
    /* Default Variable */


    const validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('employee_id').isArray().withMessage(responseMessages.timesheet.employeeIDInvalid),
        check('employee_id')
            .isArray({ min: 1 })
            .withMessage(responseMessages.employee.employeeIdRequired)
            .custom(async (value) => {
                for (const id of value) {
                    if (!regexPatterns.uuidRegex.test(id)) {
                        return Promise.reject(responseMessages.timesheet.employeeIDInvalid);
                    } else {
                        var employee = await indexRepository.find('employee', ['id'], { id: id });
                        if (!employee.status) {
                            return Promise.reject(responseMessages.timesheet.employeeIDNotExists);
                        }
                    }
                }
                return true;
            }),
        check('placement_id')
            .custom(async (value) => {
                if (value != '' && value != null) {
                    if (!regexPatterns.uuidRegex.test(value)) {
                        return Promise.reject(responseMessages.timesheet.invalidPlacementID);
                    } else {
                        var placement = await indexRepository.find('placements', ['id'], { id: value })
                        if (!placement.status) {
                            return Promise.reject(responseMessages.timesheet.placementIdDoesNotExist);
                        }
                    }
                } else {
                  return Promise.reject(responseMessages.placement.placementIdRequired);
                }
                return true;
            }),
        check('from_date')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.timesheet.fromToDateRequired)
            .custom(async (value) => {
                let isDate = new Date(value);
                // Invalid date
                if (isNaN(isDate.getTime())) {
                    return Promise.reject(responseMessages.timesheet.fromDateInvalid);
                }
            }),
        check('to_date')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.timesheet.fromToDateRequired)
            .custom(async (value) => {
                let isDate = new Date(value);
                // Invalid date
                if (isNaN(isDate.getTime())) {
                    return Promise.reject(responseMessages.timesheet.toDateInvalid);
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
     *    + Call the store service function
     *        - Based on the status in store function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
     */
    if (errors.isEmpty()) {

        // adding inputs to the condition
        condition.employee_id = (req.body.employee_id && req.body.employee_id.length > 0) ? req.body.employee_id : null
        condition.placement_id = req.body.placement_id ? req.body.placement_id : null
        condition.from_date = from_date
        condition.to_date = to_date

        /* Writing validation rules to the input request */
        let timesheetData = await timesheetCalender.calendar(condition);
        if (!timesheetData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: timesheetData.message, error: timesheetData.error, message: responseMessages.common.noRecordFound, data: [] };
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: timesheetData.data };
        }

        /* Log Response */
        logResponse('info', req, responseData, 'Approval Setting index Response');
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

module.exports = { rangeTotalView, WeeksView , calendarView }
