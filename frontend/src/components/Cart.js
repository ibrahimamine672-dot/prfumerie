import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Cart.css';

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, total, setIsOpen } = useCart();

  return (
    <>
      <motion.div
        className="cart-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsOpen(false)}
      />
      <motion.div
        className="cart-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="cart-header">
          <h2>Your Selection</h2>
          <button className="cart-close" onClick={() => setIsOpen(false)} aria-label="Close cart">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <p>Your collection awaits.</p>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map(item => (
                <motion.div
                  key={item.id || item._id}
                  className="cart-item"
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <img src={item.image} alt={item.name} className="cart-item-image" />
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <p className="cart-item-size">{item.size}</p>
                    <div className="cart-item-controls">
                      <div className="quantity-controls">
                        <button onClick={() => updateQuantity(item.id || item._id, item.quantity - 1)}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id || item._id, item.quantity + 1)}>+</button>
                      </div>
                      <button className="cart-item-remove" onClick={() => removeItem(item.id || item._id)}>
                        Remove
                      </button>
                    </div>
                    <p className="cart-item-price">{item.price * item.quantity} MAD</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-total">
                <span>Total</span>
                <span className="cart-total-amount">{total.toFixed(2)} MAD</span>
              </div>
              <button
                className="cart-checkout"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/checkout');
                }}
              >
                Proceed to Checkout
              </button>
              <p className="cart-shipping">Complimentary shipping on all orders</p>
            </div>
          </>
        )}
      </motion.div>
    </>
  );
}
