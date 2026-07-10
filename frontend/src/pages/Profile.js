import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getAuthToken } from '../lib/auth';
import API_URL, { parseJSON } from '../config';

export default function Profile() {
  const { user, token: authToken, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loyalty, setLoyalty] = useState({ completedOrders: 0, freeItemAvailable: false });
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
          if (data.completedOrders !== undefined) {
            setLoyalty({
              completedOrders: data.completedOrders,
              freeItemAvailable: data.freeItemAvailable
            });
            updateUser({
              completedOrders: data.completedOrders,
              freeItemAvailable: data.freeItemAvailable
            });
          }
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user, navigate, updateUser]);

  if (!user) return null;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const ordersTillFree = 10 - (loyalty.completedOrders % 10);
  const progressInCycle = loyalty.completedOrders % 10;
  const progressPercent = (progressInCycle / 10) * 100;

  return (
    <div className="profile-page" style={{ padding: '40px 0' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 600 }}>My Account</h1>
              <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>{user.email}</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link to="/products" className="btn-secondary" style={{ padding: '10px 24px', fontSize: '0.65rem' }}>
                Browse Fragrances
              </Link>
              <button
                className="btn-primary"
                style={{ padding: '10px 24px', fontSize: '0.65rem', background: 'transparent', color: 'var(--color-error)', border: '1px solid var(--color-error)' }}
                onClick={() => { logout(); navigate('/'); }}
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Loyalty Program Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(212, 188, 160, 0.12) 0%, rgba(180, 152, 118, 0.08) 100%)',
            border: '1px solid rgba(212, 188, 160, 0.3)',
            borderRadius: 12,
            padding: 32,
            marginBottom: 32,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(212,188,160,0.08) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600 }}>
                  <span style={{ marginRight: 8 }}>👑</span>
                  Maison Dorée Loyalty
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
                  Complete 10 orders and get your cheapest item free — every time.
                </p>
              </div>
              {loyalty.freeItemAvailable && (
                <div style={{
                  background: 'rgba(22, 163, 74, 0.12)',
                  color: '#16a34a',
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Free Item Ready!
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 8 }}>
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {loyalty.freeItemAvailable
                    ? '🎉 Free item earned! Head to checkout to claim it.'
                    : `${ordersTillFree} more ${ordersTillFree === 1 ? 'order' : 'orders'} until a free item`
                  }
                </span>
                <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>
                  {progressInCycle} / 10
                </span>
              </div>
              <div style={{
                height: 6,
                background: 'rgba(212, 188, 160, 0.15)',
                borderRadius: 3,
                overflow: 'hidden'
              }}>
                <motion.div
                  style={{
                    height: '100%',
                    borderRadius: 3,
                    background: loyalty.freeItemAvailable
                      ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                      : 'linear-gradient(90deg, var(--color-accent), #d4bca0)'
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${loyalty.freeItemAvailable ? 100 : progressPercent}%` }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
            {loyalty.freeItemAvailable && (
              <Link
                to="/checkout"
                style={{
                  display: 'inline-block',
                  marginTop: 16,
                  padding: '10px 24px',
                  background: '#16a34a',
                  color: '#fff',
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={e => e.target.style.background = '#15803d'}
                onMouseLeave={e => e.target.style.background = '#16a34a'}
              >
                Claim Your Free Item →
              </Link>
            )}
          </div>

          <div style={{
            background: 'var(--color-glass)',
            border: '1px solid var(--color-glass-border)',
            borderRadius: 8,
            padding: 32,
            marginBottom: 32
          }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: 20 }}>Profile Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Name</span>
                <p style={{ marginTop: 4, fontWeight: 500 }}>{user.name}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</span>
                <p style={{ marginTop: 4, fontWeight: 500 }}>{user.email}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Role</span>
                <p style={{ marginTop: 4, fontWeight: 500, textTransform: 'capitalize' }}>{user.role}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: 20 }}>Order History</h2>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading orders...</div>
            ) : orders.length === 0 ? (
              <div style={{
                background: 'var(--color-glass)',
                border: '1px solid var(--color-glass-border)',
                borderRadius: 8,
                padding: 40,
                textAlign: 'center'
              }}>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>No orders yet. Start shopping to earn your first loyalty reward!</p>
                <Link to="/products" className="btn-primary">Start Shopping</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {orders.map(order => (
                  <div key={order._id} style={{
                    background: 'var(--color-glass)',
                    border: '1px solid var(--color-glass-border)',
                    borderRadius: 8,
                    padding: '16px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12
                  }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        Order #{order._id.slice(-8)}
                        {order.freeItemApplied && (
                          <span style={{
                            marginLeft: 8,
                            fontSize: '0.7rem',
                            background: 'rgba(22, 163, 74, 0.12)',
                            color: '#16a34a',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontWeight: 600
                          }}>Free Item 🎁</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formatDate(order.createdAt)} &middot; {order.items?.length || 0} items</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontWeight: 600 }}>{order.total?.toFixed(2)} MAD</span>
                      <span className={`status-badge ${order.status}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
