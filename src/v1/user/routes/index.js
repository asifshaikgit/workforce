const express = require('express');
const router = express.Router();
require('dotenv').config();
const { connectionRequest, subdomainRequestConnection, subdomainRequestConnectionEstablish } = require('../../../middlewares/connectionResolver');  // Tenant connection resolver
const { verifyToken, permissionsAccessCheck, verifyDomain, verifyTenant } = require('../middleware/authorization');  // Token Verification

// Configuration Module Functions
const categoryController = require('../controllers/configurations/employee/categoryController');// Category Controller
const departmentController = require('../controllers/configurations/employee/departmentController'); // Department Controller
const educationLevelController = require('../controllers/configurations/employee/educationLevelController'); // Education Level Controller
const employeeTeamController = require('../controllers/configurations/employee/employeeTeamController'); // Employee Team Controller
const employmentTypeController = require('../controllers/configurations/employee/employmentTypeController'); // Employment Type Controller
const relationshipTypesController = require('../controllers/configurations/employee/relationshipTypesController'); // Relationship Types Controller
const skillController = require('../controllers/configurations/employee/skillController'); // Skill Controller
const visaDocumentTypeController = require('../controllers/configurations/employee/visaDocumentTypeController'); // Visa Document Type Controller
const visaTypeController = require('../controllers/configurations/employee/visaTypeController'); // Visa Type Controller
const countryController = require('../controllers/configurations/location/countryController'); // Country Controller
const stateController = require('../controllers/configurations/location/stateController'); // State Controller
const cyclesController = require('../controllers/configurations/cyclesController'); // Cycles Controller
const daysController = require('../controllers/configurations/daysController'); // Days Controller
const timesheetConfigurationsController = require('../controllers/configurations/timesheet/timesheetConfigurationsController');
const timesheetSettingsController = require('../controllers/configurations/timesheet/timesheetSettingsController');
const notificationSettingsController = require('../controllers/configurations/notificationSettingsController'); // Notification Settings Controller
const organizationController = require('../controllers/configurations/organizationController');
const organizationContactInformationController = require('../controllers/configurations/organizationContactInformationController'); // Invoice Contact Information Controller
const jobTitleController = require('../controllers/configurations/placements/jobTitleController'); // Job Title Controller
const documentTypesController = require('../controllers/configurations/documentTypesController'); // Document Types Controller
const payrollConfigurationController = require('../controllers/configurations/payrollConfigurationController'); // Pay Roll Configuration Controller
const payrollConfigSettingsController = require('../controllers/configurations/payrollConfigSettingsController'); // Pay Roll Configuration Settings Controller
const permissionsController = require('../controllers/configurations/permissionsController'); // Permissions Controller
const prefixController = require('../controllers/configurations/prefixesController'); // Prefix Controller
const paymentModeController = require('../controllers/configurations/invoices/paymentModeController'); // Payment Mode controller
const invoiceTaxesController = require('../controllers/configurations/invoices/invoiceTaxesController'); // Invoice Taxes Controller
const invoiceWriteOffController = require('../controllers/configurations/invoices/invoiceWriteOffController'); // Invoice Write Off Controller
const invoiceConfigurationsController = require('../controllers/configurations/invoices/invoiceConfigurationsController'); // Invoice Configurations COntroller
const expenseAndServiceTypesController = require('../controllers/configurations/expenseAndServiceTypesController'); // Self Service Types Controller
const netPayTermsController = require('../controllers/configurations/netPayTermsController'); // Net Pay Terms Controller
const invoiceSettingsController = require('../controllers/configurations/invoices/invoiceSettingsController'); // Invoice Settings controller
const invoiceEmailTemplatesController = require('../controllers/configurations/invoices/invoiceEmailTemplatesController'); // Invoice Email Templates Controller
const typesController = require('../controllers/configurations/workPermit/typesController');
const documentController = require('../controllers/configurations/workPermit/documentController');
const groupsConfigurationsController = require('../controllers/configurations/groupsConfigurationsController'); // Groups Configuration Controller
const roleController = require('../controllers/configurations/roleController'); // Role Controller
const reminderController = require('../controllers/configurations/reminderController'); // Reminder Controller
const selfReminderController = require('../controllers/configurations/selfReminderController'); // self Reminder Controller
const approvalConfigurationController = require('../controllers/configurations/approvalConfigurationController'); // Approval Configurations Controller
const actionNotificationConfigController = require('../controllers/configurations/actionNotificationConfigController'); // Action Notification Configurations Controller
const onBoardingDocumentTypesController = require('../controllers/configurations/onBoardingDocumentTypesController');
const employeeController = require('../controllers/employee/employeeController'); // employee controller
const employeeEmergencyContactController = require('../controllers/employee/emergencyContactInfoController')// Employee Emergency Contact Controller
const templateController = require('../controllers/template/templateController') // Template Controller
const { login, forgotPassword, verifyOtpSendPassword, logout, changepassword, resetpassword, regenerateNewPassword } = require('../../../v1/user/controllers/accountController');  //Account controller
const i94DetailsController = require('../controllers/employee/i94DetailsController')// Employee I94 Details Controller
const educationDetailsController = require('../controllers/employee/educationDetailsController'); // education controller
const visaController = require('../controllers/employee/visaController') // Employee Visa Controller
const employeePersonalDocuments = require('../controllers/employee/employeePersonalDocumentController');  // employee personal document
const payCycleConfigurations = require("../controllers/employee/payCycleConfigurationController");
const employeeVacationController = require('../controllers/employee/employeeVacationController')// Employee Emergency Contact Contr
const bankAccountDetailsController = require('../controllers/employee/bankAccountDetailsController') // Employee Bank Details Controller
const companiesController = require('../controllers/companies/companiesController'); // companies controller
const companyContactsController = require('../controllers/companies/companyContactsController'); // companies controller
const companyCommentsController = require('../controllers/companies/companyCommentsController'); // clients controller
const placementClientController = require('../controllers/placement/placementClientController.js'); // clients config placement controller
const placementDashboardController = require('../controllers/placement/placementDashboardController.js'); // clients config placement controller
const placementBillingController = require('../controllers/placement/placementBillingController'); // Bills config placement controller
const placementInvoiceController = require('../controllers/placement/placementInvoiceController'); // Bills config placement controller
const clientTimesheetController = require('../controllers/companies/clientTimesheetController'); // clients timesheet controller
const clientInvoiceController = require('../controllers/companies/clientInvoiceController'); // clients invoice controller
const placementTimesheetController = require('../controllers/placement/placementTimesheetController.js'); // Timesheet config placement controller
const dashboardController = require('../controllers/dashboard/dashboardController'); // dashboard controller
const configurationActivityController = require('../controllers/configurations/activityTrackController');// configuration activity controller
const ActivityController = require('../controllers/activityController');// main modules activity controller
const ledgerRecurringConfigurationController = require('../controllers/ledgers/ledgerRecurringConfigurationController');
const announcementController = require('../controllers/configurations/announcementController');


/**
 * @constant ledgersController to perform operation on ledgers module at database
*/
const ledgersController = require('../controllers/ledgers/ledgersController');

/**
 * @constant ledgersPaymentController to perform operation on ledgers module at database
*/
const ledgersPaymentController = require('../controllers/ledgers/ledgersPaymentController');

/**
 * @constant expenseManagementController to perform operation on users module at database
*/
const expenseManagementController = require('../controllers/expense_management/expenseManagementController.js');

/**
 * @constant employeePassportController to perform operation on employee password at database
*/
const employeePassportController = require('../controllers/employee/employeePassportController');
const employeeDependentDetailsController = require('../controllers/employee/employeeDependentDetailsController'); // employee dependents
const { documentUpload, documentsStore } = require('../../../v1/user/controllers/common/documentController');

/**
 * @constant employeePayrollConfigurationController to perform operation on employee password at database
*/
const employeePayrollConfigurationController = require('../controllers/employee/payrollConfigurationController');

/**
 * @constant employeeSelfServiceController to perform operation on Employee Self Service at database
*/
const employeeSelfServiceController = require('../controllers/employee_self_service/employeeSelfServiceController');

/**
 * @constant employeeSelfServiceChatController to perform operation on Employee Self Service chat operations at database
*/
const employeeSelfServiceChatController = require('../controllers/employee_self_service/employeeSelfServiceChatController');

/**
 * @constant timeSheetsController to perform operation on timesheets at database
*/
const timesheetsController = require('../controllers/timesheet/timesheetsController');
const timesheetCalender = require('../controllers/timesheet/timesheetCalender');

/**
 * @constant employeeSkillsController to perform operation on employee_skills at database
*/
const employeeSkillsController = require('../controllers/employee/employeeSkillsController');

/**
 * @constant payRollController to generate payroll for employee at database
*/
const payRollController = require('../controllers/payroll/payRollController')

/**
 * @constant balanceSheetController to perfoem operation on balancesheet at database
*/
const balanceSheetController = require('../controllers/balancesheet/balanceSheetController');

/**
 * Invite Via Link Controller
 */
const inviteEmployeeController = require('../controllers/employee/inviteEmployeeController');

/**
 * @module routes
*/
// Authentication Routes
router.post('/login', subdomainRequestConnection, login);
router.post('/forgotpassword', subdomainRequestConnection, forgotPassword);  // Forgot Password OTP
router.post('/verify-otp', subdomainRequestConnection, verifyOtpSendPassword); // Random Password for Forgot Password 
router.post('/logout', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), logout);
router.post('/changepassword', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), changepassword); // Update Password
router.post('/resetpassword', subdomainRequestConnection, resetpassword); // Update Password without token
router.post("/regeneratePassword", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), regenerateNewPassword) // Reset Password

router.post('/upload/(:any)', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), documentUpload.array('files'), documentsStore);
router.post('/open-upload/(:any)', verifyDomain, subdomainRequestConnection, documentUpload.array('files'), documentsStore);
//router.get('/urlToBlob', verifyDomain, subdomainRequestConnection, permissionsAccessCheck('not_applicable'), urlToBlob);

// Category Routes
router.post('/categories/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_employee'), categoryController.store);
router.get('/categories/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_employee'), categoryController.index);
router.delete('/categories/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_delete', 'configuration_employee'), categoryController.destroy);
router.put('/categories/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_employee'), categoryController.update);
router.get('/categories/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_employee'), categoryController.listing);
router.get('/categories/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), categoryController.dropdown);
router.put('/categories/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_employee'), categoryController.updateStatus);

// Department Routes
router.post('/departments/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_employee'), departmentController.store);
router.get('/departments/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_employee'), departmentController.index);
router.delete('/departments/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_delete', 'configuration_employee'), departmentController.destroy);
router.put('/departments/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_employee'), departmentController.update);
router.get('/departments/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_employee'), departmentController.listing);
router.get('/departments/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), departmentController.dropdown);
router.put('/departments/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_employee'), departmentController.updateStatus);

// Education Level Routes
router.post('/education-levels/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_employee'), educationLevelController.store);
router.get('/education-levels/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_employee'), educationLevelController.index);
router.delete('/education-levels/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_delete', 'configuration_employee'), educationLevelController.destroy);
router.put('/education-levels/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_employee'), educationLevelController.update);
router.get('/education-levels/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_employee'), educationLevelController.listing);
router.get('/education-levels/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), educationLevelController.dropdown);
router.put('/education-levels/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_employee'), educationLevelController.updateStatus);

// Employee Team Routes
router.get('/employee-team/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_employee'), employeeTeamController.index);
router.post('/employee-team/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_employee'), employeeTeamController.store);
router.delete('/employee-team/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_delete', 'configuration_employee'), employeeTeamController.destroy);
router.put('/employee-team/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_employee'), employeeTeamController.update);
router.get('/employee-team/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), employeeTeamController.dropdown);
router.get('/employee-team/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_employee'), employeeTeamController.listing);
router.put('/employee-team/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_employee'), employeeTeamController.updateStatus);

// Employment Type Routes
router.get('/employment-types/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_employee'), employmentTypeController.listing);
router.get('/employment-types/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), employmentTypeController.dropdown);

// Relationship Type Routes
router.post('/relationship-type/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_employee'), relationshipTypesController.store);
router.get('/relationship-type/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_employee'), relationshipTypesController.index);
router.put('/relationship-type/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_employee'), relationshipTypesController.update);
router.delete('/relationship-type/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_delete', 'configuration_employee'), relationshipTypesController.destroy);
router.get('/relationship-type/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_employee'), relationshipTypesController.listing);
router.get('/relationship-type/dropdown', verifyToken, connectionRequest, relationshipTypesController.dropdown);
router.put('/relationship-type/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_employee'), relationshipTypesController.updateStatus);

// Skills Routes
router.post('/skills/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_employee'), skillController.store);
router.get('/skills/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_employee'), skillController.index);
router.delete('/skills/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_delete', 'configuration_employee'), skillController.destroy);
router.put('/skills/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_employee'), skillController.update);
router.get('/skills/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_employee'), skillController.listing);
router.get('/skills/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), skillController.dropdown);
router.put('/skills/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_employee'), skillController.updateStatus);

// Visa Documents type Routes
router.post('/visa-document-types/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_employee'), visaDocumentTypeController.store);
router.get('/visa-document-types/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_employee'), visaDocumentTypeController.index);
router.delete('/visa-document-types/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_delete', 'configuration_employee'), visaDocumentTypeController.destroy);
router.put('/visa-document-types/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_employee'), visaDocumentTypeController.update);
router.get('/visa-document-types/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_employee'), visaDocumentTypeController.listing);
router.get('/visa-document-types/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), visaDocumentTypeController.dropdown);
router.put('/visa-document-types/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_employee'), visaDocumentTypeController.updateStatus);

// Visa Type Routes
router.post('/visa-types/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_employee'), visaTypeController.store);
router.get('/visa-types/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_employee'), visaTypeController.index);
router.delete('/visa-types/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_delete', 'configuration_employee'), visaTypeController.destroy);
router.put('/visa-types/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_employee'), visaTypeController.update);
router.get('/visa-types/index/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_employee'), visaTypeController.index);
router.get('/visa-types/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_employee'), visaTypeController.listing);
router.get('/visa-types/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), visaTypeController.dropdown);
router.put('/visa-types/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_employee'), visaTypeController.updateStatus);

router.get('/organization/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_organization'), organizationController.index);
router.post('/organization/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_organization'), organizationController.store);
router.put('/organization/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_organization'), organizationController.update);
router.get('/organization/get-invoice-theme', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_organization'), organizationController.getInvoiceTheme);
router.put('/organization/update-invoice-theme/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_organization'), organizationController.updateInvoiceTheme);
router.get('/organization/get-signature', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_organization'), organizationController.emailSignatureindex);
router.put('/organization/signature/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_organization'), organizationController.emailSignatureUpdate);
router.get('/organization/profile-url', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_organization'), organizationController.profile);
router.get('/organization/active-invoice-theme', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_organization'), organizationController.getActiveInvoiceThemeData);
router.put('/organization/settings/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_organization'), organizationController.updateOrganizationSettings);

// Country Routes
router.post('/country/store', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), countryController.store);
router.delete('/country/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), countryController.destroy);
router.put('/country/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), countryController.update);
router.get('/country/dropdown', verifyToken, connectionRequest, countryController.dropdown);
router.get('/country/listing', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), countryController.listing);
router.put('/country/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), countryController.updateStatus);

// State Routes
router.put('/state/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), stateController.updateStatus);
router.post('/state/store', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), stateController.store);
router.delete('/state/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), stateController.destroy);
router.put('/state/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), stateController.update);
router.get('/state/dropdown', verifyToken, connectionRequest, stateController.dropdown);
router.get('/state/listing', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), stateController.listing);

// Cycles Routes
router.get('/cycles/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), cyclesController.dropdown);

// Days Routes
router.get('/days/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), daysController.dropdown);

// Timesheet Configurations Routes
router.post('/timesheet-configurations/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_timesheet'), timesheetConfigurationsController.store);
router.get('/timesheet-configurations/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_timesheet'), timesheetConfigurationsController.index);
router.put('/timesheet-configurations/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_timesheet'), timesheetConfigurationsController.update);

// Timesheet Settings Routes
router.get('/timesheet-settings/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_timesheet'), timesheetSettingsController.index);
router.put('/timesheet-settings/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_timesheet'), timesheetSettingsController.update);

// Notification Settings Routes
router.put('/notification-settings/update', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_notification'), notificationSettingsController.update);
router.get('/notification-settings/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), notificationSettingsController.dropdown);
router.get('/notification-settings/index', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), notificationSettingsController.index);
router.post('/notification/update-read/:id', verifyToken, connectionRequest, permissionsAccessCheck('configuration_notification'), notificationSettingsController.updateRead);
router.post('/notification/listing', verifyToken, connectionRequest, permissionsAccessCheck('configuration_notification'), notificationSettingsController.listing);

// Pay Roll Configuration Routes
router.get('/payroll-config/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), payrollConfigurationController.dropdown);

// Default Permissions Routes
router.get('/permissions', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), permissionsController.index);

// Prefixes routes
router.get('/prefixes/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_organization'), prefixController.index);
router.put('/prefixes/update', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_organization'), prefixController.update);
router.get('/prefixes/getPrefix', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), prefixController.getPrefix);

// Template Routes  /:slug
router.get("/templates/list-param", verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_template'), templateController.listParam)
router.put("/templates/update", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), templateController.update)
router.get("/templates/dropdown", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), templateController.dropdown)
router.get("/templates/index", verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_template'), templateController.index)

// Approval Configuration Routes
router.post('/approvals/(:any)/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create'), approvalConfigurationController.store);
router.get('/approvals/(:any)/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view'), approvalConfigurationController.index);
router.put('/approvals/(:any)/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit'), approvalConfigurationController.update);

// Organization Contact Information Routes - used for bills and payments and invoice
router.post('/organization-contact-info/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_organization'), organizationContactInformationController.store);
router.put('/organization-contact-info/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_organization'), organizationContactInformationController.update);
router.get('/organization-contact-info/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_organization'), organizationContactInformationController.index);

// Job Titles Routes
router.post('/job-title/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_placement'), jobTitleController.store);
router.put('/job-title/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_placement'), jobTitleController.update);
router.get('/job-title/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_placement'), jobTitleController.index);
router.get('/job-title/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_placement'), jobTitleController.listing);
router.put('/job-title/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_placement'), jobTitleController.updateStatus);
router.get('/job-title/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), jobTitleController.dropdown);
router.delete('/job-title/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_delete', 'configuration_placement'), jobTitleController.destroy);

// Document Types routes
router.post('/document-types/(:any)/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create'), documentTypesController.store);
router.put('/document-types/(:any)/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit'), documentTypesController.update);
router.put('/document-types/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit'), documentTypesController.updateStatus);
router.get('/document-types/(:any)/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view'), documentTypesController.listing);
router.get('/document-types/(:any)/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view'), documentTypesController.index);
router.get('/document-types/(:any)/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), documentTypesController.dropdown);
router.delete('/document-types/(:any)/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_delete'), documentTypesController.destroy);

// Payment Mode Routes
router.post('/payment-mode/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_invoice'), paymentModeController.store);
router.put('/payment-mode/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_invoice'), paymentModeController.update);
router.put('/payment-mode/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_invoice'), paymentModeController.updateStatus);
router.get('/payment-mode/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_invoice'), paymentModeController.listing);
router.get('/payment-mode/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_invoice'), paymentModeController.index);
router.get('/payment-mode/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), paymentModeController.dropdown);
router.delete('/payment-mode/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_delete', 'configuration_invoice'), paymentModeController.destroy);

// Invoice Taxes Routes
router.post('/invoice-taxes/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_invoice'), invoiceTaxesController.store);
router.put('/invoice-taxes/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_invoice'), invoiceTaxesController.update);
router.put('/invoice-taxes/update-enable-tax-invoice', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_invoice'), invoiceTaxesController.updateEnableTaxInvoice);
router.get('/invoice-taxes/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_invoice'), invoiceTaxesController.listing);
router.get('/invoice-taxes/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_invoice'), invoiceTaxesController.index);
router.get('/invoice-taxes/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), invoiceTaxesController.dropdown);
router.delete('/invoice-taxes/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_delete', 'configuration_invoice'), invoiceTaxesController.destroy);

// Invoice Write Off Routes
router.post('/write-off/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_invoice'), invoiceWriteOffController.store);
router.put('/write-off/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_invoice'), invoiceWriteOffController.update);
router.put('/write-off/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_invoice'), invoiceWriteOffController.updateStatus);
router.get('/write-off/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_invoice'), invoiceWriteOffController.listing);
router.get('/write-off/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_invoice'), invoiceWriteOffController.index);
router.get('/write-off/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), invoiceWriteOffController.dropdown);
router.delete('/write-off/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_delete', 'configuration_invoice'), invoiceWriteOffController.destroy);

//Expense Management & Employee Self Service Types Routes 
router.post('/config/(:any)/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_', 'expenseAndService'), expenseAndServiceTypesController.store);
router.put('/config/(:any)/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_', 'expenseAndService'), expenseAndServiceTypesController.update);
router.put('/config/(:any)/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_', 'expenseAndService'), expenseAndServiceTypesController.updateStatus);
router.get('/config/(:any)/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_', 'expenseAndService'), expenseAndServiceTypesController.listing);
router.get('/config/(:any)/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_', 'expenseAndService'), expenseAndServiceTypesController.index);
router.get('/config/(:any)/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), expenseAndServiceTypesController.dropdown);
router.delete('/config/(:any)/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_delete', 'configuration_', 'expenseAndService'), expenseAndServiceTypesController.destroy);

// Invoice Configurations Routes
router.post('/invoice/raise/configurations/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_invoice'), invoiceConfigurationsController.store);
router.put('/invoice/raise/configurations/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_invoice'), invoiceConfigurationsController.update);
router.get('/invoice/raise/configurations/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_invoice'), invoiceConfigurationsController.index);

// Net Pay Terms Routes
router.post('/net-pay-terms/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_client'), netPayTermsController.store);
router.put('/net-pay-terms/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_client'), netPayTermsController.update);
router.put('/net-pay-terms/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_client'), netPayTermsController.updateStatus);
router.get('/net-pay-terms/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_client'), netPayTermsController.listing);
router.get('/net-pay-terms/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_client'), netPayTermsController.index);
router.get('/net-pay-terms/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), netPayTermsController.dropdown);
router.delete('/net-pay-terms/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_delete', 'configuration_client'), netPayTermsController.destroy);

// Invoice Settings Routes
router.get('/invoice-settings/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_invoice'), invoiceSettingsController.index);
router.put('/invoice-settings/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_invoice'), invoiceSettingsController.update);

// Invoice Email Templates Routes
router.post('/invoice-email-templates/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_invoice'), invoiceEmailTemplatesController.store);
router.put('/invoice-email-templates/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_invoice'), invoiceEmailTemplatesController.update);
router.get('/invoice-email-templates/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_invoice'), invoiceEmailTemplatesController.index);

// immigration-case-types
router.post("/work-authorization/types/store", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), typesController.store);
router.put("/work-authorization/types/update/:id", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), typesController.update);
router.put("/work-authorization/types/updateStatus/:id", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), typesController.updateStatus)
router.get("/work-authorization/types/listing", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), typesController.listing)
router.get("/work-authorization/types/dropdown", verifyToken, connectionRequest, typesController.dropdown)
router.delete("/work-authorization/types/destroy/:id", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), typesController.destroy)

// immigration-documents-types
router.post("/work-authorization/documents-types/store", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), documentController.store);
router.put("/work-authorization/documents-types/update/:id", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), documentController.update);
router.put("/work-authorization/documents-types/updateStatus/:id", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), documentController.updateStatus)
router.get("/work-authorization/documents-types/listing", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), documentController.listing)
router.get("/work-authorization/documents-types/dropdown", verifyToken, connectionRequest, documentController.dropdown)
router.delete("/work-authorization/documents-types/destroy/:id", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), documentController.destroy)

// Group Routes
router.post('/groups/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_group'), groupsConfigurationsController.store);
router.put('/groups/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_group'), groupsConfigurationsController.update);
router.put('/groups/updateStatus/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_group'), groupsConfigurationsController.updateStatus);
router.get('/groups/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), groupsConfigurationsController.dropdown);
router.get('/groups/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_group'), groupsConfigurationsController.index);
router.delete('/groups/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_delete', 'configuration_group'), groupsConfigurationsController.destroy);

// Role routes
router.post('/role/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_role'), roleController.store);
router.put('/role/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_role'), roleController.update);
router.put('/role/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_role'), roleController.updateStatus);
router.get('/role/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_role'), roleController.listing);
router.get('/role/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_role'), roleController.index);
router.get('/role/permissions', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), roleController.fetchRolePermissions);
router.get('/role/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), roleController.dropdown);
router.delete('/role/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_delete', 'configuration_role'), roleController.destroy);

// Reminder Routes
router.post('/reminder-config/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create'), reminderController.store);
router.put('/reminder-config/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit'), reminderController.update);
router.put('/reminder-config/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit'), reminderController.updateStatus);
// router.get('/reminder-config/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view'), reminderController.listing);
router.get('/reminder-config/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view'), reminderController.index);
router.get('/reminders/listing/:referrable_type', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), reminderController.remindersListing);
router.get('/reminder-config/payroll-config-dates', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view'), reminderController.payrollConfigDates);
router.put('/reminders/is-read/:id', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), reminderController.isRead);

// Self Reminder Routes
router.post('/self-reminder-config/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create'), selfReminderController.store);
router.put('/self-reminder-config/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit'), selfReminderController.update);
router.post('/self-reminder-config/update-status', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit'), selfReminderController.updateStatus);
// router.put('/self-reminder-config/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit'), selfReminderController.updateStatus);
router.get('/self-reminder-config/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view'), selfReminderController.listing);
router.get('/self-reminder-config/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view'), selfReminderController.index);
router.delete('/self-reminder-config/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_delete', 'configuration_role'), selfReminderController.destroy);

// Pay Roll Config Settings Routes
// router.post('/payroll-config-settings/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_organization'), payrollConfigSettingsController.store);
router.post('/payroll-config-settings/store', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), payrollConfigSettingsController.store);
router.put('/payroll-config-settings/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_organization'), payrollConfigSettingsController.update);
router.get('/payroll-config-settings/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_organization'), payrollConfigSettingsController.listing);
router.get('/payroll-config-settings/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_organization'), payrollConfigSettingsController.index);
router.get('/payroll-config-settings/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), payrollConfigSettingsController.dropdown);
router.get('/payroll-config-settings/previous', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view'), payrollConfigSettingsController.previous);
router.get('/payroll-config-settings/payroll-list', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view'), payrollConfigSettingsController.payrollList);
router.get('/payroll-config-settings/payroll-upcoming-list', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view'), payrollConfigSettingsController.upcomingPayrollList);
router.get('/payroll-config-settings/payroll-dashboard', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view'), payrollConfigSettingsController.payrollDashboard);

/**Upto here completed */

router.post("/employee/store", verifyToken, connectionRequest, permissionsAccessCheck('employee_create'), employeeController.store)
router.put("/employee/update/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_create'), employeeController.update)
router.get("/employee/index", verifyToken, connectionRequest, permissionsAccessCheck('employee_view'), employeeController.index)
router.post("/employee/listing", verifyToken, connectionRequest, permissionsAccessCheck('employee_view'), employeeController.listing)
router.get("/employee/dropdown", verifyToken, connectionRequest, permissionsAccessCheck('employee_view'), employeeController.dropdown)
router.get("/employee/payroll-settings", verifyToken, connectionRequest, permissionsAccessCheck('employee_create'), employeeController.getPayrollConfigSettings)
router.put('/employee/update-profile/:id', verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), employeeController.updateProfile)
router.post('/employee/check-duplicate', verifyToken, connectionRequest, permissionsAccessCheck('employee_edit','employee_create'), employeeController.checkDuplicate)

/** Employee Off Boarding Flow */
// router.post("/employee/off-board", verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), employeeController.offBoardEmployee);
router.post("/employee/finish-off-board", verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), employeeController.finishOffBoardEmployee);
router.get("/employee/off-board", verifyToken, connectionRequest, permissionsAccessCheck('employee_view'), employeeController.employeeOffBoardingDetails);

router.get("/employee/payroll-pay-config", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), employeeController.payrollPayConfigurations)
router.put("/employee/basic-details/update/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), employeeController.basicDetailsUpdate)
router.put("/employee/contact-details/update/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), employeeController.contactDetailsUpdate)
router.post("/employee-emergency-contact/store", verifyToken, connectionRequest, permissionsAccessCheck('employee_create'), employeeEmergencyContactController.store)
router.put("/employee-emergency-contact/update", verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), employeeEmergencyContactController.update)
router.delete("/employee-emergency-contact/destroy/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_delete'), employeeEmergencyContactController.destroy)
router.put("/employee/current-address/update/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), employeeController.currentAddressUpdate)
router.put("/employment-details/update/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), employeeController.employmentDetailsUpdate)
router.put("/employee/e-verify-status/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), employeeController.eVerifyStatus)
router.put("/employee/deactivate-user/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), employeeController.deactivateUser)
router.get("/employee/get-relieving", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), employeeController.getRelieving)
router.put("/employee/rejoin-user/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), employeeController.rejoinUser);
router.put("/employee/update-access", verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), employeeController.loginAccessUpdate)
router.put("/employee/disable-payroll", verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), employeeController.disablePayroll)
router.put("/employee/confirm-rehire", verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), employeeController.confirmRehire)
router.get("/employee/salary-per-payroll-amount", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), employeeController.salaryPerPayroll)
router.get("/employee/get-profile", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), employeeController.getProfileIndex)
router.put("/employee/profile/update", verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), employeeController.updateEmployeeProfile)

// Invite employee link apis - Employeer/Admin Side Includes Token Verification.
router.post('/employee/invite-via-link', verifyToken, connectionRequest, permissionsAccessCheck('employee_create'), inviteEmployeeController.store); // create and send invitation link
router.post('/employee/invite-via-link/listing', verifyToken, connectionRequest, permissionsAccessCheck('employee_view'), inviteEmployeeController.listing); // list of employees from invite via link
router.get('/employee/invite-via-link/index', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), inviteEmployeeController.index); // get index for admin with token to approve or reject
router.put('/employee/invitation-reminder/:id', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), inviteEmployeeController.invitationReminder); // To remind the invitation to employee
router.put('/employee/invite-via-link/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), inviteEmployeeController.updateStatus); // To Approve or reject the uploaded documents
router.put('/employee/invite-via-link/onboard-employee', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), inviteEmployeeController.onboardEmployee); // To onboard the employee after Approval.
router.post('/employee/invite-via-link/update-document-status', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), inviteEmployeeController.updateDocumentStatus);

// Invite employee link apis - Employee Side Includes Domain Verification.
router.put('/employee/update-invite-link/:id', verifyDomain, subdomainRequestConnection, inviteEmployeeController.update); // submit invite via link employee
router.get('/employee/invite-via-link', verifyDomain, subdomainRequestConnection, inviteEmployeeController.index); // get index api for invited employee without token
router.put('/employee/invite-via-link/resubmit-documents/:id', verifyDomain, subdomainRequestConnection, permissionsAccessCheck('not_applicable'), inviteEmployeeController.updateStatus); // To Resubmit the documents for reverification

//i94DetailsController
router.post("/i94-details/store", verifyToken, connectionRequest, permissionsAccessCheck('employee_create'), i94DetailsController.store)
router.put("/i94-details/update/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), i94DetailsController.update)
router.get("/i94-details/index", verifyToken, connectionRequest, permissionsAccessCheck('employee_view'), i94DetailsController.index)
router.delete("/i94-details/destroy/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_delete'), i94DetailsController.destroy)
router.delete("/i94-details/deleteDocument/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_delete'), i94DetailsController.destroyDocument);

/** Employee Passport store and update */
router.post("/passport/store", verifyToken, connectionRequest, permissionsAccessCheck('employee_create'), employeePassportController.store);
router.put("/passport/update/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), employeePassportController.update);
router.get("/passport/index", verifyToken, connectionRequest, permissionsAccessCheck('employee_view'), employeePassportController.index);
router.delete("/passport/destroy/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_delete'), employeePassportController.destroy)
router.delete("/passport/deleteDocument/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_delete'), employeePassportController.destroyDocument);

//Employee Education
router.post("/employee-education/store", verifyToken, connectionRequest, permissionsAccessCheck('employee_create'), educationDetailsController.store)
router.put("/employee-education/update/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), educationDetailsController.update)
router.get("/employee-education/index", verifyToken, connectionRequest, permissionsAccessCheck('employee_view'), educationDetailsController.index)
router.delete("/employee-education/destroy/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_delete'), educationDetailsController.destroy)
router.delete("/employee-education/deleteDocument/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_delete'), educationDetailsController.destroyDocument)

// Employee Visa Routes
router.post("/employee-visa/store", verifyToken, connectionRequest, permissionsAccessCheck('employee_create'), visaController.store)
router.put("/employee-visa/update/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), visaController.update)
router.get("/employee-visa/index", verifyToken, connectionRequest, permissionsAccessCheck('employee_view'), visaController.index)
router.delete("/employee-visa/destroy/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_delete'), visaController.destroy)
router.delete("/employee-visa/deleteDocument/:id", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), visaController.destroyDocument)

//employee personal documents
router.post('/employee-personal-document/store', verifyToken, connectionRequest, permissionsAccessCheck('employee_create'), employeePersonalDocuments.store);
router.put('/employee-personal-document/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), employeePersonalDocuments.update);
router.get('/employee-personal-document/index', verifyToken, connectionRequest, permissionsAccessCheck('employee_view'), employeePersonalDocuments.index);
router.delete('/employee-personal-document/deleteDocument/:id', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), employeePersonalDocuments.destroyDocument);
router.delete('/employee-personal-document/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('employee_delete'), employeePersonalDocuments.destroy);

// Employee Bank Details Routes
router.post('/bank-account-details/store', verifyToken, connectionRequest, permissionsAccessCheck('employee_create'), bankAccountDetailsController.store);
router.put('/bank-account-details/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), bankAccountDetailsController.update);
router.delete('/bank-account-details/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('employee_delete'), bankAccountDetailsController.destroy);
router.get('/bank-account-details/index', verifyToken, connectionRequest, permissionsAccessCheck('employee_view'), bankAccountDetailsController.index);

// Employee Payroll Configuration Routes
router.put("/employee-payroll-configuration", verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), employeePayrollConfigurationController.updatePayroll);

//employee dependent details
router.post('/employee-dependent/store', verifyToken, connectionRequest, permissionsAccessCheck('employee_create'), employeeDependentDetailsController.store);
router.get('/employee-dependent/index', verifyToken, connectionRequest, permissionsAccessCheck('employee_view'), employeeDependentDetailsController.index);
router.delete('/employee-dependent/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('employee_delete'), employeeDependentDetailsController.destroy);
router.put('/employee-dependent/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), employeeDependentDetailsController.update);
router.get('/employee-dependent/listing', verifyToken, connectionRequest, permissionsAccessCheck('employee_view'), employeeDependentDetailsController.listing);
router.get('/employee-dependent/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), employeeDependentDetailsController.dropdown);
router.delete("/employee-dependent/deleteDocument/:id", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), employeeDependentDetailsController.destroyDocument)

//Employee Skills
router.get("/employee-skills/index", verifyToken, connectionRequest, permissionsAccessCheck('employee_view'), employeeSkillsController.index)
router.post("/employee-skills/store", verifyToken, connectionRequest, permissionsAccessCheck('employee_create'), employeeSkillsController.store)
router.delete("/employee-skills/destroy/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_delete'), employeeSkillsController.destroy)
router.put("/employee-skills/update/:id", verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), employeeSkillsController.update)
router.delete("/employee-skills/deleteDocument/:id", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), employeeSkillsController.destroyDocument)

/**
 * @module expenseManagement
 * Add Expense
**/
router.post('/expense-management/store', verifyToken, connectionRequest, permissionsAccessCheck('expense_management_create'), expenseManagementController.store);
router.put('/expense-management/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('expense_management_edit'), expenseManagementController.update);
router.get('/expense-management/index', verifyToken, connectionRequest, permissionsAccessCheck('expense_management_view'), expenseManagementController.index)
router.put('/expense-management/approvel-expense', verifyToken, connectionRequest, permissionsAccessCheck('expense_management_edit'), expenseManagementController.approveExpense);
router.delete("/expense-management/destroy/:id", verifyToken, connectionRequest, permissionsAccessCheck('expense_management_edit'), expenseManagementController.destroy);
router.post("/expense-management/listing", verifyToken, connectionRequest, permissionsAccessCheck('expense_management_view'), expenseManagementController.listing);
router.put('/expense-management/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), expenseManagementController.updateStatus);

//Pay Cycle Configurations
router.post('/paycycle/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create', 'configuration_organization'), payCycleConfigurations.store)
router.get('/paycycle/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view', 'configuration_organization'), payCycleConfigurations.index)
router.put('/paycycle/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit', 'configuration_organization'), payCycleConfigurations.update)

//employee vacation
router.post('/employee-vacation/store', verifyToken, connectionRequest, permissionsAccessCheck('employee_create'), employeeVacationController.store)
router.put('/employee-vacation/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('employee_edit'), employeeVacationController.update)
router.get('/employee-vacation/listing', verifyToken, connectionRequest, permissionsAccessCheck('employee_view'), employeeVacationController.listing)
router.get('/employee-vacation/vacation-dates', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), employeeVacationController.vacationDates)
router.delete('/employee-vacation/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('employee_delete'), employeeVacationController.destroy)

// companies routes
router.get('/companies/(:any)/dashboardData', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), companiesController.dashboardData);
router.get('/companies/(:any)/listing', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), companiesController.listing);
router.put('/companies/(:any)/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('_edit', null, 'companies'), companiesController.updateStatus);
router.delete('/companies/(:any)/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('_delete', null, 'companies'), companiesController.destroy);
router.get('/companies/(:any)/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), companiesController.dropdown);
router.put('/companies/(:any)/update-profile/:id', verifyToken, connectionRequest, permissionsAccessCheck('_edit', null, 'companies'), companiesController.updateProfile);

router.post('/companies/(:any)/company-details/store', verifyToken, connectionRequest, permissionsAccessCheck('_create', null, 'companies'), companiesController.store)
router.get('/companies/(:any)/company-details/index', verifyToken, connectionRequest, permissionsAccessCheck('_view', null, 'companies'), companiesController.index)
router.put('/companies/(:any)/company-details/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('_edit', null, 'companies'), companiesController.update);
router.post('/companies/(:any)/add-address', verifyToken, connectionRequest, permissionsAccessCheck('_create', null, 'companies'), companiesController.companyAddress);
router.get('/companies/(:any)/get-company-address', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), companiesController.getCompanyAddress);

//companies Contacts
// router.post('/companies/(:any)/contacts/store', verifyToken, connectionRequest, permissionsAccessCheck('_create', null, 'companies'), companyContactsController.store)
router.post('/companies/(:any)/contacts/store', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), companyContactsController.store)
router.get('/companies/(:any)/contacts/index', verifyToken, connectionRequest, permissionsAccessCheck('_view', null, 'companies'), companyContactsController.index)
router.put('/companies/(:any)/contacts/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('_edit', null, 'companies'), companyContactsController.update)
router.delete('/companies/(:any)/contacts/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('_delete', null, 'companies'), companyContactsController.destroy)
router.get('/companies/(:any)/contacts/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('_view', null, 'companies'), companyContactsController.dropdown)

// //Client Comments Routes
router.post('/companies/(:any)/comment/store', verifyToken, connectionRequest, permissionsAccessCheck('_create', null, 'companies'), companyCommentsController.store)
router.put('/companies/(:any)/comment/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('_edit', null, 'companies'), companyCommentsController.update)
router.get('/companies/(:any)/comment/listing', verifyToken, connectionRequest, permissionsAccessCheck('_view', null, 'companies'), companyCommentsController.listing)
router.get('/companies/(:any)/comment/index', verifyToken, connectionRequest, permissionsAccessCheck('_view', null, 'companies'), companyCommentsController.index)

// Client Timesheet configurations
router.post('/companies/timesheet/store', verifyToken, connectionRequest, permissionsAccessCheck('_create', null, 'companies'), clientTimesheetController.store)
router.put('/companies/timesheet/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('_edit', null, 'companies'), clientTimesheetController.update)
router.get('/companies/timesheet/index', verifyToken, connectionRequest, permissionsAccessCheck('_view', null, 'companies'), clientTimesheetController.index)

// Client Invoice configurations
router.post('/companies/invoice/store', verifyToken, connectionRequest, permissionsAccessCheck('_create', null, 'companies'), clientInvoiceController.store)
router.put('/companies/invoice/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('_edit', null, 'companies'), clientInvoiceController.update)
router.get('/companies/invoice/index', verifyToken, connectionRequest, permissionsAccessCheck('_view', null, 'companies'), clientInvoiceController.index)

/**
 * @module Placements Module
 */
// Placements Client
router.post('/placement/client/store', verifyToken, connectionRequest, permissionsAccessCheck('placement_create'), placementClientController.store);
router.put('/placement/client/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('placement_create'), placementClientController.update);
router.get("/placement/listing", verifyToken, connectionRequest, permissionsAccessCheck('placement_view'), placementClientController.listing);
router.get("/placement/index", verifyToken, connectionRequest, permissionsAccessCheck('placement_view'), placementClientController.index);
router.get('/placement/client/dropdown', verifyToken, connectionRequest, permissionsAccessCheck('placement_view'), placementClientController.dropdown);
router.put("/placement/employee-pay", verifyToken, connectionRequest, permissionsAccessCheck('placement_view'), placementClientController.employeePay)
router.put("/placement/duplicate-check", verifyToken, connectionRequest, permissionsAccessCheck('placement_create'), placementClientController.placementDuplicateCheck)
router.put("/placement/employee/default-pay", verifyToken, connectionRequest, permissionsAccessCheck('placement_create'), placementClientController.employeeDefaultPayCheck)


/** Placement Dashboard Data */
router.get('/placement/status-analytics/:type?', verifyToken, connectionRequest, permissionsAccessCheck('placement_view'), placementDashboardController.statusAnalytics);
router.post('/placement/dashboard-analytics', verifyToken, connectionRequest, permissionsAccessCheck('placement_view'), placementDashboardController.dashboardAnalytics);
router.get('/placement/employee-attrition-rate', verifyToken, connectionRequest, permissionsAccessCheck('placement_view'), placementDashboardController.employeeAttritionRate);

/**
 * @module TimeSheets Module
 */
router.post('/timesheets/store', verifyToken, connectionRequest, permissionsAccessCheck('timesheet_create'), timesheetsController.store);
router.put('/timesheets/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('timesheet_create'), timesheetsController.update);
router.delete('/timesheet/delete/:id', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), timesheetsController.deleteTimesheet);
router.post('/timesheets/status', verifyToken, connectionRequest, permissionsAccessCheck('timesheet_edit'), timesheetsController.status);
router.get('/timesheets/listing', verifyToken, connectionRequest, permissionsAccessCheck('timesheet_view'), timesheetsController.listing);
router.get('/timesheets/index', verifyToken, connectionRequest, permissionsAccessCheck('timesheet_view'), timesheetsController.index);
router.get('/timesheets/dashboard/cards/:type?', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), timesheetsController.dashboardCardsData);
router.get('/timesheets/invoice-ready-data/:id', verifyToken, connectionRequest, permissionsAccessCheck('timesheet_view'), timesheetsController.invoiceReadyTimesheet);
router.post('/timesheets/ocr/store', verifyToken, connectionRequest, permissionsAccessCheck('timesheet_create'), timesheetsController.ocrStore);

// Timesheet Calender
router.post("/timesheet/range-total-view", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), timesheetCalender.rangeTotalView);
router.post("/timesheet/weeks-view", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), timesheetCalender.WeeksView);
router.post("/timesheets/calendar", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), timesheetCalender.calendarView)

// Placement Billing
router.post('/placement/billing/store', verifyToken, connectionRequest, permissionsAccessCheck('placement_create'), placementBillingController.store)
router.get('/placement/billing/index', verifyToken, connectionRequest, permissionsAccessCheck('placement_view'), placementBillingController.index)

// Placement Invoice
router.post('/placement/invoice/store', verifyToken, connectionRequest, permissionsAccessCheck('placement_create'), placementInvoiceController.store)
router.put('/placement/invoice/update', verifyToken, connectionRequest, permissionsAccessCheck('placement_edit'), placementInvoiceController.update)
router.get('/placement/invoice/index', verifyToken, connectionRequest, permissionsAccessCheck('placement_view'), placementInvoiceController.index)

// Placement Timesheet
router.post('/placement/timesheet/store', verifyToken, connectionRequest, permissionsAccessCheck('placement_create'), placementTimesheetController.store)
router.put('/placement/timesheet/update', verifyToken, connectionRequest, permissionsAccessCheck('placement_edit'), placementTimesheetController.update)
router.get('/placement/timesheet/index', verifyToken, connectionRequest, permissionsAccessCheck('placement_view'), placementTimesheetController.index)
router.get('/placement/(:slug)/approved-users', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), placementTimesheetController.approvedUsers);

/**
 * @module exployeeSelfService
 */
//Employee Self Service 
router.post('/employee-self-service/store', verifyToken, connectionRequest, permissionsAccessCheck('employee_self_service_create'), employeeSelfServiceController.store);
router.get('/employee-self-service/index', verifyToken, connectionRequest, permissionsAccessCheck('employee_self_service_view'), employeeSelfServiceController.index)
router.put('/employee-self-service/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('employee_self_service_edit'), employeeSelfServiceController.update)
router.post('/employee-self-service/listing', verifyToken, connectionRequest, permissionsAccessCheck('employee_self_service_view'), employeeSelfServiceController.listing)
// router.get('/employee-self-service/employee-listing', verifyToken, connectionRequest, permissionsAccessCheck('employee_self_service_view'), employeeSelfServiceController.employeelisting)
router.put('/employee-self-service/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('employee_self_service_edit'), employeeSelfServiceController.ticketStatus)
router.get('/employee-self-service/get-employee', verifyToken, connectionRequest, permissionsAccessCheck('employee_self_service_view'), employeeSelfServiceController.selfServiceEmployee)


/**
 * @module employeeSelfServiceChat
 */
router.get('/employee-self-service/chat-messages', verifyToken, connectionRequest, permissionsAccessCheck('employee_self_service_view'), employeeSelfServiceChatController.chatMessages);

/**
 * @module ledgersModule
 */
// router.post('/ledgers/(:any)/store', verifyToken, connectionRequest, permissionsAccessCheck('_create', null, 'ledgers'), ledgersController.store);
// router.put('/ledgers/(:any)/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('_edit', null, 'ledgers'), ledgersController.update);
// router.delete('/ledgers/item/delete', verifyToken, connectionRequest, permissionsAccessCheck('_delete', null, 'ledgers'), ledgersController.destroy);
// router.get('/ledgers/uninvoiced-timesheets', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ledgersController.getUninvoicedTimesheets);
// router.get('/ledgers/employee-details', verifyToken, connectionRequest, permissionsAccessCheck('_view', null, 'ledgers'), ledgersController.getEmployeeDetailsByClientId);
// router.post('/ledgers/item-detais-autocalculate', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ledgersController.getLedgerItemDetailsByTimesheetIds); // Used only for invoice ledgers types.
// router.get('/ledgers/(:any)/listing', verifyToken, connectionRequest, permissionsAccessCheck('_view', null, 'ledgers'), ledgersController.listing);
// router.get('/ledgers/(:any)/index', verifyToken, connectionRequest, permissionsAccessCheck('invoice_view'), ledgersController.index);
router.get('/ledgers/(:any)/dashboard-data', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ledgersController.dashboardData);
router.get('/ledgers/(:any)/listing', verifyToken, connectionRequest, permissionsAccessCheck('_view', null, 'ledgers'), ledgersController.listing);
router.get('/ledgers/(:any)/index', verifyToken, connectionRequest, permissionsAccessCheck('invoice_view'), ledgersController.index);
router.get('/ledgers/(:any)/employee-details/:id', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ledgersController.getEmployeeDetails);
router.get('/ledgers/uninvoiced-timesheets', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ledgersController.getUninvoicedTimesheets);
router.post('/ledgers/item-detais-autocalculate', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ledgersController.getLedgerItemDetailsByTimesheetIds); // Used only for invoice ledgers types.
router.post('/ledgers/(:any)/store', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ledgersController.store);
router.put('/ledgers/(:any)/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ledgersController.update);
router.post('/ledgers/update-status', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ledgersController.updateStatus);
router.delete('/ledgers/item/delete', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ledgersController.destroy);
router.post('/ledgers/(:any)/send-email-notification', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ledgersController.sendEmailNotification);
router.post('/ledgers/(:any)/reminder/:id', verifyToken, connectionRequest, permissionsAccessCheck('invoice_view'), ledgersController.ledgersReminder);
router.get('/ledgers/(:any)/theme', verifyToken, connectionRequest, permissionsAccessCheck('invoice_view'), ledgersController.ledgersTheme);

/**
 * @module paymentsModule
 */
router.post('/ledger-payments/(:any)/store', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ledgersPaymentController.store);
router.put('/ledger-payments/(:any)/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ledgersPaymentController.update);
router.get('/ledger-payments/(:any)/listing', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ledgersPaymentController.listing);
router.get('/ledger-payments/(:any)/index', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ledgersPaymentController.index);

// PayRoll Routes
router.put("/payroll/generate", verifyToken, connectionRequest, permissionsAccessCheck('payroll_create'), payRollController.generatePayroll)
router.get("/payroll/listing", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), payRollController.paymentsListing)
router.get("/payroll/index", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), payRollController.index)
router.get("/payroll/pdf", verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), payRollController.payrollPdf)
router.put("/payroll/run", verifyToken, connectionRequest, permissionsAccessCheck('payroll_edit'), payRollController.payrollRun)
router.put("/payroll/submit", verifyToken, connectionRequest, permissionsAccessCheck('payroll_edit'), payRollController.submitPayroll)
router.get('/payroll/payment-info', verifyToken, connectionRequest, permissionsAccessCheck('payroll_view'), payRollController.payrollPaymentInfo);
router.post('/payroll/payment-info1', verifyToken, connectionRequest, permissionsAccessCheck('payroll_view'), payRollController.payrollPaymentInfo1);
router.get('/payroll/finalize/listing', verifyToken, connectionRequest, permissionsAccessCheck('payroll_view'), payRollController.finalizeListing);
router.get('/payroll/finalize/employee', verifyToken, connectionRequest, permissionsAccessCheck('payroll_view'), payRollController.finalizedEmployee);
router.put("/payroll/update", verifyToken, connectionRequest, permissionsAccessCheck('payroll_edit'), payRollController.update)
router.get('/payroll/finalize/update', verifyToken, connectionRequest, permissionsAccessCheck('payroll_view'), payRollController.payrollFinalize);
router.put("/payroll/skip", verifyToken, connectionRequest, permissionsAccessCheck('payroll_edit'), payRollController.payrollSkip)

// Balace Sheet Routes
router.get('/balancesheet/dashboardData', verifyToken, connectionRequest, permissionsAccessCheck('balance_sheet_view'), balanceSheetController.dashboardData);
router.get('/balancesheet/payroll-summary/:id', verifyToken, connectionRequest, permissionsAccessCheck('balance_sheet_view'), balanceSheetController.payrollSummary);
router.get("/balancesheet/index", verifyToken, connectionRequest, permissionsAccessCheck('balance_sheet_view'), payRollController.index)
router.get("/balancesheet/indexCard", verifyToken, connectionRequest, permissionsAccessCheck('balance_sheet_view'), payRollController.balanceSheetIndexCard);

// Action Notifications Config
router.get('/configurations/(:any)/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view'), actionNotificationConfigController.listing);
router.put('/configurations/(:any)/update', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit'), actionNotificationConfigController.update);

// On Boarding Document Types
//router.post('/configuration/on-boarding-document-types/store', verifyToken, connectionRequest, permissionsAccessCheck('configurations_create'), onBoardingDocumentTypesController.store);
router.put('/configuration/on-boarding-document-types/update/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit'), onBoardingDocumentTypesController.update);
router.get('/configuration/on-boarding-document-types/listing', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view'), onBoardingDocumentTypesController.listing);
router.get('/configuration/invite-link-document-types', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view'), onBoardingDocumentTypesController.inviteLinkDocuments);
router.get('/configuration/on-boarding-document-types/index', verifyToken, connectionRequest, permissionsAccessCheck('configurations_view'), onBoardingDocumentTypesController.index);
router.put('/configuration/on-boarding-document-types/update-status/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit'), onBoardingDocumentTypesController.updateStatus);
//router.delete('/configuration/on-boarding-document-types/destroy/:id', verifyToken, connectionRequest, permissionsAccessCheck('configurations_edit'), onBoardingDocumentTypesController.destroy);

// Dashbaord Routes
router.get('/dashboard/get-employees-data', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), dashboardController.getEmployeesData);
router.get('/dashboard/receivables-payables', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), dashboardController.receivablesPayables);
router.get('/dashboard/get-top-companies', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), dashboardController.getTopCompanies);
router.get('/dashboard/cashflow', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), dashboardController.cashFlow);
router.get('/dashboard/employee-margin', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), dashboardController.employeeMargin);
router.get('/dashboard/payroll', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), dashboardController.payRoll);

// configuration activity track Routes
router.get('/activity/configuration/listing', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), configurationActivityController.listing);

// activity track Routes
router.post('/activity/employee/listing', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ActivityController.employeeActivitylisting);
router.post('/activity/employee/export', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ActivityController.employeeActivityExport);
router.get('/activity/companies/listing', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ActivityController.companyActivitylisting);
router.get('/activity/timesheet/listing', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ActivityController.timesheetActivitylisting);
// router.get('/activity/timesheet-approval/listing', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ActivityController.timesheetApprovalActivitylisting);
// router.get('/activity/ledger-approval/listing', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ActivityController.ledgerApprovalActivitylisting);
router.get('/activity/employee_self_service/listing', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ActivityController.employeeSelfServiceActivitylisting);
router.get('/activity/expense/listing', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ActivityController.expenseActivitylisting);

// ledger recurring Routes
router.post('/ledgers/recurring/(:any)/store', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ledgerRecurringConfigurationController.store);
router.put('/ledgers/recurring/(:any)/update', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ledgerRecurringConfigurationController.update);
router.get('/ledgers/recurring/(:any)/index', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ledgerRecurringConfigurationController.index);

/*Announment Routes */
router.post('/announment/(:any)/store', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), announcementController.store);
router.put('/announment/(:any)/publish/:id', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), announcementController.publish);
router.get('/announment/(:any)/listing', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), announcementController.announcementListing);
router.delete('/announment/(:any)/delete/:id', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), announcementController.destroy);


module.exports = router;