import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi';
import { chatbotService } from '../services/api';
import { useCart } from '../context/CartContext';
import './Chatbot.css';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { type: 'bot', text: "Hello! 👋 I'm your ScanSmart assistant. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
        setLoading(true);

        try {
            const response = await chatbotService.sendMessage(userMessage);
            const { message, action, data } = response.data;

            setMessages(prev => [...prev, { type: 'bot', text: message, data }]);

            // Handle actions
            if (action) {
                setTimeout(() => {
                    if (action.type === 'NAVIGATE' && action.route) {
                        navigate(action.route);
                    } else if (action.type === 'SHOW_PRODUCTS' && action.route) {
                        navigate(action.route);
                    } else if (action.type === 'ADD_TO_CART' && action.productId) {
                        addToCart(action.productId);
                    }
                }, 1000);
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                type: 'bot',
                text: "Sorry, I'm having trouble understanding. Please try again!"
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    const quickActions = [
        { text: '🛒 View Cart', message: 'Go to cart' },
        { text: '📦 Products', message: 'Show products' },
        { text: '📷 Scan', message: 'Go to scan page' },
        { text: '❓ Help', message: 'Help' }
    ];

    return (
        <div className="chatbot-container">
            {isOpen && (
                <div className="chatbot-window animate-slideUp">
                    <div className="chatbot-header">
                        <div className="chatbot-title">
                            <span className="chatbot-avatar">🤖</span>
                            <div>
                                <h4>ScanSmart Assistant</h4>
                                <span className="status">Online</span>
                            </div>
                        </div>
                        <button className="close-btn" onClick={() => setIsOpen(false)}>
                            <FiX size={20} />
                        </button>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.type}`}>
                                {msg.type === 'bot' && <span className="bot-avatar">🤖</span>}
                                <div className="message-content">
                                    <p>{msg.text}</p>
                                    {msg.data && Array.isArray(msg.data) && (
                                        <div className="product-suggestions">
                                            {msg.data.slice(0, 3).map((product, i) => (
                                                <div key={i} className="product-chip">
                                                    {product.name} - ₹{product.price}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="message bot">
                                <span className="bot-avatar">🤖</span>
                                <div className="message-content">
                                    <div className="typing-indicator">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="quick-actions">
                        {quickActions.map((action, index) => (
                            <button
                                key={index}
                                className="quick-action-btn"
                                onClick={() => {
                                    setInput(action.message);
                                    handleSend();
                                }}
                            >
                                {action.text}
                            </button>
                        ))}
                    </div>

                    <div className="chatbot-input">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={loading}
                        />
                        <button className="send-btn" onClick={handleSend} disabled={loading || !input.trim()}>
                            <FiSend size={18} />
                        </button>
                    </div>
                </div>
            )}

            <button className="chatbot-toggle" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <FiX size={24} /> : <FiMessageCircle size={24} />}
            </button>
        </div>
    );
};

export default Chatbot;
