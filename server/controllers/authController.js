const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');

// Generate JWT token — embed role/email/name so auth middleware avoids a DB lookup
const generateToken = (user) => {
    return jwt.sign(
        { userId: user.id, name: user.name, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Register new user
exports.register = async (req, res) => {
    try {
        const { name, email, mobileNumber, password, role } = req.body;

        // Run both existence checks AND password hashing in parallel
        const [{ data: existingEmail }, { data: existingMobile }, passwordHash] = await Promise.all([
            supabase.from('users').select('id').eq('email', email.toLowerCase()).single(),
            supabase.from('users').select('id').eq('mobile_number', mobileNumber).single(),
            bcrypt.hash(password, 8) // rounds=8: fast and still secure
        ]);

        if (existingEmail) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        if (existingMobile) {
            return res.status(400).json({ message: 'Mobile number already registered' });
        }

        // Insert user
        const { data: user, error } = await supabase
            .from('users')
            .insert({
                name,
                email: email.toLowerCase(),
                mobile_number: mobileNumber,
                password_hash: passwordHash,
                role: role || 'user'
            })
            .select('id, name, email, mobile_number, role')
            .single();

        if (error) {
            return res.status(500).json({ message: 'Registration failed', error: error.message });
        }

        const token = generateToken(user);

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, role, password_hash')
            .eq('email', email.toLowerCase())
            .single();

        if (error || !user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
};

// Get current user
exports.getMe = async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get user', error: error.message });
    }
};

// Check if email exists and send OTP
const nodemailer = require('nodemailer');

// In-memory store for OTPs (valid for 10 minutes)
const otpStore = new Map();

exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        const { data: user, error } = await supabase
            .from('users')
            .select('id, name')
            .eq('email', email.toLowerCase())
            .single();

        if (error || !user) {
            return res.status(404).json({ message: 'Email not found' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in backend (expires in 10 minutes)
        otpStore.set(email, {
            otp,
            expiry: Date.now() + 10 * 60 * 1000
        });

        // Send Email
        if (process.env.EMAIL_USER === 'your_email@gmail.com' || !process.env.EMAIL_USER) {
            // Demo mode if credentials not setup
            return res.json({ message: 'Email exists (Demo Mode)', demoOtp: otp });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'ScanSmart - Password Reset Verification',
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ScanSmart Password Reset</title>
</head>
<body style="margin:0;padding:40px 15px;background:#eef3fb;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.12);">
<!-- Header -->
<tr>
<td align="center" style="padding:45px;background:linear-gradient(135deg,#2563EB,#0EA5E9);">
<div style="width:85px;height:85px;border-radius:50%;background:#ffffff;display:flex;align-items:center;justify-content:center;font-size:42px;margin:auto;box-shadow:0 10px 25px rgba(255,255,255,.35);">
🛒
</div>
<h1 style="margin:20px 0 5px;color:#ffffff;font-size:36px;font-weight:700;">ScanSmart</h1>
<p style="margin:0;color:#E0F2FE;font-size:17px;">Smart Retail Shopping System</p>
</td>
</tr>
<!-- Body -->
<tr>
<td style="padding:45px;">
<h2 style="margin-top:0;color:#1E293B;font-size:28px;">🔐 Password Reset Verification</h2>
<p style="font-size:17px;color:#475569;line-height:30px;">
Hello <strong>${user.name}</strong>,
</p>
<p style="font-size:17px;color:#475569;line-height:30px;">
We received a request to reset your ScanSmart account password.
To continue, please enter the verification code below.
</p>
<!-- OTP Box -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">
<div style="margin:35px auto;padding:30px;max-width:380px;border-radius:18px;background:linear-gradient(135deg,#2563EB,#1D4ED8);box-shadow:0 12px 30px rgba(37,99,235,.35);">
<p style="margin:0;font-size:15px;color:#DBEAFE;letter-spacing:2px;">YOUR OTP</p>
<h1 style="margin:18px 0;font-size:48px;letter-spacing:12px;color:white;font-weight:800;">${otp}</h1>
<p style="margin:0;color:#DBEAFE;font-size:15px;">Valid for 10 Minutes</p>
</div>
</td>
</tr>
</table>
<!-- Security Notice -->
<div style="background:#F8FAFC;border-left:5px solid #2563EB;padding:20px;border-radius:12px;margin-top:20px;">
<p style="margin:0;font-size:15px;color:#475569;line-height:28px;">
🛡️ Never share this OTP with anyone. ScanSmart will never ask you for your password or verification code.
</p>
</div>
<p style="margin-top:35px;font-size:16px;color:#475569;line-height:28px;">
If you didn't request this password reset, simply ignore this email. Your account remains secure.
</p>
<p style="margin-top:35px;font-size:16px;color:#475569;">
Regards,<br><br>
<strong style="font-size:20px;color:#2563EB;">ScanSmart Team</strong>
</p>
</td>
</tr>
<!-- Footer -->
<tr>
<td align="center" style="background:#F1F5F9;padding:30px;">
<p style="margin:0;font-size:16px;font-weight:600;color:#2563EB;">🛒 ScanSmart</p>
<p style="margin-top:10px;color:#64748B;font-size:14px;">Smart Retail Shopping System using QR Code Technology</p>
<hr style="margin:20px 0;border:none;border-top:1px solid #CBD5E1;">
<p style="margin:0;font-size:13px;color:#94A3B8;">© 2026 ScanSmart. All Rights Reserved.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('OTP Send Error:', error);
        res.status(500).json({ message: 'Failed to send OTP email', error: error.message });
    }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        const storedData = otpStore.get(email);
        
        if (!storedData) {
            return res.status(400).json({ message: 'No OTP requested for this email' });
        }
        
        if (Date.now() > storedData.expiry) {
            otpStore.delete(email);
            return res.status(400).json({ message: 'OTP has expired (valid for 10 minutes only)' });
        }
        
        if (storedData.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
        
        res.json({ message: 'OTP verified successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to verify OTP' });
    }
};

// Reset password
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Final security check
        const storedData = otpStore.get(email);
        if (!storedData || storedData.otp !== otp || Date.now() > storedData.expiry) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Hash new password (rounds=8)
        const salt = await bcrypt.genSalt(8);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password in Supabase
        const { error } = await supabase
            .from('users')
            .update({ password_hash: hashedPassword })
            .eq('email', email.toLowerCase());

        if (error) {
            return res.status(400).json({ message: 'Failed to update password', error: error.message });
        }

        // Clear the OTP so it cannot be used again
        otpStore.delete(email);

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: 'Server error during password reset', error: error.message });
    }
};
