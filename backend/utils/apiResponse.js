class ApiResponse {
  constructor(success = true, message = '', data = null, statusCode = 200) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }

  static success(data = null, message = 'Success', statusCode = 200) {
    return new ApiResponse(true, message, data, statusCode);
  }

  static error(message = 'Error', statusCode = 400, data = null) {
    return new ApiResponse(false, message, data, statusCode);
  }

  static created(data = null, message = 'Created successfully') {
    return new ApiResponse(true, message, data, 201);
  }

  static notFound(message = 'Resource not found') {
    return new ApiResponse(false, message, null, 404);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiResponse(false, message, null, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiResponse(false, message, null, 403);
  }

  static validationError(errors, message = 'Validation failed') {
    return new ApiResponse(false, message, { errors }, 422);
  }

  static serverError(message = 'Internal server error') {
    return new ApiResponse(false, message, null, 500);
  }

  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
      timestamp: this.timestamp
    });
  }
}

// Helper functions for easier usage
const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  return ApiResponse.success(data, message, statusCode).send(res);
};

const errorResponse = (res, message = 'Error', statusCode = 400, data = null) => {
  return ApiResponse.error(message, statusCode, data).send(res);
};

const createdResponse = (res, data = null, message = 'Created successfully') => {
  return ApiResponse.created(data, message).send(res);
};

const notFoundResponse = (res, message = 'Resource not found') => {
  return ApiResponse.notFound(message).send(res);
};

const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return ApiResponse.unauthorized(message).send(res);
};

const forbiddenResponse = (res, message = 'Forbidden') => {
  return ApiResponse.forbidden(message).send(res);
};

const validationErrorResponse = (res, errors, message = 'Validation failed') => {
  return ApiResponse.validationError(errors, message).send(res);
};

const serverErrorResponse = (res, message = 'Internal server error') => {
  return ApiResponse.serverError(message).send(res);
};

module.exports = ApiResponse;
module.exports.successResponse = successResponse;
module.exports.errorResponse = errorResponse;
module.exports.createdResponse = createdResponse;
module.exports.notFoundResponse = notFoundResponse;
module.exports.unauthorizedResponse = unauthorizedResponse;
module.exports.forbiddenResponse = forbiddenResponse;
module.exports.validationErrorResponse = validationErrorResponse;
module.exports.serverErrorResponse = serverErrorResponse;