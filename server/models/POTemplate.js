import mongoose from 'mongoose';

const poTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
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
    }
  }],
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUsed: Date,
  useCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('POTemplate', poTemplateSchema);