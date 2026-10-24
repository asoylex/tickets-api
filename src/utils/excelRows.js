const ExcelJS = require('exceljs');
const HttpError = require('./httpError');

const REQUIRED_COLUMNS = {
  ticketCode: 'ticket.code',
  date: 'date',
  supplierCode: 'supplier.code',
  supplierName: 'supplier.name',
  landCode: 'land.code',
  landName: 'land.name',
  productCode: 'product.code',
  productName: 'product.name',
  quantity: 'total_qty',
  price: 'price',
};

// El total solo se usa para avisar si no cuadra con cantidad por precio, por eso es opcional.
const TOTAL_COLUMN = 'total';
const MAX_ROWS = 10000;

const plain = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && !(value instanceof Date)) {
    if (value.richText) return value.richText.map((part) => part.text).join('');
    if ('result' in value) return plain(value.result);
  }
  return value;
};

const toText = (value) => String(plain(value)).trim();

const toNumber = (value) => {
  const raw = plain(value);
  if (raw === '') return NaN;
  return Number(raw);
};

// Las fechas pueden llegar como Date, como número de serie de Excel o como texto ISO.
const toDateString = (value) => {
  const raw = plain(value);
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw.toISOString().slice(0, 10);
  if (typeof raw === 'number') return new Date(Math.round((raw - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}/.test(String(raw))) return String(raw).slice(0, 10);
  return null;
};

const isBlankRow = (record) =>
  !record.ticketCode &&
  !record.supplierCode &&
  !record.supplierName &&
  !record.landCode &&
  !record.landName &&
  !record.productCode &&
  !record.productName &&
  record.date === null &&
  Number.isNaN(record.quantity) &&
  Number.isNaN(record.price) &&
  Number.isNaN(record.total);

const loadSheet = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new HttpError(400, 'No se pudo leer el archivo Excel. Verifica que no esté dañado');
  }

  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 1) throw new HttpError(400, 'El archivo no tiene datos para importar');
  if (sheet.rowCount - 1 > MAX_ROWS) throw new HttpError(400, `El archivo tiene demasiadas filas (máximo ${MAX_ROWS})`);
  return sheet;
};

// Lee la primera hoja y devuelve una fila normalizada por cada registro, con su número de fila en el Excel.
const readExcelRows = async (buffer) => {
  const sheet = await loadSheet(buffer);

  // Los encabezados se comparan sin distinguir mayúsculas ni espacios sobrantes.
  const headerRow = sheet.getRow(1).values;
  const findColumn = (header) => headerRow.findIndex((cell) => toText(cell).toLowerCase() === header);

  const columns = {};
  const missing = [];
  Object.entries(REQUIRED_COLUMNS).forEach(([key, header]) => {
    const index = findColumn(header);
    if (index === -1) missing.push(header);
    else columns[key] = index;
  });
  if (missing.length > 0) throw new HttpError(400, `Faltan columnas en el archivo: ${missing.join(', ')}`);

  const totalIndex = findColumn(TOTAL_COLUMN);

  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const cell = (key) => row.getCell(columns[key]).value;

    const record = {
      rowNumber,
      ticketCode: toText(cell('ticketCode')),
      date: toDateString(cell('date')),
      supplierCode: toText(cell('supplierCode')),
      supplierName: toText(cell('supplierName')),
      landCode: toText(cell('landCode')),
      landName: toText(cell('landName')),
      productCode: toText(cell('productCode')),
      productName: toText(cell('productName')),
      quantity: toNumber(cell('quantity')),
      price: toNumber(cell('price')),
      total: totalIndex === -1 ? NaN : toNumber(row.getCell(totalIndex).value),
    };

    if (!isBlankRow(record)) rows.push(record);
  });

  if (rows.length === 0) throw new HttpError(400, 'El archivo no tiene datos para importar');
  return rows;
};

module.exports = { readExcelRows, REQUIRED_COLUMNS, MAX_ROWS };
