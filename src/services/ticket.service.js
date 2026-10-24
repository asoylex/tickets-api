const { Op } = require('sequelize');
const { sequelize, Ticket, TicketItem, Supplier, Land, Product } = require('../models');
const HttpError = require('../utils/httpError');
const pick = require('../utils/pick');
const { getPagination, buildMeta } = require('../utils/pagination');
const { parseItemInput } = require('../utils/ticketItemInput');

const TICKET_FIELDS = ['code', 'date', 'supplierId', 'landId'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const detailInclude = [
  { model: Supplier, as: 'supplier' },
  { model: Land, as: 'land' },
  { model: TicketItem, as: 'items', include: [{ model: Product, as: 'product' }] },
];

// The list only needs the line amounts to compute each ticket total.
const listInclude = [
  { model: Supplier, as: 'supplier', attributes: ['id', 'code', 'name'] },
  { model: Land, as: 'land', attributes: ['id', 'code', 'name'] },
  { model: TicketItem, as: 'items', attributes: ['id', 'quantity', 'price'] },
];

const parseItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'El ticket necesita al menos una línea');
  }

  const details = [];
  const parsed = items.map((item, index) => {
    const result = parseItemInput(item, { prefix: `items[${index}].` });
    details.push(...result.details);
    return result.data;
  });

  if (details.length) throw new HttpError(400, 'Hay datos que no son válidos', details);
  return parsed;
};

const getById = async (id) => {
  const ticket = await Ticket.findByPk(id, {
    include: detailInclude,
    order: [[{ model: TicketItem, as: 'items' }, 'id', 'ASC']],
  });
  if (!ticket) throw new HttpError(404, 'Ticket no encontrado');
  return ticket;
};

const list = async (query) => {
  const pagination = getPagination(query);
  const where = {};

  if (query.search) where.code = { [Op.iLike]: `%${query.search}%` };
  if (query.supplierId) where.supplierId = Number(query.supplierId);
  if (query.landId) where.landId = Number(query.landId);

  const dateRange = {};
  ['dateFrom', 'dateTo'].forEach((name) => {
    if (query[name] === undefined) return;
    if (!DATE_PATTERN.test(query[name])) throw new HttpError(400, `El filtro ${name} debe tener el formato AAAA-MM-DD`);
    dateRange[name === 'dateFrom' ? Op.gte : Op.lte] = query[name];
  });
  if (Reflect.ownKeys(dateRange).length) where.date = dateRange;

  const { rows, count } = await Ticket.findAndCountAll({
    where,
    include: listInclude,
    distinct: true,
    order: [['date', 'DESC'], ['id', 'DESC']],
    limit: pagination.limit,
    offset: pagination.offset,
  });

  const data = rows.map((ticket) => {
    const json = ticket.toJSON();
    json.itemsCount = json.items.length;
    delete json.items;
    return json;
  });
  return { data, meta: buildMeta(pagination, count) };
};

const create = async (body) => {
  const data = pick(body, TICKET_FIELDS);
  const items = parseItems(body.items);

  const id = await sequelize.transaction(async (transaction) => {
    const ticket = await Ticket.create(data, { transaction });
    await TicketItem.bulkCreate(
      items.map((item) => ({ ...item, ticketId: ticket.id })),
      { transaction, validate: true }
    );
    return ticket.id;
  });
  return getById(id);
};

// When "items" is sent, the ticket lines are replaced with the new list.
const update = async (id, body) => {
  const items = body.items === undefined ? null : parseItems(body.items);

  await sequelize.transaction(async (transaction) => {
    const ticket = await Ticket.findByPk(id, { transaction });
    if (!ticket) throw new HttpError(404, 'Ticket no encontrado');

    await ticket.update(pick(body, TICKET_FIELDS), { transaction });

    if (items) {
      await TicketItem.destroy({ where: { ticketId: id }, transaction });
      await TicketItem.bulkCreate(
        items.map((item) => ({ ...item, ticketId: id })),
        { transaction, validate: true }
      );
    }
  });
  return getById(id);
};

const remove = async (id) => {
  const deleted = await Ticket.destroy({ where: { id } });
  if (!deleted) throw new HttpError(404, 'Ticket no encontrado');
};

module.exports = { list, getById, create, update, remove };
