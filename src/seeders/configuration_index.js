// const { randomPasswordGenerator } = require('../../helpers/globalHelper');
// const { sendMail } = require('../../utils/emailSend');
// const bcrypt = require('bcrypt');
// const documentCategoryDataSeed = require('./documentCategory');
// const modules = require('./module');
// const permissions = require('./permissions');
// const cycleDataSeed = require('./cycle');
// const daysDataSeed = require('./days');
// const prefixesDataSeed = require('./prefix');
// const invoiceSettingsSeed = require('./invoiceSettings-seed');  //
// const timesheetSettingsSeed = require('./timesheetSettings'); //
// const employmentTypesSeed = require('./employmentType');
// const countryDataSeed = require('./countries');
// const stateDataSeed = require('./states');
// const mailTemplateSeed = require('./mailTemplate');
// const templateParametersSeed = require('./templateParameters');
// const departmentDataSeed = require('./department');
// const teamsDataSeed = require('./team');
// const employeeCategoriesSeed = require('./employeeCategories');
// const rolesDataSeed = require('./roles');
// const rolePermissionsDataSeed = require('./rolePermissions');
// const updateSuperadminInformation = require('./updateSuperadminInformation');
// const groupsDataSeed = require('../seeders/groups');
// const notiifcationSettingsDataSeed = require('../seeders/notificationSettings');
// const invoiceEmailsDataSeed = require('../seeders/invoiceEmailTemplate');
// const netPayTermDataSeed = require('../seeders/netPayTerm');
// const educationLevelsDataSeed = require('../seeders/educationLevels');
// const expenseManagementDataSeed = require('../seeders/expenseManagement');
// const paymentModesDataSeed = require('../seeders/paymentModes');
// const skillDataSeed = require('../seeders/skills');
// const writeOffDataSeed = require('../seeders/writeOff');
// const jobTitlesDataSeed = require('../seeders/jobTitles');
// const workAuthorizationData = require('../seeders/workAuthorization');
// const personalDocumentsData = require('../seeders/personalDocuments');
// const selfOnboardingDocuments = require('../seeders/selfOnboardingDocuments');
// const ocrDocumentsDataSeed = require('../seeders/ocrDocument');  //
// const reminderTemplatesData = require('../seeders/reminderTemplates');
// const clientsDocumentDataSeed = require('./clientsDocument');
// const invoiceTheme = require('../seeders/invoiceTheme');
// const immigrationDocumentType = require('../seeders/immigrationDocumentTypes');  //
// const { domainName } = require('../../config/app');

// const seed = async (tenantDBConnection, admin) => {
//     const randomPassword = await randomPasswordGenerator();
//     let salt = await bcrypt.genSalt(10);
//     let hashedPassword = await bcrypt.hash(randomPassword, salt);
//     const superAdmin = {
//         first_name: admin.first_name,
//         last_name: admin.last_name,
//         display_name: admin.first_name + ' ' + admin.middle_name + ' ' + admin.last_name,
//         email_id: admin.email_id,
//         contact_number: admin.contact_number,
//         password: hashedPassword,
//         is_active: true,
//         employment_type_id: 1,
//         temp_password: true,
//         is_super_admin: true,
//         is_tenant_owner: true,
//         enable_login: true,
//         created_at: new Date(),
//         reference_id: 'EMP-1',
//     };
//     let superAdminInfo = await tenantDBConnection('employee').insert(superAdmin).returning('*');

//     let emailData = {
//         toEmail: superAdmin.email_id,
//         subject: 'Account Password ',
//         html: `<html> <head> <style> body { font-family: Arial, sans-serif; font-size: 16px; } .container { margin: 20px; } .header { color: #007bff; font-size: 24px; font-weight: bold; margin-bottom: 10px; } .message { margin-top: 10px; } b { font-weight: bold; } </style> </head> <body> <div class="container"> <h1 class="header">Account Password</h1> <div class="message"> <p>Hi ${superAdmin.display_name},</p> <p>Welcome to the workforce application. Please find the below login details to access the application:</p> </div> <div class="message"> <p><b>URL:</b> <a href="https://${admin.subdomain_name}.${domainName}">Click here to access the application<br><br>https://${admin.subdomain_name}.${domainName}</a></p> <p><b>User Email:</b> ${superAdmin.email_id}</p> <p><b>Password:</b> ${randomPassword}</p> </div> </div> </body> </html>`,
//     };

//     await documentCategoryDataSeed(tenantDBConnection);
//     await modules(tenantDBConnection);
//     await permissions(tenantDBConnection);
//     await cycleDataSeed(tenantDBConnection);
//     await daysDataSeed(tenantDBConnection);
//     await prefixesDataSeed(tenantDBConnection);
//     await departmentDataSeed(tenantDBConnection);
//     await employmentTypesSeed(tenantDBConnection);
//     await countryDataSeed(tenantDBConnection);
//     await stateDataSeed(tenantDBConnection);
//     await teamsDataSeed(tenantDBConnection); // not able to do 
//     await employeeCategoriesSeed(tenantDBConnection); // not able to do 
//     await rolesDataSeed(tenantDBConnection);
//     await rolePermissionsDataSeed(tenantDBConnection);// not able to do 
//     await groupsDataSeed(tenantDBConnection);
//     await netPayTermDataSeed(tenantDBConnection);
//     await educationLevelsDataSeed(tenantDBConnection);
//     await expenseManagementDataSeed(tenantDBConnection);
//     await paymentModesDataSeed(tenantDBConnection);
//     await skillDataSeed(tenantDBConnection);
//     await writeOffDataSeed(tenantDBConnection);
//     await jobTitlesDataSeed(tenantDBConnection);
//     await workAuthorizationData(tenantDBConnection);
//     await personalDocumentsData(tenantDBConnection);
//     await clientsDocumentDataSeed(tenantDBConnection);
//     await updateSuperadminInformation(tenantDBConnection, superAdminInfo, admin); // not able to do 
//     await sendMail(emailData);
// };


// const { categoryData } = require('../seeders/documentCategory');
// const { moduleData } = require('../seeders/modules');
// const { permissionsData } = require('../seeders/permissions');
// const { cycleData } = require('../seeders/cycle');
// const { daysData } = require('../seeders/days');
// const { prefixesData } = require('../seeders/prefix');
// const { departmentsData } = require('../seeders/department');
// const { employmentData } = require('../seeders/employmentType');
// const { countriesData } = require('../seeders/countries');
// const { stateData } = require('../seeders/states');
// const { rolesData } = require('../seeders/roles');
// const { groupsList } = require('../seeders/groups');
// const { netPayTermData } = require('../seeders/netPayTerm');
// const { educationLevelsData } = require('../seeders/educationLevels');
// const { expenseManagementsData } = require('../seeders/expenseManagement');
// const { paymentModesData } = require('../seeders/paymentModes');
// const { skillsData } = require('../seeders/skills');
// const { writeOffData } = require('../seeders/writeOff');
// const { jobTitlesData } = require('../seeders/jobTitles');
// const { workAuthorizationData } = require('../seeders/workAuthorization');
// const { personalDocumentsData } = require('../seeders/personalDocuments');
// const { clientsDocumentData } = require('../seeders/clientsDocument');
// const { mailTemplateData } = require('../seeders/mailTemplate');
// const { templateParametersData } = require('../seeders/templateParameters');

// const departmentDataSeed = async (tenant) => {
//     await tenant('document_categories').insert(categoryData);
//     await tenant('modules').insert(moduleData);
//     await tenant('permissions').insert(permissionsData);
//     await tenant('cycles').insert(cycleData);
//     await tenant('days').insert(daysData);
//     await tenant('prefixes').insert(prefixesData);
//     await tenant('departments').insert(departmentsData);
//     await tenant('employment_types').insert(employmentData);
//     await tenant('countries').insert(countriesData);
//     await tenant('states').insert(stateData);
//     await tenant('roles').insert(rolesData);
//     await tenant('groups').insert(groupsList);
//     await tenant('net_pay_terms').insert(netPayTermData);
//     await tenant('education_levels').insert(educationLevelsData);
//     await tenant('expense_management_types').insert(expenseManagementsData);
//     await tenant('payment_modes').insert(paymentModesData);
//     await tenant('skills').insert(skillsData);
//     await tenant('write_off').insert(writeOffData);
//     await tenant('job_titles').insert(jobTitlesData);
//     await tenant('visa_types').insert(workAuthorizationData);
//     await tenant('document_types').insert(personalDocumentsData);
//     await tenant('document_types').insert(clientsDocumentData);
//     await tenant('template_parameters').insert(templateParametersData);
//     await tenant('mail_template').insert(mailTemplateData);

// };

// module.exports = { seed };
