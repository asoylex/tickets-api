const { Op } = require('sequelize');
const { Product } = require('../models');
const HttpError = require('../utils/httpError');
const pick = require('../utils/pick');
const { getPagination, buildMeta } = require('../utils/pagination');

const WRITABLE_FIELDS = ['code', 'name', 'isActive'];

const getById = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) throw new HttpError(404, 'Product not found');
  return product;
};

const list = async (query) => {
  const pagination = getPagination(query);
  const where = {};

  if (query.search) {
    const term = `%${query.search}%`;
    where[Op.or] = [{ code: { [Op.iLike]: term } }, { name: { [Op.iLike]: term } }];
  }
  if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

  const { rows, count } = await Product.findAndCountAll({
    where,
    order: [['name', 'ASC'], ['id', 'ASC']],
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return { data: rows, meta: buildMeta(pagination, count) };
};

const create = (body) => Product.create(pick(body, WRITABLE_FIELDS));

const update = async (id, body) => {
  const product = await getById(id);
  return product.update(pick(body, WRITABLE_FIELDS));
};

const remove = async (id) => {
  const product = await getById(id);
  await product.destroy();
};

module.exports = { list, getById, create, update, remove };
