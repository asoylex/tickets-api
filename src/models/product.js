const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.hasMany(models.TicketItem, { foreignKey: 'productId', as: 'ticketItems', onDelete: 'RESTRICT' });
    }
  }

  Product.init(
    {
      code: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
        validate: { notEmpty: true },
      },
      name: {
        type: DataTypes.STRING(160),
        allowNull: false,
        validate: { notEmpty: true },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    { sequelize, modelName: 'Product', tableName: 'products' }
  );

  return Product;
};
