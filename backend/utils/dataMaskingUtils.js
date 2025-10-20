/**
 * Data Masking Utilities
 * Provides functions to mask sensitive data for display purposes
 * 
 * Use these functions when returning data to frontend/API responses
 * to prevent exposing full sensitive information
 */

class DataMaskingUtils {
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

    // Show first 2 characters and last 0 characters of local part
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
      return phone; // Too short to mask meaningfully
    }

    // Show country code (if present) and last 4 digits
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

    // Remove spaces
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
   * Mask address (keep only city/province)
   * Example: 123 Main St, Ward 1, District 2, Ho Chi Minh City -> *** Ho Chi Minh City
   * @param {Object} address - Address object
   * @returns {Object} Masked address object
   */
  static maskAddress(address) {
    if (!address || typeof address !== 'object') {
      return address;
    }

    return {
      street: address.street ? '***' : undefined,
      ward: address.ward ? '***' : undefined,
      district: address.district ? '***' : undefined,
      city: address.city,
      province: address.province,
      country: address.country,
      zipCode: address.zipCode ? '***' : undefined
    };
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
   * Apply masking to user object
   * @param {Object} user - User object
   * @param {Array} fieldsToMask - Fields to mask (default: common sensitive fields)
   * @returns {Object} User object with masked fields
   */
  static maskUserData(user, fieldsToMask = ['phone', 'email', 'dateOfBirth']) {
    if (!user || typeof user !== 'object') {
      return user;
    }

    const masked = { ...user };

    // Mask contact info
    if (masked.contactInfo) {
      if (fieldsToMask.includes('email') && masked.contactInfo.email) {
        masked.contactInfo.email = this.maskEmail(masked.contactInfo.email);
      }
      if (fieldsToMask.includes('phone') && masked.contactInfo.phone) {
        masked.contactInfo.phone = this.maskPhone(masked.contactInfo.phone);
      }
      if (masked.contactInfo.alternatePhone) {
        masked.contactInfo.alternatePhone = this.maskPhone(masked.contactInfo.alternatePhone);
      }
      if (masked.contactInfo.address) {
        masked.contactInfo.address = this.maskAddress(masked.contactInfo.address);
      }
    }

    // Mask personal info
    if (masked.personalInfo) {
      if (fieldsToMask.includes('dateOfBirth') && masked.personalInfo.dateOfBirth) {
        masked.personalInfo.dateOfBirth = this.maskDateOfBirth(masked.personalInfo.dateOfBirth);
      }
    }

    // Mask documents
    if (masked.documents && Array.isArray(masked.documents)) {
      masked.documents = masked.documents.map(doc => ({
        ...doc,
        number: this.maskDocumentNumber(doc.number)
      }));
    }

    return masked;
  }

  /**
   * Apply masking to booking passenger data
   * @param {Object} passenger - Passenger object
   * @returns {Object} Passenger with masked sensitive data
   */
  static maskPassengerData(passenger) {
    if (!passenger || typeof passenger !== 'object') {
      return passenger;
    }

    const masked = { ...passenger };

    // Mask document number
    if (masked.document && masked.document.number) {
      masked.document.number = this.maskDocumentNumber(masked.document.number);
    }

    // Optionally mask date of birth
    if (masked.dateOfBirth) {
      masked.dateOfBirth = this.maskDateOfBirth(masked.dateOfBirth);
    }

    return masked;
  }

  /**
   * Apply masking to payment data
   * @param {Object} payment - Payment object
   * @returns {Object} Payment with masked sensitive data
   */
  static maskPaymentData(payment) {
    if (!payment || typeof payment !== 'object') {
      return payment;
    }

    const masked = { ...payment };

    // Mask card info
    if (masked.paymentMethod && masked.paymentMethod.card) {
      if (masked.paymentMethod.card.holderName) {
        masked.paymentMethod.card.holderName = this.maskName(masked.paymentMethod.card.holderName);
      }
      // last4Digits is already safe to show
    }

    // Mask bank transfer info
    if (masked.paymentMethod && masked.paymentMethod.bankTransfer) {
      if (masked.paymentMethod.bankTransfer.accountNumber) {
        masked.paymentMethod.bankTransfer.accountNumber = this.maskBankAccount(
          masked.paymentMethod.bankTransfer.accountNumber
        );
      }
      if (masked.paymentMethod.bankTransfer.accountHolder) {
        masked.paymentMethod.bankTransfer.accountHolder = this.maskName(
          masked.paymentMethod.bankTransfer.accountHolder
        );
      }
    }

    return masked;
  }

  /**
   * Get last N digits/characters of a string
   * Useful for displaying partial information
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
}

module.exports = DataMaskingUtils;
