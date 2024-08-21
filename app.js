const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import CORS middleware
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
const app = express();

app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from 'public'

// Use CORS middleware
app.use(cors({
  origin: 'http://127.0.0.1:5500', // Update with your frontend URL
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type,Authorization'
}));

app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
