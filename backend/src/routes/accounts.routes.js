const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const accountController = require('../controllers/account.controller');
const {
    createAccountValidation,
    mongoIdParam,
    paginationValidation,
    depositValidation,
} = require('../middleware/validation.middleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation.middleware');

// All routes require authentication
router.use(authMiddleware);

router.post('/', createAccountValidation, accountController.createAccountController);
router.post('/:id/deposit', mongoIdParam, depositValidation, accountController.depositController);
router.get('/', paginationValidation, accountController.getAccountsController);
router.get('/:id', mongoIdParam, accountController.getAccountByIdController);
router.get('/:id/balance', mongoIdParam, accountController.getAccountBalanceController);
router.get('/:id/ledger', mongoIdParam, paginationValidation, accountController.getAccountLedgerController);
router.patch('/:id/status', mongoIdParam, [
    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['ACTIVE', 'FROZEN', 'CLOSED']).withMessage('Status must be ACTIVE, FROZEN, or CLOSED'),
    validate,
], accountController.updateAccountStatusController);

module.exports = router;