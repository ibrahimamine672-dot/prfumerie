/**
 * Seed script — adds sample orders so the admin can test the Excel export.
 *
 * Usage:  node seed-orders.js
 *
 * This script:
 * - Connects to MongoDB using MONGODB_URI from .env
 * - Removes all existing orders
 * - Inserts 8 realistic test orders with different statuses, items, and dates
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

// ── Test Orders ────────────────────────────────────────────────────────────

const testOrders = [
  {
    name: 'Marie Lambert',
    email: 'marie.lambert@example.com',
    phone: '+33 6 11 22 33 44',
    location: '15 Rue de Rivoli, 75001 Paris',
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
    name: 'Lucas Moreau',
    email: 'lucas.m@example.com',
    phone: '+33 6 98 76 54 32',
    location: '8 Avenue des Champs-Élysées, 75008 Paris',
    items: [
      { perfumeId: 'perf-003', name: 'Vetiver Royal', price: 245, quantity: 2, size: '100ml', image: '' },
      { perfumeId: 'perf-005', name: 'Ombre Sauvage', price: 195, quantity: 1, size: '100ml', image: '' },
    ],
    subtotal: 685,
    shipping: 0,
    total: 685,
    status: 'shipped',
    createdAt: new Date('2026-06-15T14:45:00Z'),
    updatedAt: new Date('2026-06-16T09:00:00Z'),
  },
  {
    name: 'Sophie Bernard',
    email: 'sophie.b@example.com',
    phone: '+33 7 55 44 33 22',
    location: '3 Place Bellecour, 69002 Lyon',
    items: [
      { perfumeId: 'perf-002', name: 'Lumière Dorée', price: 320, quantity: 1, size: '75ml', image: '' },
    ],
    subtotal: 320,
    shipping: 0,
    discountCode: 'WELCOME15',
    discountPercent: 15,
    discountAmount: 48,
    total: 272,
    status: 'confirmed',
    createdAt: new Date('2026-06-20T09:15:00Z'),
    updatedAt: new Date('2026-06-20T09:16:00Z'),
  },
  {
    name: 'Thomas Petit',
    email: 'thomas.p@example.com',
    phone: '',
    location: '27 Rue Saint-Ferréol, 13001 Marseille',
    items: [
      { perfumeId: 'perf-004', name: 'Rose Éternelle', price: 350, quantity: 1, size: '50ml', image: '' },
      { perfumeId: 'perf-009', name: 'Velvet Midnight', price: 225, quantity: 1, size: '100ml', image: '' },
    ],
    subtotal: 575,
    shipping: 0,
    total: 575,
    status: 'pending',
    createdAt: new Date('2026-06-28T16:30:00Z'),
    updatedAt: new Date('2026-06-28T16:30:00Z'),
  },
  {
    name: 'Camille Dubois',
    email: 'camille.d@example.com',
    phone: '+33 6 44 55 66 77',
    location: '12 Rue Sainte-Catherine, 33000 Bordeaux',
    items: [
      { perfumeId: 'perf-006', name: 'Santal Céleste', price: 275, quantity: 3, size: '75ml', image: '' },
    ],
    subtotal: 825,
    shipping: 0,
    total: 825,
    status: 'pending',
    createdAt: new Date('2026-07-01T11:00:00Z'),
    updatedAt: new Date('2026-07-01T11:00:00Z'),
  },
  {
    name: 'Hugo Leclerc',
    email: 'hugo.l@example.com',
    phone: '+33 7 88 99 00 11',
    location: '5 Rue de la République, 69001 Lyon',
    items: [
      { perfumeId: 'perf-007', name: 'Nuit Blanche', price: 310, quantity: 1, size: '100ml', image: '' },
      { perfumeId: 'perf-008', name: 'Ambre Impérial', price: 395, quantity: 1, size: '50ml', image: '' },
      { perfumeId: 'perf-001', name: 'Noir Absolu', price: 285, quantity: 1, size: '100ml', image: '' },
    ],
    subtotal: 990,
    shipping: 0,
    total: 990,
    status: 'delivered',
    createdAt: new Date('2026-05-10T08:00:00Z'),
    updatedAt: new Date('2026-05-15T17:00:00Z'),
  },
  {
    name: 'Emma Fontaine',
    email: 'emma.f@example.com',
    phone: '+33 6 22 33 44 55',
    location: '42 Rue de la Paix, 75002 Paris',
    items: [
      { perfumeId: 'perf-009', name: 'Velvet Midnight', price: 225, quantity: 2, size: '100ml', image: '' },
    ],
    subtotal: 450,
    shipping: 0,
    total: 450,
    status: 'cancelled',
    createdAt: new Date('2026-06-10T13:20:00Z'),
    updatedAt: new Date('2026-06-11T10:00:00Z'),
  },
  {
    name: 'Antoine Rousseau',
    email: 'antoine.r@example.com',
    phone: '+33 7 66 77 88 99',
    location: '18 Rue du Faubourg Saint-Honoré, 75008 Paris',
    items: [
      { perfumeId: 'perf-002', name: 'Lumière Dorée', price: 320, quantity: 1, size: '75ml', image: '' },
      { perfumeId: 'perf-004', name: 'Rose Éternelle', price: 350, quantity: 1, size: '50ml', image: '' },
      { perfumeId: 'perf-006', name: 'Santal Céleste', price: 275, quantity: 1, size: '75ml', image: '' },
    ],
    subtotal: 945,
    shipping: 0,
    total: 945,
    status: 'delivered',
    createdAt: new Date('2026-04-22T15:10:00Z'),
    updatedAt: new Date('2026-04-28T12:00:00Z'),
  },
];

// ── Main ───────────────────────────────────────────────────────────────────

async function seedOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    const deleted = await Order.deleteMany({});
    console.log(`🗑️  Removed ${deleted.deletedCount} existing orders`);

    const created = await Order.insertMany(testOrders);
    console.log(`✅ Inserted ${created.length} test orders`);

    // Print summary
    const counts = {};
    testOrders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    console.log('📊 Status breakdown:', counts);
    console.log('📅 Date range:', testOrders[testOrders.length - 1].createdAt.toISOString().split('T')[0], '→', testOrders[0].createdAt.toISOString().split('T')[0]);

    await mongoose.disconnect();
    console.log('✅ Seeding complete — you can now export orders to Excel');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedOrders();
