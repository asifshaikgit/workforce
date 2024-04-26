const indexRepository = require('../../repositories/index');
const format = require('../../../../../helpers/format');
const moment = require('moment')

/**
 * Get the employee General Details.
 * Get Employee Address Details.
 * Get employee Emergency Contact Information.
 * @param {} employee_id 
 */
const employeeGeneralDetails = async (employee_id) => {

    let generalDetails = {};
    let addressDetails = {};

    const generalDetailsJoins = [
        {
            table: 'employment_types',
            condition: ['employment_types.id', 'employee.employment_type_id'],
            type: 'left',
        },
        {
            table: 'employee_categories',
            condition: ['employee_categories.id', 'employee.employee_category_id'],
            type: 'left',
        },
        {
            table: 'employee as reporting_emp',
            alias: 'reporting_emp',
            condition: ['reporting_emp.id', 'employee.reporting_manager_id'],
            type: 'left',
        }
    ];

    generalDetails = await indexRepository.find('employee',
        [
            'employee.first_name as First Name',
            'employee.middle_name as Middle Name',
            'employee.last_name as Last Name',
            'employee.dob',
            'employee.gender as Gender',
            'employee.blood_group as Blood Group',
            'employee.marital_status as Marital Status',
            'employee.email_id as Email Id',
            'employee.contact_number as Mobile Number',
            'employee.alternate_contact_number as Alternate Mobile Number',
            'employee.alternate_email_id as Alternate Email Id',
            'employee.reference_id as Reference Id',
            'employee.date_of_joining',
            'employment_types.name as Employment Type',
            'employee_categories.name as Employment Category',
            'employee.ssn as SSN',
            'employee.is_us_citizen as Is the Employee USC',
            'reporting_emp.display_name as Reporting Manager '
        ], { 'employee.id': employee_id }, null, generalDetailsJoins);
    if (generalDetails?.data && generalDetails?.data[0]) {
        generalDetails = generalDetails?.data[0];
        generalDetails["Date of Birth"] = moment(generalDetails.dob).format('YYYY-MM-DD');
        generalDetails["Joining Date"] = moment(generalDetails.date_of_joining).format('YYYY-MM-DD');
        delete generalDetails.dob;
        delete generalDetails.date_of_joining;
    }

    const addressJoins = [
        {
            table: 'states',
            condition: ['states.id', 'employee_address_details.state_id'],
            type: 'left'
        },
        {
            table: 'countries',
            condition: ['countries.id', 'employee_address_details.country_id'],
            type: 'left'
        }
    ];
    addressDetails = await indexRepository.find('employee_address_details',
        [
            'address_one as Address Line 1',
            'address_two as Address Line 2',
            'city as City',
            'countries.name as Country',
            'states.name as State',
            'zip_code as Zip Code'
        ],
        { employee_id: employee_id }, null, addressJoins);
    if (addressDetails?.data && addressDetails?.data[0]) {
        addressDetails = addressDetails?.data[0];
    }

    return Object.assign({}, generalDetails, addressDetails);
}

/**
 * Function to get details about the emergency contact information of an employee.
 *
 * @param {object} condition - The conditions to filter the emergency contact information.
 *
 * @returns {object} - An object containing specific details about the emergency contact.
 *
 * Logic:
 * - Define 'fields' to specify the columns to retrieve from the database.
 * - Define 'joins' to specify the tables to join for additional data (relationship_types, countries, and states).
 * - Use 'indexRepository.find' to retrieve emergency contact information based on the specified conditions, fields, and joins.
 * - Extract the first data entry from the result (assuming it's an array).
 * - Create a 'listingObject' with specific properties derived from the retrieved data.
 * - Return the 'listingObject'.
 */
const getEmergencyContactDetails = async (id) => {

    const fields = ['emergency_contact_information.*', 'relationship_types.name as relationship_name', 'countries.name as country_name', 'states.name as state_name']; // fields to fetch
    const joins = [
        { table: 'relationship_types', condition: ['relationship_types.id', 'emergency_contact_information.relationship_id'], type: 'left' },
        { table: 'countries', condition: ['emergency_contact_information.country_id', 'countries.id'], type: 'left' },
        { table: 'states', condition: ['emergency_contact_information.state_id', 'states.id'], type: 'left' }
    ];
    // Use the 'indexRepository.find' function to fetch emergency contact details from the 'employee' table based on the provided 'condition'.
    var contact_list = await indexRepository.find('emergency_contact_information', fields, { 'emergency_contact_information.id': id }, null, joins);
    var item = contact_list.data[0];
    const listingObject = {
        "reference_name": item.name,
        "Name": item.name,
        "Relation": item.relationship_name,
        "Mobile Number": item.contact_number,
        "Address Line 1": item.address_1,
        "Address Line 2": item.address_2 ? item.address_2 : '-',
        "Zip code": item.zip_code,
        "City": item.city,
        "State": item.state_name,
        "Country": item.country_name,
        "Email ID": item.email_id ? item.email_id : '-',
        "employee_id": item.employee_id
    }
    return listingObject;
}

/**
 * To get skill data for activity track
 * @param {*} condition 
 * @param {*} isDocumentUpdate 
 */
const getSkillDetails = async (condition, isDocumentUpdate) => {
    let dateFormat = await format.getDateFormat(); // date format

    const fields = ['employee_skill_details.id', 'employee_skill_details.employee_id', 'employee_skill_details.experience_years', 'employee_skill_details.certification', 'employee_skill_details.certification_date', 'employee_skill_details.certification_status', 'skills.name', 'skills.id as skill_id', 'employee_skill_details.expertise']; // fields to fetch
    const joins = [
        { table: 'skills as skills', alias: 'skills', condition: ['employee_skill_details.skill_id', 'skills.id'], type: 'left' }
    ];

    skillData = await indexRepository.find('employee_skill_details', fields, condition, 0, joins);
    skillData = skillData.data[0]

    const employeeSkillData = {
        'reference_name': skillData.name,
        'Skill Name': skillData.name,
        'Certification ID Or Link': skillData.certification ? skillData.certification : '-',
        'Expertise': skillData.expertise ? skillData.expertise : '-',
        'Certified Year': skillData.certification_date ? moment(skillData.certification_date).format(dateFormat) : '-',
        'Certification Status': skillData.certification_status ? 'Active' : 'In-Active',
        'Years Of Experience': skillData.experience_years ? skillData.experience_years : '-',
        'Document': isDocumentUpdate
    }

    return employeeSkillData
}

/**
 * Function to get details about an employee's bank account.
 *
 * @param {object} condition - The conditions to filter the bank account details.
 * @param {boolean} isVoidChequeDocument - A flag indicating whether to include void cheque document details.
 * @param {boolean} isDepositFormDocument - A flag indicating whether to include W-4 form document details.
 *
 * @returns {object} - An object containing specific details about the employee's bank account.
 *
 * Logic:
 * - Use 'indexRepository.find' to retrieve bank account details based on the specified conditions.
 * - Extract the first data entry from the result (assuming it's an array).
 * - Create a 'tempObj' object with specific properties derived from the retrieved data.
 * - Return the 'tempObj'.
 */
const getBankDetails = async (condition, bankInformation = []) => {

    /* Variables */
    let responseData = [];
    /* Variables */

    var bankDetails = await indexRepository.find('employee_bank_account_details', ['*'], condition, 0, [], null, 'id', 'asc')
    if (bankDetails.status) {

        let total_details = bankDetails.data;
        for (const key in total_details) {

            let tempObj = {
                'id': total_details[key].id,
                'reference_name': total_details[key].bank_name,
                'Bank Name': total_details[key].bank_name,
                'Account Number': total_details[key].account_number,
                'Routing Number': total_details[key].routing_number,
                'Acount Type': total_details[key].account_type,
                'Deposit configuration': total_details[key].deposit_type == 1 ? 'Full Net' : total_details[key].deposit_type == 2 ? 'Partial $' : total_details[key].deposit_type == 3 ? 'Partial %' : total_details[key].deposit_type == 4 ? 'Remainder' : '-',
                'Deposit Value': total_details[key].deposit_value
            };

            let bank = {};
            if (bankInformation && bankInformation.length > 0) {
                bank = bankInformation.find(x => x.id == total_details[key].id);
            }
            if (bank?.void_cheque_documents?.[0]?.new_document_id) {
                tempObj = { ...tempObj, ...{ 'void_check_document_modified': true, 'document_name': 'Void Cheque Document' } }
            } else {
                tempObj = { ...tempObj, ...{ 'void_check_document_modified': false } }
            }

            if (bank?.deposit_form_documents?.[0]?.new_document_id) {
                tempObj = { ...tempObj, ...{ 'w4_form_document_modified': true, 'document_name': 'W-4 Form Document' } }
            } else {
                tempObj = { ...tempObj, ...{ 'w4_form_document_modified': false } }
            }
            responseData.push(tempObj);
        }
        return responseData;
    }
}

/**
 * Function to get details about an employee's passport.
 *
 * @param {object} condition - The conditions to filter the passport details.
 * @param {boolean} isDocument - A flag indicating whether to include document details.
 *
 * @returns {object} - An object containing specific details about the passport.
 *
 * Logic:
 * - Define 'fields' to specify the columns to retrieve from the database.
 * - Define 'joins' to specify the tables to join for additional data (countries).
 * - Use 'indexRepository.find' to retrieve passport details based on the specified conditions, fields, and joins.
 * - Extract the first data entry from the result (assuming it's an array).
 * - Create a 'listingObject' with specific properties derived from the retrieved data.
 * - Return the 'listingObject'.
 */
const getPassportDetails = async (condition, isDocument) => {

    const fields = ['employee_passport_details.*', 'countries.name as country_name']
    const joins = [
        { table: 'countries', condition: ['countries.id', 'employee_passport_details.issued_country_id'], type: 'left' }
    ];
    var employement_details = await indexRepository.find('employee_passport_details', fields, { "employee_passport_details.id": condition.id }, 0, joins);
    var item = employement_details.data[0];
    const listingObject = {
        "reference_name": item.document_number,
        "Passport Number": item.document_number,
        "Issued Country": item.country_name ? item.country_name : null,
        "Status": item.status ? 'Active' : 'Expired',
        "Date of Issue": (item.valid_from) ? moment(item.valid_from).format('YYYY-MM-DD') : '',
        "Date of Expiry": (item.valid_till) ? moment(item.valid_till).format('YYYY-MM-DD') : '',
        "Passport Document": isDocument
    }
    return listingObject
}

/**
 * Function to get details about an employee's I-94 document.
 *
 * @param {object} condition - The conditions to filter the I-94 document details.
 * @param {boolean} isI9dDocument - A flag indicating whether to include I-94 document details.
 *
 * @returns {object} - An object containing specific details about the I-94 document.
 *
 * Logic:
 * - Retrieve the date format using the 'getDateFormat' function.
 * - Define 'fields' to specify the columns to retrieve from the database.
 * - Define 'joins' to specify the tables to join for additional data (countries).
 * - Use 'indexRepository.find' to retrieve I-94 document details based on the specified conditions, fields, and joins.
 * - Extract the first data entry from the result (assuming it's an array).
 * - Create an 'employeeI94Details' object with specific properties derived from the retrieved data.
 * - Return the 'employeeI94Details'.
 */
const getI94Details = async (condition, isI9dDocument) => {
    let dateFormat = await format.getDateFormat();

    const fields = ['employee_i94_details.*', 'countries.name as country_name']; // fields to fetch
    const joins = [
        { table: 'countries', condition: ['countries.id', 'employee_i94_details.country_id'], type: 'left' }
    ];
    var responseData = await indexRepository.find('employee_i94_details', fields, { 'employee_i94_details.id': condition.id }, 0, joins);
    responseData = responseData.data[0];
    const employeeI94Details = {
        "reference_name": responseData.document_number,
        "I-94 Number": responseData.document_number,
        "Country Name": responseData.country_name,
        "Date of Issue": responseData.valid_from ? moment(responseData.valid_from).format(dateFormat) : '',
        "Date of Expiry": responseData.valid_till ? moment(responseData.valid_till).format(dateFormat) : '',
        'Status': responseData.status == 1 ? "Active" : "Expired",
        'Expiry Type': responseData.expiry_type == 1 ? "Duration of Status" : "Has Expirty Date",
        'I-94 Document': isI9dDocument,
    };

    return employeeI94Details
}

/**
 * Get Visa Details function to retrieve information about an Employee's Visa Details.
 * 
 * Logic:
 * - Obtain the date format using the 'getDateFormat()' function.
 * - Define default variables such as 'tableName', 'fields', and 'joins' for fetching data related to Visa Details and Supporting Documents.
 * - Fetch Employee's Visa Details from the 'employee_visa_details' table based on the provided condition, fields, and joins using the 'indexRepository.find' function.
 * - Map the fetched data to 'visaData'.
 * - Define a 'join' variable for retrieving data related to Supporting Documents from the 'employee_visa_detail_documents' table.
 * - Fetch Supporting Documents data associated with the Visa Details using the 'indexRepository.find' function.
 * - Structure the Supporting Documents data and store it in 'docInfor'.
 * - Create a 'visaDetails' object with key-value pairs representing attributes like 'Visa Type', 'Visa Number', 'Valid From', 'Valid Till', 'Visa Document', 'I-9 Document', 'Description', 'Status', and 'Supporting Document'.
 * - Return the 'visaDetails' object.
 * 
 * @param {Object} condition - The condition specifying which Visa Details to retrieve.
 * @param {boolean} isVisaDocumnt - A flag indicating whether the Visa Documents have been updated.
 * @param {boolean} isI9dDocument - A flag indicating whether the I-9 Documents have been updated.
 * @returns {Object} An object containing formatted Employee Visa Details and Supporting Documents for activity tracking.
 */
const getVisaDetails = async (condition, isSupportingDocument) => {
    let dateFormat = await format.getDateFormat(); // date format // employee_visa_detail_documents.employee_visa_details_id

    /* Default variables */
    const tableName = 'employee_visa_details';
    const fields = ['employee_visa_details.id ', 'employee_visa_details.employee_id', 'visa_types.name as visa_document_name', 'employee_visa_details.valid_from', 'employee_visa_details.valid_till'];
    const joins = [
        { table: 'visa_types', condition: ['employee_visa_details.visa_type_id', 'visa_types.id'], type: 'left' },
        { table: 'employee_visa_detail_documents', condition: ['employee_visa_detail_documents.employee_visa_details_id', 'employee_visa_details.id'], type: 'left' },
    ];
    /* Default variables */
    var employeeVisa = await indexRepository.find(tableName, fields, condition, null, joins);
    var visaData = employeeVisa.data[0]

    let visaDetails = {
        'reference_name': visaData.visa_document_name,
        'Visa Type': visaData.visa_document_type,
        'Valid From': (visaData.valid_from) ? moment(visaData.valid_from).format(dateFormat) : '',
        'Valid Till': (visaData.valid_till) ? moment(visaData.valid_till).format(dateFormat) : '',
        'Supporting Document': isSupportingDocument
    }
    return visaDetails
}

/**
 * Get Document Details function to retrieve details of a personal document based on the provided condition.
 * 
 * Logic:
 * - Retrieve the date format from the 'format.getDateFormat()' function to format date values.
 * - Fetch personal document data based on the provided condition, fields, and joins from the 'employee_personal_documents' table using the 'indexRepository.find' function.
 * - Extract the necessary document details and format them into a structured object.
 * 
 * @param {Object} condition - The conditions to filter the personal document.
 * @param {boolean} isDocumentUpdate - A boolean flag indicating if the document is updated.
 * @returns {Object} Document details.
 */
const getDocumentDetails = async (condition, isDocumentUpdate) => {
    let dateFormat = await format.getDateFormat(); // date format

    /** fetching personal document data before update */
    const fields = ['employee_personal_documents.id as employee_personal_id', 'employee_personal_documents.employee_id', 'employee_personal_documents.valid_from', 'employee_personal_documents.valid_till', 'employee_personal_documents.document_number', 'employee_personal_documents.status', 'employee_personal_documents.description', 'document_types.id as document_type_id', 'document_types.name as document_type_name']; // fields to fetch
    const joins = [
        { table: 'document_types', condition: ['employee_personal_documents.document_type_id', 'document_types.id'], type: 'left' }
    ];
    let documentData = await indexRepository.find('employee_personal_documents', fields, condition, null, joins);
    documentData = documentData.data[0]

    const documentDetails = {
        'reference_name': documentData.document_number,
        'Document Type': documentData.document_type_name,
        'Valid From': documentData.valid_from ? moment(documentData.valid_from).format(dateFormat) : '',
        'Valid Till': documentData.valid_till ? moment(documentData.valid_till).format(dateFormat) : '',
        'Document Number': documentData.document_number ? documentData.document_number : '-',
        'Document Status': documentData.status == 1 ? 'Active' : 'Expired',
        'Personal Document': isDocumentUpdate
    }

    return documentDetails
}


module.exports = { getVisaDetails, employeeGeneralDetails, getEmergencyContactDetails, getSkillDetails, getBankDetails, getPassportDetails, getI94Details, getDocumentDetails }
