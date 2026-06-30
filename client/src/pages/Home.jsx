import { Link } from 'react-router-dom';
import { FiCamera, FiShoppingCart, FiCreditCard, FiMessageCircle, FiArrowRight, FiCheck } from 'react-icons/fi';
import './Home.css';

const Home = () => {
    const features = [
        {
            icon: <FiCamera size={32} />,
            title: 'QR Code Scan',
            description: 'Simply scan product QR codes with your phone camera for instant product details'
        },
        {
            icon: <FiShoppingCart size={32} />,
            title: 'Smart Cart',
            description: 'Add items to your digital cart and manage quantities in real-time'
        },
        {
            icon: <FiCreditCard size={32} />,
            title: 'Digital Billing',
            description: 'No queues! Generate bills instantly and pay digitally'
        },
        {
            icon: <FiMessageCircle size={32} />,
            title: 'AI Assistant',
            description: 'Get help from our smart chatbot for product search and navigation'
        }
    ];

    const steps = [
        { number: '01', title: 'Scan', description: 'Scan product QR codes' },
        { number: '02', title: 'Add to Cart', description: 'Build your shopping cart' },
        { number: '03', title: 'Generate Bill', description: 'Review itemized bill' },
        { number: '04', title: 'Pay & Go', description: 'Complete payment digitally' }
    ];

    return (
        <div className="home">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg">
                    <div className="hero-circle hero-circle-1"></div>
                    <div className="hero-circle hero-circle-2"></div>
                    <div className="hero-circle hero-circle-3"></div>
                </div>
                <div className="container">
                    <div className="hero-content">
                        <span className="hero-badge">🚀 The Future of Retail</span>
                        <h1 className="hero-title">
                            One-Scan<br />
                            <span className="gradient-text">Smart Shopping</span>
                        </h1>
                        <p className="hero-description">
                            Experience seamless shopping with QR code technology.
                            Scan products, manage your cart, and pay digitally - all without standing in queues.
                        </p>
                        <div className="hero-buttons">
                            <Link to="/products" className="btn btn-primary btn-lg">
                                Start Shopping <FiArrowRight />
                            </Link>
                            <Link to="/signup" className="btn btn-outline btn-lg">
                                Create Account
                            </Link>
                        </div>
                        <div className="hero-stats">
                            <div className="stat">
                                <span className="stat-value">10K+</span>
                                <span className="stat-label">Products</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">50K+</span>
                                <span className="stat-label">Happy Customers</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">99%</span>
                                <span className="stat-label">Satisfaction</span>
                            </div>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="phone-mockup">
                            <div className="phone-screen">
                                <div className="scan-animation">
                                    <div className="scan-frame"></div>
                                    <div className="scan-line"></div>
                                </div>
                                <p>Scanning...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <div className="container">
                    <div className="section-header">
                        <span className="section-badge">Features</span>
                        <h2>Why Choose ScanSmart?</h2>
                        <p>Modern shopping experience powered by technology</p>
                    </div>
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card">
                                <div className="feature-icon">{feature.icon}</div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works">
                <div className="container">
                    <div className="section-header">
                        <span className="section-badge">Process</span>
                        <h2>How It Works</h2>
                        <p>Shopping made simple in 4 easy steps</p>
                    </div>
                    <div className="steps-grid">
                        {steps.map((step, index) => (
                            <div key={index} className="step-card">
                                <span className="step-number">{step.number}</span>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                                {index < steps.length - 1 && <div className="step-connector"></div>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta">
                <div className="container">
                    <div className="cta-content">
                        <h2>Ready to Transform Your Shopping?</h2>
                        <p>Join thousands of smart shoppers today</p>
                        <div className="cta-features">
                            <span><FiCheck /> No queues</span>
                            <span><FiCheck /> Instant billing</span>
                            <span><FiCheck /> Digital receipts</span>
                        </div>
                        <Link to="/signup" className="btn btn-primary btn-lg">
                            Get Started Free <FiArrowRight />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
