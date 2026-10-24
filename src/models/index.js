const fs = require('fs');
const path = require('path');
const {Sequelize, DataTypes} = require('sequelize');
const config = require('../config');

const env = process.env.NODE_ENV || 'development';
const {database, username, password, ...options} = config[env];

const sequelize = new Sequelize(database, username, password, options);

const db = {};

fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.endsWith('.js'))
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

Object.values(db).forEach((model) => {
    if (model.associate) {
        model.associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;


module.exports = db;