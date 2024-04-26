require('dotenv').config();
const { randomPasswordGenerator, removeDuplicatesById, replaceNullsWithEmptyString } = require('../../../../../helpers/globalHelper');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const indexRepository = require('../../repositories/index');
const format = require('../../../../../helpers/format');
const transactionRepository = require('../../repositories/transactionRepository');
const { getConnection } = require('../../../../middlewares/connectionManager');
const { event } = require('../../../../../events/employeeActivityEvent');
const { eventss } = require('../../../../../events/notificationEvent');
const { fetchAndMoveDocument, destroyDocument, generateEmployeeAvatar } = require('../../../../../helpers/globalHelper');
const config = require('../../../../../config/app')
const { sendMail } = require('../../../../../utils/emailSend');
const { getEmailTemplate } = require('../../../../../helpers/emailTemplate');
const commonDocumentStore = require('../../../../../helpers/commonDocumentStore');
const commonService = require('./commonService');
const fs = require('fs');
const prefixesServices = require('../configurations/prefixesServices');
const employeeVisaService = require('../employee/employeeVisaService')
// const { trace } = require('../../routes');

// Invited Employeee Status Constants
const EMPLOYEE_ONBOARDED = 'Employee OnBoarded';

/**
 * Store function to create a new Employee Basic Details entry.
 * 
 * Logic:
 * - Generate a new password using 'randomPasswordGenerator()' function for the employee. 
 * - Calculate a salt for password hashing.
 * - Create a new object 'employeeBasicDetails' with properties from the request body for the new Employee Basic Details entry.
 * - If 'enableLogin' is true:
 *    + Generate an OTP for two-factor authentication.
 *    + Hash the new password with the salt for secure storage.
 * - Set other properties for the employee entry.
 * - Call the 'indexRepository.store' function to add the 'employeeBasicDetails' to the 'employee' table.
 * - Fetch the organization signature for email composition.
 * - Return the response from the repository.
 * 
 * @param {Object} employee - The request body containing Employee Basic Details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {
    let trx;
    try {

        // Default password generator
        const salt = await bcrypt.genSalt(10);
        if (body.enable_login == 1) {
            var newPassword = await randomPasswordGenerator();
        }

        let prefix;

        if (body.employment_type_id == 1) {
            prefix = await prefixesServices.getPrefix({slug: 'employee'});
        } else {
            prefix = await prefixesServices.getPrefix({slug: 'consultant-contractor'});
        }
        var reference_id = prefix.data;


        // Create an object 'employeeBasicDetails' to store employee details.
        const employeeBasicDetails = {
            first_name: body.first_name,
            last_name: body.last_name,
            middle_name: body?.middle_name || null,
            display_name: body.first_name + ' ' + (body.middle_name == '' || body.middle_name == null ? '' : body.middle_name + ' ') + body.last_name,
            dob: body.dob ? new Date(body.dob).toISOString() : null,
            is_super_admin: false,
            status: 'Active',
            gender: body.gender,
            blood_group: body.blood_group === '' ? null : body.blood_group,
            marital_status: body.marital_status === '' ? null : body.marital_status,
            on_boarding_type: 2,
            onboard_status: 1,
            reference_id: reference_id ? reference_id : null,
            employment_type_id: body.employment_type_id ? body.employment_type_id : null,
            contact_number: body.contact_number,
            alternate_contact_number: body.alternate_contact_number ? body.alternate_contact_number : null,
            email_id: body.email_id.toLowerCase(),
            password: (body.enable_login == 1) ? await bcrypt.hash(newPassword, salt) : null,
            alternate_email_id: body.alternate_email_id ? body.alternate_email_id : null,
            date_of_joining: body.date_of_joining ? new Date(body.date_of_joining).toISOString() : null,
            ssn: body.ssn ? body.ssn : null,
            employee_category_id: body.employment_category_id ? body.employment_category_id : null,
            is_us_citizen: body.is_usc,
            visa_type_id: body.visa_type_id ? body.visa_type_id : null,
            //department_id: body.department_id ? body.department_id : null,
            //team_id: body.team_id ? body.team_id : null,
            reporting_manager_id: body.reporting_manager_id ? body.reporting_manager_id : null,
            profile_picture_url: await generateEmployeeAvatar(body),
            enable_login: body.enable_login ? body.enable_login : null,
            role_id: body.role_id ? body.role_id : null,
            temp_password: true,
            preferable_vendor_id: body?.vendor_id || null,
            vendor_price_per_hour: body?.vendor_id ? body?.vendor_price : null,
            drafted_stage: null,
            created_by: body.created_by,
            created_at: new Date()
        };

        // Initialize a database transaction
        const db = await getConnection();
        trx = await db.transaction();

        // Store the 'employeeBasicDetails' object in the 'employee' table using the indexRepository.
        const employeeData = await transactionRepository.store(trx, 'employee', employeeBasicDetails);

        // Create an 'employeeAddressDetails' object with properties extracted from the request 'body'.
        const employeeAddressDetails = {
            employee_id: employeeData.data[0].id,
            address_one: body.address_line_one,
            address_two: body.address_line_two ? body.address_line_two : null,
            city: body.city,
            state_id: body.state_id,
            country_id: body.country_id,
            zip_code: body.zip_code,
            created_by: body.created_by,
            created_at: new Date()
        };
        // Call the 'indexRepository.store' function to store the employee's current address details in the 'employee_address_details' table with 'employeeAddressDetails'.
        await transactionRepository.store(trx, 'employee_address_details', employeeAddressDetails);

        let emergency_contact = body.emergency_contact;
        if (emergency_contact?.length > 0) {
            emergency_contact = emergency_contact.filter(obj => Object.values(obj).some(value => (value !== '' && value !== null)));
        }

        if (emergency_contact?.length > 0) {
            for (const key in emergency_contact) {
                var employeeEmergencyContactObject = {
                    employee_id: employeeData.data[0].id,
                    relationship_id: emergency_contact[key].relationship_id ? emergency_contact[key].relationship_id : null,
                    name: emergency_contact[key].name ? emergency_contact[key].name : null,
                    email_id: emergency_contact[key].email_id ? emergency_contact[key].email_id : null,
                    contact_number: emergency_contact[key].contact_number ? emergency_contact[key].contact_number : null,
                    address_1: emergency_contact[key].address_1 ? emergency_contact[key].address_1 : null,
                    address_2: emergency_contact[key].address_2 ? emergency_contact[key].address_2 : null,
                    city: emergency_contact[key].city ? emergency_contact[key].city : null,
                    state_id: emergency_contact[key].state_id ? emergency_contact[key].state_id : null,
                    country_id: emergency_contact[key].country_id ? emergency_contact[key].country_id : null,
                    zip_code: emergency_contact[key].zip_code ? emergency_contact[key].zip_code : null,
                    created_by: body.created_by,
                    created_at: new Date()
                };

                /**
                * Stores the employee's emergency contact information in the 'emergency_contact_information' table.
                */
                await transactionRepository.store(trx, 'emergency_contact_information', employeeEmergencyContactObject);
            }
        }

        if (body.invite_via_link_id) {
            await indexRepository.update('invited_employee', { id: body.invite_via_link_id }, { status: EMPLOYEE_ONBOARDED, deleted_at: new Date() });
        }

        // Commit the transaction
        await trx.commit();

        if ((body.enable_login == 1)) {

            // Send Email to employee after onboarding
            const employeeInfo = body;
            const slug = 'new-employee-onboard';
            var signature = await indexRepository.find('organization', ['organization_name', 'email_signature']); // Fetch the organization signature

            let domainName;
            if (employeeInfo.employment_type_id == 1) {
                domainName = config.domainName;
            } else {
                domainName = config.consultantDomainName;
            }

            // Email subject replace object
            let replaceObj = {
                '{{first_name}}': employeeInfo.first_name,
                '{{user_name}}': employeeInfo.first_name,
                '{{email_id}}': employeeInfo.email_id,
                '{{password}}': newPassword,
                '{{organization_name}}': signature.status ? signature.data[0].organization_name : 'Organization Name',
                '{{organization_signature}}': signature.status ? (signature.data[0].email_signature ? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
                '{{sub_domain_name}}': body.login_subdomain_name,
                '{{domain_name}}': domainName
            };

            const templateData = await getEmailTemplate(replaceObj, slug);
            const emailData = {
                toEmail: employeeInfo.email_id,
                subject: templateData.subject,
                html: templateData.template,
            };
            try {
                sendMail(emailData);
                console.log('Email Sent Successfully');
            } catch (err) {
                console.log(err);
            }
        }

        /**Activity track */
        activity = {
            employee_id: employeeData.data[0].id,
            referrable_type: 1, // employee details store
            referrable_type_id: null,
            action_type: 1, //1 for create 
            created_by: body.created_by,
            created_at: new Date()
        };
        // await db('employee_activity_track').insert(activity);
        event.emit('employeeStoreActivity', { activity });

        // Return the response from the database operation.
        return employeeData;
    } catch (error) {
        // Handle errors and rollback the transaction in case of an exception
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
};


const update = async (body, condition) => {
    let trx;
    try {

        if (condition.id) {

            /**
             * For Activity Track 
             * Get the Employee General Details Before Update.
             * Get the Employee Address Details Before Update.
             * Get the Employee Contact Details Before Upate.
             */
            beforeUpdateData = await commonService.employeeGeneralDetails(condition.id);
        }


        // Default password generator
        const salt = await bcrypt.genSalt(10);
        let newPassword = '';
        if ((body.old_enable_login == 0 || body.old_enable_login == null) && body.enable_login == 1) {
            newPassword = await randomPasswordGenerator();
        }


        // Create an object 'employeeBasicDetails' to store employee details.
        let employeeBasicDetails = {
            first_name: body.first_name,
            last_name: body.last_name,
            middle_name: body?.middle_name || null,
            display_name: body.first_name + ' ' + (body.middle_name == '' || body.middle_name == null ? '' : body.middle_name + ' ') + body.last_name,
            dob: body.dob ? new Date(body.dob).toISOString() : null,
            is_super_admin: false,
            status: 'Active',
            gender: body.gender,
            blood_group: body.blood_group === '' ? null : body.blood_group,
            marital_status: body.marital_status === '' ? null : body.marital_status,
            on_boarding_type: 2,
            onboard_status: 1,
            reference_id: body.reference_id ? body.reference_id : null,
            //employment_type_id: body.employment_type_id ? body.employment_type_id : null,
            contact_number: body.contact_number,
            alternate_contact_number: body.alternate_contact_number ? body.alternate_contact_number : null,
            email_id: body.email_id.toLowerCase(),
            alternate_email_id: body.alternate_email_id ? body.alternate_email_id : null,
            date_of_joining: body.date_of_joining ? new Date(body.date_of_joining).toISOString() : null,
            ssn: body.ssn ? body.ssn : null,
            employee_category_id: body.employment_category_id ? body.employment_category_id : null,
            is_us_citizen: body.is_usc,
            visa_type_id: body.visa_type_id ? body.visa_type_id : null,
            //department_id: body.department_id ? body.department_id : null,
            //team_id: body.team_id ? body.team_id : null,
            reporting_manager_id: body.reporting_manager_id ? body.reporting_manager_id : null,
            profile_picture_url: await generateEmployeeAvatar(body),
            enable_login: body.enable_login ? body.enable_login : null,
            role_id: body.role_id ? body.role_id : null,
            temp_password: true,
            preferable_vendor_id: body?.vendor_id || null,
            vendor_price_per_hour: body?.vendor_id ? body?.vendor_price : null,
            drafted_stage: null,
            updated_by: body.updated_by,
            updated_at: new Date()
        };

        if(newPassword !== ''){
            employeeBasicDetails.password = await bcrypt.hash(newPassword, salt);
        }

        // Initialize a database transaction
        const db = await getConnection();
        trx = await db.transaction();

        
        if(!body.old_is_usc && body.is_usc && body?.visa_detail_id){
            employeeBasicDetails.visa_type_id = null;
            let cond = { id: body.visa_detail_id };
            await employeeVisaService.destroy(body, cond);
        }

        // Store the 'employeeBasicDetails' object in the 'employee' table using the indexRepository.
        const employeeData = await transactionRepository.update(trx, 'employee', condition, employeeBasicDetails);

        // Create an 'employeeAddressDetails' object with properties extracted from the request 'body'.
        const employeeAddressDetails = {
            employee_id: employeeData.data[0].id,
            address_one: body.address_line_one,
            address_two: body.address_line_two ? body.address_line_two : null,
            city: body.city,
            state_id: body.state_id,
            country_id: body.country_id,
            zip_code: body.zip_code,
            updated_by: body.updated_by,
            updated_at: new Date()
        };
        // Call the 'indexRepository.store' function to store the employee's current address details in the 'employee_address_details' table with 'employeeAddressDetails'.
        await transactionRepository.update(trx, 'employee_address_details', { employee_id: condition.id }, employeeAddressDetails);

        let emergency_contact = body.emergency_contact;
        if (emergency_contact?.length > 0) {
            emergency_contact = emergency_contact.filter(obj => Object.values(obj).some(value => value !== ''));
        }

        if (emergency_contact?.length > 0) {
            for (const key in emergency_contact) {
                var employeeEmergencyContactObject = {
                    employee_id: employeeData.data[0].id,
                    relationship_id: emergency_contact[key].relationship_id ? emergency_contact[key].relationship_id : null,
                    name: emergency_contact[key].name ? emergency_contact[key].name : null,
                    email_id: emergency_contact[key].email_id ? emergency_contact[key].email_id : null,
                    contact_number: emergency_contact[key].contact_number ? emergency_contact[key].contact_number : null,
                    address_1: emergency_contact[key].address_1 ? emergency_contact[key].address_1 : null,
                    address_2: emergency_contact[key].address_2 ? emergency_contact[key].address_2 : null,
                    city: emergency_contact[key].city ? emergency_contact[key].city : null,
                    state_id: emergency_contact[key].state_id ? emergency_contact[key].state_id : null,
                    country_id: emergency_contact[key].country_id ? emergency_contact[key].country_id : null,
                    zip_code: emergency_contact[key].zip_code ? emergency_contact[key].zip_code : null,
                };

                if (emergency_contact[key].id) {

                    employeeEmergencyContactObject = {
                        ...employeeEmergencyContactObject,
                        ...{
                            updated_by: body.updated_by,
                            updated_at: new Date()
                        }
                    }

                    /**
                    * Stores the employee's emergency contact information in the 'emergency_contact_information' table.
                    */
                    await transactionRepository.update(trx, 'emergency_contact_information', { id: emergency_contact[key].id }, employeeEmergencyContactObject);
                } else {

                    employeeEmergencyContactObject = {
                        ...employeeEmergencyContactObject,
                        ...{
                            created_by: body.created_by,
                            created_at: new Date()
                        }
                    }
                    await transactionRepository.store(trx, 'emergency_contact_information', employeeEmergencyContactObject);
                }
            }
        }

        // Commit the transaction
        await trx.commit();

        if (body.enable_login == 1 && newPassword !== '') {

            // Send Email to employee after onboarding
            const employeeInfo = body;
            const slug = 'new-employee-onboard';
            var signature = await indexRepository.find('organization', ['organization_name', 'email_signature']); // Fetch the organization signature

            let domainName;
            if (employeeInfo.employment_type_id == 1) {
                domainName = config.domainName;
            } else {
                domainName = config.consultantDomainName;
            }

            // Email subject replace object
            let replaceObj = {
                '{{first_name}}': employeeInfo.first_name,
                '{{user_name}}': employeeInfo.first_name,
                '{{email_id}}': employeeInfo.email_id,
                '{{password}}': newPassword,
                '{{organization_name}}': signature.status ? signature.data[0].organization_name : 'Organization Name',
                '{{organization_signature}}': signature.status ? (signature.data[0].email_signature ? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
                '{{sub_domain_name}}': body.login_subdomain_name,
                '{{domain_name}}': domainName
            };

            const templateData = await getEmailTemplate(replaceObj, slug);
            const emailData = {
                toEmail: employeeInfo.email_id,
                subject: templateData.subject,
                html: templateData.template,
            };
            try {
                sendMail(emailData);
                console.log('Email Sent Successfully');
            } catch (err) {
                console.log(err);
            }
        }

        /**Activity track */
        activity = {
            employee_id: body.employee_id,
            activity_name: 'User Profile > General Details',
            created_by: body.created_by,
            slug: 'general_details'
        };
        event.emit('employeeUpdateActivity', { activity, beforeUpdateData });

        // Return the response from the database operation.
        return employeeData;
    } catch (error) {
        // Handle errors and rollback the transaction in case of an exception
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
};

/**
 * Update function to modify basic employee details.
 * 
 * Logic:
 *   - Fetch the employee's current data before the update for activity tracking.
 *   - Create an object 'employeeBasicDetails' with updated basic employee details from the request body.
 *   - Update the employee's details in the 'employee' table based on the provided condition.
 *   - Fetch the employee's data after the update for activity tracking.
 *   - Create an 'activity' object to track the employee update action.
 *   - Emit an event to trigger the 'employeeUpdateActivity' event handler with 'activity', 'beforeUpdateData', and 'afterUpdateData'.
 *   - Return the response from the update operation.
 *    
 * @param {Object} body - The request body containing updated basic employee details.
 * @param {Object} condition - The conditions to filter the employee to update.
 * @returns {Object} Response with the updated employee details.
 */
const basicDetailsUpdate = async (body, condition) => {

    /* Fetching employee data before update for activity track */
    const beforeUpdateData = await getBasicDetails(condition)

    // Create an object 'employeeBasicDetails' to store updated basic employee details.
    const employeeBasicDetails = {
        first_name: body.first_name,
        last_name: body.last_name,
        middle_name: body?.middle_name || null,
        display_name: body.first_name + ' ' + (body.middle_name == '' || body.middle_name == null ? '' : body.middle_name + ' ') + body.last_name,
        dob: body.dob ? new Date(body.dob).toISOString() : null,
        gender: body.gender,
        blood_group: body.blood_group ? body.blood_group : null,
        marital_status: body.marital_status ? body.marital_status : null,
        updated_by: body.updated_by,
        updated_at: new Date()
    };
    // Update the employee details in the 'employee' table using the indexRepository, based on the provided condition.
    const updatedEmployee = await indexRepository.update('employee', condition, employeeBasicDetails);

    /* Fetching employee data after update for activity track */
    const afterUpdateData = await getBasicDetails(condition)

    /**Activity track */
    activity = {
        employee_id: condition.id,
        referrable_type: 1,
        referrable_type_id: null,
        action_type: 2,
        created_by: body.updated_by,
    };
    event.emit('employeeUpdateActivity', { activity, beforeUpdateData, afterUpdateData });

    // Return the response from the update operation.
    return updatedEmployee;
};

/**
 * Function to retrieve basic employee details based on the provided condition.
 * 
 * Logic:
 *   - Fetch the basic employee details from the 'employee' table based on the provided condition.
 *   - Map the retrieved data to 'responseData'.
 *   - Create an object 'employeeBasicDetails' with selected basic employee details.
 *   - Return the 'employeeBasicDetails' object.
 *    
 * @param {Object} condition - The conditions to filter employee details.
 * @returns {Object} Response with basic employee details.
 */
const getBasicDetails = async (condition) => {
    let dateFormat = await format.getDateFormat();

    const fields = ['first_name', 'last_name', 'middle_name', 'dob', 'gender', 'blood_group', 'marital_status', 'display_name']; // fields to fetch
    var responseData = await indexRepository.find('employee', fields, condition);
    responseData = responseData.data[0];
    const employeeBasicDetails = {
        "First Name": responseData.first_name,
        "Last Name": responseData.last_name,
        "Middle Name": responseData.middle_name ? responseData.middle_name : '-',
        "Date of Birth": responseData.dob ? moment(responseData.dob).format(dateFormat) : '-',
        'Gender': responseData.gender,
        'Blood Group': responseData.blood_group ? responseData.blood_group : '-',
        'Marital Status': responseData.marital_status ? responseData.marital_status : '-',
    };

    return employeeBasicDetails
}

/**
 * Index function to retrieve details of employees based on the provided condition.
 * 
 * Logic:
 *   - Set up the fields to fetch from the 'employee' table.
 *   - Fetch employee details from the 'employee' table based on the provided condition with selected fields.
 *   - If employee data exists:
 *     + Create an empty 'responseData' array to structure the response.
 *     + Map the repository response data (employee_list.data) to 'total_details'.
 *     + Iterate through the total_details, format date values, and create listing objects for each employee detail.
 *     + Push listing objects into the 'responseData' array.
 *     + Return the response object with status true and the employee details in the 'responseData' array.
 *   - Else(data is not found):
 *     + Return the response from the employee_list function.
 *    
 * @param {Object} condition - The conditions to filter employee details.
 * @returns {Object} Response with employee details.
 */
const index = async (condition) => {

    let employeeDetails = await indexRepository.rawQuery(`Select * from getEmployeeDetails('${condition.id}','${condition.date_format}')`);

    if (employeeDetails) {
        employeeDetails = employeeDetails[0];
        employeeDetails.profile_picture_url = employeeDetails?.profile_picture_url ? employeeDetails.profile_picture_url : await generateEmployeeAvatar(employeeDetails)
        employeeDetails.is_off_boarding_initiated = employeeDetails?.last_working_day ? true : false
        employeeDetails.date_of_joining = employeeDetails?.rejoin_date ? employeeDetails.rejoin_date : employeeDetails.date_of_joining

        if (employeeDetails?.last_working_day) {
            let offBoardingData = await indexRepository.find('employee_off_boarding', ['*'], { 'employee_id': condition.id }, 1);
            let offBoardProgress = 0;
            if (offBoardingData.status) {
                let offBoardingDetails = offBoardingData.data[0]

                if (offBoardingDetails.disable_user_access_across_apps) {
                    offBoardProgress += 1
                }
                if (offBoardingDetails.delete_email_id_on !== null) {
                    offBoardProgress += 1
                }
                if (offBoardingDetails.reimbursement_payment !== null || offBoardingDetails.deduction_payment !== null) {
                    offBoardProgress += 1
                }
                if (offBoardingDetails.settlement_mode !== null) {
                    offBoardProgress += 1
                }
                if (employeeDetails.employment_details.employment_type_id == 2) {
                    if (offBoardingDetails.placements !== null) {
                        offBoardProgress += 1
                    }
                    if (offBoardingDetails.notify_emails !== null) {
                        offBoardProgress += 1
                    }
                    employeeDetails.off_boarding_percentage = +((offBoardProgress / 6) * 100).toFixed(2)
                } else {
                    employeeDetails.off_boarding_percentage = +((offBoardProgress / 4) * 100).toFixed(2)
                }
            } else {
                employeeDetails.off_boarding_percentage = 0;
            }
        } else {
            employeeDetails.off_boarding_percentage = 0;
        }

        /* for configurable timesheets available or not*/
        const joins = [
            { table: 'placements as p', alias: 'p', condition: ['p.employee_id', 'employee.id'], type: 'left' },
            { table: 'timesheet_configurations as tc', alias: 'tc', condition: ['tc.id', 'p.timesheet_configuration_id'], type: 'left' }
        ];

        // Call the common find function to fetch data using the determined condition
        var configurable_timesheet_available = await indexRepository.find('employee', ['employee.id as id'], { 'global_search': `"p"."timesheet_configuration_id" is not null and "employee"."status" = 'Active' and ("p"."end_date" is null or "p"."end_date" >= '${moment().format('YYYY-MM-DD')}') and "tc"."cycle_id" = 5 and "employee"."id" = '${condition.id}'` }, 0, joins);
        if (configurable_timesheet_available.status) {
            employeeDetails.is_configurable_timesheet_available = true
        } else {
            employeeDetails.is_configurable_timesheet_available = false
        }
        /* for configurable timesheets available or not*/

        /** Generate Min Last Working Day */
        const min_last_working_day = await indexRepository.rawQuery(
            `Select MAX(start_date) from placements where employee_id = '${condition.id}'`
        )
        employeeDetails.min_last_working_day = (min_last_working_day[0]?.max) ? moment(min_last_working_day[0]?.max).format(condition?.date_format) : '';
        let data = employeeDetails
        data = {
            ...data,
            ...data.basic_details,
            ...data.contact_details,
            ...data.current_address,
            ...data.employment_details,
        }
        return {
            status: true,
            data: data
        }
    } else {
        return employeeDetails;
    }
};

/**
 * Store or Update function to modify Employee Contact Details.
 * 
 * Logic:
 * - Create a new object 'employeeContactDetails' with updated properties.
 * - If 'alternate_contact_number' or 'alternate_email_id' is empty or null, they are set to null.
 * - Call 'indexRepository.update' function to update the contact details in 'employee' table based on provided condition
 * - Return the response from the repository with the updated employee details.
 * 
 * @param {Object} body - The request body containing updated Employee Contact Details.
 * @param {Object} condition - The condition to identify the employee to be updated.
 * @returns {Object} Repository response with updated employee details.
 */
const contactDetailsUpdate = async (body, condition) => {

    /* Fetching contact details before update for activity track */
    const beforeUpdateData = await getContactDetails(condition)

    // Create a new object 'employeeContactDetails' to store contact-related information.
    const employeeContactDetails = {
        contact_number: body.contact_number,
        alternate_contact_number: body.alternate_contact_number ? body.alternate_contact_number : null,
        email_id: body.email_id,
        alternate_email_id: body.alternate_email_id ? body.alternate_email_id : null,
        updated_by: body.updated_by,
        updated_at: new Date()
    };
    // Use the 'indexRepository.update' function to update employee details in the 'employee' table based on the provided 'condition' and 'employeeContactDetails'.
    const employeeData = await indexRepository.update('employee', condition, employeeContactDetails);

    /* Fetching contact details after update for activity track */
    const afterUpdateData = await getContactDetails(condition)

    /**Activity track */
    activity = {
        employee_id: condition.id,
        referrable_type: 2,
        referrable_type_id: null,
        action_type: 2,
        created_by: body.updated_by,
    };
    event.emit('employeeUpdateActivity', { activity, beforeUpdateData, afterUpdateData });

    // Return the response from the repository.
    return employeeData
};

/**
 * Index function to retrieve contact details of employees based on the provided condition.
 * 
 * Logic:
 *   - Set up the fields to fetch from the 'employee' table.
 *   - Fetch contact details from the 'employee' table based on the provided condition with selected fields.
 *   - Map the repository response data (contact_list.data) to 'item'.
 *   - create 'listingObject' for contact detail.
 *   - Return the 'listingObject' 
 *    
 * @param {Object} condition - The conditions to filter contact details.
 * @returns {Object} Response with contact details.
 */
const getContactDetails = async (condition) => {

    /* Setting up the joins and conditions and sort and fields */
    const fields = ['contact_number', 'alternate_contact_number', 'email_id', 'alternate_email_id']; // fields to fetch

    // Use the 'indexRepository.find' function to fetch contact details from the 'employee' table based on the provided 'condition' and 'fields'.
    var contact_list = await indexRepository.find('employee', fields, condition);
    var item = contact_list.data[0];
    const listingObject = {
        "Mobile Number": item.contact_number,
        "Alternate Mobile Number": item.alternate_contact_number ? item.alternate_contact_number : '-',
        "Email ID": item.email_id,
        "Alternate Email ID": item.alternate_email_id ? item.alternate_email_id : '',
    }
    return listingObject
}

/**
 * Function to get details about the current address of an employee.
 *
 * @param {object} condition - The conditions to filter the employee address data.
 *
 * @returns {object} - An object containing specific details about the current address.
 *
 * Logic:
 * - Define 'fields' to specify the columns to retrieve from the database.
 * - Define 'joins' to specify the tables to join for additional data (countries and states).
 * - Use 'indexRepository.find' to retrieve employee address data based on the specified conditions, fields, and joins.
 * - Extract the first data entry from the result (assuming it's an array).
 * - Create a 'listingObject' with specific properties derived from the retrieved data.
 * - Return the 'listingObject'.
 */
const getCurrentAddressDetails = async (condition) => {

    var fields = ['employee_address_details.*', 'countries.name as country_name', 'states.name as state_name']
    const joins = [
        { table: 'countries', condition: ['employee_address_details.country_id', 'countries.id'], type: 'left' },
        { table: 'states', condition: ['employee_address_details.state_id', 'states.id'], type: 'left' }
    ];
    var contact_list = await indexRepository.find('employee_address_details', fields, { "employee_address_details.employee_id": condition.id }, null, joins);
    var item = contact_list.data[0];
    const listingObject = {
        "Address Line 1": item.address_one,
        "Address Line 2": item.address_two ? item.address_two : '-',
        "zip_code": item.zip_code,
        "City": item.city ? item.city : '',
        "State": item.state_name,
        "Country": item.country_name,
    }
    return listingObject
}

/**
 * Update function to modify current address details for an employee.
 * 
 * Logic:
 * - Create a new object 'employeeAddressDetails' with properties from the request body for updating the address details.
 * - If 'address_line_two' is empty or null, it is set to null in the 'employeeAddressDetails'.
 * - Use 'indexRepository.update' function to update the employee's current address details in the 'employee_address_details' table based on provided condition.
 * - Return the response from the repository.
 * 
 * @param {Object} body - The request body containing updated current address details for an employee.
 * @param {Object} condition - The condition to identify which address details to update.
 * @returns {Object} Repository response.
 */
const currentAddressUpdate = async (body, condition) => {

    /* Fetching employee data before update for activity track */
    const beforeUpdateData = await getCurrentAddressDetails(condition)

    // Create an 'employeeAddressDetails' object with properties extracted from the request 'body'.
    const employeeAddressDetails = {
        address_one: body.address_line_one,
        address_two: body.address_line_two ? body.address_line_two : null,
        city: body.city,
        state_id: body.state_id,
        country_id: body.country_id,
        zip_code: body.zip_code,
        updated_by: body.created_by,
        updated_at: new Date()
    };
    // Call the 'indexRepository.update' function to update the 'employee_address_details' entry based on the provided 'condition' and 'employeeAddressDetails'.
    const responseData = await indexRepository.update('employee_address_details', condition, employeeAddressDetails);

    /* Fetching employee address details after update for activity track */
    const afterUpdateData = await getCurrentAddressDetails(condition)

    /**Activity track */
    activity = {
        employee_id: condition.employee_id,
        referrable_type: 4,
        referrable_type_id: null,
        action_type: 2,
        created_by: body.updated_by,
    };
    event.emit('employeeUpdateActivity', { activity, beforeUpdateData, afterUpdateData });

    // Return the response from the repository.
    return responseData
};


/**
 * Function to get employment details for an employee.
 *
 * @param {object} condition - The conditions to filter the employee data.
 *
 * @returns {object} - An object containing specific employment details.
 *
 * Logic:
 * - Define 'fields' to specify the columns to retrieve from the database.
 * - Define 'joins' to specify the tables to join for additional data.
 * - Use 'indexRepository.find' to retrieve employee data based on the specified conditions, fields, and joins.
 * - Extract the first data entry from the result (assuming it's an array).
 * - Create a 'listingObject' with specific properties derived from the retrieved data.
 * - Return the 'listingObject'.
 */
const getEmploymentDetails = async (condition) => {

    const fields = ['employee.*', 'visa_types.name as visa_name', 'departments.name as departments_name', 'teams.name as team_name', 'employee_categories.name as employee_category_name', 'employment_types.name as employeement_type_name', 'roles.name as role_name']
    const joins = [
        { table: 'visa_types', condition: ['visa_types.id', 'employee.visa_type_id'], type: 'left' },
        { table: 'departments', condition: ['departments.id', 'employee.department_id'], type: 'left' },
        { table: 'teams', condition: ['teams.id', 'employee.team_id'], type: 'left' },
        { table: 'employee_categories', condition: ['employee_categories.id', 'employee.employee_category_id'], type: 'left' },
        { table: 'employment_types', condition: ['employment_types.id', 'employee.employment_type_id'], type: 'left' },
        { table: 'roles', condition: ['roles.id', 'employee.role_id'], type: 'left' }
    ];
    var employement_details = await indexRepository.find('employee', fields, { 'employee.id': condition.id }, 0, joins); // Fetch the employee details
    var item = employement_details.data[0];
    const listingObject = {
        "Joining Date": item.date_of_joining ? moment(item.date_of_joining).format('YYYY-MM-DD') : '',
        "Employement Category": item.employee_category_name,
        "Employement Type": item.employeement_type_name,
        "SSN": item.ssn,
        "Is The Employee USC": item.is_us_citizen == 1 ? "Yes" : "No",
        "Reporting Manager": item.reporting_manager_id,
        "Enable Login": item.enable_login == 1 ? "Enable" : "Disable",
        "Visa Type": item.visa_name ? item.visa_name : '',
        "Department": item.departments_name,
        "Employee Team": item.team_name,
        "Role": item.role_name ? item.role_name : '',
    }
    return listingObject
}

/**
 * Updates employment details for an employee based on the provided condition.
 * 
 * Logic:
 * - Create a new object 'employmentDetails' with properties from the request body for employment details.
 * - Use 'indexRepository.update' function to update the employee's employment details in the 'employee' table based on the provided condition and 'employeeBasicDetails'.
 * - Return the response from the repository.
 * 
 * @param {Object} body - The request body containing employment details for an employee.
 * @param {Object} condition - The condition to specify which employee's employment details to update or store.
 * @returns {Object} Repository response.
 */
const employmentDetailsUpdate = async (body, condition) => {

    /* Fetching employee data before update for activity track */
    const beforeUpdateData = await getEmploymentDetails(condition)

    // Create an object 'employmentDetails' to store employee's employment-related information.
    const employmentDetails = {
        //employment_type_id: body.employment_type_id ? body.employment_type_id : null,
        date_of_joining: body.date_of_joining ? new Date(body.date_of_joining).toISOString() : null,
        ssn: body.ssn ? body.ssn : null,
        employee_category_id: body.employment_category_id ? body.employment_category_id : null,
        is_us_citizen: body.is_usc ? body.is_usc : null,
        visa_type_id: body.visa_type_id ? body.visa_type_id : null,
        reporting_manager_id: body.reporting_manager_id ? body.reporting_manager_id : null,
        enable_login: body.enable_login ? body.enable_login : null,
        role_id: body.role_id ? body.role_id : null,
        preferable_vendor_id: body?.vendor_id || null,
        vendor_price_per_hour: body?.vendor_id ? body?.vendor_price : null,
        updated_by: body.updated_by,
        updated_at: new Date()
    };
    // Use the 'indexRepository' to update the employee details based on the provided 'condition' with the 'employmentDetails'.
    const employmentData = await indexRepository.update('employee', condition, employmentDetails);

    if (body.employment_type_name != beforeUpdateData['Employement Type']) {
        await indexRepository.update('employee', condition, { access_token: null, refresh_token: null });
    }
    /* Fetching employee details after update for activity track */
    const afterUpdateData = await getEmploymentDetails(condition)

    /**Activity track */
    activity = {
        employee_id: condition.id,
        referrable_type: 5,
        referrable_type_id: null,
        action_type: 2,
        created_by: body.updated_by,
    };
    event.emit('employeeUpdateActivity', { activity, beforeUpdateData, afterUpdateData });

    // Return the updated employmentData data.
    return employmentData;
};

/**
 * Listing Function to get employee data.
 * Logic:
 * - Fetch the data from the 'employee' table using condition(param) by calling db function.
 *  - If data exists,
 *    + map the data and add avatar to the object
 *    + Prepare the response
 *    + return the response with status as true
 *  - Else
 *    + return the response with status as false
 *
 * @param {object} condition - The conditions to filter the employee data.
 * @param {number} page - The page number of the results to retrieve.
 * @param {number} limit - The maximum number of results per page.
 * @returns {object} - An object containing the retrieved employee data, pagination details, and status.
 */
const listing = async (condition, page, limit, sort_column, sort_order) => {

    let query = `SELECT * FROM GetEmployeeListing(`;
    query += (condition.employment !== null) ? `'${condition.employment}',` : `${condition.employment},`;
    query += (condition.category !== null) ? `'${condition.category}',` : `${condition.category},`;
    query += (condition.visa !== null) ? `'${condition.visa}',` : `${condition.visa},`;
    query += (condition.status !== null) ? `'${condition.status}',` : `${condition.status},`;
    query += (condition.enable_balance_sheet !== null) ? `'${condition.enable_balance_sheet}',` : `${condition.enable_balance_sheet},`;
    query += `'${condition.search}', ${limit}, ${page}, '${sort_column}', '${sort_order}')`;

    // Get employees Lisitng using stored
    const employeeListing = await indexRepository.rawQuery(query);

    if (employeeListing) {
        const total_employees_count = employeeListing[0]?.total_employees_count;
        for (let key in employeeListing) {
            employee = employeeListing[key];
            delete employee.total_employees_count;
            employee.profile_picture_url = employee?.profile_picture_url ? employee.profile_picture_url : await generateEmployeeAvatar(employee)
            /*let emp_edu_details = await indexRepository.find('employee_education_details', ['id'], { employee_id: employee.id })
            let emp_psprt_details = await indexRepository.find('employee_passport_details', ['id'], { employee_id: employee.id })
            let emp_i94_details = await indexRepository.find('employee_i94_details', ['id'], { employee_id: employee.id })
            let emp_visa_details = await indexRepository.find('employee_visa_details', ['id'], { employee_id: employee.id })
            let emp_prsnl_doc = await indexRepository.find('employee_personal_documents', ['id'], { employee_id: employee.id })
            let emp_bnk_details = await indexRepository.find('employee_bank_account_details', ['id'], { employee_id: employee.id })
            let emp_skill_details = await indexRepository.find('employee_skill_details', ['id'], { employee_id: employee.id })
            let complete_profile = '';
            if (emp_edu_details.status) {
                complete_profile = 'education_documents'
            } else if (emp_psprt_details.status) {
                complete_profile = 'passport_document'
            } else if (emp_i94_details.status) {
                complete_profile = 'i94_document'
            } else if (emp_visa_details.status) {
                complete_profile = 'visa_document'
            } else if (emp_prsnl_doc.status) {
                complete_profile = 'personal_documents'
            } else if (emp_bnk_details.status) {
                complete_profile = 'bank_accounts'
            } else if (emp_skill_details.status) {
                complete_profile = 'skills'
            }
            employee.complete_profile = complete_profile*/
        };

        pagination_details = {
            total: total_employees_count,
            currentPage: page,
            perPage: limit,
            totalPages: Math.ceil(total_employees_count / limit) || 0
        }

        return {
            status: true,
            data: employeeListing,
            pagination_data: pagination_details
        }
    } else {
        return employeeListing;
    }
}

/**
 * Function to get document details for an employee.
 *
 * @param {object} condition - The conditions to filter the employee data.
 * @param {boolean} isDocumentUpdate - A flag indicating whether the document is being updated.
 *
 * @returns {object} - An object containing document details.
 *
 * Logic:
 * - Use 'indexRepository.find' to retrieve employee data based on the specified conditions.
 * - Extract the first data entry from the result (assuming it's an array).
 * - Create a 'documentDetails' object with a key 'Document' set to the value of 'isDocumentUpdate'.
 * - Return the 'documentDetails' object.
 */
const getDocumentDetails = async (condition, isDocumentUpdate) => {

    let documentData = await indexRepository.find('employee', ['*'], condition);
    documentData = documentData.data[0]

    const documentDetails = {
        'Document': isDocumentUpdate
    }

    return documentDetails
}

/**
 * Udate function to update employee profile.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Define the destination folder for storing documents.
 * 
 * - Iterate through 'documents' in the request 'body' and process each document:
 *   + If 'new_document_id' is not empty, fetch document details from temporary document records (in 'temp_upload_documents') using the provided 'new_document_id'.
 *   + Move the document file to the specified destination folder ('destFolder') using the original document name.
 *   + Create an object ('fileData') that contains information about the stored document, including its URL, and path.
 *   + Call the 'transactionRepository.update' function and update the 'companies' record with the document information.
 *   + Remove the temporary document record (from 'temp_upload_documents') as it is no longer needed after the document has been successfully processed.
 *   + Return the repository.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 *
 * @param {Object} body - The request body containing employee Details.
 * @returns {Object} Repository response.
 */
const updateProfile = async (body, condition) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()

        const destFolder = `${body.loginSubDomainName}/Employee/${body.reference_id}/Profile-Document`;

        var documents = body.documents
        for (const key in documents) {
            if (documents[key].new_document_id != '' && documents[key].new_document_id != null) {

                var isDocumentUpdate = false
                const beforeUpdateData = await getDocumentDetails({ 'employee.id': condition.id }, isDocumentUpdate)

                // Fetch document details from temporary document records (in 'temp_upload_documents') using the provided 'new_document_id'.
                let documentCondition = { id: documents[key].new_document_id }
                let documentData = await indexRepository.find('temp_upload_documents', ['*'], documentCondition, null, [], null, null, null, false)

                // Move the document file to the specified destination folder ('destFolder') using the generated unique file name.
                let file = await fetchAndMoveDocument(documentData.data, destFolder, documentData.data[0].document_name)

                // create a new entry for each document 
                let fileData = {
                    profile_picture_url: (`${config.documentUrl}${destFolder}/${file}`).replace(/ /g, '%20'),
                    profile_path: `${destFolder}/${file}`,
                    updated_by: body.updated_by,
                    updated_at: new Date()
                }

                const docData = await indexRepository.find('employee', ['profile_picture_url as document_url', 'id'], condition)
                await destroyDocument(docData, destFolder); // Remove the existing document path

                // Update the 'employee' record with the document information by calling 'transactionRepository.update'.
                const repositoryResponse = await transactionRepository.update(trx, 'employee', condition, fileData)

                // Remove the temporary document record (from 'temp_upload_documents') as it is no longer needed after the document has been successfully processed.
                await transactionRepository.destroy(trx, 'temp_upload_documents', { id: documentData.data[0].id })
                isDocumentUpdate = true

                /**Fetcing Documents details after update */
                const afterUpdateData = await getDocumentDetails({ 'employee.id': condition.id }, isDocumentUpdate)
                /**Fetcing Documents details after update */

                //commit the transaction
                await trx.commit();

                /**Activity track */
                activity = {
                    employee_id: condition.id,
                    referrable_type: 1,
                    referrable_type_id: null,
                    action_type: 2,
                    created_by: body.created_by,
                };
                event.emit('employeeUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
                /**Activity track */

                return repositoryResponse
            }
        }
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
};

/**
 * Dropdown Function to get employee data based on specified conditions.
 *
 * Logic:
 * - Determine the condition based on the provided parameters, such as 'enable_payroll', 'emp_type_id', 'timesheet_cycle_id', 'status', and 'search'.
 * - Call the common find function to fetch data from the 'employee' table using the derived condition.
 * - If data exists,
 *   + Prepare the response by removing duplicates.
 *   + Return the response with the unique list of employees.
 * - If no data is found, the response will be empty.
 *
 * @param {object} condition - The condition used to filter the list of employees.
 * @returns {Promise<array>} - A promise that resolves to an array of employee data or an empty array if no data is found.
 */
const dropdown = async (condition) => {

    // Determine the condition based on the provided parameters
    if (condition.enable_payroll) {
        // Condition for employees with enable_payroll
        var dropdownCondition = condition.search ? { 'global_search': `'employee.display_name' ilike '%${condition.search}%'`, 'employee.enable_payroll': true } : { 'employee.enable_payroll': true };

    } else if (condition.emp_type_id == '1') {
        // Condition for employees with employment_type_id equal to 1
        var dropdownCondition = condition.search ? { 'global_search': `'employee.display_name' ilike '%${condition.search}%'`, 'employee.employment_type_id': 1, 'employee.status': 'Active' } : { 'employee.employment_type_id': 1, 'employee.status': 'Active' };

    } else if (condition.emp_type_id == '2') {
        // Condition for employees with employment_type_id equal to 2 or 3
        var dropdownCondition = condition.search ? { 'global_search': `'employee.display_name' ilike '%${condition.search}%'`, 'employee.employment_type_id': [2, 3], 'employee.status': 'Active' } : { 'employee.employment_type_id': [2, 3], 'employee.status': 'Active' };

    } else if (condition.emp_type_id == '3') {
        // Condition for employees with employment_type_id equal to 2
        var dropdownCondition = condition.search ? { 'global_search': `'employee.display_name' ilike '%${condition.search}%'`, 'employee.employment_type_id': [2], 'employee.status': 'Active' } : { 'employee.employment_type_id': [2], 'employee.status': 'Active' };

    } else if (condition.emp_type_id == '4') {
        // Condition for employees with employment_type_id equal to 1 or 2
        var dropdownCondition = condition.search ? { 'global_search': `'employee.display_name' ilike '%${condition.search}%'`, 'employee.employment_type_id': [1, 2], 'employee.status': 'Active' } : { 'employee.employment_type_id': [1, 2], 'employee.status': 'Active' };

    } else if (condition.timesheet_cycle_id) {
        // Condition for employees with a specified timesheet cycle_id
        var dropdownCondition = condition.search ? { 'global_search': `'display_name' ilike '%${condition.search}%' and "p"."timesheet_configuration_id" is not null and "employee"."status" = 'Active' and ("p"."end_date" is null or "p"."end_date" >= '${moment().format('YYYY-MM-DD')}') and "tc"."cycle_id" = 5` } :
            { 'global_search': ` "p"."timesheet_configuration_id" is not null and "employee"."status" = 'Active' and ("p"."end_date" is null or "p"."end_date" >= '${moment().format('YYYY-MM-DD')}') and "tc"."cycle_id" = 5` };

    } else if (condition.status) {
        // Condition for employees with a specific status
        var dropdownCondition = { 'employee.status': condition.status, 'employee.status': 'Active' };
    } else {
        // Default condition for employees
        var dropdownCondition = condition.search ? { 'global_search': `'employee.display_name' ilike '%${condition.search}%'`, 'employee.status': 'Active' } : null;
    }
    const joins = [
        { table: 'placements as p', alias: 'p', condition: ['p.employee_id', 'employee.id'], type: 'left' },
        { table: 'timesheet_configurations as tc', alias: 'tc', condition: ['tc.id', 'p.timesheet_configuration_id'], type: 'left' }
    ];

    // Call the common find function to fetch data using the determined condition
    var employee_list = await indexRepository.find('employee', ['employee.id as id', 'employee.display_name as value', 'employee.profile_picture_url', 'employee.reference_id'], dropdownCondition, 0, joins, null, null, null, null, ['employee.id', 'employee.display_name']);

    // Prepare the response by removing duplicates
    let dropdownData = await removeDuplicatesById(employee_list.data);


    if (condition.timesheet_available == 'true') {
        let employeesQuery = `SELECT DISTINCT emp.id as id, emp.display_name as value, emp.profile_picture_url
        FROM employee as emp
        INNER JOIN placements as plc ON plc.employee_id = emp.id
        INNER JOIN TIMESHEETS AS ts ON ts.placement_id = plc.id
        WHERE emp.deleted_at is null AND plc.deleted_at is null AND ts.deleted_at is null`

        dropdownData = await indexRepository.rawQuery(`${employeesQuery}`)
    }

    return dropdownData;
};

/**
 * Function to get payroll configuration settings for an employee.
 *
 * @param {Object} condition - An object containing conditions to filter employee data.
 *
 * Logic:
 * - Initialize an empty array 'responseData' to store the result.
 * 
 * - Call the 'indexRepository.find' function with conditions to retrieve employee details.
 * 
 * - If the employee details retrieval is successful:
 *   - Create a 'mapping' object to map numeric values to meaningful statuses.
 *   - Build a 'listingObject' with relevant employee information:
 *     - 'employee_name': The name of the employee.
 *     - 'payroll_config_settings_id': Payroll configuration settings ID (if available).
 *     - 'e_verified': Translated status based on the 'mapping' object.
 *   - Push the 'listingObject' into the 'responseData' array.
 * 
 * - Return an object with 'status' set to 'true' and 'data' containing the 'responseData'.
 */
const getPayrollConfigSettings = async (condition) => {

    /* Variables */
    var responseData = [];
    /* Variables */

    /* Default variables */
    var employeeDetails = await indexRepository.find('employee', ['payroll_config_settings_id', 'e_verified'], { "employee.id": condition.employee_id })

    if (employeeDetails.status) {

        const mapping = {
            0: 'Not verified',
            1: 'Verified',
            2: 'Pending',
            3: 'Rejected',
        };

        listingObject = {
            employee_name: employeeDetails.data[0].employee_name,
            payroll_config_settings_id: employeeDetails.data[0].payroll_config_settings_id ? employeeDetails.data[0].payroll_config_settings_id : '',
            e_verified: mapping[employeeDetails.data[0].e_verified]
        }
        responseData.push(listingObject);
    }

    return { status: true, data: responseData }
}

/**
 * Update Employee function to modify an existing employee's details.
 * 
 * Logic:
 * - Accept 'condition' and 'updateEmployeeData' parameters to specify the update conditions and data.
 * - Call the 'indexRepository.update' function to update the employee details in the 'employee' table.
 * - Return the response from the repository.
 * 
 * @param {Object} condition - The conditions to identify the employee to be updated.
 * @param {Object} updateEmployeeData - The data to be updated for the employee.
 * @returns {Object} Repository response.
 */
const updateEmployee = async (condition, updateEmployeeData) => {

    let updateResponse = await indexRepository.update('employee', condition, updateEmployeeData);
    return updateResponse;
};

/**
 * Get Relieving function to retrieve relieving information for an employee.
 * 
 * Logic:
 * - Accept 'condition' parameter to specify the conditions for fetching employee details.
 * - Fetch employee information using 'indexRepository.find'.
 * - If employee information is retrieved successfully:
 *    + Fetch placement information for the employee from the 'placements' table.
 *    + Format the placement data and store it in 'placementList'.
 * - Create a 'listingObject' with employee and placement details.
 * - Return the response with the 'listingObject'.
 * 
 * @param {Object} condition - The conditions to identify the employee for relieving details.
 * @returns {Object} Repository response containing relieving information.
 */
const getRelieving = async (condition) => {
    var responseData = [];
    var placementList = [];

    var employee_list = await indexRepository.find('employee', ['relieving_date'], condition); // Fetching the employee information

    if (employee_list.status) {

        // Joins
        const joins = [
            { table: 'companies', condition: ['companies.id', 'placements.client_id'] }
        ];
        let placementData = await indexRepository.find('placements', ['placements.id', 'project_name', 'end_date', 'placements.reference_id', 'companies.name as client_name'], { 'placements.employee_id': condition.id, 'placements.status': 'In Progress', 'companies.entity_type': 'client' }, 0, joins, null, null, null, true); // Fetching the placement information for that employee
        if (placementData.status) {
            for (let key in placementData.data) {
                let item = placementData.data[key];
                let placement_list = {
                    placement_id: item.id,
                    project_name: item.client_name + ' - ' + item.reference_id,
                    end_date: item.end_date ? moment(item.end_date).format('YYYY-MM-DD') : ''
                };
                placementList.push(placement_list);
            }
        }
    }

    let listingObject = {
        employee_id: condition.id,
        relieving_date: employee_list.data[0].relieving_date ? moment(employee_list.data[0].relieving_date).format('YYYY-MM-DD') : '',
        data: placementList
    };
    responseData.push(listingObject);
    return { status: true, data: responseData };
};

/**
 * Enable Login function to activate login access for an employee.
 * 
 * Logic:
 * - Generate a new password using 'randomPasswordGenerator()' function.
 * - Calculate a salt for password hashing.
 * - Fetch employee information using 'indexRepository.find'.
 * - Update the employee record with login access details.
 * - Commit the transaction.
 * - Fetch the organization signature for email composition.
 * - Compose an email template with relevant details.
 * - Send an email to the employee with login information.
 * - Return a response indicating successful activation.
 * 
 * @param {Object} body - The request body containing information for enabling login access.
 * @returns {Object} Repository response indicating the success or failure of the login access activation.
 */
const enableLogin = async (body) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        var newPassword = await randomPasswordGenerator(); // Random password generator
        const salt = await bcrypt.genSalt(10);  //Hash of password

        var employeeData = await indexRepository.find('employee', ['employment_type_id', 'first_name', 'last_name', 'display_name', 'email_id'], { id: body.employee_id }); // Fetch the employee infor

        let employeeInfo = employeeData.data[0];
        let active = {
            status: 'Active',
            enable_login: true,
            password: await bcrypt.hash(newPassword, salt),
            access_token: null,
            refresh_token: null,
            fcm_token: null,
            updated_by: body.updated_by,
            updated_at: new Date(Date.now()),
        };
        var access = await transactionRepository.update(trx, 'employee', { id: body.employee_id }, active);
        await trx.commit();

        if (access) {
            var signature = await indexRepository.find('organization', ['organization_name', 'email_signature']); // Fetch the organization signature

            let domainName;
            if (employeeInfo.employment_type_id == 1) {
                domainName = config.domainName;
            } else {
                domainName = config.consultantDomainName;
            }

            // Email subject replace object
            let replaceObj = {
                '{{first_name}}': employeeInfo.first_name,
                '{{last_name}}': employeeInfo.last_name,
                '{{display_name}}': employeeInfo.display_name,
                '{{email_id}}': employeeInfo.email_id,
                '{{password}}': newPassword,
                '{{organization_name}}': signature.status ? signature.data[0].organization_name : 'Organization Name',
                '{{organization_signature}}': signature.status ? (signature.data[0].email_signature ? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
                '{{sub_domain_name}}': body.login_subdomain_name,
                '{{domain_name}}': domainName
            };

            let templateData = await getEmailTemplate(replaceObj, 'enable-user-access');
            let emailData = {
                toEmail: employeeInfo.email_id,
                subject: templateData.subject,
                html: templateData.template
            };
            sendMail(emailData);
            console.log(`Email Sent Successfully to ${employeeInfo.email_id}`);
        }

        return { status: true };
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
};

/**
 * Disable Login function to deactivate login access for an employee.
 * 
 * Logic:
 * - Fetch employee information using 'indexRepository.find'.
 * - Update the employee record to disable login access.
 * - Commit the transaction.
 * - Fetch the organization signature for email composition.
 * - Compose an email template with relevant details.
 * - Send an email to the employee notifying them of login access deactivation.
 * - Return a response indicating successful deactivation.
 * 
 * @param {Object} body - The request body containing information for disabling login access.
 * @returns {Object} Repository response indicating the success or failure of the login access deactivation.
 */
const disableLogin = async (body) => {

    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        var employeeData = await indexRepository.find('employee', ['first_name', 'last_name', 'display_name', 'email_id'], { id: body.employee_id });
        let employeeInfo = employeeData.data[0]; // Employee information

        let deActive = {
            enable_login: false,
            access_token: null,
            refresh_token: null,
            fcm_token: null,
            updated_by: body.updated_by,
            updated_at: new Date(),
        };
        await transactionRepository.update(trx, 'employee', { id: body.employee_id }, deActive);
        await trx.commit();

        let signature = await indexRepository.find('organization', ['organization_name', 'email_signature']); // Fetch the organization signature

        // Set the email template and send the email
        let replaceObj = {
            '{{first_name}}': employeeInfo.first_name,
            '{{last_name}}': employeeInfo.last_name,
            '{{display_name}}': employeeInfo.display_name,
            '{{email_id}}': employeeInfo.email_id,
            '{{sub_domain_name}}': body.login_subdomain_name,
            '{{organization_name}}': signature.status ? signature.data[0].organization_name : 'Organization Name',
            '{{organization_signature}}': signature.status ? (signature.data[0].email_signature ? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
        };
        var templateData = await getEmailTemplate(replaceObj, 'disable-user-access');
        var emailData = {
            toEmail: employeeInfo.email_id,
            subject: templateData.subject,
            html: templateData.template
        };
        sendMail(emailData);
        console.log(`Email Sent Successfully to ${employeeInfo.email_id}`);

        return { status: true, message: 'Employee is Active' };
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
};

/**
 * Salary Per Payroll Calculation function to calculate the employee's salary per payroll cycle.
 * 
 * Logic:
 * - Fetch payroll configuration information using 'indexRepository.find'.
 * - Extract the payroll cycle ID from the configuration.
 * - Calculate the employee's pay based on the provided pay value and payroll cycle.
 * - Return the calculated employee pay per payroll cycle.
 * 
 * @param {Object} query - The request query containing information for payroll calculation.
 * @returns {Object} Repository response containing the calculated employee pay per payroll cycle.
 */
const salaryPerPayrollCalculation = async (query) => {

    var payConfiguration = await indexRepository.find('payroll_config_settings', ['payroll_cycle_id'], { id: query.payroll_config_settings_id }, null, [], null, null, null, false); // Fetch the Configuration information

    var lastPayConfiguration = payConfiguration.data[0];
    var employeePay = 0;
    var pay = Number(query.pay_value);

    if (lastPayConfiguration.payroll_cycle_id == 1) { // Weekly pay
        employeePay = Number((pay / 52).toFixed(2));
    } else if (lastPayConfiguration.payroll_cycle_id == 2) { // Bi Week pay
        employeePay = Number((pay / 26).toFixed(2));
    } else if (lastPayConfiguration.payroll_cycle_id == 3) { // Semi Monthly Pay
        employeePay = Number((pay / 24).toFixed(2));
    } else if (lastPayConfiguration.payroll_cycle_id == 4) { // Monthly Pay
        employeePay = Number((pay / 12).toFixed(2));
    }
    return { status: true, data: employeePay };
};

/**
 * Index function to retrieve contact details of employees based on the provided condition.
 * 
 * Logic:
 *   - Set up the fields to fetch from the 'employee' table.
 *   - Fetch contact details from the 'employee' table based on the provided condition with selected fields.
 *   - Map the repository response data (contact_list.data) to 'item'.
 *   - create 'listingObject' for contact detail.
 *   - Return the 'listingObject' 
 *    
 * @param {Object} condition - The conditions to filter contact details.
 * @returns {Object} Response with contact details.
 */
const getProfileIndex = async (body) => {

    /* Setting up the joins and conditions and sort and fields */
    const fields = ['contact_number', 'alternate_contact_number', 'email_id', 'first_name', 'middle_name', 'last_name', 'reference_id', 'profile_picture_url', 'gender']; // fields to fetch

    // Use the 'indexRepository.find' function to fetch contact details from the 'employee' table based on the provided 'condition' and 'fields'.
    var employee_list = await indexRepository.find('employee', fields, { id: body.loginUserId });
    var item = employee_list.data[0];
    const listingObject = {
        first_name: item.first_name,
        middle_name: item.middle_name ? item.middle_name : '',
        last_name: item.last_name,
        reference_id: item.reference_id,
        email_id: item.email_id,
        contact_number: item.contact_number,
        mobile_number: item.alternate_contact_number ? item.alternate_contact_number : '',
        profile_picture_url: item.profile_picture_url ? item.profile_picture_url : await generateEmployeeAvatar(item)

    }
    return { status: true, data: listingObject }
}

/**
 * Update Off Board Employee function is to update off board data required of ana employee.
 * 
 * Logic:
 * Create a new object 'updateOffBoardData' with properties from the request body.
 * - Call the 'indexRepository.update' function to update the 'updateOffBoardData' to the 'employee_off_boarding' table.
 * 
 * @param {Object} employee - The request body containing Employee offboard Details.
 * @returns {Object} Repository response.
 */
const updateOffBoardEmployee = async (updateData, condition, body) => {
    let trx;
    try {

        // Initialize a database transaction
        const db = await getConnection();
        trx = await db.transaction();
        let employeeOffBoard;

        if (condition.id) {
            // If Id exist update the employee off board data.
            employeeOffBoard = await transactionRepository.update(trx, 'employee_off_boarding', condition, updateData);
            await transactionRepository.update(trx, 'employee', { id: body.employee_id }, { last_working_day: body.last_working_day, enable_login: false, access_token: null, refresh_token: null, fcm_token: null, status: 'In Active' });
        } else {
            // if no id store the new record in 'employee_off_boarding_data' table
            employeeOffBoard = await indexRepository.store('employee_off_boarding', updateData);
            await transactionRepository.update(trx, 'employee', { id: body.employee_id }, { last_working_day: body.last_working_day, enable_login: false, access_token: null, refresh_token: null, fcm_token: null, status: 'In Active' });
        }

        // Commit the transaction
        await trx.commit();

        return employeeOffBoard;
    } catch (error) {
        // Handle errors and rollback the transaction in case of an exception
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

/**
 * Employee Off Boarding Details Function to retrieve the employee off boarding details.
 * 
 * Logic:
 *   - Set up the fields to fetch from the 'employee_off_boarding' table.
 *   - Fetch employee oof board details from the 'employee_off_boarding' table based on the provided condition with selected fields.
 *   - If employee data exists:
 *     + Create an empty 'responseData' array to structure the response.
 *   - Else(data is not found):
 *     + Return the response.
 * 
 * @param {Object} condition - The conditions to filter employee details.
 * @returns {Object} Response with employee off boarding details.
 */
const employeeOffBoadingDetails = async (condition, dateFormat) => {

    var offBoardObject = {};

    // Get Application Name from organization.
    const applicationName = await indexRepository.find('organization', ['associated_app_names']);
    offBoardObject.application_name = applicationName.data[0]?.associated_app_names ? applicationName.data[0]?.associated_app_names : '';
    offBoardObject.employee_name = condition.employee_name ?? '';
    offBoardObject.employee_id = condition.employee_id ?? '';
    offBoardObject.type = condition.employment_type_id ?? '';

    // Get employee Off boarding data
    const joins = [
        {
            table: 'employee',
            condition: ['employee.id', 'employee_off_boarding.employee_id'],
            type: 'left'
        }
    ];

    let employeeOffBoard = await indexRepository.find('employee_off_boarding',
        [
            'employee.last_working_day',
            'employee.balance_amount',
            'employee_off_boarding.id',
            'employee_off_boarding.employee_id',
            'employee_off_boarding.disable_user_access_across_apps',
            'employee_off_boarding.notify_emails as notifyEmails',
            'employee_off_boarding.settlement_mode',
            'employee_off_boarding.skip_disable_user_access_across_apps',
            'employee_off_boarding.skip_notify_emails',
            'employee_off_boarding.skip_settlement_mode',
            'employee_off_boarding.skip_delete_email_id',
            'employee_off_boarding.delete_email_id_on',
            'employee_off_boarding.delete_email_id_document',
            'employee_off_boarding.placements',
            'employee_off_boarding.reimbursement_payment',
            'employee_off_boarding.deduction_payment'
        ],
        { 'employee.id': condition.employee_id },
        null,
        joins);

    offBoardObject.id = (employeeOffBoard.status) ? (employeeOffBoard?.data?.[0]?.id ?? '') : '';
    offBoardObject.finish_once = (employeeOffBoard.status) ? true : false;
    employeeOffBoard = employeeOffBoard?.data?.[0];

    // Get the active placement details related to the employee
    let query = `Select 
        plc.id as placement_id,
        plc.reference_id as placement_reference_id,
        cmp.logo_document_url,
        cmp.name as company_name,
        plc.end_date as placement_end_date,
        plc.start_date as placement_start_date
    from placements as plc
    left join companies as cmp on plc.client_id = cmp.id
    where plc.employee_id = '${condition.employee_id}'`;

    if (condition.last_working_day) {
        query += ` AND (plc.end_date IS NULL OR plc.end_date > '${condition.last_working_day}')`;
    }
    let placements = await indexRepository.rawQuery(query);

    if (placements?.length > 0) {
        placements.forEach(placement => {
            placement.placement_end_date = (condition.last_working_day) ? moment(condition.last_working_day).format(dateFormat) : '';
            placement.placement_start_date = (placement.placement_start_date) ? moment(placement.placement_start_date).format(dateFormat) : '';
        });
    }
    const placement = {
        status: (employeeOffBoard?.placements) ? true : false,
        data: placements?.length > 0 ? await replaceNullsWithEmptyString(placements) : []
    };
    offBoardObject.placement = placement;

    // Last Working Date
    const { last_working_day } = employeeOffBoard ?? {};
    offBoardObject.last_working_day = {
        date: (last_working_day) ? moment(last_working_day).format(dateFormat) : moment(condition.last_working_day).format(dateFormat),
        status: !!last_working_day
    }

    // Disable User Access
    const { disable_user_access_across_apps } = employeeOffBoard ?? {};
    const disable_user_access = {
        status: !!disable_user_access_across_apps
    }
    offBoardObject.disable_user_access = disable_user_access;

    // Notify Emails or Send Revocation details
    const { notifyEmails } = employeeOffBoard ?? {};
    const revocationDocument = notifyEmails?.document;
    const notify_proof_of_document = {
        id: '',
        document_name: revocationDocument?.document_name ?? '',
        document_url: revocationDocument?.document_url ?? '',
        deleted_url: ''
    }
    let email_sent_to;
    let disabled = (['H-1B', 'CPT', 'OPT'].includes(condition.visa_name)) ? true : false;
    if (notifyEmails?.email_sent_to) {
        email_sent_to = notifyEmails?.email_sent_to;
    } else {
        // Get Employee Visa Details
        email_sent_to = ['H-1B'].includes(condition.visa_name) ? 1 : (['CPT', 'OPT'].includes(condition.visa_name) ? 2 : '');
    }
    const send_revocation = {
        email_sent_to: email_sent_to ?? '',
        disabled: disabled,
        date: (notifyEmails?.date) ? moment(notifyEmails?.date).format(dateFormat) : '',
        proof_of_document: notify_proof_of_document,
        status: !!notifyEmails
    };
    offBoardObject.send_revocation = send_revocation;

    // Delete Email Id Data
    let { delete_email_id_on, delete_email_id_document } = employeeOffBoard ?? {};
    delete_email_id_document = (delete_email_id_document) ? JSON.parse(delete_email_id_document) : '';
    const proof_of_document = {
        id: '',
        document_name: delete_email_id_document?.document_name ?? '',
        document_url: delete_email_id_document?.document_url ?? '',
        deleted_url: ''
    }
    const delete_mail = {
        email_deleted_on: delete_email_id_on ? moment(delete_email_id_on).format(dateFormat) : '',
        proof_of_document: proof_of_document ?? '',
        status: !!delete_email_id_on || !!delete_email_id_document
    };
    offBoardObject.delete_mail = delete_mail;

    // Expense Management
    // Get employee reimbursement amount
    let reimbursement_amount = await employeeDueExpense('1', condition.employee_id);
    reimbursement_amount = (reimbursement_amount?.due) ?? 0;

    // Get Employee Balance effected deduction amount
    // Balance effected deductions
    let deduction_amount = await employeeDueExpense('2', condition.employee_id);
    deduction_amount = (deduction_amount?.due) ?? 0;

    const { deduction_payment, reimbursement_payment } = employeeOffBoard ?? {};
    const expense_settlement = {
        reimbursement_amount: reimbursement_amount ?? '',
        reimbursement_payment: reimbursement_payment ?? '',
        deduction_amount: deduction_amount ?? '',
        deduction_payment: deduction_payment ?? '',
        status: (deduction_payment != null) ? true : ((reimbursement_payment != null) ? true : false)
    }
    offBoardObject.expense_settlement = expense_settlement;

    // Settlment mode
    const { settlement_mode, balance_amount } = employeeOffBoard ?? {};
    const settle_balance = {
        total_balance: balance_amount ?? 0,
        default_total_balance: balance_amount ?? 0,
        pay_via: settlement_mode ?? '',
        status: !!settlement_mode
    }
    offBoardObject.settle_balance = settle_balance;

    // Percentage Calculation
    offBoardObject.off_boarding_percentage = '';

    return { status: true, data: [offBoardObject] }
}

/**
 * Rehire Employee Function to rehire an employee with updated details.
 * 
 * Logic:
 *   - Begin a transaction to ensure data consistency.
 *   - Update employee details to mark the employee as active with the provided information.
 *   - Update the employee's visa details with the new visa type and validity dates.
 *   - For each supporting document:
 *     + If a document is provided, store it in the specified destination folder and update the document mapping in the database.
 *   - Commit the transaction if all operations are successful.
 *   - Return success message if no errors occur.
 *   - If any error occurs during the process, rollback the transaction and return an error message.
 * 
 * @param {Object} body - The request body containing the updated employee and visa details.
 * @param {Object} condition - The condition to identify the employee to rehire.
 * @returns {Object} Response indicating the success or failure of the rehire operation.
 */
const rehireEmployee = async (body, condition) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        const destFolder = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Visa Documents/${condition.id}`

        let Active = {
            enable_login: body.enable_login,
            status: 'Active',
            rejoin_date: body.rejoin_date,
            date_of_joining: body.rejoin_date,
            last_working_day: null,
            visa_type_id: body.visa_type_id,
            access_token: null,
            refresh_token: null,
            fcm_token: null,
            updated_by: body.updated_by,
            updated_at: new Date(),
        };
        await transactionRepository.update(trx, 'employee', condition, Active);

        const updateData = {
            visa_type_id: body.visa_type_id,
            valid_from: body.valid_from ? moment(body.valid_from).format('YYYY-MM-DD') : null,
            valid_till: body.valid_till ? moment(body.valid_till).format('YYYY-MM-DD') : null,
        }

        let visaDetails;
        if (body.employee_visa_exists) {
            visaDetails = await transactionRepository.update(trx, 'employee_visa_details', { employee_id: condition.id }, updateData)
        } else {
            visaDetails = await transactionRepository.store(trx, 'employee_visa_details', { ...updateData, employee_id: condition.id })
        }
        // Visa Supporting Documents Information storing in employee_visa_detail_documents
        var supportDocuments = body.support_documents
        for (const key in supportDocuments) {

            if (supportDocuments[key].visa_document_upload_id != '' && supportDocuments[key].visa_document_upload_id != null) {

                // Create a document object for mapping and store it in the 'employee_visa_detail_documents' table.
                var documentObject = {
                    employee_visa_details_id: visaDetails.data[0].id,
                    created_by: body.created_by,
                    created_at: new Date()
                }
                var documentData = await transactionRepository.store(trx, 'employee_visa_detail_documents', documentObject)

                // Store the document in the specified destination folder and update the document mapping.
                await commonDocumentStore(trx, 'employee_visa_detail_documents', destFolder, supportDocuments[key].visa_document_upload_id, documentData.data[0].id)
            } else {
                var documentObject = {
                    employee_visa_details_id: visaDetails.data[0].id,
                    created_by: body.created_by,
                    created_at: new Date()
                }
                var documentData = await transactionRepository.store(trx, 'employee_visa_detail_documents', documentObject);
            }
        }

        await transactionRepository.update(trx, 'employee_off_boarding', { employee_id: condition.id }, { deleted_at: new Date(), updated_at: new Date(), updated_by: body.updated_by });
        await trx.commit();

        return { status: true, message: 'Employee is Active' };
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

const finishOffBoard = async (body, dateFormat) => {
    let trx;
    try {

        // Databse connection
        const db = await getConnection();
        trx = await db.transaction();

        let beforeUpdateData;
        let offBoardingData = {
            'employee_id': body.employee_id
        };
        let employeeUpdateData = {};

        // Append Placements data to offBoardingData
        if (body.placement && body.placement?.status == true) {
            const placementsData = JSON.stringify(body.placement?.data);
            offBoardingData = { ...offBoardingData, ...{ placements: placementsData } };
        }

        // Append Disable Use Across Apps to offBoardingData
        if (body.disable_user_access && body.disable_user_access?.status == true) {
            offBoardingData = { ...offBoardingData, ...{ disable_user_access_across_apps: body.disable_user_access?.status } };
        }

        // Append Revocation data to offBoardingData
        if (body.send_revocation && body.send_revocation?.status == true) {

            // Store the send revocation proof of document.
            if (body.send_revocation?.proof_of_document?.id) {

                const newDocumentId = body.send_revocation?.proof_of_document?.id;
                const destFolder = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/EmployeeOffBoarding`;
                var documentData = await indexRepository.find('temp_upload_documents', ['*'], { id: newDocumentId }, null, [], 0, null, null, false);
                const fileName = body.send_revocation?.proof_of_document?.document_name;
                var file = await fetchAndMoveDocument(documentData.data, destFolder, fileName)

                // Update object
                let fileData = {
                    id: '',
                    document_name: fileName,
                    document_url: (`${config.documentUrl}${destFolder}/${file}`).replace(/ /g, '%20'),
                    document_path: `${destFolder}/${file}`
                };
                body.send_revocation.document = fileData;

                if (body.send_revocation?.proof_of_document?.deleted_url) {
                    DOCUMENT_URL = body.send_revocation?.proof_of_document?.deleted_url?.split('/');
                    DOCUMENT_NAME = DOCUMENT_URL[DOCUMENT_URL.length - 1];
                    let _pathDest = config.documentUploadPath + '/' + destFolder + '/' + DOCUMENT_NAME;
                    fs.unlink(_pathDest, (error) => {
                        console.log(error);
                        return;
                    });
                }
            }

            delete body.send_revocation?.status;
            delete body.send_revocation?.proof_of_document;
            offBoardingData = { ...offBoardingData, ...{ 'notify_emails': body.send_revocation } };
        }

        // Append Delete Mail Data to offBoardingData
        if (body.delete_mail && body.delete_mail?.status == true) {

            let deleteMailObject = {
                'delete_email_id_on': body.delete_mail?.email_deleted_on
            }

            // Store the Delete mail on proof of document 
            if (body.delete_mail?.proof_of_document?.id) {

                const newDocumentId = body.delete_mail?.proof_of_document?.id;
                const destFolder = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/EmployeeOffBoarding`;
                var documentData = await indexRepository.find('temp_upload_documents', ['*'], { id: newDocumentId }, null, [], 0, null, null, false);
                const fileName = body.delete_mail?.proof_of_document?.document_name;
                var file = await fetchAndMoveDocument(documentData.data, destFolder, fileName)

                // Update object
                let fileData = {
                    id: '',
                    document_name: fileName,
                    document_url: (`${config.documentUrl}${destFolder}/${file}`).replace(/ /g, '%20'),
                    document_path: `${destFolder}/${file}`
                };
                deleteMailObject = { ...deleteMailObject, ...{ 'delete_email_id_document': fileData } }

                if (body.delete_mail?.proof_of_document?.deleted_url) {
                    DOCUMENT_URL = body.delete_mail?.proof_of_document?.deleted_url?.split('/');
                    DOCUMENT_NAME = DOCUMENT_URL[DOCUMENT_URL.length - 1];
                    let _pathDest = config.documentUploadPath + '/' + destFolder + '/' + DOCUMENT_NAME;
                    fs.unlink(_pathDest, (error) => {
                        console.log(error);
                        return;
                    });
                }
            }
            offBoardingData = { ...offBoardingData, ...deleteMailObject };
        }

        // Append Expense Settlement Data to offBoardingData
        if (body.expense_settlement && body.expense_settlement?.status == true) {
            const expenseSettlementObject = {
                'reimbursement_payment': (body.expense_settlement?.reimbursement_payment) ? body.expense_settlement?.reimbursement_payment : 0,
                'deduction_payment': (body.expense_settlement?.deduction_payment) ? body.expense_settlement?.deduction_payment : 0
            }
            offBoardingData = { ...offBoardingData, ...expenseSettlementObject };
        }

        // Append Settlement Mode Data to offBooardingData
        if (body.settle_balance && body.settle_balance?.status == true) {
            const settlementObject = {
                'settlement_mode': (body.settle_balance?.pay_via) ? body.settle_balance.pay_via : 0
            }
            employeeUpdateData = {
                ...employeeUpdateData,
                ...{ 'balance_amount': 0 }
            }
            offBoardingData = { ...offBoardingData, ...settlementObject };
        }

        let employeeOffBoard;
        if (body.id) {
            const condition = { 'employee_id': body.employee_id, 'last_working_day': body.last_working_day?.date };
            beforeUpdateData = await employeeOffBoadingDetails(condition, dateFormat);

            // Update Employee Off Boarding Data if we get `id` from body.
            employeeOffBoard = await indexRepository.update('employee_off_boarding', { id: body.id }, offBoardingData);
        } else {
            employeeOffBoard = await indexRepository.store('employee_off_boarding', offBoardingData);
        }

        /** Update Placement End Dates received from request */
        if (body.placement && body.placement?.status == true) {
            const placements = body.placement?.data;
            placements.map(async placement => {
                await indexRepository.update('placements', { 'id': placement.placement_id }, { 'end_date': placement?.placement_end_date });
            })
        }

        /** Update Expense Settlement amount of the employee */
        if (body.expense_settlement && body.expense_settlement?.status == true) {

            let expenseIds = [];
            let finalExpenses = {};
            if (body.expense_settlement?.reimbursement_payment) {

                // Expense Management
                // Get employee reimbursement amount
                let reimbursement_amount = await employeeDueExpense('1', body.employee_id);
                expenseIds = reimbursement_amount?.expense_ids?.map(item => item.id);
                reimbursement_amount = (reimbursement_amount?.due) ?? 0;

                if (reimbursement_amount > 0) {

                    let expenseUpdate = {};
                    if (body.expense_settlement?.reimbursement_payment == 1) {

                        const balanceAmount = parseFloat(body.employee_balance_amount) + parseFloat(reimbursement_amount);
                        body.employee_balance_amount = balanceAmount;
                        if (body.settle_balance?.status == false) {
                            // Add Reimbursement amount to balance sheet
                            employeeUpdateData = {
                                ...employeeUpdateData,
                                ...{ 'balance_amount': balanceAmount }
                            };
                        } else {
                            // Make Employee Balance amount zero
                            employeeUpdateData = {
                                ...employeeUpdateData,
                                ...{ 'balance_amount': 0 }
                            };
                        }

                        // If Reimbursement amount added to balance make expense status as 'Processed'
                        expenseUpdate = {
                            ...expenseUpdate, ...{ 'status': 'Processed' }
                        }
                    } else if (body.expense_settlement?.reimbursement_payment == 2) {

                        // If Expense id Write of make expense status as 'Write off'
                        expenseUpdate = {
                            ...expenseUpdate, ...{ 'status': 'Write-off' }
                        }
                    }

                    // Update Expense status based on reimbursement payment selected
                    expenseIds.map(async expense => {
                        await indexRepository.update('expense_management', { 'id': expense }, expenseUpdate);
                    });
                    if (expenseIds.length > 0) {
                        finalExpenses = {
                            ...finalExpenses,
                            ...{ 'reimbursementExpenseIds': expenseIds }
                        };
                    }
                }
            }

            if (body.expense_settlement?.deduction_payment) {

                // Get Employee Balance effected deduction amount
                // Balance effected deductions
                let deduction_amount = await employeeDueExpense('2', body.employee_id);
                expenseIds = deduction_amount?.expense_ids?.map(item => item.id);
                deduction_amount = (deduction_amount?.due) ?? 0;

                if (deduction_amount > 0) {

                    let expenseUpdate = {};
                    if (body.expense_settlement?.deduction_payment == 1) {

                        const balanceAmount = parseFloat(body.employee_balance_amount) - parseFloat(deduction_amount);

                        if (body.settle_balance?.status == false) {
                            // Add Reimbursement amoun to balance sheet
                            employeeUpdateData = {
                                ...employeeUpdateData,
                                ...{ 'balance_amount': balanceAmount }
                            };
                        } else {
                            // Make Employee Balance amount zero
                            employeeUpdateData = {
                                ...employeeUpdateData,
                                ...{ 'balance_amount': 0 }
                            };
                        }
                        expenseUpdate = {
                            ...expenseUpdate, ...{ 'status': 'Processed' }
                        }
                    } else if (body.expense_settlement?.deduction_payment == 2) {

                        // If Expense id Write of make expense status as 'Write off'
                        expenseUpdate = {
                            ...expenseUpdate, ...{ 'status': 'Write-off' }
                        }
                    }

                    // Update Expense status based on reimbursement payment selected
                    expenseIds?.map(async expense => {
                        await indexRepository.update('expense_management', { 'id': expense }, expenseUpdate);
                    });

                    if (expenseIds.length > 0) {
                        finalExpenses = {
                            ...finalExpenses,
                            ...{ 'reimbursementExpenseIds': expenseIds }
                        };
                    }
                }
            }

            if (finalExpenses) {

                // Update Employee Off Boarding Data if we get `id` from body.
                await indexRepository.update('employee_off_boarding',
                    { id: employeeOffBoard?.data[0]?.id },
                    { 'expense_ids': finalExpenses });
            }
        }

        /** Close all tickets of the employee */
        await indexRepository.update('employee_self_services', { 'employee_id': body.employee_id }, { 'status': 'Closed' });

        /** 
         * Remove Login Access for the employee.
         * Update Last Working Day.
         * Update Status of the employee to In Active.
         **/
        employeeUpdateData = {
            ...employeeUpdateData,
            ...{
                'enable_login': 0,
                'last_working_day': body.last_working_day?.date,
                'status': 'In Active'
            }
        };
        await indexRepository.update('employee', { 'id': body.employee_id }, employeeUpdateData);

        // Commit the transaction
        await trx.commit();

        /** Handle Activity Track */
        // if (body.id) {

        //     // Store Activity Track
        //     activity = {
        //         employee_id: body?.employee_id,
        //         referrable_type: '16', // 16 for employee off boarding
        //         referrable_type_id: employeeOffBoard.data[0]?.id,
        //         action_type: 2, // 2 for update
        //         created_by: body.created_by,
        //         beforeUpdateData: beforeUpdateData,
        //         afterUpdateData: await employeeOffBoadingDetails({ 'employee_id': body.employee_id, 'last_working_day': body.last_working_day?.date }, dateFormat)
        //     };
        //     event.emit('employeeUpdateActivity', { activity: activity });
        // } else {
        //     activity = {
        //         employee_id: body?.employee_id,
        //         referrable_type: '16', // 16 for employee off boarding
        //         referrable_type_id: employeeOffBoard.data[0]?.id,
        //         action_type: 1, // 1 for store
        //         created_by: body.created_by
        //     };
        //     event.emit('employeeUpdateActivity', { activity: activity });
        // }

        return { status: true, data: employeeOffBoard.data }

    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

/**
 * Get Employee Due Expenses using employee id and expense transaction type
 */
const employeeDueExpense = async (expense_transaction_type, employee_id) => {

    const expense = await indexRepository.rawQuery(`Select 
    json_agg(json_build_object('id', id)) as expense_ids,
    sum(amount) as due 
	from expense_management where expense_transaction_type = '${expense_transaction_type}' AND employee_id = '${employee_id}' AND status != 'Processed' AND status != 'Rejected'`);
    return expense?.[0];
}

module.exports = { store, update, updateProfile, index, basicDetailsUpdate, contactDetailsUpdate, currentAddressUpdate, employmentDetailsUpdate, listing, dropdown, getPayrollConfigSettings, updateEmployee, getRelieving, enableLogin, disableLogin, salaryPerPayrollCalculation, getProfileIndex, updateOffBoardEmployee, employeeOffBoadingDetails, rehireEmployee, finishOffBoard };
