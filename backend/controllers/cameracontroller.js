const Camera = require('../models/Camera');
const Store = require('../models/Store');

// Get all cameras
const getCameras = async (req, res) => {
  try {
    let where = {};
    
    if (req.user.role === 'store_manager') {
      const stores = await Store.findAll({
        where: { manager_id: req.user.id },
        attributes: ['id']
      });
      const storeIds = stores.map(s => s.id);
      where.store_id = storeIds;
    }

    const cameras = await Camera.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: cameras
    });
  } catch (error) {
    console.error('Get cameras error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch cameras'
    });
  }
};

// Create camera
const createCamera = async (req, res) => {
  try {
    const store = await Store.findByPk(req.body.store_id);
    
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

    // Check if camera_id exists
    const existingCamera = await Camera.findOne({
      where: { camera_id: req.body.camera_id }
    });
    
    if (existingCamera) {
      return res.status(400).json({
        success: false,
        message: 'Camera ID already exists'
      });
    }

    const camera = await Camera.create({
      ...req.body,
      fps: req.body.fps || 5 // Default to 5 FPS
    });

    res.status(201).json({
      success: true,
      message: 'Camera added successfully',
      data: camera
    });
  } catch (error) {
    console.error('Create camera error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add camera'
    });
  }
};

// Update camera
const updateCamera = async (req, res) => {
  try {
    const camera = await Camera.findByPk(req.params.id);
    
    if (!camera) {
      return res.status(404).json({
        success: false,
        message: 'Camera not found'
      });
    }

    const store = await Store.findByPk(camera.store_id);
    if (req.user.role === 'store_manager' && store.manager_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await camera.update({
      ...req.body,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Camera updated successfully',
      data: camera
    });
  } catch (error) {
    console.error('Update camera error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update camera'
    });
  }
};

// Delete camera
const deleteCamera = async (req, res) => {
  try {
    const camera = await Camera.findByPk(req.params.id);
    
    if (!camera) {
      return res.status(404).json({
        success: false,
        message: 'Camera not found'
      });
    }

    await camera.destroy();

    res.json({
      success: true,
      message: 'Camera deleted successfully'
    });
  } catch (error) {
    console.error('Delete camera error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete camera'
    });
  }
};

module.exports = { getCameras, createCamera, updateCamera, deleteCamera };