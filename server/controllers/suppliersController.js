import Supplier from '../models/Supplier.js';

export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    console.error('getSuppliers error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch suppliers' } });
  }
};

export const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findById(id);
    if (!supplier) return res.status(404).json({ success: false, error: { message: 'Supplier not found' } });
    res.json({ success: true, data: supplier });
  } catch (error) {
    console.error('getSupplierById error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch supplier' } });
  }
};

export const createSupplier = async (req, res) => {
  try {
    const { name, contactName, phone, email, address, notes } = req.body;
    if (!name) return res.status(400).json({ success: false, error: { message: 'Name is required' } });
    
    // Check email uniqueness
    if (email) {
      const existing = await Supplier.findOne({ email });
      if (existing) return res.status(409).json({ success: false, error: { message: 'Email already exists' } });
    }

    const supplier = await Supplier.create({ name, contactName, phone, email, address, notes });
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    console.error('createSupplier error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to create supplier' } });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, ...otherUpdates } = req.body;
    
    const supplier = await Supplier.findById(id);
    if (!supplier) return res.status(404).json({ success: false, error: { message: 'Supplier not found' } });
    
    // Check email uniqueness
    if (email && email !== supplier.email) {
      const existing = await Supplier.findOne({ email, _id: { $ne: id } });
      if (existing) return res.status(409).json({ success: false, error: { message: 'Email already exists' } });
    }
    
    const updates = { ...otherUpdates };
    if (email !== undefined) updates.email = email;
    
    const updatedSupplier = await Supplier.findByIdAndUpdate(id, updates, { new: true });
    res.json({ success: true, data: updatedSupplier });
  } catch (error) {
    console.error('updateSupplier error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to update supplier' } });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if supplier has products
    const Product = (await import('../models/Product.js')).default;
    const productCount = await Product.countDocuments({ supplier: id });
    
    if (productCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: { message: `Cannot delete supplier. Supplier has ${productCount} product(s). Please reassign products first.` } 
      });
    }
    
    const supplier = await Supplier.findByIdAndDelete(id);
    if (!supplier) return res.status(404).json({ success: false, error: { message: 'Supplier not found' } });
    res.json({ success: true, data: { id: supplier._id } });
  } catch (error) {
    console.error('deleteSupplier error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to delete supplier' } });
  }
};
