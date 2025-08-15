import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';
import { Link } from 'react-router-dom'; // Import Link for navigation

export default function Header() {
  return (
    // AppBar with a subtle background and shadow, consistent with the app's theme
    <AppBar position="static" sx={{ backgroundColor: '#1E293B', boxShadow: 'none', zIndex: 10 }}>
      <Toolbar className="flex justify-between items-center px-4 py-3">
        {/* Application Title - Clickable to go to homepage */}
        <Link to="/" className="text-white no-underline">
          <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 600, letterSpacing: '0.05em' }}>
            🌍 Disaster Management Dashboard
          </Typography>
        </Link>

        {/* Navigation Links (Optional: Add more links here if needed in the header) */}
        <div className="flex items-center space-x-4">
          {/* Example: You can add user profile, logout, or other global actions here */}
          {/* <Link to="/profile" className="text-white text-sm hover:text-blue-300 transition-colors duration-200">Profile</Link> */}
          {/* <button className="text-white text-sm hover:text-blue-300 transition-colors duration-200">Logout</button> */}
        </div>
      </Toolbar>
    </AppBar>
  );
}
