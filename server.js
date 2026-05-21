const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/trips', require('./routes/tripRoutes'));
app.use('/api/favorites', require('./routes/favoriteRoutes'));
app.use('/api/resorts', require('./routes/resortRoutes'));

// Test route
app.get('/', (req, res) => {
  res.send('Mongol Travel API ажиллаж байна');
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route олдсонгүй'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Серверийн алдаа гарлаа'
  });
});

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });

  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });