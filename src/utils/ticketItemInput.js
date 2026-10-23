const pick = require('./pick');

const ITEM_FIELDS = ['productId', 'quantity', 'price'];

// Validates the body of a ticket line. With partial: true, missing fields are accepted (used by PATCH).
const parseItemInput = (input, { prefix = '', partial = false } = {}) => {
  const data = pick(input, ITEM_FIELDS);
  const details = [];
  const addError = (name, message) => details.push({ field: `${prefix}${name}`, message });

  if (!(partial && data.productId === undefined)) {
    if (!Number.isInteger(data.productId) || data.productId < 1) {
      addError('productId', 'productId must be a positive integer');
    }
  }

  ['quantity', 'price'].forEach((name) => {
    if (partial && data[name] === undefined) return;
    const value = data[name];
    const number = Number(value);
    if (value === undefined || value === null || value === '' || !Number.isFinite(number) || number < 0) {
      addError(name, `${name} must be a number greater than or equal to 0`);
    } else {
      data[name] = number;
    }
  });

  return { data, details };
};

module.exports = { parseItemInput };
