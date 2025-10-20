# 🎨 Frontend Data Masking - Hướng Dẫn Sử Dụng

## 📦 Files Đã Tạo

```
frontend/src/
├── utils/
│   └── dataMasking.js          ⭐ Utilities mã hóa dữ liệu
├── hooks/
│   └── useMasking.js           ⭐ React hooks cho masking
└── components/
    └── MaskedData.jsx          ⭐ React components hiển thị masked data
```

## 🚀 Cách Sử Dụng

### 1. Import Utilities

```javascript
import DataMaskingUtils from '@/utils/dataMasking';

// Hoặc import riêng lẻ
import { maskPhone, maskEmail, maskDocumentNumber } from '@/utils/dataMasking';
```

### 2. Sử Dụng Utilities Trực Tiếp

```javascript
import DataMaskingUtils from '@/utils/dataMasking';

function UserProfile({ user }) {
  return (
    <div>
      <p>Email: {DataMaskingUtils.maskEmail(user.email)}</p>
      {/* jo*****@example.com */}
      
      <p>Phone: {DataMaskingUtils.maskPhone(user.phone)}</p>
      {/* +84 *** *** 4567 */}
      
      <p>Passport: {DataMaskingUtils.maskDocumentNumber(user.passport)}</p>
      {/* A*****678 */}
    </div>
  );
}
```

### 3. Sử Dụng React Hooks

```javascript
import { useMaskedUser, useMaskingUtils } from '@/hooks/useMasking';

function UserProfileCard({ user }) {
  // Auto mask tất cả sensitive fields
  const maskedUser = useMaskedUser(user, {
    maskEmail: true,
    maskPhone: true,
    maskDateOfBirth: true,
    maskDocuments: true
  });

  return (
    <div>
      <h3>{maskedUser.personalInfo.firstName}</h3>
      <p>Email: {maskedUser.contactInfo.email}</p>
      {/* Đã masked tự động */}
      <p>Phone: {maskedUser.contactInfo.phone}</p>
      {/* Đã masked tự động */}
    </div>
  );
}

// Hoặc dùng utilities callbacks
function ContactForm() {
  const { maskPhone, formatPhone } = useMaskingUtils();
  
  const handleDisplay = (phone) => {
    return formatPhone(phone, true); // true = mask
  };

  return (
    <div>
      <input 
        value={formatPhone(phoneValue, false)} // Format nhưng không mask
        placeholder="+84 901 234 567"
      />
      <div>Preview: {maskPhone(phoneValue)}</div>
    </div>
  );
}
```

### 4. Sử Dụng React Components

```javascript
import { 
  MaskedPhone, 
  MaskedEmail, 
  MaskedDocument,
  MaskedContactInfo,
  SensitiveDataDisplay 
} from '@/components/MaskedData';

function UserDetails({ user }) {
  return (
    <div>
      {/* Component riêng lẻ */}
      <MaskedPhone phone={user.phone} showIcon={true} />
      <MaskedEmail email={user.email} showIcon={true} />
      <MaskedDocument 
        documentNumber={user.passport}
        documentType="passport"
        lastDigits={4}
      />

      {/* Component tổng hợp */}
      <MaskedContactInfo 
        email={user.email}
        phone={user.phone}
        alternatePhone={user.alternatePhone}
      />

      {/* Hiển thị với toggle reveal */}
      <SensitiveDataDisplay
        value={user.passport}
        maskFunction={(val) => DataMaskingUtils.maskDocumentNumber(val)}
        requireConfirm={true}
        confirmMessage="Bạn có chắc muốn xem thông tin này?"
      />
    </div>
  );
}
```

### 5. Masking trong Booking

```javascript
import { useMaskedBooking } from '@/hooks/useMasking';
import { MaskedPassengerInfo } from '@/components/MaskedData';

function BookingDetails({ booking }) {
  const maskedBooking = useMaskedBooking(booking);

  return (
    <div>
      <h3>Booking: {maskedBooking.bookingReference}</h3>
      
      {/* Contact info đã masked */}
      <p>Contact Phone: {maskedBooking.contactInfo.phone}</p>
      
      {/* Passengers */}
      {maskedBooking.passengers.map((passenger, index) => (
        <MaskedPassengerInfo 
          key={index}
          passenger={passenger}
          showDocument={true}
        />
      ))}
    </div>
  );
}
```

### 6. Masking trong Payment

```javascript
import { useMaskedPayment } from '@/hooks/useMasking';
import { MaskedCard, MaskedBankAccount } from '@/components/MaskedData';

function PaymentDetails({ payment }) {
  const maskedPayment = useMaskedPayment(payment);

  return (
    <div>
      {/* Card payment */}
      {maskedPayment.paymentMethod?.card && (
        <MaskedCard 
          cardNumber={maskedPayment.paymentMethod.card.last4Digits}
          cardBrand={maskedPayment.paymentMethod.card.brand}
        />
      )}

      {/* Bank transfer */}
      {maskedPayment.paymentMethod?.bankTransfer && (
        <MaskedBankAccount 
          accountNumber={maskedPayment.paymentMethod.bankTransfer.accountNumber}
          bankName={maskedPayment.paymentMethod.bankTransfer.bankName}
        />
      )}
    </div>
  );
}
```

### 7. Conditional Masking Based on User Role

```javascript
import { useMaskingConfig } from '@/hooks/useMasking';
import { useAuth } from '@/hooks/useAuth';

function AdminUserView({ user }) {
  const { currentUser } = useAuth();
  const maskingConfig = useMaskingConfig(currentUser.role);

  return (
    <div>
      {/* Admin thấy full, user thường thấy masked */}
      <p>
        Email: {
          maskingConfig.shouldMaskEmail 
            ? DataMaskingUtils.maskEmail(user.email)
            : user.email
        }
      </p>
      
      <p>
        Phone: {
          maskingConfig.shouldMaskPhone
            ? DataMaskingUtils.maskPhone(user.phone)
            : user.phone
        }
      </p>
      
      {/* Document luôn masked cho mọi role */}
      <p>
        Passport: {DataMaskingUtils.maskDocumentNumber(user.passport)}
      </p>
    </div>
  );
}
```

## 🎯 Các Tình Huống Sử Dụng

### Tình huống 1: Profile Page
```javascript
function ProfilePage() {
  const { user } = useAuth();
  const maskedUser = useMaskedUser(user);

  return (
    <div className="profile-page">
      <h1>My Profile</h1>
      <div className="info-section">
        <MaskedContactInfo 
          email={user.contactInfo.email}
          phone={user.contactInfo.phone}
        />
      </div>
    </div>
  );
}
```

### Tình huống 2: Booking Confirmation
```javascript
function BookingConfirmation({ booking }) {
  return (
    <div className="booking-confirmation">
      <h2>Booking Confirmed</h2>
      <p>Reference: {booking.bookingReference}</p>
      
      <div className="contact-details">
        <h3>Contact Information</h3>
        <MaskedEmail email={booking.contactInfo.email} />
        <MaskedPhone phone={booking.contactInfo.phone} />
      </div>

      <div className="passengers">
        <h3>Passengers</h3>
        {booking.passengers.map((passenger, idx) => (
          <MaskedPassengerInfo 
            key={idx}
            passenger={passenger}
            showDocument={true}
          />
        ))}
      </div>
    </div>
  );
}
```

### Tình huống 3: Payment History
```javascript
function PaymentHistory({ payments }) {
  return (
    <div className="payment-history">
      <h2>Payment History</h2>
      {payments.map(payment => {
        const maskedPayment = useMaskedPayment(payment);
        
        return (
          <div key={payment.id} className="payment-item">
            <div>
              Amount: {payment.amount.total} {payment.amount.currency}
            </div>
            {maskedPayment.paymentMethod?.card && (
              <MaskedCard 
                cardNumber={maskedPayment.paymentMethod.card.last4Digits}
                cardBrand={maskedPayment.paymentMethod.card.brand}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

### Tình huống 4: Admin Dashboard
```javascript
function AdminUserList({ users }) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser.role === 'admin';

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.personalInfo.firstName} {user.personalInfo.lastName}</td>
            <td>
              {isAdmin ? (
                <SensitiveDataDisplay
                  value={user.contactInfo.email}
                  maskFunction={DataMaskingUtils.maskEmail}
                />
              ) : (
                <MaskedEmail email={user.contactInfo.email} />
              )}
            </td>
            <td>
              <MaskedPhone phone={user.contactInfo.phone} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## 🎨 Styling (CSS)

```css
/* Thêm vào global CSS */

.masked-phone,
.masked-email,
.masked-document,
.masked-card,
.masked-name {
  font-family: 'Courier New', monospace;
  color: #666;
  letter-spacing: 0.5px;
}

.masked-contact-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sensitive-data-display {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.toggle-reveal-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  background: white;
  transition: all 0.2s;
}

.toggle-reveal-btn:hover {
  background: #f5f5f5;
  border-color: #999;
}

.masked-passenger-info {
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.passenger-name {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.passenger-document {
  color: #666;
  font-size: 0.875rem;
}
```

## 📝 Best Practices

### 1. Luôn mask dữ liệu nhạy cảm
```javascript
// ❌ KHÔNG TỐT
<div>{user.contactInfo.phone}</div>

// ✅ TỐT
<MaskedPhone phone={user.contactInfo.phone} />
```

### 2. Sử dụng hooks cho logic phức tạp
```javascript
// ✅ TỐT - Dùng hook
const maskedUser = useMaskedUser(user);

// ❌ TRÁNH - Mask manual nhiều lần
const maskedEmail = DataMaskingUtils.maskEmail(user.email);
const maskedPhone = DataMaskingUtils.maskPhone(user.phone);
// ... nhiều fields khác
```

### 3. Conditional masking theo role
```javascript
// ✅ TỐT
const maskingConfig = useMaskingConfig(currentUser.role);
const shouldMask = maskingConfig.shouldMaskPhone;
```

### 4. Sử dụng SensitiveDataDisplay cho admin
```javascript
// ✅ TỐT - Admin có thể reveal nếu cần
<SensitiveDataDisplay
  value={user.passport}
  maskFunction={DataMaskingUtils.maskDocumentNumber}
  requireConfirm={true}
/>
```

## ⚠️ Lưu Ý

1. **Backend đã encrypt, frontend mask thêm** - Double protection
2. **Không lưu masked data** - Chỉ dùng để hiển thị
3. **API response có thể đã masked** - Check kỹ
4. **Logs không được chứa sensitive data** - Mask trước khi log

## 🔗 Integration với Backend

```javascript
// API đã trả về encrypted data
// Backend tự động decrypt
// Frontend nhận plaintext -> cần mask để hiển thị

async function fetchUserProfile() {
  const response = await api.get('/api/users/profile');
  // response.data.phone đã được decrypt ở backend
  // Nhưng vẫn cần mask ở frontend khi hiển thị
  
  return response.data;
}

function ProfileDisplay() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserProfile().then(setUser);
  }, []);

  // Mask trước khi hiển thị
  const maskedUser = useMaskedUser(user);

  return <div>{/* Display maskedUser */}</div>;
}
```

## 🎯 Checklist

- [ ] Import DataMaskingUtils vào components cần dùng
- [ ] Thay thế hiển thị trực tiếp bằng MaskedXXX components
- [ ] Dùng hooks cho pages phức tạp
- [ ] Setup conditional masking cho admin pages
- [ ] Thêm CSS styles cho masked components
- [ ] Test hiển thị trên các pages quan trọng
- [ ] Verify không có sensitive data trong console logs
- [ ] Document cho team về cách dùng

---

**Version**: 1.0.0  
**Tạo**: 17/10/2025  
**Maintainer**: Frontend Team
