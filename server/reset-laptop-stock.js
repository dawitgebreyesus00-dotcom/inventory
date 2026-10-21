import connectDB from './db/connection.js';
import Product from './models/Product.js';

async function resetLaptopStock() {
  try {
    await connectDB();
    
    // Reset Laptop stock to 0
    const result = await Product.findOneAndUpdate(
      { name: 'Laptop' },
      { $set: { stock: 0 } },
      { new: true }
    );
    
    if (result) {
      console.log(`✅ Laptop stock reset to ${result.stock}`);
    } else {
      console.log('❌ Laptop not found');
    }
    
    // Show current stock for both products
    const computer = await Product.findOne({ name: 'Computer' });
    const laptop = await Product.findOne({ name: 'Laptop' });
    
    console.log('\n=== CORRECTED STOCK ===');
    console.log(`Computer: ${computer?.stock || 0} units`);
    console.log(`Laptop: ${laptop?.stock || 0} units`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetLaptopStock();