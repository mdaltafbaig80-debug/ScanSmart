import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { billService } from '../../services/api';
import { FiFileText, FiCalendar, FiCreditCard, FiShoppingBag, FiDownload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { generateBillPDF } from '../../utils/generateBillPDF';
import './Bill.css';

const MyBills = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBills();
    }, []);

    const fetchBills = async () => {
        try {
            const response = await billService.getMyBills();
            setBills(response.data);
        } catch (error) {
            toast.error('Failed to fetch bills');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const downloadPDF = (bill) => {
        try {
            generateBillPDF(bill);
            toast.success('Bill downloaded!');
        } catch (error) {
            console.error('PDF error:', error);
            toast.error('Failed to download bill');
        }
    };

    if (loading) {
        return (
            <div className="page loading-page">
                <div className="container">
                    <div className="loading-spinner"></div>
                    <p>Loading your bills...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="my-bills-page page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">My Bills</h1>
                    <p className="page-subtitle">View your purchase history</p>
                </div>

                {bills.length === 0 ? (
                    <div className="empty-state">
                        <FiShoppingBag size={64} />
                        <h2>No bills yet</h2>
                        <p>Start shopping to see your purchase history here!</p>
                        <Link to="/products" className="btn btn-primary">
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="bills-list">
                        {bills.map((bill) => (
                            <div key={bill._id} className="bill-card card">
                                <div className="bill-card-header">
                                    <div className="bill-id">
                                        <FiFileText />
                                        <span>{bill.billId || 'N/A'}</span>
                                    </div>
                                    <span className={`status-badge ${bill.paymentStatus || 'completed'}`}>
                                        {bill.paymentStatus || 'completed'}
                                    </span>
                                </div>

                                <div className="bill-card-body">
                                    <div className="bill-meta">
                                        <div className="meta-item">
                                            <FiCalendar />
                                            <span>{bill.createdAt ? formatDate(bill.createdAt) : 'N/A'}</span>
                                        </div>
                                        <div className="meta-item">
                                            <FiCreditCard />
                                            <span>{(bill.paymentMethod || 'upi').toUpperCase()}</span>
                                        </div>
                                    </div>

                                    <div className="bill-items-summary">
                                        {(bill.items || []).slice(0, 3).map((item, index) => (
                                            <span
                                                key={index}
                                                className={`item-tag ${item.isReturned ? 'returned' : ''}`}
                                            >
                                                {item.name} x{item.quantity}
                                                {item.returnedQuantity > 0 && (
                                                    <span className="return-badge">
                                                        {item.returnedQuantity === item.quantity ? ' ↩ Returned' : ` ↩ ${item.returnedQuantity} returned`}
                                                    </span>
                                                )}
                                            </span>
                                        ))}
                                        {(bill.items || []).length > 3 && (
                                            <span className="item-tag more">
                                                +{bill.items.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="bill-card-footer">
                                    <div className="bill-total">
                                        <span>Total</span>
                                        <span className="amount">₹{bill.total.toFixed(2)}</span>
                                        {bill.discount > 0 && (
                                            <span className="discount-saved">Saved ₹{bill.discount.toFixed(2)}</span>
                                        )}
                                    </div>
                                    <button
                                        className="btn btn-outline btn-sm download-btn"
                                        onClick={() => downloadPDF(bill)}
                                    >
                                        <FiDownload /> Download
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyBills;
