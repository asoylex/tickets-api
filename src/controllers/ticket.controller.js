const ticketService = require('../services/ticket.service');
const parseId = require('../utils/parseId');

const list = async (req, res) => {
  res.json(await ticketService.list(req.query));
};

const getById = async (req, res) => {
  res.json(await ticketService.getById(parseId(req.params.id)));
};

const create = async (req, res) => {
  res.status(201).json(await ticketService.create(req.body));
};

const update = async (req, res) => {
  res.json(await ticketService.update(parseId(req.params.id), req.body));
};

const remove = async (req, res) => {
  await ticketService.remove(parseId(req.params.id));
  res.status(204).send();
};

module.exports = { list, getById, create, update, remove };
