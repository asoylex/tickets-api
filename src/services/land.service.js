const { Op } = require('sequelize');
const { Land } = require('../models');
const HttpError = require('../utils/httpError');
const pick = require('../utils/pick');
const { getPagination, buildMeta } = require('../utils/pagination');

const WRITABLE_FIELDS = ['code', 'name', 'isActive'];

const getById = async (id) => {
  const land = await Land.findByPk(id);
  if (!land) throw new HttpError(404, 'Ubicación no encontrada');
  return land;
};

const list = async (query) => {
  const pagination = getPagination(query);
  const where = {};

  if (query.search) {
    const term = `%${query.search}%`;
    where[Op.or] = [{ code: { [Op.iLike]: term } }, { name: { [Op.iLike]: term } }];
  }
  if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

  const { rows, count } = await Land.findAndCountAll({
    where,
    order: [['name', 'ASC'], ['id', 'ASC']],
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return { data: rows, meta: buildMeta(pagination, count) };
};

const create = (body) => Land.create(pick(body, WRITABLE_FIELDS));

const update = async (id, body) => {
  const land = await getById(id);
  return land.update(pick(body, WRITABLE_FIELDS));
};

const remove = async (id) => {
  const land = await getById(id);
  await land.destroy();
};

module.exports = { list, getById, create, update, remove };
