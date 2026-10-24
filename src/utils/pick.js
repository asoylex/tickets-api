// Keeps only the allowed keys, so clients cannot write fields such as id or timestamps.
const pick = (source, keys) =>
  keys.reduce((result, key) => {
    if (source && source[key] !== undefined) result[key] = source[key];
    return result;
  }, {});

module.exports = pick;
