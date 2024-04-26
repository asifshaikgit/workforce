const { check, validationResult } = require('express-validator')
const { logRequest, logResponse } = require('../../../../../utils/log')
const { responseMessages } = require('../../../../../constants/responseMessage')
const { responseCodes } = require('../../../../../constants/responseCodes')
const { responseHandler } = require('../../../../responseHandler')
const employeeSkillService = require('../../services/employee/employeeSkillsServices')
const { tryCatch } = require('../../../../../utils/tryCatch')
const InvalidRequestError = require('../../../../../error/InvalidRequestError')
const indexService = require('../../services/index');
const format = require('../../../../../helpers/format');
const moment = require('moment')
const { regexPatterns } = require('../../../../../constants/regexPatterns')


/**
 * Destroy function to delete an Employee Skills record for a specific employee.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Delete the specified Employee Skills record.
 *      ~ Prepare the response with a success message.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should correspond to an existing 'employee' table.
 *      ~ Additionally, get 'display_name' and 'reference_id' of the provided 'employee_id' and map them to the request body as 'employee_name' and 'employee_reference_id'.
 *    + 'id' (params), must not be empty, should be a valid integer, and should correspond to an existing record in the 'employee_skill_details' table.
 *      ~ Additionally, join the 'skills' table based on 'skill_id' to get 'employee_skill_name' and map it to the request body.
 *
 * - Run the validation rules.
 * - If validation is successful:
 *    + Create 'condition' object based on id (req.params.id).
 *    + Call the 'employeeSkillService.destroy' function to delete the employee skills based on the condition (above defined).
 *    + Prepare the response with a success message.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 * - If validation fails:
 *    + Add error validation to the response.
 *
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const destroy = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Delete employee skills request')
  /* Log Request */

  /* Default Variable */
  var responseData = ''
  /* Default Variable */

  /* Writing validation rules to the input request */
  var validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('employee_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async (value) => {
        const employee = await indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: value })
        var employeeData = employee.status
        if (!employeeData) {
          return Promise.reject(
            responseMessages.employee.behalfOnboarding.employeeIdNotExists
          )
        }
        req.body.employee_name = employee.data[0].display_name
        req.body.employee_reference_id = employee.data[0].reference_id
        return true
      }),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.skills.IdRequired)
      .isInt()
      .withMessage(responseMessages.employee.skills.invalidSkillsId)
      .custom(async (value) => {
        const joins = [
          { table: 'skills as skills', alias: 'skills', condition: ['employee_skill_details.skill_id', 'skills.id'], type: 'left' }
        ];
        var employeeSkills = await indexService.find('employee_skill_details', ['employee_skill_details.id', 'employee_skill_details.employee_id', 'skills.name'], { 'employee_skill_details.id': value }, null, joins)
        if (!employeeSkills.status) {
          return Promise.reject(
            responseMessages.employee.skills.skillsIdNotExists
          )
        } else {
          if (employeeSkills.data[0].employee_id != req.body.employee_id) {
            return Promise.reject(
              responseMessages.employee.skills.noMatchingSkillDetails
            )
          }
          req.body.employee_skill_name = employeeSkills.data[0].name
        }
      })
  ]
  /* Writing validation conditions to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  if (errors.isEmpty()) {
    let condition = { id: req.params.id }// condition
    var skills = await employeeSkillService.destroy(req.body, condition)
    if (skills.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.deletedSuccessfully
      }
    }

    /* Log Response */
    logResponse('info', req, responseData, 'employee skills delete Response')
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
});

/**
 * Index function to retrieve a list of Skills Details for a specific employee.
 * 
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Retrieve a list of Skills Details for the specified employee.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'id' (query), must not be empty, should be a valid UUID, and should correspond to an existing 'employee' table.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *    + Create a 'condition' object using id(req.query.id).
 *    + Call the 'employeeSkillService.index' function to get skills details based on the condition (above defined).
 *    + Prepare the response with fetched data.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 * - If validation fails:
 *    + Add error validation to the response.
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
  logRequest('info', req, "getting skills Details index request");
  /* Log Request */

  /* Default Variable */
  var responseData = '';
  /* Default Variable */

  /* Writing validation rules to the input request */
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
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdRequired)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async value => {
        const employeeData = await indexService.find('employee', ['id'], { id: value })
        var status = employeeData.status
        if (!status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
        }
      })
  ]

  /*Run the validation rules. */
  for (var validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);
  /*Run the validation rules. */

  if (errors.isEmpty()) {
    var condition = { 'employee_skill_details.employee_id': req.query.id };
    var skillData = await employeeSkillService.index(condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: skillData.data }

    /* Log Response */
    logResponse("info", req, responseData, "employee skill Details index Response.");
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */

  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity,);
  }
});

/**
 * Store function to modify an employee's skill information.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'employeeSkillService.store' service function to modify the employee's skill information.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules for the input request, including:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table (if not empty).
 *    + 'skill_id' (body), must not be empty, should be an integer, and should exist in 'skills' table.
 *    + 'certification_date' (body), if not empty, must be in a specific date format.
 *    + 'certification_status' (body), if not empty, should be an integer with specific values.
 *    + 'documents.*.new_document_id' (body), if not empty, should be a valid UUID and exist in 'temp_upload_documents'.
 *    + 'experience_years' (body), if provided, must be a positive integer.
 *    + 'expertise' (body), if provided, must contain only alphabetic characters and spaces.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `employeeSkillService.store` service function to store the employee's skill information.
 *    + If successful:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with an error message.
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
  logRequest('info', req, 'Employee skill creation request')
  /* Log Request */

  /* Default Variable */
  var responseData = ''
  /* Default Variable */

  let modified_date = req.body.certification_date != '' ? moment(req.body.certification_date, dateFormat).format('YYYY-MM-DD') : '';
  req.body.certification_date = modified_date // From date format

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('employee_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async value => {
        const employeeData = await indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: value })
        var status = employeeData.status
        if (!status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
        }
        req.body.employee_name = employeeData.data[0].display_name
        req.body.employee_reference_id = employeeData.data[0].reference_id
        return true
      }),
    check('skill_id')
      .trim()
      .escape()
      .custom(async (value) => {
        if (value !== '' && value !== null) {
          let pattern = regexPatterns.numericOnlyRegex
          if (!pattern.test(value)) {
            return Promise.reject(responseMessages.employee.skills.invalidSkillId)
          }
          const skillData = await indexService.find('skills', ['id', 'name'], { id: value })
          var status = skillData.status
          if (!status) {
            return Promise.reject(responseMessages.configurations.skills.IdNotExists)
          }
          req.body.skill_name = skillData.data[0].name
        } else {
          return Promise.reject(responseMessages.configurations.skills.IdRequired)
        }

        return true
      }),
    check('certification')
      .trim()
      .custom(value => {
        if (value != null && value != '') {
          var pattern = regexPatterns.urlValidationRegex
          if (!pattern.test(value)) {
            return Promise.reject(responseMessages.employee.skills.certificationURLInvalid)
          }
        }
        return true
      }),
    check('certification_date')
      .trim()
      .custom(value => {
        if (value != null && value != '') {
          // In Certification Date
          let isDate = new Date(value);
          if (isNaN(isDate.getTime())) {
            return Promise.reject(responseMessages.employee.skills.invalidDate);
          }

          // 'certification_date' should always be past or current date
          if (isDate.getTime() > new Date().getTime()) {
            return Promise.reject(responseMessages.employee.skills.invalidDate);
          }
        }
        return true
      }),
    check('certification_status')
      .trim()
      .escape()
      .custom((value) => {
        if (value != null && value != '' && Number.isInteger(Number(value))) {
          if (!Number(value) === 0 || !Number(value) === 1) {
            return Promise.reject(responseMessages.employee.skills.skillStatusInvalid)
          }
        }
        return true
      }),
    check('documents.*.new_document_id')
      .trim()
      .escape()
      .custom(async (value) => {
        if (value != null && value != '') {
          var pattern = regexPatterns.uuidRegex;
          if (pattern.test(value)) {
            var documentsData = await indexService.find('temp_upload_documents', ['id'], { id: value }, 1, [], null, null, null, false);
            if (!documentsData.status) {
              return Promise.reject(responseMessages.employee.documents.newDocumentIdNotExists)
            }
          } else {
            return Promise.reject(responseMessages.employee.documents.newDocumentIdInvalid)
          }
        }
        return true
      }),
    check('experience_years')
      .trim()
      .custom((value) => {
        if (value !== null && value !== '' && value !== undefined) {
          if (!['1', '2', '3', '4', '5', '6', '7', '8'].includes(value.toString())) {
            return Promise.reject(responseMessages.employee.skills.experienceInvalid);
          }
        }
        return true;
      }),
    check('expertise')
      .trim()
      .custom((value) => {
        if (value !== null && value !== '' && value !== undefined) {
          if (!['Beginner', 'Proficient', 'Expert'].includes(value)) {
            return Promise.reject(responseMessages.employee.skills.expertiseInvalid);
          }
        }
        return true;
      }),
  ]
  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  if (errors.isEmpty()) {
    var employeeSkill = await employeeSkillService.store(req.body)
    if (employeeSkill.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.addedSuccessfully
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong,
        error: employeeSkill.error
      }
    }
    /* Log Response */
    logResponse('info', req, responseData, 'employee skills store response')
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
});

/**
 * Update function to modify an existing employee skill record.
 *
 * Overview of Function:
 * - Validate the request.
 *   - If successful, call the 'update' service function to modify the employee skill record.
 *   - Prepare the response with success data.
 *   - If validation fails, add error validation to the response.
 * - Log the incoming request and the response.
 * - Return the response.
 *
 * Logic:
 * - Retrieve the organization date format using `format.getDateFormat()`.
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Modify the 'certification_date' date to 'YYYY-MM-DD' format using Moment.js and update the request.
 * - Define the validation rules for the input request, including checks for various fields and documents.
 * - Run the validation rules and handle any validation errors.
 * - If validation is successful:
 *    - Create a 'condition' object using the employee skill ID (`req.params.id`).
 *    - Call the 'update' service function to modify the employee skill record.
 *    - If successful, prepare the response with success data.
 *    - If the update operation encounters an error, prepare the response with an error message.
 * - If validation fails, throw an `InvalidRequestError` with the validation error message.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 *
 * Notes:
 * - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */

const update = tryCatch(async (req, res) => {
  let dateFormat = await format.getDateFormat(); // date format

  /* Log Request */
  logRequest('info', req, 'update employee skill request.')
  /* Log Request */

  /* Default Variable */
  var responseData = ''
  /* Default Variable */

  let modified_date = req.body.certification_date != '' ? moment(req.body.certification_date, dateFormat).format('YYYY-MM-DD') : '';
  req.body.certification_date = modified_date // From date format

  /* Writing validation rules to the input request */
  var validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('employee_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async (value) => {
        const employeeData = await indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: value })
        var employee = employeeData.status
        if (!employee) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
        }
        req.body.employee_name = employeeData.data[0].display_name
        req.body.employee_reference_id = employeeData.data[0].reference_id
        return true
      }),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.skills.employeeSkillIdRequired)
      .isInt()
      .withMessage(responseMessages.employee.skills.invalidSkillsId)
      .custom(async (value) => {
        var employeeSkills = await indexService.find('employee_skill_details', ['id', 'employee_id'], { id: value })
        if (!employeeSkills.status) {
          return Promise.reject(responseMessages.employee.skills.skillsIdNotExists)
        } else {
          if (employeeSkills.data[0].employee_id != req.body.employee_id) {
            return Promise.reject(responseMessages.employee.skills.noMatchingSkillDetails)
          }
        }
      }),
    check('skill_id')
      .trim()
      .escape()
      .custom(async (value) => {
        if (value !== '' && value !== null) {
          let pattern = regexPatterns.numericOnlyRegex
          if (!pattern.test(value)) {
            return Promise.reject(responseMessages.employee.skills.invalidSkillId)
          }
          const skills = await indexService.find('skills', ['id', 'name'], { id: value })
          var skillsData = skills.status
          if (!skillsData) {
            return Promise.reject(responseMessages.configurations.skills.IdNotExists)
          }
          req.body.skill_name = skills.data[0].name;
        } else {
          if (!req.body?.clear_all) {
            return Promise.reject(responseMessages.configurations.skills.IdRequired)
          }
        }
        return true
      }),
    check('certification')
      .trim()
      .custom(value => {
        if (value != null && value != '') {
          var pattern = regexPatterns.urlValidationRegex
          if (!pattern.test(value)) {
            return Promise.reject(responseMessages.employee.skills.certificationURLInvalid)
          }
        }
        return true
      }),
    check('certification_date')
      .trim()
      .custom(value => {
        if (value != null && value != '') {
          // In Certification Date
          let isDate = new Date(value);
          if (isNaN(isDate.getTime())) {
            return Promise.reject(responseMessages.employee.skills.invalidDate);
          }

          // 'certification_date' should always be past or current date
          if (isDate.getTime() > new Date().getTime()) {
            return Promise.reject(responseMessages.employee.skills.invalidDate);
          }
        }
        return true
      }),
    check('certification_status')
      .trim()
      .escape()
      .custom((value) => {
        if (value != null && value != '' && Number.isInteger(Number(value))) {
          if (!Number(value) === 0 || !Number(value) === 1) {
            return Promise.reject(responseMessages.employee.skills.skillStatusInvalid)
          }
          else if (!Number.isInteger(Number(value)) && value != null) {
            return Promise.reject(responseMessages.employee.skills.skillStatusInvalid)
          }
        }
        return true
      }),
    check('expertise')
      .trim()
      .custom((value) => {
        if (value !== null && value !== '' && value !== undefined) {
          const regex = regexPatterns.alphaCharactersAndSpacesOnly;
          if (!regex.test(value)) {
            return Promise.reject(responseMessages.employee.skills.expertiseInvalid);
          }
        }
        return true;
      }),
    check('experience_years')
      .trim()
      .custom((value) => {
        if (value !== null && value !== '' && value !== undefined) {
          if (!['1', '2', '3', '4', '5', '6', '7', '8'].includes(value)) {
            return Promise.reject(responseMessages.employee.skills.experienceInvalid);
          }
        }
        return true;
      }),
    check('documents.*.new_document_id')
      .trim()
      .escape()
      .custom(async (value) => {
        if (value != null && value != '') {
          var pattern = regexPatterns.uuidRegex;
          if (pattern.test(value)) {
            return await indexService.find('temp_upload_documents', ['id'], { id: value }, 1, [], null, null, null, false).then((documentsData) => {
              if (documentsData.length === 0) {
                return Promise.reject(responseMessages.employee.documents.newDocumentIdNotExists)
              }
            })
          } else {
            return Promise.reject(responseMessages.employee.documents.newDocumentIdInvalid)
          }
        } else if (value === null || value == '') {
          return true
        }
      }),
    check('documents.*.id')
      .trim()
      .escape()
      .custom(async (value) => {
        if (value != null && value != '') {
          var pattern = regexPatterns.numericOnlyRegex;
          if (pattern.test(value)) {
            var documentsData = await indexService.find('employee_mapped_documents', ['id'], { id: value }, null, [], null, null, null, false)
            if (documentsData.length === 0) {
              return Promise.reject(responseMessages.employee.documents.documenIdNoExists)
            }
            return true
          } else {
            return Promise.reject(responseMessages.employee.documents.documentIdInvalid)
          }
        }
        return true
      }),
  ]
  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (var validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  if (errors.isEmpty()) {
    let condition = { id: req.params.id } // condition
    let skillData;
    if (req.body?.clear_all) {
      skillData = await employeeSkillService.destroy(req.body, condition);
    } else {
      skillData = await employeeSkillService.update(req.body, condition)
    }
    if (skillData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.updatedSuccessfully
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong,
        error: skillData.error
      }
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Update employee skills Response.')
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData)
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity)
  }
});

/**
 * Destroy Document function to delete a Skill Document record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Delete the skill document details from the collection.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set a default variable for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'id' (params), must not be empty, should be an integer, and should exist in the 'employee_mapped_documents' table.
 *       
 * Run the validation rules.
 * If validation is successful:
 *    + Call 'employeeSkillService.deleteDocument' function to delete the skill document details from 'employee_mapped_documents' table.
 *    + Prepare the response with success data.
 * If validation fails:
 *    + Add error validation to the response.
 * Log the response.
 * Return the response using `responseHandler()`.
 *
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */

const destroyDocument = tryCatch(
  async (req, res) => {

    /* Log Request */
    logRequest('info', req, 'skill document delete request')
    /* Log Request */

    /* Default Variable */
    var responseData = ''
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
      check('request_id')
        .trim()
        .escape()
        .notEmpty()
        .withMessage(responseMessages.common.requestIdRequired),
      check('employee_id')
        .trim()
        .escape()
        .notEmpty()
        .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
        .isUUID()
        .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
        .custom(async (value) => {
          const employeeData = await indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: value })
          var employee = employeeData.status
          if (!employee) {
            return Promise.reject(
              responseMessages.employee.behalfOnboarding.employeeIdNotExists
            )
          }
          req.body.employee_name = employeeData.data[0].display_name
          req.body.employee_reference_id = employeeData.data[0].reference_id
          return true
        }),
      check('employee_skill_id')
        .trim()
        .escape()
        .notEmpty()
        .withMessage(responseMessages.configurations.skills.employeeSkillIdRequired)
        .isInt()
        .withMessage(responseMessages.employee.skills.invalidSkillsId)
        .custom(async (value) => {
          var employeeSkills = await indexService.find('employee_skill_details', ['id', 'employee_id'], { id: value })
          if (!employeeSkills.status) {
            return Promise.reject(
              responseMessages.employee.skills.skillsIdNotExists
            )
          } else {
            if (employeeSkills.data[0].employee_id != req.body.employee_id) {
              return Promise.reject(
                responseMessages.employee.skills.noMatchingSkillDetails
              )
            }
          }
        }),
      check('id')
        .trim()
        .escape()
        .notEmpty()
        .withMessage(responseMessages.employee.skills.documentIdRequired)
        .isInt()
        .withMessage(responseMessages.employee.skills.documentIdInvalid)
        .custom(async (value) => {
          var docData = await indexService.find('employee_mapped_documents', ['id'], { id: value })
          if (!docData.status) {
            return Promise.reject(
              responseMessages.employee.skills.documentIdDoesNotExist
            )
          }
          return true
        })
    ]
    /* Writing validation conditions to the input request */

    /*Run the validation rules. */
    for (let validation of validations) {
      var result = await validation.run(req)
      if (result.errors.length) break
    }
    var errors = validationResult(req)
    /*Run the validation rules. */

    if (errors.isEmpty()) {
      let condition = { id: req.params.id } // condition
      await employeeSkillService.deleteDocument(req.body, condition)
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.deletedSuccessfully
      }

      /* Log Response */
      logResponse('info', req, responseData, 'skill document delete Response')
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData)
      /* Return the response */

    } else {
      throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity)
    }
  })


module.exports = { destroy, index, store, update, destroyDocument }
