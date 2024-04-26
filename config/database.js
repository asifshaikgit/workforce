const knex = require('knex');
require('dotenv').config();

const config = {
  client: process.env.DB_CLIENT,
  connection: {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
  },
  pool: {
    min: 0,
    max: 50,
    propagateCreateError: false // <- default is true, set to false
  },
};

const dbConnection = knex(config);  //master database connection

module.exports = { dbConnection, config };
