import connectDB from './db/connection.js';
import Product from './models/Product.js';
import StockAdjustment from './models/StockAdjustment.js';
import StockLog from './models/StockLog.js';

async function debugStock() {
  try {
    await connectDB();
    
    // Find computer product
    const computer = await Product.findOne({ name: /computer/i });
    if (!computer) {
      console.log('❌ Computer product not found');
      return;
    }
    
    console.log('=== COMPUTER PRODUCT STATUS ===');
    console.log(`Product ID: ${computer._id}`);
    console.log(`Name: ${computer.name}`);
    console.log(`Current Stock: ${computer.stock}`);
    
    // Get recent adjustments
    const adjustments = await StockAdjustment.find({ product: computer._id })
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log('\n=== RECENT ADJUSTMENTS ===');
    if (adjustments.length === 0) {
      console.log('No adjustments found');
    } else {
      adjustments.forEach((adj, i) => {
        console.log(`${i + 1}. ${adj.createdAt.toISOString()}`);
        console.log(`   Type: ${adj.type}`);
        console.log(`   Previous: ${adj.previousStock} → New: ${adj.newStock}`);
        console.log(`   Adjustment: ${adj.adjustmentQuantity}`);
        console.log(`   Reason: ${adj.reason}`);
        console.log('');
      });
    }
    
    // Get recent stock logs
    const logs = await StockLog.find({ product: computer._id })
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log('=== RECENT STOCK LOGS ===');
    if (logs.length === 0) {
      console.log('No stock logs found');
    } else {
      logs.forEach((log, i) => {
        console.log(`${i + 1}. ${log.createdAt.toISOString()}`);
        console.log(`   Action: ${log.action}`);
        console.log(`   Previous: ${log.previousQuantity} → New: ${log.newQuantity}`);
        console.log(`   Change: ${log.changeAmount}`);
        console.log(`   Reason: ${log.reason}`);
        console.log('');
      });
    }
    
    console.log('=== SUMMARY ===');
    console.log(`Expected: Computer stock should be 30`);
    console.log(`Actual: Computer stock is ${computer.stock}`);
    console.log(`Status: ${computer.stock === 30 ? '✅ CORRECT' : '❌ INCORRECT'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugStock();