const documentRepository = require('../../repositories/common/documentRepository');
const indexRepository = require('../../repositories/index');
const config = require('../../../../../config/app');
const fs = require('fs');
const path = require('path');

/**
 * @param documentsData object.
 * @param tenant_id String -UUID
 * @return Json
 *
 * create a new object and send to repository to insert the document and return the response to controller.
 */
const create = async (documentsData, tenant_id = null) => {
  const repositoryResponse = await documentRepository.store(documentsData, tenant_id);
  return repositoryResponse;
};

const store = async (req) => {
  const destFolder = `${req.subdomain_name}/Employee/Invite-Employee-Document`;
  const fileInfo = [];
  await Promise.all(req.files.map(async (file, i) => {
    const pathToUpload = config.documentUploadPath +'/'+ destFolder;
    const newRecord = {
      document_name: file.originalname,
      document_url: `${config.documentUrl}${destFolder}/${file.filename}`,
      document_path: `${pathToUpload}/${file.filename}`,
      created_at: new Date(),
    };
    const createDocumentEntry = await documentRepository.storeCommon('invited_employee_documents', newRecord);
    const format = path.extname(createDocumentEntry[0].document_path);
    file = String(req.body.file_id + format);
    const fileName = String(createDocumentEntry[0].id + format);

    // Read the file
    const data = fs.readFileSync(path.join(pathToUpload, file));

    // Write the file to the destination directory
    fs.writeFileSync(path.join(pathToUpload, fileName), data);

    fileInfo.push({
      id: createDocumentEntry[0].id,
      document_url: createDocumentEntry[0].document_url
    });
  }));
  return fileInfo;
}

/**
 * form the new update object
 * call repository function to update the collection based on condition.
 *
 * @param {object} body
 * @return Json
 *
 */
const update = async (condition, updateData) => {
  const repositoryResponse = await indexRepository.update('temp_upload_documents', condition, updateData);
  return repositoryResponse;
};

/**
 * form the new update object
 * call repository function to update the collection based on condition.
 *
 * @param {object} condition
 * @return Json
 *
 */
const find = async (condition, tenant_id = null) => {
  const repositoryResponse = await documentRepository.find(condition, tenant_id);
  return repositoryResponse;
};

const destroy = async (condition) => {
  const repositoryResponse = await indexRepository.destroy('temp_upload_documents', condition);
  return repositoryResponse;
};

/**
 * @param documentsData object.
 * @return Json
 *
 * create a new object and send to repository to insert the document and return the response to controller.
 */
const chatDocumentCreate = async (documentsData) => {
  const repositoryResponse = await indexRepository.store('chat_documents', documentsData);
  return repositoryResponse;
};

/**
 * form the new update object
 * call repository function to update the collection based on condition.
 *
 * @param {object} body
 * @return Json
 *
 */
const chatDocumentUpdate = async (condition, updateData) => {
  const repositoryResponse = await indexRepository.update('chat_documents', condition, updateData);
  return repositoryResponse;
};

/**
 * form the new update object
 * call repository function to update the collection based on condition.
 *
 * @param {object} condition
 * @return Json
 *
 */
const chatDocumentFind = async (condition) => {
  const repositoryResponse = await indexRepository.find('chat_documents', ['*'], condition);
  return repositoryResponse;
};

module.exports = { create, store, update, find, destroy, chatDocumentCreate, chatDocumentUpdate, chatDocumentFind };
