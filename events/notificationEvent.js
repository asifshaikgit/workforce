const EventEmitter = require('events');
const eventss = new EventEmitter();
const indexRepository = require('../src/v1/user/repositories/index');
const { allReplace } = require('../helpers/emailTemplate');
const moment = require('moment');
const format = require('../helpers/format')



eventss.on('notification', async (data) => {

    slug = data.slug
    switch (slug) {
        case 'consultant-invitation-notification':
            employees = []

            employees.push({ employee_id: data.loginUserId });

            // notifications
            var notificationData = await indexRepository.find('notification_settings', ['id', 'template'], { slug: slug }, null, [], null, 'id', 'desc', false, 'id') // getting the templates for the notification

            notificationUsers = await indexRepository.find('notification_group_users', ['employee_id'], { referrable_type: 2, referrable_id: notificationData.data[0].id }, null, [], null, 'id', 'asc', false) // to get notification employees
            if (notificationUsers.status) {
                employees = [...employees, ...notificationUsers?.data.filter(obj => obj.employee_id)]
            }

            replacedObj = {
                '{{full_name}}': data.first_name + ' ' + (data.middle_name == '' || data.middle_name == null ? '' : data.middle_name + ' ') + data.last_name,
            }; // object data to replace template data

            parsedTemplate = allReplace(notificationData.data[0].template, replacedObj); // replacing the object data with template data

            contentData = {
                id: notificationData.data[0].id,
                content: parsedTemplate,
                created_by: data.created_by
            }
            await notificationEmployee(contentData, employees)
            break;
        case 'timesheet-approval-notification':
            employees = []

            // Fetch the approval users
            joins = [
                { table: 'approval_users', condition: ['approval_users.approval_level_id', 'approval_levels.id'], type: 'left' },

                { table: 'employee', condition: ['employee.id', 'approval_users.approver_id'], type: 'left' }
            ];
            getApprovers = await indexRepository.find('approval_levels', ['approval_users.approver_id as employee_id'], { 'approval_levels.approval_setting_id': data.timesheet_approval_id, 'approval_levels.level': data.approval_level }, null, joins);

            if (getApprovers.status) {// if approvers exists pushing them to 
                // employees = [...employees, ...getApprovers?.data.filter(obj => obj.employee_id)]
                employees = getApprovers?.data.filter(obj => obj.employee_id)
            }

            joinss = [{ table: 'employee as emp', alias: 'emp', condition: ['emp.id', 'placements.employee_id'], type: 'left' },
            { table: 'companies as com', alias: 'com', condition: ['com.id', 'placements.client_id'], type: 'left' }]

            names = await indexRepository.find('placements', ['emp.display_name', 'com.name as client_name', 'emp.reference_id'], { 'placements.id': data.placement_id }, null, joinss) // getting names of employee and client for the template

            // notifications
            var notificationData = await indexRepository.find('notification_settings', ['id', 'template'], { slug: slug }, null, [], null, 'id', 'desc', false, 'id') // getting the templates for the notification

            notificationUsers = await indexRepository.find('notification_group_users', ['employee_id'], { referrable_type: 2, referrable_id: notificationData.data[0].id }, null, [], null, 'id', 'asc', false) // to get notification employees
            if (notificationUsers.status) {
                employees = [...employees, ...notificationUsers?.data.filter(obj => obj.employee_id)]
            }

            var ts_id = data.timesheet_reference_id ? data.timesheet_reference_id : data.reference_id
            replacedObj = {
                '{{timesheet_number}}': ts_id, // reference_id
                '{{full_name}}': names.status ? names.data[0].display_name : '',
                '{{employee_id}}': names.status ? names.data[0].reference_id : '',
                '{{client_name}}': names.status ? names.data[0].client_name : ''
            }; // object data to replace template data


            parsedTemplate = allReplace(notificationData.data[0].template, replacedObj); // replacing the object data with template data

            contentData = {
                id: notificationData.data[0].id,
                content: parsedTemplate,
                created_by: data.created_by
            }
            await notificationEmployee(contentData, employees)
            break;
        case 'invoice-approval-notification':
            employees = []

            dateFormat = await format.getDateFormat(); // date format

            // Fetch the approval users
            joins = [
                { table: 'approval_users', condition: ['approval_users.approval_level_id', 'approval_levels.id'], type: 'left' },

                { table: 'employee', condition: ['employee.id', 'approval_users.approver_id'], type: 'left' }
            ];
            getApprovers = await indexRepository.find('approval_levels', ['approval_users.approver_id as employee_id'], { 'approval_levels.approval_setting_id': data.invoice_approval_id, 'approval_levels.level': data.current_approval_level }, null, joins);

            if (getApprovers.status) {// if approvers exists pushing them to 
                // employees = [...employees, ...getApprovers?.data.filter(obj => obj.employee_id)]
                employees = getApprovers?.data.filter(obj => obj.employee_id)
            }

            joinss = [{ table: 'companies as com', alias: 'com', condition: ['com.id', 'ledgers.company_id'], type: 'left' }]

            names = await indexRepository.find('ledgers', ['com.name as client_name', 'ledgers.reference_id', 'ledgers.date as invoice_date', 'ledgers.due_date'], { 'ledgers.id': data.ledger_id }, null, joinss) // getting name client  and other details for the template

            // notifications
            var notificationData = await indexRepository.find('notification_settings', ['id', 'template'], { slug: slug }, null, [], null, 'id', 'desc', false, 'id') // getting the templates for the notification

            notificationUsers = await indexRepository.find('notification_group_users', ['employee_id'], { referrable_type: 2, referrable_id: notificationData.data[0].id }, null, [], null, 'id', 'asc', false) // to get notification employees
            if (notificationUsers.status) {
                employees = [...employees, ...notificationUsers?.data.filter(obj => obj.employee_id)]
            }

            var inv_id = data.invoice_reference_id ? data.invoice_reference_id : data.reference_id

            replacedObj = {
                '{{invoice_number}}': inv_id, // reference_id
                '{{invoice_date}}': names.status ? moment(names.data[0].invoice_date).format(dateFormat) : '',
                '{{due_date}}': names.status ? moment(names.data[0].due_date).format(dateFormat) : '',
                '{{client_name}}': names.status ? names.data[0].client_name : ''
            }; // object data to replace template data


            parsedTemplate = allReplace(notificationData.data[0].template, replacedObj); // replacing the object data with template data

            contentData = {
                id: notificationData.data[0].id,
                content: parsedTemplate,
                created_by: data.created_by
            }
            await notificationEmployee(contentData, employees)
            break;
        case 'new-invoice-notification':
            employees = []

            employees.push({ employee_id: data.loginUserId });

            dateFormat = await format.getDateFormat(); // date format

            // notifications
            var notificationData = await indexRepository.find('notification_settings', ['id', 'template'], { slug: slug }, null, [], null, 'id', 'desc', false, 'id') // getting the templates for the notification

            notificationUsers = await indexRepository.find('notification_group_users', ['employee_id'], { referrable_type: 2, referrable_id: notificationData.data[0].id }, null, [], null, 'id', 'asc', false) // to get notification employees
            if (notificationUsers.status) {
                employees = [...employees, ...notificationUsers?.data.filter(obj => obj.employee_id)]
            }

            replacedObj = {
                '{{invoice_number}}': data.reference_id, // reference_id
                '{{invoice_date}}': moment(data.date).format(dateFormat),
                '{{client_name}}': data.company_name
            }; // object data to replace template data

            parsedTemplate = allReplace(notificationData.data[0].template, replacedObj); // replacing the object data with template data

            contentData = {
                id: notificationData.data[0].id,
                content: parsedTemplate,
                created_by: data.created_by
            }
            await notificationEmployee(contentData, employees)
            break;
        case 'new-bills-notification':
            employees = []

            employees.push({ employee_id: data.loginUserId });

            dateFormat = await format.getDateFormat(); // date format

            // notifications
            var notificationData = await indexRepository.find('notification_settings', ['id', 'template'], { slug: slug }, null, [], null, 'id', 'desc', false, 'id') // getting the templates for the notification

            notificationUsers = await indexRepository.find('notification_group_users', ['employee_id'], { referrable_type: 2, referrable_id: notificationData.data[0].id }, null, [], null, 'id', 'asc', false) // to get notification employees
            if (notificationUsers.status) {
                employees = [...employees, ...notificationUsers?.data.filter(obj => obj.employee_id)]
            }

            replacedObj = {
                '{{bill_number}}': data.reference_id, // reference_id
                '{{due_date}}': moment(data.due_date).format(dateFormat),
                '{{vendor_name}}': data.company_name
            }; // object data to replace template data


            parsedTemplate = allReplace(notificationData.data[0].template, replacedObj); // replacing the object data with template data

            contentData = {
                id: notificationData.data[0].id,
                content: parsedTemplate,
                created_by: data.created_by
            }
            await notificationEmployee(contentData, employees)
            break;
    }

    async function notificationEmployee(data, employees) {
        if (employees.length > 0) {
            for (let key in employees) {
                var notificationObject = {
                    notification_slug_id: data.id,
                    employee_id: employees[key].employee_id,
                    content: data.content,
                    created_by: data.created_by
                }
                var notification = await indexRepository.store('notifications', notificationObject) // storing in the notifications table
                // notifications
            }
        }
    }
})

module.exports = { eventss };