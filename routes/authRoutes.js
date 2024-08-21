const express = require('express');
const { verifyOTP } = require('../controllers/authController');
const router = express.Router();

router.post('/verify-otp', verifyOTP);

module.exports = router;
