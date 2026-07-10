/**
 * Integration tests for the GET /api/admin/orders/export endpoint.
 *
 * Uses mongodb-memory-server for an isolated MongoDB instance and supertest
 * to make real HTTP requests against the Express app. Seeds real data, then
 * reads back the generated Excel file to verify cell contents.
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const jwt = require('jsonwebtoken');

// Set env vars before requiring the app
process.env.JWT_SECRET = 'test-jwt-secret-key-not-for-production';
process.env.ADMIN_EMAIL = 'new-admin@example.com';
process.env.ADMIN_PASSWORD = 'adminpass1937';
process.env.ADMIN_NAME = 'Test Admin';
process.env.ADMIN_PHONE = '+33123456789';
process.env.ADMIN_LOCATION = 'Paris, France';

const Order = require('../models/Order');
const User = require('../models/User');

let mongoServer;
let app;
let adminToken;

// ── Test data ──────────────────────────────────────────────────────────────

const testOrders = [
  {
    name: 'Marie Lambert',
    email: 'marie@example.com',
    phone: '+33 6 11 22 33 44',
    location: '15 Rue de Rivoli, Paris',
    items: [
      { perfumeId: 'perf-001', name: 'Noir Absolu', price: 285, quantity: 1, size: '100ml', image: '' },
    ],
    subtotal: 285,
    shipping: 0,
    total: 285,
    status: 'delivered',
    createdAt: new Date('2026-06-01T10:30:00Z'),
    updatedAt: new Date('2026-06-05T14:00:00Z'),
  },
  {
    name: 'Hugo Leclerc',
    email: 'hugo@example.com',
    phone: '',
    location: '8 Avenue des Champs-Élysées, Paris',
    items: [
      { perfumeId: 'perf-003', name: 'Vetiver Royal', price: 245, quantity: 2, size: '100ml', image: '' },
      { perfumeId: 'perf-005', name: 'Ombre Sauvage', price: 195, quantity: 1, size: '100ml', image: '' },
    ],
    subtotal: 685,
    shipping: 0,
    total: 685,
    status: 'pending',
    createdAt: new Date('2026-07-01T14:45:00Z'),
    updatedAt: new Date('2026-07-01T14:45:00Z'),
  },
];

// ── Setup / Teardown ───────────────────────────────────────────────────────

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Override MONGODB_URI so connectDB uses the in-memory instance
  process.env.MONGODB_URI = uri;

  await mongoose.connect(uri);

  // Seed an admin user (password hashed by the User model's pre-save hook)
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@parfum.com',
    phone: '+33123456789',
    location: 'Paris, France',
    password: 'Admin@123',
    role: 'admin',
  });

  // Generate a JWT token for the admin (same pattern as authController)
  adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  // Seed test orders
  await Order.insertMany(testOrders);

  // Require the app AFTER setting up env and DB
  // The app's connectDB middleware will see mongoose is already connected (readyState=1)
  // and skip reconnection
  app = require('../server');
}, 30000); // Allow time for mongodb-memory-server to download

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Admin authentication and order access', () => {
  test('should migrate the legacy admin and login with the configured credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      })
      .expect(200);

    expect(res.body.role).toBe('admin');
    expect(res.body.token).toEqual(expect.any(String));
    adminToken = res.body.token;

    const migratedAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL })
      .select('+password');

    expect(migratedAdmin).not.toBeNull();
    expect(migratedAdmin.password).not.toBe(process.env.ADMIN_PASSWORD);
    expect(await migratedAdmin.comparePassword(process.env.ADMIN_PASSWORD)).toBe(true);
    expect(await User.findOne({ email: 'admin@parfum.com' })).toBeNull();
  });

  test('should allow an admin to list orders', async () => {
    const res = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.orders).toHaveLength(testOrders.length);
  });

  test('should reject a regular user from the admin orders page', async () => {
    const user = await User.create({
      name: 'Regular User',
      email: 'regular@example.com',
      phone: '+33600000001',
      location: 'Lyon, France',
      password: 'regularpass',
      role: 'user',
    });
    const userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });
});

describe('GET /api/admin/orders/export', () => {
  test('should return 401 when no auth token is provided', async () => {
    const res = await request(app)
      .get('/api/admin/orders/export')
      .expect(401);

    expect(res.body).toHaveProperty('message');
  });

  test('should return 403 when user is not an admin', async () => {
    // Create a regular user and generate their token
    const user = await User.create({
      name: 'User',
      email: 'user@example.com',
      phone: '+33600000000',
      location: 'Lyon, France',
      password: 'User@123',
      role: 'user',
    });
    const userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    const res = await request(app)
      .get('/api/admin/orders/export')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    expect(res.body).toHaveProperty('message');
  });

  test('should download an Excel file with correct content type and filename', async () => {
    const res = await request(app)
      .get('/api/admin/orders/export')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Verify response headers
    expect(res.headers['content-type']).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(res.headers['content-disposition']).toBe(
      'attachment; filename=commandes.xlsx'
    );
  });

  /**
   * Helper: make a supertest request with a custom parser that captures the
   * raw binary buffer (needed for the Excel content-type).
   */
  async function fetchExcel() {
    const res = await request(app)
      .get('/api/admin/orders/export')
      .set('Authorization', `Bearer ${adminToken}`)
      // Custom parser: collect all chunks and return a single Buffer
      .buffer(true)
      .parse((res, cb) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => cb(null, Buffer.concat(chunks)));
      });
    return res;
  }

  test('should include all required column headers in the Excel file', async () => {
    const res = await fetchExcel();

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(res.body);

    const worksheet = workbook.getWorksheet('Commandes');
    expect(worksheet).toBeDefined();

    // Check header row (row 1)
    const headerRow = worksheet.getRow(1);
    const expectedHeaders = [
      'Nom client',
      'Email client',
      'Téléphone',
      'Adresse',
      'Ville',
      'Produits',
      'Total produits',
      'Prix livraison',
      'Total final',
      'Méthode paiement',
      'Statut paiement',
      'Mode livraison',
      'Statut livraison',
      'Numéro de suivi',
      'Date commande',
    ];

    expectedHeaders.forEach((header, i) => {
      expect(headerRow.getCell(i + 1).value).toBe(header);
    });

    const normalizedHeaders = expectedHeaders.map((header) => header.toLowerCase());
    expect(normalizedHeaders).not.toEqual(
      expect.arrayContaining(['password', 'token', 'password hash', 'hash password'])
    );
  });

  test('should contain correct data for each seeded order', async () => {
    const res = await fetchExcel();

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(res.body);

    const worksheet = workbook.getWorksheet('Commandes');

    // Orders are sorted newest first: Hugo (July 1) → Marie (June 1)
    // Row 1 = headers, Row 2 = first order (Hugo), Row 3 = second order (Marie)

    // --- Row 2: Hugo Leclerc ---
    const row2 = worksheet.getRow(2);
    expect(row2.getCell(1).value).toBe('Hugo Leclerc');  // Nom client
    expect(row2.getCell(2).value).toBe('hugo@example.com'); // Email client
    expect(row2.getCell(3).value).toBe('');                 // Téléphone (empty)
    expect(row2.getCell(4).value).toBe('8 Avenue des Champs-Élysées, Paris'); // Adresse
    expect(row2.getCell(5).value).toBe('');                 // Ville (empty)
    expect(row2.getCell(6).value).toBe('Vetiver Royal, Ombre Sauvage'); // Produits (joined)
    expect(row2.getCell(7).value).toBe('685.00 MAD');       // Total produits
    expect(row2.getCell(8).value).toBe('0.00 MAD');         // Prix livraison
    expect(row2.getCell(9).value).toBe('685.00 MAD');       // Total final
    expect(row2.getCell(10).value).toBe('cash_on_delivery'); // Méthode paiement
    expect(row2.getCell(11).value).toBe('pending');          // Statut paiement
    expect(row2.getCell(12).value).toBe('standard');         // Mode livraison
    expect(row2.getCell(13).value).toBe('pending');          // Statut livraison
    expect(row2.getCell(14).value).toBe('');                 // Numéro de suivi (empty)
    expect(row2.getCell(15).value).toContain('01/07/2026');  // Date commande

    // --- Row 3: Marie Lambert ---
    const row3 = worksheet.getRow(3);
    expect(row3.getCell(1).value).toBe('Marie Lambert');
    expect(row3.getCell(2).value).toBe('marie@example.com');
    expect(row3.getCell(3).value).toBe('+33 6 11 22 33 44');
    expect(row3.getCell(4).value).toBe('15 Rue de Rivoli, Paris');
    expect(row3.getCell(5).value).toBe('');
    expect(row3.getCell(6).value).toBe('Noir Absolu');
    expect(row3.getCell(7).value).toBe('285.00 MAD');
    expect(row3.getCell(8).value).toBe('0.00 MAD');
    expect(row3.getCell(9).value).toBe('285.00 MAD');
    expect(row3.getCell(10).value).toBe('cash_on_delivery');
    expect(row3.getCell(11).value).toBe('pending');
    expect(row3.getCell(12).value).toBe('standard');
    expect(row3.getCell(13).value).toBe('delivered');
    expect(row3.getCell(14).value).toBe('');
    expect(row3.getCell(15).value).toContain('01/06/2026');
  });

  test('should return empty orders gracefully when no data exists', async () => {
    // Remove all orders for this test
    await Order.deleteMany({});

    const res = await fetchExcel();

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(res.body);

    const worksheet = workbook.getWorksheet('Commandes');
    // Only header row exists (no data rows)
    expect(worksheet.rowCount).toBe(1);
    expect(worksheet.getRow(1).getCell(1).value).toBe('Nom client');

    // Restore the orders for other tests
    await Order.insertMany(testOrders);
  });
});
