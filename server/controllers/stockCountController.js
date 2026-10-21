import StockCount from '../models/StockCount.js';
import Product from '../models/Product.js';
import StockLog from '../models/StockLog.js';

// Create stock count schedule
export const createStockCount = async (req, res) => {
  try {
    const { type, scheduledDate, notes } = req.body;

    const stockCount = new StockCount({
      type,
      scheduledDate,
      notes,
      countedBy: req.user.id
    });

    await stockCount.save();
    res.status(201).json(stockCount);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Start stock count
export const startStockCount = async (req, res) => {
  try {
    const { id } = req.params;
    
    const stockCount = await StockCount.findById(id);
    if (!stockCount) {
      return res.status(404).json({ message: 'Stock count not found' });
    }

    stockCount.status = 'in_progress';
    stockCount.startedDate = new Date();
    await stockCount.save();

    res.json({ message: 'Stock count started' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Record count results
export const recordCountResults = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    const stockCount = await StockCount.findById(id);
    if (!stockCount) {
      return res.status(404).json({ message: 'Stock count not found' });
    }

    let totalVariance = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        const variance = item.physicalCount - product.stock;
        totalVariance += Math.abs(variance);
        
        processedItems.push({
          product: item.productId,
          systemStock: product.stock,
          physicalCount: item.physicalCount,
          variance,
          notes: item.notes
        });
      }
    }

    stockCount.items = processedItems;
    stockCount.totalVariance = totalVariance;
    stockCount.status = 'completed';
    stockCount.completedDate = new Date();

    await stockCount.save();
    res.json(stockCount);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Apply count adjustments
export const applyCountAdjustments = async (req, res) => {
  try {
    const { id } = req.params;
    
    const stockCount = await StockCount.findById(id).populate('items.product');
    if (!stockCount) {
      return res.status(404).json({ message: 'Stock count not found' });
    }

    for (const item of stockCount.items) {
      if (item.variance !== 0) {
        const product = await Product.findById(item.product._id);
        if (product) {
          const oldStock = product.stock;
          product.stock = item.physicalCount;
          await product.save();

          // Log adjustment
          await StockLog.create({
            product: item.product._id,
            type: 'count_adjustment',
            quantity: item.variance,
            previousStock: oldStock,
            newStock: product.stock,
            reason: `Stock count adjustment - ${stockCount.countNumber}`,
            reference: stockCount.countNumber,
            performedBy: req.user.id
          });
        }
      }
    }

    stockCount.approvedBy = req.user.id;
    await stockCount.save();

    res.json({ message: 'Count adjustments applied successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get stock counts
export const getStockCounts = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (type) filter.type = type;

    const counts = await StockCount.find(filter)
      .populate('countedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(counts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};