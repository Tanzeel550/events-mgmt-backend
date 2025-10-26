const express = require('express');
const {
	signup,
	login,
	secure,
	getMe,
} = require('../controllers/authController');

const router = express.Router();

router.post('/signup', signup);

router.post('/login', login);

router.get('/me', secure, getMe);

module.exports = router;
