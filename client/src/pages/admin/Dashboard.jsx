import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService, billService, productService, settingsService } from '../../services/api';
import { FiDollarSign, FiShoppingBag, FiPackage, FiAlertTriangle, FiTrendingUp, FiUsers, FiPercent, FiLock } from 'react-icons/fi';
import './Admin.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        todayRevenue: 0,
        monthRevenue: 0,
        totalOrders: 0,
        todayOrders: 0,
        lowStockCount: 0,
        recentBills: []
    });
    const [loading, setLoading] = useState(true);
    const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' });
    const [passwordStatus, setPasswordStatus] = useState({ message: '', error: false });
    const [passwordLoading, setPasswordLoading] = useState(false);

    const [settingsData, setSettingsData] = useState({ address: '', phone: '', email: '' });
    const [settingsStatus, setSettingsStatus] = useState({ message: '', error: false });
    const [settingsLoading, setSettingsLoading] = useState(false);

    useEffect(() => {
        fetchStats();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await settingsService.get();
            setSettingsData(res.data);
        } catch (error) {
            console.error('Failed to load settings', error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await billService.getStats();
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSettingsChange = async (e) => {
        e.preventDefault();
        setSettingsLoading(true);
        setSettingsStatus({ message: '', error: false });
        try {
            const res = await settingsService.update(settingsData);
            setSettingsStatus({ message: res.data.message || 'Settings updated successfully!', error: false });
        } catch (error) {
            setSettingsStatus({ message: 'Failed to update settings', error: true });
        } finally {
            setSettingsLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordLoading(true);
        setPasswordStatus({ message: '', error: false });
        try {
            const res = await authService.changePassword(passwordData.oldPassword, passwordData.newPassword);
            setPasswordStatus({ message: res.data.message || 'Password updated successfully!', error: false });
            setPasswordData({ oldPassword: '', newPassword: '' });
        } catch (error) {
            setPasswordStatus({ 
                message: error.response?.data?.message || 'Failed to update password', 
                error: true 
            });
        } finally {
            setPasswordLoading(false);
        }
    };

    const statCards = [
        {
            label: 'Total Revenue',
            value: `₹${stats.totalRevenue.toLocaleString()}`,
            icon: <FiDollarSign />,
            gradient: 'blue'
        },
        {
            label: 'Today\'s Revenue',
            value: `₹${stats.todayRevenue.toLocaleString()}`,
            icon: <FiTrendingUp />,
            gradient: 'green'
        },
        {
            label: 'Total Orders',
            value: stats.totalOrders,
            icon: <FiShoppingBag />,
            gradient: 'purple'
        },
        {
            label: 'Low Stock Items',
            value: stats.lowStockCount,
            icon: <FiAlertTriangle />,
            gradient: 'orange'
        }
    ];

    if (loading) {
        return (
            <div className="admin-page page">
                <div className="container">
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page page">
            <div className="container">
                <div className="admin-header">
                    <div>
                        <h1 className="page-title">Admin Dashboard</h1>
                        <p className="page-subtitle">Welcome back! Here's your store overview</p>
                    </div>
                    <div className="admin-actions">
                        <Link to="/admin/products" className="btn btn-primary">
                            <FiPackage /> Manage Products
                        </Link>
                    </div>
                </div>

                <div className="stats-grid">
                    {statCards.map((stat, index) => (
                        <div key={index} className={`stat-card gradient-${stat.gradient}`}>
                            <div className="stat-icon">{stat.icon}</div>
                            <div className="stat-content">
                                <span className="stat-value">{stat.value}</span>
                                <span className="stat-label">{stat.label}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="admin-grid">
                    <div className="admin-card">
                        <div className="card-header">
                            <h3>Recent Orders</h3>
                            <Link to="/admin/bills" className="view-all">View All</Link>
                        </div>
                        <div className="orders-list">
                            {stats.recentBills.length > 0 ? (
                                stats.recentBills.map((bill, index) => (
                                    <div key={index} className="order-item">
                                        <div className="order-info">
                                            <span className="order-id">{bill.billId}</span>
                                            <span className="order-customer">{bill.user?.name || 'Customer'}</span>
                                        </div>
                                        <span className="order-amount">₹{bill.total.toFixed(2)}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="no-data">No recent orders</p>
                            )}
                        </div>
                    </div>

                    <div className="admin-card">
                        <div className="card-header">
                            <h3>Quick Actions</h3>
                        </div>
                        <div className="quick-actions-grid">
                            <Link to="/admin/products" className="quick-action">
                                <FiPackage size={24} />
                                <span>Add Product</span>
                            </Link>
                            <Link to="/admin/predictions" className="quick-action">
                                <FiTrendingUp size={24} />
                                <span>View Predictions</span>
                            </Link>
                            <Link to="/admin/bills" className="quick-action">
                                <FiShoppingBag size={24} />
                                <span>Bill History</span>
                            </Link>
                            <Link to="/admin/discounts" className="quick-action">
                                <FiPercent size={24} />
                                <span>Discounts</span>
                            </Link>
                            <Link to="/products" className="quick-action">
                                <FiUsers size={24} />
                                <span>View Store</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="admin-grid" style={{ marginTop: '2rem' }}>
                    <div className="admin-card">
                        <div className="card-header">
                            <h3><FiLock style={{ marginRight: '8px' }}/> Security</h3>
                        </div>
                        <form className="password-change-form" onSubmit={handlePasswordChange} style={{ marginTop: '1rem' }}>
                            {passwordStatus.message && (
                                <div className={`alert ${passwordStatus.error ? 'alert-danger' : 'alert-success'}`} style={{ marginBottom: '1rem', padding: '10px', borderRadius: '4px', backgroundColor: passwordStatus.error ? '#1f1315' : '#131e16', color: passwordStatus.error ? '#ff5252' : '#4caf50', border: `1px solid ${passwordStatus.error ? '#ff5252' : '#4caf50'}` }}>
                                    {passwordStatus.message}
                                </div>
                            )}
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-light)' }}>Old Password</label>
                                <input 
                                    type="password" 
                                    className="form-control"
                                    value={passwordData.oldPassword}
                                    onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-dark)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-light)' }}>New Password</label>
                                <input 
                                    type="password" 
                                    className="form-control"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                    required
                                    minLength="6"
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-dark)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                                {passwordLoading ? 'Updating...' : 'Change Password'}
                            </button>
                        </form>
                    </div>

                    <div className="admin-card">
                        <div className="card-header">
                            <h3>Contact Information</h3>
                        </div>
                        <form onSubmit={handleSettingsChange} style={{ marginTop: '1rem' }}>
                            {settingsStatus.message && (
                                <div className={`alert ${settingsStatus.error ? 'alert-danger' : 'alert-success'}`} style={{ marginBottom: '1rem', padding: '10px', borderRadius: '4px', backgroundColor: settingsStatus.error ? '#1f1315' : '#131e16', color: settingsStatus.error ? '#ff5252' : '#4caf50', border: `1px solid ${settingsStatus.error ? '#ff5252' : '#4caf50'}` }}>
                                    {settingsStatus.message}
                                </div>
                            )}
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-light)' }}>Address</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    value={settingsData.address}
                                    onChange={(e) => setSettingsData({...settingsData, address: e.target.value})}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-dark)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-light)' }}>Phone</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    value={settingsData.phone}
                                    onChange={(e) => setSettingsData({...settingsData, phone: e.target.value})}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-dark)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-light)' }}>Email</label>
                                <input 
                                    type="email" 
                                    className="form-control"
                                    value={settingsData.email}
                                    onChange={(e) => setSettingsData({...settingsData, email: e.target.value})}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-dark)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={settingsLoading}>
                                {settingsLoading ? 'Saving...' : 'Save Settings'}
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
