const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getCurrentUser, 
  updateProfile,
  listUsers,
  createUserAdmin,
  updateUserAdmin,
  toggleUserStatusAdmin,
  deleteUserAdmin
} = require('../controllers/authController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes  
router.get('/me', authMiddleware, getCurrentUser);
router.put('/profile', authMiddleware, updateProfile);

// Admin User Management routes
router.get('/users', authMiddleware, requireRole(['admin']), listUsers);
router.post('/users', authMiddleware, requireRole(['admin']), createUserAdmin);
router.put('/users/:id', authMiddleware, requireRole(['admin']), updateUserAdmin);
router.put('/users/:id/status', authMiddleware, requireRole(['admin']), toggleUserStatusAdmin);
router.delete('/users/:id', authMiddleware, requireRole(['admin']), deleteUserAdmin);

module.exports = router;