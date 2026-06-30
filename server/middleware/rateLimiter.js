/**
 * =============================================================================
 * RATE LIMITING MIDDLEWARE  (OWASP A07 – Identification & Authentication Failures)
 * Protects against brute-force, credential stuffing, and API abuse.
 * =============================================================================
 */
const rateLimit = require('express-rate-limit');

// ── Generic message factory ───────────────────────────────────────────────────
const makeMessage = (minutes, requests) =>
    `Too many requests. Limit: ${requests} per ${minutes} minute(s). Please try again later.`;

// ── Auth endpoints: very strict (prevent brute-force / credential stuffing) ───
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: 20,                     // 20 attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: makeMessage(15, 20) },
    skipSuccessfulRequests: false
});

// ── Login specifically: extra-tight (most targeted endpoint) ─────────────────
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,                     // 10 login attempts per 15 min per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login attempts. Please wait 15 minutes before trying again.' }
});

// ── OTP: prevent OTP bombing / SMS abuse ─────────────────────────────────────
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,   // 10 minutes
    max: 5,                      // 5 OTP requests per 10 min
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many OTP requests. Please wait 10 minutes.' }
});

// ── General API: broad protection against API scraping ───────────────────────
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,        // 1 minute
    max: 120,                   // 120 requests/min per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: makeMessage(1, 120) }
});

// ── Chatbot: prevent spam ─────────────────────────────────────────────────────
const chatbotLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,                    // 30 messages/min
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Chatbot rate limit reached. Please slow down.' }
});

// ── Bill generation: prevent checkout abuse ───────────────────────────────────
const billLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,   // 5 minutes
    max: 10,                    // 10 checkouts per 5 min
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many checkout attempts. Please wait a moment.' }
});

module.exports = { authLimiter, loginLimiter, otpLimiter, apiLimiter, chatbotLimiter, billLimiter };
