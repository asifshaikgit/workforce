const nodemailer = require('nodemailer');
const { email } = require('../config/email');
const { responseMessages } = require('../constants/responseMessage');

const sendMail = async (emailData, loginTenantName = null) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 587,
      secure: true,
      auth: {
        user: email.from_email,
        pass: email.password,
      },
    });
    if (emailData.html) {
      await transporter.sendMail({
        from: email.from_email,
        to: emailData.toEmail,
        cc: emailData.cc ? emailData.cc : null,
        bcc: emailData.bcc ? emailData.bcc : null,
        subject: emailData.subject,
        html: emailData.html,
        attachments: emailData.attachments ? emailData.attachments : null,
      });
    } else {
      await transporter.sendMail({
        from: email.from_email,
        to: emailData.toEmail,
        cc: emailData.cc ? emailData.cc : null,
        bcc: emailData.bcc ? emailData.bcc : null,
        subject: emailData.subject,
        text: emailData.message,
        attachments: emailData.attachments ? emailData.attachments : null,
      });
    }
    return { status: true };
  } catch (error) {
    return { status: false, message: responseMessages.registration.failedToSendOtp, error: error.message };
  }
};

module.exports = { sendMail };
