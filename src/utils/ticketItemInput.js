const pick = require('./pick');

const ITEM_FIELDS = ['productId', 'quantity', 'price'];
const AMOUNT_LABELS = { quantity: 'La cantidad', price: 'El precio' };

// Valida el cuerpo de una línea de ticket. Con partial: true se aceptan campos ausentes (lo usa PATCH).
const parseItemInput = (input, { prefix = '', partial = false } = {}) => {
  const data = pick(input, ITEM_FIELDS);
  const details = [];
  const addError = (name, message) => details.push({ field: `${prefix}${name}`, message });

  if (!(partial && data.productId === undefined)) {
    if (!Number.isInteger(data.productId) || data.productId < 1) {
      addError('productId', 'Selecciona un producto');
    }
  }

  ['quantity', 'price'].forEach((name) => {
    if (partial && data[name] === undefined) return;
    const value = data[name];
    const number = Number(value);
    if (value === undefined || value === null || value === '' || !Number.isFinite(number) || number < 0) {
      addError(name, `${AMOUNT_LABELS[name]} debe ser un número mayor o igual a 0`);
    } else {
      data[name] = number;
    }
  });

  return { data, details };
};

module.exports = { parseItemInput };
