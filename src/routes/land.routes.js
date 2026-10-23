const { Router } = require('express');
const landController = require('../controllers/land.controller');

const router = Router();

router.get('/', landController.list);
router.post('/', landController.create);
router.get('/:id', landController.getById);
router.put('/:id', landController.update);
router.patch('/:id', landController.update);
router.delete('/:id', landController.remove);

module.exports = router;
