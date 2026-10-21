import Product from '../models/Product.js';
import StockLog from '../models/StockLog.js';
import StockAdjustment from '../models/StockAdjustment.js';
import Order from '../models/Order.js';
import PurchaseOrder from '../models/PurchaseOrder.js';

/**
 * Advanced Stock Relationship Management Service
 * Handles all stock operations with proper constraints and relationships
 */
class StockRelationshipService {
  
  /**
   * AUTOMATIC STOCK UPDATES - Daily Transactions
   */
  
  // 1. Purchase Order Received → Stock IN
  static async handlePurchaseOrderReceived(purchaseOrderId, receivedItems, userId) {
    const updates = [];
    
    for (const item of receivedItems) {
      const product = await Product.findById(item.productId);
      if (!product) continue;
      
      const previousStock = product.stock;
      const newStock = previousStock + item.receivedQuantity;
      
      // Update product stock
      await Product.findByIdAndUpdate(item.productId, { stock: newStock });
      
      // Create automatic stock adjustment
      await StockAdjustment.create({
        product: item.productId,
        type: 'purchase_received',
        adjustmentQuantity: item.receivedQuantity,
        previousStock,
        newStock,
        reason: `PO Received: ${purchaseOrderId}`,
        isAutomatic: true,
        performedBy: userId,
        approvedBy: userId,
        relatedDocument: purchaseOrderId,
        relatedDocumentType: 'PurchaseOrder'
      });
      
      // Create stock log
      await this.createStockLog(item.productId, userId, 'purchase_received', 
        previousStock, newStock, item.receivedQuantity, `Purchase Order: ${purchaseOrderId}`);
      
      updates.push({ productId: item.productId, previousStock, newStock });
    }
    
    return updates;
  }
  
  // 2. Sales Order Completed → Stock OUT
  static async handleSalesOrderCompleted(orderId, orderItems, userId) {
    const updates = [];
    
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) continue;
      
      // Check stock availability
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${item.quantity}`);
      }
      
      const previousStock = product.stock;
      const newStock = previousStock - item.quantity;
      
      // Update product stock
      await Product.findByIdAndUpdate(item.product, { stock: newStock });
      
      // Create automatic stock adjustment
      await StockAdjustment.create({
        product: item.product,
        type: 'sale_completed',
        adjustmentQuantity: -item.quantity,
        previousStock,
        newStock,
        reason: `Sale Completed: ${orderId}`,
        isAutomatic: true,
        performedBy: userId,
        approvedBy: userId,
        relatedDocument: orderId,
        relatedDocumentType: 'Order'
      });
      
      // Create stock log
      await this.createStockLog(item.product, userId, 'sale_completed', 
        previousStock, newStock, item.quantity, `Sales Order: ${orderId}`);
      
      updates.push({ productId: item.product, previousStock, newStock });
    }
    
    return updates;
  }
  
  // 3. Customer Return → Stock IN
  static async handleCustomerReturn(orderId, returnedItems, userId) {
    const updates = [];
    
    for (const item of returnedItems) {
      const product = await Product.findById(item.productId);
      if (!product) continue;
      
      const previousStock = product.stock;
      const newStock = previousStock + item.returnedQuantity;
      
      // Update product stock
      await Product.findByIdAndUpdate(item.productId, { stock: newStock });
      
      // Create automatic stock adjustment
      await StockAdjustment.create({
        product: item.productId,
        type: 'customer_return',
        adjustmentQuantity: item.returnedQuantity,
        previousStock,
        newStock,
        reason: `Customer Return: ${orderId}`,
        isAutomatic: true,
        performedBy: userId,
        approvedBy: userId,
        relatedDocument: orderId,
        relatedDocumentType: 'Return'
      });
      
      // Create stock log
      await this.createStockLog(item.productId, userId, 'customer_return', 
        previousStock, newStock, item.returnedQuantity, `Customer Return: ${orderId}`);
      
      updates.push({ productId: item.productId, previousStock, newStock });
    }
    
    return updates;
  }
  
  /**
   * MANUAL STOCK UPDATES - Exceptions & Audits
   */
  
  // 4. Physical Count Adjustment
  static async handlePhysicalCountAdjustment(productId, actualCount, reason, userId, notes = '') {
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');
    
    const previousStock = product.stock;
    const adjustmentQuantity = actualCount - previousStock;
    
    if (adjustmentQuantity === 0) {
      return { message: 'No adjustment needed - counts match', previousStock, newStock: actualCount };
    }
    
    // Update product stock
    await Product.findByIdAndUpdate(productId, { stock: actualCount });
    
    // Create manual stock adjustment
    await StockAdjustment.create({
      product: productId,
      type: 'physical_count',
      adjustmentQuantity,
      previousStock,
      newStock: actualCount,
      reason,
      notes,
      isAutomatic: false,
      performedBy: userId,
      approvedBy: userId
    });
    
    // Create stock log
    await this.createStockLog(productId, userId, 'physical_count', 
      previousStock, actualCount, Math.abs(adjustmentQuantity), reason);
    
    return { previousStock, newStock: actualCount, adjustmentQuantity };
  }
  
  // 5. Damage/Loss/Theft Adjustment
  static async handleDamageLossAdjustment(productId, lostQuantity, type, reason, userId, notes = '') {
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');
    
    if (product.stock < lostQuantity) {
      throw new Error(`Cannot remove ${lostQuantity} items. Only ${product.stock} available.`);
    }
    
    const previousStock = product.stock;
    const newStock = previousStock - lostQuantity;
    
    // Update product stock
    await Product.findByIdAndUpdate(productId, { stock: newStock });
    
    // Create manual stock adjustment
    await StockAdjustment.create({
      product: productId,
      type,
      adjustmentQuantity: -lostQuantity,
      previousStock,
      newStock,
      reason,
      notes,
      isAutomatic: false,
      performedBy: userId,
      approvedBy: userId
    });
    
    // Create stock log
    await this.createStockLog(productId, userId, type, 
      previousStock, newStock, lostQuantity, reason);
    
    return { previousStock, newStock, adjustmentQuantity: -lostQuantity };
  }
  
  /**
   * STOCK VALIDATION & CONSTRAINTS
   */
  
  // Check if product can be deleted (has active relationships)
  static async validateProductDeletion(productId) {
    const constraints = [];
    
    // Check active purchase orders
    const activePOs = await PurchaseOrder.countDocuments({
      'items.product': productId,
      status: { $in: ['draft', 'sent', 'confirmed', 'shipped'] }
    });
    if (activePOs > 0) {
      constraints.push(`${activePOs} active purchase order(s)`);
    }
    
    // Check pending orders
    const pendingOrders = await Order.countDocuments({
      'items.product': productId,
      status: { $in: ['pending', 'processing', 'shipped'] }
    });
    if (pendingOrders > 0) {
      constraints.push(`${pendingOrders} pending order(s)`);
    }
    
    // Check current stock
    const product = await Product.findById(productId);
    if (product && product.stock > 0) {
      constraints.push(`${product.stock} units in stock`);
    }
    
    return {
      canDelete: constraints.length === 0,
      constraints
    };
  }
  
  // Check stock availability for order
  static async validateOrderStock(orderItems) {
    const stockIssues = [];
    
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        stockIssues.push(`Product ${item.product} not found`);
        continue;
      }
      
      if (product.stock < item.quantity) {
        stockIssues.push(`${product.name}: Need ${item.quantity}, Available ${product.stock}`);
      }
    }
    
    return {
      hasStock: stockIssues.length === 0,
      issues: stockIssues
    };
  }
  
  // Get low stock alerts
  static async getLowStockAlerts(threshold = 5) {
    const lowStockProducts = await Product.find({
      stock: { $lte: threshold, $gt: 0 }
    }).populate('category', 'name');
    
    const outOfStockProducts = await Product.find({
      stock: 0
    }).populate('category', 'name');
    
    return {
      lowStock: lowStockProducts,
      outOfStock: outOfStockProducts,
      totalAlerts: lowStockProducts.length + outOfStockProducts.length
    };
  }
  
  /**
   * AUDIT TRAIL & REPORTING
   */
  
  // Create detailed stock log
  static async createStockLog(productId, userId, action, previousQuantity, newQuantity, changeAmount, reason) {
    return await StockLog.create({
      product: productId,
      user: userId,
      action,
      previousQuantity,
      newQuantity,
      changeAmount,
      reason,
      timestamp: new Date()
    });
  }
  
  // Get stock movement history
  static async getStockMovementHistory(productId, startDate, endDate) {
    const filter = { product: productId };
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const movements = await StockAdjustment.find(filter)
      .populate('performedBy', 'name email')
      .populate('product', 'name sku')
      .sort({ createdAt: -1 });
    
    const summary = {
      totalMovements: movements.length,
      totalIn: movements.filter(m => m.adjustmentQuantity > 0).reduce((sum, m) => sum + m.adjustmentQuantity, 0),
      totalOut: movements.filter(m => m.adjustmentQuantity < 0).reduce((sum, m) => sum + Math.abs(m.adjustmentQuantity), 0),
      automaticMovements: movements.filter(m => m.isAutomatic).length,
      manualMovements: movements.filter(m => !m.isAutomatic).length
    };
    
    return { movements, summary };
  }
  
  // Get comprehensive stock report
  static async getStockReport() {
    const products = await Product.find({}).populate('category', 'name');
    
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const outOfStock = products.filter(p => p.stock === 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
    
    const categoryBreakdown = products.reduce((acc, p) => {
      const categoryName = p.category?.name || 'Uncategorized';
      if (!acc[categoryName]) {
        acc[categoryName] = { count: 0, value: 0, stock: 0 };
      }
      acc[categoryName].count++;
      acc[categoryName].value += p.price * p.stock;
      acc[categoryName].stock += p.stock;
      return acc;
    }, {});
    
    return {
      summary: {
        totalProducts,
        totalValue,
        outOfStock,
        lowStock,
        inStock: totalProducts - outOfStock
      },
      categoryBreakdown,
      products: products.map(p => ({
        id: p._id,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        value: p.price * p.stock,
        category: p.category?.name,
        status: p.stock === 0 ? 'OUT_OF_STOCK' : p.stock <= 5 ? 'LOW_STOCK' : 'IN_STOCK'
      }))
    };
  }
}

export default StockRelationshipService;