import React, { useState } from 'react';

export default function CaregiverForm({ userId }) {
  const [form, setForm] = useState({
    education: '',
    experienceYears: '',
    specialization: '',
    availability: '',
    expectedSalary: '',
    linkedinUrl: ''
  });

  const handleSubmit = async () => {
    await fetch('http://localhost:5000/api/caregiver/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        ...form,
        specialization: [form.specialization]
      })
    });

    alert("Profile Created");
  };

  return (
    <div>
      <h2>Caregiver Profile</h2>

      <input placeholder="Education"
        onChange={e => setForm({...form, education: e.target.value})} />

      <input placeholder="Experience Years"
        onChange={e => setForm({...form, experienceYears: e.target.value})} />

      <input placeholder="Specialization"
        onChange={e => setForm({...form, specialization: e.target.value})} />

      <input placeholder="Availability"
        onChange={e => setForm({...form, availability: e.target.value})} />

      <input placeholder="Expected Salary"
        onChange={e => setForm({...form, expectedSalary: e.target.value})} />

      <input placeholder="LinkedIn URL"
        onChange={e => setForm({...form, linkedinUrl: e.target.value})} />

      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}