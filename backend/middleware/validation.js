const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // LOG CHI TIẾT CÁC LỖI VALIDATION
    console.log('=== VALIDATION ERRORS ===');
    console.log('Endpoint:', req.method, req.path);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Errors:');
    errors.array().forEach((error, index) => {
      console.log(`  ${index + 1}. Field: "${error.path || error.param}"`);
      console.log(`     Message: ${error.msg}`);
      console.log(`     Value: ${JSON.stringify(error.value)}`);
      console.log('---');
    });
    console.log('========================\n');
    
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