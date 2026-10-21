import mongoose from 'mongoose';

const stockAdjustmentSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  type: {
    type: String,
    enum: [
      'adjustment', 'damage', 'loss', 'found', 'cycle_count', 'transfer', 'expired', 'returned',
      'purchase_received', 'sale_completed', 'customer_return', 'physical_count'
    ],
    required: true
  },
  adjustmentQuantity: {
    type: Number,
    required: true
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  reference: {
    type: String,
    unique: true
  },
  location: {
    type: String,
    default: 'Main Warehouse'
  },
  costImpact: {
    type: Number,
    default: 0
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  batchNumber: {
    type: String
  },
  expiryDate: {
    type: Date
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  // Relationship tracking
  isAutomatic: {
    type: Boolean,
    default: false
  },
  relatedDocument: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedDocumentType'
  },
  relatedDocumentType: {
    type: String,
    enum: ['Order', 'PurchaseOrder', 'Return', 'Transfer']
  }
}, {
  timestamps: true
});

// Generate reference number
stockAdjustmentSchema.pre('save', function(next) {
  if (!this.reference) {
    const typePrefix = {
      adjustment: 'ADJ',
      damage: 'DMG',
      loss: 'LOSS',
      found: 'FOUND',
      cycle_count: 'CC',
      transfer: 'TRF',
      expired: 'EXP',
      returned: 'RET',
      purchase_received: 'PO',
      sale_completed: 'SALE',
      customer_return: 'RTN',
      physical_count: 'PC'
    };
    this.reference = `${typePrefix[this.type] || 'ADJ'}-${Date.now()}`;
  }
  next();
});

export default mongoose.model('StockAdjustment', stockAdjustmentSchema);