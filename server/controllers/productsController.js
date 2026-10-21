import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Supplier from '../models/Supplier.js';

export const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Product.find().populate('category supplier').skip(skip).limit(limit).sort({ name: 1 }),
      Product.countDocuments()
    ]);

    res.json({ success: true, data: { items, total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('getProducts error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch products' } });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate('category supplier');
    if (!product) return res.status(404).json({ success: false, error: { message: 'Product not found' } });
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('getProductById error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch product' } });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, sku, description, price, quantity, category, supplier, images } = req.body;
    if (!name) return res.status(400).json({ success: false, error: { message: 'Name is required' } });
    
    // Check SKU uniqueness
    if (sku) {
      const existing = await Product.findOne({ sku });
      if (existing) return res.status(409).json({ success: false, error: { message: 'SKU already exists' } });
    }
    
    // Validate price and quantity
    if (price !== undefined && price < 0) {
      return res.status(400).json({ success: false, error: { message: 'Price cannot be negative' } });
    }
    if (quantity !== undefined && quantity < 0) {
      return res.status(400).json({ success: false, error: { message: 'Quantity cannot be negative' } });
    }

    const product = await Product.create({ name, sku, description, price: price || 0, quantity: quantity || 0, category, supplier, images });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('createProduct error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to create product' } });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { sku, price, quantity, ...otherUpdates } = req.body;
    
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, error: { message: 'Product not found' } });
    
    // Check SKU uniqueness
    if (sku && sku !== product.sku) {
      const existing = await Product.findOne({ sku, _id: { $ne: id } });
      if (existing) return res.status(409).json({ success: false, error: { message: 'SKU already exists' } });
    }
    
    // Validate price and quantity
    if (price !== undefined && price < 0) {
      return res.status(400).json({ success: false, error: { message: 'Price cannot be negative' } });
    }
    if (quantity !== undefined && quantity < 0) {
      return res.status(400).json({ success: false, error: { message: 'Quantity cannot be negative' } });
    }
    
    const updates = { ...otherUpdates };
    if (sku !== undefined) updates.sku = sku;
    if (price !== undefined) updates.price = price;
    if (quantity !== undefined) updates.quantity = quantity;
    
    const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true }).populate('category supplier');
    res.json({ success: true, data: updatedProduct });
  } catch (error) {
    console.error('updateProduct error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to update product' } });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product is used in orders
    const Order = (await import('../models/Order.js')).default;
    const orderCount = await Order.countDocuments({ 'items.product': id });
    
    if (orderCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: { message: `Cannot delete product. Product is used in ${orderCount} order(s).` } 
      });
    }
    
    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ success: false, error: { message: 'Product not found' } });
    res.json({ success: true, data: { id: product._id } });
  } catch (error) {
    console.error('deleteProduct error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to delete product' } });
  }
};
