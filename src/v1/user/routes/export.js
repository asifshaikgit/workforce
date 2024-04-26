const express = require('express');
const router = express.Router();
const ledgersExportController = require('../controllers/export/ledgers/ledgersExportController');// sales export Controller
const balancesheetExportController = require('../controllers/export/balancesheet/balancesheetExportController');// balancesheet export Controller
const placementExportController = require('../controllers/export/placements/placementExportController');// placement export Controller
const expenseManagementExportController = require('../controllers/export/expenseManagement/expenseManagementExportController');// expense management export Controller
const companiesExportController = require('../controllers/export/companies/companiesExportController');// companies export Controller
const { connectionRequest } = require('../../../middlewares/connectionResolver');  // Tenant connection resolver
const { verifyToken, permissionsAccessCheck, verifyDomain } = require('../middleware/authorization');  // Token Verification
const employeeExportController = require('../controllers/export/employee/employeeExportController');
const payrollExportController = require('../controllers/export/payroll/payrollExportController');

router.post('/export/(:any)/companies', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), companiesExportController.companiesExport);
router.post('/export/(:any)/sales', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ledgersExportController.salesExport);
router.post('/export/(:any)/ledgers', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), ledgersExportController.ledgersExport);
router.post('/export/payroll', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), payrollExportController.payrollExport);
router.post('/export/balancesheet', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), balancesheetExportController.balancesheetExport);
router.post('/export/placements', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), placementExportController.placementExport);
router.post('/export/expense-management', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), expenseManagementExportController.expenseManagementExport);
router.get('/employee-export-data-information', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), employeeExportController.employeeExportJson);
router.post('/export/employee', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), employeeExportController.employeeExport);

module.exports = router;
