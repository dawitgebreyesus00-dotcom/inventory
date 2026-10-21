import express from 'express';
import { authenticateToken, requireViewer, checkPermission } from '../middleware/auth.js';
import {
  getStockReport,
  getSalesReport,
  getStockMovementReport,
  getPurchaseOrderReport
} from '../controllers/reportsController.js';

const router = express.Router();

router.get('/stock', authenticateToken, requireViewer, checkPermission('view_reports'), getStockReport);
router.get('/sales', authenticateToken, requireViewer, checkPermission('view_reports'), getSalesReport);
router.get('/stock-movements', authenticateToken, requireViewer, checkPermission('view_reports'), getStockMovementReport);
router.get('/purchase-orders', authenticateToken, requireViewer, checkPermission('view_reports'), getPurchaseOrderReport);

export default router;