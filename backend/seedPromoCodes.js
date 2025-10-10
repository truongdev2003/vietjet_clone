const PromoCode = require('./models/PromoCode');
const connectDB = require('./config/database');
require('dotenv').config();

const promoCodesData = [
  {
    code: 'SUMMER2024',
    description: 'Ưu đãi mùa hè - Giảm 15% cho tất cả chuyến bay',
    type: 'percentage',
    value: 15,
    maxDiscount: 500000, // 500k VNĐ
    minAmount: 1000000, // 1tr VNĐ
    validFrom: new Date('2024-06-01'),
    validUntil: new Date('2024-08-31'),
    usageLimit: 1000,
    perUserLimit: 2,
    active: true
  },
  {
    code: 'NEWUSER',
    description: 'Chào mừng khách hàng mới - Giảm 200,000 VNĐ',
    type: 'fixed',
    value: 200000,
    minAmount: 500000,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-12-31'),
    usageLimit: null, // unlimited
    perUserLimit: 1,
    newUserOnly: true,
    active: true
  },
  {
    code: 'FLASH50',
    description: 'Flash Sale - Giảm 50,000 VNĐ',
    type: 'fixed',
    value: 50000,
    minAmount: 300000,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-12-31'),
    usageLimit: 500,
    perUserLimit: 1,
    active: true
  },
  {
    code: 'WEEKEND20',
    description: 'Ưu đãi cuối tuần - Giảm 20%',
    type: 'percentage',
    value: 20,
    maxDiscount: 300000,
    minAmount: 800000,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-12-31'),
    usageLimit: 200,
    perUserLimit: 3,
    active: true
  },
  {
    code: 'VIP100',
    description: 'Mã VIP - Giảm 100,000 VNĐ cho mọi đơn hàng',
    type: 'fixed',
    value: 100000,
    minAmount: 0,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-12-31'),
    usageLimit: 50,
    perUserLimit: 1,
    active: true
  },
  {
    code: 'MEGA30',
    description: 'Mega Sale - Giảm 30% cho đơn từ 2 triệu',
    type: 'percentage',
    value: 30,
    maxDiscount: 1000000,
    minAmount: 2000000,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-12-31'),
    usageLimit: 100,
    perUserLimit: 1,
    active: true
  },
  {
    code: 'STUDENT15',
    description: 'Ưu đãi sinh viên - Giảm 15%',
    type: 'percentage',
    value: 15,
    maxDiscount: 400000,
    minAmount: 600000,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-12-31'),
    usageLimit: 300,
    perUserLimit: 2,
    active: true
  },
  {
    code: 'EARLYBIRD',
    description: 'Đặt sớm - Giảm 150,000 VNĐ',
    type: 'fixed',
    value: 150000,
    minAmount: 700000,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-12-31'),
    usageLimit: 150,
    perUserLimit: 2,
    active: true
  },
  {
    code: 'GROUPFLY',
    description: 'Bay nhóm - Giảm 25% cho đơn từ 3 triệu',
    type: 'percentage',
    value: 25,
    maxDiscount: 800000,
    minAmount: 3000000,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-12-31'),
    usageLimit: 80,
    perUserLimit: 1,
    active: true
  },
  {
    code: 'TESTER',
    description: 'Mã test - Giảm 10% (for testing)',
    type: 'percentage',
    value: 10,
    maxDiscount: 100000,
    minAmount: 100000,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31'),
    usageLimit: null,
    perUserLimit: 10,
    active: true
  }
];

const seedPromoCodes = async () => {
  try {
    await connectDB();

    // Clear existing promo codes
    await PromoCode.deleteMany({});
    console.log('🗑️  Cleared existing promo codes');

    // Insert new promo codes
    const promoCodes = await PromoCode.insertMany(promoCodesData);
    console.log(`✅ Successfully seeded ${promoCodes.length} promo codes`);

    console.log('\n📋 Promo Codes Created:');
    promoCodes.forEach(promo => {
      const discountText = promo.type === 'percentage' 
        ? `${promo.value}% (max ${promo.maxDiscount?.toLocaleString('vi-VN')} VNĐ)`
        : `${promo.value.toLocaleString('vi-VN')} VNĐ`;
      
      console.log(`
  Code: ${promo.code}
  Type: ${promo.type}
  Discount: ${discountText}
  Min Amount: ${promo.minAmount.toLocaleString('vi-VN')} VNĐ
  Usage Limit: ${promo.usageLimit || 'Unlimited'}
  Per User: ${promo.perUserLimit}
  Valid Until: ${promo.validUntil.toLocaleDateString('vi-VN')}
  New User Only: ${promo.newUserOnly ? 'Yes' : 'No'}
      `);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding promo codes:', error);
    process.exit(1);
  }
};

// Run seed
seedPromoCodes();
