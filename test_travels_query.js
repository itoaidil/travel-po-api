const mysql = require('mysql2/promise');
require('dotenv').config();

async function testQuery() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE
  });

  try {
    console.log('Testing travels query...\n');
    
    const [travels] = await connection.query(
      `SELECT t.*, 
              v.plate_number, v.vehicle_type, v.capacity as total_seats,
              d.full_name as driver_name,
              (SELECT COUNT(*) FROM bookings WHERE travel_id = t.id) as total_bookings,
              (v.capacity - COALESCE((SELECT COUNT(*) FROM bookings WHERE travel_id = t.id AND t.status != 'cancelled'), 0)) as available_seats
       FROM travels t
       LEFT JOIN vehicles v ON t.vehicle_id = v.id
       LEFT JOIN drivers d ON t.driver_id = d.id
       WHERE t.po_id = 1
       ORDER BY t.departure_time DESC
       LIMIT 3`
    );
    
    console.log(`Found ${travels.length} travels\n`);
    
    if (travels.length > 0) {
      console.log('First travel:');
      console.log(JSON.stringify(travels[0], null, 2));
    }
    
  } catch (error) {
    console.error('Query Error:', error.message);
    console.error('SQL Error Code:', error.code);
  } finally {
    await connection.end();
  }
}

testQuery();
