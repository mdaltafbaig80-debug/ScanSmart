import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { cartService } from '../services/api';
import { toast } from 'react-toastify';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [cart, setCart] = useState({ items: [], total: 0 });
    const [loading, setLoading] = useState(false);
    // Track in-flight mutations to prevent race conditions
    const pendingRef = useRef(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchCart();
        } else {
            setCart({ items: [], total: 0 });
        }
    }, [isAuthenticated]);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const response = await cartService.getCart();
            setCart(response.data);
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        } finally {
            setLoading(false);
        }
    };

    // Compute cart total from items
    const computeTotal = (items) =>
        items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const addToCart = async (productId, quantity = 1, productData = null) => {
        // --- OPTIMISTIC UPDATE ---
        // If we have product data (passed from Products page), update UI instantly
        if (productData) {
            const price = productData.effectivePrice ?? productData.price;
            setCart(prev => {
                const existing = prev.items.find(i => i.product?._id === productId || i.product?.id === productId);
                let newItems;
                if (existing) {
                    newItems = prev.items.map(i =>
                        (i.product?._id === productId || i.product?.id === productId)
                            ? { ...i, quantity: i.quantity + quantity }
                            : i
                    );
                } else {
                    newItems = [...prev.items, {
                        product: { ...productData, _id: productId },
                        quantity,
                        price,
                        _id: `optimistic-${Date.now()}`
                    }];
                }
                return { items: newItems, total: computeTotal(newItems) };
            });
            toast.success('Added to cart!');
        }

        // --- BACKGROUND SYNC ---
        try {
            const response = await cartService.addToCart(productId, quantity);
            // Replace optimistic state with real server data
            setCart(response.data.cart);
            if (!productData) toast.success('Added to cart!');
            return true;
        } catch (error) {
            // Revert on failure by re-fetching real cart
            fetchCart();
            toast.error(error.response?.data?.message || 'Failed to add to cart');
            return false;
        }
    };

    const updateQuantity = async (productId, quantity) => {
        // --- OPTIMISTIC UPDATE ---
        const prevCart = cart;
        setCart(prev => {
            const newItems = prev.items.map(i =>
                (i.product?._id === productId || i.product?.id === productId)
                    ? { ...i, quantity }
                    : i
            );
            return { items: newItems, total: computeTotal(newItems) };
        });

        // --- BACKGROUND SYNC ---
        try {
            const response = await cartService.updateQuantity(productId, quantity);
            setCart(response.data.cart);
            return true;
        } catch (error) {
            setCart(prevCart); // revert
            toast.error(error.response?.data?.message || 'Failed to update quantity');
            return false;
        }
    };

    const removeFromCart = async (productId) => {
        // --- OPTIMISTIC UPDATE ---
        const prevCart = cart;
        setCart(prev => {
            const newItems = prev.items.filter(
                i => i.product?._id !== productId && i.product?.id !== productId
            );
            return { items: newItems, total: computeTotal(newItems) };
        });
        toast.success('Item removed');

        // --- BACKGROUND SYNC ---
        try {
            const response = await cartService.removeFromCart(productId);
            setCart(response.data.cart);
            return true;
        } catch (error) {
            setCart(prevCart); // revert
            toast.error('Failed to remove item');
            return false;
        }
    };

    const clearCart = async () => {
        const prevCart = cart;
        setCart({ items: [], total: 0 }); // optimistic clear
        try {
            await cartService.clearCart();
            return true;
        } catch (error) {
            setCart(prevCart); // revert
            toast.error('Failed to clear cart');
            return false;
        }
    };

    const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart,
            loading,
            addToCart,
            updateQuantity,
            removeFromCart,
            clearCart,
            fetchCart,
            cartCount
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};
