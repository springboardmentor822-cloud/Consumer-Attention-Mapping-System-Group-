const Zone = require('../models/zone');

// Get all zones
const getZones = async (req, res) => {
  try {
    const zones = await Zone.findAll({
      order: [['id', 'ASC']]
    });
    res.json({
      success: true,
      data: zones
    });
  } catch (error) {
    console.error('Get zones error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch zones'
    });
  }
};

// Create a zone
const createZone = async (req, res) => {
  try {
    const zone = await Zone.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Zone created successfully',
      data: zone
    });
  } catch (error) {
    console.error('Create zone error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create zone'
    });
  }
};

// Update a zone
const updateZone = async (req, res) => {
  try {
    const zone = await Zone.findOne({ where: { zone_id: req.params.id } }) || await Zone.findByPk(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }
    await zone.update(req.body);
    res.json({
      success: true,
      message: 'Zone updated successfully',
      data: zone
    });
  } catch (error) {
    console.error('Update zone error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update zone'
    });
  }
};

// Delete a zone
const deleteZone = async (req, res) => {
  try {
    const zone = await Zone.findOne({ where: { zone_id: req.params.id } }) || await Zone.findByPk(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }
    await zone.destroy();
    res.json({
      success: true,
      message: 'Zone deleted successfully'
    });
  } catch (error) {
    console.error('Delete zone error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete zone'
    });
  }
};

module.exports = {
  getZones,
  createZone,
  updateZone,
  deleteZone
};
