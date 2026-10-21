import StockRelationshipService from '../services/stockRelationshipService.js';

// Get low stock alerts
export const getLowStockAlerts = async (req, res) => {
  try {
    const { threshold = 5 } = req.query;
    const alerts = await StockRelationshipService.getLowStockAlerts(parseInt(threshold));
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Validate product deletion constraints
export const validateProductDeletion = async (req, res) => {
  try {
    const { productId } = req.params;
    const validation = await StockRelationshipService.validateProductDeletion(productId);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Validate order stock availability
export const validateOrderStock = async (req, res) => {
  try {
    const { orderItems } = req.body;
    const validation = await StockRelationshipService.validateOrderStock(orderItems);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get stock movement history
export const getStockMovementHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { startDate, endDate } = req.query;
    
    const history = await StockRelationshipService.getStockMovementHistory(
      productId, startDate, endDate
    );
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get comprehensive stock report
export const getStockReport = async (req, res) => {
  try {
    const report = await StockRelationshipService.getStockReport();
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Handle physical count adjustment
export const handlePhysicalCount = async (req, res) => {
  try {
    const { productId, actualCount, reason, notes } = req.body;
    
    const result = await StockRelationshipService.handlePhysicalCountAdjustment(
      productId, actualCount, reason, req.user.id, notes
    );
    
    res.json({
      success: true,
      data: result,
      message: 'Physical count adjustment completed'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Handle damage/loss adjustment
export const handleDamageLoss = async (req, res) => {
  try {
    const { productId, lostQuantity, type, reason, notes } = req.body;
    
    const result = await StockRelationshipService.handleDamageLossAdjustment(
      productId, lostQuantity, type, reason, req.user.id, notes
    );
    
    res.json({
      success: true,
      data: result,
      message: `${type} adjustment completed`
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};