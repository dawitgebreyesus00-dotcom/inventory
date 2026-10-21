import bcrypt from 'bcrypt';
import User from './models/User.js';
import Product from './models/Product.js';
import Category from './models/Category.js';
import connectDB from './db/connection.js';

const USERS = [
  { name: 'Admin', email: 'admin@gmail.com', password: 'admin', role: 'admin', address: 'Admin address' },
  { name: 'Dawit Admin', email: 'dawit@gmail.com', password: 'admin', role: 'admin', address: 'Admin Dawit' },
  { name: 'Dawit Admin Alias', email: 'dawit@gamil.com', password: 'admin', role: 'admin', address: 'Admin Dawit Alias' },
  { name: 'User One', email: 'one@gmail.com', password: 'one', role: 'customer', address: 'Customer One' },
  { name: 'User Two', email: 'two@gmail.com', password: 'two', role: 'customer', address: 'Customer Two' },
  { name: 'User Three', email: 'three@gmail.com', password: 'three', role: 'customer', address: 'Customer Three' },
  { name: 'User Four', email: 'four@gmail.com', password: 'four', role: 'customer', address: 'Customer Four' },
];

const CATEGORIES = [
  { name: 'Electronics', description: 'Electronic devices and accessories' },
  { name: 'Clothing', description: 'Apparel and fashion items' },
  { name: 'Books', description: 'Books and educational materials' },
  { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
];

const PRODUCTS = [
  { name: 'Laptop', sku: 'LAP001', description: 'High-performance laptop', price: 999.99, quantity: 10 },
  { name: 'Smartphone', sku: 'PHN001', description: 'Latest smartphone model', price: 699.99, quantity: 25 },
  { name: 'T-Shirt', sku: 'TSH001', description: 'Cotton t-shirt', price: 19.99, quantity: 50 },
  { name: 'Jeans', sku: 'JNS001', description: 'Denim jeans', price: 49.99, quantity: 30 },
  { name: 'Programming Book', sku: 'BK001', description: 'Learn programming', price: 39.99, quantity: 15 },
  { name: 'Garden Tools', sku: 'GT001', description: 'Basic garden tool set', price: 79.99, quantity: 8 },
];

const register = async () => {
  try {
    await connectDB();

    for (const u of USERS) {
      const existing = await User.findOne({ email: u.email });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        await User.create({
          name: u.name,
          email: u.email,
          password: hashedPassword,
          address: u.address,
          role: u.role,
        });
        console.log(`Seeded user ${u.email}`);
      }
    }

    // Seed categories
    for (const cat of CATEGORIES) {
      const existing = await Category.findOne({ name: cat.name });
      if (!existing) {
        await Category.create(cat);
        console.log(`Seeded category ${cat.name}`);
      }
    }

    // Seed products
    const electronics = await Category.findOne({ name: 'Electronics' });
    const clothing = await Category.findOne({ name: 'Clothing' });
    const books = await Category.findOne({ name: 'Books' });
    const homeGarden = await Category.findOne({ name: 'Home & Garden' });

    const productsWithCategories = [
      { ...PRODUCTS[0], category: electronics?._id },
      { ...PRODUCTS[1], category: electronics?._id },
      { ...PRODUCTS[2], category: clothing?._id },
      { ...PRODUCTS[3], category: clothing?._id },
      { ...PRODUCTS[4], category: books?._id },
      { ...PRODUCTS[5], category: homeGarden?._id },
    ];

    for (const prod of productsWithCategories) {
      const existing = await Product.findOne({ sku: prod.sku });
      if (!existing) {
        await Product.create(prod);
        console.log(`Seeded product ${prod.name}`);
      }
    }

    console.log('Seeding complete.');
  } catch (error) {
    console.error('Error during seeding:', error);
  }
};

register();
