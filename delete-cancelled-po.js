// Delete cancelled purchase order
const deleteCancelledPO = async () => {
  try {
    // Login
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin' })
    });
    const loginData = await loginResponse.json();
    const token = loginData.token;

    // Get all POs to find the cancelled one
    const posResponse = await fetch('http://localhost:3000/api/purchase-orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const posData = await posResponse.json();
    
    // Find cancelled PO
    const cancelledPO = posData.orders.find(po => po.status === 'cancelled');
    
    if (cancelledPO) {
      console.log(`Found cancelled PO: ${cancelledPO.poNumber}`);
      
      // Delete it
      const deleteResponse = await fetch(`http://localhost:3000/api/purchase-orders/${cancelledPO._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (deleteResponse.ok) {
        console.log(`✅ Deleted cancelled PO: ${cancelledPO.poNumber}`);
      } else {
        console.log(`❌ Failed to delete PO: ${deleteResponse.status}`);
      }
    } else {
      console.log('No cancelled purchase orders found');
    }

  } catch (error) {
    console.error('Error:', error);
  }
};

deleteCancelledPO();