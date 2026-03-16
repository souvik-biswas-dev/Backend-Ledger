const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');

/**
 * Middleware to check validation results and return errors if any
 */
function validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            status: 'error',
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }
    next();
}

const registerValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/\d/).withMessage('Password must contain at least one number')
        .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter'),
    validate,
];

const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required'),
    validate,
];

const createAccountValidation = [
    body('currency')
        .optional()
        .trim()
        .isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter ISO code')
        .isAlpha().withMessage('Currency must only contain letters')
        .toUpperCase(),
    validate,
];

const depositValidation = [
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    validate,
];

const createTransactionValidation = [
    body('fromAccount')
        .notEmpty().withMessage('From account is required')
        .isMongoId().withMessage('Invalid from account ID'),
    body('toAccount')
        .notEmpty().withMessage('To account is required')
        .isMongoId().withMessage('Invalid to account ID'),
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('idempotencyKey')
        .notEmpty().withMessage('Idempotency key is required')
        .isString().withMessage('Idempotency key must be a string')
        .trim(),
    validate,
];

const mongoIdParam = [
    param('id')
        .isMongoId().withMessage('Invalid ID format'),
    validate,
];

const paginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validate,
];

module.exports = {
    validate,
    registerValidation,
    loginValidation,
    createAccountValidation,
    depositValidation,
    createTransactionValidation,
    mongoIdParam,
    paginationValidation,
};
