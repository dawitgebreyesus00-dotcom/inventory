import connectDB from './db/connection.js';
import Product from './models/Product.js';

async function testStockAdjustment() {
  try {
    await connectDB();
    
    // Find laptop
    const laptop = await Product.findOne({ name: 'Laptop' });
    if (!laptop) {
      console.log('❌ Laptop not found');
      return;
    }
    
    console.log(`Current laptop stock: ${laptop.stock}`);
    
    // Test direct update
    const newStock = 50;
    await Product.findByIdAndUpdate(laptop._id, { stock: newStock });
    
    // Verify update
    const updatedLaptop = await Product.findById(laptop._id);
    console.log(`Updated laptop stock: ${updatedLaptop.stock}`);
    
    if (updatedLaptop.stock === newStock) {
      console.log('✅ Stock update works correctly');
    } else {
      console.log('❌ Stock update failed');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testStockAdjustment();