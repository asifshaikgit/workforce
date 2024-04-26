const indexRepository = require('../src/v1/user/repositories/index');
const theme = require('../src/v1/themes/invoiceInformation');
const fs = require('fs');
const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer');
//var html_to_pdf = require('html-pdf-node');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/app');

const billThemeInfo = async (bill_data, is_pdf = false) => {
  try {
    let responseData = [];
    // Read the EJS file
    const template = fs.readFileSync(process.env.BILL_THEMES_PATH + '/' + `bills.ejs`, 'utf8');

    // Compile the EJS template
    const compiledTemplate = ejs.compile(template);
    const renderedTemplate = compiledTemplate({ bill_data });
    const uuid = uuidv4();
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 10000,
    });
    const page = await browser.newPage();
    await page.setViewport({
      width: 960,
      height: 760,
      deviceScaleFactor: 1,
    });
    await page.setContent(renderedTemplate);
    let _pathDest = process.env.BILL_PDF_PATH + '/' + bill_data.vendor_id;
    let test = fs.existsSync(_pathDest);
    if (!fs.existsSync(_pathDest)) {
      // Create the destination directory
      fs.mkdirSync(_pathDest, { recursive: true });
    }
    let imgLink = path.join(process.env.BILL_PDF_PATH, `${bill_data.vendor_id}/${bill_data.bill_no}.jpg`);
    const imageBuffer = await page.screenshot();
    fs.writeFileSync(imgLink, imageBuffer);
    if (is_pdf) {
      const pdfPath = path.join(process.env.BILL_PDF_PATH, `${bill_data.vendor_id}/${bill_data.bill_no}.pdf`);
      await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
      responseData = { pdf_data: renderedTemplate, pdf_link: `${config.documentUrl}/bill-pdf/${bill_data.vendor_id}/${bill_data.bill_no}.pdf`, imgLink: `${config.documentUrl}/bill-pdf/${bill_data.vendor_id}/${bill_data.bill_no}`};
    } else {
      responseData = { pdf_data: renderedTemplate, imgLink: `${config.documentUrl}/bill-pdf/${imgLink}` };
    }
    await browser.close();
    return { status: true, data: responseData };
    
  } catch (error) {
    console.log('New catch', error);
    throw new Error(error);
  }
};

const billPaymentThemeInfo = async (payments_data, is_pdf = false) => {
  try {
    let responseData = [];
    // Read the EJS file
    const template = fs.readFileSync(process.env.PAYMENT_RECEIVED_THEMES_PATH + '/' + `paymentReceived.ejs`, 'utf8');

    // Compile the EJS template
    const compiledTemplate = ejs.compile(template);
    const renderedTemplate = compiledTemplate({ payments_data });
    const uuid = uuidv4();
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 10000,
    });
    const page = await browser.newPage();
    await page.setViewport({
      width: 960,
      height: 760,
      deviceScaleFactor: 1,
    });
    await page.setContent(renderedTemplate);
    let _pathDest = process.env.PAYMENT_RECEIVED_PDF_PATH + '/' + payments_data.vendor_id;
    let test = fs.existsSync(_pathDest);
    if (!fs.existsSync(_pathDest)) {
      // Create the destination directory
      fs.mkdirSync(_pathDest, { recursive: true });
    }
    let imgLink = path.join(process.env.PAYMENT_RECEIVED_PDF_PATH, `${payments_data.vendor_id}/${payments_data.payment_reference_id}.jpg`);
    const imageBuffer = await page.screenshot();
    fs.writeFileSync(imgLink, imageBuffer);
    if (is_pdf) {
      const pdfPath = path.join(process.env.PAYMENT_RECEIVED_PDF_PATH, `${payments_data.vendor_id}/${payments_data.payment_reference_id}.pdf`);
      await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
      responseData = { pdf_data: renderedTemplate, pdf_link: `${config.documentUrl}/bill-payment-pdf/${payments_data.vendor_id}/${payments_data.payment_reference_id}.pdf`, imgLink: `${config.documentUrl}/bill-payment-pdf/${payments_data.vendor_id}/${payments_data.payment_reference_id}`};
    } else {
      responseData = { pdf_data: renderedTemplate, imgLink: `${config.documentUrl}/bill-paymnet-pdf/${imgLink}` };
    }
    await browser.close();
    return { status: true, data: responseData };
    
  } catch (error) {
    console.log('New catch', error);
    throw new Error(error);
  }
};

module.exports = { billThemeInfo, billPaymentThemeInfo };

