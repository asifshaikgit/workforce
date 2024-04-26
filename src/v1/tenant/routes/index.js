const express = require('express');
const router = express.Router();
const { index, store, verifyTenantOtp, subdomainValidate, resendOTP, migrateChanges } = require('../controllers/tenantController');  // Tenant Creation controller
const { isEditableschemaChange } = require('../../../deltaMigrations/index');  // Tenant Creation controller

//Tenant
router.get('/tenant/index', index);
router.post('/tenant', store);
router.post('/verifyOTP',verifyTenantOtp);
router.post('/resendOTP',resendOTP);
router.post('/subdomain-check',subdomainValidate);
router.get('/delta-migrate', isEditableschemaChange);

module.exports = router;