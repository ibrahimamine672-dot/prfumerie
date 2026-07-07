import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API_URL, { parseJSON } from '../config';
import './SignUp.css';

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'success'

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.name || !formData.email || !formData.phone || !formData.location || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await parseJSON(res);

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccess(data);
      setStep('success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <AnimatePresence mode="wait">
        {step === 'form' ? (
          <motion.div
            key="form"
            className="signup-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {/* Hero Offer Banner */}
            <div className="signup-offer-banner">
              <div className="offer-badge">
                <span className="offer-icon">−15%</span>
              </div>
              <div className="offer-text">
                <h2>Welcome to Maison Dorée</h2>
                <p>Join our inner circle and receive <strong>15% off</strong> your first fragrance order.</p>
              </div>
            </div>

            {/* Form Card */}
            <div className="signup-card">
              <div className="signup-header">
                <h1>Create Your Account</h1>
                <p className="signup-subtitle">
                  Become a member and unlock exclusive previews, private event invitations,
                  and personalized fragrance recommendations.
                </p>
              </div>

              <form className="signup-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="e.g. Jean Dupont"
                      value={formData.name}
                      onChange={handleChange}
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="e.g. jean@example.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="e.g. +212 6XX XXX XXX"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input
                      id="location"
                      name="location"
                      type="text"
                      placeholder="e.g. Casablanca, Morocco"
                      value={formData.location}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Min. 8 chars, uppercase, number & special char"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <span className="form-hint">At least 8 characters with one uppercase, one number, and one special character.</span>
                </div>

                {error && (
                  <motion.div
                    className="form-error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="btn-loading">
                      <span className="spinner" />
                      Creating Account...
                    </span>
                  ) : (
                    <span>Claim My 15% Discount</span>
                  )}
                </button>
              </form>

              <div className="signup-footer">
                <p>Already have an account? <Link to="/signin" className="link-accent">Sign in</Link></p>
                <p className="signup-privacy">
                  By creating an account, you agree to our{' '}
                  <button className="link-accent" onClick={() => {}}>Privacy Policy</button>
                  {' '}and{' '}
                  <button className="link-accent" onClick={() => {}}>Terms of Service</button>.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            className="signup-success"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="success-card">
              <motion.div
                className="success-icon"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Welcome to Maison Dorée
              </motion.h2>

              <motion.p
                className="success-greeting"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Thank you for joining, {success?.name}!
              </motion.p>

              <motion.div
                className="discount-code-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
              >
                <div className="discount-label">Your Exclusive Discount Code</div>
                <div className="discount-code">
                  <span className="code-text">{success?.discountCode}</span>
                  <span className="code-value">−{success?.discountPercent}%</span>
                </div>
                <p className="discount-info">
                  Use this code at checkout to receive 15% off your first fragrance order.
                  Valid for 30 days.
                </p>
              </motion.div>

              <motion.div
                className="success-details"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <div className="detail-row">
                  <span>Email</span>
                  <span>{success?.email}</span>
                </div>
                <div className="detail-row">
                  <span>Phone</span>
                  <span>{success?.phone}</span>
                </div>
                <div className="detail-row">
                  <span>Location</span>
                  <span>{success?.location}</span>
                </div>
              </motion.div>

              <motion.div
                className="success-actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <Link to="/products" className="btn-primary">
                  Start Shopping
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
