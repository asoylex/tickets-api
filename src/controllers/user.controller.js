const userService = require('../services/user.service');
const parseId = require('../utils/parseId');

const list = async (req, res) => {
  res.json(await userService.list(req.query));
};

const getById = async (req, res) => {
  res.json(await userService.getById(parseId(req.params.id)));
};

const create = async (req, res) => {
  res.status(201).json(await userService.create(req.body));
};

const update = async (req, res) => {
  res.json(await userService.update(parseId(req.params.id), req.body, req.user.id));
};

const remove = async (req, res) => {
  await userService.remove(parseId(req.params.id), req.user.id);
  res.status(204).send();
};

module.exports = { list, getById, create, update, remove };
