import { useState, useEffect } from 'react';
import { billService } from '../../services/api';
import { FiCalendar, FiRotateCcw, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Admin.css';

const BillHistory = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBill, setExpandedBill] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await billService.getAll(params);
      setBills(response.data);
    } catch (error) {
      console.error('Failed to fetch bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setLoading(true);
    fetchBills();
  };

  const handleReturn = async (billId, itemIndex, item) => {
    const reason = prompt(`Return reason for "${item.name}":`);
    if (!reason) return;

    const qty = prompt(`Quantity to return (max: ${item.quantity - (item.returnedQuantity || 0)}):`,
      item.quantity - (item.returnedQuantity || 0));
    if (!qty) return;

    try {
      await billService.processReturn(billId, itemIndex, parseInt(qty), reason);
      toast.success('Item returned successfully! Stock updated.');
      fetchBills();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process return');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalRevenue = bills.reduce((sum, bill) => sum + bill.total, 0);

  return (
    <div className="admin-page page">
      <div className="container">
        <div className="admin-header">
          <div>
            <h1 className="page-title">Bill History</h1>
            <p className="page-subtitle">View all customer transactions & process returns</p>
          </div>
          <div className="header-stats">
            <div className="stat-mini">
              <span className="stat-mini-value">{bills.length}</span>
              <span className="stat-mini-label">Total Bills</span>
            </div>
            <div className="stat-mini">
              <span className="stat-mini-value">₹{totalRevenue.toLocaleString()}</span>
              <span className="stat-mini-label">Total Revenue</span>
            </div>
          </div>
        </div>

        <div className="filters-bar card mb-lg">
          <div className="filter-group">
            <FiCalendar />
            <label>From:</label>
            <input
              type="date"
              className="form-input"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div className="filter-group">
            <label>To:</label>
            <input
              type="date"
              className="form-input"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <button className="btn btn-primary" onClick={handleFilter}>
            Apply Filter
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : bills.length === 0 ? (
          <div className="empty-state">
            <h3>No bills found</h3>
            <p>No transactions match your filter criteria</p>
          </div>
        ) : (
          <div className="bills-admin-list">
            {bills.map((bill) => (
              <div key={bill._id} className="bill-admin-card card">
                <div
                  className="bill-admin-header"
                  onClick={() => setExpandedBill(expandedBill === bill._id ? null : bill._id)}
                >
                  <div className="bill-admin-info">
                    <code className="bill-id">{bill.billId}</code>
                    <span className="customer-name">{bill.user?.name || 'Customer'}</span>
                    <span className="bill-date">{formatDate(bill.createdAt)}</span>
                  </div>
                  <div className="bill-admin-meta">
                    <span className={`badge badge-${bill.paymentStatus === 'completed' ? 'success' : 'warning'}`}>
                      {bill.paymentMethod?.toUpperCase()}
                    </span>
                    <strong className="bill-total">₹{bill.total.toFixed(2)}</strong>
                    {expandedBill === bill._id ? <FiChevronUp /> : <FiChevronDown />}
                  </div>
                </div>

                {expandedBill === bill._id && (
                  <div className="bill-admin-items">
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bill.items.map((item, idx) => {
                          const isFullyReturned = item.returnedQuantity >= item.quantity;
                          const isPartiallyReturned = item.returnedQuantity > 0 && !isFullyReturned;

                          return (
                            <tr key={idx} className={isFullyReturned ? 'returned-row' : ''}>
                              <td>{item.name}</td>
                              <td>{item.quantity}</td>
                              <td>₹{item.price?.toFixed(2)}</td>
                              <td>
                                {isFullyReturned ? (
                                  <span className="badge badge-error">Returned</span>
                                ) : isPartiallyReturned ? (
                                  <span className="badge badge-warning">
                                    {item.returnedQuantity} Returned
                                  </span>
                                ) : (
                                  <span className="badge badge-success">Active</span>
                                )}
                              </td>
                              <td>
                                {!isFullyReturned && (
                                  <button
                                    className="btn btn-sm btn-outline return-btn"
                                    onClick={() => handleReturn(bill._id, idx, item)}
                                  >
                                    <FiRotateCcw /> Return
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Bill Summary with Tax */}
                    <div className="bill-summary">
                      <div className="summary-row">
                        <span>Subtotal:</span>
                        <span>₹{bill.subtotal?.toFixed(2) || '0.00'}</span>
                      </div>
                      {bill.discount > 0 && (
                        <div className="summary-row discount">
                          <span>Discount:</span>
                          <span>-₹{bill.discount?.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="summary-row">
                        <span>Tax ({bill.taxRate || 18}% GST):</span>
                        <span>₹{bill.tax?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="summary-row total">
                        <span>Total:</span>
                        <span>₹{bill.total?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
                .bills-admin-list {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-md);
                }
                
                .bill-admin-card {
                    padding: 0;
                    overflow: hidden;
                }
                
                .bill-admin-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: var(--spacing-lg);
                    cursor: pointer;
                    transition: background 0.2s;
                }
                
                .bill-admin-header:hover {
                    background: var(--background);
                }
                
                .bill-admin-info {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-lg);
                }
                
                .bill-admin-meta {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-lg);
                }
                
                .bill-total {
                    font-size: 1.125rem;
                    color: var(--secondary);
                }
                
                .bill-admin-items {
                    padding: var(--spacing-lg);
                    background: var(--background);
                    border-top: 1px solid var(--border);
                }
                
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                .items-table th, .items-table td {
                    padding: var(--spacing-sm) var(--spacing-md);
                    text-align: left;
                }
                
                .items-table th {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    color: var(--text-secondary);
                }
                
                .returned-row {
                    opacity: 0.6;
                    text-decoration: line-through;
                }
                
                .return-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.8125rem;
                }
                
                .bill-summary {
                    margin-top: var(--spacing-lg);
                    padding-top: var(--spacing-lg);
                    border-top: 1px dashed var(--border);
                    max-width: 300px;
                    margin-left: auto;
                }
                
                .bill-summary .summary-row {
                    display: flex;
                    justify-content: space-between;
                    padding: var(--spacing-xs) 0;
                    font-size: 0.875rem;
                }
                
                .bill-summary .summary-row.discount {
                    color: var(--secondary);
                }
                
                .bill-summary .summary-row.total {
                    font-weight: 700;
                    font-size: 1rem;
                    padding-top: var(--spacing-sm);
                    border-top: 1px solid var(--border);
                    margin-top: var(--spacing-xs);
                }
                
                .customer-name {
                    color: var(--text-secondary);
                }
                
                .bill-date {
                    font-size: 0.875rem;
                    color: var(--text-muted);
                }
                
                .filters-bar {
                    display: flex;
                    gap: var(--spacing-lg);
                    align-items: center;
                    flex-wrap: wrap;
                }
                
                .filter-group {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                }
                
                .filters-bar .form-input {
                    width: auto;
                }
                
                .header-stats {
                    display: flex;
                    gap: var(--spacing-lg);
                }
                
                .stat-mini {
                    text-align: right;
                }
                
                .stat-mini-value {
                    display: block;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--primary);
                }
                
                .stat-mini-label {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }
                
                .bill-id {
                    font-family: monospace;
                    font-size: 0.8125rem;
                    padding: 4px 8px;
                    background: white;
                    border-radius: var(--radius-sm);
                }
                
                @media (max-width: 768px) {
                    .bill-admin-info, .bill-admin-meta {
                        flex-wrap: wrap;
                        gap: var(--spacing-sm);
                    }
                    
                    .items-table {
                        font-size: 0.875rem;
                    }
                }
            `}</style>
    </div>
  );
};

export default BillHistory;
