const accountModel = require('../models/account.model');
const ledgerModel = require('../models/ledger.model');

/**
 * @POST
 * @CONTROLLER create a new bank account
 * @ROUTE /api/accounts/
 */
async function createAccountController(req, res) {
    const { currency } = req.body;
    const account = await accountModel.create({
        user: req.user._id,
        ...(currency && { currency }),
    });

    return res.status(201).json({
        status: 'success',
        data: account,
    });
}

/**
 * @GET
 * @CONTROLLER get all accounts for the logged-in user
 * @ROUTE /api/accounts/
 */
async function getAccountsController(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };

    const [accounts, total] = await Promise.all([
        accountModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        accountModel.countDocuments(filter),
    ]);

    // Attach balance to each account
    const accountsWithBalance = await Promise.all(
        accounts.map(async (account) => {
            const balance = await account.getBalance();
            return { ...account.toObject(), balance };
        })
    );

    return res.status(200).json({
        status: 'success',
        data: accountsWithBalance,
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
 * @CONTROLLER get a single account by ID
 * @ROUTE /api/accounts/:id
 */
async function getAccountByIdController(req, res) {
    const account = await accountModel.findOne({
        _id: req.params.id,
        user: req.user._id,
    });

    if (!account) {
        return res.status(404).json({
            status: 'error',
            message: 'Account not found',
        });
    }

    const balance = await account.getBalance();

    return res.status(200).json({
        status: 'success',
        data: { ...account.toObject(), balance },
    });
}

/**
 * @GET
 * @CONTROLLER get balance for a specific account
 * @ROUTE /api/accounts/:id/balance
 */
async function getAccountBalanceController(req, res) {
    const account = await accountModel.findOne({
        _id: req.params.id,
        user: req.user._id,
    });

    if (!account) {
        return res.status(404).json({
            status: 'error',
            message: 'Account not found',
        });
    }

    const balance = await account.getBalance();

    return res.status(200).json({
        status: 'success',
        data: {
            accountId: account._id,
            currency: account.currency,
            balance,
        },
    });
}

/**
 * @GET
 * @CONTROLLER get ledger entries for a specific account
 * @ROUTE /api/accounts/:id/ledger
 */
async function getAccountLedgerController(req, res) {
    const account = await accountModel.findOne({
        _id: req.params.id,
        user: req.user._id,
    });

    if (!account) {
        return res.status(404).json({
            status: 'error',
            message: 'Account not found',
        });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { account: account._id };

    const [entries, total] = await Promise.all([
        ledgerModel.find(filter)
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit)
            .populate('transaction', 'status amount createdAt'),
        ledgerModel.countDocuments(filter),
    ]);

    return res.status(200).json({
        status: 'success',
        data: entries,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
}

/**
 * @PATCH
 * @CONTROLLER update account status (freeze/close)
 * @ROUTE /api/accounts/:id/status
 */
async function updateAccountStatusController(req, res) {
    const { status } = req.body;

    const account = await accountModel.findOne({
        _id: req.params.id,
        user: req.user._id,
    });

    if (!account) {
        return res.status(404).json({
            status: 'error',
            message: 'Account not found',
        });
    }

    if (account.status === 'CLOSED') {
        return res.status(400).json({
            status: 'error',
            message: 'Cannot modify a closed account',
        });
    }

    if (status === 'CLOSED') {
        const balance = await account.getBalance();
        if (balance !== 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Account balance must be zero before closing',
            });
        }
    }

    account.status = status;
    await account.save();

    return res.status(200).json({
        status: 'success',
        data: account,
    });
}

module.exports = {
    createAccountController,
    getAccountsController,
    getAccountByIdController,
    getAccountBalanceController,
    getAccountLedgerController,
    updateAccountStatusController,
};