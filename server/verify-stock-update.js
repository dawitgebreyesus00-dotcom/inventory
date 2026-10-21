import connectDB from './db/connection.js';
import Product from './models/Product.js';
import StockAdjustment from './models/StockAdjustment.js';
import StockLog from './models/StockLog.js';

async function verifyStockUpdate() {
  try {
    await connectDB();
    
    // Find computer product
    const computer = await Product.findOne({ name: /computer/i });
    if (!computer) {
      console.log('Computer product not found');
      return;
    }
    
    console.log('=== BEFORE ADJUSTMENT ===');
    console.log(`Computer Stock: ${computer.stock}`);
    
    // Get latest stock adjustments for computer
    const adjustments = await StockAdjustment.find({ product: computer._id })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('product', 'name');
    
    console.log('\n=== RECENT ADJUSTMENTS ===');
    adjustments.forEach(adj => {
      console.log(`${adj.createdAt.toISOString()}: ${adj.previousStock} → ${adj.newStock} (${adj.adjustmentQuantity > 0 ? '+' : ''}${adj.adjustmentQuantity}) - ${adj.reason}`);
    });
    
    // Get stock logs
    const logs = await StockLog.find({ product: computer._id })
      .sort({ createdAt: -1 })
      .limit(3);
    
    console.log('\n=== STOCK LOGS ===');
    logs.forEach(log => {
      console.log(`${log.createdAt.toISOString()}: ${log.previousQuantity} → ${log.newQuantity} (${log.action}) - ${log.reason}`);
    });
    
    console.log('\n=== CURRENT STATUS ===');
    console.log(`Computer Current Stock: ${computer.stock}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyStockUpdate();