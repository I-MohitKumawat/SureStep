import React, { useEffect, useState } from 'react';

export default function PatientRequests({ patientId }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/request/patient/${patientId}`)
      .then(res => res.json())
      .then(data => setRequests(data));
  }, [patientId]);

  const respond = async (id, status) => {
    await fetch('http://localhost:5000/api/request/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: id, status })
    });

    setRequests(prev => prev.filter(r => r._id !== id));
  };

  return (
    <div>
      <h2>Caregiver Requests</h2>

      {requests.map(r => (
        <div key={r._id}>
          <p>Caregiver ID: {r.caregiverId}</p>

          <button onClick={() => respond(r._id, 'approved')}>
            Accept
          </button>

          <button onClick={() => respond(r._id, 'rejected')}>
            Reject
          </button>
        </div>
      ))}
    </div>
  );
}