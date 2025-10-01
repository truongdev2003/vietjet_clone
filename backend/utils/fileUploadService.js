const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const config = require('../config/config');
const { AppError } = require('../utils/errorHandler');

class FileUploadService {
  constructor() {
    this.createUploadDirs();
  }

  // Create upload directories if they don't exist
  createUploadDirs() {
    const dirs = [
      path.join(__dirname, '../uploads'),
      path.join(__dirname, '../uploads/avatars'),
      path.join(__dirname, '../uploads/documents'),
      path.join(__dirname, '../uploads/temp')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // Generate unique filename
  generateFileName(originalName) {
    const ext = path.extname(originalName).toLowerCase();
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}_${hash}${ext}`;
  }

  // Validate file type
  validateFileType(file, allowedTypes) {
    return allowedTypes.includes(file.mimetype);
  }

  // Validate file size
  validateFileSize(file, maxSize) {
    return file.size <= maxSize;
  }

  // Storage configuration for avatars
  getAvatarStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/avatars'));
      },
      filename: (req, file, cb) => {
        const fileName = this.generateFileName(file.originalname);
        cb(null, fileName);
      }
    });
  }

  // Storage configuration for documents
  getDocumentStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/documents'));
      },
      filename: (req, file, cb) => {
        const fileName = this.generateFileName(file.originalname);
        cb(null, fileName);
      }
    });
  }

  // File filter for images
  imageFileFilter(req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (this.validateFileType(file, allowedTypes)) {
      cb(null, true);
    } else {
      cb(new AppError('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)', 400), false);
    }
  }

  // File filter for documents
  documentFileFilter(req, file, cb) {
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (this.validateFileType(file, allowedTypes)) {
      cb(null, true);
    } else {
      cb(new AppError('Chỉ chấp nhận file ảnh, PDF hoặc Word', 400), false);
    }
  }

  // Configure multer for avatar upload
  getAvatarUpload() {
    return multer({
      storage: this.getAvatarStorage(),
      fileFilter: this.imageFileFilter.bind(this),
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
      }
    });
  }

  // Configure multer for document upload
  getDocumentUpload() {
    return multer({
      storage: this.getDocumentStorage(),
      fileFilter: this.documentFileFilter.bind(this),
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
      }
    });
  }

  // Delete file
  deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Get file URL
  getFileUrl(filename, type = 'avatars') {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/uploads/${type}/${filename}`;
  }

  // Middleware to handle multer errors
  handleMulterError(error, req, res, next) {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('File quá lớn', 400));
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return next(new AppError('Quá nhiều file', 400));
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new AppError('Field file không đúng', 400));
      }
    }
    next(error);
  }

  // Clean up old files (run periodically)
  cleanupOldFiles(directory, maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const dirPath = path.join(__dirname, '../uploads', directory);
    
    if (!fs.existsSync(dirPath)) return;

    fs.readdir(dirPath, (err, files) => {
      if (err) return;

      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return;

          const now = new Date().getTime();
          const fileTime = new Date(stats.ctime).getTime();
          
          if (now - fileTime > maxAge) {
            this.deleteFile(filePath);
          }
        });
      });
    });
  }

  // Get file info
  getFileInfo(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      return {
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        extension: ext,
        mimetype: this.getMimeType(ext)
      };
    } catch (error) {
      return null;
    }
  }

  // Get MIME type from extension
  getMimeType(ext) {
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  // Resize image (requires sharp package)
  async resizeImage(inputPath, outputPath, width, height) {
    try {
      const sharp = require('sharp');
      await sharp(inputPath)
        .resize(width, height, { 
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 90 })
        .toFile(outputPath);
      
      return true;
    } catch (error) {
      console.error('Error resizing image:', error);
      return false;
    }
  }

  // Create avatar thumbnails
  async createAvatarThumbnails(originalPath, filename) {
    const nameWithoutExt = path.parse(filename).name;
    const uploadsDir = path.join(__dirname, '../uploads/avatars');
    
    const thumbnails = {
      small: { width: 50, height: 50 },
      medium: { width: 150, height: 150 },
      large: { width: 300, height: 300 }
    };

    const results = {};

    for (const [size, dimensions] of Object.entries(thumbnails)) {
      const thumbnailName = `${nameWithoutExt}_${size}.jpg`;
      const thumbnailPath = path.join(uploadsDir, thumbnailName);
      
      const success = await this.resizeImage(
        originalPath,
        thumbnailPath,
        dimensions.width,
        dimensions.height
      );
      
      if (success) {
        results[size] = thumbnailName;
      }
    }

    return results;
  }
}

// Export singleton instance
module.exports = new FileUploadService();