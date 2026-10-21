import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const testManager = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventory');
    console.log('Connected to MongoDB');

    // Check if manager exists
    const manager = await User.findOne({ email: 'manager@inventory.com' });
    
    if (!manager) {
      console.log('Manager not found, creating...');
      const hashedPassword = await bcrypt.hash('manager123', 10);
      const newManager = await User.create({
        name: 'Warehouse Manager',
        email: 'manager@inventory.com',
        password: hashedPassword,
        role: 'manager',
        address: 'Warehouse Floor - Stock Control'
      });
      console.log('Manager created:', newManager.email);
    } else {
      console.log('Manager found:', manager.email, 'Role:', manager.role);
      
      // Test password
      const isPasswordCorrect = await bcrypt.compare('manager123', manager.password);
      console.log('Password test:', isPasswordCorrect ? 'CORRECT' : 'INCORRECT');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

testManager();