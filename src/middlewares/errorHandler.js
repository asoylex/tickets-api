const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const HttpError = require('../utils/httpError');

const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body' });
  }

  // UniqueConstraintError extends ValidationError, so it must be checked first.
  if (err instanceof UniqueConstraintError) {
    const fields = err.errors.map((e) => e.path);
    return res.status(409).json({ message: `Already exists: ${fields.join(', ')}`, details: fields });
  }

  if (err instanceof ValidationError) {
    const details = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return res.status(400).json({ message: 'Validation failed', details });
  }

  if (err instanceof ForeignKeyConstraintError) {
    const detail = err.parent && err.parent.detail ? err.parent.detail : '';
    if (detail.includes('is not present')) {
      return res.status(400).json({ message: 'A referenced record does not exist', details: detail });
    }
    return res.status(409).json({
      message: 'The record is referenced by other records and cannot be deleted. Deactivate it instead.',
    });
  }

  console.error(err);
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  return res.status(500).json({ message });
};

module.exports = { notFound, errorHandler };
