import connectDB from './db/connection.js';
import Product from './models/Product.js';

async function fixStockSync() {
  try {
    await connectDB();
    
    console.log('=== FIXING STOCK SYNCHRONIZATION ===\n');
    
    // Get current computer stock
    const computer = await Product.findOne({ name: 'Computer' });
    
    if (!computer) {
      console.log('❌ Computer product not found');
      return;
    }
    
    console.log(`Current Computer stock in database: ${computer.stock}`);
    console.log('You said Product page shows: 61');
    console.log('You manually changed it from: 500\n');
    
    // Force update to 61 to match what you see on product page
    await Product.findByIdAndUpdate(computer._id, { 
      $set: { stock: 61 } 
    });
    
    // Verify the update
    const updatedComputer = await Product.findById(computer._id);
    
    console.log('=== SYNCHRONIZATION COMPLETE ===');
    console.log(`✅ Computer stock updated to: ${updatedComputer.stock}`);
    console.log('✅ Database now matches Product page display');
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Refresh your Product page (Ctrl+F5)');
    console.log('2. Both should now show 61 units');
    console.log('3. Test stock adjustment: change to 65');
    console.log('4. Verify both database and display update together');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixStockSync();