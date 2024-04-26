const eventsEmitter = require('events');
const mailEvents = new eventsEmitter();
const { getEmailTemplate } = require('../../helpers/emailTemplate');
const config = require('../../config/app')
const { sendMail } = require('../../utils/emailSend');
const indexRepository = require('../../src/v1/user/repositories/index');
const format = require('../../helpers/format');
const ledgersService = require('../../src/v1/user/services/ledgers/ledgersService')
const INVOICES = 'invoice';
const BILL = 'bill';
const url = require('url');
const path = require('path');
const moment = require('moment')

mailEvents.on('ledgersRemindersMail', async (condition, pdfDetails, ledger_documents) => {
    try {
        
        let dateFormat = await format.getDateFormat();

        var signature = await indexRepository.find('organization', ['organization_name', 'email_signature']);

        if (condition.entity_type == BILL) {
            var slug = 'bill-reminder'

            var fields = ['ledgers.due_date as bill_due_date', 'ledgers.date as bill_date', 'ledgers.company_id as vendor_id', 'c.name as vendor_name', 'ledgers.reference_id as bill_reference_id', 'ld.document_url as bill_document_url', 'ld.document_name as bill_document_name', 'ledgers.sub_total_amount', 'ledgers.amount as bill_amount', 'cc.email_id']
            var joins = [
                { table: 'ledger_documents as ld', alias: 'ld', condition: ['ld.ledger_id', 'ledgers.id'], type: 'left' },
                { table: 'companies as c', alias: 'c', condition: ['c.id', 'ledgers.company_id'], type: 'left' },
                { table: 'company_contacts as cc', alias: 'cc', condition: ['c.id', 'cc.company_id'], type: 'left' },
            ];

            var billsData = await indexRepository.find('ledgers', fields, { 'ledgers.id': condition.ledger_id, 'cc.is_default': true }, null, joins);
            billsData = billsData?.data[0]

            // Email subject replace object
            let replaceObj = {
                '{{bill_due_date}}': moment(billsData.bill_due_date, dateFormat).format('MM/DD/YYYY'),
                '{{bill_date}}': moment(billsData.bill_date, dateFormat).format('MM/DD/YYYY'),
                '{{vendor_id}}': billsData.vendor_id,
                '{{vendor_name}}': billsData.vendor_name,
                '{{bill_reference_id}}': billsData.bill_reference_id,
                '{{bill_document_url}}': billsData.bill_document_url,
                '{{bill_document_name}}': billsData.bill_document_name,
                '{{sub_total_amount}}': billsData.sub_total_amount,
                '{{bill_amount}}': billsData.bill_amount,
                '{{organization_signature}}': signature.status ? (signature.data[0].email_signature ? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
                '{{organization_name}}': signature.data[0].organization_name,
            };

            const templateData = await getEmailTemplate(replaceObj, slug);
            const emailData = {
                toEmail: billsData.email_id,
                subject: templateData.subject,
                html: templateData.template,
            };
            sendMail(emailData);
            console.log(`Email Sent Successfully to ${billsData.email_id}`);
        } else if (condition.entity_type == INVOICES) {
            var slug = 'invoice-reminder'

            var fields = ['ledgers.date as invoice_date', 'c.name as client_name', 'cc.display_name', 'ledgers.due_date as invoice_due_date', 'c.reference_id as client_number', 'ledgers.status as invoice_status', 'ledgers.amount as invoice_amount', 'cc.first_name', 'ledgers.reference_id as invoice_number', 'cc.email_id']
            var joins = [
                { table: 'ledger_documents as ld', alias: 'ld', condition: ['ld.ledger_id', 'ledgers.id'], type: 'left' },
                { table: 'companies as c', alias: 'c', condition: ['c.id', 'ledgers.company_id'] },
                { table: 'company_contacts as cc', alias: 'cc', condition: ['c.id', 'cc.company_id'] },
            ];

            var invoiceData = await indexRepository.find('ledgers', fields, { 'ledgers.id': condition.ledger_id, 'cc.is_default': true }, null, joins);
            invoiceData = invoiceData?.data[0]

            // Email subject replace object
            let replaceObj = {
                '{{invoice_date}}': moment(invoiceData.invoice_date, dateFormat).format('MM/DD/YYYY'),
                '{{client_name}}': invoiceData.client_name,
                '{{display_name}}': invoiceData.display_name,
                '{{invoice_due_date}}': moment(invoiceData.invoice_due_date, dateFormat).format('MM/DD/YYYY'),
                '{{client_number}}': invoiceData.client_number,
                '{{invoice_status}}': invoiceData.invoice_status,
                '{{invoice_amount}}': invoiceData.invoice_amount,
                '{{first_name}}': invoiceData.first_name,
                '{{invoice_number}}': invoiceData.invoice_number,

                '{{organization_signature}}': signature.status ? (signature.data[0].email_signature ? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
                '{{organization_name}}': signature.data[0].organization_name,
            };

            // let invoice_attachment = await invoiceThemeInfo(pdfObject, true);
            let attachments = [];

            if(ledger_documents.status) {
                ledger_documents.data.forEach(document => {
                    attachments.push({
                        filename: document.document_name,
                        path: document.document_url,
                    });
                });
            }

            if (pdfDetails.status) {
                const parsedUrl = url.parse(pdfDetails.data.data.pdf_link);
                const filename = path.basename(parsedUrl.pathname);
                const attachmentPath = path.join(process.env.DOCUMENT_PATH, parsedUrl.pathname);
                attachments.push({
                filename: filename,
                path: attachmentPath,
                });
            }

            const templateData = await getEmailTemplate(replaceObj, slug);
            const emailData = {
                toEmail: invoiceData.email_id,
                subject: templateData.subject,
                html: templateData.template,
                attachments : attachments,
            };
            var sendMail = await sendMail(emailData);
            if(sendMail.status) {
                console.log(`Email Sent Successfully to ${invoiceData.email_id}`);
            } else {
                console.log(sendMail.error);
            }
        }
    } catch (err) {
        console.log(err);
    }

});

mailEvents.on('invoiceApprovalMail', async(body, ledger_id) => {
    try {
        var ledgersApproverCondition = await indexRepository.find('ledgers', ['id', 'company_id', 'approval_level'], { id: ledger_id });
        ledgersApproverCondition = ledgersApproverCondition.data[0]

        var ledgersCondition = {
            ledger_id: ledgersApproverCondition.id,
            approval_level: ledgersApproverCondition.approval_level,
            company_id: ledgersApproverCondition.company_id
        }

        const approvedUsers = (body.entity_type == INVOICES) ? await ledgersService.getApproverIds(ledgersCondition) : [];

        var slug = 'invoice-approval-pending'
        let dateFormat = await format.getDateFormat();

        var signature = await indexRepository.find('organization', ['organization_name', 'email_signature']);

        var fields = ['ledgers.date', 'ledgers.approval_level', 'ledgers.reference_id', 'ledgers.due_date', 'ledgers.status', 'ledgers.amount', 'cc.email_id', 'cc.display_name', 'c.name as client_name', 'c.reference_id as client_number']
        var joins = [
            { table: 'companies as c', alias: 'c', condition: ['c.id', 'ledgers.company_id'] },
            { table: 'company_contacts as cc', alias: 'cc', condition: ['c.id', 'cc.company_id'] },
        ];

        var ledgersData = await indexRepository.find('ledgers', fields, { 'ledgers.id': ledger_id }, null, joins);
        var ledgersparamsData = ledgersData?.data[0]
        // Email subject replace object
        let replaceObj = {
            '{{invoice_date}}': moment(ledgersparamsData.date, dateFormat).format('MM/DD/YYYY'),
            '{{invoice_number}}': ledgersparamsData.reference_id,
            '{{client_name}}': ledgersparamsData.client_name,
            '{{client_number}}': ledgersparamsData.client_number,
            '{{invoice_due_date}}': moment(ledgersparamsData.due_date, dateFormat).format('MM/DD/YYYY'),
            '{{invoice_status}}': ledgersparamsData.status,
            '{{current_approval_level}}': ledgersparamsData.approval_level,
            '{{invoice_amount}}': ledgersparamsData.amount,
            '{{organization_signature}}': signature.status ? (signature.data[0].email_signature ? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
            '{{organization_name}}': signature.data[0].organization_name,
        };

        approvedUsers.approval_users.map(async (userId) => {
            const employeeData = await indexRepository.find('employee', ['id', 'display_name', 'email_id'], { id: userId });
            replaceObj = { ...replaceObj, ...{ '{{display_name}}': employeeData.data[0].display_name } };
            const templateData = await getEmailTemplate(replaceObj, slug);
            const emailData = {
                toEmail: employeeData.data[0].email_id,
                subject: templateData.subject,
                html: templateData.template,
            };
            await sendMail(emailData);
            console.log(`Email Sent Successfully to ${employeeData.data[0].email_id}`);
        })
    } catch (err) {
        console.log(err);
    }
})

mailEvents.on('invoiceApprovalOrRejectedMail', async(body, ledgerData, pdfDetails, ledger_documents) => {
    try {
        var slug;
        let dateFormat = await format.getDateFormat();

        var signature = await indexRepository.find('organization', ['organization_name', 'email_signature']);

        var fields = ['ledgers.date', 'ledgers.reference_id', 'ledgers.due_date', 'ledgers.status', 'ledgers.amount', 'cc.email_id', 'cc.display_name']
        var joins = [
            { table: 'companies as c', alias: 'c', condition: ['c.id', 'ledgers.company_id'] },
            { table: 'company_contacts as cc', alias: 'cc', condition: ['c.id', 'cc.company_id'] },
        ];

        var ledgersData = await indexRepository.find('ledgers', fields, { 'ledgers.id': body.ledger_id, 'cc.is_default': true }, null, joins);
        var ledgersparamsData = ledgersData?.data[0]
        if (ledgerData.status == 'Rejected') {
            slug = 'invoice-rejected'
            // Email subject replace object
            let replaceObj = {
                '{{invoice_date}}': moment(ledgersparamsData.date, dateFormat).format('MM/DD/YYYY'),
                '{{invoice_number}}': ledgersparamsData.reference_id,
                '{{display_name}}': ledgersparamsData.display_name,
                '{{invoice_due_date}}': moment(ledgersparamsData.due_date, dateFormat).format('MM/DD/YYYY'),
                '{{invoice_status}}': ledgersparamsData.status,
                '{{invoice_amount}}': ledgersparamsData.amount,
                '{{organization_signature}}': signature.status ? (signature.data[0].email_signature ? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
                '{{organization_name}}': signature.data[0].organization_name,
            };

            const templateData = await getEmailTemplate(replaceObj, slug);
            const emailData = {
                toEmail: ledgersparamsData.email_id,
                subject: templateData.subject,
                html: templateData.template,
            };
            sendMail(emailData);
            console.log(`Email Sent Successfully to ${ledgersparamsData.email_id}`);
        } else if (ledgerData.status == 'Approval In Progress') {
            var ledgersApproverCondition = await indexRepository.find('ledgers', ['id', 'company_id', 'approval_level'], { id: body.ledger_id });
            ledgersApproverCondition = ledgersApproverCondition.data[0]

            var ledgersCondition = {
                ledger_id: ledgersApproverCondition.id,
                approval_level: ledgersApproverCondition.approval_level,
                company_id: ledgersApproverCondition.company_id
            }

            const approvedUsers = (ledgerData.entity_type == INVOICES) ? await ledgersService.getApproverIds(ledgersCondition) : [];

            var slug = 'invoice-approval-pending'
            let dateFormat = await format.getDateFormat();

            var signature = await indexRepository.find('organization', ['organization_name', 'email_signature']);

            var fields = ['ledgers.date', 'ledgers.approval_level', 'ledgers.reference_id', 'ledgers.due_date', 'ledgers.status', 'ledgers.amount', 'cc.email_id', 'cc.display_name', 'c.name as client_name', 'c.reference_id as client_number']
            var joins = [
                { table: 'companies as c', alias: 'c', condition: ['c.id', 'ledgers.company_id'] },
                { table: 'company_contacts as cc', alias: 'cc', condition: ['c.id', 'cc.company_id'] },
            ];

            var ledgersData = await indexRepository.find('ledgers', fields, { 'ledgers.id': body.ledger_id }, null, joins);
            var ledgersparamsData = ledgersData?.data[0]
            // Email subject replace object
            let replaceObj = {
                '{{invoice_date}}': moment(ledgersparamsData.date, dateFormat).format('MM/DD/YYYY'),
                '{{invoice_number}}': ledgersparamsData.reference_id,
                '{{client_name}}': ledgersparamsData.client_name,
                '{{client_number}}': ledgersparamsData.client_number,
                '{{invoice_due_date}}': moment(ledgersparamsData.due_date, dateFormat).format('MM/DD/YYYY'),
                '{{invoice_status}}': ledgersparamsData.status,
                '{{current_approval_level}}': ledgersparamsData.approval_level,
                '{{invoice_amount}}': ledgersparamsData.amount,
                '{{organization_signature}}': signature.status ? (signature.data[0].email_signature ? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
                '{{organization_name}}': signature.data[0].organization_name,
            };

            approvedUsers.approval_users.map(async (userId) => {
                const employeeData = await indexRepository.find('employee', ['id', 'display_name', 'email_id'], { id: userId });
                replaceObj = { ...replaceObj, ...{ '{{display_name}}': employeeData.data[0].display_name } };
                const templateData = await getEmailTemplate(replaceObj, slug);
                const emailData = {
                    toEmail: employeeData.data[0].email_id,
                    subject: templateData.subject,
                    html: templateData.template,
                };
                await sendMail(emailData);
                console.log(`Email Sent Successfully to ${employeeData.data[0].email_id}`);
            })

        } else if (ledgerData.status == 'Approved') {
            var slug = 'send-invoice'

            var signature = await indexRepository.find('organization', ['organization_name', 'email_signature']);

            var fields = ['ledgers.date as invoice_date', 'c.name as client_name', 'cc.display_name', 'ledgers.due_date as invoice_due_date', 'c.reference_id as client_number', 'ledgers.status as invoice_status', 'ledgers.amount as invoice_amount', 'cc.first_name', 'ledgers.reference_id as invoice_number', 'cc.email_id']
            var joins = [
                { table: 'ledger_documents as ld', alias: 'ld', condition: ['ld.ledger_id', 'ledgers.id'], type: 'left' },
                { table: 'companies as c', alias: 'c', condition: ['c.id', 'ledgers.company_id'] },
                { table: 'company_contacts as cc', alias: 'cc', condition: ['c.id', 'cc.company_id'] },
            ];

            var invoiceData = await indexRepository.find('ledgers', fields, { 'ledgers.id': body.ledger_id, 'cc.is_default': true }, null, joins);
            invoiceData = invoiceData?.data[0]

            // Email subject replace object
            let replaceObj = {
                '{{invoice_date}}': moment(invoiceData.invoice_date, dateFormat).format('MM/DD/YYYY'),
                '{{client_name}}': invoiceData.client_name,
                '{{display_name}}': invoiceData.display_name,
                '{{invoice_due_date}}': moment(invoiceData.invoice_due_date, dateFormat).format('MM/DD/YYYY'),
                '{{client_number}}': invoiceData.client_number,
                '{{invoice_status}}': invoiceData.invoice_status,
                '{{invoice_amount}}': invoiceData.invoice_amount,
                '{{first_name}}': invoiceData.first_name,
                '{{invoice_number}}': invoiceData.invoice_number,
                '{{organization_signature}}': signature.status ? (signature.data[0].email_signature ? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
                '{{organization_name}}': signature.data[0].organization_name,
            };

            let attachments = [];

            if(ledger_documents.status) {
                ledger_documents.data.forEach(document => {
                    attachments.push({
                        filename: document.document_name,
                        path: document.document_url,
                    });
                });
            }

            if (pdfDetails.status) {
                const parsedUrl = url.parse(pdfDetails.data.data.pdf_link);
                const filename = path.basename(parsedUrl.pathname);
                const attachmentPath = path.join(process.env.DOCUMENT_PATH, parsedUrl.pathname);
                attachments.push({
                filename: filename,
                path: attachmentPath,
                });
            }

            const templateData = await getEmailTemplate(replaceObj, slug);
            const emailData = {
                toEmail: invoiceData.email_id,
                subject: templateData.subject,
                html: templateData.template,
                attachments : attachments,
            };
            await sendMail(emailData);
            console.log(`Email Sent Successfully to ${invoiceData.email_id}`);
        }
    } catch (err) {
        console.log(err);
    }
})

module.exports = { mailEvents };