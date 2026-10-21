import mongoose from 'mongoose';

const salesOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  shippedDate: Date,
  deliveredDate: Date,
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Auto-generate order number
salesOrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('SalesOrder').countDocuments();
    this.orderNumber = `SO${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model('SalesOrder', salesOrderSchema);