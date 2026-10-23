const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const HttpError = require('../utils/httpError');
const { secret, expiresIn } = require('../config/auth');

// Se compara contra este hash cuando el email no existe, para que la respuesta tarde lo mismo.
const DUMMY_HASH = bcrypt.hashSync('contrasena-falsa', 10);

const login = async (body) => {
  const { email, password } = body || {};

  const details = [];
  if (typeof email !== 'string' || !email.trim()) details.push({ field: 'email', message: 'email is required' });
  if (typeof password !== 'string' || !password) details.push({ field: 'password', message: 'password is required' });
  if (details.length) throw new HttpError(400, 'Validation failed', details);

  const user = await User.scope('withPassword').findOne({ where: { email: email.trim().toLowerCase() } });
  const validPassword = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !validPassword) throw new HttpError(401, 'Invalid credentials');
  if (!user.isActive) throw new HttpError(403, 'User is inactive');

  const token = jwt.sign({ role: user.role }, secret, {
    subject: String(user.id),
    expiresIn,
    algorithm: 'HS256',
  });

  return { token, tokenType: 'Bearer', expiresIn, user };
};

module.exports = { login };
