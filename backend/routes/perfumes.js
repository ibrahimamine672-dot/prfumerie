const express = require('express');
const router = express.Router();
const {
  getPerfumes,
  getPerfumeById,
  createPerfume,
  updatePerfume,
  deletePerfume,
  getBestsellers
} = require('../controllers/perfumeController');
const { protect, admin } = require('../middleware/auth');
const { createPerfumeValidation, updatePerfumeValidation, deletePerfumeValidation } = require('../middleware/validation');

router.get('/bestsellers', getBestsellers);
router.get('/', getPerfumes);
router.get('/:id', getPerfumeById);

router.post('/', protect, admin, createPerfumeValidation, createPerfume);
router.put('/:id', protect, admin, updatePerfumeValidation, updatePerfume);
router.delete('/:id', protect, admin, deletePerfumeValidation, deletePerfume);

module.exports = router;
