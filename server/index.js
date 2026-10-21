// -------------------------
// index.js
// -------------------------

import express from "express";
import cors from "cors";
import dotenv from "dotenv";                
import mongoose from "mongoose";            
import connectDB from "./db/connection.js"; 
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import path from "path";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import categoryRoutes from "./routes/categories.js";
import supplierRoutes from "./routes/suppliers.js";
import orderRoutes from "./routes/orders.js";
import userRoutes from "./routes/users.js";
import stockRoutes from "./routes/stock.js";
import purchaseOrderRoutes from "./routes/purchaseOrders.js";
import reportRoutes from "./routes/reports.js";
import stockAdjustmentRoutes from "./routes/stockAdjustments.js";
import stockRelationshipRoutes from "./routes/stockRelationships.js";
import barcodeRoutes from "./routes/barcodes.js";
import salesOrderRoutes from "./routes/salesOrders.js";
 
// -------------------------
// Load .env file
// -------------------------
dotenv.config();

// -------------------------
// Create Express app
// ---------------------- 
const app = express();

// -------------------------
// Middleware
// -------------------------
app.use(cors());
app.use(express.json());
 // Parse JSON body

// -------------------------
// Debug: Confirm environment variables (non-sensitive info only)
// -------------------------
console.log("PORT:", process.env.PORT);
console.log("Mongo URI:", process.env.MONGO_URI || "mongodb://127.0.0.1:27017/inventory");

// -------------------------
// Routes
// -------------------------
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/stock-adjustments", stockAdjustmentRoutes);
app.use("/api/stock-relationships", stockRelationshipRoutes);
app.use("/api/barcodes", barcodeRoutes);
app.use("/api/sales-orders", salesOrderRoutes);
 
// Root route for testing
app.get("/", (req, res) => {
  res.send("Welcome to the API!");
});

// Serve supplier portal
app.get("/supplier-portal", (req, res) => {
  res.sendFile(path.join(process.cwd(), 'supplier-portal.html'));
});

// Debug route to check auth
app.get("/api/debug/auth", (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  res.json({
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 20) + '...' : null,
    headers: req.headers
  });
});

// Debug route to check users
app.get("/api/debug/users", async (req, res) => {
  try {
    const users = await User.find({}, 'email role name');
    res.json({
      totalUsers: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// Start Server
// -------------------------
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Ensure default users exist (admins + customers)
    await ensureDefaultUsers();

    // Confirm DB connection
    console.log("Connected to DB:", mongoose.connection.name);

    // Start server after DB connection
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to DB or start server:", error);
    process.exit(1);
  }
};

// Call startServer
startServer();

// -------------------------
// Seed helper to ensure required users exist
// -------------------------
const DEFAULT_USERS = [
  { 
    name: 'System Administrator', 
    email: 'admin@inventory.com', 
    password: 'admin123', 
    role: 'admin', 
    address: 'Main Office - Admin Department'
  },
  { 
    name: 'Warehouse Manager', 
    email: 'manager@inventory.com', 
    password: 'manager123', 
    role: 'manager', 
    address: 'Warehouse Floor - Stock Control'
  },
  { 
    name: 'Stock Analyst', 
    email: 'viewer@inventory.com', 
    password: 'viewer123', 
    role: 'viewer', 
    address: 'Office - Reports Department'
  },
  { 
    name: 'Internal Staff', 
    email: 'staff@inventory.com', 
    password: 'staff123', 
    role: 'customer', 
    address: 'Internal Requisitions'
  },
  { 
    name: 'External Customer', 
    email: 'customer@example.com', 
    password: 'customer123', 
    role: 'customer', 
    address: 'External Customer Address'
  },
];

async function ensureDefaultUsers() {
  try {
    for (const u of DEFAULT_USERS) {
      const existing = await User.findOne({ email: u.email });
      if (!existing) {
        const hashed = await bcrypt.hash(u.password, 10);
        await User.create({
          name: u.name,
          email: u.email,
          password: hashed,
          address: u.address,
          role: u.role
        });
        console.log(`Created default user: ${u.email}`);
      }
    }
    console.log("Default users check completed.");
  } catch (error) {
    console.error("Failed to ensure default users:", error);
  }
}
