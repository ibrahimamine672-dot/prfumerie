import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';
import './AdminOrders.css';

const STATUS_FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(null);

  const { user, isAdmin } = useAuth();
  const token = localStorage.getItem('token');

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data.orders || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAdmin && token) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isAdmin, token, fetchOrders]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updatedOrder = await res.json();
      setOrders(prev => prev.map(o => o._id === orderId ? updatedOrder : o));
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(updatedOrder);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Not logged in
  if (!token || !user) {
    return (
      <div className="admin-orders-page">
        <div className="container">
          <div className="admin-login-prompt">
            <h2>Admin Access Required</h2>
            <p>Please sign in with an admin account to manage orders.</p>
            <Link to="/signin" className="btn-primary">Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="admin-orders-page">
        <div className="container">
          <div className="admin-login-prompt">
            <h2>Access Denied</h2>
            <p>You do not have admin privileges to view this page.</p>
            <Link to="/" className="btn-primary">Go Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-orders-page">
      <div className="container">
        <div className="admin-header">
          <h1>Orders Management</h1>
          <div className="admin-stats">
            <span className="stat-chip">Total <strong>{stats.total}</strong></span>
            <span className="stat-chip pending">Pending <strong>{stats.pending}</strong></span>
            <span className="stat-chip shipped">Shipped <strong>{stats.shipped}</strong></span>
            <span className="stat-chip delivered">Delivered <strong>{stats.delivered}</strong></span>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">Loading orders...</div>
        ) : error ? (
          <div className="admin-error">
            <p>{error}</p>
            <button className="btn-primary" onClick={fetchOrders}>Retry</button>
          </div>
        ) : orders.length === 0 ? (
          <div className="admin-login-prompt">
            <h2>No Orders Yet</h2>
            <p>When customers place orders, they will appear here.</p>
          </div>
        ) : (
          <>
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Location</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => {
                    const nextStatuses = STATUS_FLOW[order.status] || [];
                    return (
                      <tr key={order._id}>
                        <td>
                          <div className="cell-name">{order.name}</div>
                          <div className="cell-email">{order.email}</div>
                        </td>
                        <td className="cell-items">{order.items.length} item{order.items.length > 1 ? 's' : ''}</td>
                        <td className="cell-total">${order.total.toFixed(2)}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{order.location}</td>
                        <td className="cell-date">{formatDate(order.createdAt)}</td>
                        <td>
                          <span className={`status-badge ${order.status}`}>
                            {order.status === 'pending' && '⏳'}
                            {order.status === 'confirmed' && '✅'}
                            {order.status === 'shipped' && '📦'}
                            {order.status === 'delivered' && '✓'}
                            {order.status === 'cancelled' && '✕'}
                            {' '}{order.status}
                          </span>
                        </td>
                        <td>
                          <div className="status-actions">
                            {nextStatuses.map(status => (
                              <button
                                key={status}
                                className="status-btn"
                                onClick={() => handleUpdateStatus(order._id, status)}
                                disabled={updating === order._id}
                              >
                                {updating === order._id ? '...' : status}
                              </button>
                            ))}
                            <button
                              className="status-btn"
                              onClick={() => setSelectedOrder(order)}
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Order Detail Modal */}
        <AnimatePresence>
          {selectedOrder && (
            <motion.div
              className="order-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
            >
              <motion.div
                className="order-modal"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                onClick={e => e.stopPropagation()}
              >
                <div className="order-modal-header">
                  <h3>Order Details</h3>
                  <button className="modal-close" onClick={() => setSelectedOrder(null)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="order-modal-body">
                  <div className="modal-section">
                    <h4>Delivery Information</h4>
                    <div className="modal-info-row">
                      <span>Name</span>
                      <span>{selectedOrder.name}</span>
                    </div>
                    <div className="modal-info-row">
                      <span>Email</span>
                      <span>{selectedOrder.email}</span>
                    </div>
                    {selectedOrder.phone && (
                      <div className="modal-info-row">
                        <span>Phone</span>
                        <span>{selectedOrder.phone}</span>
                      </div>
                    )}
                    <div className="modal-info-row">
                      <span>Location</span>
                      <span>{selectedOrder.location}</span>
                    </div>
                    <div className="modal-info-row">
                      <span>Status</span>
                      <span className={`status-badge ${selectedOrder.status}`}>{selectedOrder.status}</span>
                    </div>
                    <div className="modal-info-row">
                      <span>Date</span>
                      <span>{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                  </div>

                  <div className="modal-section">
                    <h4>Items ({selectedOrder.items.length})</h4>
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="modal-item">
                        <div>
                          <div className="modal-item-name">{item.name}</div>
                          <div className="modal-item-qty">Qty: {item.quantity} × ${item.price.toFixed(2)}</div>
                        </div>
                        <span className="modal-item-total">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="modal-section">
                    <h4>Payment Summary</h4>
                    <div className="modal-info-row">
                      <span>Subtotal</span>
                      <span>${selectedOrder.subtotal?.toFixed(2)}</span>
                    </div>
                    <div className="modal-info-row">
                      <span>Shipping</span>
                      <span>{selectedOrder.shipping > 0 ? `$${selectedOrder.shipping.toFixed(2)}` : <span style={{ color: '#16a34a' }}>Free</span>}</span>
                    </div>
                    {selectedOrder.discountCode && (
                      <div className="modal-info-row">
                        <span>Discount ({selectedOrder.discountCode})</span>
                        <span style={{ color: '#16a34a' }}>−${selectedOrder.discountAmount?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="modal-total-row">
                      <span>Total</span>
                      <span>${selectedOrder.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
