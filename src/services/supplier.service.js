const { Op } = require('sequelize');
const { Supplier } = require('../models');
const HttpError = require('../utils/httpError');
const pick = require('../utils/pick');
const { getPagination, buildMeta } = require('../utils/pagination');

const WRITABLE_FIELDS = ['code', 'name', 'isActive'];

const getById = async (id) => {
  const supplier = await Supplier.findByPk(id);
  if (!supplier) throw new HttpError(404, 'Proveedor no encontrado');
  return supplier;
};

const list = async (query) => {
  const pagination = getPagination(query);
  const where = {};

  if (query.search) {
    const term = `%${query.search}%`;
    where[Op.or] = [{ code: { [Op.iLike]: term } }, { name: { [Op.iLike]: term } }];
  }
  if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

  const { rows, count } = await Supplier.findAndCountAll({
    where,
    order: [['name', 'ASC'], ['id', 'ASC']],
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return { data: rows, meta: buildMeta(pagination, count) };
};

const create = (body) => Supplier.create(pick(body, WRITABLE_FIELDS));

const update = async (id, body) => {
  const supplier = await getById(id);
  return supplier.update(pick(body, WRITABLE_FIELDS));
};

const remove = async (id) => {
  const supplier = await getById(id);
  await supplier.destroy();
};

module.exports = { list, getById, create, update, remove };
