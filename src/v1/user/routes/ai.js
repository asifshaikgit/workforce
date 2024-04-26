const express = require('express');
const router = express.Router();
require('dotenv').config();
const { connectionRequest, subdomainRequestConnection, subdomainRequestConnectionEstablish } = require('../../../middlewares/connectionResolver');  // Tenant connection resolver
const { verifyToken, permissionsAccessCheck } = require('../middleware/authorization');  // Token Verification
const OCR = require('../controllers/ocr/index');  // OCR API Integration
const chatBot = require('../controllers/chat_bot/index');  // Chat Bot 
const chart = require('../controllers/chart/index');  // Chart

router.post('/ocr/(:any)', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), OCR.index);
router.post('/onboard-ocr/(:any)', subdomainRequestConnection, OCR.index);
router.post('/chat-bot', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), chatBot.index);
router.post('/chart', verifyToken, connectionRequest, permissionsAccessCheck('not_applicable'), chart.index);

module.exports = router;