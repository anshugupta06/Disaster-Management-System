// src/components/MainLayout.js
import React, { useState } from 'react'; // Import useState for local state (darkMode, filters)
import Box from '@mui/material/Box';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'; // Import ThemeProvider and createTheme
import Sidebar from './Sidebar';
import Header from './Header';
import { useLocation } from 'react-router-dom'; // Import useLocation

const MainLayout = ({ children }) => {
  // State for dark mode and filters, managed locally within MainLayout
  // This state will be passed down to Header and Sidebar
  const [darkMode, setDarkMode] = useState(false);
  const [filters, setFilters] = useState({ severityRange: [0, 10] });
  const location = useLocation(); // Get the current location

  // Create Material-UI theme based on darkMode state
  const theme = createTheme({
    palette: { mode: darkMode ? 'dark' : 'light' },
    typography: {
      fontFamily: 'Poppins, sans-serif', // Ensure Poppins is used across MUI components
    },
  });

  return (
    // ThemeProvider and CssBaseline ensure Material-UI styling is applied
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Main container for the layout: flexbox, full viewport height */}
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Sidebar component, now receiving filters and setFilters */}
        <Sidebar filters={filters} setFilters={setFilters} />
        {/* Right-hand content area: takes remaining space, is a flex column */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Conditionally render Header only if not on the homepage */}
          {location.pathname !== '/' && <Header darkMode={darkMode} setDarkMode={setDarkMode} />}
          {/* Main content area for children components, with padding and scrollability */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}> {/* Increased padding to p:3 for more space */}
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default MainLayout;
