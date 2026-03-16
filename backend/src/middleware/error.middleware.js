const mongoose = require('mongoose');

function errorHandler(err, req, res, next) {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    const errors = {};

    // Mongoose validation error
    if (err instanceof mongoose.Error.ValidationError) {
        statusCode = 422;
        message = 'Validation Error';
        for (const field in err.errors) {
            errors[field] = err.errors[field].message;
        }
    }

    // Mongoose cast error (invalid ObjectId, etc.)
    if (err instanceof mongoose.Error.CastError) {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    // MongoDB duplicate key error
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue)[0];
        message = `Duplicate value for field: ${field}`;
    }

    const response = {
        status: 'error',
        message,
    };

    if (Object.keys(errors).length > 0) {
        response.errors = errors;
    }

    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
}

module.exports = errorHandler;
