import Product from '../models/Product.js';
import Order from '../models/Order.js';
import StockLog from '../models/StockLog.js';
import PurchaseOrder from '../models/PurchaseOrder.js';

// Stock level report
export const getStockReport = async (req, res) => {
  try {
    const { category, supplier, stockLevel } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (supplier) filter.supplier = supplier;

    let products = await Product.find(filter)
      .populate('category', 'name')
      .populate('supplier', 'name')
      .sort({ stock: 1 });

    // Filter by stock level
    if (stockLevel === 'low') {
      products = products.filter(p => p.stock <= p.lowStockThreshold);
    } else if (stockLevel === 'out') {
      products = products.filter(p => p.stock === 0);
    } else if (stockLevel === 'overstock') {
      products = products.filter(p => p.stock > p.lowStockThreshold * 5);
    }

    const summary = {
      totalProducts: products.length,
      totalValue: products.reduce((sum, p) => sum + (p.stock * p.price), 0),
      lowStockItems: products.filter(p => p.stock <= p.lowStockThreshold).length,
      outOfStockItems: products.filter(p => p.stock === 0).length
    };

    res.json({ products, summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sales report
export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query;
    
    const matchStage = {
      status: { $in: ['processing', 'shipped', 'delivered'] },
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const groupBy = period === 'monthly' 
      ? { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }
      : { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };

    const salesData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupBy,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Top selling products
    const topProducts = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' }
    ]);

    res.json({ salesData, topProducts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stock movement report
export const getStockMovementReport = async (req, res) => {
  try {
    const { startDate, endDate, productId, type } = req.query;
    
    const filter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    if (productId) filter.product = productId;
    if (type) filter.type = type;

    const movements = await StockLog.find(filter)
      .populate('product', 'name sku')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 });

    const summary = await StockLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          totalMovements: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);

    res.json({ movements, summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Purchase order report
export const getPurchaseOrderReport = async (req, res) => {
  try {
    const { startDate, endDate, supplier, status } = req.query;
    
    const filter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    if (supplier) filter.supplier = supplier;
    if (status) filter.status = status;

    const purchaseOrders = await PurchaseOrder.find(filter)
      .populate('supplier', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    const summary = {
      totalOrders: purchaseOrders.length,
      totalAmount: purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0),
      byStatus: await PurchaseOrder.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } }
      ])
    };

    res.json({ purchaseOrders, summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};