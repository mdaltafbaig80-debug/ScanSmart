import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { billService, productService } from '../../services/api';
import { FiDollarSign, FiShoppingBag, FiPackage, FiAlertTriangle, FiTrendingUp, FiUsers, FiPercent } from 'react-icons/fi';
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

    useEffect(() => {
        fetchStats();
    }, []);

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
            </div>
        </div>
    );
};

export default Dashboard;
