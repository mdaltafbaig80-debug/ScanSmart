import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiKey } from 'react-icons/fi';
import { toast } from 'react-toastify';
import emailjs from '@emailjs/browser';
import { authService } from '../../services/api';
import './Auth.css';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Forgot Password States
    const [isForgotMode, setIsForgotMode] = useState(false);
    const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [forgotData, setForgotData] = useState({ email: '', otp: '', newPassword: '' });
    const [generatedOtp, setGeneratedOtp] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleForgotChange = (e) => {
        setForgotData({ ...forgotData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const user = await login(formData.email, formData.password);
            toast.success(`Welcome back, ${user.name}!`);
            navigate(user.role === 'admin' ? '/admin' : '/products');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Check email and send OTP via backend
            const response = await authService.checkEmail(forgotData.email);
            
            if (response.data.message.includes('Demo Mode')) {
                toast.info(`📧 Demo OTP: ${response.data.demoOtp}`, { autoClose: 15000 });
                // Still set it for demo mode so the user can copy-paste it
                setGeneratedOtp(response.data.demoOtp);
            } else {
                toast.success('✅ OTP sent to your email! Check your inbox.');
            }
            
            setForgotStep(2);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authService.verifyOtp(forgotData.email, forgotData.otp);
            toast.success('OTP verified');
            setForgotStep(3);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authService.resetPassword(forgotData.email, forgotData.otp, forgotData.newPassword);
            toast.success('Password reset successfully! You can now login.');
            setIsForgotMode(false);
            setForgotStep(1);
            setForgotData({ email: '', otp: '', newPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-bg">
                <div className="auth-circle auth-circle-1"></div>
                <div className="auth-circle auth-circle-2"></div>
            </div>

            <div className="auth-container">
                <div className="auth-card animate-slideUp">
                    <div className="auth-header">
                        <Link to="/" className="auth-logo">🛒 ScanSmart</Link>
                        <h1>{isForgotMode ? 'Reset Password' : 'Welcome Back'}</h1>
                        <p>{isForgotMode ? 'Follow the steps to recover your account' : 'Sign in to continue shopping'}</p>
                    </div>

                    {!isForgotMode ? (
                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <div className="input-wrapper">
                                    <FiMail className="input-icon" />
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-input"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <div className="input-wrapper">
                                    <FiLock className="input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        className="form-input"
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                </div>
                                <div style={{textAlign: 'right', marginTop: '8px'}}>
                                    <button type="button" onClick={() => setIsForgotMode(true)} style={{background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '14px'}}>
                                        Forgot Password?
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                            
                            <div className="auth-footer" style={{marginTop: '1rem'}}>
                                <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
                            </div>
                        </form>
                    ) : (
                        <div className="auth-form">
                            {forgotStep === 1 && (
                                <form onSubmit={handleSendOtp}>
                                    <div className="form-group">
                                        <label className="form-label">Email Address</label>
                                        <div className="input-wrapper">
                                            <FiMail className="input-icon" />
                                            <input
                                                type="email"
                                                name="email"
                                                className="form-input"
                                                placeholder="Enter your registered email"
                                                value={forgotData.email}
                                                onChange={handleForgotChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                                        {loading ? 'Checking...' : 'Send OTP'}
                                    </button>
                                </form>
                            )}

                            {forgotStep === 2 && (
                                <form onSubmit={handleVerifyOtp}>
                                    <div className="form-group">
                                        <label className="form-label">Enter OTP</label>
                                        <div className="input-wrapper">
                                            <FiKey className="input-icon" />
                                            <input
                                                type="text"
                                                name="otp"
                                                className="form-input"
                                                placeholder="6-digit code"
                                                value={forgotData.otp}
                                                onChange={handleForgotChange}
                                                maxLength="6"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary btn-lg w-full">
                                        Verify OTP
                                    </button>
                                </form>
                            )}

                            {forgotStep === 3 && (
                                <form onSubmit={handleResetPassword}>
                                    <div className="form-group">
                                        <label className="form-label">New Password</label>
                                        <div className="input-wrapper">
                                            <FiLock className="input-icon" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="newPassword"
                                                className="form-input"
                                                placeholder="Enter new password"
                                                value={forgotData.newPassword}
                                                onChange={handleForgotChange}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                                        {loading ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                </form>
                            )}
                            
                            <div className="auth-footer" style={{marginTop: '1rem'}}>
                                <button type="button" onClick={() => setIsForgotMode(false)} style={{background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '14px'}}>
                                    Back to Login
                                </button>
                            </div>
                        </div>
                    )}

                    {!isForgotMode && (
                        <div className="demo-credentials">
                            <p><strong>Demo Admin:</strong> admin@scanmart.com / admin123</p>
                            <p><strong>Demo User:</strong> user@scanmart.com / user123</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
