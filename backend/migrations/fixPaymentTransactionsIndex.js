/**
 * Migration Script: Fix Payment Transactions Index
 * 
 * Issue: Duplicate key error on transactions.id when multiple payments have empty transactions array
 * Solution: Drop old unique index and create sparse unique index
 * 
 * Run: node backend/migrations/fixPaymentTransactionsIndex.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vietjet_clone';

async function fixPaymentIndex() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const paymentsCollection = db.collection('payments');

    // List all indexes
    console.log('\n📋 Current indexes:');
    const indexes = await paymentsCollection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Drop the problematic index
    console.log('\n🗑️  Dropping transactions.id_1 index...');
    try {
      await paymentsCollection.dropIndex('transactions.id_1');
      console.log('✅ Successfully dropped transactions.id_1 index');
    } catch (error) {
      if (error.code === 27 || error.message.includes('index not found')) {
        console.log('ℹ️  Index transactions.id_1 not found (might already be dropped)');
      } else {
        throw error;
      }
    }

    // Create new sparse unique index
    console.log('\n🔧 Creating new sparse unique index on transactions.id...');
    await paymentsCollection.createIndex(
      { 'transactions.id': 1 },
      { 
        unique: true, 
        sparse: true,
        name: 'transactions.id_1_sparse'
      }
    );
    console.log('✅ Successfully created sparse unique index');

    // Verify new indexes
    console.log('\n📋 Updated indexes:');
    const newIndexes = await paymentsCollection.indexes();
    console.log(JSON.stringify(newIndexes, null, 2));

    // Count documents
    const count = await paymentsCollection.countDocuments();
    console.log(`\n📊 Total payments: ${count}`);

    // Count payments with empty transactions
    const emptyTransactions = await paymentsCollection.countDocuments({
      $or: [
        { transactions: { $exists: false } },
        { transactions: { $size: 0 } }
      ]
    });
    console.log(`📊 Payments with empty transactions: ${emptyTransactions}`);

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
fixPaymentIndex();
