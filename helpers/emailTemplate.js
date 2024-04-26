const emailSend = require('../utils/emailSend');
const { sendMail } = require('../utils/emailSend');
const { getConnection } = require('../src/middlewares/connectionManager');

const getTemplate = async (condition) => {
  /* Establishing db connection with collection */
  let dbConnection = await getConnection();
  /* Fetching template from db */
  const template = await dbConnection('mail_template').select('subject', 'template', 'slug')
    .where(condition);
  return template[0];
};

/**
 * Replace all the occurrences of object
 * @param {*} str 
 * @param {*} obj 
 * @returns 
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function allReplace(str, obj) {
  for (const x in obj) {
      const regex = new RegExp(escapeRegExp(x), 'g');
      str = str.replace(regex, obj[x]);
  }
  return str;
}

const getEmailTemplate = async (replaceObj, slug) => {

  let condition = { slug: slug };
  let mailTemplate = await getTemplate(condition);
  if(mailTemplate){
    let parsedSubject = allReplace(mailTemplate.subject, replaceObj);
    let parsedTemplate = allReplace(mailTemplate.template, replaceObj);
    
    let attachments = [{
      filename: 'logo.png',
      path: 'https://cdn.theorg.com/4222f90c-5de9-4988-8071-dd2cd4d9a264_thumb.jpg',
      cid: 'logo',
    }];
    
    return { subject: parsedSubject, template: parsedTemplate, attachments: attachments };
  }else{
    return { subject: '', template: '', attachments: '' };
  }
};

module.exports = { getEmailTemplate, getTemplate, allReplace };