const { Pool, types } = require('pg');
const config = require('./config.json')

// Override the default parsing for BIGINT (PostgreSQL type ID 20)
types.setTypeParser(20, val => parseInt(val, 10)); //DO NOT DELETE THIS

// Create PostgreSQL connection using database credentials provided in config.json
// Do not edit. If the connection fails, make sure to check that config.json is filled out correctly
const connection = new Pool({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db,
  ssl: {
    rejectUnauthorized: false,
  },
});
connection.connect((err) => err && console.log(err));

/**********************
 * PROJECT MS4 ROUTES *
 **********************/

const hello = async function(req, res) {
  res.json({
    message: 'Welcome to the Climate Data API! Use the endpoints to explore climate data.',
    endpoints: [
      '/map'
    ]
  });
}

const path = require('path');

const mapPage = function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'map.html'));
};

module.exports = {
  hello,
  mapPage
};
