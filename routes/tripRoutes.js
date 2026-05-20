const express = require("express");
const mongoose = require("mongoose");
const Trip = require("../models/Trip");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET /api/trips/my-trips
router.get("/my-trips", protect, async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    console.error("My trips error:", error);
    return res.status(500).json({
      success: false,
      message: "Аяллын мэдээлэл авахад алдаа гарлаа"
    });
  }
});

// GET /api/trips/my
router.get("/my", protect, async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    console.error("My trips error:", error);
    return res.status(500).json({
      success: false,
      message: "Аяллын мэдээлэл авахад алдаа гарлаа"
    });
  }
});

// POST /api/trips
router.post("/", protect, async (req, res) => {
  try {
    const {
      startAddress,
      endAddress,
      startPoint,
      endPoint,
      routeGeoJSON,
      travelMode,
      tripDays,
      distanceText,
      durationText,
      distanceValue,
      durationValue,
      routeIndex,
      steps
    } = req.body;

    if (!startAddress || !endAddress || !travelMode) {
      return res.status(400).json({
        success: false,
        message: "Эхлэх цэг, очих цэг болон аяллын төрөл шаардлагатай"
      });
    }

    const trip = await Trip.create({
      user: req.user._id,
      startAddress: startAddress.trim(),
      endAddress: endAddress.trim(),
      startPoint: startPoint || null,
      endPoint: endPoint || null,
      routeGeoJSON: routeGeoJSON || null,
      travelMode,
      tripDays: Number(tripDays || 1),
      distanceText: distanceText || "",
      durationText: durationText || "",
      distanceValue: Number(distanceValue || 0),
      durationValue: Number(durationValue || 0),
      routeIndex: Number(routeIndex || 0),
      steps: Array.isArray(steps) ? steps : []
    });

    return res.status(201).json({
      success: true,
      message: "Аялал амжилттай хадгалагдлаа",
      data: trip
    });
  } catch (error) {
    console.error("Save trip error:", error);
    return res.status(500).json({
      success: false,
      message: "Аялал хадгалахад алдаа гарлаа"
    });
  }
});

// GET /api/trips/:id
router.get("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Аяллын ID буруу байна"
      });
    }

    const trip = await Trip.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Аялал олдсонгүй"
      });
    }

    return res.status(200).json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error("Get trip error:", error);
    return res.status(500).json({
      success: false,
      message: "Серверийн алдаа"
    });
  }
});

// DELETE /api/trips/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Аяллын ID буруу байна"
      });
    }

    const trip = await Trip.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Аялал олдсонгүй"
      });
    }

    await Trip.deleteOne({ _id: trip._id });

    return res.status(200).json({
      success: true,
      message: "Аялал устгагдлаа"
    });
  } catch (error) {
    console.error("Delete trip error:", error);
    return res.status(500).json({
      success: false,
      message: "Аялал устгахад алдаа гарлаа"
    });
  }
});

module.exports = router;