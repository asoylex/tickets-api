'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tickets', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      code: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      supplier_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'suppliers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      land_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'lands', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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

    await queryInterface.addIndex('tickets', ['date'], { name: 'tickets_date_idx' });
    await queryInterface.addIndex('tickets', ['supplier_id', 'date'], { name: 'tickets_supplier_date_idx' });
    await queryInterface.addIndex('tickets', ['land_id'], { name: 'tickets_land_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tickets');
  }
};
