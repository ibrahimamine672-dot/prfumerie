import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CartContext = createContext();

const CART_KEY = 'parfum_cart';

function loadCart() {
  try {
    const saved = localStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((perfume, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === perfume.id || item._id === perfume._id);
      if (existing) {
        return prev.map(item =>
          (item.id === perfume.id || item._id === perfume._id)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...perfume, quantity }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(item => item.id !== id && item._id !== id));
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    if (quantity < 1) {
      removeItem(id);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.id === id || item._id === id ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      total, count, isOpen, setIsOpen
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
