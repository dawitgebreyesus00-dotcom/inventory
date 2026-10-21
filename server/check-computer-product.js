import connectDB from './db/connection.js';
import Product from './models/Product.js';
import Category from './models/Category.js';

async function checkComputerProduct() {
  try {
    await connectDB();
    
    // Check if Computer product exists
    const computer = await Product.findOne({ name: 'Computer' });
    
    if (computer) {
      console.log(`✅ Computer product exists with stock: ${computer.stock}`);
      
      // Update to 65 if needed
      if (computer.stock !== 65) {
        await Product.findByIdAndUpdate(computer._id, { stock: 65 });
        console.log('✅ Updated Computer stock to 65');
      }
    } else {
      console.log('❌ Computer product not found');
      console.log('Creating Computer product...');
      
      // Find Electronics category
      let electronics = await Category.findOne({ name: /electronics/i });
      if (!electronics) {
        electronics = await Category.create({
          name: 'Electronics',
          description: 'Electronic devices and gadgets'
        });
        console.log('✅ Created Electronics category');
      }
      
      // Create Computer product
      const newComputer = await Product.create({
        name: 'Computer',
        description: 'Desktop Computer',
        price: 999.99,
        stock: 65,
        category: electronics._id,
        sku: 'COMP-001'
      });
      
      console.log('✅ Created Computer product with stock: 65');
    }
    
    // List all products
    const allProducts = await Product.find({}, 'name stock');
    console.log('\n=== ALL PRODUCTS ===');
    allProducts.forEach(p => {
      console.log(`${p.name}: ${p.stock} units`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkComputerProduct();