const supplierService = require('../services/supplier.service');
const parseId = require('../utils/parseId');

// Express 5 forwards rejected promises to the error middleware, so no try/catch is needed here.
const list = async (req, res) => {
  res.json(await supplierService.list(req.query));
};

const getById = async (req, res) => {
  res.json(await supplierService.getById(parseId(req.params.id)));
};

const create = async (req, res) => {
  res.status(201).json(await supplierService.create(req.body));
};

const update = async (req, res) => {
  res.json(await supplierService.update(parseId(req.params.id), req.body));
};

const remove = async (req, res) => {
  await supplierService.remove(parseId(req.params.id));
  res.status(204).send();
};

module.exports = { list, getById, create, update, remove };
