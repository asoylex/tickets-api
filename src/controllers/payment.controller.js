const paymentService = require('../services/payment.service');

const getWeekly = async (req, res) => {
  res.json(await paymentService.getWeeklyPayments(req.query));
};

const listWeeks = async (req, res) => {
  res.json(await paymentService.listWeeks(req.query));
};

module.exports = { getWeekly, listWeeks };
