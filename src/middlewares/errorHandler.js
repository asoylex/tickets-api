const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const HttpError = require('../utils/httpError');

const fieldLabels = {
  code: 'código',
  email: 'correo',
};

const notFound = (req, res) => {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'El cuerpo de la petición no es un JSON válido' });
  }

  // UniqueConstraintError hereda de ValidationError, por eso se revisa primero.
  if (err instanceof UniqueConstraintError) {
    const fields = err.errors.map((e) => e.path);
    const labels = fields.map((field) => fieldLabels[field] || field);
    return res.status(409).json({ message: `Ya existe un registro con ese ${labels.join(' y ')}`, details: fields });
  }

  if (err instanceof ValidationError) {
    const details = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return res.status(400).json({ message: 'Hay datos que no son válidos', details });
  }

  if (err instanceof ForeignKeyConstraintError) {
    const detail = err.parent && err.parent.detail ? err.parent.detail : '';
    if (detail.includes('is not present')) {
      return res.status(400).json({ message: 'Alguno de los registros relacionados no existe', details: detail });
    }
    return res.status(409).json({
      message: 'No se puede eliminar porque tiene registros relacionados. Desactívalo en su lugar.',
    });
  }

  console.error(err);
  const message = process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message;
  return res.status(500).json({ message });
};

module.exports = { notFound, errorHandler };
