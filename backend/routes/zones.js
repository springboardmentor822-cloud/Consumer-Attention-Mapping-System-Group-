const express = require('express');
const router = express.Router();
const { getZones, createZone, updateZone, deleteZone } = require('../controllers/zoneController');

router.get('/', getZones);
router.post('/', createZone);
router.put('/:id', updateZone);
router.delete('/:id', deleteZone);

module.exports = router;
