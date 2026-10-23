const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Ticket extends Model {
    static associate(models) {
      Ticket.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' });
      Ticket.belongsTo(models.Land, { foreignKey: 'landId', as: 'land' });
      Ticket.hasMany(models.TicketItem, { foreignKey: 'ticketId', as: 'items', onDelete: 'CASCADE' });
    }
  }

  Ticket.init(
    {
      code: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
        validate: { notEmpty: true },
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: { isDate: true },
      },
      supplierId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      landId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Only available when the items were loaded together with the ticket.
      total: {
        type: DataTypes.VIRTUAL,
        get() {
          if (!this.items) return undefined;
          const sum = this.items.reduce((acc, item) => acc + item.total, 0);
          return Math.round(sum * 10000) / 10000;
        },
      },
    },
    { sequelize, modelName: 'Ticket', tableName: 'tickets' }
  );

  return Ticket;
};
