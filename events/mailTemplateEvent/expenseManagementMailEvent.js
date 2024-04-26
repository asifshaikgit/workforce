const eventsEmitter = require('events');
const mailEvents = new eventsEmitter();
const { getEmailTemplate } = require('../../helpers/emailTemplate');
const { sendMail } = require('../../utils/emailSend');
const indexRepository = require('../../src/v1/user/repositories/index');
const format = require('../../helpers/format');
const config = require('../../config/app')
const moment = require('moment')
const url = require('url');
const path = require('path');

mailEvents.on('expenseManagementMail', async (body,expense_id) => {
    try {
        
        var fields = ['est.name as expense_type','expense_management.amount', 'expense_management.description' , 'expense_management.status' , 'expense_management.raised_date', 'emp.employment_type_id', 'emp.email_id' , 'emp.first_name' , 'emp.middle_name', 'emp.last_name', 'emp.display_name']
        var joins = [
            { table: 'employee as emp', alias: 'emp', condition: ['expense_management.employee_id', 'emp.id']},
            { table: 'expense_and_service_types as est', alias: 'est', condition: ['expense_management.expense_type_id', 'est.id']},
        ];

        var expenseData = await indexRepository.find('expense_management', fields , { 'expense_management.id': expense_id , 'est.referrable_type' : 2 }, null, joins);
        expenseData = expenseData?.data[0]

        var signature = await indexRepository.find('organization', ['organization_name', 'email_signature', 'currency_symbol']); 

        var slug;

        var expenseDocs = await indexRepository.find('expense_documents', ['document_url'] , { 'expense_documents.expense_id': expense_id  });

        let attachments = [];
        if (expenseDocs.status) {
            const parsedUrl = url.parse(expenseDocs.data[0].document_url);
            const decodedPathname = decodeURIComponent(parsedUrl.pathname);
            const filename = path.basename(decodedPathname);
        
            // Replace forward slashes with backslashes
            const fixedPathname = decodedPathname;
        
            var attachmentPath = path.join(process.env.DOCUMENT_PATH, decodedPathname);
            attachmentPath = attachmentPath.replace(/\//g, '\\')
        
            attachments.push({
                filename: filename,
                path: attachmentPath,
            });
        }        
        

        if (expenseData.status == 'Approved'  || expenseData.status == 'Processed') {
            slug = 'expense-approved';
        } else if (expenseData.status == 'Rejected') {
            slug = 'expense-rejected';
        } else if (expenseData.status == 'Submitted') {
            slug = 'expense-submitted';
        } else if (expenseData.status == 'Approval In Progress') {
            slug = 'expense-employee-approval';
        }
        let domainName;
        let dateFormat = await format.getDateFormat(); // date format
        if (expenseData.employment_type_id == 1) {
            domainName = config.domainName;
        } else {
            domainName = config.consultantDomainName;
        }

        var replaceObj = {
            '{{expense_type}}': expenseData.expense_type,
            '{{amount}}' : expenseData.amount,
            '{{currency}}': signature.data[0].currency_symbol || "",
            '{{date}}':  moment(expenseData.raised_date , dateFormat).format('DD-MM-YYYY') ,
            '{{first_name}}': expenseData.first_name,
            '{{middle_name}}': expenseData.middle_name || "",
            '{{last_name}}': expenseData.last_name,
            '{{display_name}}': expenseData.display_name,
            '{{email_id}}': expenseData.email_id,
            '{{expense_description}}': expenseData.description || '',
            '{{organization_name}}': signature.data[0].organization_name ,
            '{{approve_link}}' : null,
            '{{organization_signature}}': signature.status ? (signature.data[0].email_signature? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
            '{{sub_domain_name}}': body.login_subdomain_name,
            '{{domain_name}}': domainName
        };

        const templateData = await getEmailTemplate(replaceObj, slug);
        const emailData = {
            toEmail: expenseData.email_id,
            subject: templateData.subject,
            html: templateData.template,
            attachments : attachments,
        };
        sendMail(emailData);
        console.log(`Email Sent Successfully to ${expenseData.email_id}`);

    } catch (err) {
        console.log(err);
    }

});

module.exports = { mailEvents };