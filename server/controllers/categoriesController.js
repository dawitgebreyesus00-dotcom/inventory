import Category from "../models/Category.js";

// GET /api/categories
export const getCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Category.find().sort({ name: 1 }).skip(skip).limit(limit),
      Category.countDocuments(),
    ]);

    res.json({ success: true, data: { items, total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("getCategories error:", error);
    res.status(500).json({ success: false, error: { message: "Failed to fetch categories" } });
  }
};

// GET /api/categories/:id
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ success: false, error: { message: "Category not found" } });
    res.json({ success: true, data: category });
  } catch (error) {
    console.error("getCategoryById error:", error);
    res.status(500).json({ success: false, error: { message: "Failed to fetch category" } });
  }
};

// POST /api/categories
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, error: { message: "Name is required" } });

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) return res.status(409).json({ success: false, error: { message: "Category already exists" } });

    const category = await Category.create({ name: name.trim(), description });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error("createCategory error:", error);
    res.status(500).json({ success: false, error: { message: "Failed to create category" } });
  }
};

// PATCH /api/categories/:id
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ success: false, error: { message: "Category not found" } });

    if (name && name.trim() !== category.name) {
      const existing = await Category.findOne({ name: name.trim(), _id: { $ne: id } });
      if (existing) return res.status(409).json({ success: false, error: { message: "Category name already exists" } });
      category.name = name.trim();
    }
    if (description !== undefined) category.description = description;

    await category.save();
    res.json({ success: true, data: category });
  } catch (error) {
    console.error("updateCategory error:", error);
    res.status(500).json({ success: false, error: { message: "Failed to update category" } });
  }
};

// DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category has products
    const Product = (await import('../models/Product.js')).default;
    const productCount = await Product.countDocuments({ category: id });
    
    if (productCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: { message: `Cannot delete category. Category has ${productCount} product(s). Please reassign products first.` } 
      });
    }
    
    const category = await Category.findByIdAndDelete(id);
    if (!category) return res.status(404).json({ success: false, error: { message: "Category not found" } });
    res.json({ success: true, data: { id: category._id } });
  } catch (error) {
    console.error("deleteCategory error:", error);
    res.status(500).json({ success: false, error: { message: "Failed to delete category" } });
  }
};
