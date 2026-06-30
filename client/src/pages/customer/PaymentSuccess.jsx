import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FiCheckCircle, FiDownload, FiHome, FiShoppingBag } from 'react-icons/fi';
import { generateBillPDF } from '../../utils/generateBillPDF';
import { toast } from 'react-toastify';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const bill = location.state?.bill;

    if (!bill) {
        navigate('/products');
        return null;
    }

    const downloadPDF = () => {
        try {
            generateBillPDF(bill);
            toast.success('Bill downloaded successfully!');
        } catch (error) {
            console.error('PDF generation error:', error);
            toast.error('Failed to download bill. Please try again.');
        }
    };

    return (
        <div className="success-page page">
            <div className="container container-sm">
                <div className="success-card animate-slideUp">
                    <div className="success-icon">
                        <FiCheckCircle size={80} />
                    </div>

                    <h1>Payment Successful!</h1>
                    <p className="success-message">Thank you for shopping with ScanSmart</p>

                    <div className="bill-info card">
                        <div className="info-row">
                            <span>Bill ID</span>
                            <span className="bill-id">{bill.billId}</span>
                        </div>
                        <div className="info-row">
                            <span>Subtotal</span>
                            <span>₹{bill.subtotal?.toFixed(2)}</span>
                        </div>
                        {bill.discount > 0 && (
                            <div className="info-row discount-row">
                                <span>Discount {bill.discountCode && `(${bill.discountCode})`}</span>
                                <span className="discount-value">-₹{bill.discount?.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="info-row">
                            <span>Tax (GST {bill.taxRate || 18}%)</span>
                            <span>₹{bill.tax?.toFixed(2)}</span>
                        </div>
                        <div className="info-row total-row">
                            <span>Amount Paid</span>
                            <span className="amount">₹{bill.total?.toFixed(2)}</span>
                        </div>
                        <div className="info-row">
                            <span>Payment Method</span>
                            <span className="method">{bill.paymentMethod?.toUpperCase()}</span>
                        </div>
                        <div className="info-row">
                            <span>Items</span>
                            <span>{bill.items?.length || 0} items</span>
                        </div>
                        {bill.discount > 0 && (
                            <div className="savings-banner">
                                🎉 You saved ₹{bill.discount?.toFixed(2)} on this order!
                            </div>
                        )}
                    </div>

                    <div className="success-actions">
                        <button className="btn btn-outline btn-lg" onClick={downloadPDF}>
                            <FiDownload /> Download Bill
                        </button>
                        <Link to="/products" className="btn btn-primary btn-lg">
                            <FiShoppingBag /> Continue Shopping
                        </Link>
                    </div>

                    <Link to="/" className="home-link">
                        <FiHome /> Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
