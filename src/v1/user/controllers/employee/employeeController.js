const employeeServices = require('../../services/employee/employeeService')
const { tryCatch } = require('../../../../../utils/tryCatch')
const { logRequest, logResponse } = require('../../../../../utils/log')
const { responseMessages } = require('../../../../../constants/responseMessage')
const { responseCodes } = require('../../../../../constants/responseCodes')
const { responseHandler } = require('../../../../responseHandler')
const { check, validationResult } = require('express-validator');
const InvalidRequestError = require("../../../../../error/InvalidRequestError")
const { pagination } = require('../../../../../config/pagination')
const placementServices = require('../../../../v1/user/services/placement/placementClientService');
const moment = require('moment');
const approvalConfigurationRepository = require('../../repositories/configurations/approvalConfigurationRepository');
const indexService = require('../../services/index');
const format = require('../../../../../helpers/format');
const { regexPatterns } = require('../../../../../constants/regexPatterns');
const { removeEmptyAndUndefinedKeys } = require('../../../../../helpers/globalHelper')
const hoursValidationRegex = /(\d+):(\d+)/;
const payVia = ['Cash', 'Cheque', 'Payroll'];

/**
 * Store function to create a new employee.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'store' service function to create a new employee.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Retrieve the organization date format using `format.getDateFormat()`.
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Convert 'dob' in the request to 'YYYY-MM-DD' format using Moment.js and update the request.
 * - Convert 'date_of_joining' in the request to 'YYYY-MM-DD' format using Moment.js and update the request.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'first_name' (body), must not be empty, should contain only alphabetic characters.
 *    + 'last_name' (body), must not be empty, should contain only alphabetic characters.
 *    + 'middle_name' (body), should contain only alphabetic characters.
 *    + 'dob' (body) must not be empty, should be a valid date.
 *    + 'gender' (body) should contain only alphabetic characters.
 *    + 'blood_group' (body) should contain only alphabetic characters and '+' or '-'.
 *    + 'marital_status' (body) should contain only alphabetic characters.
 *    + 'employment_type_id' (body), must not be empty, should be a valid integer, and should exist in the 'employment_type' table.
 *    + 'reference_id' (body), must not be empty and should not exist in the 'employee' table.
 *    + 'contact_number' (body) must not be empty, should match a valid phone number pattern,
 *      and should not already exist for another employee.
 *    + 'alternate_contact_number' (body) is optional but must match a valid phone number pattern if provided.
 *    + 'email_id' (body) must not be empty, should match a valid email pattern,
 *      and should not already exist for another employee.
 *    + 'alternate_email' (body) is optional but must match a valid email pattern if provided.
 *    + 'address_line_one' (body) must not be empty.
 *    + 'city' (body) must not be empty, and should not contain special characters.
 *    + 'state_id' (body) must not be empty, should be a valid integer, and the state id should exist in the 'states' table.
 *    + 'country_id' (body) must not be empty, should be a valid integer, and the country id should exist in the 'countries' table.
 *    + 'zip_code' (body) must not be empty, should only contain numbers and spaces, and have a length between 5 and 10.
 *    + 'date_of_joining' (body), must not be empty and should be a valid date.
 *    + 'employment_category_id' (body), must not be empty, should be a valid integer, and should exist in the  'employee_categories' table.
 *    + 'ssn' (body), must not be empty and should be a valid SSN format, and should not exist in the 'employee' table.
 *    + 'is_usc' (body), must not be empty and should be either 0 or 1.
 *    + 'visa_type_id' (body), should be a valid integer and should exist in the 'visa_types' table if 'is_usc' is 0.
 *    + 'reporting_manager_id' (body), should be a valid UUID and should exist in the 'employee' table if 'employment_type_id' is 1.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `store` service function to create a new employee.
 *    + If Success:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with error message.
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
  logRequest("info", req, "Create a new employee request");
  /* Log Request */

  /* Default Variable */
  var responseData = "";
  /* Default Variable */

  let modified_date = req.body.dob != '' ? moment(req.body.dob, dateFormat).format('YYYY-MM-DD') : '';
  req.body.dob = modified_date // From date format

  let modified_date1 = req.body.date_of_joining != '' ? moment(req.body.date_of_joining, dateFormat).format('YYYY-MM-DD') : '';
  req.body.date_of_joining = modified_date1 // From date format

  /* Writing validation rules to the input request */
  var validations = [
    check("request_id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check("first_name")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.firstNameRequired)
      .matches(regexPatterns.alphaCharactersAndSpacesThirtyThreeOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.firstNameInvalid),
    check("last_name")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.lastNameRequired)
      .matches(regexPatterns.alphaCharactersAndSpacesThirtyThreeOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.lastNameInvalid),
    check("middle_name")
      .trim()
      .matches(regexPatterns.alphaCharactersAndSpacesThirtyThreeOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.middleNameInvalid),
    check("dob")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.requiredDob)
      .isDate()
      .withMessage(responseMessages.employee.behalfOnboarding.invalidDob),
    check("gender")
      .trim()
      .matches(regexPatterns.alphaCharactersAndSpacesOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.genderInvalid),
    check("blood_group")
      .trim()
      .matches(regexPatterns.bloodGroupRegex)
      .withMessage(responseMessages.employee.behalfOnboarding.bloodGroupInvalid),
    check("marital_status")
      .trim()
      .matches(regexPatterns.alphaCharactersAndSpacesOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.maritalStatusInvalid),
    check("employment_type_id")
      .trim()
      .custom(async (value) => {
        if (value != null && value != '' && value != undefined) {
          var pattern = regexPatterns.numbersSpaceRegex
          if (pattern.test(value)) {
            const employmentTypeData = await indexService.find('employment_types', ['id', 'name'], { id: value, is_active: 1 })
            if (!employmentTypeData.status) {
              return Promise.reject(responseMessages.employee.behalfOnboarding.employmentTypeIdNotExists)
            }
            req.body.employment_type_name = employmentTypeData.data[0].name
            return true
          } else {
            return Promise.reject(responseMessages.employee.behalfOnboarding.employmentTypeIdInvalid)
          }
        } else {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employmentTypeIdRequired)
        }
      }),
    check("role_id")
      .trim()
      .custom(async (value) => {
        if (req.body.employment_type_id == 1) {
          if (value != null && value != '' && value != undefined) {
            var pattern = regexPatterns.numbersSpaceRegex
            if (pattern.test(value)) {
              const roleData = await indexService.find('roles', ['id', 'name'], { id: value, is_active: 1 })
              if (!roleData.status) {
                return Promise.reject(responseMessages.employee.behalfOnboarding.roleIdNotExists)
              }
              req.body.role_name = roleData.data[0].name
              return true
            } else {
              return Promise.reject(responseMessages.employee.behalfOnboarding.invalidRoleId)
            }
          } else {
            return Promise.reject(responseMessages.employee.behalfOnboarding.roleIdRequired)
          }
        } else {
          req.body.role_id = null;
          return true;
        }
      }),
    check("contact_number")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.contactNumberRequired)
      .matches(regexPatterns.phoneRegex)
      .withMessage(responseMessages.registration.contactNumberInvalid)
      .custom(async (value) => {
        const employeeData = await indexService.find('employee', ['id'], { contact_number: value, status: 'Active' })
        if (employeeData.status) {
          return Promise.reject(responseMessages.registration.contactNumberExists)
        }
      }),
    check("alternate_contact_number")
      .trim()
      .custom((value) => {
        if (value != null && value != '') {
          var pattern = regexPatterns.phoneRegex
          if (!pattern.test(value)) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.alternateContactNumber);
          }
          return true
        } else {
          return true
        }
      }),
    check("email_id")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.emailIdRequired)
      .isEmail()
      .withMessage(responseMessages.employee.behalfOnboarding.emailIdInvalid)
      .custom(async (value) => {
        const employeeData = await indexService.find('employee', ['id'], { email_id: value.toLowerCase(), status: 'Active' })
        if (employeeData.status && value != '') {
          return Promise.reject(responseMessages.employee.behalfOnboarding.emailIdExists)
        }
      }),
    check("alternate_email_id")
      .trim()
      .custom((value) => {
        if (value != null && value != '') {
          var email_pattern = regexPatterns.emailRegex;
          if (!email_pattern.test(value)) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.alternateEmailIdInvalid);
          }
          return true
        } else {
          return true
        }
      }),
    check("address_line_one")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.addressLineOneRequired)
      .custom(value => {
        if (value != undefined && value != '' && value != null) {
          if (value.length > 255) {
            return Promise.reject(
              responseMessages.employee.behalfOnboarding.addressOneInvalid
            )
          }
        }
        return true;
      }),
    check("address_line_two")
      .trim()
      .custom(value => {
        if (value != undefined && value != '' && value != null) {
          if (value.length > 255) {
            return Promise.reject(
              responseMessages.employee.behalfOnboarding.addressTwoInvalid
            )
          }
        }
        return true;
      }),
    check("city")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.cityRequired)
      .matches(regexPatterns.alphaNumericCharactersAndSpacesFiftyOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.cityInvalid),
    check("state_id")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.stateIdRequired)
      .isInt().withMessage(responseMessages.employee.behalfOnboarding.stateIdInvalid)
      .custom(async (value) => {
        const stateData = await indexService.find('states', ['id'], { id: value, is_active: 1 });
        if (!stateData.status && value != '') {
          return Promise.reject(responseMessages.employee.behalfOnboarding.stateIdNotExists)
        }
        return true
      }),
    check("country_id")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.countryIdRequired)
      .isInt().withMessage(responseMessages.employee.behalfOnboarding.countryIdInvalid)
      .custom(async (value) => {
        const countryData = await indexService.find('countries', ['id'], { id: value, is_active: 1 })
        if (!countryData.status && value != '') {
          return Promise.reject(responseMessages.employee.behalfOnboarding.countryIdNotExists)
        }
        return true
      }),
    check("zip_code")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.zipCodeRequired)
      .matches(regexPatterns.numbersSpaceRegex)
      .withMessage(responseMessages.employee.behalfOnboarding.zipCodeInvalid)
      .isLength({ min: 5, max: 10 })
      .withMessage(responseMessages.employee.behalfOnboarding.zipCodeShouldBe),
    check("date_of_joining")
      .trim()
      .custom((value) => {
        if (value != null && value != '' && value != undefined) {
          var isDate = new Date(value);
          if (isNaN(isDate.getTime())) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.dateOfJoiningInvalid);
          }
          return true
        } else {
          return Promise.reject(responseMessages.employee.behalfOnboarding.dateOfJoiningRequired)
        }
      }),
    check('enable_login')
      .trim()
      .custom((value) => {
        if (value != null && value != '' && value != undefined) {
          if (value != true && value != false && value != 1 && value != 0 && value != '1' && value != '0' && value != 'true' && value != 'false') {
            return Promise.reject(responseMessages.employee.behalfOnboarding.isEnableLoginIsInvalid);
          }
          return true
        } else {
          return Promise.reject(responseMessages.employee.behalfOnboarding.isEnableLoginRequired)
        }
      }),
    check("employment_category_id")
      .trim()
      .custom(async (value) => {
        if (req.body.employment_type_id == 1) {
          return true;
        } else if (value != null && value != '' && value != undefined) {
          var pattern = regexPatterns.numbersSpaceRegex
          if (pattern.test(value)) {
            const employmentCategoryData = await indexService.find('employee_categories', ['id'], { id: value, is_active: 1 })
            if (!employmentCategoryData.status && value != '') {
              return Promise.reject(responseMessages.employee.behalfOnboarding.employeeCategoryIdNotExists)
            }
            return true
          } else {
            return Promise.reject(responseMessages.employee.behalfOnboarding.employeeCategoryIdInvalid)
          }
        } else {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeCategoryIdRequired)
        }
      }),
    check("ssn")
      .trim()
      .custom(async (value) => {
        if (value != null && value != '' && value != undefined) {
          var pattern = regexPatterns.ssnRegex
          if (pattern.test(value)) {
            const employee = await indexService.find('employee', ['id'], { ssn: value, status: 'Active' })
            if (employee.status) {
              return Promise.reject(responseMessages.employee.behalfOnboarding.ssnAlreadyExists)
            }
            return true
          } else {
            return Promise.reject(responseMessages.employee.behalfOnboarding.ssnInvalid);
          }
        } else {
          // return Promise.reject(responseMessages.employee.behalfOnboarding.ssnRequired);
          return true;
        }
      }),
    check("is_usc")
      .custom((value) => {
        if ((value != null && value != undefined && value != '') || value == 0) {
          if (value != true && value != false && value != 1 && value != 0 && value != '1' && value != '0' && value != 'true' && value != 'false') {
            return Promise.reject(responseMessages.employee.behalfOnboarding.invalidUSCitizen)
          }
          return true
        } else {
          return Promise.reject(responseMessages.employee.behalfOnboarding.requiredUSCitizen)
        }
      }),
    check("visa_type_id")
      .trim()
      .custom(async (value) => {
        if (Number(req.body.is_usc) == 0) {
          if (value != null && value != '') {
            if (Number.isInteger(Number(value)) && value != '') {
              return indexService.find('visa_types', ['id'], { id: value, is_active: 1 }).then((visaTypeServicesData) => {
                if (!visaTypeServicesData.status && value != '') {
                  return Promise.reject(responseMessages.employee.behalfOnboarding.visaTypeIdNotExists);
                }
                return true;
              });
            } else {
              return Promise.reject(responseMessages.employee.behalfOnboarding.visaTypeIdInvalid);
            }
          } else {
            return Promise.reject(responseMessages.employee.behalfOnboarding.visaTypeIdRequired)
          }
        }
        return true
      }),
    check('reporting_manager_id')
      .trim()
      .custom(async (value) => {
        if (req.body.employment_type_id == 1) {
          if (value != null && value != '') {
            var pattern = regexPatterns.uuidRegex;
            if (pattern.test(value)) {
              const employeeData = await indexService.find('employee', ['id'], { id: value, status: 'Active' });
              if (!employeeData.status) {
                return Promise.reject(responseMessages.employee.behalfOnboarding.reportingEmployeeIdNotExists)
              }
            } else {
              return Promise.reject(responseMessages.employee.behalfOnboarding.reportingEmployeeIdInvalid)
            }
          } else {
            return Promise.reject(responseMessages.employee.behalfOnboarding.reportingEmployeeIdRequired)
          }
        }
        return true
      }),
    check("invite_via_link_id")
      .optional()
      .custom(async value => {
        if (value != '' && value != undefined && value != null) {
          const inviteLink = await indexService.find('invited_employee', ['id'], { id: value });
          if (!inviteLink.status) {
            return Promise.reject(responseMessages.invitedEmployee.invitedEmployeeIdNotExists);
          }
        }
        return true;
      })
  ];
  /* Writing validation rules to the input request */

  /** Get Emergency Contact Validation Rules */
  var emergencyContact = await emergencyContactValidations(req.body.employment_type_id);
  validations = [...validations, ...emergencyContact];

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);
  /*Run the validation rules. */

  /**
       * If validation is success
       * + store employee details in the collection.
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    var employee_data = await employeeServices.store(req.body);
    if (employee_data.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.addedSuccessfully,
        data: employee_data.data
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong,
        error: employee_data.error,
        data: []
      }
    }
    /* Log Response */
    logResponse("info", req, responseData, "Create a new employee response");
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


const update = tryCatch(async (req, res) => {
  let dateFormat = await format.getDateFormat(); // date format
  /* Log Request */
  logRequest("info", req, "Update a drafted employee request");
  /* Log Request */

  /* Default Variable */
  var responseData = "";
  /* Default Variable */

  let modified_date = req.body.dob != '' ? moment(req.body.dob, dateFormat).format('YYYY-MM-DD') : '';
  req.body.dob = modified_date // From date format

  let modified_date1 = req.body.date_of_joining != '' ? moment(req.body.date_of_joining, dateFormat).format('YYYY-MM-DD') : '';
  req.body.date_of_joining = modified_date1 // From date format

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
      .custom(async (value) => {
        const employee = await indexService.find('employee', ['id', 'enable_login', 'is_us_citizen', 'reference_id'], { id: value })
        if (!employee.status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
        }
        req.body.old_enable_login = employee.data[0].enable_login;
        req.body.old_is_usc = employee.data[0].is_us_citizen;
        req.body.employee_reference_id = employee.data[0].reference_id;
        req.body.employee_id = employee.data[0].id;
        const empVisa = await indexService.find('employee_visa_details', ['id'], { employee_id: employee.data[0].id });
        if (empVisa.status) {
          req.body.visa_detail_id = empVisa.data[0].id;
        }
      }),
    check("first_name")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.firstNameRequired)
      .matches(regexPatterns.alphaCharactersAndSpacesThirtyThreeOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.firstNameInvalid),
    check("last_name")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.lastNameRequired)
      .matches(regexPatterns.alphaCharactersAndSpacesThirtyThreeOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.lastNameInvalid),
    check("middle_name")
      .trim()
      .matches(regexPatterns.alphaCharactersAndSpacesThirtyThreeOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.middleNameInvalid),
    check("dob")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.requiredDob)
      .isDate()
      .withMessage(responseMessages.employee.behalfOnboarding.invalidDob),
    check("gender")
      .trim()
      .matches(regexPatterns.alphaCharactersAndSpacesOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.genderInvalid),
    check("blood_group")
      .trim()
      .matches(regexPatterns.bloodGroupRegex)
      .withMessage(responseMessages.employee.behalfOnboarding.bloodGroupInvalid),
    check("marital_status")
      .trim()
      .matches(regexPatterns.alphaCharactersAndSpacesOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.maritalStatusInvalid),
    check("employment_type_id")
      .trim()
      .custom(async (value) => {
        if (value != null && value != '' && value != undefined) {
          var pattern = regexPatterns.numbersSpaceRegex
          if (pattern.test(value)) {
            const employmentTypeData = await indexService.find('employment_types', ['id', 'name'], { id: value, is_active: 1 })
            if (!employmentTypeData.status) {
              return Promise.reject(responseMessages.employee.behalfOnboarding.employmentTypeIdNotExists)
            }
            req.body.employment_type_name = employmentTypeData.data[0].name
            return true
          } else {
            return Promise.reject(responseMessages.employee.behalfOnboarding.employmentTypeIdInvalid)
          }
        } else {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employmentTypeIdRequired)
        }
      }),
    check("role_id")
      .trim()
      .custom(async (value) => {
        if (req.body.employment_type_id == 1) {
          if (value != null && value != '' && value != undefined) {
            var pattern = regexPatterns.numbersSpaceRegex
            if (pattern.test(value)) {
              const roleData = await indexService.find('roles', ['id', 'name'], { id: value, is_active: 1 })
              if (!roleData.status) {
                return Promise.reject(responseMessages.employee.behalfOnboarding.roleIdNotExists)
              }
              req.body.role_name = roleData.data[0].name
              return true
            } else {
              return Promise.reject(responseMessages.employee.behalfOnboarding.invalidRoleId)
            }
          } else {
            return Promise.reject(responseMessages.employee.behalfOnboarding.roleIdRequired)
          }
        } else {
          req.body.role_id = null;
          return true;
        }
      }),
    check("contact_number")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.contactNumberRequired)
      .matches(regexPatterns.phoneRegex)
      .withMessage(responseMessages.registration.contactNumberInvalid)
      .custom(async (value) => {
        const employeeData = await indexService.find('employee', ['id'], { contact_number: value, global_search: `id != '${req.params.id}'`, status: 'Active' })
        if (employeeData.status) {
          return Promise.reject(responseMessages.registration.contactNumberExists)
        }
        return true;
      }),
    check("alternate_contact_number")
      .trim()
      .custom((value) => {
        if (value != null && value != '') {
          var pattern = regexPatterns.phoneRegex
          if (!pattern.test(value)) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.alternateContactNumber);
          }
          return true
        } else {
          return true
        }
      }),
    check("email_id")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.emailIdRequired)
      .isEmail()
      .withMessage(responseMessages.employee.behalfOnboarding.emailIdInvalid)
      .custom(async (value) => {
        const employeeData = await indexService.find('employee', ['id'], { email_id: value.toLowerCase(), global_search: `id != '${req.params.id}'`, status: 'Active' })
        if (employeeData.status && value != '') {
          return Promise.reject(responseMessages.employee.behalfOnboarding.emailIdExists)
        }
        return true;
      }),
    check("alternate_email_id")
      .trim()
      .custom((value) => {
        if (value != null && value != '') {
          var email_pattern = regexPatterns.emailRegex;
          if (!email_pattern.test(value)) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.alternateEmailIdInvalid);
          }
          return true
        } else {
          return true
        }
      }),
    check("address_line_one")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.addressLineOneRequired),
    check("city")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.cityRequired)
      .matches(regexPatterns.alphaNumericCharactersAndSpacesFiftyOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.cityInvalid),
    check("state_id")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.stateIdRequired)
      .isInt().withMessage(responseMessages.employee.behalfOnboarding.stateIdInvalid)
      .custom(async (value) => {
        const stateData = await indexService.find('states', ['id'], { id: value, is_active: 1 });
        if (!stateData.status && value != '') {
          return Promise.reject(responseMessages.employee.behalfOnboarding.stateIdNotExists)
        }
        return true
      }),
    check("country_id")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.countryIdRequired)
      .isInt().withMessage(responseMessages.employee.behalfOnboarding.countryIdInvalid)
      .custom(async (value) => {
        const countryData = await indexService.find('countries', ['id'], { id: value, is_active: 1 })
        if (!countryData.status && value != '') {
          return Promise.reject(responseMessages.employee.behalfOnboarding.countryIdNotExists)
        }
        return true
      }),
    check("zip_code")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.zipCodeRequired)
      .matches(regexPatterns.numbersSpaceRegex)
      .withMessage(responseMessages.employee.behalfOnboarding.zipCodeInvalid)
      .isLength({ min: 5, max: 10 })
      .withMessage(responseMessages.employee.behalfOnboarding.zipCodeShouldBe),
    check("date_of_joining")
      .trim()
      .custom((value) => {
        if (value != null && value != '' && value != undefined) {
          var isDate = new Date(value);
          if (isNaN(isDate.getTime())) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.dateOfJoiningInvalid);
          }
          return true
        } else {
          return Promise.reject(responseMessages.employee.behalfOnboarding.dateOfJoiningRequired)
        }
      }),
    check("employment_category_id")
      .trim()
      .custom(async (value) => {
        if (req.body.employment_type_id == 1) {
          req.body.employment_category_id = null;
          return true;
        } else if (value != null && value != '' && value != undefined) {
          var pattern = regexPatterns.numbersSpaceRegex
          if (pattern.test(value)) {
            const employmentCategoryData = await indexService.find('employee_categories', ['id'], { id: value, is_active: 1 })
            if (!employmentCategoryData.status && value != '') {
              return Promise.reject(responseMessages.employee.behalfOnboarding.employeeCategoryIdNotExists)
            }
            return true
          } else {
            return Promise.reject(responseMessages.employee.behalfOnboarding.employeeCategoryIdInvalid)
          }
        } else {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeCategoryIdRequired)
        }
      }),
    check("ssn")
      .trim()
      .custom(async (value) => {
        if (value != null && value != '' && value != undefined) {
          var pattern = regexPatterns.ssnRegex
          if (pattern.test(value)) {
            const employee = await indexService.find('employee', ['id'], { ssn: value, status: 'Active', global_search: `(id != '${req.params.id}')` })
            if (employee.status) {
              return Promise.reject(responseMessages.employee.behalfOnboarding.ssnAlreadyExists)
            }
            return true
          } else {
            return Promise.reject(responseMessages.employee.behalfOnboarding.ssnInvalid);
          }
        } else {
          // return Promise.reject(responseMessages.employee.behalfOnboarding.ssnRequired);
          return true;
        }
      }),
    check("is_usc")
      .custom((value) => {
        if ((value != null && value != undefined && value != '') || value == 0) {
          if (value != true && value != false && value != 1 && value != 0 && value != '1' && value != '0' && value != 'true' && value != 'false') {
            return Promise.reject(responseMessages.employee.behalfOnboarding.invalidUSCitizen)
          }
          return true
        } else {
          return Promise.reject(responseMessages.employee.behalfOnboarding.requiredUSCitizen)
        }
      }),

    check('reporting_manager_id')
      .trim()
      .custom(async (value) => {
        if (req.body.employment_type_id == 1) {
          if (value != null && value != '') {
            var pattern = regexPatterns.uuidRegex;
            if (pattern.test(value)) {
              const employeeData = await indexService.find('employee', ['id'], { id: value, status: 'Active' });
              if (!employeeData.status) {
                return Promise.reject(responseMessages.employee.behalfOnboarding.reportingEmployeeIdNotExists)
              }
            } else {
              return Promise.reject(responseMessages.employee.behalfOnboarding.reportingEmployeeIdInvalid)
            }
          } else {
            return Promise.reject(responseMessages.employee.behalfOnboarding.reportingEmployeeIdRequired)
          }
        }
        return true
      })
  ];

  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);
  /*Run the validation rules. */

  /**
       * If validation is success
       * + store employee details in the collection.
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id }
    var employee_data = await employeeServices.update(req.body, condition);
    if (employee_data.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.addedSuccessfully,
        data: employee_data.data
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong,
        error: employee_data.error,
        data: []
      }
    }
    /* Log Response */
    logResponse("info", req, responseData, "Updated employee response");
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
 * Update function to modify an existing employee's details.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the basicDetailsUpdate service function to modify the employee's details.
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
 *    + Convert 'dob' in the request to 'YYYY-MM-DD' format using Moment.js and update the request.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'id' (params) must be a valid UUID and should exist in the 'employee' table.
 *      - Get the 'enable_login' value from the employee's existing data.
 *    + 'first_name' (body) must not be empty, should not contain special characters.
 *    + 'last_name' (body) must not be empty, should not contain special characters.
 *    + 'middle_name' (body) should not contain special characters.
 *    + 'dob' (body) must not be empty, should be a valid date.
 *    + 'gender' (body) should not contain special characters.
 *    + 'blood_group' (body) should not contain special characters.
 *    + 'marital_status' (body) should not contain special characters.
 *
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `basicDetailsUpdate` service function to modify the employee's details.
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
const basicDetailsUpdate = tryCatch(async (req, res) => {
  let dateFormat = await format.getDateFormat(); // date format
  /* Log Request */
  logRequest("info", req, "Update employee basic details request");
  /* Log Request */

  /* Default Variable */
  var responseData = "";
  /* Default Variable */

  let modified_date = req.body.dob != '' ? moment(req.body.dob, dateFormat).format('YYYY-MM-DD') : '';
  req.body.dob = modified_date // From date format

  /* Writing validation rules to the input request */
  var validations = [
    check("request_id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check("id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async (value) => {
        const employee = await indexService.find('employee', ['id', 'display_name', 'reference_id'], { id: value, status: 'Active' })
        if (!employee.status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
        }
        req.body.employee_name = employee.data[0].display_name
        req.body.employee_reference_id = employee.data[0].reference_id
        return true;
      }),
    check("first_name")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.firstNameRequired)
      .matches(regexPatterns.alphaCharactersAndSpacesThirtyThreeOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.firstNameInvalid),
    check("last_name")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.lastNameRequired)
      .matches(regexPatterns.alphaCharactersAndSpacesThirtyThreeOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.lastNameInvalid),
    check("middle_name")
      .trim()
      .matches(regexPatterns.alphaCharactersAndSpacesThirtyThreeOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.middleNameInvalid),
    check("dob")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.requiredDob)
      .isDate()
      .withMessage(responseMessages.employee.behalfOnboarding.invalidDob),
    check("gender")
      .trim()
      .matches(regexPatterns.alphaCharactersAndSpacesOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.genderInvalid),
    check("blood_group")
      .trim()
      .matches(regexPatterns.bloodGroupRegex)
      .withMessage(responseMessages.employee.behalfOnboarding.bloodGroupInvalid),
    check("marital_status")
      .trim()
      .matches(regexPatterns.alphaCharactersAndSpacesOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.maritalStatusInvalid),
  ];

  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);
  /*Run the validation rules. */

  /**
       * If validation is success
       * + Update employee details in the collection.
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id }
    var employee_data = await employeeServices.basicDetailsUpdate(req.body, condition);
    if (employee_data.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.updatedSuccessfully,
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong,
        data: employee_data.error
      }
    }
    /* Log Response */
    logResponse("info", req, responseData, "Update employee basic details response");
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
})

/**
 * Index function to retrieve an employee's basic details.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the basicDetailsIndex service function to retrieve the employee's details.
 *      ~ Prepare the response with the retrieved data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 *  - Log the incoming request.
 *  - Set default variables for `responseData`.
 * 
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'id' (query) must be a valid UUID and should exist in the 'employee' table.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `index` service function to retrieve the employee's details.
 *    + If Data exists:
 *      - prepare the response with the succeess code and retrieved data.
 *    + Else:
 *      - Prepare the reponse with error message
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

  let dateFormat = await format.getDateFormat(); // date format

  /* Log Request */
  logRequest("info", req, "Index employee request");
  /* Log Request */

  /* Default Variable */
  var responseData = "";
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
      .custom(async (value) => {
        const employee = await indexService.find('employee', ['id'], { id: value })
        if (!employee.status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
        }
      })
  ];

  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);
  /*Run the validation rules. */

  /**
   * If validation is success
   * + get employee details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    const condition = { 'id': req.query.id, date_format: dateFormat }
    const fetchData = await employeeServices.index(condition);
    if (!fetchData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: fetchData.message, error: fetchData.error, message: responseMessages.common.noRecordFound, data: [] }
    }
    else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: fetchData.data };
    }
    /* Log Response */
    logResponse("info", req, responseData, "Index employee response");
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
})

const checkDuplicate = tryCatch(async (req, res) => {

  let dateFormat = await format.getDateFormat(); // date format

  /* Log Request */
  logRequest("info", req, "Check for duplicates employee request");
  /* Log Request */

  /* Default Variable */
  var responseData = "";
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
      .custom(async (value) => {
        if (value !== "") {
          var pattern = regexPatterns.uuidRegex
          if (!pattern.test(value)) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdInvalid);
          }
          const employee = await indexService.find('employee', ['id'], { id: value })
          if (!employee.status) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
          }
        }
      })
  ];

  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);
  /*Run the validation rules. */

  /**
   * If validation is success
   * + get employee details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    let condition;
    if (req.body.id) {
      condition = { global_search: `id != '${req.body.id}'`, status: 'Active' }
    } else {
      condition = { status: 'Active' }
    }
    let value = "";
    for (const key in req.body) {
      switch (key) {
        case 'email_id':
          condition.email_id = req.body[key];
          value = req.body[key];
          break;
        case 'contact_number':
          condition.contact_number = req.body[key];
          value = req.body[key];
          break;
        case 'ssn':
          condition.ssn = req.body[key];
          value = req.body[key];
          break;
        default:
          break;
      }
    }
    if (value !== "") {
      const fetchData = await indexService.find('employee', ['id'], condition);
      if (fetchData.status) {
        responseData = { statusCode: responseCodes.codeSuccess, valid: false }
      }
      else {
        responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, valid: true };
      }
    }
    else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, valid: true };
    }

    /* Log Response */
    logResponse("info", req, responseData, "Check Duplicate employee response");
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
})

/**
 * Store or Update function to create or modify contact details for an employee.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'contactStoreOrUpdate' service function to create or update contact details.
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
 *    + 'id' (params) must be a valid UUID and should exist in the 'employee' table.
 *    + 'contact_number' (body) must not be empty, should match a valid phone number pattern,
 *      and should not already exist for another employee.
 *    + 'alternate_contact_number' (body) is optional but must match a valid phone number pattern if provided.
 *    + 'email_id' (body) must not be empty, should match a valid email pattern,
 *      and should not already exist for another employee.
 *    + 'alternate_email' (body) is optional but must match a valid email pattern if provided.
 *
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `contactStoreOrUpdate` service function to create or update contact details.
 *    + If Success:
 *      - Prepare the response with a success message
 *    + Else:
 *      - Prepare the response with a error message.
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
const contactDetailsUpdate = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest("info", req, "Store or Updtae contact deatails for employee request");
  /* Log Request */

  /* Default Variable */
  var responseData = "";
  /* Default Variable */

  /* Writing validation rules to the input request */
  var validations = [
    check("request_id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check("id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async (value) => {
        const employee = await indexService.find('employee', ['id', 'enable_login', 'display_name', 'reference_id'], { id: value, status: 'Active' })
        if (!employee.status && value != '') {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
        }
        req.body.employee_name = employee.data[0].display_name
        req.body.employee_reference_id = employee.data[0].reference_id
        return true;
      }),
    check("contact_number")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.contactNumberRequired)
      .matches(regexPatterns.phoneRegex)
      .withMessage(responseMessages.employee.behalfOnboarding.contactNumberInvalid)
      .custom(async (value) => {
        const employeeData = await indexService.find('employee', ['id'], { contact_number: value, status: 'Active' })
        if (employeeData.status) {
          if (employeeData.data[0].id != req.params.id) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.contactNumberExists)
          }
        }
      }),
    check("alternate_contact_number")
      .trim()
      .custom((value) => {
        if (value != null && value != '') {
          var pattern = regexPatterns.phoneRegex
          if (!pattern.test(value)) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.alternateContactNumber);
          }
          return true
        } else {
          return true
        }
      }),
    check("email_id")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.emailIdRequired)
      .isEmail()
      .withMessage(responseMessages.employee.behalfOnboarding.emailIdInvalid)
      .custom(async (value) => {
        const employeeData = await indexService.find('employee', ['id'], { email_id: value.toLowerCase(), status: 'Active' })
        if (employeeData.status && value != '') {
          if (employeeData.data[0].id != req.params.id) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.emailIdExists)
          }
        }
      }),
    check("alternate_email_id")
      .trim()
      .custom((value) => {
        if (value != null && value != '') {
          var email_pattern = regexPatterns.emailRegex
          if (!email_pattern.test(value)) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.alternateEmailIdInvalid);
          }
          return true
        } else {
          return true
        }
      }),
  ];

  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);
  /*Run the validation rules. */

  /**
       * If validation is success
       * + Update employee details in the collection.
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id }
    var contactData = await employeeServices.contactDetailsUpdate(req.body, condition);
    if (contactData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.updatedSuccessfully
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong,
        error: contactData.error
      }
    }
    /* Log Response */
    logResponse("info", req, responseData, "Store or Updtae contact deatails for employee response");
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
 * Update function to modify an existing employee's current address details.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'currentAddressUpdate' service function to modify the current address details.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * 
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'id' (params), must be a valid integer and should exist in the 'employee_address_details' table.
 *    + 'employee_id' (body) must be a valid UUID and should exist in the 'employee' table.
 *    + 'address_line_one' (body) must not be empty.
 *    + 'city' (body) must not be empty and should not contain special characters.
 *    + 'state_id' (body) must not be empty, should be a valid integer, and the state should exist in the 'states' table.
 *    + 'country_id' (body) must not be empty, should be a valid integer, and the country should exist in the 'countries' table.
 *    + 'zip_code' (body) must not be empty, should only contain numbers and spaces, and have a length between 5 and 10.
 *
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `currentAddressUpdate` service function to modify the employee's current address details.
 *    + If Success:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with error message.
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
const currentAddressUpdate = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest("info", req, "Update employee current address details request");
  /* Log Request */

  /* Default Variable */
  var responseData = "";
  /* Default Variable */

  /* Writing validation rules to the input request */
  var validations = [
    check("request_id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check("id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async (value) => {
        const employee = await indexService.find('employee', ['id', 'enable_login'], { id: value, status: 'Active' })
        if (!employee.status && value != '') {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
        }
        return true;
      }),
    check("address_line_one")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.address1Required),
    check("city")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.cityRequired)
      .matches(regexPatterns.alphaNumericCharactersAndSpacesFiftyOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.cityInvalid),
    check("state_id")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.stateIdRequired)
      .isInt().withMessage(responseMessages.employee.behalfOnboarding.stateIdInvalid)
      .custom(async (value) => {
        const stateData = await indexService.find('states', ['id'], { id: value, is_active: 1 })
        if (!stateData.status && value != '') {
          return Promise.reject(responseMessages.employee.behalfOnboarding.stateIdNotExists)
        }
        return true
      }),
    check("country_id")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.countryIdRequired)
      .isInt().withMessage(responseMessages.employee.behalfOnboarding.countryIdInvalid)
      .custom(async (value) => {
        const countryData = await indexService.find('countries', ['id'], { id: value, is_active: 1 })
        if (!countryData.status && value != '') {
          return Promise.reject(responseMessages.employee.behalfOnboarding.countryIdNotExists)
        }
        return true
      }),
    check("zip_code")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.zipCodeRequired)
      .matches(regexPatterns.numbersSpaceRegex)
      .withMessage(responseMessages.employee.behalfOnboarding.zipCodeInvalid)
      .isLength({ min: 5, max: 10 })
      .withMessage(responseMessages.employee.behalfOnboarding.zipCodeShouldBe),
  ];

  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);
  /*Run the validation rules. */

  /**
       * If validation is success
       * + Update employee details in the collection.
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    const condition = { employee_id: req.params.id }
    var employee_data = await employeeServices.currentAddressUpdate(req.body, condition);
    if (employee_data.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.updatedSuccessfully,
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong,
        error: employee_data.error,
      }
    }
    /* Log Response */
    logResponse("info", req, responseData, "Update employee current address details response");
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
 * Store or update employment details for an employee.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'storeOrUpdateEmploymentDetails' service function to create or update employment details.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Retrieve the organization date format using `format.getDateFormat()`.
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Convert 'date_of_joining' in the request to 'YYYY-MM-DD' format using Moment.js and update the request.
 * 
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'id' (params), must be a valid UUID and should exist in the 'employee' table.
 *    + 'date_of_joining' (body), must not be empty and should be a valid date.
 *    + 'employment_category_id' (body), must not be empty, should be a valid integer, and should exist in the  'employee_categories' table.
 *    + 'ssn' (body), must not be empty and should be a valid SSN format, and should not exist in the 'employee' table.
 *    + 'is_usc' (body), must not be empty and should be either 0 or 1.
 *    + 'visa_type_id' (body), should be a valid integer and should exist in the 'visa_types' table if 'is_usc' is 0.
 *    + 'reporting_manager_id' (body), should be a valid UUID and should exist in the 'employee' table if 'employment_type_id' is 1.
 *
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `storeOrUpdateEmploymentDetails` service function to create or update employment details.
 *   + If Success:
 *      - Prepare the response with success data.
 *    + Else:
 *      - Prepare the response with error message.
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
const employmentDetailsUpdate = tryCatch(async (req, res) => {
  let dateFormat = await format.getDateFormat(); // date format
  /* Log Request */
  logRequest("info", req, "Update employment details request");
  /* Log Request */

  /* Default Variable */
  var responseData = "";
  /* Default Variable */

  let modified_date1 = req.body.date_of_joining != '' ? moment(req.body.date_of_joining, dateFormat).format('YYYY-MM-DD') : '';
  req.body.date_of_joining = modified_date1 // From date format

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
      .custom(async (value) => {
        const employee = await indexService.find('employee', ['id'], { id: value, status: 'Active' })
        if (!employee.status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
        }
      }),
    check("date_of_joining")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.dateOfJoiningRequired)
      .custom((value) => {
        var isDate = new Date(value);
        if (isNaN(isDate.getTime())) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.dateOfJoiningInvalid);
        }
        return true;
      }),
    check('enable_login')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.isEnableLoginRequired)
      .isBoolean()
      .withMessage(responseMessages.employee.behalfOnboarding.isEnableLoginIsInvalid),
    check("employment_category_id")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeCategoryIdRequired)
      .isInt()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeCategoryIdInvalid)
      .custom(async (value) => {
        const employmentCategoryData = await indexService.find('employee_categories', ['id'], { id: value, is_active: 1 })
        if (!employmentCategoryData.status && value != '') {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeCategoryIdNotExists)
        }
      }),
    check("ssn")
      .trim()
      // .notEmpty()
      // .withMessage(responseMessages.employee.behalfOnboarding.ssnRequired)
      .custom(async (value) => {
        var pattern = regexPatterns.ssnRegex
        if (pattern.test(value)) {
          const employee = await indexService.find('employee', ['id'], { ssn: value, status: "Active" })
          if (employee.status) {
            if (req.params.id != employee.data[0].id) {
              return Promise.reject(responseMessages.employee.behalfOnboarding.ssnAlreadyExists)
            }
          }
          return true
        } else {
          return Promise.reject(responseMessages.employee.behalfOnboarding.ssnInvalid);
        }
      }),
    check("is_usc")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.isUsEmployeeRequired)
      .isInt({ min: 0, max: 1 })
      .withMessage(responseMessages.employee.behalfOnboarding.isUsEmployeeInvalid),
    check("visa_type_id")
      .trim()
      .custom(async (value) => {
        if (Number(req.body.is_usc) === 0) {
          if (Number.isInteger(Number(value)) && value != '') {
            await indexService.find('visa_types', ['id'], { id: value, is_active: 1 })
              .then((visaTypeServicesData) => {
                if (!visaTypeServicesData.status && value != '') {
                  return Promise.reject(responseMessages.employee.behalfOnboarding.visaTypeIdNotExists);
                }
                return true;
              });
          } else {
            return Promise.reject(responseMessages.employee.behalfOnboarding.visaTypeIdInvalid);
          }
        } else {
          return true
        }
      }),
    check('reporting_manager_id')
      .trim()
      .custom(async (value) => {
        if (req.body.employment_type_id == 1) {
          if (value != null && value != '') {
            var pattern = regexPatterns.uuidRegex;
            if (pattern.test(value)) {
              const employeeData = await indexService.find('employee', ['id'], { id: value, status: 'Active' });
              if (!employeeData.status) {
                return Promise.reject(responseMessages.employee.behalfOnboarding.reportingEmployeeIdNotExists)
              }
            } else {
              return Promise.reject(responseMessages.employee.behalfOnboarding.reportingEmployeeIdInvalid)
            }
          } else {
            return Promise.reject(responseMessages.employee.behalfOnboarding.reportingEmployeeIdRequired)
          }
        } else {
          return true
        }
      }),
    check("employment_type_id")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.employmentTypeIdRequired)
      .isInt()
      .withMessage(responseMessages.employee.behalfOnboarding.employmentTypeIdInvalid)
      .custom(async (value) => {
        const employmentTypeData = await indexService.find('employment_types', ['id', 'name'], { id: value, is_active: 1 })
        if (!employmentTypeData.status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employmentTypeIdNotExists)
        }
        req.body.employment_type_name = employmentTypeData.data[0].name
        return true
      }),
    check('role_id')
      .trim()
      .custom(async (value) => {
        if (req.body.employment_type_id == 1) {
          if (value != null && value != '') {
            var pattern = regexPatterns.numbersSpaceRegex;
            if (pattern.test(value)) {
              const roleData = await indexService.find('roles', ['id'], { id: value, is_active: 1 });
              if (!roleData.status) {
                return Promise.reject(responseMessages.employee.behalfOnboarding.roleIdNotExists)
              }
            } else {
              return Promise.reject(responseMessages.employee.behalfOnboarding.invalidRoleId)
            }
          } else {
            return Promise.reject(responseMessages.employee.behalfOnboarding.roleIdRequired)
          }
        } else {
          return true
        }
      }),
  ];

  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);
  /*Run the validation rules. */

  /**
       * If validation is success
       * + Update employee details in the collection.
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id }
    var employmentData = await employeeServices.employmentDetailsUpdate(req.body, condition);
    if (employmentData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.updatedSuccessfully
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong,
        error: employmentData.error
      }
    }
    /* Log Response */
    logResponse("info", req, responseData, "Update employment details response");
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
 * Employee listing request to fetch employee data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'employee' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 *
 * Logic :
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + limit(query) is not mandatory, it should be a integer.
 *    + page(query) is not mandatory, it should be a integer.
 *    + employment(query) is mandatory, it should be a integer.
 *    + category(query) is mandatory, it should be a integer.
 *    + status(query) is mandatory, it should be a boolean.
 *    + visa(query) is mandatory, it should be a integer.
 *    + search(query) is mandatory, it should be a string.
 *  - Loop the req.query and using switch case and assign to the condition  
 *  
 *  - Run the validation rules
 *    + If validation success
 *      ~ Call the service function(listing) to fetch the data and send the condition(defined above), limit, page,
 *        # Add the service function(listing) return data to response.
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
 * @returns None
 * @throws {InvalidRequestError} - If the request ID is missing.
 */
const listing = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, "Getting employee listing request");

  // Default Variable
  var responseData;

  // Writing validation rules to the input request
  var validations = [
    check("request_id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check("employment")
      .optional()
      .custom(async (value) => {
        if (!Array.isArray(value)) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employmentNotArray);
        }

        for (const employmentType of value) {
          if (!Number.isInteger(employmentType)) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.employmentInvalidType);
          }

          if (![1, 2, 3].includes(employmentType)) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.employmentInvalidValue);
          }
        }

        return true;
      }),
    check("category")
      .optional()
      .custom(async (value) => {
        if (value != null && value != '' && value != undefined) {
          if (!Array.isArray(value)) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.categoryMustBeArray);
          }

          for (let i = 0; i < value.length; i++) {
            const categoryId = value[i];
            if (isNaN(categoryId) || parseInt(categoryId) <= 0) {
              return Promise.reject(responseMessages.employee.behalfOnboarding.employeeCategoryIdInvalid);
            }

            const categoryData = await indexService.find('employee_categories', ['id', 'name'], { id: categoryId, is_active: 1 });
            if (!categoryData.status) {
              return Promise.reject(responseMessages.employee.behalfOnboarding.employeeCategoryIdNotExists);
            }
          }

          return true;
        }
        return true;
      }),
    check("visa")
      .optional()
      .custom(async (value) => {
        if (value != null && value != '' && value != undefined) {
          if (!Array.isArray(value)) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.visaMustBeArray);
          }

          for (let i = 0; i < value.length; i++) {
            const visaId = value[i];
            if (isNaN(visaId) || parseInt(visaId) <= 0) {
              return Promise.reject(responseMessages.employee.behalfOnboarding.visaTypeIdInvalid);
            }

            const employmentTypeData = await indexService.find('visa_types', ['id', 'name'], { id: visaId, is_active: 1 });
            if (!employmentTypeData.status) {
              return Promise.reject(responseMessages.employee.behalfOnboarding.visaTypeIdNotExists);
            }
          }

          return true;
        }
        return true;
      }),
    check("status")
      .optional()
      .custom(async (value) => {
        if (value != null && value != '' && value != undefined) {
          if (!Array.isArray(value)) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.statusMustBeArray);
          }

          for (let i = 0; i < value.length; i++) {
            const statusValue = value[i];
            if (statusValue !== 'Active' && statusValue !== 'In Active') {
              return Promise.reject(responseMessages.employee.behalfOnboarding.invalidStatus);
            }
          }
        }
        return true;
      }),
    check("sort_column")
      .optional()
      .custom(async (value) => {
        if (value != null && value != '' && value != undefined) {
          let columns = ["emp.display_name", "emp.created_at", "emp_type.name", "vt.name", "emp.sub_status"];
          if (!columns.includes(value)) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.invalidSortColumn);
          }
        }
        return true;
      }),
    check("sort_order")
      .optional()
      .custom(async (value) => {
        if (value != null && value != '' && value != undefined) {
          let order = ["ASC", "DESC", "asc", "desc"];
          if (!order.includes(value)) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.invalidSortOrder);
          }
        }
        return true;
      }),
  ];

  // Run the validation rules.
  for (var validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);

  /**
   * If validation is success
   * + get employee details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {

    let body = removeEmptyAndUndefinedKeys(req.body);

    // Default Variable
    let limit = (body.limit) ? (body.limit) : pagination.limit;
    let page = (body.page) ? (body.page) : pagination.page;
    let sort_column = (body.sort_column) ? (body.sort_column) : 'emp.created_at';
    let sort_order = (body.sort_order) ? (body.sort_order) : 'DESC';
    var condition = {};

    condition.employment = (body.employment?.length > 0) ? body.employment.toString() : null;
    condition.category = (body.category?.length > 0) ? body.category.toString() : null;
    condition.visa = (body.visa?.length > 0) ? body.visa.toString() : null;
    condition.status = (body.status?.length > 0) ? body.status.toString() : null;
    // condition.status = (body.status?.length > 0) ? body.status.map(num => Boolean(num)) : null;
    condition.search = (body.search) ? body.search : '';
    condition.enable_balance_sheet = (body.enable_balance_sheet && body.enable_balance_sheet == 'true') ? true : null;


    var listingData = await employeeServices.listing(condition, page, limit, sort_column, sort_order);
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
 * Update employee Profile function to modify employee profile information.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful:
 *      ~ Define the condition object for identifying the employee's profile to update.
 *      ~ Call the 'updateProfile' service function to update the employee's profile.
 *      ~ Prepare the response with success data.
 *    + Else:
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Extract the 'slug_name' from the URL path and add it to the request.
 * - Set default variables for 'responseData'.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'id' (params), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *    + 'documents.*.new_document_id' (body), must not be empty, should be a valid UUID, and should exist in the 'temp_upload_documents' table.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Define the condition object for identifying the employee's profile to update based on the 'id' parameter.
 *    + Call the 'updateProfile' service function to update the employee's profile.
 *    + Prepare the response with success data.
 *    + Log the response.
 *    + Return the response using 'responseHandler()'.
 * - If validation fails:
 *    + Add error validation to the response.
 *
 * Notes:
 * - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const updateProfile = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, "Update Employee Profile request");
  /* Log Request */

  /* Default Variable */
  var responseData = '';
  /* Default Variable */

  /* Writing validation rules to the input request */
  var validations = [
    check("request_id").trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('id')
      .trim().escape()
      .notEmpty().withMessage(responseMessages.employee.employeeIdRequired)
      .isUUID().withMessage(responseMessages.employee.employeeIdInvalid)
      .custom(async value => {
        const employeeData = await indexService.find('employee', ['id', 'reference_id'], { id: value, status: 'Active' });
        if (!employeeData.status) {
          return Promise.reject(responseMessages.employee.employeeIdNotExists);
        }
        req.body.reference_id = employeeData.data[0].reference_id
      }),
    check('documents.*.new_document_id')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.employee.documents.newDocumentIdRequired)
      .isUUID().withMessage(responseMessages.employee.documents.newDocumentIdInvalid)
      .custom(async (value) => {
        const documentsData = await indexService.find('temp_upload_documents', ['*'], { id: value }, null, [], null, null, null, false);
        if (!documentsData.status) {
          return Promise.reject(responseMessages.employee.documents.newDocumentIdNotExists);
        }
      }),
  ];
  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (var validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);
  /*Run the validation rules. */

  /**
       * If validation is success
       * + Update employee details in the collection.
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id }
    var response = await employeeServices.updateProfile(req.body, condition);
    if (response.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully }
    } else {
      responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error }
    }


    /* Log Response */
    logResponse("info", req, responseData, "Update employee Profile Response.");
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */

  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Payroll Pay Configurations function to retrieve employee balance, hours, and payroll information.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful:
 *      ~ Fetch employee data using 'indexService.find'.
 *      ~ If employee data exists, prepare the response with success data.
 *      ~ If employee data doesn't exist, throw an error.
 *    + Else:
 *      ~ Add error validation to the response.
 * - Log the incoming request.
 * - Set default variables for 'responseData'.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (query), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Fetch employee data based on the 'employee_id' query parameter using 'indexService.find'.
 *    + If employee data exists, prepare the response with success data.
 *    + If employee data doesn't exist, throw an error.
 *    + Log the response.
 *    + Return the response using 'responseHandler()'.
 * - If validation fails:
 *    + Add error validation to the response.
 *
 * Notes:
 * - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request or employee data doesn't exist.
 */
const payrollPayConfigurations = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'to get the employee balance, hours info')
  /* Log Request */

  /* Default Variable */
  var responseData = ''
  /* Default Variable */

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
      .withMessage(responseMessages.employee.employeeIdRequired)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdRequired)
      .custom(async (value) => {
        const employeeData = await indexService.find('employee', ['id'], { id: value })
        var status = employeeData.status
        if (!status) {
          return Promise.reject(
            responseMessages.employee.behalfOnboarding.employeeIdInvalid
          )
        }
        return true
      })
  ]
  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (var validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  /**
       * If validation is success
       * get employee details in the collection.
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    const employeeData = await indexService.find('employee', ['id', 'hours_worked', 'balance_amount', 'standard_pay_amount', 'payroll_config_settings_id', 'enable_payroll', 'enable_balance_sheet'], { id: req.query.employee_id })
    if (employeeData.status) {
      employeeData.data[0].balance_amount = employeeData.data[0].balance_amount ? parseFloat(employeeData.data[0].balance_amount).toFixed(2) : 0.00
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: employeeData.data[0]
      }

      /* Log Response */
      logResponse('info', req, responseData, 'to get the pay per configuration')
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData)
      /* Return the response */
    } else {
      throw new InvalidRequestError(
        updateField.error,
        responseCodes.codeUnprocessableEntity
      )
    }
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    )
  }
});

/**
 * Employee dropdown request to fetch employee data.
 * 
 * Overview of API:
 * - Validate the request.
 *   + If successful
 *     ~ Call the service function to fetch employee data.
 *     ~ Add 'Success' to the response.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Logging incoming request.
 * - Define the validation rules as follows:
 *   + 'request_id' (query) is mandatory.
 *   + 'emp_type_id' (query) is not mandatory but should be an integer.
 *   + 'timesheet_cycle_id' (query) is not mandatory but should be an integer.
 * 
 * - Run the validation rules.
 *   + If validation is successful:
 *     ~ Call the service function to fetch employee data based on the query parameters.
 *     ~ Add the data returned by the service function to the response.
 *   + Else:
 *     ~ Add error validation to the response.
 * 
 * - Prepare the response with appropriate status codes.
 * - Log the response.
 * - Return the response using the responseHandler().
 * 
 * Notes:
 * - Exception handling is used with try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns None.
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const dropdown = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest("info", req, "Drop Down employee request");
  /* Log Request */

  /* Default Variable */
  var responseData = "";
  /* Default Variable */
  /* Writing validation rules to the input request */
  var validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('emp_type_id')
      .trim()
      .custom(async (value) => {
        if (value != '' && value != '') {
          if (Number.isInteger(Number(value))) {
            return true;
          }
          else {
            return Promise.reject(responseMessages.employee.common.invalidType)
          }
        }
        return true;
      }),
    check('timesheet_cycle_id')
      .trim()
      .custom(async (value) => {
        if (value != '' && value != '') {
          if (Number.isInteger(Number(value))) {
            return true;
          }
          else {
            return Promise.reject(responseMessages.employee.common.invalidCycle)
          }
        }
        return true;
      }),
  ];

  /* Writing validation rules to the input request */
  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);
  /*Run the validation rules. */

  /**
       * If validation is success
       * + get employee details in the collection.
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    const employeeData = await employeeServices.dropdown(req.query);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.success,
      data: employeeData
    };
    /* Log Response */
    logResponse("info", req, responseData, "Drop down employee response");
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
})

/**
 * Function to get payroll configuration settings for an employee.
 *
 * Logic:
 * - Log the incoming request.
 * - Initialize a variable 'responseData'.
 * 
 * - Define validation rules for the input request, including checks for request_id and employee_id.
 * - Run the validation rules and collect any validation errors.
 * 
 * - If there are no validation errors (i.e., 'errors' is empty):
 *   - Call the 'getPayrollConfigSettings' function with the query parameters from the request.
 *   - Based on the status in the response from 'getPayrollConfigSettings', prepare the response data.
 *     - If successful, set the response data with the retrieved payroll configuration settings.
 *     - If there's an error, set the response data with an error message.
 * 
 * - Log the response.
 * - Return the response to the client.
 * 
 * - If there are validation errors:
 *   - Throw an 'InvalidRequestError' with the first validation error message and a status code indicating unprocessable entity.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
const getPayrollConfigSettings = tryCatch(async (req, res) => {

  /* Log Request */
  await logRequest('info', req, 'get payroll config settings details request');
  /* Log Request */

  /* Default Variable */
  let responseData = '';
  /* Default Variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id').trim().escape().notEmpty().withMessage(responseMessages.common.requestIdRequired),
    check('employee_id')
      .trim().escape()
      .notEmpty().withMessage(responseMessages.employee.employeeIdRequired)
      .isUUID().withMessage(responseMessages.employee.employeeIdInvalid)
      .custom(async value => {
        const employeeData = await indexService.find('employee', ['id'], { id: value });
        if (!employeeData.status) {
          return Promise.reject(responseMessages.employee.employeeIdNotExists);
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
       * get employee details in the collection.
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {

    let employeeData = await employeeServices.getPayrollConfigSettings(req.query);
    if (!employeeData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: employeeData.message, error: employeeData.error, message: responseMessages.common.noRecordFound, data: [] };
    }
    else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: employeeData.data };
    }

    /* Log Response */
    await logResponse('info', req, responseData, 'get payroll config settings details response');
    /* Log Response */

    /* Return the response */
    await responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Deactivate User function to update employee deactivation details.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Modify the date format for 'end_date' and 'relieving_date' fields.
 *      ~ Check and validate various fields such as 'request_id', 'id', 'placement_id',
 *        'end_date', and 'relieving_date'.
 *      ~ Update the end date of placements if needed.
 *      ~ Call the 'updateEmployee' service function to update employee deactivation details.
 *      ~ Prepare the response with a success message.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Modify the date format for 'end_date' and 'relieving_date' fields.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'id' (body), must be a valid UUID and should exist in the 'employee' table.
 *    + 'placement_id' (data array), must be a valid UUID and should exist in the 'placements' table.
 *    + 'end_date' (data array), must be a valid date.
 *    + 'relieving_date' (body), must not be empty and should be a valid date.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Check for active placements and validate the relieving date.
 *    + Update the end date of placements if needed.
 *    + Call the `updateEmployee` service function to update employee deactivation details.
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
const deactivateUser = tryCatch(async (req, res) => {
  let dateFormat = await format.getDateFormat(); // date format
  /* Log Request */
  logRequest('info', req, 'update employee Deactivate request.')
  /* Log Request */

  /* Default Variable */
  var responseData = ''
  /* Default Variable */

  req.body.data.forEach((item) => {
    if (item.end_date != null && item.end_date != '') {
      let modified_date = moment(item.end_date, dateFormat).format('YYYY-MM-DD');
      item.end_date = modified_date; // Modify the end_date date format
    }
  });

  let modified_date = req.body.relieving_date != '' ? moment(req.body.relieving_date, dateFormat).format('YYYY-MM-DD') : '';
  req.body.relieving_date = modified_date // reliving date format

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
      .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async (value) => {
        const employee = await indexService.find('employee', ['id', 'is_tenant_owner', 'employment_type_id'], { id: value })
        if (!employee.status && value != '') {
          return Promise.reject(responseMessages.employee.behalfOnboarding.invalidEmployeeId)
        } else {
          if (employee.data[0].is_tenant_owner) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.actionNotAllowed)
          }
        }
        if (employee.data[0].employment_type_id == 1) {
          const approvals = await approvalConfigurationRepository.findCountofApprovals(value);
          if (approvals.status) {
            var is_only_approver = false;
            //checks if the user is the only approver for any of the approval_setting
            for (let key in approvals.data) {
              if (approvals.data[key].num_approval_users == 1 && approvals.data[key].is_approver) {
                is_only_approver = true;
                if (approvals.data[key].client_timesheet) {
                  references.push(approvals.data[key].client_timesheet);
                }
                //Collecting the reference ids where the user is used as the only approver
                var references = [approvals.data[key].client_timesheet, approvals.data[key].client_invoice, approvals.data[key].placement_timesheet, approvals.data[key].placement_invoice]
              }
            }
            //If he is the only approver throw an error
            if (is_only_approver) {
              return Promise.reject(responseMessages.employee.behalfOnboarding.isOnlyApprover + references.filter((value) => value !== null).join(', '));
            }
            //else delete the approver user id from approval_users table for all the approval_settings
            else {
              for (let key in approvals.data) {
                await approvalConfigurationRepository.updateApprovalUsers({ id: approvals.data[key].approval_user_id }, { deleted_at: new Date() })
              }
            }
          }
        }

        const placements = await indexService.find('placements', ['id'], { employee_id: value, global_search: `(end_date <= '${moment().format('YYYY-MM-DD')}' or end_date is null)` })
        if (placements.status) {
          req.body.active_placements = placements.data.length;
        } else {
          req.body.active_placements = 0
        }
        return true;
      }),
    check('data.*.placement_id')
      .custom(async (value) => {
        if (value == null && value == '') {
          return Promise.reject(responseMessages.placement.placementIdRequired);
        } else if (value != null && value != '') {
          var pattern = regexPatterns.uuidRegex;
          if (pattern.test(value)) {
            const placement = await indexService.find('placements', ['id'], { id: value })
            if (!placement.status) {
              return Promise.reject(responseMessages.placement.placementIdInvalid)
            }
            return true
          }
        }
      }),
    check('data.*.end_date')
      .custom((value) => {
        if (value != null && value != '') {
          var isDate = new Date(value);
          if (isNaN(isDate.getTime())) {
            return Promise.reject(responseMessages.placement.invalidEndDate);
          }
          return true
        }
        return true;
      }),
    check('relieving_date')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.relievingDateRequired)
      .custom((value) => {
        var isDate = new Date(value);
        if (isNaN(isDate.getTime())) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.invalidRelievingDate);
        }
        return true;
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

  /**
       * If validation is success
       * Update employee details in the collection.
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    if (req.body.active_placements == req.body.data.length && req.body.data.length > 0) {
      let end_dates = [...new Set(req.body.data.map(end_dates => end_dates.end_date))];
      let maxDate = end_dates.reduce(function (a, b) { return a > b ? a : b; });
      if (new Date(req.body.relieving_date) < new Date(maxDate)) {
        throw new InvalidRequestError(responseMessages.employee.behalfOnboarding.relievingDateInvalid, responseCodes.codeUnprocessableEntity)
      }
      await placementServices.updatedEndDate(req.body); // Update Placements end date
    }
    const condition = { id: req.params.id };

    // Update employee data
    if (moment(req.body.relieving_date).format('YYYY-MM-DD') <= moment().format('YYYY-MM-DD')) {
      updateData = { status: 'In Active', relieving_date: req.body.relieving_date, updated_by: req.body.updated_by, updated_at: new Date(), access_token: null, refresh_token: null, fcm_token: null }
    } else {
      updateData = { relieving_date: req.body.relieving_date, updated_by: req.body.updated_by, updated_at: new Date(), access_token: null, refresh_token: null, fcm_token: null }
    }

    await employeeServices.updateEmployee(condition, updateData); // Update employee releving date

    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Update Employee Deactivate Response.')
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
 * Rejoin User function to update employee rejoining details.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Modify the date format for 'rejoin_date'.
 *      ~ Check and validate various fields such as 'request_id', 'id', 'rejoin_date',
 *        'visa_type_id', and 'enable_login'.
 *      ~ Call the 'updateEmployee' service function to update employee rejoining details.
 *      ~ Prepare the response with a success message.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Modify the date format for 'rejoin_date' field.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'id' (body), must be a valid UUID and should exist in the 'employee' table.
 *    + 'rejoin_date' (body), must not be empty and should be a valid date.
 *    + 'visa_type_id' (body), if the employee is not a US citizen, must be a valid visa type.
 *    + 'valid_from' (body), must be a valid date and should be less than today
 *    + 'valid_till' (body), must be a valid date and should be greater than valid_from
 *    + 'enable_login' (body), must not be empty and should be a boolean.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `updateEmployee` service function to update employee rejoining details.
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
const rejoinUser = tryCatch(async (req, res) => {
  let dateFormat = await format.getDateFormat(); // date format
  /* Log Request */
  logRequest("info", req, "Rejoin employee request.");
  /* Log Request */

  /* Default Variable */
  var responseData = "";
  /* Default Variable */

  let modified_date = req.body.rejoin_date != '' ? moment(req.body.rejoin_date, dateFormat).format('YYYY-MM-DD') : '';
  req.body.rejoin_date = modified_date // reliving date format

  if (req.body.valid_from) {
    let modified_from_date = moment(req.body.valid_from, dateFormat).format('YYYY-MM-DD');
    req.body.valid_from = modified_from_date; // Modify the from_date property
  }

  if (req.body.valid_till) {
    let modified_to_date = req.body.valid_till != '' ? moment(req.body.valid_till, dateFormat).format('YYYY-MM-DD') : '';
    req.body.valid_till = modified_to_date; // Modify the to_date property
  }

  /* Writing validation rules to the input request */
  const validations = [
    check("request_id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check("id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async (value) => {
        const employee = await indexService.find('employee', ['id', 'is_us_citizen', 'reference_id', 'last_working_day'], { id: value, status: 'In Active' })
        if (!employee.status && value != '') {
          return Promise.reject(responseMessages.employee.behalfOnboarding.invalidEmployeeId)
        }
        const employeeVisa = await indexService.find('employee_visa_details', ['id'], { employee_id: value })
        req.body.employee_visa_exists = employeeVisa.status
        req.body.is_usc = employee.data[0].is_us_citizen;
        req.body.employee_reference_id = employee.data[0].reference_id;
        req.body.last_working_day = employee.data[0].last_working_day;
        return true;
      }),
    check("rejoin_date")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.rejoinDateRequired)
      .custom((value) => {
        var isDate = new Date(value);
        if (isNaN(isDate.getTime())) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.invalidRejoinDate);
        }
        if (isDate.getTime() < new Date(req.body.last_working_day).getTime()) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.invalidRehireDate);
        }
        return true;
      }),
    check("visa_type_id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.visaTypeIdRequired)
      .custom(async (value) => {
        if (value != undefined && value != null && value != '') {
          const visaTypeServiceData = await indexService.find('visa_types', ['id', 'name'], { id: value })
          if (!visaTypeServiceData.status) {
            return Promise.reject(responseMessages.configurations.visaType.IdNotExists)
          }
          req.body.visa_type_name = visaTypeServiceData.data[0].name
        } else {
          return Promise.reject(responseMessages.employee.behalfOnboarding.visaTypeIdInvalid)
        }
        return true;
      }),
    check('valid_from')
      .trim()
      .custom(async (value) => {
        if (value != undefined && value != null && value != '') {
          let isDate = new Date(value);
          // Invalid date
          if (isNaN(isDate.getTime())) {
            return Promise.reject(responseMessages.employee.visaDetails.InvalidDateValidFrom);
          }
          // 'valid_from' should be always less than 'today'
          if (isDate.getTime() > new Date().getTime()) {
            return Promise.reject(responseMessages.employee.visaDetails.InvalidDateValidFrom);
          }

          if ((req.body.visa_type_id == '' || req.body.visa_type_id == null) && (req.body.support_documents.length > 0 ? (req.body.support_documents[0].visa_document_upload_id == '' || req.body.support_documents[0].visa_document_upload_id == null) : true)) {
            return Promise.reject(responseMessages.employee.visaDetails.cannotAcceptDates);
          }
        }
        return true;
      }),
    check('valid_till')
      .trim()
      .custom((value) => {
        if (value != undefined && value != null && value != '') {
          // In Valid Date
          let isDate = new Date(value);
          if (isNaN(isDate.getTime())) {
            return Promise.reject(responseMessages.employee.visaDetails.InvalidDateValidTill);
          }

          // 'valid_till' should always be greater than 'valid_from'
          if (isDate.getTime() < new Date(req.body.valid_from).getTime()) {
            return Promise.reject(responseMessages.employee.visaDetails.InvalidDateValidTill);
          }

          if ((req.body.visa_type_id == '' || req.body.visa_type_id == null) && (req.body.support_documents.length > 0 ? (req.body.support_documents[0].visa_document_upload_id == '' || req.body.support_documents[0].visa_document_upload_id == null) : true)) {
            return Promise.reject(responseMessages.employee.visaDetails.cannotAcceptDates);
          }
        }
        return true;
      }),
    check('support_documents').isArray({ max: 10 }).withMessage(responseMessages.employee.visaDetails.maxTenFilesOnly),
    check('support_documents.*.visa_document_upload_id')
      .trim()
      .escape()
      .custom(async (value) => {
        if (value != null && value != '' && value != undefined) {
          var pattern = regexPatterns.uuidRegex;
          if (pattern.test(value)) {
            var documentsData = await indexService.find('temp_upload_documents', ['id'], { id: value }, null, [], null, null, null, false)
            if (!documentsData.status) {
              return Promise.reject(responseMessages.employee.visaDetails.supportVisaDocumentUploadIdNotExists)
            }
          } else {
            return Promise.reject(responseMessages.employee.visaDetails.supportVisaDocumentUploadIdInvalid)
          }
        }
        return true
      }),
    check('enable_login')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.isEnableLoginRequired)
      .isBoolean()
      .withMessage(responseMessages.employee.behalfOnboarding.isEnableLoginIsInvalid),
  ];
  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (var validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);
  /*Run the validation rules. */

  /**
       * If validation is success
       * + Update employee details in the collection.
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id };
    const employeeData = await employeeServices.rehireEmployee(req.body, condition);
    if (employeeData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.updatedSuccessfully,
      };

      /* Log Response */
      logResponse("info", req, responseData, "Rejoin employee Response.");
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData);
      /* Return the response */
    } else {
      throw new InvalidRequestError(
        responseMessages.employee.behalfOnboarding.alreadEnabled,
        responseCodes.codeUnprocessableEntity
      );
    }
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    );
  }
});

/**
 * eVerify Status function to update e-Verify status for an employee.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Check and validate various fields such as 'request_id' and 'id'.
 *      ~ Call the 'updateEmployee' service function to update e-Verify status.
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
 *    + 'id' (body), must be a valid UUID and should exist in the 'employee' table.
 *      - The employee should not already have an e-Verify status of 1 (already e-verified).
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `updateEmployee` service function to update e-Verify status to 1.
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
const eVerifyStatus = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update  e- Verify Status request')
  /* Log Request */

  /* Default Variable */
  var responseData = ''
  /* Default Variable */

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
      .withMessage(responseMessages.employee.employeeIdRequired)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async (value) => {
        const employeeData = await indexService.find('employee', ['id', 'e_verified'], { id: value, status: 'Active' })
        var status = employeeData.status
        if (!status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
        }
        if (employeeData.data[0].e_verified == 1) {
          return Promise.reject(responseMessages.employee.alreadyEverified)
        }
        return true
      })
  ]
  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (var validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  /**
       * If validation is success
       * + Update employee details in the collection.
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    const condition = { id: req.params.id }
    updateData = { e_verified: 1 }
    const updateField = await employeeServices.updateEmployee(condition, updateData)
    if (updateField.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.updatedSuccessfully
      }

      /* Log Response */
      logResponse('info', req, responseData, 'Update e - Verify Status Response.')
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData)
      /* Return the response */
    } else {
      throw new InvalidRequestError(
        updateField.message,
        responseCodes.codeUnprocessableEntity
      )
    }
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    )
  }
});

/**
 * Get Relieving function to fetch relieving details for an employee.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Check and validate various fields such as 'request_id' and 'employee_id'.
 *      ~ Call the 'getRelieving' service function to fetch relieving details.
 *      ~ Prepare the response with the fetched data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (query), must be a valid UUID and should exist in the 'employee' table.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `getRelieving` service function to fetch relieving details.
 *    + Prepare the response with the fetched data.
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
const getRelieving = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest("info", req, "Index employee request");
  /* Log Request */

  /* Default Variable */
  var responseData = "";
  /* Default Variable */

  /* Writing validation rules to the input request */
  var validations = [
    check("request_id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('employee_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdRequired)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async (value) => {
        const employee = await indexService.find('employee', ['id'], { id: value })
        if (!employee.status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists)
        }
      })
  ];

  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);
  /*Run the validation rules. */

  /**
       * If validation is success
       * get employee details in the collection.
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    const condition = { id: req.query.employee_id }
    const fetchData = await employeeServices.getRelieving(condition);
    if (fetchData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: fetchData.data ? fetchData.data : [],
      };
    }
    else {
      throw new InvalidRequestError(
        responseMessages.common.failedToFetch,
        responseCodes.codeUnprocessableEntity
      );
    }
    /* Log Response */
    logResponse("info", req, responseData, "Index employee response");
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
 * Login Access Update function to enable or disable login access for an employee.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Check and validate various fields such as 'request_id' and 'employee_id'.
 *      ~ Call the 'find' service function to get employee details and check if the action is allowed.
 *      ~ Based on the current login status, call either 'disableLogin' or 'enableLogin' service function.
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
 *    + 'employee_id' (body), must be a valid UUID and should exist in the 'employee' table.
 *      - Check if the employee is not a tenant owner and get the current login status.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Based on the current login status, call either 'disableLogin' or 'enableLogin' service function.
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
const loginAccessUpdate = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest("info", req, "enable login employee request");
  /* Log Request */

  /* Default Variable */
  var responseData = "";
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
        const employee = await indexService.find('employee', ['id', 'is_tenant_owner', 'enable_login'], { id: value })
        if (!employee.status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.invalidEmployeeId)
        } else {
          if (employee.data[0].is_tenant_owner) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.actionNotAllowed)
          } else if (employee.data[0].id == req.body.loginUserId) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.actionNotAllowed)
          }
        }
        req.body.login_status = employee.data[0].enable_login
        return
      })
  ];
  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);
  /*Run the validation rules. */

  /**
       * If validation is success
       * + Update employee details in the collection.
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    let enablelog;
    if (req.body.login_status) { // Based on the previous status enable/disable the access
      enablelog = await employeeServices.disableLogin(req.body);
    } else {
      enablelog = await employeeServices.enableLogin(req.body);
    }
    if (enablelog.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong, error: enablelog.error
      }
    }
    /* Log Response */
    logResponse("info", req, responseData, "enable login response");
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
 * Salary Per Payroll function to calculate the employee's salary per payroll based on configuration settings.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Check and validate various fields such as 'request_id', 'employee_id', and 'pay_value'.
 *      ~ Call the 'find' service function to get employee details and check if payroll configuration is set.
 *      ~ Call the 'salaryPerPayrollCalculation' service function to calculate the salary per payroll.
 *      ~ Prepare the response with the calculated amount.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must be a valid UUID and should exist in the 'employee' table.
 *      - Check if the payroll configuration is set for the employee.
 *    + 'pay_value' (body), must not be empty and should be a valid float.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the 'salaryPerPayrollCalculation' service function to calculate the salary per payroll.
 *    + Prepare the response with the calculated amount.
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
const salaryPerPayroll = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'To get employee per payroll amount')
  /* Log Request */

  /* Default Variable */
  var responseData = ''
  /* Default Variable */

  /* If the payvalue is empty consider as 0 & return 0 */
  req.body.pay_value = req.body.pay_value == '' ? 0 : req.body.pay_value;
  /* If the payvalue is empty consider as 0 & return 0 */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('employee_id')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.employeeIdRequired)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdRequired)
      .custom(async (value) => {
        const employeeData = await indexService.find('employee', ['id', 'payroll_config_settings_id'], { id: value })
        var status = employeeData.status
        if (!status) {
          return Promise.reject(
            responseMessages.employee.behalfOnboarding.employeeIdInvalid
          )
        }
        if (!employeeData.data[0].payroll_config_settings_id) {
          return Promise.reject(
            responseMessages.employee.payrollConfigIsNotConfigured
          )
        }
        req.query.payroll_config_settings_id = employeeData.data[0].payroll_config_settings_id;
        return true
      }),
    check('pay_value')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.payCycleConfiguration.payValueReqired)
      .isFloat()
      .withMessage(responseMessages.configurations.payCycleConfiguration.payValueInvalid)
  ]
  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (var validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  /**
       * If validation is success
       * + get employee details in the collection.
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    const employeePay = await employeeServices.salaryPerPayrollCalculation(req.query)
    if (employeePay.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        amount: employeePay.data
      }

      /* Log Response */
      logResponse('info', req, responseData, 'to get the pay per configuration')
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData)
      /* Return the response */
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong, error: enablelog.error
      }
    }
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    )
  }
});

/**
 * Get Profile Index function to retrieve employee profile details.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'getProfileIndex' service function to get employee profile details.
 *      ~ Prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the 'getProfileIndex' service function to get employee profile details.
 *    + If data exists:
 *      ~ Prepare the response with fetched data.
 *    + Else:
 *      ~ Prepare the response with an error message.
 *    + Log the response.
 *    + Return the response using `responseHandler()`.
 * - If validation fails:
 *    + Add error validation to the response.
 *
 * Notes:
 * - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const getProfileIndex = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'To get employee profile')
  /* Log Request */

  /* Default Variable */
  var responseData = ''
  /* Default Variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired)
  ]
  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (var validation of validations) {
    var result = await validation.run(req)
    if (result.errors.length) break
  }
  var errors = validationResult(req)
  /*Run the validation rules. */

  /**
       * If validation is success
       * + get employee details in the collection.
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    const employeeProfile = await employeeServices.getProfileIndex(req.body)
    if (employeeProfile.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.success,
        data: employeeProfile.data
      }

      /* Log Response */
      logResponse('info', req, responseData, 'to get employee Index')
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData)
      /* Return the response */
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError,
        message: responseMessages.common.somethindWentWrong, error: employeeProfile.error
      }
    }
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    )
  }
});

/**
 * Update Employee Profile function to modify employee profile details.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Prepare the condition and update data.
 *      ~ Call the 'updateEmployee' service function to modify employee details.
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
 *    + 'id' (body), must be a valid UUID and should exist in the 'employee' table.
 *    + 'first_name' (body), must not be empty and match the pattern of alpha characters and spaces.
 *    + 'last_name' (body), must not be empty and match the pattern of alpha characters and spaces.
 *    + 'middle_name' (body), must match the pattern of alpha characters and spaces.
 *    + 'contact_number' (body), must not be empty and match the phone number pattern. It should be unique.
 *    + 'alternate_contact_number' (body), if present, must match the phone number pattern.
 *    + 'email_id' (body), must not be empty, be a valid email, and should be unique.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Prepare the condition and update data.
 *    + Call the 'updateEmployee' service function to modify employee details.
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
const updateEmployeeProfile = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest("info", req, "update employee profile request");
  /* Log Request */

  /* Default Variable */
  var responseData = "";
  /* Default Variable */

  /* Writing validation rules to the input request */
  var validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check("first_name")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.firstNameRequired)
      .matches(regexPatterns.alphaCharactersAndSpacesThirtyThreeOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.firstNameInvalid),
    check("last_name")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.lastNameRequired)
      .matches(regexPatterns.alphaCharactersAndSpacesThirtyThreeOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.lastNameInvalid),
    check("middle_name")
      .trim()
      .matches(regexPatterns.alphaCharactersAndSpacesThirtyThreeOnly)
      .withMessage(responseMessages.employee.behalfOnboarding.middleNameInvalid),
    check("contact_number")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.contactNumberRequired)
      .matches(regexPatterns.phoneRegex)
      .withMessage(responseMessages.employee.behalfOnboarding.contactNumberInvalid)
      .custom(async (value) => {
        const employeeData = await indexService.find('employee', ['id'], { contact_number: value, status: 'Active' })
        if (employeeData.status) {
          if (employeeData.data[0].id != req.body.loginUserId) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.contactNumberExists)
          }
        }
      }),
    check("alternate_contact_number")
      .trim()
      .custom((value) => {
        if (value != null && value != '') {
          var pattern = regexPatterns.phoneRegex
          if (!pattern.test(value)) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.alternateContactNumber);
          }
          return true
        } else {
          return true
        }
      }),
    check("email_id")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.emailIdRequired)
      .isEmail()
      .withMessage(responseMessages.employee.behalfOnboarding.emailIdInvalid)
      .custom(async (value) => {
        const employeeData = await indexService.find('employee', ['id'], { email_id: value.toLowerCase(), status: 'Active' })
        if (employeeData.status && value != '') {
          if (employeeData.data[0].id != req.body.loginUserId) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.emailIdExists)
          }
        }
      }),

  ];
  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);
  /*Run the validation rules. */

  /**
       * If validation is success
       * + Update employee details in the collection.
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    const condition = { id: req.body.loginUserId };
    const updateData = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      middle_name: req.body.middle_name ? req.body.middle_name : null,
      display_name: req.body.first_name + ' ' + (req.body.middle_name == '' || req.body.middle_name == null ? '' : req.body.middle_name + ' ') + req.body.last_name,
      email_id: req.body.email_id,
      contact_number: req.body.contact_number,
      alternate_contact_number: req.body.alternate_contact_number ? req.body.alternate_contact_number : null
    };
    const employeeData = await employeeServices.updateEmployee(condition, updateData);
    if (employeeData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.updatedSuccessfully,
      };
    } else {
      responseData = {
        statusCode: responseCodes.codeUnprocessableEntity,
        message: responseMessages.common.somethindWentWrong, error: employeeData.error
      }
    }
    /* Log Response */
    logResponse("info", req, responseData, "update employee profile response");
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
 * Update Employee Off Board function to update the employee offboarding details.
 * 
 * Overview of Function:
 * - Validate the request.
 *    + If successful:
 *      ~ Call the 'updateOffBoardEmployee' service function to update the employee's off boarding data.
 *      ~ Prepare the response with success data.
 *    + Else:
 *      ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Retrieve the organization date format using `format.getDateFormat()`.
 * - Set default variables for 'responseData'.
 * - Define the validation rules as follows:
 *    + 'request_id' (body), must not be empty.
 *    + 'employee_id' (body), must not be empty, should be a valid UUID, and should exist in the 'employee' table.
 *    + 'key' (body), must be in 'disable_user_access_across_apps', 'notify_emails', 'delete_email_id_on', 'settlement_mode'.
 *    + 'value' (body), will have differenct validation based on the key provided.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Define the condition object for identifying the employee's profile to update based on the 'id' parameter.
 *    + Call the 'updateOffBoardEmployee' service function to update the employee's offboard data.
 *    + Prepare the response with success data.
 *    + Log the response.
 *    + Return the response using 'responseHandler()'.
 * - If validation fails:
 *    + Add error validation to the response.
 * 
 * Notes:
 * - Exception handling using try-catch.
 *    
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const offBoardEmployee = tryCatch(async (req, res) => {
  // Log Request
  logRequest('info', req, "Employee off Board request");

  let dateFormat = await format.getDateFormat(); // date format

  let modified_date = req.body.last_working_day != '' ? moment(req.body.last_working_day, dateFormat).format('YYYY-MM-DD') : '';
  req.body.last_working_day = modified_date // From date format

  // Default Variable
  var responseData;
  var updateData;
  var condition;
  let employeeData;

  // Writing validation rules to the input request
  var validations = [
    check("request_id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('employee_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.employeeIdRequired)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdRequired)
      .custom(async (value) => {
        employeeData = await indexService.find('employee', ['id', 'balance_amount'], { id: value })
        let status = employeeData.status
        if (!status) {
          return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
        } else {
          if (employeeData.data[0].id == req.body.loginUserId) {
            return Promise.reject(responseMessages.employee.behalfOnboarding.actionNotAllowed)
          }
        }

        const employeeOffBoardData = await indexService.find('employee_off_boarding', ['id'], { employee_id: value });
        condition = { id: employeeOffBoardData?.data[0]?.id };
        updateData = { employee_id: req.body.employee_id };
        return true
      }),
    check('key')
      .optional()
      .isIn(['disable_user_access_across_apps', 'delete_email_id_on', 'settlement_mode'])
      .withMessage(responseMessages.offBoardEmployee.invalidKeyValue),
    check('value')
      .optional()
      .custom(value => {
        const key = req.body.key;

        if (key == 'disable_user_access_across_apps') {
          if (typeof value != 'boolean') {
            return Promise.reject(responseMessages.offBoardEmployee.invalidDiableUserAccessValue)
          } else {
            updateData = {
              ...updateData, ...{
                'disable_user_access_across_apps': value
              }
            }
          }
        }

        if (key == 'delete_email_id_on' && value) {
          var isDate = new Date(value);
          if (value == undefined || value == null || isNaN(isDate.getTime())) {
            return Promise.reject(responseMessages.offBoardEmployee.invalidDeleteEmailIdOn);
          } else {
            value = moment(value, dateFormat).format('YYYY-MM-DD');
            updateData = {
              ...updateData, ...{
                'delete_email_id_on': value,
                'delete_email_id_document': req.body.delete_email_id_document,
                'skip_delete_email_id': req.body.skip_delete_email_id
              }
            }
          }
        }

        if (key == 'settlement_mode' && employeeData.data[0]?.balance_amount > 0) {
          if (!payVia.includes(value)) {
            return Promise.reject(responseMessages.offBoardEmployee.invalidSettlementMode)
          } else {
            updateData = {
              ...updateData, ...{
                'settlement_mode': value,
                'skip_settlement_mode': req.body.skip_settlement_mode
              }
            }
          }
        }
        return true;
      }),
    check('notify_emails')
      .custom(value => {
        if (value != undefined && value != '' && value != null) {
          updateData = {
            ...updateData, ...{
              'notify_emails': value,
              'skip_notify_emails': req.body.skip_notify_emails
            }
          }
          return true;
        }
        return true;
      }),
    check("last_working_day")
      .trim()
      .notEmpty()
      .withMessage(responseMessages.employee.lastWorkingDayRequired)
      .custom((value) => {
        var isDate = new Date(value);
        if (isNaN(isDate.getTime())) {
          return Promise.reject(responseMessages.employee.lastWorkingDayInvalid);
        }
        return true;
      }),
  ];

  // Run the validation rules.
  for (let validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);

  /**
   * If validation is success
   * + get employee details in the collection.
   * If Validation Fails
   * + Return the error message.
   */
  if (errors.isEmpty()) {
    const response = await employeeServices.updateOffBoardEmployee(updateData, condition, req.body);

    if (response.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.updatedSuccessfully,
        data: response.data[0]
      }
    } else {
      responseData = {
        statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error
      }
    }
    // Log Response
    logResponse("info", req, responseData, "Employee off Board response");

    // Return the response
    responseHandler(res, responseData);
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    );
  }
})

/**
 * Employee Off Boarding Deatils function to retrieve an employee off boarding details.
 * 
 * Oviewview of Function:
 * - Validate the request.
 *    + If successful.
 *      ~ Call the employeeOffBoadingDetails service function to retrieve the off boarding details of the specific employee.
 *      ~ Prepare the response with retrieved data.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Return the response.
 * 
 * Logic:
 *  - Log the incoming request.
 *  - Set default variables for `responseData`.
 * 
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'id' (query) must be a valid integer and should exist in the 'employee_off_boarding' table.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *    + Call the `employeeOffBoadingDetails` service function to retrieve the employee's offboarding details.
 *    + If Data exists:
 *      - prepare the response with the succeess code and retrieved data.
 *    + Else:
 *      - Prepare the reponse with error message.
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
const employeeOffBoardingDetails = tryCatch(async (req, res) => {

  // Log Request
  logRequest("info", req, "Index employee off boarding request");

  let dateFormat = await format.getDateFormat(); // date format
  req.query.last_working_day = (req.query.last_working_day) ? moment(req.query.last_working_day, dateFormat).format('YYYY-MM-DD') : '';

  // Default Variable
  var responseData;
  var condition = {};

  // Writing validation rules to the input request
  var validations = [
    check("request_id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('employee_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.offBoardEmployee.employeeIdRequired)
      .isUUID()
      .withMessage(responseMessages.offBoardEmployee.employeeIdInvalid)
      .custom(async (value) => {
        const joins = [
          {
            table: 'visa_types',
            condition: ['employee.visa_type_id', 'visa_types.id'],
            type: 'left'
          }
        ]
        const employee = await indexService.find('employee', ['employee.id', 'employment_type_id', 'employee.display_name', 'employee.last_working_day', 'visa_types.name as visa_name'], { 'employee.id': value }, null, joins)
        if (!employee.status) {
          return Promise.reject(responseMessages.offBoardEmployee.employeeIdNotExists)
        }
        condition.employee_name = employee.data[0]?.display_name;
        condition.employment_type_id = employee.data[0]?.employment_type_id;
        condition.visa_name = employee.data[0]?.visa_name;
        condition.last_working_day = (employee.data[0]?.last_working_day) ? moment(employee.data[0]?.last_working_day).format('YYYY-MM-DD') : '';
      }),
    check('last_working_day')
      .custom(value => {
        if (value != '' && value != undefined && value != null) {
          if (!regexPatterns.dateRegex.test(value)) {
            return Promise.reject(
              responseMessages.offBoardEmployee.inValidLastWorkingDay
            )
          } else {
            condition.last_working_day = value;
          }
        } else if (!condition.last_working_day) {
          return Promise.reject(
            responseMessages.offBoardEmployee.lastWorkingDayRequired
          );
        }
        return true;
      })
  ];

  /*Run the validation rules. */
  for (let validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);

  /**
  * If validation is success
  * + get employee off boarding details in the collection.
  * If Validation Fails
  * + Return the error message.
  */
  if (errors.isEmpty()) {

    condition = { ...condition, ...{ 'employee_id': req.query.employee_id } };
    const response = await employeeServices.employeeOffBoadingDetails(condition, dateFormat);

    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.success,
      data: response.data
    };

    // Log Response
    logResponse("info", req, responseData, "Index employee off boarding Data response");

    // Return the response
    responseHandler(res, responseData);
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    );
  }
});

/**
 * Validation Rules for Employee Emergency Contacts
 * Only For Consultant each key in emergency contacts are mandatory.
 * 
 *    + 'emergency_contact.*.relationship_id' (body), must not be empty, should be an integer, and should exist in 'relationship_types' table.
 *    + 'emergency_contact.*.name' (body), must not be empty, and should contain only alphabetic characters.
 *    + 'emergency_contact.*.contact_number' (body), must not be empty and should contain only valid characters for contact numbers.
 *    + 'emergency_contact.*.address_1' (body), must not be empty.
 *    + 'emergency_contact.*.city' (body), must not be empty, and should not contain certain special characters.
 *    + 'emergency_contact.*.zip_code' (body), must not be empty, and should have a specific length.
 *    + 'emergency_contact.*.state_id' (body), must not be empty, and should exist in 'states' table.
 *    + 'emergency_contact.*.country_id' (body), must not be empty, and should exist in 'countries' table.
 * @param {*} employment_type_id 
 * @returns array
 */
async function emergencyContactValidations(employment_type_id) {
  let validations = [];
  if (employment_type_id == 2) {
    validations = [
      check('emergency_contact')
        .isArray({ min: 2 })
        .withMessage(responseMessages.employee.emergencyContactInfo.atLeastTwoContacts),
      check('emergency_contact.*.relationship_id')
        .trim()
        .escape()
        .notEmpty()
        .withMessage(responseMessages.employee.emergencyContactInfo.relationship_id)
        .isInt()
        .withMessage(responseMessages.employee.emergencyContactInfo.relationshipIdInvalid)
        .custom(async value => {
          const relationShipData = await indexService.find('relationship_types', ['id'], { id: value, is_active: true })
          if (!relationShipData.status) {
            return Promise.reject(responseMessages.employee.emergencyContactInfo.relationIdNotExists)
          }
          return true
        }),
      check("emergency_contact.*.name")
        .trim()
        .notEmpty()
        .withMessage(responseMessages.employee.behalfOnboarding.nameRequired)
        .matches(regexPatterns.alphaCharactersAndSpacesThirtyThreeOnly)
        .withMessage(responseMessages.employee.behalfOnboarding.thirtyThreeCharOnly),
      check("emergency_contact.*.contact_number")
        .trim()
        .notEmpty()
        .withMessage(responseMessages.employee.contactNumberRequired)
        .matches(regexPatterns.phoneRegex)
        .withMessage(responseMessages.registration.contactNumberInvalid),
      check("emergency_contact.*.address_1")
        .trim()
        .notEmpty()
        .withMessage(responseMessages.employee.addressLineOneRequired)
        .custom(value => {
          if (value != undefined && value != '' && value != null) {
            if (value.length > 255) {
              return Promise.reject(
                responseMessages.employee.emergencyContactInfo.addressOneInvalid
              )
            }
          }
          return true;
        }),
      check("emergency_contact.*.address_2")
        .trim()
        .custom(value => {
          if (value != undefined && value != '' && value != null) {
            if (value.length > 255) {
              return Promise.reject(
                responseMessages.employee.emergencyContactInfo.addressTwoInvalid
              )
            }
          }
          return true;
        }),
      check("emergency_contact.*.city")
        .trim()
        .notEmpty()
        .withMessage(responseMessages.employee.behalfOnboarding.cityRequired)
        .matches(regexPatterns.alphaNumericCharactersAndSpacesFiftyOnly)
        .withMessage(responseMessages.employee.behalfOnboarding.cityInvalid),
      check("emergency_contact.*.zip_code")
        .trim()
        .notEmpty()
        .withMessage(responseMessages.employee.behalfOnboarding.zipCodeRequired)
        .matches(regexPatterns.zipcode)
        .withMessage(responseMessages.employee.behalfOnboarding.zipCodeShouldBe),
      check('emergency_contact.*.state_id')
        .trim()
        .escape()
        .notEmpty()
        .withMessage(responseMessages.configurations.state.stateIdRequired)
        .custom(async (value) => {
          const state = await indexService.find('states', ['id'], { id: value })
          if (!state.status) {
            return Promise.reject(responseMessages.configurations.state.IdNotExists)
          }
        }),
      check('emergency_contact.*.country_id')
        .trim()
        .escape()
        .notEmpty()
        .withMessage(responseMessages.configurations.state.countryId)
        .isInt().withMessage(responseMessages.configurations.country.countryIdInvalid)
        .custom(async (value) => {
          const contactData = await indexService.find('countries', ['id'], { id: value })
          const status = contactData.status
          if (!status) {
            return Promise.reject(responseMessages.configurations.country.IdNotExists)
          }
        })
    ];
  }
  return validations;
}

/**
 * Finish Off Board Employee Function to initiate off boarding of an employee
 * 
 * Overview of function:
 * - Validate the request.
 *   + If successful
 *     ~ Call the 'finishOffBoard' service function the offboarding process.
 *     ~ Prepare the response with success data.
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Get Default date format of an organization.
 * - Convert `last_working_day`, `placement_end_dats`, `send_revocation.date` and  `delete_mail.email_deleted_on` into db format.
 * - Define Validation Rules for store and update of the emplpoyee off boarding.
 *   + 'request_id' (body), must not be empty.
 *   + 'last_working_day' (body), must not be emtpy.
 *   + 'placement.data.*.placement_end_date' (body), must not be beyond 'last_working_day'.
 *   + 'disable_user_access.status' (body), must be boolean.
 *   + 'send_revocation.email_sent_to' (body), should be 'USCIS, 'University'.
 *   + 'send_revocation.date' (body), must be current and previous date should not be future date.
 *   + 'delete_mail.email_deleted_on' (body), must be current and previous date should not be future date.
 *   + 'expense_settlement.reimbursement_payment' (body), must be 1 or 2.
 *   + 'expense_settlement.deduction_payment' (body), must be 1 or 2.
 * - Run the validation rules.
 * - If validation is successful:
 *   + Call the `finishOffBoard` function to finish the off boarding of employee.
 *   + If success:
 *     - Prepare the response with success data.
 *   + Else:
 *     - Prepate the response with error message.
 * - If validation fails:
 *   + Add error validation to the resposne.
 * - Log the response.
 * - Return the response using `responseHandler()`.
 * 
 * Notes:
 * - Exception handliong using try-catch.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const finishOffBoardEmployee = tryCatch(async (req, res) => {

  // Log Request
  await logRequest('info', req, 'Employee Off Boarding Finish Request');

  // date format
  let dateFormat = await format.getDateFormat();
  var updateValidationRules = [];
  var body = req.body;

  // Convert `last_working_day`, `placement_end_dats`, `send_revocation.date` and  `delete_mail.email_deleted_on` into db format.
  const { placement_end_date, send_revocation, delete_mail } = body;
  body.placement_end_date = placement_end_date ? moment(placement_end_date, dateFormat).format('YYYY-MM-DD') : '';
  body.send_revocation.date = send_revocation?.date ? moment(send_revocation.date, dateFormat).format('YYYY-MM-DD') : '';
  body.delete_mail.email_deleted_on = delete_mail.email_deleted_on ? moment(delete_mail.email_deleted_on, dateFormat).format('YYYY-MM-DD') : '';

  // If we get 'id' from request validate 'id' is validate or not
  if (req.body.id) {
    updateValidationRules = [
      check('id')
        .isUUID()
        .withMessage(responseMessages.offBoardEmployee.inValidUpdateId)
        .custom(async (value) => {
          const employeeOffBoard = await indexService.find('employee_off_boarding', ['id'], { id: value }, null);
          if (!employeeOffBoard.status) {
            return Promise.reject(responseMessages.offBoardEmployee.idNotExist);
          }
          return true;
        })
    ];
  }

  const validationRules = [
    check('employee_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.offBoardEmployee.employeeIdRequired)
      .isUUID()
      .withMessage(responseMessages.offBoardEmployee.employeeIdInvalid)
      .custom(async (value) => {

        // Check for valid employee id
        const employee = await indexService.find('employee', ['id', 'reference_id', 'balance_amount'], { 'id': value }, null, [])
        if (!employee.status) {
          return Promise.reject(responseMessages.offBoardEmployee.employeeIdNotExists)
        }

        // Check if off boarding already initiated
        const offBoard = await indexService.find('employee_off_boarding', ['id'], { 'employee_id': value }, null);

        if (offBoard.status) {
          body.id = offBoard?.data[0]?.id;
        }
        body.employee_reference_id = employee?.data[0]?.reference_id;
        body.employee_balance_amount = employee?.data[0]?.balance_amount;
        return true;
      }),
    check('last_working_day')
      .custom(value => {

        if (value.status == true) {
          // Last working day is mandatory
          if (value.date != undefined && value.date != null && value.date != '') {
            body.last_working_day.date = value.date ? moment(value.date, dateFormat).format('YYYY-MM-DD') : '';
            if (!regexPatterns.dateRegex.test(value.date)) {
              return Promise.reject(
                responseMessages.offBoardEmployee.inValidLastWorkingDay
              )
            }
          } else {
            return Promise.reject(
              responseMessages.offBoardEmployee.lastWorkingDayRequired
            )
          }
        }
        return true;
      }),
    check('placement.*')
      .custom(async value => {
        if (req.body.placement?.status == true) {

          const endDate = value.placement_end_date;
          if (endDate != '' && endDate != undefined && endDate != null) {

            // Validate Placement End Date
            if (!regexPatterns.dateRegex.test(endDate)) {
              throw new Error(
                responseMessages.offBoardEmployee.placementEndDateInvalid
              )
            }

            // Placement End Date should not be greater than last working day
            const placementEndDate = new Date(endDate);
            const lastWorkingDay = new Date(req.body.last_working_daye);
            if (placementEndDate > lastWorkingDay) {
              throw new Error(
                responseMessages.offBoardEmployee.placementEndDateLWD
              )
            }
          }
        }
        return true;
      }),
    check('disable_user_access.status')
      .isIn(['true', 'false', true, false])
      .withMessage(responseMessages.offBoardEmployee.invalidDisableUserAccess),
    check('send_revocation.email_sent_to')
      .custom(value => {
        if (value != undefined && value != '' && value != null) {
          if (!['1', '2', 1, 2].includes(value)) {
            return Promise.reject(
              responseMessages.offBoardEmployee.inValidEmailSentTo
            )
          }
        }
        return true;
      }),
    check('send_revocation')
      .custom(async value => {
        if (value?.status == true) {
          const date = value?.date;

          // Validate Send Revocation Date
          if (value?.date && !regexPatterns.dateRegex.test(date)) {
            return Promise.reject(
              responseMessages.offBoardEmployee.revocationDateInvalid
            )
          }

          // Revocation Date should not be future dates
          const revocationDate = new Date(value);
          const currentDate = new Date();
          if (revocationDate > currentDate) {
            return Promise.reject(
              responseMessages.offBoardEmployee.revocationDateInvalidLWD
            )
          }

          // Validate proof of document
          if (value?.proof_of_document?.id) {
            const proof_of_document_id = value?.proof_of_document?.id;
            if (regexPatterns.uuidRegex.test(proof_of_document_id)) {
              return await indexService.find('temp_upload_documents', ['id'], { id: proof_of_document_id }, null, [], null, null, null, false).then((documentsData) => {
                if (!documentsData.status) {
                  return Promise.reject(responseMessages.offBoardEmployee.sendRevocationDocumentIdNotExist);
                }
              });
            } else {
              return Promise.reject(responseMessages.offBoardEmployee.sendRevocationDocumentInvalid)
            }
          }
        }
        return true;
      }),
    check('delete_mail')
      .custom(async value => {

        if (value.status == true) {
          const email_deleted_on = value?.email_deleted_on;

          // Validate Delete Mail Deleted On
          if (!regexPatterns.dateRegex.test(email_deleted_on)) {
            return Promise.reject(
              responseMessages.offBoardEmployee.deleteEmailDeletedOnInvalid
            )
          }

          // Email Deleted On date should not be greater than current date
          const emailDeletedOn = new Date(email_deleted_on);
          const currentDate = new Date(req.body.last_working_day?.date);
          if (emailDeletedOn > currentDate) {
            return Promise.reject(
              responseMessages.offBoardEmployee.deleteEmailDeletedOnInvalidCurrent
            )
          }

          // Validate proof of document
          if (value?.proof_of_document?.id) {
            const proof_of_document_id = value?.proof_of_document?.id;
            if (regexPatterns.uuidRegex.test(proof_of_document_id)) {
              return await indexService.find('temp_upload_documents', ['id'], { id: proof_of_document_id }, null, [], null, null, null, false).then((documentsData) => {
                if (!documentsData.status) {
                  return Promise.reject(responseMessages.offBoardEmployee.sendRevocationDocumentIdNotExist);
                }
              });
            } else {
              return Promise.reject(responseMessages.offBoardEmployee.sendRevocationDocumentInvalid)
            }
          }
        }
        return true;
      }),
    check('expense_settlement.reimbursement_payment')
      .custom(value => {
        if (value != '' && value != undefined && value != null) {
          if (!['1', '2', 1, 2].includes(value)) {
            return Promise.reject(
              responseMessages.offBoardEmployee.invalidReimbursementPayment
            )
          }
        }
        return true;
      }),
    check('expense_settlement.deduction_payment')
      .custom(value => {
        if (value != '' && value != undefined && value != null) {
          if (!['1', '2', 1, 2].includes(value)) {
            return Promise.reject(
              responseMessages.offBoardEmployee.invalidDeductionPayment
            )
          }
        }
        return true;
      }),
    check('settle_balance')
      .custom(value => {
        if (value.status == true) {
          if (value.pay_via != undefined && value.pay_via != null && value.pay_via != '') {
            if (!payVia.includes(value.pay_via)) {
              return Promise.reject(responseMessages.offBoardEmployee.invalidSettlementMode)
            }
          } else {
            return Promise.reject(responseMessages.offBoardEmployee.settlementModeisRequired)
          }
        }
        return true;
      })
  ];
  var validations = [...updateValidationRules, ...validationRules];

  // Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req);
    if (result.errors.length) break;
  }
  const errors = validationResult(req);

  /**
   * If Validation is success.
   *    + Call the finish off board service function.
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {

    var response = await employeeServices.finishOffBoard(req.body, dateFormat);
    if (response.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success };
    } else {
      responseData = { statusCode: responseCodes.codeInternalError, message: responseMessages.common.somethindWentWrong, error: response.error };
    }
    // Log Response */
    await logResponse('info', req, responseData, 'Employee Off Boarding Finish Response');

    // Return the response */
    await responseHandler(res, responseData);

  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * Disable Payroll function to deactivate payroll for an employee.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Prepare the condition and update data.
 *      ~ Call the 'updateEmployee' service function to modify employee details.
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
 *    + 'id' (body), must be a valid UUID and should exist in the 'employee' table with 'In Active' status.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Prepare the condition and update data to disable payroll.
 *    + Call the 'updateEmployee' service function to modify employee details.
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
const disablePayroll = tryCatch(async (req, res) => {
  let dateFormat = await format.getDateFormat(); // date format
  /* Log Request */
  logRequest("info", req, "Disable Payroll for employee request.");
  /* Log Request */

  /* Default Variable */
  var responseData = "";
  /* Default Variable */

  /* Writing validation rules to the input request */
  const validations = [
    check("request_id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check("id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async (value) => {
        const employee = await indexService.find('employee', ['id'], { id: value, status: 'In Active' })
        if (!employee.status && value != '') {
          return Promise.reject(responseMessages.employee.behalfOnboarding.invalidEmployeeId)
        }
        return true;
      })
  ];
  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (var validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);
  /*Run the validation rules. */

  /**
       * If validation is success
       * + Update employee details in the collection.
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    const condition = { id: req.body.id };
    const updateData = { enable_payroll: false, enable_balance_sheet: false, updated_by: req.body.updated_by, updated_at: new Date() };
    const employeeData = await employeeServices.updateEmployee(condition, updateData);

    if (employeeData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.updatedSuccessfully,
      };

      /* Log Response */
      logResponse("info", req, responseData, "Rejoin employee Response.");
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData);
      /* Return the response */
    } else {
      throw new InvalidRequestError(
        responseMessages.employee.behalfOnboarding.alreadEnabled,
        responseCodes.codeUnprocessableEntity
      );
    }
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    );
  }
});

/**
 * Confirm Rehire function to mark an employee's rehire confirmation.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Prepare the condition and update data.
 *      ~ Call the 'updateEmployee' service function to modify employee details.
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
 *    + 'id' (body), must be a valid UUID and should exist in the 'employee' table with 'In Active' status.
 * - Run the validation rules.
 * - If validation is successful:
 *    + Prepare the condition and update data.
 *    + Call the 'updateEmployee' service function to modify employee details.
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
const confirmRehire = tryCatch(async (req, res) => {
  let dateFormat = await format.getDateFormat(); // date format
  /* Log Request */
  logRequest("info", req, "Confirm Rehire details for employee request.");
  /* Log Request */

  /* Default Variable */
  var responseData = "";
  /* Default Variable */

  /* Writing validation rules to the input request */
  const validations = [
    check("request_id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check("id")
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.employee.behalfOnboarding.requiredEmployeeId)
      .isUUID()
      .withMessage(responseMessages.employee.behalfOnboarding.employeeIdInvalid)
      .custom(async (value) => {
        const employee = await indexService.find('employee', ['id'], { id: value, status: 'In Active' })
        if (!employee.status && value != '') {
          return Promise.reject(responseMessages.employee.behalfOnboarding.invalidEmployeeId)
        }
        return true;
      })
  ];
  /* Writing validation rules to the input request */

  /*Run the validation rules. */
  for (var validation of validations) {
    var result = await validation.run(req);
    if (result.errors.length) break;
  }
  var errors = validationResult(req);
  /*Run the validation rules. */

  /**
       * If validation is success
       * + Update employee details in the collection.
       * If Validation Fails
       * + Return the error message.
       */
  if (errors.isEmpty()) {
    const condition = { id: req.body.id };
    const updateData = { confirm_rehire: true, updated_by: req.body.updated_by, updated_at: new Date() };
    const employeeData = await employeeServices.updateEmployee(condition, updateData);

    if (employeeData.status) {
      responseData = {
        statusCode: responseCodes.codeSuccess,
        message: responseMessages.common.updatedSuccessfully,
      };

      /* Log Response */
      logResponse("info", req, responseData, "Confirm Rehire employee Response.");
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData);
      /* Return the response */
    } else {
      throw new InvalidRequestError(
        responseMessages.employee.behalfOnboarding.alreadEnabled,
        responseCodes.codeUnprocessableEntity
      );
    }
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity
    );
  }
});


module.exports = { store, update, updateProfile, index, contactDetailsUpdate, basicDetailsUpdate, currentAddressUpdate, employmentDetailsUpdate, listing, payrollPayConfigurations, dropdown, getPayrollConfigSettings, deactivateUser, rejoinUser, eVerifyStatus, getRelieving, loginAccessUpdate, salaryPerPayroll, getProfileIndex, updateEmployeeProfile, offBoardEmployee, employeeOffBoardingDetails, finishOffBoardEmployee, disablePayroll, confirmRehire, checkDuplicate }