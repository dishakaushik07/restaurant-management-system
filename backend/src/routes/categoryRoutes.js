const express = require('express');
const router = express.Router();

const { createCategory, getCategories, updateCategory, deleteCategory } = require('../controllers/categoryController');


// POST /api/menu/categories

router.post('/', createCategory);

// GET /api/menu/categories
router.get('/', getCategories);

// PUT /api/menu/categories/:id
router.put('/:id', updateCategory);

// DELETE /api/menu/categories/:id
router.delete('/:id', deleteCategory);

module.exports = router;