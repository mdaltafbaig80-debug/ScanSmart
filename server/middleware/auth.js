const jwt = require('jsonwebtoken');

// Verify JWT token — reads user info directly from the token payload.
// This avoids a Supabase round-trip on every authenticated request.
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Populate req.user from token payload (set during login/register)
        if (!decoded.userId) {
            return res.status(401).json({ message: 'Invalid token payload.' });
        }

        req.user = {
            id: decoded.userId,
            name: decoded.name || '',
            email: decoded.email || '',
            role: decoded.role || 'user'
        };
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
};

// Admin-only middleware
const adminAuth = async (req, res, next) => {
    try {
        await auth(req, res, () => {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied. Admin only.' });
            }
            next();
        });
    } catch (error) {
        res.status(403).json({ message: 'Access denied.' });
    }
};

module.exports = { auth, adminAuth };
