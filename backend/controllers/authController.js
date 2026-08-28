const User = require('../models/User');
const { generateToken } = require('../config/jwt');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');

// Register new user
const register = async (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      full_name,
      role: role || 'store_manager'
    });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const loginIdentifier = email || username;

    // Find user
    const user = await User.findOne({ 
      where: { 
        [Op.or]: [{ username: loginIdentifier }, { email: loginIdentifier }]
      } 
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'full_name', 'phone', 'role', 'is_active', 'last_login', 'created_at']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user'
    });
  }
};

// Update current user profile
const updateProfile = async (req, res) => {
  try {
    const { full_name, email, phone } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Optional: check if new email is already taken by another user
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another account'
        });
      }
    }

    // Update fields
    if (full_name) user.full_name = full_name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone; // Allow clearing phone

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
};

// Admin user management controllers
const listUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'full_name', 'phone', 'role', 'is_active', 'last_login', 'created_at']
    });
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to list users'
    });
  }
};

const createUserAdmin = async (req, res) => {
  try {
    const { full_name, email, role, password } = req.body;
    const roleMap = {
      'admin': 'admin',
      'administrator': 'admin',
      'store_manager': 'store_manager',
      'store manager': 'store_manager',
      'retail_analyst': 'retail_analyst',
      'retail analyst': 'retail_analyst',
      'marketing_manager': 'marketing_manager',
      'marketing manager': 'marketing_manager'
    };
    const dbRole = roleMap[role.toLowerCase().trim()] || 'store_manager';

    const username = email;

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    const user = await User.create({
      username,
      email,
      password: password || 'CamsPassword123!',
      full_name,
      role: dbRole,
      is_active: true
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          is_active: user.is_active
        }
      }
    });
  } catch (error) {
    console.error('Create user admin error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create user'
    });
  }
};

const updateUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use'
        });
      }
      user.email = email;
      user.username = email;
    }

    if (full_name) user.full_name = full_name;
    
    if (role) {
      const roleMap = {
        'admin': 'admin',
        'administrator': 'admin',
        'store_manager': 'store_manager',
        'store manager': 'store_manager',
        'retail_analyst': 'retail_analyst',
        'retail analyst': 'retail_analyst',
        'marketing_manager': 'marketing_manager',
        'marketing manager': 'marketing_manager'
      };
      user.role = roleMap[role.toLowerCase().trim()] || user.role;
    }

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          is_active: user.is_active
        }
      }
    });
  } catch (error) {
    console.error('Update user admin error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user'
    });
  }
};

const toggleUserStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.is_active = !user.is_active;
    await user.save();

    res.json({
      success: true,
      message: `User status changed to ${user.is_active ? 'Active' : 'Inactive'}`,
      data: {
        user: {
          id: user.id,
          is_active: user.is_active
        }
      }
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle user status'
    });
  }
};

const deleteUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Safety check: Don't allow deleting yourself
    if (req.user && parseInt(id) === parseInt(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own administrator account'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete user'
    });
  }
};

module.exports = { 
  register, 
  login, 
  getCurrentUser, 
  updateProfile,
  listUsers,
  createUserAdmin,
  updateUserAdmin,
  toggleUserStatusAdmin,
  deleteUserAdmin
};