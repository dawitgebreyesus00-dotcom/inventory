// Check if stock adjustment worked
const checkStock = async () => {
  try {
    // Login
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin' })
    });
    const loginData = await loginResponse.json();
    const token = loginData.token;

    // Get products
    const productsResponse = await fetch('http://localhost:3000/api/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const productsData = await productsResponse.json();
    const products = productsData.data?.items || productsData.items || [];
    
    // Find computer
    const computer = products.find(p => p.name.toLowerCase().includes('computer'));
    if (computer) {
      console.log(`Computer stock: ${computer.stock}`);
    } else {
      console.log('Computer not found');
    }

    // Get recent adjustments
    const adjResponse = await fetch('http://localhost:3000/api/stock-adjustments', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const adjData = await adjResponse.json();
    const adjustments = adjData.data?.adjustments || [];
    
    console.log('Recent adjustments:');
    adjustments.slice(0, 3).forEach(adj => {
      console.log(`- ${adj.product?.name}: ${adj.adjustmentQuantity >= 0 ? '+' : ''}${adj.adjustmentQuantity} (${adj.reason})`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
};

checkStock();