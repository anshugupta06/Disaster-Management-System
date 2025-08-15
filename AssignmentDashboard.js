import React, { useEffect, useState } from 'react';

export const AssignmentDashboard = () => {
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/assignments")
      .then(res => res.json())
      .then(data => setAssignments(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold text-green-700 mb-4">✅ Assignments</h2>
      <ul className="space-y-2 max-h-64 overflow-auto">
        {assignments.map(a => (
          <li key={a.id} className="p-3 rounded bg-green-100">
            <p><strong>Zone:</strong> {a.zone}</p>
            <p><strong>Volunteer ID:</strong> {a.volunteer_id}</p>
            <p><strong>Resource ID:</strong> {a.resource_id}</p>
            <p><strong>Time:</strong> {new Date(a.assigned_at).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};
