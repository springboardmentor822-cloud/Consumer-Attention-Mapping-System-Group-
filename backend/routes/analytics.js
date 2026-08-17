const express = require('express');
const router = express.Router();

const PYTHON_ENGINE_URL = process.env.PYTHON_ENGINE_URL || 'http://localhost:8000';

// Proxy heatmap requests to Python FastAPI HeatmapEngine
router.get('/heatmap', async (req, res) => {
  try {
    const layer = req.query.layer || 'Store Traffic';
    const period = req.query.period || 'Last 7 Days';
    const response = await fetch(`${PYTHON_ENGINE_URL}/api/v1/heatmap?layer=${encodeURIComponent(layer)}&period=${encodeURIComponent(period)}`);
    const data = await response.json();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Heatmap proxy error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch heatmap analytics' });
  }
});

// Proxy product attractiveness scores to Python ProductAttractivenessEngine
router.get('/attractiveness', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_ENGINE_URL}/api/v1/attractiveness/scores`);
    const data = await response.json();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Attractiveness proxy error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attractiveness analytics' });
  }
});

// Proxy recommendations to Python MerchandisingRecommendationEngine
router.get('/recommendations', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_ENGINE_URL}/api/v1/recommendations`);
    const data = await response.json();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Recommendations proxy error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch merchandising recommendations' });
  }
});

// Proxy customer journey data (paths, segments, transitions) to Python behavior engine
router.get('/journey', async (req, res) => {
  try {
    const period = req.query.period || 'Last 7 Days';
    const response = await fetch(`${PYTHON_ENGINE_URL}/api/v1/behavior/journey?period=${encodeURIComponent(period)}`);
    const data = await response.json();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Journey proxy error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch journey analytics' });
  }
});

module.exports = router;
