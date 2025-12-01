# Live Tracking & Weather API Documentation

## 🗺️ Live Tracking Endpoints

### 1. Update Driver Location
**POST** `/api/tracking/driver-location`

Update lokasi GPS driver secara real-time.

**Request Body:**
```json
{
  "driver_id": 1,
  "travel_id": 5,
  "latitude": -0.9471168,
  "longitude": 100.4174862,
  "speed": 45.5,
  "heading": 180.0,
  "accuracy": 5.0
}
```

**Response:**
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

### 2. Get Driver Location
**GET** `/api/tracking/driver-location/:driver_id`

Mendapatkan lokasi terkini dari driver tertentu.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "driver_id": 1,
    "driver_name": "John Driver",
    "travel_id": 5,
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

### 3. Start/Update Travel Tracking
**POST** `/api/tracking/travel`

Memulai atau update status tracking perjalanan.

**Request Body:**
```json
{
  "travel_id": 5,
  "driver_id": 1,
  "booking_id": 10,
  "tracking_status": "picking_up",
  "pickup_eta_minutes": 15,
  "journey_eta_minutes": 120,
  "total_distance_km": 85.5,
  "remaining_distance_km": 70.2,
  "current_location_name": "Padang Panjang",
  "notes": "Sedang dalam perjalanan menuju customer"
}
```

**Tracking Status:**
- `waiting` - Menunggu untuk berangkat
- `picking_up` - Sedang menjemput customer
- `on_route` - Dalam perjalanan
- `arrived` - Sudah sampai tujuan
- `completed` - Perjalanan selesai
- `cancelled` - Dibatalkan

**Response:**
```json
{
  "success": true,
  "message": "Travel tracking berhasil diupdate"
}
```

---

### 4. Get Travel Tracking Details
**GET** `/api/tracking/travel/:travel_id`

Mendapatkan detail tracking untuk perjalanan tertentu.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 50,
    "travel_id": 5,
    "driver_id": 1,
    "driver_name": "John Driver",
    "driver_phone": "081234567890",
    "driver_latitude": -0.9471168,
    "driver_longitude": 100.4174862,
    "speed": 45.5,
    "heading": 180.0,
    "location_updated_at": "2025-12-01T10:30:00.000Z",
    "tracking_status": "on_route",
    "pickup_started_at": "2025-12-01T09:00:00.000Z",
    "pickup_completed_at": "2025-12-01T09:45:00.000Z",
    "journey_started_at": "2025-12-01T09:50:00.000Z",
    "journey_eta_minutes": 90,
    "total_distance_km": 85.5,
    "remaining_distance_km": 50.2,
    "current_location_name": "Padang Panjang",
    "route_name": "Padang - Bukittinggi",
    "origin": "Padang",
    "destination": "Bukittinggi",
    "departure_time": "2025-12-01T08:00:00.000Z",
    "plate_number": "BA 1234 CD",
    "vehicle_type": "Avanza"
  }
}
```

---

### 5. Get All Active Travels (for PO)
**GET** `/api/tracking/active-travels`

Mendapatkan semua perjalanan aktif yang sedang di-track untuk PO.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 50,
      "travel_id": 5,
      "driver_name": "John Driver",
      "driver_latitude": -0.9471168,
      "driver_longitude": 100.4174862,
      "speed": 45.5,
      "tracking_status": "on_route",
      "route_name": "Padang - Bukittinggi",
      "plate_number": "BA 1234 CD",
      "vehicle_type": "Avanza",
      "total_passengers": 8
    }
  ]
}
```

---

### 6. Create Pickup Queue
**POST** `/api/tracking/pickup-queue`

Membuat antrian penjemputan customer berdasarkan jarak terdekat dari driver.

**Request Body:**
```json
{
  "travel_id": 5,
  "driver_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pickup queue berhasil dibuat",
  "data": [
    {
      "travel_id": 5,
      "driver_id": 1,
      "booking_id": 10,
      "customer_latitude": -0.9471168,
      "customer_longitude": 100.4174862,
      "customer_address": "Jl. Sudirman No. 123, Padang",
      "distance_km": 2.5,
      "pickup_order": 1
    },
    {
      "travel_id": 5,
      "driver_id": 1,
      "booking_id": 11,
      "customer_latitude": -0.9521168,
      "customer_longitude": 100.4224862,
      "customer_address": "Jl. Veteran No. 45, Padang",
      "distance_km": 4.8,
      "pickup_order": 2
    }
  ]
}
```

---

### 7. Get Pickup Queue
**GET** `/api/tracking/pickup-queue/:travel_id`

Mendapatkan daftar antrian penjemputan untuk travel tertentu.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 100,
      "travel_id": 5,
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
      "seat_number": "A1",
      "estimated_arrival_time": null,
      "actual_pickup_time": null
    }
  ]
}
```

---

### 8. Update Pickup Status
**PUT** `/api/tracking/pickup-queue/:id/status`

Update status penjemputan customer.

**Request Body:**
```json
{
  "pickup_status": "picked_up"
}
```

**Pickup Status:**
- `pending` - Belum dijemput
- `in_progress` - Sedang dalam perjalanan ke lokasi pickup
- `picked_up` - Sudah dijemput
- `skipped` - Dilewati

**Response:**
```json
{
  "success": true,
  "message": "Status pickup berhasil diupdate"
}
```

---

## ☁️ Weather API Endpoints

### 1. Get Weather by Location
**GET** `/api/weather/location?latitude=-0.9471168&longitude=100.4174862&location_name=Padang`

Mendapatkan kondisi cuaca untuk koordinat tertentu.

**Query Parameters:**
- `latitude` (required) - Latitude lokasi
- `longitude` (required) - Longitude lokasi
- `location_name` (optional) - Nama lokasi

**Response:**
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
    "temp_min": 26.0,
    "temp_max": 28.5,
    "humidity": 85,
    "pressure": 1012,
    "visibility": 8000,
    "wind_speed": 3.5,
    "wind_deg": 180,
    "clouds": 75,
    "rain_1h": 2.5,
    "rain_3h": null,
    "fetched_at": "2025-12-01T10:30:00.000Z"
  },
  "cached": false
}
```

**Weather Icons:**
- `01d/01n` - Cerah
- `02d/02n` - Berawan sebagian
- `03d/03n` - Berawan
- `04d/04n` - Berawan gelap
- `09d/09n` - Hujan ringan
- `10d/10n` - Hujan
- `11d/11n` - Badai petir
- `13d/13n` - Salju
- `50d/50n` - Kabut

---

### 2. Get Weather for Route
**GET** `/api/weather/route`

Mendapatkan kondisi cuaca untuk rute (asal dan tujuan).

**Query Parameters:**
- `origin_lat` (required)
- `origin_lon` (required)
- `dest_lat` (required)
- `dest_lon` (required)
- `origin_name` (optional)
- `dest_name` (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "origin": {
      "location_name": "Padang",
      "temperature": 27.5,
      "weather_main": "Rain",
      "weather_description": "hujan ringan"
    },
    "destination": {
      "location_name": "Bukittinggi",
      "temperature": 22.0,
      "weather_main": "Clouds",
      "weather_description": "berawan"
    },
    "weather_alert": {
      "has_alert": true,
      "condition": "rainy",
      "alerts": [
        "Hujan terdeteksi di rute perjalanan"
      ],
      "message": "Cuaca buruk terdeteksi. Berkendara dengan hati-hati."
    }
  }
}
```

---

### 3. Get Weather for Travel
**GET** `/api/weather/travel/:travel_id`

Mendapatkan kondisi cuaca untuk travel tertentu.

**Response:**
```json
{
  "success": true,
  "data": {
    "travel_id": 5,
    "route_name": "Padang - Bukittinggi",
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
      "alerts": [
        "Hujan terdeteksi di rute perjalanan"
      ],
      "message": "Cuaca buruk terdeteksi. Berkendara dengan hati-hati."
    }
  }
}
```

---

## 🔑 Setup Weather API

1. Daftar akun gratis di [OpenWeatherMap](https://openweathermap.org/api)
2. Dapatkan API Key
3. Tambahkan ke file `.env`:
   ```
   OPENWEATHER_API_KEY=your_api_key_here
   ```

---

## 📊 Use Cases

### For Driver App:
1. **Update Lokasi Otomatis**
   - Panggil `POST /api/tracking/driver-location` setiap 5-10 detik
   
2. **Lihat Antrian Penjemputan**
   - Panggil `GET /api/tracking/pickup-queue/:travel_id`
   - Jemput customer berdasarkan `pickup_order` (terdekat dulu)
   
3. **Update Status Pickup**
   - Panggil `PUT /api/tracking/pickup-queue/:id/status` saat customer sudah naik

### For PO App:
1. **Monitor Semua Driver**
   - Panggil `GET /api/tracking/active-travels`
   - Tampilkan semua driver di map
   
2. **Cek Cuaca Rute**
   - Panggil `GET /api/weather/travel/:travel_id`
   - Tampilkan warning jika cuaca buruk

### For Customer/Student App:
1. **Track Driver Saya**
   - Panggil `GET /api/tracking/travel/:travel_id`
   - Tampilkan posisi driver di map
   
2. **Lihat ETA Penjemputan**
   - Ambil `pickup_eta_minutes` dari response tracking

---

## 🛠️ Database Migration

Jalankan migration untuk membuat tabel tracking:

```bash
mysql -h <host> -P <port> -u <user> -p <database> < migrations/add_live_tracking_tables.sql
```

Atau via Railway CLI:
```bash
railway run mysql < migrations/add_live_tracking_tables.sql
```

---

## 📝 Notes

- Data cuaca di-cache selama 30 menit untuk menghemat API calls
- Lokasi driver akan otomatis expired jika tidak update > 5 menit
- Pickup queue otomatis diurutkan berdasarkan jarak terdekat
- Weather alerts otomatis diset jika ada kondisi berbahaya

