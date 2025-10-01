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

module.exports = ApiResponse;