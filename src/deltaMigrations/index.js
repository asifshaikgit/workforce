const tenantRepository = require('../v1/tenant/repositories/tenantRepository');
const { getTenantConnection } = require('../middlewares/connectionManager');
const { tryCatch } = require('../../utils/tryCatch');

const { dbApi } = require('../db_functions');
const employeeSelfServiceChatMessages = require('../db_functions/emplyee self service/employeeSelfServiceChatMessages');
const getLedgerDashboardAnalytics = require('../db_functions/ledgers/ledgerDashboardAnalytics');
const expenseManagementIndex = require('../db_functions/expense management/expenseManagementIndex');
const getRemindersListing = require('../db_functions/reminders/remindersListing');
const placementListing = require('../db_functions/Placement/placementListing');
const GetLedgerBillDashboardAnalytics = require('../db_functions/ledgers/ledgerBillsDashboardAnalytics');
const GetLedgerDashboardAnalytics = require('../db_functions/ledgers/ledgerDashboardAnalytics');
const getEmployeesListing = require('../db_functions/employee/employeeListing');
const employeeDetails = require('../db_functions/employee/employeeDetails');
const getEmployeeProfile = require('../db_functions/employee/employeeProfile');
const newSchema  = require('../migrations/newchange');
const placedEmployeeAnalytics = require('../db_functions/Placement/dashboard/placedEmployeeAnalytics');
const placementIndex = require('../db_functions/Placement/placementIndex');
const getConfigurationActivityListingInformation = require('../db_functions/activity/configurationActivityListng');
const getEmployeeActivityListingInformation = require('../db_functions/activity/employeeActivityListing');
const getCompanyActivityListingInformation = require('../db_functions/activity/companiesActivityListing');



const isEditableschemaChange = tryCatch(
  async () => {
    //condition = { is_active: true, id: '1016238a-0964-4613-b573-7c7c553d2a0b' };
    condition = { is_active: true };
    let tenantData = await tenantRepository.find(condition);

    for (const key in tenantData.data) {
      const tenantDBConnection = await getTenantConnection(tenantData.data[key].id);
      //await dbApi(tenantDBConnection)
      //await getSelfServiceListingInformation(tenantDBConnection);
       await placementListing(tenantDBConnection);
      //await getRemindersListing(tenantDBConnection);
      // await expenseManagementIndex(tenantDBConnection)
      //await GetLedgerBillDashboardAnalytics(tenantDBConnection);
      //await GetLedgerDashboardAnalytics(tenantDBConnection);
      //await newSchema(tenantDBConnection); //Need to run in QA
      // await employeeDetails(tenantDBConnection); //Need to run in QA
      //await getEmployeesListing(tenantDBConnection); //Need to run in QA
      //await getEmployeeProfile(tenantDBConnection); //Need to run in QA
      //await placementIndex(tenantDBConnection);
      //await getConfigurationActivityListingInformation(tenantDBConnection); //Need to run in QA
      //await getEmployeeActivityListingInformation(tenantDBConnection); //Need to run in QA
      //await getCompanyActivityListingInformation(tenantDBConnection); //Need to run in QA
    }
    console.log('Done');
  });

module.exports = { isEditableschemaChange };