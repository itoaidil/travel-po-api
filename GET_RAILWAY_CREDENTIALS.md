# 🔑 Cara Mendapatkan Credentials Railway MySQL

## Masalah Saat Ini
- ❌ Database connection failed: Connection lost
- ❌ Script `check_vehicles.js` tidak bisa connect
- ❌ Server `travel_po_api` tidak bisa start

**Root Cause**: Credentials MySQL Railway sudah expired/berubah

---

## 📋 Langkah-langkah Mendapatkan Credentials Terbaru

### 1. Login ke Railway Dashboard
- Buka: https://railway.app/
- Login dengan akun Anda

### 2. Pilih Project
- Klik project: **travel-api-production** (atau nama project Anda)
- Akan melihat list services (MySQL, travel_api, dll)

### 3. Buka MySQL Service
- Klik service **MySQL**
- Klik tab **"Variables"** atau **"Settings"**

### 4. Copy Credentials
Copy nilai-nilai berikut:
```
MYSQLHOST=xxxxx.proxy.rlwy.net
MYSQLPORT=xxxxx
MYSQLUSER=root
MYSQLPASSWORD=xxxxxxxxxxxxxxxxxxxxxxxx
MYSQLDATABASE=railway
```

### 5. Update File `.env`
Paste ke file `.env` di folder ini:

```bash
# Railway MySQL Database
MYSQLHOST=xxxxx.proxy.rlwy.net
MYSQLPORT=xxxxx
MYSQLUSER=root
MYSQLPASSWORD=xxxxxxxxxxxxxxxxxxxxxxxx
MYSQLDATABASE=railway

PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
```

### 6. Test Connection
```bash
cd /Users/fitroaidil/Downloads/drive-download-20251121T145750Z-1-001/travel_po_api
node check_vehicles.js
```

Expected output:
```
Connecting to MySQL...
Host: xxxxx.proxy.rlwy.net:xxxxx
Database: railway
✅ Connected to MySQL!

=== Latest 5 Vehicles ===
...
```

### 7. Start Server
```bash
node server.js
```

Expected output:
```
🚀 Travel PO API running on port 3000
📍 Environment: development
✅ Database connected successfully
```

---

## 🧪 Test dari Aplikasi Flutter/Mobile

Setelah server running, test endpoint:

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Login PO (Dapatkan Token)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hananto.com",
    "password": "admin123"
  }'
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "po": { ... }
}
```

### 3. Get Vehicles (Pakai Token)
```bash
curl http://localhost:3000/api/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "vehicle_number": "VH001",
      "plate_number": "BA 1234 AB",
      "vehicle_type": "Bus",
      ...
    }
  ]
}
```

---

## 📱 Konfigurasi di Flutter App

Update `baseUrl` di Flutter app ke:

**Local Testing:**
```dart
final baseUrl = 'http://localhost:3000/api';
```

**iOS Simulator:**
```dart
final baseUrl = 'http://localhost:3000/api';
```

**Android Emulator:**
```dart
final baseUrl = 'http://10.0.2.2:3000/api';
```

**Physical Device (Same WiFi):**
```dart
final baseUrl = 'http://192.168.x.x:3000/api'; // Check your local IP
```

**Railway Production:**
```dart
final baseUrl = 'https://travel-po-api-production.up.railway.app/api';
```

---

## ✅ Checklist Sebelum Test

- [ ] Dapatkan credentials Railway terbaru
- [ ] Update file `.env` dengan credentials yang benar
- [ ] Jalankan `node check_vehicles.js` untuk test koneksi DB
- [ ] Jalankan `node server.js` untuk start API server
- [ ] Test endpoint `/health` dengan curl/browser
- [ ] Test login PO untuk dapatkan token
- [ ] Test endpoint `/api/vehicles` dengan token
- [ ] Update baseUrl di Flutter app
- [ ] Run Flutter app dan test dari UI

---

## 🆘 Troubleshooting

### Error: Connection lost
- ✅ Update credentials dari Railway Dashboard
- ✅ Check Railway project masih aktif
- ✅ Check Railway MySQL service tidak sleep

### Error: Cannot find module
- ✅ Run `npm install` di folder `travel_po_api`

### Error: Port 3000 already in use
- ✅ Kill process: `lsof -ti:3000 | xargs kill -9`
- ✅ Atau ubah PORT di `.env`

### Flutter app cannot connect
- ✅ Check baseUrl sesuai dengan device (localhost/10.0.2.2/IP)
- ✅ Check server running dengan `curl http://localhost:3000/health`
- ✅ Check CORS enabled di server.js (sudah OK)
