const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken } = require('./auth');

// GET /api/bookings - Get all bookings for PO's travels
router.get('/', verifyToken, async (req, res) => {
  try {
    const [bookings] = await db.query(
      `SELECT b.*, 
              t.route_name, t.origin, t.destination, t.departure_time, t.price,
              s.full_name as student_name, 
              u.phone as student_phone, u.email as student_email
       FROM bookings b
       JOIN travels t ON b.travel_id = t.id
       JOIN students s ON b.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE t.po_id = ?
       ORDER BY b.booked_at DESC`,
      [req.poId]
    );
    
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// GET /api/bookings/:id - Get single booking detail
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [bookings] = await db.query(
      `SELECT b.*, 
              t.route_name, t.origin, t.destination, t.departure_time, t.arrival_time, t.price,
              v.plate_number, v.vehicle_type,
              d.full_name as driver_name,
              s.full_name as student_name, s.nim, s.university,
              u.phone as student_phone, u.email as student_email
       FROM bookings b
       JOIN travels t ON b.travel_id = t.id
       LEFT JOIN vehicles v ON t.vehicle_id = v.id
       LEFT JOIN drivers d ON t.driver_id = d.id
       JOIN students s ON b.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE b.id = ? AND t.po_id = ?`,
      [req.params.id, req.poId]
    );
    
    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking tidak ditemukan' });
    }
    
    res.json({ success: true, data: bookings[0] });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// PUT /api/bookings/:id/status - Update booking status
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status tidak valid' 
      });
    }
    
    // Verify booking belongs to PO
    const [bookings] = await db.query(
      `SELECT b.id FROM bookings b
       JOIN travels t ON b.travel_id = t.id
       WHERE b.id = ? AND t.po_id = ?`,
      [req.params.id, req.poId]
    );
    
    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking tidak ditemukan' });
    }
    
    await db.query(
      'UPDATE bookings SET booking_status = ? WHERE id = ?',
      [status, req.params.id]
    );
    
    res.json({ success: true, message: 'Status booking berhasil diperbarui' });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
