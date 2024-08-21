import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: 'AIzaSyCVoFT2SyY1C4yYcWTqHGdAm0e-xNNfPlQ',
    authDomain: 'testing.firebaseapp.com',
    projectId: 'testing',
    storageBucket: 'testing.appspot.com',
    messagingSenderId: '247715923077',
    appId: '1:247715923077:web:abc123',
    measurementId: 'G-XYZ123'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize reCAPTCHA
window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
    size: 'invisible',
    callback: (response) => {
        console.log('reCAPTCHA solved');
    },
    'expired-callback': () => {
        console.log('reCAPTCHA expired');
    }
}, auth);

// Event listener for sending OTP
const OTP_REQUEST_LIMIT = 5; // Max requests allowed
const OTP_REQUEST_DELAY = 60 * 1000; // 1 minute in milliseconds

let otpRequestCount = 0;
let lastOtpRequestTime = 0;

document.getElementById('sendOtp').addEventListener('click', function () {
    const phoneNumber = document.getElementById('phoneNumber').value;
    const now = Date.now();

    if (now - lastOtpRequestTime < OTP_REQUEST_DELAY) {
        otpRequestCount++;
    } else {
        otpRequestCount = 1;
        lastOtpRequestTime = now;
    }

    if (otpRequestCount > OTP_REQUEST_LIMIT) {
        alert('Too many requests. Please try again later.');
        return;
    }

    const appVerifier = window.recaptchaVerifier;

    signInWithPhoneNumber(auth, phoneNumber, appVerifier)
        .then(function (confirmationResult) {
            window.confirmationResult = confirmationResult;
            document.getElementById('otpSection').style.display = 'block';
            alert('OTP sent!');
            startCountdownTimer(); // Start the countdown timer
        }).catch(function (error) {
            console.error("Error during OTP sending:", error);
            alert('Error sending OTP: ' + error.message);
        });
});

// Event listener for verifying OTP
document.getElementById('verifyOtp').addEventListener('click', async () => {
    const otpCode = document.getElementById('otpCode').value;

    try {
        const confirmationResult = window.confirmationResult;
        const result = await confirmationResult.confirm(otpCode);
        const user = result.user;
        console.log('User signed in successfully:', user);
        alert('OTP verified successfully!');

        // Handle user.displayName being null
        const userName = user.displayName ? user.displayName.split(' ') : ['Unknown', 'User'];
        const firstName = userName[0];
        const lastName = userName[1] || '';

        // Send user data to backend
        const response = await fetch('http://localhost:3000/auth/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                idToken: await user.getIdToken(),
                userInfo: {
                    firstName: firstName,
                    lastName: lastName,
                    email: user.email,
                    address: {
                        address1: '', // Add relevant address info if available
                        city: '',
                        province: '',
                        country: '',
                        zip: ''
                    }
                }
            })
        });

        const data = await response.json();
        console.log('Backend response:', data);
        if (data.error) {
            alert('Error storing user data in Shopify: ' + data.error);
        } else {
            alert('User data successfully stored in Shopify!');
        }
    } catch (error) {
        console.error("Error during OTP verification:", error);
        alert('Error verifying OTP: ' + error.message);
    }
});

// Function to start the countdown timer
function startCountdownTimer() {
    const countdownDisplay = document.getElementById('countdown');
    const otpSentTime = Date.now();
    const otpExpirationTime = 5 * 60 * 1000; // 5 minutes in milliseconds

    const interval = setInterval(() => {
        const currentTime = Date.now();
        const timeElapsed = currentTime - otpSentTime;
        const timeRemaining = otpExpirationTime - timeElapsed;

        if (timeRemaining <= 0) {
            clearInterval(interval);
            countdownDisplay.textContent = 'OTP expired. Please request a new one.';
            document.getElementById('verifyOtp').disabled = true;
        } else {
            const minutes = Math.floor(timeRemaining / 60000);
            const seconds = Math.floor((timeRemaining % 60000) / 1000);
            countdownDisplay.textContent = `OTP expires in ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
    }, 1000);
}
