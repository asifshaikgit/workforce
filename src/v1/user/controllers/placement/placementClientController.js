/**
 * @constant check Creates a middleware/validation chain for one or more fields that may be located in any of the following:
 */
const { check, validationResult } = require('express-validator');

/**
 * @constant tryCatch Default class for try catch handling 
 */
const { tryCatch } = require('../../../../../utils/tryCatch');

/**
 * @constant logRequest Default class for logging the current event 
 */
const { logRequest, logResponse } = require('../../../../../utils/log');

/**
 * @constant responseMessages responseMessage constant variables
 */
const { responseMessages } = require('../../../../../constants/responseMessage');

/**
 * @constant responseCodes responseCodes constant variables
 */
const { responseCodes } = require('../../../../../constants/responseCodes');

/**
 * @constant InvalidRequestError Default class for handling invalid request
 */

const InvalidRequestError = require("../../../../../error/InvalidRequestError");
const indexService = require('../../services/index');
const indexRepository = require('../../repositories/index');
const placementClientService = require('../../services/placement/placementClientService');
const { responseHandler } = require('../../../../responseHandler');
const format = require('../../../../../helpers/format');
const moment = require('moment');
const { pagination } = require('../../../../../config/pagination')
const { regexPatterns } = require('../../../../../constants/regexPatterns');
const CLIENT = "client";
const ENDCLIENT = "end-client";
const { removeEmptyAndUndefinedKeys } = require('../../../../../helpers/globalHelper');

/**
 * Validation Rules for Store and Update
 * - Define the validation rules as follows:
 *   + 'request_id' (body), must not be empty.
 *   + 'employee_id' (body), must not be empty, should be a valid UUID, should exist in the 'employee' table.
 *   -- Client Details Validation as follows.
 *      + 'client_id' (body), must not be empty, should be a valid UUID, should exist in 'companies' table with entity_type 'client', should not exist in 'placements' table with same 'client_id' and 'employee_id'.
 *      + 'client_contact_one_id', must not be empty, should exit in the 'company_contacts' with reference to client_id comes from request.
 *      + 'client_contact_two_id', must not be empty, should exit in the 'company_contacts' with reference to client_id comes from request, 'client_contact_one_id' and 'client_contact_two_id' should not be same.
 *   -- End Client Details Validation as follows.
 *      + 'end_client_id' (body), must not be empty, should be a valid UUID,
 * should exist in 'companies' table with entity_type 'clients.
 *      + 'end_client_contact_one_id' (body), must not be empty, should exit in the 'company_contacts' with reference to end_client_id comes from request.
 *      + 'end_client_contact_two_id' (body), must not be empty, should exit in the 'company_contacts' with reference to end_client_id comes from request, 'end_client_contact_one_id' and 'end_client_contact_two_id' should not be same.
 *   -- PayType Configuration Validation as follows.
 *      + 'payroll_configuration_type' (body), must not be empty, should be 1 or 2.
 *      + 'pay_type' (body), must not be empty.
 *   -- Placement Details Valisations
 *      + 'project_name' (body), must not be empty.
 *      + 'job_title_id' (body), must not be empty, should exist in 'job_titles' with status true for it.
 *      + 'work_email_id' (body), must not be empty, should be email format.
 *      + 'placed_employee_id' (body), must not be empty, should present in 'employee' table.
 *      + 'notice_period' (body), must not be empty.
 *      + 'work_location_type' (body), must not be empty, must be 1 => (remote) or 2 => (on site).
 *      + 'start_date' (body), must not be empty, should be date.
 *      + 'end_date' (body), must not be empty, should be date, start_date should not be greater than end data.
 *   -- Upload document
 *      + 'document_type_id' (body), must not be empty, shoud exist in 'document_types' table.
 *      + 'new_document_id' (body), when a new document upated for a specific docuemnt _type, should exist in 'temp_upload_documents' table.
 *      + 'document_name' (body), must not be empty.
 */
async function validationRules(req) {

    let updateValidationRules = [];

    if (req.body.id) {
        updateValidationRules = [
            check('id')
                .trim()
                .escape()
                .notEmpty()
                .withMessage(responseMessages.common.updateIdRequired)
                .custom(async (value) => {
                    /** Check whether the id exist is placements table */
                    const placement = await indexService.find('placements', ['id', 'client_id', 'payroll_configuration_type', 'pay_type_configuration_id', 'reference_id'], { id: value });
                    if (!placement.status) {
                        return Promise.reject(
                            responseMessages.common.updateIdNotExist
                        );
                    } else {
                        req.body.existing_client_id = placement.data[0].client_id;
                        req.body.existing_payroll_configuration_type = placement.data[0].payroll_configuration_type;
                        req.body.existing_pay_type_configuration_id = placement.data[0].pay_type_configuration_id;
                        req.body.placement_reference_id = placement.data[0].reference_id;
                        return true;
                    }
                }),
            check('documents.*.id')
                .trim()
                .escape()
                .custom(async (value) => {
                    if (value != '' && value != null) {
                        if (isNaN(value)) {
                            return Promise.reject(responseMessages.employee.documents.DeletePlacementDocumentInvalid)
                        } else {
                            let documentsData = await indexService.find('placement_documents', ['id'], { id: value })
                            if (!documentsData.status) {
                                return Promise.reject(responseMessages.employee.documents.documenIdNoExists)
                            }
                        }
                    }

                    return true

                }),
            check('deleted_pay_rate_id.*').trim().escape().custom((value) => {
                if (value != '' && value != null) {
                    return indexService.find('pay_rate_configuration', ['*'], { id: value }, null, [], null, 'id', 'asc', false).then((payRateData) => {
                        if (payRateData.length === 0) {
                            return Promise.reject(responseMessages.placement.payRateIdInavlid);
                        }
                    });
                }
                return true;
            }),
        ];
    }

    const validationRules = [
        check("request_id")
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
            .withMessage(responseMessages.employee.employeeIdInvalid)
            .custom(async (value) => {

                /** Check if employee exist or not */
                const employee = await indexService.find('employee', ['id', 'display_name', 'reference_id', 'payroll_config_settings_id', 'enable_payroll', 'e_verified'], { id: value });
                if (!employee.status) {
                    return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdNotExists);
                } else {
                    if (employee.data[0].e_verified != 1) {
                        return Promise.reject(responseMessages.placement.employeeVerified);
                    }
                    if (employee.data[0].enable_payroll != true) {
                        return Promise.reject(responseMessages.placement.employeeEnablePayroll);
                    }
                    if (!employee.data[0].payroll_config_settings_id) {
                        return Promise.reject(responseMessages.placement.employeePayroll);
                    }

                    req.body.employee_name = employee.data[0].display_name;
                    req.body.employee_reference_id = employee.data[0].reference_id;
                    return true;
                }
            }),
        // Client Details Validations
        check("client_id")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.client.clientIdRequired)
            .isUUID()
            .withMessage(responseMessages.client.clientIdInvalid)
            .custom(async (value) => {
                // check client_id exist in 'companies' table or not 
                const client = await indexService.find('companies', ['id', 'reference_id', 'name'], { id: value, status: 'Active', entity_type: CLIENT })
                if (!client.status) {
                    return Promise.reject(responseMessages.client.clientIdInvalid);
                } else {
                    req.body.client_reference_id = client.data[0].reference_id;
                    req.body.client_name = client.data[0].name;
                    if (!req.body.id) {
                        // check if there is already a placement for an employee wiuth same client id with end_date more that the current date
                        const placement = await indexService.find('placements', ['id', 'end_date'], { client_id: value, employee_id: req.body.employee_id })

                        if (placement.status) {
                            if (placement.data[0].end_date == null || placement.data[0].end_date > new Date()) {
                                return Promise.reject(responseMessages.placement.placementAlreadyExists);
                            }
                        }
                    }
                }
                return true;
            }),
        check("client_contact_one_id")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.placement.clientContactOneIdRequired)
            .isInt()
            .withMessage(responseMessages.placement.clientContactOneIdInvalid)
            .custom(async (value) => {
                // check 'client_contact_one_id' should exist in 'company_contacts' table with status as true.
                const clientContact = await indexService.find('company_contacts', ['id'], { company_id: req.body.client_id });
                if (!clientContact.status && value != '') {
                    return Promise.reject(responseMessages.placement.clientContactOneIdInvalid)
                }
                // existing_client_contact_one_id = clientContact.data[0].id;
                return true;
            }),
        check("client_contact_two_id")
            .trim()
            .custom(async (value) => {
                if (value != '' && value != null) {
                    var pattern = (regexPatterns.numericOnlyRegex)
                    if (pattern.test(value)) {
                        // check 'client_contact_two_id' should exist in 'company_contacts' table with status as true.
                        const clientContact = await indexService.find('company_contacts', ['id'], { id: value, company_id: req.body.client_id })
                        if (!clientContact.status && value != '') {
                            return Promise.reject(responseMessages.placement.clientContactTwoIdInvalid);
                        } else {
                            // check 'client_contact_one_id' and 'client_contact_two_id' should not be same
                            if (req.body.client_contact_one_id == req.body.client_contact_two_id) {
                                return Promise.reject(responseMessages.placement.clientContactOneTwoUnique);
                            }
                            // existing_client_contact_two_id = clientContact.data[0].id;
                        }
                    } else {
                        return Promise.reject(responseMessages.placement.clientContactTwoIdInvalid);
                    }
                }

                return true;
            }),
        // End Client Details Validations
        check("end_client_id")
            .trim()
            .custom(async (value) => {
                if (value != '' && value != null) {
                    if (regexPatterns.uuidRegex.test(value)) {
                        // check end_client_id exist in 'companies' table or not 
                        const client = await indexService.find('companies', ['id', 'reference_id'], { id: value, status: 'Active', entity_type: ENDCLIENT })
                        if (!client.status) {
                            return Promise.reject(responseMessages.placement.endClientIdInvalid);
                        } else {
                            // client_id and end_client_id should be different
                            if (req.body.client_id == value) {
                                return Promise.reject(responseMessages.placement.clientIdEndClientIdUnique);
                            }
                            if (!req.body.id) {
                                // check if there is already a placement for an employee wiuth same client id with end_date more that the current date
                                const placement = await indexService.find('placements', ['id', 'end_date'], { client_id: value, employee_id: req.body.employee_id })
                                if (placement?.status) {
                                    if (placement.data[0].end_date == null || placement.data[0].end_date > new Date()) {
                                        return Promise.reject(responseMessages.placement.placementAlreadyExists);
                                    }
                                }
                            }
                        }
                    } else {
                        return Promise.reject(responseMessages.placement.endClientIdInvalid);
                    }
                }
                return true;
            }),
        check("end_client_contact_one_id")
            .trim()
            .custom(async (value) => {
                if (value != '' && value != null && req.body.end_client_id != null && req.body.end_client_id != '') {
                    var pattern = (regexPatterns.numericOnlyRegex)
                    if (pattern.test(value)) {
                        // check 'end_client_contact_one_id' should exist in 'company_contacts' table with status as true.
                        const clientContact = await indexService.find('company_contacts', ['id'], { id: value, company_id: req.body.end_client_id })
                        if (!clientContact.status && value != '') {
                            return Promise.reject(responseMessages.placement.endClientContactOneIdNotExists)
                        }
                        // existing_end_client_contact_one_id = clientContact.data[0].id;
                    } else {
                        return Promise.reject(responseMessages.placement.endClientContactOneIdInvalid)
                    }
                }
                return true
            }),
        check("end_client_contact_two_id")
            .trim()
            .custom(async (value) => {
                if (value != '' && value != null && req.body.end_client_id != null && req.body.end_client_id != '') {
                    var pattern = (regexPatterns.numericOnlyRegex)
                    if (pattern.test(value)) {
                        // check 'end_client_contact_two_id' should exist in 'company_contacts' table with status as true.
                        const clientContact = await indexService.find('company_contacts', ['id'], { id: value, company_id: req.body.end_client_id })
                        if (!clientContact.status && value != '') {
                            return Promise.reject(responseMessages.placement.endClientContactTwoIdNotExists)
                        }
                        // existing_end_client_contact_two_id = clientContact.data[0].id;
                        return true
                    } else {
                        return Promise.reject(responseMessages.placement.clientContactTwoIdInvalid)
                    }
                }
                return true
            }),
        // Pay Roll and Pay Type Configuration Validations
        check("payroll_configuration_type")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.placement.payrollConfigurationTyperequired)
            .isIn([1, 2])  //  1_global 2_custom
            .withMessage(responseMessages.placement.payrollConfigurationTypeInvalid)
            .custom(async (value) => {
                // check 'job_title_id' exist in 'job_titles' or not.
                const payType = await indexService.find('pay_type_configuration', ['id'], { employee_id: req.body.employee_id, is_global: true });
                if (!payType.status && value != '') {
                    return Promise.reject(responseMessages.placement.defaultPayTypeEmployee);
                }
                return true;
            }),
        // If Pay Roll Configuration is 2 'pay_type' is required
        check("pay_type")
            .trim()
            .escape()
            .custom(async (value) => {
                if (req.body.payroll_configuration_type == 2 && !value) {
                    return Promise.reject(responseMessages.placement.payTypeConfigurationRequired);
                } else {
                    return true;
                }
            }),
        // If 'pay_type' is 1 annual pay is required
        check("pay_value")
            .trim()
            .optional({ nullable: true })
            .custom(async (value) => {
                if (req.body.payroll_configuration_type == 2 && req.body.pay_type == 1 && !value) {
                    return Promise.reject(responseMessages.placement.payValueRequired)
                } else {
                    return true;
                }
            }),
        // If 'pay_type' is 1 payroll pay is required
        check("payroll_pay")
            .trim()
            .optional({ nullable: true })
            .custom(async (value) => {
                if (req.body.payroll_configuration_type == 2 && req.body.pay_type == 1 && !value) {
                    return Promise.reject(responseMessages.placement.payRollPayRequired)
                } else {
                    return true;
                }
            }),
        // If 'pay_type' is 2 pay_rate_configurations pay is required
        check('pay_rate_configurations.*.from_hour')
            .trim()
            .optional({ nullable: true })
            .custom(value => {
                if (req.body.payroll_configuration_type == 2 && req.body.pay_type == 2) {
                    if (isNaN(value) || value == '') {
                        return Promise.reject(responseMessages.configurations.payCycleConfiguration.fromHourInvalid);
                    }
                }
                return true;
            }),
        check('pay_rate_configurations.*.to_hour')
            .trim()
            .optional({ nullable: true })
            .custom(value => {
                if (req.body.payroll_configuration_type == 2 && req.body.pay_type == 2) {
                    if (isNaN(value) && value != '') {
                        return Promise.reject(responseMessages.configurations.payCycleConfiguration.toHourInvalid);
                    }
                }
                return true
            }),
        check('pay_rate_configurations.*.pay_in')  // 1- percentage, 2- value
            .trim()
            .optional({ nullable: true })
            .custom(value => {
                if (req.body.pay_type == 2 && req.body.payroll_configuration_type == 2) {
                    if (isNaN(value) || value == '') {
                        return Promise.reject(responseMessages.configurations.payCycleConfiguration.payInRequired);
                    } else if (!['1', '2'].includes(value)) {
                        return Promise.reject(responseMessages.configurations.payCycleConfiguration.payInInvalid);
                    }
                }
                return true
            }),

        check('pay_rate_configurations.*.rate')
            .trim()
            .optional({ nullable: true })
            .custom(value => {
                if (req.body.payroll_configuration_type == 2 && req.body.pay_type == 2) {
                    if (isNaN(value) && value != '') {
                        return Promise.reject(responseMessages.configurations.payCycleConfiguration.valueInvalid);
                    }
                }
                return true
            }),
        // Placement Details Validations
        check("project_name")
            .trim()
            .optional()
            .custom(async value => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.alphanumericSpaceRegex;
                    if (!pattern.test(value)) {
                        return Promise.reject(responseMessages.placement.projectNameInvalid);
                    }
                }
            }),
        check("job_title_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.placement.jobTitleIdRequired)
            .custom(async (value) => {
                // check 'job_title_id' exist in 'job_titles' or not.
                const jobtitle = await indexService.find('job_titles', ['id'], { id: value, is_active: 1 });
                if (!jobtitle.status && value != '') {
                    return Promise.reject(responseMessages.placement.jobTitleIdInvalid);
                }
                return true;
            }),
        check('work_email_id')
            .trim()
            .custom(async (value) => {
                if (value != '' && value != null) {
                    var pattern = regexPatterns.emailRegex2
                    if (!pattern.test(value)) {
                        return Promise.reject(responseMessages.employee.behalfOnboarding.invalidWorkEmailId)
                    }
                    return true
                }
                return true
            }),
        check("placed_employee_id")
            .trim()
            .custom((value) => {
                if (value) {
                    return indexService.find('employee', ['id'], { id: value, status: 'Active' })
                        .then((employee) => {
                            if (!employee.status) {
                                return Promise.reject(responseMessages.employee.behalfOnboarding.employeeIdInvalid);
                            }
                            return true
                        })
                } else {
                    return true;
                }
            }),
        check("notice_period")
            .trim()
            .custom((value) => {
                if (value) {
                    try {
                        var num = Number(value)
                    } catch (error) {
                        return Promise.reject(responseMessages.placement.noticePeriodRequired);
                    }
                }
                return true
            }),
        check("start_date")
            .trim()
            .notEmpty()
            .withMessage(responseMessages.placement.startDateRequired)
            .custom((value) => {
                var isDate = new Date(value);
                if (isNaN(isDate.getTime())) {
                    return Promise.reject(responseMessages.placement.startDateInvalid);
                }
                return true;
            }),
        check("end_date")
            .trim()
            .custom((value) => {
                if (value != '' && value != null && value != undefined) {
                    var isDate = new Date(value);
                    var start_date = new Date(req.body.start_date);
                    if (isNaN(isDate.getTime())) {
                        return Promise.reject(responseMessages.placement.invalidEndDate);
                    }
                    // check 'end_date' should be always greater than 'start_date' 
                    if (start_date.getTime() >= isDate.getTime()) {
                        return Promise.reject(responseMessages.placement.endDateShouldGreater);
                    }
                };
                return true
            }),
        check('work_location_type') // 1 - remote , 2 - onsite
            .trim()
            .escape()
            .notEmpty().withMessage(responseMessages.placement.locationTypeRequired)
            .isIn([1, 2]).withMessage(responseMessages.placement.locationTypeInvalid),

        check('work_location_address_line_one')
            .trim()
            .escape()
            .custom(async (value) => {
                if (req.body.work_location_type == 2) {
                    if (value != '') {
                        var pattern = regexPatterns.specialCharactersRegex;
                        if (pattern.test(value)) {
                            return Promise.reject(
                                responseMessages.placement.locationAddressOneInvalid
                            )
                        }
                    }
                }
                return true;
            }),

        check('work_location_address_line_two')
            .trim()
            .escape()
            .custom(async (value) => {
                if (req.body.work_location_type == 2) {
                    if (value != '') {
                        var pattern = regexPatterns.specialCharactersRegex;
                        if (pattern.test(value)) {
                            return Promise.reject(
                                responseMessages.placement.locationAddressTwoInvalid
                            )
                        }
                    }
                }
                return true;
            }),

        check('work_location_city')
            .trim()
            .escape()
            .custom(async (value) => {
                if (req.body.work_location_type == 2) {
                    if (value != '') {
                        var pattern = regexPatterns.specialCharactersRegex;
                        if (pattern.test(value)) {
                            return Promise.reject(
                                responseMessages.placement.locationCityInvalid
                            )
                        }
                    }
                }
                return true;
            }),

        check('work_location_state_id').trim().escape()
            .custom(async (value) => {
                if (req.body.work_location_type == 2) {
                    if (value != '') {
                        return indexService.find('states', ['id'], { id: value }).then((state) => {
                            var stateData = state.status
                            if (!stateData) {
                                return Promise.reject(responseMessages.placement.locationstateIdInvalid)
                            }
                        })
                    }
                }
                return true;
            }),

        check('work_location_country_id').trim().escape()
            .custom(async (value) => {
                if (req.body.work_location_type == 2) {
                    if (value != '') {
                        return indexService.find('countries', ['id'], { id: value }).then((state) => {
                            var stateData = state.status
                            if (!stateData) {
                                return Promise.reject(responseMessages.placement.locationCountryIdInvalid)
                            }
                        })
                    }
                }
                return true;
            }),

        check("work_location_zipcode").trim()
            .custom(async (value) => {
                if (req.body.work_location_type == 2) {
                    if (!regexPatterns.numbersSpaceRegex) {
                        return Promise.reject(responseMessages.placement.invalidZipCode)
                    }
                }
                return true;
            }),
        // Upload Document Validations
        check("documents.*.document_type_id")
            .trim()
            .escape()
            .custom(async (value) => {
                if (value != null && value != '') {
                    var pattern = regexPatterns.numericOnlyRegex;
                    if (pattern.test(value)) {
                        var documentsData = await indexService.find('document_types', ['id'], { id: value, deleted_at: null })
                        if (!documentsData.status) {
                            return Promise.reject(
                                responseMessages.placement.InvalidPlacementDocumentId
                            )
                        }
                    } else {
                        return Promise.reject(
                            responseMessages.placement.InvalidPlacementDocumentIdFormat
                        )
                    }
                }
                return true
            }),
        check('documents.*.document_name')
            .trim()
            .escape(),
        check('documents.*.new_document_id')
            .trim()
            .escape()
            .custom(async (value) => {
                if (value != null && value != '') {
                    var pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        return await indexService.find('temp_upload_documents', ['id', 'document_url', 'document_path'], { id: value }, null, [], null, null, null, false).then((documentsData) => {
                            if (documentsData.length === 0) {
                                return Promise.reject(
                                    responseMessages.employee.documents.newDocumentIdNotExists
                                );
                            } else {
                                let documents = req.body.documents;
                                documents.map(doc => {
                                    if (doc.new_document_id == value) {
                                        doc.document_url = documentsData?.data[0]?.document_url;
                                        doc.document_path = documentsData?.data[0]?.document_path;
                                    }
                                });
                                return true;
                            }
                        })
                    } else {
                        return Promise.reject(
                            responseMessages.employee.documents.newDocumentIdInvalid
                        )
                    }
                } else if (value === null || value == '') {
                    return true
                }
            }),
    ];

    return [...updateValidationRules, ...validationRules];
}

/**
 * Store function to create a add a client to a placement
 * 
 * Overview of Function:
 * - Validate the request.
 *   + If successful
 *     ~ Call the store service function to add the client details for a placementr
 *   + Else
 *     ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Retrieve the organization date format using `format.getDateFormat()`.
 * - Log the incoming request.
 * - Set default variables for 'responseData'.
 * - Convert and format dates in the input request:
 * - Call the validation rules.
 * 
 * - Run the validation rules.
 * - If validationius sucessful:
 *   + Call the 'store' service function to add the client details for the placement
 *   + Prepare the reponse with a success message.
 * - If validation fails:
 *   + Add error validation to the reponse.
 * - Log the reponse.
 * - Return the reponse using 'responseHandler()'.
 * 
 * Notes: 
 *  - Exception handling using try-catch.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const store = tryCatch(async (req, res) => {
    let dateFormat = await format.getDateFormat(); // date format

    /* Log Request */
    logRequest("info", req, "Store Client Details for a placement request");
    /* Log Request */

    /* Convert start_date and end_date to the database format */
    req.body.start_date = moment(req.body.start_date, dateFormat).format('YYYY-MM-DD');
    req.body.end_date = req.body.end_date != '' ? moment(req.body.end_date, dateFormat).format('YYYY-MM-DD') : '';
    /* Convert start_date and end_date to the database format */

    /* Default Variable */
    var responseData;
    /* Default Variable */

    var validations = await validationRules(req);

    /*Run the validation rules. */
    for (let validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req)
    /*Run the validation rules. */

    if (errors.isEmpty()) {

        var placement_data = await placementClientService.store(req.body);

        if (placement_data.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.addedSuccessfully,
                data: placement_data.data
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeInternalError,
                message: responseMessages.common.somethindWentWrong,
                error: placement_data.error,
                data: []
            }
        }

        /* Log Response */
        logResponse("info", req, responseData, "Store Client Details for a placement request");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    }
    else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
});

/**
 * Update function to edit of the client details of an employee placement
 * 
 * Overview of the function:
 * - Validate the request:
 *   + If successful
 *     ~ Call the store service funtion to modify the client details.\
 *     ~ Prepare the resposne with a success message.
 *   + Else
 *     ~ Add error validation to the response
 * - Retuurn the response.
 * Notes:
 *  - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest("info", req, "Update Client Details for a placement request");
    /* Log Request */

    /* Default Variable */
    var responseData;
    /* Default Variable */

    req.body.id = req.params.id;
    var validations = await validationRules(req);

    /*Run the validation rules. */
    for (let validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req)
    /*Run the validation rules. */

    if (errors.isEmpty()) {

        var placement_data = await placementClientService.update(req.body);

        if (placement_data.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.updatedSuccessfully,
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeInternalError,
                message: responseMessages.common.somethindWentWrong,
                error: placement_data.error,
                data: []
            }
        }

        /* Log Response */
        logResponse("info", req, responseData, "Update Client Details for a placement request");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    }
    else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        );
    }
});

/**
 * Listing function to retrieve a list of placement details based on query parameters and search conditions.
 *
 * Overview of Function:
 * - Validate the request, ensuring the 'request_id' is provided.
 *    + If successful:
 *      ~ Retrieve a list of placement details using the 'listing' service function.
 *      ~ Prepare the response with success data.
 *    + If 'request_id' is missing, return an error message.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for 'responseData', 'limit', 'page', and other query parameters.
 * - Construct the 'condition' object to filter placement details based on query parameters.
 * - Perform validations for various query parameters:
 *   + 'employee_id': Validates if it's a valid UUID format and includes it in the 'condition' if provided.
 *   + 'placement_reference_id': Includes it in the 'condition' if provided.
 *   + 'client_id': Validates if it's a valid UUID format and includes it in the 'condition' if provided.
 *   + 'employee_name': Includes it in the 'condition' if provided.
 *   + 'client_name': Includes it in the 'condition' if provided.
 *   + 'search': Includes it in the 'condition' if provided.
 *   + 'type' and 'value': Includes them in the 'condition' if both are provided.
 * - Call the 'listing' service function to fetch placement details based on the constructed 'condition'.
 * - If placement data is retrieved successfully:
 *    + Prepare the response with success data and pagination details.
 * - If no placement data is found:
 *    + Prepare the response with an error message indicating no records were found.
 * - Log the response.
 * - Return the response using 'responseHandler()'.
 *
 * Notes:
 * - Exception handling using try-catch.
 * - Validations for various query parameters and construction of the 'condition' object.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If 'request_id' is missing.
 */
const listing = tryCatch(async (req, res) => {

    let dateFormat = await format.getDateFormat(); // date format

    /* Log Request */
    logRequest('info', req, "Getting Placement Details listing request");
    /* Log Request */

    /* Default Variable */
    var responseData;
    /* Default Variable */

    // Writing validation rules to the input request
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('employee_id')
            .trim().escape()
            .optional()
            .custom(async value => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        const employeeData = await indexService.find('employee', ['id', 'reference_id'], { id: value });
                        if (!employeeData.status) {
                            return Promise.reject(responseMessages.employee.employeeIdNotExists);
                        }
                    } else {
                        return Promise.reject(responseMessages.employee.employeeIdInvalid);

                    }
                }
            }),
    ];

    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    if (errors.isEmpty()) {

        let query = removeEmptyAndUndefinedKeys(req.query);

        /* Default Variable */
        let limit = (query.limit) ? (query.limit) : pagination.limit;
        let page = (query.page) ? (query.page) : pagination.page;
        let condition = {
            from_date: null,
            to_date: null
        };
        /* Default Variable */

        condition.employee_id = query.employee_id || null;
        condition.client_id = query.client_id || null;
        condition.reference_id = query.reference_id || null;
        condition.client_name = query.client_name || null;
        condition.employee_name = query.employee_name || null;
        condition.search = query.search ? query.search : null;
        query.status_type = (query.status_type == 'active_placements') ? 'ending_in_placements' : query.status_type;
        condition.status_type = (query.status_type && query.status_type != 'total_placements') ? query.status_type : null;
        if (query.from_date && query.to_date) {
            condition.from_date = moment(query.from_date, dateFormat).format('YYYY-MM-DD');
            condition.to_date = moment(query.to_date, dateFormat).format('YYYY-MM-DD');
        }

        /* Writing validation rules to the input request */
        var placementData = await placementClientService.listing(condition, dateFormat, page, limit);
        if (!placementData.status) {
            responseData = { statusCode: responseCodes.codeSuccess, error: placementData.error, message: responseMessages.common.noRecordFound, data: [], pagination: placementData.pagination }
        }
        else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: placementData.data, pagination: placementData.pagination_data };
        }

        /* Writing validation rules to the input request */

        /* Log Response */
        logResponse('info', req, responseData, "Getting Placement Details listing Response");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors, responseCodes.codeUnprocessableEntity);
    }


});

/**
 * Index function to retrieve placement details based on a given placement ID and query parameters.
 *
 * Overview of Function:
 * - Validate the request, ensuring the 'request_id' is provided.
 *    + If successful:
 *      ~ Retrieve placement details using the 'index' service function.
 *      ~ Prepare the response with success data.
 *    + If 'request_id' is missing, return an error message.
 * - Return the response.
 *
 * Logic:
 * - Log the incoming request.
 * - Set default variables for 'responseData', 'placement_id', and other query parameters.
 * - Validate the provided 'placement_id':
   + Ensure it is a valid UUID format.
   + Check if the placement ID exists in the 'placements' table.
 * - If the 'placement_id' validation is successful:
   + Set default variables for 'limit' and 'page'.
   + Construct the 'condition' object to filter placement details based on the 'placement_id'.
   + Call the 'index' service function to fetch placement details based on the constructed 'condition'.
   + If placement data is retrieved successfully:
      ~ Prepare the response with success data.
   + If no placement data is found:
      ~ Prepare the response with an error message indicating no records were found.
 - If 'placement_id' validation fails, return an error message indicating an invalid or missing placement ID.
 - If 'request_id' is missing, return an error message.
 - Log the response.
 - Return the response using 'responseHandler()'.
 *
 * Notes:
 * - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If 'request_id' is missing or 'placement_id' is invalid or not found.
 */
const index = tryCatch(async (req, res) => {

    let dateFormat = await format.getDateFormat(); // date format
    /* Log Request */
    logRequest('info', req, 'Getting placement index request')
    /* Log Request */

    /* Default Variable */
    var responseData;
    var request_id = req.query.request_id
    /* Default Variable */

    if (request_id) {
        /* Default Variable */
        if (req.query.placement_id != '' || req.query.placement_id != null) {
            const placement_id = req.query.placement_id;
            /* Default Variable */

            var pattern = regexPatterns.uuidRegex;
            if (pattern.test(placement_id)) {
                const response = await indexService.find('placements', ['id'], { id: placement_id })
                if (response.status) {
                    /* Default Variable */
                    // let search = req.query.search
                    /* Default Variable */

                    var condition = { 'placement_id': placement_id }
                    var placementData = await placementClientService.index(condition, dateFormat)
                    if (!placementData.status) {
                        responseData = {
                            statusCode: responseCodes.codeInternalError,
                            message: placementData.message,
                            error: placementData.error,
                            message: responseMessages.common.noRecordFound,
                            data: []
                        }
                    } else {
                        responseData = {
                            statusCode: responseCodes.codeSuccess,
                            message: responseMessages.common.success,
                            data: placementData.data
                        }
                    }

                    /* Log Response */
                    logResponse('info', req, responseData, 'Getting placement index Response')
                    /* Log Response */

                    /* Return the response */
                    responseHandler(res, responseData)
                    /* Return the response */
                } else {
                    throw new InvalidRequestError(responseMessages.placement.placementIdNotExists)
                }
            } else {
                throw new InvalidRequestError(responseMessages.placement.placementIdInvalid)
            }
        } else {
            throw new InvalidRequestError(responseMessages.placement.placementIdRequired)
        }
    } else {
        throw new InvalidRequestError(responseMessages.common.requestIdRequired)
    }
});

/**
 * Get placement dropdown data.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Prepare the condition based on the 'search' query parameter and 'employee_id'.
 *      ~ Call the 'find' function from 'indexService' to get placement dropdown data.
 *      ~ If data exists, prepare the response with success data.
 *      ~ If no data exists, prepare the response with an empty array and a success message.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'employee_id' (query), must not be empty, be a valid UUID, and should exist in the 'employee' table.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *   + Determine the 'condition' object based on the 'end_date' and 'employee_id'.
 *   + Define 'joins' to include the 'companies' table.
 *   + Call the 'find' function from 'indexRepository' to retrieve placement dropdown data.
 *   + If data exists:
 *      ~ Prepare the response with fetched data.
 *    + Else:
 *      ~ Prepare the response with an empty array and a success message.
 *   + Log the response.
 *   + Return the response using `responseHandler()`.
 * - If validation fails:
 *   + Add error validation to the response.
 *
 * Notes:
 * - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const dropdown = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "Getting placement dropdown request");
    /* Log Request */

    let dateFormat = await format.getDateFormat() // date format

    /* Writing validation rules to the input request */
    var validations = [
        check('request_id')
            .trim().escape()
            .notEmpty().withMessage(responseMessages.common.requestIdRequired),
        check('employee_id')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.employee.employeeIdRequired)
            .isUUID()
            .withMessage(responseMessages.employee.employeeIdInvalid)
            .custom(async value => {
                const employeeData = await indexService.find('employee', ['id'], { id: value });
                if (!employeeData.status) {
                    return Promise.reject(responseMessages.employee.employeeIdNotExists);
                }
            }),
            check('calendar_view')
            .trim()
            .notEmpty()
            .withMessage(responseMessages.placement.calendarViewRequired)
            .isBoolean()
            .withMessage(responseMessages.placement.calendarViewInvalid)
    ];
    /* Writing validation conditions to the input request */

    /*Run the validation rules. */
    for (let validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    /*Run the validation rules. */

    /**
     * If validation is success
     * + Delete  clients in the collection.  
     * If Validation Fails
     * + Return the error message.
    */
    if (errors.isEmpty()) {
        var date = moment().format('YYYY-MM-DD')

        if(req.query.calendar_view == 'true'){
        var condition = { global_search: `placements.employee_id = '${req.query.employee_id}'` }
        } else {
            var condition = { global_search: `(placements.end_date >= '${date}' or placements.end_date is NULL) AND placements.employee_id = '${req.query.employee_id}' and tc.cycle_id = 5` }
        }

        let joins = [
            { table: 'companies as c', alias: 'c', condition: ['placements.client_id', 'c.id'] },
            { table: 'companies as ec', alias: 'ec', condition: ['placements.end_client_id', 'ec.id'], type: 'left' },
            { table: 'timesheet_configurations as tc', alias: 'tc', condition: ['placements.timesheet_configuration_id', 'tc.id'] },
        ];

        var placementData = await indexRepository.find('placements', ['placements.id as placement_id', 'placements.reference_id as placement_reference_id', 'placements.client_id', 'c.name as client_name', 'c.reference_id as client_reference_id', 'placements.end_client_id', 'ec.name as end_client_name', 'ec.reference_id as end_client_reference_id', 'placements.timesheet_start_date', 'placements.ts_next_cycle_start', 'tc.ts_mandatory'], condition, null, joins);
        if (placementData.status) {
            const modifiedData = placementData.data.map((item) => {
                return {
                    ...item,
                    next_cycle_date: item.ts_next_cycle_start ? moment(item.ts_next_cycle_start, dateFormat).format('MM-DD-YYYY') : moment(item.timesheet_start_date).format('MM-DD-YYYY'),
                };
            });

            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: modifiedData,
            };
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: placementData.message, error: placementData.error, message: responseMessages.common.noRecordFound, data: [] }
        }

        /* Log Response */
        logResponse('info', req, responseData, "Getting placement dropdown response");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Get employee pay details.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Call the 'employeePay' function from 'placementClientService'.
 *      ~ If data exists, prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'employee_id' (query), must not be empty, be a valid UUID, and should exist in the 'employee' table.
 *    + 'placement_id' (query), must not be empty, be a valid UUID, and should exist in the 'placements' table.
 *    + 'bill_rate' (query), must not be empty and should be a valid float.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *   + Call the 'employeePay' function from 'placementClientService' with the request body.
 *   + If data exists:
 *      ~ Prepare the response with fetched data.
 *   + Log the response.
 *   + Return the response using `responseHandler()`.
 * - If validation fails:
 *   + Add error validation to the response.
 *
 * Notes:
 * - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const employeePay = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest("info", req, "employee pay details request");
    /* Log Request */

    /* Default Variable */
    var responseData = "";
    /* Default Variable */

    req.body.bill_rate = req.body.bill_rate === '' ? 0 : req.body.bill_rate;

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
            .withMessage(responseMessages.employee.employeeIdRequired)
            .isUUID()
            .withMessage(responseMessages.employee.employeeIdInvalid)
            .custom(async (value) => {
                const employee = await indexService.find('employee', ['id'], { id: value })
                if (!employee.status) {
                    return Promise.reject(responseMessages.employee.employeeIdNotExists)
                }
            }),
        check('placement_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.placement.placementIdRequired)
            .isUUID()
            .withMessage(responseMessages.placement.placementIdInvalid)
            .custom(async (value) => {
                const employee = await indexService.find('placements', ['id'], { id: value })
                if (!employee.status) {
                    return Promise.reject(responseMessages.placement.placementIdNotExists)
                }
            }),
        check('bill_rate')
            .trim()
            .custom((value) => {
                if (value !== '' && value !== null && value !== undefined) {
                    if (isNaN(parseFloat(value))) {
                        return Promise.reject(responseMessages.placement.billingRateInvalid);
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

    if (errors.isEmpty()) {
        var employeeData = await placementClientService.employeePay(req.body);
        responseData = {
            statusCode: responseCodes.codeSuccess,
            message: responseMessages.common.success,
            data: employeeData
        };
        /* Log Response */
        logResponse("info", req, responseData, "employee pay details response");
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
 * Placement duplicate check.
 *
 * Overview of Function:
 * - Validate the request.
 *    + If successful
 *      ~ Check if the client and employee combination already has an active placement.
 *      ~ If not, prepare the response with success data.
 *    + Else
 *      ~ Add error validation to the response.
 * - Return the response.
 * 
 * Logic:
 * - Log the incoming request.
 * - Set default variables for `responseData`.
 * - Define the validation rules as follows:
 *    + 'request_id' (query), must not be empty.
 *    + 'employee_id' (query), must not be empty, be a valid UUID, and should exist in the 'employee' table.
 *    + 'client_id' (query), must not be empty, be a valid UUID, and should exist in the 'companies' table. Additionally, check if there is an existing placement for the same employee and client with an end_date in the future.
 * 
 * - Run the validation rules.
 * - If validation is successful:
 *   + Check if there is an active placement for the same employee and client.
 *      ~ If yes, add an error to the response indicating placement already exists.
 *      ~ If not, prepare the response with success data.
 *   + Log the response.
 *   + Return the response using `responseHandler()`.
 * - If validation fails:
 *   + Add error validation to the response.
 *
 * Notes:
 * - Exception handling using try-catch.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} JSON
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const placementDuplicateCheck = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest("info", req, "placement duplicate check request");
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
            .withMessage(responseMessages.employee.employeeIdRequired)
            .isUUID()
            .withMessage(responseMessages.employee.employeeIdInvalid)
            .custom(async (value) => {
                const employee = await indexService.find('employee', ['id'], { id: value })
                if (!employee.status) {
                    return Promise.reject(responseMessages.employee.employeeIdNotExists)
                }
            }),
        check('client_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.placement.clientIDRequired)
            .isUUID()
            .withMessage(responseMessages.placement.clientIDInvalid)
            .custom(async (value) => {
                const Cleint = await indexService.find('companies', ['id'], { id: value })
                if (!Cleint.status) {
                    return Promise.reject(responseMessages.placement.clientIdNotExists)
                } else {
                    // check if there is already a placement for an employee wiuth same client id with end_date more that the current date
                    const placement = await indexService.find('placements', ['id', 'end_date'], { client_id: value, employee_id: req.body.employee_id }, null, [], null, 'created_by', 'desc')

                    if (placement.status) {
                        if (placement.data[0].end_date == null || placement.data[0].end_date > new Date()) {
                            return Promise.reject(responseMessages.placement.placementAlreadyExists);
                        }
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

    if (errors.isEmpty()) {
        responseData = {
            statusCode: responseCodes.codeSuccess,
            message: responseMessages.common.success
        };
        /* Log Response */
        logResponse("info", req, responseData, "placement duplicate check");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeSuccess
        );
    }
})

const employeeDefaultPayCheck = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest("info", req, "employee default pay check request");
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
            .withMessage(responseMessages.employee.employeeIdRequired)
            .isUUID()
            .withMessage(responseMessages.employee.employeeIdInvalid)
            .custom(async (value) => {
                const employee = await indexService.find('employee', ['id'], { id: value })
                if (!employee.status) {
                    return Promise.reject(responseMessages.employee.employeeIdNotExists)
                } else {
                    const employeeDefaultPay = await indexService.find('pay_type_configuration', ['id'], { employee_id: value, is_global: true, deleted_at: null })
                    if (!employeeDefaultPay.status) {
                        return Promise.reject(responseMessages.employee.employeeDefaulyPay)
                    }
                    return true
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

    if (errors.isEmpty()) {
        responseData = {
            statusCode: responseCodes.codeSuccess,
            message: responseMessages.common.success
        };
        /* Log Response */
        logResponse("info", req, responseData, "employee default pay check");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */
    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeSuccess
        );
    }
})

module.exports = { store, update, listing, index, dropdown, employeePay, placementDuplicateCheck, employeeDefaultPayCheck }