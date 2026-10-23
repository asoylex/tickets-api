const { Router } = require('express');
const userController = require('../controllers/user.controller');
const { authorize } = require('../middlewares/auth');

const router = Router();

router.use(authorize('admin'));

router.get('/', userController.list);
router.post('/', userController.create);
router.get('/:id', userController.getById);
router.put('/:id', userController.update);
router.patch('/:id', userController.update);
router.delete('/:id', userController.remove);

module.exports = router;
