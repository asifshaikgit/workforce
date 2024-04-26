const { event } = require('../../../../../events/configurationActivityEvent');
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');
const indexRepository = require('../../repositories/index');
const moment = require('moment');
const { getOnBoardingDocumentData } = require('./commonService');

/**
 * Store function to store on boarding document types data
 * 
 * Logic:
 *  - Establish database connection and start a transaction
 *  - Generate slug for the name value
 *  - Create an object to add on boarding document types data
 *  - Store on boarding document types data in the database using a transaction
 *  - Commit the transaction
 *  - Store on boarding document type activity track
 *  - Return success status and stored data if operation was successful
 *  - If any error occurs, handle it, rollback the transaction, and return error status with the error message
 * 
 * @param {object} body - The request body containing on boarding document types data.
 * @returns {object} An object containing status and data/error message.
 */
const store = async (body) => {
    let trx;
    try {

        // Databse connection
        const db = await getConnection();
        trx = await db.transaction();

        var slug = `${body.name.toLowerCase().replace(/\s+/g, '-')}`; // getting slug for the value

        // create obj to add on boarding document types data
        const storeObj = {
            name: body.name,
            description: body.description,
            is_mandatory: body.is_mandatory,
            status: body.status,
            slug: slug
        }
        var onBoardingDocumentType = await transactionRepository.store(trx, 'onboarding_document_types', storeObj);

        // Commit the transaction
        await trx.commit();

        return {
            status: true,
            data: onBoardingDocumentType.data
        }
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return {
            status: false,
            error: error.message
        };
    }
}

/**
 * Update function to update on boarding document types data
 * 
 * Logic:
 *  - Establish database connection and start a transaction
 *  - Get on boarding document types data before update
 *  - Generate slug for the name value
 *  - Create an object to update on boarding document types data
 *  - Update on boarding document types data in the database using a transaction
 *  - Commit the transaction
 *  - If update operation was successful, initiate on boarding document type activity track
 *  - Return success status and updated data if operation was successful
 *  - If any error occurs, handle it, rollback the transaction, and return error status with the error message
 * 
 * @param {object} body - The request body containing updated on boarding document types data.
 * @returns {object} An object containing status and data/error message.
 */
const update = async (body) => {
    let trx;

    // get on board document types before data
    const beforeUpdateData = await getOnBoardingDocumentData(body.id);

    var slug = `${body.name.toLowerCase().replace(/\s+/g, '-')}`; // getting slug for the value

    // create obj to add on boarding document types data
    const updateObj = {
        name: body.name,
        description: body.description,
        is_mandatory: body.is_mandatory,
        status: body.status,
        slug: slug
    }

    const onBoardingDocumentTypesData = await indexRepository.update('onboarding_document_types', { id: body.id }, updateObj);

    if (onBoardingDocumentTypesData?.status) {
        // initiate on board document type activity track
        activity = {
            referrable_type: 31,
            referrable_id: body.id,
            action_type: 2, // 2 for update
            created_by: body.created_by,
            slug: 'onboarding_document_types'
        };
        event.emit('configurationUpdateActivity', { activity, beforeUpdateData });
        return {
            status: true,
            data: onBoardingDocumentTypesData.data
        }
    } else
        return { status: false, error: error.message };
}



/**
 * Listing function to retrieve on boarding document types data
 * 
 * Logic:
 *  - Retrieve on boarding document types data from the database
 *  - Format the 'created_at' field using the provided dateFormat
 *  - Return retrieved data with formatted 'created_at' field if available
 *  - If no data found, return empty list
 * 
 * @param {string} dateFormat - The format for date conversion.
 * @returns {object} An object containing status and data.
 */
const listing = async (dateFormat) => {

    const joins = [
        { table: 'employee as create', alias: 'create', condition: ['onboarding_document_types.created_by', 'create.id'], type: 'left', ignoreDeletedAt: true },
        { table: 'employee as update', alias: 'update', condition: ['onboarding_document_types.updated_by', 'update.id'], type: 'left', ignoreDeletedAt: true },
    ];

    let listing = await indexRepository.find('onboarding_document_types', ['onboarding_document_types.id', 'onboarding_document_types.name', 'onboarding_document_types.is_editable', 'onboarding_document_types.description', 'onboarding_document_types.is_mandatory', 'onboarding_document_types.status', 'onboarding_document_types.created_at', 'onboarding_document_types.slug', 'onboarding_document_types.updated_at', 'create.display_name as created_by', 'update.display_name as updated_by'], [], null, joins);
    listing = listing.data;
    listing.map(list => {
        list.created_at = moment(list.created_at).format(dateFormat)
        list.updated_at = moment(list.updated_at).format(dateFormat)
    });
    if (listing) {
        return {
            status: true,
            data: listing
        }
    } else {
        return listing;
    }
};

/**
 * Index function to retrieve on boarding document types data based on provided condition
 * 
 * Logic:
 *  - Retrieve on boarding document types data from the database based on provided condition
 *  - Format the 'created_at' field using the provided dateFormat
 *  - Return retrieved data with formatted 'created_at' field if available
 *  - If no data found, return empty list
 * 
 * @param {string} dateFormat - The format for date conversion.
 * @param {object} condition - The condition to filter the data.
 * @returns {object} An object containing status and data.
 */
const index = async (dateFormat, condition) => {
    let index = await indexRepository.find('onboarding_document_types', ['id', 'name', 'is_editable', 'description', 'is_mandatory', 'status', 'created_at', 'slug'], condition);
    index = index.data;
    index.map(list => {
        list.created_at = moment(list.created_at).format(dateFormat)
    });
    if (index) {
        return {
            status: true,
            data: index
        }
    } else {
        return index;
    }
};

/**
 * UpdateStatus function to update status of on boarding document types data based on provided condition
 * 
 * Logic:
 *  - Establish database connection and start a transaction
 *  - Create an object containing update data (status, updated_by, updated_at)
 *  - Call the update repository function to update on boarding document types data
 *  - Commit the transaction
 *  - If update operation was successful, initiate on boarding document type activity track
 *  - Return success status and updated data if operation was successful
 *  - If any error occurs, handle it, rollback the transaction, and return error status with the error message
 * 
 * @param {object} body - The request body containing updated status and updater information.
 * @param {object} condition - The condition to filter the data for update.
 * @returns {object} An object containing status and data/error message.
 */
const updateStatus = async (body, condition) => {

    /* Creating update entry object */
    const updateData = {
        status: body.status,
        updated_by: body.updated_by,
        updated_at: new Date(),
    };
    /* Creating update entry object */

    /**
     *  + Call the update repository function
     *    -Based on the status in update function response, segregate the response and prepare the response
     *
     */

    // get on board document types before data
    const beforeUpdateData = await getOnBoardingDocumentData(condition.id);
    const onBoardingDocumentTypesData = await indexRepository.update('onboarding_document_types', condition, updateData);

    if (onBoardingDocumentTypesData?.status) {
        // initiate on board document type activity track
        activity = {
            referrable_type: 31,
            referrable_id: condition.id,
            action_type: 2, // 2 for update
            created_by: body.created_by,
            slug: 'onboarding_document_types'
        };
        event.emit('configurationUpdateActivity', { activity, beforeUpdateData });

        return {
            status: true,
            data: onBoardingDocumentTypesData.data
        }
    } else {
        return { status: false, error: error.message }
    }
}

/**
 * Destroy function to soft delete on boarding document types data based on provided condition
 * 
 * Logic:
 *  - Create an object containing update data (updated_by, updated_at, deleted_at)
 *  - Call the update repository function to soft delete on boarding document types data
 *  - If update operation was successful, initiate on boarding document type activity track
 *  - Return success status and updated data if operation was successful
 *  - If any error occurs, return error status with the error message
 * 
 * @param {object} body - The request body containing updater information.
 * @param {object} condition - The condition to filter the data for deletion.
 * @returns {object} An object containing status and data/error message.
 */
const destroy = async (body, condition) => {

    /* Creating update entry object */
    const updateData = {
        updated_by: body.updated_by,
        updated_at: new Date(),
        deleted_at: new Date(),
    };
    /* Creating update entry object */

    /**
     *  + Call the update repository function
     *    -Based on the status in update function response, segregate the response and prepare the response
     *
     */

    // get on board document types before data
    const query = await getOnBoardingDocumentTypesQuery(condition.id);
    let beforeUpdate = await indexRepository.rawQuery(query);
    beforeUpdate = beforeUpdate[0];

    const onBoardingDocumentTypesData = await indexRepository.update('onboarding_document_types', condition, updateData);

    if (onBoardingDocumentTypesData?.status) {
        // initiate on board document type activity track
        activity = {
            referrable_type: 31,
            referrable_id: condition.id,
            action_type: 3, // 3 for delete
            created_by: body.created_by,
            beforeUpdate: beforeUpdate,
            query: query
        };
        event.emit('configurationActivityTrack', { activity });

        return {
            status: true,
            data: onBoardingDocumentTypesData.data
        }
    } else {
        return { status: false, error: error.message };
    }
}

module.exports = { store, update, listing, index, updateStatus, destroy }