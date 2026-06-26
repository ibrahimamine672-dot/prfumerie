import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { perfumes } from '../data/perfumes';
import { useCart } from '../context/CartContext';
import PerfumeCard from '../components/PerfumeCard';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState('top');

  const perfume = perfumes.find(p => p.id === parseInt(id));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!perfume) {
    return (
      <div className="not-found">
        <h2>Fragrance not found</h2>
        <Link to="/products" className="btn-primary">Back to Collection</Link>
      </div>
    );
  }

  const relatedPerfumes = perfumes
    .filter(p => p.id !== perfume.id && p.gender === perfume.gender)
    .slice(0, 4);

  const handleAddToCart = () => {
    addItem(perfume, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="product-detail-page">
      <div className="container">
        <motion.div
          className="breadcrumb"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/">Home</Link>
          <span className="breadcrumb-sep">/</span>
          <Link to="/products">Collections</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{perfume.name}</span>
        </motion.div>

        <div className="product-detail-grid">
          <motion.div
            className="product-gallery"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="gallery-main">
              <img src={perfume.image} alt={perfume.name} />
            </div>
          </motion.div>

          <motion.div
            className="product-info"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="product-brand">{perfume.brand}</span>
            <h1 className="product-name">{perfume.name}</h1>

            <div className="product-meta">
              <span className="product-price">${perfume.price}</span>
              <span className="product-size">{perfume.size}</span>
            </div>

            <p className="product-category">
              {perfume.category} &middot; {perfume.gender}
            </p>

            <p className="product-description">{perfume.description}</p>

            <div className="product-notes">
              <h3>Fragrance Notes</h3>
              <div className="notes-tabs">
                {['top', 'middle', 'base'].map(tab => (
                  <button
                    key={tab}
                    className={`notes-tab ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'top' ? 'Top Notes' : tab === 'middle' ? 'Heart Notes' : 'Base Notes'}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  className="notes-list"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {perfume.notes[activeTab].map(note => (
                    <span key={note} className="note-tag">{note}</span>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="product-actions">
              <div className="quantity-selector">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>

              <motion.button
                className={`add-to-cart-btn ${added ? 'added' : ''}`}
                onClick={handleAddToCart}
                whileTap={{ scale: 0.97 }}
              >
                <AnimatePresence mode="wait">
                  {added ? (
                    <motion.span
                      key="added"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      Added to Selection
                    </motion.span>
                  ) : (
                    <motion.span
                      key="add"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      Add to Selection — ${perfume.price * quantity}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>

            <div className="product-guarantees">
              <div className="guarantee">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Authentic Guarantee</span>
              </div>
              <div className="guarantee">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="3" width="15" height="13" rx="2" />
                  <path d="M16 8h4l3 3v5a2 2 0 01-2 2h-1" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <span>Complimentary Shipping</span>
              </div>
              <div className="guarantee">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <span>Gift Wrapping Available</span>
              </div>
            </div>
          </motion.div>
        </div>

        {relatedPerfumes.length > 0 && (
          <section className="related-section">
            <h2 className="section-title">You May Also Love</h2>
            <div className="related-grid">
              {relatedPerfumes.map((p, i) => (
                <PerfumeCard key={p.id} perfume={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
