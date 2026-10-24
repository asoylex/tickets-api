const { Router } = require('express');
const landController = require('../controllers/land.controller');
const { authorize } = require('../middlewares/auth');

const router = Router();

router.get('/', landController.list);
router.get('/:id', landController.getById);
router.post('/', authorize('admin'), landController.create);
router.put('/:id', authorize('admin'), landController.update);
router.patch('/:id', authorize('admin'), landController.update);
router.delete('/:id', authorize('admin'), landController.remove);

module.exports = router;
