import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API_URL, { parseJSON } from '../config';
import './AdminOrders.css';

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
const DELIVERY_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const paymentLabels = {
  cash_on_delivery: 'Cash on delivery',
  card_fake: 'Demo card',
  paypal_fake: 'Demo PayPal',
};

const deliveryLabels = {
  standard: 'Standard',
  express: 'Express',
};

const money = (value) => `${Number(value || 0).toFixed(2)} MAD`;

const getOrderView = (order) => ({
  customerName: order.delivery?.fullName || order.name,
  phone: order.delivery?.phone || order.phone || '—',
  address: order.delivery?.address || order.location || '—',
  city: order.delivery?.city || '—',
  productsPrice: order.productsPrice ?? order.subtotal ?? 0,
  deliveryPrice: order.deliveryPrice ?? order.shipping ?? 0,
  totalPrice: order.totalPrice ?? order.total ?? 0,
  paymentMethod: order.payment?.method || 'cash_on_delivery',
  paymentStatus: order.payment?.status || 'pending',
  deliveryMethod: order.delivery?.deliveryMethod || 'standard',
  deliveryStatus: order.delivery?.status || order.status || 'pending',
  trackingNumber: order.delivery?.trackingNumber || '',
  estimatedDeliveryDate: order.delivery?.estimatedDeliveryDate || '',
});

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [fulfillmentForm, setFulfillmentForm] = useState(null);
  const [updating, setUpdating] = useState(false);

  const { user, isAdmin } = useAuth();
  const token = localStorage.getItem('token');

  const downloadOrdersExcel = async () => {
    try {
      const adminToken = localStorage.getItem('token');

      if (!adminToken) {
        alert('Admin token not found. Please login again.');
        return;
      }

      const response = await fetch(`${API_URL}/admin/orders/export`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (!response.ok) {
        const errorData = await parseJSON(response).catch(() => null);
        alert(errorData?.message || 'Failed to download Excel file');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'commandes.xlsx';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error('Excel download error:', downloadError);
      alert('Error downloading Excel file');
    }
  };

  const fetchOrders = useCallback(async () => {
    setError('');
    try {
      const response = await fetch(`${API_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await parseJSON(response);
      if (!response.ok) throw new Error(data.message || 'Failed to fetch orders');
      setOrders(data.orders || data);
    } catch (fetchError) {
      setError(fetchError.message);
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

  const openOrder = (order) => {
    const view = getOrderView(order);
    setSelectedOrder(order);
    setFulfillmentForm({
      paymentStatus: view.paymentStatus,
      deliveryStatus: view.deliveryStatus,
      trackingNumber: view.trackingNumber,
      estimatedDeliveryDate: view.estimatedDeliveryDate
        ? new Date(view.estimatedDeliveryDate).toISOString().slice(0, 10)
        : '',
    });
    setError('');
  };

  const handleFulfillmentChange = (event) => {
    setFulfillmentForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const saveFulfillment = async () => {
    if (!selectedOrder || !fulfillmentForm) return;
    setUpdating(true);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/admin/orders/${selectedOrder._id}/fulfillment`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...fulfillmentForm,
            trackingNumber: fulfillmentForm.trackingNumber || null,
            estimatedDeliveryDate: fulfillmentForm.estimatedDeliveryDate || null,
          }),
        }
      );
      const data = await parseJSON(response);
      if (!response.ok) throw new Error(data.message || 'Failed to update order');

      setOrders((current) => current.map((order) => order._id === data._id ? data : order));
      openOrder(data);
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdating(false);
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter((order) => getOrderView(order).deliveryStatus === 'pending').length,
    shipped: orders.filter((order) => getOrderView(order).deliveryStatus === 'shipped').length,
    delivered: orders.filter((order) => getOrderView(order).deliveryStatus === 'delivered').length,
  };

  const formatDate = (dateValue) => new Date(dateValue).toLocaleDateString('fr-MA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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
      <div className="container admin-orders-container">
        <div className="admin-header">
          <h1>Orders Management</h1>
          <div className="admin-stats">
            <span className="stat-chip">Total <strong>{stats.total}</strong></span>
            <span className="stat-chip pending">Pending <strong>{stats.pending}</strong></span>
            <span className="stat-chip shipped">Shipped <strong>{stats.shipped}</strong></span>
            <span className="stat-chip delivered">Delivered <strong>{stats.delivered}</strong></span>
          </div>
          <button className="btn-primary admin-export-btn" onClick={downloadOrdersExcel}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Télécharger Excel
          </button>
        </div>

        {loading ? (
          <div className="admin-loading">Loading orders...</div>
        ) : error && !selectedOrder ? (
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
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Products</th>
                  <th>Amounts</th>
                  <th>Payment</th>
                  <th>Delivery</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const view = getOrderView(order);
                  return (
                    <tr key={order._id}>
                      <td>
                        <div className="cell-name">{view.customerName}</div>
                        <div className="cell-email">{order.email}</div>
                        <div className="cell-subtext">{view.phone}</div>
                      </td>
                      <td className="cell-products">
                        {order.items.map((item) => `${item.name} × ${item.quantity}`).join(', ')}
                      </td>
                      <td>
                        <div className="cell-price-line"><span>Products</span><strong>{money(view.productsPrice)}</strong></div>
                        <div className="cell-price-line"><span>Delivery</span><strong>{money(view.deliveryPrice)}</strong></div>
                        <div className="cell-price-line total"><span>Total</span><strong>{money(view.totalPrice)}</strong></div>
                      </td>
                      <td>
                        <div className="cell-name">{paymentLabels[view.paymentMethod]}</div>
                        <span className={`status-badge ${view.paymentStatus}`}>{view.paymentStatus}</span>
                      </td>
                      <td>
                        <div className="cell-name">{deliveryLabels[view.deliveryMethod]}</div>
                        <span className={`status-badge ${view.deliveryStatus}`}>{view.deliveryStatus}</span>
                        <div className="cell-subtext">{view.address}, {view.city}</div>
                      </td>
                      <td className="cell-date">{formatDate(order.createdAt)}</td>
                      <td>
                        <button className="status-btn" onClick={() => openOrder(order)}>View / Edit</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <AnimatePresence>
          {selectedOrder && fulfillmentForm && (
            <motion.div
              className="order-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
            >
              <motion.div
                className="order-modal"
                initial={{ opacity: 0, scale: 0.97, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 16 }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="order-modal-header">
                  <div>
                    <h3>Order #{selectedOrder._id.slice(-8)}</h3>
                    <p>{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  <button className="modal-close" onClick={() => setSelectedOrder(null)} aria-label="Close">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="order-modal-body">
                  {error && <p className="admin-modal-error">{error}</p>}
                  <OrderDetails order={selectedOrder} formatDate={formatDate} />

                  <div className="modal-section fulfillment-editor">
                    <h4>Fulfillment management</h4>
                    <div className="admin-form-grid">
                      <label>
                        <span>Payment status</span>
                        <select name="paymentStatus" value={fulfillmentForm.paymentStatus} onChange={handleFulfillmentChange}>
                          {PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      </label>
                      <label>
                        <span>Delivery status</span>
                        <select name="deliveryStatus" value={fulfillmentForm.deliveryStatus} onChange={handleFulfillmentChange}>
                          {DELIVERY_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      </label>
                      <label>
                        <span>Tracking number</span>
                        <input
                          name="trackingNumber"
                          value={fulfillmentForm.trackingNumber}
                          onChange={handleFulfillmentChange}
                          placeholder="Optional"
                        />
                      </label>
                      <label>
                        <span>Estimated delivery</span>
                        <input
                          name="estimatedDeliveryDate"
                          type="date"
                          value={fulfillmentForm.estimatedDeliveryDate}
                          onChange={handleFulfillmentChange}
                        />
                      </label>
                    </div>
                    <button className="btn-primary fulfillment-save" onClick={saveFulfillment} disabled={updating}>
                      {updating ? 'Saving...' : 'Save fulfillment'}
                    </button>
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

function OrderDetails({ order, formatDate }) {
  const view = getOrderView(order);

  return (
    <>
      <div className="modal-section">
        <h4>Customer and delivery</h4>
        <div className="modal-info-row"><span>Name</span><span>{view.customerName}</span></div>
        <div className="modal-info-row"><span>Email</span><span>{order.email}</span></div>
        <div className="modal-info-row"><span>Phone</span><span>{view.phone}</span></div>
        <div className="modal-info-row"><span>Address</span><span>{view.address}</span></div>
        <div className="modal-info-row"><span>City</span><span>{view.city}</span></div>
        <div className="modal-info-row"><span>Delivery method</span><span>{deliveryLabels[view.deliveryMethod]}</span></div>
        {view.trackingNumber && <div className="modal-info-row"><span>Tracking</span><span>{view.trackingNumber}</span></div>}
        {view.estimatedDeliveryDate && (
          <div className="modal-info-row">
            <span>Estimated delivery</span>
            <span>{formatDate(view.estimatedDeliveryDate)}</span>
          </div>
        )}
      </div>

      <div className="modal-section">
        <h4>Products ({order.items.length})</h4>
        {order.items.map((item, index) => (
          <div key={`${item.name}-${index}`} className="modal-item">
            <div>
              <div className="modal-item-name">{item.name}</div>
              <div className="modal-item-qty">Qty: {item.quantity} × {money(item.price)}</div>
            </div>
            <span className="modal-item-total">{money(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="modal-section">
        <h4>Payment summary</h4>
        <div className="modal-info-row"><span>Products</span><span>{money(view.productsPrice)}</span></div>
        <div className="modal-info-row"><span>Delivery</span><span>{money(view.deliveryPrice)}</span></div>
        <div className="modal-info-row"><span>Payment method</span><span>{paymentLabels[view.paymentMethod]}</span></div>
        <div className="modal-info-row"><span>Payment status</span><span>{view.paymentStatus}</span></div>
        <div className="modal-total-row"><span>Total</span><span>{money(view.totalPrice)}</span></div>
      </div>
    </>
  );
}
