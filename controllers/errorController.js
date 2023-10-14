const AppError = require("../helpers/AppError");

const handleValidatorError = function (error) {
  return `Validation failed: ${error.message}`;
};

const handleValidationCastError = function (error) {
  return `Invalid ${error.path}: ${error.value}`;
};

const handleValidationError = function (error) {
  const failedFields = Object.values(error.errors).map((errObj) => {
    if (errObj.name === "CastError") {
      return handleValidationCastError(errObj);
    } else if (errObj.name === "ValidatorError") {
      return handleValidatorError(errObj);
    }
  });

  return new AppError(failedFields.join(", "), 400);
};

const handleDuplicateKeyError = function (error) {
  const duplicateFieldValue = Object.values(error.keyValue)[0];
  const message = `${duplicateFieldValue} is already in use. Please choose another value`;
  return new AppError(message, 409);
};

const handleReferenceError = function (error) {
  return new AppError(error.message, 400);
};

const handleCastError = function (error) {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400);
};

const handleJWT = function (token) {
  return new AppError(token.message, 403);
};

const globalErrorHandler = function (error, req, res, next) {
  const copiedError = JSON.parse(JSON.stringify(error));
  copiedError.message = error.message;

  let err;

  if (copiedError.name === "ValidationError") {
    err = handleValidationError(copiedError);
  } else if (copiedError.name === "CastError") {
    err = handleCastError(copiedError);
  } else if (copiedError.name === "ReferenceError") {
    err = handleReferenceError(copiedError);
  } else if (copiedError.code === 11000) {
    // Duplicate Field
    err = handleDuplicateKeyError(copiedError);
  } else if (copiedError.name === "JsonWebTokenError") {
    err = handleJWT(copiedError);
  } else if (copiedError.name === "TokenExpiredError") {
    err = handleJWT(copiedError);
  } else {
    // ONLY RUNS WHEN THE ERROR SITUATION HAS ALREADY BEEN HANDLED GRACEFULLY AND A NEW APP ERROR HAS BEEN CREATED
    err = copiedError;
  }
  res.status(err.statusCode).json({ success: false, error: err.message });
};

module.exports = globalErrorHandler;
