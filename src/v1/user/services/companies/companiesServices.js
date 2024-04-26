const { getMonthDateRange } = require("../../../../../helpers/timesheetHelpers")
const moment = require('moment')
const indexRepository = require("../../repositories/index");
const format = require('../../../../../helpers/format');
const { event } = require('../../../../../events/companyActivityEvent');
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');
const { fetchAndMoveDocument, destroyDocument } = require('../../../../../helpers/globalHelper');
const config = require('../../../../../config/app');

/**
 * Store function to create a new Company Details entry.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Create an object 'newCompany' with properties extracted from the request 'body'.
 * - Call the 'transactionRepository.store' function to store the new company information in the 'companies' table within the transaction.
 * - Define the destination folder for storing documents.
 * 
 * - Iterate through 'documents' in the request 'body' and process each document:
 *   + If 'new_document_id' is not empty, fetch document details from temporary document records (in 'temp_upload_documents') using the provided 'new_document_id'.
 *   + Move the document file to the specified destination folder ('destFolder') using the original document name.
 *   + Create an object ('fileData') that contains information about the stored document, including its name, URL, and path.
 *   + Call the 'transactionRepository.update' function and update the 'companies' record with the document information.
 *   + Remove the temporary document record (from 'temp_upload_documents') as it is no longer needed after the document has been successfully processed.
 * 
 * - Initialize an empty array 'companyAddress' to store company address objects.
 * 
 * - Iterate over 'billing_address' in the request 'body' and create a new company address object for each key.
 * 
 * - If 'same_as_above' is 'false', iterate through 'shipping_address' and create shipping address objects.
 * 
 * - Use the 'transactionRepository.store' function to store all created company address objects.
 * - Commit the transaction after successfully storing all data.
 * - Perform activity tracking by emitting an event for creating a new company record.
 * - Return the response with information about the stored company record.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 *
 * @param {Object} body - The request body containing Company Details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        // Generating the client refernce id based on prefixes
        const count = await indexRepository.count('companies', { entity_type: body.slug_name }, [], false);
        const prefix = await indexRepository.find('prefixes', ['prefix_name', 'separator', 'number'], { slug: body.slug_name });
        const prefixData = prefix.data[0];
        var reference_id = prefixData.prefix_name + prefixData.separator + (Number(count.data) + prefixData.number)

        /* Creating new object */
        var newCompany = {
            entity_type: body.slug_name,
            name: body.name,
            reference_id: reference_id,
            net_pay_terms_id: body.net_pay_terms_id ? body.net_pay_terms_id : null,
            same_as_above: body.same_as_above,
            created_by: body.created_by,
            created_at: new Date()
        };
        /* Creating new object */

        const companyInfo = await transactionRepository.store(trx, 'companies', newCompany); // Storing the company information

        const destFolder = `${body.loginSubDomainName}/companies/${body.slug_name}-Documents/${reference_id}`

        var documents = body.documents
        for (const key in documents) {
            if (documents[key].new_document_id != '' && documents[key].new_document_id != null) {

                // Fetch document details from temporary document records (in 'temp_upload_documents') using the provided 'new_document_id'.
                let documentCondition = { id: documents[key].new_document_id }
                let documentData = await indexRepository.find('temp_upload_documents', ['*'], documentCondition, null, [], null, null, null, false)

                // Move the document file to the specified destination folder ('destFolder') using the generated unique file name.
                let file = await fetchAndMoveDocument(documentData.data, destFolder, documentData.data[0].document_name)

                // create a new entry for each document 
                let fileData = {
                    logo_document_url: (`${config.documentUrl}${destFolder}/${file}`).replace(/ /g, '%20'),
                    logo_document_path: `${destFolder}/${file}`,
                }

                // Update the 'companies' record with the document information by calling 'transactionRepository.update'.
                await transactionRepository.update(trx, 'companies', { id: companyInfo.data[0].id }, fileData)

                // Remove the temporary document record (from 'temp_upload_documents') as it is no longer needed after the document has been successfully processed.
                await transactionRepository.destroy(trx, 'temp_upload_documents', { id: documentData.data[0].id })
            }
        }
        var companyAddress = []  // companyAddress variable

        for (const key in body.billing_address) {
            var newBillingAddress = {
                company_id: companyInfo.data[0].id,
                address_type: 1, // Billing address
                address_line_one: body.billing_address[key].address_line_one,
                address_line_two: body.billing_address[key].address_line_two,
                city: body.billing_address[key].city,
                state_id: body.billing_address[key].state_id,
                country_id: body.billing_address[key].country_id,
                zip_code: body.billing_address[key].zip_code,
                created_by: body.created_by,
                created_at: new Date()
            }
            companyAddress.push(newBillingAddress)
        }

        if (body.same_as_above == 'false') {
            for (const key in body.shipping_address) {
                var shippingclientAddress = {
                    company_id: companyInfo.data[0].id,
                    address_type: 2,  // shipping address
                    address_line_one: body.shipping_address[key].address_line_one,
                    address_line_two: body.shipping_address[key].address_line_two,
                    city: body.shipping_address[key].city,
                    state_id: body.shipping_address[key].state_id,
                    country_id: body.shipping_address[key].country_id,
                    zip_code: body.shipping_address[key].zip_code,
                    created_by: body.created_by,
                    created_at: new Date()
                }
                companyAddress.push(shippingclientAddress)
            }
        } else {
            for (const key in body.billing_address) {
                var shippingclientAddress = {
                    company_id: companyInfo.data[0].id,
                    address_type: 2, // shipping address
                    address_line_one: body.billing_address[key].address_line_one,
                    address_line_two: body.billing_address[key].address_line_two,
                    city: body.billing_address[key].city,
                    state_id: body.billing_address[key].state_id,
                    country_id: body.billing_address[key].country_id,
                    zip_code: body.billing_address[key].zip_code,
                    created_by: body.created_by,
                    created_at: new Date()
                }
                companyAddress.push(shippingclientAddress)
            }
        }
        let excludedKeys = ["address_line_one", "address_line_two", "city"]
        await transactionRepository.store(trx, 'company_address', companyAddress, excludedKeys); // Storing the company information

        // Commit the transaction
        await trx.commit();

        /* Company Activity track */
        activity = {
            company_id: companyInfo.data[0].id,
            referrable_type: 1, //1 for company details
            action_type: 1, //1 for create 
            created_by: body.created_by,
        };
        event.emit('companyActivity', { activity });
        /**Company Activity track*/

        return companyInfo;
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
};

/**
 * Update function to modify a Company Details entry.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Create an object 'updateData' with properties extracted from the request 'body' for updating the company information.
 * - Fetch company details before the update.
 * - Call the 'transactionRepository.update' function to update the company information in the 'companies' table within the transaction.
 * - Handle billing addresses:
 *   + Iterate through 'billing_address' in the request 'body'.
 *   + For each billing address:
 *     - If 'id' exists and is not empty:
 *       + Update the existing billing address in the 'company_address' table based in id.
 *     - If 'id' is empty or doesn't exist:
 *       + Check if a billing address already exists for the company.
 *       + If an existing billing address is found, update it with the new data.
 *       + If no existing billing address is found, store the new billing address in the 'company_address' table.
 * - Handle shipping addresses:
 *   + Iterate through 'shipping_address' in the request 'body'.
 *   + For each shipping address:
 *     - If 'id' exists and is not empty:
 *       + Update the existing shipping address in the 'company_address' table.
 *     - If 'id' is empty or doesn't exist:
 *       + Check if a shipping address already exists for the company.
 *       + If an existing shipping address is found, update it with the new data.
 *       + If no existing shipping address is found, store the new shipping address in the 'company_address' table.
 * - Commit the transaction after successfully updating and storing data.
 * - Fetch company details after the update.
 * - Perform activity tracking by emitting an event for updating the company details.
 * - Return the response with information about the updated company record.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 *
 * @param {Object} body - The request body containing updated Company Details.
 * @param {Object} condition - The conditions to identify the company to update.
 * @returns {Object} Repository response.
 */
const update = async (body, condition) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()

        /* Creating update entry object */
        var updateData = {
            name: body.name,
            net_pay_terms_id: body.net_pay_terms_id ? body.net_pay_terms_id : null,
            same_as_above: body.same_as_above,
            updated_by: body.updated_by,
            updated_at: new Date()
        };
        /* Creating update entry object */

        /**Fetching company details before update */
        const beforeUpdateData = await getCompanyDetails({ 'companies.id': condition.id });
        /**Fetching company details before update */

        var repositoryResponse = await transactionRepository.update(trx, 'companies', condition, updateData); // Update the company information

        let billingAddress = body.billing_address;
        let excludedKeys = ["address_line_one", "address_line_two", "city"];

        for (const key in billingAddress) {

            let updatedBillindAddress = {
                company_id: condition.id,
                address_type: 1,
                address_line_one: billingAddress[key].address_line_one,
                address_line_two: billingAddress[key].address_line_two,
                city: billingAddress[key].city,
                state_id: billingAddress[key].state_id,
                country_id: billingAddress[key].country_id,
                zip_code: billingAddress[key].zip_code,
                updated_by: body.updated_by,
                updated_at: new Date()
            }
            await transactionRepository.update(trx, 'company_address', { id: billingAddress[key].id }, updatedBillindAddress, null, excludedKeys);
        }

        let shippingAddress = body.shipping_address;
        if (body.same_as_above == 'false') {
            for (const key in shippingAddress) {
                let updatedShippingAddress = {
                    company_id: condition.id,
                    address_type: 2,
                    address_line_one: shippingAddress[key].address_line_one,
                    address_line_two: shippingAddress[key].address_line_two,
                    city: shippingAddress[key].city,
                    state_id: shippingAddress[key].state_id,
                    country_id: shippingAddress[key].country_id,
                    zip_code: shippingAddress[key].zip_code
                }
                await transactionRepository.update(trx, 'company_address', { id: shippingAddress[key].id }, updatedShippingAddress, null, excludedKeys);
            }
        } else {
            for (const key in billingAddress) {
                let updatedbillAddress = {
                    company_id: condition.id,
                    address_type: 2,
                    address_line_one: billingAddress[key].address_line_one,
                    address_line_two: billingAddress[key].address_line_two,
                    city: billingAddress[key].city,
                    state_id: billingAddress[key].state_id,
                    country_id: billingAddress[key].country_id,
                    zip_code: billingAddress[key].zip_code,
                    updated_by: body.updated_by,
                    updated_at: new Date()
                }
                await transactionRepository.update(trx, 'company_address', { id: shippingAddress[key].id }, updatedbillAddress, null, excludedKeys);
            }
        }

        // Commit the transaction
        await trx.commit();

        /* Company Activity track */

        /**Fetching company details after update */
        const afterUpdateData = await getCompanyDetails({ 'companies.id': condition.id });
        /**Fetching company details after update */
        activity = {
            company_id: repositoryResponse.data[0].id,
            referrable_type: 1, //1 for company details
            action_type: 2, //2 for update 
            created_by: body.created_by,
            beforeUpdate: beforeUpdateData,
            afterUpdate: afterUpdateData
        };
        event.emit('companyActivity', { activity });
        /**Company Activity track*/

        return repositoryResponse
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
};

/**
 * Get Company Details function to retrieve information about a company.
 *
 * Logic:
 * - Define the fields to fetch for company details.
 * - Fetch company details from the 'companies' table based on the provided condition and fields using the 'indexRepository.find' function.
 * - Define additional fields and joins for fetching address details.
 * - Fetch billing and shipping address details based on the company's ID.
 * - Map the fetched data to a structured response.
 * - Return the response with company details and associated addresses.
 *
 * @param {Object} condition - The condition specifying which company details to retrieve.
 * @returns {Object} Response with company details and addresses.
 */
const getCompanyDetails = async (condition) => {
    const joins = [
        {
            table: 'net_pay_terms as net_pay',
            alias: 'net_pay',
            condition: ['net_pay.id', 'companies.net_pay_terms_id'],
            type: 'left'
        },
    ];
    const fields = ['companies.id', 'companies.name', 'companies.reference_id', 'companies.status', 'companies.net_pay_terms_id', 'companies.same_as_above', 'net_pay.days']; // fields to fetch

    var companies = await indexRepository.find('companies', fields, condition, null, joins);
    let companyData = companies.data[0];

    // Condition

    // Fields to fetch
    let addressFields = ['company_address.id', 'company_address.company_id', 'address_type', 'address_line_one', 'address_line_two', 'city', 'company_address.state_id', 'states.name as state_name', 'company_address.country_id', 'countries.name as country_name', 'company_address.zip_code'];

    // Tables to join
    let addressJoins = [
        { table: 'countries', alias: 'countries', condition: ['company_address.country_id', 'countries.id'] },
        { table: 'states', alias: 'states', condition: ['company_address.state_id', 'states.id'] }
    ];

    let billingAddressCondition = { 'company_address.company_id': companyData.id, 'company_address.address_type': 1 };
    var billingAddress = await indexRepository.find('company_address', addressFields, billingAddressCondition, null, addressJoins);  // Fetching company communication address

    let shippingAddressCondition = { 'company_address.company_id': companyData.id, 'company_address.address_type': 2 };
    var shippingAddress = await indexRepository.find('company_address', addressFields, shippingAddressCondition, null, addressJoins); // Fetching company shippind address

    /* Variables */
    var listingObject = '';
    /* Variables */

    /* Using Map to iterate the loop and prepare the response */
    listingObject = {
        'Name': companyData.name,
        'Reference Id': companyData.reference_id,
        'Status': companyData.status ,
        'Net Pay Term': companyData.days ? companyData.days : '-',
        'Address Line 1': billingAddress.data[0].address_line_one,
        'Address Line 2': billingAddress.data[0].address_line_two ? billingAddress.data[0].address_line_two : '-',
        'Country': billingAddress.data[0].country_name,
        'State': billingAddress.data[0].state_name,
        'City': billingAddress.data[0].city,
        'Zip code': billingAddress.data[0].zip_code,
        'Same As Above': companyData.same_as_above ? 'Yes' : 'No',
        'Shipping Address Line 1': companyData.same_as_above ? '-' : shippingAddress.data[0].address_line_one,
        'Shipping Address Line 2': companyData.same_as_above ? '-' : shippingAddress.data[0].address_line_two ? shippingAddress.data[0].address_line_two : '-',
        'Shipping Country': companyData.same_as_above ? '-' : shippingAddress.data[0].country_name,
        'Shipping State': companyData.same_as_above ? '-' : shippingAddress.data[0].state_name,
        'Shipping City': companyData.same_as_above ? '-' : shippingAddress.data[0].city,
        'Shipping Zip code': companyData.same_as_above ? '-' : shippingAddress.data[0].zip_code,
    }

    return listingObject;
}

/**
 * Index function to retrieve Company Details based on the provided condition.
 *
 * Logic:
 * - Define the default fields to fetch from the 'companies' table.
 * - Fetch Company Details from the 'companies' table based on the provided condition using the 'indexRepository.find' function.
 * - If Company Details data exists:
 *   + Extract and structure the data into a 'listingObject'.
 *   + Fetch Billing and Shipping Addresses from 'company_address' for the company and include them in the 'listingObject'.
 *   + Return the response object with status true and the Company Details in the 'listingObject'.
 * - Else (data is not found):
 *   + Return a response object with status true and an empty data array.
 *
 * @param {Object} condition - The conditions to filter Company Details.
 * @returns {Object} Response with Company Details.
 */

const index = async (condition) => {

    const joins = [
        { table: 'net_pay_terms as net_pay', alias: 'net_pay', condition: ['net_pay.id', 'companies.net_pay_terms_id'], type: 'left' },
    ];
    const fields = ['companies.id', 'companies.name', 'companies.reference_id', 'companies.same_as_above', 'companies.net_pay_terms_id', 'net_pay.days']; // fields to fetch
    var companies = await indexRepository.find('companies', fields, condition, null, joins);
    if (companies.status) {

        let companyData = companies.data[0];

        // Fields to fetch
        let addressFields = ['company_address.id', 'company_address.address_type', 'company_address.address_line_one', 'company_address.address_line_two', 'company_address.city', 'company_address.state_id', 'company_address.country_id', 'company_address.zip_code', 'states.name as state_name', 'countries.name as country_name'];

        // Tables to join
        let addressJoins = [
            { table: 'countries', alias: 'countries', condition: ['company_address.country_id', 'countries.id'] },
            { table: 'states', alias: 'states', condition: ['company_address.state_id', 'states.id'] }
        ];

        let billingAddressCondition = { 'company_address.company_id': companyData.id, 'company_address.address_type': 1 };
        var billingAddress = await indexRepository.find('company_address', addressFields, billingAddressCondition, null, addressJoins);  // Fetching company communication address

        let shippingAddressCondition = { 'company_address.company_id': companyData.id, 'company_address.address_type': 2 };
        var shippingAddress = await indexRepository.find('company_address', addressFields, shippingAddressCondition, null, addressJoins); // Fetching company shippind address

        /* Variables */
        let listingObject = '';
        let total_details = companies.data[0];
        let client_profile_status = await checkProfileCompletePercentage(total_details.id)
        /* Variables */

        /* Using Map to iterate the loop and prepare the response */
        listingObject = {
            id: total_details.id,
            name: total_details.name,
            reference_id: total_details.reference_id,
            status: total_details.status,
            same_as_above: total_details.same_as_above,
            net_pay_terms_id: total_details.net_pay_terms_id ? total_details.net_pay_terms_id : '',
            days: total_details.days ? total_details.days : '',
            shipping_address: shippingAddress.status ? shippingAddress.data : [],
            billing_address: billingAddress.status ? billingAddress.data : [],
            profile_percentage: client_profile_status.percentage,
            is_contacts_exists: client_profile_status.is_contacts_exists,
            is_invoice_configured: client_profile_status.is_invoice_configured,
            is_timesheet_configured: client_profile_status.is_timesheet_configured,
        }
        return { status: true, data: listingObject };
    } else {
        return { status: true, data: [] };
    }
}

/**
 * Listing function to retrieve a paginated list of Company Details based on the provided condition, page, and limit.
 *
 * Logic:
 * - Define the fields to fetch from the 'companies' table.
 * - Fetch Company Details with pagination based on the provided condition, page, and limit using the 'indexRepository.findByPagination' function.
 * - If Company Details data exists:
 *   + Map through the retrieved data and structure each company's information into a 'listingObject'.
 *   + Retrieve contact email and contact number for the current company using the 'company_contacts' table..
 *   + Push each 'listingObject' into the 'responseData' array.
 *   + Return the response object with status true, the 'responseData' array containing Company Details, and pagination details.
 * - Else (data is not found):
 *   + Return the response object from the 'companyDetails'.
 *
 * @param {Object} condition - The conditions to filter Company Details.
 * @param {number} page - The page number for pagination.
 * @param {number} limit - The maximum number of records to retrieve per page.
 * @returns {Object} Response with a paginated list of Company Details.
 */
const listing = async (condition, page, limit) => {
    const companiesListing = await indexRepository.rawQuery(`SELECT * FROM GetCompaniesListingInformation(${condition.is_draft}, ${condition.status}, '${condition.entity_type}', ${condition.search}, ${limit}, ${page})`);

    if (companiesListing) {
        const total_companies_count = companiesListing[0]?.total_companies_count;
        await Promise.all(companiesListing.map(company => {
            delete company.total_companies_count;
            company.id = company.companyid;
            company.name = company.company_name;
            company.contact_number = company.contactnumber;
            company.mobile_number = company.mobilenumber;
            company.status = company.status;
            company.reference_id = company.reference;
            delete company.companyid, delete company.company_name, delete company.contactnumber, delete company.isactive, delete company.reference, delete company.mobilenumber;
        }));

        pagination_details = {
            total: total_companies_count,
            currentPage: page,
            perPage: limit,
            totalPages: Math.ceil(total_companies_count / limit)
        }

        return {
            status: true,
            data: companiesListing,
            pagination_data: pagination_details
        }
    } else {
        return companiesListing;
    }
};

const dashboard = async (condition) => {
    const db = await getConnection();
    let data = [];

    let startDate;
    let endDate;
    let interval;

    let receivedAmount = `SELECT SUM(total_received_amount) FROM ledger_payments WHERE company_id = '${condition.id}' AND deleted_at IS NULL`;

    let overDueAmount = `SELECT (SELECT SUM(amount)  FROM ledgers WHERE amount != 0 AND company_id = '${condition.id}'  AND due_date < CURRENT_DATE AND deleted_at IS NULL ) AS total_amount`;

    var receivedAmountDetails = await indexRepository.rawQuery(receivedAmount);
    var overDueAmountDetails = await indexRepository.rawQuery(overDueAmount);


    if (condition.year) {
        startDate = condition.year + '01' + '01';
        endDate = condition.year + '12' + '31';
        interval = '1 month';
    }

    // Overall Data
    let overAllData = await db.raw(`SELECT * FROM GetCompanyDashboardData('${condition.id}')`);

    // Graph Data
    const graphData = await db.raw(`SELECT * FROM GetCompanyInvoiceAmount('${condition.id}', '${startDate}',  '${endDate}', '${interval}')`);
    overAllData = overAllData.rows[0];
    overAllData.balance_amount = overAllData.total_invoice_raised - overAllData.received_amount;

    let series = [];

    // Prepare series data
    series.push({
        name: 'Invoice Raised Amount',
        data: graphData.rows.map(entry => entry.invoice_raised_amount),
        color: '#318CF1'
    });

    series.push({
        name: 'Payment Received Amount',
        data: graphData.rows.map(entry => entry.payment_received_amount),
        color: '#77D2B7',
        width: '20px'
    });

    data.push({
        received_amount : parseFloat(receivedAmountDetails[0]?.sum) || 0,
        over_due_amount : parseFloat(overDueAmountDetails[0]?.total_amount) || 0,
        series: series,
        labels: ['Invoices Raised', 'Payments Received'],
        xaxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        }
    });

    if (data.length > 0) {
        return { status: true, data: data };
    } else {
        return dashboardData;
    }
}


/**
 * Update Company Status function to modify the status of a company.
 *
 * Logic:
 * - Create an update entry object with properties for changing the company status.
 * - Fetch the company's status before the update.
 * - Update the company's status based on the provided condition using 'indexRepository.update'.
 * - Fetch the company's status after the update.
 * - Perform activity tracking by emitting an event for updating the company status.
 * - Return the repository response.
 *
 * @param {Object} body - The request body containing information for updating the company's status.
 * @param {Object} condition - The conditions to identify the company to update.
 * @returns {Object} Repository response.
 */
const updateStatus = async (body, condition) => {
    /* Creating update entry object */
    var updateData = {
        status: body.status,
        updated_by: body.updated_by,
        updated_at: new Date()
    };
    /* Creating update entry object */

    /**Fetching company details before update */
    const beforeData = await indexRepository.find('companies', ['status'], condition);
    const beforeUpdateData = { Status: beforeData.data[0].status }
    /**Fetching company details before update */

    var repositoryResponse = await indexRepository.update('companies', condition, updateData); // Update the company information

    /**Fetching company details before update */
    const afterData = await indexRepository.find('companies', ['status'], condition);
    const afterUpdateData = { Status: afterData.data[0].status  }
    /**Fetching company details before update */

    activity = {
        company_id: repositoryResponse.data[0].id,
        referrable_type: 1, //1 for company details
        action_type: 2, //2 for update 
        created_by: body.created_by,
        beforeUpdate: beforeUpdateData,
        afterUpdate: afterUpdateData
    };
    event.emit('companyActivity', { activity });
    /**Company Activity track*/

    return repositoryResponse
};

/**
 * Destroy (soft delete) company-related records based on the provided condition.
 *
 * Logic:
 * - Establish a database connection and create a transaction using 'getConnection' and 'db.transaction'.
 * - Define a 'companyData' object to soft delete the company record. It includes setting 'status' to false, 'deleted_at', 'updated_at', and 'updated_by'.
 * - Use 'transactionRepository.update' to update the 'companies' table with the 'companyData' and the provided 'condition'.
 * - Create a 'deleteData' object with 'deleted_at', 'updated_at', and 'updated_by' for soft deletion of associated records.
 * - Update 'company_address' and 'company_contacts' tables with the 'deleteData' using 'transactionRepository.update'.
 * - Commit the transaction to persist the changes in the database.
 * - Determine 'slug_name' based on the type of the company.
 * - Emit an event for activity tracking, indicating the deletion action with relevant details.
 * - Return the repository response.
 *
 * @param {Object} body - The request body containing information about the deletion.
 * @param {Object} condition - The conditions to identify the company and associated records for deletion.
 * @returns {Object} Repository response.
 * @throws {Object} - If an error occurs during the transaction or rollback.
 */
const destroy = async (body, condition) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()

        /**
         * Softdelete i.e update object in company table
         */
        var companyData = {
            status: 'In Active',
            deleted_at: new Date(),
            updated_at: new Date(),
            updated_by: body.updated_by
        };

        var repositoryResponse = await transactionRepository.update(trx, 'companies', condition, companyData); // update in company table

        var deleteData = {
            deleted_at: new Date(),
            updated_at: new Date(),
            updated_by: body.updated_by
        }
        await transactionRepository.update(trx, 'company_address', { company_id: condition.id }, deleteData); // update in company address table

        await transactionRepository.update(trx, 'company_contacts', { company_id: condition.id }, deleteData); // update in company contacts table

        // Commit the transaction
        await trx.commit();

        /* Company Activity track */
        activity = {
            company_id: condition.id,
            referrable_type: 1, //1 for company details
            action_type: 3, //1 for create 
            created_by: body.created_by
        };
        event.emit('companyActivity', { activity });
        /**Company Activity track*/

        return repositoryResponse;
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

/**
 * Retrieve Company Dropdown Data function to fetch a list of companies based on the provided condition.
 *
 * Logic:
 * - Use 'indexRepository.find' to retrieve a list of companies from 'companies' table based on provided condition.
 * - If data is found:
 *    - Create a response object containing company details.
 *    - Return the response with the company list.
 * - If no data is found, return the response from 'indexRepository.find' as-is.
 *
 * @param {Object} condition - The conditions to filter the company list.
 * @returns {Object} Repository response.
 */

const dropdown = async (condition) => {
    var comapnyList = await indexRepository.find('companies', ['id', 'name as value', 'reference_id'], condition, 0, [], null, null, null, null, ["id", "name"]);
    if (comapnyList.status) {

        /* Default Variables */
        var responseData = [];
        var totalDetails = comapnyList.data;
        /* Default Variables */

        for (const key in totalDetails) {
            const listingObject = {
                id: totalDetails[key].id,
                name: totalDetails[key].value,
                reference_id: totalDetails[key].reference_id
            };
            responseData.push(listingObject)
        }

        return { status: true, data: responseData };
    } else {
        return comapnyList;
    }
};

/**
 * Udate fnction to update company profile.
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
 * @param {Object} body - The request body containing Company Details.
 * @returns {Object} Repository response.
 */
const updateProfile = async (body, condition) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()

        const destFolder = `${body.loginSubDomainName}/companies/${body.slug_name}-Documents/${body.reference_id}`

        var documents = body.documents
        for (const key in documents) {
            if (documents[key].new_document_id != '' && documents[key].new_document_id != null) {

                // Fetch document details from temporary document records (in 'temp_upload_documents') using the provided 'new_document_id'.
                let documentCondition = { id: documents[key].new_document_id }
                let documentData = await indexRepository.find('temp_upload_documents', ['*'], documentCondition, null, [], null, null, null, false)

                // Move the document file to the specified destination folder ('destFolder') using the generated unique file name.
                let file = await fetchAndMoveDocument(documentData.data, destFolder, documentData.data[0].document_name)

                // create a new entry for each document 
                let fileData = {
                    logo_document_url: (`${config.documentUrl}${destFolder}/${file}`).replace(/ /g, '%20'),
                    logo_document_path: `${destFolder}/${file}`,
                }

                const docData = await indexRepository.find('companies', ['logo_document_url as document_url', 'id'], condition)
                await destroyDocument(docData, destFolder); // Remove the existing document path

                // Update the 'companies' record with the document information by calling 'transactionRepository.update'.
                const repositoryResponse = await transactionRepository.update(trx, 'companies', condition, fileData)

                // Remove the temporary document record (from 'temp_upload_documents') as it is no longer needed after the document has been successfully processed.
                await transactionRepository.destroy(trx, 'temp_upload_documents', { id: documentData.data[0].id })

                //commit the transaction
                await trx.commit();

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
 * Checks ownership details of an ID based on given conditions.
 *
 * @param {object} condition - Conditions for checking ownership details.
 * @returns {object} - Result containing the percentage completion of ownership details.
 *
 * Logic:
 * - Fetch details related to the provided conditions from the 'companies' table.
 * - If the fetch operation is successful:
 *   - Calculate the percentage of ownership details completion based on entity type.
 *   - Determine the number of filled values and total expected values for different entity types:
 *     - For 'client' entity type: ID, invoice configuration ID, timesheet configuration ID, company contacts ID are considered.
 *     - For 'end-client' or 'vendor' entity types: ID and company contacts ID are considered.
 *   - Calculate the completion percentage based on the ratio of filled values to total expected values.
 * - Return the calculated completion percentage in the response object.
 * - If the fetch operation fails, return an empty array in the response.
 */
const checkProfileCompletePercentage = async (company_id) => {
    let profile_status = {
        "percentage": 100,
        "is_contacts_exists": true,
        "is_timesheet_configured": true,
        "is_invoice_configured": true,
    }
    const joins = [
        { table: 'company_contacts', condition: ['company_contacts.company_id', 'companies.id'], type: 'left' },
    ];
    const fields = ['companies.id', 'companies.entity_type', 'companies.invoice_configuration_id', 'companies.timesheet_configuration_id', 'company_contacts.id as company_contacts_id']; // fields to fetch
    var companies = await indexRepository.find('companies', fields, { 'companies.id': company_id }, null, joins);
    if (companies.status) {
        let completedTillNow;
        let totalValues;
        if (companies.data[0].entity_type === 'client') {
            completedTillNow = [companies.data[0]?.id, companies.data[0]?.invoice_configuration_id, companies.data[0]?.timesheet_configuration_id, companies.data[0]?.company_contacts_id].filter(Boolean).length;
            profile_status.is_contacts_exists = companies.data[0]?.company_contacts_id ? true : false;
            profile_status.is_invoice_configured = companies.data[0]?.invoice_configuration_id ? true : false;
            profile_status.is_timesheet_configured = companies.data[0]?.timesheet_configuration_id ? true : false;
            totalValues = 4;
        } else {
            completedTillNow = [companies.data[0]?.id, companies.data[0]?.company_contacts_id].filter(Boolean).length;
            profile_status.is_contacts_exists = companies.data[0]?.company_contacts_id ? true : false;
            totalValues = 2;
        }
        profile_status.percentage = (completedTillNow / totalValues) * 100;
        return profile_status;
    } else {
        return 0;
    }
}

/**
 * Add Company Address Function to add a new address top a company.
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Use the 'transactionRepository.store' function to store all created company address objects.
 * - Commit the transaction after successfully storing all data.
 * - Perform activity tracking by emitting an event for creating a new company record.
 * - Return the response with information about the stored company record.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 *
 * @param {object} body - The request body containing Company Address Details.
 * @returns {Object} Repository response.
 */
const companyAddress = async (body) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()

        let address = {
            company_id: body.company_id,
            address_type: body.address_type,
            address_line_one: body.address_line_one,
            address_line_two: body.address_line_two,
            city: body.city,
            state_id: body.state_id,
            country_id: body.country_id,
            zip_code: body.zip_code,
            created_by: body.created_by,
            created_at: new Date()
        };

        let excludedKeys = ["address_line_one", "address_line_two", "city"];

        if (body.id != '' && body.id) {
            /**Fetching company details before update */
            let beforeUpdateData = await getCompanyDetails({ 'companies.id': body.company_id });
            /**Fetching company details before update */

            let companyInfo = await transactionRepository.update(trx, 'company_address', { id: body.id }, address, null, excludedKeys); // Storing the company information

            await trx.commit(); // Commit the transaction

            /**Fetching company details after update */
            let afterUpdateData = await getCompanyDetails({ 'companies.id': body.company_id });
            /**Fetching company details after update */

            /**Company Activity track*/
            let activity = {
                company_id: body.company_id,
                referrable_type: 1, //1 for company details
                action_type: 2, //2 for update 
                created_by: body.created_by,
                beforeUpdate: beforeUpdateData,
                afterUpdate: afterUpdateData
            };
            event.emit('companyActivity', { activity });
            /**Company Activity track*/

            return companyInfo;

        } else {
            let companyInfo = await transactionRepository.store(trx, 'company_address', address, excludedKeys); // Storing the company information

            await trx.commit(); // Commit the transaction

            /* Company Address Activity track */
            let activity = {
                company_id: body.company_id,
                referrable_type: 5, //1 for company details
                action_type: 1, //1 for create 
                created_by: body.created_by,
            };
            event.emit('companyActivity', { activity });
            /* Company Address Activity track */

            return companyInfo;
        }


    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }

}

/**
 * getCompanyAddress function to retrieve company addreses.
 *   + Map through the retrieved data and structure each company's shipping and billing information into a 'listingObject'.
 *   + Push each 'listingObject' into the 'responseData' array.
 *   + Return the response object with status true, the 'responseData' array containing Company Details, and pagination details.
 * - Else (data is not found):
 *   + Return the response object from the 'addresses'.
 * 
 * @param {object} condition - The condition to get Company Address Details.
 * @returns {object} Response with a list of Company Address Details.
 */
const getCompanyAddress = async (condition) => {

    const joins = [
        {
            table: 'states',
            condition: ['states.id', 'company_address.state_id'],
            type: 'left'
        },
        {
            table: 'countries',
            condition: ['countries.id', 'company_address.country_id'],
            type: 'left'
        }
    ];

    // Generating the client refernce id based on prefixes
    const addresses = await indexRepository.find('company_address', ['states.name as state_name', 'countries.name as country_name', '*', 'company_address.id'], condition, null, joins);

    if (addresses) {
        return {
            status: true,
            data: addresses.data
        }
    } else {
        return addresses;
    }
}

module.exports = { destroy, dropdown, index, listing, updateStatus, store, update, updateProfile, dashboard, companyAddress, getCompanyAddress };
