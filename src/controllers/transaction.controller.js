const transactionModel = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const accountModel = require('../models/account.model');
const emailService = require('../services/email.service');
const mongoose = require('mongoose');

/**
 * @POST
 * @CONTROLLER create a new transaction
 * @ROUTE /api/transactions/
 *
 * Transaction flow:
 * 1. Validate request & check accounts exist
 * 2. Idempotency check
 * 3. Verify accounts are active
 * 4. Verify sufficient balance
 * 5. Execute atomic transaction (debit + credit + ledger entries) inside a MongoDB session
 * 6. Send email notification
 */
async function createTransactionController(req, res) {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if (fromAccount === toAccount) {
        return res.status(400).json({
            status: 'error',
            message: 'Cannot transfer to the same account',
        });
    }

    // Check accounts exist
    const [fromUserAccount, toUserAccount] = await Promise.all([
        accountModel.findById(fromAccount),
        accountModel.findById(toAccount),
    ]);

    if (!fromUserAccount || !toUserAccount) {
        return res.status(404).json({
            status: 'error',
            message: 'Source or destination account not found',
        });
    }

    // Verify the requesting user owns the source account
    if (fromUserAccount.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            status: 'error',
            message: 'You can only initiate transactions from your own account',
        });
    }

    // Idempotency check
    const existingTransaction = await transactionModel.findOne({ idempotencyKey });

    if (existingTransaction) {
        if (existingTransaction.status === 'COMPLETED') {
            return res.status(200).json({
                status: 'success',
                message: 'Transaction already processed',
                transaction: existingTransaction,
            });
        }
        if (existingTransaction.status === 'PENDING') {
            return res.status(202).json({
                status: 'pending',
                message: 'Transaction is still processing',
            });
        }
        // FAILED or REVERSED — let them retry with a new key
        return res.status(409).json({
            status: 'error',
            message: `Previous transaction ${existingTransaction.status.toLowerCase()}. Please use a new idempotency key to retry.`,
        });
    }

    // Verify accounts are active
    if (fromUserAccount.status !== 'ACTIVE' || toUserAccount.status !== 'ACTIVE') {
        return res.status(400).json({
            status: 'error',
            message: 'Both accounts must be ACTIVE to perform a transaction',
        });
    }

    // Verify currency match
    if (fromUserAccount.currency !== toUserAccount.currency) {
        return res.status(400).json({
            status: 'error',
            message: 'Cross-currency transactions are not supported',
        });
    }

    // Check sufficient balance
    const balance = await fromUserAccount.getBalance();
    if (balance < amount) {
        return res.status(400).json({
            status: 'error',
            message: `Insufficient balance. Current balance: ${balance}`,
        });
    }

    // Execute atomic transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const [newTransaction] = await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            status: 'PENDING',
            idempotencyKey,
        }], { session });

        await ledgerModel.create([{
            account: fromAccount,
            amount,
            transaction: newTransaction._id,
            type: 'DEBIT',
        }], { session });

        await ledgerModel.create([{
            account: toAccount,
            amount,
            transaction: newTransaction._id,
            type: 'CREDIT',
        }], { session });

        newTransaction.status = 'COMPLETED';
        await newTransaction.save({ session });

        await session.commitTransaction();

        // Fire-and-forget email notification
        emailService.sendTransactionEmail(
            req.user.email,
            req.user.name,
            amount,
            newTransaction._id
        ).catch(err => console.error('Email notification failed:', err));

        return res.status(201).json({
            status: 'success',
            message: 'Transaction completed successfully',
            transaction: newTransaction,
        });
    } catch (err) {
        await session.abortTransaction();

        // Attempt to mark the transaction as FAILED if it was created
        try {
            await transactionModel.findOneAndUpdate(
                { idempotencyKey, status: 'PENDING' },
                { status: 'FAILED' }
            );
        } catch (_) { /* best effort */ }

        emailService.sendTransactionFailureEmail(
            req.user.email,
            req.user.name,
            amount,
            idempotencyKey
        ).catch(emailErr => console.error('Failure email notification failed:', emailErr));

        throw err;
    } finally {
        session.endSession();
    }
}

/**
 * @GET
 * @CONTROLLER get all transactions for the logged in user's accounts
 * @ROUTE /api/transactions/
 */
async function getTransactionsController(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get all accounts owned by user
    const userAccounts = await accountModel.find({ user: req.user._id }).select('_id');
    const accountIds = userAccounts.map(a => a._id);

    const filter = {
        $or: [
            { fromAccount: { $in: accountIds } },
            { toAccount: { $in: accountIds } },
        ],
    };

    const [transactions, total] = await Promise.all([
        transactionModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('fromAccount', 'currency status')
            .populate('toAccount', 'currency status'),
        transactionModel.countDocuments(filter),
    ]);

    return res.status(200).json({
        status: 'success',
        data: transactions,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
}

/**
 * @GET
 * @CONTROLLER get a single transaction by ID
 * @ROUTE /api/transactions/:id
 */
async function getTransactionByIdController(req, res) {
    const transaction = await transactionModel.findById(req.params.id)
        .populate('fromAccount', 'currency status user')
        .populate('toAccount', 'currency status user');

    if (!transaction) {
        return res.status(404).json({
            status: 'error',
            message: 'Transaction not found',
        });
    }

    // Verify user owns one of the accounts involved
    const userAccounts = await accountModel.find({ user: req.user._id }).select('_id');
    const accountIds = userAccounts.map(a => a._id.toString());

    const isInvolved =
        accountIds.includes(transaction.fromAccount._id.toString()) ||
        accountIds.includes(transaction.toAccount._id.toString());

    if (!isInvolved) {
        return res.status(403).json({
            status: 'error',
            message: 'You do not have access to this transaction',
        });
    }

    return res.status(200).json({
        status: 'success',
        data: transaction,
    });
}

module.exports = {
    createTransactionController,
    getTransactionsController,
    getTransactionByIdController,
};