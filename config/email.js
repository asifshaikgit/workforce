require('dotenv').config();
const email = {
  password : process.env.SMTP_PASSWORD ?  process.env.SMTP_PASSWORD : '',
  from_email : process.env.SMTP_FROM_EMAIL ? process.env.SMTP_FROM_EMAIL : '',
};

module.exports = { email };