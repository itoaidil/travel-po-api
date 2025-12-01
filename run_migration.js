// Script to run database migration for live tracking
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Starting database migration for live tracking...\n');
  
  const config = {
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    multipleStatements: true
  };
  
  console.log('📡 Connecting to database:', config.host);
  
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database\n');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_live_tracking_tables.sql');
    console.log('📄 Reading migration file:', migrationPath);
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('⚙️  Executing migration...\n');
    
    // Execute migration
    await connection.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify tables created
    console.log('🔍 Verifying tables...');
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('driver_locations', 'travel_tracking', 'weather_conditions', 'pickup_queue')
      ORDER BY TABLE_NAME
    `, [config.database]);
    
    console.log('\n📊 Tables created:');
    tables.forEach(table => {
      console.log(`   ✓ ${table.TABLE_NAME}`);
    });
    
    // Check if columns added to existing tables
    console.log('\n🔍 Checking added columns...');
    
    const [bookingCols] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'bookings'
      AND COLUMN_NAME IN ('pickup_latitude', 'pickup_longitude', 'pickup_address', 'is_tracking_enabled')
    `, [config.database]);
    
    console.log('\n📊 Bookings table columns added:');
    if (bookingCols.length > 0) {
      bookingCols.forEach(col => {
        console.log(`   ✓ ${col.COLUMN_NAME}`);
      });
    } else {
      console.log('   ⚠️  No columns added (might already exist)');
    }
    
    const [driverCols] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'drivers'
      AND COLUMN_NAME IN ('is_available', 'current_latitude', 'current_longitude', 'last_location_update')
    `, [config.database]);
    
    console.log('\n📊 Drivers table columns added:');
    if (driverCols.length > 0) {
      driverCols.forEach(col => {
        console.log(`   ✓ ${col.COLUMN_NAME}`);
      });
    } else {
      console.log('   ⚠️  No columns added (might already exist)');
    }
    
    const [travelCols] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'travels'
      AND COLUMN_NAME IN ('tracking_enabled', 'weather_alert', 'weather_condition')
    `, [config.database]);
    
    console.log('\n📊 Travels table columns added:');
    if (travelCols.length > 0) {
      travelCols.forEach(col => {
        console.log(`   ✓ ${col.COLUMN_NAME}`);
      });
    } else {
      console.log('   ⚠️  No columns added (might already exist)');
    }
    
    console.log('\n✅ All done! Database is ready for live tracking features.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n📡 Database connection closed');
    }
  }
}

runMigration();
