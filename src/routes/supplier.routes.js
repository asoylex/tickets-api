const { Router } = require('express');
const supplierController = require('../controllers/supplier.controller');

const router = Router();

router.get('/', supplierController.list);
router.post('/', supplierController.create);
router.get('/:id', supplierController.getById);
router.put('/:id', supplierController.update);
router.patch('/:id', supplierController.update);
router.delete('/:id', supplierController.remove);

module.exports = router;
