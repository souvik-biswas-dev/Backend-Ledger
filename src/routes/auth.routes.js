const express = require('express');
const router = express.Router();
const AuthContoller = require('../controllers/auth.controller')

router.post('/register',AuthContoller.userRegisterContoller);

router.post('/login', AuthContoller.userLoginController);

module.exports = router;