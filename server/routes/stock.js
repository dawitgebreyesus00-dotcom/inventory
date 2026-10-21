import express from 'express';
import { addStock, reduceStock } from '../services/stockService.js';
import StockLog from '../models/StockLog.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Add stock (from suppliers)
router.post('/add', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { productId, quantity, reason } = req.body;
    const userId = req.user.id;
    
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: { message: 'Product ID and positive quantity required' } });
    }
    
    const result = await addStock(productId, parseInt(quantity), reason || 'Stock added by admin', userId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Reduce stock (damaged/expired/lost)
router.post('/reduce', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { productId, quantity, reason } = req.body;
    const userId = req.user.id;
    
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: { message: 'Product ID and positive quantity required' } });
    }
    
    if (!reason) {
      return res.status(400).json({ error: { message: 'Reason required for stock reduction' } });
    }
    
    const result = await reduceStock(productId, parseInt(quantity), reason, userId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get stock logs
router.get('/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, productId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = {};
    if (productId) query.product = productId;
    
    const logs = await StockLog.find(query)
      .populate('product', 'name sku')
      .populate('user', 'name email')
      .populate('orderId', 'orderNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await StockLog.countDocuments(query);
    
    res.json({ 
      success: true, 
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

export default router;