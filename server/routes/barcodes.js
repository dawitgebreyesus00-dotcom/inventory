import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  generateProductBarcode,
  getBarcodeImage,
  bulkGenerateBarcodes,
  searchByBarcode
} from '../controllers/barcodeController.js';

const router = express.Router();

router.post('/generate/:id', authenticateToken, requireAdmin, generateProductBarcode);
router.get('/image/:id', authenticateToken, getBarcodeImage);
router.post('/bulk-generate', authenticateToken, requireAdmin, bulkGenerateBarcodes);
router.get('/search/:barcode', authenticateToken, searchByBarcode);

export default router;