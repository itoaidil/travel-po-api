const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE
  });

  try {
    // First check table structure
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
    `, [process.env.MYSQLDATABASE]);
    
    console.log('Users table columns:', columns.map(c => c.COLUMN_NAME).join(', '));
    
    const [users] = await connection.query(`
      SELECT * 
      FROM users 
      LIMIT 5
    `);
    
    console.log('\nAll Users:');
    users.forEach(user => {
      console.log(JSON.stringify(user, null, 2));
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkUsers();
