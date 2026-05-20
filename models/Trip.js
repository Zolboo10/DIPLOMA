const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    startAddress: {
      type: String,
      required: true
    },

    endAddress: {
      type: String,
      required: true
    },

    startPoint: {
      lat: Number,
      lng: Number,
      address: String
    },

    endPoint: {
      lat: Number,
      lng: Number,
      address: String
    },

    routeGeoJSON: {
      type: Object
    },

    travelMode: {
      type: String,
      enum: ["DRIVING", "WALKING"],
      default: "DRIVING"
    },

    tripDays: {
      type: Number,
      default: 1
    },

    distanceText: String,
    durationText: String,

    distanceValue: Number,
    durationValue: Number,

    routeIndex: {
      type: Number,
      default: 0
    },

    steps: [
      {
        instruction: String,
        distanceText: String,
        durationText: String
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Trip", tripSchema);