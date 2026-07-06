import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const WishlistContext = createContext();

const WISHLIST_KEY = 'parfum_wishlist';

function loadWishlist() {
  try {
    const saved = localStorage.getItem(WISHLIST_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(loadWishlist);

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  const isWishlisted = useCallback((id) => {
    return wishlist.includes(id);
  }, [wishlist]);

  const toggleWishlist = useCallback((id) => {
    setWishlist(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider value={{ wishlist, isWishlisted, toggleWishlist, wishlistCount }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
