// Check purchase orders for a specific supplier
const checkSupplierPOs = async () => {
  try {
    // Login first
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin' })
    });
    const loginData = await loginResponse.json();
    const token = loginData.token;

    // Get all suppliers
    const suppliersResponse = await fetch('http://localhost:3000/api/suppliers', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const suppliersData = await suppliersResponse.json();
    const suppliers = Array.isArray(suppliersData) ? suppliersData : suppliersData.data || [];
    
    console.log('📋 SUPPLIERS:');
    suppliers.forEach(s => console.log(`- ${s.name} (ID: ${s._id})`));

    // Get all purchase orders
    const posResponse = await fetch('http://localhost:3000/api/purchase-orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const posData = await posResponse.json();
    
    console.log('\n📦 PURCHASE ORDERS:');
    posData.orders.forEach(po => {
      console.log(`- ${po.poNumber} → ${po.supplier?.name || 'Unknown'} (${po.status})`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
};

checkSupplierPOs();