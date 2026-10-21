import Product from '../models/Product.js';
import StockLog from '../models/StockLog.js';
import StockAdjustment from '../models/StockAdjustment.js';

// Automatic Stock Management Service
export class AutoStockService {
  
  // ⭐ STOCK IN - Increase Stock
  
  // A. Purchase Order Received
  static async handlePurchaseReceived(purchaseOrder, userId) {
    console.log(`🔄 AUTO STOCK: Processing PO receipt - ${purchaseOrder.poNumber}`);
    
    for (const item of purchaseOrder.items) {
      const product = await Product.findById(item.product);
      if (!product) continue;
      
      const previousStock = product.stock;
      const newStock = previousStock + item.quantity;
      
      // Update product stock
      product.stock = newStock;
      await product.save();
      
      // Create automatic stock adjustment record
      await StockAdjustment.create({
        product: item.product,
        type: 'purchase',
        adjustmentQuantity: item.quantity,
        previousStock,
        newStock,
        reason: 'Purchase order received',
        notes: `Auto adjustment from PO: ${purchaseOrder.poNumber}`,
        reference: purchaseOrder.poNumber,
        performedBy: userId,
        costImpact: item.quantity * item.unitCost
      });
      
      // Create stock log
      await StockLog.create({
        product: item.product,
        type: 'purchase',
        quantity: item.quantity,
        previousStock,
        newStock,
        reason: 'Purchase order received',
        reference: purchaseOrder.poNumber,
        performedBy: userId
      });
      
      console.log(`📈 STOCK IN: ${product.name} +${item.quantity} (${previousStock} → ${newStock})`);
    }
  }
  
  // B. Customer Return
  static async handleCustomerReturn(orderId, returnItems, userId, reason = 'Customer return') {
    console.log(`🔄 AUTO STOCK: Processing customer return - Order ${orderId}`);
    
    for (const item of returnItems) {
      const product = await Product.findById(item.productId);
      if (!product) continue;
      
      const previousStock = product.stock;
      const newStock = previousStock + item.quantity;
      
      // Update product stock
      product.stock = newStock;
      await product.save();
      
      // Create automatic stock adjustment
      await StockAdjustment.create({
        product: item.productId,
        type: 'returned',
        adjustmentQuantity: item.quantity,
        previousStock,
        newStock,
        reason,
        notes: `Auto adjustment from return: Order ${orderId}`,
        reference: `RET-${orderId}`,
        performedBy: userId,
        costImpact: item.quantity * (product.price || 0)
      });
      
      // Create stock log
      await StockLog.create({
        product: item.productId,
        type: 'return',
        quantity: item.quantity,
        previousStock,
        newStock,
        reason,
        reference: `RET-${orderId}`,
        performedBy: userId
      });
      
      console.log(`📈 STOCK IN: ${product.name} +${item.quantity} (${previousStock} → ${newStock}) - Return`);
    }
  }
  
  // ⭐ STOCK OUT - Decrease Stock
  
  // A. Order Delivered
  static async handleOrderDelivered(order, userId) {
    console.log(`🔄 AUTO STOCK: Processing order delivery - ${order._id}`);
    
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (!product) continue;
      
      const previousStock = product.stock;
      const newStock = Math.max(0, previousStock - item.quantity);
      
      // Check if sufficient stock
      if (previousStock < item.quantity) {
        console.warn(`⚠️ INSUFFICIENT STOCK: ${product.name} - Ordered: ${item.quantity}, Available: ${previousStock}`);
        // Continue with available stock or handle as needed
      }
      
      // Update product stock
      product.stock = newStock;
      await product.save();
      
      // Create automatic stock adjustment
      await StockAdjustment.create({
        product: item.product,
        type: 'sale',
        adjustmentQuantity: -item.quantity,
        previousStock,
        newStock,
        reason: 'Order delivered',
        notes: `Auto adjustment from order delivery: ${order._id}`,
        reference: `ORD-${order._id}`,
        performedBy: userId,
        costImpact: item.quantity * (product.price || 0)
      });
      
      // Create stock log
      await StockLog.create({
        product: item.product,
        type: 'sale',
        quantity: -item.quantity,
        previousStock,
        newStock,
        reason: 'Order delivered',
        reference: `ORD-${order._id}`,
        performedBy: userId
      });
      
      console.log(`📉 STOCK OUT: ${product.name} -${item.quantity} (${previousStock} → ${newStock})`);
    }
  }
  
  // B. Damaged/Expired/Lost Items
  static async handleItemLoss(productId, quantity, type, reason, userId, notes = '') {
    console.log(`🔄 AUTO STOCK: Processing item loss - ${type}`);
    
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    
    const previousStock = product.stock;
    const newStock = Math.max(0, previousStock - quantity);
    
    // Update product stock
    product.stock = newStock;
    await product.save();
    
    // Create automatic stock adjustment
    const adjustment = await StockAdjustment.create({
      product: productId,
      type: type, // 'damage', 'expired', 'loss'
      adjustmentQuantity: -quantity,
      previousStock,
      newStock,
      reason,
      notes: notes || `Auto adjustment for ${type}: ${reason}`,
      performedBy: userId,
      costImpact: quantity * (product.price || 0)
    });
    
    // Create stock log
    await StockLog.create({
      product: productId,
      type: type,
      quantity: -quantity,
      previousStock,
      newStock,
      reason,
      reference: adjustment.reference,
      performedBy: userId
    });
    
    console.log(`📉 STOCK OUT: ${product.name} -${quantity} (${previousStock} → ${newStock}) - ${type.toUpperCase()}`);
    
    return adjustment;
  }
  
  // ⭐ EVENT LISTENERS
  
  // Listen for Purchase Order status changes
  static async onPurchaseOrderStatusChange(purchaseOrder, newStatus, userId) {
    if (newStatus === 'received') {
      await this.handlePurchaseReceived(purchaseOrder, userId);
    }
  }
  
  // Listen for Order status changes
  static async onOrderStatusChange(order, newStatus, userId) {
    if (newStatus === 'delivered') {
      await this.handleOrderDelivered(order, userId);
    }
  }
  
  // ⭐ UTILITY FUNCTIONS
  
  // Get stock movement summary
  static async getStockMovementSummary(productId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const movements = await StockLog.find({
      product: productId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 });
    
    const summary = {
      totalIn: 0,
      totalOut: 0,
      movements: movements.length,
      types: {}
    };
    
    movements.forEach(movement => {
      if (movement.quantity > 0) {
        summary.totalIn += movement.quantity;
      } else {
        summary.totalOut += Math.abs(movement.quantity);
      }
      
      summary.types[movement.type] = (summary.types[movement.type] || 0) + 1;
    });
    
    return summary;
  }
  
  // Validate stock consistency
  static async validateStockConsistency(productId) {
    const product = await Product.findById(productId);
    const lastAdjustment = await StockAdjustment.findOne({
      product: productId
    }).sort({ createdAt: -1 });
    
    if (lastAdjustment && lastAdjustment.newStock !== product.stock) {
      console.warn(`⚠️ STOCK INCONSISTENCY: ${product.name} - Expected: ${lastAdjustment.newStock}, Actual: ${product.stock}`);
      return false;
    }
    
    return true;
  }
}

// Export singleton instance
export const autoStock = AutoStockService;