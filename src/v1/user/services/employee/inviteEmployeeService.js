require('dotenv').config();
const { randomPasswordGenerator } = require('../../../../../helpers/globalHelper');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const indexRepository = require('../../repositories/index');
const { fetchAndMoveDocumentInviteEmployee, fetchAndMoveDocument, generateEmployeeAvatar } = require('../../../../../helpers/globalHelper');
const transactionRepository = require('../../repositories/transactionRepository');
const prefixesServices = require('../../services/configurations/prefixesServices');
const { getConnection } = require('../../../../middlewares/connectionManager');
const { event } = require('../../../../../events/employeeActivityEvent');
const { eventss } = require('../../../../../events/notificationEvent');
const config = require('../../../../../config/app')
const { sendMail } = require('../../../../../utils/emailSend');
const { getEmailTemplate } = require('../../../../../helpers/emailTemplate');
const format = require('../../../../../helpers/format');
const { mailEvents } = require('../../../../../events/mailTemplateEvent/inviteConsultantMailEvent');
const path = require('path');
const LINK_EXPIRED = 'Link Expired';
const OFFER_ACCEPTED = 'Offer Accepted';
const OFFER_REJECTED = 'Offer Rejected';

/**
 * Update Invite Link function to updat the status of the link sent to the employee.
 * 
 * Logic:
 * Create a new object 'updateInvite' with properties from the request body for the invited employee.
 * - Call the 'indexRepository.update' function to update the 'updateInvite' to the 'invited_employee' table.
 * - If status is approved, update the 'invited_employee_information' table with ocr document data.
 * 
 * @param {Object} employee - The request body containing Invited Employee status Details.
 * @returns {Object} Repository response.
 */
const update = async (body, condition) => {
    let trx;
    try {
        // Initialize a database transaction
        const db = await getConnection();
        trx = await db.transaction();


        if (body.i9andw4?.i9_document?.id != '' && body.i9andw4?.i9_document?.id != null && body.i9_document_uploaded == null) {
            let docData = await moveFilesFromTemptoInviteFolder(trx, body, body.i9andw4.i9_document.id);
            body.i9_document_id = docData.id
        }

        if (body.i9andw4?.w4_document?.id != '' && body.i9andw4?.w4_document?.id != null && body.w4_document_uploaded == null) {
            let docData = await moveFilesFromTemptoInviteFolder(trx, body, body.i9andw4.w4_document.id)
            body.w4_document_id = docData.id
        }

        if (body.status == 'Offer Accepted' || body.status == 'Pending' || body.status == 'Waiting') {
            for (const key in body.upload_documents) {
                const item = body.upload_documents[key].data;
                if (item.length > 0) {
                    for (let value in item) {
                        if (item[value]?.id != "" && item[value]?.id != null && item[value]?.id != undefined && item[value]?.slug == undefined) {
                            let docData = await moveFilesFromTemptoInviteFolder(trx, body, item[value].id, key)
                            item[value].id = docData.id;
                            item[value].document_name = docData.document_name;
                            item[value].document_url = docData.document_url;
                            item[value].slug = 'invite_via_link';
                        }
                    }
                }
            }
        }

        const updateInvite = {
            status: body.final ? OFFER_ACCEPTED : body.status,
            upload_documents: body.upload_documents,
            w4_document_id: body.w4_document_id,
            i9_document_id: body.i9_document_id,
            updated_at: new Date(),
            submitted_on: new Date(),
        };

        var invitedEmployeeUpdate = await indexRepository.update('invited_employee', condition, updateInvite);
        var contact_information = body.emergency_contacts;
        for (let contact in contact_information) {
            let emergencyContact = contact_information[contact];
            let emergency_contact = {
                name: emergencyContact.name,
                relationship_id: emergencyContact.relationship_id,
                mobile_number: emergencyContact.mobile_number,
                address_1: emergencyContact.address_1,
                address_2: emergencyContact.address_2,
                city: emergencyContact.city,
                state_id: emergencyContact.state_id,
                country_id: emergencyContact.country_id,
                zip_code: emergencyContact.zip_code
            }
            if (emergencyContact.id != '' && emergencyContact.id != null) {
                await indexRepository.update('invited_employee_emergency_contact', { id: emergencyContact.id }, emergency_contact);
            } else {
                emergency_contact.invited_employee_id = condition.id

                // Store emergency contact information of the invited employee in 'invited_employee_emergency_contact' table.
                await indexRepository.store('invited_employee_emergency_contact', emergency_contact);
            }
        }

        // Commit the transaction
        await trx.commit();

        // Return the response from the update operation.
        return invitedEmployeeUpdate;
    } catch (error) {
        // Handle errors and rollback the transaction in case of an exception
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

async function moveFilesFromTemptoInviteFolder(trx, body, id, key = null) {

    const destFolder = `${body.loginSubDomainName}/Employee/Invite-Employee-Document`;

    // Fetch document details from temporary document records (in 'temp_upload_documents') using the provided 'new_document_id'.
    let documentCondition = { id: id }
    let documentData = await transactionRepository.find(trx, 'temp_upload_documents', ['*'], documentCondition, null, [], null, null, null, false);

    let fileName = documentData.data[0]?.document_name;

    /**
     * Check if any offer letter has the same name.
     * If Exist get the count of records with same document name and increment to file name.
     */
    const count = await indexRepository.count('invited_employee_documents', { global_search: `"document_name" ilike '%${fileName}%'` });

    if (count?.data > 0) {
        let ext = path.extname(fileName)
        const baseName = path.basename(fileName);
        // Extract the file name without extension
        const fileNameWithoutExt = path.parse(baseName).name;
        fileName = fileNameWithoutExt + '-(' + (Number(count.data)) + ')' + ext;
    }

    // Move the document file to the specified destination folder ('destFolder') using the generated unique file name.
    let file = await fetchAndMoveDocument(documentData.data, destFolder, fileName);

    // create a new entry for each document 
    let fileData = {
        document_name: file,
        document_url: (`${config.documentUrl}${destFolder}/${file}`).replace(/ /g, '%20'),
        document_path: `${destFolder}/${file}`,
        created_at: new Date(),
        document_slug: key
    }

    // Update the 'employee' record with the document information by calling 'transactionRepository.update'.
    let docData = await transactionRepository.store(trx, 'invited_employee_documents', fileData);
    fileData.id = docData.data[0].id;

    // Remove the temporary document record (from 'temp_upload_documents') as it is no longer needed after the document has been successfully processed.
    await transactionRepository.destroy(trx, 'temp_upload_documents', { id: documentData.data[0].id })

    return fileData;
}

const onBoardEmployee = async (body) => {
    let trx;
    try {

        const fields = ['first_name', 'middle_name', 'last_name', 'email_id', 'mobile_number', 'dob', 'gender', 'invited_employee_data']
        const joins = [
            { table: 'invited_employee_information', condition: ['invited_employee_information.invited_employee_id', 'invited_employee.id'] }
        ];
        var invitedEmployee = await indexRepository.find('invited_employee', fields, { 'invited_employee.id': body.id }, 0, joins); // Fetch the employee details
        var invitedEmployeeDetails = invitedEmployee.status ? invitedEmployee.data : [];

        const field = ['invited_employee_emergency_contact.name as name', 'mobile_number', 'address_1', 'address_2', 'city', 'zip_code', 'relationship_types.id as relationship_id', 'relationship_types.name as relation_name', 'states.id as state_id', 'states.name as state_name', 'countries.id as country_id', 'countries.name as country_name']
        const join = [
            { table: 'relationship_types', condition: ['relationship_types.id', 'invited_employee_emergency_contact.relationship_id'] },
            { table: 'states', condition: ['states.id', 'invited_employee_emergency_contact.state_id'] },
            { table: 'countries', condition: ['countries.id', 'invited_employee_emergency_contact.country_id'] }
        ];
        var emergencyContacts = await indexRepository.find('invited_employee_emergency_contact', field, { 'invited_employee_emergency_contact.invited_employee_id': body.id }, 0, join); // Fetch the employee emergency contact details

        var invitedEmployeeEmergencyContacts = emergencyContacts.status ? emergencyContacts.data : [];
        let condition = { slug: 'consultant-contractor' };
        let reference_id = await prefixesServices.getPrefix(condition);

        // Default password generator
        const salt = await bcrypt.genSalt(10);
        if (body.enable_login == 1) {
            var newPassword = await randomPasswordGenerator();
        }

        // Default profile generator
        let unqNumber = (invitedEmployeeDetails[0]?.gender?.toLowerCase() == 'male') ? 36 : 35;
        let randomNumber = Math.floor(Math.random() * (unqNumber - 1 + 1)) + 1;

        // Create an object 'employeeBasicDetails' to store employee details.
        const employeeBasicDetails = {
            first_name: invitedEmployeeDetails[0]?.first_name,
            last_name: invitedEmployeeDetails[0]?.last_name,
            middle_name: invitedEmployeeDetails?.middle_name || null,
            display_name: invitedEmployeeDetails[0]?.first_name + ' ' + (invitedEmployeeDetails[0]?.middle_name == '' || invitedEmployeeDetails[0]?.middle_name == null ? '' : invitedEmployeeDetails[0]?.middle_name + ' ') + invitedEmployeeDetails[0]?.last_name,
            dob: invitedEmployeeDetails[0]?.dob ? new Date(invitedEmployeeDetails[0]?.dob).toISOString() : null,
            is_super_admin: false,
            status: 'Active',
            gender: invitedEmployeeDetails[0]?.gender,
            //blood_group: body.blood_group === '' ? null : body.blood_group,
            //marital_status: body.marital_status === '' ? null : body.marital_status,
            on_boarding_type: 3,
            onboard_status: 1,
            reference_id: reference_id.status ? reference_id.data : null,
            employment_type_id: body.employment_type_id ? body.employment_type_id : null,
            contact_number: invitedEmployeeDetails[0]?.mobile_number,
            //alternate_contact_number: body.alternate_contact_number ? body.alternate_contact_number : null,
            email_id: invitedEmployeeDetails[0]?.email_id,
            password: (body.enable_login == 1) ? await bcrypt.hash(newPassword, salt) : null,
            //alternate_email_id: body.alternate_email_id ? body.alternate_email_id : null,
            date_of_joining: body.date_of_joining ? new Date(body.date_of_joining).toISOString() : null,
            ssn: body.ssn ? body.ssn : null,
            employee_category_id: body.employment_category_id ? body.employment_category_id : null,
            is_us_citizen: body.is_usc ? body.is_usc : null,
            visa_type_id: invitedEmployeeDetails[0]?.invited_employee_data?.work_authorization.visa_type_id ? invitedEmployeeDetails[0]?.invited_employee_data?.work_authorization.visa_type_id : null,
            department_id: body.department_id ? body.department_id : null,
            team_id: body.team_id ? body.team_id : null,
            reporting_manager_id: body.reporting_manager_id ? body.reporting_manager_id : null,
            profile_picture_url: `${config.avatarLink}${invitedEmployeeDetails[0]?.gender?.toLowerCase()}/${randomNumber}.png`,
            enable_login: body.enable_login ? body.enable_login : null,
            role_id: body.role_id ? body.role_id : null,
            temp_password: true,
            preferable_vendor_id: body?.vendor_id || null,
            vendor_price_per_hour: body?.vendor_id ? body?.vendor_price : null,
            drafted_stage: null,
            created_by: null,
            created_at: new Date()
        };

        // Initialize a database transaction
        const db = await getConnection();
        trx = await db.transaction();

        // Store the 'employeeBasicDetails' object in the 'employee' table using the indexRepository.
        const employeeData = await transactionRepository.store(trx, 'employee', employeeBasicDetails);

        const emergency_contact = invitedEmployeeEmergencyContacts
        for (const key in emergency_contact) {
            var employeeEmergencyContactObject = {
                employee_id: employeeData.data[0].id,
                relationship_id: emergency_contact[key].relationship_id,
                name: emergency_contact[key].name,
                email_id: emergency_contact[key].email_id ? emergency_contact[key].email_id : null,
                contact_number: emergency_contact[key].mobile_number,
                address_1: emergency_contact[key].address_1,
                address_2: emergency_contact[key].address_2 ? emergency_contact[key].address_2 : null,
                city: emergency_contact[key].city,
                state_id: emergency_contact[key].state_id,
                country_id: emergency_contact[key].country_id,
                zip_code: emergency_contact[key].zip_code,
                created_by: body.created_by,
                created_at: new Date()
            };
            //   emergencyContacts.push(employeeEmergencyContactObject)

            /**
            * Stores the employee's emergency contact information in the 'emergency_contact_information' table.
            */
            await transactionRepository.store(trx, 'emergency_contact_information', employeeEmergencyContactObject);
        }

        for (let keyss in invitedEmployeeDetails[0]?.invited_employee_data) {
            let destFolder = '';
            let item = invitedEmployeeDetails[0]?.invited_employee_data[keyss];
            switch (item) {
                case 'copy_of_void_cheque':
                    // define destination folder for employee bank documents
                    destFolder = `${body.subdomain_name}/Employee/${reference_id}/BankDocuments`;

                    let bankObj = {
                        employee_id: employeeData.data[0].id,
                        bank_name: item.bank_name,
                        account_number: item.account_number,
                        routing_number: item.routing_number,
                        account_type: item.account_type,
                        created_by: body.created_by,
                        created_at: new Date()
                    };
                    if (item?.new_document_id != '') {
                        const new_document_id = item.new_document_id;

                        var documentData = await indexRepository.find('invited_employee_documents', ['*'], { id: new_document_id }, null, [], 0, null, null, false);

                        // move file to destionation folder
                        const fileName = documentData.data[0].document_name;
                        await fetchAndMoveDocumentInviteEmployee(body.subdomain_name, documentData.data, destFolder, fileName);

                        bankObj.void_cheque_document_url = (`${config.documentUrl}${destFolder}/${fileName}`).replace(/ /g, '%20');
                        bankObj.void_cheque_document_path = destFolder + '/' + fileName;
                        bankObj.void_cheque_document_name = documentData?.document_name;

                        // Remove the temporary document record (from 'temp_upload_documents') as it is no longer needed after the document has been successfully processed.
                        await transactionRepository.destroy(trx, 'invited_employee_documents', { id: documentData.data[0].id })
                    }

                    if (invitedEmployeeDetails['w4_document']?.new_document_id != '') {
                        const new_document_id = invitedEmployeeDetails['w4_document'].new_document_id;

                        var documentData = await indexRepository.find('invited_employee_documents', ['*'], { id: new_document_id }, null, [], 0, null, null, false);

                        // move file to destionation folder
                        const fileName = documentData.data[0].document_name;
                        await fetchAndMoveDocumentInviteEmployee(body.subdomain_name, documentData.data, destFolder, fileName);

                        bankObj.deposit_form_document_url = (`${config.documentUrl}${destFolder}/${fileName}`).replace(/ /g, '%20');
                        bankObj.deposit_form_document_path = destFolder + '/' + fileName;
                        bankObj.deposit_form_document_name = documentData?.document_name;

                        // Remove the temporary document record (from 'temp_upload_documents') as it is no longer needed after the document has been successfully processed.
                        await transactionRepository.destroy(trx, 'invited_employee_documents', { id: documentData.data[0].id })
                    }
                    await transactionRepository.store(trx, 'employee_bank_account_details', bankObj);

                    break;
                case 'work_authorization':
                    let newVisa = {
                        employee_id: employeeData.data[0].id,
                        visa_type_id: item.visa_type_id,
                        valid_from: item.date_of_issue ? moment(item.date_of_issue).format('YYYY-MM-DD') : null,
                        valid_till: item.date_of_expiry ? moment(item.date_of_expiry).format('YYYY-MM-DD') : null,
                        document_number: item.visa_number,
                        status: 1,
                        created_by: body.created_by,
                        created_at: new Date()
                    }
                    // Visa Documents Information storing in employee_visa_detail_documents
                    let visaDetails = await transactionRepository.store(trx, 'employee_visa_details', newVisa);

                    destFolder = `${body.subdomain_name}/Employee/${reference_id}/Visa Documents/${visaDetails.data[0].id}`
                    if (item?.new_document_id != '') {
                        // Fetch document details from temporary document records (in 'temp_upload_documents') using the provided 'visa_document_upload_id'.
                        var documentCondition = { id: visaDocuments[0].new_document_id }
                        var documentData = await indexRepository.find('invited_employee_documents', ['*'], documentCondition, null, [], null, null, null, false);

                        // Count the number of records in 'employee_visa_details' with a similar 'visa_document_name'.
                        const count = await indexRepository.count('employee_visa_details', { global_search: `"visa_document_name" ilike '%${documentData.data[0].document_name}%'` });

                        // Generate a unique file name for the document by appending the count.
                        let fileName = count.data == 0 ? documentData.data[0].document_name : documentData.data[0].document_name + '-' + Number(count.data) + 1;

                        // Move the document file to the specified destination folder ('destFolder') and retrieve the new file name.
                        var file = await fetchAndMoveDocumentInviteEmployee(body.subdomain_name, documentData.data, destFolder, fileName)

                        // Create an object ('fileData') that contains information about the stored document, including its name, URL, path, and status.
                        var fileData = {
                            visa_document_name: fileName,
                            visa_document_url: (`${config.documentUrl}${destFolder}/${file}`).replace(/ /g, '%20'),
                            visa_document_path: `${destFolder}/${file}`,
                            visa_document_status: 0
                        }

                        // Update the 'employee_visa_details' record with the document information by calling 'transactionRepository.update'.
                        await transactionRepository.update(trx, 'employee_visa_details', { id: visaDetails.data[0].id }, fileData)

                        // Remove the temporary document record (from 'temp_upload_documents') as it is no longer needed after the document has been successfully processed.
                        await transactionRepository.destroy(trx, 'invited_employee_documents', { id: documentData.data[0].id })
                    }

                    break;
                case 'passport':
                    destFolder = `${body.subdomain_name}/Employee/${reference_id}/Passport`

                    let employeePassportDetails = {
                        employee_id: employeeData.data[0].id,
                        document_number: item.passport_number,
                        issued_country_id: item.issued_country_id ? item.issued_country_id : null,
                        status: 1,
                        valid_from: item.date_of_issue,
                        valid_till: item.date_of_expiry,
                        created_by: body.created_by,
                        created_at: new Date()
                    };

                    let passportData = await transactionRepository.store(trx, 'employee_passport_details', employeePassportDetails);
                    if (item?.new_document_id != '') {
                        var documentObject = {
                            referrable_type: 3, // passport documents
                            referrable_type_id: passportData.data[0].id,
                            created_by: body.created_by,
                            created_at: new Date()
                        }
                        const documentData = await transactionRepository.store(trx, 'employee_mapped_documents', documentObject)
                        await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documentData.data[0].id)
                    }

                    break;
                case 'educational_document':
                    destFolder = `${body.subdomain_name}/Employee/${reference_id}/Educations`

                    let newEducation = {
                        employee_id: employeeData.data[0].id,
                        education_level_id: item.education_level_id,
                        field_of_study: item.field_of_study,
                        university_name: item.university_name,
                        start_date: item.start_date ? moment(item.start_date).format('YYYY-MM-DD') : null,
                        end_date: item.end_date ? moment(item.end_date).format('YYYY-MM-DD') : null,
                        state_id: item.state_id,
                        country_id: item.country_id,
                        created_by: body.created_by,
                        created_at: new Date()
                    }

                    // Store the new education information in the 'employee_education_details' table within the transaction.
                    let educationData = await transactionRepository.store(trx, 'employee_education_details', newEducation);
                    if (item?.new_document_id != '') {
                        // Create a document object for mapping and store it in the 'employee_mapped_documents' table.
                        var documentObject = {
                            referrable_type: 2, //Set referrable type to indicate education documents.
                            referrable_type_id: educationData.data[0].id,
                            created_by: body.created_by,
                            created_at: new Date()
                        }
                        var documentData = await transactionRepository.store(trx, 'employee_mapped_documents', documentObject)

                        // Store the document in the specified destination folder and update the document mapping.
                        await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documentData.data[0].id)

                    }

                    break;
                case 'other_document':
                    destFolder = `${body.subdomain_name}/Employee/${reference_id}/Personal-Documents`;

                    let newPersonalDocument = {
                        employee_id: employeeData.data[0].id,
                        document_type_id: item.document_type_id,
                        document_number: item.document_number ? item.document_number : null,
                        status: 1,
                        created_by: body.created_by,
                        created_at: new Date(),
                    };

                    let personalDetails = await transactionRepository.store(trx, 'employee_personal_documents', newPersonalDocument);
                    if (item?.new_document_id != '') {
                        // create a new entry for each document 
                        let fileData = {
                            referrable_type: 5, // 5 for personal documents
                            referrable_type_id: personalDetails.data[0].id,
                            created_by: body.created_by,
                            created_at: new Date(),
                        };
                        var documentData = await transactionRepository.store(trx, 'employee_mapped_documents', fileData);
                        await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documentData.data[0].id)
                    }

                    break;
                case 'i94_document':

                    destFolder = `${body.subdomain_name}/Employee/${reference_id}/I94`

                    var newI94Details = {
                        employee_id: employeeData.data[0].id,
                        valid_from: item.date_of_issue ? item.date_of_issue : null,
                        expiry_type: 1,
                        valid_till: item.date_of_expiry ? item.date_of_expiry : null,
                        document_number: item.i94_number,
                        status: 1,
                        country_id: item.country_id,
                        created_at: new Date(),
                        created_by: body.created_by
                    }

                    var i94Details = await transactionRepository.store(trx, 'employee_i94_details', newI94Details);

                    if (item?.new_document_id != '') {
                        var documentObject = {
                            referrable_type: 4, // i-94 documents
                            referrable_type_id: i94Details.data[0].id,
                            created_by: body.created_by,
                            created_at: new Date()
                        }
                        var documentData = await transactionRepository.store(trx, 'employee_mapped_documents', documentObject)
                        await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, item.new_document_id, documentData.data[0].id)
                    }

                    break;

                case 'driving_license':
                    destFolder = `${body.subdomain_name}/Employee/${reference_id}/Personal-Documents`;

                    let newPersonalDocuments = {
                        employee_id: employeeData.data[0].id,
                        document_type_id: item.document_type_id,
                        document_number: item.document_number ? item.document_number : null,
                        status: 1,
                        created_by: body.created_by,
                        created_at: new Date(),
                    };

                    let personalDetail = await transactionRepository.store(trx, 'employee_personal_documents', newPersonalDocuments);
                    if (item?.new_document_id != '') {
                        // create a new entry for each document 
                        let fileData = {
                            referrable_type: 5, // 5 for personal documents
                            referrable_type_id: personalDetail.data[0].id,
                            created_by: body.created_by,
                            created_at: new Date(),
                        };
                        var documentData = await transactionRepository.store(trx, 'employee_mapped_documents', fileData);
                        await commonDocumentStore(trx, 'employee_mapped_documents', destFolder, documents[key].new_document_id, documentData.data[0].id)
                    }

                    break;
                default:
                    break;
            }
        }

        // Commit the transaction

        await transactionRepository.destroy(trx, 'invited_employee', { id: body.id });
        await transactionRepository.destroy(trx, 'invited_employee_information', { invited_employee_id: body.id });
        await transactionRepository.destroy(trx, 'invited_employee_emergency_contact', { invited_employee_id: body.id });
        await trx.commit();

        if (body.enable_login == 1) {

            // Send Email to employee after onboarding
            const employeeInfo = body;
            const slug = 'new-employee-onboard';
            var signature = await indexRepository.find('organization', ['organization_name', 'email_signature']); // Fetch the organization signature

            let domainName = config.consultantDomainName;

            // Email subject replace object
            let replaceObj = {
                '{{first_name}}': invitedEmployeeDetails[0]?.first_name,
                '{{user_name}}': invitedEmployeeDetails[0]?.first_name,
                '{{email_id}}': invitedEmployeeDetails[0]?.email_id,
                '{{password}}': newPassword,
                '{{organization_name}}': signature.status ? signature.data[0].organization_name : 'Organization Name',
                '{{organization_signature}}': signature.status ? (signature.data[0].email_signature ? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
                '{{sub_domain_name}}': body.subdomain_name,
                '{{domain_name}}': domainName
            };

            const templateData = await getEmailTemplate(replaceObj, slug);
            const emailData = {
                toEmail: invitedEmployeeDetails[0]?.email_id,
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

/**
 * Update Status function to update the status of an employee and associated data.
 * 
 * Logic:
 * Retrieve invited employee details from the 'invited_employee_information' table based on the provided condition.
 * If details are found:
 * - Merge the OCR document data from the request body with existing invited employee data.
 * - Create an object 'updateInvite' to update the status in the 'invited_employee' table.
 * - Update the status and associated data in the 'invited_employee_information' table.
 * 
 * @param {Object} body - The request body containing updated status and OCR document data.
 * @param {Object} condition - The condition to identify the invited employee.
 * @returns {Object} Repository response.
 */
const updateStatus = async (body, condition) => {
    let trx;
    try {
        // Initialize a database transaction
        const db = await getConnection();
        trx = await db.transaction();
        const responseData = [];

        var invitedEmployeeDetails = await indexRepository.find('invited_employee_information', ['*'], condition);

        if (invitedEmployeeDetails.status) {

            let invitedEmployeeData = invitedEmployeeDetails.data[0].invited_employee_data;
            let ocrDocumentsData = body.invited_employee_data;

            for (let key in invitedEmployeeData) {
                for (let item in ocrDocumentsData) {
                    if (key == item) {
                        invitedEmployeeData[key] = ocrDocumentsData[key];
                    }
                }
            }

            const updateInvite = {
                status: body.status,
                updated_at: new Date(),
                submitted_on: new Date(),
            };
            await indexRepository.update('invited_employee', { id: condition.invited_employee_id }, updateInvite);

            const informationUpdate = {
                updated_at: new Date(),
                invited_employee_data: invitedEmployeeData,
            };

            // Store OCR Docuemnts data in 'invited_employee_information' table.
            await indexRepository.update('invited_employee_information', condition, informationUpdate);
            responseData.push(invitedEmployeeData);
        }

        // Commit the transaction
        await trx.commit();


        if (body.status == 'rejected') {
            var signature = await indexRepository.find('organization', ['organization_name', 'email_signature', 'invite_link_expiry']); // Fetch the organization signature

            // Emit an event to trigger sending a  email
            mailEvents.emit('consultantreSubmitMail', body, signature, invitedEmployeeDetails?.data[0]);

            // for storing reminders
            body.slug = 'consultant-resubmit-notification'
            eventss.emit('notification', body);
        }

        // Return the response from the update operation.
        return { status: true, data: responseData };
    } catch (error) {
        // Handle errors and rollback the transaction in case of an exception
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

/**
 * Invite Link function to send an invite link for onbaording an employee to employee emaol_id.
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Get the default 'invite_link_expiry' days from organization.
 * - Calculate 'link_expires_on' using organization->'invite_link_expiry' days from current date.
 * - Create a new onject 'invitedEmployeeBasicDetails' with properties from the request body for the new invited employee link entry.
 * - Call the 'indexRepository.store' function to add the 'invitedEmployeeBasicDetails' to the 'invited_employee' table.
 * - Return the response from the repository.
 * 
 * @param {Object} employee - The request body containing Employee Basic Details.
 * @returns {Object} Repository response.
 */
const store = async (body, dateFormat) => {
    let trx;
    try {
        let invitedEmployeeData;

        // Initialize a database transaction
        const db = await getConnection();
        trx = await db.transaction();

        var signature = await indexRepository.find('organization', ['organization_name', 'email_signature', 'invite_link_expiry']); // Fetch the organization signature

        let offerLetter = await moveFilesFromTemptoInviteFolder(trx, body, body.offer_letter_id);
        body.offer_letter_url = offerLetter.document_url;
        body.offer_letter_document_name = offerLetter.document_name;

        if (body.reRequestUpdate) {

            invitedEmployeeData = await transactionRepository.update(trx, 'invited_employee', { id: body.id }, body.reRequestUpdate);
        } else {

            // Create an object 'invitedEmployeeBasicDetails' to store invited employee details.
            const invitedEmployeeBasicDetails = {
                first_name: body.first_name,
                middle_name: body?.middle_name || null,
                last_name: body.last_name,
                email_id: body.email_id,
                mobile_number: body.mobile_number,
                dob: body.dob ? new Date(body.dob).toISOString() : null,
                gender: body.gender,
                status: body.status,
                upload_documents: JSON.stringify(body.upload_documents),
                employment_type_id: body.employment_type_id,
                employee_category_id: body.employee_category_id,
                profile_picture_url: await generateEmployeeAvatar(body),
                offer_letter_url: body.offer_letter_url,
                offer_letter_document_name: body.offer_letter_document_name,
                link_expires_on: moment(new Date()).add(3, 'days'),
                created_by: body.created_by,
                created_at: new Date()
            }

            // Store the 'invitedEmployeeBasicDetails' object in the 'invited_employee' table using the indexRepository.
            invitedEmployeeData = await transactionRepository.store(trx, 'invited_employee', invitedEmployeeBasicDetails);
        }
        var inviteEmployeeId = invitedEmployeeData.data[0].id

        // Commit the transaction
        await trx.commit();

        body.link_expires_on = moment(new Date()).add(3, 'days').format(dateFormat);

        // Emit an event to trigger sending a  email
        mailEvents.emit('consultantInvitationMail', body, signature, inviteEmployeeId);

        // for storing reminders
        body.slug = 'consultant-invitation-notification'
        eventss.emit('notification', body);

        // Return the response from the database operation.
        return invitedEmployeeData;
    } catch (error) {
        // Handle errors and rollback the transaction in case of an exception
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

/**
 * Invited Employee Index Service function is used to fetch the data of invited employee.
 * 
 * Logic:
 * - Call the 'indexRepository.find' function to find the 'data' from 'invited_employee' table.
 * 
 * @param {Object} employee - The request body containing Invited Employee id.
 * @returns {Object} Repository response.
 */
const index = async (condition) => {

    let dateFormat = await format.getDateFormat(); // date format
    let responseData;
    let joins = [{ table: 'employment_types as et', alias: 'et', condition: ['et.id', 'invited_employee.employment_type_id'], type: 'left' }, { table: 'employee_categories as ec', alias: 'ec', condition: ['ec.id', 'invited_employee.employee_category_id'], type: 'left' }]
    const invitedEmployeeData = await indexRepository.find('invited_employee', ['invited_employee.*', 'ec.name as employment_category', 'et.name as employment_type'], condition, null, joins);
    if (invitedEmployeeData.status) {
        let inviteEmployee = invitedEmployeeData.data[0];
        const joins = [
            { table: 'relationship_types', condition: ['relationship_types.id', 'invited_employee_emergency_contact.relationship_id'] },
            { table: 'states', condition: ['states.id', 'invited_employee_emergency_contact.state_id'] },
            { table: 'countries', condition: ['countries.id', 'invited_employee_emergency_contact.country_id'] }
        ];
        const emergencyContacts = await indexRepository.find('invited_employee_emergency_contact', ['invited_employee_emergency_contact.id', 'invited_employee_emergency_contact.name as name', 'mobile_number', 'address_1', 'address_2', 'city', 'zip_code', 'relationship_types.id as relationship_id', 'relationship_types.name as relation_name', 'states.id as state_id', 'states.name as state_name', 'countries.id as country_id', 'countries.name as country_name'], { invited_employee_id: inviteEmployee.id }, null, joins);
        const w4Documents = await indexRepository.find('invited_employee_documents', ['*'], { id: inviteEmployee.w4_document_id }, null, [], null, null, null, false);
        const i9Documents = await indexRepository.find('invited_employee_documents', ['*'], { id: inviteEmployee.i9_document_id }, null, [], null, null, null, false);
        let w4DocumentsData = {
            id: "",
            document_name: "",
            document_url: "",
            approval_status: ""
        }
        let i9DocumentsData = {
            id: "",
            document_name: "",
            document_url: "",
            approval_status: ""
        }
        if (w4Documents.status) {
            w4DocumentsData = {
                id: w4Documents.data[0].id,
                document_name: w4Documents.data[0].document_name,
                document_url: w4Documents.data[0].document_url,
                approval_status: inviteEmployee?.w4_status ?? '',
            }
        }
        if (i9Documents.status) {
            i9DocumentsData = {
                id: i9Documents.data[0].id,
                document_name: i9Documents.data[0].document_name,
                document_url: i9Documents.data[0].document_url,
                approval_status: inviteEmployee?.i9_status ?? '',
            }
        }
        let contacts = [];
        if (emergencyContacts.status) {
            for (let contact of emergencyContacts.data) {
                let contactDetails = {
                    id: contact.id,
                    name: contact.name,
                    mobile_number: contact.mobile_number,
                    relationship_id: contact.relationship_id,
                    relation_name: contact.relation_name,
                    address_1: contact.address_1,
                    address_2: contact.address_2,
                    zip_code: contact.zip_code,
                    city: contact.city,
                    state_id: contact.state_id,
                    state_name: contact.statte_name,
                    country_id: contact.country_id,
                    country_name: contact.country_name
                }
                contacts.push(contactDetails);
            }
        }

        // Make empty Data array in upload documents
        Object.keys(inviteEmployee.upload_documents).map(key => {
            // Here, you can perform any operation with the keys
            // For example, converting keys to uppercase
            const data = inviteEmployee.upload_documents[key]?.data;
            const filteredData = data?.filter(obj => {
                for (let objkey in obj) {
                    if (obj[objkey] !== undefined && obj[objkey] !== '') {
                        obj.name = key;
                        obj.id = obj.id;
                        obj.slug = 'invite_via_link';
                        return true; // Return true if any value is not empty
                    }
                }
                return false; // Return false if all values are empty
            });
            inviteEmployee.upload_documents[key].data = filteredData;
        });

        responseData = {
            status: true,
            data: {
                status: inviteEmployee.status, // Waiting, Offer Accepted, In Progress, Link Expired
                link_valid_till: moment(inviteEmployee.link_expires_on).format(dateFormat), // Link Expires in 3 days
                is_link_expired: inviteEmployee.status !== LINK_EXPIRED ? false : true, //
                id: inviteEmployee.id, // Invired Employee Id
                first_name: inviteEmployee.first_name,
                middle_name: inviteEmployee?.middle_name ?? '',
                last_name: inviteEmployee.last_name,
                email_id: inviteEmployee.email_id,
                mobile_number: inviteEmployee.mobile_number,
                dob: moment(inviteEmployee.dob).format(dateFormat),
                employment_type_id: inviteEmployee.employment_type_id,
                employment_type: inviteEmployee.employment_type,
                employee_category_id: inviteEmployee.employee_category_id,
                employment_category: inviteEmployee.employment_category,
                gender: inviteEmployee.gender,
                rejected_on: (inviteEmployee.status == OFFER_REJECTED) ? moment(inviteEmployee.updated_at).format(dateFormat) : '',
                offer_letter_url: (inviteEmployee.status != LINK_EXPIRED) ? inviteEmployee.offer_letter_url : '',
                profile_picture_url: inviteEmployee.profile_picture_url,
                upload_documents: inviteEmployee.upload_documents,
                i9andw4: {
                    status: false,
                    i9_sample: config.i9Sample,
                    i9_download: config.i9DocumentURL,
                    i9_document: i9DocumentsData,
                    w4_sample: config.w4Sample,
                    w4_download: config.w4DocumentURL,
                    w4_document: w4DocumentsData
                },
                emergency_contacts: contacts
            }
        }

    } else {
        responseData = invitedEmployeeData
    }

    return responseData;
}

const listing = async (condition, page, limit, sort_column, sort_order) => {

    const joins = [
        {
            table: 'employment_types',
            condition: ['invited_employee.employment_type_id', 'employment_types.id'],
            type: 'left'
        },
        {
            table: 'employee_categories',
            condition: ['invited_employee.employee_category_id', 'employee_categories.id'],
            type: 'left'
        }
    ];
    const fields = [
        'invited_employee.id', 'invited_employee.first_name', 'invited_employee.last_name', 'invited_employee.status', 'invited_employee.email_id', 'invited_employee.gender', 'invited_employee.mobile_number', 'invited_employee.profile_picture_url',
        'employment_types.name as employment_type_name', 'employee_categories.name as employee_category_name'
    ];
    const invitedEmployeeData = await indexRepository.findByPagination('invited_employee', fields, condition, joins, page, limit, sort_column, sort_order);
    let serial_no = 1;
    if (invitedEmployeeData.status) {
        for (let item in invitedEmployeeData.data) {
            invitedEmployeeData.data[item].Sno = serial_no;
            invitedEmployeeData.data[item].full_name = invitedEmployeeData.data[item].first_name + " " + invitedEmployeeData.data[item].last_name;
            invitedEmployeeData.data[item].profile_picture_url = invitedEmployeeData.data[item].profile_picture_url ? invitedEmployeeData.data[item].profile_picture_url : await generateEmployeeAvatar(invitedEmployeeData.data[item])
            serial_no++;
        }
    }
    return invitedEmployeeData;
}

const invitationReminder = async (body, condition) => {

    // Emit an event to trigger sending a email
    mailEvents.emit('inviteEmployeeRemindersMail', body, condition);
    return { status: true, data: 'Email Sent Successfully' }
}

const documentUpdate = async (body) => {
    let trx;
    try {
        // Initialize a database transaction
        const db = await getConnection();
        trx = await db.transaction();
        let w4_status = '';
        let i9_status = '';
        if (body.i9andw4?.w4_document?.approval_status || body.i9andw4?.i9_document?.approval_status) {
            w4_status = body.i9andw4?.w4_document?.approval_status ?? '';
            i9_status = body.i9andw4?.i9_document?.approval_status ?? '';
        }

        var invitedEmployeeDocumentUpate = await indexRepository.update('invited_employee', { id: body.id }, { 'upload_documents': body.upload_documents, status: body.updateStatus, w4_status, i9_status });

        // Commit the transaction
        await trx.commit();

        return invitedEmployeeDocumentUpate;
    } catch (error) {
        // Handle errors and rollback the transaction in case of an exception
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}


module.exports = { store, index, listing, update, onBoardEmployee, updateStatus, invitationReminder, documentUpdate };
