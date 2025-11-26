const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkPOTable() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE
  });

  try {
    console.log('=== Checking pos table ===\n');
    
    const [pos] = await connection.query('SELECT * FROM pos LIMIT 3');
    
    if (pos.length > 0) {
      console.log(`Found ${pos.length} PO records:`);
      pos.forEach(po => {
        console.log(`\nPO ID: ${po.id}`);
        console.log(`Name: ${po.po_name}`);
        console.log(`Email: ${po.email}`);
        console.log(`Company Code: ${po.company_code}`);
        console.log(`Active: ${po.is_active}`);
      });
    } else {
      console.log('No PO records found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkPOTable();
