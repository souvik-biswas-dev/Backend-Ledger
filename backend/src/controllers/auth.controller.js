const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const emailService = require('../services/email.service');

/**
 * @POST
 * @CONTROLLER user register controller
 * @ROUTE /api/auth/register
 */
async function userRegisterContoller(req, res) {
    const { email, password, name } = req.body;

    const isExists = await userModel.findOne({ email });
    if (isExists) {
        return res.status(409).json({
            status: 'error',
            message: 'User already exists with this email',
        });
    }

    const user = await userModel.create({ email, name, password });

    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '3d' }
    );

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    });

    res.status(201).json({
        status: 'success',
        user: {
            _id: user._id,
            email: user.email,
            name: user.name,
        },
        token,
    });

    // Fire-and-forget email
    emailService.sendRegisterEmail(user.email, user.name)
        .catch(err => console.error('Registration email failed:', err));
}

/**
 * @POST
 * @CONTROLLER user login controller
 * @ROUTE /api/auth/login
 */
async function userLoginController(req, res) {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email }).select('+password');

    if (!user) {
        return res.status(401).json({
            status: 'error',
            message: 'Incorrect email or password',
        });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
        return res.status(401).json({
            status: 'error',
            message: 'Incorrect email or password',
        });
    }

    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '3d' }
    );

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
        status: 'success',
        user: {
            _id: user._id,
            email: user.email,
            name: user.name,
        },
        token,
    });
}

/**
 * @POST
 * @CONTROLLER user logout controller
 * @ROUTE /api/auth/logout
 */
async function userLogoutController(req, res) {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });

    return res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
    });
}

/**
 * @GET
 * @CONTROLLER get current user profile
 * @ROUTE /api/auth/me
 */
async function getMeController(req, res) {
    return res.status(200).json({
        status: 'success',
        user: {
            _id: req.user._id,
            email: req.user.email,
            name: req.user.name,
            createdAt: req.user.createdAt,
        },
    });
}

module.exports = {
    userRegisterContoller,
    userLoginController,
    userLogoutController,
    getMeController,
};