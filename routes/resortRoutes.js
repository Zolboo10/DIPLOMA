const express = require("express");
const Resort = require("../models/Resort");

const router = express.Router();

function distanceKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) *
    Math.cos(b.lat * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

router.get("/nearby", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius || 50);

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "lat, lng шаардлагатай."
      });
    }

    const resorts = await Resort.find();

    const nearby = resorts
      .map((resort) => {
        const km = distanceKm(
          { lat, lng },
          { lat: resort.location.lat, lng: resort.location.lng }
        );

        return {
          ...resort.toObject(),
          distanceKm: Number(km.toFixed(1))
        };
      })
      .filter((item) => item.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({
      success: true,
      count: nearby.length,
      data: nearby
    });
  } catch (error) {
    console.error("Nearby resorts error:", error);
    res.status(500).json({
      success: false,
      message: "Ойролцоох амралтын газар авахад алдаа гарлаа."
    });
  }
});

module.exports = router;