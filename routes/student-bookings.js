const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyStudentToken } = require('./auth');

// GET /api/student/bookings - Get booking history for logged-in student
router.get('/', verifyStudentToken, async (req, res) => {
  try {
    const [bookings] = await db.query(
      `SELECT b.*, 
              t.route_name, 
              t.origin, 
              t.destination, 
              t.departure_time, 
              t.arrival_time,
              t.price,
              t.status as travel_status,
              v.vehicle_type,
              v.plate_number,
              d.full_name as driver_name,
              po.company_name as po_name
       FROM bookings b
       JOIN travels t ON b.travel_id = t.id
       LEFT JOIN vehicles v ON t.vehicle_id = v.id
       LEFT JOIN drivers d ON t.driver_id = d.id
       LEFT JOIN po ON t.po_id = po.id
       WHERE b.student_id = ?
       ORDER BY b.booked_at DESC`,
      [req.studentId]
    );
    
    res.json({ 
      success: true, 
      data: bookings,
      count: bookings.length 
    });
  } catch (error) {
    console.error('Get student bookings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan saat mengambil riwayat booking' 
    });
  }
});

// GET /api/student/bookings/:id - Get single booking detail
router.get('/:id', verifyStudentToken, async (req, res) => {
  try {
    const [bookings] = await db.query(
      `SELECT b.*, 
              t.route_name, 
              t.origin, 
              t.destination, 
              t.departure_time, 
              t.arrival_time,
              t.price,
              t.status as travel_status,
              v.vehicle_type,
              v.plate_number,
              v.capacity,
              d.full_name as driver_name,
              d.phone as driver_phone,
              po.company_name as po_name,
              po.phone as po_phone,
              po.address as po_address
       FROM bookings b
       JOIN travels t ON b.travel_id = t.id
       LEFT JOIN vehicles v ON t.vehicle_id = v.id
       LEFT JOIN drivers d ON t.driver_id = d.id
       LEFT JOIN po ON t.po_id = po.id
       WHERE b.id = ? AND b.student_id = ?`,
      [req.params.id, req.studentId]
    );
    
    if (bookings.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking tidak ditemukan' 
      });
    }
    
    res.json({ success: true, data: bookings[0] });
  } catch (error) {
    console.error('Get booking detail error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan saat mengambil detail booking' 
    });
  }
});

// POST /api/student/bookings - Create new booking
router.post('/', verifyStudentToken, async (req, res) => {
  try {
    const { 
      travel_id, 
      pickup_address, 
      pickup_latitude, 
      pickup_longitude,
      payment_method = 'cash' 
    } = req.body;
    
    if (!travel_id || !pickup_address) {
      return res.status(400).json({ 
        success: false, 
        message: 'Travel ID dan alamat penjemputan wajib diisi' 
      });
    }
    
    // Check if travel exists and has available seats
    const [travels] = await db.query(
      `SELECT t.*, v.capacity,
              (SELECT COUNT(*) FROM bookings 
               WHERE travel_id = t.id AND booking_status != 'cancelled') as booked_seats
       FROM travels t
       LEFT JOIN vehicles v ON t.vehicle_id = v.id
       WHERE t.id = ?`,
      [travel_id]
    );
    
    if (travels.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Travel tidak ditemukan' 
      });
    }
    
    const travel = travels[0];
    const availableSeats = travel.capacity - travel.booked_seats;
    
    if (availableSeats <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Kursi sudah penuh' 
      });
    }
    
    if (travel.status === 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        message: 'Travel sudah dibatalkan' 
      });
    }
    
    // Create booking
    const [result] = await db.query(
      `INSERT INTO bookings 
       (travel_id, student_id, booking_status, payment_status, payment_method,
        pickup_address, pickup_latitude, pickup_longitude, booked_at) 
       VALUES (?, ?, 'confirmed', 'pending', ?, ?, ?, ?, NOW())`,
      [
        travel_id, 
        req.studentId, 
        payment_method,
        pickup_address,
        pickup_latitude || null,
        pickup_longitude || null
      ]
    );
    
    // Get created booking with details
    const [newBooking] = await db.query(
      `SELECT b.*, 
              t.route_name, t.origin, t.destination, t.departure_time, t.price
       FROM bookings b
       JOIN travels t ON b.travel_id = t.id
       WHERE b.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Booking berhasil dibuat',
      data: newBooking[0]
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan saat membuat booking' 
    });
  }
});

// PUT /api/student/bookings/:id/cancel - Cancel booking
router.put('/:id/cancel', verifyStudentToken, async (req, res) => {
  try {
    // Verify booking belongs to student
    const [bookings] = await db.query(
      `SELECT id, booking_status FROM bookings 
       WHERE id = ? AND student_id = ?`,
      [req.params.id, req.studentId]
    );
    
    if (bookings.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking tidak ditemukan' 
      });
    }
    
    if (bookings[0].booking_status === 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        message: 'Booking sudah dibatalkan sebelumnya' 
      });
    }
    
    if (bookings[0].booking_status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Booking sudah selesai, tidak bisa dibatalkan' 
      });
    }
    
    await db.query(
      'UPDATE bookings SET booking_status = ? WHERE id = ?',
      ['cancelled', req.params.id]
    );
    
    res.json({ 
      success: true, 
      message: 'Booking berhasil dibatalkan' 
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan saat membatalkan booking' 
    });
  }
});

module.exports = router;
