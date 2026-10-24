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
        validate: {
          notNull: { msg: 'El código es obligatorio' },
          notEmpty: { msg: 'El código es obligatorio' },
        },
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notNull: { msg: 'La fecha es obligatoria' },
          isDate: { msg: 'La fecha no es válida' },
        },
      },
      supplierId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notNull: { msg: 'El proveedor es obligatorio' } },
      },
      landId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notNull: { msg: 'La ubicación es obligatoria' } },
      },
      // Solo está disponible cuando las líneas se cargaron junto con el ticket.
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
