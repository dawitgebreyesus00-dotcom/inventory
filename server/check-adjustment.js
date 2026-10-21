import connectDB from './db/connection.js';
import Product from './models/Product.js';
import StockAdjustment from './models/StockAdjustment.js';

async function checkAdjustment() {
  try {
    await connectDB();
    
    // Check all products with "computer" in name
    const products = await Product.find({ 
      name: { $regex: /computer/i } 
    });
    
    console.log('=== COMPUTER PRODUCTS ===');
    if (products.length === 0) {
      console.log('No products with "computer" in name found');
      
      // Check laptop instead
      const laptop = await Product.findOne({ name: 'Laptop' });
      if (laptop) {
        console.log(`Found Laptop: Stock = ${laptop.stock}`);
        
        // Check recent adjustments for laptop
        const adjustments = await StockAdjustment.find({ product: laptop._id })
          .sort({ createdAt: -1 })
          .limit(3);
        
        console.log('\n=== RECENT LAPTOP ADJUSTMENTS ===');
        adjustments.forEach(adj => {
          console.log(`${adj.createdAt}: ${adj.previousStock} → ${adj.newStock} (${adj.reason})`);
        });
      }
    } else {
      products.forEach(product => {
        console.log(`${product.name}: Stock = ${product.stock}`);
      });
    }
    
    // Update laptop to 31 if it exists
    const updateResult = await Product.updateOne(
      { name: 'Laptop' },
      { $set: { stock: 31 } }
    );
    
    if (updateResult.matchedCount > 0) {
      console.log('\n✅ Updated Laptop stock to 31');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdjustment();