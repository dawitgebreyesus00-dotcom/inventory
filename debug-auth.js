// Simple script to test authentication
const testAuth = async () => {
  try {
    // First, let's check what's in localStorage (simulate frontend)
    console.log('🔍 Testing Authentication...\n');
    
    // Test login first
    console.log('1. Testing login...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@gmail.com',
        password: 'admin'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginData.success) {
      console.log('❌ Login failed');
      return;
    }
    
    const token = loginData.token || loginData.accessToken;
    console.log('✅ Login successful, token received');
    
    // Test debug endpoint
    console.log('\n2. Testing debug endpoint...');
    const debugResponse = await fetch('http://localhost:3000/api/debug/auth', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const debugData = await debugResponse.json();
    console.log('Debug response:', debugData);
    
    // Test purchase orders endpoint
    console.log('\n3. Testing purchase orders endpoint...');
    const poResponse = await fetch('http://localhost:3000/api/purchase-orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('PO Response status:', poResponse.status);
    const poData = await poResponse.json();
    console.log('PO Response:', poData);
    
    if (poResponse.ok) {
      console.log('✅ Purchase orders endpoint working');
    } else {
      console.log('❌ Purchase orders endpoint failed');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run the test
testAuth();