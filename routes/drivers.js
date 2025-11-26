const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken } = require('./auth');

// GET /api/drivers - Get all drivers for logged-in PO
router.get('/', verifyToken, async (req, res) => {
  try {
    const [drivers] = await db.query(
      `SELECT id, full_name, license_number, license_type, phone, address, 
              date_of_birth, status, created_at
       FROM drivers 
       WHERE po_id = ? 
       ORDER BY created_at DESC`,
      [req.poId]
    );
    
    res.json({ success: true, data: drivers });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// POST /api/drivers - Create new driver
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      full_name,
      license_number,
      license_type,
      phone,
      address,
      date_of_birth
    } = req.body;
    
    if (!full_name || !license_number || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nama, nomor SIM, dan telepon wajib diisi' 
      });
    }
    
    const [result] = await db.query(
      `INSERT INTO drivers 
       (po_id, full_name, license_number, license_type, phone, address, date_of_birth, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [req.poId, full_name, license_number, license_type || 'A', phone, address || null, date_of_birth || null]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Driver berhasil ditambahkan',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create driver error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// PUT /api/drivers/:id - Update driver
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const {
      full_name,
      license_number,
      license_type,
      phone,
      address,
      date_of_birth,
      status
    } = req.body;
    
    const [result] = await db.query(
      `UPDATE drivers 
       SET full_name = ?, license_number = ?, license_type = ?, phone = ?, 
           address = ?, date_of_birth = ?, status = ?
       WHERE id = ? AND po_id = ?`,
      [full_name, license_number, license_type, phone, address, date_of_birth, status || 'active', req.params.id, req.poId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Driver tidak ditemukan' });
    }
    
    res.json({ success: true, message: 'Driver berhasil diperbarui' });
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// DELETE /api/drivers/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM drivers WHERE id = ? AND po_id = ?',
      [req.params.id, req.poId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Driver tidak ditemukan' });
    }
    
    res.json({ success: true, message: 'Driver berhasil dihapus' });
  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
