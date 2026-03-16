const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { registerValidation, loginValidation } = require('../middleware/validation.middleware');

router.post('/register', registerValidation, AuthController.userRegisterContoller);
router.post('/login', loginValidation, AuthController.userLoginController);
router.post('/logout', authMiddleware, AuthController.userLogoutController);
router.get('/me', authMiddleware, AuthController.getMeController);

module.exports = router;