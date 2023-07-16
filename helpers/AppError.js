class AppError extends Error {
  constructor(errorMessage, errorCode) {
    super(errorMessage);
    this.statusCode = errorCode;
  }
}

// const AppError = function (errorMessage, errorCode) {
//   const error = new Error(errorMessage);
//   error.statusCode = errorCode || 500;
//   return error;
// };

module.exports = AppError;
