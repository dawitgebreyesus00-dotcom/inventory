import PurchaseOrder from '../models/PurchaseOrder.js';
import Product from '../models/Product.js';
import StockLog from '../models/StockLog.js';
import { autoStock } from '../services/autoStockService.js';
import StockRelationshipService from '../services/stockRelationshipService.js';
import { emailService } from '../services/emailService.js';

// Get all purchase orders
export const getPurchaseOrders = async (req, res) => {
  try {
    const { status, supplier, page = 1, limit = 10 } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (supplier) filter.supplier = supplier;

    const orders = await PurchaseOrder.find(filter)
      .populate('supplier', 'name')
      .populate('items.product', 'name sku')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PurchaseOrder.countDocuments(filter);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create purchase order
export const createPurchaseOrder = async (req, res) => {
  try {
    const { supplier, items, expectedDate, notes } = req.body;
    
    // Validate required fields
    if (!supplier) {
      return res.status(400).json({ message: 'Supplier is required' });
    }
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }
    
    // Calculate totals
    let totalAmount = 0;
    const processedItems = items.map(item => {
      const totalCost = item.quantity * item.unitCost;
      totalAmount += totalCost;
      return { ...item, totalCost };
    });

    const purchaseOrder = new PurchaseOrder({
      supplier,
      items: processedItems,
      expectedDate: expectedDate || undefined,
      notes: notes || '',
      totalAmount,
      createdBy: req.user.id
    });

    await purchaseOrder.save();
    await purchaseOrder.populate(['supplier', 'items.product', 'createdBy']);

    res.status(201).json(purchaseOrder);
  } catch (error) {
    console.error('Purchase Order Creation Error:', error);
    res.status(400).json({ message: error.message || 'Failed to create purchase order' });
  }
};

// Update purchase order status
export const updatePurchaseOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, invoiceNumber, invoiceDate, paymentStatus, deliveryNotes } = req.body;

    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    purchaseOrder.status = status;
    
    // Update dates based on status
    if (status === 'sent' && !purchaseOrder.sentDate) {
      purchaseOrder.sentDate = new Date();
    }
    if (status === 'received') {
      purchaseOrder.receivedDate = new Date();
      purchaseOrder.receivedBy = req.user.id;
      
      // 🔄 INTEGRATED STOCK: Automatically increase stock with relationships
      const receivedItems = purchaseOrder.items.map(item => ({
        productId: item.product,
        receivedQuantity: item.quantity
      }));
      await StockRelationshipService.handlePurchaseOrderReceived(purchaseOrder._id, receivedItems, req.user.id);
      
      // Backward compatibility
      await autoStock.handlePurchaseReceived(purchaseOrder, req.user.id);
    }
    
    // Update invoice and payment info if provided
    if (invoiceNumber) purchaseOrder.invoiceNumber = invoiceNumber;
    if (invoiceDate) purchaseOrder.invoiceDate = invoiceDate;
    if (paymentStatus) {
      purchaseOrder.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid') {
        purchaseOrder.paymentDate = new Date();
      }
    }
    if (deliveryNotes) purchaseOrder.deliveryNotes = deliveryNotes;

    await purchaseOrder.save();
    res.json(purchaseOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Receive purchase order (update stock)
export const receivePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedItems } = req.body;

    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    // Update stock for received items
    for (const item of receivedItems) {
      const product = await Product.findById(item.productId);
      if (product) {
        const oldStock = product.stock;
        product.stock += item.receivedQuantity;
        await product.save();

        // Log stock change
        await StockLog.create({
          product: item.productId,
          type: 'purchase',
          quantity: item.receivedQuantity,
          previousStock: oldStock,
          newStock: product.stock,
          reference: `PO-${purchaseOrder.poNumber}`,
          performedBy: req.user.id
        });
      }
    }

    purchaseOrder.status = 'received';
    purchaseOrder.receivedDate = new Date();
    await purchaseOrder.save();

    res.json({ 
      message: 'Purchase order received successfully - Stock updated automatically',
      autoStockUpdate: true
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Send PO to supplier
export const sendPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const purchaseOrder = await PurchaseOrder.findById(id).populate('supplier');
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    purchaseOrder.status = 'sent';
    purchaseOrder.sentDate = new Date();
    await purchaseOrder.save();

    // Send email to supplier
    await emailService.sendPOToSupplier(purchaseOrder, purchaseOrder.supplier);

    res.json({ 
      message: `Purchase order sent to ${purchaseOrder.supplier.name}`, 
      purchaseOrder,
      supplierContact: {
        name: purchaseOrder.supplier.name,
        email: purchaseOrder.supplier.email,
        phone: purchaseOrder.supplier.phone
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Supplier confirms PO (external API for suppliers)
export const confirmPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { estimatedDelivery, supplierNotes } = req.body;
    
    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (purchaseOrder.status !== 'sent') {
      return res.status(400).json({ message: 'PO must be in sent status to confirm' });
    }

    purchaseOrder.status = 'confirmed';
    purchaseOrder.confirmedDate = new Date();
    purchaseOrder.supplierConfirmation = {
      confirmedAt: new Date(),
      estimatedDelivery: estimatedDelivery || null,
      supplierNotes: supplierNotes || '',
      confirmed: true
    };

    await purchaseOrder.save();
    
    // Notify admin of confirmation
    await emailService.notifyAdminOfConfirmation(purchaseOrder, { name: 'Supplier' });
    
    res.json({ message: 'Purchase order confirmed by supplier', purchaseOrder });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Supplier ships items
export const shipPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber, carrier, estimatedArrival } = req.body;
    
    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (purchaseOrder.status !== 'confirmed') {
      return res.status(400).json({ message: 'PO must be confirmed before shipping' });
    }

    purchaseOrder.status = 'shipped';
    purchaseOrder.shippedDate = new Date();
    purchaseOrder.shippingInfo = {
      shippedAt: new Date(),
      trackingNumber: trackingNumber || '',
      carrier: carrier || '',
      estimatedArrival: estimatedArrival || null
    };

    await purchaseOrder.save();
    
    // Notify admin of shipment
    await emailService.notifyAdminOfShipment(purchaseOrder, { name: 'Supplier' });
    
    res.json({ message: 'Purchase order marked as shipped', purchaseOrder });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const purchaseOrder = await PurchaseOrder.findById(id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (purchaseOrder.status === 'received') {
      return res.status(400).json({ message: 'Cannot delete received purchase order' });
    }

    await PurchaseOrder.findByIdAndDelete(id);
    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};