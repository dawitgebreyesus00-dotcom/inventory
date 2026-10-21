import connectDB from './db/connection.js';
import Product from './models/Product.js';

async function fixComputerStock() {
  try {
    await connectDB();
    
    // Find and update computer stock to 30
    const result = await Product.updateOne(
      { name: /computer/i },
      { $set: { stock: 30 } }
    );
    
    if (result.matchedCount > 0) {
      console.log('✅ Computer stock updated to 30');
      
      // Verify the update
      const computer = await Product.findOne({ name: /computer/i });
      console.log(`Verified: Computer stock is now ${computer.stock}`);
    } else {
      console.log('❌ Computer product not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixComputerStock();