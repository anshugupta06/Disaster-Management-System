import React, { useEffect, useState } from 'react';

export const LocationSummary = () => {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/location-summary")
      .then(res => res.json())
      .then(data => setLocations(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold text-purple-600 mb-4">📍 Location Summary</h2>
      <table className="min-w-full table-auto border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-purple-100">
            <th className="p-2 border">Location</th>
            <th className="p-2 border">Severity</th>
            <th className="p-2 border">Volunteers</th>
            <th className="p-2 border">Resources</th>
            <th className="p-2 border">Assignments</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((loc, idx) => (
            <tr key={idx} className="hover:bg-purple-50">
              <td className="border p-2">{loc.location}</td>
              <td className="border p-2">{loc.severity.toFixed(2)}</td>
              <td className="border p-2">{loc.volunteers_count}</td>
              <td className="border p-2">{loc.resources_count}</td>
              <td className="border p-2">{loc.assignments_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
