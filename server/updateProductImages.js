import Product from './models/Product.js';
import connectDB from './db/connection.js';

// Curated high-quality images for each product type
const productImages = {
  'laptop': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop',
  'smartphone': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
  't-shirt': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop',
  'jeans': 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=300&fit=crop',
  'programming book': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop',
  'garden tools': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
  'book': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
  'tool': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop',
  'default': 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop'
};

const getImageForProduct = (productName) => {
  const name = productName.toLowerCase();
  
  // Find matching image or use default
  for (const [key, url] of Object.entries(productImages)) {
    if (name.includes(key)) {
      return url;
    }
  }
  
  return productImages.default;
};

const updateAllProductImages = async () => {
  try {
    await connectDB();
    console.log('🔗 Connected to database...');

    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products to update`);

    for (const product of products) {
      const imageUrl = getImageForProduct(product.name);
      
      await Product.findByIdAndUpdate(product._id, {
        images: [imageUrl]
      });
      
      console.log(`✅ ${product.name} → Updated with curated image`);
    }

    console.log('🎉 All products updated with high-quality images!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateAllProductImages();