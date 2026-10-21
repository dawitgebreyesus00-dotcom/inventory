import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, index: true },
    description: { type: String, default: '' },
    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    images: [{ type: String }],
    barcode: { type: String, unique: true, sparse: true },
    stock: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default model('Product', ProductSchema);
