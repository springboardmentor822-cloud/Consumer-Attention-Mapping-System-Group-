const express = require('express');
const router = express.Router();
const { getShelves, createShelf, updateShelf, deleteShelf } = require('../controllers/shelfController');

router.get('/', getShelves);
router.post('/', createShelf);
router.put('/:id', updateShelf);
router.delete('/:id', deleteShelf);

module.exports = router;
