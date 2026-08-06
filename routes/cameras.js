const express = require('express');
const router = express.Router();
const { getCameras, createCamera, updateCamera, deleteCamera } = require('../controllers/cameraController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Get all cameras
router.get('/', authMiddleware, getCameras);

// Create camera
router.post('/', authMiddleware, requireRole(['admin', 'store_manager']), createCamera);

// Update camera
router.put('/:id', authMiddleware, requireRole(['admin', 'store_manager']), updateCamera);

// Delete camera
router.delete('/:id', authMiddleware, requireRole(['admin']), deleteCamera);

module.exports = router;
