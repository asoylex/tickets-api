const { Model } = require('sequelize');

// pg devuelve las columnas DECIMAL como texto, por eso se convierten a número al leerlas.
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
        validate: { notNull: { msg: 'El ticket es obligatorio' } },
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notNull: { msg: 'El producto es obligatorio' } },
      },
      quantity: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          notNull: { msg: 'La cantidad es obligatoria' },
          min: { args: [0], msg: 'La cantidad no puede ser negativa' },
        },
        get() {
          return toNumber(this.getDataValue('quantity'));
        },
      },
      price: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        validate: {
          notNull: { msg: 'El precio es obligatorio' },
          min: { args: [0], msg: 'El precio no puede ser negativo' },
        },
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
