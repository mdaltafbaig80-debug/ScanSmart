import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiInstagram, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { settingsService } from '../services/api';
import './Footer.css';

const Footer = () => {
    const [settings, setSettings] = useState({
        address: '123 Smart Mall, Tech City, TC 12345',
        phone: '+1 (555) 123-4567',
        email: 'support@scanmart.com'
    });

    useEffect(() => {
        settingsService.get()
            .then(res => setSettings(res.data))
            .catch(err => console.error('Failed to load settings:', err));
    }, []);

    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <Link to="/" className="footer-logo">
                            <span className="logo-icon">🛒</span>
                            <span className="logo-text">ScanSmart</span>
                        </Link>
                        <p className="footer-description">
                            Smart retail shopping system with QR code technology.
                            Scan, shop, and pay digitally - the future of retail is here.
                        </p>
                        <div className="footer-social">
                            <a href="#" className="social-link"><FiFacebook size={20} /></a>
                            <a href="#" className="social-link"><FiTwitter size={20} /></a>
                            <a href="#" className="social-link"><FiInstagram size={20} /></a>
                        </div>
                    </div>

                    <div className="footer-links">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/products">Products</Link></li>
                            <li><Link to="/scan">Scan & Shop</Link></li>
                            <li><Link to="/cart">My Cart</Link></li>
                        </ul>
                    </div>

                    <div className="footer-links">
                        <h4>Support</h4>
                        <ul>
                            <li><a href="#">Help Center</a></li>
                            <li><a href="#">FAQs</a></li>
                            <li><a href="#">Privacy Policy</a></li>
                            <li><a href="#">Terms of Service</a></li>
                        </ul>
                    </div>

                    <div className="footer-contact">
                        <h4>Contact Us</h4>
                        <ul>
                            <li>
                                <FiMapPin size={16} />
                                <span>{settings.address}</span>
                            </li>
                            <li>
                                <FiPhone size={16} />
                                <span>{settings.phone}</span>
                            </li>
                            <li>
                                <FiMail size={16} />
                                <span>{settings.email}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} ScanSmart. All rights reserved.</p>
                    <p>Made with ❤️ for smart shopping</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
