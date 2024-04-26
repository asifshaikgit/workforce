require('dotenv').config();
const documentRepository = require('../../repositories/common/documentRepository');
const basepath = require('../../../../../config/basepath');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { sendMail } = require('../../../../../utils/emailSend');
const { host, expenseOtpVerifyLink, domainName } = require('../../../../../config/app');
const { tokenGeneration } = require('../../../../../helpers/jwttokengeneration');

/**
 * @param documentsData object.
 * @return Json
 *
 * create a new object and send to repository to insert the document and return the response to controller.
 */
const sendEmail = async (req) => {
  /* const token = tokenGeneration({ id: body.employee_id }, body.tenant_id);
  let link = `${host}://${body.loginSubDomainName}.${domainName}/${invoicePDFLink}?token=${token}&name=${emp_name}&amount=${body.amount}&expence_management_id=${expense[0].id}`; */
  const attachments = [];
  if (req.body.is_attachment === 'true') {
    for (const file of req.files) {
      const fileContent = await fs.promises.readFile(file.path);
      attachments.push({ filename: file.originalname, content: fileContent });
    }
  }
  if (req.body.is_invoice_attached === 'true') {
    if (Array.isArray(req.body.attached_url)) {
      if (req.body.attached_url.length > 0) {
        const attachedUrl = req.body.attached_url;
        attachedUrl.map((urlString) => {
          const parsedUrl = url.parse(urlString);
          const filename = path.basename(parsedUrl.pathname);
          attachments.push({
            filename,
            path: urlString,
          });
        });
      }
    }
  }
  const email_data = {
    toEmail: req.body.to.toString(),
    cc: req.body.cc ? req.body.cc.toString() : [],
    bcc: req.body.bcc ? req.body.bcc.toString() : [],
    subject: req.body.subject,
    html: req.body.template,
    attachments,
  };
  try {
    sendMail(email_data);
    console.log('Email Sent Successfully');
  } catch (err) {
    console.log(err);
  }
};

module.exports = { sendEmail };
