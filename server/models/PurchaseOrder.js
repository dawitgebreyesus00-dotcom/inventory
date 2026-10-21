import mongoose from 'mongoose';
import Counter from './Counter.js';

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    unique: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0
    },
    totalCost: {
      type: Number,
      required: true
    },
    receivedQuantity: {
      type: Number,
      default: 0
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'sent', 'confirmed', 'shipped', 'received', 'cancelled'],
    default: 'draft'
  },
  supplierConfirmation: {
    confirmedAt: Date,
    estimatedDelivery: Date,
    supplierNotes: String,
    confirmed: { type: Boolean, default: false }
  },
  shippingInfo: {
    shippedAt: Date,
    trackingNumber: String,
    carrier: String,
    estimatedArrival: Date
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDate: Date,
  receivedDate: Date,
  sentDate: Date,
  confirmedDate: Date,
  shippedDate: Date,
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  notes: String,
  deliveryNotes: String,
  invoiceNumber: String,
  invoiceDate: Date,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },
  paymentDate: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Auto-generate PO number
purchaseOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.poNumber) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'purchaseOrder',
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );
      this.poNumber = `PO${String(counter.sequence).padStart(6, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);