const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  caregiverId: String,
  patientId: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
});

module.exports = mongoose.model('Request', requestSchema);