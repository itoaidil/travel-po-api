const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken } = require('./auth');

// ==================== DRIVER LOCATION TRACKING ====================

// POST /api/tracking/driver-location - Update driver's current location
router.post('/driver-location', verifyToken, async (req, res) => {
  try {
    const {
      driver_id,
      travel_id,
      latitude,
      longitude,
      speed,
      heading,
      accuracy
    } = req.body;

    if (!driver_id || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Driver ID, latitude, dan longitude wajib diisi'
      });
    }

    // Update or insert driver location
    await db.query(
      `INSERT INTO driver_locations 
       (driver_id, travel_id, latitude, longitude, speed, heading, accuracy, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE
       travel_id = VALUES(travel_id),
       latitude = VALUES(latitude),
       longitude = VALUES(longitude),
       speed = VALUES(speed),
       heading = VALUES(heading),
       accuracy = VALUES(accuracy),
       updated_at = CURRENT_TIMESTAMP`,
      [driver_id, travel_id || null, latitude, longitude, speed || 0, heading || null, accuracy || null]
    );

    // Update driver's current location in drivers table
    await db.query(
      `UPDATE drivers 
       SET current_latitude = ?, 
           current_longitude = ?, 
           last_location_update = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [latitude, longitude, driver_id]
    );

    res.json({
      success: true,
      message: 'Lokasi driver berhasil diupdate',
      data: { latitude, longitude, timestamp: new Date() }
    });
  } catch (error) {
    console.error('Update driver location error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// GET /api/tracking/driver-location/:driver_id - Get driver's current location
router.get('/driver-location/:driver_id', verifyToken, async (req, res) => {
  try {
    const [locations] = await db.query(
      `SELECT dl.*, d.full_name as driver_name
       FROM driver_locations dl
       JOIN drivers d ON dl.driver_id = d.id
       WHERE dl.driver_id = ? AND dl.is_active = TRUE
       ORDER BY dl.updated_at DESC
       LIMIT 1`,
      [req.params.driver_id]
    );

    if (locations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lokasi driver tidak ditemukan'
      });
    }

    res.json({ success: true, data: locations[0] });
  } catch (error) {
    console.error('Get driver location error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ==================== TRAVEL TRACKING ====================

// POST /api/tracking/travel - Start or update travel tracking
router.post('/travel', verifyToken, async (req, res) => {
  try {
    const {
      travel_id,
      driver_id,
      booking_id,
      tracking_status,
      pickup_eta_minutes,
      journey_eta_minutes,
      total_distance_km,
      remaining_distance_km,
      current_location_name,
      notes
    } = req.body;

    if (!travel_id || !driver_id) {
      return res.status(400).json({
        success: false,
        message: 'Travel ID dan Driver ID wajib diisi'
      });
    }

    // Check if tracking exists
    const [existing] = await db.query(
      'SELECT id FROM travel_tracking WHERE travel_id = ? AND driver_id = ?',
      [travel_id, driver_id]
    );

    if (existing.length > 0) {
      // Update existing tracking
      const updates = [];
      const values = [];

      if (tracking_status) {
        updates.push('tracking_status = ?');
        values.push(tracking_status);

        // Auto-set timestamps based on status
        if (tracking_status === 'picking_up' && !existing[0].pickup_started_at) {
          updates.push('pickup_started_at = CURRENT_TIMESTAMP');
        } else if (tracking_status === 'on_route' && !existing[0].journey_started_at) {
          updates.push('journey_started_at = CURRENT_TIMESTAMP');
          updates.push('pickup_completed_at = CURRENT_TIMESTAMP');
        } else if (tracking_status === 'completed') {
          updates.push('journey_completed_at = CURRENT_TIMESTAMP');
        }
      }

      if (pickup_eta_minutes !== undefined) {
        updates.push('pickup_eta_minutes = ?');
        values.push(pickup_eta_minutes);
      }
      if (journey_eta_minutes !== undefined) {
        updates.push('journey_eta_minutes = ?');
        values.push(journey_eta_minutes);
      }
      if (total_distance_km !== undefined) {
        updates.push('total_distance_km = ?');
        values.push(total_distance_km);
      }
      if (remaining_distance_km !== undefined) {
        updates.push('remaining_distance_km = ?');
        values.push(remaining_distance_km);
      }
      if (current_location_name) {
        updates.push('current_location_name = ?');
        values.push(current_location_name);
      }
      if (notes) {
        updates.push('notes = ?');
        values.push(notes);
      }

      values.push(existing[0].id);

      await db.query(
        `UPDATE travel_tracking SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      res.json({
        success: true,
        message: 'Travel tracking berhasil diupdate'
      });
    } else {
      // Create new tracking
      await db.query(
        `INSERT INTO travel_tracking 
         (travel_id, driver_id, booking_id, tracking_status, pickup_eta_minutes, 
          journey_eta_minutes, total_distance_km, remaining_distance_km, 
          current_location_name, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          travel_id,
          driver_id,
          booking_id || null,
          tracking_status || 'waiting',
          pickup_eta_minutes || null,
          journey_eta_minutes || null,
          total_distance_km || null,
          remaining_distance_km || null,
          current_location_name || null,
          notes || null
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Travel tracking berhasil dibuat'
      });
    }
  } catch (error) {
    console.error('Travel tracking error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// GET /api/tracking/travel/:travel_id - Get travel tracking details
router.get('/travel/:travel_id', verifyToken, async (req, res) => {
  try {
    const [tracking] = await db.query(
      `SELECT tt.*,
              d.full_name as driver_name, d.phone as driver_phone,
              dl.latitude as driver_latitude, dl.longitude as driver_longitude,
              dl.speed, dl.heading, dl.updated_at as location_updated_at,
              t.route_name, t.origin, t.destination, t.departure_time,
              v.plate_number, v.vehicle_type
       FROM travel_tracking tt
       JOIN drivers d ON tt.driver_id = d.id
       LEFT JOIN driver_locations dl ON tt.driver_id = dl.driver_id AND dl.is_active = TRUE
       JOIN travels t ON tt.travel_id = t.id
       LEFT JOIN vehicles v ON t.vehicle_id = v.id
       WHERE tt.travel_id = ?
       ORDER BY tt.updated_at DESC
       LIMIT 1`,
      [req.params.travel_id]
    );

    if (tracking.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Travel tracking tidak ditemukan'
      });
    }

    res.json({ success: true, data: tracking[0] });
  } catch (error) {
    console.error('Get travel tracking error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// GET /api/tracking/active-travels - Get all active travels being tracked for PO
router.get('/active-travels', verifyToken, async (req, res) => {
  try {
    const [travels] = await db.query(
      `SELECT tt.*,
              d.full_name as driver_name, d.phone as driver_phone,
              dl.latitude as driver_latitude, dl.longitude as driver_longitude,
              dl.speed, dl.heading, dl.updated_at as location_updated_at,
              t.route_name, t.origin, t.destination, t.departure_time,
              v.plate_number, v.vehicle_type,
              (SELECT COUNT(*) FROM bookings WHERE travel_id = t.id) as total_passengers
       FROM travel_tracking tt
       JOIN drivers d ON tt.driver_id = d.id
       LEFT JOIN driver_locations dl ON tt.driver_id = dl.driver_id AND dl.is_active = TRUE
       JOIN travels t ON tt.travel_id = t.id
       LEFT JOIN vehicles v ON t.vehicle_id = v.id
       WHERE t.po_id = ? 
       AND tt.tracking_status NOT IN ('completed', 'cancelled')
       ORDER BY tt.updated_at DESC`,
      [req.poId]
    );

    res.json({ success: true, data: travels });
  } catch (error) {
    console.error('Get active travels error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ==================== PICKUP QUEUE MANAGEMENT ====================

// POST /api/tracking/pickup-queue - Create pickup queue for a travel
router.post('/pickup-queue', verifyToken, async (req, res) => {
  try {
    const { travel_id, driver_id } = req.body;

    if (!travel_id || !driver_id) {
      return res.status(400).json({
        success: false,
        message: 'Travel ID dan Driver ID wajib diisi'
      });
    }

    // Get driver's current location
    const [driverLoc] = await db.query(
      'SELECT current_latitude, current_longitude FROM drivers WHERE id = ?',
      [driver_id]
    );

    if (driverLoc.length === 0 || !driverLoc[0].current_latitude) {
      return res.status(400).json({
        success: false,
        message: 'Lokasi driver tidak tersedia. Aktifkan GPS terlebih dahulu.'
      });
    }

    const driverLat = driverLoc[0].current_latitude;
    const driverLon = driverLoc[0].current_longitude;

    // Get all bookings for this travel with customer locations
    const [bookings] = await db.query(
      `SELECT b.id, b.pickup_latitude, b.pickup_longitude, b.pickup_address,
              s.full_name as customer_name
       FROM bookings b
       JOIN students s ON b.student_id = s.id
       WHERE b.travel_id = ? 
       AND b.booking_status = 'confirmed'
       AND b.pickup_latitude IS NOT NULL 
       AND b.pickup_longitude IS NOT NULL`,
      [travel_id]
    );

    if (bookings.length === 0) {
      return res.json({
        success: true,
        message: 'Tidak ada customer dengan lokasi pickup untuk travel ini',
        data: []
      });
    }

    // Calculate distance for each booking and sort by distance
    const queue = bookings.map((booking, index) => {
      const distance = calculateDistance(
        driverLat,
        driverLon,
        booking.pickup_latitude,
        booking.pickup_longitude
      );

      return {
        travel_id,
        driver_id,
        booking_id: booking.id,
        customer_latitude: booking.pickup_latitude,
        customer_longitude: booking.pickup_longitude,
        customer_address: booking.pickup_address,
        distance_km: distance,
        pickup_order: index + 1 // Will be reordered after sorting
      };
    });

    // Sort by distance (closest first)
    queue.sort((a, b) => a.distance_km - b.distance_km);

    // Update pickup_order after sorting
    queue.forEach((item, index) => {
      item.pickup_order = index + 1;
    });

    // Clear existing queue and insert new one
    await db.query('DELETE FROM pickup_queue WHERE travel_id = ? AND driver_id = ?', [travel_id, driver_id]);

    for (const item of queue) {
      await db.query(
        `INSERT INTO pickup_queue 
         (travel_id, driver_id, booking_id, customer_latitude, customer_longitude, 
          customer_address, distance_km, pickup_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.travel_id,
          item.driver_id,
          item.booking_id,
          item.customer_latitude,
          item.customer_longitude,
          item.customer_address,
          item.distance_km,
          item.pickup_order
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Pickup queue berhasil dibuat',
      data: queue
    });
  } catch (error) {
    console.error('Create pickup queue error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// GET /api/tracking/pickup-queue/:travel_id - Get pickup queue for a travel
router.get('/pickup-queue/:travel_id', verifyToken, async (req, res) => {
  try {
    const [queue] = await db.query(
      `SELECT pq.*,
              s.full_name as customer_name,
              u.phone as customer_phone,
              b.seat_number
       FROM pickup_queue pq
       JOIN bookings b ON pq.booking_id = b.id
       JOIN students s ON b.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE pq.travel_id = ?
       ORDER BY pq.pickup_order ASC`,
      [req.params.travel_id]
    );

    res.json({ success: true, data: queue });
  } catch (error) {
    console.error('Get pickup queue error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// PUT /api/tracking/pickup-queue/:id/status - Update pickup status
router.put('/pickup-queue/:id/status', verifyToken, async (req, res) => {
  try {
    const { pickup_status } = req.body;

    if (!pickup_status || !['pending', 'in_progress', 'picked_up', 'skipped'].includes(pickup_status)) {
      return res.status(400).json({
        success: false,
        message: 'Status pickup tidak valid'
      });
    }

    const updateData = { pickup_status };

    if (pickup_status === 'picked_up') {
      updateData.actual_pickup_time = new Date();
    }

    await db.query(
      `UPDATE pickup_queue 
       SET pickup_status = ?, 
           actual_pickup_time = ${pickup_status === 'picked_up' ? 'CURRENT_TIMESTAMP' : 'actual_pickup_time'}
       WHERE id = ?`,
      [pickup_status, req.params.id]
    );

    res.json({
      success: true,
      message: 'Status pickup berhasil diupdate'
    });
  } catch (error) {
    console.error('Update pickup status error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ==================== HELPER FUNCTIONS ====================

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

module.exports = router;
