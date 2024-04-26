
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');
const indexRepository = require('../../repositories/index');
const commonDocumentStore = require('../../../../../helpers/commonDocumentStore');
const format = require('../../../../../helpers/format');
const { events } = require('../../../../../events/placementActivityEvent');
const { mailEvents } = require('../../../../../events/mailTemplateEvent/placmentMailEvent');
const { subStatusEvents } = require('../../../../../events/employeeSubstatusEvent');

const CLIENT = 'client';
const END_CLIENT = 'end-client';
const placementRepository = require('../../repositories/placement/placementRepository.js')
const payrollService = require('./../payroll/payRollService');
const moment = require('moment');
const placementBillingServices = require('../../services/placement/placementBillingServices.js')
const { generateEmployeeAvatar, generateUniqueReferenceId } = require('../../../../../helpers/globalHelper');

/**
 * Store function to add client and end client details for an employee
 * 
 * Logic:
 * - Create a new object 'placementDetails' with properties from the request body.
 * - Call the 'indexRepository.store' function to add the 'placementDetails' to the 'placements' table.
 * - Create a new object 'companyContactsObj' with properties from the request body.
 * - Call the 'indexRepository.store' function to add the 'companyContactsObj' to the 'placement_companies_contacts' table.
 * - Create a new object 'placementBillDetails' with properties from the request body.
 * - Call the 'indexRepository.store' function to add the 'placementBillDetails' to the 'placement_billing_details' table.
 * - Return the response from the repository.
 * 
 * @param {Object} employee - The request body containing Client Details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {
    let trx;
    try {
        // Initialize a database transaction
        const db = await getConnection();
        trx = await db.transaction();

        // Generating the placement refernce id based on prefixes
        let reference_id = await generateUniqueReferenceId('placements', 'placement');
        let pay_type_configuration;

        // If Paytype configuration is default get default pay_type_configuration of an employee
        if (body?.payroll_configuration_type == 1) {
            pay_type_configuration = await indexRepository.find('pay_type_configuration', ['id'], { employee_id: body.employee_id });
        } else {
            const newPayTypeConfig = {
                employee_id: body?.employee_id,
                pay_type: body?.pay_type,
                pay_value: (body?.pay_type == 1) ? body?.pay_value : null,
                payroll_pay: (body?.pay_type == 1) ? body?.payroll_pay : null,
            }
            pay_type_configuration = await transactionRepository.store(trx, 'pay_type_configuration', newPayTypeConfig);

            if (body?.pay_type == 2) {
                let newpayRate = body.pay_rate_configurations;
                newpayRate.forEach(object => {
                    // Parse and handle empty strings for each property
                    object.from_hour = object.from_hour ? parseInt(object.from_hour) : null;
                    object.to_hour = object.to_hour != '' ? parseInt(object.to_hour) : null;
                    object.rate = object.rate ? parseInt(object.rate) : null;
                    object.pay_in = object.pay_in ? parseInt(object.pay_in) : null;
                    object.pay_type_configuration_id = pay_type_configuration?.data[0]?.id;
                });
                await transactionRepository.store(trx, 'pay_rate_configuration', newpayRate);
            }
        }

        const pay_type_configuration_id = pay_type_configuration?.data[0]?.id || null;

        // Create an object 'clientDetails' to store client details for a placement.
        var placementDetails = {
            employee_id: body?.employee_id,
            reference_id: reference_id,
            client_id: body?.client_id,
            end_client_id: body?.end_client_id || null,
            project_name: body?.project_name,
            job_title_id: body?.job_title_id,
            work_email_id: body?.work_email_id,
            placed_employee_id: body?.placed_employee_id || null,
            notice_period: body?.notice_period || null,
            start_date: body?.start_date || null,
            end_date: body?.end_date || null,
            payroll_configuration_type: body?.payroll_configuration_type,
            pay_type_configuration_id: pay_type_configuration_id,
            work_location_type: body?.work_location_type || null,
            work_location_address_line_one: body?.work_location_address_line_one || null,
            work_location_address_line_two: body?.work_location_address_line_two || null,
            work_location_city: body?.work_location_city ? body?.work_location_city : null,
            work_location_state_id: body?.work_location_state_id || null,
            work_location_country_id: body?.work_location_country_id || null,
            work_location_zipcode: body?.work_location_zipcode || null,
            created_by: body.created_by,
        };

        const placementData = await transactionRepository.store(trx, 'placements', placementDetails);
        const employeeData = await transactionRepository.update(trx, 'employee' , {id : body?.employee_id} , { sub_status: 'Placed' });
        const placement_id = placementData?.data[0]?.id;

        // create companyContactsObj and create company contacts for placement
        let clientContacts = []
        var placementClientContactOne = {
            placement_id: placement_id,
            referrable_type: CLIENT,
            companies_contact_id: body.client_contact_one_id ? body.client_contact_one_id : null,
            priority: 1,
        }
        clientContacts.push(placementClientContactOne);

        if (body.client_contact_two_id != null && body.client_contact_two_id != '') {
            var placementClientContactTwo = {
                placement_id: placement_id,
                referrable_type: CLIENT,
                companies_contact_id: body.client_contact_two_id ? body.client_contact_two_id : null,
                priority: 2,
            }
            clientContacts.push(placementClientContactTwo)
        }

        if (body.end_client_contact_one_id != null && body.end_client_contact_one_id != '') {
            var placementClientContactTwo = {
                placement_id: placement_id,
                referrable_type: END_CLIENT,
                companies_contact_id: body.end_client_contact_one_id ? body.end_client_contact_one_id : null,
                priority: 1,
            }
            clientContacts.push(placementClientContactTwo)
        }

        if (body.end_client_contact_two_id != null && body.end_client_contact_two_id != '') {
            var placementClientContactTwo = {
                placement_id: placement_id,
                referrable_type: END_CLIENT,
                companies_contact_id: body.end_client_contact_two_id ? body.end_client_contact_two_id : null,
                priority: 2,
            }
            clientContacts.push(placementClientContactTwo)
        }
        await transactionRepository.store(trx, 'placement_companies_contacts', clientContacts);


        // create placementDocuments Object and create placement docuemnts for a placement
        var documents = body.documents;
        const destFolder = `${body.loginSubDomainName}/Client/${body.client_reference_id}/Placements/${reference_id}/Documents`;
        for (const key in documents) {
            if (documents[key].new_document_id) {
                var documentObject = {
                    placement_id: placement_id,
                    document_type_id: documents[key]?.document_type_id,
                    document_name: documents[key]?.document_name || null,
                    document_url: documents[key]?.document_url,
                    document_path: documents[key]?.document_path,
                    created_by: body.created_by,
                    created_at: new Date()
                }
                var documentData = await transactionRepository.store(trx, 'placement_documents', documentObject);
                await commonDocumentStore(trx, 'placement_documents', destFolder, documents[key].new_document_id, documentData.data[0].id)
            }
        }

        // Commit the transaction
        await trx.commit();

        // Emit an event to trigger sending a placement-related email
        mailEvents.emit('placementMail', body, placement_id);

        var condition = {
            employee_id : body.employee_id,
            end_date : body?.end_date,
        }

        let dateFormat = await format.getDateFormat();
        const today = moment(new Date(), dateFormat).format('YYYY/MM/DD');
        if(body?.end_date && body?.end_date < today ) {
            subStatusEvents.emit('employeeSubStatus', condition)
        }
        
        /**Activity track */
        activity = {
            placement_id: placementData.data[0].id,
            referrable_type: 1,
            referrable_type_id: null,
            action_type: 1,
            created_by: body.created_by,
        };
        events.emit('placementClientStoreActivity', { activity });
        /**Activity track */

        return placementData;
    } catch (error) {
        // Handle errors and rollback the transaction in case of an exception
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

/**
 * Listing function to retrieve a list of placement details based on query parameters and search conditions.
 *
 * Logic:
 * - Call the 'placementRepository.findByPagination' function to fetch placement details based on the provided condition, page, and limit.
 * - If placement data exists:
 *   + Format the data as needed.
 *   + Prepare the response with success data, including placement details such as employee ID, employee name, project information, timesheet settings, client details, billing details, and more.
 *   
 * - If no placement data is found:
 *   + Return the response with an error message indicating no records were found.
 *
 * @param {Object} condition - The condition to filter placement details.
 * @param {number} page - The page number for pagination.
 * @param {number} limit - The maximum number of items per page.
 * @returns {Object} Repository response containing either success data or an error message.
 */
const listingOld = async (condition, page, limit) => {

    var placement = await placementRepository.findByPagination(condition, page, limit); // Fetching the placement invoice listing information

    if (placement.status) {

        let dateFormat = await format.getDateFormat(); // date format

        /* Variables */
        var listingObject = [];
        var responseData = [];
        var total_details = placement.data;
        var pagination_details = placement.pagination;

        /* Variables */

        /* Using Map to iterate the loop and prepare the response */
        listingData = await total_details.map(async (item) => {
            default_hours = item.default_hours
            listingObject = {
                placement_id: item.id,
                reference_id: item.reference_id,
                employee_id: item.employee_id,
                employee_name: item.employee_name,
                employee_reference_id: item.employee_reference_id,
                placed_employee_id: item.placed_employee_id ? item.placed_employee_id : '',
                project_name: item.project_name ? item.project_name : '',
                work_email_id: item.work_email_id ? item.work_email_id : '',
                notice_period: item.notice_period ? item.notice_period : '',
                project_start_date: item.project_start_date ? moment(item.project_start_date).format(dateFormat) : '',
                project_end_date: item.project_end_date ? moment(item.project_end_date).format(dateFormat) : '',
                timesheet_start_day_id: item.day_start_id ? item.day_start_id : '',
                timesheet_start_day: item.day_start ? item.day_start : '',
                timesheet_cycle: item.timesheet_cycle ? item.timesheet_cycle : '',
                client_id: item.client_id ? item.client_id : '',
                client_name: item.client_name ? item.client_name : '',
                default_hours: item.default_hours ? item.default_hours.slice(0, -3) : '',
                endclient_id: item.endclient_id ? item.endclient_id : '',
                default_hours: item.default_hours ? item.default_hours.slice(0, -3) : '',
                endclient_id: item.endclient_id ? item.endclient_id : '',
                endclient_name: item.endclient_name ? item.endclient_name : '',
                net_pay_terms_days: item.net_pay_terms_days ? item.net_pay_terms_days + ' days' : '',
                invoice_cycle: item.invoice_cycle ? item.invoice_cycle : '',
                bill_rate: item.bill_rate ? item.bill_rate : '',
                bill_type: item.bill_type ? item.bill_type : '',
                ts_mandatory: item.ts_mandatory ? item.ts_mandatory : '',
                placement_pay_type: item.placement_pay_type ? (item.placement_pay_type === 1 ? 'Salary' : 'Hourly') : '',
                work_location_type: item.work_location_type === 1 ? 'Remote' : 'On Site'
            };
            return listingObject;
        });
        /* Using Map to iterate the loop and prepare the response */

        /* Using promise to wait till the address map completes. */
        responseData = await Promise.all(listingData);
        /* Using promise to wait till the address map completes. */

        return { status: true, data: responseData, pagination_data: pagination_details };
    } else {
        return placement;
    }
};

/**
 * Function to retrieve placement listings based on the provided conditions.
 * 
 * Logic:
 * - Construct a SQL query string using the provided conditions for placement listing.
 * - Execute the constructed query using 'indexRepository.rawQuery'.
 * - If placement listings are retrieved successfully, format the response.
 * - Extract and delete the 'total_placement_count' property from each placement object.
 * - Calculate pagination details.
 * - Return an object containing the formatted placement listings along with pagination details.
 * - If an error occurs during the process, return the error response.
 * 
 * @param {Object} condition - The conditions for filtering placement listings.
 * @param {string} dateFormat - The date format for formatting date values.
 * @param {number} page - The current page number for pagination.
 * @param {number} limit - The number of placements per page for pagination.
 * @returns {Object} Object containing placement listings and pagination details.
 */
const listing = async (condition, dateFormat, page, limit) => {

    let query = `SELECT * FROM getPlacementListing(`;
    query += (condition.employee_id !== null) ? `'${condition.employee_id}',` : `${condition.employee_id},`;
    query += (condition.client_id !== null) ? `'${condition.client_id}',` : `${condition.client_id},`;
    query += (condition.reference_id !== null) ? `'${condition.reference_id}',` : `${condition.reference_id},`;
    query += (condition.client_name !== null) ? `'${condition.client_name}',` : `${condition.client_name},`;
    query += (condition.employee_name !== null) ? `'${condition.employee_name}',` : `${condition.employee_name},`;
    query += (condition.status_type !== null) ? `'${condition.status_type}',` : `${condition.status_type},`;
    query += (condition.search !== null) ? `'${condition.search}',` : `${condition.search},`;
    query += (condition.from_date && condition.to_date) ? `'${condition.from_date}', '${condition.to_date}',` : `${condition.from_date}, ${condition.to_date},`;
    query += `'${dateFormat}', ${limit}, ${page})`;

    // Get employees Lisitng using stored
    const placementListing = await indexRepository.rawQuery(query);

    if (placementListing) {
        const total_placement_count = placementListing[0]?.total_placement_count;
        placementListing.map(async (placement) => {
            placement.profile_picture_url = (placement?.profile_picture_url) ? placement?.profile_picture_url : await generateEmployeeAvatar(placement);
            delete placement.total_placement_count;
        });

        pagination_details = {
            total: parseInt(total_placement_count),
            currentPage: page,
            perPage: limit,
            totalPages: Math.ceil(total_placement_count / limit)
        }

        return {
            status: true,
            data: placementListing,
            pagination_data: pagination_details
        }
    } else {
        return placementListing;
    }
}

/**
 * Update function to modify placement details based on the provided body.
 * 
 * Logic:
 * - Fetch existing placement data before the update for activity tracking.
 * - Initialize a database transaction.
 * - Determine the pay type configuration based on the provided body and update or create as needed.
 * - Update placement details with the new information.
 * - Fetch existing placement company contacts for further comparison.
 * - Update client contacts based on the priority and changes in contact information.
 * - Update end-client contacts based on the priority and changes in contact information.
 * - Update or create placement documents based on the provided document information.
 * - Commit the transaction.
 * - Fetch placement data after the update for activity tracking.
 * - Emit an event for placement update activity tracking.
 * - Return the updated placement data.
 * - If an error occurs during the process, handle errors and rollback the transaction, then return an error response.
 * 
 * @param {Object} body - The request body containing updated placement details.
 * @returns {Object} Repository response.
 */
const update = async (body) => {
    let trx;
    try {
        const placement_id = body.id;
        const condition = { 'id': placement_id }
        var isPlacementDocument = false;

        /** Fetching Placement details data before update */
        const beforeData = await getPlacementData(condition, isPlacementDocument);
        /** Fetching Placement details data before update */

        // Initialize a database transaction
        const db = await getConnection();
        trx = await db.transaction();
        let pay_type_configuration;

        /**
         * Updates the payroll configuration based on the given placement object.
         * @param {object} placement - The placement object containing the payroll configuration details.
         * @returns None
         */
        /**
         * Checks if the existing payroll configuration type is 1 or null, and if the payroll configuration type is 2.
         * @param {number} existing_payroll_config_type - The existing payroll configuration type.
         * @param {number} payroll_configuration_type - The payroll configuration type.
         * @returns {boolean} True if the conditions are met, false otherwise.
         */
        if (body.existing_payroll_configuration_type == 1 && body.payroll_configuration_type == 2) { // existing global and new is custom

            const newPayTypeConfig = {
                employee_id: body?.employee_id,
                pay_type: body?.pay_type,
                pay_value: (body?.pay_type == 1) ? body?.pay_value : null,
                payroll_pay: (body?.pay_type == 1) ? body?.payroll_pay : null,
            }

            pay_type_configuration = await transactionRepository.store(trx, 'pay_type_configuration', newPayTypeConfig);
            var payTypeConfigurationId = pay_type_configuration?.data[0]?.id
            // If Pay type is hourly add Pay rate configurations
            if (body?.pay_type == 2) {
                let newpayRate = body.pay_rate_configurations;
                newpayRate.forEach(object => {
                    // Parse and handle empty strings for each property
                    object.from_hour = object.from_hour ? parseInt(object.from_hour) : null;
                    object.to_hour = object.to_hour != '' ? parseInt(object.to_hour) : null;
                    object.rate = object.rate ? parseInt(object.rate) : null;
                    object.pay_in = object.pay_in ? parseInt(object.pay_in) : null;
                    object.pay_type_configuration_id = pay_type_configuration?.data[0]?.id;
                });
                await transactionRepository.store(trx, 'pay_rate_configuration', newpayRate);
            }
        } else if (body.existing_payroll_configuration_type == 2 && body.payroll_configuration_type == 1) { // existing custom and new is global

            await transactionRepository.destroy(trx, 'pay_type_configuration', { id: body.existing_pay_type_configuration_id });
            await transactionRepository.destroy(trx, 'pay_rate_configuration', { pay_type_configuration_id: body.existing_pay_type_configuration_id });

            pay_type_configuration = await indexRepository.find('pay_type_configuration', ['id'], { employee_id: body.employee_id, is_global: true });
            var payTypeConfigurationId = pay_type_configuration?.data[0]?.id
        } else if (body.existing_payroll_configuration_type == 2 && body.payroll_configuration_type == 2) { // existing custom and new is custom

            if (body.pay_type == 2) { // hourly
                let newpayRate = body.pay_rate_configurations;
                newpayRate.forEach(async (object) => {
                    object.to_hour = (object.to_hour != '' && object.to_hour != undefined) ? object.to_hour : null;
                    object.pay_type_configuration_id = body.existing_pay_type_configuration_id;
                    if (object.id) {
                        await transactionRepository.update(trx, 'pay_rate_configuration', { id: object.id }, object);
                    } else {
                        await transactionRepository.store(trx, 'pay_rate_configuration', object);
                    }
                });
            } else { // if salary delete houlry data
                await transactionRepository.destroy(trx, 'pay_rate_configuration', { pay_type_configuration_id: body.existing_pay_type_configuration_id });
            }

            const newPayTypeConfig = {
                pay_type: body?.pay_type,
                pay_value: (body?.pay_type == 1) ? body?.pay_value : null,
                payroll_pay: (body?.pay_type == 1) ? body?.payroll_pay : null,
            }

            pay_type_configuration = await transactionRepository.update(trx, 'pay_type_configuration', { id: body.existing_pay_type_configuration_id }, newPayTypeConfig);
            var payTypeConfigurationId = body.existing_pay_type_configuration_id
        }

        //Deleting the payrate information
        if (Array.isArray(body.deleted_pay_rate_id)) {
            if (body.deleted_pay_rate_id.length > 0) {
                for (const key in body.deleted_pay_rate_id) {
                    if (body.deleted_pay_rate_id[key] != '' && body.deleted_pay_rate_id[key] != null && body.deleted_pay_rate_id[key] != undefined) {
                        await transactionRepository.destroy(trx, 'pay_rate_configuration', { id: body.deleted_pay_rate_id[key] })
                    }
                }
            }
        }

        // Create an object 'updatePlacement' to update client details for a placement.
        UpdatePlacementDetails = {
            client_id: body.client_id,
            employee_id: body.employee_id,
            end_client_id: body.end_client_id ? body.end_client_id : null,
            project_name: body.project_name ? body.project_name : null,
            job_title_id: body?.job_title_id,
            work_email_id: body.work_email_id ? body.work_email_id : null,
            placed_employee_id: body?.placed_employee_id,
            notice_period: body.notice_period ? body.notice_period : null,
            start_date: body?.start_date,
            end_date: body.end_date ? body.end_date : null,
            payroll_configuration_type: body?.payroll_configuration_type,
            pay_type_configuration_id: payTypeConfigurationId,
            work_location_type: body?.work_location_type ? body?.work_location_type : null,
            work_location_address_line_one: body?.work_location_address_line_one ? body?.work_location_address_line_one : null,
            work_location_address_line_two: body?.work_location_address_line_two ? body?.work_location_address_line_two : null,
            work_location_city: body?.work_location_city ? body?.work_location_city : null,
            work_location_state_id: body?.work_location_state_id ? body?.work_location_state_id : null,
            work_location_country_id: body?.work_location_country_id ? body?.work_location_country_id : null,
            work_location_zipcode: body?.work_location_zipcode ? body?.work_location_zipcode : null,
            updated_at: new Date()
        };

        const placementData = await transactionRepository.update(trx, 'placements', { id: placement_id }, UpdatePlacementDetails);

        // get the existing placement company contacts
        let companyContacts = await indexRepository.find('placement_companies_contacts', ['id', 'companies_contact_id', 'referrable_type', 'priority'], { placement_id: placement_id });
        let existing_client_contact_one_id
        let existing_client_contact_two_id
        let existing_end_client_contact_one_id
        let existing_end_client_contact_two_id
        companyContacts = companyContacts.data;
        companyContacts.map(contact => {
            if (contact.referrable_type == CLIENT) {
                if (contact.priority == 1) {
                    existing_client_contact_one_id = contact.companies_contact_id;
                } else if (contact.priority == 2) {
                    existing_client_contact_two_id = contact.companies_contact_id;
                }
            }

            if (contact.referrable_type == END_CLIENT) {
                if (contact.priority == 1) {
                    existing_end_client_contact_one_id = contact.companies_contact_id;
                } else if (contact.priority == 2) {
                    existing_end_client_contact_two_id = contact.companies_contact_id;
                }
            }
        });

        // Update first client contact information
        if (existing_client_contact_one_id != body.client_contact_one_id) {
            const contactOneCondition = { placement_id: placement_id, priority: 1, referrable_type: CLIENT }
            const placementClientContactOne = {
                companies_contact_id: body.client_contact_one_id,
                updated_at: new Date()
            }
            await transactionRepository.update(trx, 'placement_companies_contacts', contactOneCondition, placementClientContactOne);
        }

        // Update second client contact information
        if (body.client_contact_two_id != '' && body.client_contact_two_id != null) {
            if (existing_client_contact_two_id != body.client_contact_two_id) {
                const contactTwoCondition = { placement_id: placement_id, priority: 2, referrable_type: CLIENT }
                const placementClientContactTwo = {
                    companies_contact_id: body.client_contact_two_id,
                    updated_at: new Date()
                }
                await transactionRepository.update(trx, 'placement_companies_contacts', contactTwoCondition, placementClientContactTwo);
            }
        }

        // Update first end-client contact information
        if (body.end_client_contact_one_id != '' && body.end_client_contact_one_id != null) {
            if (existing_end_client_contact_one_id != body.end_client_contact_one_id) {
                if (existing_end_client_contact_one_id != undefined || existing_end_client_contact_one_id != null) {
                    const endClientcontactOneCondition = { placement_id: placement_id, priority: 1, referrable_type: END_CLIENT }
                    const placementEndClientContactOne = {
                        companies_contact_id: body.end_client_contact_one_id,
                        updated_at: new Date()
                    }
                    await transactionRepository.update(trx, 'placement_companies_contacts', endClientcontactOneCondition, placementEndClientContactOne);
                } else {
                    const placementEndClientContactTwo = {
                        placement_id: placement_id,
                        referrable_type: END_CLIENT,
                        companies_contact_id: body.end_client_contact_one_id,
                        priority: 1,
                        created_at: new Date(),
                        created_by: body.created_by
                    }
                    await transactionRepository.store(trx, 'placement_companies_contacts', placementEndClientContactTwo)
                }
            }
        }
        // Update second end-client contact information
        if (body.end_client_contact_two_id != '' && body.end_client_contact_two_id != null) {
            if (existing_end_client_contact_two_id != body.end_client_contact_two_id) {
                if (existing_end_client_contact_two_id != undefined || existing_end_client_contact_two_id != null) {
                    const endClientcontactTwoCondition = { placement_id: placement_id, priority: 2, referrable_type: END_CLIENT }
                    const placementEndClientContactTwo = {
                        companies_contact_id: body.end_client_contact_two_id,
                        updated_at: new Date(),
                        updated_by: body.updated_by
                    }
                    await transactionRepository.update(trx, 'placement_companies_contacts', endClientcontactTwoCondition, placementEndClientContactTwo);
                } else {
                    const placementEndClientContactTwo = {
                        placement_id: placement_id,
                        referrable_type: END_CLIENT,
                        companies_contact_id: body.end_client_contact_two_id,
                        priority: 2,
                        created_at: new Date(),
                        created_by: body.created_by
                    }
                    await transactionRepository.store(trx, 'placement_companies_contacts', placementEndClientContactTwo)
                }
            }
        }

        // create placementDocumentsUpdate Object and update placement docuemnts for a placement
        var documents = body.documents;
        const destFolder = `${body.loginSubDomainName}/Client/${body.client_reference_id}/Placements/${body.placement_reference_id}/Documents`;
        for (const key in documents) {

            if (documents[key].new_document_id != null && documents[key].new_document_id != '') { // Check if a new document ID exists and is not null.

                if (documents[key].id != null && documents[key].id != '' && documents[key].id) { // Check if an existing document ID exists.
                    // Store the document in the specified folder and update the document mapping.
                    await commonDocumentStore(trx, 'placement_documents', destFolder, documents[key].new_document_id, documents[key].id, documents[key].document_name)
                    isPlacementDocument = true // Set the document update flag to true.
                } else {
                    var documentObject = {
                        placement_id: placement_id,
                        document_type_id: documents[key]?.document_type_id,
                        created_by: body.created_by,
                        created_at: new Date()
                    }

                    // Store the new document in the mapping table.
                    var documentData = await transactionRepository.store(trx, 'placement_documents', documentObject)
                    // Store the document in the specified folder and update the document mapping.
                    await commonDocumentStore(trx, 'placement_documents', destFolder, documents[key].new_document_id, documentData.data[0].id, documentData.data[0].document_name)
                    isPlacementDocument = true
                }
            }
        }

        // Commit the transaction
        await trx.commit();

        var subStatusCondition = {
            employee_id : body.employee_id,
            end_date : body?.end_date,
        }

        let dateFormat = await format.getDateFormat();
        const today = moment(new Date(), dateFormat).format('YYYY/MM/DD');
        if(body?.end_date && body?.end_date < today ) {
            subStatusEvents.emit('employeeSubStatus', subStatusCondition)
        }

        /**Activity track */
        /* Fetching placement data after update for activity track */
        const afterData = await getPlacementData(condition, isPlacementDocument);
        /**Activity track */
        activity = {
            placement_id: condition.id,
            referrable_type: 1,
            referrable_type_id: null,
            action_type: 2,
            created_by: body.created_by,
        };
        events.emit('placementClientUpdateActivity', { activity, beforeData, afterData });
        /**Activity track */

        return placementData;

    } catch (error) {
        // Handle errors and rollback the transaction in case of an exception
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

/**
 * Function to retrieve placement and billing information for a given placement ID.
 * 
 * Logic:
 * - Construct a query to call the stored function 'getPlacementIndexInformation' with the provided placement ID and date format.
 * - Execute the query using 'indexRepository.rawQuery' to get placement information.
 * - If placement information is obtained, fetch billing details for the placement from 'placement_billing_details'.
 * - Map and format the billing details into a new array.
 * - Format and set the 'effective_from' and 'effective_to' dates using moment.js.
 * - If billing details are fetched, set them in the placementIndex object.
 * - If there is a profile picture URL, use it; otherwise, generate an avatar using 'generateEmployeeAvatar'.
 * - Return the final data object containing placement and billing details.
 * 
 * @param {Object} condition - The condition object containing the placement ID.
 * @param {string} dateFormat - The date format to be used in formatting date fields.
 * @returns {Object} Object containing placement and billing details.
 */
const index = async (condition, dateFormat) => {

    let query = `SELECT * FROM getPlacementIndexInformation(`;
    query += (condition.placement_id != null) ? `'${condition.placement_id}',` : `${condition.placement_id},`;
    query += `'${dateFormat}')`;

    // Get employees Lisitng using stored
    var placementIndex = await indexRepository.rawQuery(query);

    if (placementIndex) {

        const max_invoice_date = await placementBillingServices.getPlacementBillingAllowFromDate(condition.placement_id)
        if (max_invoice_date.status) {
            var date = moment(max_invoice_date.data[0].max_date).format(dateFormat)
        } else {
            var date = placementIndex[0].data.data[0].client_details.start_date
        }

        // Get Placement Bill Details
        const bills = await getPlacementBillDetails(condition.placement_id, dateFormat);

        // Get Placement Pay Rate
        const current_pay_rate = await getPlacementPayRate(condition.placement_id, bills.current_bill_rate);

        placementIndex = placementIndex[0].data?.data?.[0];
        placementIndex.profile_picture_url = (placementIndex?.profile_picture_url) ? placementIndex?.profile_picture_url : await generateEmployeeAvatar(placementIndex);
        placementIndex.client_details.deleted_pay_rate_id = [];
        placementIndex.current_pay_rate = current_pay_rate;
        placementIndex.billing_details = bills?.all_bill_details;
        placementIndex.current_bill_rate = (bills?.current_bill_rate) ? bills?.current_bill_rate : 0;
        placementIndex.max_invoice_date = date;


        return {
            status: true,
            data: [placementIndex],
        }
    } else {
        return placementIndex[0].data;
    }

};

/**
 * @param {Object} condition - The condition to filter Employee Vacation data.
 * @returns {Object} Structured vacation details.
 */
const getPlacementData = async (condition, isPlacementDocument) => {

    let dateFormat = await format.getDateFormat(); // date format

    var placement = await placementRepository.index(condition); // Placement and its related information
    var placementData = placement.data[0]

    if (placementData.pay_type_configuration_id != '' && placementData.pay_type_configuration_id != null) {
        var payRateConfigurationData = await indexRepository.find('pay_rate_configuration', ['*'], { 'pay_type_configuration_id': placementData.pay_type_configuration_id }, null, [], null, 'id', 'desc', false)
    }

    const placementObject = {
        'End Client': placementData.endclient_name ? placementData.endclient_name : '-',
        'Client Contact 1': placementData.client_contact_one_name,
        'Client Contact 2': placementData.client_contact_two_name ? placementData.client_contact_two_name : '-',
        'End Client Contact 1': placementData.endclient_contact_one_name ? placementData.endclient_contact_one_name : '-',
        'End Client Contact 2': placementData.endclient_contact_two_name ? placementData.endclient_contact_two_name : '-',
        'Pay Type Configuration': placementData.payroll_configuration_type === 1 ? 'Global' : 'Configure',
        'Project Name': placementData.project_name,
        'Job Title': placementData.job_title,
        'Work Email ID': placementData.work_email_id,
        'Pay Value': placementData.pay_value,
        'Pay In': payRateConfigurationData?.data[0]?.pay_in == 1 ? 'Percentage' : 'Value',
        'From Hour': payRateConfigurationData?.data[0]?.from_hour ? payRateConfigurationData?.data[0]?.from_hour : '-',
        'To Hour': payRateConfigurationData?.data[0]?.to_hour ? payRateConfigurationData?.data[0]?.to_hour : '-',
        'Value': payRateConfigurationData?.data[0]?.rate ? payRateConfigurationData?.data[0]?.rate : '-',
        'Payroll Pay': placementData.payroll_pay,
        'Placed By': placementData.placed_employee_id,
        'Notice Period': placementData.notice_period,
        'Project Start Date': moment(placementData.project_start_date).format(dateFormat),
        'Project End Date': moment(placementData.project_end_date).format(dateFormat),
        'Placement Document': isPlacementDocument,
        'Work Location Type': placementData.work_location_type == 1 ? "Remote" : "On Site",
        'Work Location Address-1': placementData.work_location_address_line_one ? placementData.work_location_address_line_one : '-',
        'Work Location Address-2': placementData.work_location_address_line_two ? placementData.work_location_address_line_two : '-',
        'Work Location City': placementData.work_location_city ? placementData.work_location_city : '-',
        'Work Location State': placementData.state_name ? placementData.state_name : '-',
        'Work Location Country': placementData.country_name ? placementData.country_name : '-',
        'Work LocationZip Code': placementData.work_location_zipcode ? placementData.work_location_zipcode : '-',

    }

    return placementObject

}

/**
 * Function to calculate and determine the employee pay based on placement and employee data.
 * 
 * Logic:
 * - Fetch placement information using 'indexRepository.find' for the provided placement ID.
 * - Fetch employee information using 'indexRepository.find' for the provided employee ID.
 * - Determine the pay configuration condition based on the provided payroll data.
 * - If the pay type configuration ID exists in the payroll data, set the condition to { id: payrollDataData.data[0].pay_type_configuration_id }.
 * - If the pay type configuration ID does not exist, set the condition to { employee_id: body.employee_id, is_global: true }.
 * - Fetch pay type configuration data using 'indexRepository.find' with the determined condition.
 * - Set the condition for pay rate configuration based on the fetched pay type configuration ID.
 * - Fetch pay rate configuration data using 'indexRepository.find' with the determined condition.
 * - Determine the pay type and calculate the pay value based on the given data.
 * - Return an object containing the calculated employee pay details.
 * 
 * @param {Object} body - The request body containing placement and employee data.
 * @returns {Object} Object containing employee pay details.
 */
const employeePay = async (body) => {

    let placementCondition = { id: body.placement_id };
    var payrollDataData = await indexRepository.find('placements', ['id', 'pay_type_configuration_id', 'payroll_configuration_type'], placementCondition); // Fetch the placement information

    var employeeData = await indexRepository.find('employee', ['id', 'hours_worked', 'payroll_config_settings_id'], { id: body.employee_id }); // Fetch the employee information

    /**
     * Determines the pay configuration condition based on the provided payroll data.
     * If the pay type configuration ID exists in the payroll data, the condition will be
     * { id: payrollDataData.data[0].pay_type_configuration_id }. Otherwise, the condition
     * will be { employee_id: body.employee_id, is_global: true }.
     */
    let payConfigCondition;
    let totalHoursWorked;
    if (payrollDataData.data[0].pay_type_configuration_id) {
        payConfigCondition = { id: payrollDataData.data[0].pay_type_configuration_id };
        totalHoursWorked = await payrollService.getSinglePlacementTotalHours(body.placement_id);
    } else {
        payConfigCondition = { employee_id: body.employee_id, is_global: true };
        totalHoursWorked = employeeData.data[0].hours_worked ? employeeData.data[0].hours_worked : 0;
    }

    var payTypeData = await indexRepository.find('pay_type_configuration', ['id', 'pay_value', 'pay_type'], payConfigCondition); // Fetch pay cycle configuration

    let condition1 = { pay_type_configuration_id: payTypeData.data[0].id }
    var payRateData = await indexRepository.find('pay_rate_configuration', ['id', 'from_hour', 'to_hour', 'pay_in', 'rate as value'], condition1, 0, [], null, 'id', 'asc', false); // Fetch pay rate cycle information

    var payRates = payRateData.data

    /**
     * Determines the pay type and calculates the pay value based on the given data.
     * @param {Object} payTypeData - The data object containing the pay type information.
     * @param {Object} employeeData - The data object containing the employee information.
     * @param {Array} payRates - The array of pay rate configurations.
     * @param {number} body.bill_rate - The bill rate for the employee.
     * @returns None
     */
    if (payTypeData.data[0].pay_type === 1) {

        var employeePay = 0;
        if (employeeData.data[0].payroll_config_settings_id != null && employeeData.data[0].payroll_config_settings_id != '') {
            var payConfiguration = await indexRepository.find('payroll_config_settings', ['payroll_cycle_id'], { id: employeeData.data[0].payroll_config_settings_id }, null, [], null, null, null, false); // Fetch the Configuration information

            var lastPayConfiguration = payConfiguration.data[0];
            var pay = Number(payTypeData.data[0].pay_value);

            if (lastPayConfiguration.payroll_cycle_id == 1) { // Weekly pay
                employeePay = Number((pay / 52).toFixed(2));
            } else if (lastPayConfiguration.payroll_cycle_id == 2) { // Bi Week pay
                employeePay = Number((pay / 26).toFixed(2));
            } else if (lastPayConfiguration.payroll_cycle_id == 3) { // Semi Monthly Pay
                employeePay = Number((pay / 24).toFixed(2));
            } else if (lastPayConfiguration.payroll_cycle_id == 4) { // Monthly Pay
                employeePay = Number((pay / 12).toFixed(2));
            }
        }
        pay = employeePay > 0 ? employeePay : payTypeData.data[0].pay_value
        Type = "Salary"
        info = "The Employee pay comes under the salary per anum"
    } else {
        let iterationCount = 0;
        payRates.forEach(payRate => {

            rate = payRate.value;
            hours = [payRate.from_hour, payRate.to_hour]
            if (payRate.to_hour == null) {
                hours[1] = Infinity
            }

            if (totalHoursWorked > hours[0] && totalHoursWorked < hours[1]) {

                rateHours = totalHoursWorked;
            } else {
                rateHours = 0
            }

            if ((rateHours == 0 && iterationCount == 0) || (rateHours > 0)) {
                if (payRate.pay_in == 1) {
                    pay = ((rate * body.bill_rate) / 100)
                } else {
                    pay = rate
                }
            }
            iterationCount += 1;
        });
        Type = "hourly"
        info = "The Employee pay comes under the hourly but varies by his/her hourly pay configuration"
    }

    var empObject = {
        employee_id: body.employee_id,
        type: Type,
        value: parseFloat(pay).toFixed(2),
        info: info
    }
    return empObject
};

/**
 * Calculates the pay rate for a placement based on various configurations and conditions.
 *
 * @param {string} placementId - The ID of the placement for which the pay rate is calculated.
 * @param {number} current_bill_rate - The current billing rate associated with the placement.
 * @returns {number} The calculated pay rate for the placement.
 *
 * Logic:
 * - The function retrieves placement details including payroll configuration, pay type configuration, and relevant hourly rate configurations.
 * - Depending on the payroll configuration type:
 *    + For DEFAULT configuration, it fetches total hours worked from the employee table.
 *    + For CONFIGURE configuration, it uses the 'payrollService.getSinglePlacementTotalHours' method to get total hours.
 * - It then determines the pay type configuration and checks if it's an hourly pay type.
 * - If hourly:
 *    + Calculates the pay rate based on the total hours worked, hourly rate configuration, and percentage rate (if applicable).
 *    + If total hours worked is zero, it calculates the new values.
 * - If not hourly:
 *    + Calculates the pay rate based on the pay value, payroll cycle, and predefined calculations.
 * - The final pay rate is rounded to two decimal places and returned.
 *
 * Note: The function handles various scenarios including hourly and fixed pay configurations.
 */
const getPlacementPayRate = async (placementId, current_bill_rate) => {

    let totalAmount = 0;
    let total_hours;
    let pay_type_configuration_condition;

    // Get Placement Details
    let placement = await indexRepository.find('placements', ['employee_id', 'payroll_configuration_type', 'pay_type_configuration_id'], { id: placementId });
    placement = placement.data[0];

    if (placement.payroll_configuration_type == 1) {
        // DEFAULT
        pay_type_configuration_condition = { employee_id: placement.employee_id };

        // get total_hours_worked from employee table
        let employee = await indexRepository.find('employee', ['hours_worked'], { id: placement.employee_id });
        employee = employee.data[0];
        total_hours = employee?.total_hours;
    } else if (placement.payroll_configuration_type == 2) {

        // CONFIGURE
        pay_type_configuration_condition = { id: placement.pay_type_configuration_id };
        total_hours = await payrollService.getSinglePlacementTotalHours(placementId);
    }
    let pay_type_configuration = await indexRepository.find('pay_type_configuration', ['*'], pay_type_configuration_condition);
    pay_type_configuration = pay_type_configuration?.data[0];

    // Get Pay rate configuration if pay_type_configuration.pay_type is 2
    if (pay_type_configuration?.pay_type == 2) {

        pay_rate_configuration = await indexRepository.find('pay_rate_configuration', ['id', 'pay_in', 'from_hour', 'to_hour', 'rate'], { pay_type_configuration_id: pay_type_configuration.id });
        pay_rate_configuration = pay_rate_configuration?.data;

        // If Pay rate configuration is hourly - Calculate hours that fall in the specific cycle
        if (total_hours > 0) { // for caluclating previously worked
            if (pay_rate_configuration[0]?.pay_in == 2) { // for value 
                for (let i = 0; i < pay_rate_configuration.length; i++) {
                    const rateObj = pay_rate_configuration[i];

                    // Check if the given hour falls within the range of the current rate object
                    if (total_hours >= rateObj.from_hour && (total_hours < rateObj.to_hour || rateObj.to_hour === null)) {
                        totalAmount = rateObj.rate; // Return the rate if the hour falls within the range
                    }
                }
            } else { // for percentage

                var percentageRate

                for (let i = 0; i < pay_rate_configuration.length; i++) {
                    const rateObj = pay_rate_configuration[i];

                    // Check if the given hour falls within the range of the current rate object
                    if (total_hours >= rateObj.from_hour && (total_hours < rateObj.to_hour || rateObj.to_hour === null)) {
                        percentageRate = rateObj.rate; // Return the rate if the hour falls within the range
                    }
                }
                if (current_bill_rate > 0) { // for percentage
                    totalAmount = Number((percentageRate * current_bill_rate) / 100)
                } else {
                    totalAmount = 0
                }
            }
        } else { // for caluclating the new values
            if (pay_rate_configuration[0]?.pay_in == 2) { // for value
                totalAmount = pay_rate_configuration[0].rate
            } else {
                if (current_bill_rate > 0) { // for percentage
                    totalAmount = Number((pay_rate_configuration[0]?.rate * current_bill_rate) / 100)
                } else {
                    totalAmount = 0
                }
            }

        }
    } else {

        var employeeData = await indexRepository.find('employee', ['payroll_config_settings_id'], { id: placement.employee_id })
        if (employeeData.data[0]?.payroll_config_settings_id != null && employeeData.data[0]?.payroll_config_settings_id != '') {
            var payConfiguration = await indexRepository.find('payroll_config_settings', ['payroll_cycle_id'], { id: employeeData.data[0].payroll_config_settings_id }, null, [], null, null, null, false); // Fetch the Configuration information

            var lastPayConfiguration = payConfiguration.data[0];
            var pay = Number(pay_type_configuration?.pay_value);

            if (lastPayConfiguration.payroll_cycle_id == 1) { // Weekly pay
                totalAmount = Number((pay / 52).toFixed(2));
            } else if (lastPayConfiguration.payroll_cycle_id == 2) { // Bi Week pay
                totalAmount = Number((pay / 26).toFixed(2));
            } else if (lastPayConfiguration.payroll_cycle_id == 3) { // Semi Monthly Pay
                totalAmount = Number((pay / 24).toFixed(2));
            } else if (lastPayConfiguration.payroll_cycle_id == 4) { // Monthly Pay
                totalAmount = Number((pay / 12).toFixed(2));
            }
        }
    }

    totalAmount = (totalAmount) ? parseFloat(totalAmount).toFixed(2) : 20;
    return totalAmount;
}

/**
 * Get Placement Bill Details Function to get the bill details of the placment includes current bill rate and all billDetails with current one at top of array.
 */
const getPlacementBillDetails = async (placementId, dateFormat) => {
    let billing_details = [];
    let current_bill_rate = 0;
    // fetching billing details
    var placementBilling = await indexRepository.find('placement_billing_details', ['*'], { placement_id: placementId }, null, [], null, 'id', 'desc');

    if (placementBilling.status) {
        billing = placementBilling.data
        for (let key in billing) {
            billingobject = {
                id: billing[key].id,
                placement_id: billing[key].placement_id,
                bill_type: billing[key].bill_type ? billing[key].bill_type : '',
                bill_rate: billing[key].bill_rate ? billing[key].bill_rate : '',
                ot_bill_rate: billing[key].ot_bill_rate ? billing[key].ot_bill_rate : '',
                ot_pay_rate_multiplier: billing[key].ot_pay_rate_multiplier ? billing[key].ot_pay_rate_multiplier : '',
                ot_pay_rate: billing[key].ot_pay_rate ? billing[key].ot_pay_rate : '',
                effective_from: moment(billing[key].effective_from).format(dateFormat) ? moment(billing[key].effective_from).format(dateFormat) : '',
                effective_to: moment(billing[key].effective_to).format(dateFormat) ? moment(billing[key].effective_to).format(dateFormat) : '',
                bill_rate_discount: billing[key].bill_rate_discount ? billing[key].bill_rate_discount : '',
                bill_rate_discount_type: billing[key].bill_rate_discount_type ? billing[key].bill_rate_discount_type : '',
                ot_pay_rate_config_type: billing[key].ot_pay_rate_config_type ? billing[key].ot_pay_rate_config_type : '',
                created_at: moment(billing[key].created_at).format(dateFormat) ? moment(billing[key].created_at).format(dateFormat) : ''
            }
            billing_details.push(billingobject)
        }
    }

    if (billing_details && billing_details.length > 0) {
        // Calculate Current Bill Rate - Fetch Bill rate where current date should be between effective from and effective to
        // Get the current date
        let currentDate = new Date();

        // Move objects with 'Invalid date' for effective_to to the end of the array
        billing_details.sort((a, b) => {
            if (a.effective_to === 'Invalid date' && b.effective_to !== 'Invalid date') {
                return 1; // Move 'Invalid date' to end
            } else if (a.effective_to !== 'Invalid date' && b.effective_to === 'Invalid date') {
                return -1; // Keep 'Invalid date' at the beginning
            } else {
                return 0; // Preserve order if both are 'Invalid date' or both are not
            }
        });

        // Filter the array based on current date being within the effective date range
        let filteredObject = billing_details.find(obj => {

            // Parse effective_from and effective_to strings into Date objects
            let effectiveFrom = new Date(obj.effective_from);
            let effectiveTo = new Date(obj.effective_to);

            // Check if current date is equal to or falls within the effective date range
            return currentDate >= effectiveFrom && (currentDate <= effectiveTo || isNaN(effectiveTo) || 'Invalid Date');
        });

        if (filteredObject) {
            current_bill_rate = filteredObject.bill_rate;

            // Find the index of the filtered object
            let index = billing_details.findIndex(obj => obj === filteredObject);
            // Remove the filtered object from its current position
            if (index !== -1) {
                billing_details.splice(index, 1);
            }
            // Insert the filtered object at the beginning of the array
            billing_details.unshift(filteredObject);
        }
    }

    return {
        all_bill_details: billing_details,
        current_bill_rate: current_bill_rate
    };
}

module.exports = { store, update, listing, index, employeePay, getPlacementBillDetails, getPlacementPayRate }
