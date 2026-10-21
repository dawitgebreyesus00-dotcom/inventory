# Inventory System Constraints & Relationships

## 🔗 **Component Relationships & Constraints**

### **📦 PRODUCTS**
**Dependencies:**
- `category` → Categories (optional reference)
- `supplier` → Suppliers (optional reference)

**Constraints:**
- ❌ Cannot delete if active Purchase Orders exist
- ❌ Cannot set negative stock directly (use Stock Adjustments)
- ✅ Can exist without category/supplier
- ⚠️ Deletion requires checking PO references

**Validation Rules:**
```javascript
// Before Product Deletion
- Check: activePurchaseOrders.count > 0 → BLOCK
- Check: recentStockAdjustments → WARN
```

---

### **📂 CATEGORIES**
**Dependencies:**
- None (independent entity)

**Constraints:**
- ❌ Cannot delete if products are using this category
- ✅ Can be created/updated freely
- ⚠️ Deletion cascades to products (sets category = null)

**Validation Rules:**
```javascript
// Before Category Deletion
- Check: products.count > 0 → BLOCK
- Option: Reassign products to another category
```

---

### **🏪 SUPPLIERS**
**Dependencies:**
- None (independent entity)

**Constraints:**
- ❌ Cannot delete if products are linked
- ❌ Cannot delete if active Purchase Orders exist
- ✅ Can be created/updated freely

**Validation Rules:**
```javascript
// Before Supplier Deletion
- Check: linkedProducts.count > 0 → BLOCK
- Check: activePurchaseOrders.count > 0 → BLOCK
```

---

### **🛒 PURCHASE ORDERS**
**Dependencies:**
- `supplier` → Suppliers (required reference)
- `items.product` → Products (required reference)
- `createdBy` → Users (required reference)

**Constraints:**
- ✅ Supplier must exist
- ✅ All products must exist
- ❌ Cannot modify items after status = 'received'
- ❌ Quantities must be > 0
- ❌ Unit costs cannot be negative
- ⚠️ Large cost variations trigger warnings

**Validation Rules:**
```javascript
// Before PO Creation
- Validate: supplier.exists → REQUIRED
- Validate: items.product.exists → REQUIRED
- Validate: items.quantity > 0 → REQUIRED
- Validate: items.unitCost >= 0 → REQUIRED

// Before PO Update
- Check: status === 'received' → BLOCK item changes
```

**Status Flow Constraints:**
```
draft → sent → received ✅
draft → cancelled ✅
sent → cancelled ✅
received → [IMMUTABLE] ❌
```

---

### **📊 STOCK ADJUSTMENTS**
**Dependencies:**
- `product` → Products (required reference)
- `performedBy` → Users (required reference)

**Constraints:**
- ✅ Product must exist
- ❌ Cannot result in negative stock
- ⚠️ Large adjustments (>50% of stock) trigger warnings
- ✅ Must provide valid reason
- ✅ Automatically updates product stock

**Validation Rules:**
```javascript
// Before Stock Adjustment
- Validate: product.exists → REQUIRED
- Calculate: newStock = currentStock + adjustment
- Validate: newStock >= 0 → REQUIRED
- Warn: |adjustment| > (currentStock * 0.5) → WARNING
```

**Adjustment Types & Logic:**
```javascript
adjustment: newStock = quantity (direct set)
damage/loss/expired: newStock = current - |quantity|
found/returned: newStock = current + |quantity|
transfer: newStock = current + quantity (can be +/-)
```

---

### **👥 USERS**
**Dependencies:**
- None (independent entity)

**Constraints:**
- ❌ Cannot delete if they created Purchase Orders
- ❌ Cannot delete if they performed Stock Adjustments
- ✅ Can deactivate instead of delete

---

## 🔄 **Cross-System Constraints**

### **Stock Consistency Rules:**
1. **Product.stock** = Latest StockAdjustment.newStock
2. **Purchase Order receipt** → Auto Stock Adjustment
3. **Sales Order** → Auto Stock Reduction
4. **Stock cannot go negative** through any operation

### **Deletion Cascade Rules:**
```
Category Delete → Products.category = null
Supplier Delete → Products.supplier = null (if no active POs)
Product Delete → Block if active POs exist
User Delete → Block if has PO/Adjustment history
```

### **Business Logic Constraints:**
1. **Reorder Point**: When stock ≤ lowStockThreshold → Trigger PO suggestion
2. **Cost Validation**: PO unit costs vs product prices (variance warnings)
3. **Audit Trail**: All stock changes must be traceable
4. **Approval Workflow**: Large adjustments may require approval

---

## ⚠️ **Constraint Violation Handling**

### **Error Types:**
- `PRODUCT_NOT_FOUND` - Referenced product doesn't exist
- `SUPPLIER_NOT_FOUND` - Referenced supplier doesn't exist
- `ACTIVE_PURCHASE_ORDERS` - Cannot delete due to active POs
- `PRODUCTS_EXIST` - Cannot delete category with products
- `NEGATIVE_STOCK_NOT_ALLOWED` - Stock cannot be negative
- `PO_ALREADY_RECEIVED` - Cannot modify received PO
- `INVALID_QUANTITY` - Quantity must be positive
- `LARGE_ADJUSTMENT_WARNING` - Adjustment >50% of stock

### **Response Format:**
```json
{
  "message": "Human readable error",
  "constraint": "ERROR_CODE",
  "details": {
    "currentValue": "...",
    "proposedValue": "...",
    "references": ["PO001", "PO002"]
  }
}
```

---

## 🎯 **Best Practices**

1. **Always validate references** before creating relationships
2. **Use soft deletes** for entities with historical data
3. **Implement warnings** for potentially problematic operations
4. **Maintain audit trails** for all stock changes
5. **Batch operations** should be atomic (all succeed or all fail)
6. **Real-time validation** in UI to prevent constraint violations
7. **Graceful degradation** when references are missing

---

## 🔍 **Monitoring & Alerts**

### **System Health Checks:**
- Stock consistency validation
- Orphaned reference detection
- Large adjustment monitoring
- Cost variance tracking
- Performance impact of constraints

### **Automated Alerts:**
- Negative stock attempts
- Large stock adjustments
- Failed constraint validations
- System inconsistencies detected