const { Model } = require('sequelize');

// pg returns DECIMAL columns as strings, so they are converted to numbers on read.
const toNumber = (value) => (value === null || value === undefined ? value : Number(value));

module.exports = (sequelize, DataTypes) => {
  class TicketItem extends Model {
    static associate(models) {
      TicketItem.belongsTo(models.Ticket, { foreignKey: 'ticketId', as: 'ticket', onDelete: 'CASCADE' });
      TicketItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    }
  }

  TicketItem.init(
    {
      ticketId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 },
        get() {
          return toNumber(this.getDataValue('quantity'));
        },
      },
      price: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        validate: { min: 0 },
        get() {
          return toNumber(this.getDataValue('price'));
        },
      },
      total: {
        type: DataTypes.VIRTUAL,
        get() {
          return Math.round(this.quantity * this.price * 10000) / 10000;
        },
      },
    },
    { sequelize, modelName: 'TicketItem', tableName: 'ticket_items' }
  );

  return TicketItem;
};
