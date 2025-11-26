const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDriversTable() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE
  });

  try {
    console.log('=== Checking drivers table structure ===\n');
    
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'drivers'
      ORDER BY ORDINAL_POSITION
    `, [process.env.MYSQLDATABASE]);
    
    console.log('Columns in drivers table:');
    columns.forEach(col => {
      console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})${col.COLUMN_DEFAULT ? ` default: ${col.COLUMN_DEFAULT}` : ''}`);
    });
    
    console.log('\n=== Existing drivers ===\n');
    const [drivers] = await connection.query('SELECT * FROM drivers LIMIT 5');
    console.log(`Found ${drivers.length} drivers`);
    if (drivers.length > 0) {
      console.log(JSON.stringify(drivers[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkDriversTable();
