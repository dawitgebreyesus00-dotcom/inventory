import connectDB from './db/connection.js';
import Product from './models/Product.js';

async function syncLaptopStock() {
  try {
    await connectDB();
    
    // Update laptop stock to 65 (actual count)
    const result = await Product.findOneAndUpdate(
      { name: 'Laptop' },
      { $set: { stock: 65 } },
      { new: true }
    );
    
    if (result) {
      console.log(`✅ Laptop stock updated to ${result.stock}`);
      console.log('Database and actual count now match!');
    } else {
      console.log('❌ Laptop not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

syncLaptopStock();