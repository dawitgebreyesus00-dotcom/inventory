import express from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productsController.js';
import { authenticateToken, requireManager, requireViewer, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, requireViewer, getProducts);
router.get('/:id', authenticateToken, requireViewer, getProductById);
router.post('/', authenticateToken, requireManager, checkPermission('create'), createProduct);
router.patch('/:id', authenticateToken, requireManager, checkPermission('update'), updateProduct);
router.delete('/:id', authenticateToken, requireManager, checkPermission('delete'), deleteProduct);

export default router;
    
