const mongoose = require('mongoose');

const caregiverSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  education: String,
  experienceYears: Number,
  specialization: [String],
  certifications: [String],

  availability: String,
  expectedSalary: Number,

  linkedinUrl: String,

  verified: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('CaregiverProfile', caregiverSchema);