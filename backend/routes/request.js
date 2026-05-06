const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const User = require('../models/User');

// SEND REQUEST
router.post('/send', async (req, res) => {
  try {
    const { caregiverId, patientId } = req.body;

    const request = new Request({ caregiverId, patientId });
    await request.save();

    res.json({ message: "Request sent", request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET PATIENT REQUESTS
router.get('/patient/:patientId', async (req, res) => {
  try {
    const requests = await Request.find({
      patientId: req.params.patientId,
      status: 'pending'
    });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RESPOND TO REQUEST
router.post('/respond', async (req, res) => {
  try {
    const { requestId, status } = req.body;

    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = status;
    await request.save();

    // LINK caregiver if approved
    if (status === 'approved') {
      await User.findByIdAndUpdate(request.patientId, {
        caregiverId: request.caregiverId
      });
    }

    res.json({ message: "Request updated", request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;