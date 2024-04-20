const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: '163.172.174.96',
  user: 'testeed',
  password: 'passpass31',
  database: 'seob',
  port: '3306'
});

module.exports = connection;
