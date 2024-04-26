require('dotenv').config();
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes, httpCodes } = require('../../../../../constants/responseCodes');
const documentService = require('../../services/common/documentService');
const multer = require('multer');
const { logRequest } = require('../../../../../utils/log');
const config = require('../../../../../config/app');
const uuid = require('uuid');
const uniqueRandomID = uuid.v4();
const { fetchAndMoveDocument } = require('../../../../../helpers/globalHelper');
const fs = require('fs');
const path = require('path');

const documentStorage = multer.diskStorage({
  destination: config.documentUploadPath + '/temp',
  filename: async (req, file, cb) => {
    const randomNumber = Math.floor(Math.random() * Math.floor(987456321));
    const tempFileName = uniqueRandomID + randomNumber;
    req.body.file_id = tempFileName;
    const extension = file.originalname.split('.').pop();
    return cb(null, tempFileName + '.' + extension);

    // let pathToUpload = config.documentUploadPath + '/temp';
    // let newRecord = {
    //   document_name: file.originalname
    // };
    // let createDocumentEntry = await documentService.create(newRecord);
    // if (createDocumentEntry) {
    //   file.id = createDocumentEntry[0].id;
    //   let condition = {
    //     id: createDocumentEntry[0].id
    //   };
    //   let updateData = {
    //     document_url: `${config.documentUrl}/temp/${createDocumentEntry[0].id}${path.extname(file.originalname)}`,
    //     document_path: `${pathToUpload}/${createDocumentEntry[0].id}${path.extname(file.originalname)}`
    //   };
    //   let updateDocumentEntry = await documentService.update(condition, updateData);
    //   if (updateDocumentEntry) {
    //     req.body.uploadError = false;
    //     return cb(null, `${updateDocumentEntry[0].id}${path.extname(file.originalname)}`);
    //   } else {
    //     req.body.uploadError = true;
    //     cb(null, `${responseMessages.common.fail}`);
    //   }
    // } else {
    //   req.body.uploadError = true;
    //   cb(null, `${responseMessages.common.fail}`);
    // }
  },

});

const selfDocumentUpload = multer({
  storage: documentStorage,
  limits: {
    fileSize: 5000000, // 1000000 Bytes = 1 MB
  },
  fileFilter (req, file, cb) {
    if (file.originalname.match(/\.(pdf|docx|PDF|DOCX|png|PNG|jpg|JPG|jpeg|JPEG|xlsx|XLSX|xls|XLS)$/)) {
      req.body.formatError = false;
      req.body.fileAvailable = true;
      req.body.fileName = file.originalname;
    } else {
      req.body.formatError = true;
      req.body.fileAvailable = true;
      req.body.fileName = file.originalname;
    }
    cb(undefined, true);
  },
});

const selfDocumentsStore = async (req, res) => {

  /* Log Request */
  logRequest('info', req, 'Common document upload request');
  /* Log Request */

  if (req.files === undefined || req.files.length === 0) {
    return res.status(httpCodes.code200).send({
      status: responseCodes.codeUnprocessableEntity,
      message: responseMessages.upload.documentNotFound,
      fileName: req.body.fileName,
    });
  } else {
    if (req.body.formatError === false) {
      const fileInfo = [];
      const temp = req.files;
      const pathToUpload = config.documentUploadPath + '/temp';
      for (const key in temp) {
        const newRecord = {
          document_name: temp[key].originalname,
          document_url: `${config.documentUrl}temp/${temp[key].filename}`,
          document_path: `${pathToUpload}/${temp[key].filename}`,
          created_at: new Date(),
        };
        const tenantId = req.body.tenant_id;
        const createDocumentEntry = await documentService.create(newRecord, tenantId);
        const format = path.extname(createDocumentEntry[0].document_path);
        const file = String(temp[key].filename);
        const fileName = String(createDocumentEntry[0].id + format);

        // Read the file
        const data = fs.readFileSync(path.join(pathToUpload, file));

        // Write the file to the destination directory
        fs.writeFileSync(path.join(pathToUpload, fileName), data);

        fileInfo.push({
          id: createDocumentEntry[0].id,
          document_name: createDocumentEntry[0].document_name,
          document_url: createDocumentEntry[0].document_url,
          document_path: createDocumentEntry[0].document_path,
        });
      }
      if (fileInfo.length === 1) {
        await res.status(httpCodes.code200).send({
          statusCode: responseCodes.codeSuccess,
          message: responseMessages.common.success,
          data: fileInfo,
        });
      } else if (fileInfo.length > 1) {
        await res.status(httpCodes.code200).send({
          statusCode: responseCodes.codeSuccess,
          message: responseMessages.common.success,
          data: fileInfo,
        });
      } else {
        await res.status(httpCodes.code200).send({
          statusCode: responseCodes.codeInternalError,
          message: responseMessages.upload.documentNotFound,
        });
      }

    } else {
      return res.status(httpCodes.code200).send({
        status: responseCodes.codeUnprocessableEntity,
        message: responseMessages.upload.invalidImageUploadFormat,
        fileName: req.body.fileName,
      });
    }
  }
};



module.exports = { selfDocumentUpload, selfDocumentsStore };
