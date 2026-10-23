const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User } = require('../models');
const HttpError = require('../utils/httpError');
const pick = require('../utils/pick');
const { getPagination, buildMeta } = require('../utils/pagination');

const WRITABLE_FIELDS = ['name', 'email', 'role', 'isActive'];
const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

const hashPassword = (password) => {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, 'Validation failed', [
      { field: 'password', message: `password must be a string of at least ${MIN_PASSWORD_LENGTH} characters` },
    ]);
  }
  return bcrypt.hash(password, SALT_ROUNDS);
};

const getById = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw new HttpError(404, 'User not found');
  return user;
};

const list = async (query) => {
  const pagination = getPagination(query);
  const where = {};

  if (query.search) {
    const term = `%${query.search}%`;
    where[Op.or] = [{ name: { [Op.iLike]: term } }, { email: { [Op.iLike]: term } }];
  }
  if (query.role) where.role = query.role;
  if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

  const { rows, count } = await User.findAndCountAll({
    where,
    order: [['name', 'ASC'], ['id', 'ASC']],
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return { data: rows, meta: buildMeta(pagination, count) };
};

const create = async (body) => {
  const passwordHash = await hashPassword(body.password);
  return User.create({ ...pick(body, WRITABLE_FIELDS), passwordHash });
};

const update = async (id, body) => {
  const user = await getById(id);
  const data = pick(body, WRITABLE_FIELDS);
  if (body.password !== undefined) data.passwordHash = await hashPassword(body.password);
  return user.update(data);
};

const remove = async (id) => {
  const user = await getById(id);
  await user.destroy();
};

module.exports = { list, getById, create, update, remove };
