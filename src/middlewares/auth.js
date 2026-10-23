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
    const message = error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    throw new HttpError(401, message);
  }
};

const authenticate = async (req, res, next) => {
  const token = getToken(req);
  if (!token) throw new HttpError(401, 'Authentication required');

  const payload = verifyToken(token);
  const user = await User.findByPk(payload.sub);
  if (!user || !user.isActive) throw new HttpError(401, 'Invalid token');

  req.user = user;
  next();
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new HttpError(403, 'You do not have permission to perform this action');
  }
  next();
};

module.exports = { authenticate, authorize };
