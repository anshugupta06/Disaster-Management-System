import React, { useEffect, useState } from 'react';

export const VolunteerDashboard = () => {
  const [volunteers, setVolunteers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/volunteers")
      .then(res => res.json())
      .then(data => setVolunteers(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold text-orange-600 mb-4">🧑‍🤝‍🧑 Volunteers</h2>
      <ul className="space-y-2 max-h-64 overflow-auto">
        {volunteers.map(v => (
          <li key={v.id} className="p-3 rounded bg-orange-100">
            <p><strong>Name:</strong> {v.name}</p>
            <p><strong>Contact:</strong> {v.contact}</p>
            <p><strong>Location:</strong> {v.location}</p>
            <p><strong>Assigned:</strong> {v.assigned_zone || "Not assigned"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};
