/**
 * =============================================================================
 * ScanSmart API Server  –  SECURITY-HARDENED
 * Implements: Helmet, CORS, Rate Limiting, HPP, Input Sanitisation, Compression
 * OWASP Top 10 mitigations applied throughout.
 * =============================================================================
 */

const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');
const helmet     = require('helmet');
const compression = require('compression');
const hpp        = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

dotenv.config();

// ── Runtime secret validation ─────────────────────────────────────────────────
// SECURITY: Crash fast if required secrets are missing to prevent insecure boot.
const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET'];
REQUIRED_ENV.forEach(key => {
    if (!process.env[key]) {
        console.error(`FATAL: Missing required environment variable: ${key}`);
        process.exit(1);
    }
});

// Warn about weak JWT secret (too short / predictable)
if (process.env.JWT_SECRET.length < 32) {
    console.warn('WARNING: JWT_SECRET is too short. Use at least 32 random characters in production.');
}

const app = express();

// ── Rate limiters ─────────────────────────────────────────────────────────────
const { apiLimiter } = require('./middleware/rateLimiter');

// ── Security headers (OWASP A05 – Security Misconfiguration) ──────────────────
// Helmet sets 15+ HTTP security headers automatically:
// X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security,
// X-XSS-Protection, Referrer-Policy, etc.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc:  ["'self'"],
            scriptSrc:   ["'self'"],
            styleSrc:    ["'self'", "'unsafe-inline'"],   // allow inline styles
            imgSrc:      ["'self'", 'data:', 'https:'],   // allow https images
            connectSrc:  ["'self'"],
            frameSrc:    ["'none'"],
            objectSrc:   ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    hsts: {
        maxAge: 31536000,         // 1 year
        includeSubDomains: true,
        preload: true
    }
}));

// ── CORS (allow only known origins) ──────────────────────────────────────────
const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://localhost:3000',
    // Add your production domain here:
    // 'https://your-production-domain.com'
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman in dev)
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// ── Global rate limiting ───────────────────────────────────────────────────────
app.use('/api/', apiLimiter);

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── Body parser with size limits (prevent large payload DoS) ──────────────────
app.use(express.json({ limit: '10kb' }));        // reject bodies > 10 KB
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── HTTP Parameter Pollution protection ──────────────────────────────────────
app.use(hpp());

// ── NoSQL injection sanitisation ─────────────────────────────────────────────
// Strips MongoDB operators ($, .) from user input
app.use(mongoSanitize());

// ── XSS sanitisation: strip HTML tags from JSON bodies ───────────────────────
// Simple manual sanitiser replacing deprecated xss-clean
app.use((req, _res, next) => {
    const sanitizeString = (str) =>
        typeof str === 'string'
            ? str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            : str;
    const sanitizeObj = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'string') obj[key] = sanitizeString(obj[key]);
            else if (typeof obj[key] === 'object') sanitizeObj(obj[key]);
        }
        return obj;
    };
    if (req.body) sanitizeObj(req.body);
    next();
});

// ── Supabase connectivity check ───────────────────────────────────────────────
const supabase = require('./lib/supabase');
if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('YOUR_SUPABASE')) {
    supabase.from('users').select('id').limit(1)
        .then(({ error }) => {
            if (error) console.error('❌ Supabase Connection Error:', error.message);
            else console.log('✅ Supabase Connected Successfully');
        });
} else {
    console.log('⚠️  Supabase not configured — add credentials to server/.env');
}

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes     = require('./routes/auth');
const productRoutes  = require('./routes/products');
const cartRoutes     = require('./routes/cart');
const billRoutes     = require('./routes/bills');
const chatbotRoutes  = require('./routes/chatbot');
const salesRoutes    = require('./routes/sales');
const discountRoutes = require('./routes/discounts');

app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api/bills',    billRoutes);
app.use('/api/chatbot',  chatbotRoutes);
app.use('/api/sales',    salesRoutes);
app.use('/api/discounts', discountRoutes);

// ── Health check (no sensitive info) ─────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// ── Global error handler (OWASP A09 – Security Logging & Monitoring) ──────────
// SECURITY: Never expose stack traces or internal errors to clients.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
    // Log full error server-side only
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} — ${err.message}`);

    // Handle CORS errors specifically
    if (err.message?.includes('CORS')) {
        return res.status(403).json({ message: 'CORS: Origin not allowed' });
    }

    // Never expose internal error details to clients
    res.status(err.status || 500).json({
        message: process.env.NODE_ENV === 'production'
            ? 'An internal server error occurred'
            : err.message
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 ScanMart Server running on port ${PORT}`);
    console.log(`🔒 Security: Helmet, Rate Limiting, CORS, HPP, Sanitisation — ACTIVE`);
});
