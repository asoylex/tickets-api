const authService = require('../services/auth.service');

const login = async (req, res) => {
  res.json(await authService.login(req.body));
};

const me = async (req, res) => {
  res.json(req.user);
};

module.exports = { login, me };
