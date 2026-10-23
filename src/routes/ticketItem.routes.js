const { Router } = require('express');
const ticketItemController = require('../controllers/ticketItem.controller');
const { authorize } = require('../middlewares/auth');

// mergeParams permite leer :ticketId de la ruta padre.
const router = Router({ mergeParams: true });

router.get('/', ticketItemController.list);
router.get('/:id', ticketItemController.getById);
router.post('/', ticketItemController.create);
router.put('/:id', ticketItemController.update);
router.patch('/:id', ticketItemController.update);
router.delete('/:id', authorize('admin'), ticketItemController.remove);

module.exports = router;
