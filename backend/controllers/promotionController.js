const Promotion = require('../models/promotion');

// Get all promotions
const getPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.findAll({
      order: [['id', 'ASC']]
    });
    res.json({
      success: true,
      data: promotions
    });
  } catch (error) {
    console.error('Get promotions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch promotions'
    });
  }
};

// Create a promotion
const createPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Promotion created successfully',
      data: promotion
    });
  } catch (error) {
    console.error('Create promotion error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create promotion'
    });
  }
};

// Update a promotion
const updatePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findOne({ where: { promo_id: req.params.id } }) || await Promotion.findByPk(req.params.id);
    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion not found' });
    }
    await promotion.update(req.body);
    res.json({
      success: true,
      message: 'Promotion updated successfully',
      data: promotion
    });
  } catch (error) {
    console.error('Update promotion error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update promotion'
    });
  }
};

// Delete a promotion
const deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findOne({ where: { promo_id: req.params.id } }) || await Promotion.findByPk(req.params.id);
    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion not found' });
    }
    await promotion.destroy();
    res.json({
      success: true,
      message: 'Promotion deleted successfully'
    });
  } catch (error) {
    console.error('Delete promotion error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete promotion'
    });
  }
};

module.exports = {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion
};
