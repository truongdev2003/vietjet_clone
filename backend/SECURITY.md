# VietJet Clone Security Implementation Guide

## 🔒 Tổng quan bảo mật

Hệ thống đã được triển khai với các biện pháp bảo mật toàn diện bao gồm:

### 1. XSS (Cross-Site Scripting) Protection

#### Middleware đã triển khai:
- **Helmet**: Thiết lập Content Security Policy (CSP)
- **XSS Sanitization**: Làm sạch tất cả input string
- **HTML Encoding**: Mã hóa đầu ra để ngăn script injection

#### Cách hoạt động:
```javascript
// Tự động sanitize tất cả input
const sanitized = xss(userInput, {
  whiteList: {}, // Không cho phép HTML tags
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style']
});
```

#### API Endpoints được bảo vệ:
- Tất cả POST, PUT, PATCH requests
- Body, query parameters, route parameters
- File upload với filename sanitization

### 2. SQL/NoSQL Injection Protection

#### Middleware đã triển khai:
- **express-mongo-sanitize**: Loại bỏ MongoDB operators
- **Pattern Detection**: Phát hiện SQL injection patterns
- **Input Validation**: Validate nghiêm ngặt với express-validator

#### Patterns được phát hiện:
```javascript
// SQL Injection patterns
/(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|SELECT|UNION|UPDATE)\b)/i
/(\b(OR|AND)\s+\d+\s*=\s*\d+)/i

// NoSQL Injection patterns  
/\$where|\$regex|\$gt|\$gte|\$lt|\$lte|\$ne|\$in|\$nin/i
```

#### Validation ví dụ:
```javascript
// Secure text validation
secureText('firstName', { min: 1, max: 50 })
secureEmail // Email với anti-injection
secureObjectId('userId') // MongoDB ObjectId validation
```

### 3. CSRF (Cross-Site Request Forgery) Protection

#### Implementation:
- **Double Submit Cookie Pattern**
- **CSRF Tokens** cho tất cả state-changing operations
- **SameSite Cookies** với strict policy

#### Endpoints được bảo vệ:
```javascript
// Protected endpoints (cần CSRF token):
POST /api/bookings
PUT /api/users/profile  
DELETE /api/bookings/:id
POST /api/admin/*

// Public endpoints (không cần CSRF):
GET /api/flights/search
POST /api/auth/login
POST /api/auth/register
```

#### Cách sử dụng CSRF Token:
```javascript
// Frontend: Lấy token
const response = await fetch('/api/csrf-token');
const { csrfToken } = await response.json();

// Gửi trong header
fetch('/api/bookings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(bookingData)
});
```

### 4. Two-Factor Authentication (2FA) cho Admin

#### Tính năng:
- **Google Authenticator** integration
- **Backup codes** (10 mã dự phòng)  
- **Time-based OTP** (TOTP) với 30s window
- **Brute force protection** cho 2FA login

#### Admin 2FA Workflow:

1. **Setup 2FA:**
```bash
POST /api/2fa/setup
Authorization: Bearer <admin-token>

Response:
{
  "qrCode": "data:image/png;base64,...",
  "secret": "JBSWY3DPEHPK3PXP",
  "backupCodes": ["1A2B3C4D", "5E6F7G8H", ...]
}
```

2. **Enable 2FA:**
```bash
POST /api/2fa/enable
{
  "token": "123456"
}
```

3. **Login với 2FA:**
```bash
# Bước 1: Login thường
POST /api/auth/login
{
  "email": "admin@vietjet.com",
  "password": "password"
}

# Bước 2: Verify 2FA
POST /api/2fa/verify  
{
  "token": "123456",
  "userId": "user_id_from_step_1"
}
```

4. **Sử dụng Backup Code:**
```bash
POST /api/2fa/verify
{
  "token": "1A2B3C4D",
  "userId": "user_id",
  "isBackupCode": true
}
```

### 5. Rate Limiting & Brute Force Protection

#### Các loại rate limiting:

1. **General API Limiting:**
   - 100 requests/15 phút/IP
   - Tất cả API endpoints

2. **Login Protection:**
   - 5 attempts/15 phút/IP
   - Tự động lock account sau 5 lần sai

3. **Admin Login Protection:**
   - 3 attempts/30 phút/IP  
   - Stricter cho admin endpoints

4. **Booking Protection:**
   - 10 bookings/1 giờ/IP
   - Ngăn spam booking

5. **Speed Limiting:**
   - Từ từ tăng delay sau 50 requests
   - Max delay: 2 giây

#### Headers trả về:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

### 6. Security Headers (Helmet.js)

#### Headers được thiết lập:
```http
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY  
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: no-referrer
```

### 7. Input Validation & Sanitization

#### Enhanced Validators:

```javascript
// Email validation
secureEmail: [
  isEmail(),
  normalizeEmail(),
  custom(noXSS),
  custom(noSqlInjection),
  isLength({ max: 254 })
]

// Password validation  
securePassword: [
  isLength({ min: 8, max: 128 }),
  matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  custom(noXSS),
  custom(noSqlInjection)
]

// Booking reference validation
secureBookingReference: [
  matches(/^[A-Z0-9]{6}$/),
  custom(noXSS),
  custom(noSqlInjection)
]
```

### 8. Error Handling & Information Leakage Prevention

#### Production Error Messages:
```javascript
// Development
{
  "error": "ValidationError: Path `email` is required.",
  "stack": "Error: ValidationError...",
  "details": {...}
}

// Production  
{
  "error": "Dữ liệu không hợp lệ",
  "code": "VALIDATION_ERROR"
}
```

#### Sensitive Data Filtering:
- Password fields luôn bị ẩn
- Database connection strings được sanitize
- Stack traces chỉ hiện trong development
- User IDs được hash trong logs

### 9. Security Logging

#### Log Events:
```javascript
// Security events được log:
- Failed login attempts
- 2FA setup/disable
- Rate limit violations  
- XSS/SQL injection attempts
- CSRF token failures
- File upload violations
- Admin access attempts
```

#### Log Format:
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "warn",
  "message": "Rate limit exceeded",
  "service": "vietjet-security",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "endpoint": "/api/bookings",
  "userId": "user123"
}
```

### 10. File Upload Security

#### Validation:
```javascript
secureFileUpload(['image/jpeg', 'image/png'], 5 * 1024 * 1024)
```

#### Checks:
- File type validation (MIME type)
- File size limits (5MB default)
- Filename sanitization
- Extension whitelist
- Magic byte verification

## 🛡️ Deployment Security Checklist

### Environment Variables:
```bash
# Production settings
NODE_ENV=production
SECURE_COOKIES=true  
SAME_SITE_COOKIES=strict

# Strong secrets
JWT_SECRET=<256-bit-random-key>
SESSION_SECRET=<256-bit-random-key>

# Rate limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=50

# Admin IP whitelist (optional)
ADMIN_WHITELIST_IPS=192.168.1.100,203.0.113.0
```

### Server Configuration:
- HTTPS only in production
- Hide server version headers
- Disable server signatures  
- Configure reverse proxy (nginx) security headers
- Enable firewall rules
- Regular security updates

### MongoDB Security:
- Authentication enabled
- Role-based access control
- Network access restrictions
- Regular backups with encryption
- Connection string with SSL

### Monitoring:
- Security log monitoring
- Failed login alerts
- Rate limit breach notifications
- Error rate monitoring
- Performance monitoring

## 🔧 Installation & Setup

### 1. Install dependencies:
```bash
npm install helmet express-rate-limit express-mongo-sanitize xss hpp cors csurf speakeasy qrcode-generator winston uuid
```

### 2. Configure environment:
```bash
cp .env.example .env
# Edit .env với security settings
```

### 3. Create logs directory:
```bash
mkdir -p logs
chmod 755 logs
```

### 4. Test security:
```bash
# Run security tests
npm run test:security

# Check for vulnerabilities  
npm audit
npm audit fix
```

## 🚨 Security Incident Response

### Immediate Actions:
1. **Rate Limit Breach**: Tự động block IP
2. **2FA Compromise**: Disable admin account  
3. **SQL Injection**: Log và block request
4. **XSS Attempt**: Sanitize và log
5. **CSRF Attack**: Invalidate sessions

### Monitoring Commands:
```bash
# Check security logs
tail -f logs/security-error.log

# Monitor rate limits
grep "rate limit" logs/security-combined.log

# Check failed logins
grep "Invalid login" logs/security-combined.log
```

## 📞 Support

Nếu phát hiện lỗ hổng bảo mật:
- Email: security@vietjet.com
- Encrypted communication: PGP key available
- Response time: 24 hours for critical issues

---

**Lưu ý**: File này chứa thông tin nhạy cảm về bảo mật. Chỉ chia sẻ với team development được ủy quyền.