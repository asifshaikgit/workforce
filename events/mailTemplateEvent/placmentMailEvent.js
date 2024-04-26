const eventsEmitter = require('events');
const mailEvents = new eventsEmitter();
const { getEmailTemplate } = require('../../helpers/emailTemplate');
const config = require('../../config/app')
const { sendMail } = require('../../utils/emailSend');
const indexRepository = require('../../src/v1/user/repositories/index');
const moment = require('moment')
const format = require('../../helpers/format');


mailEvents.on('placementMail', async (body,placement_id) => {
    try {
        let dateFormat = await format.getDateFormat();

        const slug = 'placement';
        var fields = ['emp.display_name', 'emp.email_id' , 'emp.employment_type_id', 'emp.first_name', 'emp.last_name', 'jt.name as job_title', 'placements.project_name', 'placements.work_email_id', 'placements.start_date', 'placements.end_date', 'c.name as client_name', 'ec.name as end_client_name', 'placements.notice_period']
        var joins = [
            { table: 'job_titles as jt', alias: 'jt', condition: ['placements.job_title_id', 'jt.id'], type: 'left' },
            { table: 'employee as emp', alias: 'emp', condition: ['placements.employee_id', 'emp.id'], type: 'left' },
            { table: 'companies as c', alias: 'c', condition: ['placements.client_id', 'c.id'], type: 'left' },
            { table: 'companies as ec', alias: 'ec', condition: ['placements.end_client_id', 'ec.id'], type: 'left' },
        ];

        var placementClientData = await indexRepository.find('placements', fields, { 'placements.id': placement_id }, null, joins);
        placementClientData = placementClientData?.data[0]

        var signature = await indexRepository.find('organization', ['organization_name', 'email_signature', 'invite_link_expiry']); // Fetch the organization signature


        let domainName = config.domainName;
        if (placementClientData.employment_type_id !== 1) {
            domainName = config.consultantDomainName;
        }

        // Define replace object for email content
        let replaceObj = {
            '{{display_name}}': placementClientData.display_name,
            '{{first_name}}': placementClientData.first_name,
            '{{last_name}}': placementClientData.last_name,
            '{{work_email_id}}': placementClientData.work_email_id,
            '{{email_id}}': placementClientData.email_id,
            '{{project_name}}': placementClientData.project_name || "-",
            '{{start_date}}': moment(placementClientData.start_date).format(dateFormat),
            '{{end_date}}': moment(placementClientData.end_date).format(dateFormat) || "-",
            '{{job_title}}': placementClientData.job_title || "-",
            '{{client_name}}': placementClientData.client_name,
            '{{end_client_name}}': placementClientData.end_client_name || "-",
            '{{notice_period}}': placementClientData.notice_period || "-",
            '{{organization_name}}': signature.data[0].organization_name,
            '{{organization_signature}}': signature.status ? (signature.data[0].email_signature ? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
            '{{sub_domain_name}}': body.login_subdomain_name,
            '{{domain_name}}': domainName
        };

        // Get email template
        const templateData = await getEmailTemplate(replaceObj, slug);

        // Prepare email data
        const emailData = {
            toEmail: placementClientData.email_id,
            subject: templateData.subject,
            html: templateData.template,
        };
        
        // Send email
        sendMail(emailData);
        console.log(`Email Sent Successfully to ${placementClientData.email_id}`);

    } catch (err) {
        console.log(err);
    }

});

module.exports = { mailEvents };