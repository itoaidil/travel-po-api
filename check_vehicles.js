const mysql = require('mysql2/promise');
require('dotenv').config();

// Resolve values like "${VAR}" to the actual env var value if present
function resolveRef(val) {
  if (typeof val === 'string' && /^\$\{[A-Z0-9_]+\}$/.test(val)) {
    const name = val.slice(2, -1);
    return process.env[name];
  }
  return val;
}

// Prefer Railway's MYSQL* vars, then fallback to local defaults
const dbConfig = {
  host: resolveRef(process.env.MYSQLHOST) || resolveRef(process.env.MYSQL_HOST) || 'localhost',
  user: resolveRef(process.env.MYSQLUSER) || resolveRef(process.env.MYSQL_USER) || 'root',
  password: resolveRef(process.env.MYSQLPASSWORD) || resolveRef(process.env.MYSQL_PASSWORD) || '',
  database: resolveRef(process.env.MYSQLDATABASE) || resolveRef(process.env.MYSQL_DATABASE) || 'railway',
  port: Number(resolveRef(process.env.MYSQLPORT) || resolveRef(process.env.MYSQL_PORT) || 3306),
  connectTimeout: 30000, // 30 seconds for Railway cold start
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

async function checkVehicles() {
  let connection;
  try {
    console.log('Connecting to MySQL...');
    console.log(`Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`Database: ${dbConfig.database}`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL!\n');
    
    const [result] = await connection.query(`
      SELECT 
        id, 
        vehicle_number, 
        plate_number, 
        vehicle_type, 
        brand, 
        model, 
        year, 
        capacity, 
        status,
        po_id,
        created_at
      FROM vehicles 
      ORDER BY id DESC 
      LIMIT 5
    `);
    
    console.log('\n=== Latest 5 Vehicles ===\n');
    result.forEach(vehicle => {
      console.log(`ID: ${vehicle.id}`);
      console.log(`Vehicle Number: ${vehicle.vehicle_number}`);
      console.log(`Plate Number: ${vehicle.plate_number}`);
      console.log(`Type: ${vehicle.vehicle_type}`);
      console.log(`Brand: ${vehicle.brand}`);
      console.log(`Model: ${vehicle.model}`);
      console.log(`Year: ${vehicle.year}`);
      console.log(`Capacity: ${vehicle.capacity}`);
      console.log(`Status: ${vehicle.status}`);
      console.log(`PO ID: ${vehicle.po_id}`);
      console.log(`Created: ${vehicle.created_at}`);
      console.log('---');
    });
    
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    if (err.code) console.error('Code:', err.code);
    if (err.sqlMessage) console.error('SQL Error:', err.sqlMessage);
    if (connection) await connection.end();
    process.exit(1);
  }
}

checkVehicles();
