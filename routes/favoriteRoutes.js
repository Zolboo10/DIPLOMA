const express = require("express");
const router = express.Router();

const Favorite = require("../models/Favorite");
const { protect } = require('../middleware/auth');

router.get("/my", protect, async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .populate({
        path: "place",
        model: "Location"
      })
      .sort({ createdAt: -1 });

    const filtered = favorites.filter(f => f.place !== null);

    res.json({
      success: true,
      data: filtered
    });

  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({
      success: false,
      message: "Хадгалсан газрууд авахад алдаа гарлаа."
    });
  }
});

router.post("/:placeId", protect, async (req, res) => {
  try {
    const exists = await Favorite.findOne({
      user: req.user._id,
      place: req.params.placeId
    });

    if (exists) {
      return res.json({
        success: true,
        message: "Энэ газар аль хэдийн хадгалагдсан байна."
      });
    }

    const favorite = await Favorite.create({
      user: req.user._id,
      place: req.params.placeId
    });

    res.status(201).json({
      success: true,
      data: favorite
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Газар хадгалахад алдаа гарлаа."
    });
  }
  console.log("USER:", req.user._id);
console.log("PLACE:", req.params.placeId);
});

router.delete("/:placeId", protect, async (req, res) => {
  try {
    await Favorite.findOneAndDelete({
      user: req.user._id,
      place: req.params.placeId
    });

    res.json({
      success: true,
      message: "Хадгалсан газраас устгалаа."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Устгахад алдаа гарлаа."
    });
  }
});

module.exports = router;