const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:jTgZAiuTxRTqEKBufZBSSsUyULZPYyDh@autorack.proxy.rlwy.net:22916/railway'
});

async function checkVehicles() {
  try {
    const result = await pool.query(`
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
    result.rows.forEach(vehicle => {
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
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

checkVehicles();
