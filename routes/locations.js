const express = require('express');
const router = express.Router();
const Location = require('../models/Location');

router.get('/', async (req, res) => {
  try {
    const locations = await Location.find();

    console.log('GET / - Өгөгдлийн тоо:', locations.length);

    res.json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (err) {
    console.error('GET / алдаа:', err);
    res.status(500).json({
      success: false,
      message: 'Локац уншихад алдаа гарлаа'
    });
  }
});

router.get('/provinces', async (req, res) => {
  try {
    const provinces = await Location.distinct('province');
    res.json({
      success: true,
      data: provinces
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const total = await Location.countDocuments();
    const provinces = await Location.distinct('province');

    const allLocations = await Location.find();
    let natureCount = 0;
    let historyCount = 0;

    allLocations.forEach((loc) => {
      const name = (loc.name || '').toLowerCase();
      if (name.includes('хийд')) historyCount++;
      else natureCount++;
    });

    res.json({
      success: true,
      data: {
        total,
        provinces: provinces.length,
        nature: natureCount,
        history: historyCount
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Локац олдсонгүй'
      });
    }

    res.json({
      success: true,
      data: location
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;