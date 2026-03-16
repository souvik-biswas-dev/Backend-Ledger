const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const transactionController = require('../controllers/transaction.controller');
const {
    createTransactionValidation,
    mongoIdParam,
    paginationValidation,
} = require('../middleware/validation.middleware');

const transactionRoutes = Router();

// All routes require authentication
transactionRoutes.use(authMiddleware);

transactionRoutes.post('/', createTransactionValidation, transactionController.createTransactionController);
transactionRoutes.get('/', paginationValidation, transactionController.getTransactionsController);
transactionRoutes.get('/:id', mongoIdParam, transactionController.getTransactionByIdController);

module.exports = transactionRoutes;
