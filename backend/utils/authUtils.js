const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class AuthUtils {
  // Generate random token
  static generateRandomToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash token with SHA256
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Generate secure password
  static generateSecurePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  // Hash password
  static async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  // Compare password
  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  // Generate verification code (6 digits)
  static generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Validate email format
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone format (Vietnamese)
  static isValidPhone(phone) {
    const phoneRegex = /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/;
    return phoneRegex.test(phone);
  }

  // Validate password strength
  static validatePasswordStrength(password) {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Mật khẩu phải có ít nhất 8 ký tự');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Mật khẩu phải có ít nhất một chữ cái thường');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Mật khẩu phải có ít nhất một chữ cái hoa');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Mật khẩu phải có ít nhất một số');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Mật khẩu phải có ít nhất một ký tự đặc biệt');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Generate username from email
  static generateUsernameFromEmail(email) {
    return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // Sanitize user input
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
  }

  // Calculate age from date of birth
  static calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  // Format phone number to standard format
  static formatPhoneNumber(phone) {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Convert to +84 format
    if (cleaned.startsWith('84')) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      return '+84' + cleaned.substring(1);
    } else {
      return '+84' + cleaned;
    }
  }

  // Mask sensitive data
  static maskEmail(email) {
    const [name, domain] = email.split('@');
    const maskedName = name.charAt(0) + '*'.repeat(Math.max(0, name.length - 2)) + name.charAt(name.length - 1);
    return maskedName + '@' + domain;
  }

  static maskPhone(phone) {
    if (phone.length <= 4) return phone;
    return phone.substring(0, 3) + '*'.repeat(phone.length - 6) + phone.substring(phone.length - 3);
  }
}

module.exports = AuthUtils;