const AppError = require('../utils/appError');

const JWTInvalidError = () => {
  return new AppError("Invalid token, please try logging in again", 401);
};

const JWTExpireError = () => {
  return new AppError("Expired token, please try logging in again", 401);
};

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = Object.values(err.keyValue)[0];
  const ErrorObj = Object.keys(err.keyPattern);
  const message = `Duplicate field ${ErrorObj[0]} with value: ${value}. Please use another value.`;
  return new AppError(message, 400, ErrorObj[0], "Duplicate");
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400, errors.join('. '), "Required");
};

const handleStripeError = err => {
  if (err.code === 'amount_too_small') {
    return new AppError("Sorry, the total amount must be at least 50 cents. Please adjust your order.", 400, "line_items[0][price_data][unit_amount]", "InvalidAmount");
  }

  // Handle other Stripe errors as needed

  // Fallback for unknown errors
  return new AppError("Can't process payment at this moment, please try again later", 500, "payment", "Issue");
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errorType: err.type,
      field: err.field,
    });
  } else {
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
};

exports.globalErrorController = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error._message === 'User validation failed') error = handleValidationErrorDB(error);
    if (error._message === 'Order validation failed') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = JWTInvalidError();
    if (error.name === 'TokenExpiredError') error = JWTExpireError();

    // Handle Stripe errors
    if (error.raw && error.raw.code) {
      error = handleStripeError(error.raw);
    }

    sendErrorProd(error, res);
  }
};
