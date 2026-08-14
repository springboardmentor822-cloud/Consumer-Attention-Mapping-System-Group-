const Customer = require('../models/customer');

// Get all customers
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      order: [['id', 'ASC']]
    });
    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch customers'
    });
  }
};

// Create a customer session
const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Customer session created successfully',
      data: customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create customer session'
    });
  }
};

// Update a customer session
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ where: { customer_id: req.params.id } }) || await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer session not found' });
    }
    await customer.update(req.body);
    res.json({
      success: true,
      message: 'Customer session updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update customer session'
    });
  }
};

// Delete a customer session
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ where: { customer_id: req.params.id } }) || await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer session not found' });
    }
    await customer.destroy();
    res.json({
      success: true,
      message: 'Customer session deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete customer session'
    });
  }
};

module.exports = {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
