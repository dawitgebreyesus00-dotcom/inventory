import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin';

let authToken = '';

// Login to get auth token
async function login() {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });
    
    const data = await response.json();
    if (data.success) {
      authToken = data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return false;
  }
}

// Get all stock adjustments
async function getStockAdjustments() {
  try {
    const response = await fetch(`${BASE_URL}/stock-adjustments`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('\n📊 STOCK ADJUSTMENTS:');
      console.log(`Total adjustments: ${data.data.pagination.total}`);
      
      if (data.data.adjustments.length > 0) {
        console.log('\nRecent adjustments:');
        data.data.adjustments.forEach((adj, index) => {
          console.log(`${index + 1}. ${adj.reference}`);
          console.log(`   Product: ${adj.product?.name || 'N/A'}`);
          console.log(`   Type: ${adj.type}`);
          console.log(`   Quantity Change: ${adj.adjustmentQuantity}`);
          console.log(`   Previous Stock: ${adj.previousStock}`);
          console.log(`   New Stock: ${adj.newStock}`);
          console.log(`   Reason: ${adj.reason}`);
          console.log(`   Cost Impact: $${adj.costImpact}`);
          console.log(`   Date: ${new Date(adj.createdAt).toLocaleString()}`);
          console.log(`   Performed By: ${adj.performedBy?.name || 'N/A'}`);
          console.log('   ---');
        });
      } else {
        console.log('No stock adjustments found');
      }
      
      if (data.data.summary.length > 0) {
        console.log('\n📈 SUMMARY BY TYPE:');
        data.data.summary.forEach(s => {
          console.log(`${s._id}: ${s.count} adjustments, Total Qty: ${s.totalQuantity}, Cost Impact: $${s.totalCostImpact}`);
        });
      }
    } else {
      console.log('❌ Failed to get adjustments:', data.message);
    }
  } catch (error) {
    console.log('❌ Error getting adjustments:', error.message);
  }
}

// Get adjustment statistics
async function getAdjustmentStats() {
  try {
    const response = await fetch(`${BASE_URL}/stock-adjustments/stats`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('\n📊 ADJUSTMENT STATISTICS:');
      console.log(`Total Adjustments: ${data.data.summary.totalAdjustments}`);
      console.log(`Total Cost Impact: $${data.data.summary.totalCostImpact}`);
      console.log(`Average Cost Impact: $${data.data.summary.avgCostImpact?.toFixed(2) || 0}`);
      
      if (data.data.byType.length > 0) {
        console.log('\nBy Type:');
        data.data.byType.forEach(type => {
          console.log(`  ${type._id}: ${type.count} adjustments, Total Cost: $${type.totalCost}`);
        });
      }
    } else {
      console.log('❌ Failed to get stats:', data.message);
    }
  } catch (error) {
    console.log('❌ Error getting stats:', error.message);
  }
}

// Main function
async function main() {
  console.log('🔍 Checking Stock Adjustments...\n');
  
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('Cannot proceed without authentication');
    return;
  }
  
  await getStockAdjustments();
  await getAdjustmentStats();
  
  console.log('\n✅ Stock adjustment check completed!');
}

main().catch(console.error);