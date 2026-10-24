const { Router } = require('express');
const importController = require('../controllers/import.controller');
const { authorize } = require('../middlewares/auth');
const { uploadExcel } = require('../middlewares/upload');

const router = Router();

// El permiso se revisa antes de recibir el archivo, para no procesar subidas de quien no puede importar.
router.use(authorize('admin'));

router.post('/analyze', uploadExcel, importController.analyze);
router.post('/execute', uploadExcel, importController.execute);

module.exports = router;
