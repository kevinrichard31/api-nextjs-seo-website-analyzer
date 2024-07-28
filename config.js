const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: '109.234.166.37',
  user: 'hami6145_symfony',
  password: 'CnUamVCeysA',
  database: 'hami6145_ouivisible',
  port: '3306'
});

module.exports = connection;
