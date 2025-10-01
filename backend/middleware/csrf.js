const csrf = require('csurf');
const { v4: uuidv4 } = require('uuid');
const { securityLogger } = require('./security');
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  value: (req) => {
    return req.body._csrf || 
           req.query._csrf || 
           req.headers['csrf-token'] ||
           req.headers['xsrf-token'] ||
           req.headers['x-csrf-token'] ||
           req.headers['x-xsrf-token'];
  }
});
const generateCSRFToken = (req, res, next) => {
  try {
    if (!req.csrfToken) {
      return res.status(500).json({
        error: 'CSRF token không thể tạo'
      });
    }
    
    const token = req.csrfToken();
    res.locals.csrfToken = token;
    
    res.setHeader('X-CSRF-Token', token);
    
    next();
  } catch (error) {
    securityLogger.error('CSRF token generation failed', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error: error.message
    });
    res.status(500).json({
      error: 'Lỗi bảo mật. Vui lòng thử lại.'
    });
  }
};
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    securityLogger.warn('CSRF token validation failed', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
      providedToken: req.body._csrf || req.headers['csrf-token'] || 'none'
    });
    
    return res.status(403).json({
      error: 'Token bảo mật không hợp lệ. Vui lòng làm mới trang.',
      code: 'INVALID_CSRF_TOKEN'
    });
  }
  next(err);
};
const doubleSubmitCookie = {
  generate: (req, res, next) => {
    const token = uuidv4();
    
    res.cookie('csrf-token', token, {
      httpOnly: false,  
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000  
    });
    
    res.setHeader('X-CSRF-Token', token);
    res.locals.csrfToken = token;
    
    next();
  },
  
  verify: (req, res, next) => {
    const cookieToken = req.cookies['csrf-token'];
    const headerToken = req.headers['x-csrf-token'] || 
                       req.headers['csrf-token'] ||
                       req.body._csrf;
    
    if (!cookieToken) {
      securityLogger.warn('Missing CSRF cookie', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl
      });
      return res.status(403).json({
        error: 'Token bảo mật bị thiếu. Vui lòng làm mới trang.',
        code: 'MISSING_CSRF_COOKIE'
      });
    }
    
    if (!headerToken) {
      securityLogger.warn('Missing CSRF header token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl
      });
      return res.status(403).json({
        error: 'Token bảo mật bị thiếu. Vui lòng làm mới trang.',
        code: 'MISSING_CSRF_HEADER'
      });
    }
    
    if (cookieToken !== headerToken) {
      securityLogger.warn('CSRF token mismatch', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        cookieToken: cookieToken.substring(0, 8) + '...',
        headerToken: headerToken.substring(0, 8) + '...'
      });
      return res.status(403).json({
        error: 'Token bảo mật không khớp. Vui lòng làm mới trang.',
        code: 'CSRF_TOKEN_MISMATCH'
      });
    }
    
    next();
  }
};
const configureSameSiteCookies = (req, res, next) => {
  const originalCookie = res.cookie;
  
  res.cookie = function(name, value, options = {}) {
    const secureOptions = {
      ...options,
      httpOnly: options.httpOnly !== false,  
      secure: process.env.NODE_ENV === 'production',
      sameSite: options.sameSite || 'strict'
    };
    
    return originalCookie.call(this, name, value, secureOptions);
  };
  
  next();
};
const getCSRFToken = (req, res) => {
  try {
    let token;
    
    if (req.csrfToken) {
      token = req.csrfToken();
    } else {
      token = uuidv4();
      res.cookie('csrf-token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000
      });
    }
    
    res.json({
      success: true,
      csrfToken: token,
      message: 'CSRF token generated successfully'
    });
  } catch (error) {
    securityLogger.error('Failed to generate CSRF token', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error: error.message
    });
    
    res.status(500).json({
      error: 'Không thể tạo token bảo mật'
    });
  }
};
const conditionalCSRF = (skipRoutes = []) => {
  return (req, res, next) => {
    const shouldSkip = skipRoutes.some(route => {
      if (typeof route === 'string') {
        return req.path === route;
      } else if (route instanceof RegExp) {
        return route.test(req.path);
      }
      return false;
    });
    
    if (shouldSkip) {
      return next();
    }
    
    return csrfProtection(req, res, next);
  };
};

module.exports = {
  csrfProtection,
  generateCSRFToken,
  csrfErrorHandler,
  doubleSubmitCookie,
  configureSameSiteCookies,
  getCSRFToken,
  conditionalCSRF
};