const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: String,
  province: String,
  description: String,
  detailDescription: String,
  location: {
    lat: Number,
    lng: Number
  },
  image: String
});

module.exports = mongoose.model('Location', locationSchema, 'OntslohGazruud');