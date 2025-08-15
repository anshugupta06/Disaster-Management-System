import React, { useState } from 'react';
import { Box, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { AlertTriangle, Plus, XCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// In this local-only version, we are using a simple in-memory array for alerts.
// The map functionality has been removed because the necessary libraries are not
// available in this isolated environment.
const AlertsDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [reportForm, setReportForm] = useState({
    alert_type: '',
    severity: '',
    description: '',
    location: '',
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // A simple function to simulate a message box
  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000); // Hide after 5 seconds
  };

  const handleReportFormChange = (e) => {
    const { name, value } = e.target;
    setReportForm(prev => ({ ...prev, [name]: value }));
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    try {
      const newAlert = {
        alert_id: uuidv4(), // Use a unique ID for each alert
        alert_type: reportForm.alert_type,
        severity: parseInt(reportForm.severity, 10),
        description: reportForm.description,
        location: reportForm.location,
        issued_at: new Date().toISOString(),
      };
      
      // Update the local state with the new alert and sort by severity
      setAlerts(prevAlerts => [...prevAlerts, newAlert].sort((a, b) => b.severity - a.severity));

      // Clear the form
      setReportForm({ alert_type: '', severity: '', description: '', location: '' });

      // Show the success modal instead of a message box
      setShowSuccessModal(true);
    } catch (err) {
      showMessage(`An error occurred: ${err.message}`, 'error');
      console.error('Error reporting alert:', err);
    }
  };

  return (
    <Box className="alerts-dashboard-container">
      <style>{`
        /*
         * This CSS has been moved from the external file to be self-contained.
         * It styles the entire Alerts Dashboard component.
         */
        
        .alerts-dashboard-container {
            font-family: 'Inter', sans-serif;
            display: flex;
            flex-direction: column;
            gap: 2rem;
            padding: 2rem;
            background-color: #f3f4f6;
            min-height: 100vh;
        }

        .alerts-content-wrapper {
            display: grid;
            grid-template-columns: 1fr;
            gap: 2rem;
        }

        @media (min-width: 1024px) {
            .alerts-content-wrapper {
                grid-template-columns: 2fr 1fr;
            }
        }

        .alerts-list-card, .report-alert-card {
            background: #ffffff;
            border-radius: 1rem;
            padding: 2rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .alerts-list-card:hover, .report-alert-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        .alerts-list-card h1, .report-alert-card h2 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .alerts-list-card h1 {
          color: #dc2626;
        }

        .report-alert-card h2 {
          color: #1e40af;
        }

        .alerts-list-card p, .report-alert-card p {
            color: #6b7280;
            margin-bottom: 1.5rem;
        }

        .alerts-table-container {
            overflow-x: auto;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
        }

        .alerts-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
            text-align: left;
        }

        .alerts-table th, .alerts-table td {
            padding: 1rem;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .alerts-table th {
            font-weight: 600;
            color: #4b5563;
            background-color: #f9fafb;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .alerts-table tbody tr:last-child td {
            border-bottom: none;
        }
        
        .alerts-table tbody tr:hover {
            background-color: #f3f4f6;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .form-group label {
            display: block;
            font-weight: 600;
            color: #4b5563;
            margin-bottom: 0.5rem;
        }
        
        .report-alert-card .form-group input,
        .report-alert-card .form-group select,
        .report-alert-card .form-group textarea {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            font-size: 1rem;
            color: #1f2937;
            background-color: #f9fafb;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .report-alert-card .form-group input:focus,
        .report-alert-card .form-group select:focus,
        .report-alert-card .form-group textarea:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .report-button {
            width: 100%;
            padding: 0.75rem;
            font-size: 1rem;
            font-weight: 700;
            color: #ffffff;
            background-color: #3b82f6;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: background-color 0.3s ease, transform 0.2s ease;
        }

        .report-button:hover {
            background-color: #2563eb;
            transform: translateY(-2px);
        }

        .message-box {
            padding: 1rem;
            border-radius: 0.5rem;
            margin-top: 1rem;
            font-weight: 500;
        }

        .message-box.success {
            background-color: #d1fae5;
            color: #065f46;
        }

        .message-box.error {
            background-color: #fee2e2;
            color: #991b1b;
        }

        .no-alerts-message {
            text-align: center;
            padding: 2rem;
            color: #6b7280;
            background: #f9fafb;
            border-radius: 0.75rem;
            border: 2px dashed #d1d5db;
        }

        .no-alerts-icon {
            margin-bottom: 1rem;
            color: #9ca3af;
        }

        .alerts-map-container {
            height: 400px;
            background-color: #e5e7eb;
            border-radius: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            color: #9ca3af;
            text-align: center;
            padding: 1rem;
            margin-top: 2rem;
        }
      `}</style>
      <div className="alerts-content-wrapper">
        <div className="alerts-list-card">
          <h1>
            <AlertTriangle size={24} className="text-red-500" />
            Active Disaster Alerts
          </h1>
          <p>View and manage current disaster alerts across regions.</p>
          {alerts.length === 0 ? (
            <div className="no-alerts-message">
              <XCircle size={48} className="no-alerts-icon" />
              <Typography variant="body1">No active alerts found.</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                (Alerts are not saved or shared in this local-only version.)
              </Typography>
            </div>
          ) : (
            <div className="alerts-table-container">
              <table className="alerts-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Location</th>
                    <th>Description</th>
                    <th>Issued At</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map(alert => (
                    <tr key={alert.alert_id}>
                      <td>{alert.alert_type}</td>
                      <td>{alert.severity}</td>
                      <td>{alert.location || 'N/A'}</td>
                      <td>{alert.description}</td>
                      <td>{new Date(alert.issued_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="report-alert-card">
          <h2>
            <Plus size={24} className="text-blue-600" />
            Report New Incident
          </h2>
          <form onSubmit={handleReportSubmit}>
            <FormControl fullWidth margin="normal" className="form-group">
              <InputLabel id="alert_type-label">Alert Type</InputLabel>
              <Select
                labelId="alert_type-label"
                id="alert_type"
                name="alert_type"
                value={reportForm.alert_type}
                onChange={handleReportFormChange}
                required
                label="Alert Type"
              >
                <MenuItem value="">Select Type</MenuItem>
                <MenuItem value="Flood">Flood</MenuItem>
                <MenuItem value="Earthquake">Earthquake</MenuItem>
                <MenuItem value="Cyclone">Cyclone</MenuItem>
                <MenuItem value="Drought">Drought</MenuItem>
                <MenuItem value="Landslide">Landslide</MenuItem>
                <MenuItem value="Heatwave">Heatwave</MenuItem>
                <MenuItem value="Cold Wave">Cold Wave</MenuItem>
                <MenuItem value="Tsunami">Tsunami</MenuItem>
                <MenuItem value="Hailstorm">Hailstorm</MenuItem>
                <MenuItem value="Lightning">Lightning</MenuItem>
                <MenuItem value="Avalanche">Avalanche</MenuItem>
                <MenuItem value="Forest Fire">Forest Fire</MenuItem>
                <MenuItem value="Cloudburst">Cloudburst</MenuItem>
                <MenuItem value="Epidemic">Epidemic</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal" className="form-group">
              <InputLabel id="severity-label">Severity (1-10)</InputLabel>
              <Select
                labelId="severity-label"
                id="severity"
                name="severity"
                value={reportForm.severity}
                onChange={handleReportFormChange}
                required
                label="Severity (1-10)"
              >
                {[...Array(10)].map((_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Location (City/State)"
              name="location"
              value={reportForm.location}
              onChange={handleReportFormChange}
              fullWidth
              margin="normal"
              placeholder="e.g., Mumbai, Delhi"
              required
            />
            <TextField
              label="Description"
              name="description"
              value={reportForm.description}
              onChange={handleReportFormChange}
              fullWidth
              margin="normal"
              multiline
              rows={3}
              placeholder="Brief description of the incident..."
              required
            />
            <Button type="submit" variant="contained" className="report-button">
              Report Alert
            </Button>
          </form>
          {message.text && (
            <div className={`message-box ${message.type === 'success' ? 'success' : 'error'}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
      
      <div className="alerts-map-container">
        <Typography variant="h5">Map functionality is not available in this local version.</Typography>
      </div>

      <Dialog open={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
        <DialogTitle>Alert Reported Successfully!</DialogTitle>
        <DialogContent>
          Your alert has been received and added to the local list.
          <Button onClick={() => setShowSuccessModal(false)} sx={{ mt: 2 }} variant="contained" fullWidth>
            OK
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AlertsDashboard;
