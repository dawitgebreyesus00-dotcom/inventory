import express from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getMyOrders,
  deleteOrder,
  updateOrder
} from '../controllers/ordersController.js';

const router = express.Router();
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

router.get('/', verifyToken, requireAdmin, getOrders);
router.get('/my', verifyToken, getMyOrders);
router.get('/:id', verifyToken, requireAdmin, getOrderById);
router.post('/', createOrder); // public - customers place orders
router.patch('/:id/status', verifyToken, requireAdmin, updateOrderStatus);
router.patch('/:id', verifyToken, requireAdmin, updateOrder);
router.delete('/:id', verifyToken, requireAdmin, deleteOrder);

export default router;
