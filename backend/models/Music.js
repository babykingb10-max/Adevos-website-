const mongoose = require('mongoose');

const MusicSchema = new mongoose.Schema(
  {
    tracks: [{ name: String, url: String }],
    autoplay: { type: Boolean, default: false },
    volume: { type: Number, default: 70, min: 0, max: 100 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Music', MusicSchema);
