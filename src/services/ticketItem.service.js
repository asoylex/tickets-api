const { Ticket, TicketItem, Product } = require('../models');
const HttpError = require('../utils/httpError');
const { parseItemInput } = require('../utils/ticketItemInput');

const itemInclude = [{ model: Product, as: 'product' }];

const ensureTicketExists = async (ticketId) => {
  const ticket = await Ticket.findByPk(ticketId, { attributes: ['id'] });
  if (!ticket) throw new HttpError(404, 'Ticket no encontrado');
};

const findItem = async (ticketId, id) => {
  const item = await TicketItem.findOne({ where: { id, ticketId }, include: itemInclude });
  if (!item) throw new HttpError(404, 'Línea del ticket no encontrada');
  return item;
};

const list = async (ticketId) => {
  await ensureTicketExists(ticketId);
  const data = await TicketItem.findAll({ where: { ticketId }, include: itemInclude, order: [['id', 'ASC']] });
  return { data };
};

const getById = async (ticketId, id) => {
  await ensureTicketExists(ticketId);
  return findItem(ticketId, id);
};

const create = async (ticketId, body) => {
  await ensureTicketExists(ticketId);
  const { data, details } = parseItemInput(body);
  if (details.length) throw new HttpError(400, 'Hay datos que no son válidos', details);

  const item = await TicketItem.create({ ...data, ticketId });
  return findItem(ticketId, item.id);
};

const update = async (ticketId, id, body) => {
  await ensureTicketExists(ticketId);
  const item = await findItem(ticketId, id);
  const { data, details } = parseItemInput(body, { partial: true });
  if (details.length) throw new HttpError(400, 'Hay datos que no son válidos', details);

  await item.update(data);
  return findItem(ticketId, id);
};

// A ticket must always keep at least one line.
const remove = async (ticketId, id) => {
  await ensureTicketExists(ticketId);
  const item = await findItem(ticketId, id);

  const linesInTicket = await TicketItem.count({ where: { ticketId } });
  if (linesInTicket === 1) {
    throw new HttpError(409, 'El ticket necesita al menos una línea. Si ya no lo necesitas, elimina el ticket completo');
  }
  await item.destroy();
};

module.exports = { list, getById, create, update, remove };
