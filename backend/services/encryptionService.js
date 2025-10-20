const crypto = require('crypto');

/**
 * Encryption Service
 * Provides AES-256-GCM encryption/decryption for sensitive data
 * 
 * IMPORTANT: 
 * - Set ENCRYPTION_KEY in .env (32 bytes = 64 hex characters)
 * - Generate key: node -e "console.log(crypto.randomBytes(32).toString('hex'))"
 * - NEVER commit encryption key to version control
 * - Rotate keys periodically
 */

class EncryptionService {
  constructor() {
    // Get encryption key from environment variable
    const encryptionKey = process.env.ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      console.error('⚠️  ENCRYPTION_KEY not set in environment variables!');
      console.error('Generate a key with: node -e "console.log(crypto.randomBytes(32).toString(\'hex\'))"');
      throw new Error('ENCRYPTION_KEY is required');
    }

    // Validate key length (must be 32 bytes = 64 hex characters)
    if (encryptionKey.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    }

    this.algorithm = 'aes-256-gcm';
    this.key = Buffer.from(encryptionKey, 'hex');
    this.ivLength = 16; // 128 bits
    this.authTagLength = 16; // 128 bits
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param {string} plaintext - Data to encrypt
   * @returns {string} Encrypted data in format: iv:authTag:ciphertext (hex)
   */
  encrypt(plaintext) {
    if (!plaintext || typeof plaintext !== 'string') {
      return plaintext;
    }

    try {
      // Generate random IV (Initialization Vector)
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      
      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const authTag = cipher.getAuthTag();
      
      // Return format: iv:authTag:ciphertext
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param {string} encryptedData - Data in format: iv:authTag:ciphertext
   * @returns {string} Decrypted plaintext
   */
  decrypt(encryptedData) {
    if (!encryptedData || typeof encryptedData !== 'string') {
      return encryptedData;
    }

    // Check if data is encrypted (has correct format)
    if (!encryptedData.includes(':')) {
      // Data is not encrypted (legacy data)
      return encryptedData;
    }

    try {
      // Parse encrypted data
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const ciphertext = parts[2];
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt data
      let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error.message);
      // Return original data if decryption fails (for backward compatibility)
      return encryptedData;
    }
  }

  /**
   * Hash data using SHA-256 (one-way, cannot be decrypted)
   * Use for data that needs to be searched but not displayed
   * @param {string} data - Data to hash
   * @returns {string} Hashed data (hex)
   */
  hash(data) {
    if (!data || typeof data !== 'string') {
      return data;
    }

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Encrypt multiple fields in an object
   * @param {Object} obj - Object with fields to encrypt
   * @param {Array} fields - Array of field names to encrypt
   * @returns {Object} Object with encrypted fields
   */
  encryptFields(obj, fields) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const result = { ...obj };
    
    fields.forEach(field => {
      if (result[field]) {
        result[field] = this.encrypt(result[field]);
      }
    });

    return result;
  }

  /**
   * Decrypt multiple fields in an object
   * @param {Object} obj - Object with encrypted fields
   * @param {Array} fields - Array of field names to decrypt
   * @returns {Object} Object with decrypted fields
   */
  decryptFields(obj, fields) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const result = { ...obj };
    
    fields.forEach(field => {
      if (result[field]) {
        result[field] = this.decrypt(result[field]);
      }
    });

    return result;
  }

  /**
   * Check if data is encrypted
   * @param {string} data - Data to check
   * @returns {boolean} True if encrypted
   */
  isEncrypted(data) {
    if (!data || typeof data !== 'string') {
      return false;
    }

    // Check format: iv:authTag:ciphertext
    const parts = data.split(':');
    if (parts.length !== 3) {
      return false;
    }

    // Check if parts are valid hex strings
    const hexRegex = /^[0-9a-f]+$/i;
    return parts.every(part => hexRegex.test(part));
  }

  /**
   * Generate a new encryption key (for key rotation)
   * @returns {string} New encryption key (hex)
   */
  static generateKey() {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Export singleton instance
let instance = null;

const getEncryptionService = () => {
  if (!instance) {
    try {
      instance = new EncryptionService();
    } catch (error) {
      console.error('Failed to initialize EncryptionService:', error.message);
      return null;
    }
  }
  return instance;
};

module.exports = {
  EncryptionService,
  getEncryptionService,
  // For testing/development
  generateKey: EncryptionService.generateKey
};
