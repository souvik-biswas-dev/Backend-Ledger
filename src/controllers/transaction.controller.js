const transactionModel = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const accountModel = require('../models/account.model');
const emailService = require('../services/email.service');
const mongoose = require('mongoose');

/**
 * - Create a new transaction
 * transaction flow:
 * 1. validate the request body
 * 2. check if the from account and to account exist
 * 3. validate the idempotency key to prevent duplicate transactions
 * 4. check account status to ensure they are active
 * 5. check if the from account has sufficient balance
 * 6. create a new transaction with status pending
 * 7. create debit entry in the from account ledger
 * 8. create credit entry in the to account ledger
 * 9. update the transaction status to completed
 * 10. commit mongoDB session to save all the changes in the database
 * 11. send an email notification to both accounts about the transaction status
 * 12. return the transaction details in the response
 */
async function createTransaction(req, res){

    /**
     * 1.validate the request body
     */
    const { fromAccount, toAccount, amount, idempodencyKey } = req.body();

    if(!fromAccount || !toAccount || !amount || !idempodencyKey){
        return res.status(400).json({ message: 'from account, to account, amount, and idempodencyKey are required' });
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
    });
    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    });

    /**
     * 2.Check if the from account and to account exist
     */

    if(!fromUserAccount || !toUserAccount){
        return res.status(404).json({ message: 'from account or to account not found' });
    }

    /**
     * 3.Validate the idempotency key to prevent duplicate transactions
     */

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempodencyKey: idempodencyKey
    })

    if(isTransactionAlreadyExists){
        if(isTransactionAlreadyExists.status === "COMPLETED"){
            return res.status(200).json({
                message: "Transaction Already Proccessed",
                transaction: isTransactionAlreadyExists
            })
        }
        if(isTransactionAlreadyExists.status === "PENDING"){
            return res.status(200).json({
                message: "Transaction Still Processing",

            })
        }
        if(isTransactionAlreadyExists.status === "FAILED"){
            return res.status(500).json({
                message: "Transaction Processing failed, please retry"
            })
        }
        if(isTransactionAlreadyExists.status === "REVERSED"){
            return res.status(500).json({
                message: "Transaction was reversed, please retry"
            })
        }

    }

    /**
     * 4.Check account status to ensure they are active
     */
    
    if(fromUserAccount.status !== 'ACTIVE' || toUserAccount.status !== 'ACTIVE'){
        return res.status(400).json({ message: 'from account or to account is not active' });
    }


    /**
     * 5.Check if the from account has sufficient balance
     */
    const balance = await fromUserAccount.getBalance();
    if(balance < amount){
        return res.status(400).json({ message: `Insufficient balance. Current balance: ${balance}` });
    }

    /**
     * 6.Create a new transaction with status pending
     */

    const session = await mongoose.startSession();
    session.startTransaction(); //complete all operations in the transaction, if any operation fails, the whole transaction will be rolled back
    const newTransaction = await transactionModel.create({
        fromAccount,
        toAccount,
        amount,
        status: 'PENDING',
        idempodencyKey,
    },{ session });

    /**
     * 7.Create debit entry in the from account ledger
     */

    const debitLedgerEntry = await ledgerModel.create({
        account: fromAccount,
        amount: amount,
        transaction: newTransaction._id,
        type: 'DEBIT',
    }, { session });

    /**
     * 8.create credit entry in the to account ledger
     */

    const creditLedgerEntry = await ledgerModel.create({
        account: toAccount,
        amount: amount,
        transaction: newTransaction._id,
        type: 'CREDIT',
    }, { session });

    /**
     * 9.Update the transaction status to completed
     */

    newTransaction.status = 'COMPLETED';
    await newTransaction.save({ session });

    /**
     * 10.Commit mongoDB session to save all the changes in the database
     */

    await session.commitTransaction();
    session.endSession();

    /**
     * 11.Send an email notification to both accounts about the transaction status
     */

    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount, newTransaction._id);

    /**
     * 12.Return the transaction details in the response
     */

    return res.status(201).json(
        {   message: 'Transaction successful',
            transaction: newTransaction });

}

module.exports = {
    createTransaction
}