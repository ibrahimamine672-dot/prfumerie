import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getAuthToken } from '../lib/auth';
import API_URL, { parseJSON } from '../config';
import './Checkout.css';

export default function Checkout() {
  const { items, updateQuantity, removeItem, clearCart, total, count } = useCart();
  const { user, token: authToken, updateUser } = useAuth();
  const freeItemAvailable = user?.freeItemAvailable || false;
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(null);
  const [discountError, setDiscountError] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [delivery, setDelivery] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    deliveryMethod: 'standard'
  });
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    if (user) {
      // Split location into address, city, postalCode if possible
      let address = '';
      let city = '';
      let postalCode = '';
      if (user.location) {
        const parts = user.location.split(',');
        if (parts.length > 0) address = parts[0].trim();
        if (parts.length > 1) {
          const rest = parts.slice(1).join(',').trim();
          const cityParts = rest.split(' ');
          if (cityParts.length > 0) city = cityParts[0].trim();
          if (cityParts.length > 1) postalCode = cityParts.slice(1).join(' ').trim();
        }
      }

      setDelivery(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
        address: prev.address || address || '',
        city: prev.city || city || '',
        postalCode: prev.postalCode || postalCode || ''
      }));
    }
  }, [user]);

  const deliveryPrice = total >= 500 ? 0 : delivery.deliveryMethod === 'express' ? 40 : 20;
  const discountAmount = discountApplied ? Math.round(total * (discountApplied.percent / 100) * 100) / 100 : 0;
  const grandTotal = Math.max(0, total + deliveryPrice - discountAmount);

  const handleApplyDiscount = async () => {
    const code = discountCode.trim().toUpperCase();
    if (!code) {
      setDiscountError('Please enter a discount code');
      return;
    }

    setDiscountLoading(true);
    setDiscountError('');

    // Only validate discount code for authenticated users
    if (!user) {
      setDiscountError('Please sign in to use a discount code');
      setDiscountLoading(false);
      return;
    }

    // Validate discount code against the backend
    try {
      const token = authToken || getAuthToken();
      const res = await fetch(`${API_URL}/auth/validate-discount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      const data = await parseJSON(res);

      if (!res.ok) {
        throw new Error(data.message || 'Failed to validate discount code');
      }

      if (data.valid) {
        setDiscountApplied({ code: data.code, percent: data.percent });
        setDiscountError('');
      } else {
        setDiscountError(data.message || 'Invalid discount code');
        setDiscountApplied(null);
      }
    } catch (err) {
      setDiscountError(err.message);
      setDiscountApplied(null);
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountApplied(null);
    setDiscountCode('');
    setDiscountError('');
  };

  const handleDeliveryChange = (e) => {
    setDelivery({ ...delivery, [e.target.name]: e.target.value });
    setOrderError('');
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    // Validate delivery info
    const requiredDeliveryFields = [
      delivery.fullName,
      delivery.email,
      delivery.phone,
      delivery.address,
      delivery.city,
      delivery.postalCode
    ];
    if (requiredDeliveryFields.some((value) => !value.trim())) {
      setOrderError('Please complete all delivery fields');
      return;
    }

    setPlacing(true);
    setOrderError('');

    const token = authToken || getAuthToken();

    const orderData = {
      name: delivery.fullName.trim(),
      email: delivery.email.trim(),
      phone: delivery.phone.trim(),
      location: `${delivery.address.trim()}, ${delivery.city.trim()} ${delivery.postalCode.trim()}`,
      delivery: {
        fullName: delivery.fullName.trim(),
        phone: delivery.phone.trim(),
        address: delivery.address.trim(),
        city: delivery.city.trim(),
        postalCode: delivery.postalCode.trim(),
        deliveryMethod: delivery.deliveryMethod
      },
      payment: {
        method: paymentMethod
      },
      items: items.map(item => ({
        perfumeId: item.id || item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size || '',
        image: item.image || ''
      })),
      subtotal: total,
      shipping: deliveryPrice,
      discountCode: discountApplied?.code || null,
      discountPercent: discountApplied?.percent || 0,
      discountAmount,
      total: grandTotal
    };

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(orderData)
      });

      const data = await parseJSON(res);

      if (!res.ok) {
        throw new Error(data.message || 'Failed to place order');
      }

      clearCart();
      setOrderDetails(data);
      setOrderPlaced(true);
      // Update user's loyalty status if free item was applied
      if (data.freeItemApplied && updateUser) {
        updateUser({ freeItemAvailable: false });
      }
    } catch (err) {
      setOrderError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="order-success">
            <motion.div
              className="order-success-icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Order Confirmed
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Thank you for your purchase, {orderDetails?.name}!<br />
              Your order has been saved and will be shipped to <strong>{orderDetails?.location}</strong>.<br />
              Payment status: <strong>{orderDetails?.payment?.status || 'pending'}</strong>.<br />
              {orderDetails?.emailSent === true ? (
                <span style={{ color: '#16a34a', fontWeight: 500 }}>✓ Confirmation email sent to <strong>{orderDetails?.email}</strong></span>
              ) : (
                <span style={{ color: '#92400e' }}>⚠ Confirmation email could not be sent. We will contact you manually.</span>
              )}{orderDetails?.freeItemApplied && (
                <>
                  <br /><br />
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    background: 'rgba(22, 163, 74, 0.12)',
                    color: '#16a34a',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}>
                    🎁 <strong>{orderDetails?.freeItemName}</strong> was FREE — your loyalty reward!
                  </span>
                </>
              )}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Link to="/products" className="btn-primary">
                Continue Shopping
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="checkout-empty">
            <h2>Your cart is empty</h2>
            <p>Add some fragrances to your selection before checking out.</p>
            <Link to="/products" className="btn-primary">
              Browse Fragrances
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-header">
          <h1>Checkout</h1>
          <p>{count} {count === 1 ? 'item' : 'items'} in your selection</p>
        </div>

        <div className="checkout-layout">
          {/* Delivery Information */}
          <div className="checkout-delivery">
            <h2 className="checkout-items-title">Delivery Information</h2>
            <div className="delivery-form">
              <div className="form-row">
                <div className="checkout-form-group">
                  <label htmlFor="delivery-name">Full Name *</label>
                  <input
                    id="delivery-name"
                    name="fullName"
                    type="text"
                    placeholder="e.g. Jean Dupont"
                    value={delivery.fullName}
                    onChange={handleDeliveryChange}
                    autoFocus
                  />
                </div>
                <div className="checkout-form-group">
                  <label htmlFor="delivery-email">Email Address *</label>
                  <input
                    id="delivery-email"
                    name="email"
                    type="email"
                    placeholder="e.g. jean@example.com"
                    value={delivery.email}
                    onChange={handleDeliveryChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="checkout-form-group">
                  <label htmlFor="delivery-phone">Phone Number *</label>
                  <input
                    id="delivery-phone"
                    name="phone"
                    type="tel"
                    placeholder="e.g. +212 6XX XXX XXX"
                    value={delivery.phone}
                    onChange={handleDeliveryChange}
                  />
                </div>
                <div className="checkout-form-group">
                  <label htmlFor="delivery-address">Address *</label>
                  <input
                    id="delivery-address"
                    name="address"
                    type="text"
                    placeholder="e.g. 12 Rue des Fleurs"
                    value={delivery.address}
                    onChange={handleDeliveryChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="checkout-form-group">
                  <label htmlFor="delivery-city">City *</label>
                  <input
                    id="delivery-city"
                    name="city"
                    type="text"
                    placeholder="e.g. Casablanca"
                    value={delivery.city}
                    onChange={handleDeliveryChange}
                  />
                </div>
                <div className="checkout-form-group">
                  <label htmlFor="delivery-postal-code">Postal Code *</label>
                  <input
                    id="delivery-postal-code"
                    name="postalCode"
                    type="text"
                    placeholder="e.g. 20000"
                    value={delivery.postalCode}
                    onChange={handleDeliveryChange}
                  />
                </div>
              </div>
            </div>

            <div className="checkout-choice-section">
              <h2 className="checkout-items-title">Delivery Method</h2>
              <div className="choice-grid">
                <label className={`choice-option ${delivery.deliveryMethod === 'standard' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="standard"
                    checked={delivery.deliveryMethod === 'standard'}
                    onChange={handleDeliveryChange}
                  />
                  <span>
                    <strong>Standard delivery</strong>
                    <small>20 MAD · approximately 3–5 days</small>
                  </span>
                </label>
                <label className={`choice-option ${delivery.deliveryMethod === 'express' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="express"
                    checked={delivery.deliveryMethod === 'express'}
                    onChange={handleDeliveryChange}
                  />
                  <span>
                    <strong>Express delivery</strong>
                    <small>40 MAD · approximately 1–2 days</small>
                  </span>
                </label>
              </div>
              {total >= 500 && <p className="free-delivery-note">Delivery is free for this order.</p>}
            </div>

            <div className="checkout-choice-section">
              <h2 className="checkout-items-title">Payment Method</h2>
              <div className="choice-grid payment-choice-grid">
                {[
                  ['cash_on_delivery', 'Cash on delivery', 'Pay when your order arrives'],
                  ['card_fake', 'Demo card payment', 'Instant simulated payment'],
                  ['paypal_fake', 'Demo PayPal', 'Instant simulated payment']
                ].map(([value, label, description]) => (
                  <label key={value} className={`choice-option ${paymentMethod === value ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={value}
                      checked={paymentMethod === value}
                      onChange={(event) => {
                        setPaymentMethod(event.target.value);
                        setOrderError('');
                      }}
                    />
                    <span>
                      <strong>{label}</strong>
                      <small>{description}</small>
                    </span>
                  </label>
                ))}
              </div>
              {paymentMethod !== 'cash_on_delivery' && (
                <p className="payment-demo-note">
                  Demo only. No real payment or card information is requested.
                </p>
              )}
            </div>

            <h2 className="checkout-items-title" style={{ marginTop: 32 }}>Order Summary</h2>

            <AnimatePresence mode="popLayout">
              {items.map(item => (
                <motion.div
                  key={item.id || item._id}
                  className="checkout-item"
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <img src={item.image} alt={item.name} className="checkout-item-image" />
                  <div className="checkout-item-info">
                    <span className="checkout-item-name">{item.name}</span>
                    <span className="checkout-item-meta">{item.size} &middot; {item.price} MAD</span>
                    <div className="checkout-item-actions">
                      <div className="checkout-qty-controls">
                        <button
                          className="checkout-qty-btn"
                          onClick={() => updateQuantity(item.id || item._id, item.quantity - 1)}
                        >−</button>
                        <span className="checkout-qty-value">{item.quantity}</span>
                        <button
                          className="checkout-qty-btn"
                          onClick={() => updateQuantity(item.id || item._id, item.quantity + 1)}
                        >+</button>
                      </div>
                      <button
                        className="checkout-remove-btn"
                        onClick={() => removeItem(item.id || item._id)}
                      >Remove</button>
                    </div>
                  </div>
                  <span className="checkout-item-total">{(item.price * item.quantity).toFixed(2)} MAD</span>
                </motion.div>
              ))}
            </AnimatePresence>
        </div>

        {/* Order Summary Sidebar */}
          <div className="checkout-summary">
            <h2 className="summary-title">Order Total</h2>

            <div className="summary-row">
              <span>Subtotal ({count} {count === 1 ? 'item' : 'items'})</span>
              <span>{total.toFixed(2)} MAD</span>
            </div>

            <div className="summary-row">
              <span>Delivery ({delivery.deliveryMethod})</span>
              <span>{deliveryPrice === 0 ? <span style={{ color: '#16a34a', fontWeight: 500 }}>Free</span> : `${deliveryPrice.toFixed(2)} MAD`}</span>
            </div>

            {discountApplied && (
              <div className="summary-row">
                <span style={{ color: '#16a34a' }}>Discount ({discountApplied.percent}%)</span>
                <span style={{ color: '#16a34a' }}>−{discountAmount.toFixed(2)} MAD</span>
              </div>
            )}

            <div className="summary-row-total">
              <span>Total</span>
              <span>{grandTotal.toFixed(2)} MAD</span>
            </div>

            {/* Discount Code */}
            <div className="discount-section">
              <h3>Have a discount code?</h3>
              {!discountApplied ? (
                <>
                  <div className="discount-input-group">
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={discountCode}
                      onChange={(e) => {
                        setDiscountCode(e.target.value.toUpperCase());
                        setDiscountError('');
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
                    />
                    <button
                      className="discount-apply-btn"
                      onClick={handleApplyDiscount}
                      disabled={discountLoading}
                    >
                      {discountLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {discountError && <p className="discount-error">{discountError}</p>}
                </>
              ) : (
                <div className="discount-applied">
                  <div className="discount-applied-info">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>{discountApplied.code} — {discountApplied.percent}% off</span>
                  </div>
                  <button className="discount-remove-btn" onClick={handleRemoveDiscount}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Free Item Banner */}
            {freeItemAvailable && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.12), rgba(34, 197, 94, 0.08))',
                border: '1px solid rgba(22, 163, 74, 0.3)',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <span style={{ fontSize: '1.2rem' }}>🎁</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.8rem', color: '#16a34a' }}>
                    Free Item Earned!
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Your cheapest item will be free on this order.
                  </p>
                </div>
              </div>
            )}

            {orderError && <p className="discount-error">{orderError}</p>}

            <button
              className="place-order-btn"
              onClick={handlePlaceOrder}
              disabled={placing || items.length === 0}
            >
              {placing ? (
                <span className="btn-loading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span className="spinner" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                  Processing...
                </span>
              ) : (
                `Place Order — ${grandTotal.toFixed(2)} MAD`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
