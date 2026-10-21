import connectDB from './db/connection.js';
import Product from './models/Product.js';

async function checkBicycle() {
  try {
    await connectDB();
    
    // Check for Bicycle product
    const bicycle = await Product.findOne({ name: /bicycle/i });
    
    if (bicycle) {
      console.log(`✅ Found Bicycle: ${bicycle.stock} units`);
    } else {
      console.log('❌ No Bicycle product found');
    }
    
    // Show all products with their stock
    const allProducts = await Product.find({}, 'name stock').sort({ name: 1 });
    
    console.log('\n=== ALL PRODUCTS ===');
    allProducts.forEach(p => {
      console.log(`${p.name}: ${p.stock} units`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBicycle();