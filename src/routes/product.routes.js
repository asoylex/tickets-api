const { Router } = require('express');
const productController = require('../controllers/product.controller');
const { authorize } = require('../middlewares/auth');

const router = Router();

router.get('/', productController.list);
router.get('/:id', productController.getById);
router.post('/', authorize('admin'), productController.create);
router.put('/:id', authorize('admin'), productController.update);
router.patch('/:id', authorize('admin'), productController.update);
router.delete('/:id', authorize('admin'), productController.remove);

module.exports = router;
