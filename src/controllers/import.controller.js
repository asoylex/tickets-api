const importService = require('../services/import.service');
const HttpError = require('../utils/httpError');

// Las opciones llegan como texto JSON en un campo del formulario, junto al archivo.
const parseOptions = (value) => {
  if (value === undefined || value === '') return undefined;
  try {
    return JSON.parse(value);
  } catch {
    throw new HttpError(400, 'Las opciones de importación no tienen un formato válido');
  }
};

const analyze = async (req, res) => {
  res.json(await importService.analyze(req.file.buffer));
};

const execute = async (req, res) => {
  res.json(await importService.execute(req.file.buffer, parseOptions(req.body.options)));
};

module.exports = { analyze, execute };
