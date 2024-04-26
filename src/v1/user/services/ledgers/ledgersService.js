const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');
const indexRepository = require('../../repositories/index');
const commonDocumentStore = require('../../../../../helpers/commonDocumentStore');
const { events } = require('../../../../../events/ledgerActivityEvent');
const { eventss } = require('../../../../../events/notificationEvent');
const INVOICES = 'invoice';
const BILL = 'bill';
const format = require('../../../../../helpers/format');
const moment = require('moment');
const { calculateHours, generateEmployeeAvatar, decodeHtmlEntities } = require('../../../../../helpers/globalHelper');
const config = require('../../../../../config/app');
const  ledgerInformationData  = require('../../../../../helpers/ledgerInformationData');
// LEDGER STATUSES
const DRAFTED = 'Drafted';
const SUBMITTED = 'Submitted';
const APPROVAL_INPROGRESS = 'Approval In Progress';
const APPROVED = 'Approved';
const REJECTED = 'Rejected';
const placmentService = require('../placement/placementClientService');
const { mailEvents } = require('../../../../../events/mailTemplateEvent/ledgersMailEvent');


/**
 * Store function to create a new ledger for a company
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Generating the ledgers refernce id based on prefixes.
 * - Create an object `newledgers` for inserting ledgers data.
 * - Interate the `ledger_item_details`, create item_Details object and store in 'ledger_item_Details' table.
 * 
 * @param {Object} body - The request body containing the ledgers data.
 * @returns {Object} - An object containing the status and data of the stored ledgers.
 * @throws {Error} - If an error occurs while processing the ledgers.
 */
const store = async (body) => {
    let trx;
    try {

        // Databse connection
        const db = await getConnection();
        trx = await db.transaction();

        const count = await indexRepository.count('ledgers', { entity_type: body.entity_type });
        const prefixSlug = body.entity_type;

        // Generating the ledgers refernce id based on prefixes
        const prefix = await indexRepository.find('prefixes', ['prefix_name', 'separator', 'number'], { slug: prefixSlug });
        const prefixData = prefix.data[0];
        var reference_id = prefixData.prefix_name + prefixData.separator + (Number(count.data) + prefixData.number);

        // Creation Object for ledger creation
        const newledgers = {
            company_id: body.company_id,
            entity_type: body.entity_type,
            reference_id: reference_id,
            status: SUBMITTED, //submit
            submitted_on: new Date(),
            order_number: body.order_number,
            date: body.date,
            due_date: body.due_date,
            net_pay_terms_id: body.net_pay_terms_id,
            sub_total_amount: body.sub_total_amount,
            adjustment_amount: body.adjustment_amount ? body.adjustment_amount : null,
            discount_type: body.discount_type ? body.discount_type : null,
            discount_value: body.discount_value ? body.discount_value : null,
            discount_amount: body.discount_amount ? body.discount_amount : null,
            amount: body.total_amount,
            balance_amount: body.total_amount,
            customer_note: body.customer_note ? body.customer_note : null,
            terms_and_conditions: body.terms_and_conditions,
            approval_level: 1,
            tax_information: body.tax_information ? JSON.stringify(body.invoice_tax_information) : null,
            created_at: new Date(),
            created_by: body.created_by
        }
        var ledgerData = await transactionRepository.store(trx, 'ledgers', newledgers);

        // Store Ledger Item Details
        const ledgerItems = body.ledger_item_details;
        for (let item in ledgerItems) {
            item = ledgerItems[item];

            item.description = decodeHtmlEntities(item.description);
            var ledger_items_object = {
                ledger_id: ledgerData.data[0].id,
                employee_id: item.employee_id,
                placement_id: item.placement_id ? item.placement_id : null,
                description: (item.description) ? item.description : null,
                hours: item.hours,
                rate: item.rate,
                amount: item.amount,
                timesheet_hour_ids: (item.timesheets_available && body.entity_type == INVOICES) ? item.timesheet_hour_ids : null,
                timesheets_available: (body.entity_type == INVOICES) ? item.timesheets_available : null,
                created_by: body.created_by,
                created_at: new Date()
            }
            await transactionRepository.store(trx, 'ledger_item_details', ledger_items_object);

            // Update 'invoice_raised' flag to true for 'timesheetsheer_hour_ids' for entity_type INVOICES.
            if (body.entity_type == INVOICES) {
                await Promise.all(item.timesheet_hour_ids.map(async id => {
                    await transactionRepository.update(trx, 'timesheet_hours', { 'id': id }, { 'invoice_raised': true });
                }));
            }
        }

        // Update the ledger shipping addresses
        if (body.shipping_address) {
            let address = {
                ledger_id: ledgerData.data[0].id,
                address_type: 2,
                address_line_one: body.shipping_address ? body.shipping_address[0].address_line_one : null,
                address_line_two: body.shipping_address ? body.shipping_address[0].address_line_two : null,
                city: body.shipping_address ? body.shipping_address[0].city : null,
                zip_code: body.shipping_address ? body.shipping_address[0].zip_code : null,
                state_id: body.shipping_address ? body.shipping_address[0].state_id : null,
                country_id: body.shipping_address ? body.shipping_address[0].country_id : null,
            }
            await transactionRepository.store(trx, 'ledger_addresses', address);
        }

        // Update the ledger billing address
        if (body.billing_address) {
            let address = {
                ledger_id: ledgerData.data[0].id,
                address_type: 1,
                address_line_one: body.billing_address ? body.billing_address[0].address_line_one : null,
                address_line_two: body.billing_address ? body.billing_address[0].address_line_two : null,
                zip_code: body.billing_address ? body.billing_address[0].zip_code : null,
                city: body.billing_address ? body.billing_address[0].city : null,
                state_id: body.billing_address ? body.billing_address[0].state_id : null,
                country_id: body.billing_address ? body.billing_address[0].country_id : null,
            }
            await transactionRepository.store(trx, 'ledger_addresses', address);
        }

        // Store the document Information
        const destFolder = `${body.loginSubDomainName}/${body.company_entity_type}/${body.company_reference_id}/${body.entity_type}/${reference_id}`;
        var documents = body.documents;
        for (const key in documents) {
            if (documents[key].new_document_id !== '' && documents[key].new_document_id !== null) {
                var fileData = {
                    ledger_id: ledgerData.data[0].id,
                    created_by: body.created_by,
                    created_at: new Date()
                }
                const ledgerDocuments = await transactionRepository.store(trx, 'ledger_documents', fileData)
                await commonDocumentStore(trx, 'ledger_documents', destFolder, documents[key].new_document_id, ledgerDocuments.data[0].id)
            }
        }

        // Commit the transaction
        await trx.commit();


        if (body.entity_type == 'invoice') { // for storing notifications
            body.slug = 'new-invoice-notification'
            eventss.emit('notification', body);
        } else if (body.entity_type == 'bill') {
            body.slug = 'new-bills-notification'
            eventss.emit('notification', body);
        }

        var ledger_id = ledgerData.data[0].id

        // Emit an event to trigger sending a email
        mailEvents.emit('invoiceApprovalMail', body, ledger_id);

        // Store Ledger Activity track
        activity = {
            ledger_id: ledgerData.data[0]?.id,
            action_type: 1, // 1 for store
            created_by: body.created_by,
        };
        events.emit('ledgerActivity', { activity: activity });

        return { status: true, data: ledgerData.data }

    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

/**
 * Update function to edit a ledger for a company
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Generating the ledgers refernce id based on prefixes.
 * - Create an object `newledgers` for inserting ledgers data.
 * - Interate the `ledger_item_details`, create item_Details object and store in 'ledger_item_Details' table.
 * 
 * @param {Object} body - The request body containing the invoice data.
 * @returns {Object} - An object containing the status and data of the stored invoice.
 * @throws {Error} - If an error occurs while processing the invoice.
 */
const update = async (body) => {
    let trx;
    try {

        // Databse connection
        const db = await getConnection();
        trx = await db.transaction();

        // get ledger before data
        const query = await getLedgerDataQuery(body.id);
        let beforeUpdate = await indexRepository.rawQuery(query);
        beforeUpdate = beforeUpdate[0];

        // Object for ledger update
        const updateLedgers = {
            order_number: body.order_number,
            date: body.date,
            due_date: body.due_date,
            net_pay_terms_id: body.net_pay_terms_id,
            amount: body.total_amount,
            adjustment_amount: body.adjustment_amount,
            sub_total_amount: body.sub_total_amount,
            discount_type: body.discount_type ? body.discount_type : null,
            discount_value: body.discount_value ? body.discount_value : null,
            discount_amount: body.discount_amount ? body.discount_amount : null,
            balance_amount: body.total_amount,
            customer_note: body.customer_note ? body.customer_note : null,
            terms_and_conditions: body.terms_and_conditions,
            tax_information: body.tax_information ? JSON.stringify(body.invoice_tax_information) : null,
            updated_at: new Date()
        }

        const ledgerData = await transactionRepository.update(trx, 'ledgers', { id: body.id }, updateLedgers);

        // Update Ledger Item Details
        const ledgerItems = body.ledger_item_details;
        for (let item in ledgerItems) {
            item = ledgerItems[item];
            item.description = decodeHtmlEntities(item.description);
            if (item.id) {
                var ledger_items_update_object = {
                    description: (item.description) ? item.description : null,
                    hours: item.hours,
                    rate: item.rate,
                    amount: item.amount,
                    updated_at: new Date()
                }
                await transactionRepository.update(trx, 'ledger_item_details', { id: item.id }, ledger_items_update_object);
            } else {

                const ledger_items_store_object = {
                    ledger_id: ledgerData.data[0].id,
                    employee_id: item.employee_id,
                    placement_id: item.placement_id ? item.placement_id : null,
                    description: (item.description) ? item.description : null,
                    hours: item.hours,
                    rate: item.rate,
                    amount: item.amount,
                    timesheet_hour_ids: (item.timesheets_available && body.entity_type == INVOICES) ? item.timesheet_hour_ids : null,
                    timesheets_available: (body.entity_type == INVOICES) ? item.timesheets_available : null,
                    created_by: body.created_by,
                    created_at: new Date()
                }
                await transactionRepository.store(trx, 'ledger_item_details', ledger_items_store_object);
            }
        }

        // Update the document Information
        const destFolder = `${body.loginSubDomainName}/${body.company_entity_type}/${body.company_reference_id}/${body.entity_type}/${body.reference_id}`;
        var documents = body.documents
        for (const key in documents) {

            if (documents[key].new_document_id !== '' && documents[key].new_document_id !== null) {
                if (documents[key].id !== '' && documents[key].id !== null) {
                    // document update
                    var fileData = {
                        ledger_id: ledgerData.data[0].id,
                        updated_by: body.updated_by,
                        updated_at: new Date()
                    }
                    const ledgerDocuments = await transactionRepository.update(trx, 'ledger_documents', { id: documents[key].id }, fileData)
                    await commonDocumentStore(trx, 'ledger_documents', destFolder, documents[key].new_document_id, ledgerDocuments.data[0].id)
                } else {
                    // new document store
                    var fileData = {
                        ledger_id: ledgerData.data[0].id,
                        created_by: body.created_by,
                        created_at: new Date()
                    }
                    const ledgerDocuments = await transactionRepository.store(trx, 'ledger_documents', fileData)
                    await commonDocumentStore(trx, 'ledger_documents', destFolder, documents[key].new_document_id, ledgerDocuments.data[0].id)
                }

            }
        }

        // Update the ledger shipping addresses
        if (body.shipping_address) {
            const addressCondition = {
                ledger_id: body.id,
                address_type: 2
            }
            const shipping_address = body.shipping_address[0];
            const shipping_address_update_object = {
                address_line_one: shipping_address ? shipping_address.address_line_one : null,
                address_line_two: shipping_address ? shipping_address.address_line_two : null,
                city: shipping_address ? shipping_address.city : null,
                zip_code: shipping_address ? shipping_address.zip_code : null,
                state_id: shipping_address ? shipping_address.state_id : null,
                country_id: shipping_address ? shipping_address.country_id : null,
            }
            await transactionRepository.update(trx, 'ledger_addresses', addressCondition, shipping_address_update_object);
        }

        // Update the ledger billing address
        if (body.billing_address) {
            const addressCondition = {
                ledger_id: body.id,
                address_type: 1
            }
            const billing_address = body.billing_address[0];
            const billing_address_update_object = {
                address_line_one: billing_address ? billing_address.address_line_one : null,
                address_line_two: billing_address ? billing_address.address_line_two : null,
                city: billing_address ? billing_address.city : null,
                zip_code: billing_address ? billing_address.zip_code : null,
                state_id: billing_address ? billing_address.state_id : null,
                country_id: billing_address ? billing_address.country_id : null,
            }
            await transactionRepository.update(trx, 'ledger_addresses', addressCondition, billing_address_update_object);
        }

        // Commit the transaction
        await trx.commit();

        if (beforeUpdate?.status == 'Drafted') { // for storing notifications
            body.slug = 'invoice-approval-notification'
            eventss.emit('notification', body);
        }

        // update the 'amount' in ledger details
        const ledgersUpdate = await updateLedgersAmount(body.id);

        if (ledgersUpdate?.status) {
            // initiate ledger activity track
            activity = {
                ledger_id: body.id,
                action_type: 2, //2 for update
                created_by: body.created_by,
                beforeUpdate: beforeUpdate,
                query: query
            };
            events.emit('ledgerActivity', { activity });
        }

        return { status: true, data: ledgerData.data };

    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

/**
 * Destroy function to delete an existing Employee I-94 Details entry.
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Create an object 'updateData' to set the 'deleted_at', 'updated_at', and 'updated_by' properties for soft deletion.
 * - Call 'transactionRepository.destroy' to delete the leger_item_details.
 * - Make 'invoice_raised' to false for the time_sheet_hour_ids related to ledger_item_details. 
 * - Commit the transaction after successful deletion.
 * - Return the response from the database operation.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 * 
 * @param {Object} body - The request body containing the data for deletion.
 * @param {Object} condition - The condition to locate the entry to delete.
 * @returns {Object} Repository response.
 **/
const destroy = async (body) => {

    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction();

        if (body.id) {

            let ledgerId = await indexRepository.find('ledger_item_details', ['ledger_id'], { 'id': body.id });
            ledgerId = ledgerId.data[0]?.ledger_id;
            await transactionRepository.destroy(trx, 'ledger_item_details', { 'id': body.id });

            await Promise.all(body.timesheet_hour_ids.map(async id => {
                await transactionRepository.update(trx, 'timesheet_hours', { 'id': id }, { 'invoice_raised': false });
            }));

            // Commit the transaction
            await trx.commit();

            // update the 'amount' in ledger details
            const ledgersUpdate = await updateLedgersAmount(ledgerId);
            if (ledgersUpdate.status) {
                // initiate ledger activity track
                activity = {
                    ledger_id: ledgerId,
                    action_type: 3, //3 for delete
                    created_by: body.created_by,
                };
                events.emit('ledgerActivity', { activity });
            }
        }

        return { status: true };

    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

/**
 * Listing function to get ledgers data
 * Logic: 
 * - Fetch the dats from the 'ledgers' table using condition(param) by calling common findByPagination function.
 *   - If data exist,
 *     + loop the data and push the object in to an array and add serial number to the object.
 *     + Prepare the response
 *     + return the response with status as true
 *   - Else
 *     + return the response with status as false.
 * 
 * @param {object} condition - The conditions to filter the ledgers data.
 * @param {number} page - The page number of the results to retrieve.
 * @param {number} limit - The maximum number of results per page.
 * @returns {object} - An object containing the retrieved ledgers data, pagination details, and status.
 **/
const listing = async (condition, dateFormat, page, limit) => {
    let ledgersListing;
    let total_ledgers_count = 0;
    let query = `Select * FROM getLedgersListing(`;
    query += (condition.entity_type !== null) ? `'${condition.entity_type}',` : `${condition.entity_type},`;
    query += (condition.company_id !== null) ? `'${condition.company_id}',` : `${condition.company_id},`;
    query += (condition.status !== null) ? `'${condition.status}',` : `${condition.status},`;
    query += (condition.from_date && condition.to_date) ? `'${condition.from_date}', '${condition.to_date}',` : `${condition.from_date}, ${condition.to_date},`;
    query += (condition.search !== null) ? `'${condition.search}',` : `${condition.search},`;
    query += `'${dateFormat}', ${limit}, ${page})`;

    ledgersListing = await indexRepository.rawQuery(query);

    if (ledgersListing.status || ledgersListing.length > 0) {
        total_ledgers_count = ledgersListing[0]?.total_count;
        pagination_details = {
            total: total_ledgers_count,
            currentPage: page,
            perPage: limit,
            totalPages: (total_ledgers_count) ? Math.ceil(total_ledgers_count / limit) : 0
        }

        ledgersListing = ledgersListing?.map(obj => {

            // Calculate or sum of received amount
            obj.received_amount_previous = Object.values(obj.received_amount_previous).filter(value => typeof value === 'number') // Filter out non-numeric values
                .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
            obj.balance_due = +parseFloat(obj.amount - obj.received_amount_previous).toFixed(2);
            const { ['total_count']: omittedKey, ...rest } = obj;
            return rest;
        });

        return {
            status: true,
            data: ledgersListing,
            pagination_data: pagination_details
        }
    } else {
        return ledgersListing;
    }
}

/**
 * Retrieves ledgers data based on the given condition and returns a formatted response.
 * @param {any} condition - The condition to filter the invoices.
 * @param {string} loginUserId - The ID of the logged-in user.
 * @param {any} body - The request body.
 * @returns {Promise<{status: boolean, data: any}>} - The status and data of the retrieved invoices.
 */
const index = async (condition, body = null) => {

    // Initialize an empty array to store the response data.
    var responseData;
    let edit_access = false;
    responseData = await indexRepository.rawQuery(`Select * From GetLedgerDetails('${condition.ledger_id}','${condition.entity_type}','${condition.date_format}')`);

    if (responseData && responseData.length > 0) {
        let organization_address = []

        responseData = responseData[0];
        if (responseData.ledger_item_details) {
            responseData.ledger_item_details.map(async item => {
                item.avatar = await generateEmployeeAvatar(item);
            })
        }

        if (responseData.received_amount_previous) {
            responseData.received_amount_previous = Object.values(responseData.received_amount_previous).filter(value => typeof value === 'number') // Filter out non-numeric values
                .reduce((accumulator, currentValue) => accumulator + currentValue, 0)
        }

        const joinss = [
            {
                table: 'states',
                condition: ['organization.state_id', 'states.id'],
                type: 'left'
            },
            {
                table: 'countries',
                condition: ['countries.id', 'organization.country_id'],
                type: 'left'
            },
        ]
        var orgAddress = await indexRepository.find('organization', ['organization.id', 'organization.organization_name', 'organization.invoice_theme' , 'address_line_1', 'address_line_2', 'city', 'state_id', 'organization.country_id', 'zip_code', 'states.name as state_name', 'countries.name as country_name'], null, null, joinss, null, null, null, false)
        if (orgAddress.status) {
            orgAddress = orgAddress.data[0]
            let organizationAddress = {
                id: orgAddress.id,
                name : orgAddress.organization_name,
                city: orgAddress.city ? orgAddress.city : '',
                state_id: orgAddress.state_id ? orgAddress.state_id : '',
                zip_code: orgAddress.zip_code ? orgAddress.zip_code : '',
                country_id: orgAddress.country_id ? orgAddress.country_id : '',
                state_name: orgAddress.state_name ? orgAddress.state_name : '',
                country_name: orgAddress.country_name ? orgAddress.country_name : '',
                address_line_one: orgAddress.address_line_1 ? orgAddress.address_line_1 : '',
                address_line_two: orgAddress.address_line_2 ? orgAddress.address_line_2 : '',
                dark_theme : orgAddress.invoice_theme ? orgAddress.invoice_theme[0].dark_theme : '',
                light_theme :  orgAddress.invoice_theme ? orgAddress.invoice_theme[0].light_theme : '',
            }
            organization_address.push(organizationAddress)
            responseData.organization_address = organization_address
        }

        // Find Whether logged in user has editaccess or not
        // Fetch the role id information for the login employee
        let roleId = body.loginRoleId;
        const super_admin_check = body.loginUserAdmin;
        if (super_admin_check) {

            // If Super Admin Give Access to edit and to submit.
            edit_access = true;
        } else {

            // Check For logged in user role has access to edit the ledger or not
            const filters = { 'role_permissions.role_id': roleId, 'permissions.slug': 'ledgers_edit', 'role_permissions.is_allowed': true, 'roles.is_active': true };
            const joins = [
                {
                    table: 'permissions',
                    condition: ['permissions.id', 'role_permissions.permission_id'],
                    type: 'inner'
                },
                {
                    table: 'roles',
                    condition: ['roles.id', 'role_permissions.role_id'],
                    type: 'inner'
                },
            ];

            const rolePermission = await indexRepository.find('role_permissions', ['role_permissions.id'], filters, 1, joins);

            if (rolePermission.status) {
                edit_access = true;
            }
        }

        // Find Logged In User has approver access or not
        // Get Ledger - Invoice Current Approval Level Approvers Users Data.
        const approvedUsers = (condition.entity_type == INVOICES) ? await getApproverIds(body) : [];
        const checkApprover = (approvedUsers?.approval_users) ? approvedUsers?.approval_users : [];

        // responseData.edit_access = edit_access;
        responseData.is_submit = [DRAFTED].includes(responseData.status) ? (edit_access ? true : false) : false;
        responseData.approval_access = (checkApprover.includes(body.loginUserId)) ? (([DRAFTED, SUBMITTED, APPROVAL_INPROGRESS].includes(responseData.status)) ? true : false) : false;
        responseData.edit_access = (condition.entity_type == INVOICES) ? responseData.approval_access : (([SUBMITTED, APPROVAL_INPROGRESS, APPROVED].includes(responseData.status)) ? true : false); // FOR TESTING

        // Return a response object with a status of 'true' and the retrieved data.
        return {
            status: true,
            data: responseData
        }
    } else {
        return responseData;
    }
};

const pdfData = async (condition, body) => {

    var indexResponse = await index(condition, body)

    if (indexResponse.status) {
        indexResponse = indexResponse.data
        var shipping_address = indexResponse.shipping_address[0]
        var billing_address = indexResponse.billing_address[0]
        var sub_total_amount = indexResponse.sub_total_amount;
        var balance_due = indexResponse.balance_amount;
        var organization_address = indexResponse.organization_address[0]

        const pdfObject = {
            id: indexResponse.id,
            ledger_lable : condition.entity_type =='invoice' ? 'Invoice' : 'Bill',
            ledger_number_lable : condition.entity_type =='invoice' ? 'Invoice No :' : 'Bil No :',
            ledger_number : indexResponse.order_number,
            date : moment(indexResponse.date, 'MM/DD/YYYY').format('YYYY-MM-DD'),
            due_date : moment(indexResponse.due_date, 'MM/DD/YYYY').format('YYYY-MM-DD') ,
            ledger_amount_lable : condition.entity_type =='invoice' ? 'Invoice Amount' : 'Bill Amount',
            ledger_amount : indexResponse.total_amount,
            // organization_name : shipping_address.name,
            // organization_city : shipping_address.city,
            // organization_zip_code : shipping_address.zip_code,
            // organization_address_line_one : shipping_address.address_line_one,
            // organization_address_line_two : shipping_address.address_line_two,
            company_name : billing_address.company_name,
            city : billing_address.city,
            zip_code : billing_address.zip_code,
            address_line_one : billing_address.address_line_one,
            address_line_two : billing_address.address_line_two,
            ledger_employees : indexResponse.ledger_item_details,
            adjustment_amount : indexResponse.adjustment_amount,
            sub_total_amount : sub_total_amount,
            balance_due : balance_due,
            payment_made : (sub_total_amount - balance_due ),
            client_id : indexResponse.company_id,
            dark_theme : organization_address?.dark_theme || '',
            light_theme : organization_address?.light_theme || '',
        }
        var ledgerDetails = await ledgerInformationData.ledgerThemeInfo(pdfObject, condition.is_pdf);
        responseData = {
            status : true,
            data : ledgerDetails
        }
    } else {
        responseData = {
            status: false,
            data: [],
            error: ''
        }
    }

    return responseData
}

/**
 * Function to get uninvoiced timesheets based on query parameters.
 *
 * @param {Object} query - An object containing query parameters for filtering timesheets.
 *
 * Logic:
 * - Initialize an empty array 'responseData' to store the result.
 * 
 * - Build a 'condition' object to filter timesheets based on the provided query parameters:
 *   - Placement ID should match 'query.placement_id'.
 *   - 'invoice_raised' flag should be 'false'.
 *   - Additional date conditions based on 'query.start_date' and 'query.end_date'.
 * 
 * - Define 'joins' to specify the table joins needed for the query.
 * 
 * - Call the 'indexRepository.find' function to retrieve timesheet hours data based on the constructed condition and joins.
 * 
 * - If timesheet hours data retrieval is successful:
 *   - Loop through the retrieved data and create 'listingObject' for each timesheet:
 *     - 'timesheet_hours_id': Unique identifier for the timesheet hours.
 *     - 'date': The formatted date of the timesheet.
 *     - 'total_hours': Total hours recorded on the timesheet.
 *     - 'ot_hours': Overtime hours recorded on the timesheet.
 *     - 'billable_hours': Billable hours recorded on the timesheet.
 *     - 'comments': Comments associated with the timesheet (if available).
 *     - 'non_billable_hours': Non-billable hours recorded on the timesheet.
 *     - 'payroll_raised': Whether payroll has been raised for the timesheet.
 *   - Push each 'listingObject' into the 'responseData' array.
 * 
 * - Return an object with 'status' set to 'true' and 'data' containing the 'responseData'.
 */
const getUninvoicedTimesheets = async (query) => {

    /* Variables */
    var responseData = [];
    /* Variables */

    var condition = {
        'timesheets.placement_id': query.placement_id,
        'timesheets.status': APPROVED,
        'timesheet_hours.invoice_raised': false,
    };

    if (query.start_date && !query.end_date) {
        condition['date_greater_than_equal'] = [{ column: 'timesheet_hours.date', date1: query.start_date }];
    } else if (query.end_date && !query.start_date) {
        condition['date_less_than_equal'] = [{ column: 'timesheet_hours.date', date1: query.end_date }];
    } else if (query.start_date && query.end_date) {
        condition['date_between'] = [{
            column: 'timesheet_hours.date', date1: query.start_date, date2: query.end_date
        }];
    }

    const joins = [
        {
            table: 'timesheet_documents',
            condition: ['timesheets.id', 'timesheet_documents.timesheet_id'],
            type: 'left'
        },
        {
            table: 'timesheet_hours',
            condition: ['timesheets.id', 'timesheet_hours.timesheet_id'],
            type: 'left'
        }
    ];
    /* Default variables */
    var timesheetHoursData = await indexRepository.find('timesheets', ['timesheet_documents.document_url', 'timesheet_hours.*'], condition, null, joins, null, 'timesheet_hours.date', 'asc');
    let over_all_total_hours;

    if (timesheetHoursData.status) {
        const totalHoursArray = timesheetHoursData.data.map(interval => interval.total_hours);
        over_all_total_hours = calculateHours(totalHoursArray);
        serial_no = 1
        for (let key in timesheetHoursData.data) {
            let [hours, minutes] = timesheetHoursData.data[key].total_hours.split(':');
            let [otHours, otMinutes] = timesheetHoursData.data[key].ot_hours.split(':');
            let [nonHours, nonMinutes] = timesheetHoursData.data[key].non_billable_hours.split(':');
            let [billHours, billMinutes] = timesheetHoursData.data[key].billable_hours.split(':');
            listingObject = {
                id: serial_no,
                timesheet_hours_id: timesheetHoursData.data[key].id,
                date: moment(timesheetHoursData.data[key].date).format('YYYY-MM-DD'),
                total_hours: `${hours}.${minutes}`,
                ot_hours: `${otHours}.${otMinutes}`,
                billable_hours: `${billHours}.${billMinutes}`,
                comments: timesheetHoursData.data[key].comments ? timesheetHoursData.data[key].comments : "",
                non_billable_hours: `${nonHours}.${nonMinutes}`,
                document_url: timesheetHoursData.data[key].document_url || ''
            }
            responseData.push(listingObject);
            serial_no++
        }
    }

    return { status: true, data: responseData, total_hours: over_all_total_hours }
}

/**
 * Function to retrieve employee details for a given client ID.
 *
 * @param {Object} condition - Contains the client ID to look up employee details.
 *
 * Logic:
 * - Initialize an empty variable 'responseData'.
 * 
 * - Define the 'fields' to select specific columns for retrieval.
 * - Define 'joins' to specify the necessary joins with other tables.
 * 
 * - Retrieve employee details using 'indexRepository.find' by specifying the client ID in the condition and applying joins.
 * - If the retrieval is successful:
 *   - Iterate through the retrieved data and create 'listingObject' for each employee.
 *   - Populate 'responseData' with details for each employee.
 * 
 * - Return a response with 'status' set to true and the 'responseData' containing employee details.
 */
const getEmployeeDetailsByClientId = async (condition, dateFormat) => {

    /* Variables */
    var responseData = [];
    /* Variables */

    const fields = [
        "employee.display_name as employee_name",
        "employee.id as employee_id",
        "employee.profile_picture_url",
        "employee.gender",
        "placements.id as placement_id",
        "placements.reference_id",
        "placements.invoice_configuration_id"
    ];
    const joins = [
        { table: 'placements', condition: ['placements.client_id', 'companies.id'], type: 'left' },
        { table: 'employee', condition: ['employee.id', 'placements.employee_id'] }
    ];
    /* Default variables */
    var employeeDetails = await indexRepository.find('companies', fields, { "companies.id": condition.id }, null, joins)

    if (employeeDetails.status) {

        // Remove employeeDetails which has `invoice_configuration_id` as NULL.
        employeeDetails.data = employeeDetails?.data?.filter(obj => obj.invoice_configuration_id !== null);

        const uniqueRecords = new Map();

        for (let key in employeeDetails.data) {
            const { employee_id, placement_id, effective_to } = employeeDetails.data[key];
            const recordKey = `${employee_id}_${placement_id}`;

            let bill_rate = await placmentService.getPlacementBillDetails(employeeDetails.data[key].placement_id, dateFormat);
            bill_rate = bill_rate.current_bill_rate;

            if ((bill_rate > 0) && (!uniqueRecords.has(recordKey) || !effective_to)) {

                const listingObject = {
                    employee_id: employeeDetails.data[key].employee_id,
                    placed_employee_name: employeeDetails.data[key].employee_name,
                    placement_id: employeeDetails.data[key].placement_id,
                    placement_reference_id: employeeDetails.data[key].reference_id,
                    avatar: (!employeeDetails.data[key]?.profile_picture_url) ? await generateEmployeeAvatar(employeeDetails.data[key]) : employeeDetails.data[key]?.profile_picture_url,
                    current_bill_rate: bill_rate
                    // just to check whether we are fetching recent placement_billing_details record if we have duplicate record with employee_id & placement_id
                    // placement_billing_details_id : employeeDetails.data[key].pbd_id  
                };
                responseData.push(listingObject);
                uniqueRecords.set(recordKey, true);
            }
        }
    }
    return { status: !!employeeDetails.status, data: responseData }
}

/**
 * Function to retrieve employee details for a given client ID.
 *
 * @param {Object} vendor_id - Contains the vendor_id to look up employee details.
 */
const getEmployeeDetailsByVendorId = async (vendor_id) => {

    /* Default variables */
    var employeeDetails = await indexRepository.find('employee', ['id as employee_id', 'reference_id as employee_reference_id', 'display_name as placed_employee_name', 'gender', 'profile_picture_url', 'vendor_price_per_hour as current_bill_rate'], { "preferable_vendor_id": vendor_id }, null, []);

    if (employeeDetails.status) {
        employeeDetails?.data.map(async emp => {
            emp.avatar = (!emp.profile_picture_url) ? await generateEmployeeAvatar(emp) : emp.profile_picture_url;
        });
    }

    return {
        status: !!employeeDetails.status,
        data: employeeDetails.data
    }
}

/**
 * Function to fetch the ledger section details
 * Logic :
 *  - Fetch the timesheet hours information based on the timesheet id.
 *  - Iterate through the fetch entries and calculate the bill rate for each entry usinf placement billing details.
 *  - Store information in the object.
 *  - Iterate through the loop, if bill rate varies than push the information to another lo
 * 
 * @param {object} body
 * @return Json
 * 
 */
const getLedgerItemDetailsByTimesheetIds = async (body) => {
    let dateFormat = await format.getDateFormat(); // date format
    let fields = ['timesheet_hours.id as id', 'timesheet_hours.ot_hours as ot_hours', ' timesheet_hours.billable_hours as billable_hours', 'e.display_name', 'timesheet_hours.date', 'pla.id as placement_id'];  // fields to fetch
    let dataResponse;

    // Tables to join
    const joins = [
        { table: 'timesheets as ts', alias: 'ts', condition: ['ts.id', 'timesheet_hours.timesheet_id'], type: 'inner' },

        { table: 'placements as pla', alias: 'pla', condition: ['pla.id', 'ts.placement_id'], type: 'inner' },

        { table: 'employee as e', alias: 'e', condition: ['e.id', 'pla.employee_id'], type: 'inner' }
    ];
    let timesheetsHoursInfo = await indexRepository.find('timesheet_hours', fields, { 'timesheet_hours.id': body.timesheet_hour_ids }, null, joins); // Fetch the timesheets information

    if (timesheetsHoursInfo.status) {
        let hours = timesheetsHoursInfo.data;
        let response = [];
        let tempResponse = {};
        let startDate = moment(hours[hours.length - 1].date).format('YYYY-MM-DD'); // Start date for this item sections
        let lastDate = moment(hours[0].date).format('YYYY-MM-DD'); // End date for this item sections

        let placementBillingDetails = await indexRepository.find('placement_billing_details', ['bill_rate', 'id', 'ot_bill_rate', 'bill_rate_discount_type', 'bill_rate_discount', 'effective_from', 'effective_to'], { 'placement_id': body.placement_id }, 0, [], null, 'effective_from', 'asc'); // Fetch the placement_billing_details information

        for (let key in hours) {
            let timesheetDate = moment(hours[key].date).format('YYYY-MM-DD');
            let employeeName = hours[key].display_name;  //employee name

            // Split the standard hours and add them
            let [hours1, minutes] = hours[key].billable_hours.split(':');
            temp1_minuts = minutes ? Number(minutes) : 0;
            temp1_minuts = (temp1_minuts / 60);
            let standard_hours_final = parseFloat(hours1) + parseFloat(temp1_minuts);
            standard_hours_final = parseFloat(standard_hours_final).toFixed(2);
            standard_hours_final = parseFloat(standard_hours_final);

            // Split the OT hours and add them
            let [hours2, minutes2] = hours[key].ot_hours.split(':');
            temp2_minuts = minutes2 ? Number(minutes2) : 0;
            temp2_minuts = (temp2_minuts / 60);
            let ot_hours_final = parseFloat(hours2) + parseFloat(temp2_minuts);
            ot_hours_final = parseFloat(ot_hours_final).toFixed(2);
            ot_hours_final = parseFloat(ot_hours_final);

            if (placementBillingDetails.status) {

                // Filter the array based on the specified conditions
                let filteredObjects = await placementBillingDetails.data.filter(obj => {
                    return obj.effective_to === null || (obj.effective_from >= timesheetDate && obj.effective_to <= timesheetDate);
                });

                let billingData = filteredObjects[0];
                let standard_bill_rate = billingData.bill_rate;
                let ot_bill_rate = billingData.ot_bill_rate ? billingData.ot_bill_rate : 0;
                tempResponse = {}; // Empty the object

                /**
                 * Calculating the bill rate discount for the item
                 */
                if (billingData.bill_rate_discount_type) {
                    if (billingData.bill_rate_discount_type == 1) { // Discount Percentage value
                        standard_bill_rate = standard_bill_rate - (standard_bill_rate * (billingData.bill_rate_discount / 100)); ot_bill_rate = ot_bill_rate - (ot_bill_rate * (billingData.bill_rate_discount / 100));
                    } else {  // Fixed value
                        standard_bill_rate = standard_bill_rate - (billingData.bill_rate_discount);
                        ot_bill_rate = ot_bill_rate - (billingData.bill_rate_discount);
                    }
                }

                /**
                 * Standard bill rate calculation
                 */
                tempResponse.standard_bill_rate = standard_bill_rate; // add the standard bill rates

                /**
                 * Bill rate calculation
                 */
                tempResponse.rate = standard_bill_rate; // add the standard bill rates
                tempResponse.standard_hours_final = standard_hours_final;  // add the standard bill hours

                /**
                 * Ot Bill rate & OT Hours calculation
                 */
                tempResponse.ot_bill_rate = ot_bill_rate; // add the ot bill rates
                tempResponse.ot_hours_final = ot_hours_final;  // add the ot bill hours

                tempResponse.bill_id = billingData.id;   // add the bill id
                tempResponse.hours_id = hours[key].id;   // add the hours id

                tempResponse.ot_pay = (ot_hours_final * ot_bill_rate);  // ot pay amount
                tempResponse.standard_pay_amount = (standard_hours_final * standard_bill_rate); // standard pay amount
                tempResponse.amount = (tempResponse.ot_pay + tempResponse.standard_pay_amount);  // Tota pay amount
                tempResponse.service_name = employeeName;
                tempResponse.hours = (ot_hours_final + standard_hours_final);
                tempResponse.description = 'Timesheet between ' + moment(startDate).format(dateFormat) + ' and ' + moment(lastDate).format(dateFormat) + ' For ' + employeeName;
                tempResponse.timesheets_available = true;

                let valuePush = 0;

                // Iteralte the loop and sum the same bill id based ids and add the hours and pay amount for the same bill id
                for (i = 0; i < response.length; i++) {
                    if (response[i].bill_id === tempResponse.bill_id) {

                        response[i].ot_hours_final += tempResponse.ot_hours_final;
                        response[i].standard_hours_final += tempResponse.standard_hours_final;
                        response[i].ot_pay += tempResponse.ot_pay;
                        response[i].standard_pay_amount += tempResponse.standard_pay_amount;

                        response[i].rate = tempResponse.rate;
                        response[i].hours += tempResponse.hours;
                        response[i].amount += tempResponse.amount;

                        if (response[i].service_to < tempResponse.service_to) {
                            response[i].description = 'Timesheet between ' + moment(response[i].service_date).format(dateFormat) + ' and ' + moment(response[i].service_date).format(tempResponse.service_to).format(dateFormat) + ' For ' + employeeName;
                            response[i].service_to = tempResponse.service_to;
                        }

                        let temp = response[i].timesheet_hour_ids;
                        temp.push(tempResponse.hours_id);
                        response[i].timesheet_hour_ids = temp;
                        valuePush = 1;
                    }
                }

                /**
                 * Based on the condition push the data to object
                 */
                if (valuePush == 0) {
                    let temp = [];
                    temp.push(tempResponse.hours_id);
                    tempResponse.timesheet_hour_ids = temp;
                    response.push(tempResponse);
                }
            }
        }

        /**
         * Preparing the final response object
         */
        let finalResponse = [];
        for (let key in response) {
            let temp = {};
            temp.standard_bill_rate = parseFloat(response[key].standard_bill_rate).toFixed(2);
            temp.rate = parseFloat(response[key].rate).toFixed(2);
            temp.ot_bill_rate = parseFloat(response[key].ot_bill_rate).toFixed(2);
            temp.ot_hours_final = parseFloat(response[key].ot_hours_final).toFixed(2);
            temp.standard_hours_final = parseFloat(response[key].standard_hours_final).toFixed(2);
            temp.bill_id = response[key].bill_id;
            temp.timesheet_hour_ids = response[key].timesheet_hour_ids;
            temp.ot_pay = parseFloat(response[key].ot_pay).toFixed(2);
            temp.standard_pay_amount = parseFloat(response[key].standard_pay_amount).toFixed(2);
            temp.amount = parseFloat(response[key].amount).toFixed(2);
            temp.service_date = moment(response[key].service_date).format(dateFormat);
            temp.service_to = response[key].service_to ? moment(response[key].service_to).format(dateFormat) : '';
            temp.service_name = response[key].service_name;
            temp.hours = parseFloat(response[key].hours).toFixed(2);
            temp.information = parseFloat(response[key].ot_pay) > 0 ? (`This Is a Auto Generated Invoice. This Invoice Billing Section Consists Of ${temp.ot_hours_final} OT Hours With A OT Bill Rate as ${temp.ot_bill_rate} and Total OT Invoice Amount is ${temp.ot_pay}. Please check before proceed.`) : '';
            temp.description = response[key].description;
            temp.timesheets_available = response[key].timesheets_available;
            finalResponse.push(temp);
        }

        dataResponse = { status: true, data: finalResponse };
    } else {
        dataResponse = { status: false, data: [] };
    }
    return dataResponse;
};

/**
 * Get ledger Status Query Inclues only status related keys
 */
async function getLedgerStatusDataQuery(ledgerId) {
    return "select ledgers.id, ledgers.status, ledgers.is_void, is_sent from ledgers where id = '" + ledgerId + "' "
}

/**
 * Get Ledger Data Querry Including all the ledger_item_details, ledger_address based on the ledger_id
 */
async function getLedgerDataQuery(ledgerId) {

    return "select ledgers.id, ledgers.order_number, ledgers.net_pay_terms_id, ledgers.amount, ledgers.sub_total_amount, ledgers.discount_type, ledgers.discount_value, ledgers.discount_amount, ledgers.balance_amount, ledgers.customer_note, ledgers.terms_and_conditions, ledgers.tax_information, ledgers.date, ledgers.due_date, ledgers.status, jsonb_agg(DISTINCT jsonb_build_object('id',ledger_item_details.id,'description', ledger_item_details.description, 'hours', ledger_item_details.hours, 'rate', ledger_item_details.rate, 'amount', ledger_item_details.amount)) AS ledger_item_details, jsonb_agg(Distinct jsonb_build_object('id', ledger_addresses.id, 'address_line_one', ledger_addresses.address_line_one, 'address_type', ledger_addresses.address_type,'address_line_two', ledger_addresses.address_line_two, 'zip_code', ledger_addresses.zip_code, 'city', ledger_addresses.city, 'state_id', ledger_addresses.state_id, 'country_id', ledger_addresses.country_id)) AS ledger_addresses from ledgers left join ledger_item_details on ledgers.id = ledger_item_details.ledger_id left join ledger_addresses on ledgers.id = ledger_addresses.ledger_id where ledgers.id = '" + ledgerId + "' group by ledgers.id";
}

/**
 * Calculate the subtotal amount of the ledger
 */
async function updateLedgersAmount(ledgerId) {
    let ledgerDetails = await indexRepository.find('ledgers', ['discount_amount', 'adjustment_amount'], { id: ledgerId });
    ledgerDetails = ledgerDetails.data[0];

    const sumAmountQuery = "SELECT SUM(amount) AS amount FROM ledger_item_details WHERE ledger_id ='" + ledgerId + "'";
    let sumAmount = await indexRepository.rawQuery(sumAmountQuery);
    sumAmount = sumAmount[0]?.amount;
    let amount = sumAmount + ledgerDetails.adjustment_amount - ledgerDetails.discount_amount;
    const updateData = {
        'sub_total_amount': sumAmount,
        'amount': amount
    }
    const ledgersUpdate = await indexRepository.update('ledgers', { id: ledgerId }, updateData);
    return ledgersUpdate;
}

/**
 * Dashboard Analytics function to retrieve overall ledgers summary.
 * Fetch the partially paid overall invoices count.
 * Fetch the overall overdue invoices count.
 * Fetch the INVOICE AMOUNT -> total_amount_raised, total_amount_received, toal_over_due_amount. 
 * @returns {Object} Response with employee details.
 */
async function dashboardAnalytics(entity_type, payment_entity_type) {

    let dashboardInfo;
    if(entity_type == 'bill'){
        dashboardInfo = await indexRepository.rawQuery(`Select * from GetLedgerBillDashboardAnalytics('${entity_type}', '${payment_entity_type}')`)
    }else{
        dashboardInfo = await indexRepository.rawQuery(`Select * from getLedgerDashboardAnalytics('${entity_type}', '${payment_entity_type}')`)
    }

    if (dashboardInfo) {
        return {
            status: true,
            data: dashboardInfo
        }
    } else {
        return dashboardInfo;
    }

}

const updateStatus = async (body, updateData, ledgerApprovalTrack) => {
    let trx;
    try {

        // Databse connection
        const db = await getConnection();
        trx = await db.transaction();

        // get ledger before data
        const query = await getLedgerStatusDataQuery(body.ledger_id);
        let beforeUpdate = await indexRepository.rawQuery(query);
        beforeUpdate = beforeUpdate[0];

        var ledgerData = await indexRepository.update('ledgers', { id: body.ledger_id }, updateData);

        if (body.status_key == 'mark_as_recurring') {

            if (body.recurring_data.id) {
                await indexRepository.update('ledger_recurring_configurations', { id: body.recurring_data.id }, body.recurring_data);
            } else {
                body.recurring_data.ledger_id = body.ledger_id;
                await indexRepository.store('ledger_recurring_configurations', body.recurring_data);
            }
        }

        // Store Ledger Approval Track
        if (ledgerApprovalTrack && Object.keys(ledgerApprovalTrack).length > 0) {
            await indexRepository.store('ledger_approval_track', ledgerApprovalTrack);
        }

        if (updateData.status == 'Approval In Progress') { // for storing notifications
            body.slug = 'invoice-approval-notification'
            eventss.emit('notification', body);
        }

        // Commit the transaction
        await trx.commit();

        ledgerData = ledgerData.data[0]

        pdfCondition = {
            ledger_id: body.ledger_id, 
            entity_type: 'invoice',
            is_pdf: true 
        }
        var ledger_documents = await indexRepository.find('ledger_documents', ['*'], { 'ledger_id': body.ledger_id });

        var pdfDetails = await pdfData(pdfCondition, body)

        // Emit an event to trigger sending a email
        mailEvents.emit('invoiceApprovalOrRejectedMail', body, ledgerData, pdfDetails, ledger_documents);

        // initiate ledger status update activity-track
        activity = {
            ledger_id: body.ledger_id,
            action_type: 2, //2 for update
            created_by: body.created_by,
            beforeUpdate: beforeUpdate,
            query: query
        };
        events.emit('ledgerActivity', { activity });

        // initiate ledger reminder for changing the status between submited and approved.
        // if (updateData.status &&
        //     [DRAFTED, SUBMITTED, APPROVAL_INPROGRESS].includes(beforeUpdate.status) &&
        //     [SUBMITTED, APPROVAL_INPROGRESS, APPROVED].includes(updateData.status)) {

        //     const joins = [
        //         {
        //             table: 'companies',
        //             condition: ['companies.id', 'ledgers.company_id'],
        //             type: 'left'
        //         }
        //     ]

        //     const ledger = await indexRepository.find('ledgers', ['id as ledger_id', 'company_id', 'approval_level', 'companies.name as company_name', 'date', 'due_date'], { id: body.ledger_id }, null, joins);
        //     const approversData = await getApproverIds(ledger.data[0]);

        //     // invoice - pending - approval
        //     let reminderData = {
        //         send_reminder_to: approversData?.approval_users,
        //         remider_slug: 'invoice-pending-approval'
        //     };
        //     events.emit('ledgerReminder', { reminderData });
        // }

        return { status: true, data: ledgerData.data };

    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

const sendEmailNotification = async (body) => {

    const approverIds = await getApproverIds(body.ledger_id);
}

const ledgersReminder = async (condition, body) => {

    var pdfDetails = await pdfData(condition, body)
    // var pdfPath = pdfData.data.data.pdfPath;

    var ledger_documents = await indexRepository.find('ledger_documents', ['*'], { 'ledger_id': condition.ledger_id });

    // Emit an event to trigger sending a email
    mailEvents.emit('ledgersRemindersMail',condition, pdfDetails, ledger_documents);
    return { status: true, data: 'Email Sent Successfully' }
}

const getApproverIds = async (ledger) => {

    let approvers = [];

    // Get the current approval User of the ledger
    let ledger_item_details = await indexRepository.find('ledger_item_details', ['id', 'placement_id'], { ledger_id: ledger?.ledger_id });
    ledger_item_details = ledger_item_details.data;

    // Check employee has approver access or not.
    // Get approvers list for this ledger.
    // If ledger has multiple placements involved consider approvers from client invoce approval configuration.
    if (ledger_item_details?.length >= 2) {
        tableName = 'companies';
        condition = { id: ledger?.company_id };
    } else if (ledger_item_details?.length > 0 && ledger_item_details[0]) {
        tableName = 'placements';
        condition = { id: ledger_item_details[0]?.placement_id };
    }

    const response = await indexRepository.find(tableName, ['id', 'invoice_approval_id'], condition);
    const invoice_approval_id = response?.data[0]?.invoice_approval_id;
    if (invoice_approval_id) {
        const joins = [
            {
                table: 'approval_users',
                condition: [
                    'approval_users.approval_level_id', 'approval_levels.id'
                ],
                type: 'left'
            }
        ];

        approvers = await indexRepository.find('approval_levels', ['approval_users.approver_id'], { 'approval_levels.approval_setting_id': invoice_approval_id, 'approval_levels.level': ledger?.approval_level }, null, joins);

        approvers = (approvers?.data?.length > 0) ? approvers?.data?.map(item => String(item.approver_id)) : [];
        return {
            approval_users: approvers,
            invoice_approval_id: invoice_approval_id
        };
    } else {
        return approvers;
    }
}


module.exports = { store, update, destroy, index,pdfData, ledgersReminder, listing, getUninvoicedTimesheets, getEmployeeDetailsByClientId, getLedgerItemDetailsByTimesheetIds, dashboardAnalytics, updateStatus, getEmployeeDetailsByVendorId, sendEmailNotification, getApproverIds };
