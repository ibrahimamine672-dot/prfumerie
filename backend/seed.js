require('dotenv').config();
const mongoose = require('mongoose');
const Perfume = require('./models/Perfume');
const User = require('./models/User');

const perfumes = [
  {
    name: "Noir Absolu",
    brand: "MAISON DORÉE",
    price: 285,
    category: "Eau de Parfum",
    gender: "Unisex",
    image: "/images/perfumes/noir-absolu.jpg",
    description: "A captivating blend of dark oud and smoky vanilla that envelops you in an aura of mystery and sophistication.",
    notes: {
      top: ["Black Pepper", "Bergamot", "Cardamom"],
      middle: ["Rose", "Iris", "Incense"],
      base: ["Oud", "Vanilla", "Sandalwood"]
    },
    size: "100ml",
    bestseller: true,
    stock: 25
  },
  {
    name: "Lumière Dorée",
    brand: "MAISON DORÉE",
    price: 320,
    category: "Parfum",
    gender: "Women",
    image: "/images/perfumes/lumiere-doree.jpg",
    description: "Liquid gold captured in a bottle. This opulent fragrance radiates warmth and feminine power.",
    notes: {
      top: ["Neroli", "Pink Pepper", "Mandarin"],
      middle: ["Jasmine", "Ylang Ylang", "Gardenia"],
      base: ["Amber", "Musk", "Tonka Bean"]
    },
    size: "75ml",
    bestseller: true,
    stock: 18
  },
  {
    name: "Vetiver Royal",
    brand: "MAISON DORÉE",
    price: 245,
    category: "Eau de Toilette",
    gender: "Men",
    image: "/images/perfumes/vetiver-royal.jpg",
    description: "An aristocratic composition of earthy vetiver and crisp citrus, refined for the modern gentleman.",
    notes: {
      top: ["Grapefruit", "Lemon", "Mint"],
      middle: ["Vetiver", "Cedar", "Lavender"],
      base: ["Bergamot", "Amber", "Oakmoss"]
    },
    size: "100ml",
    bestseller: false,
    stock: 30
  },
  {
    name: "Rose Éternelle",
    brand: "MAISON DORÉE",
    price: 350,
    category: "Parfum",
    gender: "Women",
    image: "/images/perfumes/rose-eternelle.jpg",
    description: "The rarest roses from Grasse distilled into an immortal elixir of romance and elegance.",
    notes: {
      top: ["Lychee", "Peony", "Raspberry"],
      middle: ["Rose de Mai", "Peony", "Lily"],
      base: ["Patchouli", "White Musk", "Amber"]
    },
    size: "50ml",
    bestseller: true,
    stock: 12
  },
  {
    name: "Ombre Sauvage",
    brand: "MAISON DORÉE",
    price: 195,
    category: "Eau de Parfum",
    gender: "Men",
    image: "/images/perfumes/ombre-sauvage.jpg",
    description: "Born of shadow and flame. A bold, smoky composition for those who dare to be remembered.",
    notes: {
      top: ["Black Pepper", "Saffron", "Bitter Orange"],
      middle: ["Leather", "Tobacco", "Black Tea"],
      base: ["Smoky Vetiver", "Benzoin", "Labdanum"]
    },
    size: "100ml",
    bestseller: false,
    stock: 22
  },
  {
    name: "Santal Céleste",
    brand: "MAISON DORÉE",
    price: 275,
    category: "Eau de Parfum",
    gender: "Unisex",
    image: "/images/perfumes/santal-celeste.jpg",
    description: "A celestial journey through sacred sandalwood groves, grounded by creamy cashmere and amber.",
    notes: {
      top: ["Pink Pepper", "Cardamom", "Almond"],
      middle: ["Sandalwood", "Jasmine", "Orris"],
      base: ["Cashmeran", "Amber", "Vanilla"]
    },
    size: "75ml",
    bestseller: true,
    stock: 20
  },
  {
    name: "Nuit Blanche",
    brand: "MAISON DORÉE",
    price: 310,
    category: "Eau de Parfum",
    gender: "Unisex",
    image: "/images/perfumes/nuit-blanche.jpg",
    description: "An all-night affair of intoxicating white flowers and luminous aldehydes.",
    notes: {
      top: ["Aldehyde", "Bergamot", "Pear"],
      middle: ["Tuberose", "Magnolia", "Orange Blossom"],
      base: ["Cedar", "Musk", "Ambroxan"]
    },
    size: "100ml",
    bestseller: false,
    stock: 15
  },
  {
    name: "Ambre Impérial",
    brand: "MAISON DORÉE",
    price: 395,
    category: "Parfum",
    gender: "Unisex",
    image: "/images/perfumes/ambre-imperial.jpg",
    description: "Imperial amber, rare resins, and ancient woods compose a fragrance of unmatched opulence.",
    notes: {
      top: ["Cinnamon", "Clove", "Orange"],
      middle: ["Amber", "Frankincense", "Myrrh"],
      base: ["Oud", "Benzoin", "Labdanum"]
    },
    size: "50ml",
    bestseller: true,
    stock: 8
  },
  {
    name: "Velvet Midnight",
    brand: "MAISON DORÉE",
    price: 225,
    category: "Eau de Parfum",
    gender: "Men",
    image: "/images/perfumes/9pm.jpg",
    description: "A magnetic evening fragrance that commands attention. Dark vanilla and amber create an irresistible aura of confidence.",
    notes: {
      top: ["Lavender", "Bergamot", "Bitter Almond"],
      middle: ["Vanilla", "Orange Blossom", "Cinnamon"],
      base: ["Amber", "Tonka Bean", "Musk"]
    },
    size: "100ml",
    bestseller: false,
    stock: 28
  }
];

const adminUser = {
  name: "Admin",
  email: "admin@parfum.com",
  password: "admin123",
  role: "admin"
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    await Perfume.deleteMany({});
    await User.deleteMany({});

    const createdPerfumes = await Perfume.insertMany(perfumes);
    console.log(`${createdPerfumes.length} perfumes seeded`);

    await User.create(adminUser);
    console.log('Admin user created (admin@parfum.com / admin123)');

    await mongoose.disconnect();
    console.log('Seeding complete');
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
