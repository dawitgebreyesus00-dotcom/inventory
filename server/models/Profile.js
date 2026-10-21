import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const ProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String },
    photo: { type: String },
    phone: { type: String },
    address: { type: String }
  },
  { timestamps: true }
);

export default model('Profile', ProfileSchema);
