const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    const response = ApiResponse.validationError(errorMessages, 'Dữ liệu không hợp lệ');
    return response.send(res);
  }
  
  next();
};

module.exports = {
  handleValidationErrors
};