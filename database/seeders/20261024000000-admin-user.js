'use strict';

const bcrypt = require('bcryptjs');

const getAdminData = () => ({
  email: (process.env.ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase(),
  password: process.env.ADMIN_PASSWORD || 'Admin12345',
});

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const { email, password } = getAdminData();

    const [existing] = await queryInterface.sequelize.query('SELECT id FROM users WHERE email = :email', {
      replacements: { email },
    });
    if (existing.length) return;

    await queryInterface.bulkInsert('users', [
      {
        name: 'Administrador',
        email,
        password_hash: await bcrypt.hash(password, 10),
        role: 'admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: getAdminData().email });
  },
};
