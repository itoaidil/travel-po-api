const axios = require('axios');

async function testAddDriver() {
  try {
    // Login first to get token
    console.log('1. Logging in as PO...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'po1@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✓ Login successful, got token');
    
    // Try to add driver
    console.log('\n2. Adding driver...');
    const driverData = {
      full_name: 'Test Driver',
      license_number: '938459938453',
      license_type: 'B1',
      phone: '081234567890',
      address: 'Jl. Test No. 123',
      date_of_birth: '1990-01-01'
    };
    
    console.log('Data:', JSON.stringify(driverData, null, 2));
    
    const response = await axios.post('http://localhost:3000/api/drivers', driverData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✓ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('\n✗ Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testAddDriver();
