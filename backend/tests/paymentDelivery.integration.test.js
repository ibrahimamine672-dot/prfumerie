const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');

const {
  setupTestEnvironment,
  teardownTestEnvironment,
} = require('./testUtils');

process.env.ADMIN_EMAIL = 'payments-admin@example.com';
process.env.ADMIN_PASSWORD = 'payments-admin-password';
process.env.ADMIN_NAME = 'Payments Admin';
process.env.ADMIN_PHONE = '+212600000000';
process.env.ADMIN_LOCATION = 'Casablanca';

const User = require('../models/User');
const Order = require('../models/Order');

let mongoServer;
let app;
let adminToken;
let regularUserToken;

const orderPayload = (paymentMethod, overrides = {}) => ({
  name: 'Sara Amrani',
  email: `sara-${paymentMethod}-${Date.now()}@example.com`,
  phone: '+212611223344',
  location: '12 Rue des Fleurs, Casablanca 20000',
  delivery: {
    fullName: 'Sara Amrani',
    phone: '+212611223344',
    address: '12 Rue des Fleurs',
    city: 'Casablanca',
    postalCode: '20000',
    deliveryMethod: 'standard',
    ...overrides.delivery,
  },
  payment: { method: paymentMethod },
  items: overrides.items || [
    {
      perfumeId: 'perfume-demo',
      name: 'Noir Absolu',
      price: 200,
      quantity: 2,
      size: '100ml',
      image: '',
    },
  ],
});

beforeAll(async () => {
  ({ mongoServer } = await setupTestEnvironment());

  const admin = await User.create({
    name: 'Payments Admin',
    email: process.env.ADMIN_EMAIL,
    phone: '+212600000000',
    location: 'Casablanca',
    password: process.env.ADMIN_PASSWORD,
    role: 'admin',
  });
  const regularUser = await User.create({
    name: 'Regular User',
    email: 'payments-user@example.com',
    phone: '+212600000001',
    location: 'Rabat',
    password: 'regular-user-password',
    role: 'user',
  });

  adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);
  regularUserToken = jwt.sign({ id: regularUser._id }, process.env.JWT_SECRET);
  app = require('../server');
}, 30000);

afterAll(async () => {
  await teardownTestEnvironment({ mongoServer });
});

describe('Payment and delivery orders', () => {
  test('creates cash on delivery with pending payment and server totals', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send(orderPayload('cash_on_delivery'))
      .expect(201);

    expect(response.body.productsPrice).toBe(400);
    expect(response.body.deliveryPrice).toBe(20);
    expect(response.body.totalPrice).toBe(420);
    expect(response.body.payment).toMatchObject({
      method: 'cash_on_delivery',
      status: 'pending',
      amount: 420,
      transactionId: null,
    });
    expect(response.body.delivery).toMatchObject({
      city: 'Casablanca',
      deliveryMethod: 'standard',
      deliveryPrice: 20,
      status: 'pending',
    });
  });

  test('creates a paid fake card transaction without card data', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send(orderPayload('card_fake', {
        delivery: { deliveryMethod: 'express' },
      }))
      .expect(201);

    expect(response.body.deliveryPrice).toBe(40);
    expect(response.body.totalPrice).toBe(440);
    expect(response.body.payment.status).toBe('paid');
    expect(response.body.payment.transactionId).toMatch(/^CARD-FAKE-/);
    expect(response.body.payment.paidAt).toBeTruthy();

    const savedOrder = await Order.findById(response.body._id).lean();
    expect(JSON.stringify(savedOrder)).not.toMatch(/cardNumber|cvv|cardHolder/i);
  });

  test('creates a paid fake PayPal transaction and grants free delivery at 500 MAD', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send(orderPayload('paypal_fake', {
        delivery: { deliveryMethod: 'express' },
        items: [{
          perfumeId: 'perfume-demo',
          name: 'Ambre Impérial',
          price: 500,
          quantity: 1,
          size: '50ml',
          image: '',
        }],
      }))
      .expect(201);

    expect(response.body.productsPrice).toBe(500);
    expect(response.body.deliveryPrice).toBe(0);
    expect(response.body.totalPrice).toBe(500);
    expect(response.body.payment.status).toBe('paid');
    expect(response.body.payment.transactionId).toMatch(/^PAYPAL-FAKE-/);
  });

  test('shows payment and delivery details in admin orders', async () => {
    const response = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.orders).toHaveLength(3);
    expect(response.body.orders[0]).toHaveProperty('payment.method');
    expect(response.body.orders[0]).toHaveProperty('delivery.address');
    expect(response.body.orders[0]).toHaveProperty('totalPrice');
  });

  test('allows admin to update fulfillment fields', async () => {
    const order = await Order.findOne();
    const estimatedDate = '2026-08-15';
    const response = await request(app)
      .patch(`/api/admin/orders/${order._id}/fulfillment`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        paymentStatus: 'paid',
        deliveryStatus: 'shipped',
        trackingNumber: 'MA-TRACK-123',
        estimatedDeliveryDate: estimatedDate,
      })
      .expect(200);

    expect(response.body.payment.status).toBe('paid');
    expect(response.body.delivery.status).toBe('shipped');
    expect(response.body.delivery.trackingNumber).toBe('MA-TRACK-123');
    expect(response.body.delivery.estimatedDeliveryDate).toContain(estimatedDate);
  });

  test('rejects fulfillment updates from a non-admin user', async () => {
    const order = await Order.findOne();
    await request(app)
      .patch(`/api/admin/orders/${order._id}/fulfillment`)
      .set('Authorization', `Bearer ${regularUserToken}`)
      .send({ deliveryStatus: 'delivered' })
      .expect(403);
  });

  test('exports fulfillment columns without authentication or card secrets', async () => {
    const response = await request(app)
      .get('/api/admin/orders/export')
      .set('Authorization', `Bearer ${adminToken}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(response.body);
    const worksheet = workbook.getWorksheet('Commandes');
    const headers = worksheet.getRow(1).values.slice(1);

    expect(headers).toEqual([
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
    ]);
    expect(headers.join(' ').toLowerCase()).not.toMatch(/password|token|hash|card number|cvv/);
  });
});
