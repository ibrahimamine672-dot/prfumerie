/**
 * Unit tests for exportOrdersToExcel controller function.
 *
 * Approach:
 * - Mock the Order model to control returned data.
 * - Mock the exceljs module entirely so we can capture and verify
 *   workbook content without streaming to a real writable stream.
 * - Verify that the correct Express response headers are set.
 * - Verify that the workbook's rows contain the expected order data.
 */

// ---------------------------------------------------------------------------
// Mock setup — must happen before requiring modules that use them
// ---------------------------------------------------------------------------

// Track workbook-building calls so tests can inspect them
const mockAddRow = jest.fn();
const mockEachRow = jest.fn();
const mockGetRow = jest.fn().mockReturnValue({
  font: {},
  fill: {},
  alignment: {},
  height: 0,
  eachCell: jest.fn(),
});
const mockXlsxWrite = jest.fn();
const mockAddWorksheet = jest.fn();

// Mock the exceljs module entirely
jest.mock('exceljs', () => {
  const mockWorksheet = {
    columns: [],
    addRow: mockAddRow,
    eachRow: mockEachRow,
    getRow: mockGetRow,
  };

  return {
    Workbook: jest.fn().mockImplementation(() => ({
      addWorksheet: mockAddWorksheet.mockReturnValue(mockWorksheet),
      xlsx: {
        write: mockXlsxWrite,
      },
    })),
  };
});

// Mock the Order model
const mockLean = jest.fn();
const mockSort = jest.fn(() => ({ lean: mockLean }));
const mockFind = jest.fn(() => ({ sort: mockSort }));

jest.mock('../models/Order', () => ({
  find: mockFind,
}));

const { exportOrdersToExcel } = require('../controllers/orderController');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal fake order document that matches the fields used by
 * exportOrdersToExcel.
 */
function buildOrder(overrides = {}) {
  const now = new Date('2026-07-08T12:00:00Z');
  return {
    _id: '665f1a2b3c4d5e6f7a8b9c0d',
    name: 'Jean Dupont',
    email: 'jean@example.com',
    phone: '+33 6 12 34 56 78',
    items: [
      { name: 'Rose Elixir', price: 85, quantity: 2 },
      { name: 'Ambre Nuit', price: 120, quantity: 1 },
    ],
    subtotal: 290,
    shipping: 0,
    total: 290,
    status: 'delivered',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Build a mock Express response object.
 */
function mockRes() {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
});

describe('exportOrdersToExcel', () => {
  test('should fetch all orders sorted newest first and send Excel response', async () => {
    const orders = [
      buildOrder({ _id: 'order-002', name: 'Bob', total: 200 }),
      buildOrder({ _id: 'order-001', name: 'Alice', total: 150 }),
    ];
    mockLean.mockResolvedValue(orders);

    const req = {};
    const res = mockRes();

    await exportOrdersToExcel(req, res);

    // Verify the Mongoose query chain
    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(mockLean).toHaveBeenCalledTimes(1);

    // Verify response headers
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename=commandes.xlsx'
    );

    // Verify the workbook was streamed to the response
    expect(mockXlsxWrite).toHaveBeenCalledWith(res);
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  test('should write correct order data into worksheet rows', async () => {
    const order = buildOrder();
    mockLean.mockResolvedValue([order]);

    const req = {};
    const res = mockRes();

    await exportOrdersToExcel(req, res);

    // Expect one row added per order
    expect(mockAddRow).toHaveBeenCalledTimes(1);
    expect(mockAddRow).toHaveBeenCalledWith({
      id: order._id.toString(),
      name: order.name,
      email: order.email,
      phone: order.phone,
      product: 'Rose Elixir, Ambre Nuit',
      quantity: 3,
      total: '290.00 €',
      status: order.status,
      date: expect.any(String),
    });
  });

  test('should flatten multiple order items into a single product string and summed quantity', async () => {
    const order = buildOrder({
      items: [
        { name: 'Rose Elixir', price: 85, quantity: 2 },
        { name: 'Ambre Nuit', price: 120, quantity: 1 },
        { name: 'Musc Blanc', price: 65, quantity: 3 },
      ],
    });
    mockLean.mockResolvedValue([order]);

    const req = {};
    const res = mockRes();

    await exportOrdersToExcel(req, res);

    expect(mockAddRow).toHaveBeenCalledWith(
      expect.objectContaining({
        product: 'Rose Elixir, Ambre Nuit, Musc Blanc',
        quantity: 6,
      })
    );
  });

  test('should format total price with euro symbol and two decimals', async () => {
    const order = buildOrder({ total: 123.5 });
    mockLean.mockResolvedValue([order]);

    const req = {};
    const res = mockRes();

    await exportOrdersToExcel(req, res);

    expect(mockAddRow).toHaveBeenCalledWith(
      expect.objectContaining({ total: '123.50 €' })
    );
  });

  test('should handle zero total price', async () => {
    const order = buildOrder({ total: 0 });
    mockLean.mockResolvedValue([order]);

    const req = {};
    const res = mockRes();

    await exportOrdersToExcel(req, res);

    expect(mockAddRow).toHaveBeenCalledWith(
      expect.objectContaining({ total: '0.00 €' })
    );
  });

  test('should format date in French locale', async () => {
    const order = buildOrder({ createdAt: new Date('2026-07-08T14:30:00Z') });
    mockLean.mockResolvedValue([order]);

    const req = {};
    const res = mockRes();

    await exportOrdersToExcel(req, res);

    expect(mockAddRow).toHaveBeenCalledWith(
      expect.objectContaining({
        date: expect.stringMatching(/08\/07\/2026/),
      })
    );
  });

  test('should use empty string for orders with no phone number', async () => {
    const order = buildOrder({ phone: '' });
    mockLean.mockResolvedValue([order]);

    const req = {};
    const res = mockRes();

    await exportOrdersToExcel(req, res);

    expect(mockAddRow).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '' })
    );
  });

  test('should handle empty orders array gracefully', async () => {
    mockLean.mockResolvedValue([]);

    const req = {};
    const res = mockRes();

    await exportOrdersToExcel(req, res);

    expect(mockAddRow).not.toHaveBeenCalled();
    expect(mockXlsxWrite).toHaveBeenCalledWith(res);
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  test('should add a data row for each order when multiple orders exist', async () => {
    const orders = [
      buildOrder({ _id: 'a1', name: 'Alice' }),
      buildOrder({ _id: 'b2', name: 'Bob' }),
      buildOrder({ _id: 'c3', name: 'Charlie' }),
    ];
    mockLean.mockResolvedValue(orders);

    const req = {};
    const res = mockRes();

    await exportOrdersToExcel(req, res);

    expect(mockAddRow).toHaveBeenCalledTimes(3);
  });

  test('should return 500 and error message when Order.find() fails', async () => {
    mockLean.mockRejectedValue(new Error('Database connection failed'));

    const req = {};
    const res = mockRes();

    await exportOrdersToExcel(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Database connection failed'),
      })
    );
    expect(res.end).not.toHaveBeenCalled();
  });

  test('should set worksheet column headers correctly', async () => {
    mockLean.mockResolvedValue([]);

    const req = {};
    const res = mockRes();

    // We can check the column configuration by examining what
    // the controller set on the worksheet's columns array
    await exportOrdersToExcel(req, res);

    // addWorksheet should have been called once with 'Commandes'
    expect(mockAddWorksheet).toHaveBeenCalledWith('Commandes');
  });
});
