// Simple email service (console logging for now, can be replaced with real email)
export const emailService = {
  
  // Send PO to supplier
  async sendPOToSupplier(purchaseOrder, supplier) {
    const emailContent = {
      to: supplier.email,
      subject: `New Purchase Order: ${purchaseOrder.poNumber}`,
      body: `
        Dear ${supplier.name},
        
        You have received a new purchase order: ${purchaseOrder.poNumber}
        Total Amount: $${purchaseOrder.totalAmount}
        Expected Date: ${purchaseOrder.expectedDate || 'Not specified'}
        
        Items:
        ${purchaseOrder.items.map(item => 
          `- ${item.product?.name}: ${item.quantity} units @ $${item.unitCost}`
        ).join('\n')}
        
        Please confirm this order at: http://localhost:3000/supplier-portal
        
        Best regards,
        Inventory Management System
      `
    };
    
    console.log('📧 EMAIL SENT TO SUPPLIER:');
    console.log(`To: ${emailContent.to}`);
    console.log(`Subject: ${emailContent.subject}`);
    console.log(`Body: ${emailContent.body}`);
    
    return { success: true, message: 'Email sent to supplier' };
  },

  // Notify admin of supplier confirmation
  async notifyAdminOfConfirmation(purchaseOrder, supplier) {
    const emailContent = {
      to: 'admin@gmail.com',
      subject: `PO Confirmed: ${purchaseOrder.poNumber}`,
      body: `
        Purchase Order ${purchaseOrder.poNumber} has been confirmed by ${supplier.name}.
        
        Estimated Delivery: ${purchaseOrder.supplierConfirmation?.estimatedDelivery || 'Not provided'}
        Supplier Notes: ${purchaseOrder.supplierConfirmation?.supplierNotes || 'None'}
        
        Total Amount: $${purchaseOrder.totalAmount}
      `
    };
    
    console.log('📧 EMAIL SENT TO ADMIN:');
    console.log(`Subject: ${emailContent.subject}`);
    console.log(`Body: ${emailContent.body}`);
    
    return { success: true, message: 'Admin notified' };
  },

  // Notify admin of shipment
  async notifyAdminOfShipment(purchaseOrder, supplier) {
    const emailContent = {
      to: 'admin@gmail.com',
      subject: `PO Shipped: ${purchaseOrder.poNumber}`,
      body: `
        Purchase Order ${purchaseOrder.poNumber} has been shipped by ${supplier.name}.
        
        Tracking Number: ${purchaseOrder.shippingInfo?.trackingNumber || 'Not provided'}
        Carrier: ${purchaseOrder.shippingInfo?.carrier || 'Not provided'}
        Estimated Arrival: ${purchaseOrder.shippingInfo?.estimatedArrival || 'Not provided'}
      `
    };
    
    console.log('📧 EMAIL SENT TO ADMIN:');
    console.log(`Subject: ${emailContent.subject}`);
    console.log(`Body: ${emailContent.body}`);
    
    return { success: true, message: 'Admin notified of shipment' };
  }
};