import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FiShoppingCart, FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useState } from 'react';
import './Navbar.css';

const Navbar = () => {
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
        setMenuOpen(false);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <span className="logo-icon">🛒</span>
                    <span className="logo-text">ScanSmart</span>
                </Link>

                <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>

                <div className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
                    <div className="navbar-links">
                        <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>Home</Link>
                        <Link to="/products" className="nav-link" onClick={() => setMenuOpen(false)}>Products</Link>
                        {isAuthenticated && (
                            <>
                                <Link to="/scan" className="nav-link" onClick={() => setMenuOpen(false)}>Scan</Link>
                                <Link to="/my-bills" className="nav-link" onClick={() => setMenuOpen(false)}>My Bills</Link>
                            </>
                        )}
                        {isAdmin && (
                            <Link to="/admin" className="nav-link admin-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                        )}
                    </div>

                    <div className="navbar-actions">
                        {isAuthenticated ? (
                            <>
                                <Link to="/cart" className="cart-btn" onClick={() => setMenuOpen(false)}>
                                    <FiShoppingCart size={20} />
                                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                                </Link>
                                <div className="user-menu">
                                    <span className="user-name">
                                        <FiUser size={18} />
                                        {user?.name}
                                    </span>
                                    <button className="logout-btn" onClick={handleLogout}>
                                        <FiLogOut size={18} />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="auth-buttons">
                                <Link to="/login" className="btn btn-ghost" onClick={() => setMenuOpen(false)}>Login</Link>
                                <Link to="/signup" className="btn btn-primary" onClick={() => setMenuOpen(false)}>Sign Up</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
