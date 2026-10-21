import Product from '../models/Product.js';
import StockLog from '../models/StockLog.js';

export const updateStock = async (productId, changeAmount, action, reason, userId, orderId = null) => {
  const session = await Product.startSession();
  
  try {
    await session.withTransaction(async () => {
      const product = await Product.findById(productId).session(session);
      if (!product) throw new Error('Product not found');

      const previousQuantity = product.quantity;
      const newQuantity = previousQuantity + changeAmount;

      // Prevent negative stock
      if (newQuantity < 0) {
        throw new Error(`Insufficient stock. Available: ${previousQuantity}, Required: ${Math.abs(changeAmount)}`);
      }

      // Update product quantity
      await Product.findByIdAndUpdate(
        productId, 
        { quantity: newQuantity }, 
        { session }
      );

      // Log the stock change
      await StockLog.create([{
        product: productId,
        user: userId,
        action,
        previousQuantity,
        newQuantity,
        changeAmount,
        reason,
        orderId
      }], { session });

      return { previousQuantity, newQuantity, changeAmount };
    });
  } finally {
    await session.endSession();
  }
};

export const addStock = async (productId, quantity, reason, userId) => {
  return await updateStock(productId, quantity, 'stock_added', reason, userId);
};

export const reduceStock = async (productId, quantity, reason, userId) => {
  return await updateStock(productId, -quantity, 'stock_reduced', reason, userId);
};

export const approveOrderStock = async (productId, quantity, orderId, userId) => {
  return await updateStock(productId, -quantity, 'order_approved', `Order #${orderId} approved`, userId, orderId);
};

export const cancelOrderStock = async (productId, quantity, orderId, userId) => {
  return await updateStock(productId, quantity, 'order_cancelled', `Order #${orderId} cancelled`, userId, orderId);
};