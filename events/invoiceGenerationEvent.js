const AwaitEventEmitter = require('await-event-emitter').default;
let event = new AwaitEventEmitter();
const url = require('url');
const path = require('path');
const basepath = require('../config/basepath');
const indexRepository = require('../src/v1/user/repositories/index');
const moment = require('moment');
const { sendMail } = require('../utils/emailSend');
const { invoiceThemeInfo } = require('../helpers/ledgerInformationData');
const format = require('../helpers/format');

/**
 * Event listener for the 'invoiceGenerationEmail' event. Retrieves necessary data from the database
 * and sends an email with the generated invoice.
 * @param {object} data - The data object containing the necessary information for generating the invoice email.
 * @returns None
 */
event.on('invoiceGenerationEmail', async (data) => {

  let dateFormat = await format.getDateFormat(); // date format

  let clientData = await indexRepository.find('clients',['name','id','invoice_email_template_id','invoice_email_template_type'],{ id: data.client_id });
  let clientContactsData = await indexRepository.find('client_contacts',['*'],{ client_id: data.client_id });
  let clientAddressData = await indexRepository.find('client_address',['*'],{ client_id: data.client_id });
  let invoiceData = await indexRepository.find('invoices',['*'],{ id: data.invoice_id });
  let organizationData = await indexRepository.find('organization',['*']);
  let commuincationAddressCondition = { 'client_id': clientData.data[0].id, 'address_type': 1 };
  let clientAddress = await indexRepository.find('client_address',['*'],commuincationAddressCondition);

  let shippingAddressCondition = { 'client_id': clientData.data[0].id, 'address_type': 2 };
  let shippingAddress = await indexRepository.find('client_address',['*'],shippingAddressCondition);

  let payments_data = await indexRepository.find('payment_invoices',['*'],{ invoice_id: invoiceData.data[0].id });
  let payment = payments_data.status ? payments_data.data[0].received_amount : 0;
  let invoiceBilling = await indexRepository.find('invoices_billing_details',['*'],{ invoice_id: invoiceData.data[0].id });
  var organizationContactInfo = await indexRepository.find('organization_contact_information', ['organization_name']);
  
  switch (invoiceData.data[0].approved_status) {
  case 0:
    approved_status = 'Drafted';
    break;
  case 1:
    approved_status = 'Submitted';
    break;
  case 2:
    approved_status = 'Partially Approved';
    break;
  case 3:
    approved_status = 'Approved';
    break;
  case 4:
    approved_status = 'Rejected';
    break;
  case 5:
    approved_status = 'Partially Paid';
    break;
  case 6:
    approved_status = 'Paid';
    break;
  default:
    approved_status = '';
    break;
  }

  let replaceObj = {
    '{{total_amount}}': invoiceData.data[0].total_amount ? invoiceData.data[0].total_amount : '',
    '{{invoice_date}}': moment(invoiceData.data[0].invoice_date).format(dateFormat),
    '{{due_date}}': moment(invoiceData.data[0].invoice_due_date).format(dateFormat),
    '{{invoice_number}}': invoiceData.data[0].invoice_number,
    '{{balance_amount}}': invoiceData.data[0].balance_amount ? invoiceData.data[0].balance_amount : '',
    '{{organization_name}}': organizationContactInfo.status ? organizationContactInfo.data[0].organization_name : '',
    '{{customer_email}}': organizationData.data[0].email_id,
    '{{client_name}}': clientData.data[0].name,
    '{{client_address_one}}': clientAddressData.data[0].address_line_one,
    '{{client_address_two}}': clientAddressData.data[0].address_line_two ? clientAddressData.data[0].address_line_two : '',
    '{{client_address_pincode}}': clientAddressData.data[0].zip_code,
    '{{client_address_country}}': clientAddressData.data[0].country_name,
    '{{client_address_state}}': clientAddressData.data[0].state_name,
    '{{client_address_city}}': clientAddressData.data[0].city,
    '{{organization_signature}}': organizationData.status ? organizationData.data[0].email_signature : '',
  };

  if (clientData.data[0].invoice_email_template_type == 1) {
    var emailTempData = await indexRepository.find('invoice_email_templates',['*'],{ is_global: true });
  } else {
    var emailTempData = await indexRepository.find('invoice_email_templates',['*'],{ id: clientData.data[0].invoice_email_template_id });
  }
  let parsedSubject = allReplace(emailTempData.data[0].subject, replaceObj);
  let parsedTemplate = allReplace(emailTempData.data[0].template, replaceObj);

  let clientcontactData = clientContactsData.data;
  clientEmails = [];
  for (const key in clientcontactData) {
    clientEmails.push( clientcontactData[key].email_id);
  }

  let communication_address = clientAddress.data.length > 0 ? clientAddress.data[0].address_line_one + ', ' + clientAddress.data[0].address_line_two + ', ' + clientAddress.data[0].city + ', ' + clientAddress.data[0].state_name + ', ' + clientAddress.data[0].country_name + ' ' + clientAddress.data[0].zip_code : '';
  let shipping_address = shippingAddress.data.length > 0 ? shippingAddress.data[0].address_line_one + ', ' + shippingAddress.data[0].address_line_two + ', ' + shippingAddress.data[0].city + ', ' + shippingAddress.data[0].state_name + ', ' + shippingAddress.data[0].country_name + ' ' + shippingAddress.data[0].zip_code : '';
  let billingArray = [];
  let billObject = [];
  for (let key in invoiceBilling.data) {
    let item = invoiceBilling.data[key];
    billObject = {
      employee_name: item.consultant_name,
      hours: item.amount,
      rate: item.rate,
      amount: item.amount,
    };
    billingArray.push(billObject);
  }
  const pdfObject = {
    id: invoiceData.data[0].id,
    client_id: invoiceData.data[0].client_id,
    invoice_no: invoiceData.data[0].invoice_number,
    invoice_date: moment(invoiceData.data[0].invoice_date).format(dateFormat),
    terms: invoiceData.data[0].days + ' days',
    due_date: moment(invoiceData.data[0].invoice_due_date).format(dateFormat),
    balance_due: invoiceData.data[0].total_amount,
    name: clientData.data[0].name,
    logo: organizationData.status ? organizationData.data[0].logo_url : '',
    office_address: communication_address,
    bill_to: shipping_address,
    status: approved_status,
    body_data: billingArray,
    sub_total: invoiceData.data[0].sub_total_amount,
    total: invoiceData.data[0].total_amount,
    payment_made: payment,
    notes: invoiceData.data[0].customer_note,
  };
  let invoice_attachment = await invoiceThemeInfo(pdfObject, true);
  let attachments = [];
  if (invoice_attachment.status) {
    const parsedUrl = url.parse(invoice_attachment.data.pdf_link);
    const filename = path.basename(parsedUrl.pathname);
    const attachmentPath = path.join(process.env.DOCUMENT_PATH, parsedUrl.pathname);
    attachments.push({
      filename: filename,
      path: attachmentPath,
    });
  }
  let emailData = {
    toEmail: clientEmails.join(','),
    cc: emailTempData.data[0].cc,
    bcc: emailTempData.data[0].bcc,
    subject: parsedSubject,
    html: parsedTemplate,
    attachments: attachments,
  };

  try {
    sendMail(emailData);
    console.log('Email Sent Successfully');
  } catch (err) {
    console.log(err);
  }
});

function allReplace(str, obj) {
  for (const x in obj) {
    const regex = new RegExp(`${x}`, 'g');
    str = str.replace(regex, obj[x]);
  }
  return str;
}

module.exports = { event };