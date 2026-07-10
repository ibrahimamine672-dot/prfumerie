/**
 * Integration tests for XSS sanitization through real API endpoints.
 *
 * Sends XSS payloads via POST /api/auth/register and POST /api/orders
 * and verifies the stored data in MongoDB is properly sanitized.
 *
 * Uses mongodb-memory-server for isolated testing and supertest
 * for HTTP requests against the full Express app (middleware stack
 * including xssSanitize, express-validator, etc.).
 */

const mongoose = require('mongoose');
const request = require('supertest');

const {
  setupTestEnvironment,
  teardownTestEnvironment,
} = require('./testUtils');

const User = require('../models/User');
const Order = require('../models/Order');

let mongoServer;
let app;

// ── Test data helpers ──────────────────────────────────────────────────────

/** XSS payloads we'll inject into various fields */
const XSS_SCRIPT = '<script>alert(1)</script>';
const XSS_IMG = '<img src=x onerror=alert(1)>';
const XSS_A_HREF = '<a href="javascript:alert(1)">Click</a>';
const XSS_ONCLICK = '<div onclick="alert(1)">Click me</div>';
const XSS_BOLD = '<b>Paris</b>';

/** Clean versions (expected after sanitization) */
const CLEAN_SCRIPT_BODY = 'alert(1)';          // <script>alert(1)</script> → 'alert(1)'
const CLEAN_BOLD = 'Paris';                     // <b>Paris</b> → 'Paris'

// ── Setup / Teardown ───────────────────────────────────────────────────────

beforeAll(async () => {
  ({ mongoServer } = await setupTestEnvironment());
  app = require('../server');
}, 30000);

afterAll(async () => {
  await teardownTestEnvironment({ mongoServer });
});

afterEach(async () => {
  // Clean all collections between tests
  await Promise.all([
    User.deleteMany({}),
    Order.deleteMany({}),
  ]);
});

// ── Tests: POST /api/auth/register ─────────────────────────────────────────

describe('POST /api/auth/register — XSS sanitization', () => {
  const validPassword = 'StrongPass1!';

  test('sanitizes <script> tags in name field', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: `John ${XSS_SCRIPT}`,
        email: 'john@test.com',
        phone: '+1234567890',
        location: 'Paris',
        password: validPassword,
      })
      .expect(201);

    expect(res.body.name).not.toContain('<script>');
    expect(res.body.name).toContain('John');
    // The script body text survives tag stripping
    expect(res.body.name).toContain('alert(1)');

    // Verify stored in DB
    const user = await User.findOne({ email: 'john@test.com' });
    expect(user).not.toBeNull();
    expect(user.name).not.toContain('<script>');
  });

  test('sanitizes <b> tags in location field', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Sophie',
        email: 'sophie@test.com',
        phone: '+33123456789',
        location: XSS_BOLD,
        password: validPassword,
      })
      .expect(201);

    expect(res.body.location).not.toContain('<b>');
    expect(res.body.location).not.toContain('</b>');
    expect(res.body.location).toBe(CLEAN_BOLD);

    // Verify stored in DB
    const user = await User.findOne({ email: 'sophie@test.com' });
    expect(user.location).toBe(CLEAN_BOLD);
  });

  test('sanitizes <img onerror> in location field', async () => {
    // Include safe text so the field is not empty after tag stripping
    const payload = `${XSS_IMG}Paris`;  // <img ...>Paris → stripped to 'Paris'
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Pierre',
        email: 'pierre@test.com',
        phone: '+33111111111',
        location: payload,
        password: validPassword,
      })
      .expect(201);

    expect(res.body.location).not.toContain('<img');
    expect(res.body.location).not.toContain('onerror');
    expect(res.body.location).toBe('Paris');

    // Verify stored in DB
    const user = await User.findOne({ email: 'pierre@test.com' });
    expect(user.location).not.toContain('<img');
    expect(user.location).not.toContain('onerror');
    expect(user.location).toBe('Paris');
  });

  test('sanitizes <a href=javascript:> in location field', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Marie',
        email: 'marie@test.com',
        phone: '+33222222222',
        location: XSS_A_HREF,
        password: validPassword,
      })
      .expect(201);

    expect(res.body.location).not.toContain('javascript');
    expect(res.body.location).not.toContain('<a');

    // Stored in DB
    const user = await User.findOne({ email: 'marie@test.com' });
    expect(user.location).not.toContain('javascript');
  });

  test('sanitizes multiple XSS payloads across all fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: XSS_SCRIPT,
        email: 'multi-xss@test.com',
        phone: '+33333333333',
        location: XSS_A_HREF,
        password: validPassword,
      })
      .expect(201);

    // All fields should be sanitized
    expect(res.body.name).not.toContain('<script>');
    expect(res.body.location).not.toContain('javascript');

    // DB check
    const user = await User.findOne({ email: 'multi-xss@test.com' });
    expect(user.name).not.toContain('<script>');
    expect(user.location).not.toContain('javascript');
    expect(user.phone).toBe('+33333333333');
  });

  test('rejects short password but preserves sanitization order (no crash)', async () => {
    // express-validator runs after xssSanitize, so the sanitized
    // values are what get validated
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: XSS_SCRIPT,
        email: 'weak@test.com',
        phone: '+33444444444',
        location: 'Paris',
        password: '123', // too short and missing uppercase/special
      })
      .expect(400);

    // The request is rejected before it hits the controller
    expect(res.body.message).toContain('Password');

    // No user should be created
    const user = await User.findOne({ email: 'weak@test.com' });
    expect(user).toBeNull();
  });

  test('allows clean text with French characters through', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'François L\'Oréal',
        email: 'francois@test.com',
        phone: '+33555555555',
        location: '12 Rue de l\'Église, Lyon',
        password: validPassword,
      })
      .expect(201);

    // Normal text with accents and quotes should work
    expect(res.body.name).toBe('François L&#x27;Oréal');  // single quote escaped
    expect(res.body.location).toBe('12 Rue de l&#x27;Église, Lyon');

    const user = await User.findOne({ email: 'francois@test.com' });
    expect(user).not.toBeNull();
    expect(user.name).toBe('François L&#x27;Oréal');
  });
});

// ── Tests: POST /api/orders ────────────────────────────────────────────────

describe('POST /api/orders — XSS sanitization', () => {
  const validOrder = {
    name: 'Client',
    email: 'client@test.com',
    phone: '+33600000000',
    location: 'Paris',
    items: [
      { perfumeId: 'perf-001', name: 'Rose Elixir', price: 85, quantity: 1 },
    ],
  };

  test('sanitizes XSS in customer name', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        ...validOrder,
        name: `Client ${XSS_SCRIPT}`,
      })
      .expect(201);

    expect(res.body.name).not.toContain('<script>');

    // Verify stored in DB
    const order = await Order.findOne({ email: 'client@test.com' });
    expect(order.name).not.toContain('<script>');
  });

  test('sanitizes XSS in location field', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        ...validOrder,
        location: XSS_A_HREF,
      })
      .expect(201);

    expect(res.body.location).not.toContain('javascript');
    expect(res.body.location).not.toContain('<a');

    // DB check
    const order = await Order.findOne({ email: 'client@test.com' });
    expect(order.location).not.toContain('javascript');
  });

  test('sanitizes XSS in item names', async () => {
    // Include safe text so item name is not empty after tag stripping
    const safeName = `${XSS_IMG}SafePerfume`;  // <img>...SafePerfume → stripped to 'SafePerfume'
    const res = await request(app)
      .post('/api/orders')
      .send({
        ...validOrder,
        items: [
          { perfumeId: 'perf-001', name: safeName, price: 85, quantity: 1 },
        ],
      })
      .expect(201);

    // The response only returns count of items, not their names
    // So we check the database directly
    const order = await Order.findOne({ email: 'client@test.com' });
    expect(order.items[0].name).not.toContain('<img');
    expect(order.items[0].name).not.toContain('onerror');
    expect(order.items[0].name).toBe('SafePerfume');
  });

  test('sanitizes XSS across multiple order fields', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        name: XSS_SCRIPT,
        email: 'multi-field@test.com',
        phone: '+33611111111',
        location: XSS_ONCLICK,
        items: [
          { perfumeId: 'perf-001', name: `${XSS_IMG}SafeItem`, price: 85, quantity: 2 },
          { perfumeId: 'perf-002', name: 'Safe Item', price: 50, quantity: 1 },
        ],
        discountCode: XSS_SCRIPT,
      })
      .expect(201);

    // DB check — all fields should be sanitized
    const order = await Order.findOne({ email: 'multi-field@test.com' });
    expect(order.name).not.toContain('<script>');
    expect(order.location).not.toContain('onclick');
    expect(order.items[0].name).not.toContain('onerror');
    expect(order.items[0].name).toBe('SafeItem');
    expect(order.items[1].name).toBe('Safe Item');
    expect(order.discountCode).toBe('alert(1)');  // script stripped, inner text preserved
  });

  test('allows clean order with special characters', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        name: 'Jean-Pierre & Fils',
        email: 'jp@test.com',
        phone: '+33622222222',
        location: 'Marseille',
        items: [
          { perfumeId: 'perf-003', name: 'Eau de Toilette 100ml', price: 65, quantity: 1 },
        ],
      })
      .expect(201);

    const order = await Order.findOne({ email: 'jp@test.com' });
    // The & gets escaped to &amp; by the sanitizer
    expect(order.name).toBe('Jean-Pierre &amp; Fils');
  });

  test('rejects invalid order fields (validation runs after sanitization)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        name: XSS_SCRIPT,
        email: 'bad-email',        // Will fail email validation
        phone: '+33633333333',
        location: 'Paris',
        items: [
          { perfumeId: 'perf-001', name: 'Test', price: -5, quantity: 0 }, // Negative price, zero quantity
        ],
      })
      .expect(400);

    // Validation errors should be returned
    expect(res.body.message).toContain('email');
    expect(res.body.message).toContain('quantity');

    // No order should be created
    const order = await Order.findOne({ email: 'bad-email' });
    expect(order).toBeNull();
  });

  test('unknown XSS payload does not break response shape', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        ...validOrder,
        email: 'schema-test@test.com',
        name: XSS_SCRIPT,
      })
      .expect(201);

    // The response should contain expected fields
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('status', 'pending');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('freeItemApplied', false);
  });
});

// ── Tests: Verify the full middleware pipeline ──────────────────────────────

describe('Full middleware pipeline — xssSanitize → validator → controller', () => {
  test('sanitized fields still pass express-validator length checks', async () => {
    // <b>Paris</b> is 11 chars but after sanitization becomes 5 chars 'Paris'
    // If the validator's .trim().isLength({max: 100}) runs AFTER sanitization,
    // it sees the shorter sanitized value and passes
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User',
        email: 'pipeline@test.com',
        phone: '+33644444444',
        location: XSS_BOLD,          // 11 chars raw, 5 chars after sanitization
        password: 'StrongPass1!',
      })
      .expect(201);

    expect(res.body.location).toBe(CLEAN_BOLD);

    const user = await User.findOne({ email: 'pipeline@test.com' });
    expect(user.location).toBe(CLEAN_BOLD);
  });

  test('XSS payload with inner text is stripped but still fits max length', async () => {
    // After stripping <script> tags, 60 'A's remain — well within the 100-char limit
    const longXss = '<script>' + 'A'.repeat(60) + '</script>';
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: longXss,               // Stripped to 'AAAA...' (60 chars)
        email: 'long-xss@test.com',
        phone: '+33655555555',
        location: 'Paris',
        password: 'StrongPass1!',
      })
      .expect(201);

    expect(res.body.name).not.toContain('<script>');
    expect(res.body.name.length).toBe(60);

    // DB check
    const user = await User.findOne({ email: 'long-xss@test.com' });
    expect(user.name).not.toContain('<script>');
    expect(user.name.length).toBe(60);
  });
});
