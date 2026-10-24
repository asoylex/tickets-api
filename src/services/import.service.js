const { sequelize, Supplier, Land, Product, Ticket, TicketItem } = require('../models');
const HttpError = require('../utils/httpError');
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

const DEFAULT_OPTIONS = { existingTickets: 'skip', skipDuplicateLines: false, skipZeroQuantity: false };

// Las opciones llegan del cliente: se completan con valores por defecto y se validan.
const normalizeOptions = (input) => {
  const source = input && typeof input === 'object' ? input : {};
  const options = { ...DEFAULT_OPTIONS };
  const details = [];

  if (source.existingTickets !== undefined) {
    if (source.existingTickets === 'skip' || source.existingTickets === 'replace') options.existingTickets = source.existingTickets;
    else details.push({ field: 'existingTickets', message: 'Los tickets existentes solo pueden omitirse o reemplazarse' });
  }

  ['skipDuplicateLines', 'skipZeroQuantity'].forEach((field) => {
    if (source[field] === undefined) return;
    if (typeof source[field] === 'boolean') options[field] = source[field];
    else details.push({ field, message: 'Debe ser verdadero o falso' });
  });

  if (details.length > 0) throw new HttpError(400, 'Hay datos que no son válidos', details);
  return options;
};

// Aplica las decisiones del usuario sobre las líneas con cantidad 0 y las repetidas.
const selectRows = (rows, options) => {
  const withoutZero = options.skipZeroQuantity ? rows.filter((row) => row.quantity !== 0) : rows;
  const duplicateRows = options.skipDuplicateLines
    ? new Set(findDuplicateLines(withoutZero).map((duplicate) => duplicate.rowNumber))
    : new Set();

  return {
    rows: withoutZero.filter((row) => !duplicateRows.has(row.rowNumber)),
    skippedZeroQuantity: rows.length - withoutZero.length,
    skippedDuplicates: duplicateRows.size,
  };
};

const groupTickets = (rows) => {
  const tickets = new Map();
  rows.forEach((row) => {
    if (!tickets.has(row.ticketCode)) {
      tickets.set(row.ticketCode, {
        code: row.ticketCode,
        date: row.date,
        supplierCode: row.supplierCode,
        landCode: row.landCode,
        lines: [],
      });
    }
    tickets.get(row.ticketCode).lines.push({
      productCode: row.productCode,
      quantity: row.quantity,
      price: roundPrice(row.price),
    });
  });
  return [...tickets.values()];
};

// Crea los registros de catálogo que no existan y devuelve el id de cada código.
const ensureCatalog = async (Model, namesByCode, transaction) => {
  const ids = new Map();
  let created = 0;

  for (const [code, name] of namesByCode) {
    const [record, wasCreated] = await Model.findOrCreate({ where: { code }, defaults: { name }, transaction });
    if (wasCreated) created += 1;
    ids.set(code, record.id);
  }
  return { ids, created };
};

const firstNameByCode = (rows, codeField, nameField) => {
  const names = new Map();
  rows.forEach((row) => {
    if (!names.has(row[codeField])) names.set(row[codeField], row[nameField]);
  });
  return names;
};

// Importa el archivo en una sola transacción: si algo falla, no queda nada a medias.
const execute = async (buffer, rawOptions) => {
  const options = normalizeOptions(rawOptions);
  const allRows = await readExcelRows(buffer);

  const analysis = analyzeRows(allRows, await loadExisting(allRows));
  if (!analysis.canImport) {
    throw new HttpError(400, 'El archivo tiene errores y no se puede importar', analysis.errors);
  }

  const selection = selectRows(allRows, options);
  const tickets = groupTickets(selection.rows);

  return sequelize.transaction(async (transaction) => {
    const found = await Ticket.findAll({ attributes: ['code'], where: { code: tickets.map((ticket) => ticket.code) }, transaction });
    const existingCodes = new Set(found.map((ticket) => ticket.code));

    const toWrite = tickets.filter((ticket) => options.existingTickets === 'replace' || !existingCodes.has(ticket.code));
    const codesToWrite = new Set(toWrite.map((ticket) => ticket.code));
    const rowsToWrite = selection.rows.filter((row) => codesToWrite.has(row.ticketCode));

    const suppliers = await ensureCatalog(Supplier, firstNameByCode(rowsToWrite, 'supplierCode', 'supplierName'), transaction);
    const lands = await ensureCatalog(Land, firstNameByCode(rowsToWrite, 'landCode', 'landName'), transaction);
    const products = await ensureCatalog(Product, firstNameByCode(rowsToWrite, 'productCode', 'productName'), transaction);

    const result = {
      options,
      catalogs: {
        suppliers: { created: suppliers.created },
        lands: { created: lands.created },
        products: { created: products.created },
      },
      tickets: { created: 0, replaced: 0, skippedExisting: tickets.length - toWrite.length },
      lines: { created: 0, skippedDuplicates: selection.skippedDuplicates, skippedZeroQuantity: selection.skippedZeroQuantity },
    };

    for (const ticket of toWrite) {
      if (existingCodes.has(ticket.code)) {
        // Las líneas del ticket anterior se borran junto con él (borrado en cascada).
        await Ticket.destroy({ where: { code: ticket.code }, transaction });
        result.tickets.replaced += 1;
      } else {
        result.tickets.created += 1;
      }

      const created = await Ticket.create(
        { code: ticket.code, date: ticket.date, supplierId: suppliers.ids.get(ticket.supplierCode), landId: lands.ids.get(ticket.landCode) },
        { transaction }
      );
      await TicketItem.bulkCreate(
        ticket.lines.map((line) => ({
          ticketId: created.id,
          productId: products.ids.get(line.productCode),
          quantity: line.quantity,
          price: line.price,
        })),
        { transaction, validate: true }
      );
      result.lines.created += ticket.lines.length;
    }

    return result;
  });
};

module.exports = {
  analyze,
  analyzeRows,
  execute,
  normalizeOptions,
  validateRows,
  findDuplicateLines,
  findZeroQuantityLines,
  roundPrice,
};
