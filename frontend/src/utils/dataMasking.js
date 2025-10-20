/**
 * Data Masking Utilities for Frontend
 * Provides functions to mask sensitive data for display purposes
 * 
 * Use these functions when displaying sensitive information to users
 * to protect privacy and comply with data protection regulations
 */

export class DataMaskingUtils {
  /**
   * Mask email address
   * Example: john.doe@example.com -> jo*****@example.com
   * @param {string} email - Email to mask
   * @returns {string} Masked email
   */
  static maskEmail(email) {
    if (!email || typeof email !== 'string') {
      return email;
    }

    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) {
      return email;
    }

    // Show first 2 characters
    const visibleChars = Math.min(2, localPart.length);
    const masked = localPart.substring(0, visibleChars) + '*****';
    
    return `${masked}@${domain}`;
  }

  /**
   * Mask phone number
   * Example: +84901234567 -> +84 *** *** 4567
   * Example: 0901234567 -> 090 *** **67
   * @param {string} phone - Phone number to mask
   * @returns {string} Masked phone number
   */
  static maskPhone(phone) {
    if (!phone || typeof phone !== 'string') {
      return phone;
    }

    // Remove spaces and special characters
    const cleaned = phone.replace(/[\s\-()]/g, '');
    
    if (cleaned.length < 8) {
      return phone;
    }

    let masked;
    
    if (cleaned.startsWith('+84')) {
      // International format
      const last4 = cleaned.slice(-4);
      masked = `+84 *** *** ${last4}`;
    } else if (cleaned.startsWith('84')) {
      // Without +
      const last4 = cleaned.slice(-4);
      masked = `84 *** *** ${last4}`;
    } else if (cleaned.startsWith('0')) {
      // Local format
      const prefix = cleaned.substring(0, 3);
      const last2 = cleaned.slice(-2);
      masked = `${prefix} *** **${last2}`;
    } else {
      // Default: show first 3 and last 4
      const prefix = cleaned.substring(0, 3);
      const last4 = cleaned.slice(-4);
      masked = `${prefix} *** ${last4}`;
    }

    return masked;
  }

  /**
   * Mask passport/ID number
   * Example: A12345678 -> A*****678
   * Example: 123456789012 -> ******9012
   * @param {string} documentNumber - Document number to mask
   * @param {number} lastDigits - Number of last digits to show (default: 4)
   * @returns {string} Masked document number
   */
  static maskDocumentNumber(documentNumber, lastDigits = 4) {
    if (!documentNumber || typeof documentNumber !== 'string') {
      return documentNumber;
    }

    if (documentNumber.length <= lastDigits) {
      return '*'.repeat(documentNumber.length);
    }

    const visiblePart = documentNumber.slice(-lastDigits);
    const maskedPart = '*'.repeat(documentNumber.length - lastDigits);
    
    return maskedPart + visiblePart;
  }

  /**
   * Mask credit card number
   * Example: 4111111111111111 -> **** **** **** 1111
   * @param {string} cardNumber - Card number to mask
   * @returns {string} Masked card number
   */
  static maskCardNumber(cardNumber) {
    if (!cardNumber || typeof cardNumber !== 'string') {
      return cardNumber;
    }

    const cleaned = cardNumber.replace(/\s/g, '');
    
    if (cleaned.length < 12) {
      return '**** **** ****';
    }

    const last4 = cleaned.slice(-4);
    return `**** **** **** ${last4}`;
  }

  /**
   * Mask name (for privacy)
   * Example: John Michael Doe -> John M*** D**
   * @param {string} fullName - Full name to mask
   * @returns {string} Masked name
   */
  static maskName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
      return fullName;
    }

    const parts = fullName.trim().split(/\s+/);
    
    if (parts.length === 1) {
      // Single name
      return parts[0].charAt(0) + '*'.repeat(Math.max(0, parts[0].length - 1));
    }

    // Keep first name, mask middle and last names
    const masked = parts.map((part, index) => {
      if (index === 0) {
        return part; // Keep first name
      } else {
        return part.charAt(0) + '*'.repeat(Math.max(0, part.length - 1));
      }
    });

    return masked.join(' ');
  }

  /**
   * Mask date of birth (show only year)
   * Example: 1990-05-15 -> 1990-**-**
   * @param {Date|string} dob - Date of birth
   * @returns {string} Masked date
   */
  static maskDateOfBirth(dob) {
    if (!dob) {
      return dob;
    }

    const date = new Date(dob);
    if (isNaN(date.getTime())) {
      return dob;
    }

    return `${date.getFullYear()}-**-**`;
  }

  /**
   * Mask bank account number
   * Example: 1234567890 -> ******7890
   * @param {string} accountNumber - Bank account number
   * @returns {string} Masked account number
   */
  static maskBankAccount(accountNumber) {
    if (!accountNumber || typeof accountNumber !== 'string') {
      return accountNumber;
    }

    if (accountNumber.length <= 4) {
      return '*'.repeat(accountNumber.length);
    }

    const last4 = accountNumber.slice(-4);
    return '*'.repeat(accountNumber.length - 4) + last4;
  }

  /**
   * Get display-friendly masked phone
   * @param {string} phone - Phone number
   * @returns {string} Masked phone with icon
   */
  static getDisplayPhone(phone) {
    return `📱 ${this.maskPhone(phone)}`;
  }

  /**
   * Get display-friendly masked email
   * @param {string} email - Email address
   * @returns {string} Masked email with icon
   */
  static getDisplayEmail(email) {
    return `📧 ${this.maskEmail(email)}`;
  }

  /**
   * Get last N digits/characters of a string
   * @param {string} value - Value to get last digits from
   * @param {number} count - Number of digits to show
   * @returns {string} Last N characters
   */
  static getLastDigits(value, count = 4) {
    if (!value || typeof value !== 'string') {
      return '';
    }

    return value.slice(-count);
  }

  /**
   * Check if data appears to be masked
   * @param {string} value - Value to check
   * @returns {boolean} True if appears masked
   */
  static isMasked(value) {
    if (!value || typeof value !== 'string') {
      return false;
    }
    return value.includes('*') || value.includes('***');
  }

  /**
   * Format phone number for display (with proper spacing)
   * @param {string} phone - Phone number
   * @param {boolean} mask - Whether to mask (default: false)
   * @returns {string} Formatted phone
   */
  static formatPhoneDisplay(phone, mask = false) {
    if (!phone) return '';
    
    if (mask) {
      return this.maskPhone(phone);
    }

    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('84')) {
      // +84 format
      const match = cleaned.match(/^(84)(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
      }
    } else if (cleaned.startsWith('0')) {
      // 0xxx format
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        return `${match[1]} ${match[2]} ${match[3]}`;
      }
    }
    
    return phone;
  }

  /**
   * Format card number for display
   * @param {string} cardNumber - Card number
   * @param {boolean} mask - Whether to mask (default: true)
   * @returns {string} Formatted card number
   */
  static formatCardDisplay(cardNumber, mask = true) {
    if (!cardNumber) return '';
    
    if (mask) {
      return this.maskCardNumber(cardNumber);
    }

    const cleaned = cardNumber.replace(/\s/g, '');
    return cleaned.match(/.{1,4}/g)?.join(' ') || cardNumber;
  }
}

// Default export
export default DataMaskingUtils;

// Named exports for convenience
export const {
  maskEmail,
  maskPhone,
  maskDocumentNumber,
  maskCardNumber,
  maskName,
  maskDateOfBirth,
  maskBankAccount,
  getDisplayPhone,
  getDisplayEmail,
  getLastDigits,
  isMasked,
  formatPhoneDisplay,
  formatCardDisplay
} = DataMaskingUtils;
