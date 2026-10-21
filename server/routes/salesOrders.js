import express from 'express';
import { authenticateToken, requireManager, checkPermission } from '../middleware/auth.js';
import {
  getSalesOrders,
  createSalesOrder,
  updateSalesOrderStatus,
  deleteSalesOrder
} from '../controllers/salesOrderController.js';

const router = express.Router();

router.get('/', authenticateToken, requireManager, getSalesOrders);
router.post('/', authenticateToken, requireManager, checkPermission('create'), createSalesOrder);
router.patch('/:id/status', authenticateToken, requireManager, checkPermission('update'), updateSalesOrderStatus);
router.delete('/:id', authenticateToken, requireManager, checkPermission('delete'), deleteSalesOrder);

export default router;