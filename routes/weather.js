const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../config/database');
const { verifyToken } = require('./auth');

// OpenWeatherMap API configuration
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const CACHE_DURATION_MINUTES = 30; // Cache weather data for 30 minutes

// GET /api/weather/location - Get weather by coordinates
router.get('/location', verifyToken, async (req, res) => {
  try {
    const { latitude, longitude, location_name } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude dan longitude wajib diisi'
      });
    }

    // Check cache first
    const [cached] = await db.query(
      `SELECT * FROM weather_conditions 
       WHERE latitude = ? AND longitude = ?
       AND expires_at > NOW()
       ORDER BY fetched_at DESC
       LIMIT 1`,
      [latitude, longitude]
    );

    if (cached.length > 0) {
      return res.json({
        success: true,
        data: cached[0],
        cached: true
      });
    }

    // Fetch from OpenWeatherMap API
    if (!WEATHER_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Weather API key tidak dikonfigurasi'
      });
    }

    const response = await axios.get(WEATHER_API_URL, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: WEATHER_API_KEY,
        units: 'metric', // Celsius
        lang: 'id' // Indonesian
      }
    });

    const weatherData = response.data;

    // Save to database
    const expiresAt = new Date(Date.now() + CACHE_DURATION_MINUTES * 60 * 1000);

    await db.query(
      `INSERT INTO weather_conditions 
       (location_name, latitude, longitude, weather_main, weather_description, 
        weather_icon, temperature, feels_like, temp_min, temp_max, humidity, 
        pressure, visibility, wind_speed, wind_deg, clouds, rain_1h, rain_3h,
        sunrise_time, sunset_time, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
               FROM_UNIXTIME(?), FROM_UNIXTIME(?), ?)`,
      [
        location_name || weatherData.name || 'Unknown',
        latitude,
        longitude,
        weatherData.weather[0]?.main || null,
        weatherData.weather[0]?.description || null,
        weatherData.weather[0]?.icon || null,
        weatherData.main?.temp || null,
        weatherData.main?.feels_like || null,
        weatherData.main?.temp_min || null,
        weatherData.main?.temp_max || null,
        weatherData.main?.humidity || null,
        weatherData.main?.pressure || null,
        weatherData.visibility || null,
        weatherData.wind?.speed || null,
        weatherData.wind?.deg || null,
        weatherData.clouds?.all || null,
        weatherData.rain?.['1h'] || null,
        weatherData.rain?.['3h'] || null,
        weatherData.sys?.sunrise || null,
        weatherData.sys?.sunset || null,
        expiresAt
      ]
    );

    const formattedData = formatWeatherData(weatherData, latitude, longitude, location_name);

    res.json({
      success: true,
      data: formattedData,
      cached: false
    });
  } catch (error) {
    console.error('Weather API error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data cuaca',
      error: error.response?.data?.message || error.message
    });
  }
});

// GET /api/weather/route - Get weather for route (origin and destination)
router.get('/route', verifyToken, async (req, res) => {
  try {
    const { origin_lat, origin_lon, dest_lat, dest_lon, origin_name, dest_name } = req.query;

    if (!origin_lat || !origin_lon || !dest_lat || !dest_lon) {
      return res.status(400).json({
        success: false,
        message: 'Koordinat asal dan tujuan wajib diisi'
      });
    }

    // Get weather for both origin and destination
    const [originWeather, destWeather] = await Promise.all([
      getWeatherData(origin_lat, origin_lon, origin_name),
      getWeatherData(dest_lat, dest_lon, dest_name)
    ]);

    res.json({
      success: true,
      data: {
        origin: originWeather,
        destination: destWeather,
        weather_alert: checkWeatherAlert(originWeather, destWeather)
      }
    });
  } catch (error) {
    console.error('Route weather error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data cuaca rute'
    });
  }
});

// GET /api/weather/travel/:travel_id - Get weather for specific travel
router.get('/travel/:travel_id', verifyToken, async (req, res) => {
  try {
    // Get travel details with origin and destination
    const [travels] = await db.query(
      `SELECT t.*, 
              l1.latitude as origin_lat, l1.longitude as origin_lon, l1.name as origin_name,
              l2.latitude as dest_lat, l2.longitude as dest_lon, l2.name as dest_name
       FROM travels t
       LEFT JOIN locations l1 ON t.origin = l1.name
       LEFT JOIN locations l2 ON t.destination = l2.name
       WHERE t.id = ? AND t.po_id = ?`,
      [req.params.travel_id, req.poId]
    );

    if (travels.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Travel tidak ditemukan'
      });
    }

    const travel = travels[0];

    if (!travel.origin_lat || !travel.dest_lat) {
      return res.status(400).json({
        success: false,
        message: 'Koordinat lokasi tidak tersedia'
      });
    }

    // Get weather for both locations
    const [originWeather, destWeather] = await Promise.all([
      getWeatherData(travel.origin_lat, travel.origin_lon, travel.origin_name),
      getWeatherData(travel.dest_lat, travel.dest_lon, travel.dest_name)
    ]);

    const weatherAlert = checkWeatherAlert(originWeather, destWeather);

    // Update travel with weather info
    await db.query(
      `UPDATE travels 
       SET weather_alert = ?, 
           weather_condition = ?
       WHERE id = ?`,
      [weatherAlert.has_alert, weatherAlert.condition, req.params.travel_id]
    );

    res.json({
      success: true,
      data: {
        travel_id: travel.id,
        route_name: travel.route_name,
        origin: originWeather,
        destination: destWeather,
        weather_alert: weatherAlert
      }
    });
  } catch (error) {
    console.error('Travel weather error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data cuaca travel'
    });
  }
});

// ==================== HELPER FUNCTIONS ====================

async function getWeatherData(latitude, longitude, locationName) {
  try {
    // Check cache first
    const [cached] = await db.query(
      `SELECT * FROM weather_conditions 
       WHERE latitude = ? AND longitude = ?
       AND expires_at > NOW()
       ORDER BY fetched_at DESC
       LIMIT 1`,
      [latitude, longitude]
    );

    if (cached.length > 0) {
      return cached[0];
    }

    // Fetch from API
    if (!WEATHER_API_KEY) {
      throw new Error('Weather API key tidak dikonfigurasi');
    }

    const response = await axios.get(WEATHER_API_URL, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: WEATHER_API_KEY,
        units: 'metric',
        lang: 'id'
      }
    });

    const weatherData = response.data;
    const expiresAt = new Date(Date.now() + CACHE_DURATION_MINUTES * 60 * 1000);

    // Save to database
    const [result] = await db.query(
      `INSERT INTO weather_conditions 
       (location_name, latitude, longitude, weather_main, weather_description, 
        weather_icon, temperature, feels_like, temp_min, temp_max, humidity, 
        pressure, visibility, wind_speed, wind_deg, clouds, rain_1h, rain_3h,
        sunrise_time, sunset_time, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
               FROM_UNIXTIME(?), FROM_UNIXTIME(?), ?)`,
      [
        locationName || weatherData.name || 'Unknown',
        latitude,
        longitude,
        weatherData.weather[0]?.main || null,
        weatherData.weather[0]?.description || null,
        weatherData.weather[0]?.icon || null,
        weatherData.main?.temp || null,
        weatherData.main?.feels_like || null,
        weatherData.main?.temp_min || null,
        weatherData.main?.temp_max || null,
        weatherData.main?.humidity || null,
        weatherData.main?.pressure || null,
        weatherData.visibility || null,
        weatherData.wind?.speed || null,
        weatherData.wind?.deg || null,
        weatherData.clouds?.all || null,
        weatherData.rain?.['1h'] || null,
        weatherData.rain?.['3h'] || null,
        weatherData.sys?.sunrise || null,
        weatherData.sys?.sunset || null,
        expiresAt
      ]
    );

    return formatWeatherData(weatherData, latitude, longitude, locationName);
  } catch (error) {
    console.error('Get weather data error:', error);
    throw error;
  }
}

function formatWeatherData(weatherData, latitude, longitude, locationName) {
  return {
    location_name: locationName || weatherData.name || 'Unknown',
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    weather_main: weatherData.weather[0]?.main || null,
    weather_description: weatherData.weather[0]?.description || null,
    weather_icon: weatherData.weather[0]?.icon || null,
    temperature: weatherData.main?.temp || null,
    feels_like: weatherData.main?.feels_like || null,
    temp_min: weatherData.main?.temp_min || null,
    temp_max: weatherData.main?.temp_max || null,
    humidity: weatherData.main?.humidity || null,
    pressure: weatherData.main?.pressure || null,
    visibility: weatherData.visibility || null,
    wind_speed: weatherData.wind?.speed || null,
    wind_deg: weatherData.wind?.deg || null,
    clouds: weatherData.clouds?.all || null,
    rain_1h: weatherData.rain?.['1h'] || null,
    rain_3h: weatherData.rain?.['3h'] || null,
    fetched_at: new Date()
  };
}

function checkWeatherAlert(originWeather, destWeather) {
  const alerts = [];
  let hasAlert = false;
  let condition = 'normal';

  // Check for rain
  if (originWeather.rain_1h > 0 || destWeather.rain_1h > 0) {
    alerts.push('Hujan terdeteksi di rute perjalanan');
    hasAlert = true;
    condition = 'rainy';
  }

  // Check for heavy rain
  if (originWeather.rain_1h > 7.5 || destWeather.rain_1h > 7.5) {
    alerts.push('Hujan lebat! Harap berhati-hati');
    hasAlert = true;
    condition = 'heavy_rain';
  }

  // Check for low visibility
  if (originWeather.visibility < 1000 || destWeather.visibility < 1000) {
    alerts.push('Jarak pandang rendah');
    hasAlert = true;
  }

  // Check for strong winds
  if (originWeather.wind_speed > 10 || destWeather.wind_speed > 10) {
    alerts.push('Angin kencang terdeteksi');
    hasAlert = true;
  }

  // Check for thunderstorm
  if (
    originWeather.weather_main === 'Thunderstorm' ||
    destWeather.weather_main === 'Thunderstorm'
  ) {
    alerts.push('Peringatan badai petir');
    hasAlert = true;
    condition = 'thunderstorm';
  }

  return {
    has_alert: hasAlert,
    condition: condition,
    alerts: alerts,
    message: hasAlert
      ? 'Cuaca buruk terdeteksi. Berkendara dengan hati-hati.'
      : 'Cuaca normal, perjalanan aman.'
  };
}

module.exports = router;
