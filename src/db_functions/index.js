const getCompaniesListingInformation = require('./companies/companiesListing');
const getCompanyDashboardData = require('./companies/companyDashboardData');
const getCompanyInvoiceAmount = require('./companies/companyInvoiceAmount');
const getEmployeesListing = require('./employee/employeeListing');
const getEmployeeDetails = require('./employee/employeeDetails');
const getEmployeeProfile = require('./employee/employeeProfile');
const getSelfServiceListingInformation = require('./emplyee self service/employeeSelfServiceListing');
const getEmployeeSelfServiceChatMessages = require('./emplyee self service/employeeSelfServiceChatMessages');
const getExpenseManagementListing = require('./expense management/expenseManagementListing');
const getExpenseManagementIndex = require('./expense management/expenseManagementIndex');
const getLedgerDashboardAnalytics = require('./ledgers/ledgerDashboardAnalytics');
const getLedgerDetails = require('./ledgers/ledgerDetails');
const getLedgerPaymentDetails = require('./ledgers/ledgerPaymentDetails');
const getLedgerPaymentsListing = require('./ledgers/ledgerPaymentsListing');
const ledgersExport = require('./ledgers/ledgersExport');
const getLedgersListing = require('./ledgers/ledgersListing');
const salesExport = require('./ledgers/salesExport');
const getPayrollList = require('./Payroll/payrollList');
const getPayrollDashboard = require('./Payroll/payrollDashboard');
const getPayrollPaymentInfo = require('./Payroll/payrollPaymentInfo');
const getPlacementIndexInformation = require('./Placement/placementIndex');
const getPlacementListing = require('./Placement/placementListing');
const getPlacedEmployeeAnalytics = require('./Placement/dashboard/placedEmployeeAnalytics');
const getPlacedEmployeeAttritionRate = require('./Placement/dashboard/placedEmployeeAttritionRate');
const getPlacedSkillsAnalytics = require('./Placement/dashboard/placedSkillsAnalytics');
const getRemindersListing = require('./reminders/remindersListing');
const invoiceReadyTimeSheet = require('./timesheets/invoiceReadyTimesheetsData');
const getTimesheetsListing = require('./timesheets/timesheetsListing');
const getTimesheetsIndex = require('./timesheets/timesheetsIndex');
const getTimesheetsCalendarView = require('./timesheets/timesheetCalendarView');
const getTimesheetsListView = require('./timesheets/timesheetListView');
const getTimesheetsWeekView = require('./timesheets/timesheetWeekView');
const getConfigurationActivityListingInformation = require('./activity/configurationActivityListng');
const getCompanyActivityListingInformation  = require('./activity/companiesActivityListing');
const getEmployeeActivityListingInformation = require('./activity/employeeActivityListing');
const getEmployeeSelfServiceActivityListingInformation  = require('./activity/employeeSelfServiceActivityListing');
const getExpenseActivityListingInformation  = require('./activity/expenseActivityListing');
// const getledgerApprovalActivityListingInformation = require('./activity/ledgerApprovalActivityListing');
const getTimesheetActivityListingInformation = require('./activity/timesheetActivityListing');
// const getTimesheetApprovalActivityListingInformation = require('./activity/timesheetApprovalActivityListng');
const balanceSheetExport = require('../db_functions/balancesheet/balancesheetExport');
const GetLedgerBillDashboardAnalytics = require('../db_functions/ledgers/ledgerBillsDashboardAnalytics');

/**
 * 
 * @param {*} tenant DB connection
 * To run the db api migration for the newly created tenant
 */
const dbApi = async (tenant) => {
  await getCompaniesListingInformation(tenant);
  await getCompanyDashboardData(tenant);
  await getCompanyInvoiceAmount(tenant);
  await getEmployeesListing(tenant);
  await getEmployeeDetails(tenant);
  await getEmployeeProfile(tenant);
  await getSelfServiceListingInformation(tenant);
  await getEmployeeSelfServiceChatMessages(tenant);
  await getExpenseManagementListing(tenant);
  await getExpenseManagementIndex(tenant);
  await getLedgerDashboardAnalytics(tenant)
  await getLedgerDetails(tenant)
  await getLedgerPaymentDetails(tenant)
  await getLedgerPaymentsListing(tenant);
  await ledgersExport(tenant);
  await getLedgersListing(tenant);
  await salesExport(tenant);
  await getPayrollList(tenant);
  await getPayrollDashboard(tenant);
  await getPayrollPaymentInfo(tenant);
  await getPlacementIndexInformation(tenant);
  await getPlacementListing(tenant);
  await getPlacedEmployeeAnalytics(tenant);
  await getPlacedEmployeeAttritionRate(tenant);
  await getPlacedSkillsAnalytics(tenant);
  await getRemindersListing(tenant);
  await invoiceReadyTimeSheet(tenant);
  await getTimesheetsCalendarView(tenant);
  await getTimesheetsListView(tenant);
  await getTimesheetsIndex(tenant);
  await getTimesheetsListing(tenant);
  await getTimesheetsWeekView(tenant);
  await getConfigurationActivityListingInformation(tenant);
  await getEmployeeActivityListingInformation(tenant);
  await ledgersExport(tenant);
  await balanceSheetExport(tenant);
  await getEmployeeSelfServiceActivityListingInformation (tenant);
  await getExpenseActivityListingInformation (tenant);
  await getCompanyActivityListingInformation (tenant);
  // await getledgerApprovalActivityListingInformation(tenant);
  await getTimesheetActivityListingInformation(tenant);
  // await getTimesheetApprovalActivityListingInformation(tenant);
  await GetLedgerBillDashboardAnalytics(tenant);
};

module.exports = { dbApi };
