import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWishlist } from '../context/WishlistContext';
import './PerfumeCard.css';

export default function PerfumeCard({ perfume, index = 0 }) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(perfume.id);

  return (
    <motion.div
      className="perfume-card"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        className={`wishlist-btn ${wishlisted ? 'active' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(perfume.id);
        }}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      </button>
      <Link to={`/product/${perfume.id}`} className="card-link">
        <div className="card-image-wrap">
          <img src={perfume.image} alt={perfume.name} loading="lazy" />
          <div className="card-overlay">
            <span className="card-view">Discover</span>
          </div>
          {perfume.bestseller && <span className="card-badge">Best Seller</span>}
        </div>
        <div className="card-info">
          <h3 className="card-brand">{perfume.brand}</h3>
          <h2 className="card-name">{perfume.name}</h2>
          <div className="card-meta">
            <span className="card-category">{perfume.category}</span>
            <span className="card-price">${perfume.price}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
