const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const User = sequelize.define('user', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  resetToken: Sequelize.STRING,
  resetTokenExpiration: Sequelize.DataTypes.DATE,
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  // name: Sequelize.STRING,
 email: {
    type: Sequelize.STRING,
    allowNull: false,
    primaryKey: true
  }
});

module.exports = User;
