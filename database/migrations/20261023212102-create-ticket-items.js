'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ticket_items', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      ticket_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tickets', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      quantity: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      price: {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      },
    });

    await queryInterface.addConstraint('ticket_items', {
      fields: ['quantity'],
      type: 'check',
      where: { quantity: { [Sequelize.Op.gte]: 0 } },
      name: 'ticket_items_quantity_check',
    });

    await queryInterface.addConstraint('ticket_items', {
      fields: ['price'],
      type: 'check',
      where: { price: { [Sequelize.Op.gte]: 0 } },
      name: 'ticket_items_price_check',
    });

    await queryInterface.addIndex('ticket_items', ['ticket_id'], { name: 'ticket_items_ticket_idx' });
    await queryInterface.addIndex('ticket_items', ['product_id'], { name: 'ticket_items_product_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ticket_items');
  }
};
