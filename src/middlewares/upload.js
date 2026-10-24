const multer = require('multer');
const HttpError = require('../utils/httpError');

const MAX_FILE_SIZE = 5 * 1024 * 1024;

// El archivo se queda en memoria: se procesa y se descarta, nunca se guarda en disco.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith('.xlsx')) {
      return cb(new HttpError(400, 'El archivo debe ser un Excel con extensión .xlsx'));
    }
    return cb(null, true);
  },
}).single('file');

// Un .xlsx es un archivo comprimido, y todos los zip empiezan con las letras "PK".
const looksLikeZip = (buffer) => buffer.length > 3 && buffer[0] === 0x50 && buffer[1] === 0x4b;

// Convierte los errores de multer en errores HTTP con mensajes en español.
const uploadExcel = (req, res, next) => {
  upload(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(new HttpError(413, 'El archivo supera el tamaño máximo de 5 MB'));
      }
      if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new HttpError(400, 'Envía un solo archivo en el campo "file"'));
      }
      return next(new HttpError(400, 'No se pudo leer el archivo enviado'));
    }
    if (error) return next(error);

    if (!req.file) return next(new HttpError(400, 'Selecciona un archivo Excel para importar'));
    if (!looksLikeZip(req.file.buffer)) return next(new HttpError(400, 'El archivo no es un Excel válido'));
    return next();
  });
};

module.exports = { uploadExcel, MAX_FILE_SIZE };
