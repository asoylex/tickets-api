const { Supplier, Land, Product, Ticket } = require('../models');
const { readExcelRows } = require('../utils/excelRows');

const CATALOGS = [
  { key: 'suppliers', codeField: 'supplierCode', nameField: 'supplierName' },
  { key: 'lands', codeField: 'landCode', nameField: 'landName' },
  { key: 'products', codeField: 'productCode', nameField: 'productName' },
];

const REQUIRED_TEXT = [
  ['ticketCode', 'el código del ticket'],
  ['supplierCode', 'el código del proveedor'],
  ['supplierName', 'el nombre del proveedor'],
  ['landCode', 'el código de la ubicación'],
  ['landName', 'el nombre de la ubicación'],
  ['productCode', 'el código del producto'],
  ['productName', 'el nombre del producto'],
];

// Los precios se guardan con 4 decimales; el Excel puede traer ruido como 1.1499999999999999.
const roundPrice = (price) => Number(price.toFixed(4));

const isValidLine = (row) => row.quantity >= 0 && row.price >= 0;

// Errores: impiden importar. Avisos: se muestran, pero no bloquean.
const validateRows = (rows) => {
  const errors = [];
  const warnings = [];

  rows.forEach((row) => {
    const missing = REQUIRED_TEXT.filter(([key]) => !row[key]).map(([, label]) => label);
    if (missing.length > 0) errors.push({ rowNumber: row.rowNumber, message: `Falta ${missing.join(', ')}` });
    if (!row.date) errors.push({ rowNumber: row.rowNumber, message: 'La fecha no es válida' });
    if (!(row.quantity >= 0)) errors.push({ rowNumber: row.rowNumber, message: 'La cantidad no es válida' });
    if (!(row.price >= 0)) errors.push({ rowNumber: row.rowNumber, message: 'El precio no es válido' });

    if (isValidLine(row) && !Number.isNaN(row.total) && Math.abs(row.quantity * row.price - row.total) > 0.01) {
      warnings.push({ rowNumber: row.rowNumber, message: `El total (${row.total}) no coincide con cantidad por precio` });
    }
  });

  // Todas las líneas de un ticket deben compartir fecha, proveedor y ubicación.
  const firstRowOfTicket = new Map();
  rows.forEach((row) => {
    if (!row.ticketCode) return;
    const first = firstRowOfTicket.get(row.ticketCode);
    if (!first) {
      firstRowOfTicket.set(row.ticketCode, row);
    } else if (first.date !== row.date || first.supplierCode !== row.supplierCode || first.landCode !== row.landCode) {
      errors.push({
        rowNumber: row.rowNumber,
        message: `El ticket ${row.ticketCode} tiene fecha, proveedor o ubicación distintos a los de su primera fila (${first.rowNumber})`,
      });
    }
  });

  return { errors, warnings };
};

// Una línea idéntica a otra del mismo ticket (mismo producto, cantidad y precio).
const findDuplicateLines = (rows) => {
  const firstRowOfLine = new Map();
  const duplicates = [];

  rows.forEach((row) => {
    if (!row.ticketCode || !row.productCode || !isValidLine(row)) return;
    const key = [row.ticketCode, row.productCode, row.quantity, roundPrice(row.price)].join('|');
    const first = firstRowOfLine.get(key);
    if (first) {
      duplicates.push({
        rowNumber: row.rowNumber,
        duplicateOf: first.rowNumber,
        ticketCode: row.ticketCode,
        productCode: row.productCode,
        quantity: row.quantity,
      });
    } else {
      firstRowOfLine.set(key, row);
    }
  });

  return duplicates;
};

const findZeroQuantityLines = (rows) =>
  rows
    .filter((row) => row.quantity === 0)
    .map((row) => ({ rowNumber: row.rowNumber, ticketCode: row.ticketCode, productCode: row.productCode }));

// Compara los catálogos del archivo con los de la base, por código.
const analyzeCatalogs = (rows, existing) => {
  const catalogs = {};
  const nameMismatches = [];
  const warnings = [];

  CATALOGS.forEach(({ key, codeField, nameField }) => {
    const namesInFile = new Map();
    rows.forEach((row) => {
      const code = row[codeField];
      if (!code) return;
      if (!namesInFile.has(code)) {
        namesInFile.set(code, row[nameField]);
      } else if (row[nameField] && namesInFile.get(code) !== row[nameField]) {
        warnings.push({
          rowNumber: row.rowNumber,
          message: `El código ${code} aparece con nombres distintos en el archivo; se usará "${namesInFile.get(code)}"`,
        });
      }
    });

    let newCount = 0;
    namesInFile.forEach((fileName, code) => {
      const storedName = existing[key].get(code);
      if (storedName === undefined) newCount += 1;
      else if (storedName !== fileName) nameMismatches.push({ catalog: key, code, fileName, storedName });
    });

    catalogs[key] = { total: namesInFile.size, new: newCount, existing: namesInFile.size - newCount };
  });

  return { catalogs, nameMismatches, warnings };
};

// Función pura: recibe las filas del Excel y lo que ya existe en la base, y arma el informe.
const analyzeRows = (rows, existing) => {
  const { errors, warnings } = validateRows(rows);
  const catalogResult = analyzeCatalogs(rows, existing);

  const linesPerTicket = new Map();
  rows.forEach((row) => {
    if (row.ticketCode) linesPerTicket.set(row.ticketCode, (linesPerTicket.get(row.ticketCode) ?? 0) + 1);
  });

  const existingTickets = [];
  linesPerTicket.forEach((lines, code) => {
    if (existing.ticketCodes.has(code)) existingTickets.push({ code, lines });
  });

  return {
    summary: { rows: rows.length, tickets: linesPerTicket.size, lines: rows.length },
    tickets: {
      total: linesPerTicket.size,
      new: linesPerTicket.size - existingTickets.length,
      existing: existingTickets.length,
    },
    catalogs: catalogResult.catalogs,
    conflicts: {
      existingTickets,
      duplicateLines: findDuplicateLines(rows),
      zeroQuantityLines: findZeroQuantityLines(rows),
      nameMismatches: catalogResult.nameMismatches,
    },
    errors,
    warnings: [...warnings, ...catalogResult.warnings],
    canImport: errors.length === 0,
  };
};

const loadExisting = async (rows) => {
  const ticketCodes = [...new Set(rows.map((row) => row.ticketCode).filter(Boolean))];
  const toMap = (records) => new Map(records.map((record) => [record.code, record.name]));

  const [tickets, suppliers, lands, products] = await Promise.all([
    Ticket.findAll({ attributes: ['code'], where: { code: ticketCodes } }),
    Supplier.findAll({ attributes: ['code', 'name'] }),
    Land.findAll({ attributes: ['code', 'name'] }),
    Product.findAll({ attributes: ['code', 'name'] }),
  ]);

  return {
    ticketCodes: new Set(tickets.map((ticket) => ticket.code)),
    suppliers: toMap(suppliers),
    lands: toMap(lands),
    products: toMap(products),
  };
};

// No escribe nada: solo lee el archivo, lo compara con la base y devuelve el informe.
const analyze = async (buffer) => {
  const rows = await readExcelRows(buffer);
  return analyzeRows(rows, await loadExisting(rows));
};

module.exports = {
  analyze,
  analyzeRows,
  validateRows,
  findDuplicateLines,
  findZeroQuantityLines,
  roundPrice,
};
