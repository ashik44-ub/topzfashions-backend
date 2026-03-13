const mongoose = require('mongoose');

const TimerSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "March Madness 2026",
  },
  endDate: {
    type: Date,
    required: true,
  },
  discountPercentage: {
    type: Number,
    default: 50,
  },
  image: { // ইমেজ লিঙ্ক সেভ করার ফিল্ড
    type: String,
    default: "", 
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Timer', TimerSchema);