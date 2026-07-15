import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getAuthToken } from '../lib/auth';
import API_URL, { parseJSON } from '../config';
import './Orders.css';

export default function Orders() {
  const { user, token: authToken } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    const fetchOrders = async () => {
      try {
        const token = authToken || getAuthToken();
        const res = await fetch(`${API_URL}/orders/mine`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await parseJSON(res);
          setOrders(data.orders || data);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user, authToken, navigate]);

  if (!user) return null;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="orders-page" style={{ padding: '40px 0' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 40,
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 600 }}>
                My Orders
              </h1>
              <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
                Track and review your fragrance orders
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link
                to="/profile"
                className="btn-secondary"
                style={{ padding: '10px 24px', fontSize: '0.65rem', textDecoration: 'none' }}
              >
                My Account
              </Link>
              <Link
                to="/products"
                className="btn-primary"
                style={{ padding: '10px 24px', fontSize: '0.65rem', textDecoration: 'none' }}
              >
                Browse Fragrances
              </Link>
            </div>
          </div>

          {/* Orders List */}
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Loading orders...
              </motion.div>
            </div>
          ) : orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{
                background: 'var(--color-glass)',
                border: '1px solid var(--color-glass-border)',
                borderRadius: 12,
                padding: 60,
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.6 }}>🛍️</div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>
                No orders yet
              </h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
                You haven't placed any orders yet. Explore our collection and discover your signature scent.
              </p>
              <Link to="/products" className="btn-primary" style={{ textDecoration: 'none' }}>
                Start Shopping
              </Link>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Summary bar */}
              <div style={{
                display: 'flex',
                gap: 24,
                marginBottom: 8,
                fontSize: '0.85rem',
                color: 'var(--color-text-muted)'
              }}>
                <span><strong style={{ color: 'var(--color-text)' }}>{orders.length}</strong> total order{orders.length !== 1 ? 's' : ''}</span>
                <span>
                  <strong style={{ color: 'var(--color-text)' }}>
                    {orders.filter(o => o.status === 'delivered').length}
                  </strong> delivered
                </span>
                <span>
                  <strong style={{ color: 'var(--color-text)' }}>
                    {orders.filter(o => ['processing', 'shipped'].includes(o.status)).length}
                  </strong> in transit
                </span>
              </div>

              {orders.map((order, index) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <div style={{
                    background: 'var(--color-glass)',
                    border: '1px solid var(--color-glass-border)',
                    borderRadius: 10,
                    padding: '20px 24px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--color-accent)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--color-glass-border)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: 12
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                            Order #<span style={{ fontFamily: 'monospace' }}>{order._id.slice(-8).toUpperCase()}</span>
                          </span>
                          <span className={`orders-status-badge ${order.status}`}>
                            <span className="orders-status-dot" />
                            {order.status}
                          </span>
                          {order.freeItemApplied && (
                            <span style={{
                              fontSize: '0.7rem',
                              background: 'rgba(22, 163, 74, 0.12)',
                              color: '#16a34a',
                              padding: '2px 10px',
                              borderRadius: 20,
                              fontWeight: 600
                            }}>
                              🎁 Free Item
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: '0.82rem',
                          color: 'var(--color-text-muted)',
                          marginTop: 6
                        }}>
                          <span>{formatDate(order.createdAt)}</span>
                          <span style={{ margin: '0 8px' }}>&middot;</span>
                          <span>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</span>
                          {order.items?.length > 0 && (
                            <>
                              <span style={{ margin: '0 8px' }}>&middot;</span>
                              <span>{order.items.map(item => item.name).join(', ')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16
                      }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Total</div>
                          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-accent)' }}>
                            {order.total?.toFixed(2)} MAD
                          </div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </div>

                    {/* Payment info */}
                    {order.payment && (
                      <div style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: '1px solid var(--color-glass-border)',
                        display: 'flex',
                        gap: 24,
                        fontSize: '0.78rem',
                        color: 'var(--color-text-muted)'
                      }}>
                        <span>
                          Payment: <strong style={{ color: 'var(--color-text)', fontWeight: 500, textTransform: 'capitalize' }}>
                            {order.payment.method || order.payment.status || 'N/A'}
                          </strong>
                        </span>
                        {order.location && (
                          <span>
                            Shipping: <strong style={{ color: 'var(--color-text)', fontWeight: 500 }}>{order.location}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
