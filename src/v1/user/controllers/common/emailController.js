require('dotenv').config();
const { responseMessages } = require('../../../../../constants/responseMessage');
const { responseCodes, httpCodes } = require('../../../../../constants/responseCodes');
const { check, validationResult } = require('express-validator');
const emailService = require('../../services/common/emailService');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { logRequest, logResponse } = require('../../../../../utils/log');
const { responseHandler } = require('../../../../responseHandler');
const InvalidRequestError = require('../../../../../error/InvalidRequestError');
const config = require('../../../../../config/app');

const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.documentUploadPath + '/temp');
  },
  filename: async (req, file, cb) => {
    req.body.uploadError = false;
    req.body.fileName = uuidv4();
    return cb(null, `${req.body.fileName}${path.extname(file.originalname)}`);
  },
});

/* const documentUpload = multer({
  storage: documentStorage,
  limits: {
    fileSize: 5000000 // 1000000 Bytes = 1 MB
  },
  fileFilter(req, file, cb) {
    if (file.originalname.match(/\.(pdf|docx|PDF|DOCX|png|PNG|jpg|JPG)$/)) {
      req.body.formatError = false;
      req.body.fileAvailable = true;
      req.body.file_extension = `${path.extname(file.originalname)}`;
    } else {
      req.body.formatError = true;
      req.body.fileAvailable = true;
      req.body.file_extension = `${path.extname(file.originalname)}`;
    }
    cb(null, true)
  }
}); */

const documentUpload = multer({ dest: config.documentUploadPath + '/temp' });

const sendEmail = async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Send Email request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('from').trim().escape().notEmpty().withMessage(responseMessages.configurations.invoiceEmailTemplates.fromEmailIdRequired)
      .isEmail().withMessage(responseMessages.configurations.invoiceEmailTemplates.fromEmailIdInvalid),
    check('to.*').trim().escape().notEmpty().withMessage(responseMessages.configurations.invoiceEmailTemplates.toEmailIdRequired)
      .isEmail().withMessage(responseMessages.configurations.invoiceEmailTemplates.toEmailIdInvalid),
    check('subject').trim().notEmpty().withMessage(responseMessages.configurations.invoiceEmailTemplates.subjectRequired),
    check('template').trim().notEmpty().withMessage(responseMessages.configurations.invoiceEmailTemplates.templateRequired),
    check('cc.*').trim().escape().optional({ nullable: true }).isEmail().withMessage(responseMessages.configurations.invoiceEmailTemplates.ccEmailIdInvalid),
    check('bcc.*').trim().escape().optional({ nullable: true }).isEmail().withMessage(responseMessages.configurations.invoiceEmailTemplates.bccEmailIdInvalid),
    check('is_attachment').trim().escape().notEmpty().withMessage(responseMessages.configurations.invoiceEmailTemplates.isAttachementRequired)
      .isBoolean().withMessage(responseMessages.configurations.invoiceEmailTemplates.isAttachementInvalid),
    check('is_invoice_attached').trim().escape().notEmpty().withMessage(responseMessages.configurations.invoiceEmailTemplates.isInvoiceAttachedRequired)
      .isBoolean().withMessage(responseMessages.configurations.invoiceEmailTemplates.isInvoiceAttachedInvalid),
    check('attached_url.*').trim().optional({ nullable: true }).isString().withMessage(responseMessages.configurations.invoiceEmailTemplates.invoiceAttachedInvalid),
  ];
  /* Writing validation rules to the input request */

  /* Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req);
    if (result.errors.length) break;
  }
  const errors = validationResult(req);
  /* Run the validation rules. */

  /**
   * If validation is success
   *    + Call the create email function
   *    - Based on the status of the send to email function
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    await emailService.sendEmail(req);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.success,
    };

    /* Log Response */
    logResponse(
      'info',
      req,
      responseData,
      'Send Email response',
    );
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity,
    );
  }
};

module.exports = { sendEmail, documentUpload };
