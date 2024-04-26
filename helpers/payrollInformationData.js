const indexRepository = require('../src/v1/user/repositories/index');
const theme = require('../src/v1/themes/invoiceInformation');
const fs = require('fs');
const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer');
//var html_to_pdf = require('html-pdf-node');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/app');

const payrollThemeInfo = async (payroll_data, is_pdf = false) => {
  try {
    let responseData = [];

    // Read the EJS file
    const template = fs.readFileSync(process.env.PAYROLL_THEMES_PATH + '/' + `payroll.ejs`, 'utf8');

    // Compile the EJS template
    const compiledTemplate = ejs.compile(template);
    const renderedTemplate = compiledTemplate({ payroll_data });
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
    let _pathDest = process.env.PAYROLL_PDF_PATH + '/' + payroll_data.employee_id;
    let test = fs.existsSync(_pathDest);
    if (!fs.existsSync(_pathDest)) {
      // Create the destination directory
      fs.mkdirSync(_pathDest, { recursive: true });
    }
    let imgLink = path.join(process.env.PAYROLL_PDF_PATH, `${payroll_data.employee_id}/${payroll_data.payroll_configuration_id}.jpg`);
    const imageBuffer = await page.screenshot();
    fs.writeFileSync(imgLink, imageBuffer);
    if (is_pdf) {
      const pdfPath = path.join(process.env.PAYROLL_PDF_PATH, `${payroll_data.employee_id}/${payroll_data.payroll_configuration_id}.pdf`);
      await page.pdf({ path: pdfPath, format: 'A4', printBackground: true }); 
      // pdf_data: renderedTemplate,imgLink: `${config.documentUrl}/payroll-pdf/${payroll_data.employee_id}/${payroll_data.payroll_configuration_id}
        responseData = {  pdf_link: `${config.documentUrl}/payroll-pdf/${payroll_data.employee_id}/${payroll_data.payroll_configuration_id}.pdf` , pdfPath : pdfPath };
    } else {
      responseData = { pdf_data: renderedTemplate, imgLink: `${config.documentUrl}/payroll-pdf/${imgLink}` , pdfPath : pdfPath};
    }
    await browser.close();
    return { status: true, data: responseData };

  } catch (error) {
    console.log('New catch', error);
    throw new Error(error);
  }
};


module.exports = { payrollThemeInfo };

