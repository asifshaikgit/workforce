const indexRepository = require("../../repositories/index")
const { event } = require('../../../../../events/endClientActivityTrack');
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');

/**
 * Deactivates and deletes an end client and updates the associated end client contacts.
 * @param {Object} body - The request body containing the necessary data.
 * @returns {Promise<Object>} - A promise that resolves to the repository response.
 */
const destroy = async (body) => {
    let trx;
    try{
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        var condition = { id: body.end_client_id }; // Conditon

        /* Creating delete entry object */
        var updateData = {
            is_active: false,
            deleted_at: new Date(),
            updated_at: new Date(),
            updated_by: body.updated_by
        };
        /* Creating delete entry object */

        /* Creating delete entry object */
        var updatedData = {
            deleted_at: new Date(),
            updated_at: new Date(),
            updated_by: body.updated_by
        };
        /* Creating delete entry object */

        var repositoryResponse = await transactionRepository.update(trx, 'end_clients', condition, updateData); // update in end client table
        transactionRepository.update(trx, 'end_client_contacts', { end_client_id: condition.id }, updatedData); // Update in end client contacts table
        /** Activity track */
        activity = {
            end_client_id: body.end_client_id,
            end_client_name : body.end_client_name,
            reference_id : body.reference_id,
            action_type: 3,
            created_by: body.updated_by,
        }
        event.emit("endClientDeleteActivity", activity)
        /** Activity track */

        // Commit the transaction
        await trx.commit();
        // Commit the transaction

        return repositoryResponse;
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
};

/**
 * Deactivates and deletes an end client contact.
 * @param {Object} body - The request body containing the necessary data.
 * @returns {Promise<Object>} - A promise that resolves to the repository response.
 */
const contactDestroy = async (body) => {

    var condition = { id: body.end_client_contacts_id }; // Conditon

    /* Creating delete entry object */
    var updatedData = {
        deleted_at: new Date(),
        updated_at: new Date(),
        updated_by: body.updated_by
    };
    /* Creating delete entry object */

    var repositoryResponse = indexRepository.update('end_client_contacts', { id: condition.id }, updatedData); // Update in end client contacts table
    /** Activity track */
    activity = {
        end_client_id: body.end_client_id,
        end_client_name : body.end_client_name,
        reference_id : body.reference_id,
        contact_name : body.display_name,
        action_type: 3,
        created_by: body.updated_by,
    }
    event.emit("endClientDeleteActivity", activity)
    /** Activity track */
    return repositoryResponse;
};


/**
 * Retrieves a dropdown list of end clients based on the given condition.
 * @param {any} condition - The condition to filter the end clients.
 * @returns {Promise<{status: boolean, data: Array<{id: string, name: string}>}>} - A promise that resolves to an object containing the status and data of the dropdown list. If the status is true, the data will be an array of objects with id and name properties representing the end clients. If the status is false, the data will be an empty array.
 */
const dropdown = async (condition) => {

    var endClientList = await indexRepository.find('end_clients', ['id', 'name'], condition, 0);
    if (endClientList.status) {

        /* Variables */
        var listingObject = [];
        var responseData = [];
        var totalDetails = endClientList.data;
        /* Variables */

        /**
        * Using Map to return the required response.
        */
        listingData = await totalDetails.map(async (item) => {
            listingObject = {
                id: item.id,
                name: item.name
            };
            return listingObject;
        });

        /* Using promise to wait till the address map completes. */
        responseData = await Promise.all(listingData);
        /*using promise to wait till the map function completes.*/

        return { status: true, data: responseData };
    } else {
        return endClientList;
    }
};

/**
 * Retrieves a list of dropdown contact options based on the given condition.
 * @param {any} condition - The condition to filter the contacts by.
 * @returns {Promise<{ status: boolean, data: any[] } | any>} - A promise that resolves to an object with a status indicating success or failure, and a data array containing the contact options if successful.
 */
const dropdownContact = async (condition) => {

    /*calling find method from end clients Repository*/
    var endClientContacts = await indexRepository.find('end_client_contacts', ['id', 'display_name'], condition, 0);
    if (endClientContacts.status) {

        /* Variables */
        var listingObject = [];
        var responseData = [];
        var totalDetails = endClientContacts.data;
        /* Variables */

        /**
        * Using Map to return the required response.
        */
        listingData = await totalDetails.map(async (item) => {
            listingObject = {
                id: item.id,
                display_name: item.display_name
            };
            return listingObject;
        });

        /* Using promise to wait till the address map completes. */
        responseData = await Promise.all(listingData);
        /*using promise to wait till the map function completes.*/

        return { status: true, data: responseData };
    } else {
        return endClientContacts;
    }
};


/**
 * Retrieves end clients and their associated contact information based on the given condition.
 * @param {object} condition - The condition to filter the end clients.
 * @returns {object} - An object containing the status and data of the retrieved end clients and their contacts.
 */
const index = async (condition) => {

    /* Query Join Information */
    const fields = ['end_clients.id', 'end_clients.name', 'end_clients.reference_id', 'end_clients.is_draft', 'end_clients.is_active', 'end_clients.address_line_one', 'end_clients.address_line_two', 'end_clients.city', 'end_clients.state_id',  'states.name as state_name', 'countries.name as country_name', 'end_clients.country_id', 'end_clients.zipcode']; // fields to fetch
    let addressJoins = [
        { table: 'countries as countries', alias: 'countries', condition: ['end_clients.country_id', 'countries.id'] },
        { table: 'states as states', alias: 'states', condition: ['end_clients.state_id', 'states.id'] }
    ];
    var filter = { 'end_clients.id': condition.end_client_id };
    /* Query Join Information */

    var endClients = await indexRepository.find('end_clients', fields, filter, 0, addressJoins);

    if (endClients.status) {

        let contactsCondition = { 'end_client_id': endClients.data[0].id } // End client contacs info
        var endClientContacts = await indexRepository.find('end_client_contacts', ['id', 'first_name', 'middle_name', 'last_name', 'display_name', 'contact_number', 'email_id', 'ext', 'mobile_number'], contactsCondition); //endClientInformation

        /* Variables */
        var listingObject = '';
        var total_details = endClients.data;
        /* Variables */

        /* Using Map to iterate the loop and prepare the response */
        listingObject = {
            id: total_details[0].id,
            name: total_details[0].name,
            reference_id: total_details[0].reference_id,
            is_draft: total_details[0].is_draft,
            is_active: total_details[0].is_active,
            address_line_one: total_details[0].address_line_one,
            address_line_two: total_details[0].address_line_two,
            city: total_details[0].city,
            state_id: total_details[0].state_id,
            state_name: total_details[0].state_name,
            country_id: total_details[0].country_id,
            country_name: total_details[0].country_name,
            zip_code: total_details[0].zip_code,
            contacts: endClientContacts.data
        }
        return { status: true, data: listingObject };
    } else {
        return endClients;
    }
}


/**
 * Retrieves a paginated list of end clients based on the given conditions.
 * @param {object} condition - The conditions to filter the end clients.
 * @param {number} page - The page number of the results.
 * @param {number} limit - The maximum number of results per page.
 * @param {string} sort_column - The column to sort the results by.
 * @param {string} sort_order - The order to sort the results in (either 'asc' or 'desc').
 * @returns {object} - An object containing the paginated list of end clients and pagination details.
 */
const listing = async (condition, page, limit, sort_column, sort_order) => {

    /* Query Join Information */
    const fields = ['end_clients.id', 'end_clients.name', 'end_clients.reference_id', 'end_clients.is_draft', 'end_clients.is_active', 'end_clients.address_line_one', 'end_clients.address_line_two', 'end_clients.city', 'end_clients.state_id',  'states.name as state_name', 'countries.name as country_name', 'end_clients.country_id', 'end_clients.zipcode','create.display_name as create_emp','update.display_name as updated_emp']; // fields to fetch
    let addressJoins = [
        { table: 'countries as countries', alias: 'countries', condition: ['end_clients.country_id', 'countries.id'] },
        { table: 'states as states', alias: 'states', condition: ['end_clients.state_id', 'states.id'] },
        { table: 'employee as create', alias: 'create', condition: ['end_clients.created_by', 'create.id'], type: 'left', ignoreDeletedAt: true },
        { table: 'employee as update', alias: 'update', condition: ['end_clients.updated_by', 'update.id'], type: 'left', ignoreDeletedAt: true }
    ];
    /* Query Join Information */

    sort_order = sort_order.toLowerCase() === 'desc' ? 'desc' : 'asc'; // Sort columns

    if (sort_column) {
        if (sort_column === 'city') {
            sort_column = 'end_clients.city';
        } else if (sort_column === 'name') {
            sort_column = 'end_clients.name';
        }
    } else {
        sort_column = 'end_clients.created_at';
    }

    var endClients = await indexRepository.findByPagination('end_clients', fields, condition, addressJoins, page, limit, sort_column, sort_order, true);  // End clients information

    if (endClients.status) {

        /* Variables */
        var listingObject = [];
        var responseData = [];
        var total_details = endClients.data;
        var pagination_details = endClients.pagination;
        /* Variables */

        /**
         * Using Map to return the required response.
         */
        serial_no = (page - 1) * limit + 1;
        listingData = await total_details.map(async (item) => {
            listingObject = {
                serial_no: serial_no,
                id: item.id,
                name: item.name,
                reference_id: item.reference_id,
                is_draft: item.is_draft,
                is_active: item.is_active,
                address_line_one: item.address_line_one,
                address_line_two: item.address_line_two,
                city: item.city,
                state_id: item.state_id,
                state_name: item.state_name,
                country_id: item.country_id,
                country_name: item.country_name,
                zipcode: item.zipcode,
                created_by: (item.create_emp != null ? item.create_emp : 'System'),
                updated_by: (item.updated_emp != null ? item.updated_emp : '')
            };
            serial_no++;
            return listingObject;
        });
        responseData = await Promise.all(listingData);
        /*using promise to wait till the map function completes.*/

        return { status: true, data: responseData, pagination_data: pagination_details };
    } else {
        return endClients;
    }
};

/**
 * Stores a new end client and their associated contacts in the database.
 * @param {Object} body - The request body containing the end client and contact information.
 * @returns {Promise<Object>} - A promise that resolves to the stored end client information.
 */
const store = async (body) => {
    let trx;
    try{
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        const count = await indexRepository.count('end_clients', [], [], false);

        // Generating the client refernce id based on prefixes
        const prefix = await indexRepository.find('prefixes', ['prefix_name', 'separator', 'number'], { slug: 'end-client' });
        const prefixData = prefix.data[0];
        var reference_id = prefixData.prefix_name + prefixData.separator + (Number(count) + prefixData.number)

        /* Creating new object */
        var newEndClients = {
            name: body.name,
            reference_id: body.reference_id ? body.reference_id : reference_id,
            is_draft: body.is_draft,
            is_active: body.is_active,
            address_line_one: body.address_line_one,
            address_line_two: body.address_line_two,
            city: body.city,
            state_id: body.state_id,
            country_id: body.country_id,
            zipcode: body.zipcode,
            created_by: body.created_by,
            created_at: new Date()
        };
        /* Creating new object */

        let endClienInfo = await transactionRepository.store(trx, 'end_clients', newEndClients); // Storing the end client information

        var contacts = []
        for (const key in body.contacts) {
            /* Creating new object */
            var newEndClientContact = {
                end_client_id: endClienInfo.data[0].id,
                first_name: body.contacts[key].first_name,
                middle_name: body.contacts[key].middle_name,
                last_name: body.contacts[key].last_name,
                display_name: body.contacts[key].first_name + ' ' + (body.contacts[key].middle_name == '' || body.contacts[key].middle_name == null ? '' : body.contacts[key].middle_name + ' ') + body.contacts[key].last_name,
                contact_number: body.contacts[key].contact_number != '' ? body.contacts[key].contact_number : null,
                email_id: body.contacts[key].email_id,
                ext: body.contacts[key].ext != '' ? body.contacts[key].ext : null,
                mobile_number: body.contacts[key].mobile_number != '' ? body.contacts[key].mobile_number : null,
                created_by: body.created_by,
                created_at: new Date()
            };
            /* Creating new object */
            contacts.push(newEndClientContact)
        }

        await transactionRepository.store(trx, 'end_client_contacts', newEndClientContact); // Storing the client contact information;
        /**Activity Track */
        var activity = {
            end_client_id : endClienInfo.data[0].id,
            end_client_name : body.name,
            reference_id : body.reference_id,
            action_type: 1, //1 for create 
            created_by: body.created_by,
        }
        event.emit('endClientStoreActivity', { activity});
        /**Activity track */

        // Commit the transaction
        await trx.commit();
        // Commit the transaction

        return endClienInfo;
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
};

/**
 * Updates the end client data and contacts in the database.
 * @param {Object} body - The request body containing the updated data.
 * @returns None
 */
const update = async (body) => {
    let trx;
    try{
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection
        
        /* Writing condition to the update entry */
        var condition = { id: body.end_client_id }
        /* Writing condition to the update entry */

        /**Fetching End client data before update */
        const beforeUpdateData = await getEndClientDetails(condition)
        /**Fetching End client data before update */

        /* Creating update entry object */
        var updateData = {
            name: body.name,
            reference_id: body.reference_id,
            is_draft: body.is_draft,
            is_active: body.is_active,
            address_line_one: body.address_line_one,
            address_line_two: body.address_line_two,
            city: body.city,
            state_id: body.state_id,
            country_id: body.country_id,
            zipcode: body.zipcode,
            updated_by: body.updated_by,
            updated_at: new Date()
        };
        /* Creating update entry object */

        const responseData = await transactionRepository.update(trx, 'end_clients', condition, updateData); // Update the client information

        /**
         * Updates or stores end client contacts based on the provided body object.
         * @param {object} body - The body object containing the contact information.
         * @returns None
         */
        let endClientContacts = body.contacts;
        for (const key in endClientContacts) {

            if (body.contacts[key].id != '' && body.contacts[key].id != null) {
                var newclientContacts = {
                    end_client_id: body.end_client_id,
                    first_name: body.contacts[key].first_name,
                    middle_name: body.contacts[key].middle_name,
                    last_name: body.contacts[key].last_name,
                    display_name: body.contacts[key].first_name + ' ' + (body.contacts[key].middle_name == '' || body.contacts[key].middle_name == null ? '' : body.contacts[key].middle_name + ' ') + body.contacts[key].last_name,
                    contact_number: body.contacts[key].contact_number != '' ? body.contacts[key].contact_number : null,
                    email_id: body.contacts[key].email_id,
                    ext: body.contacts[key].ext != '' ? body.contacts[key].ext : null,
                    mobile_number: body.contacts[key].mobile_number != '' ? body.contacts[key].mobile_number : null,
                    updated_by: body.updated_by,
                    updated_at: new Date()
                }
                transactionRepository.update(trx, 'end_client_contacts', { 'id': body.contacts[key].id }, newclientContacts);
            }
            else {
                /* Creating new object */
                var newclientContacts = {
                    end_client_id: body.end_client_id,
                    first_name: body.contacts[key].first_name,
                    middle_name: body.contacts[key].middle_name,
                    last_name: body.contacts[key].last_name,
                    display_name: body.contacts[key].first_name + ' ' + (body.contacts[key].middle_name == '' || body.contacts[key].middle_name == null ? '' : body.contacts[key].middle_name + ' ') + body.contacts[key].last_name,
                    contact_number: body.contacts[key].contact_number != '' ? body.contacts[key].contact_number : null,
                    email_id: body.contacts[key].email_id,
                    ext: body.contacts[key].ext != '' ? body.contacts[key].ext : null,
                    mobile_number: body.contacts[key].mobile_number != '' ? body.contacts[key].mobile_number : null,
                    created_by: body.created_by,
                    created_at: new Date()
                };
                transactionRepository.store(trx, 'end_client_contacts', newclientContacts);
                /* Creating new object */
            }
        }

        // Commit the transaction
        await trx.commit();
        // Commit the transaction

        /**Fetching End client data before update */
        const afterUpdateData = await getEndClientDetails(condition)
        /**Fetching End client data before update */

        /* Activity track store */
        activity = {
            end_client_id: body.end_client_id,
            action_type: 2,
            created_by: body.updated_by,
        }
        event.emit("endClientUpdateActivity", { activity, beforeUpdateData, afterUpdateData })
        /* Activity track store */

         return responseData
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

const getEndClientDetails = async (condition) => {

    /* Query Join Information */
    const fields = ['end_clients.id', 'end_clients.name', 'end_clients.reference_id', 'end_clients.is_draft', 'end_clients.is_active', 'end_clients.address_line_one', 'end_clients.address_line_two', 'end_clients.city', 'end_clients.state_id',  'states.name as state_name', 'countries.name as country_name', 'end_clients.country_id', 'end_clients.zipcode']; // fields to fetch
    let addressJoins = [
        { table: 'countries as countries', alias: 'countries', condition: ['end_clients.country_id', 'countries.id'] },
        { table: 'states as states', alias: 'states', condition: ['end_clients.state_id', 'states.id'] }
    ];
    var filter = { 'end_clients.id': condition.id };
    /* Query Join Information */

    /**Variable */
    var listingObject = {}
    var contactInfo = []
    /**Variable */

    var endClients = await indexRepository.find('end_clients', fields, filter, 0, addressJoins);
    if (endClients.status) {

        let contactsCondition = { 'end_client_id': endClients.data[0].id } // End client contacs info
        var endClientContacts = await indexRepository.find('end_client_contacts', ['id', 'first_name', 'middle_name', 'last_name', 'display_name', 'contact_number', 'email_id', 'ext', 'mobile_number'], contactsCondition); //endClientInformation

        if (endClientContacts.status) {
            for (let key in endClientContacts.data) {
              let contactObject = {
                id: endClientContacts.data[key].id,
                'First Name' : endClientContacts.data[key].first_name,
                'Middle Name': endClientContacts.data[key].middle_name ? endClientContacts.data[key].middle_name : '-',
                'Last Name' : endClientContacts.data[key].last_name,
                'Email Id' : endClientContacts.data[key].email_id,
                'Moblie Number' : endClientContacts.data[key].mobile_number ? endClientContacts.data[key].mobile_number : '-',
                'Extension': endClientContacts.data[key].ext ? endClientContacts.data[key].ext : '-',
                'Contact Number': endClientContacts.data[key].contact_number ? endClientContacts.data[key].contact_number : '-' ,
                'Display Name': endClientContacts.data[key].display_name
              }
              contactInfo.push(contactObject)
            }
          }

        /* Using Map to iterate the loop and prepare the response */
        listingObject = {
            'End Client Name': endClients.data[0].name,
            'Reference Id': endClients.data[0].reference_id,
            'Address Line': endClients.data[0].address_line_one,
            'Alternate Address Line': endClients.data[0].address_line_two ? endClients.data[0].address_line_two : '-',
            'Country': endClients.data[0].country_name,
            'State': endClients.data[0].state_name,
            'City': endClients.data[0].city,
            'zipcode': endClients.data[0].zipcode,
            'contacts' : contactInfo
        }
    }

    return listingObject
}

module.exports = { destroy, contactDestroy, dropdown, dropdownContact, index, listing, store, update };
