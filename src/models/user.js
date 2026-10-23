const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    toJSON() {
      const values = { ...this.get() };
      delete values.passwordHash;
      return values;
    }
  }

  User.init(
    {
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        validate: { notEmpty: true },
      },
      email: {
        type: DataTypes.STRING(160),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
        set(value) {
          this.setDataValue('email', String(value).trim().toLowerCase());
        },
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'user',
        validate: { isIn: [['admin', 'user']] },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      defaultScope: { attributes: { exclude: ['passwordHash'] } },
      scopes: { withPassword: { attributes: { include: ['passwordHash'] } } },
    }
  );

  return User;
};
