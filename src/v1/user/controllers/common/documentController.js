require('dotenv').config();
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes, httpCodes } = require('../../../../../constants/responseCodes');
const { dbConnection } = require('../../../../../config/database');
const documentService = require('../../services/common/documentService');
const indexRepository = require('../../services/index');
const multer = require('multer');
const { logRequest } = require('../../../../../utils/log');
const config = require('../../../../../config/app');
const uuid = require('uuid');
const uniqueRandomID = uuid.v4();
const fs = require('fs');
const path = require('path');
const InvalidRequestError = require("../../../../../error/InvalidRequestError")

const documentStorage = multer.diskStorage({
  destination: config.documentUploadPath + '/temp',
  filename: async (req, file, cb) => {
    const randomNumber = Math.floor(Math.random() * Math.floor(987456321));
    const tempFileName = uniqueRandomID + randomNumber;
    req.body.file_id = tempFileName;
    const extension = file.originalname.split('.').pop();
    return cb(null, tempFileName + '.' + extension);
  },
});

const documentUpload = multer({
  storage: documentStorage,
  limits: {
    fileSize: 50000000, // 1000000 Bytes = 1 MB
  },
  fileFilter(req, file, cb) {
    let slug = req.path.split('/')[2];
    let allowedFiles;
    let allowedFormats;
    let allowedSize;
    let allowedSizeLimit;
    let noOfFilesAllowed;
    switch (slug) {
      case 'employee-profile':
        allowedFormats = `png|PNG|jpg|JPG|jpeg|JPEG`
        allowedFiles = 'PNG OR JPEG only'
        allowedSize = 10485760
        allowedSizeLimit = '10MB or less. Please upload a smaller file'
        noOfFilesAllowed = 1
        break;
      case 'education-document':
        allowedFormats = `pdf|PDF|docx|DOCX|doc|DOC|png|PNG|jpg|JPG|jpeg|JPEG`
        allowedFiles = 'PDF OR DOC only'
        allowedSize = 26214400
        allowedSizeLimit = '25MB or less. Please upload a smaller file'
        noOfFilesAllowed = 10
        break;
      case 'personal-document':
        allowedFormats = `pdf|PDF|png|PNG|jpg|JPG|jpeg|JPEG`
        allowedFiles = 'PDF,PNG OR JPEG only'
        allowedSize = 26214400
        allowedSizeLimit = '25MB or less. Please upload a smaller file'
        noOfFilesAllowed = 5
        break;
      case 'other-document':
        allowedFormats = `pdf|PDF|docx|DOCX|doc|DOC`
        allowedFiles = 'PDF OR DOC only'
        allowedSize = 26214400
        allowedSizeLimit = '25MB or less. Please upload a smaller file'
        noOfFilesAllowed = 5
        break;
      case 'offboarding-document':
        allowedFormats = `pdf|PDF|png|PNG|jpg|JPG|jpeg|JPEG|doc|DOC|docx|DOCX`
        allowedFiles = 'PDF,PNG OR JPEG only'
        allowedSize = 26214400
        allowedSizeLimit = '25MB or less. Please upload a smaller file'
        noOfFilesAllowed = 1
        break;
      case 'skill-document':
        allowedFormats = `pdf|PDF|doc|DOC|docx|DOCX`
        allowedFiles = 'PDF OR DOCS only'
        allowedSize = 26214400
        allowedSizeLimit = '25MB or less. Please upload a smaller file'
        noOfFilesAllowed = 1
        break;
      case 'passport-document':
        allowedFormats = `pdf|PDF|png|PNG|jpg|JPG|jpeg|JPEG`
        allowedFiles = 'PDF,PNG OR JPEG only'
        allowedSize = 26214400
        allowedSizeLimit = '25MB or less. Please upload a smaller file'
        noOfFilesAllowed = 5
        break;
      case 'copy_of_void_cheque':
        allowedFormats = `pdf|PDF|png|PNG|jpg|JPG|jpeg|JPEG`
        allowedFiles = 'PDF,PNG OR JPEG only'
        allowedSize = 26214400
        allowedSizeLimit = '25MB or less. Please upload a smaller file'
        noOfFilesAllowed = 5
        break;
      case 'visa-document':
        allowedFormats = `pdf|PDF|docx|DOCX|doc|DOC|png|PNG|jpg|JPG|jpeg|JPEG`
        allowedFiles = 'PDF OR DOC only'
        allowedSize = 26214400
        allowedSizeLimit = '25MB or less. Please upload a smaller file'
        noOfFilesAllowed = 10
        break;
      case 'i94-document':
        allowedFormats = `pdf|PDF|png|PNG|jpg|JPG|jpeg|JPEG`
        allowedFiles = 'PDF,PNG OR JPEG only'
        allowedSize = 26214400
        allowedSizeLimit = '25MB or less. Please upload a smaller file'
        noOfFilesAllowed = 5
        break;
      case 'bank-document':
        allowedFormats = `pdf|PDF|png|PNG|jpg|JPG|jpeg|JPEG`
        allowedFiles = 'PDF,PNG OR JPEG only'
        allowedSize = 10485760
        allowedSizeLimit = '10MB or less. Please upload a smaller file'
        noOfFilesAllowed = 5
        break;
      case 'placement-document':
        allowedFormats = `pdf|PDF|png|PNG|jpg|JPG|jpeg|JPEG`
        allowedFiles = 'PDF,PNG OR JPEG only'
        allowedSize = 10485760
        allowedSizeLimit = '10MB or less. Please upload a smaller file'
        noOfFilesAllowed = 5
        break;
      case 'expense-document':
        allowedFormats = `pdf|PDF|png|PNG|jpg|JPG|jpeg|JPEG`
        allowedFiles = 'PDF,PNG OR JPEG only'
        allowedSize = 10485760
        allowedSizeLimit = '10MB or less. Please upload a smaller file'
        noOfFilesAllowed = 5
        break;
      case 'invoice-document':
        allowedFormats = `pdf|PDF|png|PNG|jpg|JPG|jpeg|JPEG`
        allowedFiles = 'PDF,PNG OR JPEG only'
        allowedSize = 10485760
        allowedSizeLimit = '10MB or less. Please upload a smaller file'
        noOfFilesAllowed = 5
        break;
      case 'timesheet-document':
        allowedFormats = `pdf|PDF|png|PNG|jpg|JPG|jpeg|JPEG`
        allowedFiles = 'PDF,PNG OR JPEG only'
        allowedSize = 10485760
        allowedSizeLimit = '10MB or less. Please upload a smaller file'
        noOfFilesAllowed = 5
        break;
      case 'company-logo':
        allowedFormats = `png|PNG|jpg|JPG|jpeg|JPEG`
        allowedFiles = 'PNG OR JPEG only'
        allowedSize = 10485760
        allowedSizeLimit = '10MB or less. Please upload a smaller file'
        noOfFilesAllowed = 1
        break;
      case 'organization-logo':
        allowedFormats = `png|PNG|jpg|JPG|jpeg|JPEG`
        allowedFiles = 'PNG OR JPEG only'
        allowedSize = 10485760
        allowedSizeLimit = '10MB or less. Please upload a smaller file'
        noOfFilesAllowed = 1
        break;
      case 'remainder-documents':
        allowedFormats = `pdf|PDF|png|PNG|jpg|JPG|jpeg|JPEG`
        allowedFiles = 'PDF,PNG OR JPEG only'
        allowedSize = 10485760
        allowedSizeLimit = '10MB or less. Please upload a smaller file'
        noOfFilesAllowed = 5
        break;
      case 'payments-document':
        allowedFormats = `pdf|PDF|png|PNG|jpg|JPG|jpeg|JPEG`
        allowedFiles = 'PDF,PNG OR JPEG only'
        allowedSize = 10485760
        allowedSizeLimit = '10MB or less. Please upload a smaller file'
        noOfFilesAllowed = 5
        break;
      case 'ess-document':
        allowedFormats = `pdf|PDF|png|PNG|jpg|JPG|jpeg|JPEG`
        allowedFiles = 'PDF,PNG OR JPEG only'
        allowedSize = 10485760
        allowedSizeLimit = '10MB or less. Please upload a smaller file'
        noOfFilesAllowed = 5
        break;
      case 'chat-document':
        allowedFormats = `pdf|PDF|png|PNG|jpg|JPG|jpeg|JPEG|docx|DOCX|doc|DOC`
        allowedFiles = 'PDF,PNG,JPEG OR DOCX only'
        allowedSize = 10485760
        allowedSizeLimit = '10MB or less. Please upload a smaller file'
        noOfFilesAllowed = 5
        break;
      case 'announcement-documents':
        allowedFormats = `png|PNG|jpg|JPG|jpeg|JPEG`
        allowedFiles = 'PNG,JPEG OR JPG only'
        allowedSize = 10485760
        allowedSizeLimit = '10MB or less. Please upload a smaller file'
        noOfFilesAllowed = 5
        break;
      default:
        allowedFormats = `pdf|PDF|docx|DOCX|doc|DOC|png|PNG|jpg|JPG|jpeg|JPEG`
        allowedFiles = 'PDF,Docs,PNG OR JPEG only'
        allowedSize = 26214400
        allowedSizeLimit = '25MB or less. Please upload a smaller file'
        noOfFilesAllowed = 5
        break;
    }
    const regexString = `\\.(${allowedFormats})$`;
    const regex = new RegExp(regexString, 'i');
    if (regex.test(file.originalname)) {
      req.body.formatError = false;
      req.body.fileAvailable = true;
      req.body.noOfFilesAllowed = noOfFilesAllowed
      req.body.fileName = file.originalname;
    } else {
      req.body.formatError = true;
      req.body.fileAvailable = true;
      req.body.allowedFiles = allowedFiles;
      req.body.noOfFilesAllowed = noOfFilesAllowed
      req.body.fileName = file.originalname;
    }
    cb(undefined, true);
  },
});

const documentsStore = async (req, res) => {

  /* Log Request */
  logRequest('info', req, 'Common document upload request');
  /* Log Request */

  req.body.subdomain_name = req.subdomain_name;
  req.body.tenant_id = req.tenant_id;
  let allowedSize;
  let allowedSizeLimit;

  switch (req.params.any) {
    case 'employee-profile':
      allowedSize = 10485760
      allowedSizeLimit = '10MB or less. Please upload a smaller file'
      break;
    case 'education-document':
      allowedSize = 26214400
      allowedSizeLimit = '25MB or less. Please upload a smaller file'
      break;
    case 'personal-document':
      allowedSize = 26214400
      allowedSizeLimit = '25MB or less. Please upload a smaller file'
      break;
    case 'other-document':
      allowedSize = 26214400
      allowedSizeLimit = '25MB or less. Please upload a smaller file'
      break;
    case 'offboarding-document':
      allowedSize = 26214400
      allowedSizeLimit = '25MB or less. Please upload a smaller file'
      break;
    case 'skill-document':
      allowedSize = 10485760
      allowedSizeLimit = '10MB or less. Please upload a smaller file'
      break;
    case 'passport-document':
      allowedSize = 26214400
      allowedSizeLimit = '25MB or less. Please upload a smaller file'
      break;
    case 'copy_of_void_cheque':
      allowedSize = 26214400
      allowedSizeLimit = '25MB or less. Please upload a smaller file'
      break;
    case 'visa-document':
      allowedSize = 26214400
      allowedSizeLimit = '25MB or less. Please upload a smaller file'
      break;
    case 'i94-document':
      allowedSize = 26214400
      allowedSizeLimit = '25MB or less. Please upload a smaller file'
      break;
    case 'bank-document':
      allowedSize = 10485760
      allowedSizeLimit = '10MB or less. Please upload a smaller file'
      break;
    case 'placement-document':
      allowedSize = 10485760
      allowedSizeLimit = '10MB or less. Please upload a smaller file'
      break;
    case 'expense-document':
      allowedSize = 10485760
      allowedSizeLimit = '10MB or less. Please upload a smaller file'
      break;
    case 'invoice-document':
      allowedSize = 10485760
      allowedSizeLimit = '10MB or less. Please upload a smaller file'
      break;
    case 'timesheet-document':
      allowedSize = 10485760
      allowedSizeLimit = '10MB or less. Please upload a smaller file'
      break;
    case 'company-logo':
      allowedSize = 10485760
      allowedSizeLimit = '10MB or less. Please upload a smaller file'
      break;
    case 'organization-logo':
      allowedSize = 10485760
      allowedSizeLimit = '10MB or less. Please upload a smaller file'
      break;
    case 'remainder-documents':
      allowedSize = 10485760
      allowedSizeLimit = '10MB or less. Please upload a smaller file'
      noOfFilesAllowed = 5
      break;
    case 'payments-document':
      allowedSize = 10485760
      allowedSizeLimit = '10MB or less. Please upload a smaller file'
      break;
    case 'ess-document':
      allowedSize = 10485760
      allowedSizeLimit = '10MB or less. Please upload a smaller file'
      break;
    case 'chat-document':
      allowedSize = 10485760
      allowedSizeLimit = '10MB or less. Please upload a smaller file'
      break;
    case 'announcement-documents':
      allowedSize = 10485760
      allowedSizeLimit = '10MB or less. Please upload a smaller file'
      break;
    default:
      allowedSize = 26214400
      allowedSizeLimit = '25MB or less. Please upload a smaller file'
      break;
  }
  req.body.fileSizeExceeds = false;
  req.body.allowedSize = allowedSizeLimit;

  for(let file in req.files) {
    const fileSize = req.files[file].size;
    if(fileSize > allowedSize){
      req.body.fileSizeExceeds = true
      req.body.allowedSize = allowedSizeLimit;
      req.body.fileName = req.files[file].originalname;
    }
  }

  if (req.files === undefined || req.files.length === 0) {
    return res.status(httpCodes.code200).send({
      status: responseCodes.codeUnprocessableEntity,
      message: responseMessages.upload.documentNotFound,
      fileName: req.body.fileName,
    });
  } if(req.files.length > req.body.noOfFilesAllowed) {
    return res.status(httpCodes.code200).send({
      status: responseCodes.codeUnprocessableEntity,
      message: responseMessages.upload.noOfFilesExceedsLimit + req.body.noOfFilesAllowed + ' files at a time. Please remove excess files and try again',
      fileName: req.body.fileName,
    });
  } else {
    if (req.body.formatError === false && req.body.fileSizeExceeds === false) {
      const fileInfo = [];
      for (let i = 0; i < req.files.length; i++) {

        let file = req.files[i];
        const pathToUpload = config.documentUploadPath + '/temp';
        const newRecord = {
          document_name: file.originalname,
          document_url: `${config.documentUrl}temp/${file.filename}`,
          document_path: `${pathToUpload}/${file.filename}`,
          created_at: new Date(),
        };
        const tenantId = req.body.tenant_id;
        const createDocumentEntry = await documentService.create(newRecord, tenantId);
        const format = path.extname(createDocumentEntry[0].document_path);
        file = String(req.body.file_id + format);
        const fileName = String(createDocumentEntry[0].id + format);

        // Read the file
        const data = fs.readFileSync(path.join(pathToUpload, file));

        // Write the file to the destination directory
        fs.writeFileSync(path.join(pathToUpload, fileName), data);

        fileInfo.push({
          id: createDocumentEntry[0].id,
          document_url: createDocumentEntry[0].document_url,
          document_name: createDocumentEntry[0].document_name
        });
      };

      if (fileInfo.length === 1) {
        await res.status(httpCodes.code200).send({
          statusCode: responseCodes.codeSuccess,
          message: responseMessages.common.success,
          data: fileInfo[0],
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
 
    } else if (req.body.fileSizeExceeds === true) {
      return res.status(httpCodes.code200).send({
        status: responseCodes.codeUnprocessableEntity,
        message: responseMessages.upload.fileSizeExceedsLimit + req.body.allowedSize,
        fileName: req.body.fileName,
      });
    } else {
      return res.status(httpCodes.code200).send({
        status: responseCodes.codeUnprocessableEntity,
        message: responseMessages.upload.invalidUploadFormat + req.body.allowedFiles,
        fileName: req.body.fileName,
      });
    }
  }
};

const documentStorageInvite = multer.diskStorage({
  destination: (req, file, cb) => {
    let destinationFolder = config.documentUploadPath + '/' + `${req.subdomain_name}/Employee/Invite-Employee-Document`;
    // Pass the destination folder to cb callback
    if (!fs.existsSync(destinationFolder)) {
      // Create the destination directory
      fs.mkdirSync(destinationFolder, { recursive: true });
    }
    cb(null, destinationFolder);
  },
  filename: async (req, file, cb) => {
    const randomNumber = Math.floor(Math.random() * Math.floor(987456321));
    const tempFileName = uniqueRandomID + randomNumber;
    req.body.file_id = tempFileName;
    const extension = file.originalname.split('.').pop();
    return cb(null, tempFileName + '.' + extension);
  },
});

const chatDocumentStorage = multer.diskStorage({
  destination: config.documentUploadPath + '/temp/chatDocuments',
  filename: async (req, file, cb) => {
    const pathToUpload = config.documentUploadPath + '/temp/chatDocuments';
    const newRecord = {
      document_name: file.originalname,
    };
    const createDocumentEntry = await documentService.chatDocumentCreate(newRecord);
    if (createDocumentEntry) {
      file.id = createDocumentEntry[0].id;
      const condition = {
        id: createDocumentEntry[0].id,
      };
      const updateData = {
        document_url: `${config.documentUrl}/temp/chatDocuments/${createDocumentEntry[0].id}${path.extname(file.originalname)}`,
        document_path: `${pathToUpload}/${createDocumentEntry[0].id}${path.extname(file.originalname)}`,
      };
      const updateDocumentEntry = await documentService.chatDocumentUpdate(condition, updateData);
      if (updateDocumentEntry) {
        req.body.uploadError = false;
        return cb(null, `${updateDocumentEntry[0].id}${path.extname(file.originalname)}`);
      } else {
        req.body.uploadError = true;
        cb(null, `${responseMessages.common.fail}`);
      }
    } else {
      req.body.uploadError = true;
      cb(null, `${responseMessages.common.fail}`);
    }
  },

});


const chatDocumentUpload = multer({
  storage: chatDocumentStorage,
  limits: {
    fileSize: 26214400, // 1000000 Bytes = 1 MB
  },
  fileFilter(req, file, cb) {
    if (file.originalname.match(/\.(pdf|docx|PDF|DOCX|png|PNG|jpg|JPG|.zip|.ZIP)$/)) {
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

const chatDocumentsStore = async (req, res) => {

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
      if (req.body.uploadError) {
        return res.status(httpCodes.code200).send({
          status: responseCodes.codeUnprocessableEntity,
          message: responseMessages.upload.errorUploading,
          fileName: req.body.fileName,
        });
      } else {
        const fileInfo = [];
        req.files.map(async (file, i) => {
          fileInfo.push({
            id: file.id,
          });
        });
        if (fileInfo.length === 1) {
          await res.status(httpCodes.code200).send({
            statusCode: responseCodes.codeSuccess,
            message: responseMessages.common.success,
            data: fileInfo[0],
          });
        } else if (fileInfo.length > 1) {
          res.status(httpCodes.code200).send({
            statusCode: responseCodes.codeSuccess,
            message: responseMessages.common.success,
            data: fileInfo[0],
          });
        } else {
          res.status(httpCodes.code200).send({
            statusCode: responseCodes.codeInternalError,
            message: responseMessages.upload.documentNotFound,
          });
        }
      }
    } else {
      return res.status(httpCodes.code200).send({
        status: responseCodes.codeUnprocessableEntity,
        message: responseMessages.upload.invalidDocumentUploadFormat,
        fileName: req.body.fileName,
      });
    }
  }
};

module.exports = { documentUpload, documentsStore, chatDocumentUpload, chatDocumentsStore };
