'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('users', {
      id: { 
        type: Sequelize.INTEGER, 
        allowNull: false, 
        primaryKey: true, 
        autoIncrement: true 
      },

      name: { 
        type: 
        Sequelize.STRING(120), 
        allowNull: false 
      },
      email: { 
        type: Sequelize.STRING(160), 
        allowNull: false, 
        unique: true 
      },
      password_hash: { 
        type: Sequelize.STRING(255), 
        allowNull: false 
      },
      role: { 
        type: Sequelize.STRING(20), 
        allowNull: false, 
        defaultValue: 'user' 
      },
      is_active: { 
        type: Sequelize.BOOLEAN, 
        allowNull: false, 
        defaultValue: true 
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

    await queryInterface.addConstraint('users', {
      fields: ['role'],
      type: 'check',
      where: { role: ['admin', 'user'] },
      name: 'users_role_check',
    });
  
  },

  

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */


    await queryInterface.dropTable('users');
  }
};
