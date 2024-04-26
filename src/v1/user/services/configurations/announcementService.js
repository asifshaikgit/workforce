const indexRepository = require('../../repositories/index');
const moment = require('moment')
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');
const format = require('../../../../../helpers/format');
const { fetchAndMoveDocument, destroyDocument } = require('../../../../../helpers/globalHelper');
const config = require('../../../../../config/app')
const { event } = require('../../../../../events/configurationActivityEvent');

/**
 * Store function to create a new announcement record and associate documents.
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Iterate through the provided documents in the request body.
 * - For each document with a new ID, fetch details from the 'temp_upload_documents' table.
 * - Check if a document with a similar name already exists in 'announcements'.
 * - Move the document to the specified destination folder and update the document mapping.
 * - Update the 'announcements' table with the document information.
 * - Delete the processed document record from 'temp_upload_documents'.
 * - Commit the transaction if all operations are successful; otherwise, rollback.
 * - Track the activity for the stored announcement.
 * 
 * @param {Object} body - The request body containing announcement data and associated documents.
 * @returns {Object} - An object containing the status of the operation.
 * @throws {Error} - If an error occurs during document processing or database transactions.
 */
const store = async (body) => {

    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()

        // Destination folder for storing documents
        const destFolder = `${body.loginSubDomainName}/Announcement/${body.expression_type}`

        var announcamentData = null;
        // Iterate through provided documents
        var documents = body.documents
        for (const key in documents) {
            // Check if a new document ID exists.
            if (documents[key].new_document_id != '') { 

                // fetch document details from temp document records
                var documentData = await indexRepository.find('temp_upload_documents', ['*'], { id: documents[key].new_document_id}, null, [], 0, null, null, false)

                 // Generate a unique file name based on existing documents count
                const count = await indexRepository.count('announcements', {global_search: `"document_name" ilike '%${documentData.data[0].document_name}%'`});
                const fileName = count.data == 0 ? documentData.data[0].document_name : documentData.data[0].document_name + '- (' + (Number(count.data))+ ')';

                // move file to destionation folder
                var file = await fetchAndMoveDocument(documentData.data, destFolder, fileName)
                
                // Update object
                let fileData = {
                    expression_type: body.expression_type_id,
                    document_name: fileName,
                    document_url: (`${config.documentUrl}${destFolder}/${file}`).replace(/ /g, '%20'),
                    aws_s3_key: `${destFolder}/${file}`,
                    created_by: body.created_by,
                    created_at: new Date()
                };

                // Store documents information
                announcamentData = await transactionRepository.store(trx, 'announcements', fileData); // Update the documents informations
                await transactionRepository.destroy(trx, 'temp_upload_documents', {id: documents[key].new_document_id  });
            }
        }
        
        await trx.commit();

        /**Activity track */
        const activity = {
            referrable_id: announcamentData.data[0].id,
            referrable_type: 36, //36 for announcement
            action_type: 1,
            created_by: body.created_by,
        };
        // await db('employee_activity_track').insert(activity);
        event.emit('configurationStoreActivity', { activity });

        return { status: true, data: announcamentData.data[0]}
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
        await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

/**
 * Publish function to update the publish date for an existing announcement.
 * 
 * Logic:
 * - Update the 'announcements' table with the provided 'publish_date'.
 * - Track the activity related to the announcement publication.
 * 
 * @param {Object} body - The request body containing the updated publish date.
 * @param {Object} condition - The condition to identify the announcement for updating.
 * @returns {void}
 * @throws {Error} - If an error occurs during the update operation.
 */
const publish = async (body, condition) => {
    // Update the 'announcements' table with the new 'publish_date'
    await indexRepository.update('announcements', condition, {publish_date: body.publish_date });// updating the value

    /**Activity track */
    const activity = {
        referrable_id: condition.id,
        referrable_type: 36, //36 for announcement
        action_type: 2,
        created_by: body.created_by,
    };
    // await db('employee_activity_track').insert(activity);
    event.emit('configurationStoreActivity', { activity });
};

/**
 * Destroy function to mark an announcement as deleted and delete associated files.
 * 
 * Logic:
 * - Update the 'announcements' table to mark the announcement as deleted.
 * - Fetch document details for the announcement.
 * - Delete associated files using 'destroyDocument' function.
 * - Track the activity related to the announcement destory.
 * 
 * @param {Object} body - The request body containing additional details.
 * @param {Object} condition - The condition to identify the announcement for deletion.
 * @returns {void}
 * @throws {Error} - If an error occurs during the deletion process.
 */
const destroy = async (body, condition) => {

    // Update the 'announcements' table to mark the announcement as deleted
    await indexRepository.update('announcements', condition, {deleted_at: new Date()});// updating the value

    // Fetch document details for the announcement
    var docData = await indexRepository.find('announcements', ['*'], condition);

    // Path to the destination folder for documents
    var _pathDest = `${body.loginSubDomainName}/Announcement/${body.expression_type}`
    
    // Delete associated files using 'destroyDocument' function
    await destroyDocument(docData, _pathDest); // Destroy the existing document

    /**Activity track */
    const activity = {
        referrable_id: condition.id,
        referrable_type: 36, //36 for announcement
        action_type: 3,
        created_by: body.created_by,
    };
    // await db('employee_activity_track').insert(activity);
    event.emit('configurationDeleteActivity', activity );
};

/**
 * Announcement Listing function to retrieve details of announcements based on a specified condition.
 * 
 * Logic:
 * - Retrieve the date format for proper date formatting.
 * - Fetch announcement details from the 'announcements' table based on the given condition.
 * - Process the retrieved data to create a response array with relevant details.
 * 
 * @param {Object} condition - The condition to filter announcements.
 * @returns {Object} - An object containing the status and data of the retrieved announcements.
 */
const announcementListing = async (condition) => {

    // Retrieve the date format for proper date formatting
    let dateFormat = await format.getDateFormat();

    // Initialize an empty array to store the response data.
    let responseData = [];

    // Fetch announcement details from the 'announcements' table based on the given condition
    var announcementData = await indexRepository.find('announcements', ['*'], condition);

    // Process the retrieved data to create a response array with relevant details
    if (announcementData.status) { 
        const totalDetails = announcementData.data;
        for (const key in totalDetails) {
            const listingDataObject = { 
                id: totalDetails[key].id,
                document_name: totalDetails[key].document_name,
                document_url: totalDetails[key].document_url,
                publish_date: totalDetails[key].publish_date ? moment(totalDetails[key].publish_date).format(dateFormat) : '',
                is_published: totalDetails[key].publish_date != null ? true : false,
            }
            responseData.push(listingDataObject)
        }
        // Return a response object with a status of 'true' and the retrieved data.
        return {
            status: true,
            data: responseData
        }
    } else {
        // Return a response object with a status of 'false' and an empty data array
        return {
            status: false,
            data: responseData
        }
    }
}


module.exports = { store, destroy, publish,announcementListing }