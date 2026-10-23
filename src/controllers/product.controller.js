const productService = require('../services/product.service');
const parseId = require('../utils/parseId');

const list = async (req, res) => {
  res.json(await productService.list(req.query));
};

const getById = async (req, res) => {
  res.json(await productService.getById(parseId(req.params.id)));
};

const create = async (req, res) => {
  res.status(201).json(await productService.create(req.body));
};

const update = async (req, res) => {
  res.json(await productService.update(parseId(req.params.id), req.body));
};

const remove = async (req, res) => {
  await productService.remove(parseId(req.params.id));
  res.status(204).send();
};

module.exports = { list, getById, create, update, remove };
