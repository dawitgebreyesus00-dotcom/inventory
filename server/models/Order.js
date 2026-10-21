import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1, min: [1, 'Quantity must be at least 1'] },
    price: { type: Number, required: true }
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: Number, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [OrderItemSchema],
    status: { type: String, enum: ['pending', 'processing', 'shipped', 'completed', 'cancelled'], default: 'pending' },
    total: { type: Number, default: 0 },
    shippingAddress: { type: String },
    placedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

OrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const lastOrder = await this.constructor.findOne({}, {}, { sort: { orderNumber: -1 } });
    this.orderNumber = (lastOrder?.orderNumber || 1000) + 1;
  }
  next();
});

export default model('Order', OrderSchema);
