export const perfumes = [
  {
    id: 1,
    name: "Noir Absolu",
    brand: "MAISON DORÉE",
    price: 285,
    category: "Eau de Parfum",
    gender: "Unisex",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=800&fit=crop",
    description: "A captivating blend of dark oud and smoky vanilla that envelops you in an aura of mystery and sophistication.",
    notes: {
      top: ["Black Pepper", "Bergamot", "Cardamom"],
      middle: ["Rose", "Iris", "Incense"],
      base: ["Oud", "Vanilla", "Sandalwood"]
    },
    size: "100ml",
    bestseller: true
  },
  {
    id: 2,
    name: "Lumière Dorée",
    brand: "MAISON DORÉE",
    price: 320,
    category: "Parfum",
    gender: "Women",
    image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=600&h=800&fit=crop",
    description: "Liquid gold captured in a bottle. This opulent fragrance radiates warmth and feminine power.",
    notes: {
      top: ["Neroli", "Pink Pepper", "Mandarin"],
      middle: ["Jasmine", "Ylang Ylang", "Gardenia"],
      base: ["Amber", "Musk", "Tonka Bean"]
    },
    size: "75ml",
    bestseller: true
  },
  {
    id: 3,
    name: "Vetiver Royal",
    brand: "MAISON DORÉE",
    price: 245,
    category: "Eau de Toilette",
    gender: "Men",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&h=800&fit=crop",
    description: "An aristocratic composition of earthy vetiver and crisp citrus, refined for the modern gentleman.",
    notes: {
      top: ["Grapefruit", "Lemon", "Mint"],
      middle: ["Vetiver", "Cedar", "Lavender"],
      base: ["Bergamot", "Amber", "Oakmoss"]
    },
    size: "100ml",
    bestseller: false
  },
  {
    id: 4,
    name: "Rose Éternelle",
    brand: "MAISON DORÉE",
    price: 350,
    category: "Parfum",
    gender: "Women",
    image: "https://images.unsplash.com/photo-1594035910387-fbcdb8cb85e0?w=600&h=800&fit=crop",
    description: "The rarest roses from Grasse distilled into an immortal elixir of romance and elegance.",
    notes: {
      top: ["Lychee", "Peony", "Raspberry"],
      middle: ["Rose de Mai", "Peony", "Lily"],
      base: ["Patchouli", "White Musk", "Amber"]
    },
    size: "50ml",
    bestseller: true
  },
  {
    id: 5,
    name: "Ombre Sauvage",
    brand: "MAISON DORÉE",
    price: 195,
    category: "Eau de Parfum",
    gender: "Men",
    image: "https://images.unsplash.com/photo-1595535873420-a599195b3f4a?w=600&h=800&fit=crop",
    description: "Born of shadow and flame. A bold, smoky composition for those who dare to be remembered.",
    notes: {
      top: ["Black Pepper", "Saffron", "Bitter Orange"],
      middle: ["Leather", "Tobacco", "Black Tea"],
      base: ["Smoky Vetiver", "Benzoin", "Labdanum"]
    },
    size: "100ml",
    bestseller: false
  },
  {
    id: 6,
    name: "Santal Céleste",
    brand: "MAISON DORÉE",
    price: 275,
    category: "Eau de Parfum",
    gender: "Unisex",
    image: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=600&h=800&fit=crop",
    description: "A celestial journey through sacred sandalwood groves, grounded by creamy cashmere and amber.",
    notes: {
      top: ["Pink Pepper", "Cardamom", "Almond"],
      middle: ["Sandalwood", "Jasmine", "Orris"],
      base: ["Cashmeran", "Amber", "Vanilla"]
    },
    size: "75ml",
    bestseller: true
  },
  {
    id: 7,
    name: "Nuit Blanche",
    brand: "MAISON DORÉE",
    price: 310,
    category: "Eau de Parfum",
    gender: "Unisex",
    image: "https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=600&h=800&fit=crop",
    description: "An all-night affair of intoxicating white flowers and luminous aldehydes.",
    notes: {
      top: ["Aldehyde", "Bergamot", "Pear"],
      middle: ["Tuberose", "Magnolia", "Orange Blossom"],
      base: ["Cedar", "Musk", "Ambroxan"]
    },
    size: "100ml",
    bestseller: false
  },
  {
    id: 8,
    name: "Ambre Impérial",
    brand: "MAISON DORÉE",
    price: 395,
    category: "Parfum",
    gender: "Unisex",
    image: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=600&h=800&fit=crop",
    description: "Imperial amber, rare resins, and ancient woods compose a fragrance of unmatched opulence.",
    notes: {
      top: ["Cinnamon", "Clove", "Orange"],
      middle: ["Amber", "Frankincense", "Myrrh"],
      base: ["Oud", "Benzoin", "Labdanum"]
    },
    size: "50ml",
    bestseller: true
  }
];

export const categories = ["All", "Eau de Parfum", "Eau de Toilette", "Parfum"];
export const genders = ["All", "Men", "Women", "Unisex"];
export const priceRanges = [
  { label: "All", min: 0, max: Infinity },
  { label: "Under $250", min: 0, max: 250 },
  { label: "$250 - $350", min: 250, max: 350 },
  { label: "Over $350", min: 350, max: Infinity }
];
