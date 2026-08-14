const express = require('express');
const router = express.Router();
const { getStores, createStore, updateStore, deleteStore } = require('../controllers/storeController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Get all stores
router.get('/', getStores);

// Create store
router.post('/', authMiddleware, requireRole(['admin', 'store_manager']), createStore);

// Update store
router.put('/:id', authMiddleware, requireRole(['admin', 'store_manager']), updateStore);

// Delete store
router.delete('/:id', authMiddleware, requireRole(['admin']), deleteStore);

module.exports = router;