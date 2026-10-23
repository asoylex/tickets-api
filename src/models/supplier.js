const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Supplier extends Model {
    static associate(models) {
      Supplier.hasMany(models.Ticket, { foreignKey: 'supplierId', as: 'tickets', onDelete: 'RESTRICT' });
    }
  }

  Supplier.init(
    {
      code: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
        validate: {
          notNull: { msg: 'El código es obligatorio' },
          notEmpty: { msg: 'El código es obligatorio' },
        },
      },
      name: {
        type: DataTypes.STRING(160),
        allowNull: false,
        validate: {
          notNull: { msg: 'El nombre es obligatorio' },
          notEmpty: { msg: 'El nombre es obligatorio' },
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    { sequelize, modelName: 'Supplier', tableName: 'suppliers' }
  );

  return Supplier;
};
