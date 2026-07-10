import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../context/AuthContext';
import AdminOrders from '../AdminOrders';

// Use manual mock from __mocks__/react-router-dom.js
jest.mock('react-router-dom');

// Mock config
jest.mock('../../config', () => ({
  __esModule: true,
  default: 'http://localhost:5002/api',
  parseJSON: jest.fn(),
}));

const { parseJSON } = require('../../config');

// ─── Test Data ────────────────────────────────────────────────
const adminUser = {
  _id: 'admin123',
  name: 'Admin',
  email: 'admin@example.com',
  role: 'admin',
};

const regularUser = {
  _id: 'user123',
  name: 'User',
  email: 'user@example.com',
  role: 'user',
};

const sampleOrders = [
  {
    _id: '507f1f77bcf86cd799439011',
    name: 'Jean Dupont',
    email: 'jean@example.com',
    phone: '+212 612345678',
    location: '12 Rue des Fleurs, Casablanca 20000',
    items: [
      { name: 'Noir Absolu', price: 285, quantity: 1 },
      { name: 'Lumière Dorée', price: 320, quantity: 1 },
    ],
    productsPrice: 605,
    deliveryPrice: 0,
    totalPrice: 605,
    subtotal: 605,
    shipping: 0,
    total: 605,
    payment: {
      method: 'cash_on_delivery',
      status: 'pending',
    },
    delivery: {
      fullName: 'Jean Dupont',
      phone: '+212 612345678',
      address: '12 Rue des Fleurs',
      city: 'Casablanca',
      postalCode: '20000',
      deliveryMethod: 'standard',
      status: 'pending',
      trackingNumber: '',
      estimatedDeliveryDate: null,
    },
    status: 'pending',
    createdAt: '2026-07-01T10:30:00Z',
  },
  {
    _id: '507f1f77bcf86cd799439022',
    name: 'Marie Claire',
    email: 'marie@example.com',
    items: [
      { name: 'Vetiver Royal', price: 245, quantity: 2 },
    ],
    productsPrice: 490,
    deliveryPrice: 20,
    totalPrice: 510,
    subtotal: 490,
    shipping: 20,
    total: 510,
    payment: {
      method: 'card_fake',
      status: 'paid',
    },
    delivery: {
      fullName: 'Marie Claire',
      phone: '+212 600000000',
      address: '5 Avenue Hassan II',
      city: 'Rabat',
      postalCode: '10000',
      deliveryMethod: 'express',
      status: 'shipped',
      trackingNumber: 'TRACK123',
      estimatedDeliveryDate: '2026-07-05T00:00:00Z',
    },
    status: 'shipped',
    createdAt: '2026-07-05T14:00:00Z',
  },
];

function renderAdminOrders(user = adminUser) {
  localStorage.setItem('token', 'admin-token');
  localStorage.setItem('user', JSON.stringify(user));

  return render(
    <AuthProvider>
      <AdminOrders />
    </AuthProvider>
  );
}

// ─── Tests ────────────────────────────────────────────────────
describe('AdminOrders Page', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    parseJSON.mockResolvedValue({ orders: sampleOrders });
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    delete global.fetch;
    jest.restoreAllMocks();
  });

  // ─── Auth Guard: No Token ───────────────────────────────────
  describe('Authentication guard - no token/user', () => {
    test('shows admin login prompt when no token is present', () => {
      localStorage.clear();
      render(
        <AuthProvider>
          <AdminOrders />
        </AuthProvider>
      );
      expect(screen.getByText('Admin Access Required')).toBeInTheDocument();
      expect(screen.getByText(/Please sign in/)).toBeInTheDocument();
    });

    test('shows Sign In link for unauthenticated users', () => {
      localStorage.clear();
      render(
        <AuthProvider>
          <AdminOrders />
        </AuthProvider>
      );
      const signInLink = screen.getByText('Sign In');
      expect(signInLink.closest('a')).toHaveAttribute('href', '/signin');
    });
  });

  // ─── Auth Guard: Regular User ───────────────────────────────
  describe('Authentication guard - non-admin user', () => {
    test('shows access denied for regular users', async () => {
      renderAdminOrders(regularUser);
      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });

    test('shows Go Home link for non-admin users', async () => {
      renderAdminOrders(regularUser);
      await waitFor(() => {
        const goHomeLink = screen.getByText('Go Home');
        expect(goHomeLink.closest('a')).toHaveAttribute('href', '/');
      });
    });
  });

  // ─── Admin View: Header ─────────────────────────────────────
  describe('Admin view - header', () => {
    test('shows "Orders Management" heading for admin', async () => {
      renderAdminOrders();
      await waitFor(() => {
        expect(screen.getByText('Orders Management')).toBeInTheDocument();
      });
    });

    test('shows stats chips for admin', async () => {
      renderAdminOrders();
      await waitFor(() => {
        expect(screen.getByText(/Total/)).toBeInTheDocument();
        expect(screen.getByText(/Pending/)).toBeInTheDocument();
        expect(screen.getByText(/Shipped/)).toBeInTheDocument();
        expect(screen.getByText(/Delivered/)).toBeInTheDocument();
      });
    });

    test('shows Excel export button', async () => {
      renderAdminOrders();
      await waitFor(() => {
        expect(screen.getByText('Télécharger Excel')).toBeInTheDocument();
      });
    });
  });

  // ─── Loading State ──────────────────────────────────────────
  describe('Loading state', () => {
    test('shows loading message while fetching', () => {
      global.fetch = jest.fn(() => new Promise(() => {}));
      renderAdminOrders();
      expect(screen.getByText('Loading orders...')).toBeInTheDocument();
    });
  });

  // ─── Orders Table ───────────────────────────────────────────
  describe('Orders table', () => {
    test('renders customer names in table', async () => {
      renderAdminOrders();
      await waitFor(() => {
        expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
        expect(screen.getByText('Marie Claire')).toBeInTheDocument();
      });
    });

    test('renders customer emails', async () => {
      renderAdminOrders();
      await waitFor(() => {
        expect(screen.getByText('jean@example.com')).toBeInTheDocument();
        expect(screen.getByText('marie@example.com')).toBeInTheDocument();
      });
    });

    test('renders total prices', async () => {
      renderAdminOrders();
      await waitFor(() => {
        const totalTexts = screen.getAllByText('605.00 MAD');
        expect(totalTexts.length).toBeGreaterThanOrEqual(1);
        const totalTexts2 = screen.getAllByText('510.00 MAD');
        expect(totalTexts2.length).toBeGreaterThanOrEqual(1);
      });
    });

    test('renders payment statuses', async () => {
      renderAdminOrders();
      await waitFor(() => {
        const pendingElements = screen.getAllByText('pending');
        expect(pendingElements.length).toBeGreaterThanOrEqual(1);
        const paidElements = screen.getAllByText('paid');
        expect(paidElements.length).toBeGreaterThanOrEqual(1);
      });
    });

    test('renders View / Edit buttons for each order', async () => {
      renderAdminOrders();
      await waitFor(() => {
        const viewButtons = screen.getAllByText('View / Edit');
        expect(viewButtons.length).toBe(2);
      });
    });

    test('renders delivery cities', async () => {
      renderAdminOrders();
      await waitFor(() => {
        expect(screen.getByText(/Casablanca/)).toBeInTheDocument();
        expect(screen.getByText(/Rabat/)).toBeInTheDocument();
      });
    });
  });

  // ─── Empty Orders ───────────────────────────────────────────
  describe('Empty orders', () => {
    beforeEach(() => {
      parseJSON.mockResolvedValue({ orders: [] });
    });

    test('shows "No Orders Yet" message when no orders', async () => {
      renderAdminOrders();
      await waitFor(() => {
        expect(screen.getByText('No Orders Yet')).toBeInTheDocument();
      });
    });
  });

  // ─── Error State ────────────────────────────────────────────
  describe('Error state', () => {
    beforeEach(() => {
      parseJSON.mockResolvedValue({ message: 'Failed to fetch' });
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
      });
    });

    test('shows error message when fetch fails', async () => {
      renderAdminOrders();
      await waitFor(() => {
        expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
      });
    });

    test('shows retry button on error', async () => {
      renderAdminOrders();
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });
  });

  // ─── Order Modal ────────────────────────────────────────────
  describe('Order detail modal', () => {
    function openModal() {
      return waitFor(() => {
        const viewBtn = screen.getAllByText('View / Edit')[0];
        fireEvent.click(viewBtn);
      });
    }

    test('opens modal when clicking View / Edit', async () => {
      renderAdminOrders();
      await openModal();
      const modalHeaders = screen.getAllByText(/Order #/);
      expect(modalHeaders.length).toBeGreaterThanOrEqual(1);
    });

    test('shows customer name in modal', async () => {
      renderAdminOrders();
      await openModal();
      const nameElements = screen.getAllByText('Jean Dupont');
      expect(nameElements.length).toBeGreaterThanOrEqual(2); // table row + modal
    });

    test('shows fulfillment management form in modal', async () => {
      renderAdminOrders();
      await openModal();
      expect(screen.getByText('Fulfillment management')).toBeInTheDocument();
    });

    test('shows payment status selector in modal', async () => {
      renderAdminOrders();
      await openModal();
      const statusLabels = screen.getAllByText('Payment status');
      expect(statusLabels.length).toBeGreaterThanOrEqual(1);
    });

    test('shows Save fulfillment button in modal', async () => {
      renderAdminOrders();
      await openModal();
      expect(screen.getByText('Save fulfillment')).toBeInTheDocument();
    });

    test('closes modal when clicking close', async () => {
      renderAdminOrders();
      await openModal();
      const modalHeaders = screen.getAllByText(/Order #/);
      expect(modalHeaders.length).toBeGreaterThanOrEqual(1);

      const closeBtn = screen.getByLabelText('Close');
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(screen.queryByText(/Order #79943901/)).not.toBeInTheDocument();
      });
    });
  });

  // ─── Excel Export ───────────────────────────────────────────
  describe('Excel export', () => {
    beforeEach(() => {
      global.URL.createObjectURL = jest.fn(() => 'blob:test');
      global.URL.revokeObjectURL = jest.fn();
    });

    test('calls export endpoint when Excel button is clicked', async () => {
      renderAdminOrders();

      await waitFor(() => {
        expect(screen.getByText('Télécharger Excel')).toBeInTheDocument();
      });

      parseJSON.mockResolvedValue({ orders: sampleOrders });
      global.fetch = jest.fn().mockResolvedValue({ ok: true });

      const exportBtn = screen.getByText('Télécharger Excel');
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/admin/orders/export'),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer admin-token',
            }),
          })
        );
      });
    });
  });
});
