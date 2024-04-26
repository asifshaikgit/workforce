const eventsEmitter = require('events');
const mailEvents = new eventsEmitter();
const { getEmailTemplate } = require('../../helpers/emailTemplate');
const config = require('../../config/app')
const { sendMail } = require('../../utils/emailSend');
const indexRepository = require('../../src/v1/user/repositories/index');


mailEvents.on('consultantInvitationMail', async (body, signature, inviteEmployeeId) => {
    try {

        const slug = 'consultant-invitation';
        let domainName = config.domainName;

        // Email subject replace object
        let replaceObj = {
            '[Name]': body.first_name,
            '[full name]': body.first_name + ' ' + (body.middle_name == '' || body.middle_name == null ? '' : body.middle_name + ' ') + body.last_name,
            '[work_email_id]': body.email_id,
            '[Click Here]': `<a href="${config.host}://${body.loginSubDomainName}.${config.domainName}/${config.onboardingLink}/${body.tenant_id}?onboarding_id=${inviteEmployeeId}">Click Here</a>`,
            '[organization name]': (signature.status) ? signature.data[0].organization_name : '',
            '[Your Name]': body.logginUserName ? body.logginUserName : '',
            '[Your Position]': body.loginRoleName ? body.loginRoleName : '',
            '[Company Name]': (signature.status) ? signature.data[0].organization_name : '',
            '[Contact Information]': body.loggedInContactInfo ? body.loggedInContactInfo : '',
            '[position title]': 'Consultant',
        };

        const templateData = await getEmailTemplate(replaceObj, slug);
        const emailData = {
            toEmail: body.email_id,
            subject: templateData.subject,
            html: templateData.template,
        };
        sendMail(emailData);
        console.log(`Email Sent Successfully to ${body.email_id}`);

    } catch (err) {
        console.log(err);
    }

});

mailEvents.on('consultantreSubmitMail', async (body, signature, invitedEmployeeData) => {
    try {

        const slug = 'consultant-invitation';
        let domainName = config.domainName;

        // Email subject replace object
        let replaceObj = {
            '{{first_name}}': body.first_name,
            '{{display_name}}': body.first_name + ' ' + (body.middle_name == '' || body.middle_name == null ? '' : body.middle_name + ' ') + body.last_name,
            '{{work_email_id}}': body.email_id,
            '{{job_title}}': 'job_title',
            '{{invitation_url}}': `${config.host}://${body.loginSubDomainName}.${config.consultantDomainName}/${config.reSubmitLink}/${body.tenant_id}?onboarding_id=${body.id}`,
            '{{expiry_date}}': 'expiry_date',
            '{{organization_name}}': signature.status ? signature.data[0].organization_name : 'Organization Name',
            '{{organization_signature}}': signature.status ? (signature.data[0].email_signature ? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
            '{{sub_domain_name}}': body.login_subdomain_name,
            '{{domain_name}}': domainName,
            '{{onboarding_link}}': `${config.host}://${body.loginSubDomainName}.${config.consultantDomainName}/${config.reSubmitLink}/${body.tenant_id}?onboarding_id=${body.id}`,
        };

        const templateData = await getEmailTemplate(replaceObj, slug);
        const emailData = {
            toEmail: body.email_id,
            subject: templateData.subject,
            html: templateData.template,
        };
        sendMail(emailData);
        console.log(`Email Sent Successfully to ${body.email_id}`);

    } catch (err) {
        console.log(err);
    }

});

mailEvents.on('inviteEmployeeRemindersMail', async (body, condition) => {
    try {

        var signature = await indexRepository.find('organization', ['organization_name', 'email_signature']);
        var inviteEmployeeData = await indexRepository.find('invited_employee', ['*'], condition);
        inviteEmployeeData = inviteEmployeeData.data[0]


        var slug = 'consultant-invitation-reminder'

        let domainName = config.domainName;

        // Email subject replace object
        let replaceObj = {
            '{{first_name}}': inviteEmployeeData.first_name,
            '{{display_name}}': inviteEmployeeData.first_name + ' ' + (inviteEmployeeData.middle_name == '' || inviteEmployeeData.middle_name == null ? '' : inviteEmployeeData.middle_name + ' ') + inviteEmployeeData.last_name,
            '{{email_id}}': inviteEmployeeData.email_id,
            '{{job_title}}': 'job_title',
            '{{invitation_url}}': 'invitation_url',
            '{{expiry_date}}': inviteEmployeeData.link_expires_on,
            '{{organization_name}}': signature.status ? signature.data[0].organization_name : 'Organization Name',
            '{{organization_signature}}': signature.status ? (signature.data[0].email_signature ? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
            '{{sub_domain_name}}': body.login_subdomain_name,
            '{{domain_name}}': domainName,
            '{{onboarding_link}}': `${config.host}://${body.loginSubDomainName}.${config.consultantDomainName}/${config.onboardingLink}/${body.tenant_id}?onboarding_id=${condition.id}`,
        };

        const templateData = await getEmailTemplate(replaceObj, slug);
        const emailData = {
            toEmail: inviteEmployeeData.email_id,
            subject: templateData.subject,
            html: templateData.template,
        };
        sendMail(emailData);
        console.log(`Email Sent Successfully to ${inviteEmployeeData.email_id}`);

    } catch (err) {
        console.log(err);
    }

});

module.exports = { mailEvents };