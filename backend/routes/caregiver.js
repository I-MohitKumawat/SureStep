const express = require('express');
const router = express.Router();
const CaregiverProfile = require('../models/CaregiverProfile');

// CREATE CAREGIVER PROFILE
router.post('/register', async (req, res) => {
  try {
    const caregiver = new CaregiverProfile(req.body);
    await caregiver.save();

    res.json({ message: "Caregiver profile created", caregiver });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SEARCH CAREGIVERS
router.get('/search', async (req, res) => {
  try {
    const { experience, specialization } = req.query;

    const caregivers = await CaregiverProfile.find({
      experienceYears: { $gte: Number(experience || 0) },
      specialization: specialization ? { $in: [specialization] } : { $exists: true }
    });

    res.json(caregivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;