// Test script untuk Live Tracking & Weather API
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Credentials untuk testing (ganti dengan credentials yang valid)
const PO_CREDENTIALS = {
  email: 'po1@travel.com',
  password: 'password123'
};

let authToken = '';

// Login untuk mendapatkan token
async function login() {
  try {
    console.log('🔐 Logging in as PO...');
    const response = await axios.post(`${BASE_URL}/auth/login`, PO_CREDENTIALS);
    
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      console.log('Token:', authToken.substring(0, 20) + '...\n');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 1: Update Driver Location
async function testUpdateDriverLocation() {
  console.log('📍 Test 1: Update Driver Location');
  try {
    const response = await axios.post(
      `${BASE_URL}/tracking/driver-location`,
      {
        driver_id: 1,
        travel_id: 1,
        latitude: -0.9471168,
        longitude: 100.4174862,
        speed: 45.5,
        heading: 180.0,
        accuracy: 5.0
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
  }
  console.log('');
}

// Test 2: Get Driver Location
async function testGetDriverLocation(driverId = 1) {
  console.log(`📍 Test 2: Get Driver Location (ID: ${driverId})`);
  try {
    const response = await axios.get(
      `${BASE_URL}/tracking/driver-location/${driverId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
  }
  console.log('');
}

// Test 3: Start Travel Tracking
async function testStartTravelTracking() {
  console.log('🚗 Test 3: Start Travel Tracking');
  try {
    const response = await axios.post(
      `${BASE_URL}/tracking/travel`,
      {
        travel_id: 1,
        driver_id: 1,
        tracking_status: 'waiting',
        pickup_eta_minutes: 15,
        journey_eta_minutes: 120,
        total_distance_km: 85.5,
        remaining_distance_km: 85.5,
        current_location_name: 'Padang'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
  }
  console.log('');
}

// Test 4: Get Travel Tracking
async function testGetTravelTracking(travelId = 1) {
  console.log(`🚗 Test 4: Get Travel Tracking (ID: ${travelId})`);
  try {
    const response = await axios.get(
      `${BASE_URL}/tracking/travel/${travelId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
  }
  console.log('');
}

// Test 5: Get Active Travels
async function testGetActiveTravels() {
  console.log('🚗 Test 5: Get All Active Travels');
  try {
    const response = await axios.get(
      `${BASE_URL}/tracking/active-travels`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    console.log('✅ Success:');
    console.log(`Found ${response.data.data.length} active travels`);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
  }
  console.log('');
}

// Test 6: Create Pickup Queue
async function testCreatePickupQueue() {
  console.log('📋 Test 6: Create Pickup Queue');
  try {
    const response = await axios.post(
      `${BASE_URL}/tracking/pickup-queue`,
      {
        travel_id: 1,
        driver_id: 1
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
  }
  console.log('');
}

// Test 7: Get Pickup Queue
async function testGetPickupQueue(travelId = 1) {
  console.log(`📋 Test 7: Get Pickup Queue (Travel ID: ${travelId})`);
  try {
    const response = await axios.get(
      `${BASE_URL}/tracking/pickup-queue/${travelId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    console.log('✅ Success:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
  }
  console.log('');
}

// Test 8: Get Weather by Location
async function testGetWeatherByLocation() {
  console.log('☁️ Test 8: Get Weather by Location (Padang)');
  try {
    const response = await axios.get(
      `${BASE_URL}/weather/location`,
      {
        params: {
          latitude: -0.9471168,
          longitude: 100.4174862,
          location_name: 'Padang'
        },
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    console.log('✅ Success:');
    const data = response.data.data;
    console.log(`Location: ${data.location_name}`);
    console.log(`Weather: ${data.weather_main} - ${data.weather_description}`);
    console.log(`Temperature: ${data.temperature}°C (feels like ${data.feels_like}°C)`);
    console.log(`Humidity: ${data.humidity}%`);
    console.log(`Wind Speed: ${data.wind_speed} m/s`);
    console.log(`Cached: ${response.data.cached}`);
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
  }
  console.log('');
}

// Test 9: Get Weather for Route
async function testGetWeatherForRoute() {
  console.log('☁️ Test 9: Get Weather for Route (Padang - Bukittinggi)');
  try {
    const response = await axios.get(
      `${BASE_URL}/weather/route`,
      {
        params: {
          origin_lat: -0.9471168,
          origin_lon: 100.4174862,
          origin_name: 'Padang',
          dest_lat: -0.3055,
          dest_lon: 100.3692,
          dest_name: 'Bukittinggi'
        },
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    console.log('✅ Success:');
    const data = response.data.data;
    console.log('\nOrigin Weather:');
    console.log(`  ${data.origin.location_name}: ${data.origin.weather_main} - ${data.origin.temperature}°C`);
    console.log('\nDestination Weather:');
    console.log(`  ${data.destination.location_name}: ${data.destination.weather_main} - ${data.destination.temperature}°C`);
    console.log('\nWeather Alert:');
    console.log(`  Has Alert: ${data.weather_alert.has_alert}`);
    console.log(`  Condition: ${data.weather_alert.condition}`);
    console.log(`  Message: ${data.weather_alert.message}`);
    if (data.weather_alert.alerts.length > 0) {
      console.log(`  Alerts: ${data.weather_alert.alerts.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
  }
  console.log('');
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting Live Tracking & Weather API Tests\n');
  console.log('='.repeat(60));
  console.log('');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot continue without authentication');
    return;
  }
  
  // Run tracking tests
  await testUpdateDriverLocation();
  await testGetDriverLocation();
  await testStartTravelTracking();
  await testGetTravelTracking();
  await testGetActiveTravels();
  await testCreatePickupQueue();
  await testGetPickupQueue();
  
  // Run weather tests
  console.log('⚠️  Note: Weather tests require OPENWEATHER_API_KEY in .env');
  await testGetWeatherByLocation();
  await testGetWeatherForRoute();
  
  console.log('='.repeat(60));
  console.log('✅ All tests completed!');
  console.log('\n💡 Tips:');
  console.log('   - Ensure you have valid driver_id and travel_id in your database');
  console.log('   - Set OPENWEATHER_API_KEY in .env for weather features');
  console.log('   - Check database tables: driver_locations, travel_tracking, pickup_queue, weather_conditions');
}

// Run tests
runAllTests().catch(console.error);
