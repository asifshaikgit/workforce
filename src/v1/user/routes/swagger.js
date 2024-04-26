const express = require('express');
const router = express.Router();
const swaggerUI = require('swagger-ui-express'); // Swagger UI

const employeeSwagger = require('../../../../swagger/employeeSwagger.json'); // Employee Swagger Document
const authenticationSwagger = require('../../../../swagger/authenticationSwagger.json'); // Authentication Swagger Document
const configurationsSwagger = require('../../../../swagger/configurationsSwagger.json'); // Configurations Swagger Document
const placementSwagger = require('../../../../swagger/placementSwagger.json'); // Placements Swagger Document
const timesheetSwagger = require('../../../../swagger/timeSheetSwagger.json'); // Timesheet Swagger Document
const empSlefServiceSwagger = require('../../../../swagger/employeeSelfServiceSwagger.json'); // Timesheet Swagger Document
const payrollSwagger = require('../../../../swagger/payrollSwagger.json'); // payroll Swagger Document
const expenseManagementSwagger = require('../../../../swagger/expenseManagementSwagger.json'); // expense-management Swagger Document
const exportSwagger = require('../../../../swagger/exportSwagger.json'); // export Swagger Document
const importSwagger = require('../../../../swagger/importSwagger.json'); // export Swagger Document
const immigrationsSwagger = require('../../../../swagger/immigrationsSwagger.json'); // immigrations Swagger
const companiesSwagger = require('../../../../swagger/companiesSwagger.json');  // companies Swagger
const ocrSwagger = require('../../../../swagger/ocrSwagger.json');  // companies Swagger
const ledgersSwagger = require('../../../../swagger/ledgersSwagger.json');  // companies Swagger
const tenantSwagger = require('../../../../swagger/tenantSwagger.json');  // tenant Swagger

const options = {};

router.use('/employee', swaggerUI.serveFiles(employeeSwagger, options), swaggerUI.setup(employeeSwagger)); // Swagger UI Employee
router.use('/authentication', swaggerUI.serveFiles(authenticationSwagger, options), swaggerUI.setup(authenticationSwagger)); // Swagger UI Authentication
router.use('/configuration', swaggerUI.serveFiles(configurationsSwagger, options), swaggerUI.setup(configurationsSwagger)); // Swagger UI Configurations
router.use('/placement', swaggerUI.serveFiles(placementSwagger, options), swaggerUI.setup(placementSwagger)); // Swagger UI Placements
router.use('/timesheet', swaggerUI.serveFiles(timesheetSwagger, options), swaggerUI.setup(timesheetSwagger)); // Swagger UI Timesheet
router.use('/employee-self-service', swaggerUI.serveFiles(empSlefServiceSwagger, options), swaggerUI.setup(empSlefServiceSwagger)); // Swagger UI Timesheet
router.use('/payrolls', swaggerUI.serveFiles(payrollSwagger, options), swaggerUI.setup(payrollSwagger)); // Swagger UI payroll
router.use('/expense-management', swaggerUI.serveFiles(expenseManagementSwagger, options), swaggerUI.setup(expenseManagementSwagger)); // Swagger UI Expense Management
router.use('/exports', swaggerUI.serveFiles(exportSwagger, options), swaggerUI.setup(exportSwagger)); // Swagger UI export Swagger Management
router.use('/imports', swaggerUI.serveFiles(importSwagger, options), swaggerUI.setup(importSwagger)); // Swagger UI imports Swagger Management
router.use('/immigrations', swaggerUI.serveFiles(immigrationsSwagger, options), swaggerUI.setup(immigrationsSwagger)); // immigrations Swagger UI
router.use('/companies', swaggerUI.serveFiles(companiesSwagger, options), swaggerUI.setup(companiesSwagger)); // companies Swagger UI
router.use('/ocr', swaggerUI.serveFiles(ocrSwagger, options), swaggerUI.setup(ocrSwagger)); // companies Swagger UI
router.use('/ledgers', swaggerUI.serveFiles(ledgersSwagger, options), swaggerUI.setup(ledgersSwagger)); // ledgers Swagger UI
router.use('/tenants', swaggerUI.serveFiles(tenantSwagger, options), swaggerUI.setup(tenantSwagger)); // tenants Swagger UI

module.exports = router;
