import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  getLowStockAlerts,
  validateProductDeletion,
  validateOrderStock,
  getStockMovementHistory,
  getStockReport,
  handlePhysicalCount,
  handleDamageLoss
} from '../controllers/stockRelationshipController.js';

const router = express.Router();

// Stock alerts and monitoring
router.get('/alerts/low-stock', authenticateToken, getLowStockAlerts);
router.get('/reports/comprehensive', authenticateToken, getStockReport);
router.get('/history/:productId', authenticateToken, getStockMovementHistory);

// Validation endpoints
router.get('/validate/product-deletion/:productId', authenticateToken, requireAdmin, validateProductDeletion);
router.post('/validate/order-stock', authenticateToken, validateOrderStock);

// Manual adjustment endpoints
router.post('/adjustments/physical-count', authenticateToken, requireAdmin, handlePhysicalCount);
router.post('/adjustments/damage-loss', authenticateToken, requireAdmin, handleDamageLoss);

export default router;