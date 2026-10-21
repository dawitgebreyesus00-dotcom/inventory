import Product from './models/Product.js';
import connectDB from './db/connection.js';

const generateImageUrl = (productName) => {
  // Clean product name for search
  const searchTerm = productName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '+'); // Replace spaces with +
  
  // Use Unsplash API for high-quality tool images
  return `https://source.unsplash.com/400x300/?${searchTerm}+tool`;
};

const addImagesToProducts = async () => {
  try {
    await connectDB();
    console.log('Connected to database...');

    // Get all products without images
    const products = await Product.find({
      $or: [
        { images: { $exists: false } },
        { images: { $size: 0 } },
        { images: null }
      ]
    });

    console.log(`Found ${products.length} products without images`);

    for (const product of products) {
      const imageUrl = generateImageUrl(product.name);
      
      await Product.findByIdAndUpdate(product._id, {
        images: [imageUrl]
      });
      
      console.log(`✅ Added image to: ${product.name}`);
    }

    console.log('✨ All product images added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding images:', error);
    process.exit(1);
  }
};

addImagesToProducts();