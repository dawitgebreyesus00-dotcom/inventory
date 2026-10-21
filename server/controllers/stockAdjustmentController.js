import Product from '../models/Product.js';
import StockLog from '../models/StockLog.js';
import StockAdjustment from '../models/StockAdjustment.js';

// Get stock adjustments
export const getStockAdjustments = async (req, res) => {
  try {
    const { productId, type, status, startDate, endDate, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    
    if (productId) filter.product = productId;
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const adjustments = await StockAdjustment.find(filter)
      .populate('product', 'name sku price')
      .populate('performedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await StockAdjustment.countDocuments(filter);

    // Calculate summary statistics
    const summary = await StockAdjustment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$adjustmentQuantity' },
          totalCostImpact: { $sum: '$costImpact' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        adjustments,
        summary,
        pagination: {
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create stock adjustment
export const createStockAdjustment = async (req, res) => {
  try {
    const { productId, type, quantity, reason, notes, location, batchNumber, expiryDate } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previousStock = product.stock;
    let newStock;
    let adjustmentQuantity;

    switch (type) {
      case 'adjustment':
        // Physical count - enter final correct quantity
        newStock = quantity;
        adjustmentQuantity = quantity - previousStock;
        break;
      case 'damage':
      case 'loss':
      case 'expired':
        // Subtract damaged quantity from current stock
        adjustmentQuantity = -Math.abs(quantity);
        newStock = Math.max(0, previousStock - Math.abs(quantity));
        break;
      case 'found':
      case 'returned':
        // Add found/returned quantity to current stock
        adjustmentQuantity = Math.abs(quantity);
        newStock = previousStock + Math.abs(quantity);
        break;
      case 'transfer':
        // Transfer can be positive (IN) or negative (OUT)
        adjustmentQuantity = quantity;
        newStock = Math.max(0, previousStock + quantity);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid adjustment type' });
    }

    // Calculate cost impact
    const costImpact = Math.abs(adjustmentQuantity) * (product.price || 0);

    // Create stock adjustment record
    const stockAdjustment = await StockAdjustment.create({
      product: productId,
      type,
      adjustmentQuantity,
      previousStock,
      newStock,
      reason,
      notes,
      location: location || 'Main Warehouse',
      costImpact,
      batchNumber,
      expiryDate,
      performedBy: req.user.id,
      approvedBy: req.user.id // Auto-approve for now
    });

    // CRITICAL: Force update product stock with multiple methods
    await Product.findByIdAndUpdate(productId, { $set: { stock: newStock } });
    
    // Double-check: Also update using direct method
    const productToUpdate = await Product.findById(productId);
    productToUpdate.stock = newStock;
    await productToUpdate.save();
    
    // Triple-verify the update worked
    const verifiedProduct = await Product.findById(productId);
    console.log(`✅ STOCK UPDATE VERIFIED: ${previousStock} → ${verifiedProduct.stock}`);
    
    if (verifiedProduct.stock !== newStock) {
      console.error(`❌ STOCK UPDATE FAILED! Expected: ${newStock}, Got: ${verifiedProduct.stock}`);
      return res.status(500).json({ success: false, message: 'Stock update failed' });
    }

    // Create stock log for history
    await StockLog.create({
      product: productId,
      user: req.user.id,
      action: adjustmentQuantity > 0 ? 'stock_added' : 'stock_reduced',
      previousQuantity: previousStock,
      newQuantity: newStock,
      changeAmount: Math.abs(adjustmentQuantity),
      reason: `Stock adjustment: ${reason}`
    });

    await stockAdjustment.populate(['product', 'performedBy', 'approvedBy']);

    res.status(201).json({ 
      success: true, 
      data: stockAdjustment,
      message: `✅ Stock successfully updated: ${previousStock} → ${newStock}`,
      stockUpdate: {
        productId,
        previousStock,
        newStock,
        verified: true
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Bulk stock adjustment
export const bulkStockAdjustment = async (req, res) => {
  try {
    const { adjustments, reason, location } = req.body;
    const results = [];
    const batchRef = `BULK-${Date.now()}`;

    for (const adj of adjustments) {
      const product = await Product.findById(adj.productId);
      if (!product) continue;

      const previousStock = product.stock;
      const newStock = adj.newQuantity;
      const adjustmentQuantity = newStock - previousStock;
      const costImpact = Math.abs(adjustmentQuantity) * (product.price || 0);

      // Create stock adjustment
      const stockAdjustment = await StockAdjustment.create({
        product: adj.productId,
        type: 'adjustment',
        adjustmentQuantity,
        previousStock,
        newStock,
        reason,
        notes: `Bulk adjustment - ${batchRef}`,
        location: location || 'Main Warehouse',
        costImpact,
        performedBy: req.user.id,
        approvedBy: req.user.id
      });

      // Update product stock
      product.stock = newStock;
      await product.save();

      // Create stock log
      await StockLog.create({
        product: adj.productId,
        user: req.user.id,
        action: adjustmentQuantity > 0 ? 'stock_added' : 'stock_reduced',
        previousQuantity: previousStock,
        newQuantity: newStock,
        changeAmount: Math.abs(adjustmentQuantity),
        reason: `Bulk adjustment: ${reason}`
      });

      results.push(stockAdjustment);
    }

    res.json({ 
      success: true, 
      message: `${results.length} adjustments completed`, 
      data: results 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Stock cycle count
export const createCycleCount = async (req, res) => {
  try {
    const { products, countDate, notes, location } = req.body;
    const results = [];
    const cycleRef = `CC-${Date.now()}`;

    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const systemStock = product.stock;
      const countedStock = item.countedQuantity;
      const variance = countedStock - systemStock;

      if (variance !== 0) {
        const costImpact = Math.abs(variance) * (product.price || 0);

        // Create stock adjustment
        const stockAdjustment = await StockAdjustment.create({
          product: item.productId,
          type: 'cycle_count',
          adjustmentQuantity: variance,
          previousStock: systemStock,
          newStock: countedStock,
          reason: 'Cycle count adjustment',
          notes: `${notes} | Variance: ${variance} | Count Date: ${countDate}`,
          location: location || 'Main Warehouse',
          costImpact,
          performedBy: req.user.id,
          approvedBy: req.user.id
        });

        // Update product stock
        product.stock = countedStock;
        await product.save();

        // Create stock log
        await StockLog.create({
          product: item.productId,
          user: req.user.id,
          action: variance > 0 ? 'stock_added' : 'stock_reduced',
          previousQuantity: systemStock,
          newQuantity: countedStock,
          changeAmount: Math.abs(variance),
          reason: 'Cycle count adjustment'
        });

        results.push({
          product: product.name,
          sku: product.sku,
          systemStock,
          countedStock,
          variance,
          costImpact,
          adjustment: stockAdjustment
        });
      }
    }

    res.json({ 
      success: true,
      message: `Cycle count completed. ${results.length} adjustments made.`,
      data: results 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get adjustment by ID
export const getStockAdjustmentById = async (req, res) => {
  try {
    const adjustment = await StockAdjustment.findById(req.params.id)
      .populate('product', 'name sku price')
      .populate('performedBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!adjustment) {
      return res.status(404).json({ success: false, message: 'Adjustment not found' });
    }

    res.json({ success: true, data: adjustment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update adjustment status
export const updateAdjustmentStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const adjustment = await StockAdjustment.findById(req.params.id);

    if (!adjustment) {
      return res.status(404).json({ success: false, message: 'Adjustment not found' });
    }

    adjustment.status = status;
    if (notes) adjustment.notes = `${adjustment.notes}\n\nStatus Update: ${notes}`;
    if (status === 'approved') adjustment.approvedBy = req.user.id;

    await adjustment.save();
    await adjustment.populate(['product', 'performedBy', 'approvedBy']);

    res.json({ success: true, data: adjustment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update stock adjustment
export const updateStockAdjustment = async (req, res) => {
  try {
    const { quantity, reason, notes, type } = req.body;
    const adjustment = await StockAdjustment.findById(req.params.id);
    
    if (!adjustment) {
      return res.status(404).json({ success: false, message: 'Adjustment not found' });
    }

    if (adjustment.isAutomatic) {
      return res.status(400).json({ success: false, message: 'Cannot edit automatic adjustments' });
    }

    const product = await Product.findById(adjustment.product);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Restore original stock first
    product.stock = adjustment.previousStock;

    // Calculate new adjustment
    let newStock, adjustmentQuantity;
    switch (type) {
      case 'adjustment':
        newStock = quantity;
        adjustmentQuantity = quantity - adjustment.previousStock;
        break;
      case 'damage':
      case 'loss':
      case 'expired':
        adjustmentQuantity = -Math.abs(quantity);
        newStock = Math.max(0, adjustment.previousStock - Math.abs(quantity));
        break;
      case 'found':
      case 'returned':
        adjustmentQuantity = Math.abs(quantity);
        newStock = adjustment.previousStock + Math.abs(quantity);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid adjustment type' });
    }

    // Update product stock and force save
    await Product.findByIdAndUpdate(adjustment.product, { stock: newStock });
    
    // Verify the update worked
    const updatedProduct = await Product.findById(adjustment.product);
    console.log(`Stock updated: ${adjustment.previousStock} → ${updatedProduct.stock}`);

    // Update adjustment record
    adjustment.type = type;
    adjustment.adjustmentQuantity = adjustmentQuantity;
    adjustment.newStock = newStock;
    adjustment.reason = reason;
    adjustment.notes = notes;
    adjustment.costImpact = Math.abs(adjustmentQuantity) * (product.price || 0);
    await adjustment.save();

    // Create stock log for the update
    await StockLog.create({
      product: adjustment.product,
      user: req.user.id,
      action: 'adjustment_updated',
      previousQuantity: adjustment.previousStock,
      newQuantity: newStock,
      changeAmount: Math.abs(adjustmentQuantity),
      reason: `Updated adjustment: ${reason}`
    });

    await adjustment.populate(['product', 'performedBy', 'approvedBy']);
    res.json({ success: true, data: adjustment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete stock adjustment (history only - keeps current stock)
export const deleteStockAdjustment = async (req, res) => {
  try {
    const adjustment = await StockAdjustment.findById(req.params.id);
    if (!adjustment) {
      return res.status(404).json({ success: false, message: 'Adjustment not found' });
    }

    // Just delete the record, don't change stock
    await StockAdjustment.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Adjustment history deleted (stock unchanged)' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// Get adjustment statistics
export const getAdjustmentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await StockAdjustment.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalAdjustments: { $sum: 1 },
          totalCostImpact: { $sum: '$costImpact' },
          avgCostImpact: { $avg: '$costImpact' },
          typeBreakdown: {
            $push: {
              type: '$type',
              quantity: '$adjustmentQuantity',
              cost: '$costImpact'
            }
          }
        }
      }
    ]);

    const typeStats = await StockAdjustment.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$adjustmentQuantity' },
          totalCost: { $sum: '$costImpact' }
        }
      }
    ]);

    res.json({ 
      success: true, 
      data: {
        summary: stats[0] || { totalAdjustments: 0, totalCostImpact: 0, avgCostImpact: 0 },
        byType: typeStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};