import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { FiTrash2, FiMinus, FiPlus, FiArrowRight, FiShoppingBag } from 'react-icons/fi';
import './Cart.css';

const Cart = () => {
    const { cart, updateQuantity, removeFromCart, loading } = useCart();
    const navigate = useNavigate();

    const handleQuantityChange = async (productId, newQuantity) => {
        if (newQuantity >= 1) {
            await updateQuantity(productId, newQuantity);
        }
    };

    if (loading) {
        return (
            <div className="cart-page page">
                <div className="container">
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading cart...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Shopping Cart</h1>
                    <p className="page-subtitle">
                        {cart.items.length > 0
                            ? `${cart.items.length} item${cart.items.length > 1 ? 's' : ''} in your cart`
                            : 'Your cart is empty'}
                    </p>
                </div>

                {cart.items.length === 0 ? (
                    <div className="empty-cart">
                        <FiShoppingBag size={64} />
                        <h3>Your cart is empty</h3>
                        <p>Start shopping to add items to your cart</p>
                        <button className="btn btn-primary btn-lg" onClick={() => navigate('/products')}>
                            Browse Products
                        </button>
                    </div>
                ) : (
                    <div className="cart-layout">
                        <div className="cart-items">
                            {cart.items.map((item) => (
                                <div key={item.product._id} className="cart-item card">
                                    <div className="item-image">
                                        <img src={item.product.image || '/images/default-product.png'} alt={item.product.name} />
                                    </div>
                                    <div className="item-details">
                                        <span className="item-category">{item.product.category}</span>
                                        <h3 className="item-name">{item.product.name}</h3>
                                        <p className="item-price">₹{item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="item-quantity">
                                        <button
                                            className="qty-btn"
                                            onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                        >
                                            <FiMinus />
                                        </button>
                                        <span className="qty-value">{item.quantity}</span>
                                        <button
                                            className="qty-btn"
                                            onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                                        >
                                            <FiPlus />
                                        </button>
                                    </div>
                                    <div className="item-subtotal">
                                        <span className="subtotal-label">Subtotal</span>
                                        <span className="subtotal-value">₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                    <button
                                        className="remove-btn"
                                        onClick={() => removeFromCart(item.product._id)}
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="cart-summary card">
                            <h3>Order Summary</h3>
                            <div className="summary-rows">
                                <div className="summary-row">
                                    <span>Subtotal</span>
                                    <span>₹{cart.total.toFixed(2)}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Tax (18% GST)</span>
                                    <span>₹{(cart.total * 0.18).toFixed(2)}</span>
                                </div>
                                <div className="summary-row total">
                                    <span>Total</span>
                                    <span>₹{(cart.total * 1.18).toFixed(2)}</span>
                                </div>
                            </div>
                            <button
                                className="btn btn-primary btn-lg w-full"
                                onClick={() => navigate('/bill')}
                            >
                                Proceed to Bill <FiArrowRight />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;
