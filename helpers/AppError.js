class AppError extends Error {
  constructor(errorMessage, errorCode) {
    super(errorMessage);
    this.statusCode = errorCode;
  }
}

module.exports = AppError;
