import connectDB from './db/connection.js';
import Product from './models/Product.js';

async function fixLaptopStock() {
  try {
    await connectDB();
    
    // Find and update laptop stock to 30
    const result = await Product.updateOne(
      { name: 'Laptop' },
      { $set: { stock: 30 } }
    );
    
    if (result.matchedCount > 0) {
      console.log('✅ Laptop stock updated to 30');
      
      // Verify the update
      const laptop = await Product.findOne({ name: 'Laptop' });
      console.log(`Verified: Laptop stock is now ${laptop.stock}`);
    } else {
      console.log('❌ Laptop product not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixLaptopStock();