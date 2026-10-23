const ticketItemService = require('../services/ticketItem.service');
const parseId = require('../utils/parseId');

// These routes are nested under /tickets/:ticketId/items.
const list = async (req, res) => {
  res.json(await ticketItemService.list(parseId(req.params.ticketId)));
};

const getById = async (req, res) => {
  res.json(await ticketItemService.getById(parseId(req.params.ticketId), parseId(req.params.id)));
};

const create = async (req, res) => {
  res.status(201).json(await ticketItemService.create(parseId(req.params.ticketId), req.body));
};

const update = async (req, res) => {
  res.json(await ticketItemService.update(parseId(req.params.ticketId), parseId(req.params.id), req.body));
};

const remove = async (req, res) => {
  await ticketItemService.remove(parseId(req.params.ticketId), parseId(req.params.id));
  res.status(204).send();
};

module.exports = { list, getById, create, update, remove };
