const express = require('express');
const router  = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { auth } = require('../middleware/auth');
const { chatbotLimiter } = require('../middleware/rateLimiter');
const { validate, chatbotRules } = require('../middleware/validate');

// SECURITY: Chatbot is rate-limited and message content is validated/sanitised.
// Optional auth: if a valid token is provided, attach user context.
router.post('/message', chatbotLimiter, (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
        auth(req, res, next);
    } else {
        next();
    }
}, chatbotRules, validate, chatbotController.handleMessage);

// Quick search: no auth needed, but rate limited by global limiter
router.get('/search', chatbotController.quickSearch);

module.exports = router;
