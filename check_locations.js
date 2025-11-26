require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkLocations() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    ssl: { rejectUnauthorized: false },
    connectTimeout: 30000
  });

  console.log('✅ Connected to Railway MySQL!\n');

  // Check if location_references table exists
  try {
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'location_references'"
    );
    
    if (tables.length === 0) {
      console.log('❌ Table location_references tidak ditemukan!');
      console.log('Cek table lain yang mungkin ada:\n');
      
      const [allTables] = await connection.query('SHOW TABLES');
      console.log('Available tables:');
      allTables.forEach(table => {
        console.log(`  - ${Object.values(table)[0]}`);
      });
    } else {
      console.log('✅ Table location_references ditemukan!\n');
      
      // Check structure
      const [columns] = await connection.query(
        'DESCRIBE location_references'
      );
      
      console.log('=== Structure ===');
      columns.forEach(col => {
        console.log(`${col.Field} - ${col.Type} ${col.Null === 'YES' ? '(nullable)' : ''}`);
      });
      
      // Check data count
      const [count] = await connection.query(
        'SELECT COUNT(*) as total FROM location_references'
      );
      console.log(`\n=== Data Count: ${count[0].total} locations ===\n`);
      
      // Show sample data
      const [sample] = await connection.query(
        'SELECT * FROM location_references LIMIT 5'
      );
      
      console.log('=== Sample Data ===');
      sample.forEach((loc, idx) => {
        console.log(`${idx + 1}. ${loc.name} (${loc.type})`);
        if (loc.parent_name) console.log(`   Parent: ${loc.parent_name}`);
        console.log(`   Popular: ${loc.is_popular ? 'Yes' : 'No'}`);
        console.log('---');
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }

  await connection.end();
}

checkLocations();
