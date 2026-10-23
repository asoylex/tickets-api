const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error('Falta JWT_SECRET en el archivo .env');
}

module.exports = {
  secret,
  expiresIn: process.env.JWT_EXPIRES_IN || '8h',
};
