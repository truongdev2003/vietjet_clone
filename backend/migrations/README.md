# Fix Payment Duplicate Key Error

## 🐛 Problem

**Error:**
```
E11000 duplicate key error collection: vietjet_clone.payments 
index: transactions.id_1 dup key: { transactions.id: null }
```

**Root Cause:**
- Payment schema has `transactions` array with `id` field marked as `unique: true`
- When creating payment without transactions, MongoDB creates null values
- Multiple null values violate unique constraint

---

## ✅ Solutions Applied

### 1. **Added `sparse: true` to transactions.id index**

**File:** `backend/models/Payment.js`

```javascript
// ❌ Before
const transactionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true  // ← This causes error with null values
  },

// ✅ After
const transactionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    sparse: true  // ← Allow multiple null values
  },
```

**What is sparse index?**
- Only indexes documents that have the indexed field
- Allows multiple documents with missing/null field
- Perfect for array subdocuments

---

### 2. **Added UUID to OrderId for better uniqueness**

**File:** `backend/services/paymentGatewayService.js`

```javascript
// ❌ Before - Can have collision if multiple requests at same time
const orderId = `VJ_${bookingId}_${Date.now()}`;

// ✅ After - UUID ensures uniqueness
const { v4: uuidv4 } = require('uuid');
const orderId = `VJ_${bookingId}_${Date.now()}_${uuidv4().slice(0, 8)}`;
```

**Example OrderIds:**
- Old: `VJ_68ea2ee72186656c2ecfca65_1760177896356`
- New: `VJ_68ea2ee72186656c2ecfca65_1760177896356_a1b2c3d4`

---

### 3. **Created Migration Script**

**File:** `backend/migrations/fixPaymentTransactionsIndex.js`

This script:
1. ✅ Drops old `transactions.id_1` index
2. ✅ Creates new `transactions.id_1_sparse` index with sparse option
3. ✅ Verifies the changes

---

## 🚀 How to Fix

### Step 1: Stop the server
```bash
# In backend terminal
Ctrl + C
```

### Step 2: Run migration script
```bash
npm run migrate:payment-index
```

**Expected Output:**
```
🔄 Connecting to MongoDB...
✅ Connected to MongoDB

📋 Current indexes:
[...]

🗑️  Dropping transactions.id_1 index...
✅ Successfully dropped transactions.id_1 index

🔧 Creating new sparse unique index on transactions.id...
✅ Successfully created sparse unique index

📋 Updated indexes:
[...]

📊 Total payments: 5
📊 Payments with empty transactions: 5

✅ Migration completed successfully!
```

### Step 3: Restart server
```bash
npm run dev
```

### Step 4: Test booking flow
1. Create a new booking
2. Proceed to payment
3. ✅ Should work without duplicate key error

---

## 🔍 Verify the Fix

### Check MongoDB Indexes:
```javascript
// In MongoDB shell or Compass
db.payments.getIndexes()
```

**Should see:**
```json
{
  "name": "transactions.id_1_sparse",
  "key": { "transactions.id": 1 },
  "unique": true,
  "sparse": true
}
```

### Test Multiple Bookings:
```bash
# Create 3 bookings in quick succession
curl -X POST http://localhost:5000/api/bookings ...
curl -X POST http://localhost:5000/api/bookings ...
curl -X POST http://localhost:5000/api/bookings ...
```

**Result:** ✅ All should succeed

---

## 📝 Technical Details

### Why This Happens

1. **Payment Creation:**
```javascript
await Payment.create({
  booking: bookingId,
  paymentReference: orderId,
  // ... other fields
  // ❌ No transactions array - defaults to []
});
```

2. **MongoDB Index Behavior:**
- Non-sparse unique index: `null` values must be unique
- Sparse unique index: Only non-null values must be unique

3. **Array Subdocuments:**
- Empty array `[]` doesn't have `transactions.id` field
- MongoDB treats it as `null` for indexing
- Multiple nulls → Duplicate key error

### Prevention

✅ **Always use `sparse: true` for unique indexes on:**
- Array subdocument fields
- Optional fields
- Fields that may be null/undefined

❌ **Don't use sparse for:**
- Required unique fields (like email, username)
- Top-level document IDs

---

## 🎯 Alternative Solutions (Not Used)

### Option 1: Remove unique constraint
```javascript
// Remove unique from transactions.id
id: {
  type: String,
  required: true,
  // unique: true  // ← Remove this
}
```
**Downside:** Can have duplicate transaction IDs

### Option 2: Always create with transaction
```javascript
await Payment.create({
  // ... other fields
  transactions: [{
    id: uuidv4(),
    // ... transaction details
  }]
});
```
**Downside:** Complex logic, transaction may not exist yet

### Option 3: Use different field name
```javascript
transactionId: {  // Rename from 'id'
  type: String,
  unique: true,
  sparse: true
}
```
**Downside:** Schema changes, migration complexity

---

## 🔧 Troubleshooting

### If migration fails:

**Error: "Index already exists with different options"**
```bash
# Manually drop index in MongoDB shell
use vietjet_clone
db.payments.dropIndex("transactions.id_1")

# Then run migration again
npm run migrate:payment-index
```

**Error: "Cannot connect to MongoDB"**
```bash
# Check .env file has correct MONGODB_URI
# Check MongoDB is running
```

### If still getting duplicate key error:

1. **Clear all payments:**
```javascript
// In MongoDB shell (CAREFUL - DELETES DATA!)
db.payments.deleteMany({})
```

2. **Restart server:**
```bash
npm run dev
```

3. **Try booking again**

---

## ✅ Verification Checklist

- [ ] Migration script ran successfully
- [ ] Server starts without errors
- [ ] Can create multiple bookings
- [ ] Payment records created successfully
- [ ] MoMo redirect works
- [ ] No duplicate key errors in logs

---

**Fixed by:** GitHub Copilot  
**Date:** October 11, 2025  
**Time:** 10:15 AM
