import Product from './models/Product.js';
import connectDB from './db/connection.js';

const checkProductImages = async () => {
  try {
    await connectDB();
    const products = await Product.find({});
    
    console.log('📦 Product Images Status:');
    products.forEach(p => {
      console.log(`${p.name}: ${p.images ? p.images[0] : 'NO IMAGE'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkProductImages();