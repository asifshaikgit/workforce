const fs = require('fs');
const indexRepository = require('../src/v1/user/repositories/index');
const { destroyDocument, fetchAndMoveDocumentInviteEmployee } = require('./globalHelper');
const transactionRepository = require('../src/v1/user/repositories/transactionRepository');
const config = require('../config/app')

const moveInviteViaLinkDocument = async (db, tablename, destFolder, new_document_id, document_id, sub_domain_name, requestFileName = null) => {
    // fetch document details from temp document records
    var documentData = await indexRepository.find('invited_employee_documents', ['*'], { id: new_document_id }, null, [], 0, null, null, false)
    let modifiedFileName = requestFileName ? requestFileName : documentData.data[0].document_name;
    const count = await indexRepository.count(tablename, { global_search: `"document_name" ilike '%${modifiedFileName}%'` });
    // move file to destionation folder
    const fileName = count.data == 0 ? modifiedFileName : modifiedFileName + '- (' + (Number(count.data)) + ')';
    var file = await fetchAndMoveDocumentInviteEmployee(sub_domain_name, documentData.data, destFolder, fileName)
    // create a new entry for each document 

    const docData = await indexRepository.find('invited_employee_documents', ['document_name as name', 'document_url', 'id', 'document_status'], { id: new_document_id }, 0)
    await destroyDocument(docData, destFolder); // Remove the existing document path

    // Update object
    let fileData = {
        document_name: fileName,
        document_url: (`${config.documentUrl}${destFolder}/${file}`).replace(/ /g, '%20'),
        document_path: `${destFolder}/${file}`
    };

    await transactionRepository.update(db, tablename, { id: document_id }, fileData); // Update the documents informations
    if (new_document_id) {
        await transactionRepository.destroy(db, 'invited_employee_documents', { id: new_document_id }); // Destroy the temporary stored document
    }

    return { status: true }
}

module.exports = moveInviteViaLinkDocument;
