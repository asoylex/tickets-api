const HttpError = require('./httpError');

const parseId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'El identificador no es válido');
  return id;
};

module.exports = parseId;
