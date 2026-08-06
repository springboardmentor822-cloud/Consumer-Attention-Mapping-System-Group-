const Store = require('../models/Store');

// Get all stores
const getStores = async (req, res) => {
  try {
    const where = {};
    
    // Store managers can only see their stores
    if (req.user.role === 'store_manager') {
      where.manager_id = req.user.id;
    }
    
    const stores = await Store.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: stores
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch stores'
    });
  }
};

// Create store
const createStore = async (req, res) => {
  try {
    // Check if store_id exists
    const existingStore = await Store.findOne({
      where: { store_id: req.body.store_id }
    });
    
    if (existingStore) {
      return res.status(400).json({
        success: false,
        message: 'Store ID already exists'
      });
    }

    const storeData = {
      ...req.body,
      manager_id: req.user.role === 'admin' ? req.body.manager_id : req.user.id
    };

    const store = await Store.create(storeData);

    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      data: store
    });
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create store'
    });
  }
};

// Update store
const updateStore = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check permission
    if (req.user.role === 'store_manager' && store.manager_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await store.update({
      ...req.body,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Store updated successfully',
      data: store
    });
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update store'
    });
  }
};

// Delete store
const deleteStore = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    await store.destroy();

    res.json({
      success: true,
      message: 'Store deleted successfully'
    });
  } catch (error) {
    console.error('Delete store error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete store'
    });
  }
};

module.exports = { getStores, createStore, updateStore, deleteStore };
