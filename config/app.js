require('dotenv').config();

const host = process.env.HOST ? process.env.HOST : 'https';
const expenseOtpVerifyLink = process.env.EXPENSE_APPROVAL_LINK ? process.env.EXPENSE_APPROVAL_LINK : 'veriifyOtp';
const invoicePDFLink = process.env.INVOICE_PDF_LINK ? process.env.INVOICE_PDF_LINK : 'invoicePDF';
const questionariesCaptureLink = process.env.IMMIGRATION_QUESTIONARY_LINK ? process.env.IMMIGRATION_QUESTIONARY_LINK : 'immigration-questionaries';
const domainName = process.env.DOMAINNAME ? process.env.DOMAINNAME : 'workforce-dev.codetru.org';
const imageUploadPath = process.env.IMAGES_PATH ? process.env.IMAGES_PATH : 'public/uploads';
const documentUploadPath = process.env.DOCUMENT_PATH ? process.env.DOCUMENT_PATH : 'public/uploads';
const documentUrl = process.env.DOCUMENT_URL ? process.env.DOCUMENT_URL : 'https://documents.workforce.codetru.org/';
const onboardingLink = process.env.ONBOARDING_LINK ? process.env.ONBOARDING_LINK : 'onboard-invite-link';
const reSubmitLink = process.env.RESUBMIT_LINK ? process.env.RESUBMIT_LINK : 'onboard-resubmit-link';
const consultantDomainName = process.env.CONSULTANT_DOMAIN ? process.env.CONSULTANT_DOMAIN : 'workforce-consultant-dev.codetru.org';
const exportPath = process.env.EXPORT_DOCUMENT_PATH ? process.env.EXPORT_DOCUMENT_PATH : 'public/uploads';
const exportURL = process.env.EXPORT_DOCUMENT_URL ? process.env.EXPORT_DOCUMENT_URL : 'localhost:8000';
const immigrationPath = process.env.MERGED_DOCUMENT_PATH ? process.env.MERGED_DOCUMENT_PATH : 'public/uploads';
const immigrationURL = process.env.MERGED_DOCUMENT_URL ? process.env.MERGED_DOCUMENT_URL : 'localhost:8000';
const ocrURL = process.env.OCR_URL ? process.env.OCR_URL : 'https://ocr.codetru.org/';
const ocrToken = process.env.OCR_TOKEN ? process.env.OCR_TOKEN : 'QIo5LzZf64tF3re7eeBiphJyK/1Vr34I0wnmKICo3Co3PwqY+Tr1OymZ5atK4CWzVOJQhSiBExuaFqPFswOacbLVUuZ9NKUGxRGauH0+GOa/SMbbIOXEXiZbGjJX1J/VRFaxajeRrbtbhzmvkaD8ShRM0J2OH3pfB5eHuhekdGV3vG6URq0FHZE9JEEFmYEp+q7bRrjlTMJEng2Y4HEDQld70mx8Rjbr1a4i/B8uYfkL983pR7JkZElzjaXF/KmN7O+DQ9FooffJyMT3Qkc/mapa6IWlblS4jByj/jg8qefrq3P8AQ4EpyC+E8in9Oz116Fl/Py1hlKz3HzDhQZHQg==';
const avatarLink = process.env.AVATAR_LINK ? process.env.AVATAR_LINK : 'https://workforce-dev-api.codetru.org/public/avatar/';
const avatarPath = process.env.AVATAR_PATH ? process.env.AVATAR_PATH : 'public/avatar';
const chatBotuRL = process.env.CHAT_BOT ? process.env.CHAT_BOT : 'https://ocr.codetru.org/chatbot';
const chartuRL = process.env.CHARTURL ? process.env.CHARTURL : 'https://ocr.codetru.org/chart';
const w4DocumentURL = process.env.W4_DOCUMENT_URL ? process.env.W4_DOCUMENT_URL : 'https://www.irs.gov/pub/irs-pdf/fw4.pdf';
const i9DocumentURL = process.env.I9_DOCUMENT_URL ? process.env.I9_DOCUMENT_URL : 'https://www.uscis.gov/sites/default/files/document/forms/i-9.pdf';
const i9Sample = process.env.I9_SAMPLE ? process.env.I9_SAMPLE : 'https://documents.workforce.codetru.org/Default/i-9.png';
const w4Sample = process.env.W4_SAMPLE ? process.env.W4_SAMPLE : 'https://documents.workforce.codetru.org/Default/w4.jpg';

module.exports = { host, expenseOtpVerifyLink, invoicePDFLink, domainName, imageUploadPath, documentUploadPath, documentUrl, onboardingLink, consultantDomainName, exportPath, exportURL, questionariesCaptureLink, immigrationPath, immigrationURL, ocrURL, ocrToken, avatarLink, avatarPath, chatBotuRL, chartuRL, w4DocumentURL, i9DocumentURL, i9Sample, w4Sample };


