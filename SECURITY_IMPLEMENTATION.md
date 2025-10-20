# 📋 BÁO CÁO TRIỂN KHAI BẢO MẬT - DỰ ÁN VIETJET CLONE

## 📑 MỤC LỤC
1. [Mã hóa dữ liệu (Data Encryption)](#1-mã-hóa-dữ-liệu-data-encryption)
2. [SSL/TLS](#2-ssltls)
3. [Chống XSS (Cross-Site Scripting)](#3-chống-xss-cross-site-scripting)
4. [Chống NoSQL Injection](#4-chống-nosql-injection)
5. [Chống CSRF (Cross-Site Request Forgery)](#5-chống-csrf-cross-site-request-forgery)
6. [Xác thực 2 lớp (Two-Factor Authentication)](#6-xác-thực-2-lớp-two-factor-authentication)
7. [Các biện pháp bảo mật khác](#7-các-biện-pháp-bảo-mật-khác)

---

## 1. MÃ HÓA DỮ LIỆU (DATA ENCRYPTION)

### 1.1. Thuật toán mã hóa
**Vị trí:** `backend/services/encryptionService.js`

#### 🔐 AES-256-GCM Encryption
```javascript
class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';  // Advanced Encryption Standard
    this.key = Buffer.from(encryptionKey, 'hex'); // 32 bytes key
    this.ivLength = 16;      // 128 bits Initialization Vector
    this.authTagLength = 16; // 128 bits Authentication Tag
  }
}
```

**Lý do chọn AES-256-GCM:**
- ✅ **AES-256**: Tiêu chuẩn mã hóa quân sự, key 256-bit cực kỳ khó bẻ khóa
- ✅ **GCM Mode**: Galois/Counter Mode - vừa mã hóa vừa xác thực dữ liệu
- ✅ **Authentication Tag**: Đảm bảo dữ liệu không bị thay đổi
- ✅ **Random IV**: Mỗi lần mã hóa dùng IV khác nhau → bảo mật cao

### 1.2. Cách thức mã hóa

#### **Encrypt Function:**
```javascript
encrypt(plaintext) {
  // 1. Tạo IV ngẫu nhiên cho mỗi lần mã hóa
  const iv = crypto.randomBytes(this.ivLength);
  
  // 2. Tạo cipher với algorithm AES-256-GCM
  const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
  
  // 3. Mã hóa dữ liệu
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // 4. Lấy authentication tag để xác thực
  const authTag = cipher.getAuthTag();
  
  // 5. Trả về format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}
```

**Format dữ liệu mã hóa:**
```
[IV (32 hex)]:[Auth Tag (32 hex)]:[Encrypted Data (variable)]
```

#### **Decrypt Function:**
```javascript
decrypt(encryptedData) {
  // 1. Parse chuỗi đã mã hóa
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const ciphertext = parts[2];
  
  // 2. Tạo decipher
  const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
  decipher.setAuthTag(authTag); // Xác thực dữ liệu
  
  // 3. Giải mã
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### 1.3. Dữ liệu được mã hóa

**Vị trí triển khai:** `backend/models/User.js`

#### **User Model - Pre-save Middleware:**
```javascript
userSchema.pre('save', async function(next) {
  const encryptionService = getEncryptionService();
  
  // Mã hóa số điện thoại
  if (this.isModified('contactInfo.phone')) {
    this.contactInfo.phone = encryptionService.encrypt(this.contactInfo.phone);
  }
  
  if (this.isModified('contactInfo.alternatePhone')) {
    this.contactInfo.alternatePhone = encryptionService.encrypt(
      this.contactInfo.alternatePhone
    );
  }
  
  // Mã hóa số giấy tờ (Passport, CMND)
  if (this.isModified('documents')) {
    this.documents = this.documents.map(doc => ({
      ...doc.toObject(),
      number: encryptionService.encrypt(doc.number)
    }));
  }
});
```

**Dữ liệu được mã hóa trong DB:**
- ✅ Số điện thoại (`contactInfo.phone`)
- ✅ Số điện thoại phụ (`contactInfo.alternatePhone`)
- ✅ Số hộ chiếu/CMND (`documents.number`)
- ✅ Thông tin thẻ thanh toán (trong Payment model)

#### **Giải mã tự động khi query:**
```javascript
// Post-find middleware - tự động giải mã khi lấy dữ liệu
userSchema.post('find', function(docs) {
  const encryptionService = getEncryptionService();
  docs.forEach(doc => {
    doc.contactInfo.phone = encryptionService.decrypt(doc.contactInfo.phone);
    // ... giải mã các trường khác
  });
});

userSchema.post('findOne', function(doc) {
  // Tương tự cho findOne
});
```

### 1.4. Quản lý khóa mã hóa

**File cấu hình:** `.env`
```bash
# Generate key command:
node -e "console.log(crypto.randomBytes(32).toString('hex'))"

ENCRYPTION_KEY=your_64_character_hex_key_here
```

**Yêu cầu bảo mật:**
- ⚠️ **KHÔNG BAO GIỜ** commit ENCRYPTION_KEY vào Git
- ⚠️ Key phải đủ 64 ký tự hex (32 bytes)
- ⚠️ Rotate key định kỳ (6-12 tháng)
- ⚠️ Backup key an toàn (AWS Secrets Manager, Azure Key Vault)

### 1.5. Hash mật khẩu (bcrypt)

**Vị trí:** `backend/models/User.js`

```javascript
// Mã hóa password trước khi save
userSchema.pre('save', async function(next) {
  if (!this.isModified('account.password')) return next();
  
  // Salt rounds = 12 (cực kỳ mạnh)
  this.account.password = await bcrypt.hash(this.account.password, 12);
  next();
});

// So sánh password khi login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.account.password);
};
```

**Lý do dùng bcrypt:**
- ✅ Salt tự động (ngăn rainbow table attack)
- ✅ Adaptive function (tăng cost factor theo thời gian)
- ✅ Slow by design (chống brute force)

---

## 2. SSL/TLS

### 2.1. HTTPS Configuration

**Production Environment:**
```javascript
// backend/server.js
const https = require('https');
const fs = require('fs');

if (process.env.NODE_ENV === 'production') {
  const httpsOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
    ca: fs.readFileSync(process.env.SSL_CA_PATH) // Certificate Authority
  };
  
  https.createServer(httpsOptions, app).listen(443);
}
```

### 2.2. HTTP Strict Transport Security (HSTS)

**Vị trí:** `backend/middleware/security.js`

```javascript
const securityHeaders = helmet({
  hsts: {
    maxAge: 31536000,      // 1 năm
    includeSubDomains: true, // Áp dụng cho subdomain
    preload: true          // Đưa vào HSTS preload list
  }
});
```

**Chức năng:**
- ✅ Buộc browser luôn dùng HTTPS
- ✅ Ngăn downgrade attack (HTTPS → HTTP)
- ✅ Bảo vệ khỏi man-in-the-middle

### 2.3. Secure Cookies

**Cookie Configuration:**
```javascript
res.cookie('token', jwtToken, {
  httpOnly: true,          // Không thể truy cập từ JavaScript
  secure: true,            // Chỉ gửi qua HTTPS
  sameSite: 'strict',      // Chống CSRF
  maxAge: 24 * 60 * 60 * 1000, // 24 giờ
  domain: process.env.COOKIE_DOMAIN,
  path: '/'
});
```

### 2.4. TLS Version

**Nginx Configuration (reverse proxy):**
```nginx
ssl_protocols TLSv1.2 TLSv1.3;  # Chỉ dùng TLS 1.2+
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
ssl_prefer_server_ciphers on;
```

---

## 3. CHỐNG XSS (CROSS-SITE SCRIPTING)

### 3.1. XSS Protection Middleware

**Vị trí:** `backend/middleware/security.js`

```javascript
const xss = require('xss');

const xssProtection = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (obj && typeof obj === "object") {
      for (const key in obj) {
        if (typeof obj[key] === "string") {
          // Loại bỏ TẤT CẢ thẻ HTML nguy hiểm
          obj[key] = xss(obj[key], {
            whiteList: {},              // Không cho phép thẻ HTML nào
            stripIgnoreTag: true,       // Loại bỏ thẻ không cho phép
            stripIgnoreTagBody: ["script"] // Loại bỏ cả nội dung script
          });
        } else if (typeof obj[key] === "object") {
          sanitizeObject(obj[key]); // Recursive
        }
      }
    }
  };

  // Sanitize tất cả input
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

app.use(xssProtection); // Áp dụng cho TẤT CẢ routes
```

### 3.2. Content Security Policy (CSP)

**Vị trí:** `backend/middleware/security.js`

```javascript
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],           // Chỉ load từ cùng origin
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "https:"],  // Chỉ script từ HTTPS
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"], // API calls chỉ HTTPS
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],            // Không cho phép plugins
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]              // Không cho phép iframe
    }
  }
});
```

**Lợi ích:**
- ✅ Ngăn inline scripts (`<script>alert('XSS')</script>`)
- ✅ Chỉ load resources từ nguồn tin cậy
- ✅ Ngăn clickjacking với `frameSrc: none`

### 3.3. Frontend XSS Protection

**React Component Sanitization:**
```javascript
// frontend/src/utils/sanitize.js
import DOMPurify from 'dompurify';

export const sanitizeHTML = (dirty) => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  });
};

// Usage in React
<div dangerouslySetInnerHTML={{
  __html: sanitizeHTML(userInput)
}} />
```

### 3.4. X-XSS-Protection Header

```javascript
// Helmet tự động thêm
X-XSS-Protection: 1; mode=block
```

---

## 4. CHỐNG NOSQL INJECTION

### 4.1. MongoDB Sanitization

**Vị trí:** `backend/middleware/security.js`

```javascript
const mongoSanitize = require('express-mongo-sanitize');

const mongoSanitization = (req, res, next) => {
  // Sanitize body - thay thế $ và . bằng _
  if (req.body) {
    req.body = mongoSanitize.sanitize(req.body, { replaceWith: '_' });
  }
  
  // Sanitize params
  if (req.params) {
    req.params = mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  }
  
  // Kiểm tra query string có ký tự nguy hiểm
  if (req.query) {
    const queryString = JSON.stringify(req.query);
    if (queryString.includes('$') || queryString.includes('.')) {
      securityLogger.warn("MongoDB injection attempt detected", {
        ip: req.ip,
        query: req.query
      });
      return res.status(400).json({ error: 'Invalid query parameters' });
    }
  }
  
  next();
};

app.use(mongoSanitization);
```

### 4.2. Ví dụ tấn công bị chặn

**Tấn công:**
```javascript
// Attacker cố gắng bypass authentication
POST /api/auth/login
{
  "email": {"$gt": ""},  // Lấy tất cả email > ""
  "password": {"$gt": ""} // Lấy tất cả password > ""
}
```

**Sau sanitization:**
```javascript
{
  "email": {"_gt": ""},  // $ được thay bằng _
  "password": {"_gt": ""}
}
// Query này sẽ KHÔNG match với MongoDB operators
```

### 4.3. Validation Input

**Vị trí:** `backend/validators/authValidator.js`

```javascript
const { body } = require('express-validator');

const loginValidator = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .trim()
    .escape(),  // Escape ký tự đặc biệt
  
  body('password')
    .isString()
    .isLength({ min: 6, max: 100 })
    .trim()
];
```

### 4.4. Parameterized Queries

```javascript
// ✅ ĐÚNG - Dùng object literal
const user = await User.findOne({ 
  'contactInfo.email': email 
});

// ❌ SAI - String concatenation
const user = await User.findOne({ 
  'contactInfo.email': req.body.email 
});
```

---

## 5. CHỐNG CSRF (CROSS-SITE REQUEST FORGERY)

### 5.1. Double-Submit Cookie Pattern

**Vị trí:** `backend/middleware/csrf.js`

```javascript
const { v4: uuidv4 } = require('uuid');

const doubleSubmitCookie = {
  // Tạo token
  generate: (req, res, next) => {
    const token = uuidv4(); // Random UUID
    
    // 1. Set token vào cookie (httpOnly: false để JS đọc được)
    res.cookie('csrf-token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000  // 1 giờ
    });
    
    // 2. Gửi token về client qua header
    res.setHeader('X-CSRF-Token', token);
    
    next();
  },
  
  // Verify token
  verify: (req, res, next) => {
    const cookieToken = req.cookies['csrf-token'];
    const headerToken = req.headers['x-csrf-token'] || 
                       req.headers['csrf-token'] ||
                       req.body._csrf;
    
    // 3. So sánh token từ cookie và header
    if (!cookieToken) {
      return res.status(403).json({
        error: 'Token bảo mật bị thiếu',
        code: 'MISSING_CSRF_COOKIE'
      });
    }
    
    if (!headerToken) {
      return res.status(403).json({
        error: 'Token bảo mật không được gửi',
        code: 'MISSING_CSRF_HEADER'
      });
    }
    
    if (cookieToken !== headerToken) {
      securityLogger.warn('CSRF token mismatch', {
        ip: req.ip,
        endpoint: req.originalUrl
      });
      return res.status(403).json({
        error: 'Token bảo mật không khớp',
        code: 'CSRF_TOKEN_MISMATCH'
      });
    }
    
    next();
  }
};
```

### 5.2. CSRF Token Endpoint

**Vị trí:** `backend/server.js`

```javascript
// Endpoint để lấy CSRF token
app.get('/api/csrf-token', (req, res) => {
  const token = uuidv4();
  
  res.cookie('csrf-token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600000
  });
  
  res.json({
    success: true,
    csrfToken: token
  });
});
```

### 5.3. Frontend Implementation

**React - Axios Configuration:**
```javascript
// frontend/src/config/axios.js
import axios from 'axios';

// 1. Lấy CSRF token khi app khởi động
const getCsrfToken = async () => {
  const response = await axios.get('/api/csrf-token');
  return response.data.csrfToken;
};

// 2. Interceptor thêm CSRF token vào mọi request
axios.interceptors.request.use(async (config) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method.toUpperCase())) {
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf-token='))
      ?.split('=')[1];
    
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  return config;
});
```

### 5.4. Custom CSRF Protection

**Vị trí:** `backend/server.js`

```javascript
const customCSRFProtection = (req, res, next) => {
  // Skip CSRF cho các route không cần
  const skipRoutes = [
    '/api/csrf-token',
    '/api/auth/login',
    '/api/auth/register'
  ];
  
  // Skip cho GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip nếu route trong danh sách
  if (skipRoutes.includes(req.path)) {
    return next();
  }
  
  // Verify CSRF token
  return doubleSubmitCookie.verify(req, res, next);
};

app.use(customCSRFProtection);
```

### 5.5. SameSite Cookie

```javascript
// Bảo vệ thêm với SameSite attribute
res.cookie('sessionId', token, {
  sameSite: 'strict' // Browser không gửi cookie trong cross-site request
});
```

**SameSite modes:**
- **strict**: Không gửi cookie trong mọi cross-site request
- **lax**: Gửi cookie trong GET request từ external site
- **none**: Gửi cookie trong mọi request (cần secure: true)

---

## 6. XÁC THỰC 2 LỚP (TWO-FACTOR AUTHENTICATION)

### 6.1. TOTP (Time-based One-Time Password)

**Vị trí:** `backend/services/twoFactorAuthService.js`

```javascript
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class TwoFactorAuthService {
  // 1. Tạo secret cho user
  static generateSecret(userEmail) {
    const secret = speakeasy.generateSecret({
      name: `VietJet Clone (${userEmail})`,
      issuer: 'VietJet Clone',
      length: 32  // 256-bit secret
    });

    return {
      secret: secret.base32,      // Base32 encoded
      otpauthUrl: secret.otpauth_url // URL cho QR code
    };
  }

  // 2. Tạo QR code
  static async generateQRCode(otpauthUrl) {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  }

  // 3. Verify token từ authenticator app
  static verifyToken(token, secret, window = 2) {
    // Remove spaces
    const cleanToken = token.toString().replace(/\s/g, '');

    // Check format (6 digits)
    if (!/^\d{6}$/.test(cleanToken)) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: cleanToken,
      window: window  // ±1 phút time drift
    });
  }
}
```

### 6.2. Setup 2FA Flow

**Controller:** `backend/controllers/twoFactorAuthController.js`

```javascript
class TwoFactorAuthController {
  // Bước 1: Setup 2FA
  static async setup2FA(req, res) {
    const user = await User.findById(req.user.id);
    
    if (user.twoFactorAuth.isEnabled) {
      return errorResponse(res, '2FA đã được bật', 400);
    }

    // Tạo secret và QR code
    const { secret, otpauthUrl } = TwoFactorAuthService.generateSecret(
      user.contactInfo.email
    );
    const qrCodeDataUrl = await TwoFactorAuthService.generateQRCode(otpauthUrl);

    // Lưu temporary secret
    user.twoFactorAuth.tempSecret = secret;
    await user.save();

    return successResponse(res, {
      secret,
      qrCode: qrCodeDataUrl,
      message: 'Quét QR code bằng Google Authenticator hoặc Authy'
    });
  }

  // Bước 2: Verify và enable 2FA
  static async verifySetup(req, res) {
    const { token } = req.body;
    const user = await User.findById(req.user.id);

    // Verify token
    const isValid = TwoFactorAuthService.verifyToken(
      token,
      user.twoFactorAuth.tempSecret
    );

    if (!isValid) {
      return errorResponse(res, 'Mã xác thực không đúng', 400);
    }

    // Generate backup codes
    const backupCodesData = await TwoFactorAuthService.generateBackupCodes(10);

    // Enable 2FA
    user.twoFactorAuth.isEnabled = true;
    user.twoFactorAuth.secret = user.twoFactorAuth.tempSecret;
    user.twoFactorAuth.tempSecret = undefined;
    user.twoFactorAuth.enabledAt = new Date();
    user.twoFactorAuth.backupCodes = backupCodesData.map(bc => ({
      code: bc.hashedCode,
      used: false
    }));

    await user.save();

    return successResponse(res, {
      backupCodes: backupCodesData.map(bc => bc.plainCode),
      message: '2FA đã được kích hoạt'
    });
  }
}
```

### 6.3. Login với 2FA

**Vị trí:** `backend/controllers/authController.js`

```javascript
const login = async (req, res) => {
  const { email, password, twoFactorToken } = req.body;

  // 1. Kiểm tra email & password
  const user = await User.findOne({ 'contactInfo.email': email });
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return errorResponse(res, 'Email hoặc mật khẩu không đúng');
  }

  // 2. Kiểm tra 2FA nếu đã bật
  if (user.twoFactorAuth.isEnabled) {
    if (!twoFactorToken) {
      return res.status(200).json({
        success: false,
        requires2FA: true,
        message: 'Vui lòng nhập mã xác thực 2FA'
      });
    }

    // Verify 2FA token
    const is2FAValid = TwoFactorAuthService.verifyToken(
      twoFactorToken,
      user.twoFactorAuth.secret
    );

    if (!is2FAValid) {
      // Thử backup code
      const isBackupCodeValid = await verifyBackupCode(
        user,
        twoFactorToken
      );

      if (!isBackupCodeValid) {
        return errorResponse(res, 'Mã 2FA không đúng', 401);
      }
    }
  }

  // 3. Tạo JWT token
  const accessToken = JWTService.generateAccessToken(user);
  const refreshToken = JWTService.generateRefreshToken(user);

  return successResponse(res, {
    accessToken,
    refreshToken,
    user: sanitizeUser(user)
  });
};
```

### 6.4. Backup Codes

```javascript
class TwoFactorAuthService {
  // Generate backup codes
  static async generateBackupCodes(count = 10) {
    const codes = [];
    
    for (let i = 0; i < count; i++) {
      // Generate 8-character code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      
      // Hash code for storage
      const hashedCode = await bcrypt.hash(code, 10);
      
      codes.push({
        plainCode: code,      // Trả về user (chỉ 1 lần)
        hashedCode: hashedCode // Lưu trong DB
      });
    }

    return codes;
  }

  // Verify backup code
  static async verifyBackupCode(inputCode, hashedCode) {
    const cleanCode = inputCode.toUpperCase().replace(/\s/g, '');
    return await bcrypt.compare(cleanCode, hashedCode);
  }
}
```

### 6.5. User Model - 2FA Fields

**Vị trí:** `backend/models/User.js`

```javascript
const userSchema = new mongoose.Schema({
  twoFactorAuth: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    secret: String,           // Base32 secret cho TOTP
    tempSecret: String,       // Temporary secret khi setup
    backupCodes: [{
      code: String,           // Hashed backup code
      used: {
        type: Boolean,
        default: false
      },
      usedAt: Date
    }],
    enabledAt: Date,
    disabledAt: Date
  }
});
```

### 6.6. 2FA cho Admin

**Routes Protection:**
```javascript
// backend/routes/admin.js
const { protect, authorize, require2FA } = require('../middleware/auth');

router.use(protect);           // Phải đăng nhập
router.use(authorize(['admin', 'superadmin'])); // Phải là admin
router.use(require2FA);        // Phải enable 2FA

// Middleware require2FA
const require2FA = (req, res, next) => {
  if (req.currentUser.role === 'admin' || 
      req.currentUser.role === 'superadmin') {
    if (!req.currentUser.twoFactorAuth.isEnabled) {
      return res.status(403).json({
        error: 'Admin phải bật 2FA để truy cập'
      });
    }
  }
  next();
};
```

---

## 7. CÁC BIỆN PÁP BẢO MẬT KHÁC

### 7.1. Rate Limiting

**Vị trí:** `backend/middleware/security.js`

```javascript
const rateLimit = require('express-rate-limit');

// 1. Login Rate Limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 phút
  max: 5,                     // Tối đa 5 requests
  message: {
    error: 'Quá nhiều lần đăng nhập sai. Thử lại sau 15 phút.'
  },
  handler: (req, res, next, options) => {
    securityLogger.warn('Login brute force attempt', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(options.statusCode).json(options.message);
  }
});

// 2. Admin Login Rate Limiting (nghiêm ngặt hơn)
const adminLoginLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,  // 30 phút
  max: 3,                     // Chỉ 3 lần
  message: {
    error: 'Quá nhiều lần đăng nhập admin sai. Thử lại sau 30 phút.'
  }
});

// 3. API Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,  // 100 requests / 15 phút
  message: {
    error: 'Quá nhiều requests. Vui lòng thử lại sau.'
  }
});

// 4. Booking Rate Limiting
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 giờ
  max: 10,                    // 10 bookings / giờ
  message: {
    error: 'Quá nhiều lần đặt vé. Thử lại sau 1 tiếng.'
  }
});
```

### 7.2. Request Slow Down

```javascript
const slowDown = require('express-slow-down');

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,  // 15 phút
  delayAfter: 50,             // Sau 50 requests
  delayMs: () => 100,         // Delay thêm 100ms
  maxDelayMs: 2000            // Tối đa 2 giây
});
```

### 7.3. HTTP Parameter Pollution

```javascript
const hpp = require('hpp');

const parameterPollutionProtection = hpp({
  whitelist: ['sort', 'fields', 'page', 'limit', 'filters']
});

// Ngăn chặn: /api/users?id=1&id=2&id=3
```

### 7.4. Request Size Limiting

```javascript
const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.get('content-length'));
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    securityLogger.warn('Large request detected', {
      ip: req.ip,
      contentLength
    });
    return res.status(413).json({
      error: 'Request quá lớn. Tối đa 10MB.'
    });
  }
  next();
};
```

### 7.5. Security Logging

```javascript
const winston = require('winston');

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/security-error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/security-combined.log'
    })
  ]
});

// Log security events
securityLogger.warn('Suspicious activity', {
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  endpoint: req.originalUrl,
  timestamp: new Date()
});
```

### 7.6. Admin IP Whitelist

```javascript
const adminIPWhitelist = (req, res, next) => {
  const allowedIPs = process.env.ADMIN_WHITELIST_IPS
    ? process.env.ADMIN_WHITELIST_IPS.split(',')
    : [];

  if (allowedIPs.length > 0 && !allowedIPs.includes(req.ip)) {
    securityLogger.error('Unauthorized admin IP access', {
      ip: req.ip,
      endpoint: req.originalUrl
    });
    return res.status(403).json({
      error: 'IP không được phép truy cập admin panel'
    });
  }
  next();
};
```

### 7.7. Account Lockout

**User Model:**
```javascript
userSchema.methods.incLoginAttempts = function() {
  // Reset nếu lock đã hết hạn
  if (this.account.lockUntil && this.account.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        'account.loginAttempts': 1,
        'account.lockUntil': 1
      }
    });
  }
  
  const updates = { $inc: { 'account.loginAttempts': 1 } };
  
  // Lock account sau 5 lần thất bại
  if (this.account.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      'account.lockUntil': Date.now() + 2 * 60 * 60 * 1000 // 2 giờ
    };
  }
  
  return this.updateOne(updates);
};

userSchema.virtual('isLocked').get(function() {
  return !!(this.account.lockUntil && this.account.lockUntil > Date.now());
});
```

### 7.8. JWT Security

**Configuration:** `backend/config/jwt.js`

```javascript
class JWTService {
  static generateAccessToken(user) {
    return jwt.sign(
      { 
        userId: user._id,
        role: user.role,
        email: user.contactInfo.email
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '15m',      // Access token ngắn
        issuer: 'vietjet-clone',
        audience: 'vietjet-users'
      }
    );
  }

  static generateRefreshToken(user) {
    return jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { 
        expiresIn: '7d'        // Refresh token dài hơn
      }
    );
  }

  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'vietjet-clone',
        audience: 'vietjet-users'
      });
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}
```
 