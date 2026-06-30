import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE,
    timeout: 15000, // 15s timeout — fail fast instead of hanging forever
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle network errors clearly
api.interceptors.response.use(
    response => response,
    error => {
        if (error.code === 'ECONNABORTED') {
            error.message = 'Request timed out. Please check your connection and try again.';
        } else if (!error.response) {
            error.message = 'Network error. Please check your connection.';
        }
        return Promise.reject(error);
    }
);

// Auth services
export const authService = {
    register: (name, email, mobileNumber, password, role) =>
        api.post('/auth/register', { name, email, mobileNumber, password, role }),
    login: (email, password) =>
        api.post('/auth/login', { email, password }),
    getMe: () =>
        api.get('/auth/me'),
    checkEmail: (email) => 
        api.post('/auth/check-email', { email }),
    verifyOtp: (email, otp) =>
        api.post('/auth/verify-otp', { email, otp }),
    resetPassword: (email, otp, newPassword) =>
        api.post('/auth/reset-password', { email, otp, newPassword }),
    changePassword: (oldPassword, newPassword) =>
        api.post('/auth/change-password', { oldPassword, newPassword })
};

// Product services
export const productService = {
    getAll: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    getByQR: (qrCode) => api.get(`/products/qr/${qrCode}`),
    getCategories: () => api.get('/products/categories'),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
    updateStock: (id, stock) => api.patch(`/products/${id}/stock`, { stock }),
    getLowStock: () => api.get('/products/admin/low-stock')
};

// Cart services
export const cartService = {
    getCart: () => api.get('/cart'),
    addToCart: (productId, quantity) => api.post('/cart/add', { productId, quantity }),
    updateQuantity: (productId, quantity) => api.put('/cart/update', { productId, quantity }),
    removeFromCart: (productId) => api.delete(`/cart/remove/${productId}`),
    clearCart: () => api.delete('/cart/clear')
};

// Bill services
export const billService = {
    generate: (paymentMethod, discountCode, discountAmount) =>
        api.post('/bills/generate', { paymentMethod, discountCode, discountAmount }),
    getMyBills: () => api.get('/bills/my-bills'),
    getById: (id) => api.get(`/bills/${id}`),
    getAll: (params) => api.get('/bills/all', { params }),
    getStats: () => api.get('/bills/admin/stats'),
    processReturn: (billId, itemIndex, returnQuantity, reason) =>
        api.post('/bills/return', { billId, itemIndex, returnQuantity, reason })
};

// Chatbot services
export const chatbotService = {
    sendMessage: (message) => api.post('/chatbot/message', { message }),
    quickSearch: (query) => api.get('/chatbot/search', { params: { query } })
};

// Sales services
export const salesService = {
    getSalesData: (params) => api.get('/sales', { params }),
    getSalesByProduct: () => api.get('/sales/by-product'),
    getDailySales: (days) => api.get('/sales/daily', { params: { days } }),
    getMLData: (productId) => api.get(`/sales/ml-data/${productId}`)
};

// Discount services
export const discountService = {
    getAll: () => api.get('/discounts'),
    create: (data) => api.post('/discounts', data),
    update: (id, data) => api.put(`/discounts/${id}`, data),
    delete: (id) => api.delete(`/discounts/${id}`),
    toggle: (id) => api.patch(`/discounts/${id}/toggle`),
    validate: (code, cartTotal) => api.post('/discounts/validate', { code, cartTotal })
};

// Settings services
export const settingsService = {
    get: () => api.get('/settings'),
    update: (data) => api.post('/settings', data)
};

export default api;

