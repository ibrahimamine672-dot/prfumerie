import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../context/AuthContext';
import Profile from '../Profile';

// Use manual mock from __mocks__/react-router-dom.js
jest.mock('react-router-dom');

const mockNavigate = require('react-router-dom').useNavigate();

// Mock config
jest.mock('../../config', () => ({
  __esModule: true,
  default: 'http://localhost:5002/api',
  parseJSON: jest.fn(),
}));

const { parseJSON } = require('../../config');

// ─── Helpers ──────────────────────────────────────────────────
const mockUser = {
  _id: 'user123',
  name: 'Jean Dupont',
  email: 'jean@example.com',
  role: 'user',
  completedOrders: 3,
  freeItemAvailable: false,
};

const mockUserWithFreeItem = {
  ...mockUser,
  completedOrders: 10,
  freeItemAvailable: true,
};

function renderProfile(user = mockUser) {
  localStorage.setItem('token', 'fake-token');
  localStorage.setItem('user', JSON.stringify(user));

  return render(
    <AuthProvider>
      <Profile />
    </AuthProvider>
  );
}

// ─── Tests ────────────────────────────────────────────────────
describe('Profile Page', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    // Default: successful empty orders response
    parseJSON.mockResolvedValue({ orders: [] });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    });
  });

  afterEach(() => {
    delete global.fetch;
  });

  // ─── Authentication Guard ───────────────────────────────────
  describe('Authentication guard', () => {
    test('redirects to /signin when user is not logged in', () => {
      localStorage.clear();
      render(
        <AuthProvider>
          <Profile />
        </AuthProvider>
      );
      expect(mockNavigate).toHaveBeenCalledWith('/signin');
    });

    test('returns null and does not crash when user is null', () => {
      localStorage.clear();
      const { container } = render(
        <AuthProvider>
          <Profile />
        </AuthProvider>
      );
      expect(container.innerHTML).toBe('');
    });
  });

  // ─── User Info Display ──────────────────────────────────────
  describe('User info display', () => {
    test('shows user email', async () => {
      renderProfile();
      await waitFor(() => {
        const emails = screen.getAllByText('jean@example.com');
        expect(emails.length).toBeGreaterThanOrEqual(1);
      });
    });

    test('shows "My Account" heading', async () => {
      renderProfile();
      await waitFor(() => {
        expect(screen.getByText('My Account')).toBeInTheDocument();
      });
    });

    test('shows user name in profile information', async () => {
      renderProfile();
      await waitFor(() => {
        expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
      });
    });

    test('shows user role', async () => {
      renderProfile();
      await waitFor(() => {
        expect(screen.getByText('user')).toBeInTheDocument();
      });
    });

    test('renders Sign Out button', async () => {
      renderProfile();
      await waitFor(() => {
        expect(screen.getByText('Sign Out')).toBeInTheDocument();
      });
    });

    test('renders Browse Fragrances link', async () => {
      renderProfile();
      await waitFor(() => {
        expect(screen.getByText('Browse Fragrances')).toBeInTheDocument();
      });
    });
  });

  // ─── Loyalty Program ────────────────────────────────────────
  describe('Loyalty program', () => {
    function renderWithLoyaltyData(completedOrders = 3, freeItemAvailable = false) {
      // Override parseJSON before rendering so API returns loyalty data
      parseJSON.mockResolvedValue({
        orders: [],
        completedOrders,
        freeItemAvailable,
      });
      const userData = { ...mockUser, completedOrders, freeItemAvailable };
      localStorage.setItem('token', 'fake-token');
      localStorage.setItem('user', JSON.stringify(userData));

      return render(
        <AuthProvider>
          <Profile />
        </AuthProvider>
      );
    }

    test('shows loyalty section heading', async () => {
      renderWithLoyaltyData(3, false);
      await waitFor(() => {
        expect(screen.getByText(/Maison Dorée Loyalty/)).toBeInTheDocument();
      });
    });

    test('shows "Free Item Ready" badge when free item is available', async () => {
      renderWithLoyaltyData(10, true);
      await waitFor(() => {
        expect(screen.getByText('Free Item Ready!')).toBeInTheDocument();
      });
    });

    test('shows "Claim Your Free Item" link when available', async () => {
      renderWithLoyaltyData(10, true);
      await waitFor(() => {
        const claimLink = screen.getByText('Claim Your Free Item →');
        expect(claimLink).toBeInTheDocument();
        expect(claimLink.closest('a')).toHaveAttribute('href', '/checkout');
      });
    });

    test('shows progress count for loyalty', async () => {
      renderWithLoyaltyData(3, false);
      await waitFor(() => {
        expect(screen.getByText('3 / 10')).toBeInTheDocument();
      });
    });

    test('shows how many orders until free item', async () => {
      renderWithLoyaltyData(3, false);
      await waitFor(() => {
        expect(
          screen.getByText(/7 more orders until a free item/)
        ).toBeInTheDocument();
      });
    });
  });

  // ─── Loading State ──────────────────────────────────────────
  describe('Loading state', () => {
    test('shows loading message while fetching orders', async () => {
      // Keep fetch pending (never resolves)
      global.fetch = jest.fn(() => new Promise(() => {}));
      renderProfile();
      expect(screen.getByText('Loading orders...')).toBeInTheDocument();
    });
  });

  // ─── Empty Orders ───────────────────────────────────────────
  describe('Empty orders', () => {
    test('shows empty state message when no orders exist', async () => {
      renderProfile();
      await waitFor(() => {
        expect(
          screen.getByText(/No orders yet/)
        ).toBeInTheDocument();
      });
    });

    test('shows Start Shopping link in empty state', async () => {
      renderProfile();
      await waitFor(() => {
        const link = screen.getByText('Start Shopping');
        expect(link).toBeInTheDocument();
        expect(link.closest('a')).toHaveAttribute('href', '/products');
      });
    });
  });

  // ─── Orders Display ─────────────────────────────────────────
  describe('Orders display', () => {
    const sampleOrders = [
      {
        _id: 'order12345678',
        createdAt: '2026-06-15T10:30:00Z',
        items: [
          { name: 'Noir Absolu', price: 285, quantity: 1 },
          { name: 'Lumière Dorée', price: 320, quantity: 1 },
        ],
        total: 605,
        status: 'delivered',
      },
      {
        _id: 'order87654321',
        createdAt: '2026-07-01T14:00:00Z',
        items: [{ name: 'Santal Céleste', price: 275, quantity: 1 }],
        total: 275,
        status: 'shipped',
        freeItemApplied: true,
      },
    ];

    beforeEach(() => {
      parseJSON.mockResolvedValue({
        orders: sampleOrders,
        completedOrders: 3,
        freeItemAvailable: false,
      });
    });

    test('renders order history heading', async () => {
      renderProfile();
      await waitFor(() => {
        expect(screen.getByText('Order History')).toBeInTheDocument();
      });
    });

    test('displays order IDs', async () => {
      renderProfile();
      await waitFor(() => {
        expect(screen.getByText(/Order #12345678/)).toBeInTheDocument();
        expect(screen.getByText(/Order #87654321/)).toBeInTheDocument();
      });
    });

    test('displays order totals in MAD', async () => {
      renderProfile();
      await waitFor(() => {
        expect(screen.getByText('605.00 MAD')).toBeInTheDocument();
        expect(screen.getByText('275.00 MAD')).toBeInTheDocument();
      });
    });

    test('displays order status badges', async () => {
      renderProfile();
      await waitFor(() => {
        const statusElements = screen.getAllByText(/delivered|shipped/);
        expect(statusElements.length).toBeGreaterThanOrEqual(1);
      });
    });

    test('shows Free Item badge on orders that had free item applied', async () => {
      renderProfile();
      await waitFor(() => {
        expect(screen.getByText(/Free Item/)).toBeInTheDocument();
      });
    });

    test('shows item count for each order', async () => {
      renderProfile();
      await waitFor(() => {
        expect(screen.getByText(/2 items/)).toBeInTheDocument();
        expect(screen.getByText(/1 items/)).toBeInTheDocument();
      });
    });
  });

  // ─── Fetch Failure ──────────────────────────────────────────
  describe('Fetch failure', () => {
    test('handles fetch error gracefully without crashing', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      renderProfile();
      await waitFor(() => {
        expect(screen.getByText('My Account')).toBeInTheDocument();
        expect(screen.queryByText('Loading orders...')).not.toBeInTheDocument();
      });
    });

    test('handles non-ok response without crashing', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
      });
      parseJSON.mockResolvedValue({ message: 'Not authorized' });
      renderProfile();
      await waitFor(() => {
        expect(screen.getByText('My Account')).toBeInTheDocument();
        expect(screen.queryByText('Loading orders...')).not.toBeInTheDocument();
      });
    });
  });
});
