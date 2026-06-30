import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { FiSearch, FiFilter, FiShoppingCart, FiPackage } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Products.css';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();

    const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        category: '',
        inStock: false
    });

    // Load categories once on mount — they never change
    useEffect(() => {
        fetchCategories();
    }, []);

    // Debounce search: only update filter 350ms after user stops typing
    const searchTimer = useRef(null);
    const handleSearchChange = (value) => {
        setSearchInput(value);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: value }));
        }, 350);
    };

    // Re-fetch products whenever filters change
    useEffect(() => {
        fetchProducts();
    }, [filters]);


    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filters.search) params.search = filters.search;
            if (filters.category) params.category = filters.category;
            if (filters.inStock) params.inStock = 'true';

            const response = await productService.getAll(params);
            setProducts(response.data);
        } catch (error) {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await productService.getCategories();
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to load categories');
        }
    };

    const handleAddToCart = async (product) => {
        if (!isAuthenticated) {
            toast.info('Please login to add items to cart');
            return;
        }
        // Pass product data for instant optimistic UI update
        await addToCart(product._id, 1, product);
    };

    const getStockBadge = (stock) => {
        if (stock === 0) return <span className="badge badge-error">Out of Stock</span>;
        if (stock < 10) return <span className="badge badge-warning">Low Stock</span>;
        return <span className="badge badge-success">In Stock</span>;
    };

    return (
        <div className="products-page page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Our Products</h1>
                    <p className="page-subtitle">Explore our wide range of quality products</p>
                </div>

                {/* Filters */}
                <div className="filters-section">
                    <div className="search-box">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchInput}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="form-input"
                        />
                    </div>

                    <div className="filter-group">
                        <FiFilter />
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            className="form-input"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat, i) => (
                                <option key={i} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={filters.inStock}
                            onChange={(e) => setFilters({ ...filters, inStock: e.target.checked })}
                        />
                        <span>In Stock Only</span>
                    </label>
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading products...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="empty-state">
                        <FiPackage size={48} />
                        <h3>No products found</h3>
                        <p>Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="products-grid">
                        {products.map((product) => (
                            <div key={product._id} className={`product-card ${product.hasActiveDiscount ? 'has-discount' : ''}`}>
                                <div className="product-image">
                                    <img src={product.image || '/images/default-product.png'} alt={product.name} />
                                    {getStockBadge(product.stock)}
                                    {product.hasActiveDiscount && (
                                        <span className="product-discount-badge">-{product.discountPercent}%</span>
                                    )}
                                </div>
                                <div className="product-info">
                                    <span className="product-category">{product.category}</span>
                                    <h3 className="product-name">{product.name}</h3>
                                    <div className="product-price-container">
                                        {product.hasActiveDiscount ? (
                                            <>
                                                <span className="product-price-original">₹{product.price.toFixed(2)}</span>
                                                <span className="product-price product-price-discounted">₹{product.effectivePrice.toFixed(2)}</span>
                                            </>
                                        ) : (
                                            <span className="product-price">₹{product.price.toFixed(2)}</span>
                                        )}
                                    </div>
                                    <button
                                        className="btn btn-primary btn-add-cart"
                                        onClick={() => handleAddToCart(product)}
                                        disabled={product.stock === 0}
                                    >
                                        <FiShoppingCart /> Add to Cart
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

export default Products;
