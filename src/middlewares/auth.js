const jwt = require('jsonwebtoken');
const { User } = require('../models');
const HttpError = require('../utils/httpError');
const { secret } = require('../config/auth');

const getToken = (req) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  return scheme === 'Bearer' && token ? token : null;
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, secret, { algorithms: ['HS256'] });
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError'
        ? 'Tu sesión expiró. Inicia sesión de nuevo'
        : 'Tu sesión no es válida. Inicia sesión de nuevo';
    throw new HttpError(401, message);
  }
};

const authenticate = async (req, res, next) => {
  const token = getToken(req);
  if (!token) throw new HttpError(401, 'Debes iniciar sesión');

  const payload = verifyToken(token);
  const user = await User.findByPk(payload.sub);
  if (!user || !user.isActive) throw new HttpError(401, 'Tu sesión no es válida. Inicia sesión de nuevo');

  req.user = user;
  next();
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new HttpError(403, 'No tienes permiso para realizar esta acción');
  }
  next();
};

module.exports = { authenticate, authorize };
