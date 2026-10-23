const { Router } = require('express');
const supplierController = require('../controllers/supplier.controller');
const { authorize } = require('../middlewares/auth');

const router = Router();

router.get('/', supplierController.list);
router.get('/:id', supplierController.getById);
router.post('/', authorize('admin'), supplierController.create);
router.put('/:id', authorize('admin'), supplierController.update);
router.patch('/:id', authorize('admin'), supplierController.update);
router.delete('/:id', authorize('admin'), supplierController.remove);

module.exports = router;
