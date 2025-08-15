import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, Button, TextField, Select, MenuItem, InputLabel, FormControl, Box, Typography, IconButton, Alert } from '@mui/material';
import { AlertTriangle, MapPin, MessageCircle, Clipboard, ArrowUpCircle, XCircle } from 'lucide-react';

const AlertSystem = () => {
  const [alerts, setAlerts] = useState([]);
  const [newAlert, setNewAlert] = useState({ type: '', severity: '', description: '', location: '' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // This is a dummy user ID for local mode.
  const user = { uid: 'local-user-session-id' }; 

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAlert({ ...newAlert, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newAlertWithId = {
      ...newAlert,
      id: Date.now(),
      timestamp: new Date(),
      userId: user.uid,
      severity: parseInt(newAlert.severity, 10), // Ensure severity is an integer for sorting
    };

    const updatedAlerts = [...alerts, newAlertWithId].sort((a, b) => b.severity - a.severity);
    setAlerts(updatedAlerts);
    setShowSuccessModal(true);
    setNewAlert({ type: '', severity: '', description: '', location: '' });
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccessMessage('User ID copied to clipboard!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  };

  const alertTypes = ['Flood', 'Earthquake', 'Tsunami', 'Wildfire', 'Volcanic Eruption', 'Other'];
  const severities = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const getSeverityColor = (severity) => {
    if (severity >= 8) return 'border-red-500';
    if (severity >= 5) return 'border-yellow-500';
    return 'border-green-500';
  };

  return (
    <Box sx={{ minHeight: '100vh', padding: '2rem', background: 'linear-gradient(to bottom right, #e0f2fe, #bfdbfe)', fontFamily: 'Inter, sans-serif', color: '#1f2937' }}>
      <style>{`
        /*
         * This file provides custom styling for the AlertSystem React component.
         * It's designed to be modern, clean, and unique.
         */
        
        /* ================== General Layout & Typography ================== */
        .alert-system-wrapper {
            max-width: 1280px;
            margin: auto;
        }
        
        .main-title {
            font-size: 2.25rem;
            font-weight: 800;
            color: #3730a3;
            margin-bottom: 2rem;
            text-align: center;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        /* ================== Grid & Columns ================== */
        .alert-system-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 2rem;
        }
        
        @media (min-width: 1024px) {
            .alert-system-grid {
                grid-template-columns: 1fr 2fr;
            }
        }
        
        /* ================== Card & Section Styling ================== */
        .card-panel {
            background-color: #fff;
            padding: 2rem;
            border-radius: 1.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            transition: box-shadow 0.3s ease-in-out;
        }
        
        .card-panel:hover {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .card-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        /* ================== User ID Card ================== */
        .user-id-card {
            background-color: #dbeafe;
            padding: 1rem;
            border-radius: 0.75rem;
            border: 1px solid #bfdbfe;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .user-id-label {
            font-size: 0.875rem;
            font-weight: 700;
            color: #1e40af;
        }
        
        .user-id-text {
            font-family: 'Courier New', Courier, monospace;
            font-size: 0.875rem;
            color: #1d4ed8;
            word-break: break-all;
        }
        
        .copy-button {
            color: #3b82f6;
        }
        .copy-button:hover {
            color: #1d4ed8;
        }
        
        /* ================== Form Styling ================== */
        .alert-form {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
        }
        
        .submit-button {
            width: 100%;
            margin-top: 1rem;
            background-color: #4f46e5;
            color: #fff;
            transition: all 0.3s ease-in-out;
            transform: scale(1);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border-radius: 0.5rem;
            padding: 0.75rem 1.5rem;
        }
        
        .submit-button:hover {
            background-color: #4338ca;
            transform: scale(1.02);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        /* ================== Live Alerts Section ================== */
        .live-alerts-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .no-alerts-message {
            padding: 2rem;
            text-align: center;
            color: #6b7280;
            background-color: #f9fafb;
            border-radius: 0.75rem;
            border: 2px dashed #d1d5db;
        }
        
        .no-alerts-icon {
            margin: auto;
            margin-bottom: 1rem;
            color: #9ca3af;
        }
        
        .alert-card {
            padding: 1.5rem;
            border-radius: 0.75rem;
            background-color: #f9fafb;
            border-left-width: 0.25rem;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            transition: box-shadow 0.2s ease-in-out;
        }
        
        .alert-card:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .alert-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .alert-type {
            font-weight: 700;
            font-size: 1.125rem;
            color: #dc2626;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .severity-pill {
            background-color: #fee2e2;
            color: #b91c1c;
            font-size: 0.875rem;
            font-weight: 600;
            padding: 0.25rem 0.5rem;
            border-radius: 9999px; /* full rounded */
        }
        
        .alert-description {
            color: #374151;
            margin-top: 0.5rem;
        }
        
        .alert-card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.875rem;
            color: #6b7280;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
        }
        
        .location-info {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-weight: 500;
            color: #4b5563;
        }
        
        .timestamp {
            font-size: 0.75rem;
            color: #9ca3af;
        }
        
        /* ================== Severity Colors ================== */
        .border-red-500 { border-color: #ef4444; }
        .border-yellow-500 { border-color: #f59e0b; }
        .border-green-500 { border-color: #10b981; }
        
        /* ================== Modal Styling ================== */
        .modal-title {
            color: #4f46e5;
            font-weight: 700;
        }
        
        .modal-content-text {
            color: #4b5563;
        }
        
        .modal-button {
            margin-top: 1rem;
            background-color: #4f46e5;
            color: #fff;
            border-radius: 0.5rem;
        }
        
        .modal-button:hover {
            background-color: #4338ca;
        }
        
        /* ================== Material-UI Overrides for consistency ================== */
        .MuiInputBase-root,
        .MuiSelect-root,
        .MuiOutlinedInput-root {
            border-radius: 0.5rem !important;
        }
        
        .MuiAlert-root {
          border-radius: 0.5rem !important;
        }
        
        .MuiButton-containedPrimary {
          background-color: #4f46e5 !important;
        }
        .MuiButton-containedPrimary:hover {
          background-color: #4338ca !important;
        }
      `}</style>
      <div className="alert-system-wrapper">
        <Typography variant="h3" component="h1" className="main-title">
          Multichannel Alert System (Local Mode)
        </Typography>
        
        <Box className="alert-system-grid">
          
          <Box className="lg:col-span-1">
            <Box className="card-panel">
              <Typography variant="h5" component="h2" className="card-title">
                <ArrowUpCircle size={24} className="text-indigo-500" />
                Submit a New Alert
              </Typography>
              
              <Box className="user-id-card">
                <div>
                  <Typography variant="subtitle2" className="user-id-label">Your User ID:</Typography>
                  <Typography component="p" className="user-id-text">{user?.uid || 'Not available'}</Typography>
                </div>
                <IconButton onClick={() => copyToClipboard(user?.uid)} aria-label="copy user id" className="copy-button">
                  <Clipboard size={18} />
                </IconButton>
              </Box>

              {successMessage && (
                <Alert severity="success" className="mb-4">{successMessage}</Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} className="alert-form">
                <FormControl fullWidth required>
                  <InputLabel id="type-label">Alert Type</InputLabel>
                  <Select
                    labelId="type-label"
                    id="type"
                    name="type"
                    value={newAlert.type}
                    label="Alert Type"
                    onChange={handleInputChange}
                  >
                    {alertTypes.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth required>
                  <InputLabel id="severity-label">Severity (1-10)</InputLabel>
                  <Select
                    labelId="severity-label"
                    id="severity"
                    name="severity"
                    value={newAlert.severity}
                    label="Severity (1-10)"
                    onChange={handleInputChange}
                  >
                    {severities.map(severity => (
                      <MenuItem key={severity} value={severity}>{severity}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Location (e.g., City, Address)"
                  name="location"
                  value={newAlert.location}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        <MapPin size={20} className="text-gray-400" />
                      </Box>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Description of the situation"
                  name="description"
                  value={newAlert.description}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mt: 2, mr: 1, display: 'flex', alignItems: 'flex-start' }}>
                        <MessageCircle size={20} className="text-gray-400" />
                      </Box>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  className="submit-button"
                >
                  Submit Alert
                </Button>
              </Box>
            </Box>
          </Box>

          <Box className="lg:col-span-2">
            <Box className="card-panel">
              <Typography variant="h5" component="h2" className="card-title">
                <AlertTriangle size={24} className="text-red-500" />
                Live Alerts
              </Typography>
              {alerts.length === 0 ? (
                <Box className="no-alerts-message">
                  <XCircle size={48} className="no-alerts-icon" />
                  <Typography>No active alerts at this time.</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    (Alerts are not saved or shared in this local-only version.)
                  </Typography>
                </Box>
              ) : (
                <Box className="live-alerts-list">
                  {alerts.map((alert) => (
                    <Box key={alert.id} className={`alert-card ${getSeverityColor(alert.severity)}`}>
                      <Box className="alert-card-header">
                        <Typography component="span" className="alert-type">
                          <AlertTriangle size={20} /> {alert.type}
                        </Typography>
                        <span className="severity-pill">
                          Severity: {alert.severity}
                        </span>
                      </Box>
                      <Typography component="p" className="alert-description">{alert.description}</Typography>
                      <Box className="alert-card-footer">
                        <Box className="location-info">
                          <MapPin size={16} />
                          <span className="font-medium text-gray-600">{alert.location}</span>
                        </Box>
                        {alert.timestamp && (
                          <span className="timestamp">
                            {alert.timestamp.toLocaleString()}
                          </span>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </div>

      <Dialog open={showSuccessModal} onClose={handleCloseModal}>
        <DialogTitle className="modal-title">Alert Submitted Successfully!</DialogTitle>
        <DialogContent>
          <Typography component="p" className="modal-content-text">
            Your alert has been received. Thank you for your contribution.
          </Typography>
          <Button onClick={handleCloseModal} autoFocus variant="contained" className="modal-button">
            OK
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AlertSystem;
