# Testing Guide - Live Tracking & Weather API

## 🚀 Quick Start

### 1. Import Collection ke Postman
1. Buka Postman
2. Click **Import**
3. Pilih file `postman_collection.json`
4. Collection "Travel PO API - Live Tracking & Weather" akan muncul

### 2. Setup Environment Variables
Collection sudah include variables:
- `base_url`: http://localhost:3000/api (ganti dengan Railway URL jika test production)
- `token`: Auto-saved setelah login
- `driver_id`: 1 (ganti sesuai data di database)
- `travel_id`: 1 (ganti sesuai data di database)

### 3. Testing Flow

## 📋 Test Scenario 1: Complete Tracking Flow

### Step 1: Login PO
**Endpoint:** `POST /api/auth/login`

**Body:**
```json
{
  "username": "test_po1",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "po_name": "Test PO Demo"
  }
}
```

✅ Token akan otomatis disimpan ke variable `{{token}}`

---

### Step 2: Update Driver Location
**Endpoint:** `POST /api/tracking/driver-location`

**Body:**
```json
{
  "driver_id": 1,
  "travel_id": 1,
  "latitude": -0.9471168,
  "longitude": 100.4174862,
  "speed": 45.5,
  "heading": 180.0,
  "accuracy": 5.0
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Lokasi driver berhasil diupdate",
  "data": {
    "latitude": -0.9471168,
    "longitude": 100.4174862,
    "timestamp": "2025-12-01T10:30:00.000Z"
  }
}
```

---

### Step 3: Get Driver Location
**Endpoint:** `GET /api/tracking/driver-location/1`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "driver_id": 1,
    "driver_name": "John Driver",
    "travel_id": 1,
    "latitude": -0.9471168,
    "longitude": 100.4174862,
    "speed": 45.5,
    "heading": 180.0,
    "accuracy": 5.0,
    "is_active": true,
    "updated_at": "2025-12-01T10:30:00.000Z"
  }
}
```

---

### Step 4: Start Travel Tracking
**Endpoint:** `POST /api/tracking/travel`

**Body:**
```json
{
  "travel_id": 1,
  "driver_id": 1,
  "tracking_status": "waiting",
  "pickup_eta_minutes": 15,
  "journey_eta_minutes": 120,
  "total_distance_km": 85.5,
  "remaining_distance_km": 85.5,
  "current_location_name": "Padang"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Travel tracking berhasil dibuat"
}
```

---

### Step 5: Create Pickup Queue
**Endpoint:** `POST /api/tracking/pickup-queue`

**Body:**
```json
{
  "travel_id": 1,
  "driver_id": 1
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Pickup queue berhasil dibuat",
  "data": [
    {
      "travel_id": 1,
      "driver_id": 1,
      "booking_id": 10,
      "customer_latitude": -0.9471168,
      "customer_longitude": 100.4174862,
      "customer_address": "Jl. Sudirman No. 123, Padang",
      "distance_km": 2.5,
      "pickup_order": 1
    },
    {
      "booking_id": 11,
      "distance_km": 4.8,
      "pickup_order": 2
    }
  ]
}
```

⚠️ **Note:** Untuk bisa create pickup queue, harus ada booking dengan:
- `pickup_latitude` dan `pickup_longitude` sudah diisi
- `booking_status` = 'confirmed'

---

### Step 6: Get Pickup Queue
**Endpoint:** `GET /api/tracking/pickup-queue/1`

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 100,
      "travel_id": 1,
      "driver_id": 1,
      "booking_id": 10,
      "customer_name": "Ahmad Student",
      "customer_phone": "081234567890",
      "customer_latitude": -0.9471168,
      "customer_longitude": 100.4174862,
      "customer_address": "Jl. Sudirman No. 123, Padang",
      "distance_km": 2.5,
      "pickup_order": 1,
      "pickup_status": "pending",
      "seat_number": "A1"
    }
  ]
}
```

---

### Step 7: Update Travel to Picking Up
**Endpoint:** `POST /api/tracking/travel`

**Body:**
```json
{
  "travel_id": 1,
  "driver_id": 1,
  "tracking_status": "picking_up",
  "pickup_eta_minutes": 10,
  "current_location_name": "Menuju lokasi penjemputan"
}
```

---

### Step 8: Update Pickup Status
**Endpoint:** `PUT /api/tracking/pickup-queue/100/status`

**Body:**
```json
{
  "pickup_status": "picked_up"
}
```

Ganti `100` dengan ID dari pickup_queue yang didapat di Step 6.

---

### Step 9: Get All Active Travels (PO Monitor)
**Endpoint:** `GET /api/tracking/active-travels`

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 50,
      "travel_id": 1,
      "driver_name": "John Driver",
      "driver_latitude": -0.9471168,
      "driver_longitude": 100.4174862,
      "speed": 45.5,
      "tracking_status": "picking_up",
      "route_name": "Padang - Bukittinggi",
      "plate_number": "BA 1234 CD",
      "vehicle_type": "Avanza",
      "total_passengers": 8
    }
  ]
}
```

---

## 📋 Test Scenario 2: Weather API

### Step 1: Get Weather by Location (Padang)
**Endpoint:** `GET /api/weather/location?latitude=-0.9471168&longitude=100.4174862&location_name=Padang`

⚠️ **Prerequisites:** Set `OPENWEATHER_API_KEY` di environment variables

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "location_name": "Padang",
    "latitude": -0.9471168,
    "longitude": 100.4174862,
    "weather_main": "Rain",
    "weather_description": "hujan ringan",
    "weather_icon": "10d",
    "temperature": 27.5,
    "feels_like": 29.2,
    "humidity": 85,
    "wind_speed": 3.5,
    "clouds": 75,
    "rain_1h": 2.5
  },
  "cached": false
}
```

---

### Step 2: Get Weather for Route
**Endpoint:** `GET /api/weather/route?origin_lat=-0.9471168&origin_lon=100.4174862&origin_name=Padang&dest_lat=-0.3055&dest_lon=100.3692&dest_name=Bukittinggi`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "origin": {
      "location_name": "Padang",
      "temperature": 27.5,
      "weather_main": "Rain"
    },
    "destination": {
      "location_name": "Bukittinggi",
      "temperature": 22.0,
      "weather_main": "Clouds"
    },
    "weather_alert": {
      "has_alert": true,
      "condition": "rainy",
      "alerts": ["Hujan terdeteksi di rute perjalanan"],
      "message": "Cuaca buruk terdeteksi. Berkendara dengan hati-hati."
    }
  }
}
```

---

## 🐛 Troubleshooting

### Error: "Lokasi driver tidak tersedia"
**Solusi:** Pastikan driver sudah update lokasi minimal sekali dengan endpoint `POST /api/tracking/driver-location`

### Error: "Tidak ada customer dengan lokasi pickup"
**Solusi:** Pastikan ada booking dengan kolom `pickup_latitude` dan `pickup_longitude` yang sudah diisi.

Update booking dengan query:
```sql
UPDATE bookings 
SET pickup_latitude = -0.9471168, 
    pickup_longitude = 100.4174862,
    pickup_address = 'Jl. Sudirman No. 123, Padang'
WHERE id = 1;
```

### Error: "Weather API key tidak dikonfigurasi"
**Solusi:** 
1. Daftar di https://openweathermap.org/api (gratis)
2. Dapatkan API key
3. Tambahkan ke `.env`:
   ```
   OPENWEATHER_API_KEY=your_api_key_here
   ```
4. Restart server

### Error: "Travel tracking tidak ditemukan"
**Solusi:** Pastikan sudah membuat tracking dengan `POST /api/tracking/travel` terlebih dahulu.

---

## 📊 Data Requirements

Untuk testing lengkap, pastikan ada data:

1. **PO User** - Login credentials
2. **Driver** - Minimal 1 driver dengan PO terkait
3. **Travel** - Minimal 1 travel dengan status scheduled/active
4. **Booking** - Minimal 1 booking dengan pickup location

---

## 🎯 Testing Checklist

- [ ] Login berhasil dan token tersimpan
- [ ] Update driver location berhasil
- [ ] Get driver location menampilkan data terbaru
- [ ] Start travel tracking berhasil
- [ ] Create pickup queue berhasil dan terurut by jarak
- [ ] Update pickup status berhasil
- [ ] Get active travels menampilkan semua travel aktif
- [ ] Weather API menampilkan data cuaca (jika API key tersedia)
- [ ] Weather alerts muncul saat cuaca buruk

---

## 🌐 Testing Production (Railway)

Ganti `base_url` variable menjadi:
```
https://travel-po-api-production.up.railway.app/api
```

Atau sesuai dengan URL Railway deployment Anda.

---

## 💡 Tips

1. **Save Responses:** Save response sebagai example di Postman untuk reference
2. **Environment Variables:** Buat environment terpisah untuk Local dan Production
3. **Test Scripts:** Gunakan Postman test scripts untuk automated testing
4. **Monitor Logs:** Check server logs untuk debugging
5. **Database Check:** Verifikasi data di database setelah setiap operation

