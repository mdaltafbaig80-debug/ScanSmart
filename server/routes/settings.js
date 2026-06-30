const express = require('express');
const router  = express.Router();
const settingsController = require('../controllers/settingsController');
const { auth, adminAuth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Public route to get settings (used by Footer)
router.get('/', apiLimiter, settingsController.getSettings);

// Admin route to update settings
router.post('/', auth, adminAuth, apiLimiter, settingsController.updateSettings);

module.exports = router;
