import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri =
      process.env.MONGO_URI ||
      process.env.MONGO_uri ||
      "mongodb://127.0.0.1:27017/inventory";
    if (!uri) throw new Error("Missing MONGO_URI environment variable");

    await mongoose.connect(uri);
    console.log("connection created successfully");
  } catch (error) {
    console.error("connection failed", error.message);
    process.exit(1);
  }
};

export default connectDB;