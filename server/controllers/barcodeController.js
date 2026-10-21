import Product from '../models/Product.js';
import { generateBarcode, generateQRData, generateBarcodeSVG } from '../utils/barcodeGenerator.js';

// Generate barcode for product
export const generateProductBarcode = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Generate barcode if not exists
    if (!product.barcode) {
      product.barcode = generateBarcode(product.sku);
      await product.save();
    }

    res.json({ 
      barcode: product.barcode,
      qrData: generateQRData(product)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate barcode SVG
export const getBarcodeImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.barcode) {
      product.barcode = generateBarcode(product.sku);
      await product.save();
    }

    const svg = generateBarcodeSVG(product.barcode);
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk generate barcodes
export const bulkGenerateBarcodes = async (req, res) => {
  try {
    const { productIds } = req.body;
    
    const results = [];
    
    for (const id of productIds) {
      const product = await Product.findById(id);
      if (product && !product.barcode) {
        product.barcode = generateBarcode(product.sku);
        await product.save();
        results.push({
          productId: id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode
        });
      }
    }

    res.json({ 
      message: `Generated barcodes for ${results.length} products`,
      results 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search product by barcode
export const searchByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    
    const product = await Product.findOne({ barcode })
      .populate('category', 'name')
      .populate('supplier', 'name');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};