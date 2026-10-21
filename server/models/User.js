import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    address: { type: String },
    role: { type: String, enum: ["admin", "manager", "viewer", "customer"], default: "customer" },
    refreshToken: { type: String },
    profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }
}, { timestamps: true })

const User = mongoose.model("User", userSchema);
export default User;                                  