const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken } = require('./auth');

// GET /api/vehicles - Get all vehicles for logged-in PO
router.get('/', verifyToken, async (req, res) => {
  try {
    const [vehicles] = await db.query(
      `SELECT id, vehicle_number, plate_number, vehicle_type, brand, model, year, 
              capacity, status, is_active, created_at, updated_at
       FROM vehicles 
       WHERE po_id = ? 
       ORDER BY created_at DESC`,
      [req.poId]
    );
    
    res.json({ success: true, data: vehicles });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// GET /api/vehicles/:id - Get single vehicle
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [vehicles] = await db.query(
      'SELECT * FROM vehicles WHERE id = ? AND po_id = ?',
      [req.params.id, req.poId]
    );
    
    if (vehicles.length === 0) {
      return res.status(404).json({ success: false, message: 'Kendaraan tidak ditemukan' });
    }
    
    res.json({ success: true, data: vehicles[0] });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// POST /api/vehicles - Create new vehicle
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      vehicle_number,
      plate_number,
      vehicle_type,
      brand,
      model,
      year,
      capacity
    } = req.body;
    
    // Validate required fields
    if (!vehicle_number || !plate_number || !vehicle_type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nomor kendaraan, plat nomor, dan jenis kendaraan wajib diisi' 
      });
    }
    
    const [result] = await db.query(
      `INSERT INTO vehicles 
       (po_id, vehicle_number, plate_number, vehicle_type, brand, model, year, capacity, status, is_active, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available', 1, NOW())`,
      [req.poId, vehicle_number, plate_number, vehicle_type, brand || null, model || null, year || null, capacity || null]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Kendaraan berhasil ditambahkan',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// PUT /api/vehicles/:id - Update vehicle
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const {
      vehicle_number,
      plate_number,
      vehicle_type,
      brand,
      model,
      year,
      capacity,
      status,
      is_active
    } = req.body;
    
    const [result] = await db.query(
      `UPDATE vehicles 
       SET vehicle_number = ?, plate_number = ?, vehicle_type = ?, brand = ?, model = ?, 
           year = ?, capacity = ?, status = ?, is_active = ?, updated_at = NOW()
       WHERE id = ? AND po_id = ?`,
      [vehicle_number, plate_number, vehicle_type, brand, model, year, capacity, status || 'available', is_active ? 1 : 0, req.params.id, req.poId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Kendaraan tidak ditemukan' });
    }
    
    res.json({ success: true, message: 'Kendaraan berhasil diperbarui' });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// DELETE /api/vehicles/:id - Delete vehicle
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM vehicles WHERE id = ? AND po_id = ?',
      [req.params.id, req.poId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Kendaraan tidak ditemukan' });
    }
    
    res.json({ success: true, message: 'Kendaraan berhasil dihapus' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
