const express = require('express');
const router  = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { loginLimiter, authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const {
    validate,
    registerRules, loginRules, otpEmailRules,
    verifyOtpRules, resetPasswordRules
} = require('../middleware/validate');

// SECURITY: All auth routes are rate-limited.
// Public routes
router.post('/register',       authLimiter, registerRules,      validate, authController.register);
router.post('/login',          loginLimiter, loginRules,         validate, authController.login);
router.post('/check-email',    otpLimiter,  otpEmailRules,       validate, authController.sendOtp);
router.post('/verify-otp',     otpLimiter,  verifyOtpRules,      validate, authController.verifyOtp);
router.post('/reset-password', otpLimiter,  resetPasswordRules,  validate, authController.resetPassword);

// Protected
router.get('/me', auth, authController.getMe);

module.exports = router;
