const jwt = require('jsonwebtoken');
const config = require('./config');

class JWTService {
  static generateAccessToken(payload) {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRE,
      issuer: 'vietjet-api',
      audience: 'vietjet-client'
    });
  }

  static generateRefreshToken(payload) {
    return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRE,
      issuer: 'vietjet-api',
      audience: 'vietjet-client'
    });
  }

  static generateTokenPair(payload) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    
    return {
      accessToken,
      refreshToken,
      expiresIn: config.JWT_EXPIRE,
      tokenType: 'Bearer'
    };
  }

  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, config.JWT_REFRESH_SECRET);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  static decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = JWTService;