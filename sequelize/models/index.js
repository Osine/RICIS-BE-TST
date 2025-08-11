'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
// const process = require('process');
const basename = path.basename(__filename);
// const env = process.env.NODE_ENV || 'development';
// const config = require(__dirname + '/../config/config.js')[env];
const db = {};
const { SQLDB_URL} = require("../../config/envConfig");



const sequelize = new Sequelize(`${SQLDB_URL}`,{
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
});
// const sequelize = new Sequelize(`${config.url}`, config);

// const sequelize = new Sequelize(config.database, config.username, config.password, {
//   host: config.host,
//   dialect: config.dialect,
// });

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    try {
      const modelDefiner = require(path.join(__dirname, file));
      const model = modelDefiner(sequelize, Sequelize.DataTypes);
      
      // Add this check to prevent the error
      if (model && model.name) {
        db[model.name] = model;
      } else {
        console.error(`Model file ${file} returned undefined or invalid model`);
      }
    } catch (error) {
      console.error(`Error loading model file ${file}:`, error.message);
    }
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
