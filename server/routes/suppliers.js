import express from 'express';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
} from '../controllers/suppliersController.js';

const router = express.Router();
import { authenticateToken, requireAdmin, requireViewer } from '../middleware/auth.js';

router.get('/', authenticateToken, requireViewer, getSuppliers);
router.get('/:id', authenticateToken, requireViewer, getSupplierById);
router.post('/', authenticateToken, requireAdmin, createSupplier);
router.patch('/:id', authenticateToken, requireAdmin, updateSupplier);
router.delete('/:id', authenticateToken, requireAdmin, deleteSupplier);

export default router;
