import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Supplier from '../models/Supplier.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import StockAdjustment from '../models/StockAdjustment.js';

// Constraint validation middleware
export const validateConstraints = {
  
  // Product constraints
  product: {
    // Cannot delete product if it has active purchase orders
    async beforeDelete(req, res, next) {
      try {
        const productId = req.params.id;
        
        // Check active purchase orders
        const activePOs = await PurchaseOrder.find({
          'items.product': productId,
          status: { $in: ['draft', 'sent'] }
        });
        
        if (activePOs.length > 0) {
          return res.status(400).json({
            message: `Cannot delete product. It has ${activePOs.length} active purchase order(s).`,
            constraint: 'ACTIVE_PURCHASE_ORDERS',
            references: activePOs.map(po => po.poNumber)
          });
        }
        
        next();
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    },

    // Cannot set negative stock
    async beforeUpdate(req, res, next) {
      try {
        if (req.body.stock !== undefined && req.body.stock < 0) {
          return res.status(400).json({
            message: 'Stock cannot be negative. Use Stock Adjustments for corrections.',
            constraint: 'NEGATIVE_STOCK_NOT_ALLOWED'
          });
        }
        next();
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  },

  // Category constraints
  category: {
    // Cannot delete category if products exist
    async beforeDelete(req, res, next) {
      try {
        const categoryId = req.params.id;
        const productCount = await Product.countDocuments({ category: categoryId });
        
        if (productCount > 0) {
          return res.status(400).json({
            message: `Cannot delete category. ${productCount} product(s) are using this category.`,
            constraint: 'PRODUCTS_EXIST',
            productCount
          });
        }
        
        next();
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  },

  // Supplier constraints
  supplier: {
    // Cannot delete supplier if they have products or active POs
    async beforeDelete(req, res, next) {
      try {
        const supplierId = req.params.id;
        
        const [productCount, activePOs] = await Promise.all([
          Product.countDocuments({ supplier: supplierId }),
          PurchaseOrder.find({
            supplier: supplierId,
            status: { $in: ['draft', 'sent'] }
          })
        ]);
        
        if (productCount > 0) {
          return res.status(400).json({
            message: `Cannot delete supplier. ${productCount} product(s) are linked to this supplier.`,
            constraint: 'PRODUCTS_LINKED',
            productCount
          });
        }
        
        if (activePOs.length > 0) {
          return res.status(400).json({
            message: `Cannot delete supplier. ${activePOs.length} active purchase order(s) exist.`,
            constraint: 'ACTIVE_PURCHASE_ORDERS',
            references: activePOs.map(po => po.poNumber)
          });
        }
        
        next();
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  },

  // Purchase Order constraints
  purchaseOrder: {
    // Validate items exist and have valid quantities
    async beforeCreate(req, res, next) {
      try {
        const { items, supplier } = req.body;
        
        // Validate supplier exists
        const supplierExists = await Supplier.findById(supplier);
        if (!supplierExists) {
          return res.status(400).json({
            message: 'Supplier not found',
            constraint: 'SUPPLIER_NOT_FOUND'
          });
        }
        
        // Validate all products exist
        for (const item of items) {
          const product = await Product.findById(item.product);
          if (!product) {
            return res.status(400).json({
              message: `Product not found: ${item.product}`,
              constraint: 'PRODUCT_NOT_FOUND'
            });
          }
          
          if (item.quantity <= 0) {
            return res.status(400).json({
              message: `Invalid quantity for ${product.name}. Must be greater than 0.`,
              constraint: 'INVALID_QUANTITY'
            });
          }
          
          if (item.unitCost < 0) {
            return res.status(400).json({
              message: `Invalid unit cost for ${product.name}. Cannot be negative.`,
              constraint: 'INVALID_UNIT_COST'
            });
          }
        }
        
        next();
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    },

    // Cannot modify received purchase orders
    async beforeUpdate(req, res, next) {
      try {
        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) {
          return res.status(404).json({ message: 'Purchase order not found' });
        }
        
        if (po.status === 'received' && req.body.items) {
          return res.status(400).json({
            message: 'Cannot modify items of received purchase order',
            constraint: 'PO_ALREADY_RECEIVED'
          });
        }
        
        next();
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  },

  // Stock Adjustment constraints
  stockAdjustment: {
    // Validate product exists and adjustment is reasonable
    async beforeCreate(req, res, next) {
      try {
        const { productId, quantity, type } = req.body;
        
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(400).json({
            message: 'Product not found',
            constraint: 'PRODUCT_NOT_FOUND'
          });
        }
        
        // Validate adjustment won't result in negative stock
        let newStock;
        switch (type) {
          case 'adjustment':
            newStock = quantity;
            break;
          case 'damage':
          case 'loss':
          case 'expired':
            newStock = product.stock - Math.abs(quantity);
            break;
          case 'found':
          case 'returned':
            newStock = product.stock + Math.abs(quantity);
            break;
          default:
            newStock = product.stock + quantity;
        }
        
        if (newStock < 0) {
          return res.status(400).json({
            message: `Adjustment would result in negative stock. Current: ${product.stock}, Proposed: ${newStock}`,
            constraint: 'NEGATIVE_STOCK_RESULT',
            currentStock: product.stock,
            proposedStock: newStock
          });
        }
        
        // Warn for large adjustments (>50% of current stock)
        const adjustmentAmount = Math.abs(newStock - product.stock);
        if (product.stock > 0 && adjustmentAmount > (product.stock * 0.5)) {
          req.largeAdjustmentWarning = {
            message: `Large adjustment detected: ${adjustmentAmount} units (${((adjustmentAmount/product.stock)*100).toFixed(1)}% of current stock)`,
            currentStock: product.stock,
            adjustmentAmount,
            percentage: ((adjustmentAmount/product.stock)*100).toFixed(1)
          };
        }
        
        next();
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  }
};

// Cross-system constraint checks
export const systemConstraints = {
  
  // Check if product can be safely deleted
  async canDeleteProduct(productId) {
    const [activePOs, recentAdjustments, activeOrders] = await Promise.all([
      PurchaseOrder.countDocuments({
        'items.product': productId,
        status: { $in: ['draft', 'sent'] }
      }),
      StockAdjustment.countDocuments({
        product: productId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }),
      // Add order check if Order model exists
      0 // Placeholder
    ]);
    
    return {
      canDelete: activePOs === 0,
      constraints: {
        activePurchaseOrders: activePOs,
        recentAdjustments,
        activeOrders
      }
    };
  },

  // Check stock consistency across system
  async validateStockConsistency(productId) {
    const product = await Product.findById(productId);
    if (!product) return { valid: false, error: 'Product not found' };
    
    // Get recent stock movements
    const recentAdjustments = await StockAdjustment.find({
      product: productId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: -1 });
    
    // Calculate expected stock based on adjustments
    let calculatedStock = product.stock;
    for (const adj of recentAdjustments.reverse()) {
      calculatedStock = adj.previousStock + adj.adjustmentQuantity;
    }
    
    return {
      valid: calculatedStock === product.stock,
      currentStock: product.stock,
      calculatedStock,
      variance: product.stock - calculatedStock,
      recentAdjustments: recentAdjustments.length
    };
  }
};

// Middleware to log constraint violations
export const logConstraintViolation = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (res.statusCode >= 400 && typeof data === 'string') {
      try {
        const errorData = JSON.parse(data);
        if (errorData.constraint) {
          console.log(`CONSTRAINT VIOLATION: ${errorData.constraint}`, {
            user: req.user?.email,
            endpoint: req.originalUrl,
            method: req.method,
            constraint: errorData.constraint,
            timestamp: new Date().toISOString()
          });
        }
      } catch (e) {
        // Not JSON, ignore
      }
    }
    originalSend.call(this, data);
  };
  
  next();
};