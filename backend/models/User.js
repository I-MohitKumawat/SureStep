const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: ['patient', 'caregiver']
  },
  caregiverId: {
    type: String,
    default: null
  }
});

module.exports = mongoose.model('User', userSchema);