const indexRepository = require("../../repositories/index")
const { event } = require('../../../../../events/companyActivityEvent');

/**
 * Store function to create new contact entries for a company.
 *
 * Logic:
 * - Initialize empty arrays for 'contactNames' and 'contacts'.
 * - Iterate through 'contacts' in the request 'body' and create a new contact object for each key.
 * - Create a 'newCompanyContact' object with properties extracted from the request 'body'.
 * - Push the 'display_name' from the 'newCompanyContact' object into the 'contactNames' array.
 * - Push the 'newCompanyContact' object into the 'contacts' array.
 * - Call the 'indexRepository.store' function to store the new contact information in the 'company_contacts' table.
 * - Determine the 'slug_name' based on the entity type provided in the request 'body'.
 * - Perform activity tracking by emitting an event for creating new contact records.
 * - Return the repository response with information about the stored contact records.
 * 
 * @param {Object} body - The request body containing contact details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {
    /**Variable */
    var contactNames = []
    var contacts = []
    /**Variable */

    for (const key in body.contacts) {
        /* Creating new object */
        var newCompanyContact = {
            company_id: body.company_id,
            first_name: body.contacts[key].first_name,
            middle_name: body.contacts[key].middle_name,
            last_name: body.contacts[key].last_name,
            display_name: body.contacts[key].first_name + ' ' + (body.contacts[key].middle_name == '' || body.contacts[key].middle_name == null ? '' : body.contacts[key].middle_name + ' ') + body.contacts[key].last_name,
            contact_number: body.contacts[key].contact_number ? body.contacts[key].contact_number : null,
            email_id: body.contacts[key].email_id,
            ext: body.contacts[key].ext ? body.contacts[key].ext : null,
            mobile_number: body.contacts[key].mobile_number ? body.contacts[key].mobile_number : null,
            created_by: body.created_by,
            created_at: new Date()
        };
        /* Creating new object */
        contactNames.push(newCompanyContact.display_name)
        contacts.push(newCompanyContact)
    }

    var repositoryResponse = await indexRepository.store('company_contacts', contacts);

    /* Company Activity track */
    // activity = {
    //     company_id: repositoryResponse.data[0].company_id,
    //     referrable_type: 2, //2 for company contact details
    //     action_type: 1, //1 for create 
    //     created_by: body.created_by,
    // };
    // event.emit('companyActivity', { activity });
    activity = {
        company_id: body.company_id,
        referrable_type: 2, //2 for company contact details
        action_type: 1, //1 for create 
        created_by: body.created_by,
    };
    event.emit('companyActivity', { activity });
    /**Company Activity track*/

    return repositoryResponse;
};

/**
 * Update function to update contact entries for a company.
 *
 * Logic:
 * - Fetch the existing contact data for the given condition.
 * - Retrieve the updated contact data from the request 'body'.
 * - Iterate through the updated contact data and determine whether to update existing contacts or create new ones.
 * - For each contact:
 *   + If an 'id' exists, it's an existing contact, so update the contact with new data using 'indexRepository.update'.
 *   + If no 'id' exists, it's a new contact, so create a new contact using 'indexRepository.store'.
 * - Fetch the contact data after the update.
 * - Determine the 'slug_name' based on the entity type provided in the request 'body'.
 * - Perform activity tracking by emitting an event for updating contact records.
 * - Return the repository response.
 * 
 * @param {Object} body - The request body containing updated contact details.
 * @param {Object} condition - The condition to identify the contacts to update.
 * @returns {Object} Repository response.
 */
const update = async (body, condition) => {

    /**Fetching ClientContact data before update */
    const beforeUpdateData = await getCompanyContactDetails(condition)
    /**Fetching ClientContact data before update */

    let companyContacts = body.contacts;
    for (const key in companyContacts) {

        var updateData = {
            company_id: condition.company_id,
            first_name: companyContacts[key].first_name,
            middle_name: companyContacts[key].middle_name,
            last_name: companyContacts[key].last_name,
            display_name: companyContacts[key].first_name + ' ' + (companyContacts[key].middle_name ? companyContacts[key].middle_name : '' + ' ') + companyContacts[key].last_name,
            contact_number: companyContacts[key].contact_number ? companyContacts[key].contact_number : null,
            email_id: companyContacts[key].email_id,
            ext: companyContacts[key].ext ? companyContacts[key].ext : null,
            mobile_number: companyContacts[key].mobile_number ? companyContacts[key].mobile_number : null,
        }

        if (companyContacts[key].id != null && companyContacts[key].id != '') {
            updateData.updated_by = body.updated_by
            updateData.updated_at = new Date()
            var repositoryResponse = await indexRepository.update('company_contacts', { id: companyContacts[key].id }, updateData);
        } else {
            updateData.created_by = body.created_by,
                updateData.created_at = new Date()
            var repositoryResponse = await indexRepository.store('company_contacts', updateData);
        }
    }

    /* Company Contact Details Activity track */

    /**Fetching company details after update */
    const afterUpdateData = await getCompanyContactDetails(condition);
    /**Fetching company details after update */

    activity = {
        company_id: body.id,
        referrable_type: 2, //2 for company contact details
        action_type: 2, //2 for update 
        created_by: body.created_by,
        beforeUpdate: beforeUpdateData?.data[0],
        afterUpdate: afterUpdateData?.data[0]
    };
    event.emit('companyActivity', { activity });
    /* Company Contact Details Activity track */

    return repositoryResponse
};

/**
 * Get Company Contact Details function to retrieve information about a company's contact details.
 *
 * Logic:
 * - Define default variables such as 'fields' for fetching contact details.
 * - Fetch company contact details from the 'company_contacts' table based on the provided condition and fields using the 'indexRepository.find' function.
 * - Map the fetched data to a structured response.
 * - Return the response with company contact details.
 *
 * @param {Object} condition - The condition specifying which company contact details to retrieve.
 * @returns {Object} Response with company contact details.
 */
const getCompanyContactDetails = async (condition) => {

    /**Default variable */
    const listingData = [];
    let fields = ['id', 'first_name', 'middle_name', 'last_name', 'display_name', 'contact_number', 'email_id', 'ext', 'mobile_number']; // Fields to fetch
    /**Default variable */

    var clientContactsData = await indexRepository.find('company_contacts', fields, condition); // Fetch the client mapped contacts details
    if (clientContactsData.status) {

        /* Variables */
        var total_details = clientContactsData.data;
        /* Variables */

        /* Using Map to iterate the loop and prepare the response */
        for (const key in total_details) {
            const item = total_details[key];
            const listingObject = {
                id: item.id,
                'First Name': item.first_name,
                'Middle Name': item.middle_name ? item.middle_name : '-',
                'Last Name': item.last_name,
                'Display Name': item.display_name,
                'Phone Number': item.contact_number ? item.contact_number : '-',
                'Email Id': item.email_id ? item.email_id : '-',
                'Extension': item.ext ? item.ext : '-',
                'Mobile Number': item.mobile_number ? item.mobile_number : '-',
            };
            listingData.push(listingObject);
        }
    }

    var responseData = { data: listingData }

    return responseData
}

/**
 * Destroy (soft delete) contact entries based on the provided condition.
 *
 * Logic:
 * - Create a delete entry object with properties for soft deletion.
 * - Call the 'indexRepository.update' function to update the 'company_contacts' table with the soft delete data.
 * - Perform activity tracking by emitting an event for contact deletion.
 * - Return the repository response.
 *
 * @param {Object} body - The request body containing information about the deletion.
 * @param {Object} condition - The conditions to identify the contacts for deletion.
 * @returns {Object} Repository response.
 */
const destroy = async (body, condition) => {

    /* Creating delete entry object */
    var updateData = {
        deleted_at: new Date(),
        updated_at: new Date(),
        updated_by: body.updated_by
    };
    /* Creating delete entry object */

    var repositoryResponse = await indexRepository.update('company_contacts', condition, updateData); // update in client contact table

    /* Delete Company Contact Details Activity track */
    activity = {
        company_id: body.company_id,
        referrable_type: 2, //2 for company contact details
        action_type: 3, //3 for delete 
        created_by: body.created_by
    };
    event.emit('companyActivity', { activity });
    /* Delete Company Contact Details Activity track */

    return repositoryResponse;
};

/**
 * Index function to retrieve contact details based on the provided condition.
 * 
 * Logic:
 * - Define the fields to fetch from the 'company_contacts' table.
 * - Fetch contact details from the 'company_contacts' table based on the provided condition using the 'indexRepository.find' function.
 * - If contact data exists:
 *   + Create an empty 'responseData' array to structure the response.
 *   + Map the repository response data (companyContactData.data) to 'total_details'.
 *   + Iterate through the 'total_details' and format each contact into a 'listingObject'.
 *   + Push the 'listingObject' into the 'responseData' array.
 *   + Return the response object with status true and the contact details in the 'responseData' array.
 * - Else (data is not found):
 *   + Return the repository response, which may contain a status and data array.
 *    
 * @param {Object} condition - The conditions to filter contact details.
 * @returns {Object} Response with contact details.
 */
const index = async (condition) => {
    // Define the fields to fetch from the 'company_contacts' table.
    let fields = ['id', 'first_name', 'middle_name', 'last_name', 'display_name', 'contact_number', 'email_id', 'ext', 'mobile_number']; // Fields to fetch

    // Fetch contact details from the 'company_contacts' table based on the provided condition.
    var companyContactData = await indexRepository.find('company_contacts', fields, condition); // Fetch the client mapped contacts details

    if (companyContactData.status) {

        /* Variables */
        var responseData = [];
        var total_details = companyContactData.data;
        /* Variables */

        // Iterate through 'total_details' and format each contact into a 'listingObject'.
        for (const key in total_details) {
            const listingObject = {
                id: total_details[key].id,
                first_name: total_details[key].first_name,
                middle_name: total_details[key].middle_name ? total_details[key].middle_name : '',
                last_name: total_details[key].last_name,
                display_name: total_details[key].display_name,
                contact_number: total_details[key].contact_number,
                email_id: total_details[key].email_id,
                ext: total_details[key].ext,
                mobile_number: total_details[key].mobile_number,
            };
            responseData.push(listingObject)
        }
        // Return the response object with status true and the contact details in the 'responseData' array.
        return { status: true, data: responseData };
    } else {
        // Return the repository response, which may contain a status and data array.
        return companyContactData;
    }
}

module.exports = { destroy, index, store, update };
