const Perfume = require('../models/Perfume');

exports.getPerfumes = async (req, res) => {
  try {
    const { category, gender, minPrice, maxPrice, search, bestseller, sort, page = 1, limit = 12 } = req.query;

    const query = { active: true };

    if (category && category !== 'All') query.category = category;
    if (gender && gender !== 'All') query.gender = gender;
    if (bestseller === 'true') query.bestseller = true;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }

    const sortOptions = {};
    if (sort === 'price-asc') sortOptions.price = 1;
    else if (sort === 'price-desc') sortOptions.price = -1;
    else if (sort === 'newest') sortOptions.createdAt = -1;
    else sortOptions.createdAt = -1;

    const skip = (Number(page) - 1) * Number(limit);

    const [perfumes, total] = await Promise.all([
      Perfume.find(query).sort(sortOptions).skip(skip).limit(Number(limit)),
      Perfume.countDocuments(query)
    ]);

    res.json({
      perfumes,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPerfumeById = async (req, res) => {
  try {
    const perfume = await Perfume.findById(req.params.id);
    if (!perfume) {
      return res.status(404).json({ message: 'Perfume not found' });
    }
    res.json(perfume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPerfume = async (req, res) => {
  try {
    const perfume = await Perfume.create(req.body);
    res.status(201).json(perfume);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updatePerfume = async (req, res) => {
  try {
    const perfume = await Perfume.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!perfume) {
      return res.status(404).json({ message: 'Perfume not found' });
    }
    res.json(perfume);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deletePerfume = async (req, res) => {
  try {
    const perfume = await Perfume.findByIdAndDelete(req.params.id);
    if (!perfume) {
      return res.status(404).json({ message: 'Perfume not found' });
    }
    res.json({ message: 'Perfume removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBestsellers = async (req, res) => {
  try {
    const perfumes = await Perfume.find({ bestseller: true, active: true }).limit(6);
    res.json(perfumes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
