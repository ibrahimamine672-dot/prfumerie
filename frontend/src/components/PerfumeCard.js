import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './PerfumeCard.css';

export default function PerfumeCard({ perfume, index = 0 }) {
  return (
    <motion.div
      className="perfume-card"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
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
