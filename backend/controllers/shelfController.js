const Shelf = require('../models/shelf');

// Get all shelves
const getShelves = async (req, res) => {
  try {
    const shelves = await Shelf.findAll({
      order: [['id', 'ASC']]
    });
    res.json({
      success: true,
      data: shelves
    });
  } catch (error) {
    console.error('Get shelves error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch shelves'
    });
  }
};

// Create a shelf
const createShelf = async (req, res) => {
  try {
    const shelf = await Shelf.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Shelf created successfully',
      data: shelf
    });
  } catch (error) {
    console.error('Create shelf error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create shelf'
    });
  }
};

// Update a shelf
const updateShelf = async (req, res) => {
  try {
    const shelf = await Shelf.findOne({ where: { shelf_id: req.params.id } }) || await Shelf.findByPk(req.params.id);
    if (!shelf) {
      return res.status(404).json({ success: false, message: 'Shelf not found' });
    }
    await shelf.update(req.body);
    res.json({
      success: true,
      message: 'Shelf updated successfully',
      data: shelf
    });
  } catch (error) {
    console.error('Update shelf error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update shelf'
    });
  }
};

// Delete a shelf
const deleteShelf = async (req, res) => {
  try {
    const shelf = await Shelf.findOne({ where: { shelf_id: req.params.id } }) || await Shelf.findByPk(req.params.id);
    if (!shelf) {
      return res.status(404).json({ success: false, message: 'Shelf not found' });
    }
    await shelf.destroy();
    res.json({
      success: true,
      message: 'Shelf deleted successfully'
    });
  } catch (error) {
    console.error('Delete shelf error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete shelf'
    });
  }
};

module.exports = {
  getShelves,
  createShelf,
  updateShelf,
  deleteShelf
};
