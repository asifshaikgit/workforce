const eventsEmitter = require('events');
const mailEvents = new eventsEmitter();
const { getEmailTemplate } = require('../../helpers/emailTemplate');
const config = require('../../config/app')
const { sendMail } = require('../../utils/emailSend');
const indexRepository = require('../../src/v1/user/repositories/index');


mailEvents.on('employeeSelfServicetMail', async (employee, employeeSelReferenceID ,assignees) => {
    try {
        
        var employee_slug = 'self-service-request-employee';
        var employer_slug = 'self-service-request-employer';

        var signature = await indexRepository.find('organization', ['organization_name', 'email_signature']); 

        // Send email content object
        var replaceObj = {
            '{{first_name}}': employee.first_name,
            '{{last_name}}': employee.last_name,
            '{{display_name}}': employee.display_name,
            '{{reference_id}}': employeeSelReferenceID,
            '{{organization_signature}}': signature.status ? (signature.data[0].email_signature? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
        }

        var templateData = await getEmailTemplate(replaceObj, employee_slug); // Using common helper to get the email template data
        // Email object to send self service information
        var emailData = {
            toEmail: employee.email_id,
            subject: templateData.subject,
            html: templateData.template,
            attachments: templateData.attachments
        }
        sendMail(emailData); // Send email to consultant or contractor
        console.log(`Email Sent Successfully to ${employee.email_id}`);

        assignees.forEach(async (assignee) => {
            const templateData = await getEmailTemplate(replaceObj, employer_slug);
            const emailData = {
                toEmail: assignee.email_id,
                subject: templateData.subject,
                html: templateData.template,
            };
            
            await sendMail(emailData);
            console.log(`Email Sent Successfully to ${assignee.email_id}`);
            
        });

    } catch (err) {
        console.log(err);
    }

});

module.exports = { mailEvents };