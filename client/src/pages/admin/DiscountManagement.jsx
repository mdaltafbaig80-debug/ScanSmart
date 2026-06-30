import { useState, useEffect } from 'react';
import { discountService } from '../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiPercent, FiDollarSign } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Admin.css';

const DiscountManagement = () => {
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        type: 'percentage',
        value: '',
        minPurchase: '',
        maxDiscount: '',
        validUntil: '',
        usageLimit: ''
    });

    useEffect(() => {
        fetchDiscounts();
    }, []);

    const fetchDiscounts = async () => {
        try {
            const response = await discountService.getAll();
            setDiscounts(response.data);
        } catch (error) {
            toast.error('Failed to fetch discounts');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            description: '',
            type: 'percentage',
            value: '',
            minPurchase: '',
            maxDiscount: '',
            validUntil: '',
            usageLimit: ''
        });
        setEditingDiscount(null);
    };

    const openModal = (discount = null) => {
        if (discount) {
            setEditingDiscount(discount);
            setFormData({
                code: discount.code,
                description: discount.description || '',
                type: discount.type,
                value: discount.value,
                minPurchase: discount.minPurchase || '',
                maxDiscount: discount.maxDiscount || '',
                validUntil: discount.validUntil ? new Date(discount.validUntil).toISOString().split('T')[0] : '',
                usageLimit: discount.usageLimit || ''
            });
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.code || !formData.value || !formData.validUntil) {
            toast.error('Please fill required fields');
            return;
        }

        try {
            const data = {
                ...formData,
                value: parseFloat(formData.value),
                minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : 0,
                maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
                usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null
            };

            if (editingDiscount) {
                await discountService.update(editingDiscount._id, data);
                toast.success('Discount updated');
            } else {
                await discountService.create(data);
                toast.success('Discount created');
            }

            setShowModal(false);
            resetForm();
            fetchDiscounts();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save discount');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this discount?')) return;

        try {
            await discountService.delete(id);
            toast.success('Discount deleted');
            fetchDiscounts();
        } catch (error) {
            toast.error('Failed to delete discount');
        }
    };

    const handleToggle = async (id) => {
        try {
            await discountService.toggle(id);
            fetchDiscounts();
        } catch (error) {
            toast.error('Failed to toggle discount');
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const isExpired = (date) => new Date(date) < new Date();

    return (
        <div className="admin-page page">
            <div className="container">
                <div className="admin-header">
                    <div>
                        <h1 className="page-title">Discount Management</h1>
                        <p className="page-subtitle">Create and manage discount codes</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <FiPlus /> Add Discount
                    </button>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                ) : discounts.length === 0 ? (
                    <div className="empty-state card">
                        <FiPercent size={48} />
                        <h3>No discounts yet</h3>
                        <p>Create your first discount code</p>
                        <button className="btn btn-primary" onClick={() => openModal()}>
                            <FiPlus /> Create Discount
                        </button>
                    </div>
                ) : (
                    <div className="discounts-grid">
                        {discounts.map((discount) => (
                            <div key={discount._id} className={`discount-card card ${!discount.isActive ? 'inactive' : ''} ${isExpired(discount.validUntil) ? 'expired' : ''}`}>
                                <div className="discount-header">
                                    <code className="discount-code">{discount.code}</code>
                                    <button
                                        className="toggle-btn"
                                        onClick={() => handleToggle(discount._id)}
                                        title={discount.isActive ? 'Deactivate' : 'Activate'}
                                    >
                                        {discount.isActive ? <FiToggleRight className="active" /> : <FiToggleLeft />}
                                    </button>
                                </div>

                                <div className="discount-value">
                                    {discount.type === 'percentage' ? (
                                        <><FiPercent /> {discount.value}% OFF</>
                                    ) : (
                                        <><FiDollarSign /> ₹{discount.value} OFF</>
                                    )}
                                </div>

                                {discount.description && (
                                    <p className="discount-desc">{discount.description}</p>
                                )}

                                <div className="discount-details">
                                    {discount.minPurchase > 0 && (
                                        <span>Min: ₹{discount.minPurchase}</span>
                                    )}
                                    {discount.maxDiscount && (
                                        <span>Max: ₹{discount.maxDiscount}</span>
                                    )}
                                    {discount.usageLimit && (
                                        <span>Uses: {discount.usedCount}/{discount.usageLimit}</span>
                                    )}
                                </div>

                                <div className="discount-validity">
                                    <span className={isExpired(discount.validUntil) ? 'expired-text' : ''}>
                                        {isExpired(discount.validUntil) ? 'Expired' : 'Valid until'}: {formatDate(discount.validUntil)}
                                    </span>
                                </div>

                                <div className="discount-actions">
                                    <button className="btn btn-sm btn-outline" onClick={() => openModal(discount)}>
                                        <FiEdit2 /> Edit
                                    </button>
                                    <button className="btn btn-sm btn-outline btn-danger" onClick={() => handleDelete(discount._id)}>
                                        <FiTrash2 /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h2>{editingDiscount ? 'Edit Discount' : 'Create Discount'}</h2>

                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Code *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            placeholder="e.g., SAVE20"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Type</label>
                                        <select
                                            className="form-input"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option value="percentage">Percentage</option>
                                            <option value="fixed">Fixed Amount</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="e.g., New Year Sale"
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Value * ({formData.type === 'percentage' ? '%' : '₹'})</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.value}
                                            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                            placeholder={formData.type === 'percentage' ? '10' : '100'}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Valid Until *</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={formData.validUntil}
                                            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Min Purchase (₹)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.minPurchase}
                                            onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Max Discount (₹)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.maxDiscount}
                                            onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                                            placeholder="No limit"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Usage Limit</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.usageLimit}
                                        onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                        placeholder="Unlimited"
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingDiscount ? 'Update' : 'Create'} Discount
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .discounts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: var(--spacing-lg);
                }
                
                .discount-card {
                    padding: var(--spacing-lg);
                }
                
                .discount-card.inactive {
                    opacity: 0.6;
                }
                
                .discount-card.expired {
                    border-color: var(--error);
                }
                
                .discount-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--spacing-md);
                }
                
                .discount-code {
                    font-size: 1.25rem;
                    font-weight: 700;
                    padding: var(--spacing-sm) var(--spacing-md);
                    background: var(--background);
                    border-radius: var(--radius-sm);
                    letter-spacing: 1px;
                }
                
                .toggle-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 1.5rem;
                    color: var(--text-secondary);
                }
                
                .toggle-btn .active {
                    color: var(--secondary);
                }
                
                .discount-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--secondary);
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-xs);
                    margin-bottom: var(--spacing-sm);
                }
                
                .discount-desc {
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                    margin-bottom: var(--spacing-md);
                }
                
                .discount-details {
                    display: flex;
                    flex-wrap: wrap;
                    gap: var(--spacing-sm);
                    margin-bottom: var(--spacing-sm);
                }
                
                .discount-details span {
                    font-size: 0.75rem;
                    padding: 2px 8px;
                    background: var(--background);
                    border-radius: var(--radius-sm);
                }
                
                .discount-validity {
                    font-size: 0.8125rem;
                    color: var(--text-secondary);
                    margin-bottom: var(--spacing-md);
                }
                
                .expired-text {
                    color: var(--error);
                }
                
                .discount-actions {
                    display: flex;
                    gap: var(--spacing-sm);
                }
                
                .btn-danger {
                    color: var(--error);
                    border-color: var(--error);
                }
                
                .btn-danger:hover {
                    background: var(--error);
                    color: white;
                }
                
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: var(--spacing-lg);
                }
                
                .modal-content {
                    background: white;
                    padding: var(--spacing-xl);
                    border-radius: var(--radius-lg);
                    max-width: 500px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                
                .modal-content h2 {
                    margin-bottom: var(--spacing-lg);
                }
                
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: var(--spacing-md);
                }
                
                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: var(--spacing-sm);
                    margin-top: var(--spacing-lg);
                }
                
                @media (max-width: 640px) {
                    .form-row {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default DiscountManagement;
