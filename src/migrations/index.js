
const configurationTablesSchema = require('./configurationsTableSchema');
const employeeTables = require('./employeeTableSchema');
const companiesTableSchema = require('./companiesTableSchema');
const expenseManagementTableSchema = require('./expenseManagementTableSchema');
const commonDocumentsTableSchema = require('./commonDocumentsTableSchema');
const employeeSelfServiceTableSchema = require('./employeeSelfServiceTableSchema');
const placementsTableSchema = require('./placementsTableSchema');
const ledgersTableSchema = require('./ledgersTableSchema');
const payrollTableSchema = require('./payrollTableSchema');
const timesheetTableSchema = require('./timesheetTableSchema');
const notificationTablesSchema  = require('./notificationsTableSchema');
const remindersTableSchema   = require('./remindersTableSchema');

const createEnumTypes = require('./createEnumTypes');

/**
 * 
 * @param {*} tenant DB connection
 * To run the db schema migration for the newly created tenant
 */
const migrate = async (tenant) => {
  await createEnumTypes(tenant);
  await configurationTablesSchema(tenant);
  await employeeTables(tenant);
  await companiesTableSchema(tenant);
  await expenseManagementTableSchema(tenant);
  await commonDocumentsTableSchema(tenant);
  await placementsTableSchema(tenant);
  await employeeSelfServiceTableSchema(tenant);
  await ledgersTableSchema(tenant);
  await payrollTableSchema(tenant);
  await timesheetTableSchema(tenant);
  await notificationTablesSchema(tenant);
  await remindersTableSchema (tenant)
};

module.exports = { migrate };
