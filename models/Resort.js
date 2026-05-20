const mongoose = require("mongoose");

const resortSchema = new mongoose.Schema({
  name: String,
  province: String,
  type: {
    type: String,
    enum: ["Жуулчны бааз", "Амралтын газар"],
    default: "Амралтын газар"
  },
  description: String,
  location: {
    lat: Number,
    lng: Number
  },
  image: String,
  phone: String,
  price: String
}, { timestamps: true });

module.exports = mongoose.model("Resort", resortSchema, "resorts");