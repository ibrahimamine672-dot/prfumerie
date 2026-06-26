import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import Cart from './Cart';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, isOpen, setIsOpen } = useCart();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <>
      <motion.nav
        className={`navbar ${scrolled ? 'scrolled' : ''}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">
            <svg className="navbar-logo" width="28" height="28" viewBox="0 0 512 512">
              <rect width="512" height="512" fill="#ffffff" rx="4"/>
              <defs>
                <linearGradient id="navGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#d4bca0"/>
                  <stop offset="50%" stop-color="#c4a882"/>
                  <stop offset="100%" stop-color="#b49876"/>
                </linearGradient>
              </defs>
              <path d="M 48 230 L 256 40 L 464 230" stroke="url(#navGold)" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="48" y1="230" x2="48" y2="244" stroke="url(#navGold)" strokeWidth="14" strokeLinecap="round"/>
              <line x1="464" y1="230" x2="464" y2="244" stroke="url(#navGold)" strokeWidth="14" strokeLinecap="round"/>
              <line x1="48" y1="244" x2="72" y2="244" stroke="url(#navGold)" strokeWidth="14" strokeLinecap="round"/>
              <line x1="440" y1="244" x2="464" y2="244" stroke="url(#navGold)" strokeWidth="14" strokeLinecap="round"/>
              <line x1="72" y1="244" x2="72" y2="440" stroke="url(#navGold)" strokeWidth="14" strokeLinecap="round"/>
              <line x1="440" y1="244" x2="440" y2="440" stroke="url(#navGold)" strokeWidth="14" strokeLinecap="round"/>
              <line x1="72" y1="440" x2="440" y2="440" stroke="url(#navGold)" strokeWidth="14" strokeLinecap="round"/>
              <path d="M 218 440 L 218 346 Q 256 306 294 346 L 294 440" stroke="url(#navGold)" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="navbar-brand-text">
              <span className="brand-name">MAISON DORÉE</span>
              <span className="brand-sub">PARIS</span>
            </span>
          </Link>

          <div className="navbar-links desktop-only">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              Home
            </Link>
            <Link to="/products" className={location.pathname === '/products' && !location.search ? 'active' : ''}>
              Collections
            </Link>
            <Link to="/products?gender=Unisex" className={location.search.includes('gender=Unisex') ? 'active' : ''}>
              Unisex
            </Link>
            <Link to="/products?gender=Men" className={location.search.includes('gender=Men') ? 'active' : ''}>
              Men
            </Link>
            <Link to="/products?gender=Women" className={location.search.includes('gender=Women') ? 'active' : ''}>
              Women
            </Link>
            <Link to="/signin" className={location.pathname === '/signin' ? 'active' : ''}>
              Sign In
            </Link>
            <Link to="/signup" className={`signup-link ${location.pathname === '/signup' ? 'active' : ''}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              S'inscrire −15%
            </Link>
            <Link to="/admin/orders" className={location.pathname === '/admin/orders' ? 'active' : ''}>
              Admin
            </Link>
          </div>

          <div className="navbar-actions">
            <button
              className="cart-button"
              onClick={() => setIsOpen(true)}
              aria-label="Open cart"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    className="cart-count"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              className={`hamburger mobile-only ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Link to="/">Home</Link>
            <Link to="/products">Collections</Link>
            <Link to="/products?gender=Unisex">Unisex</Link>
            <Link to="/products?gender=Men">Men</Link>
            <Link to="/products?gender=Women">Women</Link>
            <Link to="/signin">Sign In</Link>
            <Link to="/signup" className="signup-link">S'inscrire −15%</Link>
            <Link to="/admin/orders">Admin</Link>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && <Cart />}
      </AnimatePresence>
    </>
  );
}
