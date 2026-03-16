require('dotenv').config();;
const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(cookieParser());

/**
 * -Routes Required
 */
const AuthRouter = require('./routes/auth.routes');
const AccountRouter = require('../src/routes/accounts.routes');

/**
 * -UseRoutes
 */
app.use("/api/auth", AuthRouter);
app.use("/api/accounts", AccountRouter);

module.exports = app;