const { Op, QueryTypes } = require('sequelize');
const { sequelize, Ticket, TicketItem, Supplier, Land, Product } = require('../models');
const HttpError = require('../utils/httpError');
const { getIsoWeekRange } = require('../utils/isoWeek');

// Money is added as whole numbers (quantity in 1/100, price in 1/10000) so no floating point error builds up.
// Each supplier payment is rounded to cents only once, at the end.
const toMicros = (item) => Math.round(item.quantity * 100) * Math.round(item.price * 10000);
const microsToAmount = (micros) => Math.round(micros / 10000) / 100;

const parseYear = (value) => {
  const year = Number(value);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new HttpError(400, 'Hay datos que no son válidos', [{ field: 'year', message: 'El año debe ser un número entero entre 2000 y 2100' }]);
  }
  return year;
};

const parseWeek = (query) => {
  const details = [];
  const year = Number(query.year);
  const week = Number(query.week);

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    details.push({ field: 'year', message: 'El año debe ser un número entero entre 2000 y 2100' });
  }
  if (!Number.isInteger(week) || week < 1 || week > 53) {
    details.push({ field: 'week', message: 'La semana debe ser un número entero entre 1 y 53' });
  }
  if (details.length) throw new HttpError(400, 'Hay datos que no son válidos', details);

  const range = getIsoWeekRange(year, week);
  if (!range) throw new HttpError(400, `La semana ${week} no existe en ${year}`);
  return { year, week, ...range };
};

const getWeeklyPayments = async (query) => {
  const period = parseWeek(query);
  const where = { date: { [Op.between]: [period.startDate, period.endDate] } };

  if (query.supplierId !== undefined) {
    const supplierId = Number(query.supplierId);
    if (!Number.isInteger(supplierId) || supplierId < 1) throw new HttpError(400, 'El proveedor indicado no es válido');
    where.supplierId = supplierId;
  }

  const tickets = await Ticket.findAll({
    where,
    include: [
      { model: Supplier, as: 'supplier', attributes: ['id', 'code', 'name'] },
      { model: Land, as: 'land', attributes: ['id', 'code', 'name'] },
      { model: TicketItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id', 'code', 'name'] }] },
    ],
    order: [['date', 'ASC'], ['code', 'ASC'], [{ model: TicketItem, as: 'items' }, 'id', 'ASC']],
  });

  const groups = new Map();
  tickets.forEach((ticket) => {
    if (!groups.has(ticket.supplierId)) {
      groups.set(ticket.supplierId, { supplier: ticket.supplier.toJSON(), micros: 0, tickets: [] });
    }
    const group = groups.get(ticket.supplierId);

    group.micros += ticket.items.reduce((sum, item) => sum + toMicros(item), 0);
    group.tickets.push({
      id: ticket.id,
      code: ticket.code,
      date: ticket.date,
      land: ticket.land.toJSON(),
      total: ticket.total,
      items: ticket.items.map((item) => ({
        id: item.id,
        product: item.product.toJSON(),
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
    });
  });

  const suppliers = [...groups.values()]
    .sort((a, b) => a.supplier.name.localeCompare(b.supplier.name))
    .map(({ supplier, micros, tickets: supplierTickets }) => ({
      supplier,
      ticketsCount: supplierTickets.length,
      itemsCount: supplierTickets.reduce((sum, ticket) => sum + ticket.items.length, 0),
      total: microsToAmount(micros),
      tickets: supplierTickets,
    }));

  const cents = suppliers.reduce((sum, entry) => sum + Math.round(entry.total * 100), 0);

  return {
    year: period.year,
    week: period.week,
    startDate: period.startDate,
    endDate: period.endDate,
    totals: {
      suppliers: suppliers.length,
      tickets: tickets.length,
      items: suppliers.reduce((sum, entry) => sum + entry.itemsCount, 0),
      amount: cents / 100,
    },
    suppliers,
  };
};

// Weeks that have tickets, so the frontend can offer only weeks with data.
const listWeeks = async (query) => {
  const replacements = {};
  let yearFilter = '';
  if (query.year !== undefined) {
    replacements.year = parseYear(query.year);
    yearFilter = 'WHERE EXTRACT(ISOYEAR FROM t.date) = :year';
  }

  const rows = await sequelize.query(
    `SELECT year, week,
            COUNT(*)::int AS "suppliersCount",
            SUM("ticketsCount")::int AS "ticketsCount",
            SUM(total) AS total
       FROM (
         SELECT EXTRACT(ISOYEAR FROM t.date)::int AS year,
                EXTRACT(WEEK FROM t.date)::int AS week,
                t.supplier_id,
                COUNT(DISTINCT t.id) AS "ticketsCount",
                ROUND(SUM(i.quantity * i.price), 2) AS total
           FROM tickets t
           JOIN ticket_items i ON i.ticket_id = t.id
           ${yearFilter}
          GROUP BY 1, 2, 3
       ) per_supplier
      GROUP BY year, week
      ORDER BY year DESC, week DESC`,
    { replacements, type: QueryTypes.SELECT }
  );

  const data = rows.map((row) => ({
    year: row.year,
    week: row.week,
    ...getIsoWeekRange(row.year, row.week),
    suppliersCount: row.suppliersCount,
    ticketsCount: row.ticketsCount,
    total: Number(row.total),
  }));
  return { data };
};

module.exports = { getWeeklyPayments, listWeeks };
