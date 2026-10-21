import connectDB from './db/connection.js';
import Product from './models/Product.js';
import Category from './models/Category.js';

async function verifyAllStock() {
  try {
    await connectDB();
    
    console.log('=== CHECKING ALL PRODUCT STOCK VALUES ===\n');
    
    const products = await Product.find({}).populate('category', 'name');
    
    if (products.length === 0) {
      console.log('❌ No products found in database');
      return;
    }
    
    console.log('Database Stock vs Products Page Check:\n');
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Category: ${product.category?.name || 'No Category'}`);
      console.log(`   SKU: ${product.sku || 'No SKU'}`);
      console.log(`   Database Stock: ${product.stock}`);
      console.log(`   Price: $${product.price || 0}`);
      console.log(`   Status: ${product.stock >= 0 ? '✅ Valid' : '❌ Invalid (negative stock)'}`);
      console.log('');
    });
    
    console.log('=== SUMMARY ===');
    console.log(`Total Products: ${products.length}`);
    console.log(`Products with Stock > 0: ${products.filter(p => p.stock > 0).length}`);
    console.log(`Products with Zero Stock: ${products.filter(p => p.stock === 0).length}`);
    console.log(`Products with Negative Stock: ${products.filter(p => p.stock < 0).length}`);
    
    console.log('\n=== ACTION REQUIRED ===');
    console.log('1. Check your Products page in the browser');
    console.log('2. Compare the stock numbers shown above with what you see');
    console.log('3. If they don\'t match, there may be a frontend caching issue');
    console.log('4. Try refreshing your browser (Ctrl+F5 or Cmd+Shift+R)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyAllStock();