const { check, validationResult } = require('express-validator');
const { logRequest, logResponse } = require('../../../../../utils/log');
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../constants/responseCodes');
const { responseHandler } = require('../../../../responseHandler');
const employeeDependentDetailsService = require('../../services/employee/employeeDependentDetailsService');
const { tryCatch } = require('../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const { pagination } = require('../../../../../config/pagination');
const indexService = require('../../services/index');
const format = require('../../../../../helpers/format');
const moment = require('moment')
const { regexPatterns } = require('../../../../../constants/regexPatterns')


/**
 * Destroy function to delete an Employee Dependent Details record for a specific employee.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Delete the specified Employee Dependent Details record.
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
 *      ~ Additionally get 'display_name' and 'reference_id' of the provided 'employee_id' and map to request body as 'employee_name' and 'employee_reference_id'.
 *    + 'id' (params), must not be empty, should be a valid integer, and should correspond to an existing record in 'employee_dependent_details' table.
 *      ~ Additionally join the 'relationship_types' table based on 'relationship_id' to get 'relationship_type' mapped to request body.
 *
 * - Run the validation rules.
 * - If validation is successful:
 *    + Create 'condition' object based on id (req.params.id).
 *    + Call the 'employeeDependentDetailsService.destroy' function to delete the Employee Dependent Details based on the condition (above defined).
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

const destroy = tryCatch(
  async (req, res) => {

    /* Log Request */
    logRequest('info', req, 'Delete employeeDependentDetails Service request');
    /* Log Request */

    /* Default Variable */
    let responseData = '';
    /* Default Variable */

    /* Writing validation rules to the input request */
    let validations = [
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
        .custom((value) => {
          return indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: value }).then(employeeData => {
            if (!employeeData.status && value != '') {
              return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists);
            }
            req.body.employee_name = employeeData.data[0].display_name
            req.body.employee_reference_id = employeeData.data[0].reference_id
            return true;
          });
        }),
      check('id')
        .trim()
        .escape()
        .notEmpty()
        .withMessage(responseMessages.employee.employeeDependentDetails.id)
        .isInt().withMessage(responseMessages.employee.employeeDependentDetails.IdInvalid)
        .custom((value) => {
          const joins = [
            { table: 'relationship_types as rtypes', alias: 'rtypes', condition: ['employee_dependent_details.relationship_id', 'rtypes.id'], type: 'left' },
          ];
          return indexService.find('employee_dependent_details', ['employee_dependent_details.id', 'employee_dependent_details.first_name', 'employee_dependent_details.middle_name', 'employee_dependent_details.last_name', 'rtypes.name'], { 'employee_dependent_details.id': value, 'employee_dependent_details.employee_id': req.body.employee_id }, null, joins).then(employeeDependentTypes => {
            let employeeDependentTypesData = employeeDependentTypes.status;
            if (!employeeDependentTypesData) {
              return Promise.reject(
                responseMessages.employee.employeeDependentDetails.IdNotExists,
              );
            }
            req.body.relationship_type = employeeDependentTypes.data[0].name
          });
        }),
    ];
    /* Writing validation conditions to the input request */


    /*Run the validation rules. */
    for (let validation of validations) {
      let result = await validation.run(req);
      if (result.errors.length) break;
    }
    let errors = validationResult(req);
    /*Run the validation rules. */

    /**
         * If validation is success
         * + Delete relationshipTypes details in the collection.
         * If Validation Fails
         * + Return the error message.
         */
    if (errors.isEmpty()) {
      var condition = { id : req.params.id} // condition
      var dependent = await employeeDependentDetailsService.destroy(req.body, condition);
      if (dependent.status) {
        responseData = {
          statusCode: responseCodes.codeSuccess,
          message: responseMessages.common.deletedSuccessfully
        }
      } else {
        responseData = {
          statusCode: responseCodes.codeInternalError,
          message: responseMessages.common.somethindWentWrong, error: dependent.error
        }
      }

      /* Log Response */
      logResponse('info', req, responseData, 'employee Dependent Details delete Response');
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData);
      /* Return the response */


    } else {
      throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
  });


/**
 * Index function to retrieve a list of Employee Dependent Details for a specific employee.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Retrieve a list of Employee Dependent Details for the specified employee.
 *      ~ Prepare the response with success data or an error message if no records are found.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'id' (query), must not be empty, should be an integer, and should correspond to an existing 'employee_dependent_details' record.
 *
 * Run the validation rules.
 * If validation is successful:
 *    + Create a 'condition' object using the provided 'id' and 'employee_id' from the request body.
 *    + Call the 'employeeDependentDetailsService.index' function to retrieve dependent details based on the condition.
 *    + If data exists:
 *      - Prepare the response with fetched data and a success message.
 *    + If no data is found:
 *      - Prepare the response with an error message and an empty data array.
 * Log the response.
 * Return the response using `responseHandler()`.
 * If validation fails:
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

const index = tryCatch(
  async (req, res) => {

    /* Log Request */
    logRequest('info', req, 'getting employee Dependent Types Data index request');
    /* Log Request */

    /* Default Variable */
    let responseData = '';
    /* Default Variable */

    /* Writing validation rules to the input request */
    let validations = [
      check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
      check('id')
        .trim()
        .escape()
        .notEmpty()
        .withMessage(responseMessages.employee.employeeDependentDetails.id)
        .isInt().withMessage(responseMessages.employee.employeeDependentDetails.IdInvalid)
        .custom((value) => {
          return indexService.find('employee_dependent_details', ['id'], { id: value, employee_id: req.body.employee_id }).then(employeeDependentTypes => {
            let employeeDependentTypesData = employeeDependentTypes.status;
            if (!employeeDependentTypesData) {
              return Promise.reject(
                responseMessages.employee.employeeDependentDetails.IdNotExists,
              );
            }
          });
        }),
    ];
    /*Run the validation rules. */
    for (let validation of validations) {
      let result = await validation.run(req);
      if (result.errors.length) break;
    }
    let errors = validationResult(req);
    /*Run the validation rules. */

    /**
         * If validation is success
         *    + call the update service function
         *        - Based on the status in update function response, segregate the response and prepare the response
         * If Validation Fails
         *    + Return the error message.
        */
    if (errors.isEmpty()) {
      let condition = { 'employee_dependent_details.id': req.query.id };
      let dependentDetailsData = await employeeDependentDetailsService.index(condition);
      if(dependentDetailsData.status){
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: dependentDetailsData.data };
      } else {
        responseData = { statusCode: responseCodes.codeSuccess, message: dependentDetailsData.data.message, data: dependentDetailsData.data.data };
      }

      /* Log Response */
      logResponse('info', req, responseData, 'employee dependent details index Response.');
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData);
      /* Return the response */


    } else {
      throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
  });


/**
 * Employee Dependent Details Listing request to fetch employee-dependent data.
 *
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Call the service function.
 *     ~ Fetch the data from the 'employee_dependent_details' table and return the data.
 *     ~ Add Success to the response.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Logging incoming request.
 * - Define the validation rules as follows:
 *   + `request_id` (query) is mandatory.
 *   + `limit` (query) is not mandatory; it should be an integer.
 *   + `page` (query) is not mandatory; it should be an integer.
 *   + `employee_id` (query) is mandatory; it should be a valid UUID.
 *   + `search` (query) is not mandatory; it should be a string.
 * - Check the `employee_id` for its validity and existence in the 'employee' table.
 * - Construct the search condition based on the provided parameters.
 * - Run the validation rules.
 *   + If validation is successful:
 *     ~ Call the service function (`employeeDependentDetailsService.listing`) to fetch the data and send the condition (defined above), limit, page.
 *     ~ Add the service function return data to the response.
 *   + Else:
 *     ~ Add error validation to the response.
 * - Prepare the response with appropriate status codes.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 *
 * Notes:
 * - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns None
 * @throws {InvalidRequestError} - If the request ID is missing, or the employee ID is invalid, or the employee ID is not found.
 */

const listing = tryCatch(
  async (req, res) => {

    /* Log Request */
    logRequest('info', req, 'Getting employee dependent details  request');
    /* Log Request */

    /* Default Variable */
    let responseData = '';
    let request_id = req.query.request_id;
    /* Default Variable */

    if (request_id != undefined && request_id != '') {

      /* Default Variable */
      let limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
      let page = (req.query.page) ? (req.query.page) : pagination.page;
      let employee_id = req.query.employee_id;
      let search = req.query.search ? req.query.search : '';
      /* Default Variable */

      /* Writing validation rules to the input request */
      if (employee_id != undefined && employee_id != '') {
        let pattern = regexPatterns.uuidRegex;
        if (pattern.test(employee_id)) {
          const employeeData = await indexService.find('employee', ['id'], { id: employee_id, status: 'Active' })
          if (!employeeData.status) {
            throw new InvalidRequestError(responseMessages.employee.employeeDependentDetails.employeeIdNotExists);
          }
          if (search != undefined && search != '') {
            var condition = { search: search, 'employee_dependent_details.employee_id': employee_id };
          } else {
            var condition = { 'employee_dependent_details.employee_id': employee_id };
          }

          var employeeDependentDetailsData = await employeeDependentDetailsService.listing(condition, page, limit);
          if (!employeeDependentDetailsData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, message: employeeDependentDetailsData.message, error: employeeDependentDetailsData.error, message: responseMessages.common.noRecordFound, data: [], pagination: employeeDependentDetailsData.pagination };
          }
          else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: employeeDependentDetailsData.data, pagination: employeeDependentDetailsData.pagination_data };
          }

        } else {
          throw new InvalidRequestError(responseMessages.employee.employeeDependentDetails.employeeIdInvalid);
        }
      } else {
        throw new InvalidRequestError(responseMessages.employee.employeeDependentDetails.employeeIdRequired);
      }

      /* Log Response */
      logResponse('info', req, responseData, 'Getting employee dependent  Details Response');
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData);
      /* Return the response */
    } else {
      throw new InvalidRequestError(responseMessages.common.requestIdRequired);
    }
  },
);

/**
 * Store function to create a new employee-dependent record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'store' service function to create a new employee-dependent record.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Retrieve the organization date format using `format.getDateFormat()`.
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Modify the 'dob' date to 'YYYY-MM-DD' format using Moment.js and update the request.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *    + 'relationship_id' (body), must not be empty, should be a valid integer, and should exist in the 'relationship_types' table. Additionally, check if the relationship already exists for the given employee.
 *    + 'first_name' (body), must not be empty and should contain only letters and spaces.
 *    + 'last_name' (body), must not be empty and should contain only letters and spaces.
 *    + 'middle_name' (body), if not empty, should contain only letters and spaces.
 *    + 'contact_number' (body), if not empty, should be a valid phone number format.
 *    + 'email_id' (body), if not empty, should be a valid email address format.
 *    + 'dob' (body), must not be empty and should be a valid date.
 *    + 'visa_type_id' (body), must not be empty, should be a valid integer, and should exist in the 'visa_types' table.
 *    + 'ssn' (body), must not be empty, should be a valid Social Security Number (SSN) format, and should not already exist in the 'employee_dependent_details' table.
 *    + 'passport_documents.*.new_document_id' (body), must not be empty, should be a valid UUID, and should exist in the 'temp_upload_documents' table.
 *    + 'i94_documents.*.new_document_id' (body), must not be empty, should be a valid UUID, and should exist in the 'temp_upload_documents' table.
 *
 * Run the validation rules.
 * If validation is successful:
 *    + Call the 'store' service function to create a new employee-dependent record.
 *    + If successful:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with an error message.
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

const store = tryCatch(async (req, res) => {
  let dateFormat = await format.getDateFormat(); // date format
  /* Log Request */
  logRequest('info', req, 'New employee dependent types creation request');
  /* Log Request */

  /* Default Variable */
  let responseData = '';
  /* Default Variable */

  let modified_date = req.body.dob != '' ? moment(req.body.dob, dateFormat).format('YYYY-MM-DD') : '';
  req.body.dob = modified_date // From date format  

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
      .custom(async (value) => {
        const employeeData = await indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: value })
        if (!employeeData.status && value != '') {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists);
        }
        req.body.employee_name = employeeData.data[0].display_name
        req.body.employee_reference_id = employeeData.data[0].reference_id
        return true;
      }),
    check('relationship_id')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.employee.employeeDependentDetails.relationship_id)
      .isInt().withMessage(responseMessages.employee.employeeDependentDetails.relationshipIdInvalid)
      .custom((value) => {
        return indexService.find('relationship_types', ['id', 'name'], { id: value, is_active: true }).then((relationShipData) => {
          let status = relationShipData.status;
          if (!status) {
            return Promise.reject(responseMessages.employee.employeeDependentDetails.relationIdNotExists);
          } else {
            return indexService
              .find('employee_dependent_details', ['id'], { employee_id: req.body.employee_id, relationship_id: value })
              .then((employeeDependentTypes) => {
                let employeeDependentTypesData = employeeDependentTypes.status;
                if (employeeDependentTypesData) {
                  return Promise.reject(
                    responseMessages.employee.employeeDependentDetails.relationshipAlreadyExists,
                  );
                }
                req.body.relationship_type = relationShipData.data[0].name
                return true;
              });
          }
        });
      }),
    check('first_name')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.firstNameRequired)
      .matches(regexPatterns.alphaCharactersAndSpacesOnly) 
      .withMessage(responseMessages.employee.behalfOnboarding.firstNameInvalid),
    check('last_name')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.lastNameRequired)
      .matches(regexPatterns.alphaCharactersAndSpacesOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.lastNameInvalid),
    check('middle_name')
      .trim()
      .custom((value) => {
        if (value != '') {
          let regex = regexPatterns.alphaCharactersAndSpacesOnly;
          if (regex.test(value)) {
            return true;
          } else {
            return Promise.reject(responseMessages.employee.behalfOnboarding.middleNameInvalid);
          }
        } else {
          return true;
        }
      }),
    check('contact_number')
      .trim()
      .custom((value) => {
        if (value != '') {
          let regex = regexPatterns.phoneRegex;
          if (regex.test(value)) {
            return true;
          } else {
            return Promise.reject(responseMessages.employee.behalfOnboarding.contactNumberInvalid);
          }
        } else {
          return true;
        }
      }),
    check('email_id')
      .trim()
      .custom((value) => {
        if (value != '') {
          let regex = regexPatterns.emailRegex;
          if (regex.test(value)) {
            return true;
          } else {
            return Promise.reject(responseMessages.employee.behalfOnboarding.emailIdInvalid);
          }
        } else {
          return true;
        }
      }),
    check('dob')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.requiredDob)
      .isDate()
      .withMessage(responseMessages.employee.behalfOnboarding.invalidDob),
    check('visa_type_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.visaType.IdRequired)
      .isInt().withMessage(responseMessages.configurations.visaType.IdInvalid)
      .custom(async (value) => {
        const visatype = await indexService.find('visa_types', ['id'], { id: value });
        let visatypeData = visatype.status;
        if (!visatypeData) {
          return Promise.reject(
            responseMessages.configurations.visaType.IdNotExists);
        }
      }),
    check('ssn')
      .trim()
      // .notEmpty()
      // .withMessage(responseMessages.employee.behalfOnboarding.ssnRequired)
      .custom(async (value) => {
        let pattern = regexPatterns.ssnRegex;
        if (pattern.test(value)) {
          const employee = await indexService.find('employee_dependent_details', ['id'], { ssn: value });
          if (employee.status) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.ssnAlreadyExists);
          }
          return true;
        } else {
          return Promise.reject(responseMessages.employee.behalfOnboarding.ssnInvalid);
        }
      }),
    check('passport_documents.*.new_document_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.employeeDependentDetails.passportDocumentRequired)
      .isUUID()
      .withMessage(responseMessages.employee.employeeDependentDetails.passportDocumentIdInvalid)
      .custom(async (value) => {
        var documentsData = await indexService.find('temp_upload_documents', ['id'], { id: value }, null, [], null, null, null, false)
        if (documentsData.length === 0) {
          return Promise.reject(responseMessages.employee.employeeDependentDetails.passportDocumentNotExists)
        }
        return true
      }),
    check('i94_documents.*.new_document_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.employeeDependentDetails.i94DocumentRequired)
      .isUUID()
      .withMessage(responseMessages.employee.employeeDependentDetails.i94DocumentIdInvalid)
      .custom(async (value) => {
        var documentsData = await indexService.find('temp_upload_documents', ['id'], { id: value }, null, [], null, null, null, false)
        if (documentsData.length === 0) {
          return Promise.reject(responseMessages.employee.employeeDependentDetails.i94DocumentNotExists)
        }
        return true
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
       *    + Call the employee dependent  types service function
       *       - Based on the status in  employee dependent types function response, segregate the response and prepare the response
       * If Validation Fails
       *    + Return the error message.
       */
  if (errors.isEmpty()) {
    var dependent = await employeeDependentDetailsService.store(req.body);
    if (dependent.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.addedSuccessfully,
      };
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong, error: dependent.error
      }
    }
    /* Log Response */
    logResponse(
      'info',
      req,
      responseData,
      'New employee dependent Types creation request',
    );
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity,
    );
  }
});

/**
 * Update function to modify an existing Employee Dependent Details record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'update' service function to modify the Employee Dependent Details record.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Retrieve the organization date format using `format.getDateFormat()`.
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Modify the 'dob' date to 'YYYY-MM-DD' format using Moment.js and update the request.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'id' (params), must not be empty, should be a valid integer, and should correspond to an existing Employee Dependent Details record.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *    + 'relationship_id' (body), must not be empty, should be a valid integer, and should exist in the 'relationship_types' table. Also, ensure there is no duplicate relationship for the same employee.
 *    + 'first_name' (body), must not be empty, and should only contain alphabetic characters and spaces.
 *    + 'last_name' (body), must not be empty, and should only contain alphabetic characters and spaces.
 *    + 'middle_name' (body), should only contain alphabetic characters and spaces.
 *    + 'contact_number' (body), if not empty, should follow a valid phone number format.
 *    + 'email_id' (body), if not empty, should follow a valid email format.
 *    + 'dob' (body), must not be empty and should be a valid date.
 *    + 'visa_type_id' (body), must not be empty, should be a valid integer, and should exist in the 'visa_types' table.
 *    + 'ssn' (body), must not be empty and should follow a valid SSN format, and ensure it's not a duplicate SSN.
 *    + 'passport_document_id' (body), must not be empty, should be a valid integer, and should correspond to an existing 'employee_mapped_documents' record.
 *    + 'passport_new_document_id' (body), if not empty, should be a valid UUID and should exist in 'temp_upload_documents'.
 *    + 'i94_document_id' (body), must not be empty, should be a valid integer, and should correspond to an existing 'employee_mapped_documents' record.
 *    + 'i94_new_document_id' (body), if not empty, should be a valid UUID and should exist in 'temp_upload_documents'.
 *
 * Run the validation rules.
 * If validation is successful:
 *    + Create a 'condition' object using Employee Dependent Details id (req.params.id).
 *    + Call the 'update' service function to modify the Employee Dependent Details record.
 *    + If successful:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with an error message.
 * If validation fails:
 *    + Add error validation to the response.
 * Log the response.
 * Return the response using `responseHandler()`.
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
  logRequest('info', req, 'update employee dependent request.');
  /* Log Request */

  /* Default Variable */
  let responseData = '';
  /* Default Variable */

  let modified_date = req.body.dob != '' ? moment(req.body.dob, dateFormat).format('YYYY-MM-DD') : '';
  req.body.dob = modified_date // From date format  

  /* Writing validation rules to the input request */
  let validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.employeeDependentDetails.id)
      .isInt().withMessage(responseMessages.employee.employeeDependentDetails.IdInvalid)
      .custom((value) => {
        return indexService.find('employee_dependent_details', ['id'], { id: value }).then(employeeDependentTypes => {
          let employeeDependentTypesData = employeeDependentTypes.status;
          if (!employeeDependentTypesData) {
            return Promise.reject(
              responseMessages.employee.employeeDependentDetails.IdNotExists,
            );
          }
        });
      }),
    check('employee_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async (value) => {
        const employeeData = await indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: value })
        if (!employeeData.status && value != '') {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists);
        }
        req.body.employee_name = employeeData.data[0].display_name
        req.body.employee_reference_id = employeeData.data[0].reference_id
        return true;
      }),
    check('relationship_id')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.employee.employeeDependentDetails.relationship_id)
      .isInt().withMessage(responseMessages.employee.employeeDependentDetails.relationshipIdInvalid)
      .custom(async (value) => {
        const relationShipData = await indexService.find('relationship_types', ['id', 'name'], { id: value, is_active: true });
        let status = relationShipData.status;
        if (!status) {
          return Promise.reject(responseMessages.employee.employeeDependentDetails.relationIdNotExists);
        } else {
          return indexService
            .find('employee_dependent_details', ['id'], { employee_id: req.body.employee_id, relationship_id: value })
            .then((employeeDependentTypes) => {
              let employeeDependentTypesData = employeeDependentTypes.status;
              if (employeeDependentTypesData) {
                if (employeeDependentTypes.data[0].id != req.params.id) {
                  return Promise.reject(
                    responseMessages.employee.employeeDependentDetails.relationshipAlreadyExists);
                }
              }
              req.body.relationship_type = relationShipData.data[0].name
              return true;
            });
        }
      }),

    check('first_name')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.firstNameRequired)
      .matches(regexPatterns.alphaCharactersAndSpacesOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.firstNameInvalid),
    check('last_name')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.lastNameRequired)
      .matches(regexPatterns.alphaCharactersAndSpacesOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.lastNameInvalid),
    check('middle_name')
      .trim()
      .matches(regexPatterns.alphaCharactersAndSpacesOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.middleNameInvalid),
    check('contact_number')
      .trim()
      .custom((value) => {
        if (value != '') {
          let regex = regexPatterns.phoneRegex;
          if (regex.test(value)) {
            return true;
          } else {
            return Promise.reject(responseMessages.employee.behalfOnboarding.contactNumberInvalid);
          }
        } else {
          return true;
        }
      }),
    check('email_id')
      .trim()
      .custom((value) => {
        if (value != '') {
          let regex = regexPatterns.emailRegex;
          if (regex.test(value)) {
            return true;
          } else {
            return Promise.reject(responseMessages.employee.behalfOnboarding.emailIdInvalid);
          }
        } else {
          return true;
        }
      }),
    check('dob')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.requiredDob)
      .isDate()
      .withMessage(responseMessages.employee.behalfOnboarding.invalidDob),
    check('visa_type_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.visaType.IdRequired)
      .isInt().withMessage(responseMessages.configurations.visaType.IdInvalid)
      .custom((value) => {
        return indexService.find('visa_types', ['id'], { id: value }).then((visatype) => {
          let visatypeData = visatype.status;
          if (!visatypeData) {
            return Promise.reject(
              responseMessages.configurations.visaType.IdNotExists,
            );
          }
        });
      }),
    check('ssn')
      .trim()
      // .notEmpty()
      // .withMessage(responseMessages.employee.behalfOnboarding.ssnRequired)
      .custom((value) => {
        let pattern = regexPatterns.ssnRegex;
        if (pattern.test(value)) {
          return indexService
            .find('employee', ['id', 'display_name', 'reference_id'], { ssn: value })
            .then((employee) => {
              if (employee.status && value != '') {
                if (employee.data[0].id != req.params.id) {
                  return Promise.reject(responseMessages.employee.behalfOnboarding.ssnAlreadyExists);
                } else {
                  return true;
                }
              } else {
                return true;
              }
            });
        } else {
          return Promise.reject(responseMessages.employee.behalfOnboarding.ssnInvalid);
        }
      }),
    check('passport_documents.*.id')
      .trim()
      .escape()
      .custom(async (value) => {
        if (value != null && value != '') {
          var pattern = regexPatterns.numericOnlyRegex;
          if (pattern.test(value)) {
            var documentsData = await indexService.find('employee_mapped_documents', ['id'],{ id: value } , null, [], null, null, null, false)
            if (documentsData.length === 0) {
              return Promise.reject(responseMessages.employee.employeeDependentDetails.passportDocumentIdNotExists)
            }
            return true
          } else {
            return Promise.reject(responseMessages.employee.employeeDependentDetails.passportDocumentIdInvalid)
          }
        }
        return true
      }),
    check('passport_documents.*.new_document_id')
      .trim()
      .escape()
      .custom(async (value) => {
        if (value != null && value != '') {
          var pattern = regexPatterns.uuidRegex;
          if (pattern.test(value)) {
            var documentsData = await indexService.find('temp_upload_documents', ['id'], { id: value }, null, [], null, null, null, false)
            if (!documentsData.status) {
              return Promise.reject(responseMessages.employee.employeeDependentDetails.passportDocumentNotExists)
            }
          } else {
            return Promise.reject(responseMessages.employee.employeeDependentDetails.passportDocumentInvalid)
          }
        }
        return true
      }),
      check('i94_documents.*.id')
      .trim()
      .escape()
      .custom(async (value) => {
        if (value != null && value != '') {
          var pattern = regexPatterns.numericOnlyRegex;
          if (pattern.test(value)) {
            var documentsData = await indexService.find('employee_mapped_documents', ['id'],{ id: value } , null, [], null, null, null, false)
            if (documentsData.length === 0) {
              return Promise.reject(responseMessages.employee.employeeDependentDetails.i94DocumentIdNotExists)
            }
            return true
          } else {
            return Promise.reject(responseMessages.employee.employeeDependentDetails.i94DocumentIdInvalid)
          }
        }
        return true
      }),
      check('i94_documents.*.new_document_id')
      .trim()
      .escape()
      .custom(async (value) => {
        if (value != null && value != '') {
          var pattern = regexPatterns.uuidRegex;
          if (pattern.test(value)) {
            var documentsData = await indexService.find('temp_upload_documents', ['id'], { id: value }  , null, [], null, null, null, false)
            if (!documentsData.status) {
              return Promise.reject(responseMessages.employee.employeeDependentDetails.passportDocumentNotExists)
            }
          } else {
            return Promise.reject(responseMessages.employee.employeeDependentDetails.passportDocumentInvalid)
          }
        }
        return true
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
       *    + call the update service function
       *        - Based on the status in update function response, segregate the response and prepare the response
       * If Validation Fails
       *    + Return the error message.
      */
  if (errors.isEmpty()) {
    let condition = { id: req.params.id } // condition
    var dependent = await employeeDependentDetailsService.update(req.body, condition);
    if (dependent.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong, error: dependent.error
      }
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Update employee dependent  Response.');
    /* Log Response */


    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */


  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
},
);

/**
 * Employee Dependent Details Dropdown request to fetch employee-dependent data.
 *
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Call the service function.
 *     ~ Fetch the data from the 'employee_dependent_details' table and return the data.
 *     ~ Add Success to the response.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Logging incoming request.
 * - Define the validation rules as follows:
 *   + `request_id` (query) is mandatory.
 *   + `employee_id` (query) is mandatory; it should be a valid UUID.
 *   + `search` (query) is not mandatory; it should be a string.
 * - Check the `employee_id` for its validity and existence in the 'employee' table.
 * - Construct the search condition based on the provided parameters.
 * - Run the validation rules.
 *   + If validation is successful:
 *     ~ Call the service function (`employeeDependentDetailsService.dropdown`) to fetch the data and send the condition (defined above).
 *     ~ Add the service function return data to the response.
 *   + Else:
 *     ~ Add error validation to the response.
 * - Prepare the response with appropriate status codes.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 *
 * Notes:
 * - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns json
 * @throws {InvalidRequestError} If the request is invalid.
 */
const dropdown = tryCatch(
  async (req, res) => {

    /* Log Request */
    logRequest('info', req, 'Getting dependent dropdown Details request.');
    /* Log Request */

    /* Default Variable */
    let responseData = '';
    let request_id = req.query.request_id;
    /* Default Variable */

    if (request_id != undefined && request_id != '') {

      let employee_id = req.query.employee_id;
      if (employee_id != undefined && employee_id != '') {
        let pattern = regexPatterns.uuidRegex;
        if (pattern.test(employee_id)) {
          var condition = { id: employee_id };
          const employeeData = await indexService.find('employee', ['id', 'display_name', 'reference_id'], condition)
          if (employeeData.status) {

            /* Default Variable */
            let search = req.query.search ? req.query.search : '';
            /* Default Variable */

            /* Writing validation rules to the input request */
            var condition = { employee_id: employee_id, search: search };
            var dependentData = await employeeDependentDetailsService.dropdown(condition);
            if (!dependentData.status) {
              responseData = { statusCode: responseCodes.codeSuccess, message: dependentData.message, error: dependentData.error, message: responseMessages.common.noRecordFound, data: [] };
            }
            else {
              responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: dependentData.data };
            }
          }
        } else {
          throw new InvalidRequestError(responseMessages.employee.employeeDependentDetails.employeeIdInvalid);
        }
      } else {
        throw new InvalidRequestError(responseMessages.employee.employeeDependentDetails.employeeIdRequired);
      }
      /* Writing validation rules to the input request */

      /* Log Response */
      logResponse('info', req, responseData, 'Getting Employee Dependents dropdown Details Response');
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData);
      /* Return the response */

    } else {
      throw new InvalidRequestError(responseMessages.common.requestIdRequired);
    }
  });

/**
 * Destroy Document function to delete a Dependent Document record.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Delete the dependent document details from the collection.
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
 *    + call 'employeeDependentDetailsService.deleteDocument' function to delete the dependent document details from 'employee_mapped_documents' table.
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
const destroyDocument = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'personal document delete request');
  /* Log Request */

  /* Default Variable */
  let responseData = '';
  /* Default Variable */

  /* Writing validation rules to the input request */
  let validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
      check('dependent_details_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.employeeDependentDetails.id)
      .isInt().withMessage(responseMessages.employee.employeeDependentDetails.IdInvalid)
      .custom((value) => {
        return indexService.find('employee_dependent_details', ['id'], { id: value }).then(employeeDependentTypes => {
          let employeeDependentTypesData = employeeDependentTypes.status;
          if (!employeeDependentTypesData) {
            return Promise.reject(
              responseMessages.employee.employeeDependentDetails.IdNotExists,
            );
          }
        });
      }),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.personalDocuments.documentIdRequired)
      .isInt()
      .withMessage(responseMessages.employee.personalDocuments.documentIdInvalid)
      .custom(async (value) => {
        let docData = await indexService.find('employee_mapped_documents', ['id'], { id: value });
        if (!docData.status) {
          return Promise.reject(
            responseMessages.employee.personalDocuments.documentIdDoesNotExist,
          );
        }
        return true;
      }),
  ];
  /* Writing validation conditions to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    let result = await validation.run(req);
    if (result.errors.length) break;
  }
  let errors = validationResult(req);
  /*Run the validation rules. */

  /**
   * If validation is success
   * + Delete personal document details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    const condition = {id: req.params.id}
    await employeeDependentDetailsService.deleteDocument(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.deletedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'personal document delete Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */

  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
})


module.exports = { destroy, index, listing, store, update, dropdown, destroyDocument };





