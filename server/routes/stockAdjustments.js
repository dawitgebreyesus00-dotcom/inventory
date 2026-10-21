import express from 'express';
import { authenticateToken, requireAdmin, requireManager, checkPermission } from '../middleware/auth.js';
import { validateConstraints } from '../middleware/constraints.js';
import {
  getStockAdjustments,
  createStockAdjustment,
  bulkStockAdjustment,
  createCycleCount,
  getStockAdjustmentById,
  updateAdjustmentStatus,
  getAdjustmentStats,
  updateStockAdjustment,
  deleteStockAdjustment
} from '../controllers/stockAdjustmentController.js';

const router = express.Router();

router.get('/', authenticateToken, requireManager, getStockAdjustments);
router.get('/stats', authenticateToken, getAdjustmentStats);
router.get('/:id', authenticateToken, getStockAdjustmentById);
router.post('/', authenticateToken, requireManager, checkPermission('stock_adjust'), validateConstraints.stockAdjustment.beforeCreate, createStockAdjustment);
router.post('/bulk', authenticateToken, requireManager, checkPermission('stock_adjust'), bulkStockAdjustment);
router.post('/cycle-count', authenticateToken, requireManager, checkPermission('stock_adjust'), createCycleCount);
router.patch('/:id/status', authenticateToken, requireAdmin, updateAdjustmentStatus);
router.put('/:id', authenticateToken, requireAdmin, updateStockAdjustment);
router.delete('/:id', authenticateToken, requireAdmin, deleteStockAdjustment);

export default router;