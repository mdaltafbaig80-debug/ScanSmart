import { useState, useEffect } from 'react';
import { productService } from '../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiPackage } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Admin.css';

const ProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: 'Groceries',
        stock: '',
        image: '',
        discountPercent: '',
        discountValidUntil: ''
    });

    const categories = ['Dairy', 'Beverages', 'Snacks', 'Groceries', 'Fruits', 'Vegetables', 'Bakery', 'Frozen', 'Personal Care', 'Household', 'Other'];

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await productService.getAll();
            setProducts(response.data);
        } catch (error) {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editProduct) {
                await productService.update(editProduct._id, {
                    ...formData,
                    price: parseFloat(formData.price),
                    stock: parseInt(formData.stock),
                    discountPercent: formData.discountPercent ? parseFloat(formData.discountPercent) : 0,
                    discountValidUntil: formData.discountValidUntil || null
                });
                toast.success('Product updated successfully');
            } else {
                await productService.create({
                    ...formData,
                    price: parseFloat(formData.price),
                    stock: parseInt(formData.stock),
                    discountPercent: formData.discountPercent ? parseFloat(formData.discountPercent) : 0,
                    discountValidUntil: formData.discountValidUntil || null
                });
                toast.success('Product added successfully');
            }
            fetchProducts();
            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await productService.delete(id);
                toast.success('Product deleted');
                fetchProducts();
            } catch (error) {
                toast.error('Failed to delete product');
            }
        }
    };

    const openAddModal = () => {
        setEditProduct(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            category: 'Groceries',
            stock: '',
            image: '',
            discountPercent: '',
            discountValidUntil: ''
        });
        setShowModal(true);
    };

    const openEditModal = (product) => {
        setEditProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            category: product.category,
            stock: product.stock.toString(),
            image: product.image,
            discountPercent: product.discountPercent ? product.discountPercent.toString() : '',
            discountValidUntil: product.discountValidUntil ? new Date(product.discountValidUntil).toISOString().split('T')[0] : ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditProduct(null);
    };

    const getStockBadge = (stock) => {
        if (stock === 0) return <span className="badge badge-error">Out of Stock</span>;
        if (stock < 10) return <span className="badge badge-warning">Low: {stock}</span>;
        return <span className="badge badge-success">{stock}</span>;
    };

    return (
        <div className="admin-page page">
            <div className="container">
                <div className="admin-header">
                    <div>
                        <h1 className="page-title">Product Management</h1>
                        <p className="page-subtitle">Add, edit, and manage your product inventory</p>
                    </div>
                    <button className="btn btn-primary" onClick={openAddModal}>
                        <FiPlus /> Add Product
                    </button>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="empty-state">
                        <FiPackage size={48} />
                        <h3>No products yet</h3>
                        <p>Add your first product to get started</p>
                        <button className="btn btn-primary" onClick={openAddModal}>
                            <FiPlus /> Add Product
                        </button>
                    </div>
                ) : (
                    <div className="products-table-container">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>QR Code</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product._id}>
                                        <td>
                                            <div className="product-cell">
                                                <strong>{product.name}</strong>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="price-cell">
                                                {product.hasActiveDiscount ? (
                                                    <>
                                                        <span className="original-price">₹{product.price.toFixed(2)}</span>
                                                        <span className="discounted-price">₹{product.effectivePrice.toFixed(2)}</span>
                                                        <span className="discount-badge">-{product.discountPercent}%</span>
                                                    </>
                                                ) : (
                                                    <span>₹{product.price.toFixed(2)}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>{product.category}</td>
                                        <td>{getStockBadge(product.stock)}</td>
                                        <td>
                                            <code className="qr-code">{product.qrCode}</code>
                                        </td>
                                        <td className="actions">
                                            <button className="action-btn edit" onClick={() => openEditModal(product)}>
                                                <FiEdit2 />
                                            </button>
                                            <button className="action-btn delete" onClick={() => handleDelete(product._id)}>
                                                <FiTrash2 />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {showModal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{editProduct ? 'Edit Product' : 'Add New Product'}</h3>
                                <button className="modal-close" onClick={closeModal}>
                                    <FiX size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">Product Name</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-input"
                                            rows="3"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Price (₹)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-input"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Stock</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={formData.stock}
                                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <select
                                            className="form-input"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Image URL</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="https://example.com/image.jpg"
                                            value={formData.image}
                                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                        />
                                    </div>

                                    {/* Per-Item Discount Section */}
                                    <div className="discount-section-form">
                                        <h4>Product Discount (Optional)</h4>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">Discount %</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    className="form-input"
                                                    placeholder="0"
                                                    value={formData.discountPercent}
                                                    onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Valid Until</label>
                                                <input
                                                    type="date"
                                                    className="form-input"
                                                    value={formData.discountValidUntil}
                                                    onChange={(e) => setFormData({ ...formData, discountValidUntil: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        {formData.discountPercent > 0 && formData.price && (
                                            <p className="discount-preview">
                                                Effective Price: ₹{(parseFloat(formData.price) * (1 - parseFloat(formData.discountPercent) / 100)).toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-ghost" onClick={closeModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editProduct ? 'Update Product' : 'Add Product'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductManagement;
