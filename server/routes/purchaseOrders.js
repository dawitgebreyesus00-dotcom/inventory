import express from 'express';
import { authenticateToken, requireManager, checkPermission } from '../middleware/auth.js';
import { validateConstraints } from '../middleware/constraints.js';
import {
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  receivePurchaseOrder,
  sendPurchaseOrder,
  confirmPurchaseOrder,
  shipPurchaseOrder,
  deletePurchaseOrder
} from '../controllers/purchaseOrderController.js';

const router = express.Router();

router.get('/', authenticateToken, requireManager, getPurchaseOrders);
router.post('/', authenticateToken, requireManager, checkPermission('create'), validateConstraints.purchaseOrder.beforeCreate, createPurchaseOrder);
router.patch('/:id/status', authenticateToken, requireManager, checkPermission('update'), validateConstraints.purchaseOrder.beforeUpdate, updatePurchaseOrderStatus);
router.post('/:id/send', authenticateToken, sendPurchaseOrder);
router.post('/:id/confirm', confirmPurchaseOrder); // Public endpoint for suppliers
router.post('/:id/ship', shipPurchaseOrder); // Public endpoint for suppliers  
router.post('/:id/receive', authenticateToken, requireManager, checkPermission('stock_adjust'), receivePurchaseOrder);
router.delete('/:id', authenticateToken, requireManager, checkPermission('delete'), deletePurchaseOrder);

export default router;