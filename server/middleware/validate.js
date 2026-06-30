/**
 * =============================================================================
 * INPUT VALIDATION MIDDLEWARE  (OWASP A03 – Injection / A04 – Insecure Design)
 * Uses express-validator for strict server-side validation on every route.
 * =============================================================================
 */
const { body, param, query, validationResult } = require('express-validator');

// ── Helper: collect errors and respond ────────────────────────────────────────
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Validation failed',
            errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
    }
    next();
};

// ── Auth validators ───────────────────────────────────────────────────────────
const registerRules = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters')
        .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),

    body('email')
        .trim().normalizeEmail()
        .isEmail().withMessage('Valid email required')
        .isLength({ max: 100 }).withMessage('Email too long'),

    body('mobileNumber')
        .trim()
        .matches(/^\d{10}$/).withMessage('Mobile must be exactly 10 digits'),

    body('password')
        .isLength({ min: 6, max: 128 }).withMessage('Password must be 6–128 characters'),

    body('role')
        .optional()
        // ⚠ SECURITY: disallow clients from self-assigning admin role
        .custom(val => {
            if (val === 'admin') throw new Error('Cannot self-register as admin');
            return true;
        })
];

const loginRules = [
    body('email').trim().normalizeEmail().isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
        .isLength({ max: 128 }).withMessage('Password too long')
];

const otpEmailRules = [
    body('email').trim().normalizeEmail().isEmail().withMessage('Valid email required')
];

const verifyOtpRules = [
    body('email').trim().normalizeEmail().isEmail(),
    body('otp').trim().matches(/^\d{6}$/).withMessage('OTP must be 6 digits')
];

const resetPasswordRules = [
    body('email').trim().normalizeEmail().isEmail(),
    body('otp').trim().matches(/^\d{6}$/).withMessage('OTP must be 6 digits'),
    body('newPassword').isLength({ min: 6, max: 128 }).withMessage('Password must be 6–128 characters')
];

// ── Product validators ────────────────────────────────────────────────────────
const productRules = [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Product name required (max 100 chars)'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('category').trim().notEmpty().withMessage('Category required'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('discountPercent').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be 0–100%'),
    body('image').optional().trim()
        .custom(val => {
            // Allow relative paths or https URLs only
            if (val && !val.startsWith('/') && !val.startsWith('https://')) {
                throw new Error('Image must be a relative path or https URL');
            }
            return true;
        })
];

const stockRules = [
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
];

// ── Cart validators ───────────────────────────────────────────────────────────
const addToCartRules = [
    body('productId').trim().notEmpty().withMessage('productId required'),
    body('quantity').optional().isInt({ min: 1, max: 100 }).withMessage('Quantity must be 1–100')
];

const updateCartRules = [
    body('productId').trim().notEmpty().withMessage('productId required'),
    body('quantity').isInt({ min: 1, max: 100 }).withMessage('Quantity must be 1–100')
];

// ── Bill validators ───────────────────────────────────────────────────────────
const generateBillRules = [
    body('paymentMethod')
        .trim()
        .isIn(['upi', 'card', 'cash']).withMessage('paymentMethod must be upi, card, or cash'),
    body('discountCode').optional().trim().isLength({ max: 50 }),
    body('discountAmount').optional().isFloat({ min: 0 }).withMessage('discountAmount must be non-negative')
];

// ── Discount validators ───────────────────────────────────────────────────────
const discountRules = [
    body('code').trim().toUpperCase().isLength({ min: 3, max: 20 }).withMessage('Code must be 3–20 chars')
        .matches(/^[A-Z0-9_-]+$/).withMessage('Code may only contain letters, numbers, - and _'),
    body('type').isIn(['percentage', 'fixed']).withMessage('type must be percentage or fixed'),
    body('value').isFloat({ min: 0 }).withMessage('value must be non-negative'),
    body('minPurchase').optional().isFloat({ min: 0 }),
    body('maxDiscount').optional().isFloat({ min: 0 }),
    body('validFrom').optional().isISO8601(),
    body('validUntil').isISO8601().withMessage('validUntil must be a valid date'),
    body('usageLimit').optional().isInt({ min: 1 })
];

const validateDiscountRules = [
    body('code').trim().notEmpty().withMessage('Discount code required')
        .isLength({ max: 50 }).withMessage('Code too long'),
    body('cartTotal').isFloat({ min: 0 }).withMessage('cartTotal must be non-negative')
];

// ── Chatbot validators ────────────────────────────────────────────────────────
const chatbotRules = [
    body('message')
        .trim()
        .notEmpty().withMessage('Message required')
        .isLength({ max: 500 }).withMessage('Message too long (max 500 chars)')
        // Strip any script injection attempts
        .customSanitizer(val => val.replace(/<[^>]*>/g, '').replace(/[<>]/g, ''))
];

// ── ID param validator ────────────────────────────────────────────────────────
const idParam = [
    param('id').trim().notEmpty().withMessage('ID parameter required')
];

module.exports = {
    validate,
    registerRules,
    loginRules,
    otpEmailRules,
    verifyOtpRules,
    resetPasswordRules,
    productRules,
    stockRules,
    addToCartRules,
    updateCartRules,
    generateBillRules,
    discountRules,
    validateDiscountRules,
    chatbotRules,
    idParam
};
