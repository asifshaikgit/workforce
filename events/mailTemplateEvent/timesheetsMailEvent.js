const eventsEmitter = require('events');
const mailEvents = new eventsEmitter();
const { getEmailTemplate } = require('../../helpers/emailTemplate');
const config = require('../../config/app')
const { sendMail } = require('../../utils/emailSend');
const moment = require('moment');
const format = require('../../helpers/format');
const indexRepository = require('../../src/v1/user/repositories/index');

const getApproverIds = async (placement) => {

    let approvers = [];

    const response = await indexRepository.find('placements', ['id', 'timesheet_approval_id'], { id: placement?.placement_id });
    const timesheet_approval_id = response?.data[0]?.timesheet_approval_id;
    if (timesheet_approval_id) {
        const joins = [
            { table: 'approval_users', condition: ['approval_users.approval_level_id', 'approval_levels.id'], type: 'left' }
        ];

        approvers = await indexRepository.find('approval_levels', ['approval_users.approver_id'], { 'approval_levels.approval_setting_id': timesheet_approval_id, 'approval_levels.level': placement?.approval_level }, null, joins);

        approvers = (approvers?.data?.length > 0) ? approvers?.data?.map(item => String(item.approver_id)) : [];
        return {
            approval_users: approvers,
            timesheet_approval_id: timesheet_approval_id
        };
    } else {
        return approvers;
    }
}

mailEvents.on('timesheetsApprovalMail', async (body, timesheet_id) => {
    try {

        var timesheetApproversCondition = await indexRepository.find('timesheets', ['id', 'placement_id', 'approval_level'], { id: timesheet_id });
        timesheetApproversCondition = timesheetApproversCondition.data[0]

        var timesheetsCondition = {
            id: timesheetApproversCondition.id,
            approval_level: timesheetApproversCondition.approval_level,
            placement_id: timesheetApproversCondition.placement_id
        }

        const approvedUsers = await getApproverIds(timesheetsCondition) || [];

        var fields = ['emp.employment_type_id', 'emp.email_id', 'emp.employment_type_id', 'timesheets.status as timesheet_status', 'timesheets.from as from_date', 'timesheets.to as to_date', 'timesheets.approved_on as timesheet_approval_date', 'timesheets.reference_id as timesheet_number', 'plc.reference_id as placement_number', 'timesheets.approval_level', 'c.reference_id as client_number', 'c.name as client_name']
        var joins = [
            { table: 'placements as plc', alias: 'plc', condition: ['plc.id', 'timesheets.placement_id'] },
            { table: 'employee as emp', alias: 'emp', condition: ['plc.employee_id', 'emp.id'] },
            { table: 'companies as c', alias: 'c', condition: ['plc.client_id', 'c.id'] },
        ];

        var timesheetsData = await indexRepository.find('timesheets', fields, { 'timesheets.id': timesheet_id }, null, joins);
        timesheetsData = timesheetsData?.data[0]

        var signature = await indexRepository.find('organization', ['organization_name', 'email_signature']);

        var slug = 'timesheet-approval-pending'
        let domainName;
        let dateFormat = await format.getDateFormat(); // date format
        if (timesheetsData.employment_type_id == 1) {
            domainName = config.domainName;
        } else {
            domainName = config.consultantDomainName;
        }

        var replaceObj = {
            '{{timesheet_status}}': timesheetsData.timesheet_status,
            '{{timesheet_number}}': timesheetsData.timesheet_number,
            '{{placement_number}}': timesheetsData.placement_number,
            '{{client_number}}': timesheetsData.client_number,
            '{{client_name}}': timesheetsData.client_name,
            '{{from_date}}': moment(timesheetsData.from_date, dateFormat).format('MM/DD/YYYY'),
            '{{to_date}}': moment(timesheetsData.to_date, dateFormat).format('MM/DD/YYYY'),
            '{{current_approval_level}}': timesheetsData.approval_level,
            '{{organization_name}}': signature.data[0].organization_name,
            '{{organization_signature}}': signature.status ? (signature.data[0].email_signature ? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
            '{{sub_domain_name}}': body.login_subdomain_name,
            '{{domain_name}}': domainName
        };

        approvedUsers.approval_users.map(async (userId) => {
            const employeeData = await indexRepository.find('employee', ['id', 'first_name', 'display_name', 'email_id'], { id: userId });
            replaceObj = {
                ...replaceObj,
                ...{
                    '{{display_name}}': employeeData.data[0].display_name,
                    '{{first_name}}': employeeData.data[0].first_name,
                }
            };
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

});

mailEvents.on('timesheetsStatusApprovalMail', async (body, timesheet_id, statusUpdate) => {
    try {

        var fields = ['emp.display_name', 'emp.first_name', 'emp.employment_type_id', 'emp.email_id', 'timesheets.id', 'timesheets.status as timesheet_status', 'timesheets.from as from_date', 'timesheets.to as to_date', 'timesheets.approved_on as timesheet_approval_date', 'timesheets.reference_id', 'timesheets.placement_id', 'timesheets.approval_level', 'plc.reference_id as placement_number', 'c.reference_id as client_number', 'c.name as client_name', 'timesheets.approval_level']
        var joins = [
            { table: 'placements as plc', alias: 'plc', condition: ['plc.id', 'timesheets.placement_id'] },
            { table: 'employee as emp', alias: 'emp', condition: ['plc.employee_id', 'emp.id'] },
            { table: 'companies as c', alias: 'c', condition: ['plc.client_id', 'c.id'] },
        ];

        var timesheetsData = await indexRepository.find('timesheets', fields, { 'timesheets.id': timesheet_id }, null, joins);
        timesheetsData = timesheetsData?.data[0]

        var signature = await indexRepository.find('organization', ['organization_name', 'email_signature']);

        var slug
        let domainName;
        var templateData;
        var emailData;
        let replaceObj;

        var timesheetsCondition = {
            id: timesheetsData.id,
            approval_level: timesheetsData.approval_level,
            placement_id: timesheetsData.placement_id
        }

        const approvedUsers = await getApproverIds(timesheetsCondition) || [];

        let dateFormat = await format.getDateFormat(); // date format
        if (timesheetsData.employment_type_id == 1) {
            domainName = config.domainName;
        } else {
            domainName = config.consultantDomainName;
        }

        replaceObj = {
            '{{timesheet_status}}': timesheetsData.timesheet_status,
            '{{timesheet_reference_id}}': timesheetsData.reference_id,
            '{{timesheet_number}}': timesheetsData.reference_id,
            '{{placement_number}}': timesheetsData.placement_number,
            '{{client_number}}': timesheetsData.client_number,
            '{{client_name}}': timesheetsData.client_name,
            '{{from_date}}': moment(timesheetsData.from_date, dateFormat).format('MM/DD/YYYY'),
            '{{to_date}}': moment(timesheetsData.to_date, dateFormat).format('MM/DD/YYYY'),
            '{{timesheet_approval_date}}': timesheetsData.timesheet_status == 'Approved' ? moment(statusUpdate?.approved_on, dateFormat).format('MM/DD/YYYY') : '-',
            '{{current_approval_level}}': timesheetsData.approval_level,
            '{{first_name}}': timesheetsData.first_name,
            '{{display_name}}': timesheetsData.display_name,
            '{{organization_name}}': signature.data[0].organization_name,
            '{{organization_signature}}': signature.status ? (signature.data[0].email_signature ? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
            '{{sub_domain_name}}': body.login_subdomain_name,
            '{{domain_name}}': domainName
        };

        if (timesheetsData.timesheet_status == 'Approved') {
            slug = 'timesheet-approved-notification';
        } else if (timesheetsData.timesheet_status == 'Rejected') {
            slug = 'timesheet-rejected';
        } else if (timesheetsData.timesheet_status == 'Approval In Progress' || timesheetsData.timesheet_status == 'Submitted') {
            slug = 'timesheet-approval-pending';
        }

        if (timesheetsData.timesheet_status == 'Approved' || timesheetsData.timesheet_status == 'Rejected') {
            templateData = await getEmailTemplate(replaceObj, slug);
            emailData = {
                toEmail: timesheetsData.email_id,
                subject: templateData.subject,
                html: templateData.template,
            };
            await sendMail(emailData);
            console.log(`Email Sent Successfully to ${timesheetsData.email_id}`);
        } else if (timesheetsData.timesheet_status == 'Approval In Progress' || timesheetsData.timesheet_status == 'Submitted') {
            await Promise.all(approvedUsers.approval_users.map(async (userId) => {
                const employeeData = await indexRepository.find('employee', ['id', 'first_name', 'display_name', 'email_id'], { id: userId });
                replaceObj = {
                    ...replaceObj,
                    ...{
                        '{{display_name}}': employeeData.data[0].display_name,
                        '{{first_name}}': employeeData.data[0].first_name,
                    }
                };
                templateData = await getEmailTemplate(replaceObj, slug);
                emailData = {
                    toEmail: employeeData.data[0].email_id,
                    subject: templateData.subject,
                    html: templateData.template,
                };
                await sendMail(emailData);
                console.log(`Email Sent Successfully to ${employeeData.data[0].email_id}`);
            }));
        }

    } catch (err) {
        console.log(err);
    }

});


module.exports = { mailEvents, getApproverIds };