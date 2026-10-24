const landService = require('../services/land.service');
const parseId = require('../utils/parseId');

const list = async (req, res) => {
  res.json(await landService.list(req.query));
};

const getById = async (req, res) => {
  res.json(await landService.getById(parseId(req.params.id)));
};

const create = async (req, res) => {
  res.status(201).json(await landService.create(req.body));
};

const update = async (req, res) => {
  res.json(await landService.update(parseId(req.params.id), req.body));
};

const remove = async (req, res) => {
  await landService.remove(parseId(req.params.id));
  res.status(204).send();
};

module.exports = { list, getById, create, update, remove };
