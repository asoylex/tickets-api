const { Router } = require('express');
const authRoutes = require('./auth.routes');
const supplierRoutes = require('./supplier.routes');
const landRoutes = require('./land.routes');
const productRoutes = require('./product.routes');
const ticketRoutes = require('./ticket.routes');
const userRoutes = require('./user.routes');
const paymentRoutes = require('./payment.routes');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

router.use('/auth', authRoutes);

router.use(authenticate);

router.use('/suppliers', supplierRoutes);
router.use('/lands', landRoutes);
router.use('/products', productRoutes);
router.use('/tickets', ticketRoutes);
router.use('/users', userRoutes);
router.use('/payments', paymentRoutes);

module.exports = router;
