const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken } = require('./auth');

// GET /api/travels - Get all travels for logged-in PO
router.get('/', verifyToken, async (req, res) => {
  try {
    const [travels] = await db.query(
      `SELECT t.*, 
              v.plate_number, v.vehicle_type, v.capacity as total_seats,
              d.full_name as driver_name,
              (SELECT COUNT(*) FROM bookings WHERE travel_id = t.id) as total_bookings,
              (v.capacity - COALESCE((SELECT COUNT(*) FROM bookings WHERE travel_id = t.id AND t.status != 'cancelled'), 0)) as available_seats
       FROM travels t
       LEFT JOIN vehicles v ON t.vehicle_id = v.id
       LEFT JOIN drivers d ON t.driver_id = d.id
       WHERE t.po_id = ?
       ORDER BY t.departure_time DESC`,
      [req.poId]
    );
    
    res.json({ success: true, data: travels });
  } catch (error) {
    console.error('Get travels error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// POST /api/travels - Create new travel
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      vehicle_id,
      driver_id,
      route_name,
      origin,
      destination,
      departure_time,
      arrival_time,
      price
    } = req.body;
    
    if (!vehicle_id || !origin || !destination || !departure_time || !price) {
      return res.status(400).json({ 
        success: false, 
        message: 'Kendaraan, asal, tujuan, waktu keberangkatan, dan harga wajib diisi' 
      });
    }
    
    const [result] = await db.query(
      `INSERT INTO travels 
       (po_id, vehicle_id, driver_id, route_name, origin, destination, departure_time, arrival_time, 
        price, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
      [req.poId, vehicle_id, driver_id || null, route_name || `${origin} - ${destination}`, origin, destination, departure_time, arrival_time || null, price]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Perjalanan berhasil ditambahkan',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create travel error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server: ' + error.message });
  }
});

// PUT /api/travels/:id - Update travel
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const {
      vehicle_id,
      driver_id,
      route_name,
      origin,
      destination,
      departure_time,
      arrival_time,
      price,
      status
    } = req.body;
    
    const [result] = await db.query(
      `UPDATE travels 
       SET vehicle_id = ?, driver_id = ?, route_name = ?, origin = ?, destination = ?,
           departure_time = ?, arrival_time = ?, price = ?, status = ?
       WHERE id = ? AND po_id = ?`,
      [vehicle_id, driver_id, route_name, origin, destination, departure_time, arrival_time, price, status || 'scheduled', req.params.id, req.poId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Perjalanan tidak ditemukan' });
    }
    
    res.json({ success: true, message: 'Perjalanan berhasil diperbarui' });
  } catch (error) {
    console.error('Update travel error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// DELETE /api/travels/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM travels WHERE id = ? AND po_id = ?',
      [req.params.id, req.poId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Perjalanan tidak ditemukan' });
    }
    
    res.json({ success: true, message: 'Perjalanan berhasil dihapus' });
  } catch (error) {
    console.error('Delete travel error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
