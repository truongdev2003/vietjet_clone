const JWTService = require('../config/jwt');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const { AppError } = require('../utils/errorHandler');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = JWTService.extractTokenFromHeader(req.headers.authorization);
    }

    if (!token) {
      const response = ApiResponse.unauthorized('Bạn cần đăng nhập để truy cập');
      return response.send(res);
    }

    try {
      const decoded = JWTService.verifyAccessToken(token);
      
      const currentUser = await User.findById(decoded.userId);
      if (!currentUser) {
        const response = ApiResponse.unauthorized('Người dùng không tồn tại');
        return response.send(res);
      }

      if (currentUser.status !== 'active') {
        const response = ApiResponse.unauthorized('Tài khoản không hoạt động');
        return response.send(res);
      }

      if (currentUser.isLocked) {
        const response = ApiResponse.forbidden('Tài khoản đã bị khóa');
        return response.send(res);
      }

      req.user = decoded;
      req.currentUser = currentUser;
      next();
    } catch (error) {
      const response = ApiResponse.unauthorized('Token không hợp lệ hoặc đã hết hạn');
      return response.send(res);
    }
  } catch (error) {
    const response = ApiResponse.serverError('Lỗi xác thực');
    return response.send(res);
  }
};

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Không có token, quyền truy cập bị từ chối' });
    }

    const decoded = JWTService.verifyAccessToken(token);
    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = JWTService.extractTokenFromHeader(req.headers.authorization);
    }

    if (!token) {
      return next();
    }

    try {
      const decoded = JWTService.verifyAccessToken(token);
      
      const currentUser = await User.findById(decoded.userId);
      if (currentUser && currentUser.status === 'active' && !currentUser.isLocked) {
        req.user = decoded;
        req.currentUser = currentUser;
      }
    } catch (error) {
      console.log('Invalid token in optional auth:', error.message);
    }

    next();
  } catch (error) {
    next();
  }
};

const requireEmailVerification = (req, res, next) => {
  if (!req.user || !req.user.isEmailVerified) {
    const response = ApiResponse.forbidden('Vui lòng xác thực email để tiếp tục');
    return response.send(res);
  }
  next();
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      const response = ApiResponse.unauthorized('Bạn cần đăng nhập để truy cập');
      return response.send(res);
    }

    if (!req.currentUser) {
      const response = ApiResponse.unauthorized('Thông tin người dùng không hợp lệ');
      return response.send(res);
    }

    if (roles.length > 0 && !roles.includes(req.currentUser.role)) {
      const response = ApiResponse.forbidden('Bạn không có quyền truy cập chức năng này');
      return response.send(res);
    }

    next();
  };
};

const authenticate = protect;

module.exports = {
  protect,
  auth,
  authenticate,
  optionalAuth,
  requireEmailVerification,
  authorize
};