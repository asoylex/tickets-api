const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Land extends Model {
    static associate(models) {
      Land.hasMany(models.Ticket, { foreignKey: 'landId', as: 'tickets', onDelete: 'RESTRICT' });
    }
  }

  Land.init(
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
    { sequelize, modelName: 'Land', tableName: 'lands' }
  );

  return Land;
};
