import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const SupplierSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    contactName: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export default model('Supplier', SupplierSchema);
