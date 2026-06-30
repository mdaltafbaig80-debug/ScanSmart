import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';

// Public Pages
import Home from './pages/Home';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Customer Pages
import Products from './pages/customer/Products';
import QRScan from './pages/customer/QRScan';
import Cart from './pages/customer/Cart';
import BillPreview from './pages/customer/BillPreview';
import PaymentSuccess from './pages/customer/PaymentSuccess';
import MyBills from './pages/customer/MyBills';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ProductManagement from './pages/admin/ProductManagement';
import SalesPrediction from './pages/admin/SalesPrediction';
import BillHistory from './pages/admin/BillHistory';
import DiscountManagement from './pages/admin/DiscountManagement';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <Router>
            <AuthProvider>
                <CartProvider>
                    <div className="app">
                        <Navbar />
                        <main className="main-content">
                            <Routes>
                                {/* Public Routes */}
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/signup" element={<Signup />} />
                                <Route path="/products" element={<Products />} />

                                {/* Protected Customer Routes */}
                                <Route path="/scan" element={
                                    <ProtectedRoute>
                                        <QRScan />
                                    </ProtectedRoute>
                                } />
                                <Route path="/cart" element={
                                    <ProtectedRoute>
                                        <Cart />
                                    </ProtectedRoute>
                                } />
                                <Route path="/bill" element={
                                    <ProtectedRoute>
                                        <BillPreview />
                                    </ProtectedRoute>
                                } />
                                <Route path="/success" element={
                                    <ProtectedRoute>
                                        <PaymentSuccess />
                                    </ProtectedRoute>
                                } />
                                <Route path="/my-bills" element={
                                    <ProtectedRoute>
                                        <MyBills />
                                    </ProtectedRoute>
                                } />

                                {/* Admin Routes */}
                                <Route path="/admin" element={
                                    <ProtectedRoute adminOnly>
                                        <AdminDashboard />
                                    </ProtectedRoute>
                                } />
                                <Route path="/admin/products" element={
                                    <ProtectedRoute adminOnly>
                                        <ProductManagement />
                                    </ProtectedRoute>
                                } />
                                <Route path="/admin/predictions" element={
                                    <ProtectedRoute adminOnly>
                                        <SalesPrediction />
                                    </ProtectedRoute>
                                } />
                                <Route path="/admin/bills" element={
                                    <ProtectedRoute adminOnly>
                                        <BillHistory />
                                    </ProtectedRoute>
                                } />
                                <Route path="/admin/discounts" element={
                                    <ProtectedRoute adminOnly>
                                        <DiscountManagement />
                                    </ProtectedRoute>
                                } />
                            </Routes>
                        </main>
                        <Footer />
                        <Chatbot />
                        <ToastContainer
                            position="top-right"
                            autoClose={3000}
                            hideProgressBar={false}
                            newestOnTop
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                            theme="colored"
                        />
                    </div>
                </CartProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
