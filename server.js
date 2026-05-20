const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/MongoloorAylahui';

const tripRoutes = require("./routes/tripRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const resortRoutes = require("./routes/resortRoutes");
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static("public"));


// MongoDB holbolt
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Routes.zam
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/trips', require('./routes/tripRoutes'));
app.use("/api/favorites", favoriteRoutes);
app.use("/api/resorts", resortRoutes);

// Test zam
app.get('/', (req, res) => {
  res.send('Mongol Travel API ажиллаж байна');
});

// 404 handler
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB URI: ${MONGODB_URI}`);
  console.log(`Auth API ready:`);
  console.log(`   POST   http://127.0.0.1:${PORT}/api/auth/register`);
  console.log(`   POST   http://127.0.0.1:${PORT}/api/auth/login`);
  console.log(`   GET    http://127.0.0.1:${PORT}/api/auth/me`);
});