import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { approveOrderStock, cancelOrderStock } from '../services/stockService.js';

export const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    let query = {};
    if (status) query.status = status;
    
    // Add search functionality
    if (search) {
      query.$or = [
        { '_id': { $regex: search, $options: 'i' } },
        { 'shippingAddress': { $regex: search, $options: 'i' } }
      ];
    }
    
    const orders = await Order.find(query)
      .populate('user')
      .populate('items.product')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await Order.countDocuments(query);
    
    res.json({ 
      success: true, 
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('getOrders error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch orders' } });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate('user').populate('items.product');
    if (!order) return res.status(404).json({ success: false, error: { message: 'Order not found' } });
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('getOrderById error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch order' } });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { user, items = [], shippingAddress } = req.body;
    if (!user) return res.status(400).json({ success: false, error: { message: 'User is required' } });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ success: false, error: { message: 'Order items required' } });

    // Extract product IDs and validate quantities
    const productIds = [];
    const itemsMap = new Map();
    
    for (const it of items) {
      if (!it.product) return res.status(400).json({ success: false, error: { message: 'Product ID is required for each item' } });
      const qty = parseInt(it.quantity, 10);
      if (isNaN(qty) || qty < 1) return res.status(400).json({ success: false, error: { message: 'Quantity must be a positive number' } });
      
      productIds.push(it.product);
      itemsMap.set(it.product, qty);
    }

    // Batch query for all products
    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length !== productIds.length) {
      return res.status(400).json({ success: false, error: { message: 'One or more products not found' } });
    }

    // Resolve product prices, check inventory, and compute total
    let total = 0;
    const resolvedItems = [];

    for (const prod of products) {
      const qty = itemsMap.get(prod._id.toString());
      const price = prod.price || 0;
      
      // Check if product is active
      if (!prod.active) {
        return res.status(400).json({ success: false, error: { message: `Product '${prod.name}' is not available` } });
      }
      
      // Note: Stock is NOT reduced here - order is pending approval
      // Admin will approve (pending -> processing) which reduces stock
      
      total += price * qty;
      resolvedItems.push({ product: prod._id, quantity: qty, price });
    }

    const order = await Order.create({ user, items: resolvedItems, total, shippingAddress });
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('createOrder error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to create order' } });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') } });
    }
    
    const order = await Order.findById(id).populate('items.product');
    if (!order) return res.status(404).json({ success: false, error: { message: 'Order not found' } });
    
    const currentStatus = order.status;
    
    // Prevent invalid status transitions
    const invalidTransitions = {
      'completed': ['pending', 'processing'],
      'cancelled': ['pending', 'processing', 'shipped', 'completed'],
      'shipped': ['pending']
    };
    
    if (invalidTransitions[currentStatus] && invalidTransitions[currentStatus].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: { message: `Cannot change status from ${currentStatus} to ${status}` } 
      });
    }
    
    // Handle stock changes based on status transitions
    if (currentStatus === 'pending' && status === 'processing') {
      // Admin approves order - reduce stock directly
      for (const item of order.items) {
        const product = await Product.findById(item.product._id);
        if (product) {
          const newQuantity = product.quantity - item.quantity;
          if (newQuantity < 0) {
            return res.status(400).json({ 
              success: false, 
              error: { message: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Required: ${item.quantity}` } 
            });
          }
          await Product.findByIdAndUpdate(item.product._id, { quantity: newQuantity });
        }
      }
    } else if (currentStatus !== 'cancelled' && status === 'cancelled') {
      // Order cancelled - return stock if it was previously approved
      if (['processing', 'shipped', 'completed'].includes(currentStatus)) {
        for (const item of order.items) {
          const product = await Product.findById(item.product._id);
          if (product) {
            const newQuantity = product.quantity + item.quantity;
            await Product.findByIdAndUpdate(item.product._id, { quantity: newQuantity });
          }
        }
      }
    }
    
    order.status = status;
    await order.save();
    
    // Populate the order before returning
    const updatedOrder = await Order.findById(id).populate('user').populate('items.product');
    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    res.status(500).json({ success: false, error: { message: error.message || 'Failed to update order' } });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
    const orders = await Order.find({ user: userId }).populate('items.product').sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('getMyOrders error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch your orders' } });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, error: { message: 'Order not found' } });
    
    // Prevent deletion of completed or shipped orders
    if (order.status === 'completed' || order.status === 'shipped') {
      return res.status(400).json({ 
        success: false, 
        error: { message: `Cannot delete ${order.status} order. Only pending, processing, or cancelled orders can be deleted.` } 
      });
    }
    
    await Order.findByIdAndDelete(id);
    res.json({ success: true, data: { id } });
  } catch (error) {
    console.error('deleteOrder error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to delete order' } });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, shippingAddress } = req.body;
    
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, error: { message: 'Order not found' } });
    
    if (items) {
      // Recalculate total if items changed
      const productIds = items.map(it => it.product);
      const products = await Product.find({ _id: { $in: productIds } });
      
      let total = 0;
      const resolvedItems = [];
      
      for (const prod of products) {
        const item = items.find(it => it.product === prod._id.toString());
        const qty = parseInt(item.quantity, 10) || 1;
        const price = prod.price || 0;
        total += price * qty;
        resolvedItems.push({ product: prod._id, quantity: qty, price });
      }
      
      order.items = resolvedItems;
      order.total = total;
    }
    
    if (shippingAddress !== undefined) order.shippingAddress = shippingAddress;
    
    await order.save();
    const updatedOrder = await Order.findById(id).populate('user').populate('items.product');
    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error('updateOrder error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to update order' } });
  }
};