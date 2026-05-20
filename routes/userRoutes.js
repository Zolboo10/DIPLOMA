const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/save-place/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.savedPlaces.includes(req.params.id)) {
      user.savedPlaces.push(req.params.id);
      await user.save();
    }

    res.json({ success: true, message: 'Хадгаллаа' });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// GET SAVED
router.get('/saved-places', protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate('savedPlaces');

  res.json({
    success: true,
    data: user.savedPlaces
  });
});

module.exports = router;