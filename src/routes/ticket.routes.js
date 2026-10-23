const { Router } = require('express');
const ticketController = require('../controllers/ticket.controller');
const ticketItemRoutes = require('./ticketItem.routes');

const router = Router();

router.get('/', ticketController.list);
router.post('/', ticketController.create);
router.get('/:id', ticketController.getById);
router.put('/:id', ticketController.update);
router.patch('/:id', ticketController.update);
router.delete('/:id', ticketController.remove);

router.use('/:ticketId/items', ticketItemRoutes);

module.exports = router;
