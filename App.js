import React, { useState } from 'react';
import { CssBaseline, ThemeProvider, createTheme, Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import your components
import Homepage from './components/Homepage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import HeatmapMap from './components/HeatmapMap';
import AdminDashboard from './components/admin/AdminDashboard'; // Your main Admin Dashboard
import HistoricalRiskAnalyzer from './components/HistoricalRiskAnalyzer'; // Renamed from DisasterPredictor
import VolunteerRegistrationForm from './components/admin/VolunteerRegistrationForm'; // Corrected import path
import HelpPage from './components/HelpPage'; // Import the new HelpPage
import AlertsDashboard from './components/AlertsDashboard'; // Import the new AlertsDashboard
import Chatbot from './components/Chatbot'; // NEW: Import the Chatbot component
import AlertSystem from './pages/AlertSystem'; // <-- NEW: Import the Multichannel Alert System component

// --- NEW/UPDATED: A simple layout specifically for the Homepage ---
// This layout ensures the Homepage gets the theme but no Sidebar/Header.
function HomepageOnlyLayout({ children }) {
  const [darkMode, setDarkMode] = useState(false); // State for theme, can be managed globally if needed

  const theme = createTheme({
    palette: { mode: darkMode ? 'dark' : 'light' },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* This Box is just to apply the theme and baseline.
          It allows content to scroll if it overflows. */}
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' }}>
        {children}
      </Box>
    </ThemeProvider>
  );
}
// --- END HomepageOnlyLayout ---


// --- Existing MainLayout (for routes that need Sidebar and Header) ---
// This layout wraps components that should have the standard app layout.
function MainLayout({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [filters, setFilters] = useState({ severityRange: [0, 10] }); // Filters state for Sidebar

  const theme = createTheme({
    palette: { mode: darkMode ? 'dark' : 'light' },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}> {/* Main app container */}
        {/* The Sidebar component */}
        <Sidebar filters={filters} setFilters={setFilters} />
        {/* Main content area, takes remaining space, allows vertical scrolling */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* The Header component */}
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />
          {/* Content of the specific route, with some padding */}
          <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}> {/* Added p for padding */}
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
// --- END MainLayout ---


// Main app component with routing
export default function App() {
  return (
    <Router>
      <Routes>
        {/* Route for the Homepage: Uses HomepageOnlyLayout to exclude Sidebar/Header */}
        <Route path="/" element={<HomepageOnlyLayout><Homepage /></HomepageOnlyLayout>} />

        {/* NEW: Route for the Multichannel Alert System, also using HomepageOnlyLayout */}
        <Route path="/alert-system" element={<HomepageOnlyLayout><AlertSystem /></HomepageOnlyLayout>} />

        {/* Routes that should use the standard Sidebar and Header */}
        <Route path="/heatmap" element={<MainLayout><HeatmapMap /></MainLayout>} />
        {/* Updated route for Historical Risk Analyzer */}
        <Route path="/historical-risk" element={<MainLayout><HistoricalRiskAnalyzer /></MainLayout>} />
        {/* AdminDashboard is now the main dashboard route */}
        <Route path="/dashboard" element={<MainLayout><AdminDashboard /></MainLayout>} />
        {/* New route for Volunteer Registration Form */}
        <Route path="/register-volunteer" element={<MainLayout><VolunteerRegistrationForm /></MainLayout>} />
        {/* New route for Alerts & Incidents */}
        <Route path="/alerts" element={<MainLayout><AlertsDashboard /></MainLayout>} />
        {/* New route for Help & Support */}
        <Route path="/help" element={<MainLayout><HelpPage /></MainLayout>} />
        {/* NEW: Route for the Chatbot */}
        <Route path="/chatbot" element={<MainLayout><Chatbot /></MainLayout>} />

      </Routes>
    </Router>
  );
}
