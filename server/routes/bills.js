const express = require('express');
const router  = express.Router();
const billController = require('../controllers/billController');
const { auth, adminAuth } = require('../middleware/auth');
const { billLimiter } = require('../middleware/rateLimiter');
const { validate, generateBillRules, idParam } = require('../middleware/validate');

// Admin-only routes (specific before /:id)
router.get('/admin/stats', adminAuth, billController.getDashboardStats);
router.get('/all',         adminAuth, billController.getAllBills);
router.post('/return',     adminAuth, billController.processReturn);

// User routes — bill generation is rate-limited
router.post('/generate', auth, billLimiter, generateBillRules, validate, billController.generateBill);
router.get('/my-bills',  auth, billController.getUserBills);

// SECURITY: Verify the requesting user owns this bill inside the controller
router.get('/:id', auth, idParam, validate, billController.getBillById);

module.exports = router;
