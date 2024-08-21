const { auth } = require('../config/firebase');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const shopifyAdminAPI = `https://${process.env.SHOPIFY_API_KEY}:${process.env.SHOPIFY_PASSWORD}@${process.env.SHOPIFY_STORE_NAME}.myshopify.com/admin/api/2024-01/customers.json`;

// Verify OTP and register/login
exports.verifyOTP = async (req, res) => {
  const { idToken, userInfo } = req.body;

  try {
    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);

    // Prepare data to send to Shopify
    const customerData = {
      customer: {
        first_name: userInfo.firstName,
        last_name: userInfo.lastName,
        email: userInfo.email,
        phone: decodedToken.phone_number,
        verified_email: true,
        addresses: [userInfo.address],
      },
    };

    // Send data to Shopify
    const shopifyResponse = await axios.post(shopifyAdminAPI, customerData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Respond to the client
    res.json({
      message: 'User successfully registered/login',
      shopifyData: shopifyResponse.data,
    });
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    res.status(400).json({ error: error.message });
  }
};
