const { Router } = require('express');
const paymentController = require('../controllers/payment.controller');

const router = Router();

router.get('/weeks', paymentController.listWeeks);
router.get('/weekly', paymentController.getWeekly);

module.exports = router;
