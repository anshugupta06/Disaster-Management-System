// src/components/HeatmapMap.js

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon issues with Leaflet in React
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const HeatmapMap = () => {
  const [zones, setZones] = useState([]);
  const mapRef = useRef();

  useEffect(() => {
    fetch('http://localhost:5000/api/risk_zones')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log("Fetched Risk Zones Data (All Disasters):", data); // Debugging log
        setZones(data);
      })
      .catch(err => console.error('Failed to fetch risk zones:', err));
  }, []);

  // Define a clear order of color priority for disaster types
  const DISASTER_COLOR_PRIORITY = {
    'Flood': 'red',
    'Earthquake': 'orange',
    'Cyclone': 'purple',
    'Drought': 'brown',
    'Landslide': 'grey',
    'Heatwave': '#FF4500', // Darker orange/red
    'Cold Wave': '#ADD8E6', // Light blue
    'Tsunami': 'darkred',
    'Hailstorm': '#8B008B', // Dark magenta
    'Lightning': '#FFD700', // Gold
    'Avalanche': '#A0A0A0', // Medium grey
    'Forest Fire': '#8B4513', // Saddle brown
    'Cloudburst': '#4682B4', // Steel blue
    'Epidemic': '#800000', // Maroon
  };

  // Refined getColor function to map disaster types to specific colors based on priority
  const getColor = (disasterTypes) => {
    if (!disasterTypes || disasterTypes.length === 0 || (disasterTypes.length === 1 && disasterTypes[0] === 'Other')) {
      return 'green'; // No specific disaster detected
    }

    // Iterate through the priority list and return the color of the first matching disaster type
    for (const type of Object.keys(DISASTER_COLOR_PRIORITY)) {
      if (disasterTypes.includes(type)) {
        return DISASTER_COLOR_PRIORITY[type];
      }
    }

    return 'darkblue'; // Fallback for any other specific but un-prioritized disasters
  };

  // Custom hook to add legend to the map
  const Legend = () => {
    const map = useMap();

    useEffect(() => {
      const legend = L.control({ position: 'bottomright' });

      legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend');
        let legendHtml = `<h4>Disaster Status</h4>`;
        
        // Dynamically add legend items based on DISASTER_COLOR_PRIORITY
        for (const type in DISASTER_COLOR_PRIORITY) {
          legendHtml += `<div><i style="background-color: ${DISASTER_COLOR_PRIORITY[type]};"></i> ${type}</div>`;
        }
        legendHtml += `<div><i style="background-color: darkblue;"></i> Other Specific Disasters</div>`;
        legendHtml += `<div><i style="background-color: green;"></i> No Specific Disaster</div>`;

        div.innerHTML = legendHtml;
        return div;
      };

      legend.addTo(map);

      return () => {
        legend.remove();
      };
    }, [map]);

    return null;
  };

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <MapContainer
        center={[20.5937, 78.9629]} // Center of India
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
        }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {zones.map((zone, index) => (
          // Only plot if coordinates are valid
          zone.latitude && zone.longitude ? (
            <CircleMarker
              key={zone.location || index}
              center={[zone.latitude, zone.longitude]}
              pathOptions={{ color: getColor(zone.disaster_types) }}
              radius={8}
              fillOpacity={0.7}
            >
              <Popup>
                <strong>Location:</strong> {zone.location}<br />
                <strong>Detected Disasters:</strong>
                {zone.disaster_types && zone.disaster_types.length > 0 && !(zone.disaster_types.length === 1 && zone.disaster_types[0] === 'Other') ? (
                  <ul>
                    {zone.disaster_types.map((type, i) => (
                      <li key={i}>{type}</li>
                    ))}
                  </ul>
                ) : (
                  'None detected in historical data'
                )}
              </Popup>
            </CircleMarker>
          ) : null // Don't render marker if coords are null
        ))}
        <Legend />
      </MapContainer>
    </div>
  );
};

export default HeatmapMap;
