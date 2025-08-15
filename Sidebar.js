import React from 'react';
import { Drawer, Box, Typography, Slider, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import MapIcon from '@mui/icons-material/Map';
import InsightsIcon from '@mui/icons-material/Insights'; // New icon for Historical Risk Analyzer
import DashboardIcon from '@mui/icons-material/Dashboard';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'; // New icon for Volunteer Register
import LiveHelpIcon from '@mui/icons-material/LiveHelp'; // Import for Help icon
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'; // Import for Alerts icon
import ChatIcon from '@mui/icons-material/Chat'; // NEW: Import icon for Chatbot
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk'; // NEW: Import icon for Alert & Help Request System

export default function Sidebar({ filters, setFilters }) {
  const location = useLocation();

  const handleSliderChange = (e, newValue) => {
    setFilters({ ...filters, severityRange: newValue });
  };

  const navItems = [
    { text: 'Homepage', icon: <HomeIcon />, path: '/' },
    { text: 'Severity Heatmap', icon: <MapIcon />, path: '/heatmap' }, // Changed text for clarity
    { text: 'Historical Risk Analyzer', icon: <InsightsIcon />, path: '/historical-risk' }, // Updated
    { text: 'Admin Dashboard', icon: <DashboardIcon />, path: '/dashboard' }, // Updated text
    { text: 'Volunteer Register', icon: <VolunteerActivismIcon />, path: '/register-volunteer' }, // New link
    { text: 'Alerts & Incidents', icon: <NotificationsActiveIcon />, path: '/alerts' }, // New Alerts link
    { text: 'Help & Support', icon: <LiveHelpIcon />, path: '/help' }, // New Help link
    { text: 'Chatbot', icon: <ChatIcon />, path: '/chatbot' }, // NEW: Chatbot Link added here
    // New item for the Multichannel Alert and Help Request System
    { text: 'Alert & Help Request', icon: <PhoneInTalkIcon />, path: '/alert-system' },
  ];

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: 260,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 260,
          boxSizing: 'border-box',
          backgroundColor: '#2A4C6B', // Darker blue from homepage.css primary-dark
          color: '#E0E7FF', // Light text color
          boxShadow: '8px 0 15px rgba(0,0,0,0.3)',
          padding: '20px 10px', // Adjusted padding
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}> {/* Use MUI sx for flex */}
        {/* App Title/Logo in Sidebar */}
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 4, mt: 1, textAlign: 'center', color: 'white' }}>
          DisasterSphere
        </Typography>

        {/* Navigation Links */}
        <List>
          {navItems.map((item) => (
            <ListItem
              button
              key={item.text}
              component={Link}
              to={item.path}
              sx={{
                borderRadius: '8px',
                mb: 1,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)', // Subtle hover effect
                },
                backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: location.pathname === item.path ? 'white' : '#E0E7FF', // Active link color
                fontWeight: location.pathname === item.path ? 600 : 400,
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.2)' }} />

        {/* Filters Section */}
        <Box sx={{ p: '0 10px' }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'white', mb: 2 }}>
            Filters
          </Typography>

          <Typography variant="body2" sx={{ fontWeight: 500, color: '#E0E7FF', mb: 1 }}>
            Severity Range
          </Typography>
          <Slider
            value={filters.severityRange}
            onChange={handleSliderChange}
            valueLabelDisplay="auto"
            min={0}
            max={10}
            step={1}
            sx={{
              mt: 1,
              color: '#9FA8DA', // Slider track color
              '& .MuiSlider-thumb': {
                backgroundColor: 'white', // Slider thumb color
              },
              '& .MuiSlider-track': {
                backgroundColor: '#9FA8DA', // Slider track color
              },
              '& .MuiSlider-rail': {
                backgroundColor: 'rgba(255,255,255,0.3)', // Slider rail color
              },
            }}
          />

          <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.2)' }} />

          <Typography variant="caption" color="textSecondary" sx={{ color: '#B0C4DE' }}>
            More filters like disaster type can be added here.
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}
