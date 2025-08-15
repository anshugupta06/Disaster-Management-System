import React, { useState, useEffect } from 'react';
import './HistoricalRiskAnalyzer.css';

const HistoricalRiskAnalyzer = () => {
  const [location, setLocation] = useState('');
  const [disasterType, setDisasterType] = useState('All');
  // New state for weather inputs
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [rainfall, setRainfall] = useState('');
  const [windspeed, setWindspeed] = useState('');

  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableLocations, setAvailableLocations] = useState([]);
  const [availableDisasterTypes, setAvailableDisasterTypes] = useState([]);

  const getRiskLevel = (totalEvents) => {
    if (totalEvents === 0) {
      return { level: 'Very Low', className: 'risk-very-low' };
    } else if (totalEvents <= 5) {
      return { level: 'Low', className: 'risk-low' };
    } else if (totalEvents <= 15) {
      return { level: 'Medium', className: 'risk-medium' };
    } else if (totalEvents <= 30) {
      return { level: 'High', className: 'risk-high' };
    } else {
      return { level: 'Very High', className: 'risk-very-high' };
    }
  };

  useEffect(() => {
    fetch('http://localhost:5000/api/heatmap-data')
      .then(res => res.json())
      .then(data => {
        const locations = [...new Set(data.map(item => item.location))];
        setAvailableLocations(locations.sort());
      })
      .catch(err => console.error('Error fetching locations:', err));

    const types = [
      'All', 'Flood', 'Earthquake', 'Cyclone', 'Drought', 'Landslide',
      'Heatwave', 'Cold Wave', 'Tsunami', 'Hailstorm', 'Lightning',
      'Avalanche', 'Forest Fire', 'Cloudburst', 'Epidemic'
    ].sort();
    setAvailableDisasterTypes(types);

  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRiskData(null);

    let url = `http://localhost:5000/api/historical-risk?`;
    if (location) {
      url += `location=${encodeURIComponent(location)}&`;
    }
    if (disasterType) {
      url += `disaster_type=${encodeURIComponent(disasterType)}&`;
    }
    // Add new weather parameters to the URL
    if (temperature) {
        url += `temperature=${encodeURIComponent(temperature)}&`;
    }
    if (humidity) {
        url += `humidity=${encodeURIComponent(humidity)}&`;
    }
    if (rainfall) {
        url += `rainfall=${encodeURIComponent(rainfall)}&`;
    }
    if (windspeed) {
        url += `windspeed=${encodeURIComponent(windspeed)}&`;
    }

    url = url.slice(0, -1);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRiskData(data);
      console.log("Historical Risk Data:", data);
    } catch (err) {
      setError(`Failed to fetch historical risk data: ${err.message}`);
      console.error('Historical risk fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentRisk = riskData ? getRiskLevel(riskData.total_historical_events_found) : null;

  return (
    <div className="risk-analyzer-container">
      <div className="risk-analyzer-card">
        <h1>📊 Historical Risk Analyzer</h1>
        <p>Analyze past disaster trends and vulnerabilities based on historical data.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="location">Location (City/State)</label>
            <select
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">All India</option>
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="disasterType">Disaster Type</label>
            <select
              id="disasterType"
              value={disasterType}
              onChange={(e) => setDisasterType(e.target.value)}
            >
              {availableDisasterTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* New Weather Input Fields */}
          <div className="form-group">
            <label htmlFor="temperature">Temperature (°C)</label>
            <input
              type="number"
              id="temperature"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="e.g., 30"
            />
          </div>
          <div className="form-group">
            <label htmlFor="humidity">Humidity (%)</label>
            <input
              type="number"
              id="humidity"
              value={humidity}
              onChange={(e) => setHumidity(e.target.value)}
              placeholder="e.g., 75"
            />
          </div>
          <div className="form-group">
            <label htmlFor="rainfall">Rainfall (mm)</label>
            <input
              type="number"
              id="rainfall"
              value={rainfall}
              onChange={(e) => setRainfall(e.target.value)}
              placeholder="e.g., 150"
            />
          </div>
          <div className="form-group">
            <label htmlFor="windspeed">Wind Speed (km/h)</label>
            <input
              type="number"
              id="windspeed"
              value={windspeed}
              onChange={(e) => setWindspeed(e.target.value)}
              placeholder="e.g., 40"
            />
          </div>

          <button type="submit" className="analyze-button" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Historical Risk'}
          </button>
        </form>

        {error && <div className="message-box error-message">{error}</div>}

        {riskData && (
          <div className="results-section">
            <h2>Analysis for {riskData.query_location} - {riskData.query_disaster_type}</h2>
            
            <div className={`risk-level-display ${currentRisk.className}`}>
              <strong>Historical Risk Level:</strong> {currentRisk.level}
            </div>

            {/* Display the new suggested disaster based on weather input */}
            {riskData.suggested_disaster_based_on_weather_input && (
                <p className="weather-suggestion">
                    <strong>Weather-based Suggestion:</strong> {riskData.suggested_disaster_based_on_weather_input}
                </p>
            )}

            <p><strong>Total Historical Events Found:</strong> {riskData.total_historical_events_found}</p>
            {riskData.average_events_per_year !== undefined && (
                <p><strong>Average Events per Year:</strong> {riskData.average_events_per_year}</p>
            )}

            {Object.keys(riskData.details_by_type).length > 0 && (
              <div>
                <h3>Events by Specific Type:</h3>
                <ul>
                  {Object.entries(riskData.details_by_type).map(([type, count]) => (
                    <li key={type}><strong>{type}:</strong> {count} events</li>
                  ))}
                </ul>
              </div>
            )}
            {riskData.total_historical_events_found === 0 && (
              <p>No historical events found for the selected criteria.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricalRiskAnalyzer;
