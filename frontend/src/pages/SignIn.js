import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';
import './SignIn.css';

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      login(data.token, { _id: data._id, name: data.name, email: data.email, role: data.role });

      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <motion.div
        className="signin-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="signin-card">
          <div className="signin-header">
            <h1>Welcome Back</h1>
            <p className="signin-subtitle">
              Sign in to your account to access your fragrance collection and exclusive offers.
            </p>
          </div>

          <form className="signin-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="e.g. jean@example.com"
                value={formData.email}
                onChange={handleChange}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {error && (
              <motion.div
                className="signin-error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              className="btn-signin"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner" />
                  Signing In...
                </span>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="signin-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="link-accent">Create one</Link>
            </p>
            <p className="signup-privacy">
              By signing in, you agree to our{' '}
              <button className="link-accent" onClick={() => {}}>Privacy Policy</button>
              {' '}and{' '}
              <button className="link-accent" onClick={() => {}}>Terms of Service</button>.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
