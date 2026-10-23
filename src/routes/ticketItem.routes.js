const { Router } = require('express');
const ticketItemController = require('../controllers/ticketItem.controller');

// mergeParams lets this router read :ticketId from the parent route.
const router = Router({ mergeParams: true });

router.get('/', ticketItemController.list);
router.post('/', ticketItemController.create);
router.get('/:id', ticketItemController.getById);
router.put('/:id', ticketItemController.update);
router.patch('/:id', ticketItemController.update);
router.delete('/:id', ticketItemController.remove);

module.exports = router;
