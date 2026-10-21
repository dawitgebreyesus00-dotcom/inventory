import mongoose from 'mongoose';

const stockCountSchema = new mongoose.Schema({
  countNumber: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'annual', 'spot_check'],
    required: true
  },
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'cancelled'],
    default: 'planned'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  startedDate: Date,
  completedDate: Date,
  countedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    systemStock: {
      type: Number,
      required: true
    },
    physicalCount: {
      type: Number,
      required: true
    },
    variance: {
      type: Number,
      required: true
    },
    notes: String
  }],
  totalVariance: {
    type: Number,
    default: 0
  },
  notes: String
}, {
  timestamps: true
});

// Auto-generate count number
stockCountSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('StockCount').countDocuments();
    this.countNumber = `SC${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model('StockCount', stockCountSchema);