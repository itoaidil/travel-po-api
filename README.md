# Travel PO API

Backend API khusus untuk **Travel PO Partner App** - Sistem manajemen kendaraan, driver, perjalanan, dan booking untuk mitra PO (Perusahaan Otobus).

## 🚀 Fitur

- ✅ Autentikasi PO (Login/Register dengan JWT)
- ✅ Manajemen Kendaraan (CRUD)
- ✅ Manajemen Driver (CRUD)
- ✅ Manajemen Perjalanan/Travel (CRUD)
- ✅ Monitoring Booking dari Student
- ✅ Protected routes dengan JWT verification

## 📦 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (Railway)
- **Auth**: JWT (jsonwebtoken)
- **Password**: bcrypt

## 🔧 Setup Lokal

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Edit `.env` dengan kredensial Railway MySQL kamu.

### 3. Run Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

## 🌐 Deployment ke Railway

### Cara 1: Deploy via GitHub (Rekomendasi)

1. **Push ke GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Travel PO API"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/travel-po-api.git
   git push -u origin main
   ```

2. **Deploy di Railway:**
   - Buka [railway.app](https://railway.app)
   - Click **"New Project"** → **"Deploy from GitHub repo"**
   - Pilih repo `travel-po-api`
   - Railway akan auto-detect Node.js dan deploy

3. **Set Environment Variables di Railway:**
   - Buka project → **Variables** tab
   - Add semua variable dari `.env.example`:
     - `MYSQL_HOST`
     - `MYSQL_PORT`
     - `MYSQL_USER`
     - `MYSQL_PASSWORD`
     - `MYSQL_DATABASE`
     - `JWT_SECRET`
   - Railway akan auto-restart setelah save

4. **Get Public URL:**
   - Buka **Settings** → **Generate Domain**
   - Copy URL (contoh: `https://travel-po-api-production.up.railway.app`)

### Cara 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login PO
- `POST /api/auth/register` - Register PO baru

### Vehicles (Protected)
- `GET /api/vehicles` - List semua kendaraan PO
- `GET /api/vehicles/:id` - Detail kendaraan
- `POST /api/vehicles` - Tambah kendaraan baru
- `PUT /api/vehicles/:id` - Update kendaraan
- `DELETE /api/vehicles/:id` - Hapus kendaraan

### Drivers (Protected)
- `GET /api/drivers` - List semua driver PO
- `POST /api/drivers` - Tambah driver baru
- `PUT /api/drivers/:id` - Update driver
- `DELETE /api/drivers/:id` - Hapus driver

### Travels (Protected)
- `GET /api/travels` - List semua perjalanan PO
- `POST /api/travels` - Buat perjalanan baru
- `PUT /api/travels/:id` - Update perjalanan
- `DELETE /api/travels/:id` - Hapus perjalanan

### Bookings (Protected)
- `GET /api/bookings` - List semua booking untuk PO
- `GET /api/bookings/:id` - Detail booking
- `PUT /api/bookings/:id/status` - Update status booking

### Health Check
- `GET /` - API info
- `GET /health` - Health status

## 🔐 Authentication

Semua endpoint (kecuali `/api/auth/*` dan `/health`) memerlukan JWT token di header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📱 Integrasi dengan Flutter App

Update `lib/utils/constants.dart` di `travel_po_app`:

```dart
class ApiConfig {
  static const String baseUrl = 'https://YOUR-RAILWAY-URL.up.railway.app';
  
  // Auth
  static const String loginPO = '/api/auth/login';
  static const String registerPO = '/api/auth/register';
  
  // Resources
  static const String vehicles = '/api/vehicles';
  static const String drivers = '/api/drivers';
  static const String travels = '/api/travels';
  static const String bookings = '/api/bookings';
}
```

## 🗄️ Database Schema

API ini menggunakan tabel berikut di Railway MySQL:
- `pos` - Data PO (company)
- `vehicles` - Kendaraan milik PO
- `drivers` - Driver milik PO
- `travels` - Perjalanan yang dijadwalkan
- `bookings` - Booking dari students
- `students` - Data student (read-only)
- `users` - User accounts (read-only)

## 📝 Login Credentials (Development)

**Email:** `admin@po-hantar.com`  
**Password:** `admin123`

> ⚠️ Password sementara hard-coded untuk development. Production harus menggunakan hashed password dari database.

## 🛠️ Troubleshooting

**Database connection failed:**
- Pastikan env variables benar
- Cek Railway MySQL masih running
- Verifikasi network/firewall

**JWT token invalid:**
- Pastikan `JWT_SECRET` sama antara deploy
- Token expired (default 7 hari)

**502 Bad Gateway:**
- Tunggu beberapa detik untuk cold start
- Cek Railway logs: `railway logs`

## 📞 Support

Jika ada masalah, cek:
1. Railway deployment logs
2. Database connection status
3. Environment variables configuration

---

**Version:** 1.0.0  
**License:** ISC
