const Sequelize = require('sequelize');
const { logger } = require('sequelize/lib/utils/logger');

const sequelize = new Sequelize('new_schema', 'root', 'NewStrongPassword', {
  dialect: 'mysql',
  host: 'localhost',
  logging: false
});

module.exports = sequelize;
