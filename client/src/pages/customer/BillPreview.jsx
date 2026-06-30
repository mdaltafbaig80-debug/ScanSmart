import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { billService, discountService } from '../../services/api';
import { FiCreditCard, FiSmartphone, FiDollarSign, FiTag, FiX, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Bill.css';

const BillPreview = () => {
    const { cart, clearCart } = useCart();
    const [paymentMethod, setPaymentMethod] = useState('upi');
    const [loading, setLoading] = useState(false);
    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [validatingDiscount, setValidatingDiscount] = useState(false);
    const navigate = useNavigate();

    const subtotal = cart.total;
    const discountAmount = appliedDiscount?.discountAmount || 0;
    const taxableAmount = subtotal - discountAmount;
    const taxRate = 18;
    const tax = (taxableAmount * taxRate) / 100;
    const total = taxableAmount + tax;

    const paymentMethods = [
        { id: 'upi', label: 'UPI', icon: <FiSmartphone /> },
        { id: 'card', label: 'Card', icon: <FiCreditCard /> },
        { id: 'cash', label: 'Cash', icon: <FiDollarSign /> }
    ];

    const handleApplyDiscount = async () => {
        if (!discountCode.trim()) {
            toast.error('Please enter a discount code');
            return;
        }

        setValidatingDiscount(true);
        try {
            const response = await discountService.validate(discountCode.trim(), subtotal);
            setAppliedDiscount(response.data.discount);
            toast.success(`Discount applied! You save ₹${response.data.discount.discountAmount.toFixed(2)}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid discount code');
            setAppliedDiscount(null);
        } finally {
            setValidatingDiscount(false);
        }
    };

    const handleRemoveDiscount = () => {
        setAppliedDiscount(null);
        setDiscountCode('');
        toast.info('Discount removed');
    };

    const handlePayment = async () => {
        if (cart.items.length === 0) {
            toast.error('Your cart is empty');
            navigate('/products');
            return;
        }

        setLoading(true);
        try {
            const response = await billService.generate(paymentMethod, appliedDiscount?.code, discountAmount);
            // Clear cart locally — no need for an extra network round-trip since server cleared it
            clearCart();
            navigate('/success', { state: { bill: response.data.bill } });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    if (cart.items.length === 0) {
        navigate('/cart');
        return null;
    }

    return (
        <div className="bill-page page">
            <div className="container container-md">
                <div className="page-header text-center">
                    <h1 className="page-title">Bill Preview</h1>
                    <p className="page-subtitle">Review your order before payment</p>
                </div>

                <div className="bill-card card">
                    <div className="bill-header">
                        <div className="store-info">
                            <h2>🛒 ScanSmart</h2>
                            <p>Smart Retail Shopping</p>
                        </div>
                        <div className="bill-date">
                            {new Date().toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </div>

                    <div className="bill-items">
                        <table className="bill-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.items.map((item) => (
                                    <tr key={item.product._id}>
                                        <td>{item.product.name}</td>
                                        <td>{item.quantity}</td>
                                        <td>₹{item.price.toFixed(2)}</td>
                                        <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Discount Code Section */}
                    <div className="discount-section">
                        <h4><FiTag /> Have a discount code?</h4>
                        {appliedDiscount ? (
                            <div className="applied-discount">
                                <div className="discount-info">
                                    <FiCheck className="success-icon" />
                                    <span>
                                        <strong>{appliedDiscount.code}</strong> applied
                                        {appliedDiscount.type === 'percentage'
                                            ? ` (${appliedDiscount.value}% off)`
                                            : ` (₹${appliedDiscount.value} off)`
                                        }
                                    </span>
                                </div>
                                <button
                                    className="remove-discount"
                                    onClick={handleRemoveDiscount}
                                    title="Remove discount"
                                >
                                    <FiX />
                                </button>
                            </div>
                        ) : (
                            <div className="discount-input-group">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter code"
                                    value={discountCode}
                                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                    onKeyPress={(e) => e.key === 'Enter' && handleApplyDiscount()}
                                />
                                <button
                                    className="btn btn-outline"
                                    onClick={handleApplyDiscount}
                                    disabled={validatingDiscount}
                                >
                                    {validatingDiscount ? 'Checking...' : 'Apply'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bill-totals">
                        <div className="total-row">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="total-row discount-row">
                                <span>Discount ({appliedDiscount?.code})</span>
                                <span className="discount-amount">-₹{discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="total-row">
                            <span>GST ({taxRate}%)</span>
                            <span>₹{tax.toFixed(2)}</span>
                        </div>
                        <div className="total-row grand-total">
                            <span>Total Amount</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="savings-message">
                                🎉 You're saving ₹{discountAmount.toFixed(2)} on this order!
                            </div>
                        )}
                    </div>

                    <div className="payment-section">
                        <h3>Select Payment Method</h3>
                        <div className="payment-methods">
                            {paymentMethods.map((method) => (
                                <button
                                    key={method.id}
                                    className={`payment-option ${paymentMethod === method.id ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod(method.id)}
                                >
                                    {method.icon}
                                    <span>{method.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        className="btn btn-primary btn-lg w-full pay-btn"
                        onClick={handlePayment}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : `Pay ₹${total.toFixed(2)}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BillPreview;
