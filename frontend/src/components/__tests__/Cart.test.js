import { render, screen, fireEvent } from '@testing-library/react';
import { CartProvider } from '../../context/CartContext';
import Cart from '../Cart';

// Use manual mock from __mocks__/react-router-dom.js
jest.mock('react-router-dom');

const mockNavigate = require('react-router-dom').useNavigate();

// Helper to render Cart inside CartProvider
function renderCart(cartItems = []) {
  // Inject items into localStorage before rendering so CartProvider loads them
  if (cartItems.length > 0) {
    localStorage.setItem('parfum_cart', JSON.stringify(cartItems));
  }

  return render(
    <CartProvider>
      <Cart />
    </CartProvider>
  );
}

const sampleItems = [
  {
    id: 1,
    name: 'Noir Absolu',
    price: 285,
    size: '100ml',
    image: '/images/perfumes/noir-absolu.jpg',
    quantity: 1,
  },
  {
    id: 2,
    name: 'Lumière Dorée',
    price: 320,
    size: '75ml',
    image: '/images/perfumes/lumiere-doree.jpg',
    quantity: 2,
  },
];

describe('Cart Component', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  // ─── Empty State ────────────────────────────────────────────
  describe('Empty cart', () => {
    test('shows empty state message when cart has no items', () => {
      renderCart([]);
      expect(screen.getByText('Your collection awaits.')).toBeInTheDocument();
    });

    test('does not display checkout button when cart is empty', () => {
      renderCart([]);
      expect(screen.queryByText('Proceed to Checkout')).not.toBeInTheDocument();
    });
  });

  // ─── Cart Items Display ─────────────────────────────────────
  describe('Cart items display', () => {
    test('renders all cart items', () => {
      renderCart(sampleItems);
      expect(screen.getByText('Noir Absolu')).toBeInTheDocument();
      expect(screen.getByText('Lumière Dorée')).toBeInTheDocument();
    });

    test('displays item size for each product', () => {
      renderCart(sampleItems);
      expect(screen.getAllByText('100ml').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('75ml').length).toBeGreaterThanOrEqual(1);
    });

    test('displays correct quantity for each item', () => {
      renderCart(sampleItems);
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    test('displays item price formatted in MAD', () => {
      renderCart(sampleItems);
      // Noir Absolu: 285 × 1 = 285 MAD
      expect(screen.getByText('285 MAD')).toBeInTheDocument();
      // Lumière Dorée: 320 × 2 = 640 MAD
      expect(screen.getByText('640 MAD')).toBeInTheDocument();
    });

    test('renders item images with correct alt text', () => {
      renderCart(sampleItems);
      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('alt', 'Noir Absolu');
      expect(images[1]).toHaveAttribute('alt', 'Lumière Dorée');
    });

    test('shows total amount correctly', () => {
      renderCart(sampleItems);
      // Total: 285*1 + 320*2 = 285 + 640 = 925
      expect(screen.getByText('925.00 MAD')).toBeInTheDocument();
    });

    test('shows total label', () => {
      renderCart(sampleItems);
      expect(screen.getByText('Total')).toBeInTheDocument();
    });
  });

  // ─── Quantity Controls ──────────────────────────────────────
  describe('Quantity controls', () => {
    test('has decrement buttons for each item', () => {
      renderCart(sampleItems);
      const decrementButtons = screen.getAllByText('−');
      expect(decrementButtons.length).toBe(sampleItems.length);
    });

    test('has increment buttons for each item', () => {
      renderCart(sampleItems);
      const incrementButtons = screen.getAllByText('+');
      expect(incrementButtons.length).toBe(sampleItems.length);
    });

    test('has remove buttons for each item', () => {
      renderCart(sampleItems);
      const removeButtons = screen.getAllByText('Remove');
      expect(removeButtons.length).toBe(sampleItems.length);
    });

    test('clicking decrement reduces quantity and updates total', () => {
      renderCart(sampleItems);
      const decrementButtons = screen.getAllByText('−');
      fireEvent.click(decrementButtons[0]);
      // Item 1 (quantity 1) → decrement to 0 → removed
      // Item 2 (320 * 2 = 640) remains
      expect(screen.getByText('640.00 MAD')).toBeInTheDocument();
    });

    test('clicking increment increases quantity and updates price', () => {
      renderCart([sampleItems[0]]);
      const incrementButton = screen.getByText('+');
      fireEvent.click(incrementButton);
      // Quantity goes from 1 to 2 → 285 * 2 = 570
      expect(screen.getByText('570 MAD')).toBeInTheDocument();
    });
  });

  // ─── Remove Items ───────────────────────────────────────────
  describe('Remove items', () => {
    test('clicking remove removes the item from cart', () => {
      renderCart(sampleItems);
      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[0]);
      expect(screen.getByText('Lumière Dorée')).toBeInTheDocument();
      expect(screen.queryByText('Noir Absolu')).not.toBeInTheDocument();
    });

    test('shows empty state after removing all items', () => {
      renderCart(sampleItems);
      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[0]);
      fireEvent.click(removeButtons[1]);
      expect(screen.getByText('Your collection awaits.')).toBeInTheDocument();
    });
  });

  // ─── Checkout Navigation ────────────────────────────────────
  describe('Checkout navigation', () => {
    test('renders Proceed to Checkout button when items exist', () => {
      renderCart(sampleItems);
      expect(screen.getByText('Proceed to Checkout')).toBeInTheDocument();
    });

    test('navigates to /checkout on checkout button click', () => {
      renderCart(sampleItems);
      const checkoutBtn = screen.getByText('Proceed to Checkout');
      fireEvent.click(checkoutBtn);
      expect(mockNavigate).toHaveBeenCalledWith('/checkout');
    });
  });

  // ─── Close Cart ─────────────────────────────────────────────
  describe('Close cart UI', () => {
    test('renders close button', () => {
      renderCart(sampleItems);
      const closeBtn = screen.getByRole('button', { name: /close cart/i });
      expect(closeBtn).toBeInTheDocument();
    });

    test('renders backdrop overlay', () => {
      renderCart(sampleItems);
      const backdrop = document.querySelector('.cart-backdrop');
      expect(backdrop).toBeInTheDocument();
    });
  });

  // ─── Header & Footer ────────────────────────────────────────
  describe('Cart header and footer', () => {
    test('displays "Your Selection" heading', () => {
      renderCart(sampleItems);
      expect(screen.getByText('Your Selection')).toBeInTheDocument();
    });

    test('displays shipping message in footer', () => {
      renderCart(sampleItems);
      expect(
        screen.getByText('Complimentary shipping on all orders')
      ).toBeInTheDocument();
    });
  });
});
