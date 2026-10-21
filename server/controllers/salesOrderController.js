import SalesOrder from '../models/SalesOrder.js';
import Product from '../models/Product.js';
import StockLog from '../models/StockLog.js';

// Get all sales orders
export const getSalesOrders = async (req, res) => {
  try {
    const { status, customer, page = 1, limit = 10 } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (customer) filter.customer = customer;

    const orders = await SalesOrder.find(filter)
      .populate('customer', 'name email')
      .populate('items.product', 'name sku')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SalesOrder.countDocuments(filter);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create sales order
export const createSalesOrder = async (req, res) => {
  try {
    const { customer, items, notes } = req.body;
    
    // Validate stock availability
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        });
      }
    }

    // Calculate totals
    let totalAmount = 0;
    const processedItems = await Promise.all(items.map(async (item) => {
      const product = await Product.findById(item.product);
      const unitPrice = item.unitPrice || product.price;
      const totalPrice = item.quantity * unitPrice;
      totalAmount += totalPrice;
      return { ...item, unitPrice, totalPrice };
    }));

    const salesOrder = new SalesOrder({
      customer,
      items: processedItems,
      notes,
      totalAmount,
      createdBy: req.user.id
    });

    await salesOrder.save();
    await salesOrder.populate(['customer', 'items.product', 'createdBy']);

    res.status(201).json(salesOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update sales order status
export const updateSalesOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const salesOrder = await SalesOrder.findById(id).populate('items.product');
    if (!salesOrder) {
      return res.status(404).json({ message: 'Sales order not found' });
    }

    const oldStatus = salesOrder.status;
    salesOrder.status = status;

    // Handle stock reduction when order is confirmed
    if (oldStatus === 'pending' && status === 'confirmed') {
      for (const item of salesOrder.items) {
        const product = await Product.findById(item.product._id);
        if (product) {
          const oldStock = product.stock;
          product.stock -= item.quantity;
          await product.save();

          // Log stock change
          await StockLog.create({
            product: item.product._id,
            type: 'sale',
            quantity: -item.quantity,
            previousStock: oldStock,
            newStock: product.stock,
            reference: `SO-${salesOrder.orderNumber}`,
            performedBy: req.user.id
          });
        }
      }
    }

    // Handle stock return when order is cancelled
    if (['confirmed', 'shipped'].includes(oldStatus) && status === 'cancelled') {
      for (const item of salesOrder.items) {
        const product = await Product.findById(item.product._id);
        if (product) {
          const oldStock = product.stock;
          product.stock += item.quantity;
          await product.save();

          // Log stock change
          await StockLog.create({
            product: item.product._id,
            type: 'return',
            quantity: item.quantity,
            previousStock: oldStock,
            newStock: product.stock,
            reference: `SO-${salesOrder.orderNumber}-CANCELLED`,
            performedBy: req.user.id
          });
        }
      }
    }

    if (status === 'shipped') {
      salesOrder.shippedDate = new Date();
    }
    if (status === 'delivered') {
      salesOrder.deliveredDate = new Date();
    }

    await salesOrder.save();
    res.json(salesOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const salesOrder = await SalesOrder.findById(id);
    
    if (!salesOrder) {
      return res.status(404).json({ message: 'Sales order not found' });
    }

    if (['confirmed', 'shipped', 'delivered'].includes(salesOrder.status)) {
      return res.status(400).json({ message: 'Cannot delete processed sales order' });
    }

    await SalesOrder.findByIdAndDelete(id);
    res.json({ message: 'Sales order deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};